using PersonalSite.Application.Interfaces;

namespace PersonalSite.Application.UseCases.Subscription;

/// <summary>
/// Validates and dispatches <see cref="InitiateSubscriptionCommand"/> to
/// <see cref="ISubscriptionService"/>. Controllers contain no business logic.
/// </summary>
public sealed class InitiateSubscriptionHandler(ISubscriptionService service)
{
    public async Task HandleAsync(InitiateSubscriptionCommand command, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.Email) || command.Email.Length > 254)
            throw new ArgumentException("A valid email address is required.", nameof(command.Email));

        if (command.ClusterSlugs is not { Length: > 0 })
            throw new ArgumentException("At least one cluster must be selected.", nameof(command.ClusterSlugs));

        await service.InitiateAsync(command.Email.Trim().ToLowerInvariant(), command.ClusterSlugs, ct);
    }
}
