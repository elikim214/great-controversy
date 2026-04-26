# Tier 1 Visual Upgrades — Design Spec

**Date:** 2026-04-26
**Scope:** 4 high-impact visual upgrades for The Great Controversy game
**Philosophy:** Progressive — solid foundations with CSS variables/hooks for easy tuning later

---

## 1. Animated Mission Map

### Purpose
Show players a visual sense of journey across the world as missions progress. Creates narrative continuity between missions.

### Component
New file: `src/components/MissionMap.tsx`

### Behavior
- Renders a simplified SVG world map outline (inline, minimal detail, ~5KB)
- Each completed mission location shows as a gold dot at approximate geographic position
- A glowing animated trail connects past locations in order
- Current mission location pulses blue
- Future locations are not shown (no spoilers)
- On mission transition, trail animates from previous dot to new dot (CSS stroke-dashoffset animation)

### Data Requirements
- Add `lat` and `lng` fields to `MissionLocation` type (approximate center of region)
- Add coordinates to each of the 60 locations in `missionLocations.ts`
- SVG uses Miller projection math to convert lat/lng to x/y positions

### Placement
- Between MissionTracker (dots) and hero location card in GameRoom.tsx
- Only visible during: TeamProposal, TeamVote, MissionAction phases
- Hidden during: Lobby, RoleReveal, FirstNight, MissionReveal, GameOver

### Styling
- Map outline: `var(--card-border)` with 0.3 opacity
- Completed dots: `var(--accent-gold)`, 6px radius
- Current dot: `var(--accent-blue)`, 8px radius, pulsing animation
- Trail: `var(--accent-gold)` with 0.5 opacity, 2px stroke, dashed animation
- Container: max-height 120px, full width, no overflow

### CSS Variables for Tuning
```css
--map-dot-size: 6px;
--map-dot-current-size: 8px;
--map-trail-width: 2px;
--map-trail-speed: 1.5s;
--map-pulse-speed: 2s;
```

---

## 2. Team Selection Cards (Squad Lineup)

### Purpose
Give visual feedback when the leader selects team members. Makes the selection feel tangible and dramatic.

### Location
Inline enhancement to GameRoom.tsx TeamProposal section (no new file needed).

### Behavior
- Horizontal row of circular avatar thumbnails appears above the PlayerList
- When a player is selected, their avatar slides in from below with a spring-like ease
- When deselected, avatar slides out downward and fades
- Shows player name below each avatar (truncated)
- Empty slots shown as dashed circles until filled
- Count indicator: "2 of 3 selected"

### Layout
```
┌─────────────────────────────────────────┐
│  [avatar] [avatar] [- - -]             │
│   Name     Name    empty               │
│         2 of 3 selected                │
├─────────────────────────────────────────┤
│  PlayerList (existing selection UI)     │
└─────────────────────────────────────────┘
```

### Styling
- Avatar circles: 44px (meets touch target), border `var(--accent-blue)` 2px
- Empty slots: 44px dashed circle, `var(--card-border)` color
- Animation: `transform: translateY(0)` from `translateY(20px)`, opacity 0→1, 300ms cubic-bezier(0.34, 1.56, 0.64, 1) (slight overshoot)
- Exit: reverse, 200ms ease-in
- Name text: 10px, `var(--muted)`, max-width 50px, truncated

### Data
- Uses existing `getAvatarImageUrl(player.avatarIndex)` from missionaries.ts
- Uses existing `selectedTeam` state in GameRoom

---

## 3. Sabotage Animation

### Purpose
Make mission failure feel dramatic and impactful. Replaces the quiet red X reveal with a cinematic moment.

### Location
Inline enhancement to GameRoom.tsx MissionReveal section (no new file needed). Also add keyframes to globals.css.

### Trigger
- `missionRevealDone === true` AND `currentMission.result === 'failure'`
- Plays once, auto-dismisses after 2.5 seconds
- State: `sabotageAnimActive` boolean, set true on trigger, set false on timeout

