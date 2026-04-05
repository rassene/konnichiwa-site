import { type FormEvent, useState } from "react";
import { api } from "../services/authService";

export default function NewsletterPage() {
  const [postSlug, setPostSlug] = useState("");
  const [clusters, setClusters] = useState("");
  const [subject, setSubject]   = useState("");
  const [status, setStatus]     = useState<"idle" | "loading" | "success" | "error">("idle");
  const [jobId, setJobId]       = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    setJobId(null);

    try {
      const { data } = await api.post<{ jobId: string; status: string }>(
        "/api/admin/newsletter/dispatch",
        {
          postSlug,
          clusters: clusters.split(",").map((c) => c.trim()).filter(Boolean),
          subject,
        }
      );
      setJobId(data.jobId);
      setStatus("success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        .response?.data?.error ?? "Dispatch failed.";
      setError(msg);
      setStatus("error");
    }
  }

  return (
    <main className="page">
      <h1>Newsletter Dispatch</h1>
      <form onSubmit={handleSubmit} className="form">
        <div className="field">
          <label htmlFor="postSlug">Post slug (from CMS)</label>
          <input
            id="postSlug"
            type="text"
            required
            value={postSlug}
            onChange={(e) => setPostSlug(e.target.value)}
            placeholder="my-musing-slug"
          />
        </div>
        <div className="field">
          <label htmlFor="clusters">Clusters (comma-separated slugs)</label>
          <input
            id="clusters"
            type="text"
            required
            value={clusters}
            onChange={(e) => setClusters(e.target.value)}
            placeholder="tech-code, books"
          />
        </div>
        <div className="field">
          <label htmlFor="subject">Email subject</label>
          <input
            id="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="New post: …"
          />
        </div>
        <button type="submit" disabled={status === "loading"} className="btn-primary">
          {status === "loading" ? "Dispatching…" : "Dispatch newsletter"}
        </button>
      </form>

      {status === "success" && jobId && (
        <p role="status" className="success">
          Job enqueued — Hangfire job ID: <code>{jobId}</code>
        </p>
      )}
      {status === "error" && error && (
        <p role="alert" className="error">{error}</p>
      )}
    </main>
  );
}
