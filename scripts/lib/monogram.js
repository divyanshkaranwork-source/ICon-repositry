// Compiles short monograms ("TS", "Py", "C#") into vector paths on the 24-unit
// glyph grid using the Unbounded typeface, so icons never depend on fonts
// installed on the viewer's machine.

import fs from 'node:fs';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';

const require = createRequire(import.meta.url);
const FONT_FILE = require.resolve('@expo-google-fonts/unbounded/700Bold/Unbounded_700Bold.ttf');

let font;
function loadFont() {
  if (!font) {
    const buf = fs.readFileSync(FONT_FILE);
    font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return font;
}

// Max box (w, h) on the 24 grid by character count.
const BOX = { 1: [15, 15], 2: [21, 12.6], 3: [22, 10.6], 4: [22.4, 8.8] };

function layout(text) {
  const f = loadFont();
  const size = 100;
  const scale = size / f.unitsPerEm;
  const cmds = [];
  let x = 0;
  let prev = null;
  for (const ch of text) {
    const g = f.charToGlyph(ch);
    if (prev) x += (f.getKerningValue(prev, g) || 0) * scale;
    // Letter-spacing tuned for tiny sizes: open the counters slightly.
    cmds.push(...g.getPath(x, 0, size).commands);
    x += g.advanceWidth * scale + (text.length > 1 ? 2.5 : 0);
    prev = g;
  }
  return cmds;
}

function bbox(cmds) {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const c of cmds) {
    for (const [kx, ky] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) {
      if (c[kx] !== undefined) {
        x1 = Math.min(x1, c[kx]);
        x2 = Math.max(x2, c[kx]);
        y1 = Math.min(y1, c[ky]);
        y2 = Math.max(y2, c[ky]);
      }
    }
  }
  return { x1, y1, x2, y2 };
}

/** @returns {string} SVG path data on the 24 grid, centered at (12, 12). */
export function monogramPath(text) {
  const cmds = layout(text);
  const bb = bbox(cmds);
  const w = bb.x2 - bb.x1;
  const h = bb.y2 - bb.y1;
  const [mw, mh] = BOX[Math.min(4, [...text].length)];
  const k = Math.min(mw / w, mh / h);
  const tx = 12 - (bb.x1 + w / 2) * k;
  const ty = 12 - (bb.y1 + h / 2) * k;
  const X = (v) => +(v * k + tx).toFixed(2);
  const Y = (v) => +(v * k + ty).toFixed(2);
  return cmds
    .map((c) => {
      switch (c.type) {
        case 'M':
        case 'L':
          return `${c.type}${X(c.x)} ${Y(c.y)}`;
        case 'Q':
          return `Q${X(c.x1)} ${Y(c.y1)} ${X(c.x)} ${Y(c.y)}`;
        case 'C':
          return `C${X(c.x1)} ${Y(c.y1)} ${X(c.x2)} ${Y(c.y2)} ${X(c.x)} ${Y(c.y)}`;
        default:
          return 'Z';
      }
    })
    .join('');
}

/** Build the full glyph table: hand-drawn glyphs + compiled monograms. */
export function buildGlyphTable(glyphs, monograms) {
  const table = { ...glyphs };
  for (const text of monograms) table[`mono:${text}`] = [['f', monogramPath(text), {}]];
  return table;
}
