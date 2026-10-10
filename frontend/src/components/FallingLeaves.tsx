import React, { useEffect, useState } from 'react';

interface LeafConfig {
  id: number;
  leftPercent: number;
  width: number;
  height: number;
  durationSec: number;
  delaySec: number;
  driftKeyframe: string;
  fillColor: string;
}

const LEAVES: LeafConfig[] = [
  {
    id: 1,
    leftPercent: 14,
    width: 14,
    height: 18,
    durationSec: 22,
    delaySec: -4,
    driftKeyframe: 'leaf-drift-1',
    fillColor: '#8cb896',
  },
  {
    id: 2,
    leftPercent: 36,
    width: 12,
    height: 15,
    durationSec: 27,
    delaySec: -12,
    driftKeyframe: 'leaf-drift-2',
    fillColor: '#9ec4a7',
  },
  {
    id: 3,
    leftPercent: 62,
    width: 15,
    height: 19,
    durationSec: 24,
    delaySec: -8,
    driftKeyframe: 'leaf-drift-3',
    fillColor: '#80ad8b',
  },
  {
    id: 4,
    leftPercent: 82,
    width: 11,
    height: 14,
    durationSec: 29,
    delaySec: -18,
    driftKeyframe: 'leaf-drift-1',
    fillColor: '#a7cca9',
  },
  {
    id: 5,
    leftPercent: 94,
    width: 13,
    height: 17,
    durationSec: 25,
    delaySec: -14,
    driftKeyframe: 'leaf-drift-2',
    fillColor: '#93bc9d',
  },
];

export const FallingLeaves: React.FC = () => {
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Visibility detection to pause ambient animation when tab is inactive
    const handleVisibilityChange = () => {
      setIsDocumentVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Reduced motion media query check
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  if (prefersReducedMotion || !isDocumentVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {LEAVES.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute leaf-falling-ambient"
          style={{
            left: `${leaf.leftPercent}%`,
            top: '-24px',
            animation: `${leaf.driftKeyframe} ${leaf.durationSec}s ease-in-out infinite`,
            animationDelay: `${leaf.delaySec}s`,
            willChange: 'transform, opacity',
          }}
        >
          <svg
            width={leaf.width}
            height={leaf.height}
            viewBox="0 0 16 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Delicate curved leaf blade */}
            <path
              d="M8 0C3 5 0 10 1 15C2 20 8 20 12 18C16 16 16 9 8 0Z"
              fill={leaf.fillColor}
              opacity="0.85"
            />
            {/* Fine central leaf vein */}
            <path
              d="M8 0C7 8 7 14 6 18"
              stroke="#5a7b63"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
        </div>
      ))}
    </div>
  );
};
