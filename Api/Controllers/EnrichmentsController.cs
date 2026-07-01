using Api.Dtos;
using Api.Interfaces;
using Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;



namespace Api.Controllers;



public class EnrichmentsController(IImportService importService) : BaseAppController
{
    [Authorize(Roles = Roles.Admin)]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = 500_000_000)] // 500 MB ceiling for large enrichment zips
    [HttpPost("import")]
    public async Task<ActionResult<StartImportResponseDto>> StartImport(IFormFile file)
    {
        var result = await importService.StartImportAsync(file);
        return Ok(result);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpGet("import/latest")]
    public async Task<ActionResult<ImportJobDto>> GetLatestJob()
    {
        var job = await importService.GetLatestJobAsync();
        if (job is null) return NoContent();
        return Ok(job);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpGet("import/{jobId:guid}")]
    public async Task<ActionResult<ImportJobDto>> GetJob(Guid jobId)
    {
        return Ok(await importService.GetJobAsync(jobId));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost("import/{jobId:guid}/abort")]
    public async Task<IActionResult> AbortJob(Guid jobId)
    {
        await importService.AbortJobAsync(jobId);
        return NoContent();
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("import")]
    public async Task<IActionResult> DeleteAllJobs()
    {
        await importService.DeleteAllJobsAsync();
        return NoContent();
    }
}
