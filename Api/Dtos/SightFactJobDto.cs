using Api.Models;

namespace Api.Dtos;



public class SightFactJobDto
{
    public Guid Id { get; set; }
    public Guid SightId { get; set; }
    public required string Status { get; set; }
    public SightFactContentDto? Result { get; set; }
    public string? Feedback { get; set; }
    public string? ErrorMessage { get; set; }
    public bool Saved { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public static SightFactJobDto FromEntity(SightFactJob job, SightFactContentDto? result) => new()
    {
        Id = job.Id,
        SightId = job.SightId,
        Status = job.Status.ToString(),
        Result = result,
        Feedback = job.Feedback,
        ErrorMessage = job.ErrorMessage,
        Saved = job.SavedAt.HasValue,
        CreatedAt = job.CreatedAt,
        CompletedAt = job.CompletedAt
    };
}

public class CreateSightFactJobRequestDto
{
    public string? Feedback { get; set; }
    public Guid? PreviousJobId { get; set; }
}
