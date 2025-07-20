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
    const playCountElement = document.getElementById('play-count');
    const achievementsToggleButton = document.getElementById('achievements-toggle');
    const achievementsListElement = document.getElementById('achievements-list');
    const achievementsCloseButton = document.getElementById('achievements-close');
    const streakCountElement = document.getElementById('streak-count');

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
        { id: 'firstBlock', label: '初Emoji!', icon: '👍', unlocked: false, description: 'ブロックを1つ落とす' },
        { id: 'score100', label: 'スコア100', icon: '💰', unlocked: false, description: 'スコアを100点以上にする' },
        { id: 'level5', label: 'レベル5', icon: '🚀', unlocked: false, description: 'レベル5に到達する' },
        { id: 'hold', label: 'HOLD使用', icon: '📥', unlocked: false, description: 'HOLD機能を1回使用する' },
        { id: 'doubleClear', label: '2列消し', icon: '✌️', unlocked: false, description: '2列を同時に消去する' },
        { id: 'emojiSwitch', label: '絵文字切替', icon: '🎨', unlocked: false, description: '絵文字セットを切り替える' },
        { id: 'noClearGameOver', label: '無傷終了', icon: '💀', unlocked: false, description: '1列も消さずにゲームオーバー' },
        { id: 'zeroScoreGameOver', label: '0スコア', icon: '🫢', unlocked: false, description: 'スコア0でゲームオーバー' },
        { id: 'leftmostTen', label: '左極振り', icon: '👈', unlocked: false, description: '10回連続で左端にブロックを落とす' },
        { id: 'fiveLinesInMinute', label: '瞬間芸人', icon: '⚡️', unlocked: false, description: 'ゲーム開始1分以内に5列消去' },
        { id: 'oneHourSurvivor', label: '1時間耐久', icon: '🕰️', unlocked: false, description: '1時間以上ゲームを続ける' },
        { id: 'allAchievements', label: '支配者', icon: '👑', unlocked: false, description: 'すべての実績を解除する' },
        { id: 'threeDaysStreak', label: '毎日Emoji', icon: '📅', unlocked: false, description: '3日連続でプレイする' },
        { id: 'newHighScore', label: '進化中', icon: '📈', unlocked: false, description: 'ハイスコアを更新する' },
        { id: 'hundredGames', label: '100ゲーム', icon: '🔁', unlocked: false, description: '100回ゲームをプレイする' },
        { id: 'weekendPlayer', label: '休日帝王', icon: '🛌', unlocked: false, description: '土日にプレイする' },
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
        if (!achievementsListElement) return;
        achievementsListElement.innerHTML = '';
        ACHIEVEMENTS.forEach(a => {
            const badge = document.createElement('div');
            badge.className = 'achievement' + (a.unlocked ? ' unlocked' : '');
            badge.setAttribute('data-description', a.description);
            const iconSpan = document.createElement('span');
            iconSpan.className = 'achievement-icon';
            iconSpan.textContent = a.icon;
            // 実績の種類に応じてアニメーションクラスを追加
            if (a.unlocked) {
                if (['score100', 'newHighScore'].includes(a.id)) {
                    iconSpan.classList.add('score-animation');
                } else if (['firstBlock', 'hold', 'emojiSwitch', 'doubleClear'].includes(a.id)) {
                    iconSpan.classList.add('action-animation');
                } else if (['allAchievements', 'fiveLinesInMinute'].includes(a.id)) {
                    iconSpan.classList.add('special-animation');
                } else if (['oneHourSurvivor', 'threeDaysStreak', 'hundredGames', 'weekendPlayer'].includes(a.id)) {
                    iconSpan.classList.add('time-animation');
                } else if (['leftmostTen'].includes(a.id)) {
                    iconSpan.classList.add('fire-animation');
                }
            }
            badge.appendChild(iconSpan);
            const labelSpan = document.createElement('span');
            labelSpan.textContent = a.label;
            badge.appendChild(labelSpan);
            achievementsListElement.appendChild(badge);
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
        // 👑 すべての実績解除判定
        const allExceptKing = ACHIEVEMENTS.filter(a => a.id !== 'allAchievements');
        if (allExceptKing.every(a => a.unlocked)) {
            ACHIEVEMENTS.find(a => a.id === 'allAchievements').unlocked = true;
        }
        // 📈 ハイスコア更新実績
        if (gameOver) {
            const highScore = parseInt(localStorage.getItem('emojiTetrisHighScore') || '0', 10);
            if (score > highScore) {
                localStorage.setItem('emojiTetrisHighScore', score);
                ACHIEVEMENTS.find(a => a.id === 'newHighScore').unlocked = true;
            }
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

    function checkThreeDaysStreak() {
        // 今日の日付（YYYY-MM-DD）
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();
        const lastPlay = localStorage.getItem('emojiTetrisLastPlayDate');
        let streak = parseInt(localStorage.getItem('emojiTetrisStreak') || '0', 10);
        if (lastPlay) {
            const last = new Date(lastPlay);
            const diff = (today - last) / (1000*60*60*24);
            if (diff >= 1 && diff < 2) {
                streak += 1;
            } else if (diff < 1) {
                // 同じ日
                // 何もしない
            } else {
                streak = 1;
            }
        } else {
            streak = 1;
        }
        localStorage.setItem('emojiTetrisLastPlayDate', todayStr);
        localStorage.setItem('emojiTetrisStreak', streak);
        if (streak >= 3) {
            ACHIEVEMENTS.find(a => a.id === 'threeDaysStreak').unlocked = true;
        }
    }

    function checkHundredGames() {
        let count = parseInt(localStorage.getItem('emojiTetrisPlayCount') || '0', 10);
        count += 1;
        localStorage.setItem('emojiTetrisPlayCount', count);
        if (count >= 100) {
            ACHIEVEMENTS.find(a => a.id === 'hundredGames').unlocked = true;
        }
    }

    function updatePlayCount() {
        const count = parseInt(localStorage.getItem('emojiTetrisPlayCount') || '0', 10);
        if (playCountElement) {
            playCountElement.setAttribute('data-count', String(count));
        }
    }

    function checkWeekendPlayer() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=日曜日, 6=土曜日
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            ACHIEVEMENTS.find(a => a.id === 'weekendPlayer').unlocked = true;
        }
    }

    function updateStreakCount() {
        const streak = parseInt(localStorage.getItem('emojiTetrisStreak') || '0', 10);
        if (streakCountElement) {
            streakCountElement.setAttribute('data-streak', String(streak));
            // 炎マークを数字の後ろに追加（重複しないように一度消してから追加）
            streakCountElement.querySelectorAll('.streak-fire').forEach(e => e.remove());
            const fire = document.createElement('span');
            fire.className = 'streak-fire';
            fire.textContent = '🔥';
            streakCountElement.appendChild(fire);
        }
    }

    function updateStreakOnGameStart() {
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        const lastStreakDate = localStorage.getItem('emojiTetrisLastStreakDate');
        let streak = parseInt(localStorage.getItem('emojiTetrisStreak') || '0', 10);
        if (lastStreakDate) {
            const last = new Date(lastStreakDate);
            // 日付差分（日単位）
            const diff = Math.floor((today - last) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
                streak += 1;
            } else if (diff === 0) {
                // 同じ日→何もしない
            } else {
                streak = 1;
            }
        } else {
            streak = 1;
        }
        localStorage.setItem('emojiTetrisLastStreakDate', todayStr);
        localStorage.setItem('emojiTetrisStreak', String(streak));
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
        updateStreakOnGameStart();
        checkThreeDaysStreak();
        checkHundredGames();
        checkWeekendPlayer();
        updatePlayCount();
        updateStreakCount();
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

    if (achievementsToggleButton) {
        achievementsToggleButton.addEventListener('click', () => {
            const isExpanded = achievementsToggleButton.classList.contains('expanded');
            if (!isExpanded) {
                achievementsToggleButton.classList.add('expanded');
                // 実績一覧のHTMLを生成
                const achievementsHeader = document.createElement('div');
                achievementsHeader.className = 'achievements-header';
                const title = document.createElement('span');
                title.className = 'achievements-title';
                title.textContent = '🏆 実績';
                const closeBtn = document.createElement('button');
                closeBtn.className = 'achievements-close';
                closeBtn.textContent = '✕';
                closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    achievementsToggleButton.classList.remove('expanded');
                    achievementsToggleButton.innerHTML = '🏆 実績';
                };
                achievementsHeader.appendChild(title);
                achievementsHeader.appendChild(closeBtn);
                // 実績リストラッパーを作成
                const list = document.createElement('div');
                list.className = 'achievements-list';
                ACHIEVEMENTS.forEach(a => {
                    const badge = document.createElement('div');
                    badge.className = 'achievement' + (a.unlocked ? ' unlocked' : '');
                    badge.setAttribute('data-description', a.description);
                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'achievement-icon';
                    iconSpan.textContent = a.icon;
                    // 実績の種類に応じてアニメーションクラスを追加
                    if (a.unlocked) {
                        if (["score100", "newHighScore"].includes(a.id)) {
                            iconSpan.classList.add('score-animation');
                        } else if (["firstBlock", "hold", "emojiSwitch", "doubleClear"].includes(a.id)) {
                            iconSpan.classList.add('action-animation');
                        } else if (["allAchievements", "fiveLinesInMinute"].includes(a.id)) {
                            iconSpan.classList.add('special-animation');
                        } else if (["oneHourSurvivor", "threeDaysStreak", "hundredGames", "weekendPlayer"].includes(a.id)) {
                            iconSpan.classList.add('time-animation');
                        } else if (["leftmostTen"].includes(a.id)) {
                            iconSpan.classList.add('fire-animation');
                        }
                    }
                    badge.appendChild(iconSpan);
                    const labelSpan = document.createElement('span');
                    labelSpan.textContent = a.label;
                    badge.appendChild(labelSpan);
                    list.appendChild(badge);
                });
                achievementsToggleButton.innerHTML = '';
                achievementsToggleButton.appendChild(achievementsHeader);
                achievementsToggleButton.appendChild(list);
            }
        });
    }

    if (achievementsCloseButton) {
        achievementsCloseButton.addEventListener('click', () => {
            document.getElementById('achievements').classList.remove('show');
        });
    }

    // 初期表示
    function init() {
        draw();
        updateAchievements();
        updatePlayCount();
        updateStreakCount();
    }

    // 日付・時刻表示
    function updateDateTimeDisplay() {
        const dt = new Date();
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        const hh = String(dt.getHours()).padStart(2, '0');
        const min = String(dt.getMinutes()).padStart(2, '0');
        const ss = String(dt.getSeconds()).padStart(2, '0');
        const str = `${yyyy}/${mm}/${dd} ${hh}:${min}:${ss}`;
        const el = document.getElementById('datetime-display');
        if (el) el.textContent = str;
    }
    updateDateTimeDisplay();
    setInterval(updateDateTimeDisplay, 1000);

    // ==== ファビコン動的切り替え ====
    (function setupEmojiFavicon() {
        const allEmojis = EMOJI_SETS.flat();
        let faviconIndex = 0;
        function setFavicon(emoji) {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.font = '48px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.clearRect(0, 0, 64, 64);
            ctx.fillText(emoji, 32, 36);
            const url = canvas.toDataURL();
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = url;
        }
        setFavicon(allEmojis[0]);
        setInterval(() => {
            faviconIndex = (faviconIndex + 1) % allEmojis.length;
            setFavicon(allEmojis[faviconIndex]);
        }, 500);
    })();

    // === 草原の背景に家・人・動物を配置して動かす ===
    const bgLayer = document.getElementById('emoji-bg-layer');
    if (bgLayer) {
        const houses = ['🏠','🏡'];
        const people = ['🧑','👩‍🦱','👨‍🦰'];
        const animals = ['🐶','🐱','🐰','🦊','🐻'];
        // 家を配置（静止）
        houses.forEach((emoji, i) => {
            const el = document.createElement('div');
            el.className = 'emoji-bg-obj';
            el.textContent = emoji;
            el.style.left = `${15 + i*50}%`;
            el.style.bottom = '12%';
            el.style.fontSize = '2.5rem';
            bgLayer.appendChild(el);
        });
        // 人を配置（動く）
        people.forEach((emoji, i) => {
            const el = document.createElement('div');
            el.className = 'emoji-bg-obj';
            el.textContent = emoji;
            el.style.left = `${20 + i*20}%`;
            el.style.bottom = '10%';
            el.style.fontSize = '2.1rem';
            bgLayer.appendChild(el);
            moveBgEmoji(el, 1.5 + Math.random());
        });
        // 動物を配置（動く）
        animals.forEach((emoji, i) => {
            const el = document.createElement('div');
            el.className = 'emoji-bg-obj';
            el.textContent = emoji;
            el.style.left = `${10 + i*15}%`;
            el.style.bottom = `${7 + Math.random()*4}%`;
            el.style.fontSize = '2.1rem';
            bgLayer.appendChild(el);
            moveBgEmoji(el, 1 + Math.random());
        });
        // 移動アニメーション関数
        function moveBgEmoji(el, speed) {
            function move() {
                const left = Math.random() * 80 + 5;
                const bottom = 7 + Math.random() * 8;
                el.style.left = `${left}%`;
                el.style.bottom = `${bottom}%`;
                setTimeout(move, 4000 + Math.random()*4000/speed);
            }
            setTimeout(move, 1000 + Math.random()*2000);
        }
    }

    init();
}); 