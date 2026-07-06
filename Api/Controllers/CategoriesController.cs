using Api.Dtos;
using Api.Interfaces;
using Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;



namespace Api.Controllers;



public class CategoriesController(ICategoryService categoryService) : BaseAppController
{

    // GET: api/v1/categories
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        return await categoryService.GetCategoriesAsync();
    }


    // GET: api/v1/categories/{id}
    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetCategory(int id)
    {
        return await categoryService.GetCategoryAsync(id);
    }

    // POST: api/v1/categories
    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpPost]
    public async Task<ActionResult<CategoryDto>> CreateCategory(CategoryRequestDto request)
    {
        var category = await categoryService.CreateCategoryAsync(request.Name);
        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
    }


    // PUT: api/v1/categories/{id}
    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(int id, CategoryRequestDto request)
    {
        return await categoryService.UpdateCategoryAsync(id, request.Name);
    }


    // DELETE: api/v1/categories/{id}
    [Authorize(Roles = Roles.AdminOrOwner)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        await categoryService.DeleteCategoryAsync(id);
        return NoContent();
    }
}
