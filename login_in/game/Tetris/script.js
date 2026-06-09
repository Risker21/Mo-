// 游戏常量定义
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const NEXT_BLOCK_SIZE = 25;

// 游戏状态变量
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let isGameRunning = false;
let isPaused = false;
let gameInterval = null;
let gameSpeed = 1000; // 初始速度（毫秒）
let audioContext = null;
let soundEnabled = true;

// DOM元素引用
let canvas = null;
let nextCanvas = null;
let ctx = null;
let scoreElement = null;
let levelElement = null;
let linesElement = null;
let startButton = null;
let pauseButton = null;
let resetButton = null;
let gameOverModal = null;
let finalScoreElement = null;
let playAgainButton = null;
let toggleSoundButton = null;
let mobileControls = null;

// 移动控制按钮
let leftButton = null;
let rightButton = null;
let downButton = null;
let rotateButton = null;
let dropButton = null;
let pauseTouchButton = null;

// 方块形状定义
const TETROMINOS = {
    0: { shape: [], color: '0, 0, 0' },
    I: { 
        shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], 
        color: '80, 227, 230' 
    },
    J: { 
        shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], 
        color: '36, 95, 223' 
    },
    L: { 
        shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], 
        color: '223, 173, 36' 
    },
    O: { 
        shape: [[1, 1], [1, 1]], 
        color: '223, 217, 36' 
    },
    S: { 
        shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], 
        color: '48, 211, 56' 
    },
    T: { 
        shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], 
        color: '132, 61, 198' 
    },
    Z: { 
        shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], 
        color: '227, 78, 78' 
    }
};

// 颜色定义
const COLORS = {
    empty: 'rgba(0, 0, 0, 0)',
    I: 'rgba(0, 255, 255, 0.9)', // 青色
    J: 'rgba(0, 0, 255, 0.9)', // 蓝色
    L: 'rgba(255, 165, 0, 0.9)', // 橙色
    O: 'rgba(255, 255, 0, 0.9)', // 黄色
    S: 'rgba(0, 255, 0, 0.9)', // 绿色
    T: 'rgba(128, 0, 128, 0.9)', // 紫色
    Z: 'rgba(255, 0, 0, 0.9)', // 红色
    border: 'rgba(51, 51, 51, 0.5)',
    ghost: 'rgba(255, 255, 255, 0.2)'
};

// 初始化游戏尺寸
function adjustCanvasSize() {
    const gameContainer = document.querySelector('.tetris-game');
    const centerPanel = document.querySelector('.game-center-panel');
    const header = document.querySelector('.game-header');
    const leftPanel = document.querySelector('.game-left-panel');
    const rightPanel = document.querySelector('.game-right-panel');
    const mobilePanel = document.querySelector('.mobile-controls');

    if (!gameContainer) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const isTablet = !isMobile && window.matchMedia('(max-width: 1024px)').matches;

    const gameStyles = getComputedStyle(gameContainer);
    const paddingY = (parseFloat(gameStyles.paddingTop) || 0) + (parseFloat(gameStyles.paddingBottom) || 0);
    const paddingX = (parseFloat(gameStyles.paddingLeft) || 0) + (parseFloat(gameStyles.paddingRight) || 0);

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const headerH = header ? header.offsetHeight : 0;
    const leftH = leftPanel ? leftPanel.offsetHeight : 0;
    const rightH = rightPanel ? rightPanel.offsetHeight : 0;
    const mobileH = mobilePanel ? mobilePanel.offsetHeight : 0;

    let availableWidth;
    let availableHeight;

    if (isMobile) {
        const safeMargin = 16;
        availableWidth = Math.max(0, viewportW - safeMargin * 2);
        availableHeight = Math.max(0, viewportH - headerH - leftH - rightH - mobileH - paddingY - safeMargin);
    } else {
        const centerW = centerPanel ? centerPanel.clientWidth : (gameContainer.clientWidth - paddingX);
        availableWidth = Math.max(0, centerW - 16);
        availableHeight = Math.max(0, (gameContainer.clientHeight || viewportH) - headerH - paddingY - 24);
    }

    let blockSize = BLOCK_SIZE;
    if (isMobile || isTablet) {
        const candidate = Math.floor(Math.min(availableWidth / COLS, availableHeight / ROWS));
        const minSize = isMobile ? 12 : 18;
        blockSize = Math.max(minSize, Math.min(candidate, 34));
    }
    
    // 存储调整后的方块大小
    window.adjustedBlockSize = blockSize;
    
    // 设置游戏主画布尺寸
    if (canvas) {
        canvas.width = blockSize * COLS;
        canvas.height = blockSize * ROWS;
        canvas.style.width = `${canvas.width}px`;
        canvas.style.height = `${canvas.height}px`;
        ctx = canvas.getContext('2d');
    }
    
    // 设置下一个方块预览画布尺寸
    if (nextCanvas) {
        const size = Math.max(76, Math.round(blockSize * 4));
        nextCanvas.width = size;
        nextCanvas.height = size;
        nextCanvas.style.width = `${size}px`;
        nextCanvas.style.height = `${size}px`;
    }
    
    // 重新绘制游戏
    if (ctx) {
        drawBoard();
        drawNextPiece();
    }
}

