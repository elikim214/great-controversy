// ============================================================
// Game balance configuration
// All tunable numbers in one place for easy adjustment
// ============================================================

/** App version — update this with every push */
export const APP_VERSION = '3.1.0';

/** Maximum bots per game (leaves room for at least 1 human) */
export const MAX_BOTS = 14;

/** Free tier player limit — 7+ requires subscription */
export const FREE_PLAYER_LIMIT = 6;

/** Grace period before host can kick a disconnected player (ms) */
export const DISCONNECT_GRACE_PERIOD = 30000;

/** Babylon player count by total player count */
export const BABYLON_COUNT: Record<number, number> = {
  5: 2,
  6: 2,
  7: 3,
  8: 3,
  9: 3,
  10: 4,
  11: 4,
  12: 4,
  13: 5,
  14: 5,
  15: 5,
};

/**
 * Mission team sizes per player count.
 * Based on Avalon's official sizes (5-10) extended logically for 11-15.
 * Pattern: missions 1 & 3 are smaller, 4 & 5 are larger but not guaranteed to include all evil.
 *
 * Avalon official:
 *   5p: 2,3,2,3,3  |  6p: 2,3,4,3,4  |  7p: 2,3,3,4,4
 *   8p: 3,4,4,5,5  |  9p: 3,4,4,5,5  |  10p: 3,4,4,5,5
 */
export const MISSION_TEAM_SIZES: Record<number, number[]> = {
  5:  [2, 3, 2, 3, 3],
  6:  [2, 3, 4, 3, 4],
  7:  [2, 3, 3, 4, 4],
  8:  [3, 4, 4, 5, 5],
  9:  [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
  11: [3, 5, 4, 5, 6],
  12: [4, 5, 5, 6, 6],
  13: [4, 5, 5, 6, 7],
  14: [4, 6, 5, 7, 7],
  15: [5, 6, 6, 7, 8],
};

/** Get mission team sizes for a given player count */
export function getMissionTeamSizes(playerCount: number): number[] {
  return MISSION_TEAM_SIZES[playerCount] || MISSION_TEAM_SIZES[15];
}

/** Total number of missions per game */
export const TOTAL_MISSIONS = 5;

/** Missions needed to win (for either side) */
export const MISSIONS_TO_WIN = 3;

/**
 * Mission 4 always requires 2 sabotage cards to fail (all player counts).
 * All other missions require 1 sabotage.
 * This matches Avalon's rules and works with the updated team sizes.
 */
export function getSabotageThreshold(missionNumber: number, _playerCount: number): number {
  if (missionNumber === 4) return 2;
  return 1;
}

/** Max consecutive proposal rejections before Babylon auto-wins the mission */
export const MAX_REJECTIONS = 5;

/** Min and max supported player counts */
export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 15;

/** Room code length */
export const ROOM_CODE_LENGTH = 4;
