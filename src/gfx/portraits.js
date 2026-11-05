import { Container, Graphics, Sprite } from 'pixi.js';
import { rng, glowSprite, hashStr, clamp, animated, lerpCol } from './util.js';
import { gradRect } from './space.js';
import { palette } from './palette.js';

const P = palette;
const SKIN = [0xf3d2b3, 0xe3b48c, 0xc98f62, 0xa56a43, 0x7a4a2e, 0x57331f, 0xf6dcc4];
const HAIR = [0x2a1d17, 0x4a2f20, 0x8a5a2e, 0xc99a4a, 0xe6d4a0, 0x9aa3b0, 0xb5442e, 0x1c1c26, 0x6a3f6a];
const UNI = [[0x3fc1b0, 0x2a8a80], [0xe8b94a, 0xb98a30], [0xef6f5e, 0xb84a3e], [0x8fb996, 0x5f8a6a], [0x8c5a8a, 0x5f3a60], [0x5aa0e0, 0x3a6aa8]];
const shade = (c, k) => lerpCol(c, k > 0 ? 0xffffff : 0x000000, Math.abs(k));

const MOODS = {
  neutral: { mouth: 0.0, bi: 0, lift: 0, tint: 0, a: 0 },
  calm: { mouth: 0.35, bi: 0, lift: 0.3, tint: 0x3fc1b0, a: 0.05 },
  happy: { mouth: 1.3, bi: -0.3, lift: -1, tint: 0xe8b94a, a: 0.1 },
  excited: { mouth: 1.6, bi: -0.5, lift: -1.8, tint: 0xf0b64a, a: 0.14 },
  curious: { mouth: 0.15, bi: -0.6, lift: -1.4, tint: 0x8fb996, a: 0.07 },
  worried: { mouth: -0.7, bi: -1.8, lift: -0.6, tint: 0x8c5a8a, a: 0.14 },
  sad: { mouth: -1.3, bi: -2.3, lift: 0.2, tint: 0x5aa0e0, a: 0.16 },
  angry: { mouth: -1.0, bi: 2.4, lift: 0.8, tint: 0xef6f5e, a: 0.18 },
  tense: { mouth: -0.4, bi: 1.1, lift: 0.2, tint: 0xef6f5e, a: 0.1 },
  grateful: { mouth: 1.1, bi: -1.0, lift: -0.8, tint: 0xe8b94a, a: 0.12 },
};
const MOOD_ALIAS = { good: 'happy', bad: 'angry', warn: 'worried', friendly: 'happy', hostile: 'angry', afraid: 'worried', scared: 'worried', cheerful: 'happy', stern: 'tense', wary: 'tense', amused: 'happy', surprised: 'curious', thoughtful: 'curious', serene: 'calm', relaxed: 'calm' };

function eye(parent, x, y, iris, w = 3.6, h = 2.5, lidCol = 0xe3b48c, shape = 'ellipse') {
  const e = new Graphics();
  e.ellipse(0, 0, w, h).fill(0xfbf6ea);
  e.circle(0.3, 0.1, h * 0.88).fill(iris); e.circle(0.3, 0.1, h * 0.42).fill(0x14121a); e.circle(-0.7, -0.7, 0.55).fill(0xffffff);
  e.ellipse(0, 0, w, h).stroke({ width: 0.5, color: 0x2a1d17, alpha: 0.6 });
  e.position.set(x, y);
  const lid = new Graphics().ellipse(0, 0, w + 0.6, h + 0.4).fill(lidCol);
  lid.position.set(x, y); lid.scale.y = 0.001;
  parent.addChild(e, lid);
  void shape;
  return { e, lid };
}

