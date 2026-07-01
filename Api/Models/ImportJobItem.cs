namespace Api.Models;



public class ImportJobItem
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public ImportJob Job { get; set; } = null!;
    public required string SightTitle { get; set; }
    public string? SightDescription { get; set; }
    public ImportJobItemStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public Guid? SightId { get; set; }
    public string? CategoryName { get; set; }
    public string? Tags { get; set; }       // comma-separated
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Image350Url { get; set; }
}

public enum ImportJobItemStatus { Pending, Processing, Succeeded, Failed, Skipped }
