import { Board } from '../game/board.js';
import { Renderer } from '../game/renderer.js';
import { attachSwipeListener } from '../game/input.js';
import { getCatForValue, STAGES } from '../game/stages.js';
import {
  getBestScore, saveBestScore,
  addToCollection,
  saveBoard, loadBoard, clearBoard,
  unlockNextStage, unlockInfinite, isInfiniteUnlocked
} from '../game/score.js';
import { navigate, getHashParams } from '../core/router.js';

export function renderPlay() {
  const params = getHashParams();
  const stageId = params.infinite
    ? 'infinite'
    : parseInt(params.stage || '1', 10);
  const infiniteSize = params.infinite ? parseInt(params.infinite, 10) : null;

  const stage = stageId === 'infinite'
    ? { ...STAGES.infinite, size: infiniteSize || 4, boardKey: `inf_${infiniteSize || 4}` }
    : { ...STAGES[stageId], boardKey: stageId };

  if (!stage) { navigate('home'); return; }

  const app = document.getElementById('app');

  function renderUI(currentScore, bestScore) {
    app.innerHTML = `
      <div class="play-screen">
        <div class="play-topbar">
          <div class="play-stage-label">${stageId === 'infinite' ? `무한 ${stage.size}×${stage.size}` : `Stage ${stageId}`}</div>
          <div class="play-scores">
            <div class="score-box">
              <div class="score-box__label">점수</div>
              <div class="score-box__value" id="score-display">${currentScore}</div>
            </div>
            <div class="score-box">
              <div class="score-box__label">최고</div>
              <div class="score-box__value" id="best-display">${bestScore}</div>
            </div>
          </div>
        </div>
        <div class="play-board-wrap">
          <div class="board-container" id="board-container"></div>
        </div>
        <div class="play-actions">
          <button class="action-btn" id="undo-btn">
            <span class="action-btn__icon">↩️</span>
            <span class="action-btn__label">되돌리기</span>
          </button>
          <button class="action-btn" id="home-btn">
            <span class="action-btn__icon">🏠</span>
            <span class="action-btn__label">홈</span>
          </button>
          <button class="action-btn" id="restart-btn">
            <span class="action-btn__icon">🔄</span>
            <span class="action-btn__label">재시작</span>
          </button>
        </div>
      </div>
    `;
  }

  let bestScore = getBestScore(stage.boardKey);
  renderUI(0, bestScore);

  const boardContainer = document.getElementById('board-container');

  // Try to restore saved board
  let board;
  let currentScore = 0;
  const saved = loadBoard(stage.boardKey);

  if (saved) {
    board = new Board(stage.size);
    board.restoreSnapshot(saved);
    currentScore = board.score;
  } else {
    board = new Board(stage.size);
    for (let i = 0; i < stage.initialTiles; i++) board.addRandomTile();
    // Register common cats on first game
    addToCollection('korean');
    addToCollection('russian');
  }

  let renderer = new Renderer(boardContainer, stage.size, stageId);
  let snapshot = null; // For undo
  let goalReached = false;
  let adShowing = false;

  function updateScoreDisplay() {
    const el = document.getElementById('score-display');
    const bestEl = document.getElementById('best-display');
    if (el) el.textContent = currentScore.toLocaleString();
    if (bestEl) bestEl.textContent = Math.max(currentScore, bestScore).toLocaleString();
  }

  function doRender() {
    renderer.renderBoard(board.grid);
    updateScoreDisplay();
  }

  requestAnimationFrame(() => doRender());

  function saveCurrentBoard() {
    saveBoard(stage.boardKey, board.getSnapshot());
  }

  function showToast(msg) {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  async function handleSwipe(direction) {
    if (adShowing) return;

    snapshot = board.getSnapshot();
    const prevGrid = board.grid.map(r => [...r]);
    const result = board.move(direction);
    if (!result.moved) return;

    currentScore = board.score;
    if (currentScore > bestScore) {
      bestScore = currentScore;
      saveBestScore(stage.boardKey, bestScore);
    }

    // Check for new cats from merges
    checkNewCatsInGrid(board.grid);

    renderer.animateMove(prevGrid, board.grid, result.newTile);
    updateScoreDisplay();

    // Haptic
    if (window.AIT) AIT.haptic('light');

    saveCurrentBoard();

    // Check win (not infinite)
    if (stageId !== 'infinite' && !goalReached && stage.goal && board.hasValue(stage.goal)) {
      goalReached = true;
      setTimeout(() => handleWin(), 400);
      return;
    }

    // Check game over
    if (!board.canMove()) {
      setTimeout(() => handleGameOver(), 400);
    }
  }

  function checkNewCatsInGrid(grid) {
    for (let r = 0; r < stage.size; r++) {
      for (let c = 0; c < stage.size; c++) {
        const v = grid[r][c];
        if (v <= 4) continue; // common cats handled separately
        const catId = getCatForValue(stageId, v);
        if (catId) {
          const isNew = addToCollection(catId);
          if (isNew) {
            showToast(`새 고양이 발견! 🐱`);
          }
        }
      }
    }
  }

  function handleWin() {
    clearBoard(stage.boardKey);
    // Unlock next stage
    if (typeof stageId === 'number') {
      unlockNextStage(stageId);
      if (stageId === 5) unlockInfinite();
    }
    const score = currentScore;
    navigate(`result?stage=${stageId}&score=${score}&clear=1`);
  }

  function handleGameOver() {
    clearBoard(stage.boardKey);
    const score = currentScore;
    const stageParam = stageId === 'infinite' ? `infinite=${stage.size}` : `stage=${stageId}`;
    navigate(`result?${stageParam}&score=${score}&clear=0`);
  }

  // Undo
  document.getElementById('undo-btn').addEventListener('click', async () => {
    if (!snapshot || adShowing) return;
    adShowing = true;
    if (window.AIT) await AIT.showAd('interstitial');
    adShowing = false;
    board.restoreSnapshot(snapshot);
    currentScore = board.score;
    snapshot = null;
    doRender();
    saveCurrentBoard();
  });

  // Home
  document.getElementById('home-btn').addEventListener('click', async () => {
    if (adShowing) return;
    adShowing = true;
    if (window.AIT) await AIT.showAd('interstitial');
    adShowing = false;
    saveCurrentBoard();
    navigate('home');
  });

  // Restart
  document.getElementById('restart-btn').addEventListener('click', async () => {
    if (adShowing) return;
    adShowing = true;
    if (window.AIT) await AIT.showAd('interstitial');
    adShowing = false;
    clearBoard(stage.boardKey);
    board = new Board(stage.size);
    for (let i = 0; i < stage.initialTiles; i++) board.addRandomTile();
    currentScore = 0;
    snapshot = null;
    goalReached = false;
    renderer.destroy();
    renderer = new Renderer(boardContainer, stage.size, stageId);
    requestAnimationFrame(() => doRender());
  });

  const removeSwipe = attachSwipeListener(boardContainer, handleSwipe);

  return () => {
    removeSwipe();
    renderer.destroy();
    const t = document.querySelector('.toast');
    if (t) t.remove();
  };
}
