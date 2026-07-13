using Api.Dtos;
using Api.Extensions;
using Api.Interfaces;
using Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;



namespace Api.Controllers;



public class SightCommentsController(ISightCommentService sightCommentService, IUserService userService) : BaseAppController
{
    [AllowAnonymous]
    [HttpGet("~/api/v1/sights/{sightId:guid}/comments")]
    public async Task<ActionResult<List<SightCommentDto>>> GetComments(Guid sightId)
    {
        return await sightCommentService.GetCommentsAsync(sightId);
    }

    [AllowAnonymous]
    [HttpGet("~/api/v1/comments/latest")]
    public async Task<ActionResult<List<SightCommentDto>>> GetLatestComments([FromQuery] int count = 6)
    {
        return await sightCommentService.GetLatestCommentsAsync(count);
    }

    [HttpPost("~/api/v1/sights/{sightId:guid}/comments")]
    public async Task<ActionResult<SightCommentDto>> CreateComment(Guid sightId, [FromForm] string text, IFormFile? image)
    {
        var userId = await GetCurrentUserIdAsync();
        var comment = await sightCommentService.CreateCommentAsync(sightId, userId, text, image);
        return CreatedAtAction(nameof(GetComments), new { sightId }, comment);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpDelete("~/api/v1/sights/{sightId:guid}/comments/{commentId:guid}")]
    public async Task<IActionResult> DeleteComment(Guid sightId, Guid commentId)
    {
        await sightCommentService.DeleteCommentAsync(sightId, commentId);
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
