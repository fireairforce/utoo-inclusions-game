// THROWAWAY PROTOTYPE: an endless one-button Utoo knife game.

const app = document.querySelector("#app");
const pageMode = document.body.dataset.page === "game" ? "game" : "home";

const GAME = {
  width: 700,
  height: 700,
  centerX: 350,
  centerY: 326,
  diskRadius: 108,
  bladeHalfWidth: 5,
  handleHalfWidth: 7,
  handleRadius: 175,
  collisionPadding: 0,
  projectileStartY: 650,
  projectileTargetY: 491,
  projectileSpeed: 760,
};

const toolchainKnives = [
  { label: "包管理", detail: "ut install", color: "#24bee9" },
  { label: "开发", detail: "up dev", color: "#298ff0" },
  { label: "构建", detail: "Turbopack", color: "#1765db" },
  { label: "Rust", detail: "核心", color: "#ee6b3b" },
  { label: "原生", detail: "NAPI-RS", color: "#5867e8" },
  { label: "Wasm", detail: "WebAssembly", color: "#20b8bc" },
  { label: "预览", detail: "浏览器", color: "#2dbb82" },
  { label: "发布", detail: "网页就绪", color: "#7059e6" },
];

const motionPattern = [
  { mode: "steady", multiplier: 1, duration: 1, label: "匀速旋转", tone: "blue" },
  { mode: "turbo", multiplier: 1.55, duration: 0.78, label: "加速旋转！", tone: "orange" },
  { mode: "slow", multiplier: 0.45, duration: 0.74, label: "慢速旋转", tone: "blue" },
  { mode: "reverse", multiplier: -0.9, duration: 0.9, label: "反向旋转！", tone: "orange" },
  {
    mode: "reverse-turbo",
    multiplier: -1.45,
    duration: 0.76,
    label: "反向加速！",
    tone: "orange",
  },
  {
    mode: "reverse-slow",
    multiplier: -0.42,
    duration: 0.72,
    label: "反向慢速",
    tone: "blue",
  },
];

const levelThemes = [
  { name: "azure", hue: 202 },
  { name: "aqua", hue: 178 },
  { name: "mint", hue: 148 },
  { name: "violet", hue: 268 },
  { name: "coral", hue: 18 },
  { name: "magenta", hue: 326 },
  { name: "amber", hue: 42 },
  { name: "indigo", hue: 226 },
];

const BEST_SCORE_STORAGE_KEY = "utoo-build-blades-best-v1";
const RETURN_HOME_SECONDS = 10;
const INITIAL_LIVES = 2;

