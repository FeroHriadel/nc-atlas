namespace Api.Models;



public class SightImage
{
    public Guid Id { get; set; }
    public Guid SightId { get; set; }
    public Sight Sight { get; set; } = null!;
    public required string ImageUrl { get; set; }
    public int SortOrder { get; set; }
}
