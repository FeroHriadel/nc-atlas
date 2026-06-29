namespace Api.Models;



public class Tag
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public List<Sight> Sights { get; set; } = [];
}