app.innerHTML = `
  <div class="game-shell is-${pageMode}" data-shell>
    <header class="topbar">
      <a class="brand" href="https://github.com/utooland/utoo" target="_blank" rel="noreferrer">
        <img src="./assets/utoo-logo.png" alt="Utoo" />
        <span class="brand-copy">
          <strong>Utoo</strong>
          <small>Rust 驱动的 Web 工具链</small>
        </span>
      </a>
      <div class="topbar-actions">
        <a class="home-link" href="./">← 返回首页</a>
      </div>
    </header>

    <main class="game-layout">
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">UTOO 构建飞刀 · 无限挑战</p>
        <h1 id="page-title">看准空位，<span>插满 Utoo 构建盘</span></h1>
        <p class="lead">中央 Utoo 圆盘持续旋转。按下空格键发射工具链小刀，避开已经插入的刀，一关一关挑战你的极限。</p>

        <div class="steps">
          <div class="step">
            <b>01</b>
            <div><strong>按空格键发射</strong><span>小刀会从底部直冲旋转的 Utoo 圆盘。</span></div>
          </div>
          <div class="step">
            <b>02</b>
            <div><strong>避开已有小刀</strong><span>撞刀会失去一次机会，连续命中积累连击。</span></div>
          </div>
          <div class="step">
            <b>∞</b>
            <div><strong>看看你能到第几关</strong><span>每关刀数、峰值转速与变速频率都会继续增加。</span></div>
          </div>
        </div>

        <div class="control-card">
          <button class="space-key" type="button" data-control aria-label="开始游戏或发射小刀">
            <span>空格键</span>
          </button>
          <div>
            <strong data-control-copy>开始挑战</strong>
            <span>游戏开始后，继续按空格键发射</span>
          </div>
        </div>

        <section class="best-score-card" aria-labelledby="best-score-title">
          <header>
            <div>
              <span>最佳成绩</span>
              <strong id="best-score-title">最高纪录</strong>
            </div>
            <small>刷新后保留</small>
          </header>
          <div class="best-score-value">
            <strong data-best-score>000</strong>
            <span>最高到达 <b>第 <em data-best-level>1</em> 关</b></span>
          </div>
        </section>
      </section>

      <section class="stage-card" aria-label="Utoo 构建飞刀游戏">
        <div class="stage-head">
          <div class="stage-title">
            <i></i>
            <div>
              <strong>Utoo 构建飞刀</strong>
              <span>一键操作 · 无限关卡</span>
            </div>
          </div>
          <div class="stats" aria-live="polite">
            <div><span>关卡</span><strong>第 <em data-level>1</em> 关</strong></div>
            <div><span>进度</span><strong><em data-progress>0</em> / <em data-goal>5</em></strong></div>
            <div><span>得分</span><strong data-points>000</strong></div>
            <div><span>最高分</span><strong data-header-best>000</strong></div>
            <div><span>机会</span><strong data-lives aria-label="剩余 2 次机会">♥ ♥</strong></div>
          </div>
        </div>

        <div class="canvas-wrap" data-stage>
          <canvas width="700" height="700" aria-label="旋转圆盘插小刀游戏"></canvas>
          <div class="core-badge" data-core aria-hidden="true">
            <img src="./assets/utoo-logo.png" alt="" />
          </div>
          <div class="feedback" data-feedback aria-live="polite"></div>
          <div class="combo-badge" data-combo aria-live="polite"></div>
          <div class="level-banner" data-level-banner aria-live="polite"></div>

          <div class="game-overlay is-visible" data-overlay>
            <div class="overlay-card">
              <span class="overlay-kicker">准备好了吗？</span>
              <h2 data-overlay-title>按空格键开始</h2>
              <p data-overlay-copy>把小刀插进旋转圆盘的空位，千万别撞到已有的小刀。</p>
              <button type="button" data-overlay-action>
                <kbd>空格键</kbd>
                <span data-overlay-action-copy>开始第 1 关</span>
              </button>
              <div class="reward" data-reward hidden></div>
              <div class="result-countdown" data-result-countdown hidden>
                <div class="countdown-ring" data-countdown-ring>
                  <strong data-return-countdown>10</strong>
                </div>
                <span><b data-return-countdown-copy>10</b> 秒后返回首页</span>
              </div>
            </div>
          </div>
        </div>

        <div class="stage-foot">
          <span class="next-label">下一把 · <strong data-current>包管理</strong></span>
          <span class="prototype-state" data-state>准备中 · 第 1 关 · 进度 0/5 · 得分 0</span>
        </div>
      </section>
    </main>

    <footer>
      <span>包管理</span><i></i><span>Turbopack</span><i></i><span>Rust</span><i></i><span>原生</span><i></i><span>Wasm</span>
    </footer>
  </div>
`;

const canvas = app.querySelector("canvas");
const context = canvas.getContext("2d");
const stage = app.querySelector("[data-stage]");
const coreBadge = app.querySelector("[data-core]");
const levelElement = app.querySelector("[data-level]");
const progressElement = app.querySelector("[data-progress]");
const goalElement = app.querySelector("[data-goal]");
const pointsElement = app.querySelector("[data-points]");
const headerBestScoreElement = app.querySelector("[data-header-best]");
const livesElement = app.querySelector("[data-lives]");
const currentElement = app.querySelector("[data-current]");
const stateElement = app.querySelector("[data-state]");
const feedbackElement = app.querySelector("[data-feedback]");
const comboElement = app.querySelector("[data-combo]");
const levelBanner = app.querySelector("[data-level-banner]");
const overlay = app.querySelector("[data-overlay]");
const overlayTitle = app.querySelector("[data-overlay-title]");
const overlayCopy = app.querySelector("[data-overlay-copy]");
const overlayActionCopy = app.querySelector("[data-overlay-action-copy]");
const rewardElement = app.querySelector("[data-reward]");
const resultCountdownElement = app.querySelector("[data-result-countdown]");
const countdownRing = app.querySelector("[data-countdown-ring]");
const returnCountdownElement = app.querySelector("[data-return-countdown]");
const returnCountdownCopy = app.querySelector("[data-return-countdown-copy]");
const controlCopy = app.querySelector("[data-control-copy]");
const bestScoreElement = app.querySelector("[data-best-score]");
const bestLevelElement = app.querySelector("[data-best-level]");

