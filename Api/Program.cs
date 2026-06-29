using Api.Extensions;
using Api.Middleware;



// app builder
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddAppServices(builder.Configuration);
var app = builder.Build();

// app config
app.UseMiddleware<ErrorMiddleware>();
if (app.Environment.IsDevelopment()) app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();


