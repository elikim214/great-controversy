// ============================================================
// Role assignment logic
// Distributes roles based on player count and config
// ============================================================

import { Role, Alignment, ROLE_ALIGNMENT, GameConfig } from './types';
import { BABYLON_COUNT } from './config';

interface RoleAssignment {
  role: Role;
  alignment: Alignment;
}

/**
 * Assign roles to players.
 * Returns an array of RoleAssignment in random order (to be mapped to shuffled players).
 *
 * Rules by player count:
 * - 5-6 players: No Evangelist, no Dark Angel. Good = [Angel, Prophet, ...Missionaries]. Babylon = [Assassin, ...Agents]
 * - 7-9 players: Evangelist (inspect only), Dark Angel. Good = [Evangelist, Angel, Prophet, ...Missionaries]. Babylon = [Assassin, DarkAngel, ...Agents]
 * - 10+ players: Evangelist (convert), Dark Angel. Good = [Evangelist, Angel, Prophet, ...Missionaries]. Babylon = [Assassin, DarkAngel, ...Agents]
 */
export function assignRoles(playerCount: number, config: GameConfig): RoleAssignment[] {
  const babylonCount = BABYLON_COUNT[playerCount];
  if (babylonCount === undefined) {
    throw new Error(`Unsupported player count: ${playerCount}`);
  }
  const goodCount = playerCount - babylonCount;

  // Build Babylon roles
  const babylonRoles: Role[] = [Role.Assassin];

  // Dark Angel at 7+ players (when there are 3+ Babylon slots)
  if (playerCount >= 7) {
    babylonRoles.push(Role.DarkAngel);
  }

  // Fill remaining Babylon with Agents of Babylon
  while (babylonRoles.length < babylonCount) {
    babylonRoles.push(Role.AgentOfBabylon);
  }

  // Build Good roles — required special roles first
  const goodRoles: Role[] = [Role.Angel, Role.Prophet];

  // Evangelist at 7+ players only
  if (playerCount >= 7) {
    goodRoles.push(Role.Evangelist);
  }

  // Fill remaining Good with Missionaries
  while (goodRoles.length < goodCount) {
    goodRoles.push(Role.Missionary);
  }

  // Combine and shuffle
  const allRoles: RoleAssignment[] = [
    ...goodRoles.map(role => ({ role, alignment: ROLE_ALIGNMENT[role] })),
    ...babylonRoles.map(role => ({ role, alignment: ROLE_ALIGNMENT[role] })),
  ];

  // Fisher-Yates shuffle
  for (let i = allRoles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allRoles[i], allRoles[j]] = [allRoles[j], allRoles[i]];
  }

  return allRoles;
}
