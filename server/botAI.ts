// ============================================================
// Bot AI Engine — Rule-based decisions + Claude API chat
// Bots make strategic decisions based ONLY on info their role
// would have. Chat messages generated via Claude API.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import type {
  ClientRoomState,
  ClientMission,
  ClientPlayer,
  ChatMessage,
} from '../src/lib/game/types';
import { GamePhase, Role, Alignment } from '../src/lib/game/types';

// ---- Interfaces ----

export interface MissionRecord {
  missionNumber: number;
  team: string[];
  result: 'success' | 'failure' | 'pending';
  sabotageCount: number;
  proposals: {
    leaderId: string;
    memberIds: string[];
    votes: Record<string, boolean> | null;
    approved: boolean | null;
  }[];
}

export interface BotState {
  id: string;
  name: string;
  role: string;
  alignment: string;
  knownBabylonIds: string[];
  knownAngelCandidates: string[];
  trustScores: Record<string, number>;
  missionHistory: MissionRecord[];
  lastChatPhase: string;
  recentChats: string[];
  isBot: true;
}

export interface BotDecision {
  type: 'propose' | 'vote' | 'missionAction' | 'evangelistAction' | 'assassinGuess' | 'chat';
  data: any;
}

// ---- Anthropic Client (lazy init) ----

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

// ---- Bot State Management ----

export function createBotState(
  playerId: string,
  name: string,
  role: string,
  alignment: string,
  privateInfo: { knownBabylonIds: string[]; knownAngelCandidates: string[] }
): BotState {
  return {
    id: playerId,
    name,
    role,
    alignment,
    knownBabylonIds: privateInfo.knownBabylonIds,
    knownAngelCandidates: privateInfo.knownAngelCandidates,
    trustScores: {},
    missionHistory: [],
    lastChatPhase: '',
    recentChats: [],
    isBot: true,
  };
}

// ---- Trust Score Helpers ----

function clampTrust(value: number): number {
  return Math.max(-1.0, Math.min(1.0, value));
}

function getTrust(bot: BotState, playerId: string): number {
  return bot.trustScores[playerId] ?? 0;
}

function adjustTrust(bot: BotState, playerId: string, delta: number): void {
  if (playerId === bot.id) return;
  const current = getTrust(bot, playerId);
  bot.trustScores[playerId] = clampTrust(current + delta);
}

// ---- Trust Updates from Game Events ----

export function updateBotTrust(bot: BotState, roomState: ClientRoomState): void {
  // Initialize trust for all players
  for (const p of roomState.players) {
    if (p.id !== bot.id && bot.trustScores[p.id] === undefined) {
      bot.trustScores[p.id] = 0;
    }
  }

  // Babylon bots inherently trust their teammates
  if (bot.alignment === Alignment.Babylon) {
    for (const babylonId of bot.knownBabylonIds) {
      if (babylonId !== bot.id) {
        // Don't overwrite, just ensure baseline trust
        if (getTrust(bot, babylonId) < 0.3) {
          bot.trustScores[babylonId] = 0.3;
        }
      }
    }
  }

  // Angel knows Babylon — distrust them
  if (bot.role === Role.Angel) {
    for (const babylonId of bot.knownBabylonIds) {
      bot.trustScores[babylonId] = -0.9;
    }
  }

  // Update mission history and trust from completed missions
  const completedMissions = roomState.missions.filter(m => m.result !== 'pending');
  for (const mission of completedMissions) {
    const alreadyTracked = bot.missionHistory.some(
      h => h.missionNumber === mission.missionNumber
    );
    if (alreadyTracked) continue;

    // Record the mission
    bot.missionHistory.push({
      missionNumber: mission.missionNumber,
      team: mission.team,
      result: mission.result,
      sabotageCount: mission.sabotageCount,
      proposals: mission.proposals.map(p => ({
        leaderId: p.leaderId,
        memberIds: p.memberIds,
        votes: p.votes,
        approved: p.approved,
      })),
    });

    // Trust updates based on mission results
    if (mission.result === 'success') {
      for (const memberId of mission.team) {
        adjustTrust(bot, memberId, 0.2);
      }
    } else if (mission.result === 'failure') {
      for (const memberId of mission.team) {
        adjustTrust(bot, memberId, -0.4);
      }
    }

    // Trust updates based on votes on resolved proposals
    for (const proposal of mission.proposals) {
      if (!proposal.votes || proposal.approved === null) continue;

      if (mission.result === 'success') {
        // Player voted AGAINST a team that succeeded
        for (const [voterId, approved] of Object.entries(proposal.votes)) {
          if (!approved && proposal.approved) {
            adjustTrust(bot, voterId, -0.2);
          }
        }
      }

      if (mission.result === 'failure') {
        // Player voted FOR a team that failed
        for (const [voterId, approved] of Object.entries(proposal.votes)) {
          if (approved && proposal.approved) {
            adjustTrust(bot, voterId, -0.3);
          }
        }
      }
    }
  }
}

