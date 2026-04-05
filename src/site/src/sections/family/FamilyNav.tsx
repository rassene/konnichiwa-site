/**
 * Immersive layer — Prev/next navigation between family members (T107).
 * Supports swipe gesture on mobile via pointer events.
 */
import { useEffect, useRef } from 'react';

interface FamilyNavProps {
  total: number;
  activeIndex: number;
  onChange: (index: number) => void;
}

export default function FamilyNav({ total, activeIndex, onChange }: FamilyNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onPointerDown(e: PointerEvent) {
      swipeStartX.current = e.clientX;
    }

    function onPointerUp(e: PointerEvent) {
      if (swipeStartX.current === null) return;
      const dx = e.clientX - swipeStartX.current;
      const threshold = 50;
      if (dx < -threshold && activeIndex < total - 1) onChange(activeIndex + 1);
      else if (dx > threshold && activeIndex > 0) onChange(activeIndex - 1);
      swipeStartX.current = null;
    }

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', onPointerUp);
    };
  }, [activeIndex, total, onChange]);

  if (total <= 1) return null;

  return (
    <div ref={containerRef} className="fm-nav" aria-label="Navigate family members">
      <button
        className="fm-nav__btn"
        onClick={() => onChange(activeIndex - 1)}
        disabled={activeIndex === 0}
        aria-label="Previous family member"
        type="button"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className="fm-nav__dots" role="tablist" aria-label="Family member tabs">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            className={`fm-nav__dot${i === activeIndex ? ' fm-nav__dot--active' : ''}`}
            onClick={() => onChange(i)}
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Member ${i + 1} of ${total}`}
            type="button"
          />
        ))}
      </div>

      <button
        className="fm-nav__btn"
        onClick={() => onChange(activeIndex + 1)}
        disabled={activeIndex === total - 1}
        aria-label="Next family member"
        type="button"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <style>{`
        .fm-nav {
          display: flex;
          align-items: center;
          gap: 16px;
          justify-content: center;
          padding: 24px 0;
          touch-action: pan-y;
        }

        .fm-nav__btn {
          background: none;
          border: 1px solid rgba(232,168,124,0.3);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(253,244,236,0.6);
          cursor: pointer;
          padding: 0;
          transition: border-color 200ms ease, color 200ms ease, opacity 200ms ease;
        }

        .fm-nav__btn:hover:not(:disabled) {
          border-color: #E8A87C;
          color: #fdf4ec;
        }

        .fm-nav__btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .fm-nav__dots {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .fm-nav__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(232,168,124,0.3);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 200ms ease;
        }

        .fm-nav__dot--active {
          background: #E8A87C;
          width: 20px;
          border-radius: 4px;
        }

        .fm-nav__dot:focus-visible {
          outline: 2px solid #E8A87C;
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .fm-nav__btn,
          .fm-nav__dot { transition: none; }
        }
      `}</style>
    </div>
  );
}
