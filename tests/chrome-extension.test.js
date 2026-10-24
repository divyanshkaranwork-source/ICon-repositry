// End-to-end test: loads the unpacked Chrome extension into Chromium, serves a
// GitHub-shaped fixture at https://github.com/… and checks every tree entry is
// repainted with the right Folio icon — including live React-style updates
// and edition changes made from the popup.
//
// Run: npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createFolio } from '../src/runtime/folio.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXT = path.join(ROOT, 'extensions/chrome');
const FIXTURE = fs.readFileSync(path.join(ROOT, 'tests/fixtures/github.html'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/runtime-data.json'), 'utf8'));
const folio = createFolio(data);

// Chrome derives an unpacked extension's id from its absolute path.
const extensionId = (dir) =>
  [...crypto.createHash('sha256').update(fs.realpathSync(dir)).digest('hex').slice(0, 32)]
    .map((c) => String.fromCharCode(97 + parseInt(c, 16)))
    .join('');

let context;
let page;

const entries = () =>
  page.$$eval('svg[class*="octicon-file"], svg[aria-label]', (svgs) =>
    svgs.map((s) => ({ key: s.dataset.folio || null, bg: s.style.backgroundImage })),
  );

const waitForKey = (selector, pattern) =>
  page.waitForFunction(
    ([sel, re]) => new RegExp(re).test(document.querySelector(sel)?.dataset.folio || ''),
    [selector, pattern],
    { timeout: 5000 },
  );

before(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'folio-e2e-'));
  context = await chromium.launchPersistentContext(profile, {
    headless: true,
    // Extensions need the full Chromium build (new headless), not headless-shell.
    channel: 'chromium',
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  });
  await context.route('https://github.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: FIXTURE }),
  );
  page = await context.newPage();
  await page.goto('https://github.com/folio/demo');
  await page.waitForFunction(() => document.querySelectorAll('svg[data-folio]').length >= 13, null, { timeout: 10000 });
});

after(async () => {
  await context?.close();
});

test('paints every file and folder entry', async () => {
  const all = await entries();
  assert.equal(all.length, 13);
  for (const e of all) {
    assert.ok(e.key, 'entry has a Folio key');
    assert.match(e.bg, /^url\("data:image\/svg\+xml/);
  }
});

test('resolves names, kinds and open state like GitHub shows them', async () => {
  const keys = (await entries()).map((e) => e.key.split('|').slice(2).join('|'));
  assert.deepEqual(keys, [
    'd|0|.github',
    'd|0|guides', // collapsed "docs/guides" chain → last segment
    'f|0|package.json',
    'f|0|README.md',
    'd|0|vendor', // submodule
    'd|1|src',
    'd|0|components',
    'f|0|App.tsx',
    'f|0|Dockerfile', // hashed prc-* class names
    'd|1|tests',
    'f|0|utils.test.ts',
    'd|0|node_modules',
    'f|0|go.mod',
  ]);
});

test('uses the exact icon the shared resolver picks', async () => {
  const bg = await page.$eval('#folder-row-2 svg', (s) => s.style.backgroundImage);
  const expected = folio.fileUri('package.json', 'ink', 'dark');
  assert.equal(folio.fileIconId('package.json'), 'npm');
  assert.ok(bg.includes(expected.slice(0, 200)), 'background matches rendered npm icon');
  assert.equal(folio.folderIconId('.github'), 'github');
  assert.equal(folio.folderIconId('guides'), 'docs');
  assert.equal(folio.fileIconId('utils.test.ts'), 'test-ts');
});

test('hides the original octicon paths without touching the DOM structure', async () => {
  const info = await page.$eval('#folder-row-0 svg', (s) => ({
    children: s.children.length,
    pathVisibility: getComputedStyle(s.querySelector('path')).visibility,
  }));
  assert.equal(info.children, 1);
  assert.equal(info.pathVisibility, 'hidden');
});

test('repaints when a tree item expands (React-style class swap)', async () => {
  await page.evaluate(() => {
    const li = document.getElementById('src/components-item');
    li.setAttribute('aria-expanded', 'true');
    li.querySelector('svg').setAttribute('class', 'octicon octicon-file-directory-open-fill');
  });
  await waitForKey('[id="src/components-item"] svg', '\\|d\\|1\\|components$');
});

test('repaints if the page rewrites an icon\'s style attribute', async () => {
  await page.evaluate(() => document.querySelector('#folder-row-3 svg').setAttribute('style', 'display:inline-block'));
  await page.waitForFunction(() => document.querySelector('#folder-row-3 svg').style.backgroundImage.startsWith('url('));
});

test('paints entries added after load (SPA navigation)', async () => {
  await page.evaluate(() => {
    const row = document.querySelector('#folder-row-3').cloneNode(true);
    row.id = 'folder-row-new';
    const svg = row.querySelector('svg');
    delete svg.dataset.folio;
    svg.removeAttribute('style');
    const a = row.querySelector('a');
    a.title = a.textContent = 'schema.prisma';
    document.querySelector('#react-table tbody').append(row);
  });
  await waitForKey('#folder-row-new svg', '\\|f\\|0\\|schema\\.prisma$');
});

test('popup switches the edition live on open GitHub tabs', async () => {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId(EXT)}/popup.html`);
  await popup.waitForSelector('.edition[data-edition="graphite"]');
  const cards = await popup.$$eval('.edition', (els) => els.map((e) => e.dataset.edition));
  assert.deepEqual(cards, ['ink', 'graphite', 'primary']);
  const previews = await popup.$$eval('.edition img', (imgs) => imgs.filter((i) => i.naturalWidth > 0).length);
  assert.equal(previews, 18);
  await popup.click('.edition[data-edition="graphite"]');
  await waitForKey('#folder-row-2 svg', '^graphite\\|');
  await popup.click('.seg button[data-mode="light"]');
  await popup.click('.edition[data-edition="primary"]');
  await waitForKey('#folder-row-2 svg', '^primary\\|light\\|');
  await popup.click('#folders');
  await page.waitForFunction(() => !document.querySelector('#folder-row-0 svg').dataset.folio);
  await popup.click('.power');
  await page.waitForFunction(() => document.querySelectorAll('svg[data-folio]').length === 0);
  await popup.close();
});