// ---- Decision Engine ----

export function decideBotAction(
  bot: BotState,
  roomState: ClientRoomState
): BotDecision | null {
  const phase = roomState.phase;

  switch (phase) {
    case GamePhase.TeamProposal:
      return decideTeamProposal(bot, roomState);
    case GamePhase.TeamVote:
      return decideVote(bot, roomState);
    case GamePhase.MissionAction:
      return decideMissionAction(bot, roomState);
    case GamePhase.EvangelistAction:
      return decideEvangelistAction(bot, roomState);
    case GamePhase.AssassinGuess:
      return decideAssassinGuess(bot, roomState);
    default:
      return null;
  }
}

function decideTeamProposal(bot: BotState, roomState: ClientRoomState): BotDecision | null {
  const mission = roomState.missions[roomState.currentMissionIndex];
  if (!mission) return null;

  // Only act if this bot is the leader
  const leaderIndex = roomState.currentLeaderIndex;
  const leader = roomState.players[leaderIndex];
  if (!leader || leader.id !== bot.id) return null;

  const teamSize = mission.requiredTeamSize;
  const otherPlayers = roomState.players.filter(p => p.id !== bot.id && p.connected);
  const isBabylon = bot.alignment === Alignment.Babylon;

  let team: string[] = [bot.id]; // always include self

  if (isBabylon) {
    // Include at least 1 Babylon teammate
    const babylonTeammates = otherPlayers.filter(p => bot.knownBabylonIds.includes(p.id));
    const nonBabylon = otherPlayers.filter(p => !bot.knownBabylonIds.includes(p.id));

    // Add one Babylon teammate
    if (babylonTeammates.length > 0) {
      const pick = babylonTeammates[Math.floor(Math.random() * babylonTeammates.length)];
      team.push(pick.id);
    }

    // Fill rest with trusted-looking players (highest trust from others' perspective)
    const remaining = nonBabylon
      .sort((a, b) => getTrust(bot, b.id) - getTrust(bot, a.id));

    for (const p of remaining) {
      if (team.length >= teamSize) break;
      team.push(p.id);
    }

    // If still need more, add remaining Babylon
    for (const p of babylonTeammates) {
      if (team.length >= teamSize) break;
      if (!team.includes(p.id)) team.push(p.id);
    }
  } else {
    // Good bot: pick highest trust players
    const sorted = otherPlayers
      .sort((a, b) => getTrust(bot, b.id) - getTrust(bot, a.id));

    for (const p of sorted) {
      if (team.length >= teamSize) break;
      team.push(p.id);
    }
  }

  // 20% chance of swapping one non-self member for a slightly less trusted player (naturalness)
  if (Math.random() < 0.2 && team.length > 1) {
    const swapIndex = 1 + Math.floor(Math.random() * (team.length - 1));
    const notOnTeam = otherPlayers.filter(p => !team.includes(p.id));
    if (notOnTeam.length > 0) {
      const replacement = notOnTeam[Math.floor(Math.random() * notOnTeam.length)];
      team[swapIndex] = replacement.id;
    }
  }

  // Ensure correct team size
  team = team.slice(0, teamSize);

  // If team is too small, pad with random available players
  const available = roomState.players.filter(p => p.connected && !team.includes(p.id));
  while (team.length < teamSize && available.length > 0) {
    const pick = available.splice(Math.floor(Math.random() * available.length), 1)[0];
    team.push(pick.id);
  }

  return { type: 'propose', data: { memberIds: team } };
}

