using Api.Dtos;
using Api.Interfaces;

namespace Api.Services;



public class TripItineraryService(
    ITripService tripService,
    ISightFactService sightFactService,
    IClaudeService claudeService,
    IHttpClientFactory httpClientFactory)
    : ITripItineraryService
{
    public async Task<TripItineraryDto> GetItineraryAsync(Guid userId, Guid tripId, CancellationToken cancellationToken)
    {
        var trip = await tripService.GetTripAsync(userId, tripId);

        var sights = new List<TripItinerarySightDto>();
        foreach (var sight in trip.Sights)
        {
            var facts = await sightFactService.GetFactsAsync(sight.Id);
            var thumbnailUrl = sight.Images.OrderBy(i => i.SortOrder).FirstOrDefault()?.ImageUrl;

            sights.Add(new TripItinerarySightDto
            {
                Id = sight.Id,
                Title = sight.Title,
                Description = sight.Description,
                CategoryName = sight.CategoryName,
                Latitude = sight.Latitude,
                Longitude = sight.Longitude,
                Country = sight.Country,
                State = sight.State,
                County = sight.County,
                Tags = sight.Tags,
                Images = sight.Images,
                Facts = facts,
                ThumbnailDataUri = thumbnailUrl is null ? null : await FetchAsDataUriAsync(thumbnailUrl, cancellationToken)
            });
        }

        var itinerary = new TripItineraryDto
        {
            Title = trip.Title,
            Note = trip.Note,
            Sights = sights
        };

        if (trip.Sights.Count == 0)
        {
            return itinerary;
        }

        if (trip.Sights.Count == 1)
        {
            itinerary.RecommendedRoute = new TripRouteDto
            {
                Summary = "Only one stop on this trip — nothing to optimize.",
                Stops = [new TripRouteStopDto { SightId = trip.Sights[0].Id }]
            };
            return itinerary;
        }

        try
        {
            var routeInput = trip.Sights
                .Select(s => new TripRouteSightData(s.Id, s.Title, s.Latitude, s.Longitude, s.Country, s.State, s.County))
                .ToList();

            var result = await claudeService.OptimizeTripRouteAsync(routeInput, cancellationToken);

            if (result.Route is not null)
            {
                itinerary.RecommendedRoute = result.Route;
            }
            else
            {
                itinerary.RouteError = "Failed to optimize itinerary.";
            }
        }
        catch
        {
            itinerary.RouteError = "Failed to optimize itinerary.";
        }

        return itinerary;
    }

    private async Task<string?> FetchAsDataUriAsync(string imageUrl, CancellationToken cancellationToken)
    {
        try
        {
            using var http = httpClientFactory.CreateClient();
            using var response = await http.GetAsync(imageUrl, cancellationToken);
            if (!response.IsSuccessStatusCode)
                return null;

            var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
            var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";

            return $"data:{contentType};base64,{Convert.ToBase64String(bytes)}";
        }
        catch
        {
            return null;
        }
    }
}
