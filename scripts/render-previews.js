// Renders the README showcase images into assets/. Needs Playwright's Chromium.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createFolio } from '../src/runtime/folio.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/runtime-data.json'), 'utf8'));
const folio = createFolio(data);
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, f));

const TREE = [
  ['root', 'my-app', 0, true], ['dir', '.github', 1, false], ['dir', 'src', 1, true], ['dir', 'components', 2, true],
  ['file', 'Button.tsx', 3], ['file', 'Button.test.tsx', 3], ['file', 'Button.stories.tsx', 3], ['dir', 'hooks', 2, false],
  ['dir', 'api', 2, false], ['dir', 'assets', 2, false], ['file', 'App.tsx', 2], ['file', 'main.ts', 2], ['dir', 'docs', 1, false],
  ['dir', 'node_modules', 1, false], ['file', '.env.local', 1], ['file', '.gitignore', 1], ['file', 'Dockerfile', 1],
  ['file', 'package.json', 1], ['file', 'README.md', 1], ['file', 'tsconfig.json', 1], ['file', 'vite.config.ts', 1],
];
const WALL = [
  ['d', 'src', 1], ['d', 'components'], ['d', 'tests'], ['d', 'admin'], ['f', 'index.ts'], ['f', 'App.tsx'], ['f', 'main.py'],
  ['f', 'lib.rs'], ['f', 'server.go'], ['f', 'Main.java'], ['f', 'schema.graphql'], ['f', 'query.sql'], ['f', 'Dockerfile'],
  ['f', 'package.json'], ['f', 'README.md'], ['f', 'hero.png'], ['f', 'theme.scss'], ['f', '.env'],
];

const font = (name, file, weight) => `@font-face { font-family: '${name}'; src: url('file://${path.join(ROOT, 'docs/fonts', file)}'); font-weight: ${weight}; }`;
const CANVAS = {
  light: { paper: '#f2efe8', ink: '#1b1a17', muted: '#6f6a60', rule: '#d6d0c4' },
  dark: { paper: '#141311', ink: '#e9e5dc', muted: '#948e82', rule: '#2c2a26' },
};
const css = (c) => `
  ${font('Plex Sans', 'plex-sans-400.woff2', 400)} ${font('Plex Sans', 'plex-sans-500.woff2', 500)} ${font('Plex Mono', 'plex-mono-400.woff2', 400)}
  * { box-sizing: border-box; }
  body { margin: 0; background: ${c.paper}; color: ${c.ink}; font: 13px 'Plex Sans', system-ui, sans-serif; }
  .label { font: 11px 'Plex Mono', monospace; letter-spacing: .06em; text-transform: uppercase; color: ${c.muted}; }
`;

function editionsHtml(mode) {
  const c = CANVAS[mode];
  const panes = folio.editions.map((ed) => {
    const rows = TREE.map(([kind, name, depth, open]) => {
      const src = kind === 'file' ? folio.fileUri(name, ed.id, mode) : folio.folderUri(name, { edition: ed.id, mode, open, root: kind === 'root' });
      const chev = kind === 'file' ? '' : open ? '▾' : '▸';
      const style = kind === 'root' ? 'font-weight:500;font-size:11px;letter-spacing:.06em;text-transform:uppercase' : '';
      return `<li style="padding-left:${10 + depth * 14}px;${style}"><span class="c">${chev}</span><img src="${src}" width="16" height="16">${name}</li>`;
    }).join('');
    return `<section><header><b>${ed.name}</b><span class="label">${ed.tagline}</span></header><ul>${rows}</ul></section>`;
  }).join('');
  return `<html><head><style>${css(c)}
    .wrap { display: grid; grid-template-columns: repeat(3, 1fr); padding: 28px; gap: 0; }
    section { border-top: 1px solid ${c.ink}; border-right: 1px solid ${c.rule}; padding: 0 16px; }
    section:first-child { padding-left: 0; }
    section:last-child { border-right: 0; }
    header { display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0 8px; border-bottom: 1px solid ${c.rule}; }
    header b { font-weight: 500; font-size: 15px; }
    ul { list-style: none; margin: 0; padding: 8px 0 0; }
    li { display: flex; align-items: center; gap: 6px; height: 22px; white-space: nowrap; }
    .c { width: 9px; font-size: 9px; color: ${c.muted}; text-align: center; }
  </style></head><body><div class="wrap">${panes}</div></body></html>`;
}

function wallHtml() {
  const rows = ['dark', 'light'].flatMap((mode) =>
    folio.editions.map((ed) => {
      const c = CANVAS[mode];
      const icons = WALL.map(([k, n, open]) => {
        const src = k === 'f' ? folio.fileUri(n, ed.id, mode) : folio.folderUri(n, { edition: ed.id, mode, open: !!open });
        return `<img src="${src}" width="40" height="40">`;
      }).join('');
      return `<div class="row" style="background:${c.paper};color:${c.ink};border-color:${c.rule}"><div class="name">${ed.name}<span class="label" style="color:${c.muted}">${mode === 'dark' ? 'Dark' : 'Light'}</span></div><div class="icons">${icons}</div></div>`;
    }),
  ).join('');
  return `<html><head><style>${css(CANVAS.light)}
    .wrap { padding: 0; }
    .row { display: flex; align-items: center; gap: 28px; padding: 18px 28px; border-bottom: 1px solid; }
    .name { width: 120px; display: grid; gap: 4px; font-weight: 500; font-size: 15px; }
    .icons { display: flex; gap: 18px; }
  </style></head><body><div class="wrap">${rows}</div></body></html>`;
}

const extensionId = (dir) =>
  [...crypto.createHash('sha256').update(fs.realpathSync(dir)).digest('hex').slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join('');

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });

for (const mode of ['dark', 'light']) {
  await page.setViewportSize({ width: 960, height: 560 });
  await page.setContent(editionsHtml(mode));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `preview-explorer-${mode}.png`) });
}

await page.setViewportSize({ width: 1270, height: 456 });
await page.setContent(wallHtml());
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(OUT, 'preview-editions.png'), fullPage: true });

await page.emulateMedia({ colorScheme: 'light' });
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('file://' + path.join(ROOT, 'docs/index.html'));
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT, 'preview-index.png') });
await browser.close();

// The popup needs the real extension.
const EXT = path.join(ROOT, 'extensions/chrome');
const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'folio-')), {
  headless: true,
  channel: 'chromium',
  deviceScaleFactor: 2,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
});
const pop = await ctx.newPage();
await pop.emulateMedia({ colorScheme: 'light' });
await pop.setViewportSize({ width: 340, height: 300 });
await pop.goto(`chrome-extension://${extensionId(EXT)}/popup.html`);
await pop.waitForTimeout(600);
const h = await pop.evaluate(() => Math.ceil(document.querySelector('.sheet').getBoundingClientRect().height));
await pop.setViewportSize({ width: 340, height: h });
await pop.waitForTimeout(200);
await pop.screenshot({ path: path.join(OUT, 'preview-popup.png') });
await ctx.close();
console.log('Previews written to assets/');
