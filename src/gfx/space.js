import { Container, Sprite, Texture, TilingSprite, Graphics } from 'pixi.js';
import { rng, makeNoise, LRU, makeCanvas, glowSprite, glowTexture, TAU, hashStr, clamp, lerp, animated } from './util.js';
import { hex } from './palette.js';

const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const hsl2rgb = (h, s, l) => {
  h = ((h % 360) + 360) % 360 / 360;
  const f = (n) => { const k = (n + h * 12) % 12; const a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [f(0) * 255, f(8) * 255, f(4) * 255];
};

// -------------------------------------------------- vertical gradient texture (cached)
const gradCache = new LRU(40);
export function gradTex(stops, w = 4, h = 256, horizontal = false) {
  const key = JSON.stringify(stops) + w + h + horizontal;
  return gradCache.memo(key, () => {
    const c = makeCanvas(w, h), g = c.getContext('2d');
    const gr = horizontal ? g.createLinearGradient(0, 0, w, 0) : g.createLinearGradient(0, 0, 0, h);
    for (const [t, col] of stops) gr.addColorStop(t, col);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    return Texture.from(c);
  });
}
export function gradRect(w, h, stops, horizontal = false) {
  const s = new Sprite(gradTex(stops, horizontal ? 256 : 4, horizontal ? 4 : 256, horizontal)); s.width = w; s.height = h; return s;
}

const streakCache = new LRU(16);
/** soft-edged streak: head at left (x=0), fading along +x, gaussian across */
export function streakTex(rgbCol, head = 0.9, power = 1.5) {
  return streakCache.memo(`${rgbCol}|${head}|${power}`, () => {
    const W = 256, H = 48, c = makeCanvas(W, H), g = c.getContext('2d'), img = g.createImageData(W, H);
    const r = (rgbCol >> 16) & 255, gg = (rgbCol >> 8) & 255, b = rgbCol & 255;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = x / W, v = (y + 0.5) / H * 2 - 1;
      const wid = 0.35 + 0.65 * u; // widens slightly toward the tail
      const a = head * Math.pow(1 - u, power) * Math.exp(-(v * v) / (0.18 * wid * wid + 0.02)) * Math.min(1, u * 30 + 0.2);
      const k = (y * W + x) * 4; img.data[k] = r; img.data[k + 1] = gg; img.data[k + 2] = b; img.data[k + 3] = a * 255;
    }
    g.putImageData(img, 0, 0); return Texture.from(c);
  });
}

// -------------------------------------------------- starfield
const tileCache = new LRU(24);
function starTile(seed, layer, size, n, bright) {
  return tileCache.memo(`${seed}|${layer}|${size}|${n}`, () => {
    const R = rng(hashStr(`st${seed}${layer}`));
    const c = makeCanvas(size, size), g = c.getContext('2d');
    const tints = ['255,250,235', '210,225,255', '255,225,190', '255,255,255'];
    for (let i = 0; i < n; i++) {
      const x = R() * size, y = R() * size, r = (0.35 + R() * R() * 1.1) * (layer === 2 ? 1.4 : layer === 1 ? 1 : 0.75);
      const a = (0.25 + R() * 0.75) * bright;
      g.fillStyle = `rgba(${R.pick(tints)},${a.toFixed(2)})`;
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      if (r > 1.1 && R() < 0.5) { g.fillStyle = `rgba(255,240,220,${(a * 0.18).toFixed(2)})`; g.beginPath(); g.arc(x, y, r * 2.6, 0, TAU); g.fill(); }
    }
    const t = Texture.from(c); t.source.style.addressMode = 'repeat'; return t;
  });
}
const bgStops = [[0, '#080a1a'], [0.55, '#0b0d1e'], [1, '#12132e']];

