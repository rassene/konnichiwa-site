/**
 * Immersive layer — SVG/CSS animated timeline connector path (T098).
 * Animates on scroll via Intersection Observer. Respects prefers-reduced-motion.
 * Desktop: horizontal line. Mobile: vertical line.
 */
import { useEffect, useRef, useState } from 'react';

interface TimelinePathProps {
  /** Orientation passed from LifeMapCanvas based on viewport. */
  orientation: 'horizontal' | 'vertical';
  /** Number of milestones — used to scale the path length. */
  nodeCount: number;
}

export default function TimelinePath({ orientation, nodeCount }: TimelinePathProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [progress, setProgress] = useState(0);
  const prefersReduced = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (prefersReduced.current) {
      setProgress(1);
      return;
    }

    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setProgress(entry.intersectionRatio);
          }
        });
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );

    observer.observe(path);
    return () => observer.disconnect();
  }, [orientation, nodeCount]);

  useEffect(() => {
    if (!pathRef.current || prefersReduced.current) return;
    const path = pathRef.current;
    const length = path.getTotalLength();
    path.style.strokeDashoffset = String(length * (1 - progress));
  }, [progress]);

  if (orientation === 'horizontal') {
    const W = nodeCount * 200 + 100;
    const H = 4;
    return (
      <svg
        className="timeline-path timeline-path--h"
        width={W}
        height={H}
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          d={`M 50 2 L ${W - 50} 2`}
          stroke="rgba(240,236,228,0.15)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <style>{`
          .timeline-path--h {
            position: absolute;
            top: 50%;
            left: 0;
            transform: translateY(-50%);
            pointer-events: none;
            transition: stroke-dashoffset 600ms cubic-bezier(0.16,1,0.3,1);
          }
          @media (prefers-reduced-motion: reduce) {
            .timeline-path--h { transition: none; }
          }
        `}</style>
      </svg>
    );
  }

  const H = nodeCount * 160 + 80;
  return (
    <svg
      className="timeline-path timeline-path--v"
      width="4"
      height={H}
      aria-hidden="true"
    >
      <path
        ref={pathRef}
        d={`M 2 40 L 2 ${H - 40}`}
        stroke="rgba(240,236,228,0.15)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <style>{`
        .timeline-path--v {
          position: absolute;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
          pointer-events: none;
          transition: stroke-dashoffset 600ms cubic-bezier(0.16,1,0.3,1);
        }
        @media (prefers-reduced-motion: reduce) {
          .timeline-path--v { transition: none; }
        }
      `}</style>
    </svg>
  );
}
