using Api.Dtos;
using Api.Interfaces;
using Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;



namespace Api.Controllers;



public class SightFactsController(ISightFactService sightFactService) : BaseAppController
{
    [AllowAnonymous]
    [HttpGet("~/api/v1/sights/{sightId:guid}/facts")]
    public async Task<ActionResult<SightFactContentDto>> GetFacts(Guid sightId)
    {
        var facts = await sightFactService.GetFactsAsync(sightId);
        return facts is null ? NotFound() : facts;
    }

    [AllowAnonymous]
    [HttpGet("~/api/v1/sights/{sightId:guid}/fact-jobs/latest")]
    public async Task<ActionResult<SightFactJobDto>> GetLatestJob(Guid sightId)
    {
        var job = await sightFactService.GetLatestJobAsync(sightId);
        return job is null ? NotFound() : job;
    }

    [AllowAnonymous]
    [HttpGet("~/api/v1/sights/{sightId:guid}/fact-jobs/{jobId:guid}")]
    public async Task<ActionResult<SightFactJobDto>> GetJob(Guid sightId, Guid jobId)
    {
        return await sightFactService.GetJobAsync(sightId, jobId);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpPost("~/api/v1/sights/{sightId:guid}/fact-jobs")]
    public async Task<ActionResult<SightFactJobDto>> CreateJob(Guid sightId, CreateSightFactJobRequestDto request)
    {
        var job = await sightFactService.CreateJobAsync(sightId, request.Feedback, request.PreviousJobId);
        return CreatedAtAction(nameof(GetJob), new { sightId, jobId = job.Id }, job);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpPost("~/api/v1/sights/{sightId:guid}/facts/from-job/{jobId:guid}")]
    public async Task<ActionResult<SightFactContentDto>> SaveFromJob(Guid sightId, Guid jobId)
    {
        return await sightFactService.SaveFromJobAsync(sightId, jobId);
    }
}
