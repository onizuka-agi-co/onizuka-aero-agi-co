import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2] ?? 'http://127.0.0.1:4188/';
const output = resolve(root, process.argv[3] ?? 'evidence/browser-automated.json');
const server = process.argv[2] ? null : spawn(process.execPath, [
  resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4188', '--strictPort',
], { cwd: root, windowsHide: true, stdio: 'ignore' });
let browser;
const report = { schemaVersion: 1, checkedAt: new Date().toISOString(), target, status: 'running', checks: [], pageErrors: [], screenshots: [], limits: ['Chromium with emulated touch viewport; physical devices are untested.'] };
const check = (name, passed) => { assert.ok(passed, name); report.checks.push({ name, passed }); };
const state = page => page.evaluate(() => window.__AERO_QA__);
Object.assign(report, {
  recordType: 'observed-browser-verification', designId: 'AX-01', displayName: 'AX-01 SUZAKU', revision: 'r3',
  license: 'CC-BY-4.0', attribution: 'ONIZUKA AERO AGI Co., AX-01 SUZAKU browser verification r3',
  generator: 'scripts/browser-qa.mjs',
  method: 'Actual Chromium mouse, keyboard and CDP touch input against the built static site.',
  sourceHashes: {},
});
for (const path of ['src/main.js', 'src/scene.js', 'src/style.css', 'src/arcade.mjs', 'index.html', 'scripts/browser-qa.mjs']) {
  report.sourceHashes[path] = createHash('sha256').update(await readFile(resolve(root, path))).digest('hex');
}

try {
  if (server) {
    let listening = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (server.exitCode !== null) throw new Error('Preview server exited before accepting requests.');
      try { if ((await fetch(target)).ok) { listening = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.ok(listening, 'Preview server must start.');
  }
  await mkdir(dirname(output), { recursive: true });
  browser = await chromium.launch({ headless: true });
  report.browser = browser.version();
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await desktop.newPage();
  page.on('pageerror', error => report.pageErrors.push(error.message));
  await page.goto(target, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__AERO_QA__?.loading === false);
  check('CAD mesh loaded into ready screen', (await state(page)).meshLoaded && !(await state(page)).error);
  const imagePath = resolve(dirname(output), 'browser-auto-desktop.png');
  await page.screenshot({ path: imagePath });
  report.screenshots.push('browser-auto-desktop.png');
  await page.locator('[data-variant="longwing"]').click();
  check('Long-wing selection', (await state(page)).variant === 'longwing');
  await page.locator('[data-variant="standard"]').click();
  await page.locator('#start-button').click();
  await page.waitForFunction(() => window.__AERO_QA__.score > 0);
  check('Visible score changes after real-time gate crossing', Number(await page.locator('#score-value').innerText()) > 0);
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('Shift');
  await page.waitForTimeout(350);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('Shift');
  check('Keyboard changes position and boost energy', (await state(page)).position.x > 0 && (await state(page)).boostEnergy < 100);
  await page.locator('#pause-button').click();
  const before = await state(page);
  await page.waitForTimeout(200);
  check('Pause freezes clock', before.phase === 'paused' && before.timeRemainingSeconds === (await state(page)).timeRemainingSeconds);
  await page.locator('#resume-button').click();
  await page.waitForFunction(() => window.__AERO_QA__.phase === 'finished', null, { timeout: 30000 });
  check('Course completion shows result', await page.locator('#result-summary').isVisible());
  await page.locator('#restart-button').click();
  check('Return to selection resets score', (await state(page)).phase === 'ready' && (await state(page)).score === 0);
  await page.close();
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touch = await mobile.newPage();
  touch.on('pageerror', error => report.pageErrors.push(error.message));
  await touch.goto(target, { waitUntil: 'networkidle' });
  check('390px layout does not overflow', await touch.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await touch.locator('#start-button').tap();
  await touch.waitForFunction(() => window.__AERO_QA__.phase === 'running');
  const protocol = await mobile.newCDPSession(touch);
  for (const name of ['right', 'boost']) {
    const control = touch.locator(`[data-control="${name}"]`);
    await control.scrollIntoViewIfNeeded();
    await control.click({ trial: true });
    const box = await control.boundingBox();
    assert.ok(box && box.x >= 0 && box.y >= 0 && box.y + box.height <= 844, 'Touch control is visible.');
    const before = await state(touch);
    try {
      await protocol.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }] });
      await touch.waitForFunction(({ name, before }) => {
        const pressed = document.querySelector(`[data-control="${name}"]`)?.getAttribute('aria-pressed') === 'true';
        const actual = window.__AERO_QA__;
        return pressed && (name === 'right' ? actual.position.x > before.position.x : actual.boostEnergy < before.boostEnergy);
      }, { name, before }, { timeout: 5000 });
      const actual = await state(touch);
      check(`Real touch ${name}`, name === 'right' ? actual.position.x > before.position.x : actual.boostEnergy < before.boostEnergy);
    } catch (error) {
      throw new Error(`Touch ${name}: ${JSON.stringify({ before, after: await state(touch), pressed: await control.getAttribute('aria-pressed'), box })}`, { cause: error });
    } finally {
      await protocol.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    assert.equal(await control.getAttribute('aria-pressed'), 'false', 'Touch control released.');
  }
  await touch.locator('#pause-button').tap();
  await touch.screenshot({ path: resolve(dirname(output), 'browser-auto-mobile.png') });
  report.screenshots.push('browser-auto-mobile.png');
  const missing = await desktop.newPage();
  await missing.route('**/assets/ax01/*/mesh.json', route => route.abort());
  await missing.goto(target, { waitUntil: 'networkidle' });
  check('Missing assets prevent start', await missing.locator('#start-button').isDisabled() && !(await state(missing)).meshLoaded);
  check('No uncaught page errors', report.pageErrors.length === 0);
  report.status = 'pass';
  console.log(`PASS: ${report.checks.length} browser checks at ${target}`);
} catch (error) {
  report.status = 'failed';
  report.error = error.message;
  process.exitCode = 1;
  console.error(error);
} finally {
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  await browser?.close();
  server?.kill();
}
