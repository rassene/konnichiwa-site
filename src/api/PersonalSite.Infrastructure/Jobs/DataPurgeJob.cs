using Hangfire;
using Microsoft.EntityFrameworkCore;
using PersonalSite.Infrastructure.Persistence;

namespace PersonalSite.Infrastructure.Jobs;

/// <summary>
/// Daily Hangfire job: delete <see cref="Domain.Entities.Visitor"/> records whose
/// <c>DataPurgeAt</c> date has passed.  Satisfies the GDPR 12-month retention limit
/// set when each visitor is first identified (see <c>VisitorService.IdentifyVisitor</c>).
/// </summary>
public sealed class DataPurgeJob(ApplicationDbContext db)
{
    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var cutoff = DateTime.UtcNow;

        // ExecuteDeleteAsync issues a single DELETE … WHERE statement — no entity tracking.
        int deleted = await db.Visitors
            .Where(v => v.DataPurgeAt <= cutoff)
            .ExecuteDeleteAsync(ct);

        if (deleted > 0)
        {
            Console.WriteLine($"[DataPurgeJob] Purged {deleted} visitor record(s) past retention date.");
        }
    }
}
