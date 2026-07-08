using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;



namespace Api.Data.Configurations;



public class SightFactJobConfiguration : IEntityTypeConfiguration<SightFactJob>
{
    public void Configure(EntityTypeBuilder<SightFactJob> builder)
    {
        builder.ToTable("sight_fact_jobs");

        builder.HasKey(j => j.Id);
        builder.Property(j => j.Id).HasColumnName("id");

        builder.Property(j => j.SightId).HasColumnName("sight_id").IsRequired();

        builder.HasOne(j => j.Sight)
            .WithMany()
            .HasForeignKey(j => j.SightId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(j => j.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(j => j.PreviousJobId).HasColumnName("previous_job_id");

        builder.HasOne<SightFactJob>()
            .WithMany()
            .HasForeignKey(j => j.PreviousJobId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(j => j.Feedback)
            .HasColumnName("feedback")
            .HasColumnType("nvarchar(max)");

        builder.Property(j => j.Result)
            .HasColumnName("result")
            .HasColumnType("nvarchar(max)");

        builder.Property(j => j.ErrorMessage)
            .HasColumnName("error_message")
            .HasColumnType("nvarchar(max)");

        builder.Property(j => j.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("datetime2");

        builder.Property(j => j.CompletedAt)
            .HasColumnName("completed_at")
            .HasColumnType("datetime2");

        builder.Property(j => j.SavedAt)
            .HasColumnName("saved_at")
            .HasColumnType("datetime2");

        // fetching the latest job per sight is the hot path (page load + resumability polling)
        builder.HasIndex(j => new { j.SightId, j.CreatedAt });
    }
}
