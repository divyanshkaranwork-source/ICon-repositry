// Renders the README showcase images into assets/. Needs Playwright's Chromium.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createLumora } from '../src/runtime/lumora.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/runtime-data.json'), 'utf8'));
const lumora = createLumora(data);
fs.mkdirSync(OUT, { recursive: true });

const TREE = [
  ['root', 'lumora-app', 0, true], ['dir', '.github', 1, false], ['dir', 'src', 1, true], ['dir', 'components', 2, true],
  ['file', 'Button.tsx', 3], ['file', 'Button.test.tsx', 3], ['file', 'Button.stories.tsx', 3], ['dir', 'hooks', 2, false],
  ['dir', 'api', 2, false], ['dir', 'assets', 2, false], ['file', 'App.tsx', 2], ['file', 'main.ts', 2], ['dir', 'docs', 1, false],
  ['dir', 'node_modules', 1, false], ['file', '.env.local', 1], ['file', '.gitignore', 1], ['file', 'CLAUDE.md', 1],
  ['file', 'Dockerfile', 1], ['file', 'package.json', 1], ['file', 'README.md', 1], ['file', 'tsconfig.json', 1], ['file', 'vite.config.ts', 1],
];
const WALL = [
  ['d', 'src', 1], ['d', 'components'], ['d', 'assets'], ['d', 'admin'], ['f', 'index.ts'], ['f', 'App.tsx'], ['f', 'main.py'],
  ['f', 'lib.rs'], ['f', 'server.go'], ['f', 'Main.java'], ['f', 'schema.graphql'], ['f', 'schema.prisma'], ['f', 'Dockerfile'],
  ['f', 'package.json'], ['f', 'README.md'], ['f', 'hero.png'], ['f', 'theme.scss'], ['f', 'CLAUDE.md'],
];

const css = `
  @font-face { font-family: U; src: url('file://${path.join(ROOT, 'docs/fonts/unbounded-700.woff2')}'); }
  * { box-sizing: border-box; }
  body { margin: 0; background: #07070d; color: #eceaff; font: 13px system-ui, -apple-system, 'Segoe UI', sans-serif; position: relative; overflow: hidden; }
  .glow { position: absolute; border-radius: 50%; filter: blur(90px); opacity: .55; }
  h3 { font: 700 14px U, system-ui; margin: 0; letter-spacing: .02em; }
  small { color: #8e8cb3; font-size: 11.5px; }
`;
const glows = `<i class="glow" style="width:620px;height:620px;background:#5d4dff;top:-320px;left:-120px"></i>
  <i class="glow" style="width:520px;height:520px;background:#ff5fa8;top:-160px;right:-200px;opacity:.35"></i>
  <i class="glow" style="width:520px;height:520px;background:#22c8ff;bottom:-380px;left:40%;opacity:.25"></i>`;

function editionsHtml() {
  const panes = lumora.editions.map((ed) => {
    const rows = TREE.map(([kind, name, depth, open]) => {
      const src = kind === 'file' ? lumora.fileUri(name, ed.id, 'dark') : lumora.folderUri(name, { edition: ed.id, mode: 'dark', open, root: kind === 'root' });
      const chev = kind === 'file' ? '' : open ? '▾' : '▸';
      const style = kind === 'root' ? 'font-weight:700;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#eceaff' : '';
      return `<li style="padding-left:${8 + depth * 13}px;${style}"><span class="c">${chev}</span><img src="${src}" width="16" height="16">${name}</li>`;
    }).join('');
    return `<section><header><h3>${ed.name}</h3><small>${ed.tagline}</small></header><ul>${rows}</ul></section>`;
  }).join('');
  return `<html><head><style>${css}
    .wrap { position: relative; display: flex; gap: 14px; padding: 28px; }
    section { width: 236px; border: 1px solid rgba(255,255,255,.08); border-radius: 18px; background: rgba(14,14,26,.72); backdrop-filter: blur(20px); overflow: hidden; }
    header { padding: 14px 14px 10px; border-bottom: 1px solid rgba(255,255,255,.07); display: grid; gap: 4px; }
    ul { list-style: none; margin: 0; padding: 8px 0 12px; }
    li { display: flex; align-items: center; gap: 6px; height: 22px; color: #b4b2d6; white-space: nowrap; }
    .c { width: 9px; font-size: 9px; color: #5f5d85; text-align: center; }
  </style></head><body>${glows}<div class="wrap">${panes}</div></body></html>`;
}

function wallHtml() {
  const rows = lumora.editions.map((ed) => {
    const icons = WALL.map(([k, n, open]) => {
      const src = k === 'f' ? lumora.fileUri(n, ed.id, 'dark') : lumora.folderUri(n, { edition: ed.id, mode: 'dark', open: !!open });
      return `<img src="${src}" width="48" height="48">`;
    }).join('');
    return `<div class="row"><div class="label"><h3>${ed.name}</h3><small>${ed.tagline}</small></div><div class="icons">${icons}</div></div>`;
  }).join('');
  return `<html><head><style>${css}
    .wrap { position: relative; padding: 30px 34px; display: grid; gap: 10px; }
    .row { display: flex; align-items: center; gap: 24px; padding: 14px 20px; border-radius: 20px; background: rgba(14,14,26,.6); border: 1px solid rgba(255,255,255,.07); }
    .label { width: 190px; display: grid; gap: 4px; }
    .icons { display: flex; gap: 14px; }
    img { filter: drop-shadow(0 8px 14px rgba(0,0,0,.35)); }
  </style></head><body>${glows}<div class="wrap">${rows}</div></body></html>`;
}

const extensionId = (dir) =>
  [...crypto.createHash('sha256').update(fs.realpathSync(dir)).digest('hex').slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join('');

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });

await page.setViewportSize({ width: 1308, height: 640 });
await page.setContent(editionsHtml());
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(OUT, 'preview-editions.png') });

await page.setViewportSize({ width: 1418, height: 480 });
await page.setContent(wallHtml());
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(OUT, 'preview-wall.png') });

await page.emulateMedia({ colorScheme: 'dark' });
await page.setViewportSize({ width: 1280, height: 860 });
await page.goto('file://' + path.join(ROOT, 'docs/index.html'));
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT, 'preview-gallery.png') });
await browser.close();

// The popup needs the real extension.
const EXT = path.join(ROOT, 'extensions/chrome');
const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'lumora-')), {
  headless: true,
  channel: 'chromium',
  deviceScaleFactor: 2,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
});
const pop = await ctx.newPage();
await pop.setViewportSize({ width: 368, height: 300 });
await pop.goto(`chrome-extension://${extensionId(EXT)}/popup.html`);
await pop.waitForTimeout(600);
const h = await pop.evaluate(() => Math.ceil(document.querySelector('.shell').getBoundingClientRect().height));
await pop.setViewportSize({ width: 368, height: h });
await pop.waitForTimeout(200);
await pop.screenshot({ path: path.join(OUT, 'preview-popup.png') });
await ctx.close();
console.log('✦ previews written to assets/');