function drawHuman(c, R, o) {
  const drifter = o.kind === 'drifter';
  const skin = R.pick(SKIN), hairC = R.pick(HAIR), uni = R.pick(UNI);
  const style = drifter ? R.pick(['short', 'bob', 'long', 'bun']) : R.pick(['short', 'bob', 'long', 'bun', 'crop', 'beehive', 'afro', 'bald', 'short']);
  const back = new Graphics(), g = new Graphics(), front = new Graphics();
  c.addChild(back, g, front);
  const sk2 = shade(skin, -0.18);
  // hair back
  if (style === 'long') { back.roundRect(30, 24, 40, 56, 14).fill(hairC); }
  if (style === 'bob') { back.roundRect(30, 26, 40, 34, 12).fill(hairC); }
  if (style === 'afro') { back.circle(50, 36, 25).fill(hairC); back.circle(50, 36, 25).stroke({ width: 1, color: shade(hairC, 0.2), alpha: 0.5 }); }
  if (style === 'beehive') { back.ellipse(50, 20, 17, 21).fill(hairC); back.ellipse(50, 17, 12, 8).fill({ color: shade(hairC, 0.2), alpha: 0.5 }); }
  if (style === 'bun') { back.circle(50, 15, 8).fill(hairC); }
  // clothes
  const base = drifter ? 0x6a5a52 : uni[0];
  g.poly([12, 100, 16, 80, 34, 70, 66, 70, 84, 80, 88, 100]).fill(base);
  g.poly([12, 100, 16, 80, 34, 70, 40, 74, 30, 100]).fill({ color: 0x000000, alpha: 0.12 });
  if (!drifter) {
    g.poly([36, 70, 50, 86, 64, 70, 60, 70, 50, 80, 40, 70]).fill(0x1a1a28);
    g.rect(14, 90, 72, 3.5).fill({ color: uni[1], alpha: 0.9 });
    g.circle(70, 84, 3.4).fill(P.brass); g.circle(70, 84, 3.4).stroke({ width: 0.6, color: 0xfff1c8 }); g.poly([70, 81.5, 71, 84, 70, 86.5, 69, 84]).fill(0xfff1c8);
  } else {
    // patchwork + scarf
    for (const [x, y, w, h, col] of [[20, 82, 14, 12, 0xef8f5e], [60, 86, 16, 11, 0x3fc1b0], [38, 92, 18, 8, 0xe8b94a]]) { g.roundRect(x, y, w, h, 1.5).fill(col); g.roundRect(x, y, w, h, 1.5).stroke({ width: 0.7, color: 0x2a1d17, alpha: 0.6, alignment: 0.5 }); }
    g.poly([34, 70, 66, 70, 62, 80, 50, 76, 38, 80]).fill(R.pick([0xef6f5e, 0xe8b94a, 0x8c5a8a]));
    g.rect(40, 74, 6, 18).fill(R.pick([0xef6f5e, 0xe8b94a, 0x8c5a8a]));
  }
  // neck + head
  g.roundRect(43, 58, 14, 18, 4).fill(sk2);
  g.ellipse(33.5, 44, 2.8, 4.5).fill(skin); g.ellipse(66.5, 44, 2.8, 4.5).fill(skin);
  g.ellipse(50, 43, 17, 21).fill(skin);
  g.ellipse(50, 43, 17, 21).stroke({ width: 0.8, color: sk2, alpha: 0.6 });
  g.ellipse(58, 46, 9, 17).fill({ color: sk2, alpha: 0.25 });
  g.ellipse(41, 51, 3.2, 2).fill({ color: 0xef8f7e, alpha: 0.22 }); g.ellipse(59, 51, 3.2, 2).fill({ color: 0xef8f7e, alpha: 0.22 });
  // nose
  const nl = R.range(-1, 1);
  g.moveTo(50 + nl * 0.4, 42).lineTo(48.4, 50.5).quadraticCurveTo(50, 52.4, 52.6, 50.6).stroke({ width: 0.9, color: sk2, alpha: 0.85, cap: 'round' });
  // eyes
  const irisC = R.pick([0x3a5a8a, 0x4a3320, 0x3f7a5a, 0x6a5a3a, 0x2a2a3a, 0x5a7a9a]);
  const eL = eye(c, 42.5, 41, irisC, 3.6, 2.5, skin), eR = eye(c, 57.5, 41, irisC, 3.6, 2.5, skin);
  const brows = new Graphics(); c.addChild(brows);
  const mouth = new Graphics(); c.addChild(mouth);
  // hair front
  const hc = hairC;
  if (style === 'short') { front.poly([32, 40, 31, 30, 38, 22, 50, 20, 62, 22, 69, 30, 68, 40, 64, 31, 54, 28, 42, 29]).fill(hc); }
  else if (style === 'crop') { front.poly([33, 36, 33, 28, 40, 23, 50, 22, 60, 23, 67, 28, 67, 36, 63, 29, 50, 26, 37, 29]).fill(hc); }
  else if (style === 'bob' || style === 'long') { front.poly([31, 46, 30, 30, 38, 21, 50, 19, 62, 21, 70, 30, 69, 46, 66, 33, 56, 28, 44, 31, 38, 34]).fill(hc); front.moveTo(50, 20).lineTo(42, 30).stroke({ width: 0.7, color: shade(hc, 0.3), alpha: 0.5 }); }
  else if (style === 'beehive') { front.poly([32, 36, 32, 28, 40, 24, 50, 24, 60, 24, 68, 28, 68, 36, 62, 29, 50, 27, 38, 29]).fill(hc); }
  else if (style === 'bun') { front.poly([32, 38, 32, 28, 40, 22, 50, 21, 60, 22, 68, 28, 68, 38, 62, 29, 50, 27, 38, 29]).fill(hc); }
  else if (style === 'afro') { front.poly([33, 34, 36, 26, 50, 22, 64, 26, 67, 34, 62, 28, 50, 26, 38, 28]).fill(hc); }
  else { front.ellipse(50, 24, 8, 1.4).fill({ color: 0xffffff, alpha: 0.18 }); }
  if (drifter) {
    // cap + goggles
    front.poly([30, 33, 32, 22, 42, 16, 58, 16, 68, 22, 70, 33, 50, 28]).fill(R.pick([0x5f8a6a, 0x8c5a8a, 0x3a6aa8, 0xb84a3e]));
    front.roundRect(28, 30, 44, 4, 2).fill(0x3a2a22);
    front.circle(41, 30, 5).stroke({ width: 1.6, color: P.brass }); front.circle(59, 30, 5).stroke({ width: 1.6, color: P.brass });
    front.circle(41, 30, 4).fill({ color: 0x8fe0e8, alpha: 0.45 }); front.circle(59, 30, 4).fill({ color: 0x8fe0e8, alpha: 0.45 });
    if (R.chance(0.5)) front.ellipse(50, 54, 10, 5).fill({ color: hc, alpha: 0.35 });
  }
  return { eyes: [eL, eR], brows, mouth, skin, brow: hairC, face: { mx: 50, my: 56, mw: 6.4, by: 36.2, bx: [42.5, 57.5] }, hair: hc };
}

