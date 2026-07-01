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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
