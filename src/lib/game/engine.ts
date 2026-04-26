// ============================================================
// The Great Controversy — Game Engine
// Pure TypeScript game logic with no UI or framework coupling.
// All state mutations return a new room state.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import {
  Room, Player, GamePhase, Role, Alignment, Mission,
  TeamProposal, MissionAction, EvangelistConversion,
  GameResult, GameConfig, ROLE_ALIGNMENT, MissionLocation,
} from './types';
import {
  TOTAL_MISSIONS, MISSIONS_TO_WIN, MAX_REJECTIONS, MIN_PLAYERS,
  getMissionTeamSizes, getSabotageThreshold, ROOM_CODE_LENGTH,
} from './config';
import { assignRoles } from './roleAssignment';
import { pickMissionLocations } from './missionLocations';
import { generateMissionStory } from './missionStories';

// ---- Room Management ----

/** Generate a random room code */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/** Create a new room with the host as first player */
export function createRoom(hostName: string, hostSocketId: string): { room: Room; hostId: string } {
  const hostId = uuidv4();
  const room: Room = {
    code: generateRoomCode(),
    hostId,
    players: [
      {
        id: hostId,
        displayName: hostName,
        socketId: hostSocketId,
        isHost: true,
        connected: true,
        missionaryIndex: Math.floor(Math.random() * 60),
      },
    ],
    phase: GamePhase.Lobby,
    config: { showVoteHistory: true },
    missions: [],
    currentMissionIndex: 0,
    currentLeaderIndex: 0,
    consecutiveRejections: 0,
    evangelistConversions: [],
    evangelistHasActedThisMission: false,
    assassinGuessTargetId: null,
    assassinGuessesRemaining: 1,
    result: null,
    firstNightStep: 0,
    chatMessages: [],
  };
  return { room, hostId };
}

/** Add a player to a room */
export function addPlayer(room: Room, displayName: string, socketId: string): { room: Room; playerId: string } {
  const playerId = uuidv4();
  const player: Player = {
    id: playerId,
    displayName,
    socketId,
    isHost: false,
    connected: true,
    missionaryIndex: Math.floor(Math.random() * 60),
  };
  room.players.push(player);
  return { room, playerId };
}

/** Remove a player from a room */
export function removePlayer(room: Room, playerId: string): Room {
  room.players = room.players.filter(p => p.id !== playerId);
  return room;
}

/** Reconnect a player (update socket ID, mark connected) */
export function reconnectPlayer(room: Room, playerId: string, socketId: string): Room {
  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.socketId = socketId;
    player.connected = true;
    player.disconnectedAt = undefined;
  }
  return room;
}

/** Mark a player as disconnected */
export function disconnectPlayer(room: Room, socketId: string): Room {
  const player = room.players.find(p => p.socketId === socketId);
  if (player) {
    player.connected = false;
    player.disconnectedAt = Date.now();
  }
  return room;
}

// ---- Game Start ----

/** Initialize game: assign roles, create missions, enter first night */
export function startGame(room: Room): Room {
  const playerCount = room.players.length;

  // Assign roles
  const assignments = assignRoles(playerCount, room.config);
  room.players.forEach((player, i) => {
    player.role = assignments[i].role;
    player.alignment = assignments[i].alignment;
  });

  // Pick mission locations and create missions
  const teamSizes = getMissionTeamSizes(playerCount);
  const locations = pickMissionLocations(TOTAL_MISSIONS);

  room.missions = Array.from({ length: TOTAL_MISSIONS }, (_, i) => ({
    missionNumber: i + 1,
    requiredTeamSize: teamSizes[i],
    requiresTwoFails: i === 3 && playerCount >= 7, // Mission 4, only with 7+ players
    location: locations[i],
    proposals: [],
    currentProposalIndex: 0,
    team: [],
    actions: [],
    result: 'pending' as const,
    sabotageCount: 0,
  }));

  // Randomize starting leader
  room.currentLeaderIndex = Math.floor(Math.random() * room.players.length);
  room.currentMissionIndex = 0;
  room.consecutiveRejections = 0;
  room.evangelistConversions = [];
  room.evangelistHasActedThisMission = false;
  room.assassinGuessTargetId = null;
  room.assassinGuessesRemaining = playerCount >= 10 ? 2 : 1;
  room.result = null;
  room.firstNightStep = 0;
  room.phase = GamePhase.RoleReveal;

  return room;
}

