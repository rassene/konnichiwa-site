using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalSite.Infrastructure.Jobs;

namespace PersonalSite.Api.Controllers;

/// <summary>
/// Admin endpoint to trigger a newsletter dispatch as a Hangfire background job.
/// Requires owner JWT (role: owner).
/// </summary>
[ApiController]
[Route("api/admin/newsletter")]
[Authorize(Roles = "owner")]
public sealed class AdminNewsletterController : ControllerBase
{
    private readonly IBackgroundJobClient _jobs;

    public AdminNewsletterController(IBackgroundJobClient jobs) => _jobs = jobs;

    /// <summary>
    /// POST /api/admin/newsletter/dispatch — enqueue a newsletter dispatch job.
    /// Returns 202 Accepted with the Hangfire job ID.
    /// </summary>
    [HttpPost("dispatch")]
    public IActionResult Dispatch([FromBody] DispatchRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PostSlug))
            return BadRequest(new { error = "postSlug is required." });

        if (request.Clusters is not { Length: > 0 })
            return BadRequest(new { error = "At least one cluster slug is required." });

        if (string.IsNullOrWhiteSpace(request.Subject))
            return BadRequest(new { error = "subject is required." });

        var jobId = _jobs.Enqueue<NewsletterDispatchJob>(job =>
            job.ExecuteAsync(request.PostSlug, request.Clusters, request.Subject, CancellationToken.None));

        return Accepted(new { jobId, status = "queued" });
    }
}

public sealed record DispatchRequest(string PostSlug, string[] Clusters, string Subject);
