// ============================================================
// Bot Manager — Lifecycle and action processing for AI bots
// Manages adding/removing bots and triggering their decisions.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { Server as SocketIOServer } from 'socket.io';
import {
  GamePhase,
  Role,
  Alignment,
  ROLE_ALIGNMENT,
} from '../src/lib/game/types';
import type {
  Room,
  Player,
  ClientRoomState,
  ChatMessage,
  ClientToServerEvents,
  ServerToClientEvents,
} from '../src/lib/game/types';
import {
  createBotState,
  decideBotAction,
  updateBotTrust,
  generateBotChat,
  type BotState,
} from './botAI';
import {
  proposeTeam,
  submitVote,
  resolveVote,
  submitMissionAction,
  resolveMission,
  afterMissionReveal,
  evangelistConvert,
  evangelistInspect,
  assassinGuess,
  getBabylonPlayerIds,
  getAngelPlayerId,
  getDarkAngelPlayerId,
  pickAvailableAvatarIndex,
} from '../src/lib/game/engine';

// Bot names pool — missionary-themed
const BOT_NAMES = [
  'Brother Hudson', 'Sister Rebekah', 'Elder Marcus', 'Deacon Lydia',
  'Pastor Micah', 'Sister Naomi', 'Brother Caleb', 'Elder Priscilla',
  'Deacon Timothy', 'Sister Esther', 'Brother Silas', 'Elder Martha',
  'Pastor Daniel', 'Sister Ruth',
];

// Track which names are in use per room
const usedBotNames = new Map<string, Set<string>>();

// Store bot states per room
const botStates = new Map<string, Map<string, BotState>>();

// Track which bots have acted in the current phase to prevent double-acting
const botActedPhase = new Map<string, Map<string, string>>();

// Track mission actions submitted by bots to prevent duplicates
const botMissionActions = new Map<string, Set<string>>();

// Chat message ID counter (shared with socketHandlers via export)
let chatIdCounter = 0;
export function generateBotChatId(): string {
  chatIdCounter += 1;
  return `bot-msg-${Date.now()}-${chatIdCounter}`;
}

// ---- Public API ----

/**
 * Add a bot player to a room (lobby only).
 * Returns the bot's player ID.
 */
export function addBot(room: Room, name?: string): string {
  const roomCode = room.code;

  // Initialize tracking
  if (!usedBotNames.has(roomCode)) usedBotNames.set(roomCode, new Set());
  if (!botStates.has(roomCode)) botStates.set(roomCode, new Map());

  // Pick a name
  const used = usedBotNames.get(roomCode)!;
  let botName = name;
  if (!botName) {
    const available = BOT_NAMES.filter(n => !used.has(n));
    botName = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : `Bot ${used.size + 1}`;
  }
  used.add(botName);

  // Create player entry
  const botId = uuidv4();
  const botPlayer: Player = {
    id: botId,
    displayName: botName,
    socketId: `bot-${botId}`, // fake socket ID
    isHost: false,
    connected: true,
    avatarIndex: pickAvailableAvatarIndex(room),
    isBot: true,
  };

  room.players.push(botPlayer);
  return botId;
}

/**
 * Remove a bot from a room.
 */
export function removeBot(room: Room, botId: string): void {
  const player = room.players.find(p => p.id === botId && p.isBot);
  if (!player) return;

  const roomCode = room.code;
  const used = usedBotNames.get(roomCode);
  if (used) used.delete(player.displayName);

  const states = botStates.get(roomCode);
  if (states) states.delete(botId);

  room.players = room.players.filter(p => p.id !== botId);
}

/**
 * Get all bot player IDs in a room.
 */
export function getBotIds(room: Room): string[] {
  return room.players.filter(p => p.isBot).map(p => p.id);
}

/**
 * Initialize bot states after game starts (called from socketHandlers).
 * Must be called after roles are assigned.
 */
export function initializeBotStates(room: Room): void {
  const roomCode = room.code;
  // Clear per-game dedup state so a Play Again does not block bot actions
  // when the new game's phaseKey collides with the previous game (eg MissionAction-0-0).
  botActedPhase.delete(roomCode);
  for (const key of [...botMissionActions.keys()]) {
    if (key.startsWith(roomCode + "-")) botMissionActions.delete(key);
  }
  if (!botStates.has(roomCode)) botStates.set(roomCode, new Map());
  const states = botStates.get(roomCode)!;

  for (const player of room.players) {
    if (!player.isBot || !player.role || !player.alignment) continue;

    const knownBabylonIds: string[] = [];
    const knownAngelCandidates: string[] = [];

    // Babylon players know each other
    if (player.alignment === Alignment.Babylon) {
      const babylonIds = getBabylonPlayerIds(room);
      knownBabylonIds.push(...babylonIds.filter(id => id !== player.id));
    }

    // Angel knows all Babylon
    if (player.role === Role.Angel) {
      knownBabylonIds.push(...getBabylonPlayerIds(room));
    }

    // Prophet knows Angel candidates
    if (player.role === Role.Prophet) {
      const angelId = getAngelPlayerId(room);
      const darkAngelId = getDarkAngelPlayerId(room);
      if (angelId) knownAngelCandidates.push(angelId);
      if (darkAngelId) knownAngelCandidates.push(darkAngelId);
    }

    const botState = createBotState(
      player.id,
      player.displayName,
      player.role,
      player.alignment,
      { knownBabylonIds, knownAngelCandidates }
    );

    states.set(player.id, botState);
  }
}

