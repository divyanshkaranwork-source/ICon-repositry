// Lumora SVG renderer — turns a glyph + definition + edition into a crisp
// 32×32 SVG string. Pure string building with no DOM, so the exact same code
// runs in the Node build (VS Code icons) and in the browser (Chrome extension).

import { fileColors, folderColors } from './editions.js';

const num = (v) => +(+v).toFixed(2);

// ─── Shapes on the 32-unit canvas ───────────────────────────────────

// Portrait tile with a folded top-right corner: the Lumora "folio".
const X0 = 3.5, X1 = 28.5, Y0 = 2, Y1 = 30, RAD = 6, FOLD = 8.5;
const TILE =
  `M${X0 + RAD} ${Y0}H${X1 - FOLD}L${X1} ${Y0 + FOLD}V${Y1 - RAD}` +
  `A${RAD} ${RAD} 0 0 1 ${X1 - RAD} ${Y1}H${X0 + RAD}A${RAD} ${RAD} 0 0 1 ${X0} ${Y1 - RAD}` +
  `V${Y0 + RAD}A${RAD} ${RAD} 0 0 1 ${X0 + RAD} ${Y0}z`;
const FOLD_PATH =
  `M${X1 - FOLD} ${Y0}V${Y0 + FOLD - 2.6}Q${X1 - FOLD} ${Y0 + FOLD} ${X1 - FOLD + 2.6} ${Y0 + FOLD}H${X1}z`;

const FOLDER_BACK = 'M3 9a3 3 0 0 1 3-3h6.1a2.6 2.6 0 0 1 1.9.8l1.5 1.7H26a3 3 0 0 1 3 3V24a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z';
const FOLDER_FRONT = 'M3 13.2a2.7 2.7 0 0 1 2.7-2.7h20.6a2.7 2.7 0 0 1 2.7 2.7V24a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z';
const FOLDER_FRONT_OPEN = 'M7.2 13.2h21a1.8 1.8 0 0 1 1.74 2.26L27.4 25a2.8 2.8 0 0 1-2.7 2H5.6a2.5 2.5 0 0 1-2.44-3.04l2.3-9.4A1.8 1.8 0 0 1 7.2 13.2z';
const FOLDER_SHEET = 'M7 9.4a1.6 1.6 0 0 1 1.6-1.6h14.8A1.6 1.6 0 0 1 25 9.4V16H7z';

const STROKE = { tile: 2.35, glyph: 2.05, emblem: 2.8, badge: 3.1 };

// ─── Primitive writers ──────────────────────────────────────────────

const lin = (id, a, b, x1, y1, x2, y2, opA = 1, opB = 1) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
  `<stop offset="0" stop-color="${a}"${opA !== 1 ? ` stop-opacity="${opA}"` : ''}/>` +
  `<stop offset="1" stop-color="${b}"${opB !== 1 ? ` stop-opacity="${opB}"` : ''}/></linearGradient>`;

