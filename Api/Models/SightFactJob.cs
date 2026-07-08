namespace Api.Models;



public class SightFactJob
{
    public Guid Id { get; set; }
    public Guid SightId { get; set; }
    public Sight Sight { get; set; } = null!;
    public SightFactJobStatus Status { get; set; }
    public Guid? PreviousJobId { get; set; }
    public string? Feedback { get; set; }
    public string? Result { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? SavedAt { get; set; }
}

public enum SightFactJobStatus { Pending, Processing, Succeeded, Failed }
