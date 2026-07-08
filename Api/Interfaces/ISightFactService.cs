using Api.Dtos;

namespace Api.Interfaces;



public interface ISightFactService
{
    Task<SightFactContentDto?> GetFactsAsync(Guid sightId);
    Task<SightFactJobDto?> GetLatestJobAsync(Guid sightId);
    Task<SightFactJobDto> GetJobAsync(Guid sightId, Guid jobId);
    Task<SightFactJobDto> CreateJobAsync(Guid sightId, string? feedback, Guid? previousJobId);
    Task<SightFactContentDto> SaveFromJobAsync(Guid sightId, Guid jobId);
}
