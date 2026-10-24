// Builds name → icon lookup tables from the definitions and resolves a file or
// folder name to its icon id. Shared by the VS Code build and the Chrome
// extension so both surfaces always agree.

import { FILE_ICONS, DEFAULT_FILE } from './files.js';
import { FOLDER_ICONS, DEFAULT_FOLDER, ROOT_FOLDER, expandFolderName } from './folders.js';

export function buildManifest({ strict = false } = {}) {
  const fileNames = {};
  const fileExtensions = {};
  const languageIds = {};
  const folderNames = {};
  const conflicts = [];

  const put = (table, key, id, kind) => {
    key = key.toLowerCase();
    if (table[key] && table[key] !== id) {
      conflicts.push(`${kind} "${key}": ${table[key]} vs ${id}`);
      return;
    }
    table[key] = id;
  };

  for (const icon of FILE_ICONS) {
    for (const n of icon.names || []) put(fileNames, n, icon.id, 'fileName');
    for (const e of icon.ext || []) put(fileExtensions, e, icon.id, 'extension');
    for (const l of icon.langs || []) put(languageIds, l, icon.id, 'language');
  }
  for (const folder of FOLDER_ICONS) {
    for (const n of folder.names) put(folderNames, n, folder.id, 'folder');
  }
  // Decorated variants (".src", "_src", "__src__") never override explicit names.
  const expanded = { ...folderNames };
  for (const [n, id] of Object.entries(folderNames)) {
    for (const v of expandFolderName(n)) if (!(v in expanded)) expanded[v] = id;
  }

  if (strict && conflicts.length) {
    throw new Error(`Icon association conflicts:\n  ${conflicts.join('\n  ')}`);
  }

  // File and folder ids live in separate namespaces (and directories).
  for (const list of [[DEFAULT_FILE, ...FILE_ICONS], [DEFAULT_FOLDER, ROOT_FOLDER, ...FOLDER_ICONS]]) {
    const ids = new Set();
    for (const d of list) {
      if (ids.has(d.id)) throw new Error(`Duplicate icon id ${d.id}`);
      ids.add(d.id);
    }
  }

  return {
    defaults: { file: DEFAULT_FILE.id, folder: DEFAULT_FOLDER.id, root: ROOT_FOLDER.id },
    fileNames,
    fileExtensions,
    languageIds,
    folderNames: expanded,
    conflicts,
  };
}

export { resolveFile, resolveFolder } from './resolve.js';