function decideVote(bot: BotState, roomState: ClientRoomState): BotDecision | null {
  const mission = roomState.missions[roomState.currentMissionIndex];
  if (!mission) return null;

  const proposal = mission.proposals[mission.currentProposalIndex];
  if (!proposal) return null;

  // Check if already voted
  if (proposal.votedPlayerIds.includes(bot.id)) return null;

  const isBabylon = bot.alignment === Alignment.Babylon;
  let approve: boolean;

  if (isBabylon) {
    // Approve if team has a Babylon member
    const hasBabylon = proposal.memberIds.some(
      id => bot.knownBabylonIds.includes(id) || id === bot.id
    );
    approve = hasBabylon ? true : Math.random() < 0.5;
  } else {
    // Good bot: approve if average trust of proposed team > 0.1
    const avgTrust = proposal.memberIds.reduce(
      (sum, id) => sum + (id === bot.id ? 0.5 : getTrust(bot, id)),
      0
    ) / proposal.memberIds.length;
    approve = avgTrust > 0.1;
  }

  // 5th proposal — always approve to avoid auto-loss
  if (roomState.consecutiveRejections >= 4) {
    approve = true;
  }

  // 10% chance of flipping vote (naturalness)
  if (Math.random() < 0.1) {
    approve = !approve;
  }

  return { type: 'vote', data: { approve } };
}

function decideMissionAction(bot: BotState, roomState: ClientRoomState): BotDecision | null {
  const mission = roomState.missions[roomState.currentMissionIndex];
  if (!mission) return null;

  // Only act if on the team
  if (!mission.team.includes(bot.id)) return null;

  // Check if already submitted
  // We can't check from client state, so rely on the caller to not call us twice

  const isBabylon = bot.alignment === Alignment.Babylon;

  if (!isBabylon) {
    // Good bot always supports
    return { type: 'missionAction', data: { sabotage: false } };
  }

  // Babylon bot sabotage logic
  const missionNum = mission.missionNumber;
  const missionSuccesses = roomState.missions.filter(m => m.result === 'success').length;
  const missionFailures = roomState.missions.filter(m => m.result === 'failure').length;

  // Don't sabotage mission 1 (build trust)
  if (missionNum === 1) {
    return { type: 'missionAction', data: { sabotage: false } };
  }

  // Always sabotage if this could be the 3rd win for good team
  if (missionSuccesses >= 2) {
    return { type: 'missionAction', data: { sabotage: true } };
  }

  // Always sabotage if Babylon needs this win
  if (missionFailures >= 2) {
    return { type: 'missionAction', data: { sabotage: true } };
  }

  // Otherwise 70% chance of sabotage
  const sabotage = Math.random() < 0.7;
  return { type: 'missionAction', data: { sabotage } };
}

function decideEvangelistAction(bot: BotState, roomState: ClientRoomState): BotDecision | null {
  // Only Evangelist acts here
  if (bot.role !== Role.Evangelist) return null;

  // Target the player with lowest trust score
  const otherPlayers = roomState.players.filter(p => p.id !== bot.id && p.connected);
  if (otherPlayers.length === 0) return null;

  let lowestTrust = Infinity;
  let targetId = otherPlayers[0].id;

  for (const p of otherPlayers) {
    const trust = getTrust(bot, p.id);
    if (trust < lowestTrust) {
      lowestTrust = trust;
      targetId = p.id;
    }
  }

  return { type: 'evangelistAction', data: { targetId } };
}

function decideAssassinGuess(bot: BotState, roomState: ClientRoomState): BotDecision | null {
  // Only Assassin acts here
  if (bot.role !== Role.Assassin) return null;

  // Guess the player who seemed to know the most
  // Heuristic: player with highest average trust in others = might be Angel
  const otherPlayers = roomState.players.filter(
    p => p.id !== bot.id && p.connected && !bot.knownBabylonIds.includes(p.id)
  );

  if (otherPlayers.length === 0) return null;

  // Score each player by how trusted they are by the community (based on mission success)
  // Higher trust = more suspicious of being Angel (they know too much)
  let bestTarget = otherPlayers[0].id;
  let highestTrust = -Infinity;

  for (const p of otherPlayers) {
    const trust = getTrust(bot, p.id);
    if (trust > highestTrust) {
      highestTrust = trust;
      bestTarget = p.id;
    }
  }

  return { type: 'assassinGuess', data: { targetId: bestTarget } };
}

