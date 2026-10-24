// Compiles short monograms ("TS", "PY", "C#") into vector paths on the 16-unit
// glyph grid using IBM Plex Sans Condensed Bold, so icons never depend on fonts
// installed on the viewer's machine.

import fs from 'node:fs';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';

const require = createRequire(import.meta.url);
const FONT_FILE = require.resolve('@expo-google-fonts/ibm-plex-sans-condensed/700Bold/IBMPlexSansCondensed_700Bold.ttf');

let font;
function loadFont() {
  if (!font) {
    const buf = fs.readFileSync(FONT_FILE);
    font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return font;
}

// Max box (w, h) on the 16 grid by character count. Cap height drives the size,
// so one- and two-letter marks share the same optical weight.
const BOX = { 1: [12, 10.6], 2: [15, 10], 3: [15.6, 8] };

function layout(text) {
  const f = loadFont();
  const scale = 100 / f.unitsPerEm;
  const cmds = [];
  let x = 0;
  let prev = null;
  for (const ch of text) {
    const g = f.charToGlyph(ch);
    if (prev) x += (f.getKerningValue(prev, g) || 0) * scale;
    cmds.push(...g.getPath(x, 0, 100).commands);
    // A touch of tracking keeps counters open at 16px.
    x += g.advanceWidth * scale + 3;
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

/** @returns {string} SVG path data on the 16 grid, centered at (8, 8). */
export function monogramPath(text) {
  const cmds = layout(text);
  const bb = bbox(cmds);
  const w = bb.x2 - bb.x1;
  const h = bb.y2 - bb.y1;
  const [mw, mh] = BOX[Math.min(3, [...text].length)];
  const k = Math.min(mw / w, mh / h);
  const tx = 8 - (bb.x1 + w / 2) * k;
  const ty = 8 - (bb.y1 + h / 2) * k;
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
  for (const text of monograms) {
    if ([...text].length > 3) throw new Error(`Monogram "${text}" is longer than 3 characters`);
    table[`mono:${text}`] = [['f', monogramPath(text), {}]];
  }
  return table;
}
