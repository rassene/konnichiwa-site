/**
 * Immersive layer — Tappable family member position in the scene (T105).
 * Activates member card display on click/Enter/Space.
 * Shows member's emoji overlay if defined.
 */
import type { IFamilyMember } from '../../content/interfaces/index.js';

interface FamilyMemberSpotProps {
  member: IFamilyMember;
  isActive: boolean;
  onActivate: () => void;
}

export default function FamilyMemberSpot({ member, isActive, onActivate }: FamilyMemberSpotProps) {
  return (
    <button
      className={`fm-spot${isActive ? ' fm-spot--active' : ''}`}
      onClick={onActivate}
      aria-pressed={isActive}
      aria-label={`${member.name} — ${member.relation}`}
      type="button"
    >
      {member.photo?.url ? (
        <img
          src={member.photo.url}
          alt=""
          aria-hidden="true"
          className="fm-spot__photo"
          width={60}
          height={60}
        />
      ) : (
        <div className="fm-spot__avatar" aria-hidden="true">
          {member.emoji ?? '♡'}
        </div>
      )}

      {member.emoji && member.photo?.url && (
        <span className="fm-spot__emoji" aria-hidden="true">{member.emoji}</span>
      )}

      <span className="fm-spot__name">{member.name}</span>
      <span className="fm-spot__relation">{member.relation}</span>

      <style>{`
        .fm-spot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: none;
          border: 2px solid rgba(232,168,124,0.2);
          border-radius: 16px;
          cursor: pointer;
          color: rgba(253,244,236,0.7);
          transition: all 200ms ease;
          position: relative;
          min-width: 120px;
        }

        .fm-spot:hover {
          border-color: rgba(232,168,124,0.5);
          background: rgba(232,168,124,0.08);
          transform: translateY(-4px);
        }

        .fm-spot:focus-visible {
          outline: 2px solid #E8A87C;
          outline-offset: 2px;
        }

        .fm-spot--active {
          border-color: #E8A87C;
          background: rgba(232,168,124,0.12);
          transform: translateY(-4px);
        }

        .fm-spot__photo {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(232,168,124,0.3);
        }

        .fm-spot__avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(232,168,124,0.15);
          border: 2px solid rgba(232,168,124,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
        }

        .fm-spot__emoji {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 1rem;
          line-height: 1;
        }

        .fm-spot__name {
          font-family: "Playfair Display", Georgia, serif;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #fdf4ec;
        }

        .fm-spot__relation {
          font-family: "JetBrains Mono", monospace;
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #E8A87C;
        }

        @media (prefers-reduced-motion: reduce) {
          .fm-spot,
          .fm-spot:hover,
          .fm-spot--active { transform: none; transition: none; }
        }
      `}</style>
    </button>
  );
}
