using Api.Dtos;

namespace Api.Interfaces;



public interface ITripItineraryService
{
    Task<TripItineraryDto> GetItineraryAsync(Guid userId, Guid tripId, CancellationToken cancellationToken);
}
