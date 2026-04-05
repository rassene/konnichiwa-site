/**
 * Subscriber gate island for musing post cards (T085).
 * JS cost: ~3 KB (React island, client:load) — justified: client-side token verification
 * is required to unlock gated posts without a full page reload or SSR auth.
 *
 * Rendered as a Astro React island on gated MusingPostCard entries.
 * Checks subscriberService and, if the visitor holds a valid token matching the post's
 * cluster(s), replaces the "Subscribe to read →" CTA with the actual post link.
 */
import { useState, useEffect } from 'react';
import { verifySubscriber } from '../../services/subscriber.js';

interface Props {
  /** Post slug used to build the read link. */
  slug:             string;
  /** Clusters this post belongs to — subscriber must have at least one. */
  requiredClusters: string[];
  /** Full post title, used for accessible link text. */
  title:            string;
}

export default function SubscriberGateIsland({ slug, requiredClusters, title }: Props) {
  const [state, setState] = useState<'loading' | 'locked' | 'unlocked'>('loading');

  useEffect(() => {
    verifySubscriber().then((info) => {
      const hasAccess =
        info.valid &&
        (requiredClusters.length === 0 ||
          requiredClusters.some((c) => info.clusters.includes(c)));
      setState(hasAccess ? 'unlocked' : 'locked');
    });
  }, []);

  if (state === 'unlocked') {
    return (
      <a
        href={`/musings/${slug}`}
        className="musing-card__read-more"
        aria-label={`Read ${title}`}
      >
        Read more →
      </a>
    );
  }

  if (state === 'locked') {
    return (
      <div className="musing-card__gated-cta">
        <a href="/#subscribe" className="musing-card__subscribe">
          Subscribe to read →
        </a>
      </div>
    );
  }

  // Loading state — render the same locked layout so layout doesn't shift when resolved.
  return (
    <div className="musing-card__gated-cta" aria-hidden="true">
      <span className="musing-card__subscribe musing-card__subscribe--loading">…</span>
    </div>
  );
}
