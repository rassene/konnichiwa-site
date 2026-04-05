namespace PersonalSite.Application.Interfaces;

/// <summary>
/// Manages visitor fingerprint records.
/// Implementation lives in PersonalSite.Infrastructure.
/// </summary>
public interface IVisitorService
{
    /// <summary>
    /// Upsert a visitor by fingerprint hash.
    /// Increments visit count on subsequent visits and resets DataPurgeAt to now + 12 months.
    /// </summary>
    /// <returns>
    /// <c>returning</c> = true when the fingerprint was already known;
    /// <c>visitCount</c> = total number of visits for this fingerprint.
    /// </returns>
    Task<(bool returning, int visitCount)> IdentifyVisitorAsync(
        string fingerprint,
        string? pageUrl,
        string? countryCode,
        CancellationToken ct = default);

    /// <summary>
    /// Returns visitors whose last heartbeat was within the past
    /// <paramref name="windowMinutes"/> minutes (for the real-time dashboard).
    /// </summary>
    Task<IReadOnlyList<ActiveVisitorDto>> GetActiveVisitorsAsync(
        int windowMinutes = 2,
        CancellationToken ct = default);
}

/// <summary>Projection used by the admin dashboard for active visitor display.</summary>
public sealed record ActiveVisitorDto(
    string FingerprintPreview,  // first 8 chars only
    string CurrentPage,
    int VisitCount,
    string? CountryCode,
    DateTime LastSeenAt);
