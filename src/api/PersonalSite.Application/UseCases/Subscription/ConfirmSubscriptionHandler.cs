using PersonalSite.Application.Interfaces;

namespace PersonalSite.Application.UseCases.Subscription;

public sealed class ConfirmSubscriptionHandler(ISubscriptionService service)
{
    public async Task<ConfirmResult> HandleAsync(ConfirmSubscriptionCommand command, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.ConfirmToken))
            throw new ArgumentException("Confirm token is required.", nameof(command.ConfirmToken));

        return await service.ConfirmAsync(command.ConfirmToken, ct);
    }
}
