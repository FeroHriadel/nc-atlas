using Api.Dtos;

namespace Api.Interfaces;



public interface ITripService
{
    Task<List<TripDto>> GetTripsAsync(Guid userId);
    Task<TripDto> GetTripAsync(Guid userId, Guid tripId);
    Task<TripDto> CreateTripAsync(Guid userId, string title, string? note);
    Task<TripDto> UpdateTripAsync(Guid userId, Guid tripId, string title, string? note);
    Task DeleteTripAsync(Guid userId, Guid tripId);
    Task<TripDto> AddSightAsync(Guid userId, Guid tripId, Guid sightId);
    Task<TripDto> RemoveSightAsync(Guid userId, Guid tripId, Guid sightId);
}
