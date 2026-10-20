import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = new URL(process.argv[2] ?? 'https://onizuka-agi-co.github.io/onizuka-aero-agi-co/');
if (!base.pathname.endsWith('/')) base.pathname += '/';
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const manifestBytes = await readFile(resolve(root, 'public/data/manifest.json'));
const manifest = JSON.parse(manifestBytes);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

async function verify(url, expectedHash, expectedBytes) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'Cache-Control': 'no-cache' } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (hash(bytes) !== expectedHash || bytes.length !== expectedBytes) throw new Error(`Published content mismatch: ${url}`);
  return { url: String(url), status: response.status, bytes: bytes.length, sha256: hash(bytes) };
}

const checks = [];
checks.push(await verify(new URL('data/manifest.json', base), hash(manifestBytes), manifestBytes.length));
for (const file of manifest.files) checks.push(await verify(new URL(file.path, base), file.sha256, file.bytes));
for (const file of manifest.sources) {
  const url = `https://raw.githubusercontent.com/onizuka-agi-co/onizuka-aero-agi-co/${commit}/${file.path}`;
  checks.push(await verify(url, file.sha256, file.bytes));
}
const report = {
  schemaVersion: 1,
  recordType: 'observed-anonymous-publication-verification',
  designId: 'AX-01',
  revision: 'r1',
  license: 'CC-BY-4.0',
  attribution: 'ONIZUKA AERO AGI Co., AX-01 publication verification r1',
  checkedAt: new Date().toISOString(),
  method: 'Anonymous HTTP GET without authorization; bytes and SHA256 matched local published manifest.',
  commit,
  site: String(base),
  status: 'pass',
  checks,
};
await mkdir(resolve(root, 'evidence'), { recursive: true });
await writeFile(resolve(root, 'evidence/publication.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`PASS: ${checks.length} anonymous downloads match; source pinned to ${commit}.`);
