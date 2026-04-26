'use client';

import { useState, useRef, useCallback } from 'react';
import { cardFlip } from '@/lib/game/sounds';

interface Props {
  role: string;
  alignment: string;
  description: string;
  onRevealed: () => void;
  startFlipped?: boolean;
}

const ROLE_SLUG_MAP: Record<string, string> = {
  Missionary: 'missionary',
  Angel: 'angel',
  Prophet: 'prophet',
  Evangelist: 'evangelist',
  Assassin: 'assassin',
  'Agent of Babylon': 'agent-of-babylon',
  'Dark Angel': 'dark-angel',
};

const ROLE_FALLBACK_ICON: Record<string, string> = {
  Missionary: '\u2720',     // cross
  Angel: '\uD83D\uDC7C',   // angel/wings
  Prophet: '\uD83D\uDC41',  // eye
  Evangelist: '\uD83D\uDD25', // flame
  Assassin: '\uD83D\uDDE1', // dagger
  'Agent of Babylon': '\uD83C\uDFAD', // mask
  'Dark Angel': '\uD83E\uDEB6', // dark wings (feather)
};

export default function RoleRevealCard({ role, alignment, description, onRevealed, startFlipped }: Props) {
  const [flipped, setFlipped] = useState(startFlipped ?? false);
  const [backImageError, setBackImageError] = useState(false);
  const [roleImageError, setRoleImageError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isBabylon = alignment === 'Babylon';
  const slug = ROLE_SLUG_MAP[role] || role.toLowerCase().replace(/\s+/g, '-');
  const borderColor = isBabylon ? '#8b1a1a' : '#c8a44e';
  const glowColor = isBabylon ? 'rgba(139, 26, 26, 0.6)' : 'rgba(200, 164, 78, 0.5)';

  const handleReveal = useCallback(() => {
    if (flipped) return;
    cardFlip();
    setFlipped(true);
  }, [flipped]);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Card container */}
      <div
        ref={containerRef}
        className="card-flip-container"
        style={{ width: 'min(240px, 60vw)', height: 'min(500px, 55vh)', aspectRatio: '262 / 750' }}
      >
        <div className={`card-flip-inner ${flipped ? 'flipped' : ''}`}>
          {/* FRONT FACE — Card Back (visible initially) */}
          <div
            className="card-flip-front"
            style={{
              border: `3px solid ${isBabylon ? '#c8a44e' : '#c8a44e'}`,
              background: '#0a0e1a',
            }}
          >
            {!backImageError ? (
              <img
                src="/cards/card-back.png"
                alt="Card Back"
                className="w-full h-full object-cover"
                onError={() => setBackImageError(true)}
              />
            ) : (
              /* CSS Fallback — Card Back */
              <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
                {/* Decorative cross pattern */}
                <div className="absolute inset-0 opacity-[0.07]" style={{
                  backgroundImage: `
                    repeating-linear-gradient(45deg, #c8a44e 0px, #c8a44e 1px, transparent 1px, transparent 20px),
                    repeating-linear-gradient(-45deg, #c8a44e 0px, #c8a44e 1px, transparent 1px, transparent 20px)
                  `,
                }} />
                {/* Center compass cross */}
                <div className="absolute" style={{
                  width: 120,
                  height: 120,
                  border: '1px solid rgba(200, 164, 78, 0.15)',
                  borderRadius: '50%',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }} />
                <div className="absolute" style={{
                  width: 80,
                  height: 80,
                  border: '1px solid rgba(200, 164, 78, 0.2)',
                  borderRadius: '50%',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }} />
                {/* Vertical line */}
                <div className="absolute" style={{
                  width: 1,
                  height: 100,
                  background: 'rgba(200, 164, 78, 0.2)',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }} />
                {/* Horizontal line */}
                <div className="absolute" style={{
                  width: 100,
                  height: 1,
                  background: 'rgba(200, 164, 78, 0.2)',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }} />
                {/* Top border accent */}
                <div className="absolute top-3 left-3 right-3 bottom-3 rounded" style={{
                  border: '1px solid rgba(200, 164, 78, 0.25)',
                }} />
                <div className="absolute top-5 left-5 right-5 bottom-5 rounded-sm" style={{
                  border: '1px solid rgba(200, 164, 78, 0.12)',
                }} />
                {/* Title */}
                <div className="relative z-10 text-center px-6">
                  <p className="font-serif text-lg font-bold tracking-wide" style={{ color: '#c8a44e' }}>
                    The Great
                  </p>
                  <p className="font-serif text-2xl font-bold tracking-wider mt-[-2px]" style={{ color: '#c8a44e' }}>
                    Controversy
                  </p>
                  <div className="w-16 h-px mx-auto my-3" style={{ background: 'rgba(200, 164, 78, 0.4)' }} />
                  <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'rgba(200, 164, 78, 0.5)' }}>
                    A Last Day ADVENTure Game
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* BACK FACE — Role (hidden initially, shown after flip) */}
          <div
            className={`card-flip-back ${flipped ? 'card-role-glow' : ''}`}
            style={{
              border: `3px solid ${borderColor}`,
              background: '#0a0e1a',
              boxShadow: flipped ? `0 0 30px ${glowColor}, inset 0 2px 8px rgba(0,0,0,0.5)` : 'inset 0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            {!roleImageError ? (
              <div className="relative w-full h-full">
                <img
                  src={`/cards/${slug}.png`}
                  alt={role}
                  className="w-full h-full object-cover"
                  onError={() => setRoleImageError(true)}
                />
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(to top, rgba(10, 14, 26, 0.95) 0%, rgba(10, 14, 26, 0.6) 35%, transparent 60%)',
                }} />
                {/* Role info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
                  <h3 className="font-serif text-2xl font-bold text-white mb-1.5">{role}</h3>
                  <span
                    className="inline-block px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-2.5"
                    style={{
                      background: isBabylon ? 'rgba(139, 26, 26, 0.4)' : 'rgba(200, 164, 78, 0.2)',
                      color: isBabylon ? '#ef4444' : '#c8a44e',
                      border: `1px solid ${isBabylon ? 'rgba(239, 68, 68, 0.3)' : 'rgba(200, 164, 78, 0.3)'}`,
                    }}
                  >
                    {alignment}
                  </span>
                  <p className="text-white/70 text-xs leading-relaxed">{description}</p>
                </div>
              </div>
            ) : (
              /* CSS Fallback — Role Side */
              <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0" style={{
                  background: isBabylon
                    ? 'radial-gradient(ellipse at center, rgba(139, 26, 26, 0.15), transparent 70%)'
                    : 'radial-gradient(ellipse at center, rgba(200, 164, 78, 0.1), transparent 70%)',
                }} />
                {/* Inner border */}
                <div className="absolute top-3 left-3 right-3 bottom-3 rounded" style={{
                  border: `1px solid ${isBabylon ? 'rgba(139, 26, 26, 0.3)' : 'rgba(200, 164, 78, 0.25)'}`,
                }} />
                {/* Large icon */}
                <div className="text-7xl mb-4 opacity-90" style={{
                  filter: isBabylon ? 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.4))' : 'drop-shadow(0 0 12px rgba(200, 164, 78, 0.4))',
                }}>
                  {ROLE_FALLBACK_ICON[role] || '\u2726'}
                </div>
                {/* Role info */}
                <h3 className="font-serif text-2xl font-bold mb-1.5" style={{
                  color: isBabylon ? '#ef4444' : '#c8a44e',
                }}>
                  {role}
                </h3>
                <span
                  className="inline-block px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-4"
                  style={{
                    background: isBabylon ? 'rgba(139, 26, 26, 0.4)' : 'rgba(200, 164, 78, 0.2)',
                    color: isBabylon ? '#ef4444' : '#c8a44e',
                    border: `1px solid ${isBabylon ? 'rgba(239, 68, 68, 0.3)' : 'rgba(200, 164, 78, 0.3)'}`,
                  }}
                >
                  {alignment}
                </span>
                <p className="text-white/60 text-xs leading-relaxed text-center px-6">{description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reveal button */}
      {!flipped && !startFlipped && (
        <button
          onClick={handleReveal}
          className="btn btn-primary animate-pulse-soft"
          style={{ minWidth: 200 }}
        >
          Tap to Reveal
        </button>
      )}

      {/* Continue button — shown after flip */}
      {flipped && !startFlipped && (
        <button
          onClick={onRevealed}
          className="btn btn-primary animate-fade-in"
          style={{ minWidth: 200 }}
        >
          Continue
        </button>
      )}
    </div>
  );
}
