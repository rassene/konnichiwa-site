namespace PersonalSite.Domain.Entities;

/// <summary>Double opt-in record. Expires 24 hours after creation.</summary>
public sealed class PendingSubscription
{
    public Guid Id { get; set; }
    public required string Email { get; set; }

    /// <summary>Random URL-safe token sent in the confirmation email.</summary>
    public required string ConfirmToken { get; set; }

    /// <summary>JSON array of interest cluster slugs selected at sign-up.</summary>
    public required string ClusterSlugs { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>CreatedAt + 24 hours.</summary>
    public DateTime ExpiresAt { get; set; }
}
