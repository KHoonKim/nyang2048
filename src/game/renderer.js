import { getCatForValue, getCatImage } from './stages.js';

const TILE_COLORS = {
  2:    '#fef3e2',
  4:    '#fde8c8',
  8:    '#f9c98b',
  16:   '#f5a855',
  32:   '#f28c3e',
  64:   '#e96d2b',
  128:  '#e74c3c',
  256:  '#c0392b',
  512:  '#9b59b6',
  1024: '#8e44ad',
  2048: '#f1c40f',
  4096: '#2ecc71',
  8192: '#1abc9c',
};

function getTileColor(value) {
  const key = Object.keys(TILE_COLORS).reverse().find(k => value >= parseInt(k));
  return TILE_COLORS[key] || '#1abc9c';
}

function getImageSize(value) {
  return Math.min(75 + (Math.log2(Math.max(value, 2)) - 1) * 3, 95);
}

const ANIM_MS = 150;
const EASE_SLIDE = 'cubic-bezier(0.12, 0.8, 0.32, 1)';

export class Renderer {
  constructor(container, rows, cols, stageId) {
    this._container = container;
    this._rows = rows;
    this._cols = cols != null ? cols : rows;
    this._stageId = stageId;
    this._tileEls = new Map(); // tileId → element
    this._boardEl = null;
    this._tilesLayer = null;
    this._gap = 6;
    this._cellSize = 0;
    this._animating = false;
    this._init();
  }

  get animating() { return this._animating; }

