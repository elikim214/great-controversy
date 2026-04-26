# Tier 1 Visual Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 high-impact visual upgrades — mission map, squad lineup, sabotage animation, score banner — to enhance the cinematic feel of the game.

**Architecture:** All upgrades are frontend-only (React components + CSS). No server changes. MissionMap is a new component; the other 3 are enhancements to existing components. All animations use GPU-composited properties (transform/opacity) and respect prefers-reduced-motion.

**Tech Stack:** Next.js 16, React, TypeScript, Tailwind CSS, inline SVG

---

## File Structure

| File | Role |
|------|------|
| `src/components/MissionMap.tsx` | NEW — SVG world map with animated trail |
| `src/components/MissionTracker.tsx` | MODIFY — Add score banner above dots |
| `src/components/GameRoom.tsx` | MODIFY — Integrate MissionMap, add squad lineup, add sabotage overlay |
| `src/lib/game/missionLocations.ts` | MODIFY — Add lat/lng to each location |
| `src/lib/game/types.ts` | MODIFY — Add lat/lng fields to MissionLocation interface |
| `src/app/globals.css` | MODIFY — Add sabotage, shake, pulse keyframes + squad animations |

---

### Task 1: Add Coordinates to MissionLocation Type

**Files:**
- Modify: `src/lib/game/types.ts:78-92`

- [ ] **Step 1: Add lat/lng to MissionLocation interface**

Open `src/lib/game/types.ts` and add two fields to the `MissionLocation` interface after the `callToAction` field (line 91):

```typescript
export interface MissionLocation {
  id: string;
  name: string;
  region: string;
  flavorText: string;
  difficulty: 'Twilight' | 'Darkness' | 'Deep Darkness' | 'Unreached' | 'Forgotten';
  image: string;
  image2: string;
  beliefSystem: string;
  whyHardToReach: string;
  history: string;
  population: string;
  callToAction: string;
  lat: number;  // approximate latitude for map positioning
  lng: number;  // approximate longitude for map positioning
}
```

- [ ] **Step 2: Verify build still compiles (will fail until locations updated)**

Run: `cd /Users/eli/Repo1/great-controversy && npx tsc --noEmit 2>&1 | head -5`
Expected: Errors about missing `lat`/`lng` in missionLocations.ts (this is fine — Task 2 fixes it)

- [ ] **Step 3: Commit**

```bash
cd /Users/eli/Repo1/great-controversy
git add src/lib/game/types.ts
git commit -m "feat: add lat/lng fields to MissionLocation type for map positioning"
```

---

### Task 2: Add Coordinates to All 60 Locations

**Files:**
- Modify: `src/lib/game/missionLocations.ts`

- [ ] **Step 1: Add lat/lng to every location entry**

Each location needs approximate coordinates for its region. Add `lat` and `lng` fields to each object. Here are the coordinates to use, grouped by region:

| Region | Approximate lat | Approximate lng |
|--------|----------------|----------------|
| Central Asia | 41 | 65 |
| South Asia | 23 | 80 |
| East Asia | 35 | 110 |
| Southeast Asia | 5 | 108 |
| Middle East | 30 | 42 |
| Middle East / North Africa | 28 | 35 |
| North Africa | 28 | 8 |
| North Africa / Middle East | 28 | 20 |
| West Africa | 10 | -5 |
| West Africa / North Africa | 15 | -2 |
| Central Africa | 0 | 22 |
| East Africa | -2 | 37 |
| Europe | 50 | 15 |
| Middle East / Europe | 40 | 32 |
| Eurasia | 55 | 50 |
| Oceania | -8 | 140 |
| South America | -15 | -55 |
| South Asia / Middle East | 25 | 65 |

For each location, use the region's base coordinates but offset by small random amounts (+-3 lat, +-5 lng) so dots don't overlap. The pattern for each entry is:

