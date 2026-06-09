class GomokuGame {
    constructor() {
        this.boardSize = 15;
        this.cellSize = 40;
        this.board = [];
        this.currentPlayer = 1;
        this.gameMode = null;
        this.difficulty = null;
        this.gameOver = false;
        this.moves = [];
        this.lastMove = null;
        this.moveHistory = [];
        this.timer = 0;
        this.timerInterval = null;
        this.moveCount = 0;
        this.winningLine = null;
        
        this.canvas = document.getElementById('board');
        this.ctx = this.canvas.getContext('2d');
        
        // 初始化音频上下文
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error('Web Audio API not supported');
        }

        // 音效
        this.sounds = {
            place: this.createSound(800, 0.3, 0.1),
            win: this.createSound(523, 0.5, 0.5),
            lose: this.createSound(349, 0.5, 0.5),
            draw: this.createSound(440, 0.3, 0.3)
        };
        
        // 背景音乐
        this.bgm = new Audio('audio/bgm.mp3');
        this.bgm.loop = true;
        this.isMusicPlaying = false;
        
        this.initializeEventListeners();
        this.resetGame();
    }

    createSound(frequency, volume, duration) {
        return () => {
            if (!this.audioCtx) return;
            try {
                if (this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume();
                }
                const oscillator = this.audioCtx.createOscillator();
                const gainNode = this.audioCtx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioCtx.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                
                gainNode.gain.value = volume;
                
                oscillator.start();
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
                oscillator.stop(this.audioCtx.currentTime + duration);
            } catch (e) {
                console.log('音效播放失败:', e);
            }
        };
    }

    initializeEventListeners() {
        // 模式选择
        document.getElementById('singlePlayer').addEventListener('click', () => {
            this.showDifficultySelection();
            this.gameMode = 'single';
        });

        document.getElementById('twoPlayer').addEventListener('click', () => {
            this.startGame('two', null);
        });

        // 难度选择
        document.getElementById('easy').addEventListener('click', () => {
            this.startGame('single', 'easy');
        });

        document.getElementById('medium').addEventListener('click', () => {
            this.startGame('single', 'medium');
        });

        document.getElementById('hard').addEventListener('click', () => {
            this.startGame('single', 'hard');
        });

        // 游戏控制
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undoMove();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('bgmBtn').addEventListener('click', () => {
            this.toggleMusic();
        });

        document.getElementById('backToMenu').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('playAgain').addEventListener('click', () => {
            this.resetGame();
            this.hideGameResult();
        });

        document.getElementById('backToMenuFromResult').addEventListener('click', () => {
            this.showMainMenu();
            this.hideGameResult();
        });

        // 棋盘点击事件
        this.canvas.addEventListener('click', (e) => {
            if (this.gameOver) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            const col = Math.floor(x / this.cellSize);
            const row = Math.floor(y / this.cellSize);
            
            if (this.isValidMove(row, col)) {
                this.makeMove(row, col);
                
                // 如果是单人模式且游戏未结束，AI下棋
                if (this.gameMode === 'single' && !this.gameOver && this.currentPlayer === 2) {
                    setTimeout(() => {
                        this.aiMove();
                    }, 800);
                }
            }
        });
    }

    toggleMusic() {
        const btn = document.getElementById('bgmBtn');
        if (this.isMusicPlaying) {
            this.bgm.pause();
            this.isMusicPlaying = false;
            btn.textContent = '音乐: 关';
        } else {
            this.bgm.play().catch(e => {
                console.log('播放失败，请确保audio/bgm.mp3文件存在', e);
                alert('请在 game/Gomoku/audio/ 目录下放置 bgm.mp3 文件');
            });
            this.isMusicPlaying = true;
            btn.textContent = '音乐: 开';
        }
    }

    showDifficultySelection() {
        document.querySelector('.mode-selection').classList.add('hidden');
        document.getElementById('difficultySelection').classList.remove('hidden');
    }

    startGame(mode, difficulty) {
        this.gameMode = mode;
        this.difficulty = difficulty;
        
        document.getElementById('difficultySelection').classList.add('hidden');
        document.getElementById('gameInterface').classList.remove('hidden');
        
        // 更新显示信息
        document.getElementById('gameModeDisplay').textContent = 
            mode === 'single' ? '单人' : '双人';
        document.getElementById('difficultyDisplay').textContent = 
            difficulty ? this.getDifficultyText(difficulty) : '-';
        
        this.resetGame();
    }

    showMainMenu() {
        this.stopTimer();
        document.getElementById('gameInterface').classList.add('hidden');
        document.getElementById('difficultySelection').classList.add('hidden');
        document.querySelector('.mode-selection').classList.remove('hidden');
        this.gameMode = null;
        this.difficulty = null;
    }

    getDifficultyText(difficulty) {
        const texts = {
            'easy': '简单',
            'medium': '中等', 
            'hard': '困难'
        };
        return texts[difficulty] || '-';
    }

    startTimer() {
        this.stopTimer();
        this.timer = 0;
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        document.getElementById('timerDisplay').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateMoveCount() {
        document.getElementById('moveCount').textContent = this.moveCount;
    }

    resetGame() {
        this.stopTimer();
        this.board = Array(this.boardSize).fill().map(() => 
            Array(this.boardSize).fill(0)
        );
        this.currentPlayer = 1;
        this.gameOver = false;
        this.moves = [];
        this.moveHistory = [];
        this.lastMove = null;
        this.moveCount = 0;
        this.winningLine = null;
        
        this.updatePlayerDisplay();
        this.updateMoveCount();
        this.startTimer();
        this.drawBoard();
    }

    drawBoard() {
        const ctx = this.ctx;
        const size = this.boardSize * this.cellSize;
        
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制棋盘背景
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, size, size);
        
        // 绘制网格线
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.boardSize; i++) {
            // 横线
            ctx.beginPath();
            ctx.moveTo(0, i * this.cellSize);
            ctx.lineTo(size, i * this.cellSize);
            ctx.stroke();
            
            // 竖线
            ctx.beginPath();
            ctx.moveTo(i * this.cellSize, 0);
            ctx.lineTo(i * this.cellSize, size);
            ctx.stroke();
        }
        
        // 绘制棋子
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== 0) {
                    this.drawPiece(row, col, this.board[row][col], 
                        this.lastMove && this.lastMove.row === row && this.lastMove.col === col);
                }
            }
        }
        
        // 绘制获胜连线
        if (this.winningLine) {
            this.drawWinningLine();
        }
    }

    drawPiece(row, col, player, isLastMove = false) {
        const ctx = this.ctx;
        const x = col * this.cellSize;
        const y = row * this.cellSize;
        const radius = this.cellSize * 0.4;
        
        ctx.save();
        
        if (isLastMove) {
            // 高亮显示最后一步
            ctx.shadowColor = 'yellow';
            ctx.shadowBlur = 15;
        }
        
        ctx.beginPath();
        ctx.arc(x + this.cellSize/2, y + this.cellSize/2, radius, 0, 2 * Math.PI);
        
        if (player === 1) {
            ctx.fillStyle = '#000';
            ctx.fill();
        } else {
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.restore();
    }

    drawWinningLine() {
        const ctx = this.ctx;
        const startX = this.winningLine.start.col * this.cellSize + this.cellSize/2;
        const startY = this.winningLine.start.row * this.cellSize + this.cellSize/2;
        const endX = this.winningLine.end.col * this.cellSize + this.cellSize/2;
        const endY = this.winningLine.end.row * this.cellSize + this.cellSize/2;
        
        ctx.save();
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        ctx.restore();
    }

    isValidMove(row, col) {
        return row >= 0 && row < this.boardSize && 
               col >= 0 && col < this.boardSize && 
               this.board[row][col] === 0;
    }

    makeMove(row, col) {
        if (!this.isValidMove(row, col) || this.gameOver) return false;
        
        // 保存历史记录用于悔棋
        this.moveHistory.push({
            board: JSON.parse(JSON.stringify(this.board)),
            currentPlayer: this.currentPlayer,
            moves: [...this.moves],
            lastMove: this.lastMove ? {...this.lastMove} : null
        });
        
        this.board[row][col] = this.currentPlayer;
        this.moves.push({row, col, player: this.currentPlayer});
        this.lastMove = {row, col, player: this.currentPlayer};
        this.moveCount++;
        
        // 播放落子音效
        this.sounds.place();
        
        // 重绘棋盘显示动画效果
        this.drawBoard();
        
        if (this.checkWin(row, col)) {
            this.gameOver = true;
            this.stopTimer();
            this.sounds.win();
            // 延迟显示结果，让连线动画先显示
            setTimeout(() => {
                this.showGameResult(this.currentPlayer === 1 ? '黑棋获胜！' : '白棋获胜！');
            }, 1000);
        } else if (this.moves.length === this.boardSize * this.boardSize) {
            this.gameOver = true;
            this.stopTimer();
            this.sounds.draw();
            this.showGameResult('平局！');
        } else {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.updatePlayerDisplay();
            this.updateMoveCount();
        }
        
        return true;
    }

    undoMove() {
        if (this.moveHistory.length === 0 || this.gameOver) return;
        
        const lastState = this.moveHistory.pop();
        this.board = lastState.board;
        this.currentPlayer = lastState.currentPlayer;
        this.moves = lastState.moves;
        this.lastMove = lastState.lastMove;
        this.moveCount = this.moves.length;
        this.winningLine = null;
        
        this.updatePlayerDisplay();
        this.updateMoveCount();
        this.drawBoard();
    }

    updatePlayerDisplay() {
        const playerText = this.currentPlayer === 1 ? '黑棋' : '白棋';
        document.getElementById('currentPlayer').textContent = playerText;
    }

    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [
            [0, 1],  // 水平
            [1, 0],  // 垂直
            [1, 1],  // 对角线
            [1, -1]  // 反对角线
        ];

        for (const [dx, dy] of directions) {
            let count = 1;
            let winningPositions = [{row, col}];
            
            // 正向检查
            for (let i = 1; i <= 4; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;
                if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] === player) {
                    count++;
                    winningPositions.push({row: newRow, col: newCol});
                } else {
                    break;
                }
            }
            
            // 反向检查
            for (let i = 1; i <= 4; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;
                if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] === player) {
                    count++;
                    winningPositions.push({row: newRow, col: newCol});
                } else {
                    break;
                }
            }
            
            if (count >= 5) {
                this.winningLine = {
                    start: winningPositions[0],
                    end: winningPositions[winningPositions.length - 1],
                    direction: [dx, dy]
                };
                return true;
            }
        }
        
        this.winningLine = null;
        return false;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }

    aiMove() {
        if (this.gameOver) return;
        
        let move;
        switch (this.difficulty) {
            case 'easy':
                move = this.getEnhancedEasyMove();
                break;
            case 'medium':
                move = this.getEnhancedMediumMove();
                break;
            case 'hard':
                move = this.getEnhancedHardMove();
                break;
            default:
                move = this.getEnhancedEasyMove();
        }
        
        if (move) {
            setTimeout(() => {
                this.makeMove(move.row, move.col);
            }, 300);
        }
    }

    getEnhancedEasyMove() {
        // 增强版简单AI：基于简单评估函数
        const aiPlayer = 2;
        const humanPlayer = 1;
        
        // 1. 检查AI是否能赢
        let winningMove = this.findWinningMove(aiPlayer);
        if (winningMove) return winningMove;
        
        // 2. 检查玩家是否能赢，进行防守
        let blockingMove = this.findWinningMove(humanPlayer);
        if (blockingMove) return blockingMove;
        
        // 3. 基于简单评估选择位置
        return this.getBestMoveByEvaluation(aiPlayer, 1);
    }

    getEnhancedMediumMove() {
        // 增强版中等AI：使用更复杂的评估函数
        const aiPlayer = 2;
        const humanPlayer = 1;
        
        // 1. 检查AI是否能赢
        let winningMove = this.findWinningMove(aiPlayer);
        if (winningMove) return winningMove;
        
        // 2. 检查玩家是否能赢，进行防守
        let blockingMove = this.findWinningMove(humanPlayer);
        if (blockingMove) return blockingMove;
        
        // 3. 检查AI是否能形成活4
        let liveFourMove = this.findLiveFour(aiPlayer);
        if (liveFourMove) return liveFourMove;
        
        // 4. 检查玩家是否能形成活4
        let blockLiveFourMove = this.findLiveFour(humanPlayer);
        if (blockLiveFourMove) return blockLiveFourMove;
        
        // 5. 基于复杂评估选择位置
        return this.getBestMoveByEvaluation(aiPlayer, 2);
    }

    getEnhancedHardMove() {
        // 增强版困难AI：使用极小化极大算法
        const aiPlayer = 2;
        const humanPlayer = 1;
        
        // 1. 检查AI是否能赢
        let winningMove = this.findWinningMove(aiPlayer);
        if (winningMove) return winningMove;
        
        // 2. 检查玩家是否能赢，进行防守
        let blockingMove = this.findWinningMove(humanPlayer);
        if (blockingMove) return blockingMove;
        
        // 3. 使用极小化极大算法搜索2层
        let bestMove = this.minimax(2, aiPlayer, -Infinity, Infinity);
        if (bestMove && bestMove.move) {
            return bestMove.move;
        }
        
        // 4. 备用策略
        return this.getBestMoveByEvaluation(aiPlayer, 3);
    }

    findWinningMove(player) {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = player;
                    if (this.checkWin(row, col)) {
                        this.board[row][col] = 0;
                        return {row, col};
                    }
                    this.board[row][col] = 0;
                }
            }
        }
        return null;
    }

    findLiveFour(player) {
        // 寻找能形成活4的位置
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = player;
                    if (this.countLiveFour(row, col, player)) {
                        this.board[row][col] = 0;
                        return {row, col};
                    }
                    this.board[row][col] = 0;
                }
            }
        }
        return null;
    }

    countLiveFour(row, col, player) {
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            let openEnds = 0;
            
            // 正向检查
            for (let i = 1; i <= 4; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;
                if (this.isValidPosition(newRow, newCol)) {
                    if (this.board[newRow][newCol] === player) {
                        count++;
                    } else if (this.board[newRow][newCol] === 0) {
                        openEnds++;
                        break;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
            
            // 反向检查
            for (let i = 1; i <= 4; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;
                if (this.isValidPosition(newRow, newCol)) {
                    if (this.board[newRow][newCol] === player) {
                        count++;
                    } else if (this.board[newRow][newCol] === 0) {
                        openEnds++;
                        break;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
            
            if (count === 4 && openEnds >= 1) {
                return true;
            }
        }
        
        return false;
    }

    getBestMoveByEvaluation(player, level) {
        const scores = [];
        const opponent = player === 1 ? 2 : 1;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    let score = 0;
                    
                    // 基础评估
                    score += this.evaluatePosition(row, col, player, opponent, level);
                    
                    // 中心位置加分
                    const centerDist = Math.abs(row - 7) + Math.abs(col - 7);
                    score += (14 - centerDist) * 0.5;
                    
                    scores.push({row, col, score});
                }
            }
        }
        
        if (scores.length === 0) return null;
        
        scores.sort((a, b) => b.score - a.score);
        const maxScore = scores[0].score;
        const bestMoves = scores.filter(move => move.score === maxScore);
        
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    evaluatePosition(row, col, player, opponent, level) {
        let score = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (const [dx, dy] of directions) {
            // 评估进攻潜力
            score += this.evaluateDirection(row, col, dx, dy, player, level);
            // 评估防守需求
            score += this.evaluateDirection(row, col, dx, dy, opponent, level) * 0.8;
        }
        
        return score;
    }

    evaluateDirection(row, col, dx, dy, player, level) {
        let score = 0;
        let playerCount = 0;
        let emptyCount = 0;
        let blocked = false;
        
        // 正向检查
        for (let i = 1; i <= 4; i++) {
            const newRow = row + dx * i;
            const newCol = col + dy * i;
            if (this.isValidPosition(newRow, newCol)) {
                if (this.board[newRow][newCol] === player) {
                    playerCount++;
                } else if (this.board[newRow][newCol] === 0) {
                    emptyCount++;
                } else {
                    blocked = true;
                    break;
                }
            } else {
                blocked = true;
                break;
            }
        }
        
        // 反向检查
        let reverseBlocked = false;
        for (let i = 1; i <= 4; i++) {
            const newRow = row - dx * i;
            const newCol = col - dy * i;
            if (this.isValidPosition(newRow, newCol)) {
                if (this.board[newRow][newCol] === player) {
                    playerCount++;
                } else if (this.board[newRow][newCol] === 0) {
                    emptyCount++;
                } else {
                    reverseBlocked = true;
                    break;
                }
            } else {
                reverseBlocked = true;
                break;
            }
        }
        
        // 根据连子数量和开放程度评分
        const totalCount = playerCount + 1; // 包括当前位置
        const totalEmpty = emptyCount + (blocked ? 0 : 1) + (reverseBlocked ? 0 : 1);
        
        if (level >= 3) {
            // 困难级别评估
            if (totalCount >= 5) score += 10000;
            else if (totalCount === 4 && totalEmpty >= 2) score += 5000; // 活4
            else if (totalCount === 4 && totalEmpty === 1) score += 1000; // 冲4
            else if (totalCount === 3 && totalEmpty >= 2) score += 500;  // 活3
            else if (totalCount === 3 && totalEmpty === 1) score += 100; // 眠3
            else if (totalCount === 2 && totalEmpty >= 2) score += 50;   // 活2
            else if (totalCount === 2 && totalEmpty === 1) score += 10;  // 眠2
        } else if (level >= 2) {
            // 中等级别评估
            if (totalCount >= 5) score += 5000;
            else if (totalCount === 4) score += 1000;
            else if (totalCount === 3) score += 200;
            else if (totalCount === 2) score += 50;
        } else {
            // 简单级别评估
            if (totalCount >= 5) score += 1000;
            else if (totalCount === 4) score += 200;
            else if (totalCount === 3) score += 50;
            else if (totalCount === 2) score += 10;
        }
        
        return score;
    }

    minimax(depth, player, alpha, beta) {
        if (depth === 0) {
            return { score: this.evaluateBoard(player), move: null };
        }
        
        const opponent = player === 1 ? 2 : 1;
        let bestScore = player === 2 ? -Infinity : Infinity;
        let bestMove = null;
        
        // 获取可能的移动（限制数量以提高性能）
        const moves = this.getPossibleMoves(10);
        
        for (const move of moves) {
            this.board[move.row][move.col] = player;
            
            const result = this.minimax(depth - 1, opponent, alpha, beta);
            
            this.board[move.row][move.col] = 0;
            
            if (player === 2) {
                // AI玩家（最大化）
                if (result.score > bestScore) {
                    bestScore = result.score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, bestScore);
            } else {
                // 人类玩家（最小化）
                if (result.score < bestScore) {
                    bestScore = result.score;
                    bestMove = move;
                }
                beta = Math.min(beta, bestScore);
            }
            
            if (beta <= alpha) {
                break;
            }
        }
        
        return { score: bestScore, move: bestMove };
    }

    evaluateBoard(player) {
        const opponent = player === 1 ? 2 : 1;
        let score = 0;
        
        // 评估整个棋盘的局势
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === player) {
                    score += this.evaluatePosition(row, col, player, opponent, 3);
                } else if (this.board[row][col] === opponent) {
                    score -= this.evaluatePosition(row, col, opponent, player, 3) * 0.8;
                }
            }
        }
        
        return score;
    }

    getPossibleMoves(limit = 10) {
        const moves = [];
        const scores = [];
        
        // 只考虑有棋子周围的空位
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0 && this.hasNeighbor(row, col)) {
                    let score = 0;
                    
                    // 简单评估分数
                    for (let dr = -2; dr <= 2; dr++) {
                        for (let dc = -2; dc <= 2; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const newRow = row + dr;
                            const newCol = col + dc;
                            if (this.isValidPosition(newRow, newCol)) {
                                if (this.board[newRow][newCol] !== 0) {
                                    score += 10;
                                }
                            }
                        }
                    }
                    
                    scores.push({row, col, score});
                }
            }
        }
        
        // 按分数排序并限制数量
        scores.sort((a, b) => b.score - a.score);
        return scores.slice(0, limit).map(item => ({row: item.row, col: item.col}));
    }

    hasNeighbor(row, col) {
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                if (dr === 0 && dc === 0) continue;
                const newRow = row + dr;
                const newCol = col + dc;
                if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    showGameResult(message) {
        document.getElementById('resultMessage').textContent = message;
        document.getElementById('gameResult').classList.remove('hidden');
    }

    hideGameResult() {
        document.getElementById('gameResult').classList.add('hidden');
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});
