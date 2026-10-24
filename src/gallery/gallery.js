// Folio icon index — the specimen page used for GitHub Pages and as the
// Chrome extension's options page.

import data from '@folio/data';
import { createFolio } from '../runtime/folio.js';
import { brandSvg } from '../core/brand.js';
import { loadSettings, saveSettings } from '../../extensions/chrome/src/settings.js';

const folio = createFolio(data);
const $ = (id) => document.getElementById(id);
const state = { edition: 'ink', canvas: 'light', tab: 'files', q: '' };

// ─── Association index (id → names) ──────────────────────────────
const fileAssoc = new Map(data.files.map((f) => [f.id, []]));
for (const [n, id] of Object.entries(data.fileNames)) fileAssoc.get(id)?.push(n);
for (const [e, id] of Object.entries(data.fileExtensions)) fileAssoc.get(id)?.push(`.${e}`);
const folderAssoc = new Map(data.folders.map((f) => [f.id, []]));
for (const [n, id] of Object.entries(data.folderNames)) folderAssoc.get(id)?.push(n);

const CASING = {
  ts: 'TS', js: 'JS', tsx: 'TSX', jsx: 'JSX', json: 'JSON', html: 'HTML', css: 'CSS', api: 'API', ui: 'UI', ai: 'AI', mcp: 'MCP',
  ci: 'CI', cdn: 'CDN', dto: 'DTO', sdk: 'SDK', i18n: 'i18n', e2e: 'E2E', '3d': '3D', npm: 'npm', pnpm: 'pnpm', vscode: 'VS Code',
  typescript: 'TypeScript', javascript: 'JavaScript', graphql: 'GraphQL', github: 'GitHub', mdx: 'MDX', yaml: 'YAML', toml: 'TOML',
  xml: 'XML', csv: 'CSV', pdf: 'PDF', sql: 'SQL', svg: 'SVG', gif: 'GIF', ico: 'ICO', php: 'PHP', wasm: 'Wasm', aws: 'AWS',
  gcp: 'GCP', og: 'OG', csharp: 'C#', cpp: 'C++', fsharp: 'F#', ocaml: 'OCaml', latex: 'LaTeX', bibtex: 'BibTeX', ios: 'iOS',
  macos: 'macOS', dotnet: '.NET', vb: 'VB', http: 'HTTP', rst: 'RST', erb: 'ERB', ejs: 'EJS', nx: 'Nx', swc: 'SWC', idea: 'IDEA',
  cmake: 'CMake', openapi: 'OpenAPI', postcss: 'PostCSS', webpack: 'webpack', esbuild: 'esbuild', vite: 'Vite', vitest: 'Vitest',
  eslint: 'ESLint', oxlint: 'Oxlint', devcontainer: 'Dev Container', jetbrains: 'JetBrains', githooks: 'Git hooks', tsconfig: 'tsconfig',
  jsconfig: 'jsconfig', readme: 'README', cocoapods: 'CocoaPods', cuda: 'CUDA', gdscript: 'GDScript', mojo: 'Mojo', node_modules: 'node_modules',
};
const pretty = (id) =>
  id === 'default'
    ? 'Folder'
    : id === 'root'
      ? 'Workspace root'
      : id
          .replace(/^lang-/, '')
          .split('-')
          .map((w) => CASING[w] || w[0].toUpperCase() + w.slice(1))
          .join(' ');

// ─── Sample explorer tree ────────────────────────────────────────
const TREE = [
  ['root', 'my-app', 0, true],
  ['dir', '.github', 1, true],
  ['dir', 'workflows', 2, false],
  ['dir', '.vscode', 1, false],
  ['dir', 'src', 1, true],
  ['dir', 'components', 2, true],
  ['file', 'Button.tsx', 3],
  ['file', 'Button.test.tsx', 3],
  ['file', 'Button.stories.tsx', 3],
  ['file', 'button.module.css', 3],
  ['dir', 'hooks', 2, false],
  ['dir', 'api', 2, false],
  ['dir', 'store', 2, false],
  ['dir', 'assets', 2, false],
  ['file', 'App.tsx', 2],
  ['file', 'main.ts', 2],
  ['file', 'env.d.ts', 2],
  ['dir', 'public', 1, false],
  ['dir', 'docs', 1, false],
  ['dir', 'node_modules', 1, false],
  ['file', '.env.local', 1],
  ['file', '.gitignore', 1],
  ['file', 'CLAUDE.md', 1],
  ['file', 'Dockerfile', 1],
  ['file', 'package.json', 1],
  ['file', 'pnpm-lock.yaml', 1],
  ['file', 'README.md', 1],
  ['file', 'tsconfig.json', 1],
  ['file', 'vite.config.ts', 1],
];

const SPOTLIGHT = [
  ['dir', 'src', true],
  ['file', 'index.ts'],
  ['file', 'App.tsx'],
  ['file', 'main.py'],
  ['file', 'lib.rs'],
  ['file', 'server.go'],
  ['dir', 'components'],
  ['file', 'schema.graphql'],
  ['file', 'docker-compose.yml'],
  ['file', 'hero.png'],
  ['dir', 'admin'],
  ['file', 'package.json'],
];

