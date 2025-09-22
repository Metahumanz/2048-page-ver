const SIZE = 4;
let board = [];
let history = [];
let score = 0;
let bestScore = localStorage.getItem("bestScore") ? parseInt(localStorage.getItem("bestScore")) : 0;
let mergedTiles = [];
let newTile = null;
let gameOver = false;
let gameWin = false;
let continuePlaying = false;

let slidingTiles = []; // 存储正在滑动的方块信息
let oldBoard = []; // 存储移动前的棋盘状态

const container = document.getElementById("game-container");
const gameOverOverlay = document.getElementById("game-over");
const gameWinOverlay = document.getElementById("game-win");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
bestScoreElement.textContent = bestScore;

function init() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  oldBoard = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  history = [];
  score = 0;
  updateScore(0);
  gameOver = false;
  gameWin = false;
  continuePlaying = false;
  gameOverOverlay.style.display = "none";
  gameWinOverlay.style.display = "none";
  addRandomTile();
  addRandomTile();
  render(false);
}

function updateScore(add) {
  score += add;
  scoreElement.textContent = score;
  if (score > bestScore) {
    bestScore = score;
    bestScoreElement.textContent = bestScore;
    localStorage.setItem("bestScore", bestScore);
  }
}

function saveHistory() {
  history.push({
    board: board.map(row => [...row]),
    score: score
  });
  if (history.length > 5) history.shift();

  // 保存移动前的状态用于动画
  oldBoard = board.map(row => [...row]);
}

function undoMove() {
  if (history.length > 0) {
    const last = history.pop();
    board = last.board;
    score = last.score;
    scoreElement.textContent = score;
    render(false);
  }
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

// 重写 render 函数以支持滑动动画
function render(animate = true) {
  // 清除容器
  container.innerHTML = "";
  
  // 先创建网格背景
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.style.gridArea = `${r + 1} / ${c + 1} / ${r + 2} / ${c + 2}`;
      container.appendChild(cell);
    }
  }
  
  // 创建数字方块
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = board[r][c];
      if (value !== 0) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.textContent = value;
        tile.style.background = getTileColor(value);
        tile.style.color = value > 4 ? "#f9f6f2" : "#776e65";
        
        // 设置方块位置
        const cellSize = (container.offsetWidth - 20) / SIZE; // 减去padding
        tile.style.width = `${cellSize}px`;
        tile.style.height = `${cellSize}px`;
        tile.style.left = `${c * (cellSize + 10) + 10}px`; // 10是gap
        tile.style.top = `${r * (cellSize + 10) + 10}px`;
        
        // 检查是否需要添加动画
        if (animate && oldBoard && oldBoard.length > 0) {
          // 查找这个方块在移动前的位置
          for (let oldR = 0; oldR < SIZE; oldR++) {
            for (let oldC = 0; oldC < SIZE; oldC++) {
              if (oldBoard[oldR][oldC] === value) {
                // 检查是否是从其他位置移动过来的（不是新生成的）
                const isNewTile = !newTile || (newTile[0] === r && newTile[1] === c);
                const isMerged = mergedTiles.some(([mr, mc]) => mr === r && mc === c);
                
                if ((oldR !== r || oldC !== c) && !isNewTile && !isMerged) {
                  // 计算移动距离
                  const startLeft = oldC * (cellSize + 10) + 10;
                  const startTop = oldR * (cellSize + 10) + 10;
                  
                  // 设置起始位置
                  tile.style.left = `${startLeft}px`;
                  tile.style.top = `${startTop}px`;
                  
                  // 添加滑动类
                  tile.classList.add("sliding");
                  
                  // 使用requestAnimationFrame触发动画
                  requestAnimationFrame(() => {
                    tile.style.left = `${c * (cellSize + 10) + 10}px`;
                    tile.style.top = `${r * (cellSize + 10) + 10}px`;
                  });
                  
                  // 动画结束后移除滑动类
                  setTimeout(() => {
                    tile.classList.remove("sliding");
                  }, 150);
                }
                break;
              }
            }
          }
        }
        
        // 添加合并和新方块的动画
        if (mergedTiles.some(([mr, mc]) => mr === r && mc === c)) {
          tile.classList.add("merged");
        }
        if (newTile && newTile[0] === r && newTile[1] === c) {
          tile.classList.add("new");
        }
        
        container.appendChild(tile);
      }
    }
  }
  
  // 重置状态
  mergedTiles = [];
  newTile = null;
  slidingTiles = [];
}

function getTileColor(value) {
  const colors = {
    2: "#eee4da", 4: "#ede0c8", 8: "#f2b179", 16: "#f59563",
    32: "#f67c5f", 64: "#f65e3b", 128: "#edcf72", 256: "#edcc61",
    512: "#edc850", 1024: "#edc53f", 2048: "#edc22e",
  };
  return colors[value] || "#3c3a32";
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
        updateScore(line[k]);
        line.splice(k + 1, 1);

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
    render(true);
    checkGameOver();
  }else {
    // 如果没有移动，移除保存的旧状态
    oldBoard = [];
  }
}

function checkGameOver() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return;
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return;
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return;
    }
  }
  gameOver = true;
  setTimeout(() => {
    gameOverOverlay.style.display = "flex";
  }, 100);
}

function restartGame() {
  init();
}
function continueGame() {
  continuePlaying = true;
  gameWinOverlay.style.display = "none";
}

document.getElementById("undo").addEventListener("click", undoMove);
document.getElementById("restart").addEventListener("click", restartGame);

document.addEventListener("keydown", e => {
  switch (e.key) {
    case "ArrowLeft": move("left"); break;
    case "ArrowRight": move("right"); break;
    case "ArrowUp": move("up"); break;
    case "ArrowDown": move("down"); break;
  }
});

let startX, startY;

container.addEventListener("touchstart", e => {
  const t = e.touches[0];
  startX = t.clientX;
  startY = t.clientY;
});

container.addEventListener("touchmove", e => {
  // 阻止浏览器滚动/下拉刷新
  e.preventDefault();
}, { passive: false });

container.addEventListener("touchend", e => {
  const t = e.changedTouches[0];
  let dx = t.clientX - startX;
  let dy = t.clientY - startY;
  const minSwipeDistance = 20; // 降低阈值，移动端更灵敏
  
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > minSwipeDistance) move("right");
    else if (dx < -minSwipeDistance) move("left");
  } else {
    if (dy > minSwipeDistance) move("down");
    else if (dy < -minSwipeDistance) move("up");
  }
});


init();
