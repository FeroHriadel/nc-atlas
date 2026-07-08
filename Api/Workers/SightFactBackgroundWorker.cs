using System.Text.Json;
using System.Threading.Channels;
using Api.Data;
using Api.Dtos;
using Api.Interfaces;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Workers;



public class SightFactBackgroundWorker(
    Channel<SightFactGenerationRequest> channel,
    IServiceScopeFactory scopeFactory,
    ILogger<SightFactBackgroundWorker> logger
) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RecoverStuckJobsAsync();

        await foreach (var request in channel.Reader.ReadAllAsync(stoppingToken))
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var claudeService = scope.ServiceProvider.GetRequiredService<IClaudeService>();

            await ProcessJobAsync(request.JobId, db, claudeService, stoppingToken);
        }
    }

    // On startup: mark any jobs left incomplete by a previous server run as Failed
    private async Task RecoverStuckJobsAsync()
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var stuckJobs = await db.SightFactJobs
            .Where(j => j.Status == SightFactJobStatus.Pending || j.Status == SightFactJobStatus.Processing)
            .ToListAsync();

        foreach (var job in stuckJobs)
        {
            job.Status = SightFactJobStatus.Failed;
            job.ErrorMessage = "Server restarted during processing";
            job.CompletedAt = DateTime.UtcNow;
        }

        if (stuckJobs.Count > 0)
            await db.SaveChangesAsync();
    }

    private async Task ProcessJobAsync(
        Guid jobId,
        AppDbContext db,
        IClaudeService claudeService,
        CancellationToken stoppingToken)
    {
        var job = await db.SightFactJobs
            .Include(j => j.Sight).ThenInclude(s => s.Category)
            .Include(j => j.Sight).ThenInclude(s => s.Tags)
            .FirstOrDefaultAsync(j => j.Id == jobId, stoppingToken);

        if (job is null)
        {
            logger.LogError("Sight fact job {JobId} not found in DB", jobId);
            return;
        }

        job.Status = SightFactJobStatus.Processing;
        await db.SaveChangesAsync(stoppingToken);

        try
        {
            SightFactContentDto? previousResult = null;
            if (job.PreviousJobId.HasValue)
            {
                var previousResultJson = await db.SightFactJobs
                    .Where(j => j.Id == job.PreviousJobId.Value)
                    .Select(j => j.Result)
                    .FirstOrDefaultAsync(stoppingToken);

                if (previousResultJson is not null)
                    previousResult = JsonSerializer.Deserialize<SightFactContentDto>(previousResultJson, SightFactJsonOptions.Options);
            }

            var promptData = new SightFactPromptData(
                job.Sight.Title,
                job.Sight.Description,
                job.Sight.Category.Name,
                job.Sight.Tags.Select(t => t.Name).ToList(),
                job.Sight.Country,
                job.Sight.State,
                job.Sight.County);

            var result = await claudeService.GenerateSightFactsAsync(promptData, previousResult, job.Feedback, stoppingToken);

            if (result.Error is not null)
            {
                job.Status = SightFactJobStatus.Failed;
                job.ErrorMessage = result.Error;
            }
            else
            {
                job.Status = SightFactJobStatus.Succeeded;
                job.Result = JsonSerializer.Serialize(result.Content, SightFactJsonOptions.Options);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to generate facts for sight fact job {JobId}", jobId);
            job.Status = SightFactJobStatus.Failed;
            job.ErrorMessage = ex.Message;
        }

        job.CompletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(stoppingToken);
    }
}
