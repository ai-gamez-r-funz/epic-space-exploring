// Thin procedural stand-ins for src/gfx (used per-call if the real gfx throws or is missing).
import { Container, Graphics, Text } from 'pixi.js';

const PAL = { ink: 0x070914, deepSpace: 0x0b0d1e, teal: 0x3fc1b0, brass: 0xd9a441, cream: 0xf2e3b8, coral: 0xef6f5e, mustard: 0xe8b94a, sage: 0x8fb996, plum: 0x8c5a8a, panel: 0x1b2140, panelLight: 0x2a3566, text: 0xf2e3b8, textDim: 0x9aa3c7, good: 0x7fd18b, bad: 0xef6f5e, warn: 0xf0b64a };
function rnd(seed) { let s = (seed | 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const PLANET_COL = { terran: 0x4f9a6a, ocean: 0x3b78c4, desert: 0xd4a25a, ice: 0xbfe0f0, lava: 0xd9532b, gas: 0xe0b070, barren: 0x8a8a8a, jungle: 0x2f8f4a, crystal: 0xb48be0, toxic: 0xa8c040 };
const STAR_COL = { yellow: 0xffe08a, orange: 0xffa45c, red: 0xff6a4d, white: 0xf4f6ff, blue: 0x8ec4ff, binary: 0xffd0a0, neutron: 0xbfe9ff, blackhole: 0x8a5fa8 };

function glowCircle(g, r, col, a = 1) { for (let i = 6; i >= 1; i--) g.circle(0, 0, r * (1 + i * 0.18)).fill({ color: col, alpha: 0.05 * a }); }

export const mockGfx = {
  palette: PAL, init() {},
  starfield({ w = 1280, h = 720, seed = 1, density = 1, parallax = 1 } = {}) {
    const c = new Container(); const r = rnd(seed); const g = new Graphics(); c.addChild(g);
    c.addChildAt(new Graphics().rect(0, 0, w, h).fill(0x0b0d1e), 0);
    const stars = []; for (let i = 0; i < 170 * density; i++) stars.push({ x: r() * w, y: r() * h, s: r() * 1.6 + 0.4, p: r(), ph: r() * 6 });
    let t = 0;
    c.update = (dt, cx = 0, cy = 0) => { t += dt; g.clear(); for (const s of stars) { const x = (((s.x - cx * s.p * parallax) % w) + w) % w, y = (((s.y - cy * s.p * parallax) % h) + h) % h; g.circle(x, y, s.s).fill({ color: 0xf2e3b8, alpha: 0.4 + 0.5 * Math.abs(Math.sin(t * 0.6 + s.ph)) }); } };
    c.update(0); return c;
  },
  nebula({ w = 1280, h = 720, seed = 1, hue = 260 } = {}) {
    const c = new Container(); const r = rnd(seed); const g = new Graphics(); c.addChild(g);
    const col = hue < 60 ? 0xe0a93b : hue < 200 ? 0x3fb6a8 : 0x9a6fd0;
    for (let i = 0; i < 18; i++) { const x = r() * w, y = r() * h, rad = 80 + r() * 200; for (let k = 5; k > 0; k--) g.circle(x, y, rad * k / 5).fill({ color: col, alpha: 0.035 }); }
    c.update = () => {}; return c;
  },
  planet({ type = 'terran', seed = 1, radius = 40, ringed = false, moons = 0, life = 'none' } = {}) {
    const c = new Container(); const g = new Graphics(); c.addChild(g); const col = PLANET_COL[type] || 0x888888;
    if (ringed) g.ellipse(0, 0, radius * 1.8, radius * 0.4).stroke({ width: radius * 0.14, color: 0xd9c9a0, alpha: 0.7 });
    g.circle(0, 0, radius * 1.1).fill({ color: col, alpha: 0.18 });
    g.circle(0, 0, radius).fill(col);
    g.circle(-radius * 0.25, -radius * 0.25, radius * 0.7).fill({ color: 0xffffff, alpha: 0.14 });
    g.circle(radius * 0.3, radius * 0.3, radius * 0.95).fill({ color: 0x000000, alpha: 0.28 });
    g.circle(0, 0, radius).stroke({ width: 1.5, color: 0xffffff, alpha: 0.2 });
    for (let i = 0; i < moons; i++) g.circle(radius * (1.5 + i * 0.4), -radius * (0.6 + i * 0.2), radius * 0.16).fill(0xbbbbbb);
    c.update = () => {}; return c;
  },
  star({ type = 'yellow', radius = 40 } = {}) {
    const c = new Container(); const g = new Graphics(); c.addChild(g); const col = STAR_COL[type] || 0xffe08a; let t = 0;
    c.update = (dt) => { t += dt; g.clear(); const p = 1 + Math.sin(t * 1.5) * 0.04; glowCircle(g, radius * p, col); g.circle(0, 0, radius * p).fill(col); g.circle(0, 0, radius * 0.6 * p).fill({ color: 0xffffff, alpha: 0.6 }); };
    c.update(0); return c;
  },
  phenomenon(kind, { size = 60 } = {}) {
    const c = new Container(); const g = new Graphics(); c.addChild(g); let t = 0;
    c.update = (dt) => { t += dt; g.clear(); const r = size / 2; g.circle(0, 0, r * (0.8 + 0.1 * Math.sin(t * 2))).stroke({ width: 2, color: PAL.teal, alpha: 0.8 }); g.circle(0, 0, r * 0.4).fill({ color: PAL.plum, alpha: 0.7 }); };
    c.update(0); const l = new Text({ text: String(kind).slice(0, 1).toUpperCase(), style: { fontSize: size * 0.3, fill: PAL.cream } }); l.anchor.set(0.5); c.addChild(l); return c;
  },
  ship({ kind = 'halcyon', scale = 1, thrust = 0.6 } = {}) {
    const c = new Container(); const g = new Graphics(); c.addChild(g);
    g.poly([-40, 0, -10, -8, 40, -2, 52, 0, 40, 2, -10, 8]).fill(0xd8d2c0); g.ellipse(10, 0, 30, 6).fill(0xe8e2d0); g.circle(-30, 0, 5).fill(0x3fc1b0);
    g.roundRect(-28, -22, 30, 5, 2).fill(0x9aa3c7); g.roundRect(-28, 17, 30, 5, 2).fill(0x9aa3c7); g.rect(-6, -18, 3, 12).fill(0x9aa3c7); g.rect(-6, 6, 3, 12).fill(0x9aa3c7);
    c.scale.set(scale); c.update = () => {}; return c;
  },
  portrait({ species = 'human', seed = 1, size = 64, mood = 60 } = {}) {
    const c = new Container(); const g = new Graphics(); c.addChild(g); const r = rnd(seed + 7);
    const skin = { human: 0xe0b090, quillari: 0xe8b94a, vesperine: 0xb28be0, archivist: 0xc9c0a0, drifter: 0xc08060, robot: 0x9aa3c7, unknown: 0x555a80 }[species] || 0xd0b090;
    g.roundRect(0, 0, size, size, size * 0.14).fill(0x1b2140);
    g.ellipse(size / 2, size * 1.0, size * 0.38, size * 0.3).fill(0x3a4590 + Math.floor(r() * 0x2000));
    g.ellipse(size / 2, size * 0.46, size * 0.22, size * 0.27).fill(skin);
    g.circle(size * 0.42, size * 0.44, size * 0.025).fill(0x10132b); g.circle(size * 0.58, size * 0.44, size * 0.025).fill(0x10132b);
    g.roundRect(0, 0, size, size, size * 0.14).stroke({ width: 2, color: PAL.brass });
    c.update = () => {}; return c;
  },
  sceneArt(spec, w, h) { const c = new Container(); c.addChild(new Graphics().rect(0, 0, w, h).fill(0x10132b)); const l = new Text({ text: spec?.scene || 'void', style: { fontSize: 20, fill: 0x9aa3c7 } }); l.x = 12; l.y = 12; c.addChild(l); c.update = () => {}; return c; },
  icon(name, { size = 24, color = 0xf2e3b8 } = {}) {
    const c = new Container(); const g = new Graphics(); c.addChild(g); const r = size / 2;
    g.circle(0, 0, r * 0.85).stroke({ width: Math.max(1.5, size / 12), color });
    const l = new Text({ text: String(name).slice(0, 1).toUpperCase(), style: { fontSize: size * 0.5, fill: color, fontWeight: '700' } }); l.anchor.set(0.5); c.addChild(l); return c;
  },
  goodIcon(id, cat, size = 24) { return mockGfx.icon(id, { size, color: PAL.mustard }); },
  factionEmblem(id, size = 24) { const c = new Container(); const g = new Graphics(); g.circle(0, 0, size / 2).fill({ color: PAL.panelLight }); g.circle(0, 0, size / 2).stroke({ width: 1.5, color: PAL.brass }); c.addChild(g); return c; },
  sparkle() {}, burst() {},
  vignette(w, h) { const g = new Graphics(); for (let i = 0; i < 6; i++) g.rect(-i * 2, -i * 2, w + i * 4, h + i * 4).stroke({ width: 40, color: 0x000000, alpha: 0.05 }); return g; },
  scanlines(w, h, a = 0.06) { const g = new Graphics(); for (let y = 0; y < h; y += 3) g.rect(0, y, w, 1).fill({ color: 0x000000, alpha: a }); return g; },
  panelBg(w, h) { return new Graphics().roundRect(0, 0, w, h, 12).fill(PAL.panel); },
};