let phase = "ready";
let level = 1;
let levelProgress = 0;
let totalInserted = 0;
let lives = INITIAL_LIVES;
let points = 0;
let combo = 0;
let bestRecord = loadBestRecord();
let bestLevel = bestRecord.level;
let highScore = bestRecord.score;
let isNewHighScore = false;
let diskAngle = 0;
let rotationSpeed = 0.82;
let targetRotationSpeed = 0.82;
let motionTimer = 3.2;
let motionIndex = 0;
let motionMode = "steady";
let attachedKnives = [];
let projectile = null;
let fallingKnives = [];
let particles = [];
let canShoot = false;
let lastFrame = performance.now();
let returnCountdownTimer = null;

function loadBestRecord() {
  try {
    const value = JSON.parse(window.localStorage.getItem(BEST_SCORE_STORAGE_KEY) || "null");
    if (!Number.isFinite(value?.score) || !Number.isFinite(value?.level)) {
      return { score: 0, level: 1 };
    }
    return { score: Math.max(0, value.score), level: Math.max(1, value.level) };
  } catch {
    return { score: 0, level: 1 };
  }
}

function persistBestRecord() {
  try {
    window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, JSON.stringify(bestRecord));
  } catch {
    // The game remains playable when storage is unavailable.
  }
}

function renderBestRecord() {
  const formattedScore = String(bestRecord.score).padStart(3, "0");
  bestScoreElement.textContent = formattedScore;
  headerBestScoreElement.textContent = formattedScore;
  bestLevelElement.textContent = String(bestRecord.level);
}

function recordBestScore() {
  const betterScore = points > bestRecord.score;
  const betterLevelAtSameScore = points === bestRecord.score && level > bestRecord.level;
  isNewHighScore = betterScore || betterLevelAtSameScore;
  if (!isNewHighScore) return;
  bestRecord = { score: points, level };
  highScore = bestRecord.score;
  bestLevel = Math.max(bestLevel, bestRecord.level);
  persistBestRecord();
  renderBestRecord();
}

function goalForLevel(value) {
  return Math.min(4 + value, 10);
}

function speedForLevel(value) {
  return Math.min(0.82 + (value - 1) * 0.16, 1.8);
}

function motionDelayForLevel(value) {
  return Math.max(1.45, 3.2 - (value - 1) * 0.16);
}

function presetKnivesForLevel(value) {
  return Math.min(2 + Math.floor((value - 1) / 3), 4);
}

function themeForLevel(value) {
  return levelThemes[(value - 1) % levelThemes.length];
}

function applyLevelTheme(value, animate = true) {
  const theme = themeForLevel(value);
  stage.style.setProperty("--level-hue", String(theme.hue));
  stage.dataset.levelTheme = theme.name;
  if (!animate) return;
  stage.classList.remove("is-level-shift");
  void stage.offsetWidth;
  stage.classList.add("is-level-shift");
  window.setTimeout(() => stage.classList.remove("is-level-shift"), 720);
}

function addPresetKnives() {
  const presetCount = presetKnivesForLevel(level);
  for (let index = 0; index < presetCount; index += 1) {
    attachedKnives.push({
      localAngle: ((index + 1) * Math.PI * 2) / (presetCount + 1) + 0.35,
      color: "#70849a",
      label: "障碍",
      detail: "",
      blocker: true,
    });
  }
}

function nextKnife() {
  return toolchainKnives[totalInserted % toolchainKnives.length];
}

