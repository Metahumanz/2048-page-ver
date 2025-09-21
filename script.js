const SIZE = 4;
let board = [];
let history = [];
let gameOver = false;
let gameWin = false;
let continuePlaying = false;

let mergedTiles = []; // 本轮合并的方块
let newTile = null;   // 新生成的方块

const container = document.getElementById("game-container");
const gameOverOverlay = document.getElementById("game-over");
const gameWinOverlay = document.getElementById("game-win");
const restartBtn = document.getElementById("restartBtn");
const undoBtn = document.getElementById("undoBtn");
const retryBtn = document.getElementById("retryBtn");
const continueBtn = document.getElementById("continueBtn");

function initBoard() {
  board = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
  addRandomTile();
  addRandomTile();
  render();
  history = [];
  gameOver = false;
  gameWin = false;
  continuePlaying = false;
  gameOverOverlay.style.display = "none";
  gameWinOverlay.style.display = "none";
}

function addRandomTile() {
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length > 0) {
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    newTile = [r, c]; // 标记新生成
  }
}

function render() {
  container.innerHTML = "";
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = board[r][c];
      const tile = document.createElement("div");
      tile.className = "tile";

      if (value !== 0) {
        tile.textContent = value;
        tile.style.background = getTileColor(value);
        tile.style.color = value > 4 ? "#f9f6f2" : "#776e65";

        // 是否是合并方块
        if (mergedTiles.some(([mr, mc]) => mr === r && mc === c)) {
          tile.classList.add("merged");
        }

        // 是否是新生成的方块
        if (newTile && newTile[0] === r && newTile[1] === c) {
          tile.classList.add("new");
        }
      }
      container.appendChild(tile);
    }
  }

  // 渲染后清空记录
  mergedTiles = [];
  newTile = null;
}

function getTileColor(value) {
  const colors = {
    2: "#eee4da",
    4: "#ede0c8",
    8: "#f2b179",
    16: "#f59563",
    32: "#f67c5f",
    64: "#f65e3b",
    128: "#edcf72",
    256: "#edcc61",
    512: "#edc850",
    1024: "#edc53f",
    2048: "#edc22e"
  };
  return colors[value] || "#3c3a32";
}

function saveHistory() {
  history.push(JSON.stringify(board));
  if (history.length > 5) history.shift();
}

function undo() {
  if (history.length > 0) {
    board = JSON.parse(history.pop());
    render();
  }
}

function move(direction) {
  if (gameOver || (gameWin && !continuePlaying)) return;

  saveHistory();
  let moved = false;
  mergedTiles = [];

  for (let i = 0; i < SIZE; i++) {
    let line = [];
    for (let j = 0; j < SIZE; j++) {
      let val;
      if (direction === "left") val = board[i][j];
      if (direction === "right") val = board[i][SIZE - 1 - j];
      if (direction === "up") val = board[j][i];
      if (direction === "down") val = board[SIZE - 1 - j][i];
      if (val !== 0) line.push(val);
    }

    for (let k = 0; k < line.length; k++) {
      if (line[k] === line[k + 1]) {
        line[k] *= 2;
        line.splice(k + 1, 1);

        // 记录合并后的目标位置
        let target;
        if (direction === "left") target = [i, k];
        if (direction === "right") target = [i, SIZE - 1 - k];
        if (direction === "up") target = [k, i];
        if (direction === "down") target = [SIZE - 1 - k, i];
        mergedTiles.push(target);
      }
    }

    while (line.length < SIZE) line.push(0);

    for (let j = 0; j < SIZE; j++) {
      let val = line[j];
      let target;
      if (direction === "left") target = [i, j];
      if (direction === "right") target = [i, SIZE - 1 - j];
      if (direction === "up") target = [j, i];
      if (direction === "down") target = [SIZE - 1 - j, i];

      if (board[target[0]][target[1]] !== val) moved = true;
      board[target[0]][target[1]] = val;

      if (val >= 2048 && !gameWin) {
        gameWin = true;
        setTimeout(() => {
          gameWinOverlay.style.display = "flex";
        }, 100);
      }
    }
  }

  if (moved) {
    addRandomTile();
    render();
    checkGameOver();
  }
}

function checkGameOver() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return;
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return;
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return;
    }
  }
  gameOver = true;
  setTimeout(() => {
    gameOverOverlay.style.display = "flex";
  }, 100);
}

// 键盘
window.addEventListener("keydown", e => {
  switch (e.key) {
    case "ArrowLeft": move("left"); break;
    case "ArrowRight": move("right"); break;
    case "ArrowUp": move("up"); break;
    case "ArrowDown": move("down"); break;
  }
});

// 触摸
let startX, startY;
container.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
});
container.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - startX;
  const dy = e.changedTouches[0].clientY - startY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) move("right");
    else if (dx < -30) move("left");
  } else {
    if (dy > 30) move("down");
    else if (dy < -30) move("up");
  }
});

restartBtn.addEventListener("click", initBoard);
undoBtn.addEventListener("click", undo);
retryBtn.addEventListener("click", initBoard);
continueBtn.addEventListener("click", () => {
  gameWinOverlay.style.display = "none";
  continuePlaying = true;
});

initBoard();
