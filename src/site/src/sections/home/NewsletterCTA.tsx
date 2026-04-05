/**
 * NewsletterCTA React island (T087).
 * Upgrades the static Astro form to a full interactive island with:
 * - Cluster selection checkboxes
 * - Client-side validation
 * - API submission with success/error states
 * - JWT storage in localStorage on confirmation (via URL token on confirm page)
 *
 * JS cost: ~5 KB (React island, client:load) — justified: requires API call,
 * controlled form state, cluster selection, and async success/error UI.
 */
import { useState, type CSSProperties, type FormEvent } from 'react';

interface ClusterOption {
  slug:  string;
  label: string;
  color: string;
}

interface Props {
  /** Available interest clusters to subscribe to — fetched server-side and passed as props. */
  clusters: ClusterOption[];
}

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'conflict';

const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:5000';

export default function NewsletterCTA({ clusters }: Props) {
  const [email,          setEmail]          = useState('');
  const [selectedSlugs,  setSelectedSlugs]  = useState<string[]>(
    clusters.length > 0 ? [clusters[0].slug] : []
  );
  const [status,         setStatus]         = useState<Status>('idle');
  const [errorMessage,   setErrorMessage]   = useState('');

  const toggleCluster = (slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;
    if (selectedSlugs.length === 0) {
      setErrorMessage('Please select at least one interest.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), clusters: selectedSlugs }),
      });

      if (response.status === 409) {
        setStatus('conflict');
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { detail?: string };
        setErrorMessage(data.detail ?? 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <section className="newsletter-cta" aria-label="Newsletter subscription">
        <div className="newsletter-cta__inner">
          <div className="newsletter-cta__success" role="status">
            <p className="newsletter-cta__success-icon" aria-hidden="true">✉️</p>
            <h2 className="newsletter-cta__heading">Check your email</h2>
            <p className="newsletter-cta__desc">
              A confirmation link is on its way to <strong>{email}</strong>.
              Click it to complete your subscription.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (status === 'conflict') {
    return (
      <section className="newsletter-cta" aria-label="Newsletter subscription">
        <div className="newsletter-cta__inner">
          <div className="newsletter-cta__success" role="status">
            <h2 className="newsletter-cta__heading">Already subscribed</h2>
            <p className="newsletter-cta__desc">
              {email} is already an active subscriber. Check your inbox for your access link,
              or{' '}
              <a href="/#subscribe" className="newsletter-cta__link" onClick={() => setStatus('idle')}>
                resubscribe
              </a>.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="newsletter-cta" id="subscribe" aria-label="Newsletter subscription">
      <div className="newsletter-cta__inner">
        <div className="newsletter-cta__copy">
          <h2 className="newsletter-cta__heading">Stay in the loop</h2>
          <p className="newsletter-cta__desc">
            Subscribe to get notified when I publish new musings or update my readings list.
            No spam. Unsubscribe anytime.
          </p>
        </div>

        <form className="newsletter-cta__form" onSubmit={handleSubmit} noValidate>
          <label className="newsletter-cta__label" htmlFor="newsletter-email">
            Email address
          </label>
          <div className="newsletter-cta__row">
            <input
              id="newsletter-email"
              className="newsletter-cta__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={status === 'submitting'}
            />
            <button
              className="newsletter-cta__btn"
              type="submit"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Sending…' : 'Subscribe'}
            </button>
          </div>

          {clusters.length > 1 && (
            <fieldset className="newsletter-cta__clusters">
              <legend className="newsletter-cta__clusters-legend">Interests</legend>
              {clusters.map((c) => (
                <label key={c.slug} className="newsletter-cta__cluster-option">
                  <input
                    type="checkbox"
                    value={c.slug}
                    checked={selectedSlugs.includes(c.slug)}
                    onChange={() => toggleCluster(c.slug)}
                    disabled={status === 'submitting'}
                  />
                  <span
                    className="newsletter-cta__cluster-dot"
                    style={{ '--cluster-color': c.color } as CSSProperties}
                    aria-hidden="true"
                  />
                  {c.label}
                </label>
              ))}
            </fieldset>
          )}

          {status === 'error' && (
            <p className="newsletter-cta__error" role="alert">{errorMessage}</p>
          )}

          <p className="newsletter-cta__note">
            You&apos;ll receive a confirmation email. No spam.
          </p>
        </form>
      </div>
    </section>
  );
}
