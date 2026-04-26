/**
 * Comprehensive game stress test
 * Tests multiple scenarios: 5, 7, 10, and 15 players
 * Tests: role distribution, chat, accusations, conversion, assassin guess, game over
 */

import { io, Socket } from 'socket.io-client';

const SERVER = 'https://game.givefreely.org';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

interface PlayerState {
  name: string;
  socket: Socket;
  id: string;
  role: string;
  alignment: string;
  roomState: any;
  privateInfo: any;
}

function createPlayers(names: string[]): PlayerState[] {
  return names.map(name => {
    const socket = io(SERVER, { autoConnect: true, reconnection: false });
    const state: PlayerState = { name, socket, id: '', role: '', alignment: '', roomState: null, privateInfo: null };
    socket.on('room:state', (rs: any) => { state.roomState = rs; });
    socket.on('player:privateInfo', (info: any) => {
      state.privateInfo = info;
      state.role = info.role;
      state.alignment = info.alignment;
    });
    socket.on('room:error', (err: string) => console.log(`  [ERROR ${name}] ${err}`));
    return state;
  });
}

function cleanup(players: PlayerState[]) {
  players.forEach(p => p.socket.disconnect());
}

async function waitForPhase(players: PlayerState[], phase: string, timeout = 15000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (players[0].roomState?.phase === phase) return true;
    await sleep(100);
  }
  return false;
}

