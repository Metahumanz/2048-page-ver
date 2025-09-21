document.addEventListener('DOMContentLoaded', () => {
    class Game2048 {
        constructor() {
            this.gridSize = 4;
            this.cells = [];
            this.score = 0;
            this.bestScore = localStorage.getItem('bestScore') || 0;
            this.gameOver = false;
            this.won = false;
            this.setup();
            this.bindEvents();
            this.startGame();
        }

        setup() {
            this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
            this.tileContainer = document.querySelector('.tile-container');
            this.scoreDisplay = document.getElementById('score');
            this.bestScoreDisplay = document.getElementById('best-score');
            this.gameMessage = document.querySelector('.game-message');
            this.updateBestScore();
        }

        bindEvents() {
            document.addEventListener('keydown', this.handleKeyPress.bind(this));
            document.getElementById('restart-button').addEventListener('click', this.restart.bind(this));
            document.querySelector('.retry-button').addEventListener('click', this.restart.bind(this));
            document.querySelector('.keep-playing-button').addEventListener('click', this.keepPlaying.bind(this));
            
            // 触摸事件支持
            let touchStartX, touchStartY, touchEndX, touchEndY;
            
            document.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }, false);
            
            document.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].clientX;
                touchEndY = e.changedTouches[0].clientY;
                this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
            }, false);
        }

        handleSwipe(startX, startY, endX, endY) {
            const dx = endX - startX;
            const dy = endY - startY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                // 水平滑动
                if (dx > 0) {
                    this.move('right');
                } else {
                    this.move('left');
                }
            } else {
                // 垂直滑动
                if (dy > 0) {
                    this.move('down');
                } else {
                    this.move('up');
                }
            }
        }

        handleKeyPress(e) {
            if (this.gameOver) return;
            
            let moved = false;
            switch(e.key) {
                case 'ArrowUp':
                    moved = this.move('up');
                    break;
                case 'ArrowDown':
                    moved = this.move('down');
                    break;
                case 'ArrowLeft':
                    moved = this.move('left');
                    break;
                case 'ArrowRight':
                    moved = this.move('right');
                    break;
                default:
                    return; // 如果不是方向键，忽略
            }
            
            if (moved) {
                e.preventDefault();
                requestAnimationFrame(() => {
                    this.addRandomTile();
                    this.checkGameStatus();
                });
            }
        }

        startGame() {
            this.initializeGrid();
            this.addRandomTile();
            this.addRandomTile();
        }

        initializeGrid() {
            this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
            this.tileContainer.innerHTML = '';
            this.score = 0;
            this.updateScore();
            this.gameOver = false;
            this.won = false;
            this.hideMessage();
        }

        addRandomTile() {
            const emptyCells = [];
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    if (this.grid[r][c] === 0) {
                        emptyCells.push({r, c});
                    }
                }
            }
            
            if (emptyCells.length > 0) {
                const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                this.grid[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
                this.renderTiles();
            }
        }

        renderTiles() {
            this.tileContainer.innerHTML = '';
            
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    if (this.grid[r][c] !== 0) {
                        this.addTile(this.grid[r][c], r, c);
                    }
                }
            }
        }

        addTile(value, row, col) {
            const tile = document.createElement('div');
            tile.className = `tile tile-${value}`;
            tile.textContent = value;
            tile.dataset.value = value;
            tile.dataset.row = row;
            tile.dataset.col = col;
            
            // 计算位置
            const cellSize = 100; // 与CSS中--cell-size一致
            const gap = 15; // 与CSS中--cell-gap一致
            tile.style.top = `${row * (cellSize + gap) + gap}px`;
            tile.style.left = `${col * (cellSize + gap) + gap}px`;
            
            this.tileContainer.appendChild(tile);
        }

        move(direction) {
            let moved = false;
            const oldGrid = JSON.parse(JSON.stringify(this.grid));
            
            switch(direction) {
                case 'up':
                    moved = this.moveUp();
                    break;
                case 'down':
                    moved = this.moveDown();
                    break;
                case 'left':
                    moved = this.moveLeft();
                    break;
                case 'right':
                    moved = this.moveRight();
                    break;
            }
            
            if (moved) {
                this.renderTiles();
            }
            
            return moved;
        }

        moveUp() {
            let moved = false;
            
            for (let c = 0; c < this.gridSize; c++) {
                for (let r = 1; r < this.gridSize; r++) {
                    if (this.grid[r][c] !== 0) {
                        let newR = r;
                        while (newR > 0 && this.grid[newR - 1][c] === 0) {
                            this.grid[newR - 1][c] = this.grid[newR][c];
                            this.grid[newR][c] = 0;
                            newR--;
                            moved = true;
                        }
                        
                        if (newR > 0 && this.grid[newR - 1][c] === this.grid[newR][c]) {
                            this.grid[newR - 1][c] *= 2;
                            this.score += this.grid[newR - 1][c];
                            this.grid[newR][c] = 0;
                            moved = true;
                        }
                    }
                }
            }
            
            if (moved) {
                this.updateScore();
            }
            
            return moved;
        }

        moveDown() {
            let moved = false;
            
            for (let c = 0; c < this.gridSize; c++) {
                for (let r = this.gridSize - 2; r >= 0; r--) {
                    if (this.grid[r][c] !== 0) {
                        let newR = r;
                        while (newR < this.gridSize - 1 && this.grid[newR + 1][c] === 0) {
                            this.grid[newR + 1][c] = this.grid[newR][c];
                            this.grid[newR][c] = 0;
                            newR++;
                            moved = true;
                        }
                        
                        if (newR < this.gridSize - 1 && this.grid[newR + 1][c] === this.grid[newR][c]) {
                            this.grid[newR + 1][c] *= 2;
                            this.score += this.grid[newR + 1][c];
                            this.grid[newR][c] = 0;
                            moved = true;
                        }
                    }
                }
            }
            
            if (moved) {
                this.updateScore();
            }
            
            return moved;
        }

        moveLeft() {
            let moved = false;
            
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 1; c < this.gridSize; c++) {
                    if (this.grid[r][c] !== 0) {
                        let newC = c;
                        while (newC > 0 && this.grid[r][newC - 1] === 0) {
                            this.grid[r][newC - 1] = this.grid[r][newC];
                            this.grid[r][newC] = 0;
                            newC--;
                            moved = true;
                        }
                        
                        if (newC > 0 && this.grid[r][newC - 1] === this.grid[r][newC]) {
                            this.grid[r][newC - 1] *= 2;
                            this.score += this.grid[r][newC - 1];
                            this.grid[r][newC] = 0;
                            moved = true;
                        }
                    }
                }
            }
            
            if (moved) {
                this.updateScore();
            }
            
            return moved;
        }

        moveRight() {
            let moved = false;
            
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = this.gridSize - 2; c >= 0; c--) {
                    if (this.grid[r][c] !== 0) {
                        let newC = c;
                        while (newC < this.gridSize - 1 && this.grid[r][newC + 1] === 0) {
                            this.grid[r][newC + 1] = this.grid[r][newC];
                            this.grid[r][newC] = 0;
                            newC++;
                            moved = true;
                        }
                        
                        if (newC < this.gridSize - 1 && this.grid[r][newC + 1] === this.grid[r][newC]) {
                            this.grid[r][newC + 1] *= 2;
                            this.score += this.grid[r][newC + 1];
                            this.grid[r][newC] = 0;
                            moved = true;
                        }
                    }
                }
            }
            
            if (moved) {
                this.updateScore();
            }
            
            return moved;
        }

        updateScore() {
            this.scoreDisplay.textContent = this.score;
            
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                localStorage.setItem('bestScore', this.bestScore);
                this.updateBestScore();
            }
        }

        updateBestScore() {
            this.bestScoreDisplay.textContent = this.bestScore;
        }

        checkGameStatus() {
            if (this.isGameWon()) {
                this.showMessage('你赢了!', true);
                this.won = true;
            } else if (this.isGameOver()) {
                this.showMessage('游戏结束!', false);
                this.gameOver = true;
            }
        }

        isGameWon() {
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    if (this.grid[r][c] === 2048) {
                        return true;
                    }
                }
            }
            return false;
        }

        isGameOver() {
            // 检查是否有空格
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    if (this.grid[r][c] === 0) {
                        return false;
                    }
                }
            }
            
            // 检查是否有相邻的相同数字
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    if (c < this.gridSize - 1 && this.grid[r][c] === this.grid[r][c + 1]) {
                        return false;
                    }
                    if (r < this.gridSize - 1 && this.grid[r][c] === this.grid[r + 1][c]) {
                        return false;
                    }
                }
            }
            
            return true;
        }

        showMessage(message, isWin) {
            const messageElement = this.gameMessage.querySelector('p');
            messageElement.textContent = message;
            
            const keepPlayingButton = document.querySelector('.keep-playing-button');
            keepPlayingButton.style.display = isWin ? 'block' : 'none';
            
            this.gameMessage.style.display = 'flex';
        }

        hideMessage() {
            this.gameMessage.style.display = 'none';
        }

        restart() {
            this.initializeGrid();
            this.addRandomTile();
            this.addRandomTile();
        }

        keepPlaying() {
            this.hideMessage();
        }
    }

    // 初始化游戏
    new Game2048();
});