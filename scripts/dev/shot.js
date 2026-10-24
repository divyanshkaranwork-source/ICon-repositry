// Dev tool: screenshot a local page. node scripts/dev/shot.js <file> <out.png> [width] [height] [fullPage] [js]
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [file, out, w = '1280', h = '900', full = '1', js = ''] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
p.on('console', (m) => m.type() === 'error' && console.log('console:', m.text()));
p.on('pageerror', (e) => console.log('pageerror:', e.message));
await p.goto('file://' + path.resolve(file));
await p.waitForTimeout(400);
if (js) { await p.evaluate(js); await p.waitForTimeout(300); }
await p.screenshot({ path: out, fullPage: full === '1' });
await b.close();
