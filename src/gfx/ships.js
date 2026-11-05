import { Container, Sprite, Graphics } from 'pixi.js';
import { glowSprite, TAU, animated, rng, hashStr } from './util.js';
import { gradTex } from './space.js';
import { palette } from './palette.js';

const P = palette;
function flame(len, h, color = 0xffb060) {
  // horizontal gradient: left transparent -> right hot ; anchored with right edge at origin
  const c = '#' + color.toString(16).padStart(6, '0');
  const s = new Sprite(gradTex([[0, 'rgba(255,160,80,0)'], [0.55, c + '88'], [0.9, '#fff4d8ee'], [1, '#ffffff']], 128, 4, true));
  s.anchor.set(1, 0.5); s.width = len; s.height = h; s.blendMode = 'add';
  const g = glowSprite(color, h * 1.6, 0.7, 2); g.x = -len * 0.08;
  const c2 = new Container(); c2.addChild(g, s); c2._len = len; c2._h = h; c2._s = s; c2._g = g;
  return c2;
}
function light(x, y, color, r = 2) { const c = new Container(); c.addChild(glowSprite(color, r * 4, 0.9, 2)); const d = new Graphics().circle(0, 0, r * 0.6).fill(0xffffff); c.addChild(d); c.position.set(x, y); return c; }

function halcyon(root) {
  const g = new Graphics();
  const pod = (x, y, len, h, body, trim, fin) => {
    // fin (behind)
    g.poly([x - len * 0.55, y - h * 0.4, x - len * 0.95, y - h * 2.3, x - len * 0.72, y - h * 2.2, x - len * 0.18, y - h * 0.4]).fill(fin);
    g.roundRect(x - len / 2, y - h / 2, len, h, h / 2).fill(body);
    g.poly([x + len * 0.25, y - h / 2, x + len / 2 + 6, y, x + len * 0.25, y + h / 2]).fill(body);
    g.roundRect(x - len / 2 + 2, y - h / 2 + 1.5, len * 0.88, h * 0.28, 3).fill({ color: 0xffffff, alpha: 0.22 });
    g.roundRect(x - len * 0.22, y - h / 2, 5, h, 1).fill(trim);
    g.roundRect(x - len * 0.05, y - h / 2, 3, h, 1).fill(trim);
    g.roundRect(x - len / 2, y - h * 0.18, 8, h * 0.36, 3).fill(0x2a3566); // exhaust bell
    g.circle(x + len / 2 - 3, y, h * 0.3).fill({ color: P.teal, alpha: 0.9 });
  };
  // rear pod + pylon
  g.poly([-52, -12, -34, -12, -42, -24, -62, -24]).fill(0x8a6a2a);
  pod(-62, -30, 72, 14, 0xb88f3a, P.teal, 0xef6f5e);
  // hull
  g.ellipse(0, 3, 63, 15).fill(0x8a6a2a);
  g.ellipse(0, 0, 62, 15).fill(0xd9a441);
  g.ellipse(0, -2.5, 60, 11.5).fill(0xf2e3b8);
  g.ellipse(-4, -5.5, 48, 5).fill({ color: 0xffffff, alpha: 0.28 });
  g.ellipse(0, 8, 54, 5).fill({ color: 0xb98a30, alpha: 0.55 });
  g.ellipse(0, 0, 62, 15).stroke({ width: 1.4, color: 0xfff1c8, alpha: 0.5 });
  g.ellipse(0, 1, 56, 11.5).stroke({ width: 1.2, color: 0xb98a30, alpha: 0.9 });
  // bridge dome
  g.ellipse(24, -11, 19, 8).fill(0xe2cf9c); g.ellipse(24, -13, 14, 5).fill({ color: 0xffffff, alpha: 0.3 });
  g.ellipse(33, -11, 4, 2.5).fill(P.teal);
  // windows
  for (let i = 0; i < 12; i++) { const x = -44 + i * 7.2; g.roundRect(x, 1.5, 3.6, 2.4, 1).fill({ color: i % 4 === 0 ? 0xfff1c8 : 0x2a3566, alpha: 0.9 }); }
  // coral band
  g.ellipse(0, 4.5, 56, 3).stroke({ width: 1.2, color: P.coral, alpha: 0.9 });
  // mast
  g.poly([-24, -12, -19, -12, -20.5, -52, -22.5, -52]).fill(0xb98a30);
  g.roundRect(-27, -30, 11, 2, 1).fill(0xd9a441); g.roundRect(-26, -40, 9, 2, 1).fill(0xd9a441);
  g.poly([-27, -54, -17, -54, -15, -60, -29, -60]).fill(0xd9a441);
  g.roundRect(-25.5, -72, 7, 12, 3).fill({ color: 0xffd88a, alpha: 0.95 });
  g.roundRect(-24.5, -71, 5, 10, 2.5).fill(0xfff6d8);
  g.poly([-27, -72, -17, -72, -22, -77]).fill(0xd9a441);
  g.circle(-22, -79, 1.5).fill(0xd9a441);
  // front pod + pylon
  g.poly([-46, 14, -26, 14, -30, 26, -52, 26]).fill(0xb98a30);
  pod(-62, 33, 74, 15, 0xe2b24a, P.coral, 0x3fc1b0);
  root.addChild(g);
  const lanternGlow = glowSprite(0xffd070, 26, 0.85, 2); lanternGlow.position.set(-22, -66); root.addChild(lanternGlow);
  const f1 = flame(34, 9, 0x8fe0ff), f2 = flame(36, 10, 0x8fe0ff);
  f1.position.set(-99, -30); f2.position.set(-99, 33); root.addChild(f1, f2);
  const l1 = light(40, 2, P.coral, 2), l2 = light(-10, -12.5, 0x7fd18b, 1.6), l3 = light(-30, 0, P.mustard, 1.6); root.addChild(l1, l2, l3);
  return { flames: [f1, f2], blink: [[l1, 1.3], [l2, 0.9], [l3, 2.1]], glow: lanternGlow, bounds: 150 };
}

