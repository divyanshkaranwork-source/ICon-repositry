import data from '@folio/data';
import { createFolio } from '../../../src/runtime/folio.js';
import { loadSettings, saveSettings } from './settings.js';

const folio = createFolio(data);
const PREVIEW = [
  ['folder', 'src'],
  ['folder', 'components'],
  ['file', 'index.ts'],
  ['file', 'App.tsx'],
  ['file', 'package.json'],
  ['file', 'README.md'],
];

const $ = (id) => document.getElementById(id);
const popupMode = () => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

function renderEditions() {
  const host = $('editions');
  host.textContent = '';
  const mode = popupMode();
  for (const ed of folio.editions) {
    const btn = document.createElement('button');
    btn.className = 'edition';
    btn.setAttribute('role', 'radio');
    btn.dataset.edition = ed.id;

    const mark = document.createElement('span');
    mark.className = 'mark';
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
      img.src = kind === 'folder' ? folio.folderUri(n, { edition: ed.id, mode, open: n === 'src' }) : folio.fileUri(n, ed.id, mode);
      icons.append(img);
    }
    btn.append(mark, text, icons);
    btn.addEventListener('click', () => update({ edition: ed.id }));
    host.append(btn);
  }
}

function reflect(settings) {
  $('enabled').checked = settings.enabled;
  $('power-label').textContent = settings.enabled ? 'On' : 'Off';
  $('folders').checked = settings.folders;
  document.body.classList.toggle('off', !settings.enabled);
  for (const b of $('mode').querySelectorAll('button')) b.setAttribute('aria-checked', String(b.dataset.mode === settings.mode));
  for (const b of $('editions').querySelectorAll('.edition')) b.setAttribute('aria-checked', String(b.dataset.edition === settings.edition));
}

async function update(patch) {
  reflect(await saveSettings(patch));
}

(async () => {
  renderEditions();
  reflect(await loadSettings());
  $('enabled').addEventListener('change', (e) => update({ enabled: e.target.checked }));
  $('folders').addEventListener('change', (e) => update({ folders: e.target.checked }));
  for (const b of $('mode').querySelectorAll('button')) {
    b.setAttribute('role', 'radio');
    b.addEventListener('click', () => update({ mode: b.dataset.mode }));
  }
  if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) $('version').textContent = `v${chrome.runtime.getManifest().version}`;
})();
