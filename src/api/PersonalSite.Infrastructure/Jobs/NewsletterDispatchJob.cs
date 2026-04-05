using Hangfire;
using PersonalSite.Application.Interfaces;

namespace PersonalSite.Infrastructure.Jobs;

/// <summary>
/// Hangfire background job: fetch active subscribers by cluster, batch-send newsletter emails.
/// Enqueued by <c>AdminNewsletterController</c> via <see cref="IBackgroundJobClient"/>.
/// Batch size: 50 emails per batch to stay within ACS rate limits.
/// </summary>
public sealed class NewsletterDispatchJob(
    ISubscriberRepository subscriberRepo,
    IEmailService emailService)
{
    private const int BatchSize = 50;

    /// <summary>
    /// Dispatch the newsletter to all active subscribers whose clusters overlap
    /// with <paramref name="clusterSlugs"/>.
    /// </summary>
    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync(
        string postSlug,
        string[] clusterSlugs,
        string subject,
        CancellationToken ct = default)
    {
        var subscribers = await subscriberRepo.GetActiveByClusterSlugsAsync(clusterSlugs, ct);

        // Build a simple post URL — frontend route convention.
        var postUrl = $"/musings/{postSlug}";

        // Send in batches of BatchSize to respect ACS throughput limits.
        var batches = subscribers
            .Select((s, i) => (subscriber: s, index: i))
            .GroupBy(x => x.index / BatchSize, x => x.subscriber);

        foreach (var batch in batches)
        {
            var tasks = batch.Select(subscriber =>
                SendToSubscriberAsync(subscriber.Email, subject, postUrl, ct));

            await Task.WhenAll(tasks);
        }
    }

    private Task SendToSubscriberAsync(string email, string subject, string postUrl, CancellationToken ct)
    {
        var textBody = $"A new post is available: {postUrl}";
        var htmlBody = $"<p>A new post is available:</p><p><a href=\"{postUrl}\">{postUrl}</a></p>" +
                       $"<p style=\"font-size:0.85em;color:#888\">You received this because you subscribed. " +
                       $"<a href=\"/unsubscribe\">Unsubscribe</a></p>";

        return emailService.SendToAsync(email, subject, textBody, htmlBody, ct);
    }
}
