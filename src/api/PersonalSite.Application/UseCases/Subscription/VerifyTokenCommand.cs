namespace PersonalSite.Application.UseCases.Subscription;

/// <summary>Validate a subscriber JWT and apply sliding-window renewal if needed.</summary>
public sealed record VerifyTokenCommand(string Token);
