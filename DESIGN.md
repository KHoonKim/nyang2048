# Design System — 냥2048

## Product Context
- **What this is:** Cat-themed 2048 puzzle game with a collection mechanic — merge tiles to unlock cat illustrations
- **Who it's for:** Korean mobile users playing via Apps-in-Toss (Toss super-app)
- **Space/industry:** Korean casual mobile games (Kakao, LINE, Anipang category)
- **Project type:** Mobile game embedded in fintech super-app (AIT, Capacitor-based)

## Aesthetic Direction
- **Direction:** Cozy Warm / Korean Casual
- **Decoration level:** Intentional — warmth through color, cats do the decorating (no heavy textures)
- **Mood:** Warm and inviting like a Korean stationery shop. NOT a banking dashboard that happens to have cats. Every screen should feel like a cozy game you want to sit with.
- **Anti-pattern:** The current cold `#F5F5F5` background + generic card layout reads as "fintech app with cat stickers". Resist this. Warmth is the first signal that this is a game.

## Typography
- **All text:** Pretendard Variable — keeps it consistent with TDS and correct for Korean
- **Stage numbers:** 900 weight, large — chunky and expressive (Kakao/LINE standard)
- **Screen titles:** 800 weight, `letter-spacing: -0.02em`
- **Body/sub text:** 400–600 weight, `color: var(--tds-sub)` for hierarchy
- **Buttons/labels:** 700–800 weight
- **Loading:** Already bundled via `@font-face` in main.css — no CDN needed
- **Scale:**
  - micro: 11px / 600
  - small: 13px / 600–700
  - body: 15px / 400
  - label: 15px / 700
  - title: 18–22px / 800
  - hero/num: 28–36px / 900

## Color
- **Approach:** Restrained warm — brand orange leads, neutrals are warm not cold
- **Brand Orange:** `#FF6B35` — primary identity, used for current stage glow, active states
- **Background:** `#FBF8F4` — warm cream (replaces cold `#F5F5F5`)
- **Card surface:** `#FFFBF7` — warm white (replaces pure white)
- **TDS Blue CTA:** `#3182F6` — KEEP for all primary action buttons (도전하기, 교환, etc.) — Toss users expect this
- **Cleared stage:** bg `#E8F7EE`, fg `#1B7A47`, border `rgba(27,122,71,0.2)`
- **Locked cell:** bg `#F3F1EE`, fg `#C5C3BE`
- **Brand light:** `#FFF0EB` — hover states, hidden-cat panel cells
- **Semantic:** success `#1B7A47`, warning `#F5A623`, error `#F04452`, info `#3182F6`
- **Dark mode:** Shift surfaces to warm-dark (`#1A1812` bg, `#26231C` card). Reduce brand saturation by ~10%.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable (not as dense as Toss app, not as spacious as landing page — this is a game)
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(20) xl(24) 2xl(32) 3xl(48)
- **Stage grid gap:** 5px (compact — fits 5 cells on a narrow phone screen)
- **Card padding:** 14–16px

## Layout
- **Approach:** Grid-disciplined (mobile game conventions — no creativity needed here)
- **Max width:** 480px (AIT constraint)
- **Stage grid:** 5-column, aspect-ratio 1:1 cells
- **Border radius scale:** cell(10px) card(16px) panel(20px) button(12px) full(999px)
- **Stage detail panel** sits immediately below the grid — no scroll needed to see current challenge

## Motion
- **Approach:** Intentional — only for state communication
- **Current stage pulse:** `@keyframes orange-pulse` — orange glow (not TDS blue) radiates from current stage cell
  ```css
  @keyframes orange-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,53,0.4); }
    50%       { box-shadow: 0 0 0 6px rgba(255,107,53,0); }
  }
  ```
- **Duration:** micro(100ms) short(200ms) medium(300ms)
- **Easing:** enter(ease-out) exit(ease-in)

## Key Design Decisions

### SAFE (category conventions — don't break these)
1. **Warm background** — Every Korean casual game (Kakao, LINE, Anipang) uses warm off-white. Cold neutrals read as "finance app" to Korean users.
2. **5-column stage grid** — Industry standard for Korean casual games. Users are trained on this pattern.
3. **TDS Blue for all CTA buttons** — Toss users unconsciously trust blue CTAs. Using orange for the play button would confuse action hierarchy.

### RISK (where 냥2048 gets its own face)
1. **Faint cat silhouettes in locked stage cells** — Each locked cell contains the stage's first cat image at `opacity: 0.12`, `filter: blur(1px) grayscale(1)`. Shows "there's a cat in here" without revealing it. Creates curiosity (Royal Match pattern adapted for cat collection).
   ```css
   .sgrid-cell--locked .cat-ghost {
     position: absolute; inset: 0;
     display: flex; align-items: center; justify-content: center;
     opacity: 0.12; pointer-events: none;
   }
   .sgrid-cell--locked .cat-ghost img {
     width: 30px; height: 30px; object-fit: cover;
     filter: grayscale(1) blur(1px); border-radius: 50%;
   }
   ```

2. **Blurred mystery cats in stage detail panel** — Undiscovered cats shown as `filter: blur(4px) grayscale(0.7)` rather than featureless gray circles. You can see the cat's shape and silhouette but not the details. "I want to find this one" feeling. Dramatically increases collection motivation.
   ```css
   .scat--hidden img {
     filter: blur(4px) grayscale(0.7) brightness(0.85);
     transform: scale(1.1);
   }
   .scat--hidden { background: var(--brand-light); border-color: var(--brand-light); }
   ```

3. **Orange pulse for current stage** — Current stage glows with brand orange, not TDS blue. The rest of the home screen (nav buttons, cat chips) uses orange sparingly. CTA button stays blue. This gives the home screen a game identity without breaking the full TDS contract.

4. **Cleared stages show a cat face, not a time** — The first cat found in a cleared stage appears as a tiny circle in the cell. Time record moves to a secondary badge or the stage panel. "My collection" is the home screen narrative, not "my best time".

## Implementation Notes
- All new tokens use existing `--tds-*` variable pattern from `src/styles/main.css`
- Background override: set `--tds-bg` to `#FBF8F4` OR add new `--app-bg: #FBF8F4` override
- Cat ghost images: use `getCatImage(catId)` from `src/game/stages.js` — pass the first cat of each stage's `STAGES[n].cats` map
- Blurred panel cats: apply to `.scat--hidden` class (already exists) — just change the CSS, no JS changes needed
- Orange pulse: add `--app-brand-pulse` keyframe, apply to `.sgrid-cell--current`

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-20 | Warm cream background #FBF8F4 | Korean casual game convention; cold neutral = finance app signal |
| 2026-03-20 | Cat silhouettes in locked cells | Curiosity-driven design (Royal Match pattern); "there's a cat in here" |
| 2026-03-20 | Blurred mystery cats in panel | Increases collection motivation vs. featureless gray circles |
| 2026-03-20 | Orange pulse for current stage cell | Brand color coherence; blue reserved for action buttons only |
| 2026-03-20 | Cleared cells show cat face not time | Collection is the game's core narrative; time is secondary |
| 2026-03-20 | Keep TDS Blue for all CTA buttons | Toss users expect blue CTAs; changing would hurt action clarity |