// ---- First Night ----

/**
 * Advance through first-night reveal steps:
 * 0 -> RoleReveal (show individual role)
 * 1 -> FirstNight step 1: Babylon sees Babylon
 * 2 -> FirstNight step 2: Angel sees Babylon
 * 3 -> FirstNight step 3: Prophet sees Angel
 * 4 -> Transition to TeamProposal
 */
export function advanceFirstNight(room: Room): Room {
  // Skip narration steps 1-3 (eyes open/close) since roles are revealed on devices.
  // Go directly from RoleReveal (step 0) to TeamProposal.
  room.firstNightStep = 4;
  room.phase = GamePhase.TeamProposal;

  return room;
}

// ---- Team Proposal ----

/** Leader proposes a team */
export function proposeTeam(room: Room, memberIds: string[]): Room {
  const mission = room.missions[room.currentMissionIndex];

  const proposal: TeamProposal = {
    leaderId: room.players[room.currentLeaderIndex].id,
    memberIds,
    votes: {},
    resolved: false,
    approved: null,
  };

  mission.proposals.push(proposal);
  mission.currentProposalIndex = mission.proposals.length - 1;
  room.phase = GamePhase.TeamVote;

  return room;
}

// ---- Voting ----

/** Submit a vote on the current proposal */
export function submitVote(room: Room, playerId: string, approve: boolean): Room {
  const mission = room.missions[room.currentMissionIndex];
  const proposal = mission.proposals[mission.currentProposalIndex];

  proposal.votes[playerId] = approve;

  return room;
}

/** Check if all votes are in and resolve the proposal */
export function resolveVote(room: Room): Room | null {
  const mission = room.missions[room.currentMissionIndex];
  const proposal = mission.proposals[mission.currentProposalIndex];

  // Check if all players have voted
  const totalVotes = Object.keys(proposal.votes).length;
  if (totalVotes < room.players.length) {
    return null; // Not all votes in yet
  }

  // Count votes
  const approvals = Object.values(proposal.votes).filter(v => v).length;
  const majority = Math.floor(room.players.length / 2) + 1;

  proposal.resolved = true;
  proposal.approved = approvals >= majority;

  if (proposal.approved) {
    // Team approved — move to mission action
    mission.team = proposal.memberIds;
    room.consecutiveRejections = 0;
    room.phase = GamePhase.MissionAction;
  } else {
    // Team rejected
    room.consecutiveRejections += 1;

    if (room.consecutiveRejections >= MAX_REJECTIONS) {
      // 5 consecutive rejections — Babylon wins the GAME
      room.result = {
        winner: Alignment.Babylon,
        reason: 'Five team proposals rejected in a row. Mission work has ceased and the gospel cannot reach the unreached. Babylon prevails as Jesus\' second coming is delayed.',
        missionSuccesses: countMissionResults(room, 'success'),
        missionFailures: countMissionResults(room, 'failure'),
      };
      room.phase = GamePhase.GameOver;
    } else {
      // Rotate leader, new proposal
      room.currentLeaderIndex = (room.currentLeaderIndex + 1) % room.players.length;
      room.phase = GamePhase.TeamProposal;
    }
  }

  return room;
}

// ---- Mission Actions ----

/** Submit a mission action (success or sabotage) */
export function submitMissionAction(room: Room, playerId: string, sabotage: boolean): Room {
  const mission = room.missions[room.currentMissionIndex];
  mission.actions.push({ playerId, sabotage });
  return room;
}

/** Resolve mission result after all actions submitted */
export function resolveMission(room: Room): Room | null {
  const mission = room.missions[room.currentMissionIndex];

  if (mission.actions.length < mission.team.length) {
    return null; // Not all actions in
  }

  // Count sabotages
  const sabotageCount = mission.actions.filter(a => a.sabotage).length;
  const threshold = getSabotageThreshold(mission.missionNumber, room.players.length);

  mission.sabotageCount = sabotageCount;
  mission.result = sabotageCount >= threshold ? 'failure' : 'success';

  // Generate cinematic mission story
  mission.story = generateMissionStory(
    mission.location.name,
    mission.location.region,
    mission.missionNumber,
    mission.result === 'success',
    mission.sabotageCount,
    mission.team.length,
  );

  room.phase = GamePhase.MissionReveal;

  return room;
}

