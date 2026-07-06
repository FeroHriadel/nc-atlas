namespace Api.Models;



public static class Roles
{
    public const string Owner = "Owner";
    public const string Admin = "Admin";
    public const string User = "User";

    // For use in [Authorize(Roles = ...)] attributes
    public const string AdminOrOwner = Admin + "," + Owner;
}
