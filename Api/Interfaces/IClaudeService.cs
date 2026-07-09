using Api.Dtos;

namespace Api.Interfaces;



public record SightFactPromptData(
    string Title,
    string Description,
    string Category,
    List<string> Tags,
    string? Country,
    string? State,
    string? County
);

public class SightFactGenerationResult
{
    public SightFactContentDto? Content { get; set; }
    public string? Error { get; set; }
}

public record TripRouteSightData(
    Guid Id,
    string Title,
    double Latitude,
    double Longitude,
    string? Country,
    string? State,
    string? County
);

public class TripRouteOptimizationResult
{
    public TripRouteDto? Route { get; set; }
    public string? Error { get; set; }
}

public interface IClaudeService
{
    Task<SightFactGenerationResult> GenerateSightFactsAsync(
        SightFactPromptData sight,
        SightFactContentDto? previousResult,
        string? feedback,
        CancellationToken cancellationToken);

    Task<TripRouteOptimizationResult> OptimizeTripRouteAsync(
        List<TripRouteSightData> sights,
        CancellationToken cancellationToken);
}
