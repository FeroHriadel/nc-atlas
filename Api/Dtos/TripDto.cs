using Api.Models;



namespace Api.Dtos;



public class TripDto
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<SightDto> Sights { get; set; } = [];

    // Caller must .Include(t => t.Sights).ThenInclude(s => s.Category), .ThenInclude(s => s.Tags)
    // and .ThenInclude(s => s.Images) — Sights reads those navigation properties via SightDto.FromEntity.
    public static TripDto FromEntity(Trip trip) => new()
    {
        Id = trip.Id,
        Title = trip.Title,
        Note = trip.Note,
        CreatedAt = trip.CreatedAt,
        UpdatedAt = trip.UpdatedAt,
        Sights = trip.Sights.Select(SightDto.FromEntity).ToList()
    };
}
