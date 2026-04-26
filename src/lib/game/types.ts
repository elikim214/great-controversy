// ============================================================
// The Great Controversy: A Last Day ADVENTure Game
// Core type definitions for the entire game system
// ============================================================

import type { MissionStory } from './missionStories';

/** All possible game phases */
export enum GamePhase {
  Lobby = 'lobby',
  RoleReveal = 'roleReveal',
  FirstNight = 'firstNight',
  TeamProposal = 'teamProposal',
  TeamVote = 'teamVote',
  MissionAction = 'missionAction',
  MissionReveal = 'missionReveal',
  EvangelistAction = 'evangelistAction',
  AssassinGuess = 'assassinGuess',
  GameOver = 'gameOver',
}

/** Player roles */
export enum Role {
  // Good team
  Missionary = 'Missionary',
  Evangelist = 'Evangelist',
  Angel = 'Angel',
  Prophet = 'Prophet',
  // Babylon team
  AgentOfBabylon = 'Agent of Babylon',
  Assassin = 'Assassin',
  DarkAngel = 'Dark Angel',
}

/** Team alignments */
export enum Alignment {
  MissionTeam = 'Mission Team',
  Babylon = 'Babylon',
}

/** Maps each role to its alignment */
export const ROLE_ALIGNMENT: Record<Role, Alignment> = {
  [Role.Missionary]: Alignment.MissionTeam,
  [Role.Evangelist]: Alignment.MissionTeam,
  [Role.Angel]: Alignment.MissionTeam,
  [Role.Prophet]: Alignment.MissionTeam,
  [Role.AgentOfBabylon]: Alignment.Babylon,
  [Role.Assassin]: Alignment.Babylon,
  [Role.DarkAngel]: Alignment.Babylon,
};

/** Chat message */
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  type: 'chat' | 'accusation' | 'system';
  targetId?: string;       // for accusations
  targetName?: string;     // for accusations
  timestamp: number;
}

/** A connected player */
export interface Player {
  id: string;
  displayName: string;
  socketId: string;
  isHost: boolean;
  role?: Role;
  alignment?: Alignment;
  connected: boolean;
  disconnectedAt?: number;  // timestamp when disconnected, undefined if connected
  avatarIndex: number;
  isBot?: boolean;
}

/** A mission destination */
export interface MissionLocation {
  id: string;
  name: string;
  region: string;
  flavorText: string;
  difficulty: 'Twilight' | 'Darkness' | 'Deep Darkness' | 'Unreached' | 'Forgotten';
  image: string;           // filename in /public/locations/
  image2: string;          // second image filename in /public/locations/
  beliefSystem: string;    // dominant religion/belief system
  whyHardToReach: string;  // 2-3 sentences on barriers to the gospel
  history: string;         // 2-3 sentences of pertinent historical context
  population: string;      // approximate population of unreached in area
  callToAction: string;    // 1 inspirational sentence about why this place matters
  lat: number;             // approximate latitude for map positioning
  lng: number;             // approximate longitude for map positioning
}

/** A team proposal for a mission */
export interface TeamProposal {
  leaderId: string;
  memberIds: string[];
  votes: Record<string, boolean>; // playerId -> approve/reject
  resolved: boolean;
  approved: boolean | null;
}

/** Individual mission action (success or sabotage) */
export interface MissionAction {
  playerId: string;
  sabotage: boolean;
}

/** A single mission */
export interface Mission {
  missionNumber: number; // 1-5
  requiredTeamSize: number;
  requiresTwoFails: boolean;
  location: MissionLocation;
  proposals: TeamProposal[];
  currentProposalIndex: number;
  team: string[]; // approved team member IDs
  actions: MissionAction[];
  result: 'success' | 'failure' | 'pending';
  sabotageCount: number;
  story?: MissionStory;
}

/** Evangelist conversion result */
export interface EvangelistConversion {
  missionNumber: number;
  targetId: string;
  success: boolean; // true if target was Babylon and got converted, false if already Mission Team
}

/** Overall game result */
export interface GameResult {
  winner: Alignment | null;
  reason: string;
  missionSuccesses: number;
  missionFailures: number;
  assassinGuessCorrect?: boolean;
}

/** Configuration options set by host before game start */
export interface GameConfig {
  showVoteHistory?: boolean;
  discussionTimer?: number; // seconds, 0 = disabled, default 0
}

/** The complete room state (server-authoritative) */
export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  phase: GamePhase;
  config: GameConfig;

  // Game state (populated after game start)
  missions: Mission[];
  currentMissionIndex: number;
  currentLeaderIndex: number;
  consecutiveRejections: number;

  // Evangelist tracking
  evangelistConversions: EvangelistConversion[];
  evangelistHasActedThisMission: boolean;

  // Assassin endgame
  assassinGuessTargetId: string | null;
  assassinGuessesRemaining: number;

  // Result
  result: GameResult | null;

  // First night tracking
  firstNightStep: number;

  // Role reveal ready confirmation
  readyPlayerIds: string[];

  // Chat
  chatMessages: ChatMessage[];
}

