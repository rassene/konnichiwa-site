namespace PersonalSite.Domain.Entities;

public sealed class OwnerPushSubscription
{
    public Guid Id { get; set; }
    public required string Endpoint { get; set; }

    /// <summary>Base64url-encoded P-256 DH public key.</summary>
    public required string P256dhKey { get; set; }

    /// <summary>Base64url-encoded auth secret.</summary>
    public required string AuthKey { get; set; }

    public DateTime RegisteredAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public bool Active { get; set; } = true;
}
