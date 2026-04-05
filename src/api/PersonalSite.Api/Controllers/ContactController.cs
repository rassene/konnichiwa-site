using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PersonalSite.Application.UseCases.Contact;
using System.Security.Cryptography;
using System.Text;

namespace PersonalSite.Api.Controllers;

[ApiController]
[Route("api/contact")]
public sealed class ContactController : ControllerBase
{
    private readonly SubmitContactFormHandler _handler;

    public ContactController(SubmitContactFormHandler handler) => _handler = handler;

    /// <summary>
    /// POST /api/contact — submit a contact form message.
    /// Rate limited to 3 requests per IP per hour (see Program.cs — "contact" policy).
    /// Honeypot field: if non-empty, silently return 200 to confuse bots.
    /// </summary>
    [HttpPost]
    [EnableRateLimiting("contact")]
    public async Task<IActionResult> Submit(
        [FromBody] ContactRequest request,
        CancellationToken cancellationToken)
    {
        // Honeypot: non-empty means a bot; return 200 to avoid fingerprinting.
        if (!string.IsNullOrEmpty(request.Honeypot))
            return Ok(new { received = true });

        var ipHash = HashIp(
            HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");

        try
        {
            await _handler.HandleAsync(new SubmitContactFormCommand(
                Name:    request.Name,
                Email:   request.Email,
                Subject: request.Subject,
                Message: request.Message,
                IpHash:  ipHash), cancellationToken);

            return Ok(new { received = true });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "Validation failed.", detail = ex.Message });
        }
    }

    private static string HashIp(string ip)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(ip));
        return Convert.ToHexStringLower(bytes);
    }
}

/// <summary>Request body for POST /api/contact.</summary>
public sealed record ContactRequest(
    string Name,
    string Email,
    string Subject,
    string Message,
    string? Honeypot = null);
