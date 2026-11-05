import { Container, Sprite, Graphics, Texture } from 'pixi.js';
import { rng, makeNoise, LRU, makeCanvas, glowSprite, TAU, hashStr, clamp, lerp, animated } from './util.js';
import { gradTex, nebulaTexture, streakTex } from './space.js';
import { palette } from './palette.js';

const cache = new LRU(24);
function cloudTex(seed, rgbA, rgbB, S = 160) {
  return cache.memo(`cl${seed}${rgbA}${rgbB}${S}`, () => {
    const N = makeNoise(seed);
    const c = makeCanvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const px = (x + 0.5) / S * 2 - 1, py = (y + 0.5) / S * 2 - 1, d = Math.hypot(px, py);
      const n = N.fbm(px * 2 + 5, py * 2, 1, 5), m = N.fbm(px * 3, py * 3 + 4, 3, 3);
      let a = clamp((n - 0.35) * 2.2, 0, 1) * clamp(1 - d * d * 1.05, 0, 1);
      const k = (y * S + x) * 4;
      for (let i = 0; i < 3; i++) img.data[k + i] = lerp(rgbA[i], rgbB[i], m);
      img.data[k + 3] = a * 235;
    }
    g.putImageData(img, 0, 0); return Texture.from(c);
  });
}
function spiralTex() {
  return cache.memo('spiral', () => {
    const S = 384, c = makeCanvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const px = (x + 0.5) / S * 2 - 1, py = (y + 0.5) / S * 2 - 1, r = Math.hypot(px, py), a = Math.atan2(py, px), k = (y * S + x) * 4;
      if (r > 1) continue;
      const arm = 0.5 + 0.5 * Math.cos(a * 3 - Math.log(r + 0.04) * 6.5);
      const arm2 = 0.5 + 0.5 * Math.cos(a * 5 + Math.log(r + 0.04) * 4);
      const fall = Math.pow(1 - r, 1.2), core = Math.exp(-r * 5);
      const v = clamp(arm * arm * 0.9 * fall + arm2 * 0.15 * fall + core * 1.1, 0, 1);
      img.data[k] = lerp(40, 255, core * core + v * 0.35); img.data[k + 1] = lerp(120, 245, core + v * 0.2); img.data[k + 2] = lerp(210, 255, core * 0.6 + v * 0.3);
      img.data[k + 3] = clamp(v * 1.25, 0, 1) * 255 * clamp((1 - r) * 5, 0, 1);
    }
    g.putImageData(img, 0, 0); return Texture.from(c);
  });
}
function beamTex() { return streakTex(0xd8ecff, 0.95, 0.9); }

function rockPoly(R, r) {
  const n = R.int(7, 10), pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = r * R.range(0.7, 1.1); pts.push(Math.cos(a) * rr, Math.sin(a) * rr * 0.9); }
  return pts;
}
function rockSprite(R, r) {
  const g = new Graphics();
  const pts = rockPoly(R, r);
  const base = R.pick([0x6a6670, 0x7a6e66, 0x5c6272, 0x82766a]);
  g.poly(pts).fill(base);
  const sh = pts.map((v, i) => (i % 2 ? v * 0.8 + r * 0.1 : v * 0.8 + r * 0.14));
  g.poly(pts.map((v, i) => v * 0.86 + (i % 2 ? r * 0.1 : r * 0.12))).fill({ color: 0x1a1824, alpha: 0.35 });
  g.poly(pts.map((v, i) => v * 0.6 - (i % 2 ? r * 0.12 : r * 0.14))).fill({ color: 0xffffff, alpha: 0.12 });
  g.circle(r * 0.2, r * -0.1, r * 0.17).fill({ color: 0x000000, alpha: 0.2 });
  g.circle(-r * 0.3, r * 0.25, r * 0.1).fill({ color: 0x000000, alpha: 0.18 });
  g.poly(pts).stroke({ width: 1, color: 0xf2e3b8, alpha: 0.22 });
  void sh;
  return g;
}

