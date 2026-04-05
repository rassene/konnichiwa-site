namespace PersonalSite.Application.Interfaces;

/// <summary>
/// Handles owner authentication: login, refresh, and logout.
/// Implementation in PersonalSite.Infrastructure.
/// </summary>
public interface IAdminAuthService
{
    /// <summary>
    /// Validate owner credentials against configuration.
    /// Issues a 15-minute access JWT and persists a hashed refresh token session.
    /// </summary>
    Task<AdminLoginResult?> LoginAsync(
        string email, string password, string? userAgent, CancellationToken ct = default);

    /// <summary>
    /// Exchange a refresh token for a new access JWT.
    /// Returns null if the refresh token is invalid, expired, or revoked.
    /// </summary>
    Task<AdminLoginResult?> RefreshAsync(string refreshToken, CancellationToken ct = default);

    /// <summary>Revoke a refresh token session (logout).</summary>
    Task LogoutAsync(string refreshToken, CancellationToken ct = default);
}

/// <summary>Result returned on successful login or refresh.</summary>
public sealed record AdminLoginResult(
    string AccessToken,
    DateTime ExpiresAt,
    string RefreshToken);