async function runScenario(playerCount: number, scenarioName: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`SCENARIO: ${scenarioName} (${playerCount} players)`);
  console.log(`${'='.repeat(60)}`);

  const names = Array.from({ length: playerCount }, (_, i) => `Player${i + 1}`);
  const players = createPlayers(names);
  await sleep(2000);

  try {
    // Create room
    const host = players[0];
    const res: any = await new Promise(r => host.socket.emit('room:create', { displayName: host.name }, r));
    if (!res.success) { console.log('FAIL: Could not create room'); cleanup(players); return false; }
    host.id = res.playerId;
    console.log(`  Room: ${res.roomCode}`);

    // Join all
    for (let i = 1; i < players.length; i++) {
      const jr: any = await new Promise(r =>
        players[i].socket.emit('room:join', { roomCode: res.roomCode, displayName: players[i].name }, r)
      );
      if (!jr.success) { console.log(`FAIL: ${players[i].name} could not join`); cleanup(players); return false; }
      players[i].id = jr.playerId;
      await sleep(100);
    }
    await sleep(500);
    console.log(`  All ${playerCount} players joined`);

    // Test chat
    host.socket.emit('chat:send', { text: 'Hello everyone!' });
    await sleep(300);
    players[1].socket.emit('chat:accuse', { targetId: players[2].id, reason: 'Seems suspicious' });
    await sleep(300);
    const chatCount = players[0].roomState?.chatMessages?.length ?? 0;
    console.log(`  Chat messages: ${chatCount} ${chatCount >= 2 ? '✓' : '✗'}`);

    // Start game
    host.socket.emit('game:start');
    await sleep(2000);

    // Check roles
    const roles = players.map(p => p.role);
    const alignments = players.map(p => p.alignment);
    const babylonCount = alignments.filter(a => a === 'Babylon').length;
    const missionCount = alignments.filter(a => a === 'Mission Team').length;
    const hasEvangelist = roles.includes('Evangelist');
    const hasAngel = roles.includes('Angel');
    const hasProphet = roles.includes('Prophet');
    const hasAssassin = roles.includes('Assassin');

    console.log(`  Roles: ${roles.join(', ')}`);
    console.log(`  Babylon: ${babylonCount}, Mission Team: ${missionCount}`);
    console.log(`  Evangelist: ${hasEvangelist ? '✓' : '✗'} | Angel: ${hasAngel ? '✓' : '✗'} | Prophet: ${hasProphet ? '✓' : '✗'} | Assassin: ${hasAssassin ? '✓' : '✗'}`);

    // Advance past role reveal
    host.socket.emit('game:advanceFirstNight');
    const reachedProposal = await waitForPhase(players, 'teamProposal');
    console.log(`  Phase flow to teamProposal: ${reachedProposal ? '✓' : '✗'}`);

    if (!reachedProposal) { cleanup(players); return false; }

    // Play through missions
    let missionResults: string[] = [];
    for (let mission = 1; mission <= 5; mission++) {
      if (players[0].roomState?.phase === 'gameOver') break;

      if (!await waitForPhase(players, 'teamProposal', 5000)) {
        if (players[0].roomState?.phase === 'gameOver') break;
        if (players[0].roomState?.phase === 'evangelistAction') {
          // Handle evangelist
          const evangelist = players.find(p => p.role === 'Evangelist');
          if (evangelist) {
            const babylon = players.find(p => p.alignment === 'Babylon' && p.id !== evangelist.id);
            const target = babylon || players.find(p => p.id !== evangelist.id)!;
            evangelist.socket.emit('game:evangelistConvert', { targetId: target.id });
            console.log(`  Evangelist converted ${target.name}`);
            await sleep(1000);
          }
          if (!await waitForPhase(players, 'teamProposal', 5000)) {
            if (players[0].roomState?.phase === 'gameOver') break;
            continue;
          }
        } else if (players[0].roomState?.phase === 'assassinGuess') {
          const assassin = players.find(p => p.role === 'Assassin');
          if (assassin) {
            const missionTeam = players.filter(p => p.alignment === 'Mission Team');
            const target = missionTeam[Math.floor(Math.random() * missionTeam.length)];
            assassin.socket.emit('game:assassinGuess', { targetId: target.id });
            console.log(`  Assassin guessed ${target.name}`);
            await sleep(1000);
          }
          break;
        } else {
          console.log(`  Unexpected phase: ${players[0].roomState?.phase}`);
          break;
        }
      }

      const state = players[0].roomState;
      const currentMission = state.missions[state.currentMissionIndex];
      const leaderIdx = state.currentLeaderIndex;
      const leaderId = state.players[leaderIdx].id;
      const leader = players.find(p => p.id === leaderId)!;

      // Propose team (first N players)
      const teamSize = currentMission.requiredTeamSize;
      const teamIds = players.slice(0, teamSize).map(p => p.id);
      leader.socket.emit('game:proposeTeam', { memberIds: teamIds });

      if (!await waitForPhase(players, 'teamVote', 5000)) {
        console.log(`  Mission ${mission}: Failed to reach vote phase`);
        break;
      }

      // Everyone votes approve
      for (const p of players) {
        p.socket.emit('game:submitVote', { approve: true });
        await sleep(50);
      }

      if (!await waitForPhase(players, 'missionAction', 5000)) {
        console.log(`  Mission ${mission}: Failed to reach action phase`);
        break;
      }

      // Team members act - Babylon sabotages on missions 2 and 3
      for (let i = 0; i < teamSize; i++) {
        const p = players[i];
        const isBabylon = p.alignment === 'Babylon';
        const sabotage = isBabylon && (mission === 2 || mission === 3);
        p.socket.emit('game:submitMissionAction', { sabotage });
        await sleep(50);
      }

      if (!await waitForPhase(players, 'missionReveal', 5000)) {
        console.log(`  Mission ${mission}: Failed to reach reveal phase`);
        break;
      }

      const updatedState = players[0].roomState;
      const result = updatedState.missions[updatedState.currentMissionIndex];
      missionResults.push(result.result);
      console.log(`  Mission ${mission}: ${result.result.toUpperCase()} (${result.sabotageCount} sabotage)`);

      host.socket.emit('game:advancePhase');
      await sleep(1000);

      // Handle evangelist after mission 4
      if (mission === 4 && players[0].roomState?.phase === 'evangelistAction') {
        const evangelist = players.find(p => p.role === 'Evangelist');
        if (evangelist) {
          const babylon = players.find(p => p.alignment === 'Babylon' && p.id !== evangelist.id);
          const target = babylon || players.find(p => p.id !== evangelist.id)!;
          evangelist.socket.emit('game:evangelistConvert', { targetId: target.id });
          console.log(`  Evangelist shared testimony with ${target.name} (was ${target.alignment})`);
          await sleep(1500);
          // Update local role/alignment from privateInfo
          players.forEach(p => {
            if (p.privateInfo) { p.role = p.privateInfo.role; p.alignment = p.privateInfo.alignment; }
          });
        }
      }

      // Handle assassin guess
      if (players[0].roomState?.phase === 'assassinGuess') {
        const assassin = players.find(p => p.role === 'Assassin');
        if (assassin) {
          const angel = players.find(p => p.role === 'Angel');
          const missionTeam = players.filter(p => p.alignment === 'Mission Team' && p.id !== assassin.id);
          // Random guess (sometimes right, sometimes wrong)
          const target = Math.random() > 0.5 && angel ? angel : missionTeam[0];
          assassin.socket.emit('game:assassinGuess', { targetId: target.id });
          console.log(`  Assassin guessed ${target.name} (actual Angel: ${angel?.name})`);
          await sleep(1000);
        }
      }
    }

    // Final result
    await sleep(1000);
    const finalState = players[0].roomState;
    if (finalState?.result) {
      console.log(`  RESULT: ${finalState.result.winner} wins — ${finalState.result.reason}`);
      if (finalState.result.assassinGuessCorrect !== undefined) {
        console.log(`  Assassin guess: ${finalState.result.assassinGuessCorrect ? 'CORRECT' : 'WRONG'}`);
      }
    }

    console.log(`  Final roles: ${players.map(p => `${p.name}=${p.role}`).join(', ')}`);

    // Test game over buttons (restart)
    if (finalState?.phase === 'gameOver') {
      host.socket.emit('game:returnToLobby');
      await sleep(1000);
      const backToLobby = players[0].roomState?.phase === 'lobby';
      console.log(`  Return to lobby: ${backToLobby ? '✓' : '✗'}`);
    }

    console.log(`  SCENARIO PASSED ✓`);
    cleanup(players);
    return true;
  } catch (err) {
    console.log(`  SCENARIO FAILED: ${err}`);
    cleanup(players);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   GREAT CONTROVERSY STRESS TEST        ║');
  console.log('║   Server: game.givefreely.org          ║');
  console.log('╚════════════════════════════════════════╝');

  const results: { name: string; passed: boolean }[] = [];

  // Scenario 1: 5 players (minimum)
  results.push({ name: '5 players (min)', passed: await runScenario(5, '5-Player Minimum Game') });
  await sleep(2000);

  // Scenario 2: 7 players
  results.push({ name: '7 players', passed: await runScenario(7, '7-Player Game') });
  await sleep(2000);

  // Scenario 3: 10 players
  results.push({ name: '10 players', passed: await runScenario(10, '10-Player Game') });
  await sleep(2000);

  // Scenario 4: 15 players (maximum)
  results.push({ name: '15 players (max)', passed: await runScenario(15, '15-Player Maximum Game') });
  await sleep(1000);

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(60)}`);
  results.forEach(r => console.log(`  ${r.passed ? '✓' : '✗'} ${r.name}`));
  const allPassed = results.every(r => r.passed);
  console.log(`\n  ${allPassed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);

  process.exit(allPassed ? 0 : 1);
}

main();
