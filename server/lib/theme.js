const DEFAULT_PRIMARY = '#a67c52';

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function normalizeHex(input) {
  if (typeof input !== 'string') return null;
  let hex = input.trim();
  if (!hex) return null;
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  return hex.toLowerCase();
}

function hexToRgb(hex) {
  const n = normalizeHex(hex);
  if (!n) return null;
  return {
    r: parseInt(n.slice(1, 3), 16),
    g: parseInt(n.slice(3, 5), 16),
    b: parseInt(n.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }) {
  const to = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toLowerCase();
}

function rgbToHsl({ r, g, b }) {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case R:
      h = (G - B) / d + (G < B ? 6 : 0);
      break;
    case G:
      h = (B - R) / d + 2;
      break;
    default:
      h = (R - G) / d + 4;
  }
  return { h: h / 6, s, l };
}

function hslToRgb({ h, s, l }) {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p, q, t) => {
    let T = t;
    if (T < 0) T += 1;
    if (T > 1) T -= 1;
    if (T < 1 / 6) return p + (q - p) * 6 * T;
    if (T < 1 / 2) return q;
    if (T < 2 / 3) return p + (q - p) * (2 / 3 - T) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255,
  };
}

function adjust(hex, { s = 0, l = 0 } = {}) {
  const rgb = hexToRgb(hex);
  if (!rgb) return DEFAULT_PRIMARY;
  const hsl = rgbToHsl(rgb);
  return rgbToHex(
    hslToRgb({
      h: hsl.h,
      s: clamp(hsl.s + s, 0, 1),
      l: clamp(hsl.l + l, 0, 1),
    })
  );
}

function mixWithWhite(hex, amount) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#FFFFFF';
  const a = clamp(amount, 0, 1);
  return rgbToHex({
    r: rgb.r + (255 - rgb.r) * a,
    g: rgb.g + (255 - rgb.g) * a,
    b: rgb.b + (255 - rgb.b) * a,
  });
}

function mixWithBlack(hex, amount) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  const a = clamp(amount, 0, 1);
  return rgbToHex({
    r: rgb.r * (1 - a),
    g: rgb.g * (1 - a),
    b: rgb.b * (1 - a),
  });
}

function buildPalette(primaryInput) {
  const primary = normalizeHex(primaryInput) || DEFAULT_PRIMARY;
  const teak = primary;
  const teakDeep = adjust(teak, { l: -0.08, s: 0.02 });
  const teakRich = adjust(teak, { l: -0.16, s: 0.04 });
  const teakSoft = adjust(teak, { l: 0.12, s: -0.06 });
  const teakMist = mixWithWhite(teak, 0.78);
  const ink = teakRich;
  const charcoal = teakDeep;
  const sage = teakDeep;
  const black = mixWithBlack(teak, 0.55);
  const text = mixWithBlack(teak, 0.72);
  const cream = mixWithWhite(teak, 0.92);
  const creamDark = mixWithWhite(teak, 0.86);
  const stone = mixWithWhite(teak, 0.8);
  const grayPill = mixWithWhite(teak, 0.82);
  const inkRgb = hexToRgb(ink);
  const textRgb = hexToRgb(text);

  return {
    primary,
    teak,
    teakDeep,
    teakRich,
    teakSoft,
    teakMist,
    ink,
    charcoal,
    sage,
    black,
    text,
    cream,
    creamDark,
    stone,
    grayPill,
    inkRgb: inkRgb ? `${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}` : '107, 79, 50',
    textRgb: textRgb ? `${textRgb.r}, ${textRgb.g}, ${textRgb.b}` : '47, 36, 24',
    textMuted: textRgb
      ? `rgba(${textRgb.r}, ${textRgb.g}, ${textRgb.b}, 0.58)`
      : 'rgba(47, 36, 24, 0.58)',
  };
}

function buildThemeCss(primaryInput) {
  const p = buildPalette(primaryInput);
  return `:root {
  --teak: ${p.teak};
  --teak-deep: ${p.teakDeep};
  --teak-rich: ${p.teakRich};
  --teak-soft: ${p.teakSoft};
  --teak-mist: ${p.teakMist};
  --ink: ${p.ink};
  --charcoal: ${p.charcoal};
  --black: ${p.black};
  --text: ${p.text};
  --text-muted: ${p.textMuted};
  --cream: ${p.cream};
  --cream-dark: ${p.creamDark};
  --stone: ${p.stone};
  --gray-pill: ${p.grayPill};
  --sage: ${p.sage};
  --ink-rgb: ${p.inkRgb};
  --text-rgb: ${p.textRgb};
}`;
}

module.exports = {
  DEFAULT_PRIMARY,
  normalizeHex,
  buildPalette,
  buildThemeCss,
};
