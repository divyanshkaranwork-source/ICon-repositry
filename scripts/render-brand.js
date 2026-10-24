// Renders the Lumora mark to PNG for the Chrome toolbar and the VS Code
// marketplace. Needs Playwright's Chromium (run once; PNGs are committed).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { brandSvg } from '../src/core/brand.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const targets = [
  ['extensions/chrome/icons/icon16.png', 16],
  ['extensions/chrome/icons/icon32.png', 32],
  ['extensions/chrome/icons/icon48.png', 48],
  ['extensions/chrome/icons/icon128.png', 128],
  ['extensions/vscode/images/icon.png', 256],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [rel, size] of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">` +
      brandSvg().replace('<svg ', `<svg width="${size}" height="${size}" `) +
      `</body></html>`,
  );
  const out = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  console.log('✦', rel);
}
await browser.close();
