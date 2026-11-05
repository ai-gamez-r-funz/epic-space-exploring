// Theme: palette, fonts, text style presets, gradient helpers. Import fonts ONCE here.
import '@fontsource/josefin-sans/latin-400.css';
import '@fontsource/josefin-sans/latin-600.css';
import '@fontsource/josefin-sans/latin-700.css';
import '@fontsource/syncopate/latin-400.css';
import '@fontsource/syncopate/latin-700.css';
import '@fontsource/space-mono/latin-400.css';
import '@fontsource/space-mono/latin-700.css';
import { FillGradient, TextStyle } from 'pixi.js';

export const W = 1280, H = 720;           // logical stage size

export const C = {
  ink: 0x0b0d1e, deep: 0x10132b, indigo: 0x1b1f4a, panel: 0x232859, panelLight: 0x333a7a, panelDark: 0x141734,
  teal: 0x3fc1b0, tealDark: 0x1d6f6c, tealLight: 0x8fe8d8,
  cream: 0xf2e3b8, creamDark: 0xd8c690,
  coral: 0xf06c5a, coralDark: 0x9c3b34,
  mustard: 0xe8b53a, mustardDark: 0x9a7414,
  brass: 0xc9994a, brassDark: 0x7d5c24, brassLight: 0xf0d08a,
  sage: 0x8fb98b, plum: 0x8a5fa8,
  text: 0xf2e3b8, textDim: 0x9ea3d0, textInk: 0x1a1830,
  good: 0x7fd6a0, bad: 0xf0705e, warn: 0xe8b53a, info: 0x6fc7e8,
};
export const hex = (n) => '#' + (n & 0xffffff).toString(16).padStart(6, '0');
export const rgb = (n) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
export function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return ((A[0] + (B[0] - A[0]) * t) << 16) | ((A[1] + (B[1] - A[1]) * t) << 8) | ((A[2] + (B[2] - A[2]) * t) | 0);
}
export const lighten = (c, t = 0.2) => mix(c, 0xffffff, t);
export const darken = (c, t = 0.2) => mix(c, 0x000000, t);

export const F = {
  body: '"Josefin Sans", "Trebuchet MS", sans-serif',
  head: 'Syncopate, "Josefin Sans", sans-serif',
  mono: '"Space Mono", "Courier New", monospace',
};

export async function loadFonts() {
  if (typeof document === 'undefined' || !document.fonts) return;
  const specs = [
    '400 16px "Josefin Sans"', '600 16px "Josefin Sans"', '700 16px "Josefin Sans"',
    '400 16px Syncopate', '700 16px Syncopate', '400 16px "Space Mono"', '700 16px "Space Mono"',
  ];
  try { await Promise.race([Promise.all(specs.map((s) => document.fonts.load(s, 'AaBb09 ·→✓'))), new Promise((r) => setTimeout(r, 4000))]); await document.fonts.ready; } catch (e) { /* fall back to system fonts */ }
}

/** Preset text styles. Use `textStyle('body', { fill: C.teal })`. Sizes are logical px. */
export const TEXT = {
  body:    { fontFamily: F.body, fontSize: 18, fontWeight: '400', fill: C.text, lineHeight: 24 },
  bodyB:   { fontFamily: F.body, fontSize: 18, fontWeight: '700', fill: C.text, lineHeight: 24 },
  small:   { fontFamily: F.body, fontSize: 15, fontWeight: '400', fill: C.text, lineHeight: 19 },
  tiny:    { fontFamily: F.body, fontSize: 12, fontWeight: '600', fill: C.textDim, lineHeight: 15, letterSpacing: 0.5 },
  label:   { fontFamily: F.body, fontSize: 16, fontWeight: '700', fill: C.text, letterSpacing: 1.2 },
  button:  { fontFamily: F.body, fontSize: 16, fontWeight: '700', fill: C.text, letterSpacing: 1.4 },
  head:    { fontFamily: F.head, fontSize: 16, fontWeight: '700', fill: C.cream, letterSpacing: 2.5 },
  headSm:  { fontFamily: F.head, fontSize: 11, fontWeight: '700', fill: C.cream, letterSpacing: 2 },
  title:   { fontFamily: F.head, fontSize: 30, fontWeight: '700', fill: C.cream, letterSpacing: 4 },
  display: { fontFamily: F.head, fontSize: 64, fontWeight: '700', fill: C.cream, letterSpacing: 8 },
  num:     { fontFamily: F.mono, fontSize: 16, fontWeight: '700', fill: C.cream },
  numSm:   { fontFamily: F.mono, fontSize: 12, fontWeight: '400', fill: C.cream },
  mono:    { fontFamily: F.mono, fontSize: 14, fontWeight: '400', fill: C.text, lineHeight: 20 },
};
export function textStyle(preset = 'body', over = {}) {
  const base = TEXT[preset] || TEXT.body;
  const o = { ...base, ...over };
  if (o.fill == null) o.fill = C.text;
  return new TextStyle({ wordWrap: false, align: 'left', ...o });
}

const gradCache = new Map();
/** Cached local-space linear gradient: grad([[0,c0],[1,c1]], 'v'|'h'). Works for any shape size. */
export function grad(stops, dir = 'v') {
  const key = dir + stops.map((s) => s[0] + ':' + s[1]).join(',');
  let g = gradCache.get(key);
  if (!g) {
    g = new FillGradient({
      type: 'linear', start: { x: 0, y: 0 }, end: dir === 'v' ? { x: 0, y: 1 } : { x: 1, y: 0 },
      colorStops: stops.map(([offset, color]) => ({ offset, color })), textureSpace: 'local',
    });
    gradCache.set(key, g);
  }
  return g;
}

/** Shared mutable runtime info, updated by app.js on resize. */
export const Display = { scale: 1, dpr: 1, res: 1, touch: false };

export const MOOD_COLORS = (m) => (m >= 70 ? C.good : m >= 40 ? C.mustard : m >= 20 ? 0xe88a4a : C.bad);
export const STAR_COLORS = {
  yellow: 0xffe08a, orange: 0xffa45c, red: 0xff6a4d, white: 0xf4f6ff, blue: 0x8ec4ff, binary: 0xffd0a0, neutron: 0xbfe9ff, blackhole: 0x8a5fa8,
};
