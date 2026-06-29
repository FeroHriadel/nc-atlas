using System.Security.Claims;
using Microsoft.Identity.Web;



namespace Api.Extensions;



public static class ClaimsPrincipalExtensions
{
    public static Guid? GetAadObjectId(this ClaimsPrincipal user)
    {
        var oidClaim = user.FindFirst(ClaimConstants.ObjectId) ?? user.FindFirst(ClaimConstants.Oid);
        return oidClaim is not null && Guid.TryParse(oidClaim.Value, out var oid) ? oid : null;
    }
}