/** After mission reveal, proceed to next phase */
export function afterMissionReveal(room: Room): Room {
  // Check win condition
  const result = checkWinCondition(room);
  if (result) {
    if (result.winner === Alignment.MissionTeam) {
      // Good won by missions — Assassin gets a chance
      room.phase = GamePhase.AssassinGuess;
    } else {
      room.result = result;
      room.phase = GamePhase.GameOver;
    }
    return room;
  }

  // Check if there's an Evangelist who can act (only on mission 4)
  const currentMission = room.missions[room.currentMissionIndex];
  const evangelist = room.players.find(p => p.role === Role.Evangelist);
  if (evangelist && currentMission.missionNumber === 4) {
    room.evangelistHasActedThisMission = false;
    room.phase = GamePhase.EvangelistAction;
  } else {
    // No evangelist or not mission 4 — proceed to next mission
    advanceToNextMission(room);
  }

  return room;
}

// ---- Evangelist ----

/** Evangelist converts a player (10+ players) */
export function evangelistConvert(room: Room, targetId: string): { room: Room; success: boolean } {
  const target = room.players.find(p => p.id === targetId);
  if (!target) return { room, success: false };

  let success = false;

  if (target.alignment === Alignment.Babylon) {
    // Target is Babylon — convert them!
    const wasAssassin = target.role === Role.Assassin;

    // Convert target to Missionary on Mission Team
    target.role = Role.Missionary;
    target.alignment = Alignment.MissionTeam;
    success = true;

    // If the converted player was the Assassin, transfer Assassin role to another Babylon player
    if (wasAssassin) {
      const remainingBabylon = room.players.find(
        p => p.alignment === Alignment.Babylon && p.id !== targetId
      );
      if (remainingBabylon) {
        remainingBabylon.role = Role.Assassin;
      }
    }
  }
  // If target is already Mission Team, nothing happens (success stays false)

  const conversion: EvangelistConversion = {
    missionNumber: room.missions[room.currentMissionIndex].missionNumber,
    targetId,
    success,
  };

  room.evangelistConversions.push(conversion);
  room.evangelistHasActedThisMission = true;

  // Proceed to next mission
  advanceToNextMission(room);

  return { room, success };
}

/** Evangelist inspects a player (7-9 players) — learn alignment without converting */
export function evangelistInspect(room: Room, targetId: string): { room: Room; targetAlignment: Alignment | null } {
  const target = room.players.find(p => p.id === targetId);
  if (!target || !target.alignment) return { room, targetAlignment: null };

  const targetAlignment = target.alignment;

  // Record in conversions array (success = false since no conversion happened)
  const conversion: EvangelistConversion = {
    missionNumber: room.missions[room.currentMissionIndex].missionNumber,
    targetId,
    success: false, // inspect mode never converts
  };

  room.evangelistConversions.push(conversion);
  room.evangelistHasActedThisMission = true;

  // Proceed to next mission
  advanceToNextMission(room);

  return { room, targetAlignment };
}

/** Skip Evangelist action (host advances) */
export function skipEvangelistAction(room: Room): Room {
  room.evangelistHasActedThisMission = true;
  advanceToNextMission(room);
  return room;
}

// ---- Assassin Endgame ----

/** Assassin makes their guess */
export function assassinGuess(room: Room, targetId: string): Room {
  const target = room.players.find(p => p.id === targetId);
  if (!target) return room;

  room.assassinGuessTargetId = targetId;
  const correct = target.role === Role.Angel;

  if (correct) {
    // Babylon wins by assassination
    room.result = {
      winner: Alignment.Babylon,
      reason: 'The Assassin identified the Angel! Babylon prevails as the light is extinguished.',
      missionSuccesses: countMissionResults(room, 'success'),
      missionFailures: countMissionResults(room, 'failure'),
      assassinGuessCorrect: true,
    };
    room.phase = GamePhase.GameOver;
  } else {
    // Wrong guess — check remaining guesses
    room.assassinGuessesRemaining -= 1;

    if (room.assassinGuessesRemaining > 0) {
      // Stay in AssassinGuess phase for another attempt
      room.assassinGuessTargetId = null; // Reset for next guess
    } else {
      // No guesses remaining — Good wins
      room.result = {
        winner: Alignment.MissionTeam,
        reason: 'The gospel is preached to all the world and Jesus comes! The Assassin failed to find the Angel.',
        missionSuccesses: countMissionResults(room, 'success'),
        missionFailures: countMissionResults(room, 'failure'),
        assassinGuessCorrect: false,
      };
      room.phase = GamePhase.GameOver;
    }
  }

  return room;
}

