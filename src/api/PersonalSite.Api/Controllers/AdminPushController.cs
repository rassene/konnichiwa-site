using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalSite.Domain.Entities;
using PersonalSite.Infrastructure.Persistence;

namespace PersonalSite.Api.Controllers;

/// <summary>
/// Web Push subscription management per contracts/api.md.
/// Requires owner JWT (role: owner).
/// </summary>
[ApiController]
[Route("api/admin/push")]
[Authorize(Roles = "owner")]
public sealed class AdminPushController(ApplicationDbContext db) : ControllerBase
{
    /// <summary>PUT /api/admin/push/register — register or update owner's push subscription.</summary>
    [HttpPut("register")]
    public async Task<IActionResult> Register(
        [FromBody] PushRegisterRequest request,
        CancellationToken cancellationToken)
    {
        // Upsert by endpoint.
        var existing = await db.OwnerPushSubscriptions
            .FirstOrDefaultAsync(s => s.Endpoint == request.Endpoint, cancellationToken);

        if (existing is not null)
        {
            existing.P256dhKey    = request.Keys.P256dh;
            existing.AuthKey      = request.Keys.Auth;
            existing.Active       = true;
            existing.LastUsedAt   = DateTime.UtcNow;
        }
        else
        {
            await db.OwnerPushSubscriptions.AddAsync(new OwnerPushSubscription
            {
                Id            = Guid.NewGuid(),
                Endpoint      = request.Endpoint,
                P256dhKey     = request.Keys.P256dh,
                AuthKey       = request.Keys.Auth,
                RegisteredAt  = DateTime.UtcNow,
                Active        = true,
            }, cancellationToken);
        }

        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { registered = true });
    }

    /// <summary>DELETE /api/admin/push/unregister — remove owner's push subscription.</summary>
    [HttpDelete("unregister")]
    public async Task<IActionResult> Unregister(
        [FromBody] PushUnregisterRequest request,
        CancellationToken cancellationToken)
    {
        var sub = await db.OwnerPushSubscriptions
            .FirstOrDefaultAsync(s => s.Endpoint == request.Endpoint, cancellationToken);

        if (sub is not null)
        {
            sub.Active = false;
            await db.SaveChangesAsync(cancellationToken);
        }

        return Ok(new { unregistered = true });
    }
}

public sealed record PushRegisterRequest(string Endpoint, PushKeys Keys);
public sealed record PushKeys(string P256dh, string Auth);
public sealed record PushUnregisterRequest(string Endpoint);
