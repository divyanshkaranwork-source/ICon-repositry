// OKLCH → sRGB hex, with chroma reduction to stay inside the sRGB gamut.
// Every Lumora color is defined perceptually so that hues sit at the same
// visual weight no matter where they live on the wheel.

function oklabToLinear(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const toGamma = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
const inGamut = (rgb) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);

export function oklchToRgb(L, C, h) {
  const rad = (h * Math.PI) / 180;
  let c = C;
  let rgb = oklabToLinear(L, c * Math.cos(rad), c * Math.sin(rad));
  // Binary-search the largest chroma that fits in sRGB.
  if (!inGamut(rgb)) {
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 24; i++) {
      c = (lo + hi) / 2;
      rgb = oklabToLinear(L, c * Math.cos(rad), c * Math.sin(rad));
      if (inGamut(rgb)) lo = c;
      else hi = c;
    }
    rgb = oklabToLinear(L, lo * Math.cos(rad), lo * Math.sin(rad));
  }
  return rgb.map((v) => Math.round(Math.min(1, Math.max(0, toGamma(v))) * 255));
}

export function oklch(L, C, h) {
  const [r, g, b] = oklchToRgb(L, C, ((h % 360) + 360) % 360);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}