function drawQuillari(c, R, o) {
  const pal = R.pick([[0xe8b94a, 0xef6f5e, 0x3fc1b0], [0x3fc1b0, 0x5aa0e0, 0xf2e3b8], [0xef6f5e, 0xe8b94a, 0x8c5a8a], [0x8c5a8a, 0xe8b94a, 0x3fc1b0]]);
  const skin = R.pick([0xf2e3b8, 0xe9cf98, 0xd9b484]);
  const back = new Container(), g = new Graphics(), front = new Graphics();
  c.addChild(back, g, front);
  // crest fan
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.27, col = pal[i % 3], len = 30 - Math.abs(i - 4) * 1.5 + R.range(-2, 3);
    const fx = 50 + Math.cos(a) * 12, fy = 36 + Math.sin(a) * 14;
    const f = new Graphics(); f.ellipse(len / 2, 0, len / 2, 4.2).fill(col); f.ellipse(len / 2 + 2, 0, len / 2 - 4, 0.9).fill({ color: 0xffffff, alpha: 0.3 }); f.ellipse(len / 2, 0, len / 2, 4.2).stroke({ width: 0.7, color: shade(col, -0.35), alpha: 0.8 });
    f.position.set(fx, fy); f.rotation = a; back.addChild(f);
  }
  // collar feathers + vest
  g.poly([10, 100, 14, 80, 32, 70, 68, 70, 86, 80, 90, 100]).fill(0x2a3566);
  g.poly([36, 70, 50, 92, 64, 70, 58, 70, 50, 84, 42, 70]).fill(pal[0]);
  for (let i = 0; i < 6; i++) { g.circle(26 + i * 9.6, 76 + Math.abs(i - 2.5) * 1.5, 2.2).fill({ color: P.brass, alpha: 0.9 }); }
  for (let i = 0; i < 9; i++) { const x = 28 + i * 5.5, y = 71 + Math.abs(i - 4) * 1.2; g.ellipse(x, y, 3.8, 6.5).fill(pal[i % 3]).stroke({ width: 0.5, color: 0x000000, alpha: 0.25 }); }
  g.roundRect(43, 58, 14, 16, 4).fill(shade(skin, -0.2));
  g.ellipse(50, 44, 16, 20).fill(skin); g.ellipse(50, 44, 16, 20).stroke({ width: 0.8, color: shade(skin, -0.3), alpha: 0.6 });
  // feather texture chevrons
  for (let i = 0; i < 14; i++) { const x = 38 + R() * 24, y = 30 + R() * 28; g.moveTo(x - 1.5, y).lineTo(x, y + 1.6).lineTo(x + 1.5, y).stroke({ width: 0.5, color: shade(skin, -0.25), alpha: 0.4 }); }
  g.ellipse(58, 47, 8, 15).fill({ color: shade(skin, -0.3), alpha: 0.2 });
  // cheek tufts
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) g.ellipse(50 + s * (15 + i * 0.5), 50 + i * 2.5, 4, 1.6).fill({ color: pal[(i + 1) % 3], alpha: 0.85 });
  // beak
  g.poly([46.5, 42, 53.5, 42, 50, 56]).fill(0xe8b94a); g.poly([46.5, 42, 50, 56, 50, 42]).fill({ color: 0xb98a30, alpha: 0.5 }); g.moveTo(50, 44).lineTo(50, 53).stroke({ width: 0.5, color: 0x7a5a20, alpha: 0.6 });
  const irisC = R.pick([0xf0c030, 0xef8f5e, 0x8fe0a0, 0xf0d870]);
  const eL = eye(c, 40.5, 38, irisC, 4.4, 3.5, skin), eR = eye(c, 59.5, 38, irisC, 4.4, 3.5, skin);
  const brows = new Graphics(); c.addChild(brows);
  const mouth = new Graphics(); c.addChild(mouth);
  return { eyes: [eL, eR], brows, mouth, face: { mx: 50, my: 60, mw: 5, by: 31.5, bx: [40.5, 59.5], hideBrow: false, brCol: pal[0] } };
}

