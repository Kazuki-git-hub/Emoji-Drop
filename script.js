document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const nextTetrominoShapeElement = document.getElementById('next-tetromino-shape');
    const startButton = document.getElementById('start-button');
    const gameOverScreen = document.getElementById('game-over');
    const restartButton = document.getElementById('restart-button');
    const emojiSwitchButton = document.getElementById('emoji-switch-button');
    const restartAlwaysButton = document.getElementById('restart-always-button');
    const levelElement = document.getElementById('level');
    const holdButton = document.getElementById('hold-button');
    const holdTetrominoShapeElement = document.getElementById('hold-tetromino-shape');
    const achievementsElement = document.getElementById('achievements');

    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    const EMOJI_SETS = [
        ['😭', '😆', '😎', '🥳', '😇', '😍', '😄'],   // 顔文字
        ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻'],   // 動物の顔
        ['🚗', '🚕', '🚌', '🚓', '🚑', '🚒', '🏎️'],   // 乗り物
        ['🍎', '🍊', '🍌', '🍇', '🍓', '🥝', '🍒'],   // フルーツ
        ['🍔', '🍟', '🍕', '🌭', '🍿', '🍗', '🍖'],   // 食べ物
        ['🍺', '🍷', '☕️', '🍹', '🥛', '🥤', '🍵'],   // 飲み物
        ['⚽️', '🏀', '🏈', '⚾️', '🎾', '🏐', '🎱'],   // スポーツ
        ['💵', '💴', '💶', '💷', '🪙', '💰', '💳'],   // お金
        ['🌸', '🍉', '🏖️', '🍁', '🎃', '🎄', '⛄️']    // 季節
    ];
    let currentEmojiSetIndex = 0;
    let EMOJIS = EMOJI_SETS[currentEmojiSetIndex];
    let TETROMINOES = getTetrominoes(EMOJIS);

    let board = createEmptyBoard();
    let currentTetromino;
    let currentPosition;
    let nextTetromino;
    let score = 0;
    let gameInterval;
    let isGameOver = false;
    let isPaused = false;
    let isClearing = false;
    let level = 1;
    let dropSpeed = 1000;
    let holdTetromino = null;
    let canHold = true;
    let hasClearedAnyLine = false;
    let consecutiveLeftDrops = 0;
    let linesClearedInFirstMinute = 0;
    let gameStartTime = null;

    // 実績リスト
    const ACHIEVEMENTS = [
        { id: 'firstBlock', label: '初Emoji!', icon: '👍', unlocked: false },
        { id: 'score100', label: 'スコア100達成', icon: '💰', unlocked: false },
        { id: 'level5', label: 'レベル5到達', icon: '🚀', unlocked: false },
        { id: 'hold', label: 'HOLD初使用', icon: '📥', unlocked: false },
        { id: 'doubleClear', label: '2列同時消し', icon: '✌️', unlocked: false },
        { id: 'emojiSwitch', label: '絵文字切替', icon: '🎨', unlocked: false },
        { id: 'noClearGameOver', label: '無傷の落下', icon: '💀', unlocked: false },
        { id: 'zeroScoreGameOver', label: 'まさかの0スコア', icon: '🫢', unlocked: false },
        { id: 'leftmostTen', label: '左に極振り', icon: '👈', unlocked: false },
        { id: 'fiveLinesInMinute', label: '瞬間芸人', icon: '⚡️', unlocked: false },
        { id: 'oneHourSurvivor', label: '1時間Emoji耐久', icon: '🕰️', unlocked: false },
    ];

    function createEmptyBoard() {
        return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
    }

    function getTetrominoes(emojis) {
        return {
            'I': { shape: [[1, 1, 1, 1]], emoji: emojis[0] },
            'J': { shape: [[1, 0, 0], [1, 1, 1]], emoji: emojis[1] },
            'L': { shape: [[0, 0, 1], [1, 1, 1]], emoji: emojis[2] },
            'O': { shape: [[1, 1], [1, 1]], emoji: emojis[3] },
            'S': { shape: [[0, 1, 1], [1, 1, 0]], emoji: emojis[4] },
            'T': { shape: [[0, 1, 0], [1, 1, 1]], emoji: emojis[5] },
            'Z': { shape: [[1, 1, 0], [0, 1, 1]], emoji: emojis[6] }
        };
    }

    function getRandomTetromino() {
        const keys = Object.keys(TETROMINOES);
        const randKey = keys[Math.floor(Math.random() * keys.length)];
        const tetromino = TETROMINOES[randKey];
        return {
            shape: tetromino.shape,
            emoji: tetromino.emoji,
            pos: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 }
        };
    }

    function draw() {
        if (isClearing) return;
        gameBoard.innerHTML = '';
        const displayBoard = board.map(row => row.slice());
        if (currentTetromino) {
            currentTetromino.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value === 1) {
                        const boardX = currentTetromino.pos.x + x;
                        const boardY = currentTetromino.pos.y + y;
                        if (boardY >= 0) {
                           displayBoard[boardY][boardX] = currentTetromino.emoji;
                        }
                    }
                });
            });
        }
        displayBoard.forEach(row => {
            row.forEach(cellValue => {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.textContent = cellValue || '';
                gameBoard.appendChild(cell);
            });
        });
        drawNextTetromino();
        drawHoldTetromino();
    }
    
    function drawNextTetromino() {
        nextTetrominoShapeElement.innerHTML = '';
        if (nextTetromino) {
            const shape = nextTetromino.shape;
            // 4x4のグリッドに中央揃えで表示
            const offsetX = Math.floor((4 - shape[0].length) / 2);
            const offsetY = Math.floor((4 - shape.length) / 2);

            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++) {
                    const cell = document.createElement('div');
                    cell.classList.add('next-cell');
                    const shapeY = y - offsetY;
                    const shapeX = x - offsetX;
                    if (shape[shapeY] && shape[shapeY][shapeX]) {
                        cell.textContent = nextTetromino.emoji;
                    }
                    nextTetrominoShapeElement.appendChild(cell);
                }
            }
        }
    }

    function drawHoldTetromino() {
        holdTetrominoShapeElement.innerHTML = '';
        if (holdTetromino) {
            const shape = holdTetromino.shape;
            const offsetX = Math.floor((4 - shape[0].length) / 2);
            const offsetY = Math.floor((4 - shape.length) / 2);
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++) {
                    const cell = document.createElement('div');
                    cell.classList.add('next-cell');
                    const shapeY = y - offsetY;
                    const shapeX = x - offsetX;
                    if (shape[shapeY] && shape[shapeY][shapeX]) {
                        cell.textContent = holdTetromino.emoji;
                    }
                    holdTetrominoShapeElement.appendChild(cell);
                }
            }
        } else {
            // 空欄
            for (let i = 0; i < 16; i++) {
                const cell = document.createElement('div');
                cell.classList.add('next-cell');
                holdTetrominoShapeElement.appendChild(cell);
            }
        }
    }

    function checkCollision(tetromino, newPos) {
        for (let y = 0; y < tetromino.shape.length; y++) {
            for (let x = 0; x < tetromino.shape[y].length; x++) {
                if (tetromino.shape[y][x]) {
                    const boardX = newPos.x + x;
                    const boardY = newPos.y + y;
                    // ボードの範囲外か？
                    if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
                        return true;
                    }
                    // 他
                    if (boardY >= 0 && board[boardY][boardX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    function lockTetromino() {
        let isAtLeftEdge = false;
        currentTetromino.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const boardX = currentTetromino.pos.x + x;
                    const boardY = currentTetromino.pos.y + y;
                    if (boardX === 0) {
                        isAtLeftEdge = true;
                    }
                    if (boardY >= 0) {
                        // 必ず絵文字 or null だけを格納
                        board[boardY][boardX] = currentTetromino.emoji;
                    }
                }
            });
        });

        if (isAtLeftEdge) {
            consecutiveLeftDrops++;
        } else {
            consecutiveLeftDrops = 0;
        }

        clearLines();
    }
    
    function updateLevelAndSpeed() {
        const newLevel = Math.floor(score / 50) + 1;
        if (newLevel !== level) {
            level = newLevel;
            levelElement.textContent = level;
            dropSpeed = Math.max(1000 - (level - 1) * 100, 200);
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, dropSpeed);
        }
    }

    function updateAchievements() {
        achievementsElement.innerHTML = '';
        ACHIEVEMENTS.forEach(a => {
            const badge = document.createElement('span');
            badge.className = 'achievement' + (a.unlocked ? ' unlocked' : '');
            badge.innerHTML = `<span class="achievement-icon">${a.icon}</span> ${a.label}`;
            achievementsElement.appendChild(badge);
        });
    }

    function checkAchievements({ linesCleared = 0, holdUsed = false, emojiSwitched = false, blockPlaced = false, gameOver = false } = {}) {
        if (blockPlaced) ACHIEVEMENTS.find(a => a.id === 'firstBlock').unlocked = true;
        if (score >= 100) ACHIEVEMENTS.find(a => a.id === 'score100').unlocked = true;
        if (level >= 5) ACHIEVEMENTS.find(a => a.id === 'level5').unlocked = true;
        if (holdUsed) ACHIEVEMENTS.find(a => a.id === 'hold').unlocked = true;
        if (linesCleared === 2) ACHIEVEMENTS.find(a => a.id === 'doubleClear').unlocked = true;
        if (emojiSwitched) ACHIEVEMENTS.find(a => a.id === 'emojiSwitch').unlocked = true;
        if (gameOver && !hasClearedAnyLine) {
            ACHIEVEMENTS.find(a => a.id === 'noClearGameOver').unlocked = true;
        }
        if (gameOver && score === 0) {
            ACHIEVEMENTS.find(a => a.id === 'zeroScoreGameOver').unlocked = true;
        }
        if (consecutiveLeftDrops >= 10) {
            ACHIEVEMENTS.find(a => a.id === 'leftmostTen').unlocked = true;
        }
        if (linesClearedInFirstMinute >= 5) {
            ACHIEVEMENTS.find(a => a.id === 'fiveLinesInMinute').unlocked = true;
        }
        if (gameOver && gameStartTime && (Date.now() - gameStartTime >= 60 * 60 * 1000)) {
            ACHIEVEMENTS.find(a => a.id === 'oneHourSurvivor').unlocked = true;
        }
        updateAchievements();
    }

    function clearLines() {
        let linesToClear = [];
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (board[y].every(cell => cell !== null)) {
                linesToClear.push(y);
            }
        }
        if (linesToClear.length > 0) {
            if (gameStartTime && Date.now() - gameStartTime < 60000) {
                linesClearedInFirstMinute += linesToClear.length;
            }
            hasClearedAnyLine = true;
            isClearing = true;
            drawClearEffect(linesToClear);
            setTimeout(() => {
                linesToClear.sort((a, b) => a - b);
                linesToClear.forEach(y => {
                    board.splice(y, 1);
                    board.unshift(Array(BOARD_WIDTH).fill(null));
                });
                score += linesToClear.length * 10;
                scoreElement.textContent = score;
                updateLevelAndSpeed();
                isClearing = false;
                draw();
                checkAchievements({ linesCleared: linesToClear.length, blockPlaced: true });
            }, 500);
        } else {
            checkAchievements({ blockPlaced: true });
        }
    }

    function drawClearEffect(linesToClear) {
        // 通常のボード描画
        gameBoard.innerHTML = '';
        const displayBoard = board.map(row => row.slice());
        if (currentTetromino) {
            currentTetromino.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value === 1) {
                        const boardX = currentTetromino.pos.x + x;
                        const boardY = currentTetromino.pos.y + y;
                        if (boardY >= 0) {
                           displayBoard[boardY][boardX] = currentTetromino.emoji;
                        }
                    }
                });
            });
        }
        displayBoard.forEach((row, y) => {
            row.forEach((cellValue, x) => {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.textContent = cellValue || '';
                if (linesToClear.includes(y)) {
                    cell.classList.add('clear-effect');
                }
                gameBoard.appendChild(cell);
            });
        });
        drawNextTetromino();
    }

    function moveDown() {
        if (isClearing) return;
        const newPos = { x: currentTetromino.pos.x, y: currentTetromino.pos.y + 1 };
        if (!checkCollision(currentTetromino, newPos)) {
            currentTetromino.pos = newPos;
        } else {
            lockTetromino();
            currentTetromino = nextTetromino;
            nextTetromino = getRandomTetromino();
            canHold = true;
            if (checkCollision(currentTetromino, currentTetromino.pos)) {
                isGameOver = true;
                clearInterval(gameInterval);
                gameOverScreen.classList.remove('hidden');
                checkAchievements({ gameOver: true });
            }
        }
        draw();
    }
    
    function move(dx, dy) {
        if (isGameOver || isClearing) return;
        const newPos = { x: currentTetromino.pos.x + dx, y: currentTetromino.pos.y + dy };
        if (!checkCollision(currentTetromino, newPos)) {
            currentTetromino.pos = newPos;
        }
        draw();
    }

    function rotateTetromino(dir) {
        if (isGameOver || isClearing) return;
        const shape = currentTetromino.shape;
        let newShape;
        if (dir === 'right') {
            newShape = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]).reverse());
        } else {
            newShape = shape[0].map((_, colIndex) => shape.map(row => row[row.length - 1 - colIndex])[colIndex]);
        }
        const newTetromino = { ...currentTetromino, shape: newShape };
        if (!checkCollision(newTetromino, currentTetromino.pos)) {
            currentTetromino.shape = newShape;
        }
        draw();
    }

    function gameLoop() {
        moveDown();
    }

    function startGame() {
        clearInterval(gameInterval);
        isGameOver = false;
        board = createEmptyBoard();
        score = 0;
        level = 1;
        dropSpeed = 1000;
        scoreElement.textContent = score;
        levelElement.textContent = level;
        gameOverScreen.classList.add('hidden');
        currentTetromino = getRandomTetromino();
        nextTetromino = getRandomTetromino();
        holdTetromino = null;
        canHold = true;
        hasClearedAnyLine = false;
        consecutiveLeftDrops = 0;
        linesClearedInFirstMinute = 0;
        gameStartTime = Date.now();
        // 実績リセット
        ACHIEVEMENTS.forEach(a => a.unlocked = false);
        updateAchievements();
        draw();
        gameInterval = setInterval(gameLoop, dropSpeed);
    }

    function pauseGame() {
        if (isPaused) {
            gameInterval = setInterval(gameLoop, dropSpeed);
            isPaused = false;
        } else {
            clearInterval(gameInterval);
            isPaused = true;
        }
    }

    function hardDrop() {
        while (!checkCollision(currentTetromino, { x: currentTetromino.pos.x, y: currentTetromino.pos.y + 1 })) {
            currentTetromino.pos.y += 1;
        }
        moveDown();
    }

    function holdCurrentTetromino() {
        if (!canHold) return;
        if (!holdTetromino) {
            holdTetromino = { ...currentTetromino };
            currentTetromino = getRandomTetromino();
        } else {
            const temp = { ...currentTetromino };
            currentTetromino = { ...holdTetromino, pos: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 } };
            holdTetromino = temp;
        }
        canHold = false;
        draw();
        checkAchievements({ holdUsed: true });
    }

    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        startGame();
    });

    restartButton.addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        startGame();
    });

    restartAlwaysButton.addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        startGame();
    });

    emojiSwitchButton.addEventListener('click', () => {
        // セット切り替え
        currentEmojiSetIndex = (currentEmojiSetIndex + 1) % EMOJI_SETS.length;
        EMOJIS = EMOJI_SETS[currentEmojiSetIndex];
        TETROMINOES = getTetrominoes(EMOJIS);
        // 盤面の絵文字も新セットに置き換え
        board = board.map(row => row.map(cell => {
            if (!cell) return null;
            let idx = -1;
            for (let set of EMOJI_SETS) {
                let i = set.indexOf(cell);
                if (i !== -1) { idx = i; break; }
            }
            if (idx === -1) return null;
            return EMOJIS[idx];
        }));
        // HOLD中のテトリミノも新セットに変換
        if (holdTetromino) {
            let idx = -1;
            for (let set of EMOJI_SETS) {
                let i = set.indexOf(holdTetromino.emoji);
                if (i !== -1) { idx = i; break; }
            }
            if (idx !== -1) {
                holdTetromino.emoji = EMOJIS[idx];
            }
        }
        // 現在・次のテトリミノも新セットで再生成
        currentTetromino = getRandomTetromino();
        nextTetromino = getRandomTetromino();
        draw();
        checkAchievements({ emojiSwitched: true });
    });

    holdButton.addEventListener('click', holdCurrentTetromino);
    document.addEventListener('keydown', e => {
        if (isGameOver || isClearing) return;
        if (isPaused && e.key !== 'p' && e.key !== 'P') return;
        switch (e.key) {
            case 'ArrowLeft':
                move(-1, 0);
                break;
            case 'ArrowRight':
                move(1, 0);
                break;
            case 'ArrowDown':
                moveDown();
                break;
            case ' ': // Space
                rotateTetromino('right');
                break;
            case 'h':
            case 'H':
                holdCurrentTetromino();
                break;
            case 'p':
            case 'P':
                pauseGame();
                break;
        }
    });

    // 初期表示
    function init() {
        draw();
        updateAchievements();
    }

    init();
}); 