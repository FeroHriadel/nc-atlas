using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;



namespace Api.Data.Configurations;



public class SightImageConfiguration : IEntityTypeConfiguration<SightImage>
{
    public void Configure(EntityTypeBuilder<SightImage> builder)
    {
        builder.ToTable("sight_images");

        builder.HasKey(si => si.Id);
        builder.Property(si => si.Id).HasColumnName("id");

        builder.Property(si => si.SightId)
            .HasColumnName("sight_id")
            .IsRequired();

        builder.HasOne(si => si.Sight)
            .WithMany(s => s.Images)
            .HasForeignKey(si => si.SightId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(si => si.ImageUrl)
            .HasColumnName("image_url")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(si => si.SortOrder)
            .HasColumnName("sort_order");
    }
}
