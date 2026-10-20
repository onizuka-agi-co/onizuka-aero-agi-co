import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const issues = JSON.parse(execFileSync('gh', [
  'issue', 'list', '--repo', 'onizuka-agi-co/onizuka-aero-agi-co', '--state', 'all',
  '--json', 'number,title,state,url,createdAt,closedAt', '--limit', '100',
], { encoding: 'utf8', cwd: root }));
const snapshot = {
  schemaVersion: 1,
  recordType: 'observed-public-company-task-snapshot',
  designId: 'AX-01',
  revision: 'r1',
  status: 'observed',
  attribution: 'ONIZUKA AERO AGI Co., AX-01 first mission task snapshot r1',
  generator: { command: 'node scripts/snapshot-company.mjs', source: 'scripts/snapshot-company.mjs', tool: 'GitHub CLI issue list' },
  company: 'ONIZUKA AERO AGI Co.',
  missionId: 'AX01-FIRST-RELEASE',
  recordedAt: new Date().toISOString(),
  provenance: {
    kind: 'observed-public-project-state',
    source: 'https://github.com/onizuka-agi-co/onizuka-aero-agi-co/issues',
    method: 'GitHub CLI issue list, public fields only; no invented meeting or approval records.',
  },
  license: 'CC-BY-4.0',
  tasks: issues.sort((a, b) => a.number - b.number),
};
await mkdir(resolve(root, 'public/data'), { recursive: true });
await writeFile(resolve(root, 'public/data/company-mission.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Recorded ${issues.length} real public issue states.`);
