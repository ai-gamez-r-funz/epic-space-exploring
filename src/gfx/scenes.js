import { Container, Sprite, Graphics } from 'pixi.js';
import { rng, hashStr, glowSprite, TAU, animated, makeNoise, lerp, clamp } from './util.js';
import { palette } from './palette.js';
import { gradRect, createStarfield, createNebula, createStar } from './space.js';
import { createPlanet } from './planets.js';
import { createPhenomenon } from './phenomena.js';
import { createShip } from './ships.js';
import { createPortrait } from './portraits.js';
import { createVignette, createScanlines } from './decor.js';

const P = palette;
const PLANET_TYPES = ['terran', 'ocean', 'desert', 'ice', 'lava', 'gas', 'barren', 'jungle', 'crystal', 'toxic'];
const SHIP_OF = { quillari: 'quillari', vesperine: 'vesperine', archivist: 'archivist', drifter: 'drifter', human: 'concord', concord: 'concord', robot: 'probe' };
const hx = (n) => '#' + n.toString(16).padStart(6, '0');

function spaceBase(w, h, seed, { neb = null, nebAlpha = 0.9, density = 1 } = {}) {
  const c = animated();
  c.addChild(createStarfield({ w, h, seed, density }));
  if (neb != null) { const n = createNebula({ w, h, seed, hue: neb }); n.alpha = nebAlpha; c.addChild(n); }
  return c;
}
function upd(c) { return (dt) => { for (const k of c.children) if (k.update) k.update(dt); }; }
function blinkRect(g, x, y, w, h, col) { g.roundRect(x, y, w, h, Math.min(w, h) * 0.3).fill(col); }

// -------------------------------------------------------------- stations
export function createStation({ kind = 'trade', size = 100 } = {}) {
  const root = animated();
  const k = size / 100, g = new Graphics(), R = rng(hashStr('st' + kind));
  const ringG = new Graphics();
  const lights = [];
  const addLight = (x, y, col, r = 2) => { const l = glowSprite(col, r * 3.2, 0.9, 2); l.position.set(x * k, y * k); root.addChild(l); lights.push([l, R.range(0.8, 2.4), R() * 6]); };
  const brass = P.brass, cream = P.cream;
  const hull = (x, y, w, h, c = 0xb8a888) => { g.roundRect(x, y, w, h, Math.min(w, h) * 0.35).fill(c); g.roundRect(x, y, w, h * 0.35, Math.min(w, h) * 0.3).fill({ color: 0xffffff, alpha: 0.22 }); };
  g.scale.set(k);
  if (kind === 'trade') {
    for (const s of [-1, 1]) { g.rect(s * 38 - 1, -2, 2, 4).fill(0x8a8a90); g.roundRect(s * 54 - 7, -14, 14, 28, 2).fill(0x3d78b8).stroke({ width: 0.8, color: cream, alpha: 0.5 }); }
    g.rect(-48, -1.2, 96, 2.4).fill(0x8a8a90);
    hull(-10, -22, 20, 44, 0xe8d8a8); hull(-5, -30, 10, 60, 0xd9a441);
    for (let i = 0; i < 5; i++) g.circle(0, -18 + i * 9, 1.4).fill(0x2a3566);
    for (let i = 0; i < 6; i++) { g.rect(-14 + i * 5, 22, 5, 5).fill(i % 2 ? 0xef6f5e : 0xf2e3b8); } // awning stripes
    addLight(0, -31, 0xffe08a, 2.5); addLight(-54, -14, P.good, 1.6); addLight(54, 14, P.coral, 1.6);
  } else if (kind === 'outpost') {
    hull(-18, -9, 36, 18, 0xb8b0a0); g.roundRect(-18, -9, 36, 18, 6).stroke({ width: 1, color: 0x6a6460 });
    g.moveTo(8, -9).lineTo(8, -26); g.stroke({ width: 1.6, color: 0x8a8a90 }); g.ellipse(8, -28, 10, 3.5).fill(cream).stroke({ width: 0.8, color: 0x8a8a90 });
    g.rect(-30, -2, 12, 4).fill(0x2a3566); g.rect(18, -2, 12, 4).fill(0x2a3566);
    g.roundRect(-8, -4, 8, 5, 1).fill(0xffe08a); addLight(-8, -2, 0xffe08a, 1.5); addLight(-15, -9, P.coral, 1.3);
  } else if (kind === 'shipyard') {
    // scaffold + half-built hull
    g.ellipse(0, 0, 30, 9).fill(0xd9a441); g.ellipse(0, -1, 26, 6).fill(0xf2e3b8);
    for (let i = -3; i <= 3; i++) g.moveTo(i * 12, -26).lineTo(i * 12, 26);
    g.stroke({ width: 1, color: 0x8a8a90 }); g.moveTo(-40, -26).lineTo(40, -26); g.moveTo(-40, 26).lineTo(40, 26); g.stroke({ width: 1.4, color: 0xb98a30 });
    g.poly([34, -26, 46, -34, 46, -26]).fill(0xef6f5e);
    addLight(-40, -26, 0xffe08a, 1.6); addLight(40, 26, 0xffe08a, 1.6); addLight(0, -26, P.teal, 1.5);
  } else if (kind === 'embassy') {
    hull(-8, -34, 16, 68, 0xe8eef6); g.poly([-8, -34, 0, -50, 8, -34]).fill(0x5aa0e0); g.ellipse(0, 0, 36, 7).fill(0xf2e3b8).stroke({ width: 1, color: brass });
    for (let i = -2; i <= 2; i++) { g.rect(i * 12 - 1.5, -16, 3, 16).fill(0xef6f5e); g.poly([i * 12 - 1.5, 0, i * 12 + 1.5, 0, i * 12, 5]).fill(0xef6f5e); }
    addLight(0, -51, 0xffe08a, 2.2); addLight(-36, 0, P.teal, 1.5); addLight(36, 0, P.teal, 1.5);
  } else if (kind === 'archive') {
    g.circle(0, 0, 26).fill(0x8a6a2a); g.circle(-1, -1, 25).fill(brass); g.circle(-7, -8, 15).fill({ color: cream, alpha: 0.3 });
    g.ellipse(0, 0, 38, 6).stroke({ width: 2.4, color: 0xb98a30 }); g.ellipse(0, 0, 30, 18).stroke({ width: 1.2, color: 0x8a6a2a, alpha: 0.7 });
    g.circle(0, 0, 7).fill(0x2a2218); g.circle(0, 0, 4.8).fill(0xfff0b0);
    addLight(0, 0, 0xffe08a, 3); addLight(-30, -4, 0xffe08a, 1.3); addLight(30, 4, 0xffe08a, 1.3);
  } else { // habitat (drifters): cluster of patchwork domes + lantern strings
    const cols = [0xef8f5e, 0x3fc1b0, 0xe8b94a, 0x8c5a8a];
    [[-26, 4, 14], [0, -6, 20], [26, 6, 12], [-6, 22, 9], [18, -22, 8]].forEach(([x, y, r], i) => { g.circle(x, y, r).fill(lerpc(cols[i % 4])); g.circle(x - r * 0.25, y - r * 0.3, r * 0.6).fill({ color: 0xffffff, alpha: 0.18 }); g.circle(x, y, r).stroke({ width: 1, color: 0x2a1a10, alpha: 0.6 }); });
    for (const [x1, y1, x2, y2] of [[-26, 4, 0, -6], [0, -6, 26, 6], [0, -6, -6, 22], [0, -6, 18, -22]]) g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 2, color: 0x6a5a52 });
    addLight(-26, 4, 0xffd070, 2); addLight(0, -6, 0xffd070, 2.5); addLight(26, 6, 0xffd070, 2); addLight(18, -22, P.coral, 1.5);
  }
  root.addChildAt(g, 0); root.addChildAt(ringG, 1);
  let t = R() * 5;
  root.update = (dt) => { t += dt; for (const [l, sp, ph] of lights) l.alpha = 0.4 + 0.6 * (Math.sin(t * sp + ph) > 0.2 ? 1 : 0.2); g.rotation = Math.sin(t * 0.15) * 0.03; };
  return root;
}
const lerpc = (c) => c;

