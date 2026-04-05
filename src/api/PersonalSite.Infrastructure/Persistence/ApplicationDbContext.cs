using Microsoft.EntityFrameworkCore;
using PersonalSite.Domain.Entities;

namespace PersonalSite.Infrastructure.Persistence;

/// <summary>
/// EF Core DbContext for all operational data (Azure SQL).
/// Connection string is injected via options from PersonalSite.Api/Program.cs —
/// Infrastructure has no direct access to IConfiguration.
/// </summary>
public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : DbContext(options)
{
    public DbSet<Visitor> Visitors => Set<Visitor>();
    public DbSet<ContactSubmission> ContactSubmissions => Set<ContactSubmission>();
    public DbSet<Subscriber> Subscribers => Set<Subscriber>();
    public DbSet<SubscriberCluster> SubscriberClusters => Set<SubscriberCluster>();
    public DbSet<PendingSubscription> PendingSubscriptions => Set<PendingSubscription>();
    public DbSet<OwnerPushSubscription> OwnerPushSubscriptions => Set<OwnerPushSubscription>();
    public DbSet<OwnerSession> OwnerSessions => Set<OwnerSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Visitor
        modelBuilder.Entity<Visitor>(e =>
        {
            e.HasKey(v => v.Id);
            e.Property(v => v.Fingerprint).HasMaxLength(64).IsRequired();
            e.HasIndex(v => v.Fingerprint).IsUnique();
            e.HasIndex(v => v.DataPurgeAt); // for purge background job
            e.Property(v => v.CountryCode).HasMaxLength(2);
            e.Property(v => v.CurrentPage).HasMaxLength(500);
        });

        // ContactSubmission
        modelBuilder.Entity<ContactSubmission>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Name).HasMaxLength(100).IsRequired();
            e.Property(c => c.Email).HasMaxLength(254).IsRequired();
            e.Property(c => c.Subject).HasMaxLength(20).IsRequired();
            e.Property(c => c.Message).HasMaxLength(1000).IsRequired();
            e.Property(c => c.IpHash).HasMaxLength(64).IsRequired();
        });

        // Subscriber
        modelBuilder.Entity<Subscriber>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.Email).HasMaxLength(254).IsRequired();
            e.HasIndex(s => s.Email).IsUnique();
            e.Property(s => s.TokenHash).HasMaxLength(64);
            e.HasMany(s => s.Clusters)
             .WithOne(sc => sc.Subscriber)
             .HasForeignKey(sc => sc.SubscriberId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // SubscriberCluster — composite PK
        modelBuilder.Entity<SubscriberCluster>(e =>
        {
            e.HasKey(sc => new { sc.SubscriberId, sc.ClusterSlug });
            e.Property(sc => sc.ClusterSlug).HasMaxLength(50).IsRequired();
        });

        // PendingSubscription
        modelBuilder.Entity<PendingSubscription>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Email).HasMaxLength(254).IsRequired();
            e.Property(p => p.ConfirmToken).HasMaxLength(64).IsRequired();
            e.HasIndex(p => p.ConfirmToken).IsUnique();
        });

        // OwnerPushSubscription
        modelBuilder.Entity<OwnerPushSubscription>(e =>
        {
            e.HasKey(o => o.Id);
            e.Property(o => o.Endpoint).HasMaxLength(500).IsRequired();
            e.HasIndex(o => o.Endpoint).IsUnique();
            e.Property(o => o.P256dhKey).HasMaxLength(200).IsRequired();
            e.Property(o => o.AuthKey).HasMaxLength(100).IsRequired();
        });

        // OwnerSession
        modelBuilder.Entity<OwnerSession>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.RefreshTokenHash).HasMaxLength(64).IsRequired();
            e.HasIndex(s => s.RefreshTokenHash).IsUnique();
            e.Property(s => s.UserAgent).HasMaxLength(300);
        });
    }
}
