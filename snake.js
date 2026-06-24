/* ============================================
   ABISMOX // snake.js
   Snake decorativo en canvas (no interactivo)
   ============================================ */


/* ============== CONFIGURACIÓN ============== */
const GRID_SIZE = 20;
const GAME_SPEED = 200;
const DIRECTION_CHANGE_INTERVAL = 5;
const INITIAL_LENGTH = 3;

const COLORS = {
    bg: '#000000',
    grid: '#00FFFF',
    food: '#FF0000',
    snakeHead: '#00FF00',
    snakeBody: '#00AA00'
};


/* ============== ESTADO ============== */
let canvas, ctx;
let width = 0, height = 0;
let cols = 0, rows = 0;
let snake = [];
let food = { x: 0, y: 0 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let framesSinceDirectionChange = 0;
let lastUpdateTime = 0;


/* ============== INICIALIZACIÓN ============== */
function init() {
    canvas = document.getElementById('snake-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    if (!ctx) return;

    resize();
    resetSnake();
    spawnFood();

    window.addEventListener('resize', resize);
    requestAnimationFrame(gameLoop);
}


/* ============== RESIZE ============== */
function resize() {
    const hero = document.querySelector('.hero');
    const heroHeight = hero ? hero.offsetHeight : 450;

    width = window.innerWidth;
    height = heroHeight;

    canvas.width = width;
    canvas.height = height;

    cols = Math.max(Math.floor(width / GRID_SIZE), 1);
    rows = Math.max(Math.floor(height / GRID_SIZE), 1);

    // Reposicionar si quedaron fuera de límites
    snake.forEach(seg => {
        seg.x = seg.x % cols;
        seg.y = seg.y % rows;
    });
    food.x = food.x % cols;
    food.y = food.y % rows;
}


/* ============== RESET SERPIENTE ============== */
function resetSnake() {
    const cx = Math.floor(cols / 2);
    const cy = Math.floor(rows / 2);

    snake = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
        snake.push({ x: cx - i, y: cy });
    }

    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    framesSinceDirectionChange = 0;
}


/* ============== SPAWN COMIDA ============== */
function spawnFood() {
    if (cols === 0 || rows === 0) return;

    let pos;
    let attempts = 0;
    const maxAttempts = 200;

    do {
        pos = {
            x: Math.floor(Math.random() * cols),
            y: Math.floor(Math.random() * rows)
        };
        attempts++;
    } while (
        snake.some(seg => seg.x === pos.x && seg.y === pos.y) &&
        attempts < maxAttempts
    );

    food = pos;
}


/* ============== DIRECCIÓN ALEATORIA ============== */
function randomizeDirection() {
    const allDirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    // Evitar giro de 180°
    const validDirs = allDirs.filter(
        d => !(d.x === -direction.x && d.y === -direction.y)
    );

    nextDirection = validDirs[Math.floor(Math.random() * validDirs.length)];
}


/* ============== CHECK COLISIONES ============== */
function checkCollisions(newHead) {
    // Auto-colisión: reset
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
            resetSnake();
            spawnFood();
            return;
        }
    }

    // Mover cabeza
    snake.unshift(newHead);

    // Comer comida: crecer
    if (newHead.x === food.x && newHead.y === food.y) {
        spawnFood();
    } else {
        snake.pop();
    }
}


/* ============== UPDATE GAME ============== */
function updateGame() {
    direction = nextDirection;

    const newHead = {
        x: (snake[0].x + direction.x + cols) % cols,
        y: (snake[0].y + direction.y + rows) % rows
    };

    checkCollisions(newHead);

    // Cambio de dirección cada N frames
    framesSinceDirectionChange++;
    if (framesSinceDirectionChange >= DIRECTION_CHANGE_INTERVAL) {
        randomizeDirection();
        framesSinceDirectionChange = 0;
    }
}


/* ============== DRAW GAME ============== */
function drawGame() {
    // Limpiar fondo
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    // Capas
    drawGrid();
    drawFood();
    drawSnake();
    drawScanlines();
}


/* ============== DRAW GRID ============== */
function drawGrid() {
    ctx.save();
    ctx.strokeStyle = COLORS.grid;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x <= width; x += GRID_SIZE) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
    }

    for (let y = 0; y <= height; y += GRID_SIZE) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
    }

    ctx.stroke();
    ctx.restore();
}


/* ============== DRAW COMIDA ============== */
function drawFood() {
    const x = food.x * GRID_SIZE;
    const y = food.y * GRID_SIZE;
    const pad = 2;

    ctx.fillStyle = COLORS.food;
    ctx.fillRect(x + pad, y + pad, GRID_SIZE - pad * 2, GRID_SIZE - pad * 2);
}


/* ============== DRAW SERPIENTE ============== */
function drawSnake() {
    const pad = 1;

    snake.forEach((seg, i) => {
        const x = seg.x * GRID_SIZE;
        const y = seg.y * GRID_SIZE;

        ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snakeBody;
        ctx.fillRect(x + pad, y + pad, GRID_SIZE - pad * 2, GRID_SIZE - pad * 2);
    });
}


/* ============== DRAW SCANLINES ============== */
function drawScanlines() {
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.globalAlpha = 0.15;

    for (let y = 0; y < height; y += 3) {
        ctx.fillRect(0, y, width, 1);
    }

    ctx.restore();
}


/* ============== GAME LOOP ============== */
function gameLoop(timestamp) {
    if (timestamp - lastUpdateTime >= GAME_SPEED) {
        updateGame();
        lastUpdateTime = timestamp;
    }

    drawGame();
    requestAnimationFrame(gameLoop);
}


/* ============== START ============== */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
