using Api.Models;



namespace Api.Dtos;



public class SightImageDto
{
    public Guid Id { get; set; }
    public required string ImageUrl { get; set; }
    public int SortOrder { get; set; }

    public static SightImageDto FromEntity(SightImage image) => new()
    {
        Id = image.Id,
        ImageUrl = image.ImageUrl,
        SortOrder = image.SortOrder
    };
}
