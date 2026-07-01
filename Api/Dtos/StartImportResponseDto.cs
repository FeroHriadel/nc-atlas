namespace Api.Dtos;



public class StartImportResponseDto
{
    public Guid JobId { get; set; }
    public int TotalCount { get; set; }
    public int SkippedCount { get; set; }
    public List<string> Skipped { get; set; } = [];
}
