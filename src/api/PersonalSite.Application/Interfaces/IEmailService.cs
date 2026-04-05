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
}
