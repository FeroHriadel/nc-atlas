using Api.Dtos;
using Api.Interfaces;
using Microsoft.AspNetCore.Mvc;



namespace Api.Controllers;



public class TagsController(ITagService tagService) : BaseAppController
{
    [HttpGet]
    public async Task<ActionResult<List<TagDto>>> GetTags()
    {
        return await tagService.GetTagsAsync();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TagDto>> GetTag(Guid id)
    {
        return await tagService.GetTagAsync(id);
    }

    [HttpPost]
    public async Task<ActionResult<TagDto>> CreateTag(TagRequestDto request)
    {
        var tag = await tagService.CreateTagAsync(request.Name);
        return CreatedAtAction(nameof(GetTag), new { id = tag.Id }, tag);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TagDto>> UpdateTag(Guid id, TagRequestDto request)
    {
        return await tagService.UpdateTagAsync(id, request.Name);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTag(Guid id)
    {
        await tagService.DeleteTagAsync(id);
        return NoContent();
    }
}