  _init() {
    this._container.innerHTML = '';
    const board = document.createElement('div');
    board.className = 'game-board';
    board.style.cssText = `
      position: relative;
      display: grid;
      grid-template-columns: repeat(${this._cols}, 1fr);
      gap: ${this._gap}px;
      padding: ${this._gap}px;
      background: #bbada0;
      border-radius: 8px;
      touch-action: none;
      width: 100%;
      aspect-ratio: ${this._cols} / ${this._rows};
    `;
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.style.cssText = `background: rgba(238,228,218,0.35); border-radius: 4px; aspect-ratio: 1;`;
        board.appendChild(cell);
      }
    }
    this._boardEl = board;
    this._container.appendChild(board);

    this._tilesLayer = document.createElement('div');
    this._tilesLayer.style.cssText = `position: absolute; inset: ${this._gap}px; pointer-events: none;`;
    board.appendChild(this._tilesLayer);
  }

  _measureCell() {
    const boardInner = this._boardEl.offsetWidth - this._gap * 2;
    this._cellSize = (boardInner - this._gap * (this._cols - 1)) / this._cols;
    return this._cellSize;
  }

  _getTilePos(r, c) {
    const cellSize = this._cellSize || this._measureCell();
    const x = c * (cellSize + this._gap);
    const y = r * (cellSize + this._gap);
    return { x, y, cellSize };
  }

  _createTileElement(value, r, c, noTransition) {
    const catId = getCatForValue(this._stageId, value);
    const { x, y, cellSize } = this._getTilePos(r, c);
    const imgSize = getImageSize(value);

    const el = document.createElement('div');
    el.className = 'tile';
    el.dataset.value = value;
    el.dataset.r = r;
    el.dataset.c = c;
    el.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: ${cellSize}px;
      height: ${cellSize}px;
      background: ${getTileColor(value)};
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(${x}px, ${y}px);
      ${noTransition ? '' : `transition: transform ${ANIM_MS}ms ${EASE_SLIDE};`}
      will-change: transform;
      overflow: hidden;
      z-index: 5;
    `;

    if (catId) {
      const img = document.createElement('img');
      img.src = getCatImage(catId);
      img.alt = catId;
      img.style.cssText = `width:${imgSize}%; height:${imgSize}%; object-fit:contain; pointer-events:none; -webkit-user-drag:none;`;
      el.appendChild(img);
    } else {
      el.style.color = '#fff';
      el.style.fontWeight = '700';
      el.style.fontSize = cellSize > 60 ? '14px' : '11px';
      el.textContent = value >= 1000 ? (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1) + 'k' : value;
    }
    return el;
  }

  renderBoard(grid, ids) {
    this._tileEls.forEach(el => el.remove());
    this._tileEls.clear();
    this._animating = false;

    requestAnimationFrame(() => {
      this._measureCell();
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          const value = grid[r][c];
          if (value === 0) continue;
          const id = ids ? ids[r][c] : (r * this._cols + c + 1);
          const el = this._createTileElement(value, r, c, true);
          this._tilesLayer.appendChild(el);
          this._tileEls.set(id, el);
        }
      }
      // Enable transitions after initial placement
      requestAnimationFrame(() => {
        this._tileEls.forEach(el => {
          el.style.transition = `transform ${ANIM_MS}ms ${EASE_SLIDE}`;
        });
      });
    });
  }

  animateMove(movements, newGrid, newTile, { shake = false, highMerge = false } = {}) {
    // Legacy fallback: if movements is a 2D array (old prevGrid format)
    if (!Array.isArray(movements) || (movements.length > 0 && Array.isArray(movements[0]))) {
      this.renderBoard(newGrid);
      return;
    }
    if (movements.length === 0) return;

    this._animating = true;
    this._measureCell();

    // Track merge targets: "toR,toC" → {toR, toC, newId}
    const mergeTargets = new Map();

    movements.forEach(m => {
      const el = this._tileEls.get(m.id);
      if (!el) return;
      const { x, y } = this._getTilePos(m.toR, m.toC);
      el.style.transition = `transform ${ANIM_MS}ms ${EASE_SLIDE}`;
      el.style.transform = `translate(${x}px, ${y}px)`;
      if (m.merged) {
        el.style.zIndex = '10';
        const key = `${m.toR},${m.toC}`;
        if (!mergeTargets.has(key)) {
          mergeTargets.set(key, { toR: m.toR, toC: m.toC, newId: m.newId });
        }
      }
    });

    setTimeout(() => {
      // Remove merged tiles
      movements.forEach(m => {
        if (m.merged) {
          const el = this._tileEls.get(m.id);
          if (el) el.remove();
          this._tileEls.delete(m.id);
        }
      });

      // Create merged tile with dramatic pop + flash + shake
      const hasMerge = mergeTargets.size > 0;
      mergeTargets.forEach(({ toR, toC, newId }) => {
        const value = newGrid[toR][toC];
        const { x, y, cellSize } = this._getTilePos(toR, toC);
        const el = this._createTileElement(value, toR, toC, true);
        el.style.transform = `translate(${x}px, ${y}px) scale(0)`;
        el.style.opacity = '0';
        this._tilesLayer.appendChild(el);
        this._tileEls.set(newId, el);

        // Flash burst behind the merged tile
        const flashSize = highMerge ? cellSize * 2.2 : cellSize * 1.6;
        const flashOffset = highMerge ? cellSize * 0.6 : cellSize * 0.3;
        const flash = document.createElement('div');
        flash.style.cssText = `
          position: absolute; left: 0; top: 0;
          width: ${flashSize}px; height: ${flashSize}px;
          transform: translate(${x - flashOffset}px, ${y - flashOffset}px) scale(0);
          background: radial-gradient(circle, ${highMerge ? 'rgba(255,220,80,0.9)' : 'rgba(255,200,50,0.7)'} 0%, rgba(255,107,53,0.3) 50%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 4;
        `;
        this._tilesLayer.appendChild(flash);

        requestAnimationFrame(() => requestAnimationFrame(() => {
          // Flash expands and fades
          const flashScale = highMerge ? 1.6 : 1.2;
          flash.style.transition = 'transform 0.35s ease-out, opacity 0.35s ease-out';
          flash.style.transform = `translate(${x - flashOffset}px, ${y - flashOffset}px) scale(${flashScale})`;
          flash.style.opacity = '0';
          setTimeout(() => flash.remove(), 400);

          // Tile pops in with overshoot, initially as number
          const popEasing = highMerge ? 'cubic-bezier(0.17, 0.89, 0.32, 1.5)' : 'cubic-bezier(0.17, 0.89, 0.32, 1.28)';
          this._prepareNumberReveal(el, cellSize);
          el.style.transition = `transform 0.3s ${popEasing}, opacity 0.1s ease`;
          el.style.transform = `translate(${x}px, ${y}px) scale(1)`;
          el.style.opacity = '1';
          this._scheduleCatReveal(el, x, y, cellSize);
        }));
      });

      // Board shake on new highest value
      if (shake && this._boardEl) {
        this._boardEl.animate([
          { transform: 'translate(0, 0)' },
          { transform: 'translate(6px, -3px)' },
          { transform: 'translate(-6px, 2px)' },
          { transform: 'translate(5px, -2px)' },
          { transform: 'translate(-4px, 1px)' },
          { transform: 'translate(2px, 0)' },
          { transform: 'translate(0, 0)' },
        ], { duration: 350, easing: 'ease-out' });
      }

      // Spawn new tile
      if (newTile) {
        const { x, y } = this._getTilePos(newTile.r, newTile.c);
        const el = this._createTileElement(newTile.value, newTile.r, newTile.c, true);
        el.style.transform = `translate(${x}px, ${y}px) scale(0)`;
        el.style.opacity = '0';
        this._tilesLayer.appendChild(el);
        this._tileEls.set(newTile.id, el);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.transition = `transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.12s ease`;
          el.style.transform = `translate(${x}px, ${y}px) scale(1)`;
          el.style.opacity = '1';
        }));
      }

      // Animation complete
      setTimeout(() => {
        this._animating = false;
      }, 300);
    }, ANIM_MS + 10);
  }

  _prepareNumberReveal(el, cellSize) {
    const img = el.querySelector('img');
    if (!img) return; // non-cat tile already shows number
    // Hide cat image
    img.style.opacity = '0';
    img.style.transition = 'none';
    // Create temporary centered number label
    const numText = el.dataset.value >= 1000
      ? (el.dataset.value / 1000).toFixed(el.dataset.value % 1000 === 0 ? 0 : 1) + 'k'
      : el.dataset.value;
    const tmpNum = document.createElement('span');
    tmpNum.className = 'tile-num-reveal';
    tmpNum.textContent = numText;
    tmpNum.style.cssText = `
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 900;
      font-size: ${cellSize > 60 ? '28px' : '20px'};
      text-shadow: 0 2px 8px rgba(0,0,0,0.7);
      pointer-events: none; z-index: 2;
    `;
    el.appendChild(tmpNum);
  }

  _scheduleCatReveal(el, x, y, cellSize) {
    const img = el.querySelector('img');
    if (!img) return; // non-cat tile, nothing to reveal
    setTimeout(() => {
      // First half of flip: compress to 0
      el.style.transition = 'transform 0.14s ease-in';
      el.style.transform = `translate(${x}px, ${y}px) scaleX(0)`;
      setTimeout(() => {
        // Remove temp number, reveal cat
        const tmpNum = el.querySelector('.tile-num-reveal');
        if (tmpNum) tmpNum.remove();
        img.style.transition = 'none';
        img.style.opacity = '1';
        // Second half: expand back
        el.style.transition = 'transform 0.14s ease-out';
        el.style.transform = `translate(${x}px, ${y}px) scale(1)`;
      }, 140);
    }, 360);
  }

  updatePositions() {
    // ID-based system — positions are tracked via transform on elements directly
  }

  destroy() {
    this._container.innerHTML = '';
    this._tileEls.clear();
  }
}
