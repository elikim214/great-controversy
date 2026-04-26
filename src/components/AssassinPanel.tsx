'use client';

import { useState } from 'react';
import type { ClientPlayer, PlayerPrivateInfo } from '@/lib/game/types';
import { Role } from '@/lib/game/types';
import { buttonPress } from '@/lib/game/sounds';

interface Props {
  players: ClientPlayer[];
  privateInfo: PlayerPrivateInfo;
  myId: string;
  onGuess: (targetId: string) => void;
  guessesRemaining: number;
}

export default function AssassinPanel({ players, privateInfo, myId, onGuess, guessesRemaining }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const isAssassin = privateInfo.role === Role.Assassin;

  if (!isAssassin) {
    return (
      <div className="text-center py-12 px-6">
        <h3 className="font-serif text-2xl font-bold text-danger mb-4 animate-text-reveal">
          The Assassin Strikes
        </h3>
        <p className="text-muted text-lg pulse-glow leading-relaxed">
          The good side has completed 3 missions, but the Assassin has one final chance
          to identify the Angel...
        </p>
      </div>
    );
  }

  const otherPlayers = players.filter(p => p.id !== myId);

  return (
    <div
      className="rounded-lg animate-fade-in-up"
      style={{
        background: 'rgba(217,79,79,0.04)',
        borderLeft: '4px solid var(--danger)',
        padding: '2rem 1.5rem',
      }}
    >
      <h3 className="font-serif text-2xl font-bold mb-2 text-center text-danger animate-text-reveal">
        Assassin&apos;s Choice
      </h3>
      <p className="text-sm text-muted text-center mb-3">
        Choose the player you believe is the Angel.
        If correct, Babylon wins!
      </p>

      {/* Guesses remaining - prominent */}
      <div className="text-center mb-6">
        <span
          className="inline-block text-3xl font-bold font-serif text-danger"
        >
          {guessesRemaining}
        </span>
        <p className="text-xs text-muted uppercase tracking-wider mt-1">
          {guessesRemaining === 1 ? 'Guess Remaining' : 'Guesses Remaining'}
        </p>
      </div>

      <div className="space-y-1 mb-6">
        {otherPlayers.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center px-4 cursor-pointer transition-all animate-fade-in-up"
            style={{
              animationDelay: `${i * 60}ms`,
              minHeight: 56,
              borderLeft: selectedId === p.id ? '3px solid var(--danger)' : '3px solid transparent',
              background: selectedId === p.id ? 'rgba(217,79,79,0.1)' : 'transparent',
              borderBottom: i < otherPlayers.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
            onClick={() => !confirmed && setSelectedId(p.id)}
          >
            <span className="text-sm font-medium">{p.displayName}</span>
          </div>
        ))}
      </div>

      {!confirmed ? (
        <button
          onClick={() => { buttonPress(); selectedId && setConfirmed(true); }}
          disabled={!selectedId}
          className="btn btn-danger w-full"
        >
          Confirm Target
        </button>
      ) : (
        <div
          className="rounded-lg p-5 space-y-4 animate-scale-in"
          style={{ background: 'rgba(217,79,79,0.12)' }}
        >
          <p className="text-center text-danger font-bold font-serif text-lg">
            Are you sure? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmed(false)} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button onClick={() => { buttonPress(); selectedId && onGuess(selectedId); }} className="btn btn-danger flex-1">
              Strike
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
