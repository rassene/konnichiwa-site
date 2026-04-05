using Microsoft.Extensions.Configuration;
using PersonalSite.Application.Interfaces;
using PersonalSite.Domain.Entities;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace PersonalSite.Infrastructure.Services;

/// <summary>
/// Orchestrates the subscriber lifecycle: initiate, confirm, verify, unsubscribe.
/// Called by Application use case handlers; never invoked directly from controllers.
/// </summary>
public sealed class SubscriptionService(
    ISubscriberRepository repo,
    ITokenService tokenService,
    IEmailService emailService,
    IConfiguration config) : ISubscriptionService
{
    // Renewal window: re-issue token if fewer than this many days remain.
    private static readonly TimeSpan RenewalWindow = TimeSpan.FromDays(7);

    /// <inheritdoc />
    public async Task InitiateAsync(string email, string[] clusterSlugs, CancellationToken ct = default)
    {
        var existing = await repo.GetByEmailAsync(email, ct);
        if (existing is { Active: true, ConfirmedAt: not null })
            throw new InvalidOperationException("This email already has an active subscription.");

        // Remove any stale pending record for this email before creating a new one.
        // (Allows re-subscribe after a previous confirm link expired.)

        var confirmToken = GenerateUrlSafeToken();
        var pending = new PendingSubscription
        {
            Id           = Guid.NewGuid(),
            Email        = email,
            ConfirmToken = confirmToken,
            ClusterSlugs = JsonSerializer.Serialize(clusterSlugs),
            CreatedAt    = DateTime.UtcNow,
            ExpiresAt    = DateTime.UtcNow.AddHours(24),
        };

        await repo.AddPendingAsync(pending, ct);

        var baseUrl    = config["App:BaseUrl"] ?? "http://localhost:5000";
        var confirmUrl = $"{baseUrl}/api/newsletter/confirm?token={Uri.EscapeDataString(confirmToken)}";

        await emailService.SendSubscriberConfirmationAsync(email, confirmUrl, ct);
    }

    /// <inheritdoc />
    public async Task<ConfirmResult> ConfirmAsync(string confirmToken, CancellationToken ct = default)
    {
        var pending = await repo.GetPendingByTokenAsync(confirmToken, ct)
            ?? throw new KeyNotFoundException("Confirmation token is invalid or has already been used.");

        if (pending.ExpiresAt < DateTime.UtcNow)
        {
            await repo.RemovePendingAsync(pending, ct);
            throw new KeyNotFoundException("Confirmation token has expired. Please subscribe again.");
        }

        var clusterSlugs = JsonSerializer.Deserialize<string[]>(pending.ClusterSlugs) ?? [];

        var subscriber = await repo.GetByEmailAsync(pending.Email, ct);
        if (subscriber is { ConfirmedAt: not null })
        {
            await repo.RemovePendingAsync(pending, ct);
            throw new InvalidOperationException("This email has already been confirmed.");
        }

        var now = DateTime.UtcNow;

        if (subscriber is null)
        {
            subscriber = new Subscriber
            {
                Id          = Guid.NewGuid(),
                Email       = pending.Email,
                ConfirmedAt = now,
                Active      = true,
                CreatedAt   = now,
            };

            foreach (var slug in clusterSlugs)
                subscriber.Clusters.Add(new SubscriberCluster { SubscriberId = subscriber.Id, ClusterSlug = slug });

            var jwt = tokenService.IssueSubscriberToken(subscriber.Id, clusterSlugs);
            subscriber.TokenHash   = HashToken(jwt);
            subscriber.TokenExpiry = now.AddDays(30);

            await repo.AddAsync(subscriber, ct);
            await repo.RemovePendingAsync(pending, ct);

            return new ConfirmResult(jwt, clusterSlugs);
        }
        else
        {
            // Subscriber existed but was unconfirmed (e.g. re-subscribe after unsubscribe).
            subscriber.ConfirmedAt  = now;
            subscriber.Active       = true;
            subscriber.LastAccessAt = now;

            // Replace cluster selections.
            subscriber.Clusters.Clear();
            foreach (var slug in clusterSlugs)
                subscriber.Clusters.Add(new SubscriberCluster { SubscriberId = subscriber.Id, ClusterSlug = slug });

            var jwt = tokenService.IssueSubscriberToken(subscriber.Id, clusterSlugs);
            subscriber.TokenHash   = HashToken(jwt);
            subscriber.TokenExpiry = now.AddDays(30);

            await repo.UpdateAsync(subscriber, ct);
            await repo.RemovePendingAsync(pending, ct);

            return new ConfirmResult(jwt, clusterSlugs);
        }
    }

    /// <inheritdoc />
    public async Task<VerifyResult?> VerifyTokenAsync(string token, CancellationToken ct = default)
    {
        var claims = tokenService.ValidateToken(token);
        if (claims is null || claims.Role != "subscriber")
            return null;

        var subscriber = await repo.GetByIdAsync(claims.SubjectId, ct);
        if (subscriber is null || !subscriber.Active || subscriber.ConfirmedAt is null)
            return null;

        // Verify the stored token hash matches (prevents use of revoked tokens).
        if (subscriber.TokenHash != HashToken(token))
            return null;

        subscriber.LastAccessAt = DateTime.UtcNow;

        // Sliding-window renewal: if ≤7 days remain, issue a fresh 30-day token.
        string? newToken = null;
        var timeRemaining = claims.ExpiresAt - DateTime.UtcNow;
        if (timeRemaining <= RenewalWindow)
        {
            var clusters   = subscriber.Clusters.Select(c => c.ClusterSlug).ToArray();
            newToken       = tokenService.IssueSubscriberToken(subscriber.Id, clusters);
            subscriber.TokenHash   = HashToken(newToken);
            subscriber.TokenExpiry = DateTime.UtcNow.AddDays(30);
        }

        await repo.UpdateAsync(subscriber, ct);

        var activeClusters = subscriber.Clusters.Select(c => c.ClusterSlug).ToArray();
        var expiresAt      = newToken is not null ? subscriber.TokenExpiry!.Value : claims.ExpiresAt;

        return new VerifyResult(true, activeClusters, expiresAt, newToken);
    }

    /// <inheritdoc />
    public async Task UnsubscribeAsync(string subscriberJwt, CancellationToken ct = default)
    {
        var claims = tokenService.ValidateToken(subscriberJwt);
        if (claims is null || claims.Role != "subscriber")
            throw new UnauthorizedAccessException("Invalid subscriber token.");

        var subscriber = await repo.GetByIdAsync(claims.SubjectId, ct)
            ?? throw new UnauthorizedAccessException("Subscriber not found.");

        subscriber.Active      = false;
        subscriber.TokenHash   = null;
        subscriber.TokenExpiry = null;

        await repo.UpdateAsync(subscriber, ct);
    }

    private static string GenerateUrlSafeToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(48);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexStringLower(bytes);
    }
}
