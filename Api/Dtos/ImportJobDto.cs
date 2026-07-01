using Api.Models;



namespace Api.Dtos;



public class ImportJobDto
{
    public Guid Id { get; set; }
    public required string Status { get; set; }
    public int TotalCount { get; set; }
    public int ProcessedCount { get; set; }
    public int SucceededCount { get; set; }
    public int FailedCount { get; set; }
    public int SkippedCount { get; set; }
    public bool AbortRequested { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<ImportJobItemDto> Items { get; set; } = [];

    public static ImportJobDto FromEntity(ImportJob job) => new()
    {
        Id = job.Id,
        Status = job.Status.ToString(),
        TotalCount = job.TotalCount,
        ProcessedCount = job.ProcessedCount,
        SucceededCount = job.SucceededCount,
        FailedCount = job.FailedCount,
        SkippedCount = job.SkippedCount,
        AbortRequested = job.AbortRequested,
        CreatedAt = job.CreatedAt,
        CompletedAt = job.CompletedAt,
        Items = job.Items.Select(ImportJobItemDto.FromEntity).ToList()
    };
}