### Behavior (sequence over 2.5s)
1. **0ms:** Full-viewport overlay fades in (semi-transparent dark)
2. **100ms:** Screen shake begins (CSS transform on game container, 400ms)
3. **200ms:** Red pulse vignette on edges (radial gradient, pulses twice)
4. **400ms:** "SABOTAGE DETECTED" text scales in from 0.5→1.0 with glitch offset effect
5. **2500ms:** Overlay fades out, normal mission story visible below

### Styling
- Overlay: `position: fixed`, `inset: 0`, `z-index: 60`, `background: rgba(217,79,79,0.15)`
- Text: Playfair Display serif, 2rem, `var(--danger)`, `text-shadow: 0 0 20px rgba(217,79,79,0.8)`
- Shake: `@keyframes shake { 0%,100% { transform: translate(0) } 25% { translate(-3px, 2px) } 50% { translate(3px, -2px) } 75% { translate(-2px, -1px) } }`
- Vignette: `box-shadow: inset 0 0 80px rgba(217,79,79,0.4)` pulsing

### CSS Variables
```css
--sabotage-shake-intensity: 3px;
--sabotage-duration: 2500ms;
--sabotage-text-size: 2rem;
```

### Sound Integration
- Existing `missionFailed()` sound already plays on failure
- No additional sound needed (the existing one covers the dramatic moment)

---

## 4. Score Banner

### Purpose
Make the overall mission score immediately visible and emotionally resonant. Players should feel the momentum shifting.

### Location
Enhancement to `MissionTracker.tsx` (wraps existing dots).

### Behavior
- Large score display above the dots: "2 — 1" format
- Background gradient shifts based on score:
  - Mission Team leads: subtle gold glow (`var(--accent-gold)` at 8% opacity)
  - Babylon leads: subtle red ominous (`var(--danger)` at 8% opacity)
  - Tied or 0-0: neutral (no tint)
- Score numbers animate (scale pop) when they change
- Labels below: "Successes" and "Failures" in small muted text

### Layout
```
┌─────────────────────────────────────────┐
│           2  —  1                       │  ← large, bold
│      Successes  Failures               │  ← tiny labels
│                                         │
│    [●]──[●]──[◉]──[○]──[○]            │  ← existing dots
└─────────────────────────────────────────┘
```

### Styling
- Score numbers: 1.75rem, font-serif, font-bold
- Success number: `var(--success)`
- Failure number: `var(--danger)`
- Dash: `var(--muted)`
- Container: rounded-lg, padding 12px 16px, subtle border
- Gradient transition: 500ms ease on background-color change
- Number pop: scale(1.3) → scale(1) on change, 300ms

### Props Enhancement
```typescript
interface Props {
  missions: ClientMission[];
  currentIndex: number;
  hideCurrentResult?: boolean;
}
// No new props needed — score computed from missions array
```

### CSS Variables
```css
--score-font-size: 1.75rem;
--score-glow-opacity: 0.08;
--score-transition-speed: 500ms;
```

---

## Shared Implementation Notes

### File Changes Summary
| File | Change |
|------|--------|
| `src/components/MissionMap.tsx` | NEW — SVG world map component |
| `src/components/GameRoom.tsx` | Add MissionMap, squad lineup, sabotage overlay |
| `src/components/MissionTracker.tsx` | Add score banner above dots |
| `src/lib/game/types.ts` | Add lat/lng to MissionLocation |
| `src/lib/game/missionLocations.ts` | Add coordinates to 60 locations |
| `src/app/globals.css` | Add shake, pulse, sabotage keyframes |

### Animation Performance
- All animations use `transform` and `opacity` only (GPU-composited)
- No layout-triggering properties animated
- `will-change` applied sparingly to active animations only
- Reduced motion: wrap all animations in `@media (prefers-reduced-motion: no-preference)`

### Mobile Considerations
- MissionMap: 120px max-height keeps it compact on small screens
- Squad lineup: horizontal scroll if >5 players selected (rare)
- Sabotage overlay: full viewport, works at any size
- Score banner: numbers stay readable at 1.75rem on mobile

### Accessibility
- Map is decorative (aria-hidden="true")
- Sabotage animation respects prefers-reduced-motion (skip shake, just show text)
- Score banner numbers have aria-label for screen readers
