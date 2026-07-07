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
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? County { get; set; }
    public decimal RatingAvg { get; set; }
    public int RatingCount { get; set; }
    public required string Source { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<TagDto> Tags { get; set; } = [];
    public List<SightImageDto> Images { get; set; } = [];

    // Caller must .Include(s => s.Category), .Include(s => s.Tags) and .Include(s => s.Images) —
    // CategoryName, Tags and Images read the navigation properties.
    public static SightDto FromEntity(Sight sight) => new()
    {
        Id = sight.Id,
        Title = sight.Title,
        Description = sight.Description,
        CategoryId = sight.CategoryId,
        CategoryName = sight.Category.Name,
        Latitude = sight.Location.Y,
        Longitude = sight.Location.X,
        Country = sight.Country,
        State = sight.State,
        County = sight.County,
        RatingAvg = sight.RatingAvg,
        RatingCount = sight.RatingCount,
        Source = sight.Source,
        CreatedAt = sight.CreatedAt,
        Tags = sight.Tags.Select(TagDto.FromEntity).ToList(),
        Images = sight.Images.OrderBy(i => i.SortOrder).Select(SightImageDto.FromEntity).ToList()
    };
}
