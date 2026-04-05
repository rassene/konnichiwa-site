using Microsoft.EntityFrameworkCore;
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

    public async Task<(int total, IReadOnlyList<ContactSubmission> items)> ListAsync(
        int page, int pageSize, bool unreadOnly, CancellationToken ct = default)
    {
        var query = _db.ContactSubmissions.AsQueryable();
        if (unreadOnly) query = query.Where(c => !c.IsRead);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(c => c.SubmittedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (total, items);
    }

    public Task<ContactSubmission?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => _db.ContactSubmissions.FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task UpdateAsync(ContactSubmission submission, CancellationToken ct = default)
    {
        _db.ContactSubmissions.Update(submission);
        return _db.SaveChangesAsync(ct);
    }
}
