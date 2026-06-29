using Api.Models;



namespace Api.Dtos;



public class CategoryDto
{
    public int Id { get; set; }
    public required string Name { get; set; }

    public static CategoryDto FromEntity(Category category) => new()
    {
        Id = category.Id,
        Name = category.Name
    };
}
