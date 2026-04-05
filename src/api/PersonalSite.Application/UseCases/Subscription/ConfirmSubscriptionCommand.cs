namespace PersonalSite.Application.UseCases.Subscription;

/// <summary>Consume the double opt-in confirm token and activate the subscription.</summary>
public sealed record ConfirmSubscriptionCommand(string ConfirmToken);
