import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const read = async path => JSON.parse(await readFile(new URL(`../public/${path}`, import.meta.url), 'utf8'));

for (const variant of ['standard', 'longwing']) {
  test(`${variant} mesh is a finite indexed export of AX-01 CAD`, async () => {
    const mesh = await read(`assets/ax01/${variant}/mesh.json`);
    assert.equal(mesh.schemaVersion, 1);
    assert.equal(mesh.designId, 'AX-01');
    assert.equal(mesh.revision, 'r1');
    assert.equal(mesh.variant, variant);
    assert.equal(mesh.units, 'arbitrary-design-unit');
    assert.deepEqual(mesh.coordinateSystem, { forward: '+X', span: 'Y', up: '+Z' });
    assert.ok(mesh.parts.length >= 5, 'Export must contain a detailed original craft.');
    assert.ok(Buffer.byteLength(JSON.stringify(mesh)) < 2 * 1024 * 1024, 'Keep each browser mesh below 2 MiB.');
    assert.ok(mesh.parts.reduce((count, part) => count + part.indices.length / 3, 0) < 30000, 'Keep each craft below 30,000 triangles.');
    const names = new Set();
    for (const part of mesh.parts) {
      assert.ok(!names.has(part.name), `Duplicate part ${part.name}`);
      names.add(part.name);
      assert.match(part.color, /^#[0-9a-f]{6}$/i);
      assert.ok(part.positions.length >= 9 && part.positions.length % 3 === 0);
      assert.ok(part.positions.every(Number.isFinite));
      assert.ok(part.indices.length >= 3 && part.indices.length % 3 === 0);
      assert.ok(part.indices.every(i => Number.isInteger(i) && i >= 0 && i < part.positions.length / 3));
    }
  });
}

test('wing variants contain genuinely different exported geometry', async () => {
  const a = await read('assets/ax01/standard/mesh.json');
  const b = await read('assets/ax01/longwing/mesh.json');
  assert.notDeepEqual(a.parts, b.parts);
  const span = mesh => {
    const values = mesh.parts.flatMap(p => p.positions.filter((_, i) => i % 3 === 1));
    return Math.max(...values) - Math.min(...values);
  };
  assert.ok(span(b) > span(a), 'Long-wing visual variant must have greater exported span.');
});

test('public catalog labels scope, licenses and provenance', async () => {
  const manifest = await read('data/manifest.json');
  assert.equal(manifest.designId, 'AX-01');
  assert.equal(manifest.revision, 'r1');
  assert.match(manifest.scope, /No physical aircraft performance/);
  assert.ok(manifest.files.length >= 12);
  for (const file of manifest.files) {
    assert.match(file.sha256, /^[0-9a-f]{64}$/);
    assert.ok(file.bytes > 0);
    assert.ok(!file.path.includes('..') && !file.path.includes('\\'));
    assert.equal(file.license, file.path.startsWith('data/') ? 'CC-BY-4.0' : 'MIT');
  }
});

test('geometry evidence binds real reopened exports to the current mesh', async () => {
  const report = await read('data/geometry-report.json');
  assert.equal(report.reportType, 'geometry-analysis');
  assert.equal(report.status, 'passed');
  assert.equal(report.units, 'arbitrary-design-unit');
  assert.equal(report.freeCAD.version, '1.1.3');
  assert.equal(report.regenerationCheck.executed, true);
  assert.equal(report.regenerationCheck.matches, true);
  assert.equal(report.variants.length, 2);
  for (const variant of report.variants) {
    assert.equal(variant.status, 'passed');
    assert.ok(variant.partValidity.every(part => part.valid));
    assert.equal(variant.exportReopenChecks.nativeCad.valid, true);
    assert.equal(variant.exportReopenChecks.step.valid, true);
    assert.equal(variant.exportReopenChecks.stl.valid, true);
    assert.equal(variant.wingSymmetry.withinTolerance, true);
    assert.equal(variant.exportReopenChecks.nativeCadArchiveScan.localPathScanPassed, true);
    assert.equal(variant.exportReopenChecks.stepHeaderScan.localPathScanPassed, true);
    const mesh = await read(`assets/ax01/${variant.variant}/mesh.json`);
    assert.equal(mesh.parts.length, variant.partCount);
    assert.equal(mesh.parts.reduce((sum, part) => sum + part.indices.length / 3, 0), variant.triangleCount);
    for (const output of Object.values(variant.outputs)) {
      const bytes = await readFile(new URL(`../${output.path}`, import.meta.url));
      assert.equal(bytes.length, output.bytes);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), output.sha256);
    }
  }
});
