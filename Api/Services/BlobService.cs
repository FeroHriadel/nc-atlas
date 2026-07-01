using Api.Interfaces;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;



namespace Api.Services;



public class BlobService : IBlobService
{
    private readonly BlobContainerClient containerClient;

    public BlobService(IConfiguration configuration)
    {
        var connectionString = configuration["BlobStorage:ConnectionString"]
            ?? throw new InvalidOperationException("BlobStorage:ConnectionString is not configured");
        var containerName = configuration["BlobStorage:ContainerName"]
            ?? throw new InvalidOperationException("BlobStorage:ContainerName is not configured");

        containerClient = new BlobContainerClient(connectionString, containerName);
    }

    public (string UploadUrl, string BlobUrl) GetUploadSasUrl(string fileName)
    {
        var blobName = $"{Guid.NewGuid()}-{fileName}";
        var blobClient = containerClient.GetBlobClient(blobName);

        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = containerClient.Name,
            BlobName = blobName,
            Resource = "b",
            ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(15)
        };
        sasBuilder.SetPermissions(BlobSasPermissions.Write | BlobSasPermissions.Create);

        var uploadUrl = blobClient.GenerateSasUri(sasBuilder).ToString();

        return (uploadUrl, blobClient.Uri.ToString());
    }

    public async Task<string> UploadAsync(Stream stream, string blobName, string contentType)
    {
        var blobClient = containerClient.GetBlobClient(blobName);
        await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = contentType });
        return blobClient.Uri.ToString();
    }

    public async Task DeleteAsync(string blobUrl)
    {
        // BlobUriBuilder parses the full URL and gives us the blob name (path within the container)
        var blobName = new BlobUriBuilder(new Uri(blobUrl)).BlobName;
        await containerClient.GetBlobClient(blobName).DeleteIfExistsAsync();
    }
}
