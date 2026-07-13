using Api.Models;



namespace Api.Dtos;



public class GalleryImageDto
{
    public Guid Id { get; set; }
    public required string ImageUrl { get; set; }
    public required string ThumbnailUrl { get; set; }
    public required string Comment { get; set; }
    public required string UploadedByUsername { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid SightId { get; set; }
    public required string SightTitle { get; set; }

    // Caller must .Include(g => g.UploadedByUser) and .Include(g => g.Sight) —
    // UploadedByUsername/SightTitle read those navigations.
    public static GalleryImageDto FromEntity(GalleryImage image) => new()
    {
        Id = image.Id,
        ImageUrl = image.ImageUrl,
        ThumbnailUrl = image.ThumbnailUrl,
        Comment = image.Comment,
        UploadedByUsername = image.UploadedByUser.Username,
        CreatedAt = image.CreatedAt,
        SightId = image.SightId,
        SightTitle = image.Sight.Title
    };
}
