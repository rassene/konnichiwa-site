import { useEffect, useState } from "react";
import { api } from "../services/authService";

interface ContactItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
  isRead: boolean;
}

interface ContactsResponse {
  total: number;
  items: ContactItem[];
}

export default function ContactsPage() {
  const [data, setData]         = useState<ContactsResponse | null>(null);
  const [unreadOnly, setUnread] = useState(false);
  const [page, setPage]         = useState(1);
  const pageSize = 20;

  async function load() {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      unreadOnly: String(unreadOnly),
    });
    const res = await api.get<ContactsResponse>(`/api/admin/contacts?${params}`);
    setData(res.data);
  }

  useEffect(() => { load(); }, [page, unreadOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markRead(id: string) {
    await api.patch(`/api/admin/contacts/${id}/read`);
    await load();
  }

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <main className="page">
      <h1>Contacts</h1>
      <div className="toolbar">
        <label>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => { setUnread(e.target.checked); setPage(1); }}
          />{" "}
          Unread only
        </label>
        <span className="total">{data?.total ?? 0} total</span>
      </div>

      {data?.items.map((c) => (
        <article key={c.id} className={`contact-card${c.isRead ? " read" : ""}`}>
          <header>
            <strong>{c.name}</strong> &lt;{c.email}&gt;
            <span className="subject">{c.subject}</span>
            <time dateTime={c.submittedAt}>
              {new Date(c.submittedAt).toLocaleString()}
            </time>
          </header>
          <p>{c.message}</p>
          {!c.isRead && (
            <button onClick={() => markRead(c.id)} className="btn-secondary">
              Mark as read
            </button>
          )}
        </article>
      ))}

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
        <span>Page {page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
      </div>
    </main>
  );
}
