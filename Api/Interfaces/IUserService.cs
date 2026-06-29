using Api.Dtos;



namespace Api.Interfaces;



public interface IUserService
{
    Task<UserDto> GetOrCreateUserAsync(Guid aadObjectId, string email);
    Task<UserDto> GetUserByAadObjectIdAsync(Guid aadObjectId);
    Task<UserDto> UpdateProfileAsync(Guid aadObjectId, UpdateProfileRequestDto request);
}
