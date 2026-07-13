namespace Api.Models;



public class GalleryImage
{
    public Guid Id { get; set; }
    public Guid SightId { get; set; }
    public Sight Sight { get; set; } = null!;
    public required string ImageUrl { get; set; }
    public required string ThumbnailUrl { get; set; }
    public required string Comment { get; set; }
    public Guid UploadedByUserId { get; set; }
    public User UploadedByUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
