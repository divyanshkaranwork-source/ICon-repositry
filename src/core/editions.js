// Folio editions.
//
//   ink       muted printing inks — one restrained hue per family
//   graphite  monochrome; shape does all the work
//   primary   red, blue and yellow, after Bauhaus posters
//
// Colors are flat (no gradients) and computed in OKLCH. Every icon's hue snaps
// to a fixed palette, so the whole set reads as one printed system rather than
// a rainbow. Each edition has a dark-theme and a light-theme set.

import { oklch } from './color.js';

export const EDITIONS = [
  { id: 'ink', name: 'Ink', tagline: 'Twelve muted inks', swatch: ['#6f8fc9', '#c9a35a', '#c27660'] },
  { id: 'graphite', name: 'Graphite', tagline: 'Monochrome', swatch: ['#d6d4cf', '#8e8b85', '#4a4844'] },
  { id: 'primary', name: 'Primary', tagline: 'Red, blue and yellow', swatch: ['#d8402f', '#2f5fb3', '#f0c23a'] },
];

export const EDITION_IDS = EDITIONS.map((e) => e.id);

// The ink palette: twelve hues, evenly weighted.
const INKS = [25, 50, 80, 105, 145, 175, 205, 240, 265, 295, 325, 355];

const nearest = (h) => {
  h = ((h % 360) + 360) % 360;
  let best = INKS[0];
  let dist = 360;
  for (const ink of INKS) {
    const d = Math.min(Math.abs(ink - h), 360 - Math.abs(ink - h));
    if (d < dist) [best, dist] = [ink, d];
  }
  return best;
};

/** Hue and chroma factor for a definition: neutrals stay neutral, the rest snap to an ink. */
export function tone(def) {
  const c = def.chroma ?? 1;
  if (c < 0.3) return { h: 250, cf: 0.12, neutral: true };
  return { h: nearest(def.hue ?? 250), cf: c < 0.7 ? 0.6 : 1, neutral: false };
}

const PRIMARY = {
  dark: { red: oklch(0.66, 0.19, 28), yellow: oklch(0.86, 0.16, 92), blue: oklch(0.66, 0.14, 258), neutral: oklch(0.9, 0, 0), soft: oklch(0.55, 0, 0) },
  light: { red: oklch(0.57, 0.2, 28), yellow: oklch(0.8, 0.16, 86), blue: oklch(0.47, 0.16, 262), neutral: oklch(0.22, 0, 0), soft: oklch(0.42, 0, 0) },
};

function primaryFamily(def) {
  const { h, neutral } = tone(def);
  if (neutral) return 'neutral';
  if (h >= 300 || h < 50) return 'red';
  if (h < 130) return 'yellow';
  if (h >= 180) return 'blue';
  return 'neutral';
}

/** Flat colors for a file glyph: `main` carries the shape, `soft` the supporting parts. */
export function fileColors(def, edition, mode = 'dark') {
  const dark = mode !== 'light';
  if (edition === 'graphite') {
    return dark ? { main: oklch(0.82, 0.006, 80), soft: oklch(0.6, 0.006, 80) } : { main: oklch(0.36, 0.006, 80), soft: oklch(0.64, 0.006, 80) };
  }
  if (edition === 'primary') {
    const p = PRIMARY[dark ? 'dark' : 'light'];
    return { main: p[primaryFamily(def)], soft: p.soft };
  }
  const { h, cf } = tone(def);
  const yellow = h === 80 || h === 105;
  return dark
    ? { main: oklch(yellow ? 0.8 : 0.75, 0.095 * cf, h), soft: oklch(0.58, 0.065 * cf, h) }
    : { main: oklch(yellow ? 0.57 : 0.5, 0.11 * cf, h), soft: oklch(0.72, 0.065 * cf, h) };
}

/** Flat colors for a folder: the `front` panel carries the knocked-out emblem. */
export function folderColors(def, edition, mode = 'dark') {
  const dark = mode !== 'light';
  if (edition === 'graphite') {
    return dark ? { front: oklch(0.66, 0.006, 80), back: oklch(0.5, 0.006, 80) } : { front: oklch(0.6, 0.006, 80), back: oklch(0.45, 0.006, 80) };
  }
  if (edition === 'primary') {
    const fam = def.glyph || def.mono ? primaryFamily(def) : 'neutral';
    const p = PRIMARY[dark ? 'dark' : 'light'];
    const front = fam === 'neutral' ? (dark ? oklch(0.66, 0, 0) : oklch(0.42, 0, 0)) : p[fam];
    return { front, back: dark ? oklch(0.48, 0, 0) : oklch(0.28, 0, 0) };
  }
  const { h, cf } = tone(def);
  return dark
    ? { front: oklch(0.7, 0.075 * cf, h), back: oklch(0.52, 0.06 * cf, h) }
    : { front: oklch(0.66, 0.085 * cf, h), back: oklch(0.5, 0.075 * cf, h) };
}
