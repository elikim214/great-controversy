// ============================================================
// Socket.IO event handlers — server-authoritative game state
// All game logic delegated to pure engine functions.
// ============================================================

import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  GamePhase,
  Role,
  Alignment,
} from '../src/lib/game/types';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  Room,
  ClientRoomState,
  PlayerPrivateInfo,
  ChatMessage,
} from '../src/lib/game/types';
import {
  createRoom,
  generateRoomCode,
  addPlayer,
  removePlayer,
  reconnectPlayer,
  disconnectPlayer,
  startGame,
  advanceFirstNight,
  proposeTeam,
  submitVote,
  resolveVote,
  submitMissionAction,
  resolveMission,
  afterMissionReveal,
  evangelistConvert,
  evangelistInspect,
  skipEvangelistAction,
  assassinGuess,
  restartToLobby,
  handlePlayerRemoval,
  getBabylonPlayerIds,
  getAngelPlayerId,
  getDarkAngelPlayerId,
  getEvangelistConversions,
  shuffleArray,
} from '../src/lib/game/engine';
import {
  canJoinRoom,
  canStartGame,
  validateTeamProposal,
  validateVote,
  validateMissionAction,
  validateEvangelistConvert,
  validateAssassinGuess,
} from '../src/lib/game/validators';
import { MAX_BOTS, MAX_PLAYERS } from '../src/lib/game/config';
import {
  addBot,
  removeBot,
  getBotIds,
  initializeBotStates,
  processBotActions,
  cleanupRoom,
} from './botManager';

// In-memory room storage (fine for MVP/local game night)
const rooms = new Map<string, Room>();

// Map socket IDs to room codes for disconnect handling
const socketToRoom = new Map<string, string>();

// Chat message ID counter
let chatMessageIdCounter = 0;
function generateChatMessageId(): string {
  chatMessageIdCounter += 1;
  return `msg-${Date.now()}-${chatMessageIdCounter}`;
}

const MAX_CHAT_MESSAGES = 100;

