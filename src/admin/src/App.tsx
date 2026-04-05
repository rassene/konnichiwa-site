import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { usePush } from "./hooks/usePush";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ContactsPage from "./pages/ContactsPage";
import SubscribersPage from "./pages/SubscribersPage";
import NewsletterPage from "./pages/NewsletterPage";

function ProtectedApp() {
  const { authenticated, loading } = useAuth();
  const { subscribe, status } = usePush();

  // Subscribe to push notifications on first authenticated load.
  useEffect(() => {
    if (authenticated && status === "idle") {
      subscribe();
    }
  }, [authenticated, status, subscribe]);

  if (loading) return <div className="loading">Loading…</div>;
  if (!authenticated) return <Navigate to="/login" replace />;

  return (
    <>
      <nav className="sidebar">
        <a href="/">Dashboard</a>
        <a href="/contacts">Contacts</a>
        <a href="/subscribers">Subscribers</a>
        <a href="/newsletter">Newsletter</a>
      </nav>
      <Routes>
        <Route path="/"            element={<DashboardPage />} />
        <Route path="/contacts"    element={<ContactsPage />} />
        <Route path="/subscribers" element={<SubscribersPage />} />
        <Route path="/newsletter"  element={<NewsletterPage />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*"     element={<ProtectedApp />} />
      </Routes>
    </AuthProvider>
  );
}
