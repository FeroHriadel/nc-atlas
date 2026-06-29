using Api.Extensions;
using Api.Interfaces;
using Microsoft.Identity.Web;



namespace Api.Middleware;



public class UserProvisioningMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IUserService userService)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var aadObjectId = context.User.GetAadObjectId();
            var emailClaim = context.User.FindFirst(ClaimConstants.PreferredUserName)
                ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.Email);

            if (aadObjectId is not null)
            {
                await userService.GetOrCreateUserAsync(aadObjectId.Value, emailClaim?.Value ?? $"{aadObjectId}@unknown.local");
            }
        }

        await next(context);
    }
}