// 初始化音频系统
function initAudio() {
    if (!audioContext && typeof AudioContext !== 'undefined') {
        try {
            audioContext = new AudioContext();
        } catch (e) {
        }
    }
}

// 创建简单的音效
function createTone(type, frequency, duration) {
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = type; // 'sine', 'square', 'triangle', 'sawtooth'
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
    }
}

// 播放不同类型的游戏音效
function playSound(type) {
    if (!soundEnabled || !audioContext) return;
    
    // 确保audioContext处于running状态
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }
    
    switch (type) {
        case 'move':
            createTone('sine', 440, 0.1);
            break;
        case 'rotate':
            createTone('triangle', 523, 0.15);
            break;
        case 'drop':
            // 硬下落音效
            createTone('sine', 880, 0.2);
            setTimeout(() => {
                createTone('square', 660, 0.15);
            }, 100);
            break;
        case 'clearLine':
            // 更丰富的消行音效
            createTone('square', 659, 0.1);
            setTimeout(() => {
                createTone('square', 784, 0.1);
            }, 100);
            setTimeout(() => {
                createTone('square', 988, 0.15);
            }, 200);
            break;
        case 'gameOver':
            createTone('sawtooth', 220, 0.5);
            setTimeout(() => {
                createTone('sawtooth', 180, 0.5);
            }, 300);
            break;
        default:
            break;
    }
}

// 切换音效开关
function toggleSound() {
    soundEnabled = !soundEnabled;
    
    if (toggleSoundButton) {
        const icon = toggleSoundButton.querySelector('i');
        
        if (soundEnabled) {
            icon.className = 'fas fa-volume-up';
        } else {
            icon.className = 'fas fa-volume-mute';
        }
    }
}

// 初始化游戏板
function initializeBoard() {
    board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;
        }
    }
}

// 创建新方块
function createPiece() {
    const tetrominoKeys = 'IJLOSTZ';
    const randomTetromino = tetrominoKeys[Math.floor(Math.random() * tetrominoKeys.length)];
    const piece = TETROMINOS[randomTetromino];
    
    return {
        shape: piece.shape,
        color: piece.color,
        x: Math.floor((COLS - piece.shape[0].length) / 2),
        y: 0
    };
}

// 检查方块移动是否有效
function isValidMove(piece, offsetX = 0, offsetY = 0) {
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col]) {
                const newX = piece.x + col + offsetX;
                const newY = piece.y + row + offsetY;
                
                // 检查边界
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false;
                }
                
                // 检查碰撞
                if (newY >= 0 && board[newY][newX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

// 将方块固定到游戏板上
function lockPiece() {
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const boardRow = currentPiece.y + row;
                const boardCol = currentPiece.x + col;
                
                if (boardRow >= 0) {
                    board[boardRow][boardCol] = currentPiece.color;
                }
            }
        }
    }
}

// 旋转方块
function rotatePiece() {
    const originalShape = currentPiece.shape;
    const numRows = originalShape.length;
    const numCols = originalShape[0].length;
    const rotatedShape = [];
    
    // 创建旋转后的形状
    for (let i = 0; i < numCols; i++) {
        rotatedShape[i] = [];
        for (let j = 0; j < numRows; j++) {
            rotatedShape[i][j] = originalShape[numRows - 1 - j][i];
        }
    }
    
    // 保存原始形状
    currentPiece.shape = rotatedShape;
    
    // 检查旋转是否有效，如果无效则恢复原始形状
    if (!isValidMove(currentPiece)) {
        // 尝试墙踢
        if (isValidMove(currentPiece, -1, 0)) {
            currentPiece.x--;
        } else if (isValidMove(currentPiece, 1, 0)) {
            currentPiece.x++;
        } else if (isValidMove(currentPiece, 0, -1)) {
            currentPiece.y--;
        } else {
            currentPiece.shape = originalShape;
        }
    }
}

