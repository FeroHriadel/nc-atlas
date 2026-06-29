using Api.Models;



namespace Api.Dtos;



public class UserDto
{
    public Guid Id { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; }

    public static UserDto FromEntity(User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        Email = user.Email,
        ProfileImageUrl = user.ProfileImageUrl,
        Bio = user.Bio,
        CreatedAt = user.CreatedAt
    };
}
