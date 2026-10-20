import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARCADE_CONFIGS, FIXED_DT_SECONDS, createState, step } from '../src/arcade.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = join(root, 'public', 'data');
const assetRevision = 'r2';
const designId = 'AX-01';
const displayName = 'AX-01 SUZAKU';
const seed = 20_261_020;
const variants = ['standard', 'longwing'];
const hash = value => createHash('sha256').update(value).digest('hex');
const bounded = (value, min, max) => Math.min(max, Math.max(min, value));

function nextInput(state, config, frame, runKind) {
  if (runKind === 'miss-control') return { steerX: 1, steerY: 0, boost: false };
  const gate = state.course[state.nextGateIndex];
  const steerX = gate ? bounded((gate.x - state.x) / (config.lateralSpeed * FIXED_DT_SECONDS * 5), -1, 1) : 0;
  const steerY = gate ? bounded((gate.y - state.y) / (config.verticalSpeed * FIXED_DT_SECONDS * 5), -1, 1) : 0;
  return {
    steerX: Number(steerX.toFixed(4)),
    steerY: Number(steerY.toFixed(4)),
    boost: frame % 420 < 42 && state.boostEnergy > 28,
  };
}

function csvValue(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function formatCsv(samples) {
  const columns = ['frame', 'elapsed_seconds', 'variant', 'x', 'y', 'distance', 'score', 'gates_passed', 'gates_missed', 'combo', 'boosting', 'input_x', 'input_y', 'input_boost', 'event'];
  const rows = samples.map(({ frame, state, input }) => [
    frame,
    state.elapsedSeconds.toFixed(6),
    state.variant,
    state.x.toFixed(4),
    state.y.toFixed(4),
    state.distance.toFixed(4),
    state.score,
    state.gatesPassed,
    state.gatesMissed,
    state.combo,
    state.boosting,
    input.steerX,
    input.steerY,
    input.boost,
    state.event,
  ]);
  return [columns, ...rows].map(row => row.map(csvValue).join(',')).join('\n') + '\n';
}

function simulate(variant, runKind = 'route-following') {
  const config = ARCADE_CONFIGS[variant];
  let state = createState({ variant, seed });
  const commands = [{ frame: 0, input: { start: true } }];
  const samples = [];
  state = step(state, commands[0].input);

  for (let frame = 1; frame <= Math.ceil(config.timeLimitSeconds / FIXED_DT_SECONDS); frame += 1) {
    const input = nextInput(state, config, frame, runKind);
    commands.push({ frame, input });
    state = step(state, input);
    samples.push({ frame, state, input });
    if (state.phase === 'finished') break;
  }
  if (state.phase !== 'finished') throw new Error(`${variant} replay did not reach a finished state.`);

  const configHash = hash(JSON.stringify(config));
  const inputHash = hash(JSON.stringify(commands));
  const recordedAt = new Date().toISOString();
  const record = {
    schemaVersion: 1,
    recordId: `AX01-ARCADE-${variant}-${runKind}-R2-${seed}`,
    designId,
    displayName,
    assetRevision,
    variant,
    recordedAt,
    status: 'generated',
    runKind,
    valueKinds: { samples: 'simulated-game-state', inputs: 'scripted-synthetic', tuning: 'artistic', runtimeVersion: 'observed' },
    license: 'CC-BY-4.0',
    attribution: `ONIZUKA AERO AGI Co., ${displayName} arcade record ${variant} r2`,
    scope: 'Deterministic fictional gate-flight gameplay only. This record is simulated input and game state, not user telemetry, physical flight, or aircraft performance data.',
    units: {
      time: 'second',
      position: 'arbitrary-game-unit',
      distance: 'arbitrary-game-unit',
      score: 'point',
      control: 'normalized from -1 to 1',
    },
    generator: {
      command: 'npm run record:arcade',
      source: 'scripts/record-arcade.mjs',
      node: process.version,
      fixedDeltaSeconds: FIXED_DT_SECONDS,
      configHash,
    },
    replay: {
      seed,
      frameCount: samples.length,
      commandCount: commands.length,
      inputSha256: inputHash,
      commands,
    },
    result: {
      phase: state.phase,
      finishReason: state.finishReason,
      score: state.score,
      gatesPassed: state.gatesPassed,
      gatesMissed: state.gatesMissed,
      elapsedSeconds: Number(state.elapsedSeconds.toFixed(6)),
      remainingSeconds: Number(state.timeRemainingSeconds.toFixed(6)),
    },
    samples: samples.map(({ frame, state: sample, input }) => ({
      frame,
      elapsedSeconds: Number(sample.elapsedSeconds.toFixed(6)),
      x: Number(sample.x.toFixed(4)),
      y: Number(sample.y.toFixed(4)),
      distance: Number(sample.distance.toFixed(4)),
      score: sample.score,
      gatesPassed: sample.gatesPassed,
      gatesMissed: sample.gatesMissed,
      combo: sample.combo,
      boost: sample.boosting,
      input,
      event: sample.event,
    })),
  };

  return { record, csv: formatCsv(samples), configHash, inputHash };
}

await mkdir(dataDirectory, { recursive: true });
const summary = {
  schemaVersion: 1,
  designId,
  displayName,
  assetRevision,
  recordedAt: new Date().toISOString(),
  status: 'generated',
  license: 'CC-BY-4.0',
  attribution: `ONIZUKA AERO AGI Co., ${displayName} arcade simulations r2`,
  scope: 'Deterministic fictional gate-flight gameplay only. No real-flight simulation or user telemetry.',
  runs: [],
};

const runCases = [
  ...variants.map(variant => ({ variant, runKind: 'route-following', stem: `arcade-${variant}` })),
  { variant: 'standard', runKind: 'miss-control', stem: 'arcade-miss' },
];

for (const { variant, runKind, stem } of runCases) {
  const { record, csv, configHash, inputHash } = simulate(variant, runKind);
  const jsonName = `${stem}.json`;
  const csvName = `${stem}.csv`;
  await writeFile(join(dataDirectory, jsonName), `${JSON.stringify(record, null, 2)}\n`);
  await writeFile(join(dataDirectory, csvName), csv);
  summary.runs.push({
    recordId: record.recordId,
    variant,
    runKind,
    status: record.status,
    configHash,
    inputSha256: inputHash,
    frameCount: record.replay.frameCount,
    finishReason: record.result.finishReason,
    score: record.result.score,
    gatesPassed: record.result.gatesPassed,
    gatesMissed: record.result.gatesMissed,
    files: [jsonName, csvName],
  });
  console.log(`${stem}: ${record.result.score} points, ${record.result.gatesPassed}/${ARCADE_CONFIGS[variant].gateCount} gates passed, ${record.result.gatesMissed} missed, ${record.replay.frameCount} fixed steps.`);
}

await writeFile(join(dataDirectory, 'arcade-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Wrote deterministic simulated runs under ${dataDirectory}.`);
