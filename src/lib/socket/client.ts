'use client';

import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../game/types';

// Singleton socket instance
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  console.log('[Socket] getSocket called, existing:', !!socket);
  if (!socket) {
    console.log('[Socket] creating new socket, window origin:', typeof window !== 'undefined' ? window.location.origin : 'no window');
    socket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // Start on polling (always works through the cloudflared tunnel), then
      // upgrade to WebSocket when the network allows it. WS-only had no fallback,
      // so any client on a network that blocks WebSockets hung on "Connecting…".
      transports: ['polling', 'websocket'],
      upgrade: true,
    });
    socket.on('connect', () => console.log('[Socket] connected, id:', socket!.id));
    socket.on('disconnect', (reason) => console.log('[Socket] disconnected:', reason));
    socket.on('connect_error', (err) => console.log('[Socket] connect_error:', err.message));
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