// -------------------------------------------------------------- scene builders
const S = {};
S.nebula = (w, h, R) => { const c = spaceBase(w, h, R() * 1e6 | 0, { neb: R() * 360 }); c.onUpdate(upd(c)); return c; };
S.starfield = (w, h, R) => {
  const c = spaceBase(w, h, R() * 1e6 | 0, { density: 1.8 });
  const gal = glowSprite(0xb9a0ff, h * 0.5, 0.22, 2); gal.scale.x *= 2.4; gal.rotation = -0.4; gal.position.set(w * 0.62, h * 0.4); c.addChild(gal);
  const gal2 = glowSprite(0x7fe0e8, h * 0.3, 0.14, 2); gal2.scale.x *= 2; gal2.rotation = -0.4; gal2.position.set(w * 0.3, h * 0.65); c.addChild(gal2);
  c.onUpdate(upd(c)); return c;
};
S.planet = (w, h, R, spec) => {
  const c = spaceBase(w, h, R() * 1e6 | 0, { neb: R() < 0.4 ? R() * 360 : null, nebAlpha: 0.5 });
  const type = spec.planet || R.pick(PLANET_TYPES);
  const glow = glowSprite(0xffe0a0, h * 0.7, 0.35, 2); glow.position.set(-w * 0.02, h * 0.12); c.addChild(glow);
  const p = createPlanet({ type, seed: R() * 1000 | 0, radius: h * 0.5, ringed: type === 'gas' && R() < 0.6, moons: 1, life: 'none' }); p.position.set(w * 0.68, h * 0.7); c.addChild(p);
  c.onUpdate(upd(c)); return c;
};
S.derelict = (w, h, R) => {
  const c = spaceBase(w, h, R() * 1e6 | 0, { neb: R() * 360, nebAlpha: 0.45 });
  const d = createPhenomenon('derelict', { size: h * 1.1 }); d.position.set(w * 0.52, h * 0.5); c.addChild(d);
  c.onUpdate(upd(c)); return c;
};
S.station = (w, h, R, spec) => {
  const c = spaceBase(w, h, R() * 1e6 | 0, { neb: R() < 0.3 ? R() * 360 : null, nebAlpha: 0.4 });
  const p = createPlanet({ type: R.pick(PLANET_TYPES), seed: R() * 1000 | 0, radius: h * 0.7, life: 'civilized' }); p.position.set(w * 0.2, h * 0.95); c.addChild(p);
  const st = createStation({ kind: spec.station || R.pick(['trade', 'outpost', 'shipyard', 'embassy', 'archive', 'habitat']), size: h * 0.55 }); st.position.set(w * 0.62, h * 0.46); c.addChild(st);
  c.onUpdate(upd(c)); return c;
};
S.ship_alien = (w, h, R, spec) => {
  const c = spaceBase(w, h, R() * 1e6 | 0, { neb: R() < 0.5 ? R() * 360 : null, nebAlpha: 0.5 });
  const kind = SHIP_OF[spec.species] || R.pick(['quillari', 'vesperine', 'archivist', 'drifter']);
  const sh = createShip({ kind, scale: h / 130 * 1.15, thrust: 0.55 }); sh.position.set(w * 0.5, h * 0.52); sh.rotation = -0.08; c.addChild(sh);
  const star = createStar({ type: R.pick(['yellow', 'orange', 'white']), radius: h * 0.05 }); star.position.set(w * 0.88, h * 0.18); c.addChild(star);
  c.onUpdate(upd(c)); return c;
};
const phen = (kind, mul = 1.25, nebula = null) => (w, h, R) => {
  const c = spaceBase(w, h, R() * 1e6 | 0, { neb: nebula, nebAlpha: 0.5 });
  const p = createPhenomenon(kind, { size: h * mul }); p.position.set(w * (kind === 'comet' ? 0.5 : 0.5), h * 0.5); c.addChild(p);
  c.onUpdate(upd(c)); return c;
};
S.pulsar = phen('pulsar', 1.5); S.ionstorm = phen('ionstorm', 1.3, 270); S.wormhole = phen('wormhole', 1.25); S.asteroids = phen('asteroids', 1.35);
S.comet = phen('comet', 1.7); S.rift = phen('rift', 1.45, 300); S.aurora = phen('aurora', 1.4, 160); S.beacon = phen('beacon', 1.2, 40);
S.void = (w, h, R) => {
  const c = spaceBase(w, h, R() * 1e6 | 0, { density: 0.3 });
  const g = glowSprite(0x8c5a8a, h * 0.7, 0.14, 2); g.position.set(w * 0.7, h * 0.4); c.addChild(g);
  const s = glowSprite(0xffe9c0, 5, 0.9, 2); s.position.set(w * 0.7, h * 0.4); c.addChild(s);
  const dust = []; for (let i = 0; i < 24; i++) { const d = glowSprite(0xc8d0ff, R.range(1.2, 2.6), 0.5); d.position.set(R() * w, R() * h); dust.push([d, R.range(2, 8), R() * 6]); c.addChild(d); }
  let t = 0; c.onUpdate((dt) => { t += dt; for (const [d, sp, ph] of dust) { d.x += dt * sp * 0.4; if (d.x > w) d.x = 0; d.alpha = 0.15 + 0.2 * Math.sin(t * 0.5 + ph); } s.alpha = 0.7 + 0.2 * Math.sin(t * 0.8); });
  c.onUpdate(upd(c)); return c;
};

