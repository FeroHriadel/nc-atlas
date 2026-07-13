namespace Api.Interfaces;



public interface IImageProcessingService
{
    // Resizes to maxWidth (preserving aspect ratio) if the source is wider; never upscales.
    // Always re-encodes as JPEG for consistent, predictable output.
    byte[] ResizeToWidth(byte[] source, int maxWidth);
}
