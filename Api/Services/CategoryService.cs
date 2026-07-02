using Api.Data;
using Api.Dtos;
using Api.Interfaces;
using Api.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;



namespace Api.Services;



public class CategoryService(AppDbContext db) : ICategoryService
{
    public async Task<CategoryDto> CreateCategoryAsync(string name)
    {
        var category = new Category { Name = name };
        db.Categories.Add(category);
        await SaveChangesAsync();

        return CategoryDto.FromEntity(category);
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        return await db.Categories
            .OrderBy(c => c.Name)
            .Select(c => CategoryDto.FromEntity(c))
            .ToListAsync();
    }

    public async Task<CategoryDto> GetCategoryAsync(int id)
    {
        var category = await FindCategoryAsync(id);
        return CategoryDto.FromEntity(category);
    }

    public async Task<CategoryDto> UpdateCategoryAsync(int id, string name)
    {
        var category = await FindCategoryAsync(id);
        category.Name = name;
        await SaveChangesAsync();

        return CategoryDto.FromEntity(category);
    }

    public async Task DeleteCategoryAsync(int id)
    {
        var category = await FindCategoryAsync(id);
        db.Categories.Remove(category);
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 547 })
        {
            throw new ErrorRes("Cannot delete this category because it still has sights assigned to it. Reassign or delete those sights first.", StatusCodes.Status409Conflict);
        }
    }

    private async Task<Category> FindCategoryAsync(int id)
    {
        return await db.Categories.FindAsync(id)
            ?? throw new ErrorRes("Category not found", StatusCodes.Status404NotFound);
    }

    private async Task SaveChangesAsync()
    {
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ErrorRes("A category with this name already exists", StatusCodes.Status409Conflict);
        }
    }
}
