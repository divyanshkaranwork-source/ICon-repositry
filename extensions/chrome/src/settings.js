// Settings shared between the content script, popup and gallery.
// Falls back to localStorage when running outside the extension (gallery site).

export const DEFAULTS = {
  enabled: true,
  edition: 'aurora',
  mode: 'auto', // auto | dark | light
  folders: true,
  hover: true,
};

const hasChrome = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;

export async function loadSettings() {
  if (hasChrome) {
    const stored = await chrome.storage.sync.get(DEFAULTS);
    return { ...DEFAULTS, ...stored };
  }
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('lumora-settings') || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveSettings(patch) {
  const next = { ...(await loadSettings()), ...patch };
  if (hasChrome) await chrome.storage.sync.set(next);
  else {
    try {
      localStorage.setItem('lumora-settings', JSON.stringify(next));
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
