import data from '@lumora/data';
import { createLumora } from '../../../src/runtime/lumora.js';
import { loadSettings, saveSettings } from './settings.js';

const lumora = createLumora(data);
const PREVIEW = [
  ['folder', 'src'],
  ['folder', 'components'],
  ['file', 'index.ts'],
  ['file', 'App.tsx'],
  ['file', 'package.json'],
  ['file', 'README.md'],
];

const $ = (id) => document.getElementById(id);

function renderEditions(settings) {
  const host = $('editions');
  host.textContent = '';
  for (const ed of lumora.editions) {
    const btn = document.createElement('button');
    btn.className = 'edition';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(ed.id === settings.edition));
    btn.dataset.edition = ed.id;

    const text = document.createElement('span');
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = ed.name;
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = ed.tagline;
    text.append(name, tag);

    const icons = document.createElement('span');
    icons.className = 'icons';
    for (const [kind, n] of PREVIEW) {
      const img = document.createElement('img');
      img.alt = '';
      img.src = kind === 'folder' ? lumora.folderUri(n, { edition: ed.id, mode: 'dark', open: n === 'src' }) : lumora.fileUri(n, ed.id, 'dark');
      icons.append(img);
    }
    btn.append(text, icons);
    btn.addEventListener('click', () => update({ edition: ed.id }));
    host.append(btn);
  }
}

function reflect(settings) {
  $('enabled').checked = settings.enabled;
  $('folders').checked = settings.folders;
  $('hover').checked = settings.hover;
  document.body.classList.toggle('off', !settings.enabled);
  for (const b of $('mode').querySelectorAll('button')) b.setAttribute('aria-checked', String(b.dataset.mode === settings.mode));
  for (const b of $('editions').querySelectorAll('.edition')) b.setAttribute('aria-checked', String(b.dataset.edition === settings.edition));
}

async function update(patch) {
  reflect(await saveSettings(patch));
}

(async () => {
  const settings = await loadSettings();
  renderEditions(settings);
  reflect(settings);
  $('enabled').addEventListener('change', (e) => update({ enabled: e.target.checked }));
  $('folders').addEventListener('change', (e) => update({ folders: e.target.checked }));
  $('hover').addEventListener('change', (e) => update({ hover: e.target.checked }));
  for (const b of $('mode').querySelectorAll('button')) {
    b.setAttribute('role', 'radio');
    b.addEventListener('click', () => update({ mode: b.dataset.mode }));
  }
  if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) $('version').textContent = `v${chrome.runtime.getManifest().version}`;
})();
