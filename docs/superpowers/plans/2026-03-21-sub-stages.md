# Sub-Stage System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 36개 스테이지를 각 3개의 서브스테이지(X-1, X-2, X-3)로 확장해 총 108개 스테이지를 제공. X-1이 가장 쉽고(큰 보드) X-3이 현재 난이도(기존 스테이지와 동일).

**Architecture:**
서브스테이지는 `getSubStageConfig(stageNum, subNum)` 함수로 동적 생성. 보드 크기는 사다리(3×3→4×3→4×4→5×5→6×6→7×7→8×8)를 따라 X-3(현재)에서 위로 올라가며 쉬워짐. 8×8 상한에 닿으면 대신 고양이 수(목표 타일값)를 낮춰 보정. 스테이지 ID는 문자열 `"1-1"` 포맷으로 변경.

**Tech Stack:** Vanilla JS (ES6 modules), localStorage, Vite/Granite dev server

---

## 파일 변경 맵

| 파일 | 변경 내용 |
|------|---------|
| `src/game/stages.js` | `BOARD_LADDER`, `getSubStageConfig()`, `parseStageId()` 추가 |
| `src/game/score.js` | 언락 로직을 `"1-1"` 포맷으로 변경, 구버전 마이그레이션 |
| `src/ui/home.js` | 노드에 서브스테이지 진행 점(●●○) 표시, 클릭 핸들러 업데이트 |
| `src/ui/play.js` | `"1-1"` 포맷 파싱, 동적 보드/목표 설정 사용 |
| `src/ui/result.js` | 다음 서브스테이지로 이동, 스테이지 레이블 업데이트 |

---

## Task 1: stages.js — 서브스테이지 설정 생성기

**Files:**
- Modify: `src/game/stages.js`

### 핵심 설계

보드 사다리 (인덱스 0~6):
```
0: 3×3
1: 4×3
2: 4×4
3: 5×5
4: 6×6
5: 7×7
6: 8×8  ← 상한
```

X-3 = 현재(stepsUp=0), X-2 = 1단계 위(stepsUp=1), X-1 = 2단계 위(stepsUp=2).
상한 초과분(boardOverflow)만큼 고양이 수 감소 → 목표 타일값이 낮아짐.

- [ ] **Step 1: `BOARD_LADDER`와 헬퍼 추가**

`stages.js` 최하단(export 전)에 추가:

```js
// ── Sub-stage system ──

export const BOARD_LADDER = [
  { rows: 3, cols: 3, boardLabel: '3×3' },
  { rows: 3, cols: 4, boardLabel: '4×3' },
  { rows: 4, cols: 4, boardLabel: '4×4' },
  { rows: 5, cols: 5, boardLabel: '5×5' },
  { rows: 6, cols: 6, boardLabel: '6×6' },
  { rows: 7, cols: 7, boardLabel: '7×7' },
  { rows: 8, cols: 8, boardLabel: '8×8' },
];

function getBoardLadderIndex(rows, cols) {
  return BOARD_LADDER.findIndex(b => b.rows === rows && b.cols === cols);
}

function getInitialTilesForBoard(rows, cols) {
  const cells = rows * cols;
  if (cells <= 16) return 2;   // 3×3, 4×3, 4×4
  if (cells <= 36) return 3;   // 5×5, 6×6
  return 4;                    // 7×7, 8×8
}

// Parse "1-1" → { stageNum: 1, subNum: 1 }
// Handles legacy integer format: "5" → { stageNum: 5, subNum: 1 }
export function parseStageId(id) {
  const s = String(id);
  if (s.includes('-')) {
    const [stageNum, subNum] = s.split('-').map(Number);
    return { stageNum, subNum };
  }
  return { stageNum: parseInt(s, 10), subNum: 1 };
}

export function formatStageId(stageNum, subNum) {
  return `${stageNum}-${subNum}`;
}

// Returns config for a specific sub-stage.
// subNum: 1 (easiest, large board), 2 (medium), 3 (hardest = current stage config)
export function getSubStageConfig(stageNum, subNum) {
  const base = STAGES[stageNum];
  if (!base) return null;

  const catLineup = getStageCatLineup(stageNum); // sorted by tile value ascending
  const N = catLineup.length;

  const stepsUp = 3 - subNum; // X-1: 2 steps, X-2: 1 step, X-3: 0 steps

  const baseIdx = getBoardLadderIndex(base.rows, base.cols);
  if (baseIdx === -1) return base; // unknown board — fall back
  const maxIdx = BOARD_LADDER.length - 1;

  const targetIdx = Math.min(baseIdx + stepsUp, maxIdx);
  const boardOverflow = Math.max(0, (baseIdx + stepsUp) - maxIdx);

  const newBoard = BOARD_LADDER[targetIdx];

  // Cat count reduction when board size is capped
  let goal = base.goal;
  if (boardOverflow > 0) {
    const targetCatIdx = N - 1 - boardOverflow;
    if (targetCatIdx >= 0) goal = catLineup[targetCatIdx].value;
  }

  return {
    ...base,
    rows: newBoard.rows,
    cols: newBoard.cols,
    boardLabel: newBoard.boardLabel,
    goal,
    initialTiles: getInitialTilesForBoard(newBoard.rows, newBoard.cols),
    boardKey: formatStageId(stageNum, subNum),
    stageNum,
    subNum,
  };
}
```

