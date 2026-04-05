/**
 * Subscriber gate island for reading notes (T086).
 * JS cost: ~3 KB (React island, client:load) — justified: client-side token verification
 * is required to reveal gated notes without SSR auth.
 *
 * Receives the full note text at build time (SSG), but only renders it once
 * subscriber token verification confirms the visitor has cluster access.
 */
import { useState, useEffect } from 'react';
import { verifySubscriber } from '../../services/subscriber.js';

interface Props {
  note:             string;
  clusterSlugs:     string[]; // clusters the reading belongs to — subscriber needs ≥1
}

export default function GatedNoteTeaserIsland({ note, clusterSlugs }: Props) {
  const [state, setState] = useState<'loading' | 'locked' | 'unlocked'>('loading');

  useEffect(() => {
    verifySubscriber().then((info) => {
      const hasAccess =
        info.valid &&
        (clusterSlugs.length === 0 ||
          clusterSlugs.some((c) => info.clusters.includes(c)));
      setState(hasAccess ? 'unlocked' : 'locked');
    });
  }, []);

  if (state === 'unlocked') {
    return (
      <p className="reading-note">{note}</p>
    );
  }

  if (state === 'locked') {
    return (
      <div className="gated-teaser" role="complementary" aria-label="Subscriber-only note">
        <div className="gated-teaser__blur" aria-hidden="true">
          {note.slice(0, 80)}…
        </div>
        <div className="gated-teaser__overlay">
          <span className="gated-teaser__lock" aria-hidden="true">🔒</span>
          <p className="gated-teaser__copy">This note is for subscribers.</p>
          <a href="#subscribe" className="gated-teaser__cta">Subscribe to read →</a>
        </div>
      </div>
    );
  }

  // Loading — render the blurred teaser as a neutral loading state.
  return (
    <div className="gated-teaser" aria-hidden="true">
      <div className="gated-teaser__blur" style={{ opacity: 0.4 }}>
        {note.slice(0, 80)}…
      </div>
    </div>
  );
}
