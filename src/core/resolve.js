// Name → icon id resolution. Works on plain lookup tables so it can ship to the
// browser without the full definition lists.

/** Resolve a file name using VS Code's precedence: exact name, then longest extension. */
export function resolveFile(tables, name) {
  const lower = name.toLowerCase();
  const byName = tables.fileNames[lower];
  if (byName) return byName;
  let idx = lower.indexOf('.');
  while (idx !== -1) {
    const ext = lower.slice(idx + 1);
    if (ext && tables.fileExtensions[ext]) return tables.fileExtensions[ext];
    idx = lower.indexOf('.', idx + 1);
  }
  return tables.defaults.file;
}

/** Resolve a folder name, tolerating ".name", "_name" and "__name__" decorations. */
export function resolveFolder(tables, name) {
  const lower = name.toLowerCase();
  const hit = tables.folderNames[lower];
  if (hit) return hit;
  const dunder = /^__(.+)__$/.exec(lower);
  const bare = dunder ? dunder[1] : lower.replace(/^[._]/, '');
  return (bare !== lower && tables.folderNames[bare]) || tables.defaults.folder;
}
