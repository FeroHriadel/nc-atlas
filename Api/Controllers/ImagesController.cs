using Api.Dtos;
using Api.Interfaces;
using Microsoft.AspNetCore.Mvc;



namespace Api.Controllers;



public class ImagesController(IBlobService blobService) : BaseAppController
{
    [HttpPost("upload-url")]
    public ActionResult<UploadUrlResponseDto> GetUploadUrl(UploadUrlRequestDto request)
    {
        var (uploadUrl, blobUrl) = blobService.GetUploadSasUrl(request.FileName);

        return new UploadUrlResponseDto
        {
            UploadUrl = uploadUrl,
            BlobUrl = blobUrl
        };
    }
}
