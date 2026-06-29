namespace Api.Dtos;



public class UpdateProfileRequestDto
{
    public required string Username { get; set; }
    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }
}
