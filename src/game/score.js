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
  if (DEBUG_MODE) return 20;
  return parseInt(localStorage.getItem(STAGE_KEY) || '1', 10);
}

export function unlockNextStage(current) {
  const currentUnlocked = getUnlockedStage();
  const next = typeof current === 'number' ? current + 1 : 2;
  if (next > currentUnlocked && next <= 20) {
    localStorage.setItem(STAGE_KEY, String(next));
  }
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

// ── Stage Stars ──
const STARS_KEY = 'nyang2048_stars';

export function getStars(stageId) {
  try {
    const data = JSON.parse(localStorage.getItem(STARS_KEY) || '{}');
    return data[stageId] || 0;
  } catch { return 0; }
}

export function saveStars(stageId, stars) {
  try {
    const data = JSON.parse(localStorage.getItem(STARS_KEY) || '{}');
    if (stars > (data[stageId] || 0)) {
      data[stageId] = stars;
      localStorage.setItem(STARS_KEY, JSON.stringify(data));
    }
  } catch {}
}

// ── Stage Medals ──
export function saveMedal(stageId, medal) {
  // medal: 'bronze' | 'silver' | 'gold'
  // Only upgrade, never downgrade
  const key = `medal_${stageId}`;
  const current = localStorage.getItem(key);
  const rank = { bronze: 1, silver: 2, gold: 3 };
  if (!current || rank[medal] > rank[current]) {
    localStorage.setItem(key, medal);
  }
}

export function getMedal(stageId) {
  // Returns 'bronze' | 'silver' | 'gold' | null
  return localStorage.getItem(`medal_${stageId}`);
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
