using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using PersonalSite.Application.Interfaces;

namespace PersonalSite.Api.Hubs;

/// <summary>
/// SignalR hub for real-time visitor presence.
///
/// Public clients call <c>SendHeartbeat</c> to report their current page and fingerprint.
/// Admin clients join the "admin" group (require owner JWT) to receive live updates.
///
/// Inactive visitors (no heartbeat for 2 minutes) are pruned every 60 seconds
/// by <see cref="PresencePruneService"/>.
/// </summary>
public sealed class PresenceHub(IVisitorService visitorService) : Hub
{
    /// <summary>
    /// Called by public site clients on load and every 30 seconds.
    /// Upserts the visitor record and broadcasts an update to the admin group.
    /// </summary>
    public async Task SendHeartbeat(string fingerprint, string pageUrl)
    {
        if (string.IsNullOrWhiteSpace(fingerprint) || fingerprint.Length != 64)
            return;

        var (_, visitCount) = await visitorService.IdentifyVisitorAsync(
            fingerprint, pageUrl, countryCode: null);

        var active = await visitorService.GetActiveVisitorsAsync(windowMinutes: 2);

        await Clients.Group("admin").SendAsync("VisitorsUpdated", active);
    }

    /// <summary>
    /// Called by the Admin PWA. Requires a valid owner JWT.
    /// Adds the connection to the "admin" group and sends the current active visitor list.
    /// </summary>
    [Authorize(Roles = "owner")]
    public async Task JoinAdminGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "admin");
        var active = await visitorService.GetActiveVisitorsAsync(windowMinutes: 2);
        await Clients.Caller.SendAsync("VisitorsUpdated", active);
    }
}
