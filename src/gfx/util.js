import { Texture, Sprite, Container } from 'pixi.js';
import { hex } from './palette.js';

// ---------- deterministic RNG ----------
export function hashStr(s) {
  s = String(s);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rng(seed) {
  let a = (typeof seed === 'number' ? seed : hashStr(seed)) >>> 0 || 0x9e3779b9;
  const f = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.range = (lo, hi) => lo + (hi - lo) * f();
  f.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * f());
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  f.chance = (p) => f() < p;
  return f;
}

// ---------- 3D value noise (seeded, tileable via sphere sampling) ----------
export function makeNoise(seed) {
  const r = rng(seed);
  const P = new Uint8Array(512), V = new Float32Array(256);
  const perm = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 512; i++) P[i] = perm[i & 255];
  for (let i = 0; i < 256; i++) V[i] = r();
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const n3 = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const X = xi & 255, Y = yi & 255, Z = zi & 255;
    const u = fade(xf), v = fade(yf), w = fade(zf);
    const h = (a, b, c) => V[P[P[P[X + a] + Y + b] + Z + c]];
    const l = (a, b, t) => a + (b - a) * t;
    return l(
      l(l(h(0, 0, 0), h(1, 0, 0), u), l(h(0, 1, 0), h(1, 1, 0), u), v),
      l(l(h(0, 0, 1), h(1, 0, 1), u), l(h(0, 1, 1), h(1, 1, 1), u), v), w);
  };
  const fbm = (x, y, z, oct = 5, lac = 2, gain = 0.5) => {
    let s = 0, a = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) { s += a * n3(x * f, y * f, z * f); norm += a; a *= gain; f *= lac; }
    return s / norm;
  };
  const ridged = (x, y, z, oct = 4) => {
    let s = 0, a = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) { s += a * (1 - Math.abs(n3(x * f, y * f, z * f) * 2 - 1)); norm += a; a *= 0.5; f *= 2.1; }
    return s / norm;
  };
  return { n3, fbm, ridged };
}

// ---------- LRU cache ----------
export class LRU {
  constructor(max = 48, onEvict) { this.max = max; this.m = new Map(); this.onEvict = onEvict; }
  get(k) { if (!this.m.has(k)) return undefined; const v = this.m.get(k); this.m.delete(k); this.m.set(k, v); return v; }
  set(k, v) {
    this.m.set(k, v);
    while (this.m.size > this.max) {
      const [ok, ov] = this.m.entries().next().value; this.m.delete(ok);
      if (this.onEvict) try { this.onEvict(ov, ok); } catch (e) { /* noop */ }
    }
    return v;
  }
  memo(k, fn) { let v = this.get(k); if (v === undefined) v = this.set(k, fn()); return v; }
}

// ---------- canvas helpers ----------
export function makeCanvas(w, h) {
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}
export const texCache = new LRU(160);
export function canvasTex(c) { return Texture.from(c); }

/** radial glow texture (white-ish -> transparent), shared */
const glowCache = new Map();
export function glowTexture(colour = 0xffffff, size = 128, hard = 0.0, power = 2) {
  const key = `${colour}|${size}|${hard}|${power}`;
  if (glowCache.has(key)) return glowCache.get(key);
  const c = makeCanvas(size, size), g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, size * 0.5 * hard, size / 2, size / 2, size / 2);
  const col = hex(colour), steps = 12;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = Math.pow(1 - t, power);
    const [r, gg, b] = [(colour >> 16) & 255, (colour >> 8) & 255, colour & 255];
    gr.addColorStop(hard + t * (1 - hard), `rgba(${r},${gg},${b},${a.toFixed(3)})`);
  }
  void col;
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = Texture.from(c); glowCache.set(key, t); return t;
}
export function glowSprite(colour, radius, alpha = 1, power = 2, hard = 0) {
  const s = new Sprite(glowTexture(colour, 128, hard, power));
  s.anchor.set(0.5); s.width = s.height = radius * 2; s.alpha = alpha; s.blendMode = 'add';
  return s;
}

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export function lerpCol(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255, br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return ((ar + (br - ar) * t) << 16) | ((ag + (bg - ag) * t) << 8) | ((ab + (bb - ab) * t) | 0);
}

/** Container with an update list */
export function animated() {
  const c = new Container(); c._u = [];
  c.update = (dt, ...a) => { for (let i = 0; i < c._u.length; i++) c._u[i](dt, ...a); };
  c.onUpdate = (fn) => { c._u.push(fn); return c; };
  return c;
}
