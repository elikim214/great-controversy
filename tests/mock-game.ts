/**
 * Mock 5-player game test
 * Connects 5 socket.io clients and plays through a full game automatically.
 * Run: npx tsx tests/mock-game.ts
 */

import { io, Socket } from 'socket.io-client';

const SERVER = 'http://localhost:3001';
const PLAYERS = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'];
const DELAY = 800; // ms between actions for readability

interface PlayerState {
  name: string;
  socket: Socket;
  id: string;
  role?: string;
  alignment?: string;
  roomCode?: string;
  roomState?: any;
  privateInfo?: any;
}

const players: PlayerState[] = [];

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(msg: string) {
  console.log(`\x1b[36m[Game]\x1b[0m ${msg}`);
}

function playerLog(name: string, msg: string) {
  console.log(`\x1b[33m[${name}]\x1b[0m ${msg}`);
}

function setupPlayer(name: string): PlayerState {
  const socket = io(SERVER, { autoConnect: true, reconnection: false });
  const state: PlayerState = { name, socket, id: '' };

  socket.on('room:state', (roomState) => {
    state.roomState = roomState;
  });

  socket.on('player:privateInfo', (info) => {
    state.privateInfo = info;
    state.role = info.role;
    state.alignment = info.alignment;
    playerLog(name, `Role: ${info.role} (${info.alignment})`);
  });

  socket.on('room:error', (err) => {
    playerLog(name, `ERROR: ${err}`);
  });

  socket.on('connect', () => {
    playerLog(name, 'Connected');
  });

  return state;
}

async function waitForPhase(phase: string, timeout = 10000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (players[0].roomState?.phase === phase) return;
    await sleep(100);
  }
  throw new Error(`Timeout waiting for phase: ${phase} (current: ${players[0].roomState?.phase})`);
}

async function waitForState(check: () => boolean, label: string, timeout = 10000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (check()) return;
    await sleep(100);
  }
  throw new Error(`Timeout waiting for: ${label}`);
}

