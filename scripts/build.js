// Folio build: renders every icon for every edition, writes the VS Code icon
// themes + color themes, and bundles the browser runtime for the Chrome
// extension and the preview gallery.
//
//   node scripts/build.js            full build
//   node scripts/build.js --vscode   VS Code only
//   node scripts/build.js --web      Chrome extension + gallery only

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { createRenderer } from '../src/core/render.js';
import { EDITIONS } from '../src/core/editions.js';
import { buildColorThemes } from '../src/themes/color-themes.js';
import { brandSvg } from '../src/core/brand.js';
import { createRequire } from 'node:module';
import { loadData, runtimeData } from './lib/data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VSCODE = path.join(ROOT, 'extensions/vscode');
const CHROME = path.join(ROOT, 'extensions/chrome');
const DOCS = path.join(ROOT, 'docs');
const GEN = path.join(ROOT, 'build');

const require = createRequire(import.meta.url);
const FONTS = {
  'plex-sans-400.woff2': '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2',
  'plex-sans-500.woff2': '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2',
  'plex-sans-600.woff2': '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2',
  'plex-mono-400.woff2': '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
  'plex-mono-500.woff2': '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
};
const args = new Set(process.argv.slice(2));
const doVscode = !args.has('--web');
const doWeb = !args.has('--vscode');

const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};
const rm = (dir) => fs.rmSync(dir, { recursive: true, force: true });

const t0 = Date.now();
const data = loadData();
const { table, files, folders, manifest } = data;
const render = createRenderer(table);
console.log(`${files.length} file icons, ${folders.length} folder icons, ${Object.keys(table).length} glyphs`);

// ─── Runtime data (shared by Chrome + gallery) ─────────────────────
const runtime = runtimeData(data);
write(path.join(GEN, 'runtime-data.json'), JSON.stringify(runtime));

// ─── VS Code ──────────────────────────────────────────────────────
function renderSet(edition, mode, dir) {
  let count = 0;
  for (const f of files) {
    write(path.join(dir, 'files', `${f.id}.svg`), render.file(f, edition, mode));
    count++;
  }
  for (const d of folders) {
    write(path.join(dir, 'folders', `${d.id}.svg`), render.folder(d, edition, { mode }));
    write(path.join(dir, 'folders', `${d.id}-open.svg`), render.folder(d, edition, { mode, open: true }));
    count += 2;
  }
  return count;
}

function themeSection(prefix, base) {
  const f = (id) => `_${prefix}f_${id}`;
  const d = (id) => `_${prefix}d_${id}`;
  const o = (id) => `_${prefix}o_${id}`;
  const defs = {};
  for (const x of files) defs[f(x.id)] = { iconPath: `${base}/files/${x.id}.svg` };
  for (const x of folders) {
    defs[d(x.id)] = { iconPath: `${base}/folders/${x.id}.svg` };
    defs[o(x.id)] = { iconPath: `${base}/folders/${x.id}-open.svg` };
  }
  const mapIds = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));
  return {
    defs,
    section: {
      file: f(manifest.defaults.file),
      folder: d(manifest.defaults.folder),
      folderExpanded: o(manifest.defaults.folder),
      rootFolder: d(manifest.defaults.root),
      rootFolderExpanded: o(manifest.defaults.root),
      fileExtensions: mapIds(manifest.fileExtensions, f),
      fileNames: mapIds(manifest.fileNames, f),
      languageIds: mapIds(manifest.languageIds, f),
      folderNames: mapIds(manifest.folderNames, d),
      folderNamesExpanded: mapIds(manifest.folderNames, o),
    },
  };
}

if (doVscode) {
  rm(path.join(VSCODE, 'icons'));
  rm(path.join(VSCODE, 'themes'));
  let total = 0;
  const contributes = { iconThemes: [], themes: [] };

  for (const ed of EDITIONS) {
    total += renderSet(ed.id, 'dark', path.join(VSCODE, 'icons', ed.id));
    const main = themeSection('', `../icons/${ed.id}`);
    const theme = { iconDefinitions: { ...main.defs }, ...main.section, hidesExplorerArrows: false };
    // Flat colors are tuned per background, so every edition ships a light-theme set.
    total += renderSet(ed.id, 'light', path.join(VSCODE, 'icons', `${ed.id}-light`));
    const light = themeSection('l', `../icons/${ed.id}-light`);
    Object.assign(theme.iconDefinitions, light.defs);
    theme.light = light.section;
    write(path.join(VSCODE, 'themes', `folio-${ed.id}.json`), JSON.stringify(theme));
    contributes.iconThemes.push({ id: `folio-${ed.id}`, label: `Folio ${ed.name}`, path: `./themes/folio-${ed.id}.json` });
  }

  for (const ct of buildColorThemes()) {
    write(path.join(VSCODE, 'themes', `folio-${ct.key}-color-theme.json`), JSON.stringify(ct.json, null, 2));
    contributes.themes.push({ label: ct.label, uiTheme: ct.uiTheme, path: `./themes/folio-${ct.key}-color-theme.json` });
  }

  // Keep package.json contributions in sync with the editions.
  const pkgPath = path.join(VSCODE, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.contributes = { ...pkg.contributes, ...contributes };
  write(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`VS Code: ${total} SVGs across ${EDITIONS.length} editions (dark + light) and ${contributes.themes.length} color themes`);
}

// ─── Chrome extension + gallery ──────────────────────────────────
if (doWeb) {
  const common = {
    bundle: true,
    format: 'iife',
    target: ['chrome110'],
    legalComments: 'none',
    charset: 'utf8',
    logLevel: 'warning',
    alias: { '@folio/data': path.join(GEN, 'runtime-data.json') },
  };
  rm(path.join(CHROME, 'dist'));
  await esbuild.build({
    ...common,
    entryPoints: {
      content: path.join(CHROME, 'src/content.js'),
      popup: path.join(CHROME, 'src/popup.js'),
      gallery: path.join(ROOT, 'src/gallery/gallery.js'),
    },
    outdir: path.join(CHROME, 'dist'),
  });
  await esbuild.build({
    ...common,
    entryPoints: { gallery: path.join(ROOT, 'src/gallery/gallery.js') },
    outdir: DOCS,
    minify: true,
  });
  fs.copyFileSync(path.join(ROOT, 'src/gallery/gallery.css'), path.join(CHROME, 'dist/gallery.css'));
  fs.copyFileSync(path.join(ROOT, 'src/gallery/gallery.css'), path.join(DOCS, 'gallery.css'));
  const galleryHtml = fs.readFileSync(path.join(ROOT, 'src/gallery/index.html'), 'utf8');
  write(path.join(CHROME, 'dist/gallery.html'), galleryHtml);
  write(path.join(DOCS, 'index.html'), galleryHtml.replace('</title>', '</title>\n    <link rel="icon" href="favicon.svg" />'));
  write(path.join(DOCS, 'favicon.svg'), brandSvg());
  write(path.join(CHROME, 'icons/mark.svg'), brandSvg());
  for (const dir of [path.join(CHROME, 'fonts'), path.join(CHROME, 'dist/fonts'), path.join(DOCS, 'fonts')]) {
    rm(dir);
    fs.mkdirSync(dir, { recursive: true });
    for (const [name, mod] of Object.entries(FONTS)) fs.copyFileSync(require.resolve(mod), path.join(dir, name));
  }
  console.log('Chrome extension + gallery bundled');
}

console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
