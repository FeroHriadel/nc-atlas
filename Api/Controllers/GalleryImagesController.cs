using Api.Dtos;
using Api.Extensions;
using Api.Interfaces;
using Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;



namespace Api.Controllers;



public class GalleryImagesController(IGalleryImageService galleryImageService, IUserService userService) : BaseAppController
{
    [AllowAnonymous]
    [HttpGet("~/api/v1/sights/{sightId:guid}/gallery")]
    public async Task<ActionResult<List<GalleryImageDto>>> GetGalleryImages(Guid sightId)
    {
        return await galleryImageService.GetGalleryImagesAsync(sightId);
    }

    [AllowAnonymous]
    [HttpGet("~/api/v1/gallery/latest")]
    public async Task<ActionResult<List<GalleryImageDto>>> GetLatestGalleryImages([FromQuery] int count = 6)
    {
        return await galleryImageService.GetLatestGalleryImagesAsync(count);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpPost("~/api/v1/sights/{sightId:guid}/gallery")]
    public async Task<ActionResult<GalleryImageDto>> UploadImage(Guid sightId, IFormFile file, [FromForm] string? comment)
    {
        var userId = await GetCurrentUserIdAsync();
        var image = await galleryImageService.UploadImageAsync(sightId, userId, file, comment);
        return CreatedAtAction(nameof(GetGalleryImages), new { sightId }, image);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpDelete("~/api/v1/sights/{sightId:guid}/gallery/{imageId:guid}")]
    public async Task<IActionResult> DeleteImage(Guid sightId, Guid imageId)
    {
        await galleryImageService.DeleteImageAsync(sightId, imageId);
        return NoContent();
    }

    private async Task<Guid> GetCurrentUserIdAsync()
    {
        var aadObjectId = User.GetAadObjectId()
            ?? throw new ErrorRes("Missing AAD object id claim", StatusCodes.Status401Unauthorized);

        var user = await userService.GetUserByAadObjectIdAsync(aadObjectId);
        return user.Id;
    }
}
