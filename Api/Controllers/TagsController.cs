using Api.Dtos;
using Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Api.Models;



namespace Api.Controllers;



public class TagsController(ITagService tagService) : BaseAppController
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<List<TagDto>>> GetTags()
    {
        return await tagService.GetTagsAsync();
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TagDto>> GetTag(Guid id)
    {
        return await tagService.GetTagAsync(id);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpPost]
    public async Task<ActionResult<TagDto>> CreateTag(TagRequestDto request)
    {
        var tag = await tagService.CreateTagAsync(request.Name);
        return CreatedAtAction(nameof(GetTag), new { id = tag.Id }, tag);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TagDto>> UpdateTag(Guid id, TagRequestDto request)
    {
        return await tagService.UpdateTagAsync(id, request.Name);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTag(Guid id)
    {
        await tagService.DeleteTagAsync(id);
        return NoContent();
    }
}
