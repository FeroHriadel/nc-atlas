using Api.Data;
using Api.Dtos;
using Api.Interfaces;
using Api.Models;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;



namespace Api.Services;



public class SightService(AppDbContext db, IBlobService blobService) : ISightService
{
    public async Task<SightDto> CreateSightAsync(SightRequestDto request)
    {
        await EnsureCategoryExistsAsync(request.CategoryId);
        var tags = await FindTagsAsync(request.TagIds);

        var sight = new Sight
        {
            Title = request.Title,
            Description = request.Description,
            CategoryId = request.CategoryId,
            Location = CreateLocation(request.Latitude, request.Longitude),
            Source = request.Source,
            CreatedAt = DateTime.UtcNow,
            Tags = tags,
            Images = BuildImages(request.ImageUrls)
        };

        db.Sights.Add(sight);
        await db.SaveChangesAsync();

        return await GetSightAsync(sight.Id);
    }

    public async Task<PagedResultDto<SightDto>> GetSightsAsync(int page, int pageSize, string? search, int? categoryId, Guid? tagId, string sortDirection)
    {
        var query = db.Sights
            .Include(s => s.Category)
            .Include(s => s.Tags)
            .Include(s => s.Images)
            .AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(s => s.CategoryId == categoryId.Value);

        if (tagId.HasValue)
            query = query.Where(s => s.Tags.Any(t => t.Id == tagId.Value));

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s =>
                s.Title.Contains(search) ||
                s.Description.Contains(search) ||
                s.Category.Name.Contains(search) ||
                s.Tags.Any(t => t.Name.Contains(search)));

        var total = await query.CountAsync();

        query = sortDirection.Equals("asc", StringComparison.OrdinalIgnoreCase)
            ? query.OrderBy(s => s.CreatedAt)
            : query.OrderByDescending(s => s.CreatedAt);

        var sights = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResultDto<SightDto>
        {
            Items = sights.Select(SightDto.FromEntity).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<SightDto> GetSightAsync(Guid id)
    {
        var sight = await FindSightAsync(id);
        return SightDto.FromEntity(sight);
    }

    public async Task<SightDto> UpdateSightAsync(Guid id, SightRequestDto request)
    {
        var sight = await FindSightAsync(id);
        await EnsureCategoryExistsAsync(request.CategoryId);
        var tags = await FindTagsAsync(request.TagIds);

        sight.Title = request.Title;
        sight.Description = request.Description;
        sight.CategoryId = request.CategoryId;
        sight.Location = CreateLocation(request.Latitude, request.Longitude);
        sight.Source = request.Source;

        sight.Tags.Clear();
        sight.Tags.AddRange(tags);

        sight.Images.Clear();
        sight.Images.AddRange(BuildImages(request.ImageUrls));

        await db.SaveChangesAsync();

        return SightDto.FromEntity(sight);
    }

    public async Task DeleteSightAsync(Guid id)
    {
        var sight = await db.Sights
            .Include(s => s.Images)
            .FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new ErrorRes("Sight not found", StatusCodes.Status404NotFound);

        foreach (var image in sight.Images)
            await blobService.DeleteAsync(image.ImageUrl);

        db.Sights.Remove(sight);
        await db.SaveChangesAsync();
    }

    public async Task DeleteAllSightsAsync()
    {
        var sights = await db.Sights.Include(s => s.Images).ToListAsync();

        foreach (var sight in sights)
            foreach (var image in sight.Images)
                await blobService.DeleteAsync(image.ImageUrl);

        db.Sights.RemoveRange(sights);
        await db.SaveChangesAsync();
    }

    private async Task<Sight> FindSightAsync(Guid id)
    {
        return await db.Sights
            .Include(s => s.Category)
            .Include(s => s.Tags)
            .Include(s => s.Images)
            .FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new ErrorRes("Sight not found", StatusCodes.Status404NotFound);
    }

    private async Task EnsureCategoryExistsAsync(int categoryId)
    {
        var exists = await db.Categories.AnyAsync(c => c.Id == categoryId);
        if (!exists)
        {
            throw new ErrorRes("Category not found", StatusCodes.Status404NotFound);
        }
    }

    private async Task<List<Tag>> FindTagsAsync(List<Guid> tagIds)
    {
        if (tagIds.Count == 0)
        {
            return [];
        }

        var tags = await db.Tags.Where(t => tagIds.Contains(t.Id)).ToListAsync();
        if (tags.Count != tagIds.Distinct().Count())
        {
            throw new ErrorRes("One or more tags not found", StatusCodes.Status404NotFound);
        }

        return tags;
    }

    private static List<SightImage> BuildImages(List<string> imageUrls)
    {
        return imageUrls
            .Select((url, index) => new SightImage { ImageUrl = url, SortOrder = index })
            .ToList();
    }

    private static Point CreateLocation(double latitude, double longitude)
    {
        return new Point(longitude, latitude) { SRID = 4326 };
    }
}
