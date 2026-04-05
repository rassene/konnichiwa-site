using PersonalSite.Domain.Entities;

namespace PersonalSite.Application.Interfaces;

/// <summary>
/// Persistence interface for <see cref="ContactSubmission"/> — implemented in Infrastructure.
/// </summary>
public interface IContactRepository
{
    Task AddAsync(ContactSubmission submission, CancellationToken cancellationToken = default);
}
