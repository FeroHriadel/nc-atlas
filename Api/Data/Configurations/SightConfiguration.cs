using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;



namespace Api.Data.Configurations;



public class SightConfiguration : IEntityTypeConfiguration<Sight>
{
    public void Configure(EntityTypeBuilder<Sight> builder)
    {
        builder.ToTable("sights");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");

        builder.Property(s => s.Title)
            .HasColumnName("title")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(s => s.Description)
            .HasColumnName("description")
            .HasColumnType("nvarchar(max)")
            .IsRequired();

        builder.Property(s => s.CategoryId)
            .HasColumnName("category_id")
            .IsRequired();

        builder.HasOne(s => s.Category)
            .WithMany()
            .HasForeignKey(s => s.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(s => s.Location)
            .HasColumnName("location")
            .HasColumnType("geography")
            .IsRequired();

        builder.Property(s => s.RatingAvg)
            .HasColumnName("rating_avg")
            .HasColumnType("decimal(3,2)");

        builder.Property(s => s.RatingCount)
            .HasColumnName("rating_count");

        builder.Property(s => s.Source)
            .HasColumnName("source")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("datetime2");

        // Spatial index on `location` is added via raw SQL in the migration —
        // EF Core's Fluent API has no native support for SQL Server spatial indexes.

        builder.HasMany(s => s.Tags)
            .WithMany(t => t.Sights)
            .UsingEntity<SightTag>(
                j => j
                    .HasOne<Tag>()
                    .WithMany()
                    .HasForeignKey(st => st.TagId),
                j => j
                    .HasOne<Sight>()
                    .WithMany()
                    .HasForeignKey(st => st.SightId),
                j =>
                {
                    j.ToTable("sight_tags");
                    j.HasKey(st => new { st.SightId, st.TagId });
                    j.Property(st => st.SightId).HasColumnName("sight_id");
                    j.Property(st => st.TagId).HasColumnName("tag_id");
                });
    }
}
