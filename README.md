# The Great Controversy: A Last Day ADVENTure Game

A multiplayer hidden-role social deduction game for 5-15 players. The app acts as a fully automated moderator — no human game master needed.

Built with **Next.js**, **React**, **TypeScript**, **Tailwind CSS**, and **Socket.IO**.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` on the host device. Other players join by entering the room code on their own devices at the same URL.

## How to Play

1. **Host** creates a room and shares the 5-character room code
2. **Players** join from their phones/devices using the room code
3. Host starts the game when 5-15 players are in the lobby
4. The app secretly assigns roles and walks everyone through the first-night reveal
5. Players go on 5 missions — propose teams, vote, and complete (or sabotage) each mission

**Good wins** if 3 missions succeed — but the Assassin gets one final shot at identifying the Angel.
**Babylon wins** if 3 missions fail, or the Assassin correctly identifies the Angel.

## Architecture

```
great-controversy/
├── server/                   # Custom server (Next.js + Socket.IO)
│   ├── index.ts              # HTTP server entry point
│   └── socketHandlers.ts     # All Socket.IO event handlers
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx          # Landing page (create/join)
│   │   ├── room/[code]/      # Player game room
│   │   └── display/[code]/   # Public display (no secrets)
│   ├── components/           # React UI components
│   ├── context/              # GameContext (socket + state)
│   └── lib/
│       ├── game/             # Pure game engine (no UI coupling)
│       │   ├── types.ts      # All TypeScript types and enums
│       │   ├── config.ts     # Tunable balance numbers
│       │   ├── engine.ts     # Core game logic
│       │   ├── roleAssignment.ts
│       │   ├── missionLocations.ts  # 30 seed destinations
│       │   └── validators.ts # Input validation
│       └── socket/
│           └── client.ts     # Singleton socket client
└── tests/
    └── engine.test.ts        # Game engine unit tests
```

### Key Design Decisions

- **Custom server**: Next.js App Router + Socket.IO on the same port via a custom HTTP server (using `tsx`). This avoids CORS issues and WebSocket proxy complexity.
- **Server-authoritative state**: All game logic runs on the server. Clients only send actions and receive sanitized state. No private info leaks.
- **Pure game engine**: `src/lib/game/` contains zero React/Next.js imports. Rules can be tested independently.
- **Session persistence**: Players store `roomCode + playerId` in localStorage for automatic reconnection.

## Roles

### Good Team (Mission Team)

| Role | Ability |
|------|---------|
| **Missionary** | Vanilla good. Support the mission. |
| **Evangelist** | After each mission, may inspect one player to learn alignment. |
| **Angel** | Knows all Babylon agents from the start. |
| **Prophet** | Knows who the Angel is. |

### Babylon Team

| Role | Ability |
|------|---------|
| **Agent of Babylon** | Knows other Babylon. May sabotage missions. |
| **Assassin** | If good wins by missions, gets one guess at identifying the Angel. |
| **False Prophet** | *(Optional)* Appears good when inspected by the Evangelist. |

## Balance Tables

### Team Distribution

| Players | Good | Babylon |
|---------|------|---------|
| 5 | 3 | 2 |
| 6 | 4 | 2 |
| 7 | 4 | 3 |
| 8 | 5 | 3 |
| 9 | 6 | 3 |
| 10 | 6 | 4 |
| 11 | 7 | 4 |
| 12 | 8 | 4 |
| 13 | 8 | 5 |
| 14 | 9 | 5 |
| 15 | 10 | 5 |

### Mission Team Sizes

| Mission | 5-7 players | 8-10 players | 11-15 players |
|---------|-------------|--------------|---------------|
| 1 | 2 | 3 | 4 |
| 2 | 3 | 4 | 5 |
| 3 | 3 | 4 | 6 |
| 4 | 4 | 5 | 7 |
| 5 | 4 | 5 | 7 |

**Mission 4** requires 2 sabotage cards to fail (all others require 1).

## Tweaking Balance

All tunable numbers are in `src/lib/game/config.ts`:
- `BABYLON_COUNT` — evil player count per player total
- `MISSION_TEAM_SIZES` — team size per mission per bracket
- `getSabotageThreshold()` — sabotages required to fail
- `MAX_REJECTIONS` — rejected proposals before auto-fail (default: 5)

Role assignment logic is in `src/lib/game/roleAssignment.ts`.

## Theme Customization

- Colors: `src/app/globals.css` (CSS custom properties)
- Mission locations: `src/lib/game/missionLocations.ts`
- Phase messages: `server/socketHandlers.ts` (`getFirstNightMessage`)

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page — create or join a room |
| `/room/[code]` | Player view — adapts to host/player role and game phase |
| `/display/[code]` | Public display — shows only public info (for a shared screen) |

## Scripts

```bash
npm run dev      # Start dev server (Next.js + Socket.IO)
npm run build    # Build for production
npm run start    # Start production server
npm test         # Run game engine tests
npm run lint     # Run ESLint
```

## Testing Locally

Open multiple browser tabs to `http://localhost:3000`:
1. Tab 1: Create a room (you're the host)
2. Tabs 2-6: Join with the room code (different display names)
3. Start the game from the host tab

## Edge Cases Handled

- Duplicate display names rejected
- Player count validated (5-15)
- Good players cannot sabotage
- Double vote/action submission blocked
- Reconnection via localStorage session
- Host disconnect doesn't crash (players wait)
- Empty rooms cleaned up after 5 minutes
- Illegal team sizes rejected
- Evangelist double-inspect blocked per mission
- Assassin guess only in correct phase