function resetRun() {
  cancelReturnCountdown();
  phase = "ready";
  level = 1;
  levelProgress = 0;
  totalInserted = 0;
  lives = INITIAL_LIVES;
  points = 0;
  combo = 0;
  isNewHighScore = false;
  diskAngle = 0;
  rotationSpeed = speedForLevel(level);
  targetRotationSpeed = rotationSpeed;
  motionTimer = motionDelayForLevel(level);
  motionIndex = 0;
  motionMode = "steady";
  attachedKnives = [];
  addPresetKnives();
  projectile = null;
  fallingKnives = [];
  particles = [];
  canShoot = false;
  applyLevelTheme(level, false);
  setOverlay("ready");
  updateInterface();
}

function startRun() {
  if (phase === "lost") resetRun();
  phase = "playing";
  overlay.classList.remove("is-visible");
  setupLevel(false);
  showFeedback("第 1 关 · 开始", "blue");
}

function setupLevel(showBanner) {
  phase = "playing";
  levelProgress = 0;
  diskAngle = 0;
  rotationSpeed = (level % 2 === 0 ? -1 : 1) * speedForLevel(level);
  targetRotationSpeed = rotationSpeed;
  motionTimer = motionDelayForLevel(level);
  motionIndex = 0;
  motionMode = "steady";
  attachedKnives = [];
  addPresetKnives();
  projectile = null;
  canShoot = false;
  applyLevelTheme(level, showBanner);

  if (showBanner) {
    levelBanner.innerHTML = `<span>第 ${level} 关</span><strong>插入 ${goalForLevel(level)} 把小刀</strong>`;
    levelBanner.classList.add("is-visible");
    window.setTimeout(() => {
      levelBanner.classList.remove("is-visible");
      canShoot = true;
    }, 950);
  } else {
    canShoot = true;
  }
  updateInterface();
}

function shootKnife() {
  if (phase !== "playing" || !canShoot || projectile) return;
  const knife = nextKnife();
  projectile = { ...knife, y: GAME.projectileStartY };
  canShoot = false;
  showFeedback(`${knife.label} · 发射！`, knife.label === "Rust" ? "orange" : "blue");
  updateInterface();
}