function drawVesperine(c, R, o) {
  const hue = R.pick([[0xb9a0ff, 0x8f78d8, 0x5a4aa8], [0x9fe8f0, 0x5fc0d8, 0x3a7ab0], [0xffb0d8, 0xe07ab0, 0x9a4a8a], [0xb8f0c8, 0x6ad0a0, 0x3a8a70]]);
  const glowC = hue[0];
  const halo = glowSprite(glowC, 42, 0.55, 2); halo.position.set(50, 42); c.addChild(halo);
  const g = new Graphics(); c.addChild(g);
  g.poly([6, 100, 12, 82, 32, 72, 68, 72, 88, 82, 94, 100]).fill({ color: 0x2a2250, alpha: 1 });
  g.poly([32, 72, 38, 60, 44, 72]).fill({ color: hue[1], alpha: 0.85 }); g.poly([68, 72, 62, 60, 56, 72]).fill({ color: hue[1], alpha: 0.85 });
  g.poly([22, 80, 18, 66, 30, 74]).fill({ color: hue[0], alpha: 0.8 }); g.poly([78, 80, 82, 66, 70, 74]).fill({ color: hue[0], alpha: 0.8 });
  g.poly([36, 72, 50, 90, 64, 72]).fill({ color: hue[2], alpha: 0.7 });
  g.rect(12, 92, 76, 2.5).fill({ color: glowC, alpha: 0.45 });
  // head prism
  const head = [[50, 12], [66, 26], [66, 54], [50, 70], [34, 54], [34, 26]];
  g.poly(head.flat()).fill({ color: hue[1], alpha: 0.95 });
  g.poly([50, 12, 66, 26, 50, 40]).fill({ color: hue[0], alpha: 0.9 });
  g.poly([50, 12, 34, 26, 50, 40]).fill({ color: 0xffffff, alpha: 0.28 });
  g.poly([66, 26, 66, 54, 50, 40]).fill({ color: hue[2], alpha: 0.6 });
  g.poly([34, 26, 34, 54, 50, 40]).fill({ color: hue[0], alpha: 0.55 });
  g.poly([34, 54, 50, 70, 50, 40]).fill({ color: hue[2], alpha: 0.5 });
  g.poly([66, 54, 50, 70, 50, 40]).fill({ color: hue[1], alpha: 0.4 });
  const core = glowSprite(0xfff0ff, 9, 0.7, 1.6); core.position.set(50, 41); c.addChild(core);
  const g2 = new Graphics(); c.addChild(g2);
  for (const [a, b] of [[50, 12, 50, 40], [66, 26, 50, 40], [34, 26, 50, 40], [66, 54, 50, 40], [34, 54, 50, 40], [50, 70, 50, 40]].map((v) => [[v[0], v[1]], [v[2], v[3]]])) g2.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: 0.6, color: 0xffffff, alpha: 0.5 });
  g2.poly(head.flat()).stroke({ width: 1.2, color: 0xf0e8ff, alpha: 0.85 });
  // eyes are slits of light
  const eyes = [];
  for (const x of [43, 57]) { const e = glowSprite(0xffffff, 6, 1, 1.4); e.position.set(x, 41); const s = new Graphics().ellipse(0, 0, 3, 0.9).fill(0xffffff); s.position.set(x, 41); c.addChild(e, s); eyes.push({ e, s }); }
  // floating motes
  const motes = []; for (let i = 0; i < 6; i++) { const m = glowSprite(glowC, 3, 0.9); c.addChild(m); motes.push({ m, p: R(), x: R.range(20, 80) }); }
  return { glassy: true, halo, core, eyes: [], vesEyes: eyes, motes, brows: null, mouth: null };
}

