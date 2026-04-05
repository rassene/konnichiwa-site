namespace PersonalSite.Application.UseCases.Contact;

/// <summary>
/// Command: submit a validated contact form entry.
/// </summary>
/// <param name="Name">Submitter name (max 100).</param>
/// <param name="Email">Submitter email (max 254).</param>
/// <param name="Subject">One of: general | collaboration | academic | work | other.</param>
/// <param name="Message">Message body (max 1000).</param>
/// <param name="IpHash">SHA-256 hash of the submitter's IP — used for rate limiting records.</param>
public sealed record SubmitContactFormCommand(
    string Name,
    string Email,
    string Subject,
    string Message,
    string IpHash);