- [ ] **Step 2: 수동으로 몇 가지 케이스 검증**

브라우저 콘솔 또는 node에서 확인:
```js
// S1 (5×5, goal=64): 1-1=7×7, 1-2=6×6, 1-3=5×5
getSubStageConfig(1, 1) // rows:7, cols:7, goal:64
getSubStageConfig(1, 2) // rows:6, cols:6, goal:64
getSubStageConfig(1, 3) // rows:5, cols:5, goal:64 (= current)

// S36 (8×8, goal=8192, 13 cats): cat count reduction
getSubStageConfig(36, 1) // rows:8, cols:8, goal:2048 (11번째 cat)
getSubStageConfig(36, 2) // rows:8, cols:8, goal:4096 (12번째 cat)
getSubStageConfig(36, 3) // rows:8, cols:8, goal:8192 (= current)

// S34 (7×7, goal=2048): 34-1=8×8 N-1 cats, 34-2=8×8 full, 34-3=7×7
getSubStageConfig(34, 1) // rows:8, cols:8, goal < 2048
getSubStageConfig(34, 2) // rows:8, cols:8, goal:2048
getSubStageConfig(34, 3) // rows:7, cols:7, goal:2048 (= current)

// S30 (3×3, goal=64): 30-1=4×4, 30-2=4×3, 30-3=3×3
getSubStageConfig(30, 1) // rows:4, cols:4, goal:64
getSubStageConfig(30, 2) // rows:3, cols:4, goal:64
getSubStageConfig(30, 3) // rows:3, cols:3, goal:64 (= current)
```

- [ ] **Step 3: Commit**

```bash
git add src/game/stages.js
git commit -m "feat: add getSubStageConfig() and parseStageId() for sub-stage system"
```

---

## Task 2: score.js — 언락 로직 업데이트

**Files:**
- Modify: `src/game/score.js`

현재 `getUnlockedStage()`는 정수(예: `5`)를 반환. 새 포맷은 `"5-1"` 형태.
구버전 localStorage 값은 마이그레이션 처리.

- [ ] **Step 1: `getUnlockedStage()` 수정**

기존:
```js
export function getUnlockedStage() {
  if (DEBUG_MODE) return 36;
  return parseInt(localStorage.getItem(STAGE_KEY) || '1', 10);
}
```

변경:
```js
export function getUnlockedStage() {
  if (DEBUG_MODE) return '1-1';
  const raw = localStorage.getItem(STAGE_KEY) || '1-1';
  // Migrate legacy integer format
  if (!raw.includes('-')) {
    const migrated = `${raw}-1`;
    localStorage.setItem(STAGE_KEY, migrated);
    return migrated;
  }
  return raw;
}
```

- [ ] **Step 2: `unlockNextStage()` 수정**

