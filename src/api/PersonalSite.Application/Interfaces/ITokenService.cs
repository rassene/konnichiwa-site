namespace PersonalSite.Application.Interfaces;

/// <summary>
/// Issues and validates JWTs for subscribers and the owner.
/// Implementation lives in PersonalSite.Infrastructure.
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// Issue a 30-day subscriber JWT containing <paramref name="subscriberId"/> and <paramref name="clusters"/>.
    /// </summary>
    string IssueSubscriberToken(Guid subscriberId, string[] clusters);

    /// <summary>
    /// Issue a 15-minute owner JWT (role: owner).
    /// </summary>
    string IssueOwnerToken();

    /// <summary>
    /// Validate a token. Returns claims if valid; null if invalid or expired.
    /// </summary>
    TokenClaims? ValidateToken(string token);
}

/// <summary>Decoded claims extracted from a validated JWT.</summary>
public sealed record TokenClaims(
    Guid SubjectId,
    string Role,
    string[] Clusters,
    DateTime ExpiresAt);
