using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalSite.Application.Interfaces;

namespace PersonalSite.Api.Controllers;

/// <summary>
/// Admin data endpoints per contracts/api.md.
/// All routes require a valid owner JWT (role: owner).
/// </summary>
[ApiController]
[Route("api/admin")]
[Authorize(Roles = "owner")]
public sealed class AdminController(
    IVisitorService visitorService,
    IContactRepository contactRepo,
    ISubscriberRepository subscriberRepo) : ControllerBase
{
    // ── Visitors ──────────────────────────────────────────────────────────────

    /// <summary>GET /api/admin/visitors — active visitor list (last heartbeat ≤ 2 min).</summary>
    [HttpGet("visitors")]
    public async Task<IActionResult> GetVisitors(CancellationToken cancellationToken)
    {
        var active = await visitorService.GetActiveVisitorsAsync(windowMinutes: 2, ct: cancellationToken);
        var dto = active.Select(v => new
        {
            fingerprint  = v.FingerprintPreview,
            currentPage  = v.CurrentPage,
            visitCount   = v.VisitCount,
            countryCode  = v.CountryCode,
            lastSeenAt   = v.LastSeenAt,
        });
        return Ok(dto);
    }

    // ── Contacts ─────────────────────────────────────────────────────────────

    /// <summary>GET /api/admin/contacts — paginated contact submissions.</summary>
    [HttpGet("contacts")]
    public async Task<IActionResult> GetContacts(
        [FromQuery] int page       = 1,
        [FromQuery] int pageSize   = 20,
        [FromQuery] bool unreadOnly = false,
        CancellationToken cancellationToken = default)
    {
        var (total, items) = await contactRepo.ListAsync(page, pageSize, unreadOnly, cancellationToken);
        return Ok(new
        {
            total,
            items = items.Select(c => new
            {
                id          = c.Id,
                name        = c.Name,
                email       = c.Email,
                subject     = c.Subject,
                message     = c.Message,
                submittedAt = c.SubmittedAt,
                isRead      = c.IsRead,
            }),
        });
    }

    /// <summary>PATCH /api/admin/contacts/{id}/read — mark a contact as read.</summary>
    [HttpPatch("contacts/{id:guid}/read")]
    public async Task<IActionResult> MarkContactRead(
        Guid id, CancellationToken cancellationToken)
    {
        var contact = await contactRepo.GetByIdAsync(id, cancellationToken);
        if (contact is null) return NotFound(new { error = "Contact not found." });

        contact.IsRead = true;
        contact.ReadAt = DateTime.UtcNow;
        await contactRepo.UpdateAsync(contact, cancellationToken);
        return Ok(new { marked = true });
    }

    // ── Subscribers ──────────────────────────────────────────────────────────

    /// <summary>GET /api/admin/subscribers — paginated subscriber list with optional cluster filter.</summary>
    [HttpGet("subscribers")]
    public async Task<IActionResult> GetSubscribers(
        [FromQuery] string? cluster  = null,
        [FromQuery] int     page     = 1,
        [FromQuery] int     pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var (total, items) = await subscriberRepo.ListAsync(cluster, page, pageSize, cancellationToken);
        return Ok(new
        {
            total,
            items = items.Select(s => new
            {
                id           = s.Id,
                email        = s.Email,
                clusters     = s.Clusters.Select(c => c.ClusterSlug).ToArray(),
                confirmedAt  = s.ConfirmedAt,
                lastAccessAt = s.LastAccessAt,
                active       = s.Active,
            }),
        });
    }

    /// <summary>PATCH /api/admin/subscribers/{id}/deactivate — soft-deactivate a subscriber.</summary>
    [HttpPatch("subscribers/{id:guid}/deactivate")]
    public async Task<IActionResult> DeactivateSubscriber(
        Guid id, CancellationToken cancellationToken)
    {
        var subscriber = await subscriberRepo.GetByIdAsync(id, cancellationToken);
        if (subscriber is null) return NotFound(new { error = "Subscriber not found." });

        subscriber.Active = false;
        await subscriberRepo.UpdateAsync(subscriber, cancellationToken);
        return Ok(new { deactivated = true });
    }
}
