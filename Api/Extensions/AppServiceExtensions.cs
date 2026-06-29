using Api.Data;
using Api.Interfaces;
using Api.Middleware;
using Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;



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

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("Default"),
                sql => sql.UseNetTopologySuite()));

        services.AddScoped<ICategoryService, CategoryService>();

        return services;
    }
}