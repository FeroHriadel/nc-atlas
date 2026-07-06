using Api.Dtos;
using Api.Interfaces;
using Microsoft.Graph;
using Microsoft.Graph.Models;

// Alias to avoid conflict with Api.Models.User
using GraphUser = Microsoft.Graph.Models.User;



namespace Api.Services;



public class GraphService(GraphServiceClient graphClient) : IGraphService
{
    public async Task<Guid> CreateUserAsync(string displayName, string email, string temporaryPassword)
    {
        var mailNickname = email.Split('@')[0];

        var user = new GraphUser
        {
            DisplayName = displayName,
            MailNickname = mailNickname,
            UserPrincipalName = email,
            AccountEnabled = true,
            PasswordProfile = new PasswordProfile
            {
                ForceChangePasswordNextSignIn = true,
                Password = temporaryPassword
            }
        };

        var created = await graphClient.Users.PostAsync(user)
            ?? throw new ErrorRes("Failed to create user in Entra ID", StatusCodes.Status500InternalServerError);

        return Guid.Parse(created.Id!);
    }

    public async Task DeleteUserAsync(Guid aadObjectId)
    {
        await graphClient.Users[aadObjectId.ToString()].DeleteAsync();
    }
}
