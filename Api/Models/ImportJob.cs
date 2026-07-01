namespace Api.Models;



public class ImportJob
{
    public Guid Id { get; set; }
    public ImportJobStatus Status { get; set; }
    public int TotalCount { get; set; }
    public int ProcessedCount { get; set; }
    public int SucceededCount { get; set; }
    public int FailedCount { get; set; }
    public int SkippedCount { get; set; }
    public bool AbortRequested { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<ImportJobItem> Items { get; set; } = [];
}

public enum ImportJobStatus { Pending, Processing, Completed, Aborted }
