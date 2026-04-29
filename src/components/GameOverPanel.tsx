'use client';

import { useState } from 'react';
import type { GameResult, ClientPlayer } from '@/lib/game/types';
import { Alignment } from '@/lib/game/types';
import SecondComingVictory from './SecondComingVictory';

interface Props {
  result: GameResult;
  players: ClientPlayer[];
  isHost: boolean;
  onRestart: () => void;
  onReturnToLobby: () => void;
}

export default function GameOverPanel({ result, players, isHost, onRestart, onReturnToLobby }: Props) {
  const isGoodWin = result.winner === Alignment.MissionTeam;
  const [showVictory, setShowVictory] = useState(isGoodWin);

  // Show the Second Coming animation for 6 seconds when Mission Team wins
  if (showVictory) {
    setTimeout(() => setShowVictory(false), 6000);
    return <SecondComingVictory />;
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/95 p-6 animate-phase-reveal">
      <div className="w-full max-w-md text-center space-y-6">
        <h2 className={`font-serif text-4xl md:text-5xl font-bold tracking-tight text-balance ${isGoodWin ? 'text-gold' : 'text-danger'}`}>
          {isGoodWin ? 'The Light Prevails' : 'Babylon Triumphs'}
        </h2>

        {/* Mission score */}
        <div className="flex items-baseline justify-center gap-4">
          <div className="text-center">
            <p className="font-serif text-5xl font-bold text-success">{result.missionSuccesses}</p>
            <p className="text-xs text-muted mt-1 uppercase tracking-wider">Successes</p>
          </div>
          <span className="font-serif text-3xl text-muted/40">&mdash;</span>
          <div className="text-center">
            <p className="font-serif text-5xl font-bold text-danger">{result.missionFailures}</p>
            <p className="text-xs text-muted mt-1 uppercase tracking-wider">Failures</p>
          </div>
        </div>

        <p className="text-foreground/70 leading-relaxed">
          {result.reason}
        </p>

        {result.assassinGuessCorrect !== undefined && (
          <div className="space-y-1">
            <p className="text-sm text-muted">
              The Assassin targeted{' '}
              <span className="font-bold text-gold">{result.assassinGuessTargetName}</span>
            </p>
            <p className={`text-sm font-bold ${result.assassinGuessCorrect ? 'text-danger' : 'text-success'}`}>
              {result.assassinGuessCorrect ? 'Correct — the Angel was found!' : 'Wrong — the Angel was safe!'}
            </p>
          </div>
        )}

        {/* All Roles Revealed */}
        {players.some(p => p.revealedRole) && (
          <div className="w-full text-left space-y-2">
            <h3 className="font-serif text-lg font-bold text-center text-gold">All Roles Revealed</h3>
            <div className="space-y-1.5">
              {players.map((p, i) => {
                const isBabylon = p.revealedAlignment === 'Babylon';
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg animate-fade-in-up"
                    style={{
                      background: isBabylon ? 'rgba(239,68,68,0.08)' : 'rgba(74,144,217,0.08)',
                      border: `1px solid ${isBabylon ? 'rgba(239,68,68,0.2)' : 'rgba(74,144,217,0.2)'}`,
                      animationDelay: `${i * 80}ms`,
                    }}
                  >
                    <span className="text-sm font-medium text-foreground/90">{p.displayName}</span>
                    <div className="text-right">
                      <span className={`text-xs font-semibold ${isBabylon ? 'text-danger' : 'text-blue'}`}>
                        {p.revealedRole} <span className="text-muted font-normal">({p.revealedAlignment})</span>
                      </span>
                      {p.wasConverted && (
                        <p className="text-[10px] text-gold italic">Converted by the Evangelist&apos;s testimony</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <button onClick={onRestart} className="btn btn-primary w-full py-4">
            Play Again
          </button>
          <button onClick={onReturnToLobby} className="btn btn-secondary w-full py-4">
            Return to Lobby
          </button>
        </div>
        {!isHost && (
          <p className="text-xs text-muted">Waiting for host to decide...</p>
        )}
      </div>
    </div>
  );
}
