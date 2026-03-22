// ── Debug Mode ── (set to false for production)
export let DEBUG_MODE = false;

export function enableDebugMode() {
  DEBUG_MODE = true;
}

const SCORES_KEY = 'nyang2048_scores';
const COLLECTION_KEY = 'nyang2048_collection';
const STAGE_KEY = 'nyang2048_stage_unlocked';
const INFINITE_KEY = 'nyang2048_infinite_unlocked';
const TUTORIAL_KEY = 'nyang2048_tutorial_done';

// ── Scores ──
export function getBestScore(stageId) {
  try {
    const scores = JSON.parse(localStorage.getItem(SCORES_KEY) || '{}');
    return scores[stageId] || 0;
  } catch { return 0; }
}

export function saveBestScore(stageId, score) {
  try {
    const scores = JSON.parse(localStorage.getItem(SCORES_KEY) || '{}');
    if (score > (scores[stageId] || 0)) {
      scores[stageId] = score;
      localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
      return true;
    }
    return false;
  } catch { return false; }
}

// ── Stage Unlock ──
export function getUnlockedStage() {
  if (DEBUG_MODE) return '36-3';
  const raw = localStorage.getItem(STAGE_KEY) || '1-1';
  // Migrate legacy integer format
  if (!raw.includes('-')) {
    const migrated = `${raw}-1`;
    localStorage.setItem(STAGE_KEY, migrated);
    return migrated;
  }
  return raw;
}

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

export function isInfiniteUnlocked() {
  if (DEBUG_MODE) return true;
  return localStorage.getItem(INFINITE_KEY) === 'true';
}

export function unlockInfinite() {
  localStorage.setItem(INFINITE_KEY, 'true');
}

// ── Tutorial ──
export function isTutorialDone() {
  return localStorage.getItem(TUTORIAL_KEY) === 'true';
}

export function completeTutorial() {
  localStorage.setItem(TUTORIAL_KEY, 'true');
}

// ── Collection ──
export const COLLECTION_MAX = 3; // finds needed to fully collect

export function getCollection() {
  try {
    const raw = JSON.parse(localStorage.getItem(COLLECTION_KEY) || '{}');
    // Migrate old array format → {catId: COLLECTION_MAX}
    if (Array.isArray(raw)) {
      const migrated = {};
      raw.forEach(id => { migrated[id] = COLLECTION_MAX; });
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(migrated));
      return new Map(Object.entries(migrated).map(([k, v]) => [k, Number(v)]));
    }
    return new Map(Object.entries(raw).map(([k, v]) => [k, Number(v)]));
  } catch { return new Map(); }
}

// Returns the new count after adding (1, 2, or 3)
export function addToCollection(catId) {
  const col = getCollection();
  const prev = col.get(catId) || 0;
  if (prev >= COLLECTION_MAX) return null; // already complete, no change
  const next = prev + 1;
  col.set(catId, next);
  const obj = {};
  col.forEach((v, k) => { obj[k] = v; });
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(obj));
  return next;
}

export function getCatCount(catId) {
  return getCollection().get(catId) || 0;
}

export function getCollectionCount(total) {
  if (DEBUG_MODE && total) return total;
  let count = 0;
  getCollection().forEach(v => { if (v >= COLLECTION_MAX) count++; });
  return count;
}

// ── Best Time ──
const TIMES_KEY = 'nyang2048_times';

export function getBestTime(stageId) {
  try {
    const times = JSON.parse(localStorage.getItem(TIMES_KEY) || '{}');
    return times[stageId] ?? null;
  } catch { return null; }
}

export function saveBestTime(stageId, seconds) {
  try {
    const times = JSON.parse(localStorage.getItem(TIMES_KEY) || '{}');
    const prev = times[stageId];
    if (prev == null || seconds < prev) {
      times[stageId] = seconds;
      localStorage.setItem(TIMES_KEY, JSON.stringify(times));
      return true;
    }
    return false;
  } catch { return false; }
}

// ── Board Auto-save ──
function boardKey(stageId) {
  if (stageId === 'infinite' || typeof stageId === 'string' && stageId.startsWith('inf')) {
    return `nyang2048_last_board_${stageId}`;
  }
  return `nyang2048_last_board_s${stageId}`;
}

export function saveBoard(stageId, boardState) {
  try {
    localStorage.setItem(boardKey(stageId), JSON.stringify(boardState));
  } catch {}
}

export function loadBoard(stageId) {
  try {
    const data = localStorage.getItem(boardKey(stageId));
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export function clearBoard(stageId) {
  localStorage.removeItem(boardKey(stageId));
}

export function findSavedBoard() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nyang2048_last_board_')) {
        const data = localStorage.getItem(key);
        if (data) {
          const suffix = key.slice('nyang2048_last_board_'.length);
          if (suffix.startsWith('s')) {
            const stageId = suffix.slice(1);
            return { stageId, navHash: `play?stage=${stageId}` };
          } else if (suffix.startsWith('inf')) {
            const size = suffix.includes('_') ? suffix.split('_')[1] : '4';
            return { stageId: suffix, navHash: `play?infinite=${size}` };
          }
        }
      }
    }
  } catch {}
  return null;
}