function normalizeAngle(value) {
  return ((value % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

function angularDistance(first, second) {
  return Math.abs(Math.atan2(Math.sin(first - second), Math.cos(first - second)));
}

function knifeCollisionAngle() {
  const bladeContact = 2 * Math.asin(GAME.bladeHalfWidth / GAME.diskRadius);
  const handleContact = 2 * Math.asin(GAME.handleHalfWidth / GAME.handleRadius);
  return Math.max(bladeContact, handleContact) + GAME.collisionPadding;
}

function advanceMotion() {
  motionIndex = (motionIndex + 1) % motionPattern.length;
  const motion = motionPattern[motionIndex];
  const levelDirection = level % 2 === 0 ? -1 : 1;
  motionMode = motion.mode;
  targetRotationSpeed = levelDirection * speedForLevel(level) * motion.multiplier;
  motionTimer = motionDelayForLevel(level) * motion.duration;
  showFeedback(motion.label, motion.tone);
}

function nearestKnifeGap(angle) {
  return attachedKnives.length
    ? Math.min(
        ...attachedKnives.map((knife) =>
          angularDistance(normalizeAngle(knife.localAngle + angle), Math.PI / 2),
        ),
      )
    : Math.PI;
}

function predictedImpactGap() {
  const travelDistance = (projectile?.y ?? GAME.projectileStartY) - GAME.projectileTargetY;
  const travelTime = Math.max(0, travelDistance) / GAME.projectileSpeed;
  const projectedSpeed = (rotationSpeed + targetRotationSpeed) / 2;
  return nearestKnifeGap(diskAngle + projectedSpeed * travelTime);
}

function resolveProjectile() {
  if (!projectile) return;
  const collision = attachedKnives.some((knife) => {
    const absoluteAngle = normalizeAngle(knife.localAngle + diskAngle);
    return angularDistance(absoluteAngle, Math.PI / 2) < knifeCollisionAngle();
  });

  if (collision) {
    const missed = projectile;
    projectile = null;
    lives -= 1;
    combo = 0;
    fallingKnives.push({
      ...missed,
      x: GAME.centerX,
      y: GAME.projectileTargetY,
      vx: Math.random() > 0.5 ? 150 : -150,
      vy: -120,
      rotation: 0,
      rotationSpeed: Math.random() > 0.5 ? 4 : -4,
      opacity: 1,
    });
    burst(GAME.centerX, GAME.centerY + GAME.diskRadius, 12, "#ef6170");
    stage.classList.remove("is-miss");
    void stage.offsetWidth;
    stage.classList.add("is-miss");
    window.setTimeout(() => stage.classList.remove("is-miss"), 460);
    showFeedback(lives > 0 ? "撞刀了！再找一个空位" : "构建失败", "red");

    if (lives <= 0) {
      finishRun();
      return;
    }
    window.setTimeout(() => {
      canShoot = true;
      updateInterface();
    }, 520);
    updateInterface();
    return;
  }

  const inserted = projectile;
  projectile = null;
  attachedKnives.push({
    ...inserted,
    localAngle: Math.PI / 2 - diskAngle,
    blocker: false,
  });
  levelProgress += 1;
  totalInserted += 1;
  combo += 1;
  const earned = 100 * level * combo;
  points += earned;
  highScore = Math.max(highScore, points);
  burst(GAME.centerX, GAME.centerY + GAME.diskRadius, 18, inserted.color);
  stage.classList.remove("is-hit");
  void stage.offsetWidth;
  stage.classList.add("is-hit");
  window.setTimeout(() => stage.classList.remove("is-hit"), 430);
  showFeedback(`插入成功 · 连击 x${combo} · +${earned}`, inserted.label === "Rust" ? "orange" : "blue");

  if (levelProgress >= goalForLevel(level)) {
    clearLevel();
    return;
  }
  window.setTimeout(() => {
    canShoot = true;
    updateInterface();
  }, 100);
  updateInterface();
}

function clearLevel() {
  phase = "level-clear";
  canShoot = false;
  bestLevel = Math.max(bestLevel, level + 1);
  const clearBonus = 500 * level * lives;
  points += clearBonus;
  highScore = Math.max(highScore, points);
  showFeedback(`第 ${level} 关完成 · +${clearBonus}`, "orange");
  level += 1;
  window.setTimeout(() => setupLevel(true), 620);
  updateInterface();
}

function finishRun() {
  phase = "lost";
  canShoot = false;
  projectile = null;
  bestLevel = Math.max(bestLevel, level);
  highScore = Math.max(highScore, points);
  recordBestScore();
  updateInterface();
  window.setTimeout(() => setOverlay("lost"), 650);
}

function returnHome() {
  cancelReturnCountdown();
  window.location.assign("./");
}

function cancelReturnCountdown() {
  if (returnCountdownTimer !== null) {
    window.clearInterval(returnCountdownTimer);
    returnCountdownTimer = null;
  }
  resultCountdownElement.hidden = true;
}

function startReturnCountdown() {
  cancelReturnCountdown();
  resultCountdownElement.hidden = false;
  const duration = RETURN_HOME_SECONDS * 1000;
  const deadline = performance.now() + duration;

  const updateCountdown = () => {
    const remaining = Math.max(0, deadline - performance.now());
    const seconds = Math.max(0, Math.ceil(remaining / 1000));
    const progress = remaining / duration;
    returnCountdownElement.textContent = String(seconds);
    returnCountdownCopy.textContent = String(seconds);
    countdownRing.style.setProperty("--countdown-progress", `${progress * 360}deg`);

    if (remaining <= 0) {
      returnHome();
    }
  };

  updateCountdown();
  returnCountdownTimer = window.setInterval(updateCountdown, 80);
}

function enterGame() {
  window.location.assign("./game.html?start=1");
}

function handleAction() {
  if (pageMode === "home") {
    enterGame();
    return;
  }
  if (phase === "lost") {
    returnHome();
    return;
  }
  if (phase === "ready") {
    startRun();
    return;
  }
  shootKnife();
}

function setOverlay(mode) {
  overlay.classList.add("is-visible");
  rewardElement.hidden = true;
  resultCountdownElement.hidden = true;
  const kicker = overlay.querySelector(".overlay-kicker");
  if (mode === "ready") {
    kicker.textContent = "准备好了吗？";
    overlayTitle.textContent = "按空格键开始";
    overlayCopy.textContent = "把小刀插进旋转圆盘的空位，千万别撞到已有的小刀。";
    overlayActionCopy.textContent = "开始第 1 关";
    return;
  }

  kicker.textContent = "挑战结束";
  const rank = level >= 8 ? "S" : level >= 5 ? "A" : level >= 3 ? "B" : "C";
  overlayTitle.textContent = `${rank} 级 · 到达第 ${level} 关`;
  overlayCopy.textContent = `${isNewHighScore ? "新纪录！" : "本轮结束。"} 总分 ${points}，成功插入 ${totalInserted} 把工具链小刀。最高纪录：第 ${bestRecord.level} 关 / ${bestRecord.score} 分。`;
  overlayActionCopy.textContent = "立即返回首页";
  rewardElement.hidden = false;
  rewardElement.innerHTML = `<span>${isNewHighScore ? "刷新最高分" : `${rank} 级 · 构建挑战`}</span><strong>${points}</strong>`;
  startReturnCountdown();
}

function showFeedback(text, tone) {
  feedbackElement.textContent = text;
  feedbackElement.dataset.tone = tone;
  feedbackElement.classList.remove("is-visible");
  void feedbackElement.offsetWidth;
  feedbackElement.classList.add("is-visible");
}

function burst(x, y, amount, fixedColor) {
  for (let index = 0; index < amount; index += 1) {
    const angle = (Math.PI * 2 * index) / amount + Math.random() * 0.12;
    const speed = 55 + Math.random() * 105;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color: fixedColor || "#29c8e6",
    });
  }
}

function updateInterface() {
  const goal = goalForLevel(level);
  const nearestGap = nearestKnifeGap(diskAngle);
  const impactGap = predictedImpactGap();
  levelElement.textContent = String(level);
  progressElement.textContent = String(levelProgress);
  goalElement.textContent = String(goal);
  pointsElement.textContent = String(points).padStart(3, "0");
  livesElement.textContent = ["♡ ♡", "♥ ♡", "♥ ♥"][lives] || "♡ ♡";
  livesElement.setAttribute("aria-label", `剩余 ${lives} 次机会`);
  currentElement.textContent = nextKnife().label;
  controlCopy.textContent = phase === "ready" ? "开始挑战" : phase === "lost" ? "再玩一次" : "发射小刀";
  comboElement.classList.toggle("is-visible", combo >= 2);
  comboElement.innerHTML = `连击 <strong>x${combo}</strong>`;

  const phaseLabel = {
    ready: "准备中",
    playing: "进行中",
    "level-clear": "过关",
    lost: "已结束",
  }[phase];
  const motionLabel = motionPattern.find((motion) => motion.mode === motionMode)?.label || "匀速旋转";
  stateElement.textContent = `${phaseLabel} · 第 ${level} 关 · 进度 ${levelProgress}/${goal} · 得分 ${points} · ${motionLabel.replace("！", "")}`;
  stateElement.dataset.phase = phase;
  stateElement.dataset.level = String(level);
  stateElement.dataset.progress = String(levelProgress);
  stateElement.dataset.goal = String(goal);
  stateElement.dataset.points = String(points);
  stateElement.dataset.combo = String(combo);
  stateElement.dataset.lives = String(lives);
  stateElement.dataset.diskAngle = diskAngle.toFixed(4);
  stateElement.dataset.rotationSpeed = rotationSpeed.toFixed(4);
  stateElement.dataset.targetRotationSpeed = targetRotationSpeed.toFixed(4);
  stateElement.dataset.motionMode = motionMode;
  stateElement.dataset.motionTimer = motionTimer.toFixed(4);
  stateElement.dataset.presetCount = String(attachedKnives.filter((knife) => knife.blocker).length);
  stateElement.dataset.nearestGap = nearestGap.toFixed(4);
  stateElement.dataset.impactGap = impactGap.toFixed(4);
  stateElement.dataset.collisionAngle = knifeCollisionAngle().toFixed(4);
  stateElement.dataset.projectile = projectile ? "flying" : canShoot ? "ready" : "locked";
  stateElement.dataset.levelTheme = themeForLevel(level).name;
}

function roundedRect(x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, Math.min(radius, width / 2, height / 2));
}