const mode = () => state.canvas;
const fileImg = (name) => folio.fileUri(name, state.edition, mode());
const folderImg = (name, open, root) => folio.folderUri(name, { edition: state.edition, mode: mode(), open, root });

function img(src, size, alt = '') {
  const el = document.createElement('img');
  el.src = src;
  el.width = size;
  el.height = size;
  el.alt = alt;
  el.decoding = 'async';
  return el;
}

function renderTree() {
  const host = $('tree');
  host.textContent = '';
  for (const [kind, name, depth, open] of TREE) {
    const li = document.createElement('li');
    li.style.setProperty('--depth', depth);
    const chev = document.createElement('span');
    chev.className = 'chev';
    chev.textContent = kind === 'file' ? '' : open ? '▾' : '▸';
    const src = kind === 'file' ? fileImg(name) : folderImg(name, open, kind === 'root');
    const label = document.createElement('span');
    label.textContent = name;
    if (kind === 'root') li.className = 'root';
    li.append(chev, img(src, 16), label);
    host.append(li);
  }
}

function renderSpotlight() {
  const host = $('spotlight');
  host.textContent = '';
  for (const [kind, name, open] of SPOTLIGHT) {
    const fig = document.createElement('figure');
    const src = kind === 'file' ? fileImg(name) : folderImg(name, !!open);
    const cap = document.createElement('figcaption');
    cap.textContent = name;
    fig.append(img(src, 48, name), cap);
    host.append(fig);
  }
  const ed = folio.editions.find((e) => e.id === state.edition);
  $('edition-name').textContent = ed.name;
  $('edition-tag').textContent = ed.tagline;
}

function renderGrid() {
  const host = $('grid');
  host.textContent = '';
  const q = state.q.trim().toLowerCase();
  const isFiles = state.tab === 'files';
  const list = isFiles ? data.files : data.folders;
  const assoc = isFiles ? fileAssoc : folderAssoc;
  let shown = 0;
  const frag = document.createDocumentFragment();
  list.forEach((def, i) => {
    const names = assoc.get(def.id) || [];
    if (q && !def.id.includes(q) && !names.some((n) => n.includes(q))) return;
    shown++;
    const cell = document.createElement('article');
    cell.className = 'cell';
    const src = isFiles
      ? folio.uriFor(folio.fileSvgById(def.id, state.edition, mode()))
      : folio.uriFor(folio.folderSvgById(def.id, { edition: state.edition, mode: mode() }));
    const no = document.createElement('span');
    no.className = 'no';
    no.textContent = String(i + 1).padStart(3, '0');
    const h = document.createElement('h4');
    h.textContent = pretty(def.id);
    const p = document.createElement('p');
    p.textContent = names.slice(0, 3).join(' ') || (isFiles ? 'default' : 'any folder');
    cell.title = names.length ? names.join(', ') : pretty(def.id);
    cell.append(no, img(src, 32, pretty(def.id)), h, p);
    frag.append(cell);
  });
  host.append(frag);
  $('empty').hidden = shown > 0;
}

function renderEditions() {
  const host = $('editions');
  host.textContent = '';
  for (const ed of folio.editions) {
    const b = document.createElement('button');
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(ed.id === state.edition));
    b.textContent = ed.name;
    b.addEventListener('click', () => {
      state.edition = ed.id;
      saveSettings({ edition: ed.id });
      renderAll();
    });
    host.append(b);
  }
}

function renderAll() {
  document.body.dataset.canvas = state.canvas;
  renderEditions();
  renderTree();
  renderSpotlight();
  renderGrid();
  for (const b of $('canvas').querySelectorAll('button')) b.setAttribute('aria-checked', String(b.dataset.canvas === state.canvas));
}

(async () => {
  $('mark').innerHTML = brandSvg();
  const fmt = (n) => n.toLocaleString('en-US');
  $('stat-files').textContent = fmt(data.files.length);
  $('stat-folders').textContent = fmt(data.folders.length);
  const folderVariants = Object.keys(data.folderNames).length;
  $('stat-names').textContent = `${fmt(Math.floor((Object.keys(data.fileNames).length + Object.keys(data.fileExtensions).length + folderVariants) / 100) * 100)}+`;
  $('count-files').textContent = data.files.length;
  $('count-folders').textContent = data.folders.length;

  const s = await loadSettings();
  state.edition = s.edition;
  state.canvas = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  for (const b of $('canvas').querySelectorAll('button')) {
    b.addEventListener('click', () => {
      state.canvas = b.dataset.canvas;
      renderAll();
    });
  }
  for (const t of document.querySelectorAll('[role="tab"]')) {
    t.addEventListener('click', () => {
      state.tab = t.dataset.tab;
      for (const o of document.querySelectorAll('[role="tab"]')) o.setAttribute('aria-selected', String(o === t));
      renderGrid();
    });
  }
  $('q').addEventListener('input', (e) => {
    state.q = e.target.value;
    renderGrid();
  });
  renderAll();
})();