기존:
```js
export function unlockNextStage(current) {
  const currentUnlocked = getUnlockedStage();
  const next = typeof current === 'number' ? current + 1 : 2;
  if (next > currentUnlocked && next <= 36) {
    localStorage.setItem(STAGE_KEY, String(next));
  }
}
```

변경:
```js
// currentId: "1-1" format
export function unlockNextStage(currentId) {
  const { stageNum, subNum } = parseStageIdLocal(currentId);

  let nextStage = stageNum;
  let nextSub = subNum + 1;
  if (nextSub > 3) { nextStage = stageNum + 1; nextSub = 1; }
  if (nextStage > 36) { unlockInfinite(); return; }

  const currentUnlocked = getUnlockedStage();
  const { stageNum: cStage, subNum: cSub } = parseStageIdLocal(currentUnlocked);

  // Only advance if next is further than current
  if (nextStage > cStage || (nextStage === cStage && nextSub > cSub)) {
    localStorage.setItem(STAGE_KEY, `${nextStage}-${nextSub}`);
  }
}

function parseStageIdLocal(id) {
  const s = String(id);
  if (s.includes('-')) {
    const [stageNum, subNum] = s.split('-').map(Number);
    return { stageNum, subNum };
  }
  return { stageNum: parseInt(s, 10), subNum: 1 };
}
```

Note: `parseStageIdLocal`은 score.js 내부 전용 (stages.js에 import 순환 방지).

- [ ] **Step 3: DEBUG_MODE `getUnlockedStage()` 확인**

DEBUG_MODE 시 `'36-3'` 반환하도록 수정 (home.js에서 모든 스테이지 접근 가능하게):
```js
if (DEBUG_MODE) return '36-3';
```

- [ ] **Step 4: Commit**

```bash
git add src/game/score.js
git commit -m "feat: update stage unlock system to support sub-stage IDs (1-1 format)"
```

---

## Task 3: home.js — 스테이지 맵 서브스테이지 표시

**Files:**
- Modify: `src/ui/home.js`

스테이지 맵은 여전히 36개 노드 유지. 각 노드에 서브스테이지 진행 점(●●○) 추가.
언락 상태는 스테이지 번호 기준으로만 판단 (서브스테이지는 노드 내 점으로 표시).

- [ ] **Step 1: import 업데이트**

```js
import { getUnlockedStage, ... } from '../game/score.js';
import { STAGES, getCatImage, getCatForValue, CAT_NAMES, getStageCatLineup, ALL_CATS_ORDERED, getSubStageConfig, parseStageId, formatStageId } from '../game/stages.js';
```

- [ ] **Step 2: `renderHome()` 상단 언락 파싱 변경**

기존:
```js
const unlockedStage = getUnlockedStage();
```

변경:
```js
const unlockedRaw = getUnlockedStage(); // e.g. "3-2"
const { stageNum: unlockedStageNum, subNum: unlockedSubNum } = parseStageId(unlockedRaw);
```

- [ ] **Step 3: `renderSlot()` 함수 업데이트**

기존 `locked`, `isCurrent` 판단을 새 포맷으로 수정 + 서브스테이지 점 추가:

