using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;



namespace Api.Data.Configurations;



public class GalleryImageConfiguration : IEntityTypeConfiguration<GalleryImage>
{
    public void Configure(EntityTypeBuilder<GalleryImage> builder)
    {
        builder.ToTable("gallery_images");

        builder.HasKey(g => g.Id);
        builder.Property(g => g.Id).HasColumnName("id");

        builder.Property(g => g.SightId).HasColumnName("sight_id").IsRequired();

        builder.HasOne(g => g.Sight)
            .WithMany()
            .HasForeignKey(g => g.SightId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(g => g.ImageUrl)
            .HasColumnName("image_url")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(g => g.ThumbnailUrl)
            .HasColumnName("thumbnail_url")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(g => g.Comment)
            .HasColumnName("comment")
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(g => g.UploadedByUserId).HasColumnName("uploaded_by_user_id").IsRequired();

        builder.HasOne(g => g.UploadedByUser)
            .WithMany()
            .HasForeignKey(g => g.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(g => g.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("datetime2");
    }
}
