import { ARCADE_CONFIGS, FIXED_DT_SECONDS, createState, step } from './arcade.mjs';
import { FlightScene, loadAircraftAsset } from './scene.js';
import './style.css';

const variants = Object.keys(ARCADE_CONFIGS);
const elements = {
  canvas: document.querySelector('#flight-view'),
  stage: document.querySelector('#flight-stage'),
  modelRevisions: [...document.querySelectorAll('[data-model-revision]')],
  partCounts: [...document.querySelectorAll('[data-part-count]')],
  loadCover: document.querySelector('#load-cover'),
  loadTitle: document.querySelector('#load-title'),
  loadDetail: document.querySelector('#load-detail'),
  status: document.querySelector('#status-message'),
  phaseLabel: document.querySelector('#phase-label'),
  stageHud: document.querySelector('#stage-hud'),
  stageMessage: document.querySelector('#stage-message'),
  score: document.querySelector('#score-value'),
  time: document.querySelector('#time-value'),
  gate: document.querySelector('#gate-value'),
  controlStatus: document.querySelector('#control-status'),
  stateCopy: document.querySelector('#flight-state-copy'),
  result: document.querySelector('#result-summary'),
  start: document.querySelector('#start-button'),
  pause: document.querySelector('#pause-button'),
  resume: document.querySelector('#resume-button'),
  restart: document.querySelector('#restart-button'),
};

const assets = new Map();
const assetErrors = new Map();
const heldKeys = new Set();
const heldControls = new Set();
let selectedVariant = 'standard';
let gameState = createState({ variant: selectedVariant, seed: 2026 });
let scene = null;
let loading = true;
let displayError = null;
let lastFrameTime = null;
let accumulator = 0;
let lastHudUpdate = 0;
let frameInput = { steerX: 0, steerY: 0, boost: false };

function familyFrameHalfExtents() {
  const bounds = { x: 0, y: 0, z: 0 };
  for (const asset of assets.values()) {
    for (const axis of Object.keys(bounds)) {
      bounds[axis] = Math.max(bounds[axis], asset.userData.frameHalfExtents[axis]);
    }
  }
  return bounds;
}

function setStatus(message, kind = 'normal') {
  elements.status.textContent = message;
  elements.status.dataset.kind = kind;
}

function selectedAssetError() {
  if (displayError) return displayError;
  return assetErrors.get(selectedVariant) ?? null;
}

function setLoadCover(title, detail) {
  elements.loadTitle.textContent = title;
  elements.loadDetail.textContent = detail;
  elements.loadCover.hidden = false;
}

function updateModelMetadata() {
  const metadata = assets.get(selectedVariant)?.userData;
  const revision = metadata?.revision?.toUpperCase() ?? '—';
  const partCount = Number.isInteger(metadata?.partCount) ? `${metadata.partCount} PARTS` : '—';
  elements.modelRevisions.forEach(element => { element.textContent = revision; });
  elements.partCounts.forEach(element => { element.textContent = partCount; });
}

function canFly() {
  return !loading && !displayError && assets.has(selectedVariant);
}

function clearHeldInputs() {
  heldKeys.clear();
  heldControls.clear();
  document.querySelectorAll('[data-control][aria-pressed="true"]').forEach(button => {
    button.setAttribute('aria-pressed', 'false');
  });
}

function collectInput() {
  const left = heldKeys.has('ArrowLeft') || heldKeys.has('KeyA') || heldControls.has('left');
  const right = heldKeys.has('ArrowRight') || heldKeys.has('KeyD') || heldControls.has('right');
  const up = heldKeys.has('ArrowUp') || heldKeys.has('KeyW') || heldControls.has('up');
  const down = heldKeys.has('ArrowDown') || heldKeys.has('KeyS') || heldControls.has('down');
  return {
    steerX: Number(right) - Number(left),
    steerY: Number(up) - Number(down),
    boost: heldKeys.has('ShiftLeft') || heldKeys.has('ShiftRight') || heldKeys.has('Space') || heldControls.has('boost'),
  };
}

