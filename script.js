const SIZE = 4;
let board = [];
let history = [];
const MAX_HISTORY = 5;

let gameOver = false;
let gameWin = false;
let continuePlaying = false;

let mergedTiles = [];
let newTile = null;

const container = document.getElementById("game-board");
const gameOverOverlay = document.getElementById("game-over");
const gameWinOverlay = document.getElementById("game-win");

function init() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  history = [];
  gameOver = false;
  gameWin = false;
  continuePlaying = false;
  addRandomTile();
  addRandomTile();
  render();
}

function saveHistory() {
  if (history.length >= MAX_HISTORY) history.shift();
  history.push(JSON.parse(JSON.stringify(board)));
}

function undo() {
  if (history.length > 0) {
    board = history.pop();
    render();
  }
}

function restartGame() {
  gameOverOverlay.style.display = "none";
  gameWinOverlay.style.display = "none";
  init();
}

function continueGame() {
  gameWinOverlay.style.display = "none";
  continuePlaying = true;
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
    newTile = [r, c];
  }
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
    2048: "#edc22e",
  };
  return colors[value] || "#3c3a32";
}

function render() {
  container.innerHTML = "";

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = board[r][c];
      if (value === 0) continue;

      const tile = document.createElement("div");
      tile.className = "tile";
      tile.textContent = value;
      tile.style.background = getTileColor(value);
      tile.style.color = value > 4 ? "#f9f6f2" : "#776e65";

      const x = c * 80 + 10;
      const y = r * 80 + 10;
      tile.style.transform = `translate(${x}px, ${y}px)`;

      // 合并动画
      if (mergedTiles.some(([mr, mc]) => mr === r && mc === c)) {
        tile.classList.add("merged");
      }

      // 新生成动画
      if (newTile && newTile[0] === r && newTile[1] === c) {
        tile.classList.add("new");
      }

      container.appendChild(tile);
    }
  }

  mergedTiles = [];
  newTile = null;
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

        let target;
        if (direction === "left") target = [i, k];
        if (direction === "right") target = [i, SIZE - 1 - k];
        if (direction === "up") target = [k, i];
        if (direction === "down") target = [SIZE - 1 - k, i];
        mergedTiles.push(target);

        if (line[k] >= 2048 && !gameWin) {
          gameWin = true;
          setTimeout(() => {
            gameWinOverlay.style.display = "flex";
          }, 100);
        }
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

document.getElementById("restartBtn").onclick = restartGame;
document.getElementById("undoBtn").onclick = undo;

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") move("left");
  if (e.key === "ArrowRight") move("right");
  if (e.key === "ArrowUp") move("up");
  if (e.key === "ArrowDown") move("down");
});

// 触摸支持
let touchStartX, touchStartY;
document.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
document.addEventListener("touchend", e => {
  let dx = e.changedTouches[0].clientX - touchStartX;
  let dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) move("right");
    else if (dx < -30) move("left");
  } else {
    if (dy > 30) move("down");
    else if (dy < -30) move("up");
  }
});

init();
