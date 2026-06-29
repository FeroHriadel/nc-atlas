using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Api.Middleware;



namespace Api.Controllers;



// [Authorize]
[ServiceFilter(typeof(OnActionExecutionMiddleware))]
[ApiController]
[Route("api/v1/[controller]")]
public class BaseAppController : ControllerBase
{
    // This class can be used to define common functionality for all API controllers
    // For example, you can add common methods, properties, or filters here that all API controllers will inherit.
}