/**
 * Process bot actions after a room state change.
 * Called after every broadcastRoomState.
 */
export function processBotActions(
  room: Room,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
  broadcastFn: (io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>, room: Room) => void,
  sendPrivateInfoFn: (io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>, room: Room, player: any) => void,
): void {
  const roomCode = room.code;
  const states = botStates.get(roomCode);
  if (!states || states.size === 0) return;

  // Only act during actionable phases
  const actionablePhases = [
    GamePhase.TeamProposal,
    GamePhase.TeamVote,
    GamePhase.MissionAction,
    GamePhase.EvangelistAction,
    GamePhase.AssassinGuess,
    GamePhase.MissionReveal,
    GamePhase.RoleReveal,
    GamePhase.FirstNight,
  ];

  if (!actionablePhases.includes(room.phase)) return;

  // Auto-advance host-only phases if host is a bot
  if (room.phase === GamePhase.RoleReveal || room.phase === GamePhase.FirstNight) {
    // These need host to advance — skip for bots, humans will advance
    return;
  }

  // If MissionReveal, auto-advance if host is a bot
  if (room.phase === GamePhase.MissionReveal) {
    const host = room.players.find(p => p.id === room.hostId);
    if (host?.isBot) {
      setTimeout(() => {
        if (room.phase === GamePhase.MissionReveal) {
          afterMissionReveal(room);
          broadcastFn(io, room);
          processBotActions(room, io, broadcastFn, sendPrivateInfoFn);
        }
      }, 2000);
    }
    return;
  }

  // Build sanitized room state for bot decisions
  const clientState = buildBotClientState(room);

  // Phase key for dedup
  const phaseKey = `${room.phase}-${room.currentMissionIndex}-${room.missions[room.currentMissionIndex]?.currentProposalIndex ?? 0}`;

  if (!botActedPhase.has(roomCode)) botActedPhase.set(roomCode, new Map());
  const actedMap = botActedPhase.get(roomCode)!;

  // Reset mission action tracking on new mission
  const missionKey = `${roomCode}-${room.currentMissionIndex}`;
  if (!botMissionActions.has(missionKey)) {
    botMissionActions.set(missionKey, new Set());
  }

  const botIds = getBotIds(room);
  let delayBase = 1000;

  for (const botId of botIds) {
    const botState = states.get(botId);
    if (!botState) continue;

    // Skip if this bot already acted this phase
    const actedKey = `${botId}-${phaseKey}`;
    if (actedMap.get(botId) === phaseKey) continue;

    // For mission actions, check if already submitted
    if (room.phase === GamePhase.MissionAction) {
      const missionActions = botMissionActions.get(missionKey)!;
      if (missionActions.has(botId)) continue;
    }

    // Update trust scores
    updateBotTrust(botState, clientState);

    // Get decision
    const decision = decideBotAction(botState, clientState);
    if (!decision) continue;

    // Mark as acted
    actedMap.set(botId, phaseKey);

    // Random delay to feel human (1-4 seconds, staggered)
    const delay = delayBase + Math.floor(Math.random() * 2000);
    delayBase += 500;

    scheduleBotAction(room, io, botId, botState, decision, delay, broadcastFn, sendPrivateInfoFn);
  }

  // Also trigger chat for some bots (20% chance per bot, max 1 per phase)
  scheduleBotChat(room, io, states, clientState, phaseKey);
}

// ---- Internal Helpers ----

function scheduleBotAction(
  room: Room,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
  botId: string,
  botState: BotState,
  decision: ReturnType<typeof decideBotAction>,
  delay: number,
  broadcastFn: (io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>, room: Room) => void,
  sendPrivateInfoFn: (io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>, room: Room, player: any) => void,
): void {
  if (!decision) return;

  setTimeout(() => {
    try {
      executeBotDecision(room, io, botId, botState, decision, broadcastFn, sendPrivateInfoFn);
    } catch (err) {
      console.error(`[BotManager] Error executing bot ${botId} action:`, err);
    }
  }, delay);
}

