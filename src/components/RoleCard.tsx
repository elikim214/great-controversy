'use client';

import type { PlayerPrivateInfo, ClientPlayer } from '@/lib/game/types';
import { Alignment, Role } from '@/lib/game/types';

interface Props {
  info: PlayerPrivateInfo;
  players: ClientPlayer[];
  compact?: boolean;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  [Role.Missionary]: 'A faithful servant. Support your team and trust your instincts.',
  [Role.Evangelist]: 'After mission 4, use your ability on one player. At 7-9 players: investigate their true alignment. At 10+ players: if they are Babylon, your testimony compels them to join the Mission Team.',
  [Role.Angel]: 'You know the identities of all Babylon agents. Guard this knowledge carefully.',
  [Role.Prophet]: 'You know who the Angel might be. If a Dark Angel is in play, you see two candidates but do not know which is the true Angel. Protect them at all costs.',
  [Role.AgentOfBabylon]: 'Sabotage the missions. Deceive the faithful. Delay the second coming.',
  [Role.Assassin]: 'If the good side wins by missions, you get a chance to identify the Angel. At 10+ players you get two guesses.',
  [Role.DarkAngel]: 'You appear as a possible Angel to the Prophet. Use this to sow confusion and misdirect the faithful.',
};

export default function RoleCard({ info, players, compact }: Props) {
  const isBabylon = info.alignment === Alignment.Babylon;

  const knownBabylonNames = info.knownBabylonIds
    .map(id => players.find(p => p.id === id)?.displayName)
    .filter(Boolean);

  const possibleAngelNames = (info.knownPossibleAngelIds?.length > 0
    ? info.knownPossibleAngelIds
    : info.knownAngelId ? [info.knownAngelId] : []
  ).map(id => players.find(p => p.id === id)?.displayName).filter(Boolean);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 animate-fade-in">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: isBabylon ? 'var(--danger)' : 'var(--accent-gold)' }}
        />
        <span className="font-bold text-sm font-serif">{info.role}</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg animate-scale-in"
      style={{
        background: 'var(--card-bg)',
        borderLeft: `4px solid ${isBabylon ? 'var(--danger)' : 'var(--accent-gold)'}`,
        padding: '2rem 2rem 2rem 2.25rem',
      }}
    >
      <div className="text-center mb-6">
        <h3 className="font-serif text-4xl font-bold mb-3 animate-text-reveal">{info.role}</h3>
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider animate-fade-in-up delay-300"
          style={{
            background: isBabylon ? 'rgba(217,79,79,0.15)' : 'rgba(200,164,78,0.15)',
            color: isBabylon ? 'var(--danger)' : 'var(--accent-gold)',
          }}
        >
          {info.alignment}
        </span>
      </div>

      <p className="text-center text-muted text-base leading-relaxed mb-6 animate-fade-in-up delay-400">
        {ROLE_DESCRIPTIONS[info.role]}
      </p>

      {/* One-time intel — visually demarcated so players know this (not the role itself) is the unrepeatable secret */}
      {(knownBabylonNames.length > 0 || possibleAngelNames.length > 0) && (
        <div
          className="mt-6 px-4 py-4 rounded-lg animate-fade-in-up delay-500"
          style={{
            background: isBabylon ? 'rgba(217,79,79,0.08)' : 'rgba(200,164,78,0.08)',
            border: `2px dashed ${isBabylon ? 'rgba(217,79,79,0.5)' : 'rgba(200,164,78,0.5)'}`,
          }}
        >
          <p
            className="text-center text-[11px] font-bold uppercase tracking-[0.18em] mb-1"
            style={{ color: isBabylon ? 'var(--danger)' : 'var(--accent-gold)' }}
          >
            🤐 One-Time Intel
          </p>
          <p className="text-center text-[10px] text-muted mb-4 leading-relaxed">
            Your role and abilities stay in your card all game.<br />
            These names below are only shown here, now. Memorize them.
          </p>

          {knownBabylonNames.length > 0 && (
            <div className="text-center mb-3">
              <p className="text-[10px] text-muted mb-1 uppercase tracking-wider">
                {info.role === Role.Angel ? 'Babylon Agents' : 'Fellow Babylon'}
              </p>
              <p className="text-danger font-semibold text-base">
                {knownBabylonNames.join(', ')}
              </p>
            </div>
          )}

          {possibleAngelNames.length > 0 && (
            <div className="text-center">
              <p className="text-[10px] text-muted mb-1 uppercase tracking-wider">
                {possibleAngelNames.length === 1 ? 'The Angel' : 'The Angel is one of'}
              </p>
              <p className="text-gold font-semibold text-base">
                {possibleAngelNames.length === 1
                  ? possibleAngelNames[0]
                  : `${possibleAngelNames[0]} or ${possibleAngelNames[1]}`
                }
              </p>
            </div>
          )}
        </div>
      )}

      {info.conversions.length > 0 && (
        <div className="animate-fade-in-up delay-700">
          <div className="border-t border-white/10 my-5" />
          <p className="text-xs text-muted mb-2 uppercase tracking-wider">Evangelism History</p>
          {info.conversions.map((conv, i) => {
            const targetName = players.find(p => p.id === conv.targetId)?.displayName ?? 'Unknown';
            return (
              <div key={i} className="flex justify-between text-sm mt-1.5">
                <span>{targetName}</span>
                <span className={conv.success ? 'text-success' : 'text-muted'}>
                  {conv.success ? 'Converted!' : 'Already a believer'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {info.inspectedAlignment && (
        <div className="animate-fade-in-up delay-700">
          <div className="border-t border-white/10 my-5" />
          <p className="text-xs text-muted mb-2 uppercase tracking-wider">Investigation Result</p>
          <p className={info.inspectedAlignment === Alignment.Babylon ? 'text-danger font-semibold text-base' : 'text-success font-semibold text-base'}>
            {info.inspectedAlignment}
          </p>
        </div>
      )}
    </div>
  );
}
