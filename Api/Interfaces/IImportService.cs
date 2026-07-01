using Api.Dtos;



namespace Api.Interfaces;



public interface IImportService
{
    Task<StartImportResponseDto> StartImportAsync(IFormFile zipFile);
    Task<ImportJobDto?> GetLatestJobAsync();
    Task<ImportJobDto> GetJobAsync(Guid jobId);
    Task AbortJobAsync(Guid jobId);
    Task DeleteAllJobsAsync();
}
