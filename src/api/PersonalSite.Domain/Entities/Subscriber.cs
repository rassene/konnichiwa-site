namespace PersonalSite.Domain.Entities;

public sealed class Subscriber
{
    public Guid Id { get; set; }
    public required string Email { get; set; }

    /// <summary>Null until double opt-in is confirmed.</summary>
    public DateTime? ConfirmedAt { get; set; }

    public DateTime? LastAccessAt { get; set; }

    /// <summary>SHA-256 hash of the current access JWT.</summary>
    public string? TokenHash { get; set; }

    public DateTime? TokenExpiry { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    public ICollection<SubscriberCluster> Clusters { get; set; } = [];
}
