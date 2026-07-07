using NetTopologySuite.Geometries;



namespace Api.Models;



public class Sight
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public required Point Location { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? County { get; set; }
    public decimal RatingAvg { get; set; }
    public int RatingCount { get; set; }
    public required string Source { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<Tag> Tags { get; set; } = [];
    public List<SightImage> Images { get; set; } = [];
}
