using Microsoft.AspNetCore.Mvc;
using PersonalSite.Application.Interfaces;
using PersonalSite.Application.UseCases.Subscription;

namespace PersonalSite.Api.Controllers;

[ApiController]
public sealed class NewsletterController : ControllerBase
{
    private readonly InitiateSubscriptionHandler _initiate;
    private readonly ConfirmSubscriptionHandler  _confirm;
    private readonly VerifyTokenHandler          _verify;
    private readonly UnsubscribeHandler          _unsubscribe;

    public NewsletterController(
        InitiateSubscriptionHandler initiate,
        ConfirmSubscriptionHandler  confirm,
        VerifyTokenHandler          verify,
        UnsubscribeHandler          unsubscribe)
    {
        _initiate    = initiate;
        _confirm     = confirm;
        _verify      = verify;
        _unsubscribe = unsubscribe;
    }

    /// <summary>POST /api/newsletter/subscribe — initiate double opt-in.</summary>
    [HttpPost("api/newsletter/subscribe")]
    public async Task<IActionResult> Subscribe(
        [FromBody] SubscribeRequest request,
        CancellationToken ct)
    {
        try
        {
            await _initiate.HandleAsync(
                new InitiateSubscriptionCommand(request.Email, request.Clusters),
                ct);

            return Ok(new
            {
                pending = true,
                message = "Check your email to confirm your subscription."
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "Validation failed.", detail = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>GET /api/newsletter/confirm?token={token} — confirm double opt-in.</summary>
    [HttpGet("api/newsletter/confirm")]
    public async Task<IActionResult> Confirm([FromQuery] string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { error = "Token is required." });

        try
        {
            var result = await _confirm.HandleAsync(
                new ConfirmSubscriptionCommand(token),
                ct);

            return Ok(new
            {
                confirmed   = true,
                accessToken = result.AccessToken,
                clusters    = result.Clusters,
            });
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>POST /api/subscriber/verify — validate subscriber JWT, apply sliding renewal.</summary>
    [HttpPost("api/subscriber/verify")]
    public async Task<IActionResult> Verify(
        [FromBody] VerifyTokenRequest request,
        CancellationToken ct)
    {
        var result = await _verify.HandleAsync(new VerifyTokenCommand(request.Token), ct);

        if (result is null)
            return Unauthorized(new { error = "Invalid or expired token." });

        return Ok(new
        {
            valid     = result.Valid,
            clusters  = result.Clusters,
            expiresAt = result.ExpiresAt,
            newToken  = result.NewToken,  // non-null when sliding renewal applied
        });
    }

    /// <summary>DELETE /api/newsletter/unsubscribe — deactivate subscription.</summary>
    [HttpDelete("api/newsletter/unsubscribe")]
    public async Task<IActionResult> Unsubscribe(CancellationToken ct)
    {
        var authHeader = HttpContext.Request.Headers.Authorization.ToString();
        var jwt        = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authHeader["Bearer ".Length..].Trim()
            : null;

        if (string.IsNullOrWhiteSpace(jwt))
            return Unauthorized(new { error = "Authorization header with Bearer token is required." });

        try
        {
            await _unsubscribe.HandleAsync(new UnsubscribeCommand(jwt), ct);
            return Ok(new { unsubscribed = true });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }
}

public sealed record SubscribeRequest(string Email, string[] Clusters);
public sealed record VerifyTokenRequest(string Token);
