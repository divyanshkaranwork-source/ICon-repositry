// Folio SVG renderer. Flat two-tone pictograms on a 16×16 canvas, with true
// negative space: a knockout layer masks out everything drawn before it.
// Pure string building, so the same code runs in the Node build (VS Code) and
// in the browser (Chrome extension, gallery).

import { fileColors, folderColors } from './editions.js';

const num = (v) => +(+v).toFixed(3);

const FOLDER_BACK = 'M1 3.5A1.5 1.5 0 0 1 2.5 2h3.9a1.3 1.3 0 0 1 .95.42L8.8 4H13.5A1.5 1.5 0 0 1 15 5.5V13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13z';
const FOLDER_FRONT = 'M1 6.4A1.2 1.2 0 0 1 2.2 5.2h11.6A1.2 1.2 0 0 1 15 6.4V13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13z';
const FOLDER_FRONT_OPEN = 'M3.1 6.6h11.6a.9.9 0 0 1 .87 1.12L14 13.4a1.5 1.5 0 0 1-1.45 1.1H2.2a1.1 1.1 0 0 1-1.08-1.3l1.12-5.9A.9.9 0 0 1 3.1 6.6z';
// Cut slightly larger than the front panel so it reads as a separate sheet.
const FOLDER_FRONT_GAP = 'M.3 5.9A1.5 1.5 0 0 1 1.8 4.4h12.4a1.5 1.5 0 0 1 1.5 1.5V16H.3z';
const FOLDER_OPEN_GAP = 'M2.5 5.8h12.9a1 1 0 0 1 .97 1.24L14.6 16H-.2l1.6-9.3A1.1 1.1 0 0 1 2.5 5.8z';

/** Compose a transform for a glyph placed at (cx, cy) with a box `size` (16 = native). */
const place = (cx, cy, size) => (size === 16 && cx === 8 && cy === 8 ? '' : `translate(${num(cx - size / 2)} ${num(cy - size / 2)}) scale(${num(size / 16)})`);
const withTf = (layers, tf) => (tf ? layers.map(([k, d, o = {}]) => [k, d, { ...o, tf: o.tf ? `${tf} ${o.tf}` : tf }]) : layers);

/** Turn a glyph into an emblem cut out of whatever sits beneath it. */
const invert = (layers, refill) =>
  layers.map(([k, d, o = {}]) => {
    if (k === 'f') return ['k', d, o];
    if (k === 's') return ['ks', d, o];
    if (k === 'k') return ['f', d, { ...o, paint: refill }];
    return ['s', d, { ...o, paint: refill }];
  });

/**
 * Render layers into SVG markup. Consecutive knockouts become one mask that is
 * applied to everything drawn so far.
 */
function compose(layers, colors, idPrefix) {
  let acc = '';
  let defs = '';
  let n = 0;
  const attrs = (o) => (o.tf ? ` transform="${o.tf}"` : '');
  for (let i = 0; i < layers.length; ) {
    const [kind, d, o = {}] = layers[i];
    if (kind === 'k' || kind === 'ks') {
      let cut = '';
      while (i < layers.length && (layers[i][0] === 'k' || layers[i][0] === 'ks')) {
        const [kk, dd, oo = {}] = layers[i];
        cut +=
          kk === 'k'
            ? `<path d="${dd}" fill="#000"${oo.e ? ' fill-rule="evenodd"' : ''}${attrs(oo)}/>`
            : `<path d="${dd}" fill="none" stroke="#000" stroke-width="${oo.w}" stroke-linecap="round" stroke-linejoin="round"${attrs(oo)}/>`;
        i++;
      }
      const id = `${idPrefix}${n++}`;
      defs += `<mask id="${id}" maskUnits="userSpaceOnUse" x="-2" y="-2" width="20" height="20"><rect x="-2" y="-2" width="20" height="20" fill="#fff"/>${cut}</mask>`;
      acc = `<g mask="url(#${id})">${acc}</g>`;
      continue;
    }
    const paint = o.paint || (o.t2 ? colors.soft : colors.main);
    if (kind === 's') {
      const cap = o.cap === 'butt' ? 'butt' : 'round';
      const join = o.cap === 'butt' ? 'miter' : 'round';
      acc += `<path d="${d}" fill="none" stroke="${paint}" stroke-width="${o.w}" stroke-linecap="${cap}" stroke-linejoin="${join}"${attrs(o)}/>`;
    } else {
      acc += `<path d="${d}" fill="${paint}"${o.e ? ' fill-rule="evenodd"' : ''}${attrs(o)}/>`;
    }
    i++;
  }
  return { defs, body: acc };
}

const svg = ({ defs, body }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;

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

  function file(def, edition, mode = 'dark') {
    const colors = fileColors(def, edition, mode);
    let layers = layersOf(def);
    if (def.badge) {
      const badge = glyphTable[def.badge];
      if (!badge) throw new Error(`Missing badge glyph "${def.badge}" for ${def.id}`);
      // Main glyph shrinks toward the top-left; a ring is cut out for the badge.
      layers = [
        ...withTf(layers, 'scale(0.8)'),
        ['k', 'M12.2 7.4a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 1 0 0-9.6z', {}],
        ...withTf(badge, place(12.2, 12.2, 7.2)),
      ];
    }
    return svg(compose(layers, colors, 'm'));
  }

  function folder(def, edition, { open = false, mode = 'dark' } = {}) {
    const c = folderColors(def, edition, mode);
    const colors = { main: c.front, soft: c.back };
    const layers = [
      ['f', FOLDER_BACK, { t2: 1 }],
      ['k', open ? FOLDER_OPEN_GAP : FOLDER_FRONT_GAP, {}],
      ['f', open ? FOLDER_FRONT_OPEN : FOLDER_FRONT, {}],
    ];
    if (def.glyph || def.mono) {
      const at = open ? place(8.4, 10.6, 7) : place(8, 9.9, 7.4);
      layers.push(...invert(withTf(layersOf(def), at), c.front));
    }
    return svg(compose(layers, colors, 'm'));
  }

  return { file, folder };
}
