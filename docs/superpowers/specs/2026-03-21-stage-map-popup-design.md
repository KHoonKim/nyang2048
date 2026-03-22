# Stage Map Anipang Layout + Stage Detail Popup

**Date:** 2026-03-21
**Status:** Approved

## Overview

Two UI improvements to the home screen:
1. Anipang-style blob/cloud shaped stage map nodes
2. Stage detail popup modal when clicking any accessible stage

## 1. Stage Map Node Restyling

### Current
Circular nodes in a 12-row × 3-col serpentine grid. Minimal visual distinction between states.

### Target
Organic blob/cloud shaped nodes like the Anipang reference:
- CSS `border-radius` with multiple unequal values to create blob shapes
- Two blob shape variants, alternating or random-ish to avoid mechanical look
- **Current stage**: Larger node (~72px), orange glow (`#FF6B35`), pulsing animation
- **Cleared stages**: Cat image inside, checkmark overlay in corner
- **Locked stages**: Darker/muted color, lock icon, ghost cat silhouette

### Node sizes
- Default node: 56px circle-ish blob
- Current stage node: 72px, more prominent

### Colors (aligned with DESIGN.md)
- Locked: `rgba(180,160,140,0.5)` — warm muted
- Cleared: `#D4C4A8` — warm beige
- Current: `#FF6B35` with box-shadow glow

## 2. Stage Detail Popup

### Trigger
Clicking any **current** or **cleared** stage node opens the popup.
Locked stages: no popup (no interaction).

### Layout — Center modal with dimmed overlay

```
┌─────────────────────────┐
│   스테이지 N          ✕  │
├─────────────────────────┤
│ 달성 목표               │
│  [cat image]  품종명    │
│  보드: 4×4 · 목표값: 64  │
├─────────────────────────┤
│ ✅ 클리어!  ⏱ 최고기록: - │  (or 🔒 미클리어)
├─────────────────────────┤
│ 🐾 등장 고양이           │
│ [c1][c2][c3][c4][c5]   │
│ [c6][c7]...            │
├─────────────────────────┤
│       [시작하기]         │
└─────────────────────────┘
```

### Data sources
- `STAGES[n]` — goal, boardLabel, cats
- `getStageCatLineup(n)` — ordered cat list for the stage
- `getBestTime(n)` — best clear time from localStorage
- `getBestScore(n)` — best score
- `getUnlockedStage()` — to determine clear status (stage < unlockedStage = cleared)
- `getCollection()` — to show which cats are already collected (greyed out if not yet)

### Clear status logic
- `n < unlockedStage` → cleared (show ✅ + best time)
- `n === unlockedStage` → current (show 🎯 미클리어 or first attempt)
- `n > unlockedStage` → locked (no popup)

### Best record display
- Format: MM:SS if time available, otherwise "기록 없음"
- Show score if available as secondary info

### Cat lineup
- Show all cats from `getStageCatLineup(n)`
- Each cat: small image (36px), no name label (space efficient)
- Goal cat highlighted with orange border

## Implementation Files

- `src/ui/home.js` — add `showStageDetail(n)` function, update click handlers
- `src/styles/main.css` — update `.smap-node` blob shapes, add `.stage-popup` styles

## Out of Scope
- Medal system (removed 2026-03-20)
- Locked stage popup
- Infinite mode popup changes
