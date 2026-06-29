using Api.Dtos;



namespace Api.Interfaces;



public interface ITagService
{
    Task<TagDto> CreateTagAsync(string name);
    Task<List<TagDto>> GetTagsAsync();
    Task<TagDto> GetTagAsync(Guid id);
    Task<TagDto> UpdateTagAsync(Guid id, string name);
    Task DeleteTagAsync(Guid id);
}
