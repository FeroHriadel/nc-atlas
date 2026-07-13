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

    // Caller must .Include(g => g.UploadedByUser) — UploadedByUsername reads that navigation.
    public static GalleryImageDto FromEntity(GalleryImage image) => new()
    {
        Id = image.Id,
        ImageUrl = image.ImageUrl,
        ThumbnailUrl = image.ThumbnailUrl,
        Comment = image.Comment,
        UploadedByUsername = image.UploadedByUser.Username,
        CreatedAt = image.CreatedAt
    };
}