export function createStarfield({ w = 1280, h = 720, seed = 1, density = 1, parallax = 1, bg = true } = {}) {
  const root = animated();
  if (bg) root.addChild(gradRect(w, h, bgStops));
  const R = rng(hashStr('sf' + seed));
  const layers = [];
  const cfg = [[0, 380, 0.012, 0.6], [1, 260, 0.03, 0.8], [2, 120, 0.06, 1]];
  for (const [li, n, par, br] of cfg) {
    const size = 512;
    const ts = new TilingSprite({ texture: starTile(seed, li, size, Math.round(n * density), br), width: w, height: h });
    ts.tileScale.set(1); root.addChild(ts); layers.push({ ts, par, drift: (li + 1) * 0.6 });
  }
  // twinkling bright stars
  const tw = [];
  const nt = Math.round(18 * density * (w * h) / (1280 * 720)) + 4;
  const cols = [0xfff6dd, 0xcfe0ff, 0xffd9a8, 0xffffff];
  for (let i = 0; i < nt; i++) {
    const s = glowSprite(R.pick(cols), R.range(3.5, 8), 0.8, 2.2);
    s.x = R() * w; s.y = R() * h; tw.push({ s, ph: R() * TAU, sp: R.range(0.6, 2.2), base: R.range(0.35, 0.9) });
    root.addChild(s);
  }
  let t = 0, cx = 0, cy = 0;
  root.update = (dt, camX = 0, camY = 0) => {
    t += dt;
    for (const L of layers) { L.ts.tilePosition.x = -camX * L.par * parallax - t * L.drift; L.ts.tilePosition.y = -camY * L.par * parallax; }
    for (const o of tw) o.s.alpha = o.base * (0.55 + 0.45 * Math.sin(t * o.sp + o.ph));
    cx = camX; cy = camY;
  };
  root.resizeTo = (nw, nh) => { for (const L of layers) { L.ts.width = nw; L.ts.height = nh; } };
  return root;
}

// -------------------------------------------------- nebula
const nebCache = new LRU(12);
export function nebulaTexture(w, h, seed, hue) {
  const sw = Math.min(512, Math.max(96, Math.round(w / 2.5))), sh = Math.max(64, Math.round(sw * h / w));
  const key = `${sw}|${sh}|${seed}|${hue}`;
  return nebCache.memo(key, () => {
    const R = rng(hashStr('neb' + seed));
    const N = makeNoise(R() * 1e9 | 0), N2 = makeNoise(R() * 1e9 | 0);
    const hdeg = hue == null ? R() * 360 : (hue <= 360 ? hue : null);
    let base;
    if (hdeg != null) base = hdeg;
    else { const r = (hue >> 16) & 255, g = (hue >> 8) & 255, b = hue & 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const d = mx - mn || 1; let hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; base = (hh * 60 + 360) % 360; }
    const c1 = hsl2rgb(base, 0.62, 0.5), c2 = hsl2rgb(base + 45, 0.55, 0.55), c3 = hsl2rgb(base - 40, 0.5, 0.35), hot = hsl2rgb(base + 15, 0.5, 0.82);
    const c = makeCanvas(sw, sh), g = c.getContext('2d'), img = g.createImageData(sw, sh);
    const off = R() * 100, ar = sw / sh;
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const u = x / sw * ar * 2.2, v = y / sh * 2.2;
      const qx = N.fbm(u + off, v, 1.5, 3), qy = N.fbm(u, v + 5, 3.5, 3);
      const d = N2.fbm(u * 1.3 + qx * 1.8, v * 1.3 + qy * 1.8, off, 6);
      const d2 = N.fbm(u * 2.4 + qy * 2, v * 2.4 + qx * 2, off + 7, 4);
      let dens = sstep(0.38, 0.8, d);
      const lane = sstep(0.55, 0.7, N2.fbm(u * 2 + 4, v * 2 + 4, 9, 4));
      dens *= 1 - lane * 0.55;
      const mixA = sstep(0.3, 0.7, d2), mixB = sstep(0.4, 0.8, qx);
      let r = lerp(c1[0], c2[0], mixA), gg = lerp(c1[1], c2[1], mixA), b = lerp(c1[2], c2[2], mixA);
      r = lerp(r, c3[0], mixB * 0.6); gg = lerp(gg, c3[1], mixB * 0.6); b = lerp(b, c3[2], mixB * 0.6);
      const core = sstep(0.62, 0.9, d) * 0.55;
      r = lerp(r, hot[0], core); gg = lerp(gg, hot[1], core); b = lerp(b, hot[2], core);
      const ex = (x / sw - 0.5), ey = (y / sh - 0.5), edge = 1 - sstep(0.35, 0.72, Math.hypot(ex * 1.1, ey * 1.4));
      const a = clamp(dens * edge * (0.55 + d2 * 0.55), 0, 0.85);
      const k = (y * sw + x) * 4;
      img.data[k] = r; img.data[k + 1] = gg; img.data[k + 2] = b; img.data[k + 3] = a * 255;
    }
    g.putImageData(img, 0, 0);
    return Texture.from(c);
  });
}
export function createNebula({ w = 1280, h = 720, seed = 1, hue } = {}) {
  const root = animated();
  const tex = nebulaTexture(w, h, seed, hue);
  const a = new Sprite(tex), b = new Sprite(tex);
  a.width = w * 1.15; a.height = h * 1.15; a.anchor.set(0.5); a.position.set(w / 2, h / 2); a.alpha = 0.95;
  b.width = w * 1.35; b.height = h * 1.3; b.anchor.set(0.5); b.position.set(w / 2, h / 2); b.scale.x *= -1; b.alpha = 0.45; b.blendMode = 'add'; b.rotation = 0.2;
  root.addChild(b, a);
  let t = 0;
  root.update = (dt) => {
    t += dt;
    a.x = w / 2 + Math.sin(t * 0.045) * w * 0.02; a.y = h / 2 + Math.cos(t * 0.037) * h * 0.02; a.alpha = 0.88 + 0.07 * Math.sin(t * 0.3);
    b.x = w / 2 - Math.sin(t * 0.03) * w * 0.025; b.y = h / 2 + Math.sin(t * 0.04) * h * 0.02; b.rotation = 0.2 + Math.sin(t * 0.02) * 0.04;
  };
  return root;
}

