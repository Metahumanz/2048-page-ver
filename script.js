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

const container = document.getElementById("game-container");
const gameOverOverlay = document.getElementById("game-over");
const gameWinOverlay = document.getElementById("game-win");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
bestScoreElement.textContent = bestScore;

// 存储当前所有方块元素
let tileElements = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

function init() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  history = [];
  score = 0;
  updateScore(0);
  gameOver = false;
  gameWin = false;
  continuePlaying = false;
  gameOverOverlay.style.display = "none";
  gameWinOverlay.style.display = "none";
  tileElements = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  container.innerHTML = "";
  addRandomTile();
  addRandomTile();
  render();
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
}

function undoMove() {
  if (history.length > 0) {
    const last = history.pop();
    board = last.board;
    score = last.score;
    scoreElement.textContent = score;
    render();
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

function render() {
  // 移除所有现有的方块
  const existingTiles = container.querySelectorAll('.tile');
  existingTiles.forEach(tile => tile.remove());
  
  // 重新创建所有方块
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
        const cellSize = container.offsetWidth / SIZE;
        tile.style.transform = `translate(${c * cellSize}px, ${r * cellSize}px)`;
        
        if (mergedTiles.some(([mr, mc]) => mr === r && mc === c)) {
          tile.classList.add("merged");
        }
        if (newTile && newTile[0] === r && newTile[1] === c) {
          tile.classList.add("new");
        }
        
        container.appendChild(tile);
        tileElements[r][c] = tile;
      } else {
        tileElements[r][c] = null;
      }
    }
  }
  mergedTiles = [];
  newTile = null;
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
  
  // 保存移动前的状态
  const oldBoard = board.map(row => [...row]);
  
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
    }
  }

  if (moved) {
    // 先渲染方块，然后添加滑动动画
    render();
    
    // 添加滑动动画
    animateMove(oldBoard, direction);
    
    // 延迟添加新方块，让滑动动画先完成
    setTimeout(() => {
      addRandomTile();
      render();
      checkGameOver();
    }, 150);
    
    if (board.some(row => row.some(cell => cell >= 2048)) && !gameWin) {
      gameWin = true;
      setTimeout(() => {
        gameWinOverlay.style.display = "flex";
      }, 300);
    }
  }
}

function animateMove(oldBoard, direction) {
  const cellSize = container.offsetWidth / SIZE;
  
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const oldValue = oldBoard[r][c];
      const newValue = board[r][c];
      
      if (oldValue !== 0) {
        // 查找这个值移动到了哪里
        let newR = -1, newC = -1;
        
        // 根据移动方向查找新位置
        if (direction === "left") {
          for (let nc = 0; nc < SIZE; nc++) {
            if (board[r][nc] === oldValue && (nc !== c || oldValue !== newValue)) {
              newR = r;
              newC = nc;
              break;
            }
          }
        } else if (direction === "right") {
          for (let nc = SIZE - 1; nc >= 0; nc--) {
            if (board[r][nc] === oldValue && (nc !== c || oldValue !== newValue)) {
              newR = r;
              newC = nc;
              break;
            }
          }
        } else if (direction === "up") {
          for (let nr = 0; nr < SIZE; nr++) {
            if (board[nr][c] === oldValue && (nr !== r || oldValue !== newValue)) {
              newR = nr;
              newC = c;
              break;
            }
          }
        } else if (direction === "down") {
          for (let nr = SIZE - 1; nr >= 0; nr--) {
            if (board[nr][c] === oldValue && (nr !== r || oldValue !== newValue)) {
              newR = nr;
              newC = c;
              break;
            }
          }
        }
        
        // 如果找到了新位置且位置发生了变化，添加滑动动画
        if (newR !== -1 && newC !== -1 && (newR !== r || newC !== c)) {
          const tile = tileElements[newR][newC];
          if (tile) {
            // 先设置到旧位置
            tile.style.transform = `translate(${c * cellSize}px, ${r * cellSize}px)`;
            // 然后动画到新位置
            setTimeout(() => {
              tile.style.transform = `translate(${newC * cellSize}px, ${newR * cellSize}px)`;
            }, 10);
          }
        }
      }
    }
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
  }, 300);
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