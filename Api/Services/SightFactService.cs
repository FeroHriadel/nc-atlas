using System.Text.Json;
using System.Threading.Channels;
using Api.Data;
using Api.Dtos;
using Api.Interfaces;
using Api.Models;
using Api.Workers;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;



public class SightFactService(AppDbContext db, Channel<SightFactGenerationRequest> channel) : ISightFactService
{
    public async Task<SightFactContentDto?> GetFactsAsync(Guid sightId)
    {
        var fact = await db.SightFacts.FirstOrDefaultAsync(f => f.SightId == sightId);
        return fact is null ? null : Deserialize(fact.Content);
    }

    public async Task<SightFactJobDto?> GetLatestJobAsync(Guid sightId)
    {
        var job = await db.SightFactJobs
            .Where(j => j.SightId == sightId)
            .OrderByDescending(j => j.CreatedAt)
            .FirstOrDefaultAsync();

        return job is null ? null : SightFactJobDto.FromEntity(job, Deserialize(job.Result));
    }

    public async Task<SightFactJobDto> GetJobAsync(Guid sightId, Guid jobId)
    {
        var job = await FindJobAsync(sightId, jobId);
        return SightFactJobDto.FromEntity(job, Deserialize(job.Result));
    }

    public async Task<SightFactJobDto> CreateJobAsync(Guid sightId, string? feedback, Guid? previousJobId)
    {
        var sightExists = await db.Sights.AnyAsync(s => s.Id == sightId);
        if (!sightExists)
            throw new ErrorRes("Sight not found", StatusCodes.Status404NotFound);

        // avoid spinning up a second job while one is already in flight for this sight
        var inFlightJob = await db.SightFactJobs
            .Where(j => j.SightId == sightId && (j.Status == SightFactJobStatus.Pending || j.Status == SightFactJobStatus.Processing))
            .OrderByDescending(j => j.CreatedAt)
            .FirstOrDefaultAsync();

        if (inFlightJob is not null)
            return SightFactJobDto.FromEntity(inFlightJob, null);

        if (previousJobId.HasValue)
        {
            await FindJobAsync(sightId, previousJobId.Value); // throws 404 if it doesn't belong to this sight
        }
        else
        {
            // no explicit previous job (e.g. editing already-saved facts) — chain off the job that produced them
            previousJobId = await db.SightFacts
                .Where(f => f.SightId == sightId)
                .Select(f => f.SourceJobId)
                .FirstOrDefaultAsync();
        }

        // an edit attempt was abandoned before being saved — don't let unsaved drafts pile up.
        // Jobs still referenced by another job's PreviousJobId chain (or a sight's SourceJobId)
        // must be skipped, or deleting them would violate the FK constraint that protects that chain.
        var referencedJobIds = await db.SightFactJobs
            .Where(j => j.SightId == sightId && j.PreviousJobId != null)
            .Select(j => j.PreviousJobId!.Value)
            .Union(db.SightFacts.Where(f => f.SightId == sightId && f.SourceJobId != null).Select(f => f.SourceJobId!.Value))
            .ToListAsync();

        var staleDrafts = await db.SightFactJobs
            .Where(j => j.SightId == sightId
                && j.SavedAt == null
                && (j.Status == SightFactJobStatus.Succeeded || j.Status == SightFactJobStatus.Failed)
                && j.Id != previousJobId
                && !referencedJobIds.Contains(j.Id))
            .ToListAsync();

        if (staleDrafts.Count > 0)
            db.SightFactJobs.RemoveRange(staleDrafts);

        var job = new SightFactJob
        {
            Id = Guid.NewGuid(),
            SightId = sightId,
            Status = SightFactJobStatus.Pending,
            PreviousJobId = previousJobId,
            Feedback = feedback,
            CreatedAt = DateTime.UtcNow
        };

        db.SightFactJobs.Add(job);
        await db.SaveChangesAsync();

        await channel.Writer.WriteAsync(new SightFactGenerationRequest(job.Id));

        return SightFactJobDto.FromEntity(job, null);
    }

    public async Task<SightFactContentDto> SaveFromJobAsync(Guid sightId, Guid jobId)
    {
        var job = await FindJobAsync(sightId, jobId);

        if (job.Status != SightFactJobStatus.Succeeded || job.Result is null)
            throw new ErrorRes("This job has no result to save", StatusCodes.Status400BadRequest);

        var existing = await db.SightFacts.FirstOrDefaultAsync(f => f.SightId == sightId);
        var now = DateTime.UtcNow;

        if (existing is null)
        {
            db.SightFacts.Add(new SightFact
            {
                Id = Guid.NewGuid(),
                SightId = sightId,
                Content = job.Result,
                SourceJobId = job.Id,
                CreatedAt = now,
                UpdatedAt = now
            });
        }
        else
        {
            existing.Content = job.Result;
            existing.SourceJobId = job.Id;
            existing.UpdatedAt = now;
        }

        job.SavedAt = now;
        await db.SaveChangesAsync();

        return Deserialize(job.Result)!;
    }

    public async Task DiscardJobAsync(Guid sightId, Guid jobId)
    {
        var job = await FindJobAsync(sightId, jobId);

        if (job.SavedAt.HasValue)
            throw new ErrorRes("This job has already been saved and cannot be discarded", StatusCodes.Status400BadRequest);

        var isReferenced = await db.SightFactJobs.AnyAsync(j => j.PreviousJobId == jobId)
            || await db.SightFacts.AnyAsync(f => f.SourceJobId == jobId);

        if (isReferenced)
            throw new ErrorRes("This job is referenced by a later revision and cannot be discarded", StatusCodes.Status409Conflict);

        db.SightFactJobs.Remove(job);
        await db.SaveChangesAsync();
    }

    public async Task DeleteFactsAsync(Guid sightId)
    {
        var existing = await db.SightFacts.FirstOrDefaultAsync(f => f.SightId == sightId)
            ?? throw new ErrorRes("No sight facts found for this sight", StatusCodes.Status404NotFound);

        db.SightFacts.Remove(existing);
        await db.SaveChangesAsync();
    }

    private async Task<SightFactJob> FindJobAsync(Guid sightId, Guid jobId)
    {
        return await db.SightFactJobs.FirstOrDefaultAsync(j => j.Id == jobId && j.SightId == sightId)
            ?? throw new ErrorRes("Sight fact job not found", StatusCodes.Status404NotFound);
    }

    private static SightFactContentDto? Deserialize(string? json) =>
        json is null ? null : JsonSerializer.Deserialize<SightFactContentDto>(json, SightFactJsonOptions.Options);
}
