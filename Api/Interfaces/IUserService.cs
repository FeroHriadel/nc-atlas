using Api.Dtos;



namespace Api.Interfaces;



public interface IUserService
{
    Task<UserDto> GetOrCreateUserAsync(Guid aadObjectId, string email);
    Task<UserDto> GetUserByAadObjectIdAsync(Guid aadObjectId);
    Task<UserDto> UpdateProfileAsync(Guid aadObjectId, UpdateProfileRequestDto request);
    Task<PagedResultDto<UserDto>> GetUsersAsync(int page, int pageSize);
    Task<UserDto> CreateUserAsync(string displayName, string email, string temporaryPassword, string role);
    Task<UserDto> UpdateUserRoleAsync(Guid id, string role);
    Task DeleteUserAsync(Guid id);
}
