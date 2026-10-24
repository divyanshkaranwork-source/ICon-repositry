// Folio for GitHub — replaces file and folder octicons with Folio icons.
//
// Strategy: never add or remove DOM nodes that GitHub's React tree owns.
// Instead we paint the Folio icon as the background of the existing octicon
// <svg> and hide its paths. React can re-render freely; we simply repaint.

import data from '@folio/data';
import { createFolio } from '../../../src/runtime/folio.js';
import { DEFAULTS, loadSettings, onSettingsChanged } from './settings.js';

const folio = createFolio(data);
let settings = { ...DEFAULTS };
let scheduled = false;

// Octicons GitHub uses for tree entries.
const ICON_SELECTOR = [
  'svg.octicon-file',
  'svg.octicon-file-directory',
  'svg.octicon-file-directory-fill',
  'svg.octicon-file-directory-open-fill',
  'svg.octicon-file-submodule',
  'svg.octicon-file-symlink-file',
  'svg.octicon-file-directory-symlink',
  'svg.octicon-file-code',
  'svg.octicon-file-media',
  'svg.octicon-file-zip',
  'svg.octicon-file-binary',
  'svg[aria-label="Directory"]',
  'svg[aria-label="File"]',
  'svg[aria-label="Submodule"]',
  'svg[aria-label="Symlink Directory"]',
].join(',');

// Containers that hold exactly one tree entry.
const ROW_SELECTOR = [
  '[role="treeitem"]',
  '.react-directory-filename-column',
  'tr.react-directory-row',
  'li.ActionList-item',
  '.js-navigation-item',
  '[role="row"]',
  '.Box-row',
  'a.tree-browser-result',
  '.file-header',
].join(',');

const NAME_SELECTOR = [
  '[class*="TreeView-item-content-text"]',
  '[class*="TreeViewItemContentText"]',
  '.react-directory-truncate a',
  '.react-directory-filename-cell a',
  'a[title]',
  '.ActionList-item-label',
  '[role="rowheader"] a',
  '[role="rowheader"] span',
  'a.js-navigation-open',
  'a.Link--primary',
  'marked-text',
  '.Link--primary',
].join(',');

// ─── Styles ─────────────────────────────────────────────────────────
const STYLE_ID = 'folio-style';
function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    svg[data-folio] { background-position: center !important; background-repeat: no-repeat !important;
      background-size: contain !important; fill: transparent !important; color: transparent !important; }
    svg[data-folio] > * { visibility: hidden !important; }
  `;
  (document.head || document.documentElement).appendChild(style);
}

// ─── Page appearance ──────────────────────────────────────────────
function pageMode() {
  if (settings.mode === 'dark' || settings.mode === 'light') return settings.mode;
  const html = document.documentElement;
  const cm = html.getAttribute('data-color-mode');
  if (cm === 'dark' || cm === 'light') return cm;
  if (cm === 'auto') return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const bg = getComputedStyle(document.body || html).backgroundColor.match(/\d+/g);
  if (bg) {
    const [r, g, b] = bg.map(Number);
    return 0.299 * r + 0.587 * g + 0.114 * b < 128 ? 'dark' : 'light';
  }
  return 'light';
}

// ─── Entry inspection ─────────────────────────────────────────────
function entryName(svg, row) {
  // Tree items nest their children, so look only inside the item's own content.
  let scope = row;
  if (row.getAttribute('role') === 'treeitem') {
    scope = svg.closest('[class*="TreeView-item-content"], [class*="TreeViewItemContent"]') || row.firstElementChild || row;
  } else if (row.matches('tr')) {
    scope = svg.closest('td') || row;
  }
  const el = scope.querySelector(NAME_SELECTOR);
  let name = el ? el.getAttribute('title') || el.textContent : '';
  if (!name && row.getAttribute('role') === 'treeitem') {
    // GitHub sets ids like "src/components-item".
    name = (row.id || '').replace(/-item$/, '');
  }
  name = (name || '').trim();
  // Collapsed directory chains render as "a/b/c"; the icon belongs to the last segment.
  const parts = name.split('/').map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}

function entryKind(svg, row) {
  const cls = svg.getAttribute('class') || '';
  const label = svg.getAttribute('aria-label') || '';
  const isDir =
    /directory|submodule/.test(cls) ||
    /Directory|Submodule/.test(label) ||
    row.getAttribute('data-tree-entry-type') === 'directory' ||
    (row.getAttribute('role') === 'treeitem' && row.hasAttribute('aria-expanded'));
  const open = isDir && (/open/.test(cls) || row.getAttribute('aria-expanded') === 'true');
  return { isDir, open };
}

// ─── Painting ────────────────────────────────────────────────────
function paint(svg) {
  const row = svg.closest(ROW_SELECTOR);
  if (!row) return;
  const name = entryName(svg, row);
  if (!name) return;
  const { isDir, open } = entryKind(svg, row);
  if (isDir && !settings.folders) return unpaint(svg);
  const mode = pageMode();
  const key = `${settings.edition}|${mode}|${isDir ? 'd' : 'f'}|${open ? 1 : 0}|${name}`;
  // Re-check the background too: React may rewrite the style attribute wholesale.
  if (svg.dataset.folio === key && svg.style.backgroundImage) return;
  const uri = isDir
    ? folio.folderUri(name, { edition: settings.edition, mode, open })
    : folio.fileUri(name, settings.edition, mode);
  svg.style.setProperty('background-image', `url("${uri}")`, 'important');
  svg.dataset.folio = key;
}

function unpaint(svg) {
  if (!svg.dataset.folio) return;
  svg.style.removeProperty('background-image');
  delete svg.dataset.folio;
}

function scan() {
  scheduled = false;
  const svgs = document.querySelectorAll(ICON_SELECTOR);
  if (!settings.enabled) {
    svgs.forEach(unpaint);
    return;
  }
  injectStyle();
  svgs.forEach((svg) => {
    try {
      paint(svg);
    } catch (err) {
      // One odd node must never break the page.
      console.debug('[folio]', err);
    }
  });
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(scan);
}

// ─── Boot ────────────────────────────────────────────────────────
// Only react to mutations that can change an entry's icon.
function relevant(m) {
  if (m.type === 'childList') return m.addedNodes.length > 0;
  const t = m.target;
  switch (m.attributeName) {
    case 'aria-expanded':
    case 'data-color-mode':
      return true;
    case 'style':
      return t.nodeName.toLowerCase() === 'svg' && 'folio' in t.dataset && !t.style.backgroundImage;
    default:
      return t.nodeName.toLowerCase() === 'svg';
  }
}

const observer = new MutationObserver((mutations) => {
  if (mutations.some(relevant)) schedule();
});
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class', 'style', 'aria-expanded', 'data-color-mode'],
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', schedule);
document.addEventListener('turbo:render', schedule);
document.addEventListener('pjax:end', schedule);

loadSettings().then((s) => {
  settings = s;
  schedule();
});
onSettingsChanged((s) => {
  settings = s;
  document.querySelectorAll('svg[data-folio]').forEach((svg) => delete svg.dataset.folio);
  schedule();
});
