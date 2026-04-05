namespace PersonalSite.Application.Interfaces;

/// <summary>
/// Web Push notification service for the owner.
/// Sends push messages to all registered <c>OwnerPushSubscription</c> records.
/// </summary>
public interface IPushNotificationService
{
    /// <summary>Send a push notification to all active owner subscriptions.</summary>
    Task SendToOwnerAsync(string title, string body, string? url = null, CancellationToken ct = default);
}
