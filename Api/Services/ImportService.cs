using System.IO.Compression;
using System.Text.Json;
using System.Threading.Channels;
using Api.Data;
using Api.Dtos;
using Api.Interfaces;
using Api.Models;
using Api.Workers;
using Microsoft.EntityFrameworkCore;



namespace Api.Services;



public class ImportService(AppDbContext db, Channel<ImportPayload> channel) : IImportService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public async Task<StartImportResponseDto> StartImportAsync(IFormFile zipFile)
    {
        // 1. Reject if an import is already running
        var hasActiveJob = await db.ImportJobs
            .AnyAsync(j => j.Status == ImportJobStatus.Pending || j.Status == ImportJobStatus.Processing);
        if (hasActiveJob)
            throw new ErrorRes("An import is already in progress", StatusCodes.Status409Conflict);

        // 2. Open and parse zip
        await using var zipStream = zipFile.OpenReadStream();
        using var zip = new ZipArchive(zipStream, ZipArchiveMode.Read);

        var jsonEntry = zip.Entries.FirstOrDefault(e => e.FullName.EndsWith(".json"))
            ?? throw new ErrorRes("No JSON file found in the zip", StatusCodes.Status400BadRequest);

        List<SightJsonEntry> sights;
        using (var reader = new StreamReader(jsonEntry.Open()))
        {
            var json = await reader.ReadToEndAsync();
            sights = JsonSerializer.Deserialize<List<SightJsonEntry>>(json, JsonOptions)
                ?? throw new ErrorRes("JSON file in zip is invalid", StatusCodes.Status400BadRequest);
        }

        if (sights.Count == 0)
            throw new ErrorRes("JSON file contains no sights", StatusCodes.Status400BadRequest);

        // 3. Validate that every sight has both images in the zip
        var zipImageNames = zip.Entries
            .Select(e => Path.GetFileName(e.FullName))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var sight in sights)
        {
            var slug = GetSlug(sight.Image350S3Key);
            if (!zipImageNames.Contains($"{slug}-image350.png"))
                throw new ErrorRes($"Missing 350px image for '{sight.Title}'", StatusCodes.Status400BadRequest);
            if (!zipImageNames.Contains($"{slug}-image1024.png"))
                throw new ErrorRes($"Missing 1024px image for '{sight.Title}'", StatusCodes.Status400BadRequest);
        }

        // 4. Find which titles already exist in the DB
        var allTitles = sights.Select(s => s.Title).ToList();
        var existingTitles = (await db.Sights
            .Where(s => allTitles.Contains(s.Title))
            .Select(s => s.Title)
            .ToListAsync())
            .ToHashSet();

        var toProcess = sights.Where(s => !existingTitles.Contains(s.Title)).ToList();

        if (toProcess.Count == 0)
            throw new ErrorRes("All sights in this zip already exist in the database", StatusCodes.Status409Conflict);

        // 5. Extract image bytes for the sights we will process
        var imagesByTitle = new Dictionary<string, SightImages>();
        foreach (var sight in toProcess)
        {
            var slug = GetSlug(sight.Image350S3Key);

            byte[] bytes350;
            using (var ms = new MemoryStream())
            {
                using var s = zip.Entries.First(e => Path.GetFileName(e.FullName) == $"{slug}-image350.png").Open();
                await s.CopyToAsync(ms);
                bytes350 = ms.ToArray();
            }

            byte[] bytes1024;
            using (var ms = new MemoryStream())
            {
                using var s = zip.Entries.First(e => Path.GetFileName(e.FullName) == $"{slug}-image1024.png").Open();
                await s.CopyToAsync(ms);
                bytes1024 = ms.ToArray();
            }

            imagesByTitle[sight.Title] = new SightImages(bytes350, bytes1024);
        }

        // 6. Persist the job and its items
        var job = new ImportJob
        {
            Id = Guid.NewGuid(),
            Status = ImportJobStatus.Pending,
            TotalCount = toProcess.Count,
            SkippedCount = existingTitles.Count,
            CreatedAt = DateTime.UtcNow,
            Items = toProcess.Select(s => new ImportJobItem
            {
                Id = Guid.NewGuid(),
                SightTitle = s.Title,
                SightDescription = s.Description,
                Status = ImportJobItemStatus.Pending
            }).ToList()
        };

        db.ImportJobs.Add(job);
        await db.SaveChangesAsync();

        // 7. Hand off to the background worker
        await channel.Writer.WriteAsync(new ImportPayload(job.Id, toProcess, imagesByTitle));

        return new StartImportResponseDto
        {
            JobId = job.Id,
            TotalCount = toProcess.Count,
            SkippedCount = existingTitles.Count,
            Skipped = [.. existingTitles]
        };
    }

    public async Task<ImportJobDto?> GetLatestJobAsync()
    {
        var job = await db.ImportJobs
            .Include(j => j.Items)
            .OrderByDescending(j => j.CreatedAt)
            .FirstOrDefaultAsync();

        return job is null ? null : ImportJobDto.FromEntity(job);
    }

    public async Task<ImportJobDto> GetJobAsync(Guid jobId)
    {
        var job = await db.ImportJobs
            .Include(j => j.Items)
            .FirstOrDefaultAsync(j => j.Id == jobId)
            ?? throw new ErrorRes("Import job not found", StatusCodes.Status404NotFound);

        return ImportJobDto.FromEntity(job);
    }

    public async Task DeleteAllJobsAsync()
    {
        var jobs = await db.ImportJobs.ToListAsync();
        db.ImportJobs.RemoveRange(jobs);
        await db.SaveChangesAsync();
    }

    public async Task AbortJobAsync(Guid jobId)
    {
        var job = await db.ImportJobs.FindAsync(jobId)
            ?? throw new ErrorRes("Import job not found", StatusCodes.Status404NotFound);

        if (job.Status != ImportJobStatus.Pending && job.Status != ImportJobStatus.Processing)
            throw new ErrorRes("Job is not active", StatusCodes.Status400BadRequest);

        job.AbortRequested = true;
        await db.SaveChangesAsync();
    }

    // "enrichments/2026-06-18-javorniky-kysuce/kol-rovice/350.png" → "kol-rovice"
    private static string GetSlug(string s3Key) => s3Key.Split('/')[^2];
}
