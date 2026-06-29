namespace Api.Models;



public class User
{
    public Guid Id { get; set; }
    public Guid AadObjectId { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; }
}
