using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;



namespace Api.Data.Configurations;



public class SightFactConfiguration : IEntityTypeConfiguration<SightFact>
{
    public void Configure(EntityTypeBuilder<SightFact> builder)
    {
        builder.ToTable("sight_facts");

        builder.HasKey(f => f.Id);
        builder.Property(f => f.Id).HasColumnName("id");

        builder.Property(f => f.SightId).HasColumnName("sight_id").IsRequired();

        builder.HasOne(f => f.Sight)
            .WithMany()
            .HasForeignKey(f => f.SightId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(f => f.SightId).IsUnique();

        builder.Property(f => f.Content)
            .HasColumnName("content")
            .HasColumnType("nvarchar(max)")
            .IsRequired();

        builder.Property(f => f.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("datetime2");

        builder.Property(f => f.UpdatedAt)
            .HasColumnName("updated_at")
            .HasColumnType("datetime2");
    }
}