```js
function renderSlot(n, xPct) {
  if (n < 1 || n > 36) return '';

  const locked = n > unlockedStageNum;
  const isCurrent = n === unlockedStageNum;
  const isCleared = n < unlockedStageNum;
  const catId = STAGES[n] ? Object.values(STAGES[n].cats)[0] : null;

  // Sub-stage progress dots
  function subDots() {
    if (locked) return '';
    const completedSubs = isCleared ? 3 : unlockedSubNum - 1;
    const dots = [1, 2, 3].map(i =>
      `<span class="smap-subdot${i <= completedSubs ? ' smap-subdot--done' : ''}"></span>`
    ).join('');
    return `<div class="smap-subdots">${dots}</div>`;
  }

  const silhouette = catId ? `<img class="smap-node__silhouette" src="${getCatImage(catId)}" alt="">` : '';
  const catUrl = catId ? getCatImage(catId) : '';

  let nodeHtml;
  if (locked) {
    nodeHtml = `<div class="smap-node smap-node--locked">
      ${silhouette}
      <span class="smap-node__lock">${ICON.lock}</span>
    </div>`;
  } else if (isCurrent) {
    nodeHtml = `<button class="smap-node smap-node--current" id="smap-current" data-stage="${n}">
      ${catId ? `<div class="smap-node__glow-wrap"><div class="smap-node__orange-silhouette" style="-webkit-mask-image:url(${catUrl});mask-image:url(${catUrl})"></div></div>` : ''}
      <span class="smap-node__play">▶</span>
    </button>`;
  } else {
    nodeHtml = `<button class="smap-node smap-node--cleared" data-stage="${n}">
      <img class="smap-node__cat" src="${getCatImage(catId)}" alt="">
    </button>`;
  }

  const stage = STAGES[n];
  const catCount = stage ? Math.log2(stage.goal) : 0;
  const boardLabel = stage ? stage.boardLabel : '';

  return `<div class="smap-slot" style="left:${xPct}%">
    <div class="smap-node-wrap">
      ${nodeHtml}
      <span class="smap-node__badge${isCurrent ? ' smap-node__badge--current' : ''}">${n}</span>
    </div>
    ${subDots()}
    <div class="smap-node__meta">
      <span class="smap-node__meta-cats">🐾 ${catCount}</span>
      <span class="smap-node__meta-board">${boardLabel}</span>
    </div>
  </div>`;
}
```

- [ ] **Step 4: `showStageDetail()` 서브스테이지 팝업으로 교체**

`showStageDetail(n)` 함수를 서브스테이지 선택 UI가 포함되도록 수정:

```js
function showStageDetail(n) {
  const stage = STAGES[n];
  if (!stage) return;

  const { stageNum: unlockedStageNum, subNum: unlockedSubNum } = parseStageId(getUnlockedStage());
  const isFullyCleared = n < unlockedStageNum;
  const isCurrent = n === unlockedStageNum;

  const goalCatId = Object.values(stage.cats)[0];
  const goalCatName = CAT_NAMES[goalCatId] || goalCatId;
  const collection = getCollection();

  // Build sub-stage rows
  const subRows = [1, 2, 3].map(sub => {
    const cfg = getSubStageConfig(n, sub);
    const subUnlocked = isFullyCleared || (isCurrent && sub <= unlockedSubNum);
    const subCleared = isFullyCleared || (isCurrent && sub < unlockedSubNum);
    const isCurSub = isCurrent && sub === unlockedSubNum;

    const statusIcon = subCleared ? '✅' : isCurSub ? '▶' : '🔒';
    const catCountLabel = `${catLineupUpTo(n, cfg.goal).length}마리`;

    return `<div class="stage-popup__sub${!subUnlocked ? ' stage-popup__sub--locked' : ''}">
      <span class="stage-popup__sub-icon">${statusIcon}</span>
      <div class="stage-popup__sub-info">
        <span class="stage-popup__sub-name">${n}-${sub}</span>
        <span class="stage-popup__sub-meta">${cfg.boardLabel} · ${catCountLabel} · 목표 ${cfg.goal.toLocaleString()}</span>
      </div>
      ${subUnlocked ? `<button class="stage-popup__sub-btn tds-btn tds-btn-primary" data-sub="${sub}">시작</button>` : ''}
    </div>`;
  }).join('');

  // Goal cat display
  const goalDiscovered = (collection.get(goalCatId) || 0) >= 1;
  const goalImgCls = goalDiscovered ? '' : ' stage-popup__goal-img--silhouette';

  const overlay = document.createElement('div');
  overlay.className = 'overlay-dimmer';
  overlay.innerHTML = `
    <div class="stage-popup">
      <div class="stage-popup__header">
        <span class="stage-popup__title">스테이지 ${n}</span>
        <button class="stage-popup__close" id="popup-close">✕</button>
      </div>
      <div class="stage-popup__body">
        <div class="stage-popup__goal">
          <img class="stage-popup__goal-img${goalImgCls}" src="${getCatImage(goalCatId)}" alt="${goalCatName}">
          <div class="stage-popup__goal-info">
            <span class="stage-popup__goal-name">${goalCatName}</span>
            <span class="stage-popup__goal-meta">목표 고양이</span>
          </div>
        </div>
        <div class="stage-popup__subs">${subRows}</div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById('popup-close').addEventListener('click', () => document.body.removeChild(overlay));
  overlay.addEventListener('click', e => { if (e.target === overlay) document.body.removeChild(overlay); });
  overlay.querySelectorAll('[data-sub]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      navigate(`play?stage=${n}-${btn.dataset.sub}`);
    });
  });
}