function drawArchivist(c, R, o) {
  const g = new Graphics(), g2 = new Graphics(); c.addChild(g);
  const brass = P.brass, dk = 0x8a6a2a, lt = 0xf2e3b8;
  // shoulders: pauldron domes + chest plate
  g.roundRect(8, 78, 84, 40, 14).fill(dk); g.roundRect(10, 78, 80, 38, 13).fill(brass);
  g.ellipse(50, 80, 36, 9).fill({ color: lt, alpha: 0.3 });
  g.circle(20, 86, 11).fill(0xb98a30).stroke({ width: 1, color: lt, alpha: 0.5 }); g.circle(80, 86, 11).fill(0xb98a30).stroke({ width: 1, color: lt, alpha: 0.5 });
  g.roundRect(38, 82, 24, 18, 4).fill(0x2a2218); g.roundRect(40, 84, 20, 14, 3).fill(0x6a4a24);
  g.moveTo(50, 84).lineTo(50, 98).stroke({ width: 1, color: lt, alpha: 0.6 }); g.circle(50, 91, 2.6).fill(lt);
  // neck cylinder rings
  for (let i = 0; i < 3; i++) g.roundRect(41, 62 + i * 5, 18, 5, 2).fill(i % 2 ? dk : 0xb98a30);
  // antenna
  g.moveTo(50, 22).lineTo(50, 8).stroke({ width: 1.6, color: dk }); 
  // head
  g.circle(50, 42, 22).fill(dk); g.circle(50, 41, 21.2).fill(brass);
  g.ellipse(44, 32, 14, 9).fill({ color: lt, alpha: 0.35 });
  g.moveTo(30, 42).quadraticCurveTo(50, 52, 70, 42).stroke({ width: 0.8, color: dk, alpha: 0.7 });
  g.moveTo(50, 20).lineTo(50, 31).stroke({ width: 0.8, color: dk, alpha: 0.6 });
  for (const [x, y] of [[33, 28], [67, 28], [30, 50], [70, 50], [50, 22]]) g.circle(x, y, 1.1).fill(dk);
  g.circle(50, 42, 21.2).stroke({ width: 1, color: lt, alpha: 0.5 });
  // eye sockets + lamp eyes
  const lamps = [];
  for (const x of [41, 59]) {
    g.circle(x, 40, 8).fill(0x2a2218); g.circle(x, 40, 8).stroke({ width: 1.2, color: 0xb98a30 });
    const gl = glowSprite(0xffd870, 11, 0.9, 1.6); gl.position.set(x, 40);
    const d = new Graphics().circle(x, 40, 5.4).fill(0xffe9a0); d.circle(x, 40, 2.6).fill(0xfff8e0); d.circle(x, 40, 5.4).stroke({ width: 0.8, color: 0xd9a441 });
    lamps.push({ gl, d });
  }
  // grille mouth
  for (let i = 0; i < 5; i++) g.roundRect(41, 53 + i * 1.6, 18, 0.9, 0.4).fill({ color: 0x2a2218, alpha: 0.75 });
  c.addChild(g2);
  for (const l of lamps) c.addChild(l.gl, l.d);
  const bulb = glowSprite(0xffe08a, 9, 0.95, 1.6); bulb.position.set(50, 8); c.addChild(bulb); c.addChild(new Graphics().circle(50, 8, 2.2).fill(0xfff6d8));
  return { lamps, bulb, eyes: [], brows: null, mouth: null };
}

