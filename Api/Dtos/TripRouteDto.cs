namespace Api.Dtos;



public class TripRouteDto
{
    public string? Summary { get; set; }
    public List<TripRouteStopDto> Stops { get; set; } = [];
}



public class TripRouteStopDto
{
    public Guid SightId { get; set; }
    public string? Note { get; set; }
}