const sheen = (id, cx, cy, r, op) =>
  `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">` +
  `<stop offset="0" stop-color="#fff" stop-opacity="${op}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;

/** Draw a glyph (list of layers) centered at (cx, cy) with a given box size. */
export function drawGlyph(layers, { cx, cy, size, sw, paint }) {
  const k = size / 24;
  let out = `<g transform="translate(${num(cx - size / 2)} ${num(cy - size / 2)}) scale(${num(k * 1000) / 1000})" stroke-linecap="round" stroke-linejoin="round">`;
  for (const [kind, d, o = {}] of layers) {
    const op = o.o != null && o.o !== 1 ? ` opacity="${o.o}"` : '';
    const tf = o.t ? ` transform="${o.t}"` : '';
    if (kind === 's') {
      out += `<path d="${d}" fill="none" stroke="${paint}" stroke-width="${num(sw * (o.w || 1))}"${op}${tf}/>`;
    } else {
      out += `<path d="${d}" fill="${paint}"${o.e ? ' fill-rule="evenodd"' : ''}${op}${tf}/>`;
    }
  }
  return out + '</g>';
}

const svg = (defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;

// ─── Renderer ───────────────────────────────────────────────────────

/**
 * @param {Record<string, any[]>} glyphTable  glyph name → layers (monograms are
 *   stored under "mono:<TEXT>").
 */
export function createRenderer(glyphTable) {
  const layersOf = (def) => {
    const key = def.mono ? `mono:${def.mono}` : def.glyph;
    const layers = glyphTable[key];
    if (!layers) throw new Error(`Missing glyph "${key}" for ${def.id}`);
    return layers;
  };

  // ── Files ──
  function file(def, edition, mode = 'dark') {
    const layers = layersOf(def);
    const badge = def.badge ? glyphTable[def.badge] : null;
    if (def.badge && !badge) throw new Error(`Missing badge glyph "${def.badge}" for ${def.id}`);
    const col = fileColors(def, edition, mode);
    const isTile = edition === 'aurora' || edition === 'noir' || edition === 'frost';

    let defs = '';
    let body = '';

    const main = isTile
      ? badge
        ? { cx: 14.6, cy: 16.4, size: 15 }
        : { cx: 16, cy: 17.6, size: 17 }
      : badge
        ? { cx: 14.4, cy: 14.4, size: 23 }
        : { cx: 16, cy: 16, size: 27 };

    if (edition === 'aurora') {
      defs += lin('a', col.a, col.b, 4, 2, 28, 30) + sheen('h', 7, 3, 20, col.inkDark ? 0.55 : 0.42);
      defs += `<clipPath id="c"><path d="${TILE}"/></clipPath>`;
      body += `<path d="${TILE}" fill="#000" opacity=".2" transform="translate(0 .9)"/>`;
      body += `<path d="${TILE}" fill="url(#a)"/><path d="${TILE}" fill="url(#h)"/>`;
      body += `<path d="${TILE}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.4" clip-path="url(#c)"/>`;
      body += `<path d="${FOLD_PATH}" fill="#fff" opacity="${col.inkDark ? 0.6 : 0.48}"/>`;
      body += drawGlyph(layers, { ...main, sw: STROKE.tile, paint: col.ink });
    } else if (edition === 'noir') {
      defs += lin('a', col.a, col.b, 4, 2, 28, 30) + lin('r', col.rimA, col.rimB, 4, 2, 28, 30, 1, 0.35);
      defs += lin('i', col.inkA, col.inkB, 0, 0, 24, 24) + sheen('h', 8, 3, 18, 0.12);
      defs += `<clipPath id="c"><path d="${TILE}"/></clipPath>`;
      body += `<path d="${TILE}" fill="url(#a)"/><path d="${TILE}" fill="url(#h)"/>`;
      body += `<path d="${TILE}" fill="none" stroke="url(#r)" stroke-width="2" clip-path="url(#c)"/>`;
      body += `<path d="${FOLD_PATH}" fill="${col.rimA}" opacity=".55"/>`;
      body += drawGlyph(layers, { ...main, sw: STROKE.tile, paint: 'url(#i)' });
    } else if (edition === 'frost') {
      defs += lin('a', col.a, col.b, 4, 2, 28, 30) + sheen('h', 7, 3, 16, 0.7);
      defs += `<clipPath id="c"><path d="${TILE}"/></clipPath>`;
      body += `<path d="${TILE}" fill="${col.rim}" opacity=".22" transform="translate(0 .8)"/>`;
      body += `<path d="${TILE}" fill="url(#a)"/><path d="${TILE}" fill="url(#h)"/>`;
      body += `<path d="${TILE}" fill="none" stroke="${col.rim}" stroke-opacity=".55" stroke-width="1.3" clip-path="url(#c)"/>`;
      body += `<path d="${FOLD_PATH}" fill="#fff" opacity=".9"/>`;
      body += drawGlyph(layers, { ...main, sw: STROKE.tile, paint: col.ink });
    } else if (edition === 'halo') {
      defs += lin('i', col.inkA, col.inkB, 0, 0, 24, 24) + lin('b', col.inkA, col.inkB, 2, 2, 30, 30);
      const halo = badge ? 'M14.4 2.6a11.8 11.8 0 1 0 0 23.6 11.8 11.8 0 1 0 0-23.6z' : 'M16 2a14 14 0 1 0 0 28 14 14 0 1 0 0-28z';
      body += `<path d="${halo}" fill="url(#b)" opacity="${mode === 'light' ? 0.13 : 0.16}"/>`;
      body += drawGlyph(layers, { ...main, size: main.size - 4, sw: STROKE.glyph + 0.15, paint: 'url(#i)' });
    } else {
      defs += lin('i', col.inkA, col.inkB, 0, 0, 24, 24);
      body += drawGlyph(layers, { ...main, sw: STROKE.glyph, paint: 'url(#i)' });
    }

    if (badge) body += drawBadge(badge, def, edition, mode, col);
    return svg(defs, body);
  }

  function drawBadge(layers, def, edition, mode, col) {
    const cx = 25, cy = 25, r = 6.2;
    let bg, ink, ring;
    if (edition === 'aurora') {
      bg = '#fff';
      ink = col.inkDark ? col.ink : col.b;
      ring = col.b;
    } else if (edition === 'noir') {
      bg = col.b;
      ink = col.inkA;
      ring = col.rimA;
    } else if (edition === 'frost') {
      bg = col.ink;
      ink = '#fff';
      ring = '#fff';
    } else {
      bg = col.inkB;
      ink = mode === 'light' ? '#fff' : '#0f1014';
      ring = null;
    }
    let out = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${bg}"${ring ? ` stroke="${ring}" stroke-width="1.2"` : ''}/>`;
    out += drawGlyph(layers, { cx, cy, size: 8.4, sw: STROKE.badge, paint: ink });
    return out;
  }

  // ── Folders ──
  function folder(def, edition, { open = false, mode = 'dark' } = {}) {
    const col = folderColors(def, edition, mode);
    const layers = def.glyph || def.mono ? layersOf(def) : null;
    const front = open ? FOLDER_FRONT_OPEN : FOLDER_FRONT;
    const emblem = open ? { cx: 16.6, cy: 20.3, size: 12.4 } : { cx: 16, cy: 18.9, size: 13.6 };
    let defs = lin('k', col.back[0], col.back[1], 3, 6, 29, 27) + lin('f', col.front[0], col.front[1], 3, 10, 29, 27);
    let body = '';

    if (edition !== 'noir') body += `<path d="${FOLDER_BACK}" fill="#000" opacity="${edition === 'frost' ? 0.08 : 0.18}" transform="translate(0 .9)"/>`;
    body += `<path d="${FOLDER_BACK}" fill="url(#k)"/>`;
    if (edition === 'noir') {
      defs += lin('r', col.rimA, col.rimB, 3, 10, 29, 27, 1, 0.3) + lin('i', col.inkA, col.inkB, 0, 0, 24, 24);
      body += `<path d="M5 6.6h7.2l2 2.2" fill="none" stroke="${col.rimA}" stroke-opacity=".7" stroke-width="1" stroke-linecap="round"/>`;
    }
    if (open) body += `<path d="${FOLDER_SHEET}" fill="${col.sheet}" opacity="${edition === 'noir' ? 0.5 : 0.92}"/>`;
    body += `<path d="${front}" fill="url(#f)"/>`;

    if (edition === 'noir') {
      defs += `<clipPath id="c"><path d="${front}"/></clipPath>`;
      body += `<path d="${front}" fill="none" stroke="url(#r)" stroke-width="2" clip-path="url(#c)"/>`;
    } else {
      defs += sheen('h', 7, 10, 18, edition === 'frost' ? 0.8 : 0.38);
      defs += `<clipPath id="c"><path d="${front}"/></clipPath>`;
      body += `<path d="${front}" fill="url(#h)"/>`;
      body += `<path d="${front}" fill="none" stroke="${edition === 'frost' ? col.rim : '#fff'}" stroke-opacity="${edition === 'frost' ? 0.6 : 0.3}" stroke-width="1.3" clip-path="url(#c)"/>`;
    }

    if (layers) {
      const paint = edition === 'noir' ? 'url(#i)' : col.ink;
      body += drawGlyph(layers, { ...emblem, sw: STROKE.emblem, paint });
    }
    return svg(defs, body);
  }

  return { file, folder };
}
