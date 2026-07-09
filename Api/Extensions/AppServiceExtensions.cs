using System.Text.Json;
using System.Threading.Channels;
using System.Threading.RateLimiting;
using Api.Auth;
using Api.Data;
using Api.Interfaces;
using Api.Middleware;
using Api.Services;
using Api.Workers;
using Azure.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph;
using Microsoft.Identity.Web;



namespace Api.Extensions;



public static class AppServiceExtensions
{
    public static IServiceCollection AddAppServices(this IServiceCollection services, IConfiguration configuration)
    {
        // respond with camelCase json instead of PascalCase
        services.AddControllers()
            .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase);
        // use OnActionexecutionMiddleware to log incoming requests in development
        services.AddScoped<OnActionExecutionMiddleware>();
        services.AddCors();
        services.AddEndpointsApiExplorer();
        services.AddHttpClient();

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("Default"),
                sql => sql.UseNetTopologySuite()));

        var credential = new ClientSecretCredential(
            configuration["AzureAd:TenantId"],
            configuration["AzureAd:ClientId"],
            configuration["AzureAd:ClientSecret"]);
        services.AddSingleton(new GraphServiceClient(credential));
        services.AddScoped<IGraphService, GraphService>();

        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ITagService, TagService>();
        services.AddScoped<ISightService, SightService>();
        services.AddSingleton<IBlobService, BlobService>();
        services.AddScoped<IUserService, UserService>();
        services.AddSingleton(Channel.CreateUnbounded<ImportPayload>());
        services.AddScoped<IImportService, ImportService>();
        services.AddHostedService<ImportBackgroundWorker>();

        services.AddSingleton<IClaudeService, ClaudeService>();
        services.AddScoped<ISightFactService, SightFactService>();
        services.AddSingleton(Channel.CreateUnbounded<SightFactGenerationRequest>());
        services.AddHostedService<SightFactBackgroundWorker>();

        services.AddScoped<ITripService, TripService>();
        services.AddScoped<ITripItineraryService, TripItineraryService>();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddMicrosoftIdentityWebApi(configuration.GetSection("AzureAd"));
        services.AddAuthorization();
        services.AddTransient<IClaimsTransformation, RoleClaimsTransformation>();

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        Window = TimeSpan.FromMinutes(1),
                        PermitLimit = 100,
                        QueueLimit = 0
                    }));

            options.OnRejected = async (context, token) =>
            {
                context.HttpContext.Response.ContentType = "application/json";
                await context.HttpContext.Response.WriteAsync(
                    JsonSerializer.Serialize(new
                    {
                        error = "Too many requests. Please try again later.",
                        statusCode = StatusCodes.Status429TooManyRequests
                    }),
                    token);
            };
        });

        return services;
    }
}