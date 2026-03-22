# 냥2048 — Claude Code Instructions

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All color choices, spacing, background colors, stage cell states, cat display patterns, and aesthetic direction are defined there.
Do not deviate without explicit user approval.

Key rules:
- Background must be warm cream `#FBF8F4`, NOT cold `#F5F5F5`
- Current stage cell pulses ORANGE (`#FF6B35`), not TDS blue
- All CTA/action buttons stay TDS Blue (`#3182F6`)
- Undiscovered cats in stage panel: `filter: blur(4px) grayscale(0.7)`, not gray circles
- Locked stage cells: include faint cat silhouette (opacity 0.12, blur) behind lock icon

## Project Structure
- Framework: Granite (wraps Vite) — use `npx granite dev` for local dev, `npx granite build` for AIT build
- Local dev server: port 4012 (or auto-selected by granite)
- Unit tests: `node --test src/game/score.test.js` and `node --test server/attendance.test.js`
- Cat images: `public/cats/{catId}-loaf.webp` (served at `/cats/`)

## Key Files
- `src/ui/home.js` — Home screen (stage grid + stage detail panel)
- `src/ui/play.js` — Game screen
- `src/ui/result.js` — Result screen
- `src/game/stages.js` — Stage config, cat IDs, `STAGES`, `getCatImage()`, `getStageCatLineup()`
- `src/game/score.js` — localStorage helpers (scores, collection, stage unlock)
- `src/styles/main.css` — All CSS (TDS tokens + app-specific)
- `server/index.js` — Express server (attendance, coins, exchange)

## Deployment
- Server: Hostinger VPS `root@76.13.210.78` at `/var/www/nyang2048/`
- Deploy: `scp` changed files then `pm2 restart nyang2048`
- AIT build: `npx granite build` → produces `.ait` file

## Medal System
Removed entirely (2026-03-20). Score-based medals don't work because worse players score higher (more merges = higher score). Time-based was too complex to tune per-stage. Collection-based can't distinguish bronze (clearing a stage = finding all cats). No medals in play.js, result.js, home.js, or stages.js.
