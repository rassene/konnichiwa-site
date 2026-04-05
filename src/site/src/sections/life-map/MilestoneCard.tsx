/**
 * Immersive layer — Milestone detail card (T100).
 * Expanded view: title, date (mono font), description, media if any.
 * Closes on outside click or Escape key. ARIA role="dialog".
 */
import { useEffect, useRef } from 'react';
import type { IMilestone } from '../../content/interfaces/index.js';

interface MilestoneCardProps {
  milestone: IMilestone;
  onClose: () => void;
}

export default function MilestoneCard({ milestone, onClose }: MilestoneCardProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function handleClickOutside(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    // Focus the card on mount for accessibility
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const CATEGORY_COLORS: Record<IMilestone['category'], string> = {
    academic:     '#4A90D9',
    personal:     '#E8A87C',
    professional: '#2ECC71',
    social:       '#E67E22',
    creative:     '#9B59B6',
    future:       '#D4522A',
  };

  const color = CATEGORY_COLORS[milestone.category];
  const isFuture = milestone.category === 'future';

  return (
    <div
      ref={dialogRef}
      className="ms-card"
      role="dialog"
      aria-modal="true"
      aria-label={milestone.title}
      tabIndex={-1}
      style={{ '--ms-color': color } as React.CSSProperties}
    >
      <div className="ms-card__header">
        <div className="ms-card__meta">
          <span className="ms-card__date">
            {isFuture ? 'Future' : new Date(milestone.date).toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span className="ms-card__category">{milestone.category}</span>
        </div>
        <button
          className="ms-card__close"
          onClick={onClose}
          aria-label="Close milestone card"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <h3 className="ms-card__title">
        {milestone.featured && (
          <span className="ms-card__featured-star" aria-label="Featured" title="Featured milestone">★</span>
        )}
        {milestone.title}
      </h3>

      <p className="ms-card__description">{milestone.description}</p>

      {milestone.media && milestone.media.length > 0 && (
        <div className="ms-card__media">
          {milestone.media.slice(0, 3).map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={img.alt}
              width={img.width}
              height={img.height}
              className="ms-card__img"
              loading="lazy"
            />
          ))}
        </div>
      )}

      <style>{`
        .ms-card {
          position: relative;
          background: #1c1c1a;
          border: 1px solid var(--ms-color, rgba(240,236,228,0.2));
          border-radius: 12px;
          padding: 24px;
          max-width: 360px;
          width: 100%;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6);
          outline: none;
          animation: ms-card-in 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes ms-card-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }

        .ms-card__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .ms-card__meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ms-card__date {
          font-family: "JetBrains Mono", monospace;
          font-size: 0.75rem;
          color: var(--ms-color);
          letter-spacing: 0.04em;
        }

        .ms-card__category {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(240, 236, 228, 0.4);
        }

        .ms-card__close {
          background: none;
          border: 1px solid rgba(240,236,228,0.15);
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(240,236,228,0.5);
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
          transition: border-color 200ms ease, color 200ms ease;
        }

        .ms-card__close:hover {
          border-color: rgba(240,236,228,0.4);
          color: #f0ece4;
        }

        .ms-card__title {
          font-family: "Playfair Display", Georgia, serif;
          font-size: 1.125rem;
          font-weight: 600;
          color: #f0ece4;
          margin: 0 0 10px;
          line-height: 1.3;
        }

        .ms-card__featured-star {
          color: var(--ms-color);
          margin-right: 6px;
        }

        .ms-card__description {
          font-size: 0.875rem;
          color: rgba(240,236,228,0.75);
          line-height: 1.6;
          margin: 0;
        }

        .ms-card__media {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          overflow: hidden;
          border-radius: 8px;
        }

        .ms-card__img {
          flex: 1;
          width: 0;
          min-width: 0;
          height: 100px;
          object-fit: cover;
          border-radius: 6px;
        }

        @media (prefers-reduced-motion: reduce) {
          .ms-card { animation: none; }
          .ms-card__close { transition: none; }
        }
      `}</style>
    </div>
  );
}
