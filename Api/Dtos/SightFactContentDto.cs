namespace Api.Dtos;



public class SightFactContentDto
{
    public required string Title { get; set; }
    public List<SightFactItemDto> FunFacts { get; set; } = [];
    public List<SightFactItemDto> History { get; set; } = [];
    public List<SightFactItemDto> DontMiss { get; set; } = [];
    public List<SightFactPersonDto> People { get; set; } = [];
    public List<SightFactItemDto> HistoryContext { get; set; } = [];
}

public class SightFactItemDto
{
    public required string Emoji { get; set; }
    public required string Title { get; set; }
    public required string Text { get; set; }
}

public class SightFactPersonDto
{
    public required string Name { get; set; }
    public required string FunFact { get; set; }
}
