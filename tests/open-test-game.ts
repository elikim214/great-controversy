/**
 * Opens 7 Chrome tabs one at a time with delays.
 * Waits for you to join in each tab before opening the next.
 *
 * Run: npx tsx tests/open-test-game.ts
 */

import { execSync } from 'child_process';
import * as readline from 'readline';

const SERVER = 'https://game.givefreely.org';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const wait = (msg: string) => new Promise<void>(r => rl.question(msg, () => r()));

async function run() {
  console.log('\n=== 7-Player Test Setup ===\n');

  // Tab 1 — Host
  console.log('Opening Tab 1 (HOST)...');
  execSync(`open -a "Google Chrome" "${SERVER}"`);
  await wait('→ Create a room in this tab, then press ENTER to open the next tab...\n');

  // Tabs 2-7
  for (let i = 2; i <= 7; i++) {
    console.log(`Opening Tab ${i}...`);
    execSync('sleep 2');
    execSync(`open -a "Google Chrome" "${SERVER}"`);
    if (i < 7) {
      await wait(`→ Join the room in this tab, then press ENTER for the next tab...\n`);
    } else {
      await wait(`→ Join the room in this tab, then press ENTER when done.\n`);
    }
  }

  console.log('\n✓ All 7 tabs ready! Start the game from Tab 1.\n');
  rl.close();
}

run();
