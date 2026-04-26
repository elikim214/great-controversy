'use client';

import { useState, useEffect } from 'react';
import type { ClientPlayer } from '@/lib/game/types';
import { pickMissionary, getMissionaryAvatarUrl, getAvatarImageUrl } from '@/lib/game/missionaries';

interface Props {
  players: ClientPlayer[];
  currentPlayerId?: string;
  leaderId?: string;
  onKick?: (playerId: string) => void;
  isActiveGame?: boolean;  // true when game is in progress (not lobby)
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (playerId: string) => void;
  maxSelectable?: number;
}

function timeSince(timestamp: number | undefined): string {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

export default function PlayerList({
  players,
  currentPlayerId,
  leaderId,
  onKick,
  isActiveGame,
  selectable,
  selectedIds = [],
  onToggleSelect,
  maxSelectable,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Re-render every 5s to update disconnect timers
  const [, setTick] = useState(0);
  useEffect(() => {
    const hasDisconnected = players.some(p => !p.connected && p.disconnectedAt);
    if (!hasDisconnected) return;
    const interval = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(interval);
  }, [players]);

  return (
    <div>
      {players.map((p, i) => {
        const isMe = p.id === currentPlayerId;
        const isLeader = p.id === leaderId;
        const isSelected = selectedIds.includes(p.id);
        const canSelect = selectable && onToggleSelect && (isSelected || !maxSelectable || selectedIds.length < maxSelectable);
        const missionary = pickMissionary(p.avatarIndex);
        const avatarImageUrl = getAvatarImageUrl(p.avatarIndex);
        const fallbackUrl = getMissionaryAvatarUrl(missionary.avatarSeed, p.avatarIndex);
        const isExpanded = expandedId === p.id;

        return (
          <div
            key={p.id}
            className={`transition-all animate-fade-in-up ${
              selectable && canSelect ? 'cursor-pointer' : ''
            } ${!p.connected ? 'opacity-50' : ''}`}
            style={{
              animationDelay: `${i * 60}ms`,
              borderLeft: isSelected ? '3px solid var(--accent-blue)' : '3px solid transparent',
              borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-2.5"
              onClick={() => {
                if (selectable && canSelect && onToggleSelect) {
                  onToggleSelect(p.id);
                }
              }}
            >
              <div className="flex items-center gap-3">
                {/* Missionary avatar with colored ring */}
                <div className="relative flex-shrink-0">
                  {/* Crown icon for leader */}
                  {isLeader && (
                    <span
                      className="absolute -top-2 left-1/2 -translate-x-1/2 text-[12px] leader-crown z-10"
                      aria-hidden="true"
                    >
                      👑
                    </span>
                  )}
                  <div
                    className={`rounded-full p-[2px] ${isLeader ? 'leader-avatar-glow' : ''}`}
                    style={{
                      background: isLeader ? 'var(--accent-blue)' : 'var(--accent-gold)',
                      width: 40,
                      height: 40,
                    }}
                  >
                    <img
                      src={avatarImageUrl}
                      alt={missionary.name}
                      className="w-full h-full rounded-full object-cover"
                      style={{ background: 'var(--card-bg)' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackUrl;
                      }}
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={`font-medium text-sm ${isMe ? 'text-blue' : 'text-foreground'} hover:underline focus:outline-none`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : p.id);
                      }}
                    >
                      {p.displayName}
                    </button>
                    {isMe && <span className="text-[10px] text-muted">(you)</span>}
                    {isLeader && (
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(74,144,217,0.15)', color: 'var(--accent-blue)' }}
                      >
                        Leader
                      </span>
                    )}
                    {p.isBot && (
                      <span
                        className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded"
                        style={{ background: 'rgba(212,168,67,0.15)', color: 'var(--accent-gold)' }}
                      >
                        BOT
                      </span>
                    )}
                    {p.isHost && <span className="text-gold text-sm" title="Host">&#9733;</span>}
                    {!p.connected && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'rgba(217,79,79,0.15)', color: 'var(--danger)' }}>
                        DISCONNECTED{p.disconnectedAt ? ` ${timeSince(p.disconnectedAt)}` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted truncate">{missionary.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectable && isSelected && (
                  <span className="text-blue text-sm">&#10003;</span>
                )}
                {onKick && !isMe && (!isActiveGame || !p.connected) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onKick(p.id); }}
                    className="text-xs text-danger hover:text-danger/80 px-2 py-1 rounded"
                  >
                    Kick
                  </button>
                )}
              </div>
            </div>

            {/* Expandable bio section */}
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: isExpanded ? '300px' : '0px',
                opacity: isExpanded ? 1 : 0,
              }}
            >
              <div className="px-3 pb-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-3">
                  {missionary.photoUrl ? (
                    <img
                      src={missionary.photoUrl}
                      alt={missionary.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = avatarImageUrl;
                        (e.target as HTMLImageElement).onerror = () => {
                          (e.target as HTMLImageElement).src = fallbackUrl;
                        };
                      }}
                    />
                  ) : (
                    <img
                      src={avatarImageUrl}
                      alt={missionary.name}
                      className="w-14 h-14 rounded-lg flex-shrink-0 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackUrl;
                      }}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-gold font-semibold">{missionary.name}</p>
                    <p className="text-[10px] text-muted mb-1">{missionary.region} &middot; {missionary.years}</p>
                    <p className="text-xs text-foreground/80 leading-relaxed">{missionary.bio}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
