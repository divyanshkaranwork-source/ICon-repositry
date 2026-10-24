// Dev tool: renders every glyph in every edition to a PNG contact sheet.
// Usage: node scripts/dev/contact-sheet.js <out-dir> [scale]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { glyphs } from '../../src/core/glyphs.js';
import { createRenderer } from '../../src/core/render.js';
import { EDITION_IDS } from '../../src/core/editions.js';
import { buildGlyphTable } from '../lib/monogram.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const out = process.argv[2];
const monos = ['TS', 'JS', 'Py', 'Rs', 'Go', 'C#', 'PHP', 'Kt'];
const table = buildGlyphTable(glyphs, monos);
const r = createRenderer(table);
const uri = (s) => 'data:image/svg+xml;utf8,' + encodeURIComponent(s);
const names = [...Object.keys(glyphs), ...monos.map((m) => 'mono:' + m)];
const hues = [255, 85, 150, 330, 25, 200, 290, 50];

let html = `<html><body style="margin:0;font:11px system-ui">`;
for (const bg of ['#1e1f26', '#f6f7fb']) {
  const mode = bg === '#f6f7fb' ? 'light' : 'dark';
  html += `<div style="background:${bg};padding:10px;color:${mode === 'dark' ? '#aaa' : '#555'}">`;
  for (const ed of EDITION_IDS) {
    html += `<div style="margin:4px 0">${ed} (${mode})<br>`;
    names.forEach((name, i) => {
      const def = { id: name, hue: hues[i % hues.length], ...(name.startsWith('mono:') ? { mono: name.slice(5) } : { glyph: name }) };
      html += `<img title="${name}" width="32" height="32" style="margin:2px" src="${uri(r.file(def, ed, mode))}">`;
    });
    html += '<br>';
    names.slice(0, 40).forEach((name, i) => {
      const def = { id: name, hue: hues[i % hues.length], glyph: name.startsWith('mono:') ? undefined : name };
      html += `<img width="16" height="16" style="margin:2px" src="${uri(r.folder(def, ed, { mode, open: i % 3 === 0 }))}">`;
    });
    html += '</div>';
  }
  html += '</div>';
}
html += '</body></html>';
fs.writeFileSync(path.join(out, 'sheet.html'), html);
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1500, height: 800 }, deviceScaleFactor: +(process.argv[3] || 1) });
await pg.goto('file://' + path.join(out, 'sheet.html'));
await pg.screenshot({ path: path.join(out, 'sheet.png'), fullPage: true });
await b.close();
console.log('ok');
