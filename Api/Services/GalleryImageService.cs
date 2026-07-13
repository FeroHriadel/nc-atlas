using Api.Data;
using Api.Dtos;
using Api.Interfaces;
using Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;



public class GalleryImageService(AppDbContext db, IBlobService blobService, IImageProcessingService imageProcessingService)
    : IGalleryImageService
{
    private const int MaxImagesPerSight = 10;
    private const int FullWidth = 1024;
    private const int ThumbnailWidth = 350;

    public async Task<List<GalleryImageDto>> GetGalleryImagesAsync(Guid sightId)
    {
        return await db.GalleryImages
            .Where(g => g.SightId == sightId)
            .Include(g => g.UploadedByUser)
            .Include(g => g.Sight)
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => GalleryImageDto.FromEntity(g))
            .ToListAsync();
    }

    public async Task<List<GalleryImageDto>> GetLatestGalleryImagesAsync(int count)
    {
        return await db.GalleryImages
            .Include(g => g.UploadedByUser)
            .Include(g => g.Sight)
            .OrderByDescending(g => g.CreatedAt)
            .Take(count)
            .Select(g => GalleryImageDto.FromEntity(g))
            .ToListAsync();
    }

    public async Task<GalleryImageDto> UploadImageAsync(Guid sightId, Guid userId, IFormFile file, string? comment)
    {
        var sightExists = await db.Sights.AnyAsync(s => s.Id == sightId);
        if (!sightExists)
            throw new ErrorRes("Sight not found", StatusCodes.Status404NotFound);

        if (string.IsNullOrWhiteSpace(comment))
            throw new ErrorRes("A comment is required", StatusCodes.Status400BadRequest);

        if (file.Length == 0)
            throw new ErrorRes("No file was uploaded", StatusCodes.Status400BadRequest);

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            throw new ErrorRes("Only image files are allowed", StatusCodes.Status400BadRequest);

        var existingCount = await db.GalleryImages.CountAsync(g => g.SightId == sightId);
        if (existingCount >= MaxImagesPerSight)
            throw new ErrorRes("Max number of images reached. Please remove some images first.", StatusCodes.Status400BadRequest);

        var uploader = await db.Users.FindAsync(userId)
            ?? throw new ErrorRes("User not found", StatusCodes.Status404NotFound);

        byte[] sourceBytes;
        using (var ms = new MemoryStream())
        {
            await file.CopyToAsync(ms);
            sourceBytes = ms.ToArray();
        }

        var fullBytes = imageProcessingService.ResizeToWidth(sourceBytes, FullWidth);
        var thumbnailBytes = imageProcessingService.ResizeToWidth(sourceBytes, ThumbnailWidth);

        var blobBase = $"gallery/{sightId}/{Guid.NewGuid()}";
        string imageUrl, thumbnailUrl;
        using (var ms = new MemoryStream(fullBytes))
            imageUrl = await blobService.UploadAsync(ms, $"{blobBase}-1024.jpg", "image/jpeg");
        using (var ms = new MemoryStream(thumbnailBytes))
            thumbnailUrl = await blobService.UploadAsync(ms, $"{blobBase}-350.jpg", "image/jpeg");

        var image = new GalleryImage
        {
            SightId = sightId,
            ImageUrl = imageUrl,
            ThumbnailUrl = thumbnailUrl,
            Comment = comment.Trim(),
            UploadedByUserId = userId,
            UploadedByUser = uploader,
            CreatedAt = DateTime.UtcNow
        };

        db.GalleryImages.Add(image);
        await db.SaveChangesAsync();

        return GalleryImageDto.FromEntity(image);
    }

    public async Task DeleteImageAsync(Guid sightId, Guid imageId)
    {
        var image = await db.GalleryImages.FirstOrDefaultAsync(g => g.Id == imageId && g.SightId == sightId)
            ?? throw new ErrorRes("Gallery image not found", StatusCodes.Status404NotFound);

        await blobService.DeleteAsync(image.ImageUrl);
        await blobService.DeleteAsync(image.ThumbnailUrl);

        db.GalleryImages.Remove(image);
        await db.SaveChangesAsync();
    }
}