// 清除完整的行
function clearLines() {
    let linesCleared = 0;
    
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            // 移除完整的行
            board.splice(row, 1);
            // 在顶部添加新的空行
            board.unshift(new Array(COLS).fill(0));
            // 增加行数
            linesCleared++;
            // 由于移除了一行，需要重新检查当前行
            row++;
        }
    }
    
    if (linesCleared > 0) {
        updateScore(linesCleared);
        drawLineClearAnimation(linesCleared);
        playSound('clearLine');
    }
}

// 更新分数
function updateScore(linesCleared) {
    const linePoints = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4行的分数
    const scoreIncrease = linePoints[linesCleared] * level;
    
    score += scoreIncrease;
    lines += linesCleared;
    
    // 每清除10行升级
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel > level) {
        level = newLevel;
        updateGameSpeed();
    }
    
    // 更新显示
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
}

// 更新游戏速度
function updateGameSpeed() {
    gameSpeed = Math.max(100, 1000 - (level - 1) * 100);
    
    if (isGameRunning && !isPaused) {
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    }
}

// 绘制游戏板
function drawBoard() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const blockSize = window.adjustedBlockSize || BLOCK_SIZE;
    
    // 绘制游戏板背景
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格线
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
            ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
        }
    }
    
    // 绘制已固定的方块
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(ctx, x, y, `rgba(${board[y][x]}, 0.8)`, blockSize);
            }
        }
    }
    
    // 绘制影子方块
    if (isGameRunning && !isPaused && currentPiece) {
        drawGhostPiece(blockSize);
    }
    
    // 绘制当前方块
    if (currentPiece) {
        const shape = currentPiece.shape;
        const color = `rgba(${currentPiece.color}, 0.9)`;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardRow = currentPiece.y + y;
                    const boardCol = currentPiece.x + x;
                    if (boardRow >= 0) {
                        drawBlock(ctx, boardCol, boardRow, color, blockSize);
                    }
                }
            }
        }
    }
    
    // 如果游戏暂停，显示暂停信息
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('游戏暂停', canvas.width / 2, canvas.height / 2);
    }
}

// 绘制单个方块
function drawBlock(ctx, x, y, color, blockSize) {
    const padding = 2;
    
    // 绘制方块主体
    ctx.fillStyle = color;
    ctx.fillRect(x * blockSize + padding, y * blockSize + padding, 
                 blockSize - padding * 2, blockSize - padding * 2);
    
    // 绘制方块边框阴影
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x * blockSize + padding + 1, y * blockSize + padding + 1, 
                   blockSize - padding * 2, blockSize - padding * 2);
    
    // 绘制方块边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x * blockSize + padding, y * blockSize + padding, 
                   blockSize - padding * 2, blockSize - padding * 2);
    
    // 绘制方块高光（更明显的高光效果）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(x * blockSize + padding, y * blockSize + padding, 
                 blockSize - padding * 2, (blockSize - padding * 2) / 3);
    ctx.fillRect(x * blockSize + padding, y * blockSize + padding, 
                 (blockSize - padding * 2) / 3, blockSize - padding * 2);
    
    // 右下角添加细微的暗部，增强立体感
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(x * blockSize + padding + (blockSize - padding * 2) * 0.67, 
                 y * blockSize + padding + (blockSize - padding * 2) * 0.67, 
                 (blockSize - padding * 2) * 0.33, 
                 (blockSize - padding * 2) * 0.33);
}

