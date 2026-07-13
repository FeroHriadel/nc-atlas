using Api.Dtos;
using Api.Interfaces;
using SkiaSharp;

namespace Api.Services;



public class ImageProcessingService : IImageProcessingService
{
    public byte[] ResizeToWidth(byte[] source, int maxWidth)
    {
        using var original = SKBitmap.Decode(source)
            ?? throw new ErrorRes("Could not decode image", StatusCodes.Status400BadRequest);

        if (original.Width <= maxWidth)
            return Encode(original);

        var height = (int)Math.Round(original.Height * (maxWidth / (double)original.Width));
        using var resized = original.Resize(new SKImageInfo(maxWidth, height), SKSamplingOptions.Default)
            ?? throw new ErrorRes("Could not resize image", StatusCodes.Status400BadRequest);

        return Encode(resized);
    }

    private static byte[] Encode(SKBitmap bitmap)
    {
        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Jpeg, 85);
        return data.ToArray();
    }
}
