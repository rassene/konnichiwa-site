namespace PersonalSite.Application.Interfaces;

/// <summary>
/// Abstraction over the Azure Communication Services email provider.
/// Implementations live in PersonalSite.Infrastructure — never referenced directly
/// by Application use cases (dependency rule respected).
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Send a plain-text / HTML email notification to the site owner.
    /// Throws on failure — callers should not swallow exceptions.
    /// </summary>
    Task SendOwnerNotificationAsync(
        string subject,
        string textBody,
        string htmlBody,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Send a double opt-in confirmation email to a prospective subscriber.
    /// <paramref name="confirmUrl"/> is the full URL the subscriber must click to confirm.
    /// </summary>
    Task SendSubscriberConfirmationAsync(
        string toEmail,
        string confirmUrl,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Send an arbitrary email to a specific recipient.
    /// Used by newsletter dispatch jobs to reach subscribers.
    /// </summary>
    Task SendToAsync(
        string toEmail,
        string subject,
        string textBody,
        string htmlBody,
        CancellationToken cancellationToken = default);
}
