/*
  Snake Game - Canvas, no dependencies
  Controls: Arrow Keys / WASD, P pause, R restart, touch dpad
*/

(function () {
  const canvas = document.getElementById('game');
  const overlayEl = document.getElementById('overlay');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const btnPause = document.getElementById('btn-pause');
  const btnRestart = document.getElementById('btn-restart');

  /** Game configuration */
  const config = {
    gridCells: 20,
    ticksPerSecond: 10,
    initialLength: 4,
    storageKey: 'snake_best_score_v1'
  };

  /** Rendering state */
  let ctx;
  let devicePixelRatioScaled = 1;
  let cellSizePx = 0;
  let gridSizePx = 0;

  /** Game state */
  let snake = [];
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let food = { x: 10, y: 10 };
  let score = 0;
  let best = Number(localStorage.getItem(config.storageKey) || '0');
  let isRunning = false;
  let isPaused = false;
  let isGameOver = false;

  /** Loop timing */
  const tickMs = 1000 / config.ticksPerSecond;
  let lastTs = 0;
  let accMs = 0;

  init();

  function init() {
    ctx = canvas.getContext('2d');
    bestEl.textContent = String(best);
    setupCanvasSize();
    addEventListeners();
    resetGame();
    showOverlay('Press any key to start', 'Eat fruit, avoid walls and yourself.');
    draw();
    requestAnimationFrame(loop);
  }

  function setupCanvasSize() {
    // Square canvas that fits viewport without scroll
    const cssSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9, 640);
    const dpr = window.devicePixelRatio || 1;
    devicePixelRatioScaled = dpr;
    canvas.style.width = cssSize + 'px';
    canvas.style.height = cssSize + 'px';
    canvas.width = Math.floor(cssSize * dpr);
    canvas.height = Math.floor(cssSize * dpr);
    gridSizePx = Math.min(canvas.width, canvas.height);
    cellSizePx = Math.floor(gridSizePx / config.gridCells);
  }

  function addEventListeners() {
    window.addEventListener('resize', () => {
      setupCanvasSize();
      draw();
    });

    document.addEventListener('keydown', (e) => {
      if (!isRunning && !isGameOver) {
        startGame();
      }
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          queueDirection(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          queueDirection(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          queueDirection(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          queueDirection(1, 0);
          break;
        case 'p':
        case 'P':
          togglePause();
          break;
        case 'r':
        case 'R':
          restart();
          break;
      }
    });

    btnPause.addEventListener('click', togglePause);
    btnRestart.addEventListener('click', restart);

    overlayEl.addEventListener('click', () => {
      if (!isRunning) startGame();
    });

    // Touch directional pad
    document.querySelectorAll('.dpad').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dir = btn.getAttribute('data-dir');
        if (!isRunning && !isGameOver) startGame();
        if (dir === 'up') queueDirection(0, -1);
        if (dir === 'down') queueDirection(0, 1);
        if (dir === 'left') queueDirection(-1, 0);
        if (dir === 'right') queueDirection(1, 0);
      });
    });
  }

  function startGame() {
    if (isGameOver) return;
    hideOverlay();
    isRunning = true;
    isPaused = false;
    btnPause.textContent = 'Pause';
    btnPause.setAttribute('aria-pressed', 'false');
  }

  function togglePause() {
    if (!isRunning || isGameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
      showOverlay('Paused', 'Press P or Pause to resume');
      btnPause.textContent = 'Resume';
      btnPause.setAttribute('aria-pressed', 'true');
    } else {
      hideOverlay();
      btnPause.textContent = 'Pause';
      btnPause.setAttribute('aria-pressed', 'false');
    }
  }

  function restart() {
    resetGame();
    hideOverlay();
    isRunning = true;
    isPaused = false;
    btnPause.textContent = 'Pause';
    btnPause.setAttribute('aria-pressed', 'false');
  }

  function resetGame() {
    score = 0;
    scoreEl.textContent = '0';
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    const startX = Math.floor(config.gridCells / 3);
    const startY = Math.floor(config.gridCells / 2);
    snake = [];
    for (let i = 0; i < config.initialLength; i++) {
      snake.unshift({ x: startX - i, y: startY });
    }
    food = randomEmptyCell();
    isGameOver = false;
  }

  function loop(ts) {
    requestAnimationFrame(loop);
    if (!isRunning || isPaused || isGameOver) {
      lastTs = ts;
      return;
    }
    const dt = ts - lastTs;
    lastTs = ts;
    accMs += dt;
    while (accMs >= tickMs) {
      update();
      accMs -= tickMs;
    }
    draw();
  }

  function update() {
    // Apply queued direction if it is not opposite
    const sum = nextDirection.x + direction.x + nextDirection.y + direction.y;
    const isOpposite = (nextDirection.x === -direction.x && nextDirection.y === -direction.y);
    if (!isOpposite) {
      direction = nextDirection;
    }

    const head = snake[0];
    const newHead = { x: head.x + direction.x, y: head.y + direction.y };

    // Wall collision
    if (
      newHead.x < 0 ||
      newHead.y < 0 ||
      newHead.x >= config.gridCells ||
      newHead.y >= config.gridCells
    ) {
      return gameOver();
    }

    // Self collision
    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
        return gameOver();
      }
    }

    snake.unshift(newHead);

    // Food
    if (newHead.x === food.x && newHead.y === food.y) {
      score += 1;
      scoreEl.textContent = String(score);
      if (score > best) {
        best = score;
        localStorage.setItem(config.storageKey, String(best));
        bestEl.textContent = String(best);
      }
      food = randomEmptyCell();
    } else {
      snake.pop();
    }
  }

  function gameOver() {
    isGameOver = true;
    isRunning = false;
    showOverlay('Game Over', `Score ${score} — Press R to restart`);
  }

  function draw() {
    // Clear
    ctx.fillStyle = '#0e1120';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid subtle
    drawGrid();

    // Food
    drawCell(food.x, food.y, '#ff6b6b');

    // Snake body
    for (let i = snake.length - 1; i >= 1; i--) {
      const seg = snake[i];
      drawCell(seg.x, seg.y, '#3ad29f');
    }

    // Snake head
    const head = snake[0];
    drawCell(head.x, head.y, '#7cffb2');
  }

  function drawGrid() {
    const g = config.gridCells;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = Math.max(1, devicePixelRatioScaled);
    for (let i = 1; i < g; i++) {
      const p = i * cellSizePx;
      // vertical
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, g * cellSizePx);
      ctx.stroke();
      // horizontal
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(g * cellSizePx, p);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCell(x, y, color) {
    const pad = Math.max(1, Math.floor(cellSizePx * 0.12));
    const size = cellSizePx - pad * 2;
    const px = x * cellSizePx + pad;
    const py = y * cellSizePx + pad;

    // background shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(px, py + pad, size, size);

    // main cell
    ctx.fillStyle = color;
    ctx.fillRect(px, py, size, size);
  }

  function randomEmptyCell() {
    const occupied = new Set(snake.map((s) => s.x + ":" + s.y));
    const freeCells = [];
    for (let y = 0; y < config.gridCells; y++) {
      for (let x = 0; x < config.gridCells; x++) {
        const key = x + ":" + y;
        if (!occupied.has(key)) freeCells.push({ x, y });
      }
    }
    if (freeCells.length === 0) return { x: 0, y: 0 };
    const idx = Math.floor(Math.random() * freeCells.length);
    return freeCells[idx];
  }

  function queueDirection(x, y) {
    // Prevent reversing into the second segment when long > 1
    if (snake.length > 1) {
      const head = snake[0];
      const neck = snake[1];
      if (head.x + x === neck.x && head.y + y === neck.y) {
        return; // ignore reverse
      }
    }
    nextDirection = { x, y };
  }

  function showOverlay(title, subtitle) {
    overlayEl.classList.remove('hidden');
    overlayEl.innerHTML = `
      <div class="panel">
        <h2>${title}</h2>
        <p>${subtitle || ''}</p>
      </div>
    `;
  }

  function hideOverlay() {
    overlayEl.classList.add('hidden');
    overlayEl.innerHTML = '';
  }
})();

