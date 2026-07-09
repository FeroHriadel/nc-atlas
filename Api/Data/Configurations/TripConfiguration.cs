using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;



namespace Api.Data.Configurations;



public class TripConfiguration : IEntityTypeConfiguration<Trip>
{
    public void Configure(EntityTypeBuilder<Trip> builder)
    {
        builder.ToTable("trips");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id");

        builder.Property(t => t.UserId).HasColumnName("user_id").IsRequired();

        builder.HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(t => t.Title)
            .HasColumnName("title")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(t => t.Note)
            .HasColumnName("note")
            .HasColumnType("nvarchar(max)");

        builder.Property(t => t.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("datetime2");

        builder.Property(t => t.UpdatedAt)
            .HasColumnName("updated_at")
            .HasColumnType("datetime2");

        builder.HasMany(t => t.Sights)
            .WithMany()
            .UsingEntity<TripSight>(
                j => j
                    .HasOne<Sight>()
                    .WithMany()
                    .HasForeignKey(ts => ts.SightId)
                    .OnDelete(DeleteBehavior.Cascade),
                j => j
                    .HasOne<Trip>()
                    .WithMany()
                    .HasForeignKey(ts => ts.TripId)
                    .OnDelete(DeleteBehavior.Cascade),
                j =>
                {
                    j.ToTable("trip_sights");
                    j.HasKey(ts => new { ts.TripId, ts.SightId });
                    j.Property(ts => ts.TripId).HasColumnName("trip_id");
                    j.Property(ts => ts.SightId).HasColumnName("sight_id");
                    j.Property(ts => ts.AddedAt).HasColumnName("added_at").HasColumnType("datetime2");
                });
    }
}
