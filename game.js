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
const TILE = 4;

const PALETTE = {
  skyTop: "#c7f2f2",
  skyMid: "#d8f6ff",
  skyLow: "#f4fbff",
  cloud: "#ffffff",
  cloudShade: "#eaf5f6",
  pipeMain: "#8dcfbf",
  pipeShade: "#70b8a8",
  pipeCap: "#b4e0d5",
  groundTop: "#d5c8a2",
  groundMid: "#c6b488",
  groundDark: "#a78f66",
  hudText: "#4f5d66",
  birdYellow: "#f5df92",
  birdCream: "#fff6d7",
  birdPeach: "#f7c8a8",
  birdOrange: "#f1a67c",
  beak: "#f6b184",
  eye: "#2f3a40"
};

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
let groundOffset = 0;

ctx.imageSmoothingEnabled = false;
canvas.style.imageRendering = "pixelated";

const DIGITS = {
  0: ["111", "101", "101", "101", "111"],
  1: ["010", "110", "010", "010", "111"],
  2: ["111", "001", "111", "100", "111"],
  3: ["111", "001", "111", "001", "111"],
  4: ["101", "101", "111", "001", "001"],
  5: ["111", "100", "111", "001", "111"],
  6: ["111", "100", "111", "101", "111"],
  7: ["111", "001", "010", "010", "010"],
  8: ["111", "101", "111", "101", "111"],
  9: ["111", "101", "111", "001", "111"]
};

const PIXEL_BIRD = {
  up: [
    "000111100000",
    "001222211000",
    "012112211100",
    "012111111100",
    "122111133300",
    "011111333300",
    "001111133000",
    "000111100000"
  ],
  mid: [
    "000111100000",
    "001222211000",
    "012112211100",
    "122111111100",
    "111111133300",
    "011111333300",
    "001111133000",
    "000111100000"
  ],
  down: [
    "000111100000",
    "001222211000",
    "012111211100",
    "122111111100",
    "111111133300",
    "001111333300",
    "000111133000",
    "000011100000"
  ]
};

const BIRD_COLORS = {
  1: PALETTE.birdYellow,
  2: PALETTE.birdCream,
  3: PALETTE.beak
};

function resetGame() {
  state = "ready";
  BIRD.y = HEIGHT / 2;
  BIRD.vy = 0;
  score = 0;
  spawnTimer = 0;
  pipes = [];
  groundOffset = 0;
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
  groundOffset = (groundOffset + dx) % 24;

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
  px(0, 0, WIDTH, HEIGHT, PALETTE.skyTop);
  px(0, HEIGHT * 0.2, WIDTH, HEIGHT * 0.35, PALETTE.skyMid);
  px(0, HEIGHT * 0.55, WIDTH, HEIGHT * 0.45, PALETTE.skyLow);

  drawCloud(56, 84);
  drawCloud(294, 136);
}

function drawCloud(x, y) {
  px(x, y, 52, 20, PALETTE.cloud);
  px(x + 10, y - 8, 30, 8, PALETTE.cloud);
  px(x + 6, y + 20, 40, 4, PALETTE.cloudShade);
}

function drawPipes() {
  for (const pipe of pipes) {
    const x = snap(pipe.x);
    const topH = snap(pipe.top);
    const bottomY = snap(pipe.top + PIPE_GAP);
    const bottomH = HEIGHT - GROUND_HEIGHT - bottomY;

    drawPipeSegment(x, 0, PIPE_WIDTH, topH, false);
    drawPipeSegment(x, bottomY, PIPE_WIDTH, bottomH, true);
  }
}

function drawPipeSegment(x, y, w, h, upsideDownCap) {
  px(x, y, w, h, PALETTE.pipeMain);
  px(x, y, 8, h, PALETTE.pipeShade);
  px(x + w - 10, y, 6, h, PALETTE.pipeShade);

  const capH = 16;
  const capY = upsideDownCap ? y : y + h - capH;
  px(x - 4, capY, w + 8, capH, PALETTE.pipeCap);
  px(x - 4, capY, 8, capH, PALETTE.pipeShade);
  px(x + w - 4, capY, 8, capH, PALETTE.pipeShade);
}

function drawGround() {
  const y = HEIGHT - GROUND_HEIGHT;
  px(0, y, WIDTH, GROUND_HEIGHT, PALETTE.groundTop);
  px(0, y + 10, WIDTH, GROUND_HEIGHT - 10, PALETTE.groundMid);
  px(0, y + GROUND_HEIGHT - 18, WIDTH, 18, PALETTE.groundDark);

  for (let x = -24; x < WIDTH + 24; x += 24) {
    const tx = x - groundOffset;
    px(tx, y + 14, 12, 5, PALETTE.groundDark);
    px(tx + 12, y + 20, 12, 5, PALETTE.groundDark);
  }
}

function drawBird() {
  const pose = BIRD.vy < -80 ? PIXEL_BIRD.up : BIRD.vy > 120 ? PIXEL_BIRD.down : PIXEL_BIRD.mid;
  const startX = snap(BIRD.x - 24);
  const startY = snap(BIRD.y - 16);

  for (let row = 0; row < pose.length; row += 1) {
    for (let col = 0; col < pose[row].length; col += 1) {
      const cell = pose[row][col];
      if (cell === "0") continue;
      px(startX + col * TILE, startY + row * TILE, TILE, TILE, BIRD_COLORS[cell]);
    }
  }

  px(startX + 30, startY + 12, TILE, TILE, PALETTE.eye);
  px(startX + 34, startY + 12, TILE, TILE, PALETTE.eye);
}

function drawHUD() {
  drawPixelNumber(String(score), WIDTH / 2 - scoreToWidth(score) / 2, 34, 6, PALETTE.hudText);
  drawLabel("BEST", 14, 16, 2, PALETTE.hudText);
  drawPixelNumber(String(best), 14, 34, 4, PALETTE.hudText);
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

function px(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(snap(x), snap(y), snap(w), snap(h));
}

function snap(value) {
  return Math.round(value);
}

function scoreToWidth(value) {
  const length = String(value).length;
  return length * ((3 * 6) + 6) - 6;
}

function drawPixelNumber(value, x, y, scale, color) {
  const chars = String(value).split("");
  let cursor = x;
  for (const char of chars) {
    cursor += drawDigit(char, cursor, y, scale, color) + scale;
  }
}

function drawDigit(digit, x, y, scale, color) {
  const pattern = DIGITS[digit] || DIGITS[0];
  for (let row = 0; row < pattern.length; row += 1) {
    for (let col = 0; col < pattern[row].length; col += 1) {
      if (pattern[row][col] === "1") {
        px(x + col * scale, y + row * scale, scale, scale, color);
      }
    }
  }
  return pattern[0].length * scale;
}

function drawLabel(text, x, y, scale, color) {
  const glyphs = {
    B: ["110", "101", "110", "101", "110"],
    E: ["111", "100", "110", "100", "111"],
    S: ["111", "100", "111", "001", "111"],
    T: ["111", "010", "010", "010", "010"]
  };
  let cursor = x;
  for (const char of text) {
    const pattern = glyphs[char];
    if (!pattern) continue;
    for (let row = 0; row < pattern.length; row += 1) {
      for (let col = 0; col < pattern[row].length; col += 1) {
        if (pattern[row][col] === "1") {
          px(cursor + col * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    cursor += (pattern[0].length + 1) * scale;
  }
}
