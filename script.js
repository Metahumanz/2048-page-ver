const SIZE = 4;
let board = [];
let history = [];
let score = 0;
let bestScore = localStorage.getItem("bestScore") ? parseInt(localStorage.getItem("bestScore")) : 0;
// 移除 mergedTiles 和 newTile，因为它们的功能将被整合到动画逻辑中
let gameOver = false;
let gameWin = false;
let continuePlaying = false;
let mergedPositions = [];


const container = document.getElementById("game-container");
const gameOverOverlay = document.getElementById("game-over");
const gameWinOverlay = document.getElementById("game-win");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
bestScoreElement.textContent = bestScore;

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
  addRandomTile();
  addRandomTile();
  // 初始渲染不需要动画信息
  render(null);
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
    // 撤销操作也不需要动画
    render(null);
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
        // 不再需要单独标记 newTile，render 时会处理
    }
}


// --- 修改后的 render 函数 ---
// 接收 movedTilesInfo 参数，用于动画
function render(movedTilesInfo, mergedPositions = []) {
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

        // 检查是否合并目标格子
        const isMerged = mergedPositions.some(pos => pos.row === r && pos.col === c);

        // 检查是否新生成的方块
        const isTileNewlyAdded = movedTilesInfo && movedTilesInfo.some(info =>
          info.toRow === r && info.toCol === c &&
          (info.fromRow === -1 && info.fromCol === -1)
        );
        if (isTileNewlyAdded) {
          tile.classList.add("new");
        }

        // 检查是否是移动的方块
        const moveInfo = movedTilesInfo?.find(info =>
          info.toRow === r && info.toCol === c &&
          !(info.fromRow === -1 && info.fromCol === -1)
        );

        if (moveInfo) {
          tile.classList.add("slide-animation");
          const dx = (moveInfo.fromCol - moveInfo.toCol) * (100 + 10);
          const dy = (moveInfo.fromRow - moveInfo.toRow) * (100 + 10);
          tile.style.transform = `translate(${dx}%, ${dy}%)`;

          requestAnimationFrame(() => {
            tile.style.transform = "translate(0,0)";
          });

          // 移动完成后再触发合并动画
          if (isMerged) {
            tile.addEventListener("transitionend", () => {
              tile.classList.add("merged");
            }, { once: true });
          }
        } else if (isMerged) {
          // 没有移动，但发生合并，直接触发合并动画
          tile.classList.add("merged");
        }
      }
      container.appendChild(tile);
    }
  }
}



function getTileColor(value) {
  const colors = {
    2: "#eee4da", 4: "#ede0c8", 8: "#f2b179", 16: "#f59563",
    32: "#f67c5f", 64: "#f65e3b", 128: "#edcf72", 256: "#edcc61",
    512: "#edc850", 1024: "#edc53f", 2048: "#edc22e",
  };
  return colors[value] || "#3c3a32";
}

// --- 修改后的 move 函数 ---
function move(direction) {
  if (gameOver || (gameWin && !continuePlaying)) return;

  saveHistory();
  let moved = false;
  let movedTilesInfo = [];
  let mergedPositions = [];

  const startBoard = board.map(row => [...row]);

  for (let i = 0; i < SIZE; i++) {
    let line = [];
    let indices = [];

    for (let j = 0; j < SIZE; j++) {
      let val, idx;
      if (direction === "left") { val = startBoard[i][j]; idx = j; }
      if (direction === "right") { val = startBoard[i][SIZE - 1 - j]; idx = SIZE - 1 - j; }
      if (direction === "up") { val = startBoard[j][i]; idx = j; }
      if (direction === "down") { val = startBoard[SIZE - 1 - j][i]; idx = SIZE - 1 - j; }

      if (val !== 0) {
        line.push(val);
        indices.push(direction === "left" || direction === "right" ? { r: i, c: idx } : { r: idx, c: i });
      }
    }

    // 合并逻辑
    for (let k = 0; k < line.length; k++) {
      if (k < line.length - 1 && line[k] === line[k + 1]) {
        line[k] *= 2;
        updateScore(line[k]);
        line.splice(k + 1, 1);
        indices.splice(k + 1, 1);

        // 记录合并位置
        let row, col;
        if (direction === "left") { row = i; col = k; }
        if (direction === "right") { row = i; col = SIZE - 1 - k; }
        if (direction === "up") { row = k; col = i; }
        if (direction === "down") { row = SIZE - 1 - k; col = i; }
        mergedPositions.push({ row, col });
      }
    }

    while (line.length < SIZE) {
      line.push(0);
      indices.push(null);
    }

    for (let j = 0; j < SIZE; j++) {
      let newVal = line[j];
      let target, sourceIndexInfo;

      if (direction === "left") { target = [i, j]; sourceIndexInfo = indices[j]; }
      if (direction === "right") { target = [i, SIZE - 1 - j]; sourceIndexInfo = indices[j]; }
      if (direction === "up") { target = [j, i]; sourceIndexInfo = indices[j]; }
      if (direction === "down") { target = [SIZE - 1 - j, i]; sourceIndexInfo = indices[j]; }

      const [targetRow, targetCol] = target;

      if (board[targetRow][targetCol] !== newVal || startBoard[targetRow][targetCol] !== newVal) {
        moved = true;

        if (newVal !== 0 && sourceIndexInfo && startBoard[sourceIndexInfo.r][sourceIndexInfo.c] !== 0) {
          movedTilesInfo.push({
            fromRow: sourceIndexInfo.r,
            fromCol: sourceIndexInfo.c,
            toRow: targetRow,
            toCol: targetCol
          });
        }
      }

      board[targetRow][targetCol] = newVal;

      if (newVal >= 2048 && !gameWin) {
        gameWin = true;
        setTimeout(() => {
          gameWinOverlay.style.display = "flex";
        }, 100);
      }
    }
  }

  let newTileCoords = null;
  if (moved) {
    const empty = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length > 0) {
      const [r, c] = empty[Math.floor(Math.random() * empty.length)];
      board[r][c] = Math.random() < 0.9 ? 2 : 4;
      newTileCoords = [r, c];
      movedTilesInfo.push({
        fromRow: -1,
        fromCol: -1,
        toRow: r,
        toCol: c
      });
    }

    render(movedTilesInfo, mergedPositions);
    checkGameOver();
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



