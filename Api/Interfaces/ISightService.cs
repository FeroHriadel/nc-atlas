using Api.Dtos;



namespace Api.Interfaces;



public interface ISightService
{
    Task<SightDto> CreateSightAsync(SightRequestDto request);
    Task<List<SightDto>> GetSightsAsync();
    Task<SightDto> GetSightAsync(Guid id);
    Task<SightDto> UpdateSightAsync(Guid id, SightRequestDto request);
    Task DeleteSightAsync(Guid id);
    Task DeleteAllSightsAsync();
}
