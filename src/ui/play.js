import { Board } from '../game/board.js';
import { Renderer } from '../game/renderer.js';
import { attachSwipeListener } from '../game/input.js';
import { getCatForValue, STAGES, CAT_NAMES, getCatImage, getStageCatLineup, getSubStageConfig, parseStageId } from '../game/stages.js';
import {
  addToCollection, getCatCount, COLLECTION_MAX,
  getBestScore, getBestTime,
  saveBestScore, saveBestTime,
  saveBoard, loadBoard, clearBoard,
  unlockNextStage, unlockInfinite, isInfiniteUnlocked,
} from '../game/score.js';
import { getDialogue } from '../game/catDialogues.js';
import { navigate, getHashParams } from '../core/router.js';
import { ICON } from '../core/icons.js';

export function renderPlay() {
  // Item system (global, not per-stage)
  const ITEMS = [
    { id: 'undo',    label: '되돌리기', defaultCharges: 5, key: 'nyang-undo-charges' },
    { id: 'hammer',  label: '망치',     defaultCharges: 3, key: 'nyang-hammer-charges' },
    { id: 'cleaner', label: '클리너',   defaultCharges: 3, key: 'nyang-cleaner-charges' },
    { id: 'upgrade', label: '업그레이드', defaultCharges: 3, key: 'nyang-upgrade-charges' },
  ];
  ITEMS.forEach(item => {
    if (localStorage.getItem(item.key) === null) localStorage.setItem(item.key, String(item.defaultCharges));
  });
  function getCharges(id) {
    const item = ITEMS.find(i => i.id === id);
    return parseInt(localStorage.getItem(item.key) || '0', 10);
  }
  function setCharges(id, n) {
    const item = ITEMS.find(i => i.id === id);
    localStorage.setItem(item.key, String(Math.max(0, n)));
  }
  function addCharge(id, delta) {
    setCharges(id, getCharges(id) + delta);
  }
  function updateItemBar() {
    ITEMS.forEach(({ id }) => {
      const btn = document.getElementById(`item-btn-${id}`);
      if (!btn) return;
      const count = getCharges(id);
      const countEl = btn.querySelector('.item-btn__count');
      if (countEl) countEl.textContent = `${count}개`;
      btn.classList.toggle('item-btn--empty', count === 0);
      let refill = btn.querySelector('.item-btn__refill');
      if (count === 0 && !refill) {
        refill = document.createElement('span');
        refill.className = 'item-btn__refill';
        refill.textContent = '충전';
        btn.appendChild(refill);
      } else if (count > 0 && refill) {
        refill.remove();
      }
    });
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
  const isInfinite = !!params.infinite;
  const infiniteSize = isInfinite ? parseInt(params.infinite, 10) : null;
  const rawStageParam = params.stage || '1-1';
  const stageId = isInfinite ? 'infinite' : rawStageParam; // e.g. "3-2"
  const { stageNum, subNum } = isInfinite ? { stageNum: null, subNum: null } : parseStageId(stageId);

  const stage = isInfinite
    ? { ...STAGES.infinite, rows: infiniteSize || 4, cols: infiniteSize || 4, size: infiniteSize || 4, boardKey: `inf_${infiniteSize || 4}` }
    : getSubStageConfig(stageNum, subNum);

  if (!stage) { navigate('home'); return; }

  const app = document.getElementById('app');

  // Build full cat lineup for this stage (common + filler + collectible)
  const allStageCats = !isInfinite
    ? getStageCatLineup(stageNum).filter(({ value }) => value <= stage.goal)
    : [];
  const collectibleCatIds = new Set(stage.cats ? Object.values(stage.cats) : []);

  // Set of all stage goal cat IDs — only collectable in their own stage X-3
  const ALL_STAGE_GOAL_CATS = new Set(
    Object.values(STAGES)
      .filter(s => s.id !== 'infinite')
      .flatMap(s => Object.values(s.cats || {}))
  );
  // This stage's own goal cat (the cat at the goal tile value for this sub-stage)
  const ownGoalCatId = !isInfinite && stage.cats ? (stage.cats[stage.goal] || null) : null;

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
        <div class="play-item-bar">
          ${ITEMS.map(item => {
            const count = getCharges(item.id);
            return `
            <button class="item-btn${count === 0 ? ' item-btn--empty' : ''}" id="item-btn-${item.id}" aria-label="${item.label}">
              <span class="item-btn__count">${count}개</span>
              <span class="item-btn__icon">${ICON[item.id]}</span>
              <span class="item-btn__label">${item.label}</span>
              ${count === 0 ? `<span class="item-btn__refill">충전</span>` : ''}
            </button>`;
          }).join('')}
        </div>
        <div class="tile-select-hint" id="tile-select-hint" style="display:none"></div>
        <div class="play-board-wrap">
          ${renderCatLineup()}
          <div class="board-container" id="board-container"></div>
        </div>
        <div class="play-bottom-actions">
          <button class="play-action-card" id="home-btn" aria-label="홈">
            <span class="play-action-card__icon">${ICON.home}</span>
            <span class="play-action-card__label">홈</span>
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

  const rendererStageId = isInfinite ? 'infinite' : stageNum;
  let renderer = new Renderer(boardContainer, stage.rows, stage.cols, rendererStageId);
  let history = []; // stack of snapshots for consecutive undo
  let goalReached = false;
  let splashShowing = false;
  let usedUndo = false;
  let highestValue = 0;
  let removeVisibilityListener = () => {};

  function updateScoreDisplay() {
    const el = document.getElementById('score-display');
    if (el) el.textContent = currentScore.toLocaleString();
  }

  function doRender() {
    renderer.renderBoard(board.grid, board.ids);
    updateScoreDisplay();
  }

  function initBoardAndStart(restore) {
    if (restore && saved) {
      board = new Board(stage.rows, stage.cols);
      board.restoreSnapshot(saved);
      currentScore = board.score;
    } else {
      clearBoard(stage.boardKey);
      board = new Board(stage.rows, stage.cols);
      for (let i = 0; i < stage.initialTiles; i++) board.addRandomTile();
      addToCollection('korean');
      addToCollection('russian');
    }
    highestValue = 0;
    for (let r = 0; r < board.rows; r++)
      for (let c = 0; c < board.cols; c++)
        if (board.grid[r][c] > highestValue) highestValue = board.grid[r][c];
    requestAnimationFrame(() => doRender());
    startTimer();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && board) saveCurrentBoard();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    removeVisibilityListener = () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }

  initBoardAndStart(!!saved);

  function saveCurrentBoard() {
    saveBoard(stage.boardKey, board.getSnapshot());
  }

  // ── Item effect animations ────────────────────────────────────────────────
  function getTileElAt(r, c) {
    for (const el of renderer._tileEls.values()) {
      if (parseInt(el.dataset.r) === r && parseInt(el.dataset.c) === c) return el;
    }
    return null;
  }

  function flashWrong(message) {
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:rgba(220,50,50,0.3);z-index:9998;pointer-events:none;transition:opacity 0.3s;display:flex;align-items:center;justify-content:center';
    if (message) {
      flash.innerHTML = `<div style="background:#fff;border-radius:16px;padding:14px 24px;font-size:18px;font-weight:700;color:#E53E3E;box-shadow:0 4px 16px rgba(0,0,0,0.15);text-align:center;line-height:1.5">${message}</div>`;
    }
    document.body.appendChild(flash);
    requestAnimationFrame(() => {
      setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 300); }, 800);
    });
  }

  function flashBoard(color, ms = 180) {
    const boardEl = boardContainer.querySelector('.game-board');
    const flash = document.createElement('div');
    flash.style.cssText = `position:absolute;inset:0;border-radius:8px;background:${color};pointer-events:none;z-index:50;opacity:0;transition:opacity 0.08s ease;`;
    boardEl.appendChild(flash);
    requestAnimationFrame(() => { flash.style.opacity = '1'; });
    setTimeout(() => {
      flash.style.transition = 'opacity 0.2s ease';
      flash.style.opacity = '0';
      setTimeout(() => flash.remove(), 220);
    }, ms);
  }

  function shakeBoard() {
    const boardEl = boardContainer.querySelector('.game-board');
    if (!boardEl) return;
    boardEl.animate([
      { transform: 'translate(0,0)' },
      { transform: 'translate(-7px,-4px)' },
      { transform: 'translate(7px,3px)' },
      { transform: 'translate(-5px,4px)' },
      { transform: 'translate(5px,-2px)' },
      { transform: 'translate(-3px,1px)' },
      { transform: 'translate(0,0)' },
    ], { duration: 320, easing: 'ease-out' });
  }

  function pulseItemBtn(itemId) {
    const btn = document.getElementById(`item-btn-${itemId}`);
    if (!btn) return;
    btn.classList.add('item-btn--pulse');
    btn.addEventListener('animationend', () => btn.classList.remove('item-btn--pulse'), { once: true });
  }

  function animateHammerHit(r, c) {
    return new Promise(resolve => {
      const el = getTileElAt(r, c);
      if (!el) { resolve(); return; }
      renderer._measureCell();
      const { x, y, cellSize } = renderer._getTilePos(r, c);
      const cx = x + cellSize / 2, cy = y + cellSize / 2;

      // Anticipation: brief scale-up
      el.style.transition = 'transform 0.07s ease-out';
      el.style.transform = `translate(${x}px,${y}px) scale(1.15)`;
      setTimeout(() => {
        // Violent multi-shake
        el.style.transition = 'transform 0.05s ease-out';
        el.style.transform = `translate(${x - 9}px,${y + 5}px) scale(1.05)`;
        setTimeout(() => {
          el.style.transform = `translate(${x + 9}px,${y - 5}px) scale(1.05)`;
          setTimeout(() => {
            el.style.transform = `translate(${x - 6}px,${y + 3}px) scale(1.02)`;
            setTimeout(() => {
              // Collapse with spin
              el.style.transition = 'transform 0.16s cubic-bezier(0.55,0,1,0.45), opacity 0.16s ease-in';
              el.style.transform = `translate(${x}px,${y}px) scale(0) rotate(30deg)`;
              el.style.opacity = '0';

              // Shatter: 8 debris flying outward
              for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
                const dist = cellSize * (0.6 + Math.random() * 0.5);
                const size = 4 + Math.random() * 5;
                const frag = document.createElement('div');
                frag.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;border-radius:2px;background:${el.style.background || '#f9c98b'};pointer-events:none;z-index:30;transform:translate(-50%,-50%) scale(1);transition:transform 0.35s ease-out,opacity 0.35s ease-out;`;
                renderer._tilesLayer.appendChild(frag);
                requestAnimationFrame(() => requestAnimationFrame(() => {
                  frag.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(0) rotate(${Math.random() * 360}deg)`;
                  frag.style.opacity = '0';
                  setTimeout(() => frag.remove(), 400);
                }));
              }

              // Impact flash + board shake
              flashBoard('rgba(255,107,53,0.3)', 80);
              shakeBoard();
              setTimeout(resolve, 220);
            }, 50);
          }, 50);
        }, 50);
      }, 70);
    });
  }

  function animateCleanerSweep(keepR, keepC) {
    return new Promise(resolve => {
      const entries = [];
      renderer._tileEls.forEach((el) => {
        const r = parseInt(el.dataset.r), c = parseInt(el.dataset.c);
        if (r === keepR && c === keepC) return;
        entries.push({ el, r, c });
      });
      if (entries.length === 0) { resolve(); return; }

      // Bright flash first
      flashBoard('rgba(255,255,255,0.55)', 100);

      // Sort outward from kept tile for ripple effect
      entries.sort((a, b) => {
        const da = Math.abs(a.r - keepR) + Math.abs(a.c - keepC);
        const db = Math.abs(b.r - keepR) + Math.abs(b.c - keepC);
        return da - db;
      });

      const scatter = [
        [0, -1], [1, 0], [0, 1], [-1, 0],
        [1, -1], [1, 1], [-1, 1], [-1, -1],
        [0, -1.5], [1.5, 0], [0, 1.5], [-1.5, 0],
      ];

      let remaining = entries.length;
      entries.forEach(({ el, r, c }, i) => {
        setTimeout(() => {
          const { x, y, cellSize } = renderer._getTilePos(r, c);
          const dir = scatter[i % scatter.length];
          const dx = dir[0] * cellSize * 0.6;
          const dy = dir[1] * cellSize * 0.6;
          el.style.transition = 'transform 0.28s cubic-bezier(0.55,0,1,0.45), opacity 0.28s ease-in';
          el.style.transform = `translate(${x + dx}px,${y + dy}px) scale(0.5) rotate(${(i % 2 === 0 ? 1 : -1) * 25}deg)`;
          el.style.opacity = '0';
          remaining--;
          if (remaining === 0) setTimeout(() => { shakeBoard(); resolve(); }, 300);
        }, i * 30);
      });
    });
  }

  function animateUpgradePop(r, c) {
    setTimeout(() => {
      const el = getTileElAt(r, c);
      if (!el) return;
      renderer._measureCell();
      const { x, y, cellSize } = renderer._getTilePos(r, c);
      const cx = x + cellSize / 2, cy = y + cellSize / 2;

      // Bright golden flash on board
      flashBoard('rgba(241,196,15,0.25)', 120);

      // Expanding ring
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;left:${x - 4}px;top:${y - 4}px;width:${cellSize + 8}px;height:${cellSize + 8}px;border-radius:8px;border:3px solid #f1c40f;pointer-events:none;z-index:20;box-shadow:0 0 18px rgba(241,196,15,0.7);opacity:1;transition:transform 0.5s ease-out,opacity 0.5s ease-out;`;
      renderer._tilesLayer.appendChild(ring);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        ring.style.transform = 'scale(1.6)';
        ring.style.opacity = '0';
        setTimeout(() => ring.remove(), 550);
      }));

      // 10 sparkles with varied sizes and angles
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
        const dist = cellSize * (0.7 + Math.random() * 0.5);
        const size = 4 + Math.random() * 5;
        const colors = ['#f1c40f', '#fff', '#ffe066', '#ffd700'];
        const spark = document.createElement('div');
        spark.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;border-radius:50%;background:${colors[i % colors.length]};pointer-events:none;z-index:25;box-shadow:0 0 4px rgba(241,196,15,0.8);transform:translate(-50%,-50%) scale(1.2);transition:transform 0.45s cubic-bezier(0.17,0.89,0.32,1),opacity 0.45s ease-out;`;
        renderer._tilesLayer.appendChild(spark);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          spark.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px),calc(-50% + ${Math.sin(angle) * dist}px)) scale(0)`;
          spark.style.opacity = '0';
          setTimeout(() => spark.remove(), 500);
        }));
      }

      // Tile triple-bounce pop
      el.style.transition = 'transform 0.18s cubic-bezier(0.17,0.89,0.32,1.6)';
      el.style.transform = `translate(${x}px,${y}px) scale(1.3)`;
      setTimeout(() => {
        el.style.transition = 'transform 0.14s ease-out';
        el.style.transform = `translate(${x}px,${y}px) scale(0.92)`;
        setTimeout(() => {
          el.style.transition = 'transform 0.12s ease-in-out';
          el.style.transform = `translate(${x}px,${y}px) scale(1)`;
        }, 140);
      }, 180);
    }, 50);
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

    const DISCOVERY = ['', '첫만남 🐱', '친해지기 💕', '집사되기 완료! 🎉'];
    const badge = isComplete ? DISCOVERY[3] : DISCOVERY[count] || `${count}번째 발견!`;
    const sub = isComplete
      ? `${name}의 집사가 됐어요!`
      : `앞으로 ${remaining}번 더 발견하면 집사가 돼요`;
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
    const count = getCatCount(catId);
    const dialogue = getDialogue(catId, count);
    overlay.innerHTML = `
      <div class="last-cat-overlay__inner">
        <div class="last-cat-overlay__title">마지막 고양이 발견!</div>
        ${dialogue ? `
          <div class="cat-speech-bubble visible">
            <div class="cat-speech-bubble__text">${dialogue.text}</div>
          </div>
        ` : ''}
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

  let lastNoMoveToast = 0;
  async function handleSwipe(direction) {
    if (splashShowing || renderer.animating || tileSelectMode) return;

    history.push(board.getSnapshot());
    if (history.length > 10) history.shift();
    const result = board.move(direction);
    if (!result.moved) {
      history.pop();
      if (!board.canMove()) {
        setTimeout(() => handleGameOver(), 400);
        return;
      }
      const now = Date.now();
      if (now - lastNoMoveToast > 1000) {
        lastNoMoveToast = now;
        flashWrong('더이상 움직일 수 있는 타일이 없어요<br>다른 방향으로 밀어보세요');
      }
      return;
    }

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
      const catId = getCatForValue(rendererStageId, mergedValue);
      if (!catId) continue;
      // Reveal in lineup (all cats)
      if (!discoveredThisGame.has(catId)) {
        discoveredThisGame.add(catId);
        updateCatLineup();
      }
      // Collection: once per cat per play, with goal-cat restrictions
      if (!collectedThisGame.has(catId)) {
        if (ALL_STAGE_GOAL_CATS.has(catId)) {
          // Stage goal cats: collectable in any sub-stage of their own stage
          if (!isInfinite && catId === ownGoalCatId) {
            collectedThisGame.add(catId);
            const count = addToCollection(catId);
            if (count > 0) newCatFinds.push({ catId, count });
            if (count === 1) firstFoundThisGame.add(catId);
          }
          // else: skip — not allowed to collect this stage goal cat here
        } else {
          // Common cats (korean, russian, etc.): always collectable
          collectedThisGame.add(catId);
          const count = addToCollection(catId);
          if (count > 0) newCatFinds.push({ catId, count });
          if (count === 1) firstFoundThisGame.add(catId);
        }
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
      if (!isInfinite && !goalReached && stage.goal && board.hasValue(stage.goal)) {
        goalReached = true;
        const goalCatId = getCatForValue(stageNum, stage.goal);
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

  function handleWin() {
    stopTimer();
    backGuardActive = false;
    window.removeEventListener('popstate', onPopState);
    saveBestScore(stage.boardKey, currentScore);
    saveBestTime(stage.boardKey, elapsedSeconds);
    clearBoard(stage.boardKey);
    if (!isInfinite) {
      unlockNextStage(stageId); // stageId is "3-2" format, unlockNextStage handles it
    }
    const cats = [...firstFoundThisGame].join(',');
    navigate(`result?stage=${stageId}&score=${currentScore}&clear=1&time=${elapsedSeconds}${cats ? '&cats=' + cats : ''}`);
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

  // ── Debug helpers (브라우저 콘솔에서 사용) ──────────────────────────────
  // window.debugGameOver() → 보드를 꽉 채워 게임 오버 강제 발생
  // window.debugWin()      → 목표 타일 추가해 클리어 강제 발생
  // window.debugBoard()    → 현재 보드 상태 출력
  window.debugGameOver = () => {
    const { rows, cols } = board;
    const pattern = [[2, 4], [4, 2]];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        board.grid[r][c] = pattern[r % 2][c % 2];
    doRender();
    console.log('[debug] 게임 오버 상태로 설정됨. 아무 방향으로 스와이프하세요.');
  };
  window.debugWin = () => {
    board.grid[0][0] = stage.goal;
    doRender();
    console.log('[debug] 목표 타일 추가됨. 아무 방향으로 스와이프하세요.');
  };
  window.debugBoard = () => {
    console.table(board.grid);
    console.log('canMove:', board.canMove(), '| score:', board.score);
  };

  // ── Tile selection mode (for hammer & upgrade) ──────────────────────────
  let tileSelectMode = null;

  function enterTileSelectMode(itemId) {
    tileSelectMode = itemId;

    const instructions = {
      hammer:  { title: '제거하고 싶은 타일을 선택하세요.',    sub: '원하는 타일을 선택하면 사라져요.' },
      upgrade: { title: '한 단계 업그레이드 하고 싶은 타일을 선택하세요.', sub: '단, 가장 높은 타일은 선택할 수 없어요.' },
    };
    const inst = instructions[itemId];

    // Show hint between item bar and board
    const hint = document.getElementById('tile-select-hint');
    if (hint && inst) {
      hint.innerHTML = `<p class="tile-select-title">${inst.title}</p><p class="tile-select-sub">${inst.sub}</p>`;
      hint.style.display = '';
    }

    // Change active button to cancel state
    const btn = document.getElementById(`item-btn-${itemId}`);
    if (btn) {
      btn.classList.add('item-btn--active');
      btn.querySelector('.item-btn__label').textContent = '취소';
    }

    // Find max value for upgrade mode
    let maxVal = 0;
    for (let r = 0; r < board.rows; r++)
      for (let c = 0; c < board.cols; c++)
        if (board.grid[r][c] > maxVal) maxVal = board.grid[r][c];

    // Build an overlay grid that sits on top of the board (same layout)
    const boardEl = boardContainer.querySelector('.game-board');
    const overlay = document.createElement('div');
    overlay.id = 'tile-select-overlay';
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: repeat(${board.cols}, 1fr);
      gap: 6px;
      padding: 6px;
      pointer-events: none;
      z-index: 10;
      border-radius: 8px;
    `;
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const val = board.grid[r][c];
        const cell = document.createElement('div');
        cell.style.cssText = 'border-radius: 4px; aspect-ratio: 1;';
        const isDisabled = val === 0 || (itemId === 'upgrade' && val === maxVal);
        if (isDisabled) {
          cell.style.cssText += 'background: rgba(0,0,0,0.45); pointer-events: none;';
        } else {
          cell.style.cssText += 'box-shadow: inset 0 0 0 3px #FF6B35; cursor: pointer; pointer-events: auto;';
          const rr = r, cc = c;
          cell.addEventListener('click', () => applyTileItem(itemId, rr, cc), { once: true });
        }
        overlay.appendChild(cell);
      }
    }
    boardEl.style.position = 'relative';
    boardEl.appendChild(overlay);
  }

  function exitTileSelectMode() {
    const prevMode = tileSelectMode;
    tileSelectMode = null;
    const overlay = document.getElementById('tile-select-overlay');
    if (overlay) overlay.remove();
    // Hide hint
    const hint = document.getElementById('tile-select-hint');
    if (hint) hint.style.display = 'none';
    // Restore active button
    if (prevMode) {
      const btn = document.getElementById(`item-btn-${prevMode}`);
      if (btn) {
        btn.classList.remove('item-btn--active');
        const item = ITEMS.find(i => i.id === prevMode);
        if (item) btn.querySelector('.item-btn__label').textContent = item.label;
      }
    }
  }

  function applyTileItem(itemId, r, c) {
    exitTileSelectMode();
    setCharges(itemId, getCharges(itemId) - 1);
    updateItemBar();
    pulseItemBtn(itemId);
    if (itemId === 'hammer') {
      board.grid[r][c] = 0;
      if (board.ids && board.ids[r]) board.ids[r][c] = null;
      animateHammerHit(r, c).then(() => {
        doRender();
        saveCurrentBoard();
      });
    } else if (itemId === 'upgrade') {
      board.grid[r][c] = board.grid[r][c] * 2;
      doRender();
      saveCurrentBoard();
      animateUpgradePop(r, c);
    }
  }

  // ── Ad reward: show popup to pick interstitial (random) or rewarded (choice) ──
  async function showAdRewardPopup(preferredId) {
    if (!window.AIT) { showToast('광고를 불러올 수 없어요.'); return; }

    const overlay = document.createElement('div');
    overlay.className = 'tds-bottom-sheet-overlay';
    overlay.innerHTML = `
      <div class="tds-bottom-sheet">
        <div class="tds-bottom-sheet__handle"></div>
        <div class="tds-bottom-sheet__title">충전하기</div>
        <div class="tds-bottom-sheet__sub">광고보고 아이템을 받으세요.</div>
        <div class="tds-bottom-sheet__actions">
          <button class="tds-btn tds-btn-lg tds-btn-light ad-random-btn">짧은 광고 보고 랜덤으로 받기</button>
          <button class="tds-btn tds-btn-lg tds-btn-primary ad-choice-btn">긴 광고 보고 선택해서 받기</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('tds-bottom-sheet-overlay--visible'));

    const close = () => {
      overlay.classList.remove('tds-bottom-sheet-overlay--visible');
      setTimeout(() => overlay.remove(), 300);
    };
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    overlay.querySelector('.ad-random-btn').addEventListener('click', async () => {
      close();
      const result = await AIT.showAd('interstitial').catch(() => ({ success: false }));
      if (result?.success) {
        const randomItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        addCharge(randomItem.id, 1);
        updateItemBar();
        showToast(`🎁 ${randomItem.label} 1개 충전됐어요!`);
      } else {
        showToast('광고를 불러올 수 없어요.');
      }
    });

    overlay.querySelector('.ad-choice-btn').addEventListener('click', () => {
      close();
      showItemChoicePopup(preferredId);
    });
  }

  async function showItemChoicePopup(preferredId) {
    if (!window.AIT) { showToast('광고를 불러올 수 없어요.'); return; }

    let selectedId = preferredId || ITEMS[0].id;
    const overlay = document.createElement('div');
    overlay.className = 'tds-bottom-sheet-overlay';
    overlay.innerHTML = `
      <div class="tds-bottom-sheet">
        <div class="tds-bottom-sheet__handle"></div>
        <div class="tds-bottom-sheet__title">원하는 아이템 선택</div>
        <div class="tds-bottom-sheet__sub">긴 광고 시청 후 선택한 아이템 1개를 받아요</div>
        <div class="item-choice-list" style="padding:0 20px 16px">
          ${ITEMS.map(item => `
            <button class="item-choice-btn${item.id === selectedId ? ' item-choice-btn--selected' : ''}" data-id="${item.id}">
              <span class="item-choice-btn__icon">${ICON[item.id]}</span>
              <span class="item-choice-btn__label">${item.label}</span>
              <span class="item-choice-btn__count">${getCharges(item.id)}개 보유</span>
            </button>
          `).join('')}
        </div>
        <div class="tds-bottom-sheet__actions">
          <button class="tds-btn tds-btn-lg tds-btn-primary item-choice-confirm">광고 보고 받기</button>
          <button class="tds-btn tds-btn-lg tds-btn-light item-choice-cancel">취소</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('tds-bottom-sheet-overlay--visible'));

    const close = () => {
      overlay.classList.remove('tds-bottom-sheet-overlay--visible');
      setTimeout(() => overlay.remove(), 300);
    };
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('.item-choice-cancel').addEventListener('click', close);

    overlay.querySelectorAll('.item-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedId = btn.dataset.id;
        overlay.querySelectorAll('.item-choice-btn').forEach(b => b.classList.remove('item-choice-btn--selected'));
        btn.classList.add('item-choice-btn--selected');
      });
    });

    overlay.querySelector('.item-choice-confirm').addEventListener('click', async () => {
      close();
      const result = await AIT.showAd('rewarded').catch(() => ({ success: false }));
      if (result?.success) {
        addCharge(selectedId, 1);
        updateItemBar();
        const item = ITEMS.find(i => i.id === selectedId);
        showToast(`🎁 ${item.label} 1개 충전됐어요!`);
      } else {
        showToast('광고를 불러올 수 없어요.');
      }
    });
  }

  // ── Item button handlers ──────────────────────────────────────────────────
  document.getElementById('item-btn-undo').addEventListener('click', () => {
    if (splashShowing || tileSelectMode) return;
    const charges = getCharges('undo');
    if (charges > 0 && history.length > 0) {
      setCharges('undo', charges - 1);
      usedUndo = true;
      board.restoreSnapshot(history.pop());
      currentScore = board.score;
      pulseItemBtn('undo');
      flashBoard('rgba(49,130,246,0.3)', 140);
      shakeBoard();
      doRender();
      saveCurrentBoard();
      updateItemBar();
    } else if (charges === 0) {
      showAdRewardPopup('undo');
    } else {
      showToast('되돌릴 수 없어요.');
    }
  });

  document.getElementById('item-btn-hammer').addEventListener('click', () => {
    if (splashShowing) return;
    if (tileSelectMode === 'hammer') { exitTileSelectMode(); return; }
    if (tileSelectMode) return;
    const charges = getCharges('hammer');
    if (charges > 0) {
      enterTileSelectMode('hammer');
    } else {
      showAdRewardPopup('hammer');
    }
  });

  document.getElementById('item-btn-cleaner').addEventListener('click', () => {
    if (splashShowing || tileSelectMode) return;
    const charges = getCharges('cleaner');
    if (charges === 0) { showAdRewardPopup('cleaner'); return; }

    const confirmOverlay = document.createElement('div');
    confirmOverlay.className = 'exit-confirm-overlay';
    confirmOverlay.innerHTML = `
      <div class="exit-confirm-card">
        <div class="exit-confirm-title">클리너 사용</div>
        <div class="exit-confirm-sub">최고 타일 제외하고 모두 제거할까요?</div>
        <div class="exit-confirm-buttons">
          <button class="tds-btn tds-btn-lg tds-btn-light exit-confirm-no">아니오</button>
          <button class="tds-btn tds-btn-lg tds-btn-primary exit-confirm-yes">사용</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmOverlay);
    requestAnimationFrame(() => confirmOverlay.classList.add('exit-confirm--visible'));
    const closeConfirm = () => {
      confirmOverlay.classList.remove('exit-confirm--visible');
      setTimeout(() => confirmOverlay.remove(), 200);
    };
    confirmOverlay.querySelector('.exit-confirm-no').addEventListener('click', closeConfirm);
    confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) closeConfirm(); });
    confirmOverlay.querySelector('.exit-confirm-yes').addEventListener('click', () => {
      closeConfirm();
      setCharges('cleaner', charges - 1);
      updateItemBar();
      pulseItemBtn('cleaner');
      // Find max value and position
      let maxVal = 0, keepR = 0, keepC = 0;
      for (let r = 0; r < board.rows; r++)
        for (let c = 0; c < board.cols; c++)
          if (board.grid[r][c] > maxVal) { maxVal = board.grid[r][c]; keepR = r; keepC = c; }
      animateCleanerSweep(keepR, keepC).then(() => {
        // Clear all except max tile
        let kept = false;
        for (let r = 0; r < board.rows; r++) {
          for (let c = 0; c < board.cols; c++) {
            if (board.grid[r][c] === maxVal && !kept) {
              kept = true;
            } else {
              board.grid[r][c] = 0;
              if (board.ids && board.ids[r]) board.ids[r][c] = null;
            }
          }
        }
        doRender();
        saveCurrentBoard();
      });
    });
  });

  document.getElementById('item-btn-upgrade').addEventListener('click', () => {
    if (splashShowing) return;
    if (tileSelectMode === 'upgrade') { exitTileSelectMode(); return; }
    if (tileSelectMode) return;
    const charges = getCharges('upgrade');
    if (charges > 0) {
      enterTileSelectMode('upgrade');
    } else {
      showAdRewardPopup('upgrade');
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
      renderer = new Renderer(boardContainer, stage.rows, stage.cols, rendererStageId);
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
  window.history.pushState({ nyang2048Guard: true }, '', playHash);

  const onPopState = () => {
    if (!backGuardActive) return;
    if (splashShowing) {
      // Re-push guard and ignore
      window.history.pushState({ nyang2048Guard: true }, '', playHash);
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
      window.history.pushState({ nyang2048Guard: true }, '', playHash);
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
    removeVisibilityListener();
    stopTimer();
    removeSwipe();
    renderer.destroy();
    const t = document.querySelector('.toast');
    if (t) t.remove();
    const splash = document.querySelector('.cat-splash');
    if (splash) splash.remove();
  };
}
