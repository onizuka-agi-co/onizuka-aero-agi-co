import test from 'node:test';
import assert from 'node:assert/strict';
import { ARCADE_CONFIGS, FIXED_DT_SECONDS, createState, step } from '../src/arcade.mjs';

function launch(state) {
  return step(state, { start: true });
}

function advanceToFirstGate(state, input) {
  let current = launch(state);
  for (let frame = 0; frame < 400 && current.nextGateIndex === 0; frame += 1) {
    current = step(current, input);
  }
  return current;
}

test('crossing the first gate awards points through the public game state', () => {
  const initial = createState({ seed: 2026 });
  const finishedCrossing = advanceToFirstGate(initial, {});

  assert.equal(initial.phase, 'ready');
  assert.equal(initial.gatesPassed, 0);
  assert.equal(finishedCrossing.gatesPassed, 1);
  assert.equal(finishedCrossing.gatesMissed, 0);
  assert.equal(finishedCrossing.score, 100);
  assert.equal(finishedCrossing.nextGateIndex, 1);
});

test('the swept crossing records a miss when the craft crosses outside a gate', () => {
  const result = advanceToFirstGate(createState({ seed: 2026 }), { steerX: 1 });

  assert.equal(result.gatesPassed, 0);
  assert.equal(result.gatesMissed, 1);
  assert.equal(result.nextGateIndex, 1);
  assert.equal(result.event, 'gate-missed');
});

test('pause freezes the run and restart returns to a clean ready state', () => {
  let state = launch(createState({ seed: 9 }));
  for (let frame = 0; frame < 45; frame += 1) state = step(state, { boost: true });
  state = step(state, { pause: true });
  const paused = state;
  for (let frame = 0; frame < 180; frame += 1) state = step(state, { steerX: 1, boost: true });

  assert.equal(state, paused);
  state = step(state, { resume: true });
  assert.equal(state.phase, 'running');
  assert.equal(state.event, 'resumed');
  state = step(state, { restart: true });
  assert.equal(state.phase, 'ready');
  assert.equal(state.score, 0);
  assert.equal(state.distance, 0);
  assert.equal(state.timeRemainingSeconds, ARCADE_CONFIGS.standard.timeLimitSeconds);
  assert.equal(state.seed, 9);
});

test('steering and boost inputs stay within the arcade model bounds', () => {
  let state = launch(createState());
  for (let frame = 0; frame < 600; frame += 1) {
    state = step(state, { steerX: 50, steerY: -50, boost: true });
  }

  assert.ok(state.x <= 54 && state.x >= -54);
  assert.ok(state.y <= 54 && state.y >= -54);
  assert.ok(state.boostEnergy >= 0 && state.boostEnergy <= 100);
  assert.ok(state.distance > 0);
  assert.equal(FIXED_DT_SECONDS, 1 / 60);
});

test('variant selection changes only the game preset and keeps a deterministic course', () => {
  const standard = createState({ variant: 'standard', seed: 123 });
  const longwing = createState({ variant: 'longwing', seed: 123 });
  const replay = createState({ variant: 'standard', seed: 123 });

  assert.notEqual(ARCADE_CONFIGS.standard.cruiseSpeed, ARCADE_CONFIGS.longwing.cruiseSpeed);
  assert.notEqual(ARCADE_CONFIGS.standard.lateralSpeed, ARCADE_CONFIGS.longwing.lateralSpeed);
  assert.equal(standard.variant, 'standard');
  assert.equal(longwing.variant, 'longwing');
  assert.deepEqual(standard.course, replay.course);
  assert.notEqual(standard.course, longwing.course);
  assert.throws(() => createState({ variant: 'unknown' }), RangeError);
});

test('paused runs freeze and finished runs retain their result', () => {
  let state = step(launch(createState()), { pause: true });
  const paused = step(state, { steerY: 1 });
  assert.equal(paused.elapsedSeconds, state.elapsedSeconds);
  assert.equal(paused.distance, state.distance);
  assert.equal(step(state, { pause: true }).phase, 'paused');

  let finished = launch(createState());
  for (let frame = 0; frame < 10_000 && finished.phase !== 'finished'; frame += 1) {
    finished = step(finished, {});
  }
  assert.equal(finished.phase, 'finished');
  assert.equal(finished.finishReason, 'course-complete');
  assert.equal(step(finished, { steerX: 1 }), finished);
});
