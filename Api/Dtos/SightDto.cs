using Api.Models;



namespace Api.Dtos;



public class SightDto
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public int CategoryId { get; set; }
    public required string CategoryName { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public decimal RatingAvg { get; set; }
    public int RatingCount { get; set; }
    public required string Source { get; set; }
    public DateTime CreatedAt { get; set; }

    // Caller must .Include(s => s.Category) — CategoryName reads the navigation property.
    public static SightDto FromEntity(Sight sight) => new()
    {
        Id = sight.Id,
        Title = sight.Title,
        Description = sight.Description,
        CategoryId = sight.CategoryId,
        CategoryName = sight.Category.Name,
        Latitude = sight.Location.Y,
        Longitude = sight.Location.X,
        RatingAvg = sight.RatingAvg,
        RatingCount = sight.RatingCount,
        Source = sight.Source,
        CreatedAt = sight.CreatedAt
    };
}