// -------------------------------------------------- stars
export const STAR_COL = {
  yellow: { core: 0xfff3c0, mid: 0xffd25a, glow: 0xffb53a, ray: 0xffe6a0 },
  orange: { core: 0xffe2b0, mid: 0xffa24a, glow: 0xff7a2a, ray: 0xffc080 },
  red: { core: 0xffd0b8, mid: 0xff6a4a, glow: 0xe03a30, ray: 0xff9a80 },
  white: { core: 0xffffff, mid: 0xeaf2ff, glow: 0xbcd4ff, ray: 0xffffff },
  blue: { core: 0xf0f6ff, mid: 0x9cc8ff, glow: 0x5a9aff, ray: 0xbcdcff },
  neutron: { core: 0xffffff, mid: 0xcfe6ff, glow: 0x7ab0ff, ray: 0xdff0ff },
};
const discCache = new LRU(16);
function discTexture(type) {
  return discCache.memo(type, () => {
    const col = STAR_COL[type] || STAR_COL.yellow, S = 192;
    const c = makeCanvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S);
    const N = makeNoise(hashStr(type));
    const A = [(col.core >> 16) & 255, (col.core >> 8) & 255, col.core & 255], B = [(col.mid >> 16) & 255, (col.mid >> 8) & 255, col.mid & 255], Cc = [(col.glow >> 16) & 255, (col.glow >> 8) & 255, col.glow & 255];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const px = (x + 0.5) / S * 2 - 1, py = (y + 0.5) / S * 2 - 1, d = Math.hypot(px, py);
      if (d > 1) continue;
      const z = Math.sqrt(1 - d * d);
      const gran = N.fbm(px * 6, py * 6, 2, 4) - 0.5;
      let t = clamp(Math.pow(1 - z, 1.4) * 1.15 + gran * 0.35, 0, 1); // 0 centre → 1 limb
      const r = t < 0.5 ? lerp(A[0], B[0], t * 2) : lerp(B[0], Cc[0], (t - 0.5) * 2);
      const gg = t < 0.5 ? lerp(A[1], B[1], t * 2) : lerp(B[1], Cc[1], (t - 0.5) * 2);
      const b = t < 0.5 ? lerp(A[2], B[2], t * 2) : lerp(B[2], Cc[2], (t - 0.5) * 2);
      const k = (y * S + x) * 4;
      img.data[k] = r; img.data[k + 1] = gg; img.data[k + 2] = b; img.data[k + 3] = 255 * clamp((1 - d) * S * 0.4, 0, 1);
    }
    g.putImageData(img, 0, 0); return Texture.from(c);
  });
}
const rayCache = new LRU(16);
function rayTexture(colour, spikes = 8, S = 256) {
  return rayCache.memo(`${colour}${spikes}${S}`, () => {
    const c = makeCanvas(S, S), g = c.getContext('2d');
    g.translate(S / 2, S / 2);
    const R = rng(spikes * 31 + colour);
    const [r, gg, b] = [(colour >> 16) & 255, (colour >> 8) & 255, colour & 255];
    for (let i = 0; i < spikes; i++) {
      const a = i / spikes * TAU + R() * 0.1, len = S / 2 * (0.55 + R() * 0.45), wd = 0.05 + R() * 0.05;
      g.save(); g.rotate(a);
      const gr = g.createLinearGradient(0, 0, len, 0);
      gr.addColorStop(0, `rgba(${r},${gg},${b},0.7)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, -S * wd * 0.35); g.lineTo(len, 0); g.lineTo(0, S * wd * 0.35); g.closePath(); g.fill();
      g.restore();
    }
    return Texture.from(c);
  });
}

function singleStar(type, radius, withRays = true) {
  const col = STAR_COL[type] || STAR_COL.yellow;
  const c = new Container();
  const glow2 = glowSprite(col.glow, radius * 4.2, 0.45, 2.2);
  const glow1 = glowSprite(col.mid, radius * 2.3, 0.7, 1.8, 0.25);
  const rays = [];
  if (withRays) for (let i = 0; i < 2; i++) {
    const s = new Sprite(rayTexture(col.ray, i ? 6 : 9)); s.anchor.set(0.5); s.width = s.height = radius * (i ? 4.6 : 6.4); s.blendMode = 'add'; s.alpha = 0.55; s.rotation = i; rays.push(s);
  }
  const disc = new Sprite(discTexture(type)); disc.anchor.set(0.5); disc.width = disc.height = radius * 2;
  const core = glowSprite(0xffffff, radius * 1.15, 0.55, 2.5);
  c.addChild(glow2, ...rays, glow1, disc, core);
  c._tick = (t, ph = 0) => {
    const p = 1 + 0.045 * Math.sin(t * 1.3 + ph) + 0.02 * Math.sin(t * 3.1 + ph * 2);
    glow1.scale.set(glow1.scale.x * 0 + (radius * 2.3 * p) / 64 * 1); glow2.alpha = 0.4 + 0.08 * Math.sin(t * 0.9 + ph);
    glow2.scale.set((radius * 4.2 * (1 + 0.03 * Math.sin(t * 0.7 + ph))) / 64);
    rays.forEach((r, i) => { r.rotation += (i ? -1 : 1) * 0.0016; r.alpha = 0.45 + 0.15 * Math.sin(t * (1 + i) + ph); });
    disc.rotation = t * 0.03;
  };
  return c;
}

const lerpc = (a, b, t) => ((((a >> 16) & 255) + ((((b >> 16) & 255) - ((a >> 16) & 255)) * t)) << 16) | ((((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * t)) << 8) | ((a & 255) + (((b & 255) - (a & 255)) * t));

const ACC_CACHE = new LRU(4);
function accretionTex() {
  return ACC_CACHE.memo('acc', () => {
    const S = 512, c = makeCanvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S), N = makeNoise(5);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const px = (x + 0.5) / S * 2 - 1, py = (y + 0.5) / S * 2 - 1, r = Math.hypot(px, py), k = (y * S + x) * 4;
      if (r > 1 || r < 0.26) continue;
      const u = (r - 0.26) / 0.74, ang = Math.atan2(py, px);
      const swirl = N.fbm(Math.cos(ang + u * 3) * 2 + 3, Math.sin(ang + u * 3) * 2, u * 6, 4);
      let a = Math.pow(1 - u, 1.5) * sstep(0, 0.06, u) * (0.45 + swirl * 0.9);
      const dop = 0.55 + 0.45 * Math.cos(ang - Math.PI); // brighter on left side
      a *= dop + 0.25;
      const heat = Math.pow(1 - u, 1.6);
      img.data[k] = lerp(255, 255, heat); img.data[k + 1] = lerp(130, 235, heat * heat); img.data[k + 2] = lerp(50, 190, heat * heat * heat);
      img.data[k + 3] = clamp(a, 0, 1) * 255;
    }
    g.putImageData(img, 0, 0); return Texture.from(c);
  });
}

export function createStar({ type = 'yellow', radius = 40 } = {}) {
  const root = animated();
  let t = Math.random() * 10;
  if (type === 'binary') {
    const a = singleStar('orange', radius * 0.8), b = singleStar('blue', radius * 0.5);
    root.addChild(a, b);
    root.update = (dt) => { t += dt; const ang = t * 0.35; a.x = Math.cos(ang) * radius * 0.55; a.y = Math.sin(ang) * radius * 0.16; b.x = -Math.cos(ang) * radius * 1.05; b.y = -Math.sin(ang) * radius * 0.3; a._tick(t); b._tick(t, 2); root.sortables(a, b, ang); };
    root.sortables = (x, y, ang) => { if (Math.sin(ang) > 0) { if (root.children[0] !== x) root.setChildIndex(x, 0); } else if (root.children[0] !== y) root.setChildIndex(y, 0); };
    root.update(0);
    return root;
  }
  if (type === 'neutron') {
    const jets = [];
    for (const dir of [-1, 1]) {
      const j = new Sprite(streakTex(0xcfe6ff, 1, 1.1)); j.anchor.set(0, 0.5); j.rotation = dir * Math.PI / 2; j.width = radius * 3.0; j.height = radius * 1.3; j.blendMode = 'add'; jets.push(j);
    }
    const holder = new Container(); holder.addChild(...jets); holder.rotation = 0.5;
    const s = singleStar('neutron', radius * 0.32, true);
    root.addChild(holder, s);
    root.update = (dt) => { t += dt; const p = 0.5 + 0.5 * Math.sin(t * 9); s._tick(t * 4); s.scale.set(0.95 + 0.12 * p); holder.rotation = 0.5 + Math.sin(t * 0.4) * 0.12; jets.forEach((j, i) => { j.alpha = 0.5 + 0.35 * p; }); };
    return root;
  }
  if (type === 'blackhole') {
    const halo = glowSprite(0xff8a3a, radius * 4, 0.25, 2.4);
    const back = new Sprite(accretionTex()); back.anchor.set(0.5); back.width = back.height = radius * 5; back.blendMode = 'add';
    const holder = new Container(); holder.rotation = -0.25; holder.scale.y = 0.26; holder.addChild(back);
    const ring = new Graphics().circle(0, 0, radius * 1.08).stroke({ width: radius * 0.1, color: 0xffd8a0, alpha: 0.85 });
    const ring2 = new Graphics().circle(0, 0, radius * 1.08).stroke({ width: radius * 0.3, color: 0xff9a50, alpha: 0.2 });
    const hole = new Graphics().circle(0, 0, radius).fill(0x000000);
    // front half of disc passes in front of the hole
    const frontDisc = new Sprite(accretionTex()); frontDisc.anchor.set(0.5); frontDisc.width = frontDisc.height = radius * 5; frontDisc.blendMode = 'add';
    const fh = new Container(); fh.rotation = -0.25; fh.scale.y = 0.26; fh.addChild(frontDisc);
    const m = new Graphics().rect(-radius * 3, 0, radius * 6, radius * 3).fill(0xffffff);
    m.rotation = -0.25; fh.mask = m; root.addChild(m);
    root.addChild(halo, holder, ring2, hole, ring, fh);
    root.update = (dt) => { t += dt; back.rotation += dt * 0.35; frontDisc.rotation = back.rotation; halo.alpha = 0.22 + 0.05 * Math.sin(t * 0.8); ring.alpha = 0.75 + 0.15 * Math.sin(t * 1.4); };
    return root;
  }
  const s = singleStar(type, radius); root.addChild(s);
  const ph = Math.random() * 6;
  root.update = (dt) => { t += dt; s._tick(t, ph); };
  return root;
}
void hex; void lerpc; void Graphics;
