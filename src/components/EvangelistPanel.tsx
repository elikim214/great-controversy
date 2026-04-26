'use client';

import { useState } from 'react';
import type { ClientPlayer, PlayerPrivateInfo } from '@/lib/game/types';
import { Role } from '@/lib/game/types';

interface Props {
  players: ClientPlayer[];
  privateInfo: PlayerPrivateInfo;
  myId: string;
  hasActed: boolean;
  onConvert: (targetId: string) => void;
  onSkip: () => void;
  isHost: boolean;
  playerCount: number;
}

export default function EvangelistPanel({ players, privateInfo, myId, hasActed, onConvert, onSkip, isHost, playerCount }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isEvangelist = privateInfo.role === Role.Evangelist;
  const isInspectMode = playerCount >= 7 && playerCount <= 9;

  if (!isEvangelist) {
    return (
      <div className="text-center py-10 px-6">
        <p className="text-muted text-base leading-relaxed pulse-glow" style={{ color: isInspectMode ? 'var(--accent-blue)' : 'var(--accent-gold)' }}>
          {isInspectMode
            ? 'The Evangelist is investigating a fellow player to discern their true allegiance.'
            : 'The Evangelist is sharing their testimony with a fellow player. If that player\'s heart is moved, they will give themselves fully to Jesus \u2014 even if they were secretly Babylon.'
          }
        </p>
        {isHost && (
          <button onClick={onSkip} className="btn btn-secondary mt-6 text-sm">
            Skip (Host)
          </button>
        )}
      </div>
    );
  }

  if (hasActed) {
    return (
      <div className="text-center py-10 px-6">
        <p className="text-success text-base">
          {isInspectMode ? 'The investigation is complete.' : 'The testimony has been shared.'}
        </p>
      </div>
    );
  }

  const otherPlayers = players.filter(p => p.id !== myId);
  const accentColor = isInspectMode ? 'var(--accent-blue)' : 'var(--accent-gold)';
  const accentBg = isInspectMode ? 'rgba(74,144,217,0.06)' : 'rgba(200,164,78,0.06)';
  const accentBgSelected = isInspectMode ? 'rgba(74,144,217,0.12)' : 'rgba(200,164,78,0.12)';

  return (
    <div
      className="rounded-lg animate-fade-in-up"
      style={{
        background: accentBg,
        borderLeft: `4px solid ${accentColor}`,
        padding: '2rem 1.5rem',
      }}
    >
      <h3
        className="font-serif text-2xl font-bold mb-2 text-center animate-text-reveal"
        style={{ color: accentColor }}
      >
        {isInspectMode ? 'Investigate a Player' : 'Share Your Testimony'}
      </h3>
      <p className="text-sm text-muted text-center mb-6 leading-relaxed">
        {isInspectMode
          ? 'Choose a player to investigate their true alignment. You will learn whether they serve the Mission Team or Babylon.'
          : 'Choose a player to share your testimony with. Your words may compel them to give their heart fully to Jesus \u2014 even if they were secretly serving Babylon.'
        }
      </p>

      <div className="space-y-1 mb-6">
        {otherPlayers.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center justify-between px-4 cursor-pointer transition-all animate-fade-in-up"
            style={{
              animationDelay: `${i * 60}ms`,
              minHeight: 56,
              borderLeft: selectedId === p.id ? `3px solid ${accentColor}` : '3px solid transparent',
              background: selectedId === p.id ? accentBgSelected : 'transparent',
              borderBottom: i < otherPlayers.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
            onClick={() => setSelectedId(p.id)}
          >
            <span className="text-sm font-medium">{p.displayName}</span>
            {selectedId === p.id && (
              <span style={{ color: accentColor }} className="text-sm">&#10003;</span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => selectedId && onConvert(selectedId)}
        disabled={!selectedId}
        className={`btn w-full ${isInspectMode ? 'btn-primary' : ''}`}
        style={!isInspectMode ? {
          background: 'var(--accent-gold)',
          color: '#080c16',
          borderColor: 'color-mix(in oklch, var(--accent-gold), white 20%)',
          fontWeight: 700,
        } : undefined}
      >
        {isInspectMode ? 'Investigate' : 'Share Testimony'}
      </button>
    </div>
  );
}