function drawRobot(c, R, o) {
  const g = new Graphics(); c.addChild(g);
  const body = 0xf2e3b8, trim = P.teal, dk = 0x2a3566;
  g.roundRect(10, 76, 80, 40, 10).fill(0xb8a888); g.roundRect(12, 76, 76, 38, 9).fill(body);
  g.roundRect(12, 76, 76, 10, 8).fill({ color: 0xffffff, alpha: 0.35 });
  g.roundRect(18, 86, 64, 14, 3).fill(dk);
  const lights = [];
  const cols = [P.coral, P.mustard, P.good, P.teal, P.coral, P.good];
  cols.forEach((col, i) => { const l = new Graphics().circle(24 + i * 10.4, 93, 2.2).fill(col); lights.push(l); });
  g.rect(12, 100, 76, 3, 0).fill(trim);
  g.roundRect(43, 62, 14, 16, 3).fill(0x8a8a90); for (let i = 0; i < 3; i++) g.rect(43, 65 + i * 4, 14, 1).fill({ color: 0x000000, alpha: 0.3 });
  // antenna
  g.moveTo(50, 20).lineTo(50, 8).stroke({ width: 1.6, color: 0x8a8a90 }); 
  // head
  g.roundRect(28, 22, 44, 42, 12).fill(0xb8a888); g.roundRect(29, 22, 42, 40, 11).fill(body); g.roundRect(30, 23, 40, 12, 9).fill({ color: 0xffffff, alpha: 0.4 });
  g.roundRect(22, 36, 7, 14, 3).fill(trim); g.roundRect(71, 36, 7, 14, 3).fill(trim);
  g.roundRect(32, 34, 36, 16, 8).fill(0x14182e); g.roundRect(32, 34, 36, 16, 8).stroke({ width: 1.2, color: trim });
  g.roundRect(36, 36, 28, 3, 1.5).fill({ color: 0xffffff, alpha: 0.12 });
  for (let i = 0; i < 4; i++) g.roundRect(40 + i * 5, 55, 3, 5, 1).fill(dk);
  c.addChild(...lights);
  const eyes = [];
  for (const x of [42, 58]) { const gl = glowSprite(0x7ff0e0, 10, 0.9, 1.5); gl.position.set(x, 42); const d = new Graphics().roundRect(-3.5, -2.5, 7, 5, 2.5).fill(0xcffff6); d.position.set(x, 42); c.addChild(gl, d); eyes.push({ gl, d }); }
  const bulb = glowSprite(P.coral, 8, 1, 1.5); bulb.position.set(50, 7); c.addChild(bulb, new Graphics().circle(50, 7, 2).fill(0xffd0c8));
  return { robotEyes: eyes, lights, bulb, eyes: [], brows: null, mouth: null };
}

function drawUnknown(c, R, o) {
  const g = new Graphics(), halo = glowSprite(0x8c5a8a, 52, 0.55, 2), halo2 = glowSprite(0x3fc1b0, 34, 0.3, 2);
  halo.position.set(50, 44); halo2.position.set(50, 44);
  c.addChild(halo, halo2, g);
  const col = 0x07081a;
  g.poly([8, 100, 12, 82, 32, 72, 68, 72, 88, 82, 92, 100]).fill(col);
  g.roundRect(43, 58, 14, 18, 4).fill(col);
  g.ellipse(50, 42, 16, 20).fill(col);
  g.ellipse(50, 42, 16, 20).stroke({ width: 1, color: 0xb9a0ff, alpha: 0.4 }); g.poly([8, 100, 12, 82, 32, 72, 68, 72, 88, 82, 92, 100]).stroke({ width: 1, color: 0xb9a0ff, alpha: 0.3 });
  // question mark
  const q = new Graphics();
  q.moveTo(44, 36).quadraticCurveTo(44, 28, 50, 28).quadraticCurveTo(57, 28, 57, 35).quadraticCurveTo(57, 40, 50, 44).lineTo(50, 48).stroke({ width: 3, color: P.cream, alpha: 0.9, cap: 'round', join: 'round' });
  q.circle(50, 54, 1.9).fill(P.cream); q.alpha = 0.8;
  c.addChild(q);
  const glints = [0, 1].map((i) => { const gl = glowSprite(0xe8d8ff, 4, 0, 1.5); gl.position.set(i ? 58 : 42, 40); c.addChild(gl); return gl; });
  void R; void o;
  return { unk: { halo, halo2, q, glints }, eyes: [], brows: null, mouth: null };
}