function drawBackground() {
  const levelHue = themeForLevel(level).hue;
  const background = context.createLinearGradient(0, 0, 0, GAME.height);
  background.addColorStop(0, `hsl(${levelHue} 78% 95%)`);
  background.addColorStop(0.58, "#f7fbff");
  background.addColorStop(1, "#f8f0e4");
  context.fillStyle = background;
  context.fillRect(0, 0, GAME.width, GAME.height);
  context.save();
  context.fillStyle = `hsl(${levelHue} 72% 46% / 0.13)`;
  for (let y = 24; y < GAME.height; y += 28) {
    for (let x = 24; x < GAME.width; x += 28) {
      context.beginPath();
      context.arc(x, y, 1.15, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();
  const glow = context.createRadialGradient(GAME.centerX, GAME.centerY, 30, GAME.centerX, GAME.centerY, 285);
  glow.addColorStop(0, `hsl(${levelHue} 82% 56% / 0.24)`);
  glow.addColorStop(1, `hsl(${levelHue} 82% 56% / 0)`);
  context.fillStyle = glow;
  context.fillRect(42, 18, 616, 620);
}

function drawDiskGuides() {
  const levelHue = themeForLevel(level).hue;
  context.save();
  context.strokeStyle = `hsl(${levelHue} 68% 48% / 0.17)`;
  context.lineWidth = 2;
  context.setLineDash([6, 10]);
  context.beginPath();
  context.arc(GAME.centerX, GAME.centerY, GAME.diskRadius + 84, 0, Math.PI * 2);
  context.stroke();
  context.setLineDash([]);
  for (let index = 0; index < 16; index += 1) {
    const angle = (Math.PI * 2 * index) / 16 + diskAngle;
    const inner = GAME.diskRadius + 22;
    const outer = GAME.diskRadius + 31;
    context.strokeStyle =
      index % 4 === 0
        ? `hsl(${levelHue} 78% 48% / 0.38)`
        : `hsl(${levelHue} 72% 48% / 0.16)`;
    context.lineWidth = index % 4 === 0 ? 3 : 1.5;
    context.beginPath();
    context.moveTo(GAME.centerX + Math.cos(angle) * inner, GAME.centerY + Math.sin(angle) * inner);
    context.lineTo(GAME.centerX + Math.cos(angle) * outer, GAME.centerY + Math.sin(angle) * outer);
    context.stroke();
  }
  context.restore();
}

function drawRadialKnife(knife) {
  const angle = normalizeAngle(knife.localAngle + diskAngle);
  const radius = GAME.diskRadius;
  context.save();
  context.translate(GAME.centerX, GAME.centerY);
  context.rotate(angle);
  context.shadowColor = "rgba(23, 69, 111, 0.2)";
  context.shadowBlur = 12;
  context.shadowOffsetX = 5;
  const bladeGradient = context.createLinearGradient(radius - 22, 0, radius + 35, 0);
  bladeGradient.addColorStop(0, "#f7fbff");
  bladeGradient.addColorStop(1, "#a8bed0");
  context.fillStyle = bladeGradient;
  context.beginPath();
  context.moveTo(radius - 25, 0);
  context.lineTo(radius + 35, -GAME.bladeHalfWidth);
  context.lineTo(radius + 35, GAME.bladeHalfWidth);
  context.closePath();
  context.fill();
  context.shadowColor = "transparent";
  context.fillStyle = knife.blocker ? "#70849a" : knife.color;
  roundedRect(
    radius + 26,
    -GAME.handleHalfWidth,
    knife.blocker ? 60 : 82,
    GAME.handleHalfWidth * 2,
    8,
  );
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.36)";
  roundedRect(radius + 34, -6, knife.blocker ? 44 : 66, 3, 2);
  context.fill();
  if (!knife.blocker) {
    context.fillStyle = "#fff";
    context.font = "850 10px Inter, system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(knife.label, radius + 67, 1);
  }
  context.restore();
}

function drawVerticalKnife(knife, x, y, rotation = 0, opacity = 1) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.globalAlpha = opacity;
  context.shadowColor = "rgba(23, 69, 111, 0.2)";
  context.shadowBlur = 12;
  context.shadowOffsetY = 6;
  const bladeGradient = context.createLinearGradient(0, -82, 0, -25);
  bladeGradient.addColorStop(0, "#f9fcff");
  bladeGradient.addColorStop(1, "#a8bed0");
  context.fillStyle = bladeGradient;
  context.beginPath();
  context.moveTo(0, -82);
  context.lineTo(-GAME.bladeHalfWidth, -25);
  context.lineTo(GAME.bladeHalfWidth, -25);
  context.closePath();
  context.fill();
  context.shadowColor = "transparent";
  context.fillStyle = knife.color;
  roundedRect(-GAME.handleHalfWidth, -30, GAME.handleHalfWidth * 2, 72, 8);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.34)";
  roundedRect(-6, -22, 3, 56, 2);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.94)";
  roundedRect(24, -5, 86, 30, 12);
  context.fill();
  context.strokeStyle = "rgba(26, 101, 177, 0.18)";
  context.lineWidth = 1;
  roundedRect(24, -5, 86, 30, 12);
  context.stroke();
  context.fillStyle = knife.color;
  context.font = "850 10px Inter, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(knife.label, 67, 10);
  context.restore();
}

