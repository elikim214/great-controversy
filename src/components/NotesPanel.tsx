'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ClientPlayer } from '@/lib/game/types';

interface NotesPanelProps {
  players: ClientPlayer[];
  myId: string;
  roomCode: string;
  open: boolean;
  onClose: () => void;
}

function getNoteKey(roomCode: string, myId: string, targetId: string): string {
  return `notes-${roomCode}-${myId}-${targetId}`;
}

export default function NotesPanel({ players, myId, roomCode, open, onClose }: NotesPanelProps) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Load notes from localStorage on mount and when panel opens
  useEffect(() => {
    if (!open) return;
    const loaded: Record<string, string> = {};
    for (const p of players) {
      if (p.id === myId) continue;
      const key = getNoteKey(roomCode, myId, p.id);
      try {
        loaded[p.id] = localStorage.getItem(key) || '';
      } catch {
        loaded[p.id] = '';
      }
    }
    setNotes(loaded);
  }, [open, players, myId, roomCode]);

  const updateNote = useCallback((targetId: string, value: string) => {
    setNotes(prev => ({ ...prev, [targetId]: value }));
    const key = getNoteKey(roomCode, myId, targetId);
    try {
      localStorage.setItem(key, value);
    } catch {}
  }, [roomCode, myId]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  if (!open) return null;

  const otherPlayers = players.filter(p => p.id !== myId);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col animate-slide-in-right"
        style={{
          width: '320px',
          maxWidth: '85vw',
          background: 'var(--card-bg)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h3 className="font-serif font-bold text-gold text-sm">Private Notes</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <p className="text-muted text-[10px] px-4 pt-2 italic">
          Notes are private and stored locally on your device.
        </p>

        {/* Player notes - accordion */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {otherPlayers.length === 0 && (
            <p className="text-muted text-xs text-center mt-4">No other players in the game.</p>
          )}
          {otherPlayers.map((p, i) => {
            const isOpen = expandedIds.has(p.id);
            const hasContent = !!(notes[p.id] || '').trim();
            return (
              <div
                key={p.id}
                style={{
                  borderBottom: i < otherPlayers.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <button
                  className="w-full flex items-center justify-between py-2.5 text-left"
                  onClick={() => toggleExpanded(p.id)}
                >
                  <span className="text-sm font-medium text-foreground/90">
                    {p.displayName}
                    {!p.connected && <span className="text-muted text-[10px] ml-1">(offline)</span>}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {hasContent && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-gold)' }} />
                    )}
                    <span className="text-muted text-[10px]">{isOpen ? '\u25B2' : '\u25BC'}</span>
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-200 ease-in-out"
                  style={{
                    maxHeight: isOpen ? '200px' : '0px',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <textarea
                    value={notes[p.id] || ''}
                    onChange={e => updateNote(p.id, e.target.value)}
                    placeholder={`Notes about ${p.displayName}...`}
                    className="w-full text-sm text-foreground resize-none mb-2 focus:outline-none"
                    style={{
                      background: 'transparent',
                      borderBottom: '2px solid rgba(255,255,255,0.1)',
                      padding: '0.5rem 0',
                      borderRadius: 0,
                      color: 'var(--foreground)',
                    }}
                    rows={3}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
