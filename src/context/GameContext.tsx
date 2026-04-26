'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket/client';
import type { Socket } from 'socket.io-client';
import type {
  ClientRoomState,
  PlayerPrivateInfo,
  LocalSession,
  GameConfig,
  ServerToClientEvents,
  ClientToServerEvents,
  ChatMessage,
} from '@/lib/game/types';

interface GameContextType {
  // Connection
  connected: boolean;

  // Room state (public)
  roomState: ClientRoomState | null;

  // Player's private info
  privateInfo: PlayerPrivateInfo | null;

  // Local session for reconnection
  session: LocalSession | null;

  // Error messages
  error: string | null;
  clearError: () => void;

  // Phase messages
  phaseMessage: { title: string; body: string } | null;
  clearPhaseMessage: () => void;

  // Evangelist result
  conversionResult: { targetId: string; targetName: string; success: boolean } | null;
  clearConversionResult: () => void;

  // Assassin result
  assassinResult: { correct: boolean; targetName: string } | null;

  // Babylon teammate converted alert
  babylonAlert: { convertedName: string; youAreNowAssassin: boolean } | null;
  clearBabylonAlert: () => void;

  // Angel conversion notice
  angelAlert: { convertedName: string } | null;
  clearAngelAlert: () => void;

  // Chat
  chatMessages: ChatMessage[];
  sendChat: (text: string) => void;
  sendAccusation: (targetId: string, reason: string) => void;

  // Actions
  createRoom: (displayName: string) => Promise<{ roomCode: string; playerId: string } | null>;
  joinRoom: (roomCode: string, displayName: string) => Promise<{ playerId: string } | null>;
  rejoinRoom: () => Promise<boolean>;
  addBot: (name?: string) => Promise<{ botId: string } | null>;
  removeBot: (botId: string) => void;
  kickPlayer: (targetPlayerId: string) => void;
  updateConfig: (config: Partial<GameConfig>) => void;
  startGame: () => void;
  advanceFirstNight: () => void;
  advancePhase: () => void;
  proposeTeam: (memberIds: string[]) => void;
  submitVote: (approve: boolean) => void;
  submitMissionAction: (sabotage: boolean) => void;
  evangelistConvert: (targetId: string) => void;
  assassinGuess: (targetId: string) => void;
  restartGame: () => void;
  returnToLobby: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

// Session persistence
const SESSION_KEY = 'gc-session';

function saveSession(session: LocalSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

function loadSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<ClientRoomState | null>(null);
  const [privateInfo, setPrivateInfo] = useState<PlayerPrivateInfo | null>(null);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phaseMessage, setPhaseMessage] = useState<{ title: string; body: string } | null>(null);
  const [conversionResult, setConversionResult] = useState<{ targetId: string; targetName: string; success: boolean } | null>(null);
  const [assassinResult, setAssassinResult] = useState<{ correct: boolean; targetName: string } | null>(null);
  const [babylonAlert, setBabylonAlert] = useState<{ convertedName: string; youAreNowAssassin: boolean } | null>(null);
  const [angelAlert, setAngelAlert] = useState<{ convertedName: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = getSocket();
    }
    const socket = socketRef.current;

    // If socket already connected before listener attached
    if (socket.connected) setConnected(true);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('room:state', (state) => setRoomState(state));
    socket.on('player:privateInfo', (info) => setPrivateInfo(info));
    socket.on('room:error', (err) => setError(err));
    socket.on('game:phaseMessage', (msg) => setPhaseMessage(msg));
    socket.on('evangelist:conversionResult', (result) => setConversionResult(result));
    socket.on('assassin:guessResult', (result) => setAssassinResult(result));
    socket.on('babylon:teammateConverted', (data) => setBabylonAlert(data));
    socket.on('angel:conversionNotice', (data) => setAngelAlert(data));
    socket.on('chat:message', (msg: ChatMessage) => {
      setChatMessages(prev => {
        const next = [...prev, msg];
        return next.length > 100 ? next.slice(-100) : next;
      });
    });

