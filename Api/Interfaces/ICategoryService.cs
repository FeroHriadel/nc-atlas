using Api.Dtos;



namespace Api.Interfaces;



public interface ICategoryService
{
    Task<CategoryDto> CreateCategoryAsync(string name);
    Task<List<CategoryDto>> GetCategoriesAsync();
    Task<CategoryDto> GetCategoryAsync(int id);
    Task<CategoryDto> UpdateCategoryAsync(int id, string name);
    Task DeleteCategoryAsync(int id);
}