function updatePhaseUI() {
  const phase = gameState.phase;
  elements.stage.dataset.view = phase === 'ready' ? 'hangar' : 'flight';
  const config = ARCADE_CONFIGS[selectedVariant];
  const assetError = selectedAssetError();
  updateModelMetadata();
  const showFlightHud = phase !== 'ready' && assets.has(selectedVariant);
  elements.stageHud.hidden = !showFlightHud;
  elements.pause.hidden = phase !== 'running';
  elements.resume.hidden = phase !== 'paused';
  elements.restart.hidden = phase === 'ready';
  elements.start.disabled = !canFly() || phase !== 'ready';
  elements.start.setAttribute('aria-disabled', String(elements.start.disabled));
  document.querySelectorAll('[data-variant]').forEach(button => {
    const isSelected = button.dataset.variant === selectedVariant;
    button.classList.toggle('is-selected', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
    button.disabled = loading || phase !== 'ready' || !assets.has(button.dataset.variant);
  });

  if (loading) {
    setLoadCover('SUZAKUの機体データを確認中', 'AX-01 SUZAKU / STANDARD + LONGWING');
    setStatus('3Dメッシュを読み込んでいます。');
  } else if (displayError) {
    setLoadCover('3D表示を開始できません', displayError);
    setStatus(displayError, 'error');
  } else if (assetError) {
    setLoadCover(`${config.label}を表示できません`, assetError);
    setStatus(`${config.label}のメッシュを読み込めません。別の外観を選んでください。`, 'error');
  } else {
    elements.loadCover.hidden = true;
    if (assetErrors.size > 0) {
      setStatus(`${config.label}を表示中です。もう一方のメッシュは読み込めませんでした。`, 'warning');
    } else if (phase === 'ready') {
      setStatus('3Dメッシュを読み込みました。外観を選んでフライトを始められます。');
    } else if (phase === 'running') {
      setStatus('ゲートを通過してスコアを獲得。Shift または BOOST で短く加速します。');
    } else if (phase === 'paused') {
      setStatus('フライトを一時停止しています。再開してコースへ戻れます。');
    } else {
      setStatus(gameState.finishReason === 'time-up' ? '制限時間になりました。' : 'コースを飛び終えました。');
    }
  }

  const phaseNames = { ready: 'HANGAR / READY', running: 'FLIGHT / LIVE', paused: 'FLIGHT / PAUSED', finished: 'FLIGHT / RESULT' };
  elements.phaseLabel.textContent = phaseNames[phase];
  elements.controlStatus.textContent = phase === 'running' ? (gameState.boosting ? 'BOOST ACTIVE' : 'FLIGHT CONTROL') : phase.toUpperCase();

  const stageMessage = phase === 'paused' ? '一時停止中' : phase === 'finished'
    ? (gameState.finishReason === 'time-up' ? 'TIME UP' : 'FLIGHT COMPLETE')
    : '';
  elements.stageMessage.textContent = stageMessage;
  elements.stageMessage.hidden = !stageMessage;

  elements.stateCopy.textContent = phase === 'ready'
    ? '準備完了。外観を選んでフライトを始めよう。'
    : phase === 'running'
      ? 'ゲートの中心を通過するとスコアが加算されます。'
      : phase === 'paused'
        ? '時間とスコアは一時停止しています。'
        : `フライト終了。${gameState.gatesPassed}ゲート通過 / ${gameState.gatesMissed}ゲート見逃し。`;

  elements.result.hidden = phase !== 'finished';
  elements.result.textContent = phase === 'finished' ? `${gameState.score.toLocaleString('ja-JP')} PTS` : '';
}

function updateHud() {
  elements.score.textContent = String(gameState.score).padStart(6, '0');
  elements.time.textContent = String(Math.ceil(gameState.timeRemainingSeconds)).padStart(2, '0');
  elements.gate.textContent = String(gameState.gatesPassed).padStart(2, '0');
}

function selectVariant(variant) {
  if (!assets.has(variant) || gameState.phase !== 'ready') return;
  selectedVariant = variant;
  gameState = createState({ variant, seed: 2026 });
  scene?.setAircraft(variant, assets.get(variant), familyFrameHalfExtents());
  scene?.update(gameState, frameInput);
  updatePhaseUI();
  updateHud();
}

function startFlight() {
  if (!canFly() || gameState.phase !== 'ready') return;
  clearHeldInputs();
  gameState = step(gameState, { start: true });
  accumulator = 0;
  updatePhaseUI();
  updateHud();
  if (window.matchMedia('(max-width: 850px)').matches) {
    elements.stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function pauseFlight() {
  if (gameState.phase !== 'running') return;
  clearHeldInputs();
  gameState = step(gameState, { pause: true });
  updatePhaseUI();
  updateHud();
}

function resumeFlight() {
  if (gameState.phase !== 'paused') return;
  gameState = step(gameState, { resume: true });
  updatePhaseUI();
}

function restartFlight() {
  if (gameState.phase === 'ready') return;
  clearHeldInputs();
  gameState = step(gameState, { restart: true });
  accumulator = 0;
  updatePhaseUI();
  updateHud();
  if (window.matchMedia('(max-width: 850px)').matches) {
    elements.start.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function setControl(name, pressed, button) {
  if (pressed && gameState.phase !== 'running') return;
  if (pressed) heldControls.add(name);
  else heldControls.delete(name);
  button?.setAttribute('aria-pressed', String(pressed));
}

function handleKeyDown(event) {
  const code = event.code;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(code)) event.preventDefault();
  if ((code === 'Enter' || code === 'Space') && gameState.phase === 'ready') {
    startFlight();
    return;
  }
  if (code === 'Escape') {
    if (event.repeat) return;
    if (gameState.phase === 'running') pauseFlight();
    else if (gameState.phase === 'paused') resumeFlight();
    return;
  }
  if (code === 'KeyR' && gameState.phase !== 'ready') {
    restartFlight();
    return;
  }
  if (gameState.phase === 'running') heldKeys.add(code);
}

function handleKeyUp(event) {
  heldKeys.delete(event.code);
}

function handlePointerControls() {
  document.querySelectorAll('.mobile-controls [data-control]').forEach(button => {
    const name = button.dataset.control;
    const down = event => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      setControl(name, true, button);
    };
    const up = event => {
      if (event.cancelable) event.preventDefault();
      setControl(name, false, button);
    };
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('lostpointercapture', up);
    button.addEventListener('click', event => {
      if (event.detail !== 0 || gameState.phase !== 'running') return;
      setControl(name, true, button);
      window.setTimeout(() => setControl(name, false, button), 140);
    });
  });
}

async function initialize() {
  try {
    scene = new FlightScene(elements.canvas, elements.stage);
  } catch (error) {
    displayError = `3D表示を開始できません。${error instanceof Error ? error.message : 'WebGLを確認してください。'}`;
  }

  const results = await Promise.allSettled(variants.map(async variant => [variant, await loadAircraftAsset(variant)]));
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    const variant = variants[index];
    if (result.status === 'fulfilled') assets.set(...result.value);
    else assetErrors.set(variant, result.reason instanceof Error ? result.reason.message : 'メッシュを読み込めませんでした。');
  }
  loading = false;

  if (!assets.has(selectedVariant) && assets.size > 0) selectedVariant = assets.keys().next().value;
  gameState = createState({ variant: selectedVariant, seed: 2026 });
  if (scene && assets.has(selectedVariant)) scene.setAircraft(selectedVariant, assets.get(selectedVariant), familyFrameHalfExtents());

  if (assets.size === 0 && !displayError) {
    displayError = 'AX-01 SUZAKUの3Dメッシュを読み込めません。CAD出力を確認してください。';
  }
  updatePhaseUI();
  updateHud();
  scene?.update(gameState, frameInput);
}

function animate(timestamp) {
  if (lastFrameTime === null) lastFrameTime = timestamp;
  accumulator += Math.max(0, (timestamp - lastFrameTime) / 1_000);
  lastFrameTime = timestamp;

  const input = collectInput();
  frameInput = input;
  let stateChanged = false;
  while (accumulator >= FIXED_DT_SECONDS && gameState.phase === 'running') {
    gameState = step(gameState, input);
    accumulator -= FIXED_DT_SECONDS;
    stateChanged = true;
  }
  if (gameState.phase !== 'running') accumulator = Math.min(accumulator, FIXED_DT_SECONDS);

  if (scene) scene.update(gameState, input);
  if (timestamp - lastHudUpdate >= 90 || stateChanged) {
    updateHud();
    if (stateChanged) updatePhaseUI();
    lastHudUpdate = timestamp;
  }
  window.requestAnimationFrame(animate);
}

document.querySelectorAll('[data-variant]').forEach(button => {
  button.addEventListener('click', () => selectVariant(button.dataset.variant));
});
elements.start.addEventListener('click', startFlight);
elements.pause.addEventListener('click', pauseFlight);
elements.resume.addEventListener('click', resumeFlight);
elements.restart.addEventListener('click', restartFlight);
handlePointerControls();
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
window.addEventListener('blur', clearHeldInputs);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameState.phase === 'running') pauseFlight();
  clearHeldInputs();
});

Object.defineProperty(window, '__AERO_QA__', {
  configurable: false,
  enumerable: false,
  get: () => Object.freeze({
    phase: gameState.phase,
    score: gameState.score,
    position: Object.freeze({ x: gameState.x, y: gameState.y }),
    distance: gameState.distance,
    gatesPassed: gameState.gatesPassed,
    gatesMissed: gameState.gatesMissed,
    boostEnergy: gameState.boostEnergy,
    timeRemainingSeconds: gameState.timeRemainingSeconds,
    variant: selectedVariant,
    loading,
    meshLoaded: assets.has(selectedVariant),
    error: displayError ?? assetErrors.get(selectedVariant) ?? null,
  }),
});

updatePhaseUI();
void initialize();
window.requestAnimationFrame(animate);
