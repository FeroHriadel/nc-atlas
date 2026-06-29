using Api.Data;
using Api.Dtos;
using Api.Interfaces;
using Api.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;



namespace Api.Services;



public class UserService(AppDbContext db) : IUserService
{
    public async Task<UserDto> GetOrCreateUserAsync(Guid aadObjectId, string email)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.AadObjectId == aadObjectId);
        if (user is not null)
        {
            return UserDto.FromEntity(user);
        }

        user = new User
        {
            AadObjectId = aadObjectId,
            Email = email,
            // Placeholder handle, guaranteed unique via the AAD object id —
            // the user picks a real username later via a "complete your profile" step.
            Username = $"user-{aadObjectId:N}"[..13],
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await SaveChangesAsync();

        return UserDto.FromEntity(user);
    }

    public async Task<UserDto> GetUserByAadObjectIdAsync(Guid aadObjectId)
    {
        var user = await FindUserAsync(aadObjectId);
        return UserDto.FromEntity(user);
    }

    public async Task<UserDto> UpdateProfileAsync(Guid aadObjectId, UpdateProfileRequestDto request)
    {
        var user = await FindUserAsync(aadObjectId);

        user.Username = request.Username;
        user.Bio = request.Bio;
        user.ProfileImageUrl = request.ProfileImageUrl;

        await SaveChangesAsync();

        return UserDto.FromEntity(user);
    }

    private async Task<User> FindUserAsync(Guid aadObjectId)
    {
        return await db.Users.FirstOrDefaultAsync(u => u.AadObjectId == aadObjectId)
            ?? throw new ErrorRes("User not found", StatusCodes.Status404NotFound);
    }

    private async Task SaveChangesAsync()
    {
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ErrorRes("A user with this email or username already exists", StatusCodes.Status409Conflict);
        }
    }
}
