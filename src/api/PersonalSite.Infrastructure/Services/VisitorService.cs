using Microsoft.EntityFrameworkCore;
using PersonalSite.Application.Interfaces;
using PersonalSite.Domain.Entities;
using PersonalSite.Infrastructure.Persistence;

namespace PersonalSite.Infrastructure.Services;

/// <summary>
/// EF Core implementation of <see cref="IVisitorService"/>.
/// All visitor records are purged 12 months after first seen (GDPR).
/// </summary>
public sealed class VisitorService(ApplicationDbContext db) : IVisitorService
{
    public async Task<(bool returning, int visitCount)> IdentifyVisitorAsync(
        string fingerprint,
        string? pageUrl,
        string? countryCode,
        CancellationToken ct = default)
    {
        var existing = await db.Visitors
            .FirstOrDefaultAsync(v => v.Fingerprint == fingerprint, ct);

        if (existing is not null)
        {
            existing.VisitCount++;
            existing.LastSeenAt  = DateTime.UtcNow;
            existing.DataPurgeAt = existing.FirstSeenAt.AddYears(1);
            if (countryCode is not null) existing.CountryCode = countryCode;
            if (pageUrl      is not null) existing.CurrentPage  = pageUrl;

            await db.SaveChangesAsync(ct);
            return (returning: true, visitCount: existing.VisitCount);
        }

        var now = DateTime.UtcNow;
        var visitor = new Visitor
        {
            Id           = Guid.NewGuid(),
            Fingerprint  = fingerprint,
            FirstSeenAt  = now,
            LastSeenAt   = now,
            VisitCount   = 1,
            CountryCode  = countryCode,
            CurrentPage  = pageUrl,
            DataPurgeAt  = now.AddYears(1),
        };

        await db.Visitors.AddAsync(visitor, ct);
        await db.SaveChangesAsync(ct);
        return (returning: false, visitCount: 1);
    }

    public async Task<IReadOnlyList<ActiveVisitorDto>> GetActiveVisitorsAsync(
        int windowMinutes = 2,
        CancellationToken ct = default)
    {
        var cutoff = DateTime.UtcNow.AddMinutes(-windowMinutes);

        var rows = await db.Visitors
            .Where(v => v.LastSeenAt >= cutoff)
            .OrderByDescending(v => v.LastSeenAt)
            .Select(v => new ActiveVisitorDto(
                v.Fingerprint.Substring(0, 8),
                v.CurrentPage ?? "/",
                v.VisitCount,
                v.CountryCode,
                v.LastSeenAt))
            .ToListAsync(ct);

        return rows;
    }
}
