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
  return parseInt(localStorage.getItem(STAGE_KEY) || '1', 10);
}

export function unlockNextStage(current) {
  const currentUnlocked = getUnlockedStage();
  const next = typeof current === 'number' ? current + 1 : 2;
  if (next > currentUnlocked && next <= 5) {
    localStorage.setItem(STAGE_KEY, String(next));
  }
}

export function isInfiniteUnlocked() {
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
export function getCollection() {
  try {
    return new Set(JSON.parse(localStorage.getItem(COLLECTION_KEY) || '[]'));
  } catch { return new Set(); }
}

export function addToCollection(catId) {
  const col = getCollection();
  if (col.has(catId)) return false;
  col.add(catId);
  localStorage.setItem(COLLECTION_KEY, JSON.stringify([...col]));
  return true;
}

export function getCollectionCount() {
  return getCollection().size;
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
