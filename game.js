const gridSize = 4;
let grid = [];
let score = 0;
let undoStack = [];

const gridContainer = document.getElementById("grid-container");
const scoreContainer = document.getElementById("score");
const undoBtn = document.getElementById("undo-btn");
const restartBtn = document.getElementById("restart-btn");

const cellSize = 100;
const cellGap = 10;

function initGame() {
  grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
  score = 0;
  undoStack = [];
  scoreContainer.textContent = score;
  addRandomTile();
  addRandomTile();
  drawGrid(true);
}

function saveState() {
  undoStack.push({ grid: JSON.parse(JSON.stringify(grid)), score });
  if (undoStack.length > 5) undoStack.shift();
}

function undo() {
  if (undoStack.length > 0) {
    let prev = undoStack.pop();
    grid = prev.grid;
    score = prev.score;
    scoreContainer.textContent = score;
    drawGrid(true);
  }
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

function drawGrid(noAnim = false) {
  gridContainer.innerHTML = "";
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      let value = grid[r][c];
      if (value > 0) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.textContent = value;
        tile.dataset.value = value;
        tile.style.left = `${c * (cellSize + cellGap) + cellGap}px`;
        tile.style.top = `${r * (cellSize + cellGap) + cellGap}px`;
        if (!noAnim) tile.classList.add("new");
        gridContainer.appendChild(tile);
      }
    }
  }
}

function move(direction) {
  saveState();
  let moved = false;
  let mergedSet = [];

  const moveLine = (line) => {
    line = line.filter(v => v !== 0);
    for (let i = 0; i < line.length - 1; i++) {
      if (line[i] === line[i + 1]) {
        line[i] *= 2;
        score += line[i];
        line.splice(i + 1, 1);
        mergedSet.push(line[i]);
      }
    }
    while (line.length < gridSize) line.push(0);
    return line;
  };

  for (let i = 0; i < gridSize; i++) {
    let line = [];
    for (let j = 0; j < gridSize; j++) {
      let value = (direction === "left" || direction === "right") ? grid[i][j] : grid[j][i];
      line.push(value);
    }

    if (direction === "right" || direction === "down") line.reverse();

    let newLine = moveLine(line);

    if (direction === "right" || direction === "down") newLine.reverse();

    for (let j = 0; j < gridSize; j++) {
      let newValue = newLine[j];
      let oldValue = (direction === "left" || direction === "right") ? grid[i][j] : grid[j][i];
      if (newValue !== oldValue) moved = true;
      if (direction === "left" || direction === "right") grid[i][j] = newValue;
      else grid[j][i] = newValue;
    }
  }

  if (moved) {
    addRandomTile();
    scoreContainer.textContent = score;
    drawGrid();
    // 合并动画
    requestAnimationFrame(() => {
      document.querySelectorAll(".tile").forEach(tile => {
        if (mergedSet.includes(parseInt(tile.textContent))) {
          tile.classList.add("merge");
        }
      });
    });
  } else {
    undoStack.pop(); // 撤销无效移动的存档
  }
}

// 键盘控制
document.addEventListener("keydown", e => {
  switch (e.key) {
    case "ArrowLeft": move("left"); break;
    case "ArrowRight": move("right"); break;
    case "ArrowUp": move("up"); break;
    case "ArrowDown": move("down"); break;
  }
});

// 触摸滑动控制
let startX, startY;
gridContainer.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
}, { passive: true });

gridContainer.addEventListener("touchend", e => {
  let dx = e.changedTouches[0].clientX - startX;
  let dy = e.changedTouches[0].clientY - startY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) move("right");
    else if (dx < -30) move("left");
  } else {
    if (dy > 30) move("down");
    else if (dy < -30) move("up");
  }
}, { passive: true });

// 按钮事件
undoBtn.addEventListener("click", undo);
restartBtn.addEventListener("click", initGame);

// 初始化
initGame();
