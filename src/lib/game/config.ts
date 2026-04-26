// ============================================================
// Game balance configuration
// All tunable numbers in one place for easy adjustment
// ============================================================

/** App version — update this with every push */
export const APP_VERSION = '2.7.0';

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
 * Mission team sizes indexed by [playerCountBracket][missionNumber-1].
 * Three brackets: 5-7, 8-10, 11-15.
 */
export const MISSION_TEAM_SIZES: Record<string, number[]> = {
  'small': [2, 3, 3, 4, 4],   // 5-7 players
  'medium': [3, 4, 4, 5, 5],  // 8-10 players
  'large': [4, 5, 6, 7, 7],   // 11-15 players
};

/** Get the size bracket key for a given player count */
export function getSizeBracket(playerCount: number): string {
  if (playerCount <= 7) return 'small';
  if (playerCount <= 10) return 'medium';
  return 'large';
}

/** Get mission team sizes for a given player count */
export function getMissionTeamSizes(playerCount: number): number[] {
  return MISSION_TEAM_SIZES[getSizeBracket(playerCount)];
}

/** Total number of missions per game */
export const TOTAL_MISSIONS = 5;

/** Missions needed to win (for either side) */
export const MISSIONS_TO_WIN = 3;

/**
 * Mission 4 requires 2 sabotage cards to fail, but only with 7+ players.
 * At 5-6 players, all missions require just 1 sabotage.
 */
export function getSabotageThreshold(missionNumber: number, playerCount: number): number {
  if (missionNumber === 4 && playerCount >= 7) return 2;
  return 1;
}

/** Max consecutive proposal rejections before Babylon auto-wins the mission */
export const MAX_REJECTIONS = 5;

/** Min and max supported player counts */
export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 15;

/** Room code length */
export const ROOM_CODE_LENGTH = 4;
