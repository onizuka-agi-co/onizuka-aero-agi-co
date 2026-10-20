import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createState, step, ARCADE_CONFIGS } from '../src/arcade.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const url = path => new URL(`../public/data/${path}`, import.meta.url);

for (const stem of ['arcade-standard', 'arcade-longwing', 'arcade-miss']) {
  test(`${stem} published inputs reproduce its recorded samples and result`, async () => {
    const record = JSON.parse(await readFile(url(`${stem}.json`), 'utf8'));
    assert.equal(record.designId, 'AX-01');
    assert.equal(record.displayName, 'AX-01 SUZAKU');
    assert.equal(record.assetRevision, 'r3');
    assert.equal(record.license, 'CC-BY-4.0');
    assert.match(record.scope, /not user telemetry/);
    assert.equal(record.generator.configHash, hash(JSON.stringify(ARCADE_CONFIGS[record.variant])));
    assert.equal(record.replay.inputSha256, hash(JSON.stringify(record.replay.commands)));
    assert.equal(record.replay.commandCount, record.samples.length + 1);
    let state = createState({ variant: record.variant, seed: record.replay.seed });
    for (const command of record.replay.commands) {
      state = step(state, command.input);
      if (command.frame === 0) continue;
      const sample = record.samples[command.frame - 1];
      assert.equal(sample.frame, command.frame);
      assert.equal(sample.score, state.score);
      assert.equal(sample.x, Number(state.x.toFixed(4)));
      assert.equal(sample.y, Number(state.y.toFixed(4)));
      assert.equal(sample.distance, Number(state.distance.toFixed(4)));
      assert.equal(sample.event, state.event);
    }
    assert.equal(state.phase, record.result.phase);
    assert.equal(state.score, record.result.score);
    assert.equal(state.gatesPassed, record.result.gatesPassed);
    assert.equal(state.gatesMissed, record.result.gatesMissed);
    assert.equal(state.finishReason, record.result.finishReason);
    assert.equal(Number(state.elapsedSeconds.toFixed(6)), record.result.elapsedSeconds);
    const csv = await readFile(url(`${stem}.csv`), 'utf8');
    assert.equal(csv.trimEnd().split('\n').length, record.samples.length + 1);
    if (stem === 'arcade-miss') assert.ok(state.gatesMissed > state.gatesPassed);
    else assert.equal(state.gatesPassed, ARCADE_CONFIGS[record.variant].gateCount);
  });
}
