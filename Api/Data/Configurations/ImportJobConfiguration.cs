using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;



namespace Api.Data.Configurations;



public class ImportJobConfiguration : IEntityTypeConfiguration<ImportJob>
{
    public void Configure(EntityTypeBuilder<ImportJob> builder)
    {
        builder.ToTable("import_jobs");

        builder.HasKey(j => j.Id);
        builder.Property(j => j.Id).HasColumnName("id");

        builder.Property(j => j.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(j => j.TotalCount).HasColumnName("total_count");
        builder.Property(j => j.ProcessedCount).HasColumnName("processed_count");
        builder.Property(j => j.SucceededCount).HasColumnName("succeeded_count");
        builder.Property(j => j.FailedCount).HasColumnName("failed_count");
        builder.Property(j => j.SkippedCount).HasColumnName("skipped_count");
        builder.Property(j => j.AbortRequested).HasColumnName("abort_requested");

        builder.Property(j => j.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("datetime2");

        builder.Property(j => j.CompletedAt)
            .HasColumnName("completed_at")
            .HasColumnType("datetime2");

        builder.HasMany(j => j.Items)
            .WithOne(i => i.Job)
            .HasForeignKey(i => i.JobId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
