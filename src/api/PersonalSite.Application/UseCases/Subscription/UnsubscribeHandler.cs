using PersonalSite.Application.Interfaces;

namespace PersonalSite.Application.UseCases.Subscription;

public sealed class UnsubscribeHandler(ISubscriptionService service)
{
    public async Task HandleAsync(UnsubscribeCommand command, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.SubscriberJwt))
            throw new UnauthorizedAccessException("A valid subscriber token is required.");

        await service.UnsubscribeAsync(command.SubscriberJwt, ct);
    }
}
