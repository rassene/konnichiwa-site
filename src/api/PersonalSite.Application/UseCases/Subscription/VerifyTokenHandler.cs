using PersonalSite.Application.Interfaces;

namespace PersonalSite.Application.UseCases.Subscription;

public sealed class VerifyTokenHandler(ISubscriptionService service)
{
    public async Task<VerifyResult?> HandleAsync(VerifyTokenCommand command, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.Token))
            return null;

        return await service.VerifyTokenAsync(command.Token, ct);
    }
}
