// Browser runtime: resolves names and renders icons on demand from the compact
// generated data. Used by the Chrome extension and the preview gallery.

import { createRenderer } from '../core/render.js';
import { EDITIONS } from '../core/editions.js';
import { resolveFile, resolveFolder } from '../core/resolve.js';

export { EDITIONS };

export function createFolio(data) {
  const renderer = createRenderer(data.glyphs);
  const files = new Map(data.files.map((d) => [d.id, d]));
  const folders = new Map(data.folders.map((d) => [d.id, d]));
  const cache = new Map();

  const memo = (key, make) => {
    let v = cache.get(key);
    if (v === undefined) {
      v = make();
      cache.set(key, v);
    }
    return v;
  };

  const toUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const api = {
    editions: EDITIONS,
    data,
    fileIconId: (name) => resolveFile(data, name),
    folderIconId: (name) => resolveFolder(data, name),

    fileSvgById(id, edition = 'ink', mode = 'dark') {
      return memo(`f|${id}|${edition}|${mode}`, () => renderer.file(files.get(id) || files.get(data.defaults.file), edition, mode));
    },
    folderSvgById(id, { edition = 'ink', mode = 'dark', open = false } = {}) {
      return memo(`d|${id}|${edition}|${mode}|${open}`, () =>
        renderer.folder(folders.get(id) || folders.get(data.defaults.folder), edition, { open, mode }),
      );
    },
    fileUri(name, edition, mode) {
      const id = api.fileIconId(name);
      return memo(`fu|${id}|${edition}|${mode}`, () => toUri(api.fileSvgById(id, edition, mode)));
    },
    folderUri(name, { edition, mode, open = false, root = false } = {}) {
      const id = root ? data.defaults.root : api.folderIconId(name);
      return memo(`du|${id}|${edition}|${mode}|${open}`, () => toUri(api.folderSvgById(id, { edition, mode, open })));
    },
    uriFor: toUri,
    clear: () => cache.clear(),
  };
  return api;
}
