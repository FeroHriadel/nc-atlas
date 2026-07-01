namespace Api.Dtos;



public record SightJsonEntry(
    string Title,
    string Description,
    string Category,
    List<string> Tags,
    SightJsonLocation Location,
    string Image350S3Key,
    string Image1024S3Key
);

public record SightJsonLocation(
    string Country,
    string State,
    string County,
    double[] Coordinates  // [latitude, longitude]
);
