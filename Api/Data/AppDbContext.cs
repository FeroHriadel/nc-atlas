using Api.Models;
using Microsoft.EntityFrameworkCore;



namespace Api.Data;



public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Sight> Sights => Set<Sight>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<SightImage> SightImages => Set<SightImage>();
    public DbSet<User> Users => Set<User>();
    public DbSet<ImportJob> ImportJobs => Set<ImportJob>();
    public DbSet<ImportJobItem> ImportJobItems => Set<ImportJobItem>();
    public DbSet<SightFact> SightFacts => Set<SightFact>();
    public DbSet<SightFactJob> SightFactJobs => Set<SightFactJob>();
    public DbSet<Trip> Trips => Set<Trip>();
    public DbSet<GalleryImage> GalleryImages => Set<GalleryImage>();
    public DbSet<SightComment> SightComments => Set<SightComment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
