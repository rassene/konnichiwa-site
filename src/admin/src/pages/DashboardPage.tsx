import { useSignalR, type ActiveVisitor } from "../hooks/useSignalR";

export default function DashboardPage() {
  const { activeVisitors } = useSignalR();

  return (
    <main className="page">
      <h1>Dashboard</h1>
      <LiveVisitorCount count={activeVisitors.length} />
      <ActiveVisitorTable visitors={activeVisitors} />
    </main>
  );
}

function LiveVisitorCount({ count }: { count: number }) {
  return (
    <section className="card" aria-live="polite">
      <h2>Active Visitors</h2>
      <p className="stat">{count}</p>
    </section>
  );
}

function ActiveVisitorTable({ visitors }: { visitors: ActiveVisitor[] }) {
  if (visitors.length === 0) {
    return (
      <section className="card">
        <p>No active visitors right now.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Fingerprint</th>
            <th>Page</th>
            <th>Visits</th>
            <th>Country</th>
            <th>Last seen</th>
          </tr>
        </thead>
        <tbody>
          {visitors.map((v) => (
            <tr key={v.fingerprint}>
              <td>
                <code>{v.fingerprint}</code>
              </td>
              <td>{v.currentPage}</td>
              <td>{v.visitCount}</td>
              <td>{v.countryCode ?? "—"}</td>
              <td>{new Date(v.lastSeenAt).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
