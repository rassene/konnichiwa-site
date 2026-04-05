using PersonalSite.Domain.Entities;

namespace PersonalSite.Application.Interfaces;

/// <summary>
/// Data access contract for subscriber-related entities.
/// Implementation lives in PersonalSite.Infrastructure.
/// </summary>
public interface ISubscriberRepository
{
    Task<Subscriber?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<Subscriber?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Subscriber subscriber, CancellationToken ct = default);
    Task UpdateAsync(Subscriber subscriber, CancellationToken ct = default);

    Task<PendingSubscription?> GetPendingByTokenAsync(string confirmToken, CancellationToken ct = default);
    Task AddPendingAsync(PendingSubscription pending, CancellationToken ct = default);
    Task RemovePendingAsync(PendingSubscription pending, CancellationToken ct = default);

    /// <summary>
    /// Return active subscribers whose cluster slugs overlap with <paramref name="clusterSlugs"/>.
    /// Used by the newsletter dispatch job.
    /// </summary>
    Task<IReadOnlyList<Subscriber>> GetActiveByClusterSlugsAsync(
        string[] clusterSlugs,
        CancellationToken ct = default);

    // ── Admin queries ─────────────────────────────────────────────────────────

    Task<(int total, IReadOnlyList<Subscriber> items)> ListAsync(
        string? clusterFilter, int page, int pageSize, CancellationToken ct = default);
}
