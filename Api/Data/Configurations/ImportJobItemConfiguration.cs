using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;



namespace Api.Data.Configurations;



public class ImportJobItemConfiguration : IEntityTypeConfiguration<ImportJobItem>
{
    public void Configure(EntityTypeBuilder<ImportJobItem> builder)
    {
        builder.ToTable("import_job_items");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");

        builder.Property(i => i.JobId).HasColumnName("job_id");

        builder.Property(i => i.SightTitle)
            .HasColumnName("sight_title")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(i => i.SightDescription)
            .HasColumnName("sight_description")
            .HasColumnType("nvarchar(max)");

        builder.Property(i => i.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(i => i.ErrorMessage)
            .HasColumnName("error_message")
            .HasColumnType("nvarchar(max)");

        builder.Property(i => i.SightId).HasColumnName("sight_id");
        builder.Property(i => i.CategoryName).HasColumnName("category_name").HasMaxLength(100);
        builder.Property(i => i.Tags).HasColumnName("tags").HasMaxLength(500);
        builder.Property(i => i.Latitude).HasColumnName("latitude");
        builder.Property(i => i.Longitude).HasColumnName("longitude");
        builder.Property(i => i.Image350Url).HasColumnName("image_350_url").HasColumnType("nvarchar(max)");
    }
}
