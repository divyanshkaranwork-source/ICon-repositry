// Assembles everything the renderers need: glyph table (with compiled
// monograms) and the icon definitions, and validates every reference.

import { glyphs } from '../../src/core/glyphs.js';
import { FILE_ICONS, DEFAULT_FILE, fileMonograms } from '../../src/core/files.js';
import { FOLDER_ICONS, DEFAULT_FOLDER, ROOT_FOLDER, folderMonograms } from '../../src/core/folders.js';
import { buildManifest } from '../../src/core/manifest.js';
import { buildGlyphTable } from './monogram.js';

const pick = ({ id, glyph, mono, hue, hue2, chroma, badge }) =>
  Object.fromEntries(Object.entries({ id, glyph, mono, hue, hue2, chroma, badge }).filter(([, v]) => v !== undefined));

export function loadData() {
  const monos = [...new Set([...fileMonograms(), ...folderMonograms()])];
  const table = buildGlyphTable(glyphs, monos);

  const files = [DEFAULT_FILE, ...FILE_ICONS].map(pick);
  const folders = [DEFAULT_FOLDER, ROOT_FOLDER, ...FOLDER_ICONS].map(pick);

  for (const d of [...files, ...folders]) {
    const key = d.mono ? `mono:${d.mono}` : d.glyph;
    if (key && !table[key]) throw new Error(`Icon ${d.id} references missing glyph ${key}`);
    if (d.badge && !table[d.badge]) throw new Error(`Icon ${d.id} references missing badge ${d.badge}`);
  }

  const manifest = buildManifest({ strict: true });
  return { table, files, folders, manifest, monos };
}

/** Compact data for the browser runtime (folder names are expanded lazily there). */
export function runtimeData({ table, files, folders, manifest }) {
  const rawFolderNames = {};
  for (const f of FOLDER_ICONS) for (const n of f.names) rawFolderNames[n.toLowerCase()] = f.id;
  // Only ship glyphs that are actually used.
  const used = new Set();
  for (const d of [...files, ...folders]) {
    used.add(d.mono ? `mono:${d.mono}` : d.glyph);
    if (d.badge) used.add(d.badge);
  }
  const glyphTable = Object.fromEntries(Object.entries(table).filter(([k]) => used.has(k)));
  return {
    glyphs: glyphTable,
    files,
    folders,
    fileNames: manifest.fileNames,
    fileExtensions: manifest.fileExtensions,
    folderNames: rawFolderNames,
    defaults: manifest.defaults,
  };
}
