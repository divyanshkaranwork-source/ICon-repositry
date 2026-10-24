// Structural checks for the generated VS Code icon themes and the shared resolver.
// Run `npm run build` first.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDITION_IDS } from '../src/core/editions.js';
import { buildManifest, resolveFile, resolveFolder } from '../src/core/manifest.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VSCODE = path.join(ROOT, 'extensions/vscode');
const theme = (id) => JSON.parse(fs.readFileSync(path.join(VSCODE, 'themes', `folio-${id}.json`), 'utf8'));

test('package.json contributes every edition and both color themes', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(VSCODE, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.contributes.iconThemes.map((t) => t.id), EDITION_IDS.map((e) => `folio-${e}`));
  assert.deepEqual(pkg.contributes.themes.map((t) => t.label), ['Folio Dark', 'Folio Light']);
  for (const t of [...pkg.contributes.iconThemes, ...pkg.contributes.themes]) {
    assert.ok(fs.existsSync(path.join(VSCODE, t.path)), t.path);
  }
});

for (const edition of EDITION_IDS) {
  test(`${edition}: every icon definition points at a valid SVG`, () => {
    const t = theme(edition);
    const defs = Object.entries(t.iconDefinitions);
    assert.ok(defs.length > 700);
    for (const [key, { iconPath }] of defs) {
      const file = path.resolve(VSCODE, 'themes', iconPath);
      const svg = fs.readFileSync(file, 'utf8');
      assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 16 16">.*<\/svg>$/s, key);
      assert.doesNotMatch(svg, /Gradient|filter|opacity/, `${key} must stay flat`);
      assert.doesNotMatch(svg, /NaN|undefined|Infinity/, key);
    }
    for (const section of [t, t.light].filter(Boolean)) {
      for (const table of ['fileExtensions', 'fileNames', 'languageIds', 'folderNames', 'folderNamesExpanded']) {
        for (const id of Object.values(section[table])) assert.ok(t.iconDefinitions[id], `${table} → ${id}`);
      }
    }
  });
}

test('every edition ships a light-theme set', () => {
  for (const id of EDITION_IDS) assert.ok(theme(id).light?.fileExtensions?.ts, id);
});

test('maps common names the way developers expect', () => {
  const t = theme('ink');
  assert.equal(t.fileExtensions.ts, '_f_typescript');
  assert.equal(t.fileExtensions['test.tsx'], '_f_test-tsx');
  assert.equal(t.fileNames['package.json'], '_f_npm');
  assert.equal(t.fileNames['tsconfig.json'], '_f_tsconfig');
  assert.equal(t.folderNames.src, '_d_src');
  assert.equal(t.folderNames.__tests__, '_d_test');
  assert.equal(t.folderNamesExpanded['.github'], '_o_github');
  assert.equal(t.languageIds.python, '_f_python');
});

test('resolver follows VS Code precedence', () => {
  const m = buildManifest({ strict: true });
  const cases = {
    'Button.test.tsx': 'test-tsx',
    'app.component.ts': 'component',
    'index.d.ts': 'typescript-def',
    'README.md': 'readme',
    'Dockerfile': 'docker',
    'docker-compose.yml': 'docker-compose',
    'vite.config.ts': 'vite',
    'page.tsx': 'next-page',
    'CLAUDE.md': 'ai-claude',
    '.env.local': 'env',
    'photo.JPEG': 'image',
    'archive.tar.gz': 'archive',
    'mystery.xyz': 'file',
  };
  for (const [name, id] of Object.entries(cases)) assert.equal(resolveFile(m, name), id, name);
  const folders = { src: 'src', '__tests__': 'test', '.vscode': 'vscode', _assets: 'assets', node_modules: 'node_modules', 'random-dir': 'default' };
  for (const [name, id] of Object.entries(folders)) assert.equal(resolveFolder(m, name), id, name);
});
