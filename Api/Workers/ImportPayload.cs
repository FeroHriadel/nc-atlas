using Api.Dtos;



namespace Api.Workers;



public record SightImages(byte[] Image350, byte[] Image1024);

public record ImportPayload(
    Guid JobId,
    List<SightJsonEntry> Sights,
    Dictionary<string, SightImages> ImagesByTitle
);
