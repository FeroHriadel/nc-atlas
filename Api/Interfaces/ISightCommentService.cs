using Api.Dtos;
using Microsoft.AspNetCore.Http;

namespace Api.Interfaces;



public interface ISightCommentService
{
    Task<List<SightCommentDto>> GetCommentsAsync(Guid sightId);
    Task<SightCommentDto> CreateCommentAsync(Guid sightId, Guid userId, string text, IFormFile? image);
    Task DeleteCommentAsync(Guid sightId, Guid commentId);
}
