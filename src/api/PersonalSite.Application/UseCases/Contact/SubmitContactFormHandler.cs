using PersonalSite.Application.Interfaces;
using PersonalSite.Domain.Entities;

namespace PersonalSite.Application.UseCases.Contact;

/// <summary>
/// Handles <see cref="SubmitContactFormCommand"/>: persists the contact submission
/// and fires an owner email notification via <see cref="IEmailService"/>.
/// No business logic in controllers — this is the sole entry point.
/// </summary>
public sealed class SubmitContactFormHandler
{
    private static readonly HashSet<string> _validSubjects =
        ["general", "collaboration", "academic", "work", "other"];

    private readonly IContactRepository _repo;
    private readonly IEmailService _email;

    public SubmitContactFormHandler(IContactRepository repo, IEmailService email)
    {
        _repo  = repo;
        _email = email;
    }

    /// <summary>
    /// Execute the command. Returns the created submission ID.
    /// Throws <see cref="ArgumentException"/> for validation failures.
    /// </summary>
    public async Task<Guid> HandleAsync(
        SubmitContactFormCommand command,
        CancellationToken cancellationToken = default)
    {
        Validate(command);

        var submission = new ContactSubmission
        {
            Id          = Guid.NewGuid(),
            Name        = command.Name.Trim(),
            Email       = command.Email.Trim().ToLowerInvariant(),
            Subject     = command.Subject,
            Message     = command.Message.Trim(),
            IpHash      = command.IpHash,
            SubmittedAt = DateTime.UtcNow,
        };

        await _repo.AddAsync(submission, cancellationToken);

        // Notify owner — failure here does NOT roll back the DB record.
        // The message is persisted regardless of email delivery.
        try
        {
            await _email.SendOwnerNotificationAsync(
                subject: $"[konnichiwa] New contact: {submission.Subject}",
                textBody: $"From: {submission.Name} <{submission.Email}>\n\n{submission.Message}",
                htmlBody: $"<p><strong>From:</strong> {submission.Name} &lt;{submission.Email}&gt;</p>" +
                          $"<p><strong>Subject:</strong> {submission.Subject}</p>" +
                          $"<p>{System.Net.WebUtility.HtmlEncode(submission.Message).Replace("\n", "<br/>")}</p>",
                cancellationToken);
        }
        catch
        {
            // Log but do not propagate — submission already saved.
            // TODO: wire structured logging (ILogger) in Phase 6 polish.
        }

        return submission.Id;
    }

    private static void Validate(SubmitContactFormCommand cmd)
    {
        if (string.IsNullOrWhiteSpace(cmd.Name) || cmd.Name.Length > 100)
            throw new ArgumentException("Name is required and must be 100 characters or fewer.", nameof(cmd.Name));

        if (string.IsNullOrWhiteSpace(cmd.Email) || cmd.Email.Length > 254)
            throw new ArgumentException("Email is required and must be 254 characters or fewer.", nameof(cmd.Email));

        if (!_validSubjects.Contains(cmd.Subject))
            throw new ArgumentException($"Subject must be one of: {string.Join(", ", _validSubjects)}.", nameof(cmd.Subject));

        if (string.IsNullOrWhiteSpace(cmd.Message) || cmd.Message.Length > 1000)
            throw new ArgumentException("Message is required and must be 1000 characters or fewer.", nameof(cmd.Message));
    }
}
