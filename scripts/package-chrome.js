// Zips the Chrome extension (only the files the browser needs) into release/.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXT = path.join(ROOT, 'extensions/chrome');
const { version } = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
const out = path.join(ROOT, 'release', `lumora-chrome-${version}.zip`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.rmSync(out, { force: true });
execFileSync('zip', ['-r', '-X', '-q', out, 'manifest.json', 'popup.html', 'popup.css', 'LICENSE', 'icons', 'fonts', 'dist'], { cwd: EXT, stdio: 'inherit' });
console.log(`✦ ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
