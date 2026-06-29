using Api.Models;



namespace Api.Dtos;



public class TagDto
{
    public Guid Id { get; set; }
    public required string Name { get; set; }

    public static TagDto FromEntity(Tag tag) => new()
    {
        Id = tag.Id,
        Name = tag.Name
    };
}
