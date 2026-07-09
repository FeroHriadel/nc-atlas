namespace Api.Dtos;



public class TripItineraryDto
{
    public required string Title { get; set; }
    public string? Note { get; set; }
    public List<TripItinerarySightDto> Sights { get; set; } = [];
    public TripRouteDto? RecommendedRoute { get; set; }
    public string? RouteError { get; set; }
}



public class TripItinerarySightDto
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string CategoryName { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? County { get; set; }
    public List<TagDto> Tags { get; set; } = [];
    public List<SightImageDto> Images { get; set; } = [];
    public SightFactContentDto? Facts { get; set; }

    // Embedded as a data URI (rather than left as a blob-storage URL) because the storage
    // account's CORS policy only allows PUT, not GET — html2canvas can't cross-origin-fetch
    // the raw URL on the client, so the PDF export fetches it server-side instead.
    public string? ThumbnailDataUri { get; set; }
}