export function registerSocketHandlers(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ---- Room Creation ----
    socket.on('room:create', (data, callback) => {
      const { displayName, avatarIndex } = data;
      if (!displayName?.trim()) {
        callback({ success: false, error: 'Display name required' });
        return;
      }

      const { room, hostId } = createRoom(displayName.trim(), socket.id, avatarIndex);

      // Ensure unique code
      let attempts = 0;
      while (rooms.has(room.code) && attempts < 10) {
        room.code = generateRoomCode();
        attempts++;
      }

      rooms.set(room.code, room);
      socketToRoom.set(socket.id, room.code);
      socket.join(room.code);

      callback({ success: true, roomCode: room.code, playerId: hostId });
      broadcastRoomState(io, room);
    });

    // ---- Room Join ----
    socket.on('room:join', (data, callback) => {
      const { roomCode, displayName, avatarIndex } = data;
      const room = rooms.get(roomCode?.toUpperCase());

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const validation = canJoinRoom(room, displayName?.trim() || '');
      if (!validation.valid) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { playerId } = addPlayer(room, displayName.trim(), socket.id, avatarIndex);
      socketToRoom.set(socket.id, room.code);
      socket.join(room.code);

      callback({ success: true, playerId });
      broadcastRoomState(io, room);
    });

    // ---- Spectator (display page) ----
    socket.on('room:spectate', (data, callback) => {
      const room = rooms.get(data.roomCode?.toUpperCase());
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }
      // Just join the socket.io room to receive broadcasts — not a player
      socket.join(room.code);
      callback({ success: true });
      // Send current state immediately
      const state = sanitizeRoomState(room);
      socket.emit('room:state', state);
    });

    // ---- Reconnection ----
    socket.on('room:rejoin', (data, callback) => {
      const { roomCode, playerId } = data;
      const room = rooms.get(roomCode?.toUpperCase());

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const player = room.players.find(p => p.id === playerId);
      if (!player) {
        callback({ success: false, error: 'Player not found in room' });
        return;
      }

      const wasDisconnected = !player.connected;
      reconnectPlayer(room, playerId, socket.id);
      socketToRoom.set(socket.id, room.code);
      socket.join(room.code);

      callback({ success: true });

      // Send system chat message if they were disconnected during game
      if (wasDisconnected && room.phase !== GamePhase.Lobby) {
        const systemMsg: ChatMessage = {
          id: generateChatMessageId(),
          senderId: 'system',
          senderName: 'System',
          text: `${player.displayName} reconnected`,
          type: 'system',
          timestamp: Date.now(),
        };
        room.chatMessages.push(systemMsg);
        if (room.chatMessages.length > MAX_CHAT_MESSAGES) {
          room.chatMessages = room.chatMessages.slice(-MAX_CHAT_MESSAGES);
        }
        io.to(room.code).emit('chat:message', systemMsg);
      }

      broadcastRoomState(io, room);
      sendPrivateInfo(io, room, player);
    });

    // ---- Kick Player ----
    socket.on('room:kick', (data) => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const requester = room.players.find(p => p.socketId === socket.id);
      if (!requester?.isHost) return;

      const target = room.players.find(p => p.id === data.targetPlayerId);
      if (!target) return;

      // Notify kicked player
      io.to(target.socketId).emit('room:error', 'You have been removed from the mission field');

      if (room.phase === GamePhase.Lobby) {
        // Simple lobby removal
        removePlayer(room, data.targetPlayerId);
      } else {
        // Mid-game removal with role reassignment
        const targetName = target.displayName;
        const { affectedPlayerIds } = handlePlayerRemoval(room, data.targetPlayerId);

        // Send system chat message
        const systemMsg: ChatMessage = {
          id: generateChatMessageId(),
          senderId: 'system',
          senderName: 'System',
          text: `${targetName} has left the mission field`,
          type: 'system',
          timestamp: Date.now(),
        };
        room.chatMessages.push(systemMsg);
        if (room.chatMessages.length > MAX_CHAT_MESSAGES) {
          room.chatMessages = room.chatMessages.slice(-MAX_CHAT_MESSAGES);
        }
        io.to(room.code).emit('chat:message', systemMsg);

        // Send updated privateInfo to affected players
        for (const affectedId of affectedPlayerIds) {
          const affectedPlayer = room.players.find(p => p.id === affectedId);
          if (affectedPlayer) {
            sendPrivateInfo(io, room, affectedPlayer);
          }
        }
      }

      broadcastRoomState(io, room);
    });

    // ---- Update Config ----
    socket.on('room:updateConfig', (data) => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const requester = room.players.find(p => p.socketId === socket.id);
      if (!requester?.isHost) return;
      if (room.phase !== GamePhase.Lobby) return;

      Object.assign(room.config, data);
      broadcastRoomState(io, room);
    });

    // ---- Add Bot ----
    socket.on('room:addBot', (data, callback) => {
      const room = getRoomForSocket(socket.id);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }
      const requester = room.players.find(p => p.socketId === socket.id);
      if (!requester?.isHost) {
        callback({ success: false, error: 'Only host can add bots' });
        return;
      }
      if (room.phase !== GamePhase.Lobby) {
        callback({ success: false, error: 'Can only add bots in lobby' });
        return;
      }
      const currentBots = getBotIds(room).length;
      if (currentBots >= MAX_BOTS) {
        callback({ success: false, error: 'Maximum bots reached' });
        return;
      }
      if (room.players.length >= MAX_PLAYERS) {
        callback({ success: false, error: 'Room is full' });
        return;
      }

      const botId = addBot(room, data.name);
      callback({ success: true, botId });
      broadcastRoomState(io, room);
    });

    // ---- Remove Bot ----
    socket.on('room:removeBot', (data) => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const requester = room.players.find(p => p.socketId === socket.id);
      if (!requester?.isHost) return;
      if (room.phase !== GamePhase.Lobby) return;

      removeBot(room, data.botId);
      broadcastRoomState(io, room);
    });

    // ---- Start Game ----
    socket.on('game:start', () => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const requester = room.players.find(p => p.socketId === socket.id);
      if (!requester?.isHost) return;

      const validation = canStartGame(room);
      if (!validation.valid) {
        socket.emit('room:error', validation.error!);
        return;
      }

      startGame(room);

      // Initialize bot states after roles are assigned
      initializeBotStates(room);

      broadcastRoomState(io, room);

      // Send private role info to each player (skip bots)
      for (const player of room.players) {
        if (!player.isBot) {
          sendPrivateInfo(io, room, player);
        }
      }

      // Trigger bot actions
      triggerBots(io, room);
    });

    // ---- Advance First Night ----
    socket.on('game:advanceFirstNight', () => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const requester = room.players.find(p => p.socketId === socket.id);
      if (!requester?.isHost) return;

      if (room.phase !== GamePhase.RoleReveal && room.phase !== GamePhase.FirstNight) return;

      advanceFirstNight(room);
      broadcastRoomState(io, room);
      triggerBots(io, room);

      // Send phase messages
      const messages = getFirstNightMessage(room.firstNightStep);
      if (messages) {
        io.to(room.code).emit('game:phaseMessage', messages);
      }
    });

    // ---- Advance Phase (host action after mission reveal, etc.) ----
    socket.on('game:advancePhase', () => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const requester = room.players.find(p => p.socketId === socket.id);
      if (!requester?.isHost) return;

      if (room.phase === GamePhase.MissionReveal) {
        afterMissionReveal(room);
        broadcastRoomState(io, room);
        triggerBots(io, room);
      } else if (room.phase === GamePhase.EvangelistAction) {
        skipEvangelistAction(room);
        broadcastRoomState(io, room);
        triggerBots(io, room);
      }
    });

    // ---- Propose Team ----
    socket.on('game:proposeTeam', (data) => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const requester = room.players.find(p => p.socketId === socket.id);
      if (!requester) return;

      const validation = validateTeamProposal(room, requester.id, data.memberIds);
      if (!validation.valid) {
        socket.emit('room:error', validation.error!);
        return;
      }

      proposeTeam(room, data.memberIds);
      broadcastRoomState(io, room);
      triggerBots(io, room);
    });

    // ---- Submit Vote ----
    socket.on('game:submitVote', (data) => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const requester = room.players.find(p => p.socketId === socket.id);
      if (!requester) return;

      const validation = validateVote(room, requester.id);
      if (!validation.valid) {
        socket.emit('room:error', validation.error!);
        return;
      }

      submitVote(room, requester.id, data.approve);

      // Try to resolve
      const resolved = resolveVote(room);
      broadcastRoomState(io, room);
      triggerBots(io, room);
    });

    // ---- Submit Mission Action ----
    socket.on('game:submitMissionAction', (data) => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const requester = room.players.find(p => p.socketId === socket.id);
      if (!requester) return;

      const validation = validateMissionAction(room, requester.id, data.sabotage);
      if (!validation.valid) {
        socket.emit('room:error', validation.error!);
        return;
      }

      submitMissionAction(room, requester.id, data.sabotage);

      // Try to resolve
      const resolved = resolveMission(room);
      broadcastRoomState(io, room);
      triggerBots(io, room);
    });

    // ---- Evangelist Convert / Inspect ----
    socket.on('game:evangelistConvert', (data) => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const requester = room.players.find(p => p.socketId === socket.id);
      if (!requester) return;

      const validation = validateEvangelistConvert(room, requester.id, data.targetId);
      if (!validation.valid) {
        socket.emit('room:error', validation.error!);
        return;
      }

      const playerCount = room.players.length;
      const target = room.players.find(p => p.id === data.targetId);

      if (playerCount >= 10) {
        // 10+ players: full conversion
        const { success } = evangelistConvert(room, data.targetId);

        // Send conversion result privately to Evangelist
        if (target) {
          io.to(requester.socketId).emit('evangelist:conversionResult', {
            targetId: data.targetId,
            targetName: target.displayName,
            success,
          });

          if (success) {
            // Selective notifications — only certain players learn about the conversion

            // 1. Evangelist: gets updated privateInfo (conversion history)
            sendPrivateInfo(io, room, requester);

            // 2. Converted player: gets updated privateInfo (new role as Missionary)
            sendPrivateInfo(io, room, target);

            // 3. Remaining Babylon player(s): notify them their teammate was converted
            const remainingBabylon = room.players.filter(
              p => p.alignment === Alignment.Babylon && p.id !== target.id
            );
            for (const bp of remainingBabylon) {
              const becameAssassin = bp.role === Role.Assassin;
              io.to(bp.socketId).emit('babylon:teammateConverted', {
                convertedName: target.displayName,
                youAreNowAssassin: becameAssassin,
              });
              // Send updated privateInfo if they became the new Assassin or their known list changed
              sendPrivateInfo(io, room, bp);
            }

            // 4. Angel: notify them about the conversion
            const angel = room.players.find(p => p.role === Role.Angel);
            if (angel) {
              io.to(angel.socketId).emit('angel:conversionNotice', {
                convertedName: target.displayName,
              });
              // Angel gets updated privateInfo (known Babylon list changed)
              sendPrivateInfo(io, room, angel);
            }

            // 5. Prophet and Missionaries: get NOTHING — no privateInfo update, no notification
          }
        }

        // Update private info for evangelist on failed conversion (conversion history)
        if (!success) {
          sendPrivateInfo(io, room, requester);
        }
      } else {
        // 7-9 players: inspect only — learn alignment without converting
        const { targetAlignment } = evangelistInspect(room, data.targetId);

        if (target && targetAlignment) {
          // Send result as conversion result (success=false since no conversion)
          io.to(requester.socketId).emit('evangelist:conversionResult', {
            targetId: data.targetId,
            targetName: target.displayName,
            success: false, // no conversion in inspect mode
          });

          // Send updated private info with inspected alignment
          const info = buildPrivateInfo(room, requester);
          if (info) {
            info.inspectedAlignment = targetAlignment;
            io.to(requester.socketId).emit('player:privateInfo', info);
          }
        }
      }

      // Broadcast room state to all (so the game phase advances)
      broadcastRoomState(io, room);
      triggerBots(io, room);
    });

    // ---- Assassin Guess ----
    socket.on('game:assassinGuess', (data) => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const requester = room.players.find(p => p.socketId === socket.id);
      if (!requester) return;

      const validation = validateAssassinGuess(room, requester.id, data.targetId);
      if (!validation.valid) {
        socket.emit('room:error', validation.error!);
        return;
      }

      const target = room.players.find(p => p.id === data.targetId);
      const guessesBeforeAction = room.assassinGuessesRemaining;

      assassinGuess(room, data.targetId);

      const isCorrect = room.result?.assassinGuessCorrect ?? false;
      const isGameOver = room.phase === GamePhase.GameOver;

      io.to(room.code).emit('assassin:guessResult', {
        correct: isCorrect,
        targetName: target?.displayName ?? 'Unknown',
      });

      broadcastRoomState(io, room);
      triggerBots(io, room);
    });

    // ---- Restart / Return to Lobby ----
    socket.on('game:restart', () => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const requester = room.players.find(p => p.socketId === socket.id);
      if (!requester?.isHost) return;

      restartToLobby(room);
      broadcastRoomState(io, room);
    });

    socket.on('game:returnToLobby', () => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const requester = room.players.find(p => p.socketId === socket.id);
      if (!requester?.isHost) return;

      restartToLobby(room);
      broadcastRoomState(io, room);
    });

    // ---- Chat: Send ----
    socket.on('chat:send', (data) => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const sender = room.players.find(p => p.socketId === socket.id);
      if (!sender) return;
      if (!data.text?.trim()) return;

      const message: ChatMessage = {
        id: generateChatMessageId(),
        senderId: sender.id,
        senderName: sender.displayName,
        text: data.text.trim().slice(0, 500),
        type: 'chat',
        timestamp: Date.now(),
      };

      room.chatMessages.push(message);
      if (room.chatMessages.length > MAX_CHAT_MESSAGES) {
        room.chatMessages = room.chatMessages.slice(-MAX_CHAT_MESSAGES);
      }

      io.to(room.code).emit('chat:message', message);
    });

    // ---- Chat: Accuse ----
    socket.on('chat:accuse', (data) => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const sender = room.players.find(p => p.socketId === socket.id);
      if (!sender) return;
      if (!data.reason?.trim()) return;

      const target = room.players.find(p => p.id === data.targetId);
      if (!target) return;

      const message: ChatMessage = {
        id: generateChatMessageId(),
        senderId: sender.id,
        senderName: sender.displayName,
        text: data.reason.trim().slice(0, 500),
        type: 'accusation',
        targetId: target.id,
        targetName: target.displayName,
        timestamp: Date.now(),
      };

      room.chatMessages.push(message);
      if (room.chatMessages.length > MAX_CHAT_MESSAGES) {
        room.chatMessages = room.chatMessages.slice(-MAX_CHAT_MESSAGES);
      }

      io.to(room.code).emit('chat:message', message);
    });

    // ---- Disconnect ----
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const room = getRoomForSocket(socket.id);
      if (room) {
        const player = room.players.find(p => p.socketId === socket.id);
        disconnectPlayer(room, socket.id);
        socketToRoom.delete(socket.id);

        // Transfer host if the disconnected player was host
        if (player?.isHost) {
          const nextHost = room.players.find(p => p.connected && p.id !== player.id);
          if (nextHost) {
            player.isHost = false;
            nextHost.isHost = true;
            room.hostId = nextHost.id;
          }
        }

        // Send system chat message if in-game
        if (player && room.phase !== GamePhase.Lobby) {
          const systemMsg: ChatMessage = {
            id: generateChatMessageId(),
            senderId: 'system',
            senderName: 'System',
            text: `${player.displayName} lost connection`,
            type: 'system',
            timestamp: Date.now(),
          };
          room.chatMessages.push(systemMsg);
          if (room.chatMessages.length > MAX_CHAT_MESSAGES) {
            room.chatMessages = room.chatMessages.slice(-MAX_CHAT_MESSAGES);
          }
          io.to(room.code).emit('chat:message', systemMsg);
        }

        broadcastRoomState(io, room);

        // Clean up empty rooms
        if (room.players.every(p => !p.connected)) {
          setTimeout(() => {
            const currentRoom = rooms.get(room.code);
            if (currentRoom && currentRoom.players.every(p => !p.connected)) {
              rooms.delete(room.code);
              console.log(`[Room] Cleaned up empty room: ${room.code}`);
            }
          }, 300000); // 5 min cleanup delay
        }
      }
    });
  });
}

