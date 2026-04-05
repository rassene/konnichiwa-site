import { useEffect, useState } from "react";
import { api } from "../services/authService";

interface SubscriberItem {
  id: string;
  email: string;
  clusters: string[];
  confirmedAt: string | null;
  lastAccessAt: string | null;
  active: boolean;
}

interface SubscribersResponse {
  total: number;
  items: SubscriberItem[];
}

export default function SubscribersPage() {
  const [data, setData]         = useState<SubscribersResponse | null>(null);
  const [cluster, setCluster]   = useState("");
  const [page, setPage]         = useState(1);
  const pageSize = 20;

  async function load() {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (cluster) params.set("cluster", cluster);
    const res = await api.get<SubscribersResponse>(`/api/admin/subscribers?${params}`);
    setData(res.data);
  }

  useEffect(() => { load(); }, [page, cluster]); // eslint-disable-line react-hooks/exhaustive-deps

  async function deactivate(id: string) {
    await api.patch(`/api/admin/subscribers/${id}/deactivate`);
    await load();
  }

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <main className="page">
      <h1>Subscribers</h1>
      <div className="toolbar">
        <input
          type="text"
          placeholder="Filter by cluster slug…"
          value={cluster}
          onChange={(e) => { setCluster(e.target.value); setPage(1); }}
        />
        <span className="total">{data?.total ?? 0} total</span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Clusters</th>
            <th>Confirmed</th>
            <th>Last access</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((s) => (
            <tr key={s.id} className={s.active ? "" : "inactive"}>
              <td>{s.email}</td>
              <td>{s.clusters.join(", ")}</td>
              <td>{s.confirmedAt ? new Date(s.confirmedAt).toLocaleDateString() : "—"}</td>
              <td>{s.lastAccessAt ? new Date(s.lastAccessAt).toLocaleDateString() : "—"}</td>
              <td>{s.active ? "Active" : "Inactive"}</td>
              <td>
                {s.active && (
                  <button onClick={() => deactivate(s.id)} className="btn-danger">
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
        <span>Page {page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
      </div>
    </main>
  );
}