// ---------- interiors
S.bridge = (w, h, R) => {
  const c = animated();
  c.addChild(gradRect(w, h, [[0, '#1a1236'], [1, '#2c1c3c']]));
  // ceiling ribs
  const g = new Graphics();
  for (let i = 0; i < 6; i++) { g.moveTo(w * 0.5, -h * 0.4).lineTo(w * (i / 5), h * 0.52).stroke({ width: 1.4, color: P.panelLight, alpha: 0.5 }); }
  g.poly([0, 0, w, 0, w * 0.84, h * 0.08, w * 0.16, h * 0.08]).fill(0x151232);
  c.addChild(g);
  // viewscreen
  const vx = w * 0.2, vy = h * 0.12, vw = w * 0.6, vh = h * 0.46;
  const vs = new Container(); const vm = new Graphics().roundRect(vx, vy, vw, vh, 18).fill(0xffffff);
  const sf = createStarfield({ w: vw, h: vh, seed: R() * 999 | 0 }); sf.position.set(vx, vy);
  const pl = createPlanet({ type: R.pick(PLANET_TYPES), seed: R() * 999 | 0, radius: vh * 0.4, moons: 1 }); pl.position.set(vx + vw * 0.7, vy + vh * 0.7);
  const sh = createShip({ kind: R.pick(['concord', 'quillari', 'drifter']), scale: vh / 330, thrust: 0.4 }); sh.position.set(vx + vw * 0.3, vy + vh * 0.35);
  vs.addChild(sf, pl, sh, vm); vs.mask = vm; c.addChild(vs, vm);
  const frame = new Graphics().roundRect(vx - 6, vy - 6, vw + 12, vh + 12, 22).stroke({ width: 8, color: 0x8a6a2a }).roundRect(vx - 2, vy - 2, vw + 4, vh + 4, 19).stroke({ width: 2, color: P.brass });
  c.addChild(frame);
  // side wall dials
  const dials = new Graphics();
  for (const [x, y] of [[w * 0.09, h * 0.28], [w * 0.09, h * 0.46], [w * 0.91, h * 0.28], [w * 0.91, h * 0.46]]) { dials.circle(x, y, h * 0.055).fill(0x0d1030).stroke({ width: 2.4, color: P.brass }); dials.circle(x, y, h * 0.04).stroke({ width: 0.8, color: P.cream, alpha: 0.35 }); }
  c.addChild(dials);
  const needles = [];
  for (const [x, y] of [[w * 0.09, h * 0.28], [w * 0.09, h * 0.46], [w * 0.91, h * 0.28], [w * 0.91, h * 0.46]]) { const n = new Graphics().moveTo(0, 0).lineTo(h * 0.035, 0).stroke({ width: 1.6, color: P.coral, cap: 'round' }); n.position.set(x, y); needles.push([n, R() * 6]); c.addChild(n); }
  // crew silhouettes at consoles
  const crew = new Graphics();
  for (const [x, col] of [[w * 0.3, 0x3fc1b0], [w * 0.7, 0xe8b94a]]) {
    crew.roundRect(x - 26, h * 0.6, 52, 60, 20).fill(0x120f26); crew.roundRect(x - 24, h * 0.6 + 2, 48, 46, 18).fill(col); crew.roundRect(x - 24, h * 0.6 + 2, 48, 46, 18).stroke({ width: 1.4, color: 0xffffff, alpha: 0.2 });
    crew.circle(x, h * 0.58, 15).fill(0x2a1f2a); crew.ellipse(x - 4, h * 0.575, 10, 11).fill({ color: 0xffffff, alpha: 0.1 });
  }
  c.addChild(crew);
  // captain chair
  const ch = new Graphics();
  ch.roundRect(w * 0.5 - 34, h * 0.56, 68, 90, 24).fill(0x5f2f4f); ch.roundRect(w * 0.5 - 30, h * 0.58, 60, 78, 20).fill(0x8c5a8a); ch.roundRect(w * 0.5 - 30, h * 0.58, 60, 24, 18).fill({ color: 0xffffff, alpha: 0.15 });
  ch.circle(w * 0.5, h * 0.62, 13).fill(0x2a1f2a);
  c.addChild(ch);
  // console desk
  const desk = new Graphics();
  desk.poly([0, h, 0, h * 0.8, w * 0.12, h * 0.7, w * 0.88, h * 0.7, w, h * 0.8, w, h]).fill(0x232a52);
  desk.poly([0, h * 0.8, w * 0.12, h * 0.7, w * 0.88, h * 0.7, w, h * 0.8, w, h * 0.83, w * 0.88, h * 0.73, w * 0.12, h * 0.73, 0, h * 0.83]).fill(P.brass);
  desk.rect(0, h * 0.9, w, h * 0.1).fill({ color: 0x000000, alpha: 0.25 });
  c.addChild(desk);
  const lights = [];
  const lg = new Graphics(); c.addChild(lg);
  const cols = [P.teal, P.coral, P.mustard, P.good, 0xffffff, P.plum];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 28; i++) { const x = w * (0.06 + i * 0.0335), y = h * (0.77 + r * 0.06) + Math.abs(i - 14) * 0.2 * (r === 0 ? 0.2 : 0); if (R() < 0.12) continue; lights.push({ x, y: y + h * 0.01, col: R.pick(cols), sp: R.range(0.4, 2.2), ph: R() * 6, w: R.range(5, 12) }); }
  const lampG = glowSprite(0xffc878, h * 0.5, 0.2, 2); lampG.position.set(w * 0.5, h * 0.05); c.addChild(lampG);
  let t = 0;
  c.update = (dt) => {
    t += dt; sf.update(dt); pl.update(dt); sh.update(dt);
    lg.clear(); for (const l of lights) { const on = Math.sin(t * l.sp + l.ph) > -0.1; lg.roundRect(l.x, l.y, l.w, 3.4, 1.7).fill({ color: l.col, alpha: on ? 0.95 : 0.25 }); }
    needles.forEach(([n, ph]) => { n.rotation = -1 + Math.sin(t * 0.7 + ph) * 0.9 + 0.5; });
    sh.x = vx + vw * 0.3 + Math.sin(t * 0.2) * 8;
  };
  return c;
};
S.lounge = (w, h, R) => {
  const c = animated();
  c.addChild(gradRect(w, h, [[0, '#3c2420'], [1, '#22141c']]));
  const wall = new Graphics();
  for (let i = 0; i < 14; i++) wall.rect(i * w / 14, 0, 2, h * 0.78).fill({ color: 0x000000, alpha: 0.12 });
  wall.rect(0, h * 0.78, w, h * 0.22).fill(0x2a1a22); wall.rect(0, h * 0.78, w, 4).fill(P.brass);
  c.addChild(wall);
  const cx = w * 0.4, cy = h * 0.42, rad = h * 0.34;
  const win = new Container(), wm = new Graphics().circle(cx, cy, rad).fill(0xffffff);
  const sf = createStarfield({ w: rad * 2, h: rad * 2, seed: R() * 999 | 0 }); sf.position.set(cx - rad, cy - rad);
  const pl = createPlanet({ type: R.pick(PLANET_TYPES), seed: R() * 999 | 0, radius: rad * 0.8, moons: 2, ringed: R() < 0.4 }); pl.position.set(cx + rad * 0.4, cy + rad * 0.5);
  win.addChild(sf, pl, wm); win.mask = wm; c.addChild(win, wm);
  const ring = new Graphics().circle(cx, cy, rad + 5).stroke({ width: 10, color: 0x8a6a2a }).circle(cx, cy, rad + 1).stroke({ width: 2.5, color: P.brass });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ring.circle(cx + Math.cos(a) * (rad + 5), cy + Math.sin(a) * (rad + 5), 2).fill(0xf2d98a); }
  c.addChild(ring);
  const fur = new Graphics();
  // armchairs
  for (const [x, col] of [[w * 0.16, 0xef6f5e], [w * 0.6, 0xe8b94a]]) { const y = h * 0.78; fur.roundRect(x - 40, y - 62, 80, 66, 24).fill(col); fur.roundRect(x - 52, y - 30, 24, 44, 12).fill(lerpDark(col)); fur.roundRect(x + 28, y - 30, 24, 44, 12).fill(lerpDark(col)); fur.roundRect(x - 34, y - 26, 68, 30, 12).fill({ color: 0xffffff, alpha: 0.15 }); fur.rect(x - 34, y + 12, 6, 14).fill(0x1a0f14); fur.rect(x + 28, y + 12, 6, 14).fill(0x1a0f14); }
  // table
  fur.ellipse(w * 0.38, h * 0.86, 40, 7).fill(0x6a4a1a); fur.rect(w * 0.38 - 3, h * 0.86, 6, 22).fill(0x4a3010);
  fur.roundRect(w * 0.38 - 16, h * 0.84 - 10, 12, 9, 3).fill(P.cream); fur.roundRect(w * 0.38 + 6, h * 0.84 - 10, 12, 9, 3).fill(P.cream);
  // plant
  fur.roundRect(w * 0.9 - 14, h * 0.7, 28, 40, 5).fill(0xb84a3e);
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.4; fur.ellipse(w * 0.9 + Math.cos(a) * 20, h * 0.68 + Math.sin(a) * 26, 6, 18).fill(i % 2 ? 0x5f8a6a : 0x7fd18b); }
  c.addChild(fur);
  const lamp = glowSprite(0xffc878, h * 0.7, 0.28, 2); lamp.position.set(w * 0.88, h * 0.2); c.addChild(lamp);
  const steam = []; for (let i = 0; i < 6; i++) { const s = glowSprite(0xffffff, 5, 0.3); steam.push({ s, p: i / 6 }); c.addChild(s); }
  c.update = (dt) => { sf.update(dt); pl.update(dt); for (const o of steam) { o.p = (o.p + dt * 0.3) % 1; o.s.x = w * 0.38 - 10 + Math.sin(o.p * 8) * 4 + (o.p > 0.5 ? 22 : 0) * 0; o.s.y = h * 0.84 - 12 - o.p * 36; o.s.alpha = (1 - o.p) * 0.35; } lamp.alpha = 0.26 + 0.03 * Math.sin(performance.now() / 700); };
  return c;
};
const lerpDark = (col) => ((col >> 16 & 255) * 0.7 << 16) | ((col >> 8 & 255) * 0.7 << 8) | ((col & 255) * 0.7);
S.engine_room = (w, h, R) => {
  const c = animated();
  c.addChild(gradRect(w, h, [[0, '#0d2430'], [1, '#12162e']]));
  const g = new Graphics();
  for (let i = 0; i < 9; i++) g.rect(0, h * 0.1 + i * h * 0.1, w, 1).fill({ color: 0x3fc1b0, alpha: 0.06 });
  // pipes
  for (const y of [0.18, 0.3, 0.72, 0.82]) { g.rect(0, h * y - 5, w * 0.32, 10).fill(0xb98a30); g.rect(0, h * y - 5, w * 0.32, 3).fill({ color: 0xffffff, alpha: 0.25 }); g.rect(w * 0.68, h * y - 5, w * 0.32, 10).fill(0xb98a30); g.rect(w * 0.68, h * y - 5, w * 0.32, 3).fill({ color: 0xffffff, alpha: 0.25 }); for (let i = 0; i < 4; i++) { g.rect(w * 0.06 + i * w * 0.07, h * y - 7, 4, 14).fill(0x6a4a1a); g.rect(w * 0.7 + i * w * 0.07, h * y - 7, 4, 14).fill(0x6a4a1a); } }
  g.rect(0, h * 0.9, w, h * 0.1).fill(0x0a0e22); for (let i = 0; i < 24; i++) g.rect(i * w / 24, h * 0.9, 2, h * 0.1).fill({ color: 0x3fc1b0, alpha: 0.15 });
  c.addChild(g);
  const cw = w * 0.14, cx = w * 0.5, cyT = h * 0.08, ch = h * 0.8;
  const glow = glowSprite(0x3fc1b0, h * 0.65, 0.5, 2); glow.position.set(cx, h * 0.48); glow.scale.x *= 0.7; c.addChild(glow);
  const core = new Graphics().roundRect(cx - cw / 2, cyT, cw, ch, cw / 2).fill(0x0b2a30).stroke({ width: 4, color: 0x8a6a2a });
  c.addChild(core);
  const inner = gradRect(cw * 0.55, ch * 0.88, [[0, '#a8fff0'], [0.5, '#3fc1b0'], [1, '#14786f']], true); inner.x = cx - cw * 0.275; inner.y = cyT + ch * 0.06; c.addChild(inner);
  const rings = new Graphics(); for (let i = 0; i < 6; i++) { rings.roundRect(cx - cw * 0.62, cyT + ch * (0.12 + i * 0.15), cw * 1.24, 8, 4).fill(P.brass); rings.roundRect(cx - cw * 0.62, cyT + ch * (0.12 + i * 0.15), cw * 1.24, 3, 2).fill({ color: 0xffffff, alpha: 0.3 }); } c.addChild(rings);
  const bits = []; for (let i = 0; i < 14; i++) { const b = glowSprite(0xcffff6, 2.6, 0.9); bits.push({ b, p: R(), x: R.range(-0.4, 0.4) }); c.addChild(b); }
  const dials = new Graphics(), needles = [];
  for (const [x, y] of [[0.15, 0.55], [0.24, 0.55], [0.76, 0.55], [0.85, 0.55]]) { dials.circle(w * x, h * y, 20).fill(0x0d1030).stroke({ width: 3, color: P.brass }); const n = new Graphics().moveTo(0, 0).lineTo(15, 0).stroke({ width: 1.6, color: P.coral, cap: 'round' }); n.position.set(w * x, h * y); needles.push([n, R() * 6]); }
  c.addChild(dials, ...needles.map((n) => n[0]));
  let t = 0;
  c.update = (dt) => { t += dt; const p = 0.8 + 0.2 * Math.sin(t * 1.8); glow.alpha = 0.4 * p + 0.1; inner.alpha = 0.7 + 0.3 * p; for (const o of bits) { o.p = (o.p + dt * 0.3) % 1; o.b.x = cx + o.x * cw * 1.5 + Math.sin(o.p * 10) * 4; o.b.y = cyT + ch - o.p * ch; o.b.alpha = Math.sin(o.p * Math.PI) * 0.9; } needles.forEach(([n, ph]) => { n.rotation = -0.9 + (0.5 + 0.5 * Math.sin(t * 1.1 + ph)) * 1.8 + (Math.random() - 0.5) * 0.02; }); };
  return c;
};
S.sickbay = (w, h, R) => {
  const c = animated();
  c.addChild(gradRect(w, h, [[0, '#24485a'], [1, '#16283c']]));
  const g = new Graphics();
  g.rect(0, h * 0.74, w, h * 0.26).fill(0x1b3040); g.rect(0, h * 0.74, w, 4).fill(0x3fc1b0);
  // wall cross
  g.circle(w * 0.5, h * 0.3, h * 0.17).fill({ color: 0xffffff, alpha: 0.05 }).stroke({ width: 3, color: 0x8fe0d0, alpha: 0.6 });
  g.roundRect(w * 0.5 - 8, h * 0.3 - h * 0.12, 16, h * 0.24, 4).fill(0xef6f5e); g.roundRect(w * 0.5 - h * 0.12, h * 0.3 - 8, h * 0.24, 16, 4).fill(0xef6f5e);
  // beds
  for (const x of [w * 0.2, w * 0.8]) { g.roundRect(x - 60, h * 0.62, 120, 22, 8).fill(0xf2e3b8); g.roundRect(x - 60, h * 0.62, 120, 8, 6).fill({ color: 0xffffff, alpha: 0.4 }); g.roundRect(x - 56, h * 0.62 - 12, 30, 14, 7).fill(0xffffff); g.rect(x - 50, h * 0.74 - 2, 6, 26).fill(0x6a8a9a); g.rect(x + 44, h * 0.74 - 2, 6, 26).fill(0x6a8a9a); g.roundRect(x - 60, h * 0.65, 120, 8, 0).fill({ color: 0x3fc1b0, alpha: 0.8 }); }
  // scanner arch
  g.moveTo(w * 0.34, h * 0.78).lineTo(w * 0.34, h * 0.4).quadraticCurveTo(w * 0.5, h * 0.2, w * 0.66, h * 0.4).lineTo(w * 0.66, h * 0.78).stroke({ width: 7, color: 0xb8c8d0, cap: 'round' });
  c.addChild(g);
  const beam = new Graphics(); c.addChild(beam);
  // monitor
  const mon = new Graphics().roundRect(w * 0.44, h * 0.62, w * 0.12, h * 0.1, 6).fill(0x08121c).stroke({ width: 2, color: P.brass }); c.addChild(mon);
  const line = new Graphics(); c.addChild(line);
  const lamp = glowSprite(0xdff8ff, h * 0.6, 0.25, 2); lamp.position.set(w * 0.5, 0); c.addChild(lamp);
  let t = 0;
  c.update = (dt) => {
    t += dt; beam.clear(); const y = h * 0.4 + (0.5 + 0.5 * Math.sin(t * 0.9)) * h * 0.34; beam.rect(w * 0.34, y, w * 0.32, 3).fill({ color: 0x8fe0d0, alpha: 0.55 }); beam.rect(w * 0.34, y - 8, w * 0.32, 16).fill({ color: 0x8fe0d0, alpha: 0.08 });
    line.clear(); const mx = w * 0.45, mw = w * 0.1, my = h * 0.67; for (let i = 0; i <= 40; i++) { const u = i / 40, ph = (u * 2 - t * 0.6) % 1; const v = ph < 0.08 ? -Math.sin(ph / 0.08 * Math.PI) * h * 0.035 : ph < 0.14 ? Math.sin((ph - 0.08) / 0.06 * Math.PI) * h * 0.012 : 0; if (i === 0) line.moveTo(mx, my + v); else line.lineTo(mx + u * mw, my + v); } line.stroke({ width: 1.6, color: 0x7fd18b, cap: 'round', join: 'round' });
  };
  return c;
};
S.market = (w, h, R) => {
  const c = animated();
  c.addChild(gradRect(w, h, [[0, '#2a1a48'], [0.55, '#8c4a6a'], [1, '#e08a5a']]));
  const g = new Graphics(); const Nz = makeNoise(R() * 99999 | 0);
  // skyline
  for (let i = 0; i < 16; i++) { const bw = w / 12, bx = i * w / 15 - 10, bh = h * (0.25 + Nz.n3(i * 3.1, 1, 1) * 0.3); g.roundRect(bx, h * 0.68 - bh, bw, bh + 20, 6).fill(0x2a1830); for (let j = 0; j < 5; j++) if (Nz.n3(i, j, 9) > 0.4) g.rect(bx + 6 + (j % 2) * bw * 0.4, h * 0.68 - bh + 10 + Math.floor(j / 2) * 18, 6, 8).fill({ color: 0xffd070, alpha: 0.8 }); }
  g.rect(0, h * 0.66, w, h * 0.34).fill(0x3a2230); g.rect(0, h * 0.66, w, 3).fill({ color: 0xffd070, alpha: 0.4 });
  c.addChild(g);
  // stalls
  const stalls = new Graphics();
  const cols = [0xef6f5e, 0xf2e3b8, 0x3fc1b0, 0xe8b94a];
  for (const [sx, sw, ci] of [[w * 0.02, w * 0.3, 0], [w * 0.36, w * 0.3, 2], [w * 0.7, w * 0.28, 3]]) {
    const top = h * 0.4, n = 8, st = sw / n;
    for (let i = 0; i < n; i++) stalls.poly([sx + i * st, top, sx + (i + 1) * st, top, sx + (i + 1) * st + 3, top + 40, sx + i * st - 3, top + 40]).fill(cols[(i % 2) ? ci === 0 ? 1 : 1 : ci]);
    for (let i = 0; i < n; i++) stalls.ellipse(sx + i * st + st / 2, top + 40, st / 2 + 1, 5).fill(cols[(i % 2) ? 1 : ci]);
    stalls.rect(sx + 4, top + 40, 4, h * 0.3).fill(0x4a2f20); stalls.rect(sx + sw - 8, top + 40, 4, h * 0.3).fill(0x4a2f20);
    stalls.roundRect(sx + 4, h * 0.72, sw - 8, h * 0.1, 4).fill(0x6a4a2a); stalls.roundRect(sx + 4, h * 0.72, sw - 8, 5, 3).fill({ color: 0xffffff, alpha: 0.2 });
    for (let i = 0; i < 6; i++) stalls.circle(sx + 20 + i * (sw - 40) / 5, h * 0.72 - 6, 6 + (i % 3) * 1.5).fill(cols[(i + ci) % 4]);
  }
  c.addChild(stalls);
  // folk silhouettes
  const folk = new Graphics();
  for (const [x, col] of [[w * 0.33, 0x120a1a], [w * 0.67, 0x120a1a]]) { folk.roundRect(x - 14, h * 0.74, 28, h * 0.26, 12).fill(col); folk.circle(x, h * 0.72, 11).fill(col); folk.poly([x - 16, h * 0.705, x, h * 0.64, x + 16, h * 0.705]).fill(col); }
  c.addChild(folk);
  // lantern strings
  const lan = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) { const x = (i + 0.5) * w / 12, y = h * (0.12 + r * 0.1) + Math.sin(i / 11 * Math.PI) * h * 0.06; const l = glowSprite([0xffd070, 0xef8f5e, 0xffe8a0][i % 3], 15, 0.9, 1.8); l.position.set(x, y); lan.push([l, R() * 6, x, y]); c.addChild(l); const d = new Graphics().ellipse(x, y, 3.5, 4.5).fill(0xfff2c0); c.addChild(d); }
  const line = new Graphics(); for (let r = 0; r < 2; r++) { line.moveTo(0, h * (0.12 + r * 0.1)); for (let i = 0; i <= 24; i++) line.lineTo(i / 24 * w, h * (0.12 + r * 0.1) + Math.sin(i / 24 * Math.PI * 1) * h * 0.06 * 1); line.stroke({ width: 1.2, color: 0x2a1830, alpha: 0.8 }); } c.addChildAt(line, 2);
  let t = 0; c.update = (dt) => { t += dt; for (const [l, ph] of lan) l.alpha = 0.7 + 0.25 * Math.sin(t * 2 + ph); };
  return c;
};
S.landing = (w, h, R, spec) => {
  const c = animated();
  const warm = R() < 0.5;
  c.addChild(gradRect(w, h, warm ? [[0, '#2a2a5e'], [0.5, '#c46a70'], [1, '#f2b070']] : [[0, '#0f2a4a'], [0.5, '#2f7a8a'], [1, '#a8e0c0']]));
  const sf = createStarfield({ w, h: h * 0.5, seed: R() * 99 | 0, bg: false, density: 0.7 }); sf.alpha = 0.6; c.addChild(sf);
  const sun = glowSprite(warm ? 0xffe0a0 : 0xe8fff0, h * 0.5, 0.7, 2); sun.position.set(w * 0.2, h * 0.58); c.addChild(sun);
  const big = createPlanet({ type: R.pick(['gas', 'ice', 'ocean', 'terran', 'crystal']), seed: R() * 999 | 0, radius: h * 0.22, ringed: R() < 0.5, moons: 1 }); big.position.set(w * 0.72, h * 0.26); c.addChild(big);
  const Nz = makeNoise(R() * 9999 | 0);
  const hills = (base, amp, col, f, off) => { const g = new Graphics(); g.moveTo(0, h); for (let i = 0; i <= 60; i++) { const x = i / 60 * w; g.lineTo(x, h * base - Nz.fbm(i * f + off, 1, 2, 3) * amp); } g.lineTo(w, h).closePath().fill(col); return g; };
  c.addChild(hills(0.72, h * 0.18, warm ? 0x6a3a5a : 0x1f5a6a, 0.09, 1), hills(0.8, h * 0.14, warm ? 0x4a2a48 : 0x164a58, 0.12, 9), hills(0.9, h * 0.09, warm ? 0x2a1a30 : 0x0d2a3a, 0.16, 20));
  const ship = createShip({ kind: 'tender', scale: h / 300, thrust: 0 }); const sh = new Container(); sh.addChild(ship); sh.position.set(w * 0.4, h * 0.74);
  const legs = new Graphics().moveTo(-20, 12).lineTo(-30, 28).moveTo(20, 12).lineTo(30, 28).stroke({ width: 3, color: 0x2a3566, cap: 'round' }); legs.scale.set(h / 300 * 1.2); sh.addChildAt(legs, 0); c.addChild(sh);
  const fig = new Graphics(); for (const [x, y] of [[w * 0.52, h * 0.86], [w * 0.55, h * 0.87]]) { fig.roundRect(x - 3, y - 14, 6, 14, 3).fill(0x120a1a); fig.circle(x, y - 17, 3.4).fill(0x120a1a); } c.addChild(fig);
  const lan = glowSprite(0xffd070, 10, 0.9, 1.8); lan.position.set(w * 0.52 + 6, h * 0.86 - 8); c.addChild(lan);
  let t = 0; c.update = (dt) => { t += dt; sf.update(dt); big.update(dt); lan.alpha = 0.75 + 0.2 * Math.sin(t * 3); };
  void spec; return c;
};
S.ruins = (w, h, R) => {
  const c = animated();
  c.addChild(gradRect(w, h, [[0, '#14123a'], [0.5, '#5a3a6a'], [1, '#e8a070']]));
  const sf = createStarfield({ w, h: h * 0.55, seed: R() * 99 | 0, bg: false, density: 0.8 }); c.addChild(sf);
  const moon = createPlanet({ type: 'barren', seed: R() * 99 | 0, radius: h * 0.14 }); moon.position.set(w * 0.8, h * 0.2); c.addChild(moon);
  const g = new Graphics(); const base = h * 0.82;
  g.rect(0, base, w, h - base).fill(0x1a1228);
  const col = (x, hgt, wd = 16, broken = false) => { g.rect(x - wd / 2, base - hgt, wd, hgt).fill(0x22182e); g.rect(x - wd / 2 - 3, base - hgt - 6, wd + 6, 8).fill(0x2a1f38); if (!broken) g.rect(x - wd / 2 - 3, base - 8, wd + 6, 8).fill(0x2a1f38); g.rect(x - wd / 2, base - hgt, 3, hgt).fill({ color: 0xffffff, alpha: 0.05 }); if (broken) g.poly([x - wd / 2, base - hgt, x - 2, base - hgt - 8, x + 3, base - hgt - 2, x + wd / 2, base - hgt - 9, x + wd / 2, base - hgt]).fill(0x22182e); };
  for (const [x, hh, b] of [[w * 0.1, h * 0.4, false], [w * 0.2, h * 0.3, true], [w * 0.3, h * 0.46, false], [w * 0.7, h * 0.46, false], [w * 0.8, h * 0.22, true], [w * 0.9, h * 0.38, false]]) col(x, hh, 20, b);
  // arch
  g.moveTo(w * 0.3, base - h * 0.46).quadraticCurveTo(w * 0.5, base - h * 0.78, w * 0.7, base - h * 0.46).stroke({ width: 20, color: 0x22182e });
  g.moveTo(w * 0.3, base - h * 0.46).quadraticCurveTo(w * 0.5, base - h * 0.78, w * 0.7, base - h * 0.46).stroke({ width: 3, color: 0x6a5a8a, alpha: 0.5 });
  c.addChild(g);
  const door = glowSprite(0x7fe0e8, h * 0.5, 0.55, 2); door.position.set(w * 0.5, base - h * 0.2); door.scale.y *= 1.3; c.addChild(door);
  const glyph = new Graphics(); for (let i = 0; i < 5; i++) { const y = base - h * (0.12 + i * 0.07); glyph.circle(w * 0.5, y, 4).stroke({ width: 1.4, color: 0xbff6f6, alpha: 0.9 }); glyph.moveTo(w * 0.5 - 12, y).lineTo(w * 0.5 + 12, y).stroke({ width: 1, color: 0xbff6f6, alpha: 0.6 }); } c.addChild(glyph);
  const fog = []; for (let i = 0; i < 3; i++) { const f = gradRect(w * 1.4, h * 0.3, [[0, 'rgba(230,180,200,0)'], [0.6, 'rgba(230,180,200,0.22)'], [1, 'rgba(230,180,200,0)']]); f.y = base - h * 0.14 + i * h * 0.05; fog.push([f, i]); c.addChild(f); }
  const motes = []; for (let i = 0; i < 16; i++) { const m = glowSprite(0xbff6f6, 2.2, 0.8); motes.push({ m, p: R(), x: R() * w, v: R.range(0.05, 0.15) }); c.addChild(m); }
  let t = 0; c.update = (dt) => { t += dt; sf.update(dt); moon.update(dt); door.alpha = 0.5 + 0.12 * Math.sin(t * 1.3); glyph.alpha = 0.6 + 0.4 * Math.sin(t * 1.3 + 1); for (const [f, i] of fog) f.x = -w * 0.2 + Math.sin(t * 0.1 + i * 2) * w * 0.1; for (const o of motes) { o.p = (o.p + dt * o.v) % 1; o.m.x = o.x + Math.sin(o.p * 8) * 10; o.m.y = h * 0.85 - o.p * h * 0.6; o.m.alpha = Math.sin(o.p * Math.PI); } };
  return c;
};