// 绘制下一个方块预览
function drawNextPiece() {
    const ctx = nextCanvas.getContext('2d');
    ctx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // 绘制预览区域背景
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // 绘制下一个方块
    if (nextPiece) {
        const shape = nextPiece.shape;
        const color = `rgba(${nextPiece.color}, 0.8)`;
        const nextBlockSize = window.adjustedBlockSize || NEXT_BLOCK_SIZE;
        
        // 计算居中位置
        const offsetX = (nextCanvas.width - shape[0].length * nextBlockSize) / 2;
        const offsetY = (nextCanvas.height - shape.length * nextBlockSize) / 2;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    // 绘制预览方块
                    const padding = 1;
                    
                    ctx.fillStyle = color;
                    ctx.fillRect(offsetX + x * nextBlockSize + padding, 
                                 offsetY + y * nextBlockSize + padding, 
                                 nextBlockSize - padding * 2, 
                                 nextBlockSize - padding * 2);
                    
                    // 绘制边框
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(offsetX + x * nextBlockSize + padding, 
                                   offsetY + y * nextBlockSize + padding, 
                                   nextBlockSize - padding * 2, 
                                   nextBlockSize - padding * 2);
                }
            }
        }
    }
}

// 绘制HOLD区域的方块
// 绘制影子方块
function drawGhostPiece(blockSize) {
    if (!currentPiece) return;
    
    const ctx = canvas.getContext('2d');
    const tempPiece = { ...currentPiece };
    
    // 找到影子方块的最终位置
    while (isValidMove(tempPiece, 0, 1)) {
        tempPiece.y++;
    }
    
    // 绘制影子方块
    const shape = tempPiece.shape;
    
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const padding = 2;
                const boardRow = tempPiece.y + y;
                const boardCol = tempPiece.x + x;
                
                if (boardRow >= 0) {
                    ctx.fillStyle = COLORS.ghost;
                    ctx.globalAlpha = 0.2;
                    ctx.fillRect(boardCol * blockSize + padding, 
                                boardRow * blockSize + padding, 
                                blockSize - padding * 2, 
                                blockSize - padding * 2);
                    
                    // 绘制边框
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(boardCol * blockSize + padding, 
                                  boardRow * blockSize + padding, 
                                  blockSize - padding * 2, 
                                  blockSize - padding * 2);
                }
            }
        }
    }
    
    // 重置透明度
    ctx.globalAlpha = 1;
}

// 绘制消行动画
function drawLineClearAnimation(linesCleared) {
    // 优化：使用更生动的消行动画效果
    const ctx = canvas.getContext('2d');
    const blockSize = window.adjustedBlockSize || BLOCK_SIZE;
    
    // 闪烁动画
    let flashCount = 0;
    const flashInterval = setInterval(() => {
        flashCount++;
        drawBoard(); // 先绘制基础画面
        
        // 找出被清除的行
        const clearedLines = [];
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row].every(cell => cell !== 0)) {
                clearedLines.push(row);
            }
        }
        
        // 绘制闪光效果
        if (flashCount % 2 === 0) {
            clearedLines.forEach(line => {
                ctx.fillStyle = `rgba(255, 255, 255, ${0.7 - flashCount * 0.1})`;
                ctx.fillRect(0, line * blockSize, canvas.width, blockSize);
            });
        }
        
        // 结束动画
        if (flashCount >= 5) {
            clearInterval(flashInterval);
            drawBoard();
        }
    }, 80);
}

// 游戏主循环
function gameLoop() {
    if (!isPaused && isGameRunning) {
        // 尝试下移方块
        if (isValidMove(currentPiece, 0, 1)) {
            currentPiece.y++;
        } else {
            // 方块无法下移，固定到游戏板上
            lockPiece();
            // 清除完整的行
            clearLines();
            // 生成新方块
            spawnNewPiece();
            // 检查游戏是否结束
            if (!isValidMove(currentPiece)) {
                endGame();
                return; // 游戏结束，不再继续循环
            }
        }
        
        // 直接绘制，避免嵌套的requestAnimationFrame导致的延迟问题
        drawBoard();
    }
}

// 生成新方块
function spawnNewPiece() {
    currentPiece = nextPiece || createPiece();
    nextPiece = createPiece();
    drawNextPiece();
    
    // 绘制幽灵方块（显示方块将落到的位置）
    drawBoard();
}

// 开始游戏
function startGame() {
    initializeBoard();
    score = 0;
    level = 1;
    lines = 0;
    isGameRunning = true;
    isPaused = false;
    
    // 更新显示
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
    
    // 生成初始方块
    spawnNewPiece();
    
    // 开始游戏循环
    updateGameSpeed();
    
    // 更新按钮状态
    startButton.disabled = true;
    pauseButton.disabled = false;
    
    // 隐藏游戏结束弹窗
    gameOverModal.classList.add('hidden');
    
    // 播放开始游戏音效
    if (soundEnabled && audioContext) {
        playSound('rotate');
    }
}

