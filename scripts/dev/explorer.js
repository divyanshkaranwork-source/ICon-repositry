// Dev tool: renders the gallery explorer tree for every edition at 2x DPR.
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [out, canvas = 'dark', dpr = '2'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 760 }, deviceScaleFactor: +dpr });
await p.goto('file://' + path.resolve('docs/index.html'));
await p.waitForTimeout(300);
await p.evaluate((canvas) => {
  document.querySelector(`#canvas button[data-canvas=${canvas}]`).click();
}, canvas);
const panes = [];
for (const ed of ['Aurora', 'Noir', 'Frost', 'Halo', 'Gilded']) {
  await p.evaluate((ed) => [...document.querySelectorAll('.chip')].find((c) => c.textContent.includes(ed)).click(), ed);
  await p.waitForTimeout(150);
  panes.push(await p.evaluate(() => document.querySelector('.tree').outerHTML));
}
await p.setContent(`<html><head><link rel="stylesheet" href="file://${path.resolve('docs/gallery.css')}"></head><body data-canvas="${canvas}" style="display:flex;gap:8px;padding:10px">` + panes.map((h) => `<div class="pane" style="width:270px">${h}</div>`).join('') + '</body></html>');
await p.waitForTimeout(300);
await p.screenshot({ path: out, fullPage: true });
await b.close();
