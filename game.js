const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_HEIGHT = 100;
const PIPE_WIDTH = 64;
const PIPE_GAP = 165;
const PIPE_SPAWN_MS = 1450;
const PIPE_SPEED = 150;

const BIRD = {
  x: 110,
  y: HEIGHT / 2,
  r: 15,
  vy: 0,
  gravity: 1080,
  flap: -320
};

let state = "ready";
let lastTime = 0;
let spawnTimer = 0;
let score = 0;
let best = Number(localStorage.getItem("flappy-best-score") || 0);
let pipes = [];

function resetGame() {
  state = "ready";
  BIRD.y = HEIGHT / 2;
  BIRD.vy = 0;
  score = 0;
  spawnTimer = 0;
  pipes = [];
  setOverlay("Ready?", "Tap, click, or press Space to start.");
}

function startGame() {
  if (state === "ready") {
    state = "playing";
    hideOverlay();
    jump();
  } else if (state === "gameover") {
    resetGame();
  }
}

function gameOver() {
  state = "gameover";
  best = Math.max(best, score);
  localStorage.setItem("flappy-best-score", String(best));
  setOverlay("Game Over", `Score: ${score} | Best: ${best}\nTap or press Space to restart.`);
}

function jump() {
  if (state !== "playing") return;
  BIRD.vy = BIRD.flap;
}

function spawnPipe() {
  const margin = 55;
  const topHeight = margin + Math.random() * (HEIGHT - GROUND_HEIGHT - PIPE_GAP - margin * 2);
  pipes.push({
    x: WIDTH + 20,
    top: topHeight,
    passed: false
  });
}

function collides(pipe) {
  const birdLeft = BIRD.x - BIRD.r;
  const birdRight = BIRD.x + BIRD.r;
  const birdTop = BIRD.y - BIRD.r;
  const birdBottom = BIRD.y + BIRD.r;

  const withinPipeX = birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH;
  if (!withinPipeX) return false;

  const hitsTop = birdTop < pipe.top;
  const hitsBottom = birdBottom > pipe.top + PIPE_GAP;
  return hitsTop || hitsBottom;
}

function update(dt) {
  if (state !== "playing") return;

  BIRD.vy += BIRD.gravity * dt;
  BIRD.y += BIRD.vy * dt;

  if (BIRD.y - BIRD.r <= 0) {
    BIRD.y = BIRD.r;
    BIRD.vy = 0;
  }

  if (BIRD.y + BIRD.r >= HEIGHT - GROUND_HEIGHT) {
    BIRD.y = HEIGHT - GROUND_HEIGHT - BIRD.r;
    gameOver();
  }

  spawnTimer += dt * 1000;
  if (spawnTimer >= PIPE_SPAWN_MS) {
    spawnTimer = 0;
    spawnPipe();
  }

  const dx = PIPE_SPEED * dt;
  for (const pipe of pipes) {
    pipe.x -= dx;

    if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD.x) {
      pipe.passed = true;
      score += 1;
    }

    if (collides(pipe)) {
      gameOver();
    }
  }

  pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -5);
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#8fd8ff");
  sky.addColorStop(1, "#dff6ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.beginPath();
  ctx.arc(80, 90, 26, 0, Math.PI * 2);
  ctx.arc(104, 84, 22, 0, Math.PI * 2);
  ctx.arc(128, 92, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(295, 145, 22, 0, Math.PI * 2);
  ctx.arc(315, 137, 18, 0, Math.PI * 2);
  ctx.arc(336, 145, 16, 0, Math.PI * 2);
  ctx.fill();
}

function drawPipes() {
  for (const pipe of pipes) {
    const x = pipe.x;
    const topH = pipe.top;
    const bottomY = pipe.top + PIPE_GAP;
    const bottomH = HEIGHT - GROUND_HEIGHT - bottomY;

    ctx.fillStyle = "#4aa13f";
    ctx.fillRect(x, 0, PIPE_WIDTH, topH);
    ctx.fillRect(x, bottomY, PIPE_WIDTH, bottomH);

    ctx.fillStyle = "#62bf54";
    ctx.fillRect(x - 4, topH - 18, PIPE_WIDTH + 8, 18);
    ctx.fillRect(x - 4, bottomY, PIPE_WIDTH + 8, 18);
  }
}

function drawGround() {
  ctx.fillStyle = "#d7b56d";
  ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT);

  ctx.fillStyle = "#be9655";
  for (let x = 0; x < WIDTH; x += 22) {
    ctx.fillRect(x, HEIGHT - GROUND_HEIGHT + 8, 12, 4);
  }
}

function drawBird() {
  const angle = Math.max(-0.5, Math.min(1.1, BIRD.vy / 350));
  ctx.save();
  ctx.translate(BIRD.x, BIRD.y);
  ctx.rotate(angle);

  ctx.fillStyle = "#ffdf32";
  ctx.beginPath();
  ctx.arc(0, 0, BIRD.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f4c000";
  ctx.beginPath();
  ctx.ellipse(-4, 2, 8, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff8f1f";
  ctx.beginPath();
  ctx.moveTo(BIRD.r - 1, 1);
  ctx.lineTo(BIRD.r + 12, 5);
  ctx.lineTo(BIRD.r - 1, 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#0d2230";
  ctx.beginPath();
  ctx.arc(5, -5, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = "#0d2230";
  ctx.font = "bold 32px Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(score), WIDTH / 2, 56);

  ctx.font = "bold 16px Trebuchet MS, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Best: ${best}`, 14, 30);
}

function render() {
  drawBackground();
  drawPipes();
  drawGround();
  drawBird();
  drawHUD();
}

function frame(ts) {
  if (!lastTime) lastTime = ts;
  const dt = Math.min((ts - lastTime) / 1000, 0.032);
  lastTime = ts;

  update(dt);
  render();
  requestAnimationFrame(frame);
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function setOverlay(title, text) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.remove("hidden");
}

function handleInput(event) {
  if (event.type === "keydown" && !["Space", "ArrowUp"].includes(event.code)) return;
  event.preventDefault();

  if (state === "ready") {
    startGame();
    return;
  }

  if (state === "playing") {
    jump();
    return;
  }

  if (state === "gameover") {
    resetGame();
  }
}

window.addEventListener("keydown", handleInput);
canvas.addEventListener("pointerdown", handleInput);
overlay.addEventListener("pointerdown", handleInput);

resetGame();
requestAnimationFrame(frame);
