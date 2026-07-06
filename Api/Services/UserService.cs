using Api.Data;
using Api.Dtos;
using Api.Interfaces;
using Api.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;



namespace Api.Services;



public class UserService(AppDbContext db, IGraphService graphService) : IUserService
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
        var user = await FindUserByAadObjectIdAsync(aadObjectId);
        return UserDto.FromEntity(user);
    }

    public async Task<UserDto> UpdateProfileAsync(Guid aadObjectId, UpdateProfileRequestDto request)
    {
        var user = await FindUserByAadObjectIdAsync(aadObjectId);

        user.Username = request.Username;
        user.Bio = request.Bio;
        user.ProfileImageUrl = request.ProfileImageUrl;

        await SaveChangesAsync();

        return UserDto.FromEntity(user);
    }

    public async Task<PagedResultDto<UserDto>> GetUsersAsync(int page, int pageSize)
    {
        var total = await db.Users.CountAsync();
        var users = await db.Users
            .OrderBy(u => u.Username)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => UserDto.FromEntity(u))
            .ToListAsync();

        return new PagedResultDto<UserDto>
        {
            Items = users,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<UserDto> CreateUserAsync(string displayName, string email, string temporaryPassword, string role)
    {
        var aadObjectId = await graphService.CreateUserAsync(displayName, email, temporaryPassword);

        var user = new User
        {
            AadObjectId = aadObjectId,
            Email = email,
            Username = $"user-{aadObjectId:N}"[..13],
            Role = role,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await SaveChangesAsync();

        return UserDto.FromEntity(user);
    }

    public async Task<UserDto> UpdateUserRoleAsync(Guid id, string role)
    {
        var user = await db.Users.FindAsync(id)
            ?? throw new ErrorRes("User not found", StatusCodes.Status404NotFound);

        if (user.Role == Roles.Owner)
            throw new ErrorRes("Owner accounts cannot be modified", StatusCodes.Status403Forbidden);

        user.Role = role;
        await db.SaveChangesAsync();

        return UserDto.FromEntity(user);
    }

    public async Task DeleteUserAsync(Guid id)
    {
        var user = await db.Users.FindAsync(id)
            ?? throw new ErrorRes("User not found", StatusCodes.Status404NotFound);

        if (user.Role == Roles.Owner)
            throw new ErrorRes("Owner accounts cannot be deleted", StatusCodes.Status403Forbidden);

        await graphService.DeleteUserAsync(user.AadObjectId);

        db.Users.Remove(user);
        await db.SaveChangesAsync();
    }

    private async Task<User> FindUserByAadObjectIdAsync(Guid aadObjectId)
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
