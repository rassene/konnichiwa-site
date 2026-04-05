using PersonalSite.Application.Interfaces;
using PersonalSite.Domain.Entities;
using PersonalSite.Infrastructure.Persistence;

namespace PersonalSite.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IContactRepository"/>.
/// </summary>
public sealed class ContactRepository : IContactRepository
{
    private readonly ApplicationDbContext _db;

    public ContactRepository(ApplicationDbContext db) => _db = db;

    public async Task AddAsync(ContactSubmission submission, CancellationToken cancellationToken = default)
    {
        _db.ContactSubmissions.Add(submission);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