function quillari(root) {
  const g = new Graphics();
  // tail/crest feathers fan
  const fan = [[-0.55, 0xe8b94a], [-0.3, 0x3fc1b0], [-0.05, 0xef6f5e], [0.2, 0x3fc1b0], [0.45, 0xe8b94a]];
  for (const [a, c] of fan) {
    g.ellipse(-50, 0, 46, 7).fill({ color: c, alpha: 0.92 });
    g.ellipse(-50, 0, 46, 7).stroke({ width: 1, color: 0xf2e3b8, alpha: 0.4 });
    const last = g.context ? 0 : 0; void last;
  }
  g.clear();
  for (const [a, c] of fan) {
    const gg = new Graphics(); gg.ellipse(-44, 0, 44, 6.5).fill(c); gg.ellipse(-44, 0, 44, 6.5).stroke({ width: 1, color: 0xf2e3b8, alpha: 0.45 }); gg.ellipse(-52, 0, 32, 1.2).fill({ color: 0xffffff, alpha: 0.35 });
    gg.pivot.set(-6, 0); gg.rotation = a * 0.9; gg.position.set(-6, 0); root.addChild(gg);
  }
  g.ellipse(0, 0, 36, 13).fill(0xf2e3b8);
  g.ellipse(2, -3, 30, 8).fill(0xfff6dc);
  g.ellipse(0, 6, 32, 5).fill({ color: 0xd9a441, alpha: 0.6 });
  g.poly([30, -8, 56, 0, 30, 8, 36, 0]).fill(0xe8b94a); // beak
  g.poly([30, -8, 56, 0, 38, -1]).fill({ color: 0xffffff, alpha: 0.3 });
  g.circle(16, -4, 6.5).fill(0x2a3566); g.circle(16, -4, 4.5).fill(P.teal); g.circle(17, -5, 1.6).fill(0xffffff);
  for (let i = 0; i < 4; i++) g.circle(-22 + i * 7, 4, 1.5).fill(0xef6f5e);
  g.ellipse(0, 0, 36, 13).stroke({ width: 1.3, color: 0xd9a441, alpha: 0.9 });
  root.addChild(g);
  const f = flame(30, 10, 0xffc070); f.position.set(-8, 0); root.addChildAt(f, 0);
  return { flames: [f], blink: [], bounds: 100 };
}