```typescript
{
  id: 'loc-01',
  name: 'The Silk Road Corridor',
  region: 'Central Asia',
  // ... existing fields ...
  callToAction: '...',
  lat: 41,
  lng: 64,
},
```

Apply offsets to each location within the same region. For example, if 5 locations share "South Asia", use:
- loc: 23, 78
- loc: 21, 82
- loc: 25, 76
- loc: 22, 84
- loc: 24, 80

Spread them out so they're visually distinguishable on the map.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/eli/Repo1/great-controversy && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd /Users/eli/Repo1/great-controversy
git add src/lib/game/missionLocations.ts
git commit -m "feat: add geographic coordinates to all 60 mission locations"
```

---

### Task 3: Create MissionMap Component

**Files:**
- Create: `src/components/MissionMap.tsx`

- [ ] **Step 1: Create the MissionMap component**

Create `src/components/MissionMap.tsx`:

```tsx
'use client';

import type { ClientMission } from '@/lib/game/types';

interface Props {
  missions: ClientMission[];
  currentIndex: number;
}

// Miller cylindrical projection: convert lat/lng to SVG x/y
function project(lat: number, lng: number): { x: number; y: number } {
  // SVG viewBox is 0 0 360 180
  const x = (lng + 180) * (360 / 360); // 0-360
  const y = (90 - lat) * (180 / 180);  // 0-180 (top=north)
  return { x, y };
}

