using Api.Dtos;



namespace Api.Interfaces;



public interface ISightService
{
    Task<SightDto> CreateSightAsync(SightRequestDto request);
    Task<PagedResultDto<SightDto>> GetSightsAsync(int page, int pageSize);
    Task<SightDto> GetSightAsync(Guid id);
    Task<SightDto> UpdateSightAsync(Guid id, SightRequestDto request);
    Task DeleteSightAsync(Guid id);
    Task DeleteAllSightsAsync();
}