function vesperine(root) {
  const halo = glowSprite(0xc7a4ff, 80, 0.45, 2); root.addChild(halo);
  const g = new Graphics();
  const body = [[-52, 0], [-26, -16], [34, -12], [66, 0], [34, 12], [-26, 16]];
  g.poly(body.flat()).fill({ color: 0x8f78d8, alpha: 0.85 });
  g.poly([-26, -16, 34, -12, 66, 0, -52, 0]).fill({ color: 0xcdb8ff, alpha: 0.65 });
  g.poly([-52, 0, 66, 0, 34, 12, -26, 16]).fill({ color: 0x5a4aa8, alpha: 0.7 });
  g.poly([-6, -14, 34, -12, 20, 0, -14, 0]).fill({ color: 0xffffff, alpha: 0.22 });
  for (const [x1, y1, x2, y2] of [[-26, -16, -26, 16], [6, -14, 6, 14], [34, -12, 34, 12], [-52, 0, 66, 0]]) g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 1, color: 0xf0e8ff, alpha: 0.45 });
  g.poly(body.flat()).stroke({ width: 1.5, color: 0xf0e8ff, alpha: 0.8 });
  root.addChild(g);
  const core = glowSprite(0xffe6ff, 22, 0.95, 1.6); core.x = 6; root.addChild(core);
  const shards = [];
  for (let i = 0; i < 4; i++) { const s = new Graphics().poly([0, -7, 3.5, 0, 0, 7, -3.5, 0]).fill({ color: 0xcdb8ff, alpha: 0.85 }).stroke({ width: 1, color: 0xffffff, alpha: 0.6 }); shards.push([s, i]); root.addChild(s); }
  const f = flame(26, 8, 0xd8b8ff); f.position.set(-50, 0); root.addChildAt(f, 0);
  return { flames: [f], blink: [], halo, core, shards, bounds: 120 };
}

function archivist(root) {
  const g = new Graphics();
  g.poly([-14, -28, 4, -28, 0, -52, -10, -52]).fill(0xb98a30); // dorsal spire
  g.poly([-20, 24, -2, 24, -8, 44, -26, 40]).fill(0xb98a30);
  g.circle(0, 0, 32).fill(0x8a6a2a); g.circle(-1, -1, 31).fill(0xd9a441);
  g.circle(-7, -8, 22).fill({ color: 0xf2e3b8, alpha: 0.32 });
  g.ellipse(0, 0, 38, 8).stroke({ width: 3, color: 0xb98a30 }); g.ellipse(0, 0, 38, 8).stroke({ width: 1, color: 0xf2e3b8, alpha: 0.5 });
  g.ellipse(0, 0, 34, 20).stroke({ width: 1.5, color: 0x8a6a2a, alpha: 0.7 });
  for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; g.circle(Math.cos(a + 2.2) * 27, Math.sin(a + 2.2) * 27, 1.4).fill(0x8a6a2a); }
  g.roundRect(-8, -56, 8, 6, 2).fill(0xd9a441);
  g.circle(22, 0, 11).fill(0x2a2218); g.circle(22, 0, 8.5).fill(0xb98a30);
  root.addChild(g);
  const eye = glowSprite(0xffe08a, 14, 1, 1.5); eye.x = 22; root.addChild(eye);
  const eyeCore = new Graphics().circle(22, 0, 3.5).fill(0xfff6d0); root.addChild(eyeCore);
  const lamps = [light(-6, -50, 0xffe08a, 2), light(-18, 40, 0xffe08a, 1.6)]; root.addChild(...lamps);
  const f = flame(24, 12, 0xfff0b0); f.position.set(-30, 0); root.addChildAt(f, 0);
  return { flames: [f], blink: [[lamps[0], 1.7], [lamps[1], 1.1]], eye, bounds: 100 };
}

