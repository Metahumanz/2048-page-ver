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
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = board[r][c];
      const tile = document.createElement("div");
      tile.className = "tile";

      if (value !== 0) {
        tile.textContent = value;
        tile.style.background = getTileColor(value);
        tile.style.color = value > 4 ? "#f9f6f2" : "#776e65";

        // --- 动画逻辑 ---
        // 1. 重置可能存在的动画样式
        tile.classList.remove("slide-animation");
        tile.style.transform = "";
        tile.style.opacity = ""; // 重置可能的淡出效果

        // 2. 检查是否是新生成的方块（值不为0，但起始位置信息为空或为0）
        const isTileNewlyAdded = movedTilesInfo && movedTilesInfo.some(info =>
            info.toRow === r && info.toCol === c &&
            (info.fromRow === -1 && info.fromCol === -1)
        );

        if (isTileNewlyAdded) {
             // 为新方块添加 "new" 类，触发 pop 动画
             tile.classList.add("new");
        } else if (movedTilesInfo) {
            // 3. 检查是否是移动的方块
            const moveInfo = movedTilesInfo.find(info =>
                info.toRow === r && info.toCol === c &&
                !(info.fromRow === -1 && info.fromCol === -1) // 排除新方块
            );

            if (moveInfo) {
                 // 如果是移动的方块
                 // a. 添加动画类
                 tile.classList.add("slide-animation");

                 // b. 计算移动距离 (基于 grid cell 大小)
                 const dx = (moveInfo.fromCol - moveInfo.toCol) * (100 + 10); // 100% cell width + 10px gap
                 const dy = (moveInfo.fromRow - moveInfo.toRow) * (100 + 10); // 100% cell height + 10px gap

                 // c. 应用初始变换，使其从起始位置开始
                 tile.style.transform = `translate(${dx}%, ${dy}%)`;

                 // d. 强制浏览器重绘，确保初始变换生效
                 // getComputedStyle(tile).transform;

                 // e. 在下一帧应用最终位置变换
                 requestAnimationFrame(() => {
                     tile.style.transform = 'translate(0, 0)';
                 });
            }
        }
        // --- 动画逻辑结束 ---
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
  // let mergedTiles = []; // 不再需要这个数组
  let movedTilesInfo = []; // 用于存储移动和新生成方块的信息

  // 创建一个临时的起始板，用于记录移动前的位置
  const startBoard = board.map(row => [...row]);

  for (let i = 0; i < SIZE; i++) {
    let line = [];
    // 记录原始索引，用于追踪移动路径
    let indices = [];
    for (let j = 0; j < SIZE; j++) {
      let val, idx;
      if (direction === "left") { val = startBoard[i][j]; idx = j; }
      if (direction === "right") { val = startBoard[i][SIZE - 1 - j]; idx = SIZE - 1 - j; }
      if (direction === "up") { val = startBoard[j][i]; idx = j; }
      if (direction === "down") { val = startBoard[SIZE - 1 - j][i]; idx = SIZE - 1 - j; }
      
      if (val !== 0) {
          line.push(val);
          // 存储原始的行和列
          indices.push(direction === "left" || direction === "right" ? {r: i, c: idx} : {r: idx, c: i});
      }
    }

    // 合并逻辑
    for (let k = 0; k < line.length; k++) {
      if (k < line.length - 1 && line[k] === line[k + 1]) {
        line[k] *= 2;
        updateScore(line[k]);
        line.splice(k + 1, 1);
        indices.splice(k + 1, 1); // 同步移除索引

        // 标记合并发生在哪个目标位置 (这部分动画效果可能需要额外处理，这里简化)
        // let target;
        // if (direction === "left") target = [i, k];
        // if (direction === "right") target = [i, SIZE - 1 - k];
        // if (direction === "up") target = [k, i];
        // if (direction === "down") target = [SIZE - 1 - k, i];
        // mergedTiles.push(target); // 如果需要单独的合并动画，可以保留
      }
    }

    while (line.length < SIZE) {
        line.push(0);
        indices.push(null); // 对于被填充的空位，索引为null
    }


    // 应用移动后的结果
    for (let j = 0; j < SIZE; j++) {
      let newVal = line[j];
      let target, sourceIndexInfo;
      
      if (direction === "left") { target = [i, j]; sourceIndexInfo = indices[j]; }
      if (direction === "right") { target = [i, SIZE - 1 - j]; sourceIndexInfo = indices[j]; }
      if (direction === "up") { target = [j, i]; sourceIndexInfo = indices[j]; }
      if (direction === "down") { target = [SIZE - 1 - j, i]; sourceIndexInfo = indices[j]; }

      const [targetRow, targetCol] = target;
      
      // 如果值发生变化或位置发生变化，则认为发生了移动
      if (board[targetRow][targetCol] !== newVal || startBoard[targetRow][targetCol] !== newVal) {
          moved = true;
          
          // 记录移动信息
          if(newVal !== 0) { // 只记录非空格子的移动
              if(sourceIndexInfo && startBoard[sourceIndexInfo.r][sourceIndexInfo.c] !== 0) {
                  // 从已有位置移动
                  movedTilesInfo.push({
                      fromRow: sourceIndexInfo.r,
                      fromCol: sourceIndexInfo.c,
                      toRow: targetRow,
                      toCol: targetCol
                  });
              } else {
                  // 新生成的方块 (理论上在 addRandomTile 后，这里处理移动时不会遇到)
                  // 但我们可以在 addRandomTile 后标记它，或者在这里特殊处理
                  // 为了简化，我们在这里处理：如果目标位置是新值，且起始位置是0，则标记为新
                  // 但这在当前逻辑下可能不准确，因为移动后目标位置变新值，但起始可能是合并后的。
                  // 更稳妥的方式是在 addRandomTile 时记录，并传递给 render。
                  // 这里我们尝试另一种方式：如果起始板该位置是0，而新板不是，则是新块。
                  // 但这与移动无关。我们只处理移动动画。
                  // 正确的做法是区分“移动”和“新出现”。
                  // 我们在 addRandomTile 时记录新块坐标，然后传给 render。
                  // 但是 render 是在 move 之后调用的。
                  // 让我们回到在 render 中判断新块的逻辑。
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

  // 在 addRandomTile 之前记录新块坐标，然后传递给 render
  let newTileCoords = null;
  if (moved) {
      // 寻找一个空位来添加新方块
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
          // 将新方块信息添加到 movedTilesInfo 中，用特殊标记
          movedTilesInfo.push({
              fromRow: -1, // 特殊标记表示新生成
              fromCol: -1,
              toRow: r,
              toCol: c
          });
      }
      
      // 使用 movedTilesInfo 进行渲染
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



