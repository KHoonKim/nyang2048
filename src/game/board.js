export class Board {
  constructor(size) {
    this._size = size;
    this._grid = Array.from({ length: size }, () => Array(size).fill(0));
    this._score = 0;
  }

  get grid() { return this._grid; }
  get score() { return this._score; }
  get size() { return this._size; }

  get emptyCells() {
    const cells = [];
    for (let r = 0; r < this._size; r++) {
      for (let c = 0; c < this._size; c++) {
        if (this._grid[r][c] === 0) cells.push({ r, c });
      }
    }
    return cells;
  }

  addRandomTile() {
    const empty = this.emptyCells;
    if (empty.length === 0) return null;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    this._grid[r][c] = value;
    return { r, c, value };
  }

  isEmpty(r, c) { return this._grid[r][c] === 0; }

  hasValue(value) {
    for (let r = 0; r < this._size; r++) {
      for (let c = 0; c < this._size; c++) {
        if (this._grid[r][c] === value) return true;
      }
    }
    return false;
  }

  canMove() {
    if (this.emptyCells.length > 0) return true;
    for (let r = 0; r < this._size; r++) {
      for (let c = 0; c < this._size; c++) {
        const v = this._grid[r][c];
        if (r < this._size - 1 && this._grid[r + 1][c] === v) return true;
        if (c < this._size - 1 && this._grid[r][c + 1] === v) return true;
      }
    }
    return false;
  }

  getSnapshot() {
    return {
      grid: this._grid.map(row => [...row]),
      score: this._score,
    };
  }

  restoreSnapshot(snapshot) {
    this._grid = snapshot.grid.map(row => [...row]);
    this._score = snapshot.score;
  }

  // Returns { moved: bool, scoreDelta: number, merges: [{fromR, fromC, toR, toC, value}], newTile: {r,c,value}|null }
  move(direction) {
    const before = this.getSnapshot();
    const merges = [];
    let scoreDelta = 0;

    const rotate = (grid) => {
      const n = grid.length;
      return Array.from({ length: n }, (_, r) =>
        Array.from({ length: n }, (_, c) => grid[n - 1 - c][r])
      );
    };

    // Normalize: always slide left
    let rotations = 0;
    if (direction === 'up') rotations = 1;
    else if (direction === 'right') rotations = 2;
    else if (direction === 'down') rotations = 3;

    let grid = this._grid;
    for (let i = 0; i < rotations; i++) grid = rotate(grid);

    // Slide left on each row
    for (let r = 0; r < this._size; r++) {
      const row = grid[r].filter(v => v !== 0);
      const merged = [];
      let i = 0;
      while (i < row.length) {
        if (i + 1 < row.length && row[i] === row[i + 1]) {
          merged.push(row[i] * 2);
          scoreDelta += row[i] * 2;
          i += 2;
        } else {
          merged.push(row[i]);
          i++;
        }
      }
      while (merged.length < this._size) merged.push(0);
      grid[r] = merged;
    }

    // Rotate back
    const backRotations = (4 - rotations) % 4;
    for (let i = 0; i < backRotations; i++) grid = rotate(grid);

    // Check if moved
    let moved = false;
    for (let r = 0; r < this._size; r++) {
      for (let c = 0; c < this._size; c++) {
        if (grid[r][c] !== before.grid[r][c]) { moved = true; break; }
      }
      if (moved) break;
    }

    if (!moved) return { moved: false, scoreDelta: 0, merges: [], newTile: null };

    this._grid = grid;
    this._score += scoreDelta;

    // Find merged positions (compare before/after for display)
    // Simple approach: record new tiles that appeared at higher values
    const newTile = this.addRandomTile();

    return { moved: true, scoreDelta, merges, newTile };
  }
}
