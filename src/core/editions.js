// Lumora editions. One glyph library, five distinct materials.
//
//   aurora  — luminous gradient glass tiles with a folded corner (signature)
//   noir    — obsidian tiles, neon rims and glowing glyphs
//   frost   — porcelain pastel tiles with deep ink, made for light themes
//   halo    — airy gradient glyphs floating on a soft tinted halo
//   gilded  — champagne-gold monochrome glyphs, quiet luxury
//
// Colors are computed in OKLCH from each icon's hue so every edition keeps the
// same perceptual rhythm across the whole set.

import { oklch } from './color.js';

export const EDITIONS = [
  {
    id: 'aurora',
    name: 'Aurora',
    tagline: 'Luminous gradient glass tiles',
    style: 'tile',
    swatch: ['#7f9cff', '#b46bff', '#ff8fb1'],
  },
  {
    id: 'noir',
    name: 'Noir',
    tagline: 'Obsidian glass, neon rims',
    style: 'noir',
    swatch: ['#15151c', '#5ee7ff', '#b98cff'],
  },
  {
    id: 'frost',
    name: 'Frost',
    tagline: 'Porcelain pastels with deep ink',
    style: 'frost',
    swatch: ['#eef3ff', '#cfe0ff', '#4f5fb8'],
  },
  {
    id: 'halo',
    name: 'Halo',
    tagline: 'Airy glyphs on a soft glow',
    style: 'halo',
    swatch: ['#8be0ff', '#a78bff', '#ffb38b'],
  },
  {
    id: 'gilded',
    name: 'Gilded',
    tagline: 'Champagne-gold monochrome',
    style: 'gilded',
    swatch: ['#f6e7b8', '#d9b46a', '#9c7536'],
  },
];

export const EDITION_IDS = EDITIONS.map((e) => e.id);

/** Resolve the hue pair and chroma factor of an icon/folder definition. */
export function tone(def) {
  const h = def.hue ?? 255;
  const h2 = def.hue2 ?? h - 22;
  const c = def.chroma ?? 1;
  return { h, h2, c, yellow: c > 0.4 && h >= 70 && h <= 118 };
}

/** Colors for a file tile / glyph in the given edition. */
export function fileColors(def, edition, mode = 'dark') {
  const { h, h2, c, yellow } = tone(def);
  switch (edition) {
    case 'aurora':
      return yellow
        ? { a: oklch(0.9, 0.15 * c, h + 6), b: oklch(0.76, 0.16 * c, h2 - 6), ink: oklch(0.3, 0.06, h2), inkDark: true }
        : { a: oklch(0.79, 0.14 * c, h), b: oklch(0.57, 0.2 * c, h2), ink: '#ffffff' };
    case 'noir':
      return {
        a: oklch(0.34, 0.03 * c, h),
        b: oklch(0.2, 0.02 * c, h2),
        rimA: oklch(0.86, 0.15 * c, h),
        rimB: oklch(0.6, 0.18 * c, h2),
        inkA: oklch(0.92, 0.11 * c, h),
        inkB: oklch(0.74, 0.18 * c, h2),
      };
    case 'frost':
      return {
        a: oklch(0.975, 0.03 * c, h),
        b: oklch(0.88, 0.075 * c, h2),
        rim: oklch(0.72, 0.09 * c, h2),
        ink: oklch(0.46, 0.15 * c, h2),
      };
    case 'halo':
      return mode === 'light'
        ? { inkA: oklch(0.66, 0.17 * c, h), inkB: oklch(0.48, 0.19 * c, h2) }
        : { inkA: oklch(0.86, 0.13 * c, h), inkB: oklch(0.66, 0.19 * c, h2) };
    case 'gilded':
      return mode === 'light'
        ? { inkA: oklch(0.68, 0.12, 78), inkB: oklch(0.46, 0.1, 58) }
        : { inkA: oklch(0.94, 0.06, 95), inkB: oklch(0.72, 0.12, 72) };
    default:
      throw new Error(`Unknown edition ${edition}`);
  }
}

/** Colors for a folder in the given edition. */
export function folderColors(def, edition, mode = 'dark') {
  const { h, h2, c, yellow } = tone(def);
  switch (edition) {
    case 'aurora':
    case 'halo': {
      const lift = edition === 'halo' ? 0.03 : 0;
      return yellow
        ? {
            back: [oklch(0.74 + lift, 0.15 * c, h2), oklch(0.64 + lift, 0.15 * c, h2 - 8)],
            front: [oklch(0.93 + lift, 0.13 * c, h + 6), oklch(0.79 + lift, 0.16 * c, h2)],
            ink: oklch(0.32, 0.06, h2),
            sheet: '#ffffff',
          }
        : {
            back: [oklch(0.6 + lift, 0.15 * c, h2), oklch(0.47 + lift, 0.15 * c, h2 - 8)],
            front: [oklch(0.83 + lift, 0.12 * c, h), oklch(0.62 + lift, 0.19 * c, h2)],
            ink: '#ffffff',
            sheet: '#ffffff',
          };
    }
    case 'noir':
      return {
        back: [oklch(0.43, 0.05 * c, h), oklch(0.32, 0.04 * c, h2)],
        front: [oklch(0.35, 0.035 * c, h), oklch(0.2, 0.02 * c, h2)],
        rimA: oklch(0.86, 0.15 * c, h),
        rimB: oklch(0.6, 0.18 * c, h2),
        inkA: oklch(0.92, 0.11 * c, h),
        inkB: oklch(0.74, 0.18 * c, h2),
        sheet: oklch(0.86, 0.1 * c, h),
      };
    case 'frost':
      return {
        back: [oklch(0.84, 0.07 * c, h2), oklch(0.76, 0.08 * c, h2)],
        front: [oklch(0.98, 0.025 * c, h), oklch(0.89, 0.08 * c, h2)],
        rim: oklch(0.72, 0.09 * c, h2),
        ink: oklch(0.46, 0.15 * c, h2),
        sheet: '#ffffff',
      };
    case 'gilded':
      return mode === 'light'
        ? {
            back: [oklch(0.58, 0.1, 68), oklch(0.46, 0.09, 58)],
            front: [oklch(0.84, 0.1, 88), oklch(0.62, 0.12, 70)],
            ink: oklch(0.3, 0.05, 60),
            sheet: oklch(0.97, 0.03, 95),
          }
        : {
            back: [oklch(0.66, 0.1, 72), oklch(0.52, 0.09, 62)],
            front: [oklch(0.95, 0.06, 95), oklch(0.74, 0.12, 74)],
            ink: oklch(0.32, 0.05, 60),
            sheet: oklch(0.98, 0.02, 95),
          };
    default:
      throw new Error(`Unknown edition ${edition}`);
  }
}
