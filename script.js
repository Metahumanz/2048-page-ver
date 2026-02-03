const SIZE = 4;
let board = [];
let history = [];
let score = 0;
let bestScore = localStorage.getItem("bestScore") ? parseInt(localStorage.getItem("bestScore")) : 0;
// 移除 mergedTiles 和 newTile，因为它们的功能将被整合到动画逻辑中
let gameOver = false;
let gameWin = false;
let continuePlaying = false;

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
function render(movedTilesInfo) {
  container.innerHTML = "";

  // 硬编码gap值（与CSS中的设置保持一致）
  const gap = 10;
  const padding = 10;

  // 获取容器尺寸用于计算绝对位置
  const containerRect = container.getBoundingClientRect();
  const cellSize = (containerRect.width - padding * 2 - gap * (SIZE - 1)) / SIZE;

  // 首先绘制背景网格（空格子）
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const bgTile = document.createElement("div");
      bgTile.className = "tile";
      bgTile.style.position = "absolute";
      bgTile.style.width = `${cellSize}px`;
      bgTile.style.height = `${cellSize}px`;
      bgTile.style.left = `${padding + c * (cellSize + gap)}px`;
      bgTile.style.top = `${padding + r * (cellSize + gap)}px`;
      container.appendChild(bgTile);
    }
  }

  // 创建一个映射来标记哪些位置的瓦片是合并产生的
  const mergedPositions = new Set();
  if (movedTilesInfo) {
    // 找出所有合并位置（同一目标位置有多个来源）
    const targetCounts = {};
    movedTilesInfo.forEach(info => {
      if (info.fromRow !== -1) {
        const key = `${info.toRow},${info.toCol}`;
        targetCounts[key] = (targetCounts[key] || 0) + 1;
      }
    });
    Object.keys(targetCounts).forEach(key => {
      if (targetCounts[key] > 1) {
        mergedPositions.add(key);
      }
    });
  }

  // 然后绘制有数字的方块（在背景之上）
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = board[r][c];
      if (value === 0) continue;

      const tile = document.createElement("div");
      tile.className = "tile tile-with-value";

      // 设置绝对定位
      tile.style.position = "absolute";
      tile.style.width = `${cellSize}px`;
      tile.style.height = `${cellSize}px`;
      tile.style.left = `${padding + c * (cellSize + gap)}px`;
      tile.style.top = `${padding + r * (cellSize + gap)}px`;

      tile.textContent = value;
      tile.style.background = getTileColor(value);
      tile.style.color = value > 4 ? "#f9f6f2" : "#776e65";

      // --- 动画逻辑 ---
      // 检查是否是新生成的方块
      const isTileNewlyAdded = movedTilesInfo && movedTilesInfo.some(info =>
        info.toRow === r && info.toCol === c &&
        (info.fromRow === -1 && info.fromCol === -1)
      );

      if (isTileNewlyAdded) {
        // 为新方块添加 "new" 类，触发 pop 动画
        tile.classList.add("new");
      } else if (movedTilesInfo) {
        // 检查是否是移动的方块
        const moveInfo = movedTilesInfo.find(info =>
          info.toRow === r && info.toCol === c &&
          !(info.fromRow === -1 && info.fromCol === -1)
        );

        if (moveInfo) {
          // 添加滑动动画类
          tile.classList.add("slide");

          // 计算起始位置
          const fromLeft = padding + moveInfo.fromCol * (cellSize + gap);
          const fromTop = padding + moveInfo.fromRow * (cellSize + gap);

          // 设置初始位置（从起始位置开始）
          tile.style.left = `${fromLeft}px`;
          tile.style.top = `${fromTop}px`;

          // 强制浏览器重绘
          void tile.offsetHeight;

          // 在下一帧动画到目标位置
          requestAnimationFrame(() => {
            tile.style.left = `${padding + c * (cellSize + gap)}px`;
            tile.style.top = `${padding + r * (cellSize + gap)}px`;
          });

          // 检查是否是合并位置，添加合并动画
          const posKey = `${r},${c}`;
          if (mergedPositions.has(posKey)) {
            // 在滑动动画结束后添加合并动画
            setTimeout(() => {
              tile.classList.add("merged");
            }, 200); // 与滑动动画时长匹配
          }
        }
      }

      container.appendChild(tile);
    }
  }

  // 设置容器为相对定位以支持绝对定位的子元素
  container.style.position = "relative";
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

  // 创建一个临时的起始板，用于记录移动前的位置
  const startBoard = board.map(row => [...row]);

  for (let i = 0; i < SIZE; i++) {
    let line = [];
    let indices = []; // 记录每个值对应的原始位置

    // 第一步：按方向顺序提取非零值和它们的原始位置
    for (let j = 0; j < SIZE; j++) {
      let val, idx;
      if (direction === "left") {
        val = startBoard[i][j];
        idx = j;
      }
      if (direction === "right") {
        val = startBoard[i][SIZE - 1 - j];
        idx = SIZE - 1 - j;
      }
      if (direction === "up") {
        val = startBoard[j][i];
        idx = j;
      }
      if (direction === "down") {
        val = startBoard[SIZE - 1 - j][i];
        idx = SIZE - 1 - j;
      }

      if (val !== 0) {
        line.push(val);
        indices.push(direction === "left" || direction === "right" ? { r: i, c: idx } : { r: idx, c: i });
      }
    }

    // 第二步：合并逻辑 - 在合并前记录移动信息
    for (let k = 0; k < line.length; k++) {
      if (k < line.length - 1 && line[k] === line[k + 1]) {
        // 记录两个合并的方块都要移动到位置 k
        const sourceInfo1 = indices[k];
        const sourceInfo2 = indices[k + 1];

        // 计算目标位置
        let targetPos;
        if (direction === "left") targetPos = { r: i, c: k };
        if (direction === "right") targetPos = { r: i, c: SIZE - 1 - k };
        if (direction === "up") targetPos = { r: k, c: i };
        if (direction === "down") targetPos = { r: SIZE - 1 - k, c: i };

        // 记录第一个方块的移动
        if (sourceInfo1.r !== targetPos.r || sourceInfo1.c !== targetPos.c) {
          movedTilesInfo.push({
            fromRow: sourceInfo1.r,
            fromCol: sourceInfo1.c,
            toRow: targetPos.r,
            toCol: targetPos.c
          });
        }

        // 记录第二个方块的移动（会与第一个方块重合）
        if (sourceInfo2.r !== targetPos.r || sourceInfo2.c !== targetPos.c) {
          movedTilesInfo.push({
            fromRow: sourceInfo2.r,
            fromCol: sourceInfo2.c,
            toRow: targetPos.r,
            toCol: targetPos.c
          });
        }

        line[k] *= 2;
        updateScore(line[k]);
        line.splice(k + 1, 1);
        indices.splice(k + 1, 1);
      }
    }

    // 第三步：补齐空位
    while (line.length < SIZE) {
      line.push(0);
      indices.push(null);
    }

    // 第四步：应用移动结果并记录剩余的移动动画
    for (let j = 0; j < SIZE; j++) {
      let newVal = line[j];
      let target, sourceIndexInfo;

      if (direction === "left") { target = [i, j]; sourceIndexInfo = indices[j]; }
      if (direction === "right") { target = [i, SIZE - 1 - j]; sourceIndexInfo = indices[j]; }
      if (direction === "up") { target = [j, i]; sourceIndexInfo = indices[j]; }
      if (direction === "down") { target = [SIZE - 1 - j, i]; sourceIndexInfo = indices[j]; }

      const [targetRow, targetCol] = target;

      if (board[targetRow][targetCol] !== newVal) {
        moved = true;

        if (newVal !== 0 && sourceIndexInfo) {
          // 检查是否已经在 movedTilesInfo 中（合并的情况）
          const alreadyRecorded = movedTilesInfo.some(info =>
            info.fromRow === sourceIndexInfo.r &&
            info.fromCol === sourceIndexInfo.c &&
            info.toRow === targetRow &&
            info.toCol === targetCol
          );

          if (!alreadyRecorded && (sourceIndexInfo.r !== targetRow || sourceIndexInfo.c !== targetCol)) {
            movedTilesInfo.push({
              fromRow: sourceIndexInfo.r,
              fromCol: sourceIndexInfo.c,
              toRow: targetRow,
              toCol: targetCol
            });
          }
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

  if (moved) {
    // 添加新方块
    const empty = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length > 0) {
      const [r, c] = empty[Math.floor(Math.random() * empty.length)];
      board[r][c] = Math.random() < 0.9 ? 2 : 4;
      movedTilesInfo.push({
        fromRow: -1,
        fromCol: -1,
        toRow: r,
        toCol: c
      });
    }

    render(movedTilesInfo);
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



