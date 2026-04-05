/**
 * Immersive layer — Meet the Family React island (T104 + T108).
 * JS cost: ~10 KB (React island with client:load) — justified: requires interactive
 * selection state, keyboard navigation, swipe gestures, and animated card display.
 *
 * data-layer="immersive" — warm/playful palette, distinct from shell and Life Map.
 * Manages selected member state; supports keyboard navigation across spots.
 */
import { useState, useCallback } from 'react';
import type { IFamilyMember } from '../../content/interfaces/index.js';
import FamilyMemberSpot from './FamilyMemberSpot.js';
import FamilyMemberCard from './FamilyMemberCard.js';
import FamilyNav from './FamilyNav.js';

interface FamilySceneProps {
  members: IFamilyMember[];
}

export default function FamilyScene({ members }: FamilySceneProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeMember = activeIndex !== null ? members[activeIndex] : null;

  const closeCard = useCallback(() => setActiveIndex(null), []);

  const handleNavChange = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  if (!members.length) {
    return (
      <div className="family-scene" data-layer="immersive" aria-label="Meet the Family">
        <div className="family-scene__empty">
          <p>Coming soon — the family is getting ready for their close-up.</p>
        </div>
        <FamilyStyles />
      </div>
    );
  }

  return (
    <div className="family-scene" data-layer="immersive" aria-label="Meet the Family">
      <header className="family-scene__header">
        <h1 className="family-scene__heading">Meet the Family</h1>
        <p className="family-scene__subheading">
          The people who make me who I am
        </p>
      </header>

      {/* Member spots grid */}
      <div
        className="family-scene__spots"
        role="group"
        aria-label="Family members"
      >
        {members.map((member, i) => (
          <FamilyMemberSpot
            key={member.id}
            member={member}
            isActive={activeIndex === i}
            onActivate={() => setActiveIndex(activeIndex === i ? null : i)}
          />
        ))}
      </div>

      {/* Navigation */}
      <FamilyNav
        total={members.length}
        activeIndex={activeIndex ?? 0}
        onChange={handleNavChange}
      />

      {/* Detail card overlay */}
      {activeMember && (
        <div className="family-scene__card-overlay" role="region" aria-label="Member details">
          <FamilyMemberCard member={activeMember} onClose={closeCard} />
        </div>
      )}

      <FamilyStyles />
    </div>
  );
}

function FamilyStyles() {
  return (
    <style>{`
      .family-scene {
        min-height: 100svh;
        padding-top: 80px;
        background-color: #1a0f0a;
        color: #fdf4ec;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .family-scene__empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(253,244,236,0.4);
        font-size: 1rem;
        padding: 40px;
        text-align: center;
      }

      .family-scene__header {
        padding: 40px 24px 24px;
        text-align: center;
        width: 100%;
        max-width: 800px;
      }

      .family-scene__heading {
        font-family: "Playfair Display", Georgia, serif;
        font-size: clamp(2.5rem, 8vw, 5rem);
        font-weight: 700;
        color: #fdf4ec;
        margin: 0 0 8px;
        line-height: 1.05;
      }

      .family-scene__subheading {
        font-size: 1rem;
        color: rgba(253,244,236,0.5);
        margin: 0;
        font-style: italic;
      }

      .family-scene__spots {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: center;
        padding: 32px 24px;
        max-width: 900px;
        width: 100%;
      }

      .family-scene__card-overlay {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 50;
        width: calc(100% - 48px);
        max-width: 420px;
        display: flex;
        justify-content: center;
      }

      @media (min-width: 768px) {
        .family-scene__card-overlay {
          position: static;
          transform: none;
          width: 100%;
          max-width: 800px;
          padding: 0 24px 40px;
          display: flex;
          justify-content: center;
        }
      }
    `}</style>
  );
}