// ---- Win Condition ----

/** Check if either side has won by mission count */
export function checkWinCondition(room: Room): GameResult | null {
  const successes = countMissionResults(room, 'success');
  const failures = countMissionResults(room, 'failure');

  if (successes >= MISSIONS_TO_WIN) {
    // Don't finalize here — Assassin override happens in afterMissionReveal
    return {
      winner: Alignment.MissionTeam,
      reason: 'The gospel is preached to all the world and Jesus comes!',
      missionSuccesses: successes,
      missionFailures: failures,
    };
  }

  if (failures >= MISSIONS_TO_WIN) {
    return {
      winner: Alignment.Babylon,
      reason: 'The second coming is delayed. Babylon has prevailed.',
      missionSuccesses: successes,
      missionFailures: failures,
    };
  }

  return null;
}

// ---- Helpers ----

function countMissionResults(room: Room, result: 'success' | 'failure'): number {
  return room.missions.filter(m => m.result === result).length;
}

function advanceToNextMission(room: Room): void {
  room.currentMissionIndex += 1;
  room.consecutiveRejections = 0;
  room.evangelistHasActedThisMission = false;
  // Rotate leader
  room.currentLeaderIndex = (room.currentLeaderIndex + 1) % room.players.length;
  room.phase = GamePhase.TeamProposal;
}

// ---- Player Removal (mid-game) ----

/**
 * Handle removing a player mid-game: reassign their special role,
 * adjust team sizes, fix phase state, check minimum player count.
 */