    // Try to restore session on mount
    const saved = loadSession();
    if (saved) {
      setSession(saved);
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room:state');
      socket.off('player:privateInfo');
      socket.off('room:error');
      socket.off('game:phaseMessage');
      socket.off('evangelist:conversionResult');
      socket.off('assassin:guessResult');
      socket.off('babylon:teammateConverted');
      socket.off('angel:conversionNotice');
      socket.off('chat:message');
    };
  }, []);

  const createRoom = useCallback(async (displayName: string) => {
    const socket = socketRef.current!;
    return new Promise<{ roomCode: string; playerId: string } | null>((resolve) => {
      socket.emit('room:create', { displayName }, (res) => {
        if (res.success && res.roomCode && res.playerId) {
          const sess: LocalSession = {
            roomCode: res.roomCode,
            playerId: res.playerId,
            displayName,
            isHost: true,
          };
          setSession(sess);
          saveSession(sess);
          resolve({ roomCode: res.roomCode, playerId: res.playerId });
        } else {
          setError(res.error || 'Failed to create room');
          resolve(null);
        }
      });
    });
  }, []);

  const joinRoom = useCallback(async (roomCode: string, displayName: string) => {
    const socket = socketRef.current!;
    return new Promise<{ playerId: string } | null>((resolve) => {
      socket.emit('room:join', { roomCode: roomCode.toUpperCase(), displayName }, (res) => {
        if (res.success && res.playerId) {
          const sess: LocalSession = {
            roomCode: roomCode.toUpperCase(),
            playerId: res.playerId,
            displayName,
            isHost: false,
          };
          setSession(sess);
          saveSession(sess);
          resolve({ playerId: res.playerId });
        } else {
          setError(res.error || 'Failed to join room');
          resolve(null);
        }
      });
    });
  }, []);

  const rejoinRoom = useCallback(async () => {
    const saved = loadSession();
    if (!saved) return false;

    const socket = socketRef.current!;
    return new Promise<boolean>((resolve) => {
      socket.emit('room:rejoin', { roomCode: saved.roomCode, playerId: saved.playerId }, (res) => {
        if (res.success) {
          setSession(saved);
          resolve(true);
        } else {
          clearSession();
          setSession(null);
          resolve(false);
        }
      });
    });
  }, []);

  const addBot = useCallback(async (name?: string) => {
    return new Promise<{ botId: string } | null>((resolve) => {
      socketRef.current!.emit('room:addBot', { name }, (res) => {
        if (res.success && res.botId) {
          resolve({ botId: res.botId });
        } else {
          resolve(null);
        }
      });
    });
  }, []);

  const removeBot = useCallback((botId: string) => {
    socketRef.current!.emit('room:removeBot', { botId });
  }, []);

  const kickPlayer = useCallback((targetPlayerId: string) => {
    socketRef.current!.emit('room:kick', { targetPlayerId });
  }, []);

  const updateConfig = useCallback((config: Partial<GameConfig>) => {
    socketRef.current!.emit('room:updateConfig', config);
  }, []);

  const startGame = useCallback(() => {
    socketRef.current!.emit('game:start');
  }, []);

  const advanceFirstNight = useCallback(() => {
    socketRef.current!.emit('game:advanceFirstNight');
  }, []);

  const advancePhase = useCallback(() => {
    socketRef.current!.emit('game:advancePhase');
  }, []);

  const proposeTeam = useCallback((memberIds: string[]) => {
    socketRef.current!.emit('game:proposeTeam', { memberIds });
  }, []);

  const submitVote = useCallback((approve: boolean) => {
    socketRef.current!.emit('game:submitVote', { approve });
  }, []);

  const submitMissionAction = useCallback((sabotage: boolean) => {
    socketRef.current!.emit('game:submitMissionAction', { sabotage });
  }, []);

  const evangelistConvert = useCallback((targetId: string) => {
    socketRef.current!.emit('game:evangelistConvert', { targetId });
  }, []);

  const assassinGuess = useCallback((targetId: string) => {
    socketRef.current!.emit('game:assassinGuess', { targetId });
  }, []);

  const sendChat = useCallback((text: string) => {
    socketRef.current!.emit('chat:send', { text });
  }, []);

  const sendAccusation = useCallback((targetId: string, reason: string) => {
    socketRef.current!.emit('chat:accuse', { targetId, reason });
  }, []);

  const restartGame = useCallback(() => {
    socketRef.current!.emit('game:restart');
    setPrivateInfo(null);
    setPhaseMessage(null);
    setConversionResult(null);
    setAssassinResult(null);
    setBabylonAlert(null);
    setAngelAlert(null);
    setChatMessages([]);
  }, []);

  const returnToLobby = useCallback(() => {
    socketRef.current!.emit('game:returnToLobby');
    setPrivateInfo(null);
    setPhaseMessage(null);
    setConversionResult(null);
    setAssassinResult(null);
    setBabylonAlert(null);
    setAngelAlert(null);
    setChatMessages([]);
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearPhaseMessage = useCallback(() => setPhaseMessage(null), []);
  const clearConversionResult = useCallback(() => setConversionResult(null), []);
  const clearBabylonAlert = useCallback(() => setBabylonAlert(null), []);
  const clearAngelAlert = useCallback(() => setAngelAlert(null), []);

  return (
    <GameContext.Provider
      value={{
        connected,
        roomState,
        privateInfo,
        session,
        error,
        clearError,
        phaseMessage,
        clearPhaseMessage,
        conversionResult,
        clearConversionResult,
        assassinResult,
        babylonAlert,
        clearBabylonAlert,
        angelAlert,
        clearAngelAlert,
        chatMessages,
        sendChat,
        sendAccusation,
        createRoom,
        joinRoom,
        rejoinRoom,
        addBot,
        removeBot,
        kickPlayer,
        updateConfig,
        startGame,
        advanceFirstNight,
        advancePhase,
        proposeTeam,
        submitVote,
        submitMissionAction,
        evangelistConvert,
        assassinGuess,
        restartGame,
        returnToLobby,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
