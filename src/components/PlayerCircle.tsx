'use client';

import type { ClientPlayer } from '@/lib/game/types';
import { pickMissionary, getMissionaryAvatarUrl, getAvatarImageUrl } from '@/lib/game/missionaries';

interface Props {
  players: ClientPlayer[];
  currentLeaderIndex: number;
  myId?: string;
}

/**
 * Circular table view: avatars arranged in a ring like a real table-top
 * game. Current leader gets a gold halo + crown. Next leader (clockwise)
 * gets a blue arrow pointing into them. Rotation hint shows clockwise.
 */
export default function PlayerCircle({ players, currentLeaderIndex, myId }: Props) {
  const n = players.length;
  if (n === 0) return null;

  // Container dimensions
  const SIZE = 280;
  const CENTER = SIZE / 2;
  const RADIUS = 105;
  const AVATAR = 56;

  const positions = players.map((_, i) => {
    // Start at top (-90deg), go clockwise
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return {
      x: CENTER + RADIUS * Math.cos(angle) - AVATAR / 2,
      y: CENTER + RADIUS * Math.sin(angle) - AVATAR / 2,
      angle,
    };
  });

  const nextLeaderIndex = (currentLeaderIndex + 1) % n;

  return (
    <div
      className="relative mx-auto animate-fade-in-up"
      style={{ width: SIZE, height: SIZE }}
      aria-label="Table seating"
    >
      {/* Center ring + clockwise rotation arrow */}
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 pointer-events-none">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="rgba(200,164,78,0.18)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
        />
        {/* Curved clockwise arrow at center */}
        <g transform={`translate(${CENTER}, ${CENTER})`}>
          <path
            d="M -22 0 A 22 22 0 1 1 18 14"
            fill="none"
            stroke="rgba(200,164,78,0.55)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <polygon
            points="14,8 22,16 18,20"
            fill="rgba(200,164,78,0.7)"
          />
          <text
            x="0"
            y="36"
            fontSize="9"
            textAnchor="middle"
            fill="rgba(200,164,78,0.65)"
            style={{ textTransform: 'uppercase', letterSpacing: '1.5px' }}
          >
            Turn order
          </text>
        </g>
      </svg>

      {/* Players around the circle */}
      {players.map((p, i) => {
        const pos = positions[i];
        const isLeader = i === currentLeaderIndex;
        const isNext = i === nextLeaderIndex;
        const isMe = p.id === myId;
        const missionary = pickMissionary(p.avatarIndex);
        const avatarUrl = getAvatarImageUrl(p.avatarIndex);
        const fallbackUrl = getMissionaryAvatarUrl(missionary.avatarSeed, p.avatarIndex);

        return (
          <div
            key={p.id}
            className="absolute flex flex-col items-center"
            style={{
              left: pos.x,
              top: pos.y,
              width: AVATAR,
            }}
          >
            {/* Crown above leader */}
            {isLeader && (
              <span
                className="absolute -top-4 text-base animate-pulse-soft"
                aria-label="Current leader"
                title="Current leader"
              >
                👑
              </span>
            )}
            {/* Avatar */}
            <div
              className="rounded-full overflow-hidden transition-all"
              style={{
                width: AVATAR,
                height: AVATAR,
                boxShadow: isLeader
                  ? '0 0 0 3px var(--accent-gold), 0 0 16px rgba(200,164,78,0.5)'
                  : isNext
                  ? '0 0 0 2px rgba(74,144,217,0.6)'
                  : isMe
                  ? '0 0 0 2px rgba(255,255,255,0.25)'
                  : '0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              <img
                src={avatarUrl}
                alt={p.displayName}
                className="block w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = fallbackUrl;
                }}
              />
            </div>
            {/* Name pill */}
            <div
              className="text-[10px] mt-1 px-1.5 py-0.5 rounded text-center max-w-full truncate"
              style={{
                background: isLeader ? 'rgba(200,164,78,0.18)' : 'rgba(0,0,0,0.4)',
                color: isLeader ? 'var(--accent-gold)' : isMe ? '#fff' : 'rgba(255,255,255,0.75)',
                fontWeight: isLeader || isMe ? 600 : 400,
                width: 'max-content',
                maxWidth: 80,
              }}
            >
              {isMe ? 'You' : p.displayName.length > 10 ? p.displayName.slice(0, 9) + '…' : p.displayName}
            </div>
            {isNext && !isLeader && (
              <div className="text-[8px] text-blue uppercase tracking-wider mt-0.5">Next</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