function drifter(root) {
  const R = rng(99);
  const g = new Graphics();
  const cols = [0xef8f5e, 0x3fc1b0, 0xe8b94a, 0x8c5a8a, 0x8fb996, 0xd9a441, 0x5aa0e0];
  g.roundRect(-52, -12, 24, 26, 4).fill(0x6a5a52); g.roundRect(-28, -16, 52, 32, 5).fill(0x8a7a6a);
  g.roundRect(22, -10, 26, 22, 8).fill(0xb8a48a);
  // patchwork panels
  const panels = [[-26, -14, 18, 14], [-8, -14, 16, 14], [8, -14, 14, 14], [-26, 0, 14, 14], [-12, 0, 20, 14], [8, 0, 14, 14], [-50, -10, 12, 12], [-50, 2, 12, 12]];
  panels.forEach((p, i) => { g.roundRect(p[0], p[1], p[2], p[3], 2).fill({ color: cols[(i * 3 + 1) % cols.length], alpha: 0.9 }); g.roundRect(p[0], p[1], p[2], p[3], 2).stroke({ width: 1, color: 0x2a2018, alpha: 0.6 }); });
  g.roundRect(-52, -12, 24, 26, 4).stroke({ width: 1.2, color: 0x2a2018, alpha: 0.7 }); g.roundRect(-28, -16, 52, 32, 5).stroke({ width: 1.2, color: 0x2a2018, alpha: 0.7 });
  g.roundRect(24, -7, 16, 10, 5).fill(0xfff1c8); g.roundRect(26, -5, 12, 6, 3).fill(0x3fc1b0);
  // pipes
  g.moveTo(-28, -16).lineTo(-28, -26).lineTo(-6, -26).stroke({ width: 3, color: 0xd9a441 }); g.moveTo(-6, -26).lineTo(-6, -16).stroke({ width: 3, color: 0xd9a441 });
  // awning/sail
  g.poly([4, -16, 4, -48, 30, -16]).fill({ color: 0xef8f5e, alpha: 0.95 }); g.poly([4, -16, 4, -48, 14, -34, 14, -16]).fill({ color: 0xf2e3b8, alpha: 0.9 });
  g.moveTo(4, -16).lineTo(4, -50).stroke({ width: 1.5, color: 0x6a5a52 });
  // stripe string of lights
  root.addChild(g);
  const ls = []; for (let i = 0; i < 5; i++) { const l = light(-24 + i * 12, 19, cols[i % cols.length], 1.5); ls.push([l, 1 + i * 0.4]); root.addChild(l); }
  const lan = light(4, -50, 0xffd070, 2.2); root.addChild(lan);
  const f = flame(22, 11, 0xffb070); f.position.set(-52, 2); root.addChildAt(f, 0);
  void R;
  return { flames: [f], blink: ls.concat([[lan, 2.3]]), bounds: 100 };
}

function concord(root) {
  const g = new Graphics();
  g.poly([-44, -8, -62, -34, -34, -12]).fill(0x3d78b8); g.poly([-44, 8, -62, 34, -34, 12]).fill(0x3d78b8);
  g.poly([-50, 0, -66, -6, -66, 6]).fill(0x3d78b8);
  g.roundRect(-52, -14, 92, 28, 14).fill(0xe8eef6);
  g.poly([36, -13, 66, 0, 36, 13]).fill(0xef6f5e);
  g.roundRect(-52, -14, 92, 10, 5).fill({ color: 0xffffff, alpha: 0.5 });
  g.roundRect(-52, 4, 92, 10, 5).fill({ color: 0x9aa8c8, alpha: 0.45 });
  g.rect(-20, -14, 10, 28).fill(0x5aa0e0); g.rect(-6, -14, 4, 28).fill(0x5aa0e0);
  for (let i = 0; i < 4; i++) g.circle(10 + i * 7, -2, 2.6).fill(0x2a3566).stroke({ width: 1, color: 0x5aa0e0 });
  g.roundRect(-52, -14, 92, 28, 14).stroke({ width: 1.2, color: 0x8aa0c8, alpha: 0.7 });
  g.circle(-56, 0, 5).fill(0x2a3566);
  root.addChild(g);
  const f = flame(30, 10, 0xaee4ff); f.position.set(-58, 0); root.addChildAt(f, 0);
  return { flames: [f], blink: [[light(22, 13, 0x7fd18b, 1.5), 1.2]], bounds: 130 };
}

