namespace PersonalSite.Application.Interfaces;

/// <summary>
/// Orchestrates the full subscriber lifecycle: initiate, confirm, verify, unsubscribe.
/// Implementation lives in PersonalSite.Infrastructure.
/// </summary>
public interface ISubscriptionService
{
    /// <summary>
    /// Create a <c>PendingSubscription</c> record and send the double opt-in email.
    /// Throws <see cref="InvalidOperationException"/> if the email already has an active subscription.
    /// </summary>
    Task InitiateAsync(string email, string[] clusterSlugs, CancellationToken ct = default);

    /// <summary>
    /// Consume the confirm token, activate or create the <c>Subscriber</c>, and issue a JWT.
    /// Throws <see cref="KeyNotFoundException"/> if the token is missing or expired.
    /// Throws <see cref="InvalidOperationException"/> if the email is already confirmed.
    /// </summary>
    Task<ConfirmResult> ConfirmAsync(string confirmToken, CancellationToken ct = default);

    /// <summary>
    /// Validate a subscriber JWT. Applies sliding-window renewal (≤7 days remaining → issue fresh token).
    /// Returns null if the token is invalid or the subscriber is inactive.
    /// </summary>
    Task<VerifyResult?> VerifyTokenAsync(string token, CancellationToken ct = default);

    /// <summary>
    /// Mark the subscriber as inactive. Requires a valid subscriber JWT to identify the caller.
    /// Throws <see cref="UnauthorizedAccessException"/> if the JWT is invalid.
    /// </summary>
    Task UnsubscribeAsync(string subscriberJwt, CancellationToken ct = default);
}

/// <summary>Result of a successful confirmation.</summary>
public sealed record ConfirmResult(string AccessToken, string[] Clusters);

/// <summary>Result of a successful token verification.</summary>
public sealed record VerifyResult(bool Valid, string[] Clusters, DateTime ExpiresAt, string? NewToken = null);
