namespace Api.Models;



public class SightComment
{
    public Guid Id { get; set; }
    public Guid SightId { get; set; }
    public Sight Sight { get; set; } = null!;
    public required string Text { get; set; }
    public string? ImageUrl { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
