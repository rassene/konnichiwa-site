using Microsoft.AspNetCore.Mvc;
using PersonalSite.Application.Interfaces;

namespace PersonalSite.Api.Controllers;

/// <summary>
/// Owner authentication — login, refresh, logout per contracts/api.md.
/// Access token: 15-minute JWT (returned in body).
/// Refresh token: 30-day random token (set/cleared as HttpOnly cookie).
/// </summary>
[ApiController]
[Route("api/admin/auth")]
public sealed class AdminAuthController(IAdminAuthService authService) : ControllerBase
{
    private const string RefreshCookieName = "refresh_token";

    /// <summary>POST /api/admin/auth/login</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] AdminLoginRequest request,
        CancellationToken cancellationToken)
    {
        var userAgent = Request.Headers.UserAgent.ToString();
        var result = await authService.LoginAsync(
            request.Email, request.Password, userAgent, cancellationToken);

        if (result is null)
            return Unauthorized(new { error = "Invalid credentials." });

        SetRefreshCookie(result.RefreshToken);
        return Ok(new { accessToken = result.AccessToken, expiresAt = result.ExpiresAt });
    }

    /// <summary>POST /api/admin/auth/refresh — reads HttpOnly refresh_token cookie.</summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
    {
        if (!Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken)
            || string.IsNullOrWhiteSpace(refreshToken))
        {
            return Unauthorized(new { error = "Missing refresh token." });
        }

        var result = await authService.RefreshAsync(refreshToken, cancellationToken);
        if (result is null)
        {
            ClearRefreshCookie();
            return Unauthorized(new { error = "Invalid or expired refresh token." });
        }

        SetRefreshCookie(result.RefreshToken);
        return Ok(new { accessToken = result.AccessToken, expiresAt = result.ExpiresAt });
    }

    /// <summary>POST /api/admin/auth/logout — revokes refresh token and clears cookie.</summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        if (Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken)
            && !string.IsNullOrWhiteSpace(refreshToken))
        {
            await authService.LogoutAsync(refreshToken, cancellationToken);
        }

        ClearRefreshCookie();
        return Ok(new { loggedOut = true });
    }

    // ── Cookie helpers ────────────────────────────────────────────────────────

    private void SetRefreshCookie(string value)
    {
        Response.Cookies.Append(RefreshCookieName, value, new CookieOptions
        {
            HttpOnly  = true,
            Secure    = true,
            SameSite  = SameSiteMode.Strict,
            Expires   = DateTimeOffset.UtcNow.AddDays(30),
        });
    }

    private void ClearRefreshCookie()
    {
        Response.Cookies.Delete(RefreshCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure   = true,
            SameSite = SameSiteMode.Strict,
        });
    }
}

public sealed record AdminLoginRequest(string Email, string Password);
