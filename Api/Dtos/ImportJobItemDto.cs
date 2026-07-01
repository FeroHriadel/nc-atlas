using Api.Models;



namespace Api.Dtos;



public class ImportJobItemDto
{
    public Guid Id { get; set; }
    public required string SightTitle { get; set; }
    public string? SightDescription { get; set; }
    public required string Status { get; set; }
    public string? ErrorMessage { get; set; }
    public Guid? SightId { get; set; }
    public string? CategoryName { get; set; }
    public string? Tags { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Image350Url { get; set; }

    public static ImportJobItemDto FromEntity(ImportJobItem item) => new()
    {
        Id = item.Id,
        SightTitle = item.SightTitle,
        SightDescription = item.SightDescription,
        Status = item.Status.ToString(),
        ErrorMessage = item.ErrorMessage,
        SightId = item.SightId,
        CategoryName = item.CategoryName,
        Tags = item.Tags,
        Latitude = item.Latitude,
        Longitude = item.Longitude,
        Image350Url = item.Image350Url
    };
}