// ---- Claude API Chat Generation ----

const ROLE_DESCRIPTIONS: Record<string, string> = {
  [Role.Missionary]: 'A faithful servant on the Mission Team. You have no special knowledge — rely on observation and logic.',
  [Role.Evangelist]: 'A special Mission Team member who can investigate or convert a player after mission 4.',
  [Role.Angel]: 'You know ALL Babylon agents. You must guide your team subtly without revealing yourself.',
  [Role.Prophet]: 'You know who the Angel might be. Protect them at all costs.',
  [Role.AgentOfBabylon]: 'A Babylon infiltrator. You know your fellow agents. Sabotage missions and deceive the faithful.',
  [Role.Assassin]: 'Babylon leader. If the good side wins, you get a final chance to identify the Angel.',
  [Role.DarkAngel]: 'Babylon agent who appears as a possible Angel to the Prophet. Sow confusion.',
};

const FALLBACK_TEMPLATES = {
  missionFail: [
    'That mission failing is suspicious. Who was on that team again?',
    'Someone on that team played a sabotage card. I have my suspicions.',
    'Not good. We need to think carefully about who we trust.',
    'That failure tells us something. Let\'s think about who was on that team.',
  ],
  missionSuccess: [
    'Good work team. Let\'s keep this momentum.',
    'Mission success. I think we can trust that team.',
    'Nice. That team seems solid to me.',
  ],
  voteComment: [
    'Interesting vote results. Some of those votes surprised me.',
    'I noticed some suspicious voting patterns there.',
    'The votes are telling. Pay attention to who rejected that team.',
  ],
  defend: [
    'I\'m not Babylon. Look at my voting record.',
    'That accusation doesn\'t make sense. I\'ve been supporting good teams.',
    'Why would I sabotage? Check the mission results I\'ve been on.',
  ],
  proposalExplain: [
    'I picked people I trust based on past missions.',
    'This team has a good track record. Let\'s go with it.',
    'I feel good about this group. Trust me on this one.',
  ],
  general: [
    'Something feels off. Stay alert everyone.',
    'Let\'s think about what we know so far.',
    'I\'ve been watching the votes carefully.',
    'We need to be smarter about who we send on missions.',
    'Trust is earned. Let\'s see how this plays out.',
  ],
  babylonDeflect: [
    'I think we should look more carefully at the quiet players.',
    'Don\'t just blame the people on failed missions — the saboteur could be anyone.',
    'I\'ve been consistent with my votes. That should count for something.',
    'Let\'s not turn on each other. That\'s exactly what Babylon wants.',
  ],
};

function pickTemplate(templates: string[], exclude: string[] = []): string {
  const fresh = templates.filter(t => !exclude.includes(t));
  const pool = fresh.length > 0 ? fresh : templates;
  return pool[Math.floor(Math.random() * pool.length)];
}

function rememberChat(bot: BotState, text: string): string {
  bot.recentChats.push(text);
  if (bot.recentChats.length > 5) bot.recentChats.shift();
  return text;
}

function generateFallbackChat(bot: BotState, context: string): string {
  const isBabylon = bot.alignment === Alignment.Babylon;
  const recent = bot.recentChats;

  switch (context) {
    case 'missionFail':
      return rememberChat(bot, isBabylon
        ? pickTemplate(FALLBACK_TEMPLATES.babylonDeflect, recent)
        : pickTemplate(FALLBACK_TEMPLATES.missionFail, recent));
    case 'missionSuccess':
      return rememberChat(bot, pickTemplate(FALLBACK_TEMPLATES.missionSuccess, recent));
    case 'voteResult':
      return rememberChat(bot, pickTemplate(FALLBACK_TEMPLATES.voteComment, recent));
    case 'accused':
      return rememberChat(bot, pickTemplate(FALLBACK_TEMPLATES.defend, recent));
    case 'proposing':
      return rememberChat(bot, pickTemplate(FALLBACK_TEMPLATES.proposalExplain, recent));
    default:
      return rememberChat(bot, isBabylon
        ? pickTemplate(FALLBACK_TEMPLATES.babylonDeflect, recent)
        : pickTemplate(FALLBACK_TEMPLATES.general, recent));
  }
}

