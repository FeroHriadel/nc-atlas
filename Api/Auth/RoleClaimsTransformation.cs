using System.Security.Claims;
using Api.Extensions;
using Api.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Identity.Web;



namespace Api.Auth;



public class RoleClaimsTransformation(IUserService userService) : IClaimsTransformation
{
    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true || principal.HasClaim(c => c.Type == ClaimTypes.Role))
        {
            return principal;
        }

        var aadObjectId = principal.GetAadObjectId();
        if (aadObjectId is null)
        {
            return principal;
        }

        var emailClaim = principal.FindFirst(ClaimConstants.PreferredUserName)
            ?? principal.FindFirst(ClaimTypes.Email);

        var user = await userService.GetOrCreateUserAsync(aadObjectId.Value, emailClaim?.Value ?? $"{aadObjectId}@unknown.local");

        var identity = new ClaimsIdentity();
        identity.AddClaim(new Claim(ClaimTypes.Role, user.Role));
        principal.AddIdentity(identity);

        return principal;
    }
}