// Helper: cats in lineup up to a specific goal value
function catLineupUpTo(stageNum, goal) {
  return getStageCatLineup(stageNum).filter(({ value }) => value <= goal);
}
```

- [ ] **Step 5: 서브스테이지 점 CSS 추가 (`src/styles/main.css`)**

```css
/* Sub-stage dots */
.smap-subdots {
  display: flex;
  gap: 3px;
  justify-content: center;
  margin-top: 2px;
}
.smap-subdot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--tds-grey-200, #e0e0e0);
}
.smap-subdot--done {
  background: #FF6B35;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/ui/home.js src/styles/main.css
git commit -m "feat: show sub-stage progress dots on stage map nodes"
```

---

## Task 4: play.js — 서브스테이지 ID 파싱 및 동적 설정

**Files:**
- Modify: `src/ui/play.js`

- [ ] **Step 1: import 업데이트**

```js
import { getCatForValue, STAGES, CAT_NAMES, getCatImage, getStageCatLineup, getSubStageConfig, parseStageId } from '../game/stages.js';
```

- [ ] **Step 2: 스테이지 ID 파싱 변경**

기존:
```js
const stageId = params.infinite
  ? 'infinite'
  : parseInt(params.stage || '1', 10);
```

변경:
```js
const rawStageParam = params.stage || '1-1';
const isInfinite = !!params.infinite;
const stageId = isInfinite ? 'infinite' : rawStageParam; // e.g. "3-2"
const { stageNum, subNum } = isInfinite ? { stageNum: null, subNum: null } : parseStageId(stageId);
```

- [ ] **Step 3: stage 설정 로드 변경**

기존:
```js
const stage = stageId === 'infinite'
  ? { ...STAGES.infinite, rows: infiniteSize || 4, cols: infiniteSize || 4, size: infiniteSize || 4, boardKey: `inf_${infiniteSize || 4}` }
  : { ...STAGES[stageId], boardKey: stageId };
```

변경:
```js
const stage = isInfinite
  ? { ...STAGES.infinite, rows: infiniteSize || 4, cols: infiniteSize || 4, size: infiniteSize || 4, boardKey: `inf_${infiniteSize || 4}` }
  : getSubStageConfig(stageNum, subNum);

if (!stage) { navigate('home'); return; }
```

- [ ] **Step 4: 스테이지 목표 고양이 수집 제한 (핵심)**

**규칙:** 36종의 스테이지 목표 고양이는 해당 스테이지 X-3에서만 수집 가능.
X-1, X-2 또는 다른 스테이지에서 필러로 등장해도 수집되지 않음.
Common 5종(korean·russian·bombay·bengal·ragdoll)은 기존처럼 어디서나 수집 가능.

stages.js에서 import:
```js
import { ..., ALL_CATS_ORDERED } from '../game/stages.js';
```

play.js 상단(renderPlay 내부)에 추가:
```js
// Set of all 36 stage goal cat IDs
const ALL_STAGE_GOAL_CATS = new Set(
  Object.values(STAGES)
    .filter(s => s.id !== 'infinite')
    .flatMap(s => Object.values(s.cats))
);

// This stage's own goal cat (only collectable in X-3)
const ownGoalCatId = !isInfinite ? Object.values(stage.cats)[0] : null;
```

그리고 기존 수집 블록:
```js
if (!collectedThisGame.has(catId)) {
  collectedThisGame.add(catId);
  const count = addToCollection(catId);
  ...
}
```

를 아래로 교체:
```js
if (!collectedThisGame.has(catId)) {
  // Stage goal cats: only collectable in own stage X-3
  if (ALL_STAGE_GOAL_CATS.has(catId)) {
    if (isInfinite || catId !== ownGoalCatId || subNum !== 3) {
      // skip — not allowed to collect this cat here
    } else {
      collectedThisGame.add(catId);
      const count = addToCollection(catId);
      if (count > 0) newCatFinds.push({ catId, count });
      if (count === 1) firstFoundThisGame.add(catId);
    }
  } else {
    // Common/filler cats: always collectable
    collectedThisGame.add(catId);
    const count = addToCollection(catId);
    if (count > 0) newCatFinds.push({ catId, count });
    if (count === 1) firstFoundThisGame.add(catId);
  }
}
```

- [ ] **Step 5: 고양이 라인업 필터링 (목표값 기준)**

cat lineup을 sub-stage goal 기준으로 필터링:

기존:
```js
const allStageCats = stageId !== 'infinite'
  ? getStageCatLineup(stageId)
  : [];
```

변경:
```js
const allStageCats = !isInfinite
  ? getStageCatLineup(stageNum).filter(({ value }) => value <= stage.goal)
  : [];
```

- [ ] **Step 5: 승리 조건 체크 (변경 없음)**

현재 코드:
```js
if (stageId !== 'infinite' && !goalReached && stage.goal && board.hasValue(stage.goal)) {
```

`stage.goal`은 이미 `getSubStageConfig()`에서 동적으로 계산됨. 변경 불필요.

- [ ] **Step 6: `handleWin()` 서브스테이지 언락**

기존:
```js
if (typeof stageId === 'number') {
  unlockNextStage(stageId);
  if (stageId === 36) unlockInfinite();
}
const cats = [...firstFoundThisGame].join(',');
navigate(`result?stage=${stageId}&score=${currentScore}&clear=1&time=${elapsedSeconds}${cats ? '&cats=' + cats : ''}`);
```

변경:
```js
if (!isInfinite) {
  unlockNextStage(stageId); // stageId is "3-2" format
}
const cats = [...firstFoundThisGame].join(',');
navigate(`result?stage=${stageId}&score=${currentScore}&clear=1&time=${elapsedSeconds}${cats ? '&cats=' + cats : ''}`);
```

- [ ] **Step 7: `handleGameOver()` 업데이트**

기존:
```js
const stageParam = stageId === 'infinite' ? `infinite=${stage.size}` : `stage=${stageId}`;
```

변경 없음 — `stageId`가 이제 `"3-2"` 형태이므로 자동으로 올바른 URL 생성.

- [ ] **Step 8: Commit**

```bash
git add src/ui/play.js
git commit -m "feat: load sub-stage config dynamically in play screen"
```

---

## Task 5: result.js — 서브스테이지 결과 화면

**Files:**
- Modify: `src/ui/result.js`

- [ ] **Step 1: import 업데이트**

```js
import { navigate, getHashParams } from '../core/router.js';
import { getBestScore, getBestTime } from '../game/score.js';
import { getCatImage, CAT_NAMES, STAGES, parseStageId, getSubStageConfig } from '../game/stages.js';
```

- [ ] **Step 2: 스테이지 ID 파싱 변경**

기존:
```js
const stageId = isInfinite ? 'infinite' : parseInt(params.stage || '1', 10);
```

변경:
```js
const rawStage = params.stage || '1-1';
const stageId = isInfinite ? 'infinite' : rawStage; // "3-2"
const { stageNum, subNum } = isInfinite ? {} : parseStageId(stageId);
const stageCfg = !isInfinite ? getSubStageConfig(stageNum, subNum) : null;
```

- [ ] **Step 3: stageLabel 변경**

기존:
```js
const stageLabel = isInfinite
  ? `무한모드 ${infiniteSize}×${infiniteSize}`
  : `Stage ${stageId}`;
```

변경:
```js
const stageLabel = isInfinite
  ? `무한모드 ${infiniteSize}×${infiniteSize}`
  : `Stage ${stageNum}-${subNum}`;
```

- [ ] **Step 4: 다음 스테이지 버튼 로직 변경**

기존:
```js
${!isInfinite && STAGES[stageId + 1] ? `
<button ... id="next-stage-btn">다음 스테이지로</button>` : ''}
```

변경:
```js
// Determine next sub-stage
const hasNextStage = !isInfinite && (subNum < 3 || stageNum < 36);
const nextSubLabel = subNum < 3
  ? `${stageNum}-${subNum + 1} 도전`
  : stageNum < 36 ? `${stageNum + 1}-1 도전` : '';

${hasNextStage ? `
<button class="tds-btn result-btn-brand tds-btn-xl tds-btn-block" id="next-stage-btn">
  ${nextSubLabel}
</button>` : ''}
```

- [ ] **Step 5: 다음 스테이지 버튼 이벤트 변경**

기존:
```js
nextBtn.addEventListener('click', () => {
  navigate(`play?stage=${stageId + 1}`);
});
```

변경:
```js
nextBtn.addEventListener('click', () => {
  const nextId = subNum < 3
    ? `${stageNum}-${subNum + 1}`
    : `${stageNum + 1}-1`;
  navigate(`play?stage=${nextId}`);
});
```

- [ ] **Step 6: replay 버튼 스테이지 파라미터 확인**

기존:
```js
const p = isInfinite ? `infinite=${infiniteSize}` : `stage=${stageId}`;
```

`stageId`가 이제 `"3-2"` 형태이므로 변경 불필요. ✓

- [ ] **Step 7: Commit**

```bash
git add src/ui/result.js
git commit -m "feat: update result screen for sub-stage labels and navigation"
```

---

## Task 6: 통합 검증

- [ ] **Step 1: 새 게임 진입 확인**

`npx granite dev` 실행 후 `localhost:4012` 접속.
- 스테이지 맵에서 Stage 1 노드 클릭
- 팝업에서 1-1, 1-2, 1-3 서브스테이지 보임
- 1-1만 "시작" 버튼 활성화 확인

- [ ] **Step 2: 1-1 클리어 플로우**

- 1-1 시작 → 7×7 보드 확인 (S1 기본은 5×5이므로 X-1=7×7)
- 스코티시(64) 합성 → 클리어 팝업
- 결과 화면: "Stage 1-1" 레이블, "1-2 도전" 버튼 확인
- 홈 돌아가면 Stage 1 노드에 점 1개 채워짐(●○○)

- [ ] **Step 3: 1-3 클리어 후 다음 스테이지 언락**

- 1-2, 1-3 클리어
- Stage 1 노드: ●●● (3개 모두 채워짐)
- Stage 2 노드: 언락 (현재 노드로 강조)

- [ ] **Step 4: 기존 유저 마이그레이션 확인**

브라우저 콘솔에서:
```js
localStorage.setItem('nyang2048_stage_unlocked', '5'); // 구버전 시뮬레이션
location.reload();
```
홈 화면에서 Stage 5가 현재 스테이지로 표시되고 `localStorage`가 `"5-1"`로 자동 변환됨 확인.

- [ ] **Step 5: 단위 테스트 실행**

```bash
node --test src/game/score.test.js
```
기존 테스트 모두 통과 확인.

- [ ] **Step 6: 최종 Commit**

```bash
git add -A
git commit -m "feat: sub-stage system complete — 36 stages expanded to 108"
```

---

## 참고: 서브스테이지 보드 매핑 요약

| 현재 보드 | 1-1 (쉬움) | 1-2 (보통) | 1-3 (현재) |
|----------|-----------|-----------|-----------|
| 3×3 | 4×4 | 4×3 | 3×3 |
| 4×3 | 5×5 | 4×4 | 4×3 |
| 4×4 | 6×6 | 5×5 | 4×4 |
| 5×5 | 7×7 | 6×6 | 5×5 |
| 6×6 | 8×8 | 7×7 | 6×6 |
| 7×7 | 8×8, N-1마리 | 8×8 | 7×7 |
| 8×8 | 8×8, N-2마리 | 8×8, N-1마리 | 8×8 |
