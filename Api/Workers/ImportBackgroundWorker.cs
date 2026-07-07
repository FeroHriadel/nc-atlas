using System.Threading.Channels;
using Api.Data;
using Api.Interfaces;
using Api.Models;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;



namespace Api.Workers;



public class ImportBackgroundWorker(
    Channel<ImportPayload> channel,
    IServiceScopeFactory scopeFactory,
    ILogger<ImportBackgroundWorker> logger
) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RecoverStuckJobsAsync();

        await foreach (var payload in channel.Reader.ReadAllAsync(stoppingToken))
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var blobService = scope.ServiceProvider.GetRequiredService<IBlobService>();

            await ProcessJobAsync(payload, db, blobService, stoppingToken);
        }
    }

    // On startup: mark any jobs left incomplete by a previous server run as Aborted
    private async Task RecoverStuckJobsAsync()
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var stuckJobs = await db.ImportJobs
            .Include(j => j.Items)
            .Where(j => j.Status == ImportJobStatus.Pending || j.Status == ImportJobStatus.Processing)
            .ToListAsync();

        foreach (var job in stuckJobs)
        {
            job.Status = ImportJobStatus.Aborted;
            job.CompletedAt = DateTime.UtcNow;
            foreach (var item in job.Items.Where(i =>
                i.Status == ImportJobItemStatus.Pending ||
                i.Status == ImportJobItemStatus.Processing))
            {
                item.Status = ImportJobItemStatus.Failed;
                item.ErrorMessage = "Server restarted during processing";
            }
        }

        if (stuckJobs.Count > 0)
            await db.SaveChangesAsync();
    }

    private async Task ProcessJobAsync(
        ImportPayload payload,
        AppDbContext db,
        IBlobService blobService,
        CancellationToken stoppingToken)
    {
        var job = await db.ImportJobs
            .Include(j => j.Items)
            .FirstOrDefaultAsync(j => j.Id == payload.JobId, stoppingToken);

        if (job is null)
        {
            logger.LogError("Import job {JobId} not found in DB", payload.JobId);
            return;
        }

        job.Status = ImportJobStatus.Processing;
        await db.SaveChangesAsync(stoppingToken);

        foreach (var item in job.Items)
        {
            // Re-read AbortRequested from DB before each sight — the abort endpoint
            // writes this flag via a separate DbContext, so we need a fresh query.
            var abortRequested = await db.ImportJobs
                .Where(j => j.Id == job.Id)
                .Select(j => j.AbortRequested)
                .FirstAsync(stoppingToken);

            if (abortRequested || stoppingToken.IsCancellationRequested)
            {
                foreach (var remaining in job.Items.Where(i => i.Status == ImportJobItemStatus.Pending))
                    remaining.Status = ImportJobItemStatus.Skipped;

                job.Status = ImportJobStatus.Aborted;
                job.CompletedAt = DateTime.UtcNow;
                await db.SaveChangesAsync(stoppingToken);
                return;
            }

            try
            {
                item.Status = ImportJobItemStatus.Processing;
                await db.SaveChangesAsync(stoppingToken);

                var sightData = payload.Sights.First(s => s.Title == item.SightTitle);
                var images = payload.ImagesByTitle[item.SightTitle];
                var slug = sightData.Image350S3Key.Split('/')[^2];

                // Find or create category
                var category = await db.Categories.FirstOrDefaultAsync(c => c.Name == sightData.Category, stoppingToken);
                if (category is null)
                {
                    category = new Category { Name = sightData.Category };
                    db.Categories.Add(category);
                    await db.SaveChangesAsync(stoppingToken); // needed so category.Id is populated
                }

                // Find or create tags
                var tags = new List<Tag>();
                foreach (var tagName in sightData.Tags)
                {
                    var tag = await db.Tags.FirstOrDefaultAsync(t => t.Name == tagName, stoppingToken);
                    if (tag is null)
                    {
                        tag = new Tag { Name = tagName };
                        db.Tags.Add(tag);
                        await db.SaveChangesAsync(stoppingToken);
                    }
                    tags.Add(tag);
                }

                // Upload images to blob storage
                var blobBase = $"enrichments/{payload.JobId}/{slug}";

                string url350, url1024;
                using (var ms = new MemoryStream(images.Image350))
                    url350 = await blobService.UploadAsync(ms, $"{blobBase}/350.png", "image/png");
                using (var ms = new MemoryStream(images.Image1024))
                    url1024 = await blobService.UploadAsync(ms, $"{blobBase}/1024.png", "image/png");

                // Persist the sight
                var sight = new Sight
                {
                    Title = sightData.Title,
                    Description = sightData.Description,
                    CategoryId = category.Id,
                    Location = new Point(sightData.Location.Coordinates[1], sightData.Location.Coordinates[0]) { SRID = 4326 },
                    Country = sightData.Location.Country,
                    State = sightData.Location.State,
                    County = sightData.Location.County,
                    Source = "Atlas Extract",
                    CreatedAt = DateTime.UtcNow,
                    Tags = tags,
                    Images =
                    [
                        new SightImage { ImageUrl = url350, SortOrder = 0 },
                        new SightImage { ImageUrl = url1024, SortOrder = 1 }
                    ]
                };
                db.Sights.Add(sight);
                await db.SaveChangesAsync(stoppingToken);

                item.Status = ImportJobItemStatus.Succeeded;
                item.SightId = sight.Id;
                item.CategoryName = category.Name;
                item.Tags = string.Join(", ", sightData.Tags);
                item.Latitude = sightData.Location.Coordinates[0];
                item.Longitude = sightData.Location.Coordinates[1];
                item.Image350Url = url350;
                job.ProcessedCount++;
                job.SucceededCount++;
                await db.SaveChangesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to process sight '{Title}'", item.SightTitle);
                item.Status = ImportJobItemStatus.Failed;
                item.ErrorMessage = ex.Message;
                job.ProcessedCount++;
                job.FailedCount++;
                await db.SaveChangesAsync(stoppingToken);
            }
        }

        job.Status = ImportJobStatus.Completed;
        job.CompletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(stoppingToken);
    }
}