export function createPhenomenon(kind, { size = 120 } = {}) {
  const root = animated();
  const s = size / 2, R = rng(hashStr('ph' + kind + size));
  let t = R() * 10;
  const seedN = hashStr(kind);
  switch (kind) {
    case 'nebula': {
      const a = new Sprite(cloudTex(seedN, [255, 120, 180], [90, 210, 230])), b = new Sprite(cloudTex(seedN + 1, [120, 90, 210], [240, 170, 120])), c = new Sprite(cloudTex(seedN + 2, [90, 200, 190], [250, 220, 170]));
      for (const [sp, k, al] of [[a, 2.1, 0.9], [b, 1.7, 0.75], [c, 1.25, 0.6]]) { sp.anchor.set(0.5); sp.width = sp.height = size * k * 0.75; sp.alpha = al; }
      b.blendMode = 'add'; c.blendMode = 'add';
      root.addChild(a, b, c);
      for (let i = 0; i < 8; i++) { const st = glowSprite(0xfff4d8, R.range(2, 5), 0.9); st.x = R.range(-s, s) * 0.8; st.y = R.range(-s, s) * 0.8; root.addChild(st); }
      root.onUpdate((dt) => { t += dt; a.rotation += dt * 0.03; b.rotation -= dt * 0.045; c.rotation += dt * 0.06; a.scale.x *= 1; c.alpha = 0.5 + 0.12 * Math.sin(t * 0.6); });
      break;
    }
    case 'pulsar': {
      const halo = glowSprite(0x9cc8ff, s * 1.1, 0.5, 2);
      const beams = new Container();
      for (const d of [0, Math.PI]) { const b = new Sprite(beamTex()); b.anchor.set(0, 0.5); b.width = s * 2.6; b.height = s * 0.34; b.rotation = d; b.blendMode = 'add'; beams.addChild(b); }
      const rings = []; for (let i = 0; i < 3; i++) { const g = new Graphics().circle(0, 0, s * 0.3).stroke({ width: 1.5, color: 0xbcdcff, alpha: 0.5 }); rings.push(g); root.addChild(g); }
      const core = glowSprite(0xffffff, s * 0.22, 1, 1.4, 0.2);
      root.addChild(halo, beams, core);
      root.onUpdate((dt) => { t += dt; beams.rotation += dt * 1.6; core.scale.set(core.scale.x * 0 + (s * 0.22 * 2 / 128) * (1 + 0.25 * Math.sin(t * 12))); halo.alpha = 0.4 + 0.15 * Math.sin(t * 6);
        rings.forEach((g, i) => { const p = ((t * 0.5 + i / 3) % 1); g.scale.set(1 + p * 2.6); g.alpha = (1 - p) * 0.8; }); });
      break;
    }
    case 'ionstorm': {
      const a = new Sprite(cloudTex(seedN + 9, [120, 70, 200], [60, 200, 220])), b = new Sprite(cloudTex(seedN + 10, [190, 120, 240], [120, 240, 240]));
      a.anchor.set(0.5); b.anchor.set(0.5); a.width = a.height = size * 1.6; b.width = b.height = size * 1.2; b.blendMode = 'add'; b.alpha = 0.7;
      const bolts = new Graphics(), flash = glowSprite(0xcfa8ff, s * 0.9, 0, 2);
      root.addChild(a, b, flash, bolts);
      let next = 0, life = 0;
      const strike = () => {
        bolts.clear();
        let x = R.range(-s * 0.5, s * 0.5), y = -s * 0.7;
        const pts = [[x, y]];
        while (y < s * 0.7) { x += R.range(-s * 0.18, s * 0.18); y += R.range(s * 0.1, s * 0.22); pts.push([x, y]); }
        const draw = (w, col, al) => { bolts.moveTo(pts[0][0], pts[0][1]); for (const p of pts) bolts.lineTo(p[0], p[1]); bolts.stroke({ width: w, color: col, alpha: al, cap: 'round', join: 'round' }); };
        draw(5, 0x9a6aff, 0.25); draw(2.2, 0xd8c0ff, 0.8); draw(0.9, 0xffffff, 1);
        flash.x = x; flash.y = 0; life = 0.22;
      };
      root.onUpdate((dt) => { t += dt; a.rotation += dt * 0.12; b.rotation -= dt * 0.2; next -= dt; if (next <= 0) { strike(); next = R.range(0.5, 1.6); }
        life -= dt; const f = Math.max(0, life / 0.22); bolts.alpha = f > 0 ? 0.4 + 0.6 * f : 0; flash.alpha = f * 0.7; });
      break;
    }
    case 'wormhole': {
      const halo = glowSprite(0x6ab4ff, s * 1.3, 0.5, 2);
      const sp1 = new Sprite(spiralTex()), sp2 = new Sprite(spiralTex());
      for (const sp of [sp1, sp2]) { sp.anchor.set(0.5); sp.width = sp.height = size * 1.05; sp.blendMode = 'add'; }
      sp2.scale.x *= -0.7; sp2.scale.y *= 0.7; sp2.alpha = 0.7;
      const ring = new Graphics().circle(0, 0, s * 0.98).stroke({ width: 2, color: 0xbfe0ff, alpha: 0.4 });
      root.addChild(halo, sp1, sp2, ring);
      root.onUpdate((dt) => { t += dt; sp1.rotation += dt * 0.5; sp2.rotation -= dt * 0.8; halo.alpha = 0.45 + 0.1 * Math.sin(t * 1.2); ring.scale.set(1 + 0.02 * Math.sin(t * 2)); });
      break;
    }
    case 'asteroids': {
      const rocks = [];
      for (let i = 0; i < 22; i++) {
        const rr = R.range(3.5, 12) * (size / 120), g = rockSprite(R, rr);
        const ang = R() * TAU, dist = s * R.range(0.15, 0.95);
        rocks.push({ g, ang, dist, sp: R.range(0.05, 0.16) * (R() < 0.5 ? 1 : 1), rot: R.range(-0.8, 0.8), sq: R.range(0.4, 0.55) });
        root.addChild(g);
      }
      const tilt = -0.3;
      root.onUpdate((dt) => { for (const r of rocks) { r.ang += dt * r.sp; const x = Math.cos(r.ang) * r.dist, y = Math.sin(r.ang) * r.dist * r.sq; r.g.x = x * Math.cos(tilt) - y * Math.sin(tilt); r.g.y = x * Math.sin(tilt) + y * Math.cos(tilt); r.g.rotation += dt * r.rot; } });
      break;
    }
    case 'derelict': {
      const g = new Graphics();
      const k = s / 60;
      // broken lenticular hull silhouette
      g.ellipse(0, 0, 50 * k, 13 * k).fill(0x2a2d44);
      g.ellipse(0, -3 * k, 42 * k, 8 * k).fill(0x353a58);
      g.poly([-12 * k, -9 * k, -4 * k, -30 * k, 3 * k, -30 * k, 8 * k, -9 * k]).fill(0x262942); // mast
      g.poly([-30 * k, 8 * k, -52 * k, 24 * k, -44 * k, 28 * k, -22 * k, 12 * k]).fill(0x232640); // pod stub
      g.poly([30 * k, 10 * k, 38 * k, 36 * k, 24 * k, 22 * k, 20 * k, 12 * k]).fill(0x232640);
      // jagged bite
      g.poly([20 * k, -12 * k, 34 * k, -2 * k, 26 * k, 4 * k, 32 * k, 12 * k, 14 * k, 8 * k]).fill(0x0b0d1e);
      for (let i = 0; i < 9; i++) g.circle((-34 + i * 7) * k, 0, 1.2 * k).fill({ color: i % 3 === 0 ? 0xd9a441 : 0x3fc1b0, alpha: i % 3 === 0 ? 0.55 : 0.12 });
      g.ellipse(0, 0, 50 * k, 13 * k).stroke({ width: 1.2, color: 0xf2e3b8, alpha: 0.3 });
      g.ellipse(-3 * k, -5 * k, 34 * k, 5 * k).stroke({ width: 1, color: 0xf2e3b8, alpha: 0.12 });
      const holder = new Container(); holder.addChild(g); holder.rotation = -0.2;
      const blink = glowSprite(0xef6f5e, 14 * k, 1, 2); blink.x = 4 * k; blink.y = -31 * k;
      const dot = new Graphics().circle(0, 0, 1.8 * k).fill(0xffb0a0); dot.position.set(blink.x, blink.y);
      holder.addChild(blink, dot);
      const bits = []; for (let i = 0; i < 6; i++) { const b = new Graphics().poly(rockPoly(R, R.range(1.5, 3.5) * k)).fill(0x353a58); b.x = R.range(-s, s); b.y = R.range(-s * 0.5, s * 0.5); bits.push([b, R.range(-0.5, 0.5)]); root.addChild(b); }
      root.addChild(holder);
      root.onUpdate((dt) => { t += dt; holder.rotation = -0.2 + Math.sin(t * 0.2) * 0.07; holder.y = Math.sin(t * 0.5) * 2 * k; const on = (t % 2.2) < 0.35; blink.alpha = on ? 1 : 0.06; dot.alpha = on ? 1 : 0.25; bits.forEach(([b, r]) => { b.rotation += dt * r; }); });
      break;
    }
    case 'comet': {
      const tailI = new Sprite(streakTex(0x9fd0ff, 0.95, 1.2));
      tailI.anchor.set(0, 0.5); tailI.width = s * 2.1; tailI.height = s * 0.26; tailI.blendMode = 'add'; tailI.rotation = 0.35;
      const tailD = new Sprite(streakTex(0xffd49a, 0.85, 1.0));
      tailD.anchor.set(0, 0.5); tailD.width = s * 1.7; tailD.height = s * 0.6; tailD.blendMode = 'add'; tailD.rotation = 0.62;
      const coma = glowSprite(0xcfeaff, s * 0.65, 0.85, 1.8);
      const nuc = new Graphics().poly(rockPoly(R, s * 0.1)).fill(0xe8e4dc);
      const holder = new Container(); holder.addChild(tailD, tailI, coma, nuc); holder.x = -s * 0.55; holder.y = -s * 0.25;
      const sparks = []; for (let i = 0; i < 12; i++) { const sp = glowSprite(0xdff0ff, 2.5, 0.8); sparks.push({ sp, p: R(), v: R.range(0.2, 0.5), off: R.range(-0.12, 0.12) }); holder.addChild(sp); }
      root.addChild(holder);
      root.onUpdate((dt) => { t += dt; tailI.alpha = 0.8 + 0.2 * Math.sin(t * 2); tailD.alpha = 0.8 + 0.2 * Math.sin(t * 1.4 + 1); coma.alpha = 0.75 + 0.1 * Math.sin(t * 3);
        for (const o of sparks) { o.p = (o.p + dt * o.v) % 1; const d = o.p * s * 1.6; o.sp.x = Math.cos(0.5 + o.off) * d; o.sp.y = Math.sin(0.5 + o.off) * d; o.sp.alpha = (1 - o.p) * 0.8; } });
      break;
    }
    case 'rift': {
      const g = new Graphics(), glow = glowSprite(0xe8a0ff, s * 0.9, 0.5, 2);
      const cols = [0xff9ad0, 0x7fe0e8, 0xf2e3b8, 0xb9a0ff, 0x8fe7a8];
      root.addChild(glow, g);
      root.onUpdate((dt) => { t += dt; g.clear();
        for (let r = 0; r < 5; r++) {
          const ph = r * 1.3, amp = s * (0.12 + r * 0.03), len = s * (1.7 - r * 0.1);
          for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i <= 40; i++) {
              const u = i / 40, x = (u - 0.5) * len, env = Math.sin(u * Math.PI);
              const y = Math.sin(u * 7 + t * (1.1 + r * 0.2) + ph) * amp * env + Math.sin(u * 3 - t * 0.7 + ph * 2) * amp * 0.6 * env + (r - 2) * s * 0.07 * env;
              const rot = -0.5; const X = x * Math.cos(rot) - y * Math.sin(rot), Y = x * Math.sin(rot) + y * Math.cos(rot);
              if (i === 0) g.moveTo(X, Y); else g.lineTo(X, Y);
            }
            g.stroke({ width: pass ? 1.8 : 7, color: cols[r], alpha: pass ? 0.9 : 0.16 + 0.06 * Math.sin(t * 3 + r), cap: 'round', join: 'round' });
          }
        }
        glow.alpha = 0.4 + 0.1 * Math.sin(t * 2); });
      break;
    }
    case 'aurora': {
      const g = new Graphics(), head = glowSprite(0xcaffe0, s * 0.22, 0.9, 1.6);
      const eye1 = new Graphics().circle(0, 0, 1.4).fill(0x0b3a30), eye2 = new Graphics().circle(0, 0, 1.4).fill(0x0b3a30);
      root.addChild(g, head, eye1, eye2);
      const sp = []; for (let i = 0; i < 10; i++) { const x = glowSprite(0xb6ffe0, 2.2, 0.8); sp.push({ x, p: R() }); root.addChild(x); }
      const pos = (u, k) => { const x = (0.5 - u) * s * 1.9, y = Math.sin(u * 5 + t * 1.2 + k) * s * 0.28 * (0.3 + u) + Math.sin(u * 2 - t * 0.6) * s * 0.15; return [x, y]; };
      root.onUpdate((dt) => { t += dt; g.clear();
        const cols = [[0x39d6a0, 0.16], [0x66f0c0, 0.2], [0x9a7aff, 0.14]];
        for (let band = 0; band < 3; band++) {
          for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i <= 30; i++) { const u = i / 30, [x, y] = pos(u, band * 0.5); const w = (1 - u) * s * 0.42 * (1 + band * 0.2); const yy = y + (band - 1) * (3 + u * 14); if (i === 0) g.moveTo(x, yy); else g.lineTo(x, yy); void w; }
            g.stroke({ width: pass ? 2 : 13 - band * 3, color: cols[band][0], alpha: pass ? 0.75 : cols[band][1], cap: 'round', join: 'round' });
          }
        }
        const [hx, hy] = pos(0, 0); head.x = hx; head.y = hy; eye1.position.set(hx + 3, hy - 3); eye2.position.set(hx + 3, hy + 3);
        sp.forEach((o) => { o.p = (o.p + dt * 0.25) % 1; const [x, y] = pos(o.p, 0); o.x.x = x; o.x.y = y + Math.sin(o.p * 20) * 5; o.x.alpha = (1 - o.p) * 0.8; }); });
      break;
    }
    case 'beacon': {
      const halo = glowSprite(0xffc858, s * 1.7, 0.55, 2.2), halo2 = glowSprite(0xffe8a8, s * 0.8, 0.7, 1.8);
      const g = new Graphics(), k = s / 60;
      // ring handle
      g.roundRect(-9 * k, -50 * k, 18 * k, 18 * k, 8 * k).stroke({ width: 2.2 * k, color: 0xd9a441 });
      // top cap
      g.poly([-18 * k, -30 * k, 18 * k, -30 * k, 24 * k, -22 * k, -24 * k, -22 * k]).fill(0xd9a441);
      g.roundRect(-8 * k, -34 * k, 16 * k, 6 * k, 3 * k).fill(0xb98a30);
      // glass body
      g.poly([-22 * k, -22 * k, 22 * k, -22 * k, 26 * k, 14 * k, 18 * k, 24 * k, -18 * k, 24 * k, -26 * k, 14 * k]).fill({ color: 0xffd88a, alpha: 0.92 });
      g.poly([-14 * k, -20 * k, 14 * k, -20 * k, 16 * k, 14 * k, -16 * k, 14 * k]).fill({ color: 0xfff1c8, alpha: 0.7 });
      // frame bars
      for (const x of [-22, -8, 8, 22]) g.moveTo(x * k * (1), -22 * k).lineTo(x * k * 1.1, 22 * k).stroke({ width: 1.6 * k, color: 0xb98a30 });
      // base
      g.roundRect(-20 * k, 22 * k, 40 * k, 8 * k, 3 * k).fill(0xd9a441); g.roundRect(-14 * k, 30 * k, 28 * k, 5 * k, 2 * k).fill(0xb98a30);
      const flame = new Graphics().ellipse(0, 0, 6 * k, 11 * k).fill(0xffffff); flame.y = 2 * k;
      const fg = glowSprite(0xfff0c0, 22 * k, 0.9, 1.6); fg.y = 2 * k;
      const rays = new Graphics(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; rays.moveTo(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55).lineTo(Math.cos(a) * s * 0.95, Math.sin(a) * s * 0.95).stroke({ width: 1.5, color: 0xffe3a0, alpha: 0.35, cap: 'round' }); }
      const motes = []; for (let i = 0; i < 12; i++) { const m = glowSprite(0xffe3a0, 2.4, 0.9); motes.push({ m, p: R(), x: R.range(-0.5, 0.5), v: R.range(0.08, 0.2) }); root.addChild(m); }
      root.addChildAt(halo, 0); root.addChild(rays, halo2, g, fg, flame);
      root.onUpdate((dt) => { t += dt; const fl = 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 3.3 + 1); halo.alpha = 0.45 * fl + 0.1; fg.alpha = 0.7 * fl; flame.scale.set(0.9 + 0.1 * fl, 0.9 + 0.2 * fl); halo2.alpha = 0.55 * fl; rays.rotation += dt * 0.08; rays.alpha = 0.7 + 0.3 * Math.sin(t * 1.5); g.rotation = Math.sin(t * 0.7) * 0.03; g.y = Math.sin(t * 0.9) * 1.5;
        for (const o of motes) { o.p = (o.p + dt * o.v) % 1; o.m.x = o.x * s + Math.sin(o.p * 9) * 5; o.m.y = s * 0.5 - o.p * s * 1.5; o.m.alpha = Math.sin(o.p * Math.PI) * 0.9; } });
      break;
    }
    default: {
      const g = glowSprite(palette.teal, s, 0.8); root.addChild(g);
      root.onUpdate((dt) => { t += dt; g.alpha = 0.6 + 0.2 * Math.sin(t * 2); });
    }
  }
  return root;
}
void nebulaTexture;
