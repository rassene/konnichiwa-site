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
        var message = new EmailMessage(
            senderAddress: _senderAddress,
            recipients: new EmailRecipients([new EmailAddress(_ownerAddress)]),
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
