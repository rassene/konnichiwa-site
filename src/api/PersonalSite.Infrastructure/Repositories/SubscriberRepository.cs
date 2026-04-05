using Microsoft.EntityFrameworkCore;
using PersonalSite.Application.Interfaces;
using PersonalSite.Domain.Entities;
using PersonalSite.Infrastructure.Persistence;

namespace PersonalSite.Infrastructure.Repositories;

/// <summary>EF Core implementation of <see cref="ISubscriberRepository"/>.</summary>
public sealed class SubscriberRepository(ApplicationDbContext db) : ISubscriberRepository
{
    public Task<Subscriber?> GetByEmailAsync(string email, CancellationToken ct = default)
        => db.Subscribers
             .Include(s => s.Clusters)
             .FirstOrDefaultAsync(s => s.Email == email, ct);

    public Task<Subscriber?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => db.Subscribers
             .Include(s => s.Clusters)
             .FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task AddAsync(Subscriber subscriber, CancellationToken ct = default)
    {
        await db.Subscribers.AddAsync(subscriber, ct);
        await db.SaveChangesAsync(ct);
    }

    public Task UpdateAsync(Subscriber subscriber, CancellationToken ct = default)
    {
        db.Subscribers.Update(subscriber);
        return db.SaveChangesAsync(ct);
    }

    public Task<PendingSubscription?> GetPendingByTokenAsync(string confirmToken, CancellationToken ct = default)
        => db.PendingSubscriptions
             .FirstOrDefaultAsync(p => p.ConfirmToken == confirmToken, ct);

    public async Task AddPendingAsync(PendingSubscription pending, CancellationToken ct = default)
    {
        await db.PendingSubscriptions.AddAsync(pending, ct);
        await db.SaveChangesAsync(ct);
    }

    public async Task RemovePendingAsync(PendingSubscription pending, CancellationToken ct = default)
    {
        db.PendingSubscriptions.Remove(pending);
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<Subscriber>> GetActiveByClusterSlugsAsync(
        string[] clusterSlugs,
        CancellationToken ct = default)
    {
        return await db.Subscribers
            .Include(s => s.Clusters)
            .Where(s => s.Active
                     && s.ConfirmedAt != null
                     && s.Clusters.Any(sc => clusterSlugs.Contains(sc.ClusterSlug)))
            .ToListAsync(ct);
    }

    public async Task<(int total, IReadOnlyList<Subscriber> items)> ListAsync(
        string? clusterFilter, int page, int pageSize, CancellationToken ct = default)
    {
        var query = db.Subscribers.Include(s => s.Clusters).AsQueryable();
        if (!string.IsNullOrWhiteSpace(clusterFilter))
            query = query.Where(s => s.Clusters.Any(sc => sc.ClusterSlug == clusterFilter));

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (total, items);
    }
}
