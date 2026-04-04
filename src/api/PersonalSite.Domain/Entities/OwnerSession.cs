namespace PersonalSite.Domain.Entities;

/// <summary>Admin PWA refresh token record. Expires 30 days after issuance.</summary>
public sealed class OwnerSession
{
    public Guid Id { get; set; }

    /// <summary>SHA-256 hash of the refresh token.</summary>
    public required string RefreshTokenHash { get; set; }

    public DateTime IssuedAt { get; set; }

    /// <summary>IssuedAt + 30 days.</summary>
    public DateTime ExpiresAt { get; set; }

    public DateTime? RevokedAt { get; set; }
    public string? UserAgent { get; set; }
}
