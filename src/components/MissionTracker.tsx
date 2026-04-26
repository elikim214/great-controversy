'use client';

import { useEffect, useRef } from 'react';
import type { ClientMission } from '@/lib/game/types';

interface Props {
  missions: ClientMission[];
  currentIndex: number;
  hideCurrentResult?: boolean;
}

export default function MissionTracker({ missions, currentIndex, hideCurrentResult }: Props) {
  // Calculate score
  const successes = missions.filter(m => m.result === 'success').length;
  const failures = missions.filter(m => m.result === 'failure').length;

  // Track previous values for pop animation
  const prevSuccesses = useRef(successes);
  const prevFailures = useRef(failures);
  const successRef = useRef<HTMLSpanElement>(null);
  const failureRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (successes > prevSuccesses.current && successRef.current) {
      successRef.current.classList.remove('score-pop');
      void successRef.current.offsetWidth; // force reflow
      successRef.current.classList.add('score-pop');
    }
    prevSuccesses.current = successes;
  }, [successes]);

  useEffect(() => {
    if (failures > prevFailures.current && failureRef.current) {
      failureRef.current.classList.remove('score-pop');
      void failureRef.current.offsetWidth; // force reflow
      failureRef.current.classList.add('score-pop');
    }
    prevFailures.current = failures;
  }, [failures]);

  // Background tint based on who's winning
  let bgTint = 'transparent';
  if (successes > failures) bgTint = 'rgba(200, 164, 78, 0.06)';
  else if (failures > successes) bgTint = 'rgba(217, 79, 79, 0.06)';

  return (
    <div
      className="rounded-lg px-4 py-3 transition-colors duration-500"
      style={{
        background: bgTint,
        border: '1px solid var(--card-border)',
      }}
    >
      {/* Score banner */}
      {(successes > 0 || failures > 0) && (
        <div className="flex items-center justify-center gap-3 mb-3 animate-fade-in">
          <div className="text-center">
            <span
              ref={successRef}
              className="font-serif font-bold text-success"
              style={{ fontSize: 'var(--score-font-size, 1.75rem)' }}
            >
              {successes}
            </span>
            <p className="text-[9px] text-muted uppercase tracking-wider">Successes</p>
          </div>
          <span className="text-muted font-serif text-lg">&mdash;</span>
          <div className="text-center">
            <span
              ref={failureRef}
              className="font-serif font-bold text-danger"
              style={{ fontSize: 'var(--score-font-size, 1.75rem)' }}
            >
              {failures}
            </span>
            <p className="text-[9px] text-muted uppercase tracking-wider">Failures</p>
          </div>
        </div>
      )}

      {/* Mission dots */}
      <div className="flex items-center justify-center">
        {missions.map((m, i) => {
          const shouldHideResult = hideCurrentResult && i === currentIndex;
          let dotClass = 'mission-dot';
          if (!shouldHideResult && m.result === 'success') dotClass += ' success';
          else if (!shouldHideResult && m.result === 'failure') dotClass += ' failure';
          else if (i === currentIndex) dotClass += ' active';
          else dotClass += ' pending';

          const isCompleted = !shouldHideResult && (m.result === 'success' || m.result === 'failure');

          return (
            <div key={m.missionNumber} className="flex items-center">
              {i > 0 && (
                <div
                  className="h-[2px] w-6"
                  style={{
                    background: i <= currentIndex || missions[i - 1].result
                      ? 'var(--accent-blue)'
                      : 'var(--card-border)',
                    opacity: i <= currentIndex || missions[i - 1].result ? 0.6 : 0.3,
                  }}
                />
              )}
              <div
                className="flex flex-col items-center animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={dotClass}>
                  {isCompleted ? (
                    m.result === 'success' ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2,7 5.5,10.5 12,3.5" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="2" y1="2" x2="10" y2="10" />
                        <line x1="10" y1="2" x2="2" y2="10" />
                      </svg>
                    )
                  ) : (
                    <span className="text-xs font-bold">{m.requiredTeamSize}</span>
                  )}
                </div>
                <span className={`text-[0.6rem] mt-1 ${m.requiresTwoFails ? 'text-gold font-bold' : 'text-muted'}`}>
                  {m.requiresTwoFails ? '2 fails' : `M${m.missionNumber}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