function executeBotDecision(
  room: Room,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
  botId: string,
  botState: BotState,
  decision: NonNullable<ReturnType<typeof decideBotAction>>,
  broadcastFn: (io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>, room: Room) => void,
  sendPrivateInfoFn: (io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>, room: Room, player: any) => void,
): void {
  const player = room.players.find(p => p.id === botId);
  if (!player) return;

  switch (decision.type) {
    case 'propose': {
      if (room.phase !== GamePhase.TeamProposal) return;
      const leader = room.players[room.currentLeaderIndex];
      if (!leader || leader.id !== botId) return;
      proposeTeam(room, decision.data.memberIds);
      broadcastFn(io, room);
      processBotActions(room, io, broadcastFn, sendPrivateInfoFn);
      break;
    }

    case 'vote': {
      if (room.phase !== GamePhase.TeamVote) return;
      submitVote(room, botId, decision.data.approve);
      const resolved = resolveVote(room);
      broadcastFn(io, room);
      if (resolved) {
        processBotActions(room, io, broadcastFn, sendPrivateInfoFn);
      }
      break;
    }

    case 'missionAction': {
      if (room.phase !== GamePhase.MissionAction) return;
      const mission = room.missions[room.currentMissionIndex];
      if (!mission || !mission.team.includes(botId)) return;

      // Check if already submitted
      const missionKey = `${room.code}-${room.currentMissionIndex}`;
      const missionActions = botMissionActions.get(missionKey);
      if (missionActions?.has(botId)) return;
      if (mission.actions.some(a => a.playerId === botId)) return;
      missionActions?.add(botId);

      submitMissionAction(room, botId, decision.data.sabotage);
      const resolved = resolveMission(room);
      broadcastFn(io, room);
      if (resolved) {
        processBotActions(room, io, broadcastFn, sendPrivateInfoFn);
      }
      break;
    }

    case 'evangelistAction': {
      if (room.phase !== GamePhase.EvangelistAction) return;
      const playerCount = room.players.length;
      if (playerCount >= 10) {
        const { success } = evangelistConvert(room, decision.data.targetId);
        // Update private info for affected players (simplified for bots)
      } else {
        evangelistInspect(room, decision.data.targetId);
      }
      broadcastFn(io, room);
      processBotActions(room, io, broadcastFn, sendPrivateInfoFn);
      break;
    }

    case 'assassinGuess': {
      if (room.phase !== GamePhase.AssassinGuess) return;
      assassinGuess(room, decision.data.targetId);
      broadcastFn(io, room);
      break;
    }
  }
}

function scheduleBotChat(
  room: Room,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
  states: Map<string, BotState>,
  clientState: ClientRoomState,
  phaseKey: string,
): void {
  // Determine chat context
  let context = 'general';
  const currentMission = room.missions[room.currentMissionIndex];

  if (room.phase === GamePhase.TeamProposal) {
    const prevMission = room.currentMissionIndex > 0
      ? room.missions[room.currentMissionIndex - 1]
      : null;
    if (prevMission?.result === 'failure') context = 'missionFail';
    else if (prevMission?.result === 'success') context = 'missionSuccess';
  } else if (room.phase === GamePhase.TeamVote) {
    context = 'voteResult';
  }

  const botIds = getBotIds(room);
  let chatSent = false;

  for (const botId of botIds) {
    if (chatSent) break; // Max 1 chat per phase cycle

    const botState = states.get(botId);
    if (!botState) continue;

    // Skip if already chatted this phase
    if (botState.lastChatPhase === phaseKey) continue;

    // 20% chance of chatting
    if (Math.random() > 0.2) continue;

    botState.lastChatPhase = phaseKey;
    chatSent = true;

    const delay = 1500 + Math.floor(Math.random() * 3000);
    setTimeout(async () => {
      try {
        const text = await generateBotChat(botState, clientState, context);
        const player = room.players.find(p => p.id === botId);
        if (!player) return;

        const message: ChatMessage = {
          id: generateBotChatId(),
          senderId: botId,
          senderName: player.displayName,
          text: text.slice(0, 500),
          type: 'chat',
          timestamp: Date.now(),
        };

        room.chatMessages.push(message);
        const MAX_CHAT_MESSAGES = 100;
        if (room.chatMessages.length > MAX_CHAT_MESSAGES) {
          room.chatMessages = room.chatMessages.slice(-MAX_CHAT_MESSAGES);
        }

        io.to(room.code).emit('chat:message', message);
      } catch (err) {
        console.error(`[BotManager] Chat error for bot ${botId}:`, err);
      }
    }, delay);
  }
}

function buildBotClientState(room: Room): ClientRoomState {
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
      isBot: p.isBot,
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
        votes: p.resolved ? p.votes : null,
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
    readyPlayerIds: room.readyPlayerIds || [],
  };
}

/**
 * Clean up bot data when a room is destroyed.
 */
export function cleanupRoom(roomCode: string): void {
  botStates.delete(roomCode);
  usedBotNames.delete(roomCode);
  botActedPhase.delete(roomCode);
}
