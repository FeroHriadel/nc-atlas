using Api.Dtos;
using Api.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Api.Models;
using Microsoft.AspNetCore.Authorization;



namespace Api.Controllers;



public class SightsController(ISightService sightService, IWebHostEnvironment env) : BaseAppController
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<SightDto>>> GetSights(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] Guid? tagId = null,
        [FromQuery] string sortDirection = "desc")
    {
        return await sightService.GetSightsAsync(page, pageSize, search, categoryId, tagId, sortDirection);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SightDto>> GetSight(Guid id)
    {
        return await sightService.GetSightAsync(id);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpPost]
    public async Task<ActionResult<SightDto>> CreateSight(SightRequestDto request)
    {
        var sight = await sightService.CreateSightAsync(request);
        return CreatedAtAction(nameof(GetSight), new { id = sight.Id }, sight);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SightDto>> UpdateSight(Guid id, SightRequestDto request)
    {
        return await sightService.UpdateSightAsync(id, request);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSight(Guid id)
    {
        await sightService.DeleteSightAsync(id);
        return NoContent();
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpDelete("all")]
    public async Task<IActionResult> DeleteAllSights()
    {
        if (!env.IsDevelopment())
            throw new ErrorRes("Not available outside development", StatusCodes.Status403Forbidden);

        await sightService.DeleteAllSightsAsync();
        return NoContent();
    }
}
