namespace Api.Interfaces;



public interface IBlobService
{
    (string UploadUrl, string BlobUrl) GetUploadSasUrl(string fileName);
}