// 暂停游戏
function pauseGame() {
    if (isGameRunning) {
        isPaused = !isPaused;
        
        if (isPaused) {
            clearInterval(gameInterval);
            pauseButton.innerHTML = '<i class="fas fa-play"></i> 继续';
            // 绘制暂停文字
            drawBoard();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('游戏暂停', canvas.width / 2, canvas.height / 2);
        } else {
            updateGameSpeed();
            pauseButton.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        }
    }
}

// 重置游戏
function resetGame() {
    // 停止游戏循环
    clearInterval(gameInterval);
    
    // 重置游戏状态
    isGameRunning = false;
    isPaused = false;
    
    // 更新按钮状态
    startButton.disabled = false;
    pauseButton.disabled = true;
    pauseButton.innerHTML = '<i class="fas fa-pause"></i> 暂停';
    
    // 清空游戏板
    initializeBoard();
    currentPiece = null;
    nextPiece = null;
    
    // 重置显示
    scoreElement.textContent = '0';
    levelElement.textContent = '1';
    linesElement.textContent = '0';
    
    // 重绘游戏
    drawBoard();
    drawNextPiece();
    
    // 隐藏游戏结束弹窗
    gameOverModal.classList.add('hidden');
}

// 结束游戏
function endGame() {
    // 停止游戏循环
    clearInterval(gameInterval);
    
    // 播放游戏结束音效
    playSound('gameOver');
    
    // 更新游戏状态
    isGameRunning = false;
    
    // 更新按钮状态
    startButton.disabled = false;
    pauseButton.disabled = true;
    
    // 显示游戏结束弹窗
    finalScoreElement.textContent = score;
    gameOverModal.classList.remove('hidden');
}

// 处理键盘输入
function handleKeyPress(event) {
    if (!isGameRunning || isPaused) return;
    
    switch (event.key) {
        case 'ArrowLeft':
            if (isValidMove(currentPiece, -1, 0)) {
                currentPiece.x--;
                drawBoard();
                playSound('move');
            }
            break;
        case 'ArrowRight':
            if (isValidMove(currentPiece, 1, 0)) {
                currentPiece.x++;
                drawBoard();
                playSound('move');
            }
            break;
        case 'ArrowDown':
            if (isValidMove(currentPiece, 0, 1)) {
                currentPiece.y++;
                drawBoard();
                // 下移得分
                score += 1;
                scoreElement.textContent = score;
                playSound('move');
            }
            break;
        case 'ArrowUp':
            rotatePiece();
            drawBoard();
            playSound('rotate');
            break;
        case ' ':
            hardDropAndLock();
            break;
        case 'p':
        case 'P':
            pauseGame();
            break;
    }
}

// 确保移动控制器在页面加载时可见
function checkAndShowMobileControls() {}

function hardDropAndLock() {
    if (!isGameRunning || isPaused || !currentPiece) return;

    let dropped = false;
    while (isValidMove(currentPiece, 0, 1)) {
        currentPiece.y++;
        score += 2;
        dropped = true;
    }

    if (dropped) {
        scoreElement.textContent = score;
        drawBoard();
        playSound('drop');
    }

    setTimeout(() => {
        if (isGameRunning && !isPaused && currentPiece) {
            lockPiece();
            clearLines();
            spawnNewPiece();
            if (currentPiece && !isValidMove(currentPiece)) {
                endGame();
            } else {
                drawBoard();
            }
        }
    }, 50);
}

function tryMove(dx, dy, addScore = 0) {
    if (!isGameRunning || isPaused || !currentPiece) return false;
    if (!isValidMove(currentPiece, dx, dy)) return false;
    currentPiece.x += dx;
    currentPiece.y += dy;
    if (addScore) {
        score += addScore;
        scoreElement.textContent = score;
    }
    drawBoard();
    playSound('move');
    return true;
}

