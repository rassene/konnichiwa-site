namespace PersonalSite.Domain.Entities;

public sealed class ContactSubmission
{
    public Guid Id { get; set; }

    public required string Name { get; set; }
    public required string Email { get; set; }

    /// <summary>One of: general / collaboration / academic / work / other</summary>
    public required string Subject { get; set; }

    public required string Message { get; set; }
    public DateTime SubmittedAt { get; set; }

    /// <summary>SHA-256 hash of the submitter's IP address for rate limiting.</summary>
    public required string IpHash { get; set; }

    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }
}