const INTERIOR = new Set(['bridge', 'lounge', 'market', 'engine_room', 'sickbay', 'landing', 'ruins']);

export function createSceneArt(spec = {}, w = 560, h = 300) {
  const root = animated();
  const kind = S[spec.scene] ? spec.scene : 'void';
  const R = rng(spec.seed != null ? hashStr(String(spec.seed) + kind) : hashStr(JSON.stringify(spec) + kind));
  const content = new Container();
  const scene = S[kind](w, h, R, spec);
  content.addChild(scene);
  // palette tint
  const tints = { warm: [0xffb060, 0.1], cool: [0x5aa0e0, 0.1], dusk: [0x8c5a8a, 0.14], alarm: [0xef6f5e, 0.12], teal: [0x3fc1b0, 0.08], gold: [0xe8b94a, 0.1], dark: [0x000000, 0.25] };
  const tn = tints[spec.palette]; if (tn) content.addChild(new Graphics().rect(0, 0, w, h).fill({ color: tn[0], alpha: tn[1] }));
  let accent = null;
  const sp = spec.species;
  if (sp && sp !== 'none') {
    if (INTERIOR.has(kind) || kind === 'station') {
      const size = Math.min(h * 0.62, w * 0.3);
      const pr = createPortrait({ species: sp, seed: spec.seed ?? 3, size, mood: spec.mood || 'neutral' });
      const hold = new Container(); hold.addChild(new Graphics().roundRect(4, 6, size, size, 10).fill({ color: 0x000000, alpha: 0.4 })); hold.addChild(pr);
      hold.position.set(w - size - 18, h - size - h * 0.08); content.addChild(hold); accent = pr;
    } else if (kind !== 'ship_alien' && SHIP_OF[sp]) {
      const sh = createShip({ kind: SHIP_OF[sp], scale: Math.min(1.1, w / 560 * 0.75), thrust: 0.5 }); sh.position.set(w * 0.2, h * 0.78); content.addChild(sh); accent = sh;
      accent._base = sh.x;
    } else if (kind !== 'ship_alien' && sp === 'unknown') {
      const gl = glowSprite(0xb9a0ff, h * 0.2, 0.4, 2); gl.position.set(w * 0.2, h * 0.75); content.addChild(gl); accent = gl;
    }
  }
  const mask = new Graphics().roundRect(0, 0, w, h, 12).fill(0xffffff); root.addChild(content, mask); content.mask = mask;
  // overlays
  const scan = createScanlines(w, h, 0.09); const vig = createVignette(w, h, 0.7);
  const bars = new Graphics(); const bh = Math.round(h * 0.055);
  bars.rect(0, 0, w, bh).fill({ color: 0x03040c, alpha: 0.92 }).rect(0, h - bh, w, bh).fill({ color: 0x03040c, alpha: 0.92 });
  bars.moveTo(0, bh).lineTo(w, bh).moveTo(0, h - bh).lineTo(w, h - bh).stroke({ width: 1, color: P.brass, alpha: 0.55 });
  const frame = new Graphics().roundRect(1.5, 1.5, w - 3, h - 3, 12).stroke({ width: 3, color: 0x8a6a2a }).roundRect(0.5, 0.5, w - 1, h - 1, 12.5).stroke({ width: 1, color: P.brass, alpha: 0.9 });
  const rec = glowSprite(P.coral, 6, 0.9, 1.8); rec.position.set(w - 16, bh / 2); const rdot = new Graphics().circle(w - 16, bh / 2, 1.8).fill(0xffd0c8);
  root.addChild(scan, vig, bars, rec, rdot, frame);
  let t = 0;
  root.update = (dt) => {
    t += dt; if (scene.update) scene.update(dt);
    scan.update(dt); const on = (t % 2) < 1.2; rec.alpha = on ? 0.9 : 0.15; rdot.alpha = on ? 1 : 0.2;
    if (accent && accent.update) accent.update(dt);
    if (accent && accent._base != null) accent.x = accent._base + Math.sin(t * 0.25) * w * 0.03;
    content.scale.set(1 + 0.004 * Math.sin(t * 0.1)); 
  };
  root.update(0);
  root.sceneKind = kind;
  return root;
}
void clamp; void lerp; void Sprite; void hx; void blinkRect;
