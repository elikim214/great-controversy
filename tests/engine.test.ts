// ============================================================
// Game engine unit tests
// Validates core rules, role assignment, mission logic
// ============================================================

import {
  createRoom,
  addPlayer,
  startGame,
  advanceFirstNight,
  proposeTeam,
  submitVote,
  resolveVote,
  submitMissionAction,
  resolveMission,
  afterMissionReveal,
  evangelistConvert,
  assassinGuess,
  checkWinCondition,
  restartToLobby,
  getBabylonPlayerIds,
  getAngelPlayerId,
} from '../src/lib/game/engine';
import { assignRoles } from '../src/lib/game/roleAssignment';
import { GamePhase, Role, Alignment, Room } from '../src/lib/game/types';
import { BABYLON_COUNT, getMissionTeamSizes, getSabotageThreshold, MAX_REJECTIONS } from '../src/lib/game/config';
import { MISSION_LOCATIONS, pickMissionLocations } from '../src/lib/game/missionLocations';

// ---- Room Creation ----

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
  } catch (e: any) {
    console.error(`  FAIL: ${name} — ${e.message}`);
    process.exitCode = 1;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function assertEqual<T>(actual: T, expected: T, msg: string) {
  if (actual !== expected) throw new Error(`${msg}: expected ${expected}, got ${actual}`);
}

console.log('\n=== Game Engine Tests ===\n');

// -- Room Tests --
console.log('Room Management:');

test('createRoom creates a room with host', () => {
  const { room, hostId } = createRoom('Alice', 'socket-1');
  assert(room.code.length === 5, 'Room code should be 5 chars');
  assertEqual(room.players.length, 1, 'Should have 1 player');
  assertEqual(room.players[0].displayName, 'Alice', 'Host name');
  assert(room.players[0].isHost, 'Should be host');
  assertEqual(room.phase, GamePhase.Lobby, 'Phase should be lobby');
});

test('addPlayer adds a player', () => {
  const { room } = createRoom('Alice', 'socket-1');
  const { playerId } = addPlayer(room, 'Bob', 'socket-2');
  assertEqual(room.players.length, 2, 'Should have 2 players');
  assertEqual(room.players[1].displayName, 'Bob', 'Player name');
  assert(!room.players[1].isHost, 'Should not be host');
});

// -- Role Assignment Tests --
console.log('\nRole Assignment:');

test('assignRoles distributes correct count for all player counts', () => {
  for (let count = 5; count <= 15; count++) {
    const roles = assignRoles(count, {});
    assertEqual(roles.length, count, `Should assign ${count} roles for ${count} players`);

    const babylonCount = roles.filter(r => r.alignment === Alignment.Babylon).length;
    assertEqual(babylonCount, BABYLON_COUNT[count], `Babylon count for ${count} players`);

    // Assassin always included
    const hasAssassin = roles.some(r => r.role === Role.Assassin);
    assert(hasAssassin, `Should always include Assassin for ${count} players`);

    // Required good roles
    const hasEvangelist = roles.some(r => r.role === Role.Evangelist);
    const hasAngel = roles.some(r => r.role === Role.Angel);
    const hasProphet = roles.some(r => r.role === Role.Prophet);
    assert(hasEvangelist, `Should have Evangelist for ${count} players`);
    assert(hasAngel, `Should have Angel for ${count} players`);
    assert(hasProphet, `Should have Prophet for ${count} players`);
  }
});

// -- Config Tests --
console.log('\nConfig:');

test('getMissionTeamSizes returns correct sizes', () => {
  const small = getMissionTeamSizes(5);
  assert(JSON.stringify(small) === JSON.stringify([2, 3, 3, 4, 4]), 'Small bracket');

  const medium = getMissionTeamSizes(8);
  assert(JSON.stringify(medium) === JSON.stringify([3, 4, 4, 5, 5]), 'Medium bracket');

  const large = getMissionTeamSizes(12);
  assert(JSON.stringify(large) === JSON.stringify([4, 5, 6, 7, 7]), 'Large bracket');
});

test('getSabotageThreshold returns 2 only for mission 4', () => {
  assertEqual(getSabotageThreshold(1), 1, 'Mission 1');
  assertEqual(getSabotageThreshold(2), 1, 'Mission 2');
  assertEqual(getSabotageThreshold(3), 1, 'Mission 3');
  assertEqual(getSabotageThreshold(4), 2, 'Mission 4');
  assertEqual(getSabotageThreshold(5), 1, 'Mission 5');
});

// -- Mission Location Tests --
console.log('\nMission Locations:');

test('has at least 25 mission locations', () => {
  assert(MISSION_LOCATIONS.length >= 25, `Should have 25+ locations, has ${MISSION_LOCATIONS.length}`);
});

test('pickMissionLocations returns requested count', () => {
  const picks = pickMissionLocations(5);
  assertEqual(picks.length, 5, 'Should pick 5');
});

// -- Full Game Flow --
console.log('\nGame Flow:');

function createTestRoom(playerCount: number): Room {
  const { room } = createRoom('Host', 'socket-0');
  for (let i = 1; i < playerCount; i++) {
    addPlayer(room, `Player${i}`, `socket-${i}`);
  }
  return room;
}

test('startGame assigns roles and creates missions', () => {
  const room = createTestRoom(5);
  startGame(room);
  assertEqual(room.phase, GamePhase.RoleReveal, 'Phase after start');
  assertEqual(room.missions.length, 5, 'Should create 5 missions');
  room.players.forEach(p => {
    assert(p.role !== undefined, `${p.displayName} should have a role`);
    assert(p.alignment !== undefined, `${p.displayName} should have an alignment`);
  });
});

test('advanceFirstNight progresses through steps', () => {
  const room = createTestRoom(5);
  startGame(room);

  advanceFirstNight(room); // step 1
  assertEqual(room.phase, GamePhase.FirstNight, 'After step 1');

  advanceFirstNight(room); // step 2
  assertEqual(room.phase, GamePhase.FirstNight, 'After step 2');

  advanceFirstNight(room); // step 3
  assertEqual(room.phase, GamePhase.FirstNight, 'After step 3');

  advanceFirstNight(room); // step 4 — transitions to TeamProposal
  assertEqual(room.phase, GamePhase.TeamProposal, 'After step 4');
});

test('team proposal and voting flow', () => {
  const room = createTestRoom(5);
  startGame(room);
  for (let i = 0; i < 4; i++) advanceFirstNight(room);

  assertEqual(room.phase, GamePhase.TeamProposal, 'Should be in proposal phase');

  const mission = room.missions[0];
  const teamIds = room.players.slice(0, mission.requiredTeamSize).map(p => p.id);

  proposeTeam(room, teamIds);
  assertEqual(room.phase, GamePhase.TeamVote, 'Should be in vote phase');

  // All players approve
  for (const p of room.players) {
    submitVote(room, p.id, true);
  }
  resolveVote(room);
  assertEqual(room.phase, GamePhase.MissionAction, 'Should be in mission action');
});

test('mission success and failure logic', () => {
  const room = createTestRoom(5);
  startGame(room);
  for (let i = 0; i < 4; i++) advanceFirstNight(room);

  const mission = room.missions[0];
  const teamIds = room.players.slice(0, mission.requiredTeamSize).map(p => p.id);
  proposeTeam(room, teamIds);
  for (const p of room.players) submitVote(room, p.id, true);
  resolveVote(room);

  // All support (no sabotage)
  for (const id of teamIds) {
    submitMissionAction(room, id, false);
  }
  resolveMission(room);
  assertEqual(room.phase, GamePhase.MissionReveal, 'Should show result');
  assertEqual(mission.result, 'success', 'Should be success');
  assertEqual(mission.sabotageCount, 0, 'Zero sabotages');
});

test('5 rejected proposals auto-fails mission', () => {
  const room = createTestRoom(5);
  startGame(room);
  for (let i = 0; i < 4; i++) advanceFirstNight(room);

  const mission = room.missions[0];

  // Reject 5 proposals
  for (let attempt = 0; attempt < MAX_REJECTIONS; attempt++) {
    const teamIds = room.players.slice(0, mission.requiredTeamSize).map(p => p.id);
    proposeTeam(room, teamIds);
    for (const p of room.players) submitVote(room, p.id, false);
    resolveVote(room);
  }

  // Mission should be auto-failed
  assertEqual(mission.result, 'failure', 'Mission auto-failed');
});

test('knowledge helpers return correct data', () => {
  const room = createTestRoom(7);
  startGame(room);

  const babylonIds = getBabylonPlayerIds(room);
  assertEqual(babylonIds.length, BABYLON_COUNT[7], 'Babylon count for 7 players');

  const angelId = getAngelPlayerId(room);
  const angel = room.players.find(p => p.id === angelId);
  assertEqual(angel?.role, Role.Angel, 'Angel role check');
});

test('restartToLobby clears game state', () => {
  const room = createTestRoom(5);
  startGame(room);
  restartToLobby(room);

  assertEqual(room.phase, GamePhase.Lobby, 'Back to lobby');
  assertEqual(room.missions.length, 0, 'Missions cleared');
  room.players.forEach(p => {
    assertEqual(p.role, undefined, 'Roles cleared');
  });
});

console.log('\n=== All Tests Complete ===\n');
