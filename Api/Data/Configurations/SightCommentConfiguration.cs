using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;



namespace Api.Data.Configurations;



public class SightCommentConfiguration : IEntityTypeConfiguration<SightComment>
{
    public void Configure(EntityTypeBuilder<SightComment> builder)
    {
        builder.ToTable("sight_comments");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");

        builder.Property(c => c.SightId).HasColumnName("sight_id").IsRequired();

        builder.HasOne(c => c.Sight)
            .WithMany()
            .HasForeignKey(c => c.SightId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(c => c.Text)
            .HasColumnName("text")
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(c => c.ImageUrl)
            .HasColumnName("image_url")
            .HasMaxLength(500);

        builder.Property(c => c.UserId).HasColumnName("user_id").IsRequired();

        builder.HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(c => c.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("datetime2");
    }
}