function buildGameStateDescription(bot: BotState, roomState: ClientRoomState): string {
  const missionResults = roomState.missions
    .filter(m => m.result !== 'pending')
    .map(m => `Mission ${m.missionNumber}: ${m.result}${m.sabotageCount > 0 ? ` (${m.sabotageCount} sabotage)` : ''}`)
    .join(', ');

  const successes = roomState.missions.filter(m => m.result === 'success').length;
  const failures = roomState.missions.filter(m => m.result === 'failure').length;
  const currentMission = roomState.missions[roomState.currentMissionIndex];
  const playerNames = roomState.players.map(p => p.displayName).join(', ');

  const recentChat = roomState.chatMessages
    .slice(-5)
    .filter(m => m.type !== 'system')
    .map(m => `${m.senderName}: ${m.text}`)
    .join('\n');

  let stateStr = `Players: ${playerNames}\n`;
  stateStr += `Score: Mission Team ${successes} - Babylon ${failures}\n`;
  if (missionResults) stateStr += `Results: ${missionResults}\n`;
  if (currentMission) {
    stateStr += `Current: Mission ${currentMission.missionNumber}, needs ${currentMission.requiredTeamSize} players\n`;
    if (currentMission.team.length > 0) {
      const teamNames = currentMission.team
        .map(id => roomState.players.find(p => p.id === id)?.displayName ?? 'Unknown')
        .join(', ');
      stateStr += `Current team: ${teamNames}\n`;
    }
  }
  if (recentChat) stateStr += `\nRecent chat:\n${recentChat}\n`;

  return stateStr;
}

export async function generateBotChat(
  bot: BotState,
  roomState: ClientRoomState,
  context: string
): Promise<string> {
  const client = getAnthropicClient();

  if (!client) {
    return generateFallbackChat(bot, context);
  }

  const knowledgeStr = bot.alignment === Alignment.Babylon
    ? `You know these players are your Babylon teammates: ${bot.knownBabylonIds
        .map(id => roomState.players.find(p => p.id === id)?.displayName ?? 'Unknown')
        .join(', ')}`
    : bot.role === Role.Angel
      ? `You know these players are Babylon: ${bot.knownBabylonIds
          .map(id => roomState.players.find(p => p.id === id)?.displayName ?? 'Unknown')
          .join(', ')}`
      : bot.role === Role.Prophet && bot.knownAngelCandidates.length > 0
        ? `You think the Angel might be one of: ${bot.knownAngelCandidates
            .map(id => roomState.players.find(p => p.id === id)?.displayName ?? 'Unknown')
            .join(', ')}`
        : 'You have no special knowledge about other players\' roles.';

  const gameState = buildGameStateDescription(bot, roomState);

  const systemPrompt = `You are playing a social deduction game called The Great Controversy. You are ${bot.name}, playing as ${bot.role} on the ${bot.alignment} team.

YOUR ROLE: ${ROLE_DESCRIPTIONS[bot.role] ?? 'A player in this game.'}
YOUR KNOWLEDGE: ${knowledgeStr}

GAME STATE:
${gameState}

CONTEXT: ${context}

IMPORTANT RULES:
- Keep messages SHORT (1-2 sentences max)
- Be natural and conversational — you're in a group chat
- If you're Babylon, LIE convincingly. Deflect suspicion. Accuse others.
- If you're Mission Team, share observations. Be logical but not certain.
- NEVER reveal your role directly unless it's a strategic bluff.
- Reference specific game events (votes, mission results) to seem observant.
- Vary your style — sometimes be suspicious, sometimes supportive, sometimes quiet.
- Do NOT use emojis or exclamation marks excessively.
- Sound like a real human player, not an AI.`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate a single short chat message for this moment in the game. Context: ${context}. Just the message text, nothing else.`,
        },
      ],
    });

    const text = response.content[0];
    if (text && text.type === 'text') {
      // Trim and limit length
      return text.text.trim().slice(0, 200);
    }
    return generateFallbackChat(bot, context);
  } catch (err) {
    console.error('[BotAI] Claude API error, using fallback:', err);
    return generateFallbackChat(bot, context);
  }
}