async function run() {
  log('Starting mock game with 5 players...\n');

  // Create all player connections
  for (const name of PLAYERS) {
    players.push(setupPlayer(name));
  }
  await sleep(1000);

  // Player 0 (Alice) creates the room
  const host = players[0];
  const createResult = await new Promise<any>((resolve) => {
    host.socket.emit('room:create', { displayName: host.name }, resolve);
  });
  host.id = createResult.playerId;
  host.roomCode = createResult.roomCode;
  log(`Room created: ${createResult.roomCode}`);
  await sleep(DELAY);

  // Other players join
  for (let i = 1; i < players.length; i++) {
    const p = players[i];
    const joinResult = await new Promise<any>((resolve) => {
      p.socket.emit('room:join', { roomCode: host.roomCode!, displayName: p.name }, resolve);
    });
    p.id = joinResult.playerId;
    p.roomCode = host.roomCode;
    playerLog(p.name, `Joined room ${host.roomCode}`);
    await sleep(300);
  }

  await sleep(DELAY);
  log(`All ${players.length} players in lobby\n`);

  // Host starts game
  log('Host starting game...');
  host.socket.emit('game:start');
  await waitForPhase('roleReveal');
  await sleep(DELAY);

  // Print roles
  log('\n=== ROLES ===');
  for (const p of players) {
    playerLog(p.name, `${p.role} (${p.alignment})`);
  }
  log('');

  // Host advances past role reveal
  log('Host advancing past role reveal...');
  host.socket.emit('game:advanceFirstNight');
  await waitForPhase('teamProposal');
  await sleep(DELAY);

  // Play through missions
  for (let mission = 1; mission <= 5; mission++) {
    log(`\n${'='.repeat(40)}`);
    log(`MISSION ${mission}`);
    log(`${'='.repeat(40)}`);

    const state = players[0].roomState;
    const currentMission = state.missions[state.currentMissionIndex];
    log(`Location: ${currentMission.location.name} (${currentMission.location.region})`);
    log(`Team size needed: ${currentMission.requiredTeamSize}`);
    log(`Difficulty: ${currentMission.location.difficulty}`);

    // Wait for team proposal phase
    await waitForPhase('teamProposal');
    await sleep(DELAY);

    // Find the leader
    const leaderIndex = players[0].roomState.currentLeaderIndex;
    const leaderClientId = players[0].roomState.players[leaderIndex].id;
    const leader = players.find(p => p.id === leaderClientId)!;
    log(`Team leader: ${leader.name}`);

    // Leader proposes team (pick first N players)
    const teamSize = currentMission.requiredTeamSize;
    const teamIds = players.slice(0, teamSize).map(p => p.id);
    const teamNames = players.slice(0, teamSize).map(p => p.name);
    log(`Proposing team: ${teamNames.join(', ')}`);

    leader.socket.emit('game:proposeTeam', { memberIds: teamIds });
    await waitForPhase('teamVote');
    await sleep(DELAY);

    // Everyone votes approve
    log('All players voting APPROVE...');
    for (const p of players) {
      p.socket.emit('game:submitVote', { approve: true });
      await sleep(100);
    }
    await waitForPhase('missionAction');
    await sleep(DELAY);

    // Team members submit actions
    log('Team members performing mission actions...');
    for (let i = 0; i < teamSize; i++) {
      const p = players[i];
      const isBabylon = p.alignment === 'Babylon';
      // Babylon always sabotages on missions 2 and 3, never on 1 and 4 — forces game to reach mission 4 at 2-2
      const sabotage = isBabylon && (mission === 2 || mission === 3);
      playerLog(p.name, sabotage ? 'SABOTAGING!' : 'Supporting mission');
      p.socket.emit('game:submitMissionAction', { sabotage });
      await sleep(200);
    }

    await waitForPhase('missionReveal');
    await sleep(DELAY);

    // Check result
    const updatedState = players[0].roomState;
    const missionResult = updatedState.missions[updatedState.currentMissionIndex];
    log(`Mission result: ${missionResult.result.toUpperCase()} (${missionResult.sabotageCount} sabotage(s))`);

    // Host advances
    host.socket.emit('game:advancePhase');
    await sleep(DELAY);

    // Check for evangelist action after mission 4
    if (mission === 4 && players[0].roomState?.phase === 'evangelistAction') {
      log('\n--- Evangelist Action ---');
      const evangelist = players.find(p => p.role === 'Evangelist');
      if (evangelist) {
        // Target a Babylon player to test conversion
        const babylonTarget = players.find(p => p.alignment === 'Babylon' && p.id !== evangelist.id);
        const target = babylonTarget || players.find(p => p.id !== evangelist.id)!;
        playerLog(evangelist.name, `Evangelizing ${target.name} (${target.alignment})...`);

        evangelist.socket.on('evangelist:conversionResult', (result) => {
          playerLog(evangelist.name, `${result.targetName}: ${result.success ? 'Converted!' : 'Already a believer'}`);
        });
        evangelist.socket.emit('game:evangelistConvert', { targetId: target.id });
        await sleep(DELAY);
      }
    }

    // Check for assassin guess
    if (players[0].roomState?.phase === 'assassinGuess') {
      log('\n--- Assassin Guess ---');
      const assassin = players.find(p => p.role === 'Assassin');
      if (assassin) {
        const missionaries = players.filter(p => p.alignment === 'Mission Team');
        const target = missionaries[Math.floor(Math.random() * missionaries.length)];
        playerLog(assassin.name, `Guessing ${target.name} is the Angel...`);
        assassin.socket.emit('game:assassinGuess', { targetId: target.id });
        await sleep(DELAY);
      }
    }

    // Check for game over
    if (players[0].roomState?.phase === 'gameOver') {
      break;
    }

    // Wait briefly for next phase
    await sleep(500);
  }

  // Final results
  await sleep(1000);
  const finalState = players[0].roomState;
  if (finalState?.result) {
    log(`\n${'='.repeat(40)}`);
    log(`GAME OVER`);
    log(`${'='.repeat(40)}`);
    log(`Winner: ${finalState.result.winner}`);
    log(`Reason: ${finalState.result.reason}`);
    log(`Missions: ${finalState.result.missionSuccesses} success / ${finalState.result.missionFailures} failure`);
    if (finalState.result.assassinGuessCorrect !== undefined) {
      log(`Assassin guess: ${finalState.result.assassinGuessCorrect ? 'CORRECT' : 'WRONG'}`);
    }
  }

  log('\n=== FINAL ROLES ===');
  for (const p of players) {
    playerLog(p.name, `${p.role} (${p.alignment})`);
  }

  // Cleanup
  log('\nDisconnecting...');
  for (const p of players) {
    p.socket.disconnect();
  }
  process.exit(0);
}

run().catch(err => {
  console.error('Test failed:', err);
  for (const p of players) {
    p.socket?.disconnect();
  }
  process.exit(1);
});
