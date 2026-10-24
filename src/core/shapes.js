// Geometry helpers that emit compact SVG path data on Lumora's 24-unit glyph grid.

const n = (v) => +(+v).toFixed(2);

/** Circle. */
export const C = (cx, cy, r) =>
  `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0z`;

/** Ellipse. */
export const E = (cx, cy, rx, ry) =>
  `M${n(cx - rx)} ${n(cy)}a${n(rx)} ${n(ry)} 0 1 0 ${n(2 * rx)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-2 * rx)} 0z`;

/** Rounded rectangle. */
export const R = (x, y, w, h, r = 0) => {
  if (!r) return `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`;
  r = Math.min(r, w / 2, h / 2);
  return (
    `M${n(x + r)} ${n(y)}h${n(w - 2 * r)}a${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(r)}` +
    `v${n(h - 2 * r)}a${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(r)}h${n(-(w - 2 * r))}` +
    `a${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(-r)}v${n(-(h - 2 * r))}a${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(-r)}z`
  );
};

/** Polyline / polygon through points. */
export const P = (pts, close = false) =>
  'M' + pts.map(([x, y]) => `${n(x)} ${n(y)}`).join('L') + (close ? 'z' : '');

const polar = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

/** Regular polygon. */
export const ngon = (cx, cy, r, sides, rot = -90) =>
  P(Array.from({ length: sides }, (_, i) => polar(cx, cy, r, rot + (360 / sides) * i)), true);

export const ngonPoints = (cx, cy, r, sides, rot = -90) =>
  Array.from({ length: sides }, (_, i) => polar(cx, cy, r, rot + (360 / sides) * i));

/** Star polygon. */
export const star = (cx, cy, r1, r2, points = 5, rot = -90) =>
  P(
    Array.from({ length: points * 2 }, (_, i) =>
      polar(cx, cy, i % 2 ? r2 : r1, rot + (180 / points) * i),
    ),
    true,
  );

/** Concave four-point sparkle. */
export const sparkle = (cx, cy, r) =>
  `M${n(cx)} ${n(cy - r)}Q${n(cx)} ${n(cy)} ${n(cx + r)} ${n(cy)}Q${n(cx)} ${n(cy)} ${n(cx)} ${n(cy + r)}` +
  `Q${n(cx)} ${n(cy)} ${n(cx - r)} ${n(cy)}Q${n(cx)} ${n(cy)} ${n(cx)} ${n(cy - r)}z`;

/** Gear with a center hole (use with evenodd). */
export const gear = (cx, cy, ro, ri, teeth, hole) => {
  const pts = [];
  const step = 360 / teeth;
  const ht = step * 0.2;
  const hb = step * 0.3;
  for (let i = 0; i < teeth; i++) {
    const a = -90 + step * i;
    pts.push(polar(cx, cy, ri, a - hb), polar(cx, cy, ro, a - ht), polar(cx, cy, ro, a + ht), polar(cx, cy, ri, a + hb));
  }
  return P(pts, true) + (hole ? C(cx, cy, hole) : '');
};

/** Radial spokes from r1 to r2. */
export const spokes = (cx, cy, r1, r2, count, rot = -90) =>
  Array.from({ length: count }, (_, i) => {
    const a = rot + (360 / count) * i;
    return P([polar(cx, cy, r1, a), polar(cx, cy, r2, a)]);
  }).join('');

export { polar };
