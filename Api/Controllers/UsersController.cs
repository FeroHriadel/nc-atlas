using Api.Dtos;
using Api.Extensions;
using Api.Interfaces;
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

    private Guid GetCurrentAadObjectId()
    {
        return User.GetAadObjectId()
            ?? throw new ErrorRes("Missing AAD object id claim", StatusCodes.Status401Unauthorized);
    }
}
