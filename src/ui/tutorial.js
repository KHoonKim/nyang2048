import { Board } from '../game/board.js';
import { Renderer } from '../game/renderer.js';
import { attachSwipeListener } from '../game/input.js';
import { addToCollection, completeTutorial } from '../game/score.js';
import { navigate } from '../core/router.js';

export function renderTutorial() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="tutorial-screen">
      <div class="tutorial-board-wrap">
        <img src="2048.png" class="tutorial-logo" style="margin-bottom:20px" alt="냥2048">
        <div class="tutorial-board-container" id="tutorial-board">
          <div class="tutorial-arrow-overlay" id="tutorial-arrow">
            <span class="tutorial-arrow">👉</span>
          </div>
        </div>
        <div class="tutorial-hint" id="tutorial-hint"></div>
      </div>
    </div>
  `;

  addToCollection('korean');
  addToCollection('russian');

  const boardContainer = document.getElementById('tutorial-board');
  const arrowOverlay = document.getElementById('tutorial-arrow');
  const hintEl = document.getElementById('tutorial-hint');

  function flashWrong(message) {
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:rgba(220,50,50,0.3);z-index:9998;pointer-events:none;transition:opacity 0.3s;display:flex;align-items:center;justify-content:center';
    if (message) {
      flash.innerHTML = `<div style="background:#fff;border-radius:16px;padding:14px 24px;font-size:20px;font-weight:700;color:#E53E3E;box-shadow:0 4px 16px rgba(0,0,0,0.15)">${message}</div>`;
    }
    document.body.appendChild(flash);
    requestAnimationFrame(() => {
      setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 300); }, 600);
    });
  }

  // Create board with controlled initial state
  let board = new Board(4);
  board._grid[2][1] = 2;
  board._ids[2][1] = board._nextId++;

  // Suppress random tile addition during scripted steps
  const origAddRandom = board.addRandomTile.bind(board);
  board.addRandomTile = () => null;

  let renderer = new Renderer(boardContainer, 4, 4, 1);
  let step = 0; // 0: waiting for dialogue dismiss
  let completed = false;
  let animating = false;
  let blocked = true; // block swipes until dialogue dismissed

  function renderBoard() {
    renderer.renderBoard(board.grid, board.ids);
  }

  function setArrow(emoji) {
    const arrowEl = arrowOverlay.querySelector('.tutorial-arrow');
    if (arrowEl) arrowEl.textContent = emoji;
    arrowOverlay.style.opacity = '1';
  }

  function hideArrow() {
    arrowOverlay.style.opacity = '0';
  }

  // Dialogue overlay on the board
  function showDialogue(text, callback) {
    blocked = true;
    hideArrow();

    const overlay = document.createElement('div');
    overlay.className = 'tutorial-dialogue-overlay';
    overlay.innerHTML = `
      <div class="tutorial-dialogue-bubble">
        <div class="tutorial-dialogue-text">${text}</div>
        <div class="tutorial-dialogue-tap">탭하여 계속</div>
      </div>
    `;
    boardContainer.appendChild(overlay);

    // Small delay to prevent accidental immediate dismiss
    setTimeout(() => {
      overlay.addEventListener('click', () => {
        overlay.remove();
        blocked = false;
        if (callback) callback();
      });
    }, 300);
  }

  hideArrow();
  hintEl.style.opacity = '0';

  requestAnimationFrame(() => {
    renderBoard();
    // Step 1 dialogue
    showDialogue('상하좌우 어디로든<br>밀어볼 수 있어요.<br><br>먼저 <b style="color:#FF6B35">오른쪽</b>으로<br>밀어보세요.', () => {
      step = 1;
      setArrow('👉');
      hintEl.innerHTML = '<b style="color:#FF6B35">오른쪽으로</b> 밀어보세요 👉';
      hintEl.style.opacity = '1';
    });
  });

  function handleSwipe(direction) {
    if (completed || animating || blocked || renderer.animating) return;

    // Step 1: Right swipe only (no merge)
    if (step === 1) {
      if (direction !== 'right') {
        flashWrong('오른쪽으로 밀어보세요! 👉');
        hintEl.classList.remove('tutorial-hint--shake');
        void hintEl.offsetWidth;
        hintEl.classList.add('tutorial-hint--shake');
        return;
      }
      animating = true;

      const result = board.move('right');
      if (!result.moved) { animating = false; return; }
      renderer.animateMove(result.movements, board.grid, result.newTile);

      setTimeout(() => {
        // Place a 2 on the left side of same row for step 2 merge
        board._grid[2][0] = 2;
        board._ids[2][0] = board._nextId++;
        renderBoard();
        animating = false;

        // Step 2 dialogue
        showDialogue('잘하셨어요!<br>이번엔 <b style="color:#FF6B35">왼쪽</b>으로<br>밀어보세요.', () => {
          step = 2;
          setArrow('👈');
          hintEl.innerHTML = '<b style="color:#FF6B35">왼쪽으로</b> 밀어보세요 👈';
        });
      }, 350);
      return;
    }

    // Step 2: Left swipe only (merge happens)
    if (step === 2) {
      if (direction !== 'left') {
        flashWrong('왼쪽으로 밀어보세요! 👈');
        hintEl.classList.remove('tutorial-hint--shake');
        void hintEl.offsetWidth;
        hintEl.classList.add('tutorial-hint--shake');
        return;
      }
      animating = true;

      // Restore but force value 2 only (korean cat)
      board.addRandomTile = () => {
        const empty = board.emptyCells;
        if (empty.length === 0) return null;
        const { r, c } = empty[Math.floor(Math.random() * empty.length)];
        board._grid[r][c] = 2;
        board._ids[r][c] = board._nextId++;
        return { r, c, value: 2, id: board._ids[r][c] };
      };
      const result = board.move('left');
      if (!result.moved) { animating = false; return; }
      renderer.animateMove(result.movements, board.grid, result.newTile);

      setTimeout(() => {
        animating = false;

        // Step 3 dialogue (merge explanation)
        showDialogue('잘하셨어요!<br>같은 고양이 <b style="color:#FF6B35">두마리</b>가 만나면<br>새로운 고양이가 나타나요', () => {
          // Step 4 dialogue
          showDialogue('회색고양이 2마리를 만들어,<br>새로운 고양이를 찾아보세요!', () => {
            step = 4;

              hintEl.innerHTML = '회색고양이를 합쳐보세요!';
            hideArrow();
          });
        });
      }, 350);
      return;
    }

    // Step 4: Free play until value 8 (bombay/black cat)
    if (step === 4) {
      const result = board.move(direction);
      if (!result.moved) return;
      renderer.animateMove(result.movements, board.grid, result.newTile);

      if (board.hasValue(8)) {
        setTimeout(() => {
          showDialogue('검은고양이를 발견했어요!<br>마지막으로 검은고양이<br><b>2마리</b>를 모아서<br>새로운 고양이를 찾아보세요.', () => {
            step = 5;
            hintEl.innerHTML = '검은고양이를 합쳐보세요! 🐈‍⬛';
          });
        }, 400);
        return;
      }

      // Game over → silent reset with a 4 to help
      if (!board.canMove()) {
        board = new Board(4);
        board.addRandomTile();
        board.addRandomTile();
        const empty = board.emptyCells;
        if (empty.length > 0) {
          const pos = empty[0];
          board._grid[pos.r][pos.c] = 4;
          board._ids[pos.r][pos.c] = board._nextId++;
        }
        requestAnimationFrame(() => renderBoard());
      }
    }

    // Step 5: Free play until value 16 (bengal)
    if (step === 5) {
      const result = board.move(direction);
      if (!result.moved) return;
      renderer.animateMove(result.movements, board.grid, result.newTile);

      if (board.hasValue(16) && !completed) {
        completed = true;
        setTimeout(() => spawnConfetti(() => completeTutorialFlow()), 200);
        return;
      }

      // Game over → silent reset with an 8 to help
      if (!board.canMove()) {
        board = new Board(4);
        board.addRandomTile();
        board.addRandomTile();
        const empty = board.emptyCells;
        if (empty.length > 0) {
          const pos = empty[0];
          board._grid[pos.r][pos.c] = 8;
          board._ids[pos.r][pos.c] = board._nextId++;
        }
        requestAnimationFrame(() => renderBoard());
      }
    }
  }

  function spawnConfetti(callback) {
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
    setTimeout(() => { if (callback) callback(); }, 1200);
  }

  function completeTutorialFlow() {
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
      <div style="line-height:1"><svg width="72" height="72" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/></svg></div>
      <div style="font-size:32px; font-weight:900; color:#fff;">준비완료!</div>
      <div style="font-size:24px; color:rgba(255,255,255,0.9); line-height:1.5;">
        총 41종의 모든 고양이를<br>모아보세요
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
    removeSwipe();
    renderer.destroy();
    const t = document.querySelector('.toast');
    if (t) t.remove();
  };
}
