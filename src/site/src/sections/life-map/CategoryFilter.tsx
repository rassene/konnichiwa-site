/**
 * Immersive layer — Life Map category filter (T101).
 * Pill group filter; updates parent filter state via callback.
 */
import type { IMilestone } from '../../content/interfaces/index.js';

type Category = IMilestone['category'] | 'all';

const CATEGORY_LABELS: Record<Category, string> = {
  all:          'All',
  academic:     'Academic',
  personal:     'Personal',
  professional: 'Professional',
  social:       'Social',
  creative:     'Creative',
  future:       'Future',
};

const CATEGORY_COLORS: Record<Category, string> = {
  all:          '#9b8ea0',
  academic:     '#4A90D9',
  personal:     '#E8A87C',
  professional: '#2ECC71',
  social:       '#E67E22',
  creative:     '#9B59B6',
  future:       '#D4522A',
};

interface CategoryFilterProps {
  active: Category;
  counts: Partial<Record<Category, number>>;
  onChange: (cat: Category) => void;
}

export default function CategoryFilter({ active, counts, onChange }: CategoryFilterProps) {
  const categories = Object.keys(CATEGORY_LABELS) as Category[];

  return (
    <div className="cat-filter" role="group" aria-label="Filter milestones by category">
      {categories.map((cat) => {
        const count = cat === 'all'
          ? Object.values(counts).reduce((a, b) => (a ?? 0) + (b ?? 0), 0)
          : counts[cat];
        if (cat !== 'all' && !count) return null;
        return (
          <button
            key={cat}
            className={`cat-filter__pill${active === cat ? ' cat-filter__pill--active' : ''}`}
            style={{
              '--pill-color': CATEGORY_COLORS[cat],
            } as React.CSSProperties}
            onClick={() => onChange(cat)}
            aria-pressed={active === cat}
            type="button"
          >
            <span className="cat-filter__label">{CATEGORY_LABELS[cat]}</span>
            {count != null && (
              <span className="cat-filter__count" aria-hidden="true">{count}</span>
            )}
          </button>
        );
      })}

      <style>{`
        .cat-filter {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 0 24px;
        }

        .cat-filter__pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid rgba(240, 236, 228, 0.15);
          background: rgba(240, 236, 228, 0.06);
          color: rgba(240, 236, 228, 0.6);
          font-family: "DM Sans", system-ui, sans-serif;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 200ms ease;
        }

        .cat-filter__pill:hover {
          border-color: var(--pill-color);
          color: var(--pill-color);
          background: rgba(240, 236, 228, 0.1);
        }

        .cat-filter__pill--active {
          border-color: var(--pill-color);
          background: color-mix(in srgb, var(--pill-color) 20%, transparent);
          color: #f0ece4;
        }

        .cat-filter__count {
          font-family: "JetBrains Mono", monospace;
          font-size: 0.75rem;
          opacity: 0.7;
        }

        @media (prefers-reduced-motion: reduce) {
          .cat-filter__pill { transition: none; }
        }
      `}</style>
    </div>
  );
}
