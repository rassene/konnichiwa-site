namespace PersonalSite.Application.UseCases.Subscription;

/// <summary>Initiate the double opt-in subscription flow.</summary>
public sealed record InitiateSubscriptionCommand(
    string Email,
    string[] ClusterSlugs);
