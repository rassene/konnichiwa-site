using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PersonalSite.Application.Interfaces;
using PersonalSite.Domain.Entities;
using PersonalSite.Infrastructure.Persistence;
using System.Security.Cryptography;
using System.Text;

namespace PersonalSite.Infrastructure.Services;

/// <summary>
/// Owner authentication service.
/// Credentials (hashed email + password) are stored in configuration under
/// <c>Owner:EmailHash</c> and <c>Owner:PasswordHash</c> (SHA-256 hex).
/// Refresh tokens are random 32-byte values stored hashed in <see cref="OwnerSession"/>.
/// </summary>
public sealed class AdminAuthService(
    ApplicationDbContext db,
    ITokenService tokenService,
    IConfiguration config) : IAdminAuthService
{
    public async Task<AdminLoginResult?> LoginAsync(
        string email, string password, string? userAgent, CancellationToken ct = default)
    {
        var expectedEmailHash    = config["Owner:EmailHash"]    ?? string.Empty;
        var expectedPasswordHash = config["Owner:PasswordHash"] ?? string.Empty;

        if (!ConstantTimeEquals(Sha256Hex(email), expectedEmailHash)
            || !ConstantTimeEquals(Sha256Hex(password), expectedPasswordHash))
        {
            return null;
        }

        return await IssueSessionAsync(userAgent, ct);
    }

    public async Task<AdminLoginResult?> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        var hash = Sha256Hex(refreshToken);
        var session = await db.OwnerSessions
            .FirstOrDefaultAsync(s =>
                s.RefreshTokenHash == hash
                && s.RevokedAt == null
                && s.ExpiresAt > DateTime.UtcNow, ct);

        if (session is null) return null;

        // Rotate: revoke old session, issue new one.
        session.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return await IssueSessionAsync(session.UserAgent, ct);
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        var hash = Sha256Hex(refreshToken);
        var session = await db.OwnerSessions
            .FirstOrDefaultAsync(s => s.RefreshTokenHash == hash && s.RevokedAt == null, ct);

        if (session is null) return;

        session.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<AdminLoginResult> IssueSessionAsync(string? userAgent, CancellationToken ct)
    {
        var accessToken    = tokenService.IssueOwnerToken();
        var refreshToken   = GenerateRefreshToken();
        var now            = DateTime.UtcNow;

        var session = new OwnerSession
        {
            Id                = Guid.NewGuid(),
            RefreshTokenHash  = Sha256Hex(refreshToken),
            IssuedAt          = now,
            ExpiresAt         = now.AddDays(30),
            UserAgent         = userAgent,
        };

        await db.OwnerSessions.AddAsync(session, ct);
        await db.SaveChangesAsync(ct);

        return new AdminLoginResult(accessToken, now.AddMinutes(15), refreshToken);
    }

    private static string GenerateRefreshToken()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }

    private static string Sha256Hex(string input)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexStringLower(hash);
    }

    private static bool ConstantTimeEquals(string a, string b)
        => CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(a),
            Encoding.UTF8.GetBytes(b));
}
