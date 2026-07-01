namespace Api.Interfaces;



public interface IBlobService
{
    (string UploadUrl, string BlobUrl) GetUploadSasUrl(string fileName);
    Task<string> UploadAsync(Stream stream, string blobName, string contentType);
    Task DeleteAsync(string blobUrl);
}
