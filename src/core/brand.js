// The Lumora mark: a spectrum glass tile holding a four-point spark.

import { sparkle } from './shapes.js';

export function brandSvg() {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">` +
    `<defs>` +
    `<linearGradient id="s" x1="8" y1="6" x2="122" y2="124" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="#6d7bff"/><stop offset=".42" stop-color="#a75cff"/><stop offset=".76" stop-color="#ff6fae"/><stop offset="1" stop-color="#ffb46b"/></linearGradient>` +
    `<radialGradient id="g" cx="34" cy="20" r="96" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="c" cx="64" cy="64" r="44" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `<clipPath id="k"><rect x="6" y="6" width="116" height="116" rx="36"/></clipPath>` +
    `</defs>` +
    `<rect x="6" y="6" width="116" height="116" rx="36" fill="url(#s)"/>` +
    `<rect x="6" y="6" width="116" height="116" rx="36" fill="url(#g)"/>` +
    `<circle cx="64" cy="64" r="44" fill="url(#c)"/>` +
    `<rect x="6" y="6" width="116" height="116" rx="36" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4" clip-path="url(#k)"/>` +
    `<circle cx="64" cy="64" r="25" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3.5"/>` +
    `<path d="${sparkle(64, 64, 40)}" fill="#fff"/>` +
    `<path d="${sparkle(95, 33, 10)}" fill="#fff" opacity=".9"/>` +
    `</svg>`
  );
}
