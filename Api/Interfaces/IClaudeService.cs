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

public interface IClaudeService
{
    Task<SightFactGenerationResult> GenerateSightFactsAsync(
        SightFactPromptData sight,
        SightFactContentDto? previousResult,
        string? feedback,
        CancellationToken cancellationToken);
}