function bindGestureControls() {
    if (!canvas) return;

    const state = {
        active: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        startTime: 0,
        moved: false,
        longPressFired: false,
        longPressTimer: null,
        softDropTimer: null
    };

    const moveThreshold = 22;
    const tapMoveThreshold = 10;
    const longPressMs = 420;

    const clearTimers = () => {
        if (state.longPressTimer) {
            clearTimeout(state.longPressTimer);
            state.longPressTimer = null;
        }
        if (state.softDropTimer) {
            clearInterval(state.softDropTimer);
            state.softDropTimer = null;
        }
    };

    const startSoftDrop = () => {
        if (state.softDropTimer) return;
        state.softDropTimer = setInterval(() => {
            if (!tryMove(0, 1, 1)) {
                clearTimers();
            }
        }, 60);
    };

    canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);

        state.active = true;
        state.pointerId = e.pointerId;
        state.startX = e.clientX;
        state.startY = e.clientY;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        state.startTime = Date.now();
        state.moved = false;
        state.longPressFired = false;

        clearTimers();
        state.longPressTimer = setTimeout(() => {
            if (!state.active || state.moved) return;
            state.longPressFired = true;
            if (isGameRunning) {
                if (!isPaused && currentPiece) {
                    hardDropAndLock();
                } else {
                    pauseGame();
                }
            }
        }, longPressMs);
    }, { passive: false });

    canvas.addEventListener('pointermove', (e) => {
        if (!state.active || e.pointerId !== state.pointerId) return;
        e.preventDefault();

        const dx = e.clientX - state.lastX;
        const dy = e.clientY - state.lastY;
        const totalDx = e.clientX - state.startX;
        const totalDy = e.clientY - state.startY;

        const absTotalDx = Math.abs(totalDx);
        const absTotalDy = Math.abs(totalDy);

        if (absTotalDx < moveThreshold && absTotalDy < moveThreshold) return;

        state.moved = true;
        if (state.longPressTimer) {
            clearTimeout(state.longPressTimer);
            state.longPressTimer = null;
        }

        if (absTotalDx > absTotalDy * 1.15) {
            if (dx > moveThreshold) {
                tryMove(1, 0);
                state.lastX = e.clientX;
                state.lastY = e.clientY;
            } else if (dx < -moveThreshold) {
                tryMove(-1, 0);
                state.lastX = e.clientX;
                state.lastY = e.clientY;
            }
            return;
        }

        if (totalDy > moveThreshold) {
            tryMove(0, 1, 1);
            startSoftDrop();
            state.lastX = e.clientX;
            state.lastY = e.clientY;
        }
    }, { passive: false });

    const endPointer = (e) => {
        if (!state.active || e.pointerId !== state.pointerId) return;
        e.preventDefault();

        const dt = Date.now() - state.startTime;
        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        clearTimers();

        const isTap = !state.moved && !state.longPressFired && dt <= 260 && absDx <= tapMoveThreshold && absDy <= tapMoveThreshold;
        state.active = false;
        state.pointerId = null;

        if (isTap && isGameRunning && !isPaused && currentPiece) {
            rotatePiece();
            drawBoard();
            playSound('rotate');
        }
    };

    canvas.addEventListener('pointerup', endPointer, { passive: false });
    canvas.addEventListener('pointercancel', endPointer, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length === 2) {
            e.preventDefault();
            pauseGame();
        }
    }, { passive: false });
}