export function handlePlayerRemoval(
  room: Room,
  playerId: string
): { room: Room; affectedPlayerIds: string[] } {
  const affectedPlayerIds: string[] = [];
  const removedPlayer = room.players.find(p => p.id === playerId);
  if (!removedPlayer) return { room, affectedPlayerIds };

  const removedRole = removedPlayer.role;
  const removedAlignment = removedPlayer.alignment;

  // --- Role reassignment ---
  if (removedRole === Role.Assassin) {
    // Find another Babylon player to become Assassin
    const newAssassin = room.players.find(
      p => p.id !== playerId && p.alignment === Alignment.Babylon
    );
    if (newAssassin) {
      newAssassin.role = Role.Assassin;
      affectedPlayerIds.push(newAssassin.id);
    }
    // If no other Babylon exists, assassin ability is lost
  } else if (removedRole === Role.Angel) {
    // Find a Missionary to become Angel
    const newAngel = room.players.find(
      p => p.id !== playerId && p.role === Role.Missionary
    );
    if (newAngel) {
      newAngel.role = Role.Angel;
      // Angel needs to know all Babylon identities — privateInfo rebuild handles this
      affectedPlayerIds.push(newAngel.id);
      // Prophet needs updated candidates
      const prophet = room.players.find(p => p.role === Role.Prophet);
      if (prophet) affectedPlayerIds.push(prophet.id);
    }
  } else if (removedRole === Role.Prophet) {
    const newProphet = room.players.find(
      p => p.id !== playerId && p.role === Role.Missionary
    );
    if (newProphet) {
      newProphet.role = Role.Prophet;
      affectedPlayerIds.push(newProphet.id);
    }
  } else if (removedRole === Role.Evangelist) {
    const newEvangelist = room.players.find(
      p => p.id !== playerId && p.role === Role.Missionary
    );
    if (newEvangelist) {
      newEvangelist.role = Role.Evangelist;
      affectedPlayerIds.push(newEvangelist.id);
    }
  } else if (removedRole === Role.DarkAngel) {
    const newDarkAngel = room.players.find(
      p => p.id !== playerId && p.role === Role.AgentOfBabylon
    );
    if (newDarkAngel) {
      newDarkAngel.role = Role.DarkAngel;
      affectedPlayerIds.push(newDarkAngel.id);
      // Prophet needs updated candidates
      const prophet = room.players.find(p => p.role === Role.Prophet);
      if (prophet) affectedPlayerIds.push(prophet.id);
    }
  }
  // Agent of Babylon / Missionary removed: no reassignment needed

  // --- Remove the player ---
  const removedIndex = room.players.findIndex(p => p.id === playerId);
  room.players = room.players.filter(p => p.id !== playerId);
  const playerCount = room.players.length;

  // --- Minimum player check ---
  if (playerCount < MIN_PLAYERS) {
    room.result = {
      winner: null,
      reason: 'Not enough players to continue. Game cancelled.',
      missionSuccesses: countMissionResults(room, 'success'),
      missionFailures: countMissionResults(room, 'failure'),
    };
    room.phase = GamePhase.GameOver;
    return { room, affectedPlayerIds };
  }

  // --- Check if all Babylon is gone ---
  const remainingBabylon = room.players.filter(p => p.alignment === Alignment.Babylon);
  if (removedAlignment === Alignment.Babylon && remainingBabylon.length === 0) {
    room.result = {
      winner: Alignment.MissionTeam,
      reason: 'All agents of Babylon have departed. The Mission Team wins!',
      missionSuccesses: countMissionResults(room, 'success'),
      missionFailures: countMissionResults(room, 'failure'),
    };
    room.phase = GamePhase.GameOver;
    return { room, affectedPlayerIds };
  }

  // --- Team size adjustment for remaining missions ---
  const newTeamSizes = getMissionTeamSizes(playerCount);
  for (let i = room.currentMissionIndex; i < room.missions.length; i++) {
    if (room.missions[i].result === 'pending') {
      room.missions[i].requiredTeamSize = newTeamSizes[i];
      room.missions[i].requiresTwoFails = i === 3 && playerCount >= 7;
    }
  }

  // --- Fix leader index ---
  if (room.currentLeaderIndex >= playerCount) {
    room.currentLeaderIndex = room.currentLeaderIndex % playerCount;
  } else if (removedIndex <= room.currentLeaderIndex && room.currentLeaderIndex > 0) {
    room.currentLeaderIndex -= 1;
  }

  // --- Phase-specific handling ---
  const currentMission = room.missions[room.currentMissionIndex];

  if (room.phase === GamePhase.TeamProposal) {
    // If removed player was the leader, the index already adjusted — just continue
    // The new player at that index becomes leader
  } else if (room.phase === GamePhase.TeamVote && currentMission) {
    const proposal = currentMission.proposals[currentMission.currentProposalIndex];
    if (proposal && !proposal.resolved) {
      // Remove their vote if they had one
      delete proposal.votes[playerId];
      // Remove them from memberIds if they were on proposed team
      proposal.memberIds = proposal.memberIds.filter(id => id !== playerId);
      // Check if all remaining players have voted — try to resolve
      const totalVotes = Object.keys(proposal.votes).length;
      if (totalVotes >= room.players.length) {
        // All remaining players voted — resolve
        const approvals = Object.values(proposal.votes).filter(v => v).length;
        const majority = Math.floor(room.players.length / 2) + 1;
        proposal.resolved = true;
        proposal.approved = approvals >= majority;

        if (proposal.approved) {
          currentMission.team = proposal.memberIds;
          room.consecutiveRejections = 0;
          room.phase = GamePhase.MissionAction;
        } else {
          room.consecutiveRejections += 1;
          if (room.consecutiveRejections >= MAX_REJECTIONS) {
            room.result = {
              winner: Alignment.Babylon,
              reason: 'Five team proposals rejected in a row. Babylon prevails.',
              missionSuccesses: countMissionResults(room, 'success'),
              missionFailures: countMissionResults(room, 'failure'),
            };
            room.phase = GamePhase.GameOver;
          } else {
            room.currentLeaderIndex = (room.currentLeaderIndex + 1) % room.players.length;
            room.phase = GamePhase.TeamProposal;
          }
        }
      }
    }
  } else if (room.phase === GamePhase.MissionAction && currentMission) {
    if (currentMission.team.includes(playerId)) {
      // Remove from team and remove their action if submitted
      currentMission.team = currentMission.team.filter(id => id !== playerId);
      currentMission.actions = currentMission.actions.filter(a => a.playerId !== playerId);
      // Check if all remaining team members have acted
      if (currentMission.actions.length >= currentMission.team.length && currentMission.team.length > 0) {
        const sabotageCount = currentMission.actions.filter(a => a.sabotage).length;
        const threshold = getSabotageThreshold(currentMission.missionNumber, playerCount);
        currentMission.sabotageCount = sabotageCount;
        currentMission.result = sabotageCount >= threshold ? 'failure' : 'success';
        room.phase = GamePhase.MissionReveal;
      }
    }
  } else if (room.phase === GamePhase.AssassinGuess) {
    if (removedRole === Role.Assassin) {
      // Check if reassignment happened
      const newAssassin = room.players.find(p => p.role === Role.Assassin);
      if (!newAssassin) {
        // No assassin left — good wins
        room.result = {
          winner: Alignment.MissionTeam,
          reason: 'The Assassin has departed. The Angel is safe. The Mission Team wins!',
          missionSuccesses: countMissionResults(room, 'success'),
          missionFailures: countMissionResults(room, 'failure'),
          assassinGuessCorrect: false,
        };
        room.phase = GamePhase.GameOver;
      }
      // If reassigned, new assassin stays in AssassinGuess phase
    }
  } else if (room.phase === GamePhase.EvangelistAction) {
    if (removedRole === Role.Evangelist) {
      const newEvangelist = room.players.find(p => p.role === Role.Evangelist);
      if (!newEvangelist) {
        // No evangelist — skip phase
        advanceToNextMission(room);
      }
      // If reassigned, new evangelist stays in EvangelistAction phase
    }
  }

  // If the removed player was on a proposed team that hasn't been voted on yet,
  // and we're in TeamProposal, cancel and restart proposal
  if (room.phase === GamePhase.TeamProposal && currentMission) {
    const lastProposal = currentMission.proposals[currentMission.currentProposalIndex];
    if (lastProposal && !lastProposal.resolved && lastProposal.memberIds.includes(playerId)) {
      // Remove the invalid proposal
      currentMission.proposals.pop();
      if (currentMission.proposals.length > 0) {
        currentMission.currentProposalIndex = currentMission.proposals.length - 1;
      } else {
        currentMission.currentProposalIndex = 0;
      }
    }
  }

  // Deduplicate affectedPlayerIds
  const uniqueAffected = [...new Set(affectedPlayerIds)].filter(
    id => room.players.some(p => p.id === id)
  );

  return { room, affectedPlayerIds: uniqueAffected };
}

