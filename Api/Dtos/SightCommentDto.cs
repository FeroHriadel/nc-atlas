using Api.Models;



namespace Api.Dtos;



public class SightCommentDto
{
    public Guid Id { get; set; }
    public required string Text { get; set; }
    public string? ImageUrl { get; set; }
    public required string Username { get; set; }
    public DateTime CreatedAt { get; set; }

    // Caller must .Include(c => c.User) — Username reads that navigation.
    public static SightCommentDto FromEntity(SightComment comment) => new()
    {
        Id = comment.Id,
        Text = comment.Text,
        ImageUrl = comment.ImageUrl,
        Username = comment.User.Username,
        CreatedAt = comment.CreatedAt
    };
}
