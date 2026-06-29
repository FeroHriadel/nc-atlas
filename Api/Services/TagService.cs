using Api.Data;
using Api.Dtos;
using Api.Interfaces;
using Api.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;



namespace Api.Services;



public class TagService(AppDbContext db) : ITagService
{
    public async Task<TagDto> CreateTagAsync(string name)
    {
        var tag = new Tag { Name = name };
        db.Tags.Add(tag);
        await SaveChangesAsync();

        return TagDto.FromEntity(tag);
    }

    public async Task<List<TagDto>> GetTagsAsync()
    {
        return await db.Tags
            .OrderBy(t => t.Name)
            .Select(t => TagDto.FromEntity(t))
            .ToListAsync();
    }

    public async Task<TagDto> GetTagAsync(Guid id)
    {
        var tag = await FindTagAsync(id);
        return TagDto.FromEntity(tag);
    }

    public async Task<TagDto> UpdateTagAsync(Guid id, string name)
    {
        var tag = await FindTagAsync(id);
        tag.Name = name;
        await SaveChangesAsync();

        return TagDto.FromEntity(tag);
    }

    public async Task DeleteTagAsync(Guid id)
    {
        var tag = await FindTagAsync(id);
        db.Tags.Remove(tag);
        await SaveChangesAsync();
    }

    private async Task<Tag> FindTagAsync(Guid id)
    {
        return await db.Tags.FindAsync(id)
            ?? throw new ErrorRes("Tag not found", StatusCodes.Status404NotFound);
    }

    private async Task SaveChangesAsync()
    {
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ErrorRes("A tag with this name already exists", StatusCodes.Status409Conflict);
        }
    }
}
