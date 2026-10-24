// Dev tool: large labelled grid for one edition. node scripts/dev/zoom-sheet.js <out> <edition> <size> [start] [count] [folder]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { glyphs } from '../../src/core/glyphs.js';
import { createRenderer } from '../../src/core/render.js';
import { buildGlyphTable } from '../lib/monogram.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [out, ed = 'aurora', size = '56', start = '0', count = '200', kind = 'file'] = process.argv.slice(2);
const table = buildGlyphTable(glyphs, ['TS', 'JS', 'Py', 'C#']);
const r = createRenderer(table);
const uri = (s) => 'data:image/svg+xml;utf8,' + encodeURIComponent(s);
const names = Object.keys(table).slice(+start, +start + +count);
const hues = [255, 85, 150, 330, 25, 200, 290, 50];
let html = `<html><body style="margin:0;background:#1e1f26;color:#999;font:10px system-ui;display:flex;flex-wrap:wrap;padding:8px;width:1180px">`;
names.forEach((name, i) => {
  const def = { id: name, hue: hues[i % 8], ...(name.startsWith('mono:') ? { mono: name.slice(5) } : { glyph: name }) };
  const svg = kind === 'folder' ? r.folder(def, ed, { open: i % 2 === 1 }) : r.file(def, ed);
  html += `<div style="width:${+size + 26}px;text-align:center;margin:3px"><img width="${size}" height="${size}" src="${uri(svg)}"><br>${name}</div>`;
});
fs.writeFileSync(path.join(out, 'zoom.html'), html + '</body></html>');
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1200, height: 600 } });
await pg.goto('file://' + path.join(out, 'zoom.html'));
await pg.screenshot({ path: path.join(out, `zoom-${ed}-${kind}-${start}.png`), fullPage: true });
await b.close();
