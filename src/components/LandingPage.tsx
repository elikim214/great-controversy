'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { useRouter } from 'next/navigation';
import { APP_VERSION } from '@/lib/game/config';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { checkSabbathWithLocation } from '@/lib/game/sabbath';
import { getAvatarImageUrl, getMissionaryAvatarUrl, pickMissionary } from '@/lib/game/missionaries';

export default function LandingPage() {
  const [sabbathActive, setSabbathActive] = useState(false);
  const [sabbathInfo, setSabbathInfo] = useState<string | undefined>();

  useEffect(() => {
    checkSabbathWithLocation().then(result => {
      setSabbathActive(result.isSabbath);
      setSabbathInfo(result.sunsetInfo);
    });
  }, []);
  const { createRoom, joinRoom, rejoinRoom, session, error, clearError, connected } = useGame();
  const router = useRouter();
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [displayName, setDisplayName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<number>(() => Math.floor(Math.random() * 27));

  const handleCreate = async () => {
    if (!displayName.trim()) return;
    setLoading(true);
    clearError();
    const result = await createRoom(displayName.trim(), selectedAvatar);
    setLoading(false);
    if (result) {
      router.push(`/room/${result.roomCode}`);
    }
  };

  const handleJoin = async () => {
    if (!displayName.trim() || !roomCode.trim()) return;
    setLoading(true);
    clearError();
    const result = await joinRoom(roomCode.trim(), displayName.trim(), selectedAvatar);
    setLoading(false);
    if (result) {
      router.push(`/room/${roomCode.trim().toUpperCase()}`);
    }
  };

  const handleRejoin = async () => {
    if (!session) return;
    setLoading(true);
    clearError();
    const success = await rejoinRoom();
    setLoading(false);
    if (success) {
      router.push(`/room/${session.roomCode}`);
    }
  };

  return (
    <AuroraBackground className="!h-auto min-h-screen !bg-[var(--background)]">
    <div className="relative z-10 flex-1 flex items-center justify-center p-4 w-full">
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-gold mb-3 animate-text-reveal tracking-tight">
            The Great Controversy
          </h1>
          <p className="font-serif italic text-muted text-base animate-fade-in-up delay-200">
            A Last Day ADVENTure Game
          </p>
          <p className="text-muted text-xs mt-3 animate-fade-in-up delay-400 uppercase tracking-[0.25em]">
            5&ndash;15 Players &middot; Hidden Roles &middot; Social Deduction
          </p>
        </div>

        {/* Sabbath banner */}
        {sabbathActive && (
          <div className="mb-4 p-3 rounded-lg bg-gold/10 border border-gold/30 text-center animate-fade-in">
            <p className="text-gold text-sm font-medium">Happy Sabbath! All games are free today.</p>
            {sabbathInfo && <p className="text-gold/60 text-xs mt-1">{sabbathInfo}</p>}
          </div>
        )}

        {/* Connection status */}
        {!connected && (
          <div className="text-center mb-4 text-danger text-sm animate-fade-in">
            Connecting to server...
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger/20 border border-danger/50 text-sm text-center animate-fade-in-up">
            {error}
            <button onClick={clearError} className="ml-2 text-xs underline">dismiss</button>
          </div>
        )}

        {/* Rejoin banner */}
        {session && mode === 'menu' && (
          <div className="game-card mb-4 text-center">
            <p className="text-sm text-muted mb-2">
              Previous session found: Room <span className="text-gold font-mono">{session.roomCode}</span>
            </p>
            <button
              onClick={handleRejoin}
              disabled={loading || !connected}
              className="btn btn-secondary text-sm"
            >
              {loading ? 'Reconnecting...' : 'Rejoin Game'}
            </button>
          </div>
        )}

        {/* Menu */}
        {mode === 'menu' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              disabled={!connected}
              className="btn btn-primary w-full text-lg py-5 animate-slide-up delay-500"
            >
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              disabled={!connected}
              className="btn btn-secondary w-full text-lg py-5 animate-slide-up delay-600"
            >
              Join Room
            </button>
          </div>
        )}

        {/* Create Room */}
        {mode === 'create' && (
          <div className="space-y-5 animate-fade-in-up">
            <h2 className="font-serif text-xl font-bold text-center text-gold">Create a Room</h2>
            <input
              type="text"
              placeholder="Your display name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={20}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <div>
              <p className="text-xs text-muted mb-2 text-center">Choose your avatar</p>
              <div className="grid grid-cols-5 gap-3 max-h-[280px] overflow-y-auto p-1">
                {Array.from({ length: 27 }, (_, i) => {
                  const m = pickMissionary(i);
                  const fallback = getMissionaryAvatarUrl(m.avatarSeed, i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedAvatar(i)}
                      className="relative rounded-full aspect-square transition-all"
                      style={{
                        outline: selectedAvatar === i ? '2.5px solid var(--accent-gold)' : '2px solid transparent',
                        outlineOffset: '1px',
                        opacity: 1,
                      }}
                    >
                      <img
                        src={getAvatarImageUrl(i)}
                        alt={`Avatar ${i + 1}`}
                        className="w-full h-full rounded-full object-cover"
                        style={{ background: 'var(--card-bg)' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallback;
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={!displayName.trim() || loading || !connected}
              className="btn btn-primary w-full py-4"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => setMode('menu')} className="btn btn-secondary w-full">
              Back
            </button>
          </div>
        )}

        {/* Join Room */}
        {mode === 'join' && (
          <div className="space-y-5 animate-fade-in-up">
            <h2 className="font-serif text-xl font-bold text-center text-gold">Join a Room</h2>
            <input
              type="text"
              placeholder="CODE"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              maxLength={4}
              autoFocus
              className="room-code-input"
            />
            <input
              type="text"
              placeholder="Your display name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <div>
              <p className="text-xs text-muted mb-2 text-center">Choose your avatar</p>
              <div className="grid grid-cols-5 gap-3 max-h-[280px] overflow-y-auto p-1">
                {Array.from({ length: 27 }, (_, i) => {
                  const m = pickMissionary(i);
                  const fallback = getMissionaryAvatarUrl(m.avatarSeed, i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedAvatar(i)}
                      className="relative rounded-full aspect-square transition-all"
                      style={{
                        outline: selectedAvatar === i ? '2.5px solid var(--accent-gold)' : '2px solid transparent',
                        outlineOffset: '1px',
                        opacity: 1,
                      }}
                    >
                      <img
                        src={getAvatarImageUrl(i)}
                        alt={`Avatar ${i + 1}`}
                        className="w-full h-full rounded-full object-cover"
                        style={{ background: 'var(--card-bg)' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallback;
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={handleJoin}
              disabled={!displayName.trim() || !roomCode.trim() || loading || !connected}
              className="btn btn-primary w-full py-4"
            >
              {loading ? 'Joining...' : 'Join'}
            </button>
            <button onClick={() => setMode('menu')} className="btn btn-secondary w-full">
              Back
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted mt-10 animate-fade-in delay-800">
          v{APP_VERSION} &middot; All players join from their own devices
        </p>
      </div>
    </div>
    </AuroraBackground>
  );
}
