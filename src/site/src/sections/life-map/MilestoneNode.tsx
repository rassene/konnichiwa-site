/**
 * Immersive layer — Milestone dot/icon on the timeline path (T099).
 * Hover/tap reveals MilestoneCard. Featured nodes are visually larger.
 * Future milestones have a distinct dashed-ring visual indicator.
 */
import { useState, useRef, useEffect } from 'react';
import type { IMilestone } from '../../content/interfaces/index.js';
import MilestoneCard from './MilestoneCard.js';

interface MilestoneNodeProps {
  milestone: IMilestone;
  orientation: 'horizontal' | 'vertical';
}

const CATEGORY_COLORS: Record<IMilestone['category'], string> = {
  academic:     '#4A90D9',
  personal:     '#E8A87C',
  professional: '#2ECC71',
  social:       '#E67E22',
  creative:     '#9B59B6',
  future:       '#D4522A',
};

export default function MilestoneNode({ milestone, orientation }: MilestoneNodeProps) {
  const [open, setOpen] = useState(false);
  const nodeRef = useRef<HTMLButtonElement>(null);
  const color = CATEGORY_COLORS[milestone.category];
  const isFeatured = milestone.featured;
  const isFuture = milestone.category === 'future';
  const size = isFeatured ? 20 : 12;

  // Close card when focus moves outside
  useEffect(() => {
    if (!open) return;
    function handleFocusOut(e: FocusEvent) {
      if (!nodeRef.current?.closest('.ms-node-wrapper')?.contains(e.relatedTarget as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('focusout', handleFocusOut);
    return () => document.removeEventListener('focusout', handleFocusOut);
  }, [open]);

  const label = `${milestone.title} — ${milestone.category}, ${
    isFuture ? 'future' : new Date(milestone.date).getFullYear()
  }`;

  return (
    <div
      className={`ms-node-wrapper ms-node-wrapper--${orientation}`}
      style={{ '--ms-node-color': color } as React.CSSProperties}
    >
      <div className="ms-node__label-top">
        {orientation === 'horizontal' && (
          <span className="ms-node__year">
            {isFuture ? '?' : new Date(milestone.date).getFullYear()}
          </span>
        )}
      </div>

      <button
        ref={nodeRef}
        className={[
          'ms-node__dot',
          isFeatured ? 'ms-node__dot--featured' : '',
          isFuture   ? 'ms-node__dot--future'   : '',
        ].filter(Boolean).join(' ')}
        style={{ '--size': `${size}px` } as React.CSSProperties}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={label}
        type="button"
      />

      {open && (
        <div className="ms-node__card-container">
          <MilestoneCard milestone={milestone} onClose={() => setOpen(false)} />
        </div>
      )}

      {orientation === 'vertical' && (
        <span className="ms-node__title-side">{milestone.title}</span>
      )}

      <style>{`
        .ms-node-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .ms-node-wrapper--horizontal {
          width: 200px;
          justify-content: center;
        }

        .ms-node-wrapper--vertical {
          flex-direction: row;
          gap: 16px;
          padding: 12px 0;
          align-items: center;
        }

        .ms-node__year {
          font-family: "JetBrains Mono", monospace;
          font-size: 0.6875rem;
          color: var(--ms-node-color);
          margin-bottom: 8px;
          display: block;
          text-align: center;
        }

        .ms-node__label-top {
          min-height: 20px;
        }

        .ms-node__dot {
          width: var(--size, 12px);
          height: var(--size, 12px);
          border-radius: 50%;
          background-color: var(--ms-node-color);
          border: 2px solid var(--ms-node-color);
          cursor: pointer;
          padding: 0;
          transition: transform 200ms ease, box-shadow 200ms ease;
          flex-shrink: 0;
        }

        .ms-node__dot:hover,
        .ms-node__dot:focus-visible {
          transform: scale(1.4);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--ms-node-color) 30%, transparent);
          outline: none;
        }

        .ms-node__dot--featured {
          box-shadow: 0 0 12px color-mix(in srgb, var(--ms-node-color) 50%, transparent);
        }

        .ms-node__dot--future {
          background-color: transparent;
          border-style: dashed;
          opacity: 0.7;
        }

        .ms-node__card-container {
          position: absolute;
          top: calc(100% + 12px);
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }

        .ms-node-wrapper--vertical .ms-node__card-container {
          top: 0;
          left: calc(100% + 16px);
          transform: none;
        }

        .ms-node__title-side {
          font-size: 0.8125rem;
          color: rgba(240,236,228,0.6);
          max-width: 180px;
          line-height: 1.4;
        }

        @media (prefers-reduced-motion: reduce) {
          .ms-node__dot { transition: none; }
        }
      `}</style>
    </div>
  );
}
