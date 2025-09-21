const gridSize = 4;
let grid = [];
let score = 0;
let history = []; // 保存历史（最多 5 步）
const gridContainer = document.getElementById("grid-container");
const scoreContainer = document.getElementById("score");
const undoBtn = document.getElementById("undo-btn");

function initGame() {
  grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
  score = 0;
  history = [];
  scoreContainer.textContent = score;
  addRandomTile();
  addRandomTile();
  drawGrid();
}

function addRandomTile() {
  let emptyCells = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === 0) emptyCells.push({ r, c });
    }
  }
  if (emptyCells.length === 0) return;
  let { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function drawGrid(mergedCells = []) {
  gridContainer.innerHTML = "";
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      let value = grid[r][c];
      const tile = document.createElement("div");
      tile.className = "tile";
      if (value > 0) {
        tile.textContent = value;
        tile.dataset.value = value;
      }
      if (mergedCells.some(cell => cell.r === r && cell.c === c)) {
        tile.classList.add("merge");
      }
      gridContainer.appendChild(tile);
    }
  }
}

function saveHistory() {
  history.push({
    grid: grid.map(row => [...row]),
    score: score
  });
  if (history.length > 5) history.shift();
}

function undo() {
  if (history.length === 0) return;
  const last = history.pop();
  grid = last.grid.map(row => [...row]);
  score = last.score;
  scoreContainer.textContent = score;
  drawGrid();
}

function move(direction) {
  let moved = false;
  let mergedCells = [];
  saveHistory(); // 先保存当前状态

  for (let i = 0; i < gridSize; i++) {
    let line = [];
    for (let j = 0; j < gridSize; j++) {
      let value = (direction === "left" || direction === "right") ? grid[i][j] : grid[j][i];
      if (value !== 0) line.push(value);
    }

    if (direction === "right" || direction === "down") line.reverse();

    for (let k = 0; k < line.length - 1; k++) {
      if (line[k] === line[k + 1]) {
        line[k] *= 2;
        score += line[k];
        line.splice(k + 1, 1);
        mergedCells.push({ r: direction === "left" || direction === "right" ? i : k, c: direction === "left" || direction === "right" ? k : i });
      }
    }

    while (line.length < gridSize) line.push(0);
    if (direction === "right" || direction === "down") line.reverse();

    for (let j = 0; j < gridSize; j++) {
      let newValue = line[j];
      let oldValue = (direction === "left" || direction === "right") ? grid[i][j] : grid[j][i];
      if (newValue !== oldValue) moved = true;
      if (direction === "left" || direction === "right") grid[i][j] = newValue;
      else grid[j][i] = newValue;
    }
  }

  if (moved) {
    addRandomTile();
    scoreContainer.textContent = score;
    requestAnimationFrame(() => drawGrid(mergedCells));
  } else {
    history.pop(); // 如果没动，就撤回保存
  }
}

document.addEventListener("keydown", e => {
  switch (e.key) {
    case "ArrowLeft": move("left"); break;
    case "ArrowRight": move("right"); break;
    case "ArrowUp": move("up"); break;
    case "ArrowDown": move("down"); break;
  }
});

undoBtn.addEventListener("click", undo);

// 触摸滑动支持
let startX, startY;
gridContainer.addEventListener("touchstart", e => {
  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
}, { passive: true });

gridContainer.addEventListener("touchend", e => {
  if (!startX || !startY) return;
  const touch = e.changedTouches[0];
  let dx = touch.clientX - startX;
  let dy = touch.clientY - startY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) move("right");
    else if (dx < -30) move("left");
  } else {
    if (dy > 30) move("down");
    else if (dy < -30) move("up");
  }

  startX = startY = null;
});

initGame();
