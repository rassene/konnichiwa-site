using Microsoft.AspNetCore.Mvc;
using PersonalSite.Application.Interfaces;

namespace PersonalSite.Api.Controllers;

/// <summary>
/// POST /api/visitor/identify — record visitor fingerprint per contracts/api.md.
/// Called with user consent (GDPR). Upserts visitor and returns returning/visitCount.
/// </summary>
[ApiController]
[Route("api/visitor")]
public sealed class VisitorController(IVisitorService visitorService) : ControllerBase
{
    [HttpPost("identify")]
    public async Task<IActionResult> Identify(
        [FromBody] VisitorIdentifyRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Fingerprint)
            || request.Fingerprint.Length != 64)
        {
            return BadRequest(new { error = "Malformed fingerprint. Expected a 64-char SHA-256 hex string." });
        }

        var (returning, visitCount) = await visitorService.IdentifyVisitorAsync(
            fingerprint: request.Fingerprint,
            pageUrl:     request.PageUrl,
            countryCode: null, // IP geo not implemented; can be added via MaxMind or Azure Maps
            ct:          cancellationToken);

        return Ok(new { returning, visitCount });
    }
}

/// <summary>Request body for POST /api/visitor/identify.</summary>
public sealed record VisitorIdentifyRequest(
    string Fingerprint,
    string? PageUrl = null);
