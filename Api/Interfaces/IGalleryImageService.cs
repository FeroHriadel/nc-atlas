using Api.Dtos;
using Microsoft.AspNetCore.Http;

namespace Api.Interfaces;



public interface IGalleryImageService
{
    Task<List<GalleryImageDto>> GetGalleryImagesAsync(Guid sightId);
    Task<List<GalleryImageDto>> GetLatestGalleryImagesAsync(int count);
    Task<GalleryImageDto> UploadImageAsync(Guid sightId, Guid userId, IFormFile file, string? comment);
    Task DeleteImageAsync(Guid sightId, Guid imageId);
}