// ---- Game Reset ----

/** Restart the game (keep same room, players go back to lobby) */
export function restartToLobby(room: Room): Room {
  room.phase = GamePhase.Lobby;
  room.missions = [];
  room.currentMissionIndex = 0;
  room.currentLeaderIndex = 0;
  room.consecutiveRejections = 0;
  room.evangelistConversions = [];
  room.evangelistHasActedThisMission = false;
  room.assassinGuessTargetId = null;
  room.assassinGuessesRemaining = 1;
  room.result = null;
  room.firstNightStep = 0;
  room.chatMessages = [];

  // Clear role assignments
  room.players.forEach(p => {
    p.role = undefined;
    p.alignment = undefined;
  });

  return room;
}

// ---- Private Info Helpers ----

/** Get the Babylon player IDs (for knowledge sharing) */
export function getBabylonPlayerIds(room: Room): string[] {
  return room.players
    .filter(p => p.alignment === Alignment.Babylon)
    .map(p => p.id);
}

/** Get the Angel player ID */
export function getAngelPlayerId(room: Room): string | null {
  const angel = room.players.find(p => p.role === Role.Angel);
  return angel?.id ?? null;
}

/** Get the Dark Angel player ID */
export function getDarkAngelPlayerId(room: Room): string | null {
  const darkAngel = room.players.find(p => p.role === Role.DarkAngel);
  return darkAngel?.id ?? null;
}

/** Get Evangelist conversions for the Evangelist */
export function getEvangelistConversions(room: Room): EvangelistConversion[] {
  return room.evangelistConversions;
}

/** Shuffle an array in place (Fisher-Yates) */
export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
