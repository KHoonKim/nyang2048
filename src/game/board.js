export class Board {
  constructor(rows, cols) {
    this._rows = rows;
    this._cols = cols != null ? cols : rows;
    this._grid = Array.from({ length: this._rows }, () => Array(this._cols).fill(0));
    this._ids = Array.from({ length: this._rows }, () => Array(this._cols).fill(0));
    this._nextId = 1;
    this._score = 0;
  }

  get grid() { return this._grid; }
  get ids() { return this._ids; }
  get score() { return this._score; }
  get size() { return this._rows; }
  get rows() { return this._rows; }
  get cols() { return this._cols; }

  get emptyCells() {
    const cells = [];
    for (let r = 0; r < this._rows; r++)
      for (let c = 0; c < this._cols; c++)
        if (this._grid[r][c] === 0) cells.push({ r, c });
    return cells;
  }

  addRandomTile() {
    const empty = this.emptyCells;
    if (empty.length === 0) return null;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    this._grid[r][c] = value;
    this._ids[r][c] = this._nextId++;
    return { r, c, value, id: this._ids[r][c] };
  }

  isEmpty(r, c) { return this._grid[r][c] === 0; }

  hasValue(value) {
    for (let r = 0; r < this._rows; r++)
      for (let c = 0; c < this._cols; c++)
        if (this._grid[r][c] === value) return true;
    return false;
  }

  canMove() {
    if (this.emptyCells.length > 0) return true;
    for (let r = 0; r < this._rows; r++)
      for (let c = 0; c < this._cols; c++) {
        const v = this._grid[r][c];
        if (r < this._rows - 1 && this._grid[r + 1][c] === v) return true;
        if (c < this._cols - 1 && this._grid[r][c + 1] === v) return true;
      }
    return false;
  }

  getSnapshot() {
    return {
      grid: this._grid.map(row => [...row]),
      ids: this._ids.map(row => [...row]),
      score: this._score,
      nextId: this._nextId,
    };
  }

  restoreSnapshot(snapshot) {
    this._grid = snapshot.grid.map(row => [...row]);
    this._ids = snapshot.ids
      ? snapshot.ids.map(row => [...row])
      : this._grid.map(row => row.map(v => v > 0 ? this._nextId++ : 0));
    this._score = snapshot.score;
    if (snapshot.nextId) this._nextId = snapshot.nextId;
  }

  move(direction) {
    const before = this.getSnapshot();
    const movements = [];
    let scoreDelta = 0;

    const newGrid = Array.from({ length: this._rows }, () => Array(this._cols).fill(0));
    const newIds = Array.from({ length: this._rows }, () => Array(this._cols).fill(0));

    if (direction === 'left' || direction === 'right') {
      for (let r = 0; r < this._rows; r++) {
        // Collect non-zero tiles
        const tiles = [];
        if (direction === 'left') {
          for (let c = 0; c < this._cols; c++) {
            if (this._grid[r][c] !== 0) tiles.push({ value: this._grid[r][c], id: this._ids[r][c], r, c });
          }
        } else {
          for (let c = this._cols - 1; c >= 0; c--) {
            if (this._grid[r][c] !== 0) tiles.push({ value: this._grid[r][c], id: this._ids[r][c], r, c });
          }
        }

        let destIdx = 0;
        let i = 0;
        while (i < tiles.length) {
          const destC = direction === 'left' ? destIdx : this._cols - 1 - destIdx;
          if (i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value) {
            const newId = this._nextId++;
            const mergedValue = tiles[i].value * 2;
            scoreDelta += mergedValue;
            movements.push({ id: tiles[i].id, fromR: tiles[i].r, fromC: tiles[i].c, toR: r, toC: destC, merged: true, newId });
            movements.push({ id: tiles[i + 1].id, fromR: tiles[i + 1].r, fromC: tiles[i + 1].c, toR: r, toC: destC, merged: true, newId });
            newGrid[r][destC] = mergedValue;
            newIds[r][destC] = newId;
            i += 2;
          } else {
            movements.push({ id: tiles[i].id, fromR: tiles[i].r, fromC: tiles[i].c, toR: r, toC: destC, merged: false });
            newGrid[r][destC] = tiles[i].value;
            newIds[r][destC] = tiles[i].id;
            i++;
          }
          destIdx++;
        }
      }
    } else {
      // 'up' or 'down'
      for (let c = 0; c < this._cols; c++) {
        const tiles = [];
        if (direction === 'up') {
          for (let r = 0; r < this._rows; r++) {
            if (this._grid[r][c] !== 0) tiles.push({ value: this._grid[r][c], id: this._ids[r][c], r, c });
          }
        } else {
          for (let r = this._rows - 1; r >= 0; r--) {
            if (this._grid[r][c] !== 0) tiles.push({ value: this._grid[r][c], id: this._ids[r][c], r, c });
          }
        }

        let destIdx = 0;
        let i = 0;
        while (i < tiles.length) {
          const destR = direction === 'up' ? destIdx : this._rows - 1 - destIdx;
          if (i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value) {
            const newId = this._nextId++;
            const mergedValue = tiles[i].value * 2;
            scoreDelta += mergedValue;
            movements.push({ id: tiles[i].id, fromR: tiles[i].r, fromC: tiles[i].c, toR: destR, toC: c, merged: true, newId });
            movements.push({ id: tiles[i + 1].id, fromR: tiles[i + 1].r, fromC: tiles[i + 1].c, toR: destR, toC: c, merged: true, newId });
            newGrid[destR][c] = mergedValue;
            newIds[destR][c] = newId;
            i += 2;
          } else {
            movements.push({ id: tiles[i].id, fromR: tiles[i].r, fromC: tiles[i].c, toR: destR, toC: c, merged: false });
            newGrid[destR][c] = tiles[i].value;
            newIds[destR][c] = tiles[i].id;
            i++;
          }
          destIdx++;
        }
      }
    }

    // Check if anything moved
    let moved = false;
    outer: for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        if (newGrid[r][c] !== before.grid[r][c]) { moved = true; break outer; }
      }
    }

    if (!moved) return { moved: false, scoreDelta: 0, movements: [], newTile: null };

    this._grid = newGrid;
    this._ids = newIds;
    this._score += scoreDelta;
    const newTile = this.addRandomTile();
    return { moved: true, scoreDelta, movements, newTile };
  }
}