// 初始化游戏
function initGame() {
    // 获取DOM元素引用
    canvas = document.getElementById('tetris-board');
    nextCanvas = document.getElementById('next-piece-canvas');
    scoreElement = document.getElementById('score');
    levelElement = document.getElementById('level');
    linesElement = document.getElementById('lines');
    startButton = document.getElementById('start-button');
    pauseButton = document.getElementById('pause-button');
    resetButton = document.getElementById('reset-button');
    gameOverModal = document.getElementById('game-over-modal');
    finalScoreElement = document.getElementById('final-score');
    playAgainButton = document.getElementById('play-again-button');
    toggleSoundButton = document.getElementById('toggle-sound');
    
    // 获取移动控制按钮
    leftButton = document.getElementById('left-button');
    rightButton = document.getElementById('right-button');
    downButton = document.getElementById('down-button');
    rotateButton = document.getElementById('rotate-button');
    dropButton = document.getElementById('drop-button');
    mobileControls = document.querySelector('.mobile-controls');
    pauseTouchButton = document.getElementById('pause-touch');
    
    // 初始化游戏板
    initializeBoard();
    
    // 初始化音频系统
    initAudio();
    
    // 调整画布尺寸
    adjustCanvasSize();
    
    // 绘制初始游戏板
    drawBoard();
    drawNextPiece();
    
    bindGestureControls();
    
    // 添加事件监听
    if (startButton) {
        startButton.addEventListener('click', startGame);
    }
    if (pauseButton) {
        pauseButton.addEventListener('click', pauseGame);
    }
    if (resetButton) {
        resetButton.addEventListener('click', resetGame);
    }
    if (playAgainButton) {
        playAgainButton.addEventListener('click', startGame);
    }
    if (toggleSoundButton) {
        toggleSoundButton.addEventListener('click', toggleSound);
    }
    document.addEventListener('keydown', handleKeyPress);
    
    // 添加点击事件以启用音效（解决自动播放限制）
    function checkAndResumeAudio() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }
    }
    
    // 在任何用户交互时尝试恢复音频上下文
    document.addEventListener('click', checkAndResumeAudio);
    document.addEventListener('keydown', checkAndResumeAudio);
    document.addEventListener('touchstart', checkAndResumeAudio);
    
    // 添加移动端触摸控制事件监听，使用更可靠的事件处理方式
    function bindTouchEvent(element, callback) {
        if (element) {
            // 同时绑定touchstart和mousedown事件，以确保兼容性
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                callback();
            }, { passive: false });
            
            // 添加额外的点击事件监听作为后备
            element.addEventListener('click', (e) => {
                e.preventDefault();
                callback();
            });
        }
    }
    
    // 绑定所有触摸控制按钮的事件
    bindTouchEvent(leftButton, () => {
        if (isGameRunning && !isPaused && currentPiece && isValidMove(currentPiece, -1, 0)) {
            currentPiece.x--;
            drawBoard();
            playSound('move');
        }
    });
    
    bindTouchEvent(rightButton, () => {
        if (isGameRunning && !isPaused && currentPiece && isValidMove(currentPiece, 1, 0)) {
            currentPiece.x++;
            drawBoard();
            playSound('move');
        }
    });
    
    bindTouchEvent(downButton, () => {
        if (isGameRunning && !isPaused && currentPiece && isValidMove(currentPiece, 0, 1)) {
            currentPiece.y++;
            drawBoard();
            score += 1;
            scoreElement.textContent = score;
            playSound('move');
        }
    });
    
    bindTouchEvent(rotateButton, () => {
        if (isGameRunning && !isPaused && currentPiece) {
            rotatePiece();
            drawBoard();
            playSound('rotate');
        }
    });
    
    bindTouchEvent(dropButton, () => {
        hardDropAndLock();
    });
    
    bindTouchEvent(pauseTouchButton, () => {
        if (isGameRunning) {
            pauseGame();
        }
    });
    
    // 为移动设备添加长按加速功能
    let holdTimer;
    
    // 长按向下按钮加速下落
    if (downButton) {
        downButton.addEventListener('touchstart', () => {
            if (isGameRunning && !isPaused && currentPiece) {
                // 立即移动一次
                if (isValidMove(currentPiece, 0, 1)) {
                    currentPiece.y++;
                    drawBoard();
                    score += 1;
                    scoreElement.textContent = score;
                    playSound('move');
                }
                
                // 设置定时器，实现长按加速
                holdTimer = setInterval(() => {
                    if (isGameRunning && !isPaused && currentPiece && isValidMove(currentPiece, 0, 1)) {
                        currentPiece.y++;
                        drawBoard();
                        score += 1;
                        scoreElement.textContent = score;
                        playSound('move');
                    } else {
                        clearInterval(holdTimer);
                    }
                }, 100); // 每100毫秒移动一次
            }
        }, { passive: false });
        
        // 触摸结束时清除定时器
        downButton.addEventListener('touchend', () => {
            clearInterval(holdTimer);
        });
        
        downButton.addEventListener('touchcancel', () => {
            clearInterval(holdTimer);
        });
    }
}

// 页面加载完成时执行
window.addEventListener('DOMContentLoaded', () => {
    initGame();
    
    // 调整画布尺寸
    adjustCanvasSize();
});

// 窗口大小变化时调整画布尺寸
window.addEventListener('resize', () => requestAnimationFrame(adjustCanvasSize));

// 设备方向变化时调整画布尺寸
window.addEventListener('orientationchange', () => requestAnimationFrame(adjustCanvasSize));
