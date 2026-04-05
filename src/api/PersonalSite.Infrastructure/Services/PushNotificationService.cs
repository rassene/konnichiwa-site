using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PersonalSite.Application.Interfaces;
using PersonalSite.Infrastructure.Persistence;
using WebPush;

namespace PersonalSite.Infrastructure.Services;

/// <summary>
/// Web Push implementation using the <c>WebPush</c> library and VAPID keys
/// stored in configuration under <c>WebPush:Subject</c>, <c>WebPush:PublicKey</c>,
/// <c>WebPush:PrivateKey</c> (from Azure Key Vault in production).
///
/// Sends push notifications to every active <see cref="Domain.Entities.OwnerPushSubscription"/>.
/// Failed subscriptions (gone/410) are soft-deleted.
/// </summary>
public sealed class PushNotificationService(
    ApplicationDbContext db,
    IConfiguration config,
    ILogger<PushNotificationService> logger) : IPushNotificationService
{
    public async Task SendToOwnerAsync(
        string title, string body, string? url = null, CancellationToken ct = default)
    {
        var subject    = config["WebPush:Subject"]    ?? "mailto:admin@example.com";
        var publicKey  = config["WebPush:PublicKey"]  ?? string.Empty;
        var privateKey = config["WebPush:PrivateKey"] ?? string.Empty;

        if (string.IsNullOrWhiteSpace(publicKey) || string.IsNullOrWhiteSpace(privateKey))
        {
            logger.LogWarning("WebPush keys not configured — skipping push notification.");
            return;
        }

        var subscriptions = await db.OwnerPushSubscriptions
            .Where(s => s.Active)
            .ToListAsync(ct);

        if (subscriptions.Count == 0) return;

        var vapidDetails = new VapidDetails(subject, publicKey, privateKey);
        var client       = new WebPushClient();

        var payload = System.Text.Json.JsonSerializer.Serialize(new
        {
            title,
            body,
            url = url ?? "/",
        });

        var toDeactivate = new List<Guid>();

        foreach (var sub in subscriptions)
        {
            try
            {
                var pushSub = new PushSubscription(
                    sub.Endpoint, sub.P256dhKey, sub.AuthKey);

                await client.SendNotificationAsync(pushSub, payload, vapidDetails);
                sub.LastUsedAt = DateTime.UtcNow;
            }
            catch (WebPushException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Gone)
            {
                // Subscription expired or unregistered on the browser side.
                toDeactivate.Add(sub.Id);
                logger.LogInformation("Push subscription {Id} is gone — deactivating.", sub.Id);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send push to subscription {Id}.", sub.Id);
            }
        }

        foreach (var id in toDeactivate)
        {
            var s = subscriptions.First(x => x.Id == id);
            s.Active = false;
        }

        await db.SaveChangesAsync(ct);
    }
}
