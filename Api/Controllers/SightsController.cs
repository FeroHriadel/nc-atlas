using Api.Dtos;
using Api.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Api.Models;
using Microsoft.AspNetCore.Authorization;



namespace Api.Controllers;



public class SightsController(ISightService sightService) : BaseAppController
{
    [HttpGet]
    public async Task<ActionResult<List<SightDto>>> GetSights()
    {
        return await sightService.GetSightsAsync();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SightDto>> GetSight(Guid id)
    {
        return await sightService.GetSightAsync(id);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost]
    public async Task<ActionResult<SightDto>> CreateSight(SightRequestDto request)
    {
        var sight = await sightService.CreateSightAsync(request);
        return CreatedAtAction(nameof(GetSight), new { id = sight.Id }, sight);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SightDto>> UpdateSight(Guid id, SightRequestDto request)
    {
        return await sightService.UpdateSightAsync(id, request);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSight(Guid id)
    {
        await sightService.DeleteSightAsync(id);
        return NoContent();
    }
}
