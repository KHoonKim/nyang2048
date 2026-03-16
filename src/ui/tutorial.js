import { Board } from '../game/board.js';
import { Renderer } from '../game/renderer.js';
import { attachSwipeListener } from '../game/input.js';
import { addToCollection, completeTutorial } from '../game/score.js';
import { navigate } from '../core/router.js';

export function renderTutorial() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="tutorial-screen">
      <div class="tutorial-header">
        <div class="tutorial-title">냥2048</div>
        <div class="tutorial-subtitle">스와이프 해서 같은 고양이를 합쳐보세요!</div>
      </div>
      <div class="tutorial-board-wrap">
        <div class="tutorial-board-container" id="tutorial-board">
          <div class="tutorial-arrow-overlay" id="tutorial-arrow">
            <span class="tutorial-arrow">👉</span>
          </div>
        </div>
        <div class="tutorial-hint" id="tutorial-hint">방향으로 스와이프 해보세요</div>
      </div>
    </div>
  `;

  // Add korean & russian to collection on tutorial start
  addToCollection('korean');
  addToCollection('russian');

  const boardContainer = document.getElementById('tutorial-board');
  const arrowOverlay = document.getElementById('tutorial-arrow');
  const hintEl = document.getElementById('tutorial-hint');

  let board = new Board(4);
  board.addRandomTile();
  board.addRandomTile();

  let renderer = new Renderer(boardContainer, 4, 2);
  let hasFirstMerge = false;
  let completed = false;

  const arrows = ['👉', '👆', '👈', '👇'];
  let arrowIdx = 0;
  const arrowInterval = setInterval(() => {
    if (!document.getElementById('tutorial-arrow')) return;
    arrowIdx = (arrowIdx + 1) % arrows.length;
    const arrowEl = arrowOverlay.querySelector('.tutorial-arrow');
    if (arrowEl) arrowEl.textContent = arrows[arrowIdx];
  }, 2000);

  function renderBoard() {
    renderer.renderBoard(board.grid);
  }

  requestAnimationFrame(() => {
    renderBoard();
  });

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

  function handleSwipe(direction) {
    if (completed) return;

    const prevGrid = board.grid.map(r => [...r]);
    const result = board.move(direction);
    if (!result.moved) return;

    // Check for first merge
    if (!hasFirstMerge && result.scoreDelta > 0) {
      hasFirstMerge = true;
      arrowOverlay.style.opacity = '0';
      hintEl.textContent = '같은 고양이가 만나면 진화해요! 🐱';
      hintEl.style.background = 'rgba(255,107,53,0.15)';
    }

    renderer.animateMove(prevGrid, board.grid, result.newTile);

    // Check for 32
    if (board.hasValue(32) && !completed) {
      completed = true;
      clearInterval(arrowInterval);
      setTimeout(() => completeTutorialFlow(), 600);
      return;
    }

    // Game over → silent reset
    if (!board.canMove()) {
      board = new Board(4);
      board.addRandomTile();
      board.addRandomTile();
      hasFirstMerge = false;
      arrowOverlay.style.opacity = '1';
      hintEl.textContent = '방향으로 스와이프 해보세요';
      hintEl.style.background = '';
      requestAnimationFrame(() => renderBoard());
    }
  }

  function completeTutorialFlow() {
    const boardWrap = document.querySelector('.tutorial-board-wrap');
    if (!boardWrap) return;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(255,107,53,0.95);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      z-index: 9999; gap: 16px;
      padding: 32px;
      text-align: center;
    `;
    overlay.innerHTML = `
      <div style="font-size:64px">🎉</div>
      <div style="font-size:26px; font-weight:900; color:#fff;">준비완료!</div>
      <div style="font-size:16px; color:rgba(255,255,255,0.9); line-height:1.5;">
        총 42종의 모든 고양이를<br>모아보세요
      </div>
      <button id="tutorial-start-btn" style="
        margin-top:8px; background:#fff; border:none;
        border-radius:9999px; padding:14px 32px;
        font-size:17px; font-weight:700; color:#FF6B35;
        font-family:inherit; cursor:pointer;
      ">시작하기</button>
    `;
    document.body.appendChild(overlay);

    document.getElementById('tutorial-start-btn').addEventListener('click', () => {
      completeTutorial();
      document.body.removeChild(overlay);
      navigate('home');
    });
  }

  const removeSwipe = attachSwipeListener(boardContainer, handleSwipe);

  return () => {
    clearInterval(arrowInterval);
    removeSwipe();
    renderer.destroy();
    // Remove toast if any
    const t = document.querySelector('.toast');
    if (t) t.remove();
  };
}
