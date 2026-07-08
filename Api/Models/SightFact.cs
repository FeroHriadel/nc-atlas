namespace Api.Models;



public class SightFact
{
    public Guid Id { get; set; }
    public Guid SightId { get; set; }
    public Sight Sight { get; set; } = null!;
    public required string Content { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
