using Api.Dtos;
using Api.Extensions;
using Api.Interfaces;
using Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;



namespace Api.Controllers;



public class UsersController(IUserService userService) : BaseAppController
{
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var aadObjectId = GetCurrentAadObjectId();
        return await userService.GetUserByAadObjectIdAsync(aadObjectId);
    }

    [HttpPut("me")]
    public async Task<ActionResult<UserDto>> UpdateMe(UpdateProfileRequestDto request)
    {
        var aadObjectId = GetCurrentAadObjectId();
        return await userService.UpdateProfileAsync(aadObjectId, request);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<UserDto>>> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        return await userService.GetUsersAsync(page, pageSize);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser(CreateUserRequestDto request)
    {
        var user = await userService.CreateUserAsync(request.DisplayName, request.Email, request.TemporaryPassword, request.Role);
        return CreatedAtAction(nameof(GetMe), user);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpPatch("{id:guid}/role")]
    public async Task<ActionResult<UserDto>> UpdateUserRole(Guid id, UpdateUserRoleRequestDto request)
    {
        return await userService.UpdateUserRoleAsync(id, request.Role);
    }

    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        await userService.DeleteUserAsync(id);
        return NoContent();
    }

    private Guid GetCurrentAadObjectId()
    {
        return User.GetAadObjectId()
            ?? throw new ErrorRes("Missing AAD object id claim", StatusCodes.Status401Unauthorized);
    }
}