const KINDS = { human: drawHuman, drifter: drawHuman, quillari: drawQuillari, vesperine: drawVesperine, archivist: drawArchivist, robot: drawRobot, unknown: drawUnknown };
const BG = { human: [0x1f5f6a, 0x0d1a30], drifter: [0x6a3a2a, 0x1a1226], quillari: [0x7a5a22, 0x1a1428], vesperine: [0x3a2a78, 0x0c0b26], archivist: [0x6a4a1a, 0x140f1c], robot: [0x1f4a5a, 0x0a1426], unknown: [0x2a1a4a, 0x05060f] };

export function createPortrait({ species = 'human', seed = 1, size = 128, mood = 'neutral' } = {}) {
  const root = animated();
  const key = KINDS[species] ? species : 'unknown';
  const R = rng(hashStr(`${key}${seed}`));
  const k = size / 100;
  const frame = new Container();
  const bgc = BG[key];
  const hexs = (n) => '#' + n.toString(16).padStart(6, '0');
  const bg = gradRect(100, 100, [[0, hexs(bgc[0])], [1, hexs(bgc[1])]]); frame.addChild(bg);
  // sunburst rays (mid-century poster)
  const rays = new Graphics();
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; rays.poly([50, 48, 50 + Math.cos(a) * 90, 48 + Math.sin(a) * 90, 50 + Math.cos(a + 0.12) * 90, 48 + Math.sin(a + 0.12) * 90]).fill({ color: 0xffffff, alpha: 0.045 }); }
  frame.addChild(rays);
  const bust = new Container(); frame.addChild(bust);
  const info = KINDS[key](bust, R, { kind: key });
  if (key === 'human' || key === 'drifter') { bust.pivot.set(50, 100); bust.position.set(50, 100); bust.scale.set(1.13); }
  const tint = new Graphics().rect(0, 0, 100, 100).fill({ color: 0xffffff, alpha: 0 }); frame.addChild(tint);
  const vig = gradRect(100, 100, [[0, 'rgba(0,0,0,0.35)'], [0.3, 'rgba(0,0,0,0)'], [0.75, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.4)']]); frame.addChild(vig);
  const mask = new Graphics().roundRect(4, 4, 92, 92, 7).fill(0xffffff); frame.addChild(mask); frame.mask = mask;
  frame.scale.set(k);
  // brass frame
  const fr = new Graphics();
  fr.roundRect(2.4, 2.4, 95.2, 95.2, 8.5).stroke({ width: 4.8, color: 0x6a4a1a });
  fr.roundRect(2.4, 2.4, 95.2, 95.2, 8.5).stroke({ width: 3.6, color: P.brass });
  fr.roundRect(1.2, 1.2, 97.6, 97.6, 9.6).stroke({ width: 0.7, color: 0xfff1c8, alpha: 0.6 });
  fr.roundRect(4.4, 4.4, 91.2, 91.2, 6.8).stroke({ width: 0.9, color: 0x3a2a10, alpha: 0.85 });
  fr.roundRect(3.4, 3.4, 93.2, 93.2, 7.5).stroke({ width: 0.5, color: 0xfff1c8, alpha: 0.35 });
  for (const [x, y] of [[6, 6], [94, 6], [6, 94], [94, 94]]) { fr.circle(x, y, 1.5).fill(0xf2d98a); fr.circle(x, y, 1.5).stroke({ width: 0.4, color: 0x3a2a10 }); }
  fr.scale.set(k);
  root.addChild(frame, fr);
  root.size = size;

  // --- mood
  let curMood = 'neutral';
  const drawFace = () => {
    const m = MOODS[MOOD_ALIAS[curMood] || curMood] || MOODS.neutral;
    tint.clear().rect(0, 0, 100, 100).fill({ color: m.tint || 0xffffff, alpha: m.a });
    const f = info.face; if (!f) return;
    if (info.brows) {
      info.brows.clear();
      const bc = f.brCol || info.brow || 0x2a1d17;
      for (let i = 0; i < 2; i++) {
        const x = f.bx[i], inner = i ? -1 : 1;
        const yIn = f.by + m.lift + m.bi, yOut = f.by + m.lift - m.bi * 0.35;
        info.brows.moveTo(x - inner * 4.6, yOut).lineTo(x + inner * 4.6, yIn);
      }
      info.brows.stroke({ width: key === 'quillari' ? 1.5 : 1.4, color: bc, alpha: 0.92, cap: 'round' });
    }
    if (info.mouth) {
      info.mouth.clear();
      const mw = f.mw, y = f.my, cv = m.mouth;
      info.mouth.moveTo(f.mx - mw, y - cv * 0.9).quadraticCurveTo(f.mx, y + cv * 3.6 + 0.4, f.mx + mw, y - cv * 0.9).stroke({ width: 1.1, color: key === 'quillari' ? 0x7a5a20 : 0x7a3a3a, alpha: 0.85, cap: 'round' });
    }
  };
  root.setMood = (m) => { curMood = m || 'neutral'; drawFace(); };
  drawFace(); root.setMood(mood);

  let t = R() * 10, blinkT = R.range(1.5, 4), blinkP = -1;
  root.update = (dt) => {
    t += dt; blinkT -= dt;
    if (blinkT <= 0 && blinkP < 0) { blinkP = 0; }
    let lidK = 0;
    if (blinkP >= 0) { blinkP += dt / 0.16; lidK = blinkP < 1 ? Math.sin(blinkP * Math.PI) : 0; if (blinkP >= 1) { blinkP = -1; blinkT = R.range(2, 5.5); } }
    for (const e of info.eyes) e.lid.scale.y = Math.max(0.001, lidK);
    bust.y = (bust.pivot.y ? 100 : 0) + Math.sin(t * 1.1) * 0.35;
    if (info.vesEyes) { for (const v of info.vesEyes) { v.s.scale.y = 1 - lidK * 0.9; v.e.alpha = 0.9 * (1 - lidK * 0.7); } info.halo.alpha = 0.5 + 0.12 * Math.sin(t * 1.6); info.core.alpha = 0.75 + 0.25 * Math.sin(t * 2.4);
      for (const m of info.motes) { m.p = (m.p + dt * 0.12) % 1; m.m.x = m.x + Math.sin(m.p * 12 + m.x) * 4; m.m.y = 90 - m.p * 80; m.m.alpha = Math.sin(m.p * Math.PI) * 0.9; } }
    if (info.lamps) { for (const l of info.lamps) { const a = (1 - lidK * 0.75) * (0.9 + 0.1 * Math.sin(t * 3)); l.gl.alpha = a * 0.9; l.d.alpha = 0.4 + 0.6 * a; } info.bulb.alpha = 0.6 + 0.4 * Math.sin(t * 2.4) ** 2; }
    if (info.robotEyes) { for (const e of info.robotEyes) { e.d.scale.y = 1 - lidK * 0.9; e.d.y = lidK * 42 * 0.9 * 0; e.gl.alpha = 0.9 * (1 - lidK * 0.6); } info.lights.forEach((l, i) => { l.alpha = Math.sin(t * 2 + i * 1.7) > 0.2 ? 1 : 0.3; }); info.bulb.alpha = 0.5 + 0.5 * (Math.sin(t * 3) > 0 ? 1 : 0.2); }
    if (info.unk) { info.unk.halo.alpha = 0.5 + 0.15 * Math.sin(t * 0.8); info.unk.halo2.alpha = 0.3 + 0.15 * Math.sin(t * 1.3 + 1); info.unk.q.alpha = 0.55 + 0.3 * Math.sin(t * 1.1); info.unk.glints.forEach((g, i) => { g.alpha = Math.max(0, Math.sin(t * 0.9 + i * 2) - 0.5) * 1.6; }); }
  };
  void clamp;
  return root;
}
