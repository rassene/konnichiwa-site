/**
 * Immersive layer — Life Map main React island (T097 + T102).
 * JS cost: ~12 KB (React island with client:load) — justified: requires interactive
 * scroll state, category filter state, and milestone card toggling with Intersection Observer.
 *
 * data-layer="immersive" — immersive visual register, dark background, own motion tokens.
 * Desktop: horizontal scroll timeline. Mobile: vertical scroll timeline.
 */
import { useState, useEffect } from 'react';
import type { IMilestone } from '../../content/interfaces/index.js';
import CategoryFilter from './CategoryFilter.js';
import TimelinePath from './TimelinePath.js';
import MilestoneNode from './MilestoneNode.js';

type Category = IMilestone['category'] | 'all';

interface LifeMapCanvasProps {
  milestones: IMilestone[];
}

function useOrientation() {
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setOrientation(e.matches ? 'vertical' : 'horizontal');
    };
    update(mq);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return orientation;
}

export default function LifeMapCanvas({ milestones }: LifeMapCanvasProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const orientation = useOrientation();

  const filtered = milestones.filter(
    (m) => activeCategory === 'all' || m.category === activeCategory,
  );

  // Category counts (excluding 'all')
  const counts: Partial<Record<Category, number>> = {};
  for (const m of milestones) {
    counts[m.category] = (counts[m.category] ?? 0) + 1;
  }

  if (!milestones.length) {
    return (
      <div className="life-map" data-layer="immersive" aria-label="Life Map">
        <div className="life-map__empty">
          <p>No milestones yet — check back soon.</p>
        </div>
        <LifeMapStyles />
      </div>
    );
  }

  return (
    <div className="life-map" data-layer="immersive" aria-label="Life Map timeline">
      <header className="life-map__header">
        <h1 className="life-map__heading">Life Map</h1>
        <p className="life-map__subheading">
          {milestones.length} milestone{milestones.length !== 1 ? 's' : ''} — tap any dot to expand
        </p>
      </header>

      <div className="life-map__filters">
        <CategoryFilter
          active={activeCategory}
          counts={counts}
          onChange={setActiveCategory}
        />
      </div>

      <div
        className={`life-map__canvas life-map__canvas--${orientation}`}
        role="region"
        aria-label="Timeline"
        tabIndex={0}
      >
        <div className={`life-map__track life-map__track--${orientation}`}>
          <TimelinePath orientation={orientation} nodeCount={filtered.length} />
          {filtered.map((m) => (
            <MilestoneNode key={m.id} milestone={m} orientation={orientation} />
          ))}
          {filtered.length === 0 && (
            <p className="life-map__no-results">No milestones in this category.</p>
          )}
        </div>
      </div>

      <LifeMapStyles />
    </div>
  );
}

function LifeMapStyles() {
  return (
    <style>{`
      .life-map {
        min-height: 100svh;
        padding-top: 80px;
        background-color: #0f0f0e;
        color: #f0ece4;
      }

      .life-map__empty {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 60svh;
        color: rgba(240,236,228,0.4);
        font-size: 1rem;
      }

      .life-map__header {
        padding: 40px 24px 20px;
        text-align: center;
      }

      .life-map__heading {
        font-family: "Playfair Display", Georgia, serif;
        font-size: clamp(2.5rem, 8vw, 5rem);
        font-weight: 700;
        color: #f0ece4;
        margin: 0 0 8px;
        line-height: 1.05;
      }

      .life-map__subheading {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.8125rem;
        color: rgba(240,236,228,0.4);
        margin: 0;
        letter-spacing: 0.04em;
      }

      .life-map__filters {
        padding: 24px 0;
        display: flex;
        justify-content: center;
      }

      /* ─── Horizontal (desktop) ─────────────────────────────────────── */
      .life-map__canvas--horizontal {
        overflow-x: auto;
        overflow-y: visible;
        padding: 60px 0 100px;
        /* Custom scrollbar */
        scrollbar-width: thin;
        scrollbar-color: rgba(240,236,228,0.15) transparent;
      }

      .life-map__canvas--horizontal::-webkit-scrollbar {
        height: 4px;
      }

      .life-map__canvas--horizontal::-webkit-scrollbar-track {
        background: transparent;
      }

      .life-map__canvas--horizontal::-webkit-scrollbar-thumb {
        background: rgba(240,236,228,0.15);
        border-radius: 2px;
      }

      .life-map__track--horizontal {
        display: flex;
        align-items: center;
        position: relative;
        min-width: max-content;
        padding: 80px 80px;
        gap: 0;
      }

      /* ─── Vertical (mobile) ────────────────────────────────────────── */
      .life-map__canvas--vertical {
        overflow-y: auto;
        padding: 40px 24px;
      }

      .life-map__track--vertical {
        display: flex;
        flex-direction: column;
        position: relative;
        padding: 20px 0;
        gap: 0;
      }

      .life-map__no-results {
        color: rgba(240,236,228,0.4);
        font-size: 0.875rem;
        text-align: center;
        padding: 40px;
      }
    `}</style>
  );
}