export default function MissionMap({ missions, currentIndex }: Props) {
  // Collect completed + current mission positions
  const points = missions
    .slice(0, currentIndex + 1)
    .filter(m => m.location?.lat != null && m.location?.lng != null)
    .map(m => project(m.location.lat, m.location.lng));

  if (points.length === 0) return null;

  // Build trail path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <div
      className="w-full overflow-hidden rounded-lg animate-fade-in"
      style={{
        maxHeight: '120px',
        background: 'rgba(10, 14, 26, 0.6)',
        border: '1px solid var(--card-border)',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 360 180"
        className="w-full h-full"
        style={{ minHeight: '80px' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Simplified world map outline — major continent shapes */}
        <g opacity="0.15" fill="none" stroke="var(--card-border)" strokeWidth="0.5">
          {/* North America */}
          <path d="M30,45 L80,30 L120,35 L130,50 L120,65 L100,75 L80,80 L60,70 L40,60 Z" />
          {/* South America */}
          <path d="M85,90 L100,85 L110,95 L108,120 L100,140 L90,150 L80,135 L78,110 L82,95 Z" />
          {/* Europe */}
          <path d="M160,35 L180,30 L200,32 L195,45 L185,50 L170,48 L165,42 Z" />
          {/* Africa */}
          <path d="M160,60 L185,55 L200,65 L205,85 L195,110 L180,120 L165,115 L155,95 L155,75 Z" />
          {/* Asia */}
          <path d="M200,25 L250,20 L290,25 L310,35 L300,55 L280,60 L250,55 L220,50 L200,45 Z" />
          {/* India */}
          <path d="M230,60 L245,58 L250,70 L245,82 L235,80 L228,70 Z" />
          {/* Southeast Asia */}
          <path d="M260,65 L280,62 L290,70 L285,80 L270,78 L262,72 Z" />
          {/* Australia */}
          <path d="M280,110 L320,105 L335,115 L330,130 L310,135 L285,125 Z" />
        </g>

        {/* Trail connecting missions */}
        {points.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="var(--accent-gold)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="4 3"
            opacity="0.6"
            className="mission-map-trail"
          />
        )}

        {/* Completed mission dots */}
        {points.slice(0, -1).map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="var(--accent-gold)"
            opacity="0.8"
          />
        ))}

        {/* Current mission dot (pulsing) */}
        {points.length > 0 && (
          <g>
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="5"
              fill="var(--accent-blue)"
              opacity="0.3"
              className="mission-map-pulse"
            />
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="3.5"
              fill="var(--accent-blue)"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Add MissionMap CSS animations to globals.css**

Add at the end of the "KEYFRAME ANIMATIONS" section in `src/app/globals.css`:

```css
@keyframes mapPulse {
  0%, 100% { r: 5; opacity: 0.3; }
  50% { r: 8; opacity: 0.1; }
}

@keyframes trailDash {
  to { stroke-dashoffset: -14; }
}

.mission-map-pulse {
  animation: mapPulse 2s ease-in-out infinite;
}

.mission-map-trail {
  animation: trailDash 1.5s linear infinite;
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd /Users/eli/Repo1/great-controversy && npx tsc --noEmit`
Expected: No errors (component isn't imported yet, but should be type-clean)

- [ ] **Step 4: Commit**

```bash
cd /Users/eli/Repo1/great-controversy
git add src/components/MissionMap.tsx src/app/globals.css
git commit -m "feat: create MissionMap component with SVG world map and animated trail"
```

---

### Task 4: Integrate MissionMap into GameRoom

**Files:**
- Modify: `src/components/GameRoom.tsx`

- [ ] **Step 1: Add import**

Add this import at the top of GameRoom.tsx, after the existing component imports (around line 12):

```typescript
import MissionMap from './MissionMap';
```

- [ ] **Step 2: Add MissionMap between MissionTracker and hero location**

In GameRoom.tsx, find the section starting at approximately line 448:
```tsx
{/* Mission tracker */}
{roomState.missions.length > 0 && (
```

After the closing `</div>` of the MissionTracker section (around line 462), and before the `{/* Mission location — bigger, bolder hero */}` comment, add:

```tsx
      {/* Mission Map */}
      {currentMission && roomState.phase !== GamePhase.Lobby && roomState.phase !== GamePhase.RoleReveal && roomState.phase !== GamePhase.FirstNight && roomState.phase !== GamePhase.GameOver && roomState.phase !== GamePhase.MissionReveal && (
        <div className="mb-4 animate-fade-in-up delay-200">
          <MissionMap
            missions={roomState.missions}
            currentIndex={roomState.currentMissionIndex}
          />
        </div>
      )}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/eli/Repo1/great-controversy && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
cd /Users/eli/Repo1/great-controversy
git add src/components/GameRoom.tsx
git commit -m "feat: integrate MissionMap between tracker and hero location"
```

---

### Task 5: Score Banner in MissionTracker

**Files:**
- Modify: `src/components/MissionTracker.tsx`

- [ ] **Step 1: Rewrite MissionTracker with score banner**

Replace the entire content of `src/components/MissionTracker.tsx` with:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import type { ClientMission } from '@/lib/game/types';

interface Props {
  missions: ClientMission[];
  currentIndex: number;
  hideCurrentResult?: boolean;
}

export default function MissionTracker({ missions, currentIndex, hideCurrentResult }: Props) {
  // Calculate score
  const successes = missions.filter(m => m.result === 'success').length;
  const failures = missions.filter(m => m.result === 'failure').length;

  // Track previous values for pop animation
  const prevSuccesses = useRef(successes);
  const prevFailures = useRef(failures);
  const successRef = useRef<HTMLSpanElement>(null);
  const failureRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (successes > prevSuccesses.current && successRef.current) {
      successRef.current.classList.remove('score-pop');
      void successRef.current.offsetWidth; // force reflow
      successRef.current.classList.add('score-pop');
    }
    prevSuccesses.current = successes;
  }, [successes]);

  useEffect(() => {
    if (failures > prevFailures.current && failureRef.current) {
      failureRef.current.classList.remove('score-pop');
      void failureRef.current.offsetWidth; // force reflow
      failureRef.current.classList.add('score-pop');
    }
    prevFailures.current = failures;
  }, [failures]);

  // Background tint based on who's winning
  let bgTint = 'transparent';
  if (successes > failures) bgTint = 'rgba(200, 164, 78, 0.06)';
  else if (failures > successes) bgTint = 'rgba(217, 79, 79, 0.06)';

  return (
    <div
      className="rounded-lg px-4 py-3 transition-colors duration-500"
      style={{
        background: bgTint,
        border: '1px solid var(--card-border)',
      }}
    >
      {/* Score banner */}
      {(successes > 0 || failures > 0) && (
        <div className="flex items-center justify-center gap-3 mb-3 animate-fade-in">
          <div className="text-center">
            <span
              ref={successRef}
              className="font-serif font-bold text-success"
              style={{ fontSize: 'var(--score-font-size, 1.75rem)' }}
            >
              {successes}
            </span>
            <p className="text-[9px] text-muted uppercase tracking-wider">Successes</p>
          </div>
          <span className="text-muted font-serif text-lg">&mdash;</span>
          <div className="text-center">
            <span
              ref={failureRef}
              className="font-serif font-bold text-danger"
              style={{ fontSize: 'var(--score-font-size, 1.75rem)' }}
            >
              {failures}
            </span>
            <p className="text-[9px] text-muted uppercase tracking-wider">Failures</p>
          </div>
        </div>
      )}

      {/* Mission dots */}
      <div className="flex items-center justify-center">
        {missions.map((m, i) => {
          const shouldHideResult = hideCurrentResult && i === currentIndex;
          let dotClass = 'mission-dot';
          if (!shouldHideResult && m.result === 'success') dotClass += ' success';
          else if (!shouldHideResult && m.result === 'failure') dotClass += ' failure';
          else if (i === currentIndex) dotClass += ' active';
          else dotClass += ' pending';

          const isCompleted = !shouldHideResult && (m.result === 'success' || m.result === 'failure');

          return (
            <div key={m.missionNumber} className="flex items-center">
              {i > 0 && (
                <div
                  className="h-[2px] w-6"
                  style={{
                    background: i <= currentIndex || missions[i - 1].result
                      ? 'var(--accent-blue)'
                      : 'var(--card-border)',
                    opacity: i <= currentIndex || missions[i - 1].result ? 0.6 : 0.3,
                  }}
                />
              )}
              <div
                className="flex flex-col items-center animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={dotClass}>
                  {isCompleted ? (
                    m.result === 'success' ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2,7 5.5,10.5 12,3.5" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="2" y1="2" x2="10" y2="10" />
                        <line x1="10" y1="2" x2="2" y2="10" />
                      </svg>
                    )
                  ) : (
                    <span className="text-xs font-bold">{m.requiredTeamSize}</span>
                  )}
                </div>
                <span className={`text-[0.6rem] mt-1 ${m.requiresTwoFails ? 'text-gold font-bold' : 'text-muted'}`}>
                  {m.requiresTwoFails ? '2 fails' : `M${m.missionNumber}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add score-pop animation to globals.css**

Add to the keyframes section in `src/app/globals.css`:

```css
@keyframes scorePop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.score-pop {
  animation: scorePop 0.3s ease-out;
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/eli/Repo1/great-controversy && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
cd /Users/eli/Repo1/great-controversy
git add src/components/MissionTracker.tsx src/app/globals.css
git commit -m "feat: add score banner with dynamic background tint to MissionTracker"
```

---

### Task 6: Squad Lineup in Team Proposal

**Files:**
- Modify: `src/components/GameRoom.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add squad lineup CSS to globals.css**

Add to the keyframes section in `src/app/globals.css`:

```css
@keyframes squadSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes squadSlideOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(12px) scale(0.8);
  }
}

.squad-avatar-enter {
  animation: squadSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
```

- [ ] **Step 2: Add squad lineup UI to TeamProposal section**

In `src/components/GameRoom.tsx`, find the TeamProposal section (around line 736). Inside the `.game-card` div, after the team size `<p>` tag (line ~759) and before the `<div className={...}` for requiresTwoFails (line ~761), add:

```tsx
              {/* Squad lineup */}
              <div className="flex items-center justify-center gap-2 flex-wrap mb-3 min-h-[56px]">
                {Array.from({ length: currentMission.requiredTeamSize }).map((_, i) => {
                  const selectedPlayer = selectedTeam[i] ? roomState.players.find(p => p.id === selectedTeam[i]) : null;
                  return (
                    <div
                      key={i}
                      className={`flex flex-col items-center ${selectedPlayer ? 'squad-avatar-enter' : ''}`}
                      style={selectedPlayer ? { animationDelay: `${i * 50}ms` } : undefined}
                    >
                      {selectedPlayer ? (
                        <>
                          <div
                            className="rounded-full border-2 border-blue overflow-hidden"
                            style={{ width: 44, height: 44 }}
                          >
                            <img
                              src={`/avatars/avatar-${String(selectedPlayer.avatarIndex + 1).padStart(2, '0')}.png`}
                              alt={selectedPlayer.displayName}
                              className="w-full h-full object-cover"
                              style={{ background: 'var(--card-bg)' }}
                            />
                          </div>
                          <span className="text-[9px] text-muted mt-0.5 max-w-[50px] truncate text-center">
                            {selectedPlayer.displayName}
                          </span>
                        </>
                      ) : (
                        <div
                          className="rounded-full border-2 border-dashed border-card-border flex items-center justify-center"
                          style={{ width: 44, height: 44 }}
                        >
                          <span className="text-muted text-xs">{i + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/eli/Repo1/great-controversy && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
cd /Users/eli/Repo1/great-controversy
git add src/components/GameRoom.tsx src/app/globals.css
git commit -m "feat: add squad lineup with animated avatars during team selection"
```

---

### Task 7: Sabotage Animation

**Files:**
- Modify: `src/components/GameRoom.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add sabotage keyframes to globals.css**

Add to the keyframes section in `src/app/globals.css`:

```css
/* ============================================
   SABOTAGE ANIMATION
   ============================================ */

@keyframes shake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-3px, 2px); }
  20% { transform: translate(3px, -2px); }
  30% { transform: translate(-2px, -1px); }
  40% { transform: translate(2px, 2px); }
  50% { transform: translate(-1px, -2px); }
  60% { transform: translate(1px, 1px); }
  70% { transform: translate(-2px, 2px); }
  80% { transform: translate(2px, -1px); }
  90% { transform: translate(-1px, 1px); }
}

@keyframes sabotageText {
  0% { opacity: 0; transform: scale(0.5); filter: blur(4px); }
  60% { opacity: 1; transform: scale(1.05); filter: blur(0); }
  100% { opacity: 1; transform: scale(1); filter: blur(0); }
}

@keyframes sabotagePulse {
  0%, 100% { box-shadow: inset 0 0 60px rgba(217, 79, 79, 0.2); }
  50% { box-shadow: inset 0 0 100px rgba(217, 79, 79, 0.4); }
}

@keyframes sabotageGlitch {
  0% { clip-path: inset(0 0 0 0); transform: translate(0); }
  20% { clip-path: inset(10% 0 80% 0); transform: translate(-2px, 0); }
  40% { clip-path: inset(60% 0 10% 0); transform: translate(2px, 0); }
  60% { clip-path: inset(30% 0 50% 0); transform: translate(-1px, 0); }
  80% { clip-path: inset(0 0 0 0); transform: translate(1px, 0); }
  100% { clip-path: inset(0 0 0 0); transform: translate(0); }
}

.sabotage-shake {
  animation: shake 0.4s ease-out;
}

.sabotage-overlay {
  animation: sabotagePulse 0.8s ease-in-out 2;
}

.sabotage-text {
  animation: sabotageText 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0.2s;
}

.sabotage-glitch {
  animation: sabotageGlitch 0.3s steps(1) 2;
  animation-delay: 0.5s;
}

@media (prefers-reduced-motion: reduce) {
  .sabotage-shake { animation: none; }
  .sabotage-overlay { animation: none; }
  .sabotage-text { animation: fadeIn 0.3s ease-out both; }
  .sabotage-glitch { animation: none; }
}
```

- [ ] **Step 2: Add sabotage state to GameRoom**

In `src/components/GameRoom.tsx`, find the state declarations (around lines 130-170 area where other `useState` hooks are). Add:

```typescript
const [sabotageAnimActive, setSabotageAnimActive] = useState(false);
```

- [ ] **Step 3: Add sabotage trigger effect**

After the existing `useEffect` hooks in GameRoom (after the discussion timer effect around line 277), add:

```typescript
  // Sabotage animation trigger
  useEffect(() => {
    if (missionRevealDone && currentMission?.result === 'failure' && !sabotageAnimActive) {
      setSabotageAnimActive(true);
      const timeout = setTimeout(() => setSabotageAnimActive(false), 2500);
      return () => clearTimeout(timeout);
    }
  }, [missionRevealDone, currentMission?.result]);
```

- [ ] **Step 4: Add sabotage overlay JSX**

In the MissionReveal section (around line 837), right after `<div className="space-y-4 animate-fade-in">`, add the sabotage overlay:

```tsx
            {/* Sabotage animation overlay */}
            {sabotageAnimActive && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none sabotage-overlay"
                style={{ background: 'rgba(217, 79, 79, 0.1)' }}
              >
                <div className="text-center sabotage-text">
                  <p
                    className="font-serif font-bold text-danger sabotage-glitch"
                    style={{
                      fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
                      textShadow: '0 0 20px rgba(217,79,79,0.8), 0 0 40px rgba(217,79,79,0.4)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    SABOTAGE DETECTED
                  </p>
                  <p className="text-danger/60 text-sm mt-2 animate-fade-in delay-500">
                    The mission has been compromised
                  </p>
                </div>
              </div>
            )}
```

- [ ] **Step 5: Add shake class to game container when sabotage plays**

Find the outer container of the MissionReveal section. The `<div className="space-y-4 animate-fade-in">` on line ~838 — change it to:

```tsx
          <div className={`space-y-4 animate-fade-in ${sabotageAnimActive ? 'sabotage-shake' : ''}`}>
```

- [ ] **Step 6: Verify build**

Run: `cd /Users/eli/Repo1/great-controversy && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
cd /Users/eli/Repo1/great-controversy
git add src/components/GameRoom.tsx src/app/globals.css
git commit -m "feat: add dramatic sabotage animation on mission failure"
```

---

### Task 8: Final Build Verification and Deploy

**Files:**
- None (verification only)

- [ ] **Step 1: Full build**

Run: `cd /Users/eli/Repo1/great-controversy && rm -rf .next && npm run build`
Expected: Build completes successfully with no errors

- [ ] **Step 2: Lint check**

Run: `cd /Users/eli/Repo1/great-controversy && npm run lint`
Expected: No errors (warnings acceptable)

- [ ] **Step 3: Visual check list (manual)**

Start dev server and verify in browser:
- MissionTracker shows score banner (only when at least 1 mission complete)
- MissionMap shows between tracker and hero image
- Squad lineup shows empty slots, fills them when selecting
- Sabotage animation fires on mission failure

Run: `cd /Users/eli/Repo1/great-controversy && npm run dev`
Open: http://localhost:3000

- [ ] **Step 4: Deploy to production**

```bash
ssh elikim@100.122.9.46 'export PATH="/opt/homebrew/bin:$PATH" && cd ~/great-controversy && git pull && rm -rf .next && npm run build && lsof -ti :3001 | xargs kill -9; sleep 3 && PORT=3001 NODE_ENV=production nohup npx tsx server/index.ts > /tmp/gc-server.log 2>&1 &'
```

Note: The deploy command needs the ANTHROPIC_API_KEY env var for AI bots. Check with Eli if he wants to deploy now or test locally first.
