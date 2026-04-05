using Azure;
using Azure.Communication.Email;
using PersonalSite.Application.Interfaces;

namespace PersonalSite.Infrastructure.Services;

/// <summary>
/// Azure Communication Services email implementation of <see cref="IEmailService"/>.
/// Connection string and sender address are read from configuration at registration time.
/// </summary>
public sealed class EmailService : IEmailService
{
    private readonly EmailClient _client;
    private readonly string _senderAddress;
    private readonly string _ownerAddress;

    public EmailService(EmailClient client, string senderAddress, string ownerAddress)
    {
        _client        = client;
        _senderAddress = senderAddress;
        _ownerAddress  = ownerAddress;
    }

    /// <inheritdoc />
    public async Task SendOwnerNotificationAsync(
        string subject,
        string textBody,
        string htmlBody,
        CancellationToken cancellationToken = default)
    {
        await SendAsync(_ownerAddress, subject, textBody, htmlBody, cancellationToken);
    }

    /// <inheritdoc />
    public async Task SendSubscriberConfirmationAsync(
        string toEmail,
        string confirmUrl,
        CancellationToken cancellationToken = default)
    {
        const string subject  = "Confirm your subscription";
        var textBody = $"Click the link below to confirm your subscription:\n\n{confirmUrl}\n\nThis link expires in 24 hours.";
        var htmlBody = $"<p>Click the link below to confirm your subscription:</p>" +
                       $"<p><a href=\"{System.Net.WebUtility.HtmlEncode(confirmUrl)}\">Confirm subscription</a></p>" +
                       $"<p>This link expires in 24 hours.</p>";

        await SendAsync(toEmail, subject, textBody, htmlBody, cancellationToken);
    }

    /// <inheritdoc />
    public Task SendToAsync(
        string toEmail,
        string subject,
        string textBody,
        string htmlBody,
        CancellationToken cancellationToken = default)
        => SendAsync(toEmail, subject, textBody, htmlBody, cancellationToken);

    private async Task SendAsync(
        string toAddress,
        string subject,
        string textBody,
        string htmlBody,
        CancellationToken cancellationToken)
    {
        var message = new EmailMessage(
            senderAddress: _senderAddress,
            recipients: new EmailRecipients([new EmailAddress(toAddress)]),
            content: new EmailContent(subject)
            {
                PlainText = textBody,
                Html      = htmlBody,
            });

        var operation = await _client.SendAsync(
            WaitUntil.Completed,
            message,
            cancellationToken);

        if (operation.Value.Status == EmailSendStatus.Failed)
        {
            throw new InvalidOperationException(
                $"ACS email send failed with status: {operation.Value.Status}");
        }
    }
}
