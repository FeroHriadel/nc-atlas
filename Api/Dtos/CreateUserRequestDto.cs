namespace Api.Dtos;



public class CreateUserRequestDto
{
    public required string DisplayName { get; set; }
    public required string Email { get; set; }
    public required string TemporaryPassword { get; set; }
    public string Role { get; set; } = Models.Roles.User;
}