function drawKnives() {
  for (const knife of attachedKnives) drawRadialKnife(knife);
  if (projectile) {
    drawVerticalKnife(projectile, GAME.centerX, projectile.y);
  } else if (phase === "playing" && canShoot) {
    drawVerticalKnife(nextKnife(), GAME.centerX, GAME.projectileStartY);
    context.fillStyle = "#1765db";
    context.font = "900 10px Inter, system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("按空格键发射", GAME.centerX, GAME.height - 18);
  }
  for (const knife of fallingKnives) {
    drawVerticalKnife(knife, knife.x, knife.y, knife.rotation, knife.opacity);
  }
}

function drawEffects() {
  for (const particle of particles) {
    context.save();
    context.globalAlpha = particle.life;
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(particle.x, particle.y, 3.4, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

function update(delta) {
  if (phase === "playing") {
    const transitionStrength = Math.min(1, delta * 6.5);
    rotationSpeed += (targetRotationSpeed - rotationSpeed) * transitionStrength;
    diskAngle = normalizeAngle(diskAngle + rotationSpeed * delta);
    motionTimer -= delta;
    if (motionTimer <= 0) advanceMotion();
  }
  if (projectile) {
    projectile.y -= GAME.projectileSpeed * delta;
    if (projectile.y <= GAME.projectileTargetY) resolveProjectile();
  }
  for (const knife of fallingKnives) {
    knife.x += knife.vx * delta;
    knife.y += knife.vy * delta;
    knife.vy += 580 * delta;
    knife.rotation += knife.rotationSpeed * delta;
    knife.opacity -= 0.75 * delta;
  }
  fallingKnives = fallingKnives.filter((knife) => knife.opacity > 0 && knife.y < GAME.height + 120);
  for (const particle of particles) {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.vx *= 0.987;
    particle.vy = particle.vy * 0.987 + 38 * delta;
    particle.life -= 1.5 * delta;
  }
  particles = particles.filter((particle) => particle.life > 0);
  coreBadge.style.setProperty("--disk-angle", `${diskAngle}rad`);
  updateInterface();
}

function draw() {
  drawBackground();
  drawDiskGuides();
  drawKnives();
  drawEffects();
}

function frame(now) {
  const delta = Math.min(0.034, (now - lastFrame) / 1000);
  lastFrame = now;
  update(delta);
  draw();
  requestAnimationFrame(frame);
}

function resizeCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = GAME.width * dpr;
  canvas.height = GAME.height * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.repeat) return;
  if (
    event.target instanceof Element &&
    event.target.closest("input, textarea, select, [contenteditable='true']")
  ) {
    return;
  }
  event.preventDefault();
  if (event.target instanceof HTMLElement) event.target.blur();
  handleAction();
});

app.querySelectorAll("[data-control], [data-overlay-action]").forEach((button) => {
  button.addEventListener("click", handleAction);
});

stage.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button, input, form, label")) return;
  handleAction();
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
renderBestRecord();
resetRun();
if (pageMode === "game" && new URLSearchParams(window.location.search).get("start") === "1") {
  window.history.replaceState(null, "", "./game.html");
  startRun();
}
requestAnimationFrame(frame);