/** What the client stores locally for reconnection */
export interface LocalSession {
  roomCode: string;
  playerId: string;
  displayName: string;
  isHost: boolean;
}

// ============================================================
// Socket.IO event types
// ============================================================

/** Events the client sends to the server */
export interface ClientToServerEvents {
  'room:create': (data: { displayName: string; avatarIndex?: number }, callback: (res: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => void) => void;
  'room:spectate': (data: { roomCode: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'room:join': (data: { roomCode: string; displayName: string; avatarIndex?: number }, callback: (res: { success: boolean; playerId?: string; error?: string }) => void) => void;
  'room:rejoin': (data: { roomCode: string; playerId: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'room:kick': (data: { targetPlayerId: string }) => void;
  'room:updateConfig': (data: Partial<GameConfig>) => void;
  'game:start': () => void;
  'game:advanceFirstNight': () => void;
  'game:advancePhase': () => void;
  'game:proposeTeam': (data: { memberIds: string[] }) => void;
  'game:submitVote': (data: { approve: boolean }) => void;
  'game:submitMissionAction': (data: { sabotage: boolean }) => void;
  'game:evangelistConvert': (data: { targetId: string }) => void;
  'game:assassinGuess': (data: { targetId: string }) => void;
  'game:confirmReady': () => void;
  'game:restart': () => void;
  'game:returnToLobby': () => void;
  'room:addBot': (data: { name?: string }, callback: (res: { success: boolean; botId?: string; error?: string }) => void) => void;
  'room:removeBot': (data: { botId: string }) => void;
  'chat:send': (data: { text: string }) => void;
  'chat:accuse': (data: { targetId: string; reason: string }) => void;
}

/** Events the server sends to clients */
export interface ServerToClientEvents {
  'room:state': (state: ClientRoomState) => void;
  'room:error': (error: string) => void;
  'player:privateInfo': (info: PlayerPrivateInfo) => void;
  'evangelist:conversionResult': (result: { targetId: string; targetName: string; success: boolean }) => void;
  'assassin:guessResult': (result: { correct: boolean; targetName: string }) => void;
  'babylon:teammateConverted': (data: { convertedName: string; youAreNowAssassin: boolean }) => void;
  'angel:conversionNotice': (data: { convertedName: string }) => void;
  'game:phaseMessage': (message: { title: string; body: string }) => void;
  'chat:message': (message: ChatMessage) => void;
}

/** Room state sanitized for a specific client (no other players' secrets) */
export interface ClientRoomState {
  code: string;
  hostId: string;
  players: ClientPlayer[];
  phase: GamePhase;
  config: GameConfig;
  missions: ClientMission[];
  currentMissionIndex: number;
  currentLeaderIndex: number;
  consecutiveRejections: number;
  assassinGuessesRemaining: number;
  result: GameResult | null;
  firstNightStep: number;
  evangelistHasActedThisMission: boolean;
  chatMessages: ChatMessage[];
  readyPlayerIds: string[];
}

/** Player info visible to all clients */
export interface ClientPlayer {
  id: string;
  displayName: string;
  isHost: boolean;
  connected: boolean;
  disconnectedAt?: number;
  avatarIndex: number;
  isBot?: boolean;
  revealedRole?: string;
  revealedAlignment?: string;
  wasConverted?: boolean;
  originalRole?: string;
}

/** Mission info visible to all clients */
export interface ClientMission {
  missionNumber: number;
  requiredTeamSize: number;
  requiresTwoFails: boolean;
  location: MissionLocation;
  proposals: ClientProposal[];
  currentProposalIndex: number;
  team: string[];
  result: 'success' | 'failure' | 'pending';
  sabotageCount: number;
  story?: MissionStory;
}

/** Proposal info visible to all clients */
export interface ClientProposal {
  leaderId: string;
  memberIds: string[];
  votedPlayerIds: string[]; // who has voted (not how)
  resolved: boolean;
  approved: boolean | null;
  votes: Record<string, boolean> | null; // only revealed after resolution
}

/** Private info sent only to the relevant player */
export interface PlayerPrivateInfo {
  role: Role;
  alignment: Alignment;
  knownBabylonIds: string[]; // for Babylon players and Angel
  knownAngelId: string | null; // for Prophet (backward compat)
  knownPossibleAngelIds: string[]; // for Prophet: [Angel, DarkAngel] shuffled (or just [Angel])
  conversions: EvangelistConversion[]; // for Evangelist
  inspectedAlignment?: Alignment; // for Evangelist in 7-9 player inspect mode
}
