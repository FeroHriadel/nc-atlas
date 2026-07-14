using Api.Data;
using Api.Extensions;
using Api.Middleware;
using Microsoft.EntityFrameworkCore;



// app builder
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddAppServices(builder.Configuration, builder.Environment);
var app = builder.Build();

// migrations run on startup only in Production, so CI never needs the SQL
// firewall opened to GitHub's runner IPs (see infra/envs/prod plan notes on
// keeping schema changes backward-compatible across a deploy)
if (app.Environment.IsProduction())
{
    using var scope = app.Services.CreateScope();
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

// app config
app.UseMiddleware<ErrorMiddleware>();
app.UseRateLimiter();
if (app.Environment.IsDevelopment()) app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/healthz", () => Results.Ok());
app.MapControllers();
app.MapFallbackToFile("index.html");
app.Run();


