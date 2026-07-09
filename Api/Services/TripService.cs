using Api.Data;
using Api.Dtos;
using Api.Interfaces;
using Api.Models;
using Microsoft.EntityFrameworkCore;



namespace Api.Services;



public class TripService(AppDbContext db) : ITripService
{
    public async Task<List<TripDto>> GetTripsAsync(Guid userId)
    {
        return await Query(userId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => TripDto.FromEntity(t))
            .ToListAsync();
    }

    public async Task<TripDto> GetTripAsync(Guid userId, Guid tripId)
    {
        var trip = await FindTripAsync(userId, tripId);
        return TripDto.FromEntity(trip);
    }

    public async Task<TripDto> CreateTripAsync(Guid userId, string title, string? note)
    {
        var now = DateTime.UtcNow;
        var trip = new Trip
        {
            UserId = userId,
            Title = title,
            Note = note,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.Trips.Add(trip);
        await db.SaveChangesAsync();

        return TripDto.FromEntity(trip);
    }

    public async Task<TripDto> UpdateTripAsync(Guid userId, Guid tripId, string title, string? note)
    {
        var trip = await FindTripAsync(userId, tripId);

        trip.Title = title;
        trip.Note = note;
        trip.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        return TripDto.FromEntity(trip);
    }

    public async Task DeleteTripAsync(Guid userId, Guid tripId)
    {
        var trip = await FindTripAsync(userId, tripId);

        db.Trips.Remove(trip);
        await db.SaveChangesAsync();
    }

    public async Task<TripDto> AddSightAsync(Guid userId, Guid tripId, Guid sightId)
    {
        var trip = await FindTripAsync(userId, tripId);

        if (trip.Sights.All(s => s.Id != sightId))
        {
            var sight = await db.Sights
                .Include(s => s.Category)
                .Include(s => s.Tags)
                .Include(s => s.Images)
                .FirstOrDefaultAsync(s => s.Id == sightId)
                ?? throw new ErrorRes("Sight not found", StatusCodes.Status404NotFound);

            trip.Sights.Add(sight);
            trip.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }

        return TripDto.FromEntity(trip);
    }

    public async Task<TripDto> RemoveSightAsync(Guid userId, Guid tripId, Guid sightId)
    {
        var trip = await FindTripAsync(userId, tripId);

        var sight = trip.Sights.FirstOrDefault(s => s.Id == sightId);
        if (sight is not null)
        {
            trip.Sights.Remove(sight);
            trip.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }

        return TripDto.FromEntity(trip);
    }

    private IQueryable<Trip> Query(Guid userId)
    {
        return db.Trips
            .Where(t => t.UserId == userId)
            .Include(t => t.Sights).ThenInclude(s => s.Category)
            .Include(t => t.Sights).ThenInclude(s => s.Tags)
            .Include(t => t.Sights).ThenInclude(s => s.Images);
    }

    private async Task<Trip> FindTripAsync(Guid userId, Guid tripId)
    {
        return await Query(userId).FirstOrDefaultAsync(t => t.Id == tripId)
            ?? throw new ErrorRes("Trip not found", StatusCodes.Status404NotFound);
    }
}
