namespace Api.Interfaces;



public interface IGraphService
{
    Task<Guid> CreateUserAsync(string displayName, string email, string temporaryPassword);
    Task DeleteUserAsync(Guid aadObjectId);
}
