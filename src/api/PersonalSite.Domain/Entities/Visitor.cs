namespace PersonalSite.Domain.Entities;

public sealed class Visitor
{
    public Guid Id { get; set; }

    /// <summary>SHA-256 hash of the browser fingerprint.</summary>
    public required string Fingerprint { get; set; }

    public DateTime FirstSeenAt { get; set; }
    public DateTime LastSeenAt { get; set; }
    public int VisitCount { get; set; } = 1;

    /// <summary>ISO 3166-1 alpha-2 country code derived from IP geolocation.</summary>
    public string? CountryCode { get; set; }

    /// <summary>Scheduled purge date: FirstSeenAt + 12 months.</summary>
    public DateTime DataPurgeAt { get; set; }
}
