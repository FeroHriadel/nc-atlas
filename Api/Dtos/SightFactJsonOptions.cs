using System.Text.Json;

namespace Api.Dtos;



// Shared options for (de)serializing SightFactContentDto to/from the sight_facts/sight_fact_jobs
// text columns, kept in sync with the camelCase convention the MVC layer uses for API responses.
public static class SightFactJsonOptions
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };
}
