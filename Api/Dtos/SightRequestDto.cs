namespace Api.Dtos;



public class SightRequestDto
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public int CategoryId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? County { get; set; }
    public required string Source { get; set; }
    public List<Guid> TagIds { get; set; } = [];
    public List<string> ImageUrls { get; set; } = [];
}
