'use client';

import type { ClientMission } from '@/lib/game/types';

interface Props {
  missions: ClientMission[];
  currentIndex: number;
  hideCurrentResult?: boolean; // Hide current mission result during card reveal
}

export default function MissionTracker({ missions, currentIndex, hideCurrentResult }: Props) {
  return (
    <div className="flex items-center justify-center">
      {missions.map((m, i) => {
        // If hideCurrentResult is true, treat current mission as still active (don't show result)
        const shouldHideResult = hideCurrentResult && i === currentIndex;
        let dotClass = 'mission-dot';
        if (!shouldHideResult && m.result === 'success') dotClass += ' success';
        else if (!shouldHideResult && m.result === 'failure') dotClass += ' failure';
        else if (i === currentIndex) dotClass += ' active';
        else dotClass += ' pending';

        const isCompleted = !shouldHideResult && (m.result === 'success' || m.result === 'failure');

        return (
          <div
            key={m.missionNumber}
            className="flex items-center"
          >
            {/* Connecting line before (not on first dot) */}
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
              <span className="text-[0.6rem] text-muted mt-1">
                {m.requiresTwoFails ? '2F' : `M${m.missionNumber}`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
