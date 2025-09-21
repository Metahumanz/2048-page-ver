const gridSize = 4;
let grid = [];
let score = 0;
const gridContainer = document.getElementById("grid-container");
const scoreContainer = document.getElementById("score");

function initGame() {
  grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
  score = 0;
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

function drawGrid() {
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
      gridContainer.appendChild(tile);
    }
  }
}

function move(direction) {
  let moved = false;
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
    requestAnimationFrame(drawGrid);
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

initGame();
