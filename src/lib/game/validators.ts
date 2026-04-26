// ============================================================
// Input validation for game actions
// All validation at system boundary — pure functions
// ============================================================

import { Room, GamePhase, Role, Alignment, ROLE_ALIGNMENT } from './types';
import { MIN_PLAYERS, MAX_PLAYERS } from './config';

/** Check if a room can start the game */
export function canStartGame(room: Room): { valid: boolean; error?: string } {
  if (room.phase !== GamePhase.Lobby) {
    return { valid: false, error: 'Game already in progress' };
  }
  const count = room.players.length;
  if (count < MIN_PLAYERS) {
    return { valid: false, error: `Need at least ${MIN_PLAYERS} players (currently ${count})` };
  }
  if (count > MAX_PLAYERS) {
    return { valid: false, error: `Maximum ${MAX_PLAYERS} players (currently ${count})` };
  }
  return { valid: true };
}

/** Check if a player can join a room */
export function canJoinRoom(room: Room, displayName: string): { valid: boolean; error?: string } {
  if (room.phase !== GamePhase.Lobby) {
    return { valid: false, error: 'Game already in progress' };
  }
  if (room.players.length >= MAX_PLAYERS) {
    return { valid: false, error: 'Room is full' };
  }
  const nameTaken = room.players.some(
    p => p.displayName.toLowerCase() === displayName.toLowerCase()
  );
  if (nameTaken) {
    return { valid: false, error: 'Display name already taken' };
  }
  if (!displayName.trim()) {
    return { valid: false, error: 'Display name cannot be empty' };
  }
  if (displayName.length > 20) {
    return { valid: false, error: 'Display name must be 20 characters or less' };
  }
  return { valid: true };
}

/** Validate a team proposal */
export function validateTeamProposal(
  room: Room,
  proposerId: string,
  memberIds: string[]
): { valid: boolean; error?: string } {
  const mission = room.missions[room.currentMissionIndex];
  if (!mission) {
    return { valid: false, error: 'No active mission' };
  }
  if (room.phase !== GamePhase.TeamProposal) {
    return { valid: false, error: 'Not in team proposal phase' };
  }

  // Check proposer is current leader
  const leader = room.players[room.currentLeaderIndex];
  if (!leader || leader.id !== proposerId) {
    return { valid: false, error: 'Only the current leader can propose a team' };
  }

  // Check team size
  if (memberIds.length !== mission.requiredTeamSize) {
    return { valid: false, error: `Team must have exactly ${mission.requiredTeamSize} members` };
  }

  // Check all members are valid players
  const playerIds = new Set(room.players.map(p => p.id));
  for (const id of memberIds) {
    if (!playerIds.has(id)) {
      return { valid: false, error: `Invalid player ID in team: ${id}` };
    }
  }

  // Check no duplicates
  if (new Set(memberIds).size !== memberIds.length) {
    return { valid: false, error: 'Duplicate players in team proposal' };
  }

  return { valid: true };
}

/** Validate a mission action */
export function validateMissionAction(
  room: Room,
  playerId: string,
  sabotage: boolean
): { valid: boolean; error?: string } {
  if (room.phase !== GamePhase.MissionAction) {
    return { valid: false, error: 'Not in mission action phase' };
  }

  const mission = room.missions[room.currentMissionIndex];
  if (!mission) {
    return { valid: false, error: 'No active mission' };
  }

  // Check player is on the team
  if (!mission.team.includes(playerId)) {
    return { valid: false, error: 'You are not on this mission team' };
  }

  // Check player hasn't already submitted
  if (mission.actions.some(a => a.playerId === playerId)) {
    return { valid: false, error: 'You have already submitted your action' };
  }

  // Good players cannot sabotage
  if (sabotage) {
    const player = room.players.find(p => p.id === playerId);
    if (player?.alignment === Alignment.MissionTeam) {
      return { valid: false, error: 'Good team members cannot sabotage' };
    }
  }

  return { valid: true };
}

/** Validate a vote submission */
export function validateVote(
  room: Room,
  playerId: string
): { valid: boolean; error?: string } {
  if (room.phase !== GamePhase.TeamVote) {
    return { valid: false, error: 'Not in voting phase' };
  }

  const mission = room.missions[room.currentMissionIndex];
  const proposal = mission?.proposals[mission.currentProposalIndex];
  if (!proposal) {
    return { valid: false, error: 'No active proposal' };
  }

  if (proposal.votes[playerId] !== undefined) {
    return { valid: false, error: 'You have already voted' };
  }

  return { valid: true };
}

/** Validate Evangelist conversion */
export function validateEvangelistConvert(
  room: Room,
  evangelistId: string,
  targetId: string
): { valid: boolean; error?: string } {
  if (room.phase !== GamePhase.EvangelistAction) {
    return { valid: false, error: 'Not in Evangelist action phase' };
  }

  const evangelist = room.players.find(p => p.id === evangelistId);
  if (!evangelist || evangelist.role !== Role.Evangelist) {
    return { valid: false, error: 'Only the Evangelist can evangelize' };
  }

  if (room.evangelistHasActedThisMission) {
    return { valid: false, error: 'Evangelist has already acted this mission' };
  }

  // Evangelist can only convert during mission 4
  const currentMission = room.missions[room.currentMissionIndex];
  if (!currentMission || currentMission.missionNumber !== 4) {
    return { valid: false, error: 'Evangelist can only evangelize during mission 4' };
  }

  if (targetId === evangelistId) {
    return { valid: false, error: 'Cannot evangelize yourself' };
  }

  const target = room.players.find(p => p.id === targetId);
  if (!target) {
    return { valid: false, error: 'Invalid target player' };
  }

  return { valid: true };
}

/** Validate Assassin guess */
export function validateAssassinGuess(
  room: Room,
  assassinId: string,
  targetId: string
): { valid: boolean; error?: string } {
  if (room.phase !== GamePhase.AssassinGuess) {
    return { valid: false, error: 'Not in Assassin guess phase' };
  }

  const assassin = room.players.find(p => p.id === assassinId);
  if (!assassin || assassin.role !== Role.Assassin) {
    return { valid: false, error: 'Only the Assassin can guess' };
  }

  const target = room.players.find(p => p.id === targetId);
  if (!target) {
    return { valid: false, error: 'Invalid target player' };
  }

  return { valid: true };
}