// ---- Helper Functions ----

/** Trigger bot AI processing after a state change */
function triggerBots(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
  room: Room
): void {
  // Small delay to let the broadcast finish first
  setTimeout(() => {
    processBotActions(room, io, broadcastRoomState, sendPrivateInfo);
  }, 300);
}

function getRoomForSocket(socketId: string): Room | undefined {
  const code = socketToRoom.get(socketId);
  return code ? rooms.get(code) : undefined;
}

/**
 * Broadcast sanitized room state to all clients in the room.
 * No private role data is included.
 */
function broadcastRoomState(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
  room: Room
): void {
  const state = sanitizeRoomState(room);
  io.to(room.code).emit('room:state', state);
}

/** Strip private information from room state */
function sanitizeRoomState(room: Room): ClientRoomState {
  return {
    code: room.code,
    hostId: room.hostId,
    players: room.players.map(p => ({
      id: p.id,
      displayName: p.displayName,
      isHost: p.isHost,
      connected: p.connected,
      disconnectedAt: p.disconnectedAt,
      avatarIndex: p.avatarIndex,
      ...(p.isBot ? { isBot: true } : {}),
      ...(room.phase === GamePhase.GameOver && p.role ? { revealedRole: p.role } : {}),
      ...(room.phase === GamePhase.GameOver && p.alignment ? { revealedAlignment: p.alignment } : {}),
    })),
    phase: room.phase,
    config: room.config,
    missions: room.missions.map(m => ({
      missionNumber: m.missionNumber,
      requiredTeamSize: m.requiredTeamSize,
      requiresTwoFails: m.requiresTwoFails,
      location: m.location,
      proposals: m.proposals.map(p => ({
        leaderId: p.leaderId,
        memberIds: p.memberIds,
        votedPlayerIds: Object.keys(p.votes),
        resolved: p.resolved,
        approved: p.approved,
        votes: p.resolved ? p.votes : null, // Only show votes after resolution
      })),
      currentProposalIndex: m.currentProposalIndex,
      team: m.team,
      result: m.result,
      sabotageCount: m.result !== 'pending' ? m.sabotageCount : 0,
      story: m.result !== 'pending' ? m.story : undefined,
    })),
    currentMissionIndex: room.currentMissionIndex,
    currentLeaderIndex: room.currentLeaderIndex,
    consecutiveRejections: room.consecutiveRejections,
    assassinGuessesRemaining: room.assassinGuessesRemaining,
    result: room.result,
    firstNightStep: room.firstNightStep,
    evangelistHasActedThisMission: room.evangelistHasActedThisMission,
    chatMessages: room.chatMessages,
  };
}

