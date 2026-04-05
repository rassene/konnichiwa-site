using PersonalSite.Domain.Entities;

namespace PersonalSite.Application.Interfaces;

/// <summary>
/// Persistence interface for <see cref="ContactSubmission"/> — implemented in Infrastructure.
/// </summary>
public interface IContactRepository
{
    Task AddAsync(ContactSubmission submission, CancellationToken cancellationToken = default);

    // ── Admin queries ─────────────────────────────────────────────────────────

    Task<(int total, IReadOnlyList<ContactSubmission> items)> ListAsync(
        int page, int pageSize, bool unreadOnly, CancellationToken ct = default);

    Task<ContactSubmission?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task UpdateAsync(ContactSubmission submission, CancellationToken ct = default);
}