function probe(root) {
  const g = new Graphics();
  g.roundRect(-40, -3, 22, 6, 1).fill(0x2a3566); g.roundRect(-40, -3, 22, 6, 1).stroke({ width: 1, color: P.teal, alpha: 0.7 });
  g.roundRect(18, -3, 22, 6, 1).fill(0x2a3566).stroke({ width: 1, color: P.teal, alpha: 0.7 });
  for (let i = 0; i < 4; i++) { g.moveTo(-36 + i * 5.5, -3).lineTo(-36 + i * 5.5, 3).stroke({ width: 0.7, color: P.teal, alpha: 0.7 }); g.moveTo(22 + i * 5.5, -3).lineTo(22 + i * 5.5, 3).stroke({ width: 0.7, color: P.teal, alpha: 0.7 }); }
  g.circle(0, 0, 15).fill(0xd9a441); g.circle(-3, -3, 11).fill({ color: 0xf2e3b8, alpha: 0.7 }); g.circle(0, 0, 15).stroke({ width: 1.3, color: 0xb98a30 });
  g.moveTo(8, -12).lineTo(18, -26).stroke({ width: 1.5, color: 0xb98a30 }); g.ellipse(20, -29, 8, 3).fill(0xf2e3b8).stroke({ width: 1, color: 0xb98a30 });
  g.circle(5, 3, 4).fill(0x2a3566); g.circle(5, 3, 2).fill(P.teal);
  root.addChild(g);
  const f = flame(14, 6, 0x8fe0ff); f.position.set(-15, 0); root.addChildAt(f, 0);
  return { flames: [f], blink: [[light(-4, -14, P.coral, 1.5), 1.4]], bounds: 80 };
}

function tender(root) {
  const g = new Graphics();
  g.roundRect(-40, -14, 64, 30, 10).fill(0x3fc1b0); g.roundRect(-40, -14, 64, 12, 8).fill({ color: 0xffffff, alpha: 0.22 });
  g.roundRect(-40, 4, 64, 5, 2).fill(0xf2e3b8);
  g.roundRect(16, -12, 28, 22, 11).fill(0xf2e3b8); g.roundRect(24, -8, 15, 12, 6).fill(0x2a3566); g.roundRect(26, -7, 11, 4, 2).fill({ color: 0xffffff, alpha: 0.3 });
  g.moveTo(-12, 16).lineTo(-12, 28).lineTo(8, 28).stroke({ width: 4, color: 0xd9a441, cap: 'round', join: 'round' }); g.circle(10, 28, 4).stroke({ width: 2, color: 0xd9a441 });
  g.roundRect(-52, -8, 14, 16, 3).fill(0x2a3566); g.roundRect(-40, -14, 64, 30, 10).stroke({ width: 1.2, color: 0x2a8a80 });
  g.rect(-30, -14, 4, 30).fill({ color: 0xef6f5e, alpha: 0.9 });
  root.addChild(g);
  const f = flame(24, 10, 0xaee4ff); f.position.set(-50, 0); root.addChildAt(f, 0);
  return { flames: [f], blink: [[light(0, -14, P.mustard, 1.8), 0.8]], bounds: 100 };
}

const BUILD = { halcyon, quillari, vesperine, archivist, drifter, concord, probe, tender };

export function createShip({ kind = 'halcyon', scale = 1, thrust = 0.6 } = {}) {
  const root = animated();
  const body = new Container(); root.addChild(body);
  const info = (BUILD[kind] || halcyon)(body);
  root.scale.set(scale);
  root.thrust = thrust;
  const R = rng(hashStr(kind));
  let t = R() * 10;
  root.update = (dt) => {
    t += dt;
    const th = root.thrust ?? 0.6;
    for (const f of info.flames) {
      const fl = 0.85 + 0.15 * Math.sin(t * 23 + f.x) * Math.sin(t * 11) + 0.1 * Math.sin(t * 37);
      const k = Math.max(0.0, th) * fl;
      f.visible = th > 0.01; f._s.width = f._len * (0.35 + k * 0.85); f._s.height = f._h * (0.7 + 0.35 * fl); f._g.alpha = 0.5 * k + 0.1;
    }
    for (const [l, sp] of info.blink) l.alpha = (Math.sin(t * sp * 3) > 0.6) ? 1 : 0.25;
    if (info.glow) info.glow.alpha = 0.75 + 0.15 * Math.sin(t * 2.3) * Math.sin(t * 0.9 + 1);
    if (info.halo) info.halo.alpha = 0.4 + 0.1 * Math.sin(t * 1.4);
    if (info.core) info.core.alpha = 0.8 + 0.2 * Math.sin(t * 2.4);
    if (info.eye) info.eye.alpha = 0.85 + 0.15 * Math.sin(t * 3);
    if (info.shards) for (const [s, i] of info.shards) { const a = t * 0.8 + i * 1.7; s.x = Math.cos(a) * 62 - 2; s.y = Math.sin(a) * 22; s.rotation = a * 1.3; s.alpha = 0.5 + 0.4 * Math.sin(a); }
    body.y = Math.sin(t * 0.8) * 1.2 * 1; // hover
  };
  root.update(0);
  return root;
}
void TAU;
