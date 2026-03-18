import { Board } from '../game/board.js';
import { Renderer } from '../game/renderer.js';
import { attachSwipeListener } from '../game/input.js';
import { getCatForValue, STAGES, CAT_NAMES, getCatImage, getStageCatLineup, STAGE_MEDAL_TARGETS } from '../game/stages.js';
import {
  addToCollection, COLLECTION_MAX,
  getBestScore, getBestTime,
  saveBestScore, saveBestTime,
  saveBoard, loadBoard, clearBoard,
  unlockNextStage, unlockInfinite, isInfiniteUnlocked,
  saveMedal
} from '../game/score.js';
import { navigate, getHashParams } from '../core/router.js';
import { ICON } from '../core/icons.js';

export function renderPlay() {
  // Undo charge system (3 charges, refill via interstitial)
  function getUndoCharges() {
    return parseInt(localStorage.getItem('nyang-undo-charges') || '3', 10);
  }
  function setUndoCharges(n) {
    localStorage.setItem('nyang-undo-charges', String(Math.max(0, n)));
  }
  if (localStorage.getItem('nyang-undo-charges') === null) setUndoCharges(3);

  function updateUndoLabel() {
    const badge = document.querySelector('.undo-charge-badge');
    const label = document.querySelector('#undo-btn .play-action-card__label');
    if (!badge) return;
    const charges = getUndoCharges();
    badge.textContent = charges === 0 ? '모두 사용' : `${charges}회 남음`;
    badge.className = `undo-charge-badge${charges === 0 ? ' undo-charge-badge--empty' : ''}`;
    if (label) label.innerHTML = charges === 0 ? `${ICON.ad} 3회 채우기` : '무르기';
  }

  // Show interstitial if user has already played 1+ game today
  async function maybeShowInterstitial() {
    if (!window.AIT) return;
    const count = AIT.getTodayGameCount();
    if (count >= 1 && AIT.isToss) {
      await AIT.showAd('interstitial').catch(() => {});
    }
  }

  const params = getHashParams();
  const stageId = params.infinite
    ? 'infinite'
    : parseInt(params.stage || '1', 10);
  const infiniteSize = params.infinite ? parseInt(params.infinite, 10) : null;

  const stage = stageId === 'infinite'
    ? { ...STAGES.infinite, rows: infiniteSize || 4, cols: infiniteSize || 4, size: infiniteSize || 4, boardKey: `inf_${infiniteSize || 4}` }
    : { ...STAGES[stageId], boardKey: stageId };

  if (!stage) { navigate('home'); return; }

  const app = document.getElementById('app');

  // Build full cat lineup for this stage (common + filler + collectible)
  const allStageCats = stageId !== 'infinite'
    ? getStageCatLineup(stageId)
    : [];
  const collectibleCatIds = new Set(stage.cats ? Object.values(stage.cats) : []);

  function renderCatLineup() {
    if (allStageCats.length === 0) return '';
    const chips = allStageCats.map(({ catId }) => {
      const found = discoveredThisGame.has(catId);
      const isCollectible = collectibleCatIds.has(catId);
      const name = CAT_NAMES[catId] || catId;
      const imgSrc = getCatImage(catId);
      const classes = ['play-cat-chip'];
      if (found) classes.push('play-cat-chip--found');
      if (isCollectible) classes.push('play-cat-chip--collectible');
      return `
        <div class="${classes.join(' ')}" data-cat="${catId}">
          <img src="${imgSrc}" alt="${name}">
        </div>`;
    }).join('');
    const total = allStageCats.length;
    const cols = total > 8 ? Math.ceil(total / 2) : total;
    const style = total > 8 ? `style="display:grid;grid-template-columns:repeat(${cols},34px)"` : '';
    return `<div class="play-cat-lineup" ${style}>${chips}</div>`;
  }

  function updateCatLineup() {
    const container = document.querySelector('.play-cat-lineup');
    if (!container) return;
    allStageCats.forEach(({ catId }) => {
      const chip = container.querySelector(`[data-cat="${catId}"]`);
      if (!chip) return;
      const found = discoveredThisGame.has(catId);
      if (found && !chip.classList.contains('play-cat-chip--found')) {
        chip.classList.add('play-cat-chip--found');
      }
    });
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  let elapsedSeconds = 0;
  let timerInterval = null;

  function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      elapsedSeconds++;
      const el = document.getElementById('time-display');
      if (el) el.textContent = formatTime(elapsedSeconds);
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  const bestScore = getBestScore(stage.boardKey) || 0;
  const bestTime = getBestTime(stage.boardKey);
  const bestTimeStr = bestTime ? formatTime(bestTime) : '--:--';

  function renderUI(currentScore) {
    app.innerHTML = `
      <div class="play-screen">
        <div class="play-header">
          <div class="play-header__block">
            <div class="play-header__current">
              <span class="play-header__label">점수</span>
              <span class="play-header__value" id="score-display">${currentScore}</span>
            </div>
            <div class="play-header__best-wrap">
              <span class="play-header__label">최고</span>
              <span class="play-header__best" id="best-score-display">${bestScore.toLocaleString()}</span>
            </div>
          </div>
          <div class="play-header__block">
            <div class="play-header__current">
              <span class="play-header__label">시간</span>
              <span class="play-header__value" id="time-display">${formatTime(elapsedSeconds)}</span>
            </div>
            <div class="play-header__best-wrap">
              <span class="play-header__label">최단</span>
              <span class="play-header__best" id="best-time-display">${bestTimeStr}</span>
            </div>
          </div>
        </div>
        <div class="play-board-wrap">
          ${renderCatLineup()}
          <div class="board-container" id="board-container"></div>
        </div>
        <div class="play-bottom-actions">
          <button class="play-action-card" id="home-btn" aria-label="홈">
            <span class="play-action-card__icon">${ICON.home}</span>
            <span class="play-action-card__label">홈</span>
          </button>
          <button class="play-action-card" id="undo-btn" aria-label="되돌리기">
            <span class="undo-charge-badge${getUndoCharges() === 0 ? ' undo-charge-badge--empty' : ''}">${getUndoCharges() === 0 ? '모두 사용' : `${getUndoCharges()}회 남음`}</span>
            <span class="play-action-card__icon">${ICON.undo}</span>
            <span class="play-action-card__label">${getUndoCharges() === 0 ? `${ICON.ad} 3회 채우기` : '무르기'}</span>
          </button>
          <button class="play-action-card" id="restart-btn" aria-label="재시작">
            <span class="play-action-card__icon">${ICON.restart}</span>
            <span class="play-action-card__label">다시 시작</span>
          </button>
        </div>
        <div class="ad-banner-container ad-banner-container--bottom" id="play-banner-ad"></div>
      </div>
    `;
  }

  const discoveredThisGame = new Set(['korean', 'russian']); // common cats always visible
  const collectedThisGame = new Set(); // limit collection +1 per cat per play
  const firstFoundThisGame = new Set(); // truly first discovery (count === 1)

  renderUI(0);
  if (window.AIT) AIT.loadBannerAd('play-banner-ad');
  // Track game count for interstitial logic
  if (window.AIT) AIT.incrementTodayGameCount();

  const boardContainer = document.getElementById('board-container');

  let board;
  let currentScore = 0;
  const saved = loadBoard(stage.boardKey);

  if (saved) {
    board = new Board(stage.rows, stage.cols);
    board.restoreSnapshot(saved);
    currentScore = board.score;
  } else {
    board = new Board(stage.rows, stage.cols);
    for (let i = 0; i < stage.initialTiles; i++) board.addRandomTile();
    addToCollection('korean');
    addToCollection('russian');
  }

  let renderer = new Renderer(boardContainer, stage.rows, stage.cols, stageId);
  let history = []; // stack of snapshots for consecutive undo
  let goalReached = false;
  let splashShowing = false;
  let usedUndo = false;
  let highestValue = 0;
  // Calculate initial highest value from board
  for (let r = 0; r < board.rows; r++)
    for (let c = 0; c < board.cols; c++)
      if (board.grid[r][c] > highestValue) highestValue = board.grid[r][c];
  function updateScoreDisplay() {
    const el = document.getElementById('score-display');
    if (el) el.textContent = currentScore.toLocaleString();
  }

  function doRender() {
    renderer.renderBoard(board.grid, board.ids);
    updateScoreDisplay();
  }

  requestAnimationFrame(() => doRender());
  startTimer();

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

  function showCatSplash(catId, count, onDone) {
    splashShowing = true;
    const name = CAT_NAMES[catId] || catId;
    const imgSrc = getCatImage(catId);
    const remaining = COLLECTION_MAX - count;
    const isComplete = count >= COLLECTION_MAX;

    const badge = isComplete ? '수집 완료! 🎉' : count === 1 ? '처음 발견!' : `${count}번째 발견!`;
    const sub = isComplete
      ? `${name}을(를) 완전히 수집했어요`
      : `앞으로 ${remaining}번 더 발견하면 수집돼요`;
    const dots = Array.from({ length: COLLECTION_MAX }, (_, i) =>
      `<span class="cat-splash__dot ${i < count ? 'cat-splash__dot--filled' : ''}"></span>`
    ).join('');

    const splash = document.createElement('div');
    splash.className = `cat-splash ${isComplete ? 'cat-splash--complete' : ''}`;
    splash.innerHTML = `
      <div class="cat-splash__inner">
        <div class="cat-splash__badge">${badge}</div>
        <img class="cat-splash__img" src="${imgSrc}" alt="${name}">
        <div class="cat-splash__name">${name}</div>
        <div class="cat-splash__dots">${dots}</div>
        <div class="cat-splash__sub">${sub}</div>
        <div class="cat-splash__hint">탭하거나 아무 키나 눌러 계속</div>
      </div>
    `;
    document.body.appendChild(splash);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => splash.classList.add('cat-splash--visible'));
    });

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      document.removeEventListener('keydown', onKey);
      splash.classList.remove('cat-splash--visible');
      setTimeout(() => {
        splash.remove();
        splashShowing = false;
        onDone();
      }, 300);
    };
    const onKey = () => dismiss();

    splash.addEventListener('click', dismiss);
    document.addEventListener('keydown', onKey);
    setTimeout(dismiss, 2500);
  }

  function showLastCatOverlay(catId, onDone) {
    splashShowing = true;
    const name = CAT_NAMES[catId] || catId;
    const imgSrc = getCatImage(catId);

    const overlay = document.createElement('div');
    overlay.className = 'last-cat-overlay';
    overlay.innerHTML = `
      <div class="last-cat-overlay__inner">
        <div class="last-cat-overlay__title">마지막 고양이 발견!</div>
        <img class="last-cat-overlay__img" src="${imgSrc}" alt="${name}">
        <div class="last-cat-overlay__name">${name}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('last-cat-overlay--visible'));
    });

    // Confetti after a short delay
    setTimeout(() => {
      const colors = ['#FF6B35', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c'];
      for (let i = 0; i < 60; i++) {
        setTimeout(() => {
          const el = document.createElement('div');
          el.className = 'confetti-piece';
          el.style.left = Math.random() * 100 + 'vw';
          el.style.background = colors[Math.floor(Math.random() * colors.length)];
          el.style.animationDuration = (1.5 + Math.random() * 2) + 's';
          el.style.animationDelay = '0s';
          el.style.width = el.style.height = (6 + Math.random() * 8) + 'px';
          document.documentElement.appendChild(el);
          setTimeout(() => el.remove(), 3500);
        }, i * 40);
      }
    }, 500);

    // Navigate to result after overlay
    setTimeout(() => {
      overlay.classList.remove('last-cat-overlay--visible');
      setTimeout(() => {
        overlay.remove();
        splashShowing = false;
        onDone();
      }, 300);
    }, 2500);
  }

  async function handleSwipe(direction) {
    if (splashShowing || renderer.animating) return;

    history.push(board.getSnapshot());
    if (history.length > 10) history.shift();
    const result = board.move(direction);
    if (!result.moved) return;

    currentScore = board.score;

    // Check for new cat finds — only count newly merged tiles
    const newCatFinds = []; // {catId, count}
    const seen = new Set();
    for (const m of result.movements) {
      if (!m.merged) continue;
      if (seen.has(m.newId)) continue; // each merge pair produces 2 entries with same newId
      seen.add(m.newId);
      const mergedValue = board.grid[m.toR][m.toC];
      if (mergedValue <= 4) continue;
      const catId = getCatForValue(stageId, mergedValue);
      if (!catId) continue;
      // Reveal in lineup (all cats)
      if (!discoveredThisGame.has(catId)) {
        discoveredThisGame.add(catId);
        updateCatLineup();
      }
      // Collection: any discovered cat counts, once per cat per play
      if (!collectedThisGame.has(catId)) {
        collectedThisGame.add(catId);
        const count = addToCollection(catId);
        if (count > 0) newCatFinds.push({ catId, count });
        if (count === 1) firstFoundThisGame.add(catId);
      }
    }

    // Check if a new highest tile value was created
    let newHighest = false;
    const seen2 = new Set();
    for (const m of result.movements) {
      if (!m.merged) continue;
      if (seen2.has(m.newId)) continue;
      seen2.add(m.newId);
      const mergedValue = board.grid[m.toR][m.toC];
      if (mergedValue > highestValue) {
        highestValue = mergedValue;
        newHighest = true;
      }
    }

    // Find max merged value for haptic & visual intensity
    const seen3 = new Set();
    let maxMergedValue = 0;
    for (const m of result.movements) {
      if (!m.merged || seen3.has(m.newId)) continue;
      seen3.add(m.newId);
      const v = board.grid[m.toR][m.toC];
      if (v > maxMergedValue) maxMergedValue = v;
    }
    const highMerge = maxMergedValue >= 128;

    renderer.animateMove(result.movements, board.grid, result.newTile, { shake: newHighest, highMerge });
    updateScoreDisplay();

    // Haptic: heavy for new highest or high merge, medium for any merge, light for move
    const hapticLevel = (newHighest || highMerge) ? 'heavy' : maxMergedValue > 0 ? 'medium' : 'light';
    if (window.AIT) AIT.haptic(hapticLevel);
    saveCurrentBoard();

    const continueGame = () => {
      // Check win
      if (stageId !== 'infinite' && !goalReached && stage.goal && board.hasValue(stage.goal)) {
        goalReached = true;
        const goalCatId = getCatForValue(stageId, stage.goal);
        if (goalCatId) {
          showLastCatOverlay(goalCatId, () => handleWin());
        } else {
          setTimeout(() => handleWin(), 400);
        }
        return;
      }
      // Check game over
      if (!board.canMove()) {
        setTimeout(() => handleGameOver(), 400);
      }
    };

    if (newCatFinds.length > 0) {
      let i = 0;
      const showNext = () => {
        if (i < newCatFinds.length) {
          const { catId, count } = newCatFinds[i++];
          showCatSplash(catId, count, showNext);
        } else {
          continueGame();
        }
      };
      setTimeout(showNext, 200);
    } else {
      continueGame();
    }
  }

  function calcMedal(stageId, score) {
    const targets = STAGE_MEDAL_TARGETS[stageId];
    if (!targets) return 'bronze';
    if (score >= targets.gold) return 'gold';
    if (score >= targets.silver) return 'silver';
    return 'bronze';
  }

  function handleWin() {
    stopTimer();
    backGuardActive = false;
    window.removeEventListener('popstate', onPopState);
    saveBestScore(stage.boardKey, currentScore);
    saveBestTime(stage.boardKey, elapsedSeconds);
    clearBoard(stage.boardKey);
    if (typeof stageId === 'number') {
      unlockNextStage(stageId);
      if (stageId === 20) unlockInfinite();
      const medal = calcMedal(stageId, currentScore);
      saveMedal(stageId, medal);
    }
    const medal = typeof stageId === 'number' ? calcMedal(stageId, currentScore) : null;
    const cats = [...firstFoundThisGame].join(',');
    navigate(`result?stage=${stageId}&score=${currentScore}&clear=1&time=${elapsedSeconds}${cats ? '&cats=' + cats : ''}${medal ? '&medal=' + medal : ''}`);
  }

  function handleGameOver() {
    stopTimer();
    backGuardActive = false;
    window.removeEventListener('popstate', onPopState);
    clearBoard(stage.boardKey);
    const stageParam = stageId === 'infinite' ? `infinite=${stage.size}` : `stage=${stageId}`;
    const cats = [...firstFoundThisGame].join(',');
    navigate(`result?${stageParam}&score=${currentScore}&clear=0&time=${elapsedSeconds}${cats ? '&cats=' + cats : ''}`);
  }

  // Undo
  document.getElementById('undo-btn').addEventListener('click', async () => {
    if (history.length === 0 || splashShowing) return;

    const charges = getUndoCharges();

    if (charges > 0) {
      setUndoCharges(charges - 1);
      usedUndo = true;
      board.restoreSnapshot(history.pop());
      currentScore = board.score;
      doRender();
      saveCurrentBoard();
      updateUndoLabel();
    } else {
      // No charges — show interstitial to refill
      if (window.AIT) {
        const result = await AIT.showAd('interstitial').catch(() => ({ success: false }));
        if (result.success) {
          setUndoCharges(3);
          updateUndoLabel();
          showToast('무르기 3회 충전됐어요!');
          usedUndo = true;
          board.restoreSnapshot(history.pop());
          currentScore = board.score;
          doRender();
          saveCurrentBoard();
          updateUndoLabel();
        } else {
          showToast('광고를 불러올 수 없어요.');
        }
      }
    }
  });

  // Home – confirm before leaving
  document.getElementById('home-btn').addEventListener('click', () => {
    if (splashShowing) return;
    showExitConfirm();
  });

  function showExitConfirm() {
    const overlay = document.createElement('div');
    overlay.className = 'exit-confirm-overlay';
    overlay.innerHTML = `
      <div class="exit-confirm-card">
        <div class="exit-confirm-title">게임을 종료하시겠습니까?</div>
        <div class="exit-confirm-sub">홈으로 이동하면 게임이 초기화됩니다</div>
        <div class="exit-confirm-buttons">
          <button class="tds-btn tds-btn-lg tds-btn-light exit-confirm-no">아니오</button>
          <button class="tds-btn tds-btn-lg tds-btn-primary exit-confirm-yes">예</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('exit-confirm--visible'));

    overlay.querySelector('.exit-confirm-no').addEventListener('click', () => {
      overlay.classList.remove('exit-confirm--visible');
      setTimeout(() => overlay.remove(), 200);
    });

    overlay.querySelector('.exit-confirm-yes').addEventListener('click', async () => {
      backGuardActive = false;
      window.removeEventListener('popstate', onPopState);
      overlay.remove();
            clearBoard(stage.boardKey);
      navigate('home');
    });

    // Close on overlay background tap
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('exit-confirm--visible');
        setTimeout(() => overlay.remove(), 200);
      }
    });
  }

  // Restart – confirm before restarting
  document.getElementById('restart-btn').addEventListener('click', () => {
    if (splashShowing) return;
    showRestartConfirm();
  });

  function showRestartConfirm() {
    const overlay = document.createElement('div');
    overlay.className = 'exit-confirm-overlay';
    overlay.innerHTML = `
      <div class="exit-confirm-card">
        <div class="exit-confirm-title">다시 시작하시겠습니까?</div>
        <div class="exit-confirm-sub">현재 진행 상황이 초기화됩니다</div>
        <div class="exit-confirm-buttons">
          <button class="tds-btn tds-btn-lg tds-btn-light exit-confirm-no">아니오</button>
          <button class="tds-btn tds-btn-lg tds-btn-primary exit-confirm-yes">예</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('exit-confirm--visible'));

    overlay.querySelector('.exit-confirm-no').addEventListener('click', () => {
      overlay.classList.remove('exit-confirm--visible');
      setTimeout(() => overlay.remove(), 200);
    });

    overlay.querySelector('.exit-confirm-yes').addEventListener('click', async () => {
      overlay.remove();
      await maybeShowInterstitial();
      clearBoard(stage.boardKey);
      board = new Board(stage.rows, stage.cols);
      for (let i = 0; i < stage.initialTiles; i++) board.addRandomTile();
      currentScore = 0;
      history = [];
      goalReached = false;
      stopTimer();
      elapsedSeconds = 0;
      renderer.destroy();
      renderer = new Renderer(boardContainer, stage.rows, stage.cols, stageId);
      requestAnimationFrame(() => doRender());
      startTimer();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('exit-confirm--visible');
        setTimeout(() => overlay.remove(), 200);
      }
    });
  }

  const removeSwipe = attachSwipeListener(boardContainer, handleSwipe);

  // Intercept browser back button — show exit confirm like home button
  let backGuardActive = true;
  const playHash = window.location.hash;

  // Push a guard entry so back button pops this instead of leaving
  history.pushState({ nyang2048Guard: true }, '', playHash);

  const onPopState = () => {
    if (!backGuardActive) return;
    if (splashShowing) {
      // Re-push guard and ignore
      history.pushState({ nyang2048Guard: true }, '', playHash);
      return;
    }
    // Show confirm modal with custom back-button behavior
    const overlay = document.createElement('div');
    overlay.className = 'exit-confirm-overlay';
    overlay.innerHTML = `
      <div class="exit-confirm-card">
        <div class="exit-confirm-title">게임을 종료하시겠습니까?</div>
        <div class="exit-confirm-sub">홈으로 이동하면 게임이 초기화됩니다</div>
        <div class="exit-confirm-buttons">
          <button class="tds-btn tds-btn-lg tds-btn-light exit-confirm-no">아니오</button>
          <button class="tds-btn tds-btn-lg tds-btn-primary exit-confirm-yes">예</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('exit-confirm--visible'));

    const dismiss = () => {
      overlay.classList.remove('exit-confirm--visible');
      setTimeout(() => overlay.remove(), 200);
      // Re-push guard for next back press
      history.pushState({ nyang2048Guard: true }, '', playHash);
    };

    overlay.querySelector('.exit-confirm-no').addEventListener('click', dismiss);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });

    overlay.querySelector('.exit-confirm-yes').addEventListener('click', async () => {
      backGuardActive = false;
      window.removeEventListener('popstate', onPopState);
      overlay.remove();
            clearBoard(stage.boardKey);
      navigate('home');
    });
  };

  window.addEventListener('popstate', onPopState);

  return () => {
    backGuardActive = false;
    window.removeEventListener('popstate', onPopState);
    stopTimer();
    removeSwipe();
    renderer.destroy();
    const t = document.querySelector('.toast');
    if (t) t.remove();
    const splash = document.querySelector('.cat-splash');
    if (splash) splash.remove();
  };
}
