using Microsoft.AspNetCore.SignalR;
using PersonalSite.Api.Hubs;
using PersonalSite.Application.Interfaces;

namespace PersonalSite.Api.Services;

/// <summary>
/// Background service that prunes visitors whose last heartbeat was more than 2 minutes ago
/// and broadcasts the updated active-visitor list to the admin group every 60 seconds.
/// </summary>
public sealed class PresencePruneService(
    IHubContext<PresenceHub> hubContext,
    IServiceScopeFactory scopeFactory,
    ILogger<PresencePruneService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);

                await using var scope = scopeFactory.CreateAsyncScope();
                var svc = scope.ServiceProvider.GetRequiredService<IVisitorService>();
                var active = await svc.GetActiveVisitorsAsync(windowMinutes: 2, ct: stoppingToken);

                await hubContext.Clients.Group("admin")
                    .SendAsync("VisitorsUpdated", active, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "PresencePruneService: unhandled error.");
            }
        }
    }
}
