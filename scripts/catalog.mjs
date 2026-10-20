import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(root, 'public');
const manifestPath = join(publicRoot, 'data', 'manifest.json');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function filesIn(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

async function describe(path, base, license) {
  const bytes = await readFile(path);
  return { path: relative(base, path).replaceAll('\\', '/'), bytes: bytes.length, sha256: sha256(bytes), license };
}

if (process.argv.includes('--check')) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const actualFiles = (await filesIn(publicRoot)).filter(path => path !== manifestPath);
  const expectedPaths = manifest.files.map(file => file.path).sort();
  const actualPaths = actualFiles.map(path => relative(publicRoot, path).replaceAll('\\', '/')).sort();
  if (JSON.stringify(expectedPaths) !== JSON.stringify(actualPaths)) throw new Error('Public file inventory changed; run npm run catalog.');
  for (const [base, files] of [[publicRoot, manifest.files], [root, manifest.sources]]) {
    for (const file of files) {
      const actual = await describe(join(base, file.path), base, file.license);
      if (actual.sha256 !== file.sha256 || actual.bytes !== file.bytes) throw new Error(`Checksum mismatch: ${file.path}`);
    }
  }
  console.log(`Verified ${manifest.files.length} public files and ${manifest.sources.length} source files.`);
} else {
  const files = [];
  for (const path of (await filesIn(publicRoot)).filter(path => path !== manifestPath)) {
    const dataRecord = relative(publicRoot, path).replaceAll('\\', '/').startsWith('data/');
    files.push(await describe(path, publicRoot, dataRecord ? 'CC-BY-4.0' : 'MIT'));
  }
  const sourcePaths = ['src', 'scripts'].map(name => join(root, name));
  const sources = [];
  for (const directory of sourcePaths) {
    for (const path of await filesIn(directory)) {
      if (/\.(mjs|js|py|json|css)$/.test(path)) sources.push(await describe(path, root, 'MIT'));
    }
  }
  for (const name of ['package.json', 'package-lock.json', 'vite.config.js', '.gitattributes', 'index.html']) {
    sources.push(await describe(join(root, name), root, 'MIT'));
  }
  for (const path of await filesIn(join(root, 'design', 'concepts', 'ax01-r2'))) {
    sources.push(await describe(path, root, 'MIT'));
  }
  const manifest = {
    schemaVersion: 1,
    datasetId: 'onizuka-aero-ax01-r3',
    designId: 'AX-01',
    displayName: 'AX-01 SUZAKU',
    revision: 'r3',
    generatedAt: new Date().toISOString(),
    publisher: 'ONIZUKA AERO AGI Co.',
    attribution: 'ONIZUKA AERO AGI Co., AX-01 SUZAKU dataset r3',
    repository: 'https://github.com/onizuka-agi-co/onizuka-aero-agi-co',
    scope: 'Fictional art geometry and simulated arcade gameplay. No physical aircraft performance data.',
    files,
    sources,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Catalogued ${files.length} public files and ${sources.length} source files.`);
}
