using Api.Dtos;
using Api.Extensions;
using Api.Interfaces;
using Microsoft.AspNetCore.Mvc;



namespace Api.Controllers;



public class TripsController(ITripService tripService, IUserService userService, ITripItineraryService tripItineraryService) : BaseAppController
{
    [HttpGet]
    public async Task<ActionResult<List<TripDto>>> GetTrips()
    {
        var userId = await GetCurrentUserIdAsync();
        return await tripService.GetTripsAsync(userId);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TripDto>> GetTrip(Guid id)
    {
        var userId = await GetCurrentUserIdAsync();
        return await tripService.GetTripAsync(userId, id);
    }

    [HttpPost]
    public async Task<ActionResult<TripDto>> CreateTrip(TripRequestDto request)
    {
        var userId = await GetCurrentUserIdAsync();
        var trip = await tripService.CreateTripAsync(userId, request.Title, request.Note);
        return CreatedAtAction(nameof(GetTrip), new { id = trip.Id }, trip);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TripDto>> UpdateTrip(Guid id, TripRequestDto request)
    {
        var userId = await GetCurrentUserIdAsync();
        return await tripService.UpdateTripAsync(userId, id, request.Title, request.Note);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTrip(Guid id)
    {
        var userId = await GetCurrentUserIdAsync();
        await tripService.DeleteTripAsync(userId, id);
        return NoContent();
    }

    [HttpPost("~/api/v1/trips/{tripId:guid}/sights/{sightId:guid}")]
    public async Task<ActionResult<TripDto>> AddSight(Guid tripId, Guid sightId)
    {
        var userId = await GetCurrentUserIdAsync();
        return await tripService.AddSightAsync(userId, tripId, sightId);
    }

    [HttpDelete("~/api/v1/trips/{tripId:guid}/sights/{sightId:guid}")]
    public async Task<ActionResult<TripDto>> RemoveSight(Guid tripId, Guid sightId)
    {
        var userId = await GetCurrentUserIdAsync();
        return await tripService.RemoveSightAsync(userId, tripId, sightId);
    }

    [HttpGet("{tripId:guid}/itinerary")]
    public async Task<ActionResult<TripItineraryDto>> GetItinerary(Guid tripId, CancellationToken cancellationToken)
    {
        var userId = await GetCurrentUserIdAsync();
        return await tripItineraryService.GetItineraryAsync(userId, tripId, cancellationToken);
    }

    private async Task<Guid> GetCurrentUserIdAsync()
    {
        var aadObjectId = User.GetAadObjectId()
            ?? throw new ErrorRes("Missing AAD object id claim", StatusCodes.Status401Unauthorized);

        var user = await userService.GetUserByAadObjectIdAsync(aadObjectId);
        return user.Id;
    }
}
