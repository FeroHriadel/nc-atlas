using Api.Data;
using Api.Dtos;
using Api.Interfaces;
using Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;



public class SightCommentService(AppDbContext db, IBlobService blobService, IImageProcessingService imageProcessingService)
    : ISightCommentService
{
    private const int MaxTextLength = 2000;
    private const int ImageWidth = 350;

    public async Task<List<SightCommentDto>> GetCommentsAsync(Guid sightId)
    {
        return await db.SightComments
            .Where(c => c.SightId == sightId)
            .Include(c => c.User)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => SightCommentDto.FromEntity(c))
            .ToListAsync();
    }

    public async Task<SightCommentDto> CreateCommentAsync(Guid sightId, Guid userId, string text, IFormFile? image)
    {
        var sightExists = await db.Sights.AnyAsync(s => s.Id == sightId);
        if (!sightExists)
            throw new ErrorRes("Sight not found", StatusCodes.Status404NotFound);

        var trimmedText = text?.Trim() ?? "";
        if (trimmedText.Length == 0)
            throw new ErrorRes("Comment cannot be empty", StatusCodes.Status400BadRequest);

        if (trimmedText.Length > MaxTextLength)
            throw new ErrorRes($"Comment is too long (max {MaxTextLength} characters)", StatusCodes.Status400BadRequest);

        var user = await db.Users.FindAsync(userId)
            ?? throw new ErrorRes("User not found", StatusCodes.Status404NotFound);

        string? imageUrl = null;
        if (image is not null && image.Length > 0)
        {
            if (!image.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                throw new ErrorRes("Only image files are allowed", StatusCodes.Status400BadRequest);

            byte[] sourceBytes;
            using (var ms = new MemoryStream())
            {
                await image.CopyToAsync(ms);
                sourceBytes = ms.ToArray();
            }

            var resizedBytes = imageProcessingService.ResizeToWidth(sourceBytes, ImageWidth);
            using var uploadStream = new MemoryStream(resizedBytes);
            imageUrl = await blobService.UploadAsync(uploadStream, $"comments/{sightId}/{Guid.NewGuid()}-350.jpg", "image/jpeg");
        }

        var comment = new SightComment
        {
            SightId = sightId,
            Text = trimmedText,
            ImageUrl = imageUrl,
            UserId = userId,
            User = user,
            CreatedAt = DateTime.UtcNow
        };

        db.SightComments.Add(comment);
        await db.SaveChangesAsync();

        return SightCommentDto.FromEntity(comment);
    }

    public async Task DeleteCommentAsync(Guid sightId, Guid commentId)
    {
        var comment = await db.SightComments.FirstOrDefaultAsync(c => c.Id == commentId && c.SightId == sightId)
            ?? throw new ErrorRes("Comment not found", StatusCodes.Status404NotFound);

        if (comment.ImageUrl is not null)
            await blobService.DeleteAsync(comment.ImageUrl);

        db.SightComments.Remove(comment);
        await db.SaveChangesAsync();
    }
}
