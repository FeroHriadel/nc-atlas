using Api.Dtos;
using Api.Interfaces;
using Microsoft.AspNetCore.Mvc;



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

    [HttpPost]
    public async Task<ActionResult<SightDto>> CreateSight(SightRequestDto request)
    {
        var sight = await sightService.CreateSightAsync(request);
        return CreatedAtAction(nameof(GetSight), new { id = sight.Id }, sight);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SightDto>> UpdateSight(Guid id, SightRequestDto request)
    {
        return await sightService.UpdateSightAsync(id, request);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSight(Guid id)
    {
        await sightService.DeleteSightAsync(id);
        return NoContent();
    }
}
