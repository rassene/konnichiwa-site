namespace PersonalSite.Application.UseCases.Subscription;

/// <summary>Deactivate a subscription. Requires the caller's valid subscriber JWT.</summary>
public sealed record UnsubscribeCommand(string SubscriberJwt);
