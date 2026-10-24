// Settings shared between the content script, popup and gallery.
// Falls back to localStorage when running outside the extension (gallery site).

import { EDITION_IDS } from '../../../src/core/editions.js';

export const DEFAULTS = {
  enabled: true,
  edition: 'ink',
  mode: 'auto', // auto | dark | light
  folders: true,
};

const hasChrome = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;

const clean = (s) => ({ ...s, edition: EDITION_IDS.includes(s.edition) ? s.edition : DEFAULTS.edition });

export async function loadSettings() {
  if (hasChrome) {
    const stored = await chrome.storage.sync.get(DEFAULTS);
    return clean({ ...DEFAULTS, ...stored });
  }
  try {
    return clean({ ...DEFAULTS, ...JSON.parse(localStorage.getItem('folio-settings') || '{}') });
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveSettings(patch) {
  const next = { ...(await loadSettings()), ...patch };
  if (hasChrome) await chrome.storage.sync.set(next);
  else {
    try {
      localStorage.setItem('folio-settings', JSON.stringify(next));
    } catch {
      // Storage can be unavailable (private mode); settings then last for the session.
    }
  }
  return next;
}

export function onSettingsChanged(cb) {
  if (!hasChrome) return;
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') loadSettings().then(cb);
  });
}