/** Build private info for a player (without emitting) */
function buildPrivateInfo(
  room: Room,
  player: { id: string; socketId: string; role?: Role; alignment?: Alignment }
): PlayerPrivateInfo | null {
  if (!player.role || !player.alignment) return null;

  const info: PlayerPrivateInfo = {
    role: player.role,
    alignment: player.alignment,
    knownBabylonIds: [],
    knownAngelId: null,
    knownPossibleAngelIds: [],
    conversions: [],
  };

  // Babylon players know each other
  if (player.alignment === Alignment.Babylon) {
    info.knownBabylonIds = getBabylonPlayerIds(room).filter(id => id !== player.id);
  }

  // Angel knows all Babylon
  if (player.role === Role.Angel) {
    info.knownBabylonIds = getBabylonPlayerIds(room);
  }

  // Prophet knows Angel (and sees Dark Angel as a possible Angel)
  if (player.role === Role.Prophet) {
    const angelId = getAngelPlayerId(room);
    const darkAngelId = getDarkAngelPlayerId(room);

    info.knownAngelId = angelId; // backward compat

    const possibleAngels: string[] = [];
    if (angelId) possibleAngels.push(angelId);
    if (darkAngelId) possibleAngels.push(darkAngelId);

    // Shuffle so Prophet doesn't know which is which
    info.knownPossibleAngelIds = shuffleArray(possibleAngels);
  }

  // Evangelist gets their conversion history
  if (player.role === Role.Evangelist) {
    info.conversions = getEvangelistConversions(room);
  }

  return info;
}

/** Send private role and knowledge info to a specific player */
function sendPrivateInfo(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
  room: Room,
  player: { id: string; socketId: string; role?: Role; alignment?: Alignment }
): void {
  const info = buildPrivateInfo(room, player);
  if (!info) return;

  io.to(player.socketId).emit('player:privateInfo', info);
}

/** Thematic messages for first-night sequence (narration steps skipped — roles revealed on devices) */
function getFirstNightMessage(_step: number): { title: string; body: string } | null {
  // Night narration steps 1-3 are skipped; advanceFirstNight jumps directly to TeamProposal.
  return null;
}
