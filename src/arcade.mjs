export const FIXED_DT_SECONDS = 1 / 60;

const MAX_POSITION = 54;
const MAX_BOOST_ENERGY = 100;

export const ARCADE_CONFIGS = Object.freeze({
  standard: Object.freeze({
    id: 'standard',
    label: 'スタンダード',
    tuningLabel: '小回り重視',
    cruiseSpeed: 50,
    lateralSpeed: 34,
    verticalSpeed: 27,
    boostMultiplier: 1.55,
    timeLimitSeconds: 76,
    firstGateDistance: 96,
    gateSpacing: 84,
    gateCount: 14,
    gateRadius: 24,
  }),
  longwing: Object.freeze({
    id: 'longwing',
    label: 'ロングウィング',
    tuningLabel: '直進加速重視',
    cruiseSpeed: 54,
    lateralSpeed: 26,
    verticalSpeed: 21,
    boostMultiplier: 1.7,
    timeLimitSeconds: 72,
    firstGateDistance: 96,
    gateSpacing: 84,
    gateCount: 14,
    gateRadius: 24,
  }),
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizedSeed(seed) {
  if (!Number.isFinite(seed)) return 1;
  return Math.trunc(Math.abs(seed)) % 2_147_483_647 || 1;
}

function seededCourse(seed, config) {
  let current = normalizedSeed(seed);
  const random = () => {
    current = current * 48_271 % 2_147_483_647;
    return current / 2_147_483_647;
  };
  let x = 0;
  let y = 0;

  return Array.from({ length: config.gateCount }, (_, index) => {
    if (index > 0) {
      x = clamp(x + (random() - 0.5) * 28, -27, 27);
      y = clamp(y + (random() - 0.5) * 22, -21, 21);
    }
    return Object.freeze({
      index,
      distance: config.firstGateDistance + index * config.gateSpacing,
      x,
      y,
      radius: config.gateRadius,
    });
  });
}

function readInput(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const axis = value => Number.isFinite(value) ? clamp(value, -1, 1) : 0;
  return {
    steerX: axis(source.steerX),
    steerY: axis(source.steerY),
    boost: source.boost === true,
    start: source.start === true,
    pause: source.pause === true,
    resume: source.resume === true,
    restart: source.restart === true,
  };
}

export function createState({ variant = 'standard', seed = 1 } = {}) {
  const config = ARCADE_CONFIGS[variant];
  if (!config) throw new RangeError(`Unknown AX-01 arcade variant: ${variant}`);

  return {
    phase: 'ready',
    variant,
    seed: normalizedSeed(seed),
    course: seededCourse(seed, config),
    nextGateIndex: 0,
    x: 0,
    y: 0,
    distance: 0,
    score: 0,
    gatesPassed: 0,
    gatesMissed: 0,
    combo: 0,
    elapsedSeconds: 0,
    timeRemainingSeconds: config.timeLimitSeconds,
    boostEnergy: MAX_BOOST_ENERGY,
    boosting: false,
    event: null,
    finishReason: null,
  };
}

export function step(state, input = {}) {
  const command = readInput(input);

  if (command.restart) {
    return { ...createState({ variant: state.variant, seed: state.seed }), event: 'restarted' };
  }

  if (state.phase === 'ready') {
    return command.start ? { ...state, phase: 'running', event: 'launched' } : state;
  }
  if (state.phase === 'finished') return state;
  if (state.phase === 'paused') {
    return command.resume
      ? { ...state, phase: 'running', event: 'resumed' }
      : state;
  }
  if (command.pause) return { ...state, phase: 'paused', event: 'paused', boosting: false };

  const config = ARCADE_CONFIGS[state.variant];
  const boosting = command.boost && state.boostEnergy > 0;
  const nextX = clamp(state.x + command.steerX * config.lateralSpeed * FIXED_DT_SECONDS, -MAX_POSITION, MAX_POSITION);
  const nextY = clamp(state.y + command.steerY * config.verticalSpeed * FIXED_DT_SECONDS, -MAX_POSITION, MAX_POSITION);
  const nextDistance = state.distance + config.cruiseSpeed * (boosting ? config.boostMultiplier : 1) * FIXED_DT_SECONDS;
  const nextElapsed = state.elapsedSeconds + FIXED_DT_SECONDS;
  const nextTime = Math.max(0, state.timeRemainingSeconds - FIXED_DT_SECONDS);
  let nextGateIndex = state.nextGateIndex;
  let score = state.score;
  let gatesPassed = state.gatesPassed;
  let gatesMissed = state.gatesMissed;
  let combo = state.combo;
  let event = null;

  while (nextGateIndex < state.course.length && state.course[nextGateIndex].distance <= nextDistance) {
    const gate = state.course[nextGateIndex];
    const fraction = clamp((gate.distance - state.distance) / (nextDistance - state.distance), 0, 1);
    const crossX = state.x + (nextX - state.x) * fraction;
    const crossY = state.y + (nextY - state.y) * fraction;
    const insideGate = Math.hypot(crossX - gate.x, crossY - gate.y) <= gate.radius;

    if (insideGate) {
      score += 100 + Math.min(combo, 8) * 25;
      gatesPassed += 1;
      combo += 1;
      event = 'gate-passed';
    } else {
      gatesMissed += 1;
      combo = 0;
      event = 'gate-missed';
    }
    nextGateIndex += 1;
  }

  const boostEnergy = boosting
    ? Math.max(0, state.boostEnergy - 34 * FIXED_DT_SECONDS)
    : Math.min(MAX_BOOST_ENERGY, state.boostEnergy + 19 * FIXED_DT_SECONDS);
  let phase = 'running';
  let finishReason = null;
  if (nextGateIndex >= state.course.length) {
    phase = 'finished';
    finishReason = 'course-complete';
    event = 'course-complete';
  } else if (nextTime === 0) {
    phase = 'finished';
    finishReason = 'time-up';
    event = 'time-up';
  }

  return {
    ...state,
    phase,
    x: nextX,
    y: nextY,
    distance: nextDistance,
    score,
    gatesPassed,
    gatesMissed,
    combo,
    nextGateIndex,
    elapsedSeconds: nextElapsed,
    timeRemainingSeconds: nextTime,
    boostEnergy,
    boosting,
    event,
    finishReason,
  };
}
