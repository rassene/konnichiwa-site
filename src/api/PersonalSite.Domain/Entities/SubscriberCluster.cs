namespace PersonalSite.Domain.Entities;

/// <summary>Join table: Subscriber ↔ InterestCluster (by slug).</summary>
public sealed class SubscriberCluster
{
    public Guid SubscriberId { get; set; }
    public Subscriber Subscriber { get; set; } = null!;

    /// <summary>Interest cluster slug (e.g. "tech-and-code").</summary>
    public required string ClusterSlug { get; set; }
}
