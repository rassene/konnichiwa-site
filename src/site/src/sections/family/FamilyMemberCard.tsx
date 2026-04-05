/**
 * Immersive layer — Family member detail card (T106).
 * Slide-in panel: photo, name, relation, tagline, fun facts.
 * ARIA role="dialog" for accessibility.
 */
import type { IFamilyMember } from '../../content/interfaces/index.js';

interface FamilyMemberCardProps {
  member: IFamilyMember;
  onClose: () => void;
}

export default function FamilyMemberCard({ member, onClose }: FamilyMemberCardProps) {
  return (
    <div
      className="fm-card"
      role="dialog"
      aria-modal="true"
      aria-label={`${member.name} — ${member.relation}`}
    >
      <button
        className="fm-card__close"
        onClick={onClose}
        aria-label="Close"
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round"/>
        </svg>
      </button>

      <div className="fm-card__inner">
        {member.photo?.url ? (
          <div className="fm-card__photo-wrap">
            <img
              src={member.photo.url}
              alt={member.photo.alt || member.name}
              className="fm-card__photo"
              width={member.photo.width}
              height={member.photo.height}
              loading="lazy"
            />
            {member.emoji && (
              <span className="fm-card__emoji" aria-hidden="true">{member.emoji}</span>
            )}
          </div>
        ) : (
          <div className="fm-card__photo-placeholder" aria-hidden="true">
            {member.emoji ?? '♡'}
          </div>
        )}

        <div className="fm-card__body">
          <p className="fm-card__relation">{member.relation}</p>
          <h2 className="fm-card__name">{member.name}</h2>
          <p className="fm-card__tagline">{member.tagline}</p>

          {member.funFacts.length > 0 && (
            <ul className="fm-card__facts" aria-label="Fun facts">
              {member.funFacts.slice(0, 4).map((fact, i) => (
                <li key={i} className="fm-card__fact">
                  <span className="fm-card__fact-dot" aria-hidden="true">·</span>
                  {fact}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <style>{`
        .fm-card {
          position: relative;
          background: #2a1a10;
          border: 1px solid rgba(253,244,236,0.12);
          border-radius: 16px;
          padding: 28px;
          max-width: 380px;
          width: 100%;
          box-shadow: 0 12px 48px rgba(0,0,0,0.6);
          animation: fm-slide-in 600ms cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes fm-slide-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }

        .fm-card__close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: 1px solid rgba(253,244,236,0.15);
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(253,244,236,0.5);
          cursor: pointer;
          padding: 0;
          transition: border-color 200ms ease, color 200ms ease;
        }

        .fm-card__close:hover {
          border-color: rgba(253,244,236,0.4);
          color: #fdf4ec;
        }

        .fm-card__inner {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .fm-card__photo-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .fm-card__photo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(232,168,124,0.4);
        }

        .fm-card__emoji {
          position: absolute;
          bottom: -4px;
          right: -4px;
          font-size: 1.25rem;
          line-height: 1;
        }

        .fm-card__photo-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(232,168,124,0.15);
          border: 2px solid rgba(232,168,124,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          flex-shrink: 0;
        }

        .fm-card__body {
          flex: 1;
          min-width: 0;
        }

        .fm-card__relation {
          font-family: "JetBrains Mono", monospace;
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #E8A87C;
          margin: 0 0 4px;
        }

        .fm-card__name {
          font-family: "Playfair Display", Georgia, serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #fdf4ec;
          margin: 0 0 8px;
        }

        .fm-card__tagline {
          font-size: 0.875rem;
          color: rgba(253,244,236,0.7);
          line-height: 1.5;
          margin: 0 0 16px;
        }

        .fm-card__facts {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .fm-card__fact {
          display: flex;
          gap: 8px;
          font-size: 0.8125rem;
          color: rgba(253,244,236,0.6);
          line-height: 1.4;
        }

        .fm-card__fact-dot {
          color: #E8A87C;
          flex-shrink: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .fm-card { animation: none; }
          .fm-card__close { transition: none; }
        }
      `}</style>
    </div>
  );
}
