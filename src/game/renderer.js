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
  return Math.min(60 + (Math.log2(Math.max(value, 2)) - 1) * 3.5, 92);
}

export class Renderer {
  constructor(container, size, stageId) {
    this._container = container;
    this._size = size;
    this._stageId = stageId;
    this._tileEls = new Map(); // key = "r,c" → element
    this._boardEl = null;
    this._cellSize = 0;
    this._gap = 6;
    this._init();
  }

  _init() {
    this._container.innerHTML = '';
    const board = document.createElement('div');
    board.className = 'game-board';
    board.style.cssText = `
      position: relative;
      display: grid;
      grid-template-columns: repeat(${this._size}, 1fr);
      gap: ${this._gap}px;
      padding: ${this._gap}px;
      background: #bbada0;
      border-radius: 8px;
      touch-action: none;
      width: 100%;
      aspect-ratio: 1;
    `;

    // Create background cells
    for (let r = 0; r < this._size; r++) {
      for (let c = 0; c < this._size; c++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.style.cssText = `
          background: rgba(238, 228, 218, 0.35);
          border-radius: 4px;
          aspect-ratio: 1;
        `;
        board.appendChild(cell);
      }
    }

    this._boardEl = board;
    this._container.appendChild(board);

    // Overlay for absolute-positioned tiles
    this._tilesLayer = document.createElement('div');
    this._tilesLayer.style.cssText = `
      position: absolute;
      inset: ${this._gap}px;
      pointer-events: none;
    `;
    board.appendChild(this._tilesLayer);
  }

  _getCellPercent() {
    // Each cell = (100% - gap*(size-1)) / size of the inner area
    const gapTotal = this._gap * (this._size - 1);
    const cellPercent = (100 - (gapTotal / (this._boardEl.offsetWidth - this._gap * 2)) * 100) / this._size;
    return cellPercent;
  }

  _getTilePos(r, c) {
    const boardInner = this._boardEl.offsetWidth - this._gap * 2;
    const cellSize = (boardInner - this._gap * (this._size - 1)) / this._size;
    const x = c * (cellSize + this._gap);
    const y = r * (cellSize + this._gap);
    return { x, y, cellSize };
  }

  _createTileElement(value, r, c) {
    const catId = getCatForValue(this._stageId, value);
    const { x, y, cellSize } = this._getTilePos(r, c);
    const imgSize = getImageSize(value);

    const el = document.createElement('div');
    el.className = 'tile';
    el.dataset.value = value;
    el.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${cellSize}px;
      height: ${cellSize}px;
      background: ${getTileColor(value)};
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: left 0.12s ease, top 0.12s ease;
      will-change: transform;
      overflow: hidden;
    `;

    if (catId) {
      const img = document.createElement('img');
      img.src = getCatImage(catId);
      img.alt = catId;
      img.style.cssText = `
        width: ${imgSize}%;
        height: ${imgSize}%;
        object-fit: contain;
        pointer-events: none;
        -webkit-user-drag: none;
      `;
      el.appendChild(img);
    } else {
      // Text fallback for very high values
      el.style.color = '#fff';
      el.style.fontWeight = '700';
      el.style.fontSize = cellSize > 60 ? '14px' : '11px';
      el.textContent = value >= 1000 ? (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1) + 'k' : value;
    }

    return el;
  }

  renderBoard(grid) {
    this._tileEls.forEach(el => el.remove());
    this._tileEls.clear();

    // Need layout to be ready
    requestAnimationFrame(() => {
      for (let r = 0; r < this._size; r++) {
        for (let c = 0; c < this._size; c++) {
          const value = grid[r][c];
          if (value === 0) continue;
          const el = this._createTileElement(value, r, c);
          this._tilesLayer.appendChild(el);
          this._tileEls.set(`${r},${c}`, el);
        }
      }
    });
  }

  animateMove(prevGrid, newGrid, newTile) {
    // Build new tile elements based on new grid
    const nextEls = new Map();

    // Remove old elements for empty cells & update positions for moved tiles
    // Simple approach: re-render with animation
    const oldEls = new Map(this._tileEls);
    this._tileEls.clear();

    // Match old grid positions to new grid positions
    // For each cell in new grid that has a value, find where it came from
    for (let r = 0; r < this._size; r++) {
      for (let c = 0; c < this._size; c++) {
        const newVal = newGrid[r][c];
        if (newVal === 0) continue;
        if (newTile && newTile.r === r && newTile.c === c) continue; // Handle new tile separately

        const el = this._createTileElement(newVal, r, c);
        this._tilesLayer.appendChild(el);
        this._tileEls.set(`${r},${c}`, el);
        nextEls.set(`${r},${c}`, el);
      }
    }

    // Remove old elements
    oldEls.forEach(el => el.remove());

    // Animate new tile
    if (newTile) {
      const el = this._createTileElement(newTile.value, newTile.r, newTile.c);
      el.style.transform = 'scale(0)';
      el.style.transition = 'transform 0.15s ease';
      this._tilesLayer.appendChild(el);
      this._tileEls.set(`${newTile.r},${newTile.c}`, el);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transform = 'scale(1)';
        });
      });
    }
  }

  updatePositions() {
    this._tileEls.forEach((el, key) => {
      const [r, c] = key.split(',').map(Number);
      const { x, y, cellSize } = this._getTilePos(r, c);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.width = `${cellSize}px`;
      el.style.height = `${cellSize}px`;
    });
  }

  destroy() {
    this._container.innerHTML = '';
    this._tileEls.clear();
  }
}
