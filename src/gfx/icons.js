import { Container, Graphics } from 'pixi.js';
import { palette } from './palette.js';
import { hashStr, rng, TAU, lerpCol } from './util.js';

const P = palette;
const gear = (g, cx, cy, r1, r2, n) => {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU; const w = TAU / n * 0.26; for (const [da, r] of [[-w * 1.5, r1], [-w, r2], [w, r2], [w * 1.5, r1]]) pts.push(cx + Math.cos(a + da) * r, cy + Math.sin(a + da) * r); }
  g.poly(pts);
};
const S = (g, col, w = 2) => g.stroke({ width: w, color: col, cap: 'round', join: 'round' });

// every icon draws in a 24x24 box
const DRAW = {
  fuel(g, c) { g.moveTo(12, 3).bezierCurveTo(12, 3, 5, 10.5, 5, 15).bezierCurveTo(5, 19, 8, 21.5, 12, 21.5).bezierCurveTo(16, 21.5, 19, 19, 19, 15).bezierCurveTo(19, 10.5, 12, 3, 12, 3).closePath(); S(g, c); g.moveTo(9, 15).bezierCurveTo(9, 17, 10, 18, 12, 18.4); S(g, c, 1.6); },
  supplies(g, c) { g.roundRect(3.5, 7, 17, 13, 2).stroke({ width: 2, color: c, join: 'round' }); g.moveTo(3.5, 11).lineTo(20.5, 11); S(g, c, 1.6); g.moveTo(9, 7).lineTo(9, 3.5).lineTo(15, 3.5).lineTo(15, 7); S(g, c, 1.8); g.moveTo(12, 11).lineTo(12, 15); S(g, c, 1.8); },
  hull(g, c) { g.moveTo(12, 3).lineTo(20, 6).lineTo(20, 12).bezierCurveTo(20, 17, 16, 20, 12, 21.5).bezierCurveTo(8, 20, 4, 17, 4, 12).lineTo(4, 6).closePath(); S(g, c); g.moveTo(12, 8).lineTo(12, 16); S(g, c, 1.8); g.moveTo(8.5, 12).lineTo(15.5, 12); S(g, c, 1.8); },
  morale(g, c) { g.circle(12, 12, 9).stroke({ width: 2, color: c }); g.circle(8.8, 9.6, 1.1).fill(c); g.circle(15.2, 9.6, 1.1).fill(c); g.moveTo(7.5, 14).quadraticCurveTo(12, 19.5, 16.5, 14); S(g, c, 2); },
  credits(g, c) { g.circle(12, 12, 9).stroke({ width: 2, color: c }); g.circle(12, 12, 5.6).stroke({ width: 1.2, color: c, alpha: 0.7 }); g.moveTo(12, 7.5).lineTo(12, 16.5); S(g, c, 1.8); g.moveTo(9.5, 10).lineTo(14.5, 10); S(g, c, 1.6); g.moveTo(9.5, 14).lineTo(14.5, 14); S(g, c, 1.6); },
  cargo(g, c) { g.poly([12, 3, 21, 7.5, 21, 16.5, 12, 21, 3, 16.5, 3, 7.5]).stroke({ width: 2, color: c, join: 'round' }); g.moveTo(3, 7.5).lineTo(12, 12).lineTo(21, 7.5); S(g, c, 1.8); g.moveTo(12, 12).lineTo(12, 21); S(g, c, 1.8); },
  science(g, c, root) { for (let i = 0; i < 3; i++) { const e = new Graphics().ellipse(0, 0, 9.5, 3.8).stroke({ width: 1.7, color: c }); e.position.set(12, 12); e.rotation = i * Math.PI / 3; root.addChild(e); } g.circle(12, 12, 2).fill(c); },
  engineering(g, c) { gear(g, 12, 12, 8.4, 10.2, 8); S(g, c, 1.8); g.circle(12, 12, 3.2).stroke({ width: 1.8, color: c }); },
  medicine(g, c) { g.roundRect(9, 3.5, 6, 17, 1.5).stroke({ width: 2, color: c, join: 'round' }); g.roundRect(3.5, 9, 17, 6, 1.5).stroke({ width: 2, color: c, join: 'round' }); },
  diplomacy(g, c) { g.roundRect(2.5, 4, 12.5, 9, 3).stroke({ width: 1.8, color: c, join: 'round' }); g.moveTo(6, 13).lineTo(5, 16.5).lineTo(9, 13); S(g, c, 1.8); g.roundRect(9, 10, 12.5, 9, 3).stroke({ width: 1.8, color: c, join: 'round' }); g.moveTo(18, 19).lineTo(19, 21.5).lineTo(15, 19); S(g, c, 1.8); },
  piloting(g, c) { g.circle(12, 12, 8.5).stroke({ width: 2, color: c }); g.circle(12, 12, 2.4).stroke({ width: 1.8, color: c }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2; g.moveTo(12 + Math.cos(a) * 2.4, 12 + Math.sin(a) * 2.4).lineTo(12 + Math.cos(a) * 8.5, 12 + Math.sin(a) * 8.5); } S(g, c, 1.8); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2; g.circle(12 + Math.cos(a) * 10.4, 12 + Math.sin(a) * 10.4, 1.1).fill(c); } },
  star(g, c) { g.poly([12, 2.5, 14.3, 9.7, 21.5, 12, 14.3, 14.3, 12, 21.5, 9.7, 14.3, 2.5, 12, 9.7, 9.7]).fill(c); },
  planet(g, c, root) { g.circle(12, 12, 6.2).stroke({ width: 2, color: c }); const r = new Graphics().ellipse(0, 0, 11, 3.4).stroke({ width: 1.8, color: c }); r.position.set(12, 12); r.rotation = -0.4; root.addChild(r); },
  station(g, c) { g.circle(12, 12, 8.5).stroke({ width: 2, color: c }); g.circle(12, 12, 2.6).fill(c); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; g.moveTo(12 + Math.cos(a) * 2.6, 12 + Math.sin(a) * 2.6).lineTo(12 + Math.cos(a) * 8.5, 12 + Math.sin(a) * 8.5); } S(g, c, 1.6); },
  mission(g, c) { g.moveTo(6, 21.5).lineTo(6, 3); S(g, c, 2); g.poly([6, 4.5, 19.5, 4.5, 16, 9, 19.5, 13.5, 6, 13.5]).stroke({ width: 1.8, color: c, join: 'round' }); },
  log(g, c) { g.roundRect(4.5, 3, 15, 18, 2).stroke({ width: 2, color: c, join: 'round' }); for (let i = 0; i < 3; i++) { g.moveTo(8, 8 + i * 4).lineTo(16, 8 + i * 4); } S(g, c, 1.6); g.moveTo(4.5, 7).lineTo(2.5, 7); g.moveTo(4.5, 12).lineTo(2.5, 12); g.moveTo(4.5, 17).lineTo(2.5, 17); S(g, c, 1.6); },
  codex(g, c) { g.moveTo(12, 6).quadraticCurveTo(7.5, 3.5, 2.5, 5).lineTo(2.5, 19).quadraticCurveTo(7.5, 17.5, 12, 20).quadraticCurveTo(16.5, 17.5, 21.5, 19).lineTo(21.5, 5).quadraticCurveTo(16.5, 3.5, 12, 6).lineTo(12, 20); S(g, c, 1.8); },
  crew(g, c) { g.circle(9, 8, 3.3).stroke({ width: 1.9, color: c }); g.moveTo(2.8, 19.5).quadraticCurveTo(2.8, 12.5, 9, 12.5).quadraticCurveTo(15.2, 12.5, 15.2, 19.5); S(g, c, 1.9); g.circle(16.5, 7.2, 2.7).stroke({ width: 1.7, color: c }); g.moveTo(17.5, 12).quadraticCurveTo(21.5, 12.5, 21.5, 18); S(g, c, 1.7); },
  ship(g, c) { g.ellipse(12, 12.5, 9.5, 3.6).stroke({ width: 1.9, color: c }); g.ellipse(12, 10.5, 4.6, 2.5).stroke({ width: 1.7, color: c }); g.moveTo(5.5, 15).lineTo(3.5, 19.5).lineTo(8.5, 16); S(g, c, 1.7); g.moveTo(18.5, 15).lineTo(20.5, 19.5).lineTo(15.5, 16); S(g, c, 1.7); },
  jump(g, c) { g.moveTo(4, 5).lineTo(11, 12).lineTo(4, 19); S(g, c, 2.2); g.moveTo(12, 5).lineTo(19, 12).lineTo(12, 19); S(g, c, 2.2); g.moveTo(20.5, 6).lineTo(20.5, 18); S(g, c, 1.6); },
  scan(g, c) { g.circle(12, 12, 9).stroke({ width: 1.8, color: c }); g.circle(12, 12, 4.8).stroke({ width: 1.4, color: c, alpha: 0.8 }); g.moveTo(12, 12).lineTo(19, 6); S(g, c, 2); g.circle(12, 12, 1.4).fill(c); g.circle(16.5, 15.8, 1.1).fill(c); },
  hail(g, c) { g.circle(7, 17, 2.2).fill(c); g.moveTo(5.5, 11).quadraticCurveTo(13, 11, 13, 18.5); S(g, c, 1.9); g.moveTo(5.5, 6).quadraticCurveTo(18.5, 6, 18.5, 18.5); S(g, c, 1.9); g.moveTo(5.5, 1.8).quadraticCurveTo(23, 1.8, 23, 18.5); S(g, c, 1.6); },
  land(g, c) { g.moveTo(12, 3).lineTo(12, 14); S(g, c, 2.2); g.moveTo(7.5, 10).lineTo(12, 14.5).lineTo(16.5, 10); S(g, c, 2.2); g.moveTo(3, 21).lineTo(21, 21); S(g, c, 2.2); g.moveTo(6, 21).lineTo(8, 18); g.moveTo(18, 21).lineTo(16, 18); S(g, c, 1.8); },
  dock(g, c) { g.moveTo(3, 7).lineTo(10, 7).lineTo(10, 17).lineTo(3, 17); S(g, c, 2); g.moveTo(21, 7).lineTo(14, 7).lineTo(14, 17).lineTo(21, 17); S(g, c, 2); g.moveTo(12, 9).lineTo(12, 15); S(g, c, 1.8); },
  warning(g, c) { g.poly([12, 3, 22, 20.5, 2, 20.5]).stroke({ width: 2, color: c, join: 'round' }); g.moveTo(12, 9.5).lineTo(12, 14.5); S(g, c, 2.2); g.circle(12, 17.4, 1.2).fill(c); },
  check(g, c) { g.moveTo(4, 12.5).lineTo(9.5, 18).lineTo(20, 6); S(g, c, 2.8); },
  lock(g, c) { g.roundRect(5, 10.5, 14, 10.5, 2.4).stroke({ width: 2, color: c }); g.moveTo(8, 10.5).lineTo(8, 7.5).bezierCurveTo(8, 2.5, 16, 2.5, 16, 7.5).lineTo(16, 10.5); S(g, c, 2); g.circle(12, 15.2, 1.6).fill(c); },
  arrow(g, c) { g.moveTo(4, 12).lineTo(20, 12); S(g, c, 2.4); g.moveTo(13.5, 5.5).lineTo(20, 12).lineTo(13.5, 18.5); S(g, c, 2.4); },
  close(g, c) { g.moveTo(5.5, 5.5).lineTo(18.5, 18.5); g.moveTo(18.5, 5.5).lineTo(5.5, 18.5); S(g, c, 2.6); },
  settings(g, c) { for (const [y, x] of [[6, 8], [12, 16], [18, 10]]) { g.moveTo(3.5, y).lineTo(20.5, y); S(g, c, 1.8); g.circle(x, y, 2.7).fill(P.panel).stroke({ width: 1.9, color: c }); } },
  sound(g, c) { g.poly([3.5, 9.5, 8, 9.5, 13, 5, 13, 19, 8, 14.5, 3.5, 14.5]).stroke({ width: 1.9, color: c, join: 'round' }); g.moveTo(16, 9).quadraticCurveTo(18.5, 12, 16, 15); S(g, c, 1.8); g.moveTo(18.5, 6).quadraticCurveTo(23, 12, 18.5, 18); S(g, c, 1.8); },
  undock(g, c) { g.moveTo(10, 7).lineTo(3, 7).lineTo(3, 17).lineTo(10, 17); S(g, c, 2); g.moveTo(14, 7).lineTo(21, 7).lineTo(21, 17).lineTo(14, 17); S(g, c, 2); g.moveTo(9, 12).lineTo(15, 12); S(g, c, 1.8); g.moveTo(12.5, 9.5).lineTo(15.5, 12).lineTo(12.5, 14.5); S(g, c, 1.8); },
  orbit(g, c) { g.circle(12, 12, 3.4).fill(c); g.ellipse(12, 12, 10, 5).stroke({ width: 1.7, color: c }); g.circle(21.5, 11, 1.6).fill(c); },
  market(g, c) { g.moveTo(3, 9).lineTo(5, 4).lineTo(19, 4).lineTo(21, 9).closePath(); S(g, c, 1.8); g.moveTo(5, 9).lineTo(5, 20).lineTo(19, 20).lineTo(19, 9); S(g, c, 1.8); g.moveTo(10, 20).lineTo(10, 14).lineTo(14, 14).lineTo(14, 20); S(g, c, 1.6); },
  repair(g, c) { g.moveTo(5, 19).lineTo(14, 10); S(g, c, 2.6); g.moveTo(14, 10).bezierCurveTo(12, 6, 16, 2.5, 20, 4.5).lineTo(17, 7.5).lineTo(17.5, 9).lineTo(19.5, 9.5).lineTo(21.5, 7); S(g, c, 1.8); },
  info(g, c) { g.circle(12, 12, 9).stroke({ width: 2, color: c }); g.moveTo(12, 11).lineTo(12, 17); S(g, c, 2.2); g.circle(12, 7.6, 1.2).fill(c); },
  help(g, c) { g.circle(12, 12, 9).stroke({ width: 2, color: c }); g.moveTo(9.5, 9.5).quadraticCurveTo(12, 6, 14.5, 9.5).quadraticCurveTo(14.5, 12, 12, 13).lineTo(12, 14.5); S(g, c, 1.8); g.circle(12, 17.6, 1).fill(c); },
  plus(g, c) { g.moveTo(12, 5).lineTo(12, 19); g.moveTo(5, 12).lineTo(19, 12); S(g, c, 2.4); },
  minus(g, c) { g.moveTo(5, 12).lineTo(19, 12); S(g, c, 2.4); },
  save(g, c) { g.roundRect(4, 4, 16, 16, 2).stroke({ width: 2, color: c, join: 'round' }); g.rect(8, 4, 8, 5).stroke({ width: 1.6, color: c }); g.rect(8, 13, 8, 7).stroke({ width: 1.6, color: c }); },
  heart(g, c) { g.moveTo(12, 20).bezierCurveTo(2, 13, 4, 4, 12, 9).bezierCurveTo(20, 4, 22, 13, 12, 20).closePath(); S(g, c, 2); },
  mute(g, c) { g.poly([3.5, 9.5, 8, 9.5, 13, 5, 13, 19, 8, 14.5, 3.5, 14.5]).stroke({ width: 1.9, color: c, join: 'round' }); g.moveTo(16.5, 9).lineTo(22, 15); g.moveTo(22, 9).lineTo(16.5, 15); S(g, c, 2); },
};

export function createIcon(name, { size = 24, color = P.cream } = {}) {
  const root = new Container();
  const g = new Graphics();
  const inner = new Container(); inner.addChild(g);
  const fn = DRAW[name];
  if (fn) fn(g, color, inner);
  else { g.circle(12, 12, 8).stroke({ width: 2, color }); g.moveTo(9.5, 9.5).quadraticCurveTo(12, 6, 14.5, 9.5).quadraticCurveTo(14.5, 12, 12, 13).lineTo(12, 14.5); S(g, color, 1.8); g.circle(12, 17.6, 1).fill(color); }
  inner.scale.set(size / 24);
  root.addChild(inner);
  root.iconName = name;
  root.setColor = (c) => { root.removeChildren(); const n = createIcon(name, { size, color: c }); root.addChild(...n.children); };
  return root;
}
export const ICON_NAMES = Object.keys(DRAW);

// ------------------------------------------------------------------ goods + faction emblems
const CAT = {
  food: { col: 0x8fb996, ring: 0x5f8a6a },
  tech: { col: 0x5aa0e0, ring: 0x3a6aa8 },
  luxury: { col: 0xb28be0, ring: 0x7a58a8 },
  medical: { col: 0xef6f5e, ring: 0xb84a3e },
  material: { col: 0xc98f62, ring: 0x8a5a3a },
  curio: { col: 0xe8b94a, ring: 0xb98a30 },
  fuel: { col: 0x3fc1b0, ring: 0x2a8a80 },
};
export function createGoodIcon(goodId, category = 'material', size = 32) {
  const root = new Container();
  const cat = CAT[category] || CAT.material;
  const R = rng(hashStr(goodId || category));
  const v = R.int(0, 2), k = size / 32;
  const g = new Graphics();
  g.circle(16, 16, 15).fill(lerpCol(cat.ring, 0x0b0d1e, 0.55)); g.circle(16, 16, 15).stroke({ width: 1.4, color: cat.ring });
  g.circle(16, 16, 12.6).stroke({ width: 0.7, color: cat.col, alpha: 0.35 });
  const c = cat.col, hi = 0xfff1c8;
  switch (category) {
    case 'food':
      if (v === 0) { g.circle(16, 18, 7.5).fill(c); g.circle(13.5, 15.5, 2.2).fill({ color: 0xffffff, alpha: 0.35 }); g.moveTo(16, 11).quadraticCurveTo(16, 8, 18.5, 7).stroke({ width: 1.6, color: hi, cap: 'round' }); g.ellipse(20, 8.5, 3.4, 1.7).fill(0x7fd18b); }
      else if (v === 1) { for (let i = -1; i <= 1; i++) { g.moveTo(16 + i * 4.2, 24).quadraticCurveTo(16 + i * 5, 16, 16 + i * 4.2, 8).stroke({ width: 1.4, color: hi }); for (let j = 0; j < 3; j++) g.ellipse(16 + i * 4.6 + (j % 2 ? 1.6 : -1.6), 11 + j * 3.4, 1.4, 2.4).fill(c); } }
      else { g.roundRect(8, 12, 16, 11, 3).fill(c); g.roundRect(8, 12, 16, 4, 2).fill({ color: 0xffffff, alpha: 0.3 }); g.moveTo(16, 12).lineTo(16, 8).stroke({ width: 1.6, color: hi, cap: 'round' }); g.circle(16, 7.5, 1.6).fill(hi); }
      break;
    case 'tech':
      g.roundRect(9.5, 9.5, 13, 13, 2.5).fill(c); g.roundRect(12.5, 12.5, 7, 7, 1.5).fill(0x14182e);
      for (let i = 0; i < 3; i++) { g.moveTo(11.5 + i * 4.5, 9.5).lineTo(11.5 + i * 4.5, 6.5); g.moveTo(11.5 + i * 4.5, 22.5).lineTo(11.5 + i * 4.5, 25.5); g.moveTo(9.5, 11.5 + i * 4.5).lineTo(6.5, 11.5 + i * 4.5); g.moveTo(22.5, 11.5 + i * 4.5).lineTo(25.5, 11.5 + i * 4.5); }
      g.stroke({ width: 1.4, color: hi, cap: 'round' }); g.circle(16, 16, 1.4).fill(c);
      break;
    case 'luxury':
      g.poly([16, 24, 7.5, 13, 11, 8, 21, 8, 24.5, 13]).fill(c); g.poly([7.5, 13, 24.5, 13, 16, 24]).fill({ color: 0x000000, alpha: 0.18 }); g.poly([11, 8, 14, 13, 18, 13, 21, 8]).fill({ color: 0xffffff, alpha: 0.35 });
      g.poly([16, 24, 7.5, 13, 11, 8, 21, 8, 24.5, 13]).stroke({ width: 1.2, color: hi, join: 'round' });
      break;
    case 'medical':
      g.roundRect(11, 7, 10, 18, 4).fill({ color: 0xffffff, alpha: 0.12 }).stroke({ width: 1.6, color: hi }); g.roundRect(12.2, 14, 7.6, 9.8, 3).fill(c); g.roundRect(13.5, 5.5, 5, 3, 1).fill(hi);
      g.rect(15.4, 15, 1.2, 6).fill(hi); g.rect(13, 17.4, 6, 1.2).fill(hi);
      break;
    case 'fuel':
      g.roundRect(10, 9, 12, 15, 3).fill(c); g.roundRect(10, 9, 12, 5, 3).fill({ color: 0xffffff, alpha: 0.3 }); g.roundRect(13, 6, 6, 4, 1.5).fill(hi);
      g.moveTo(16, 14).bezierCurveTo(13, 17.5, 13.5, 21, 16, 21).bezierCurveTo(18.5, 21, 19, 17.5, 16, 14).fill(hi);
      break;
    case 'curio':
      g.circle(16, 16, 7).fill(c); g.circle(16, 16, 7).stroke({ width: 1.3, color: hi }); g.poly([16, 7.5, 17.2, 14.8, 24.5, 16, 17.2, 17.2, 16, 24.5, 14.8, 17.2, 7.5, 16, 14.8, 14.8]).fill(hi);
      break;
    default:
      if (v === 0) { g.poly([8, 22, 12, 14, 24, 14, 26, 22]).fill(c); g.poly([12, 14, 15, 9, 22, 9, 24, 14]).fill({ color: 0xffffff, alpha: 0.35 }); g.poly([8, 22, 12, 14, 24, 14, 26, 22]).stroke({ width: 1.2, color: hi, join: 'round' }); }
      else { g.roundRect(8, 15, 10, 9, 1.5).fill(c); g.roundRect(15, 9, 10, 9, 1.5).fill(lerpCol(c, 0xffffff, 0.25)); g.roundRect(8, 15, 10, 9, 1.5).stroke({ width: 1.2, color: hi }); g.roundRect(15, 9, 10, 9, 1.5).stroke({ width: 1.2, color: hi }); }
  }
  g.scale.set(k);
  root.addChild(g);
  return root;
}

const FACTION = {
  concord: { col: 0x5aa0e0, dk: 0x1f3a66 }, quillari: { col: 0xe8b94a, dk: 0x6a4a14 }, vesperine: { col: 0xb28be0, dk: 0x35246a }, archivists: { col: 0xd9a441, dk: 0x4a3410 }, drifters: { col: 0xef8f5e, dk: 0x5a2a1a }, none: { col: 0x9aa3c7, dk: 0x1b2140 },
};
export function createFactionEmblem(factionId = 'none', size = 40) {
  const root = new Container();
  const f = FACTION[factionId] || FACTION.none, k = size / 40, g = new Graphics();
  g.circle(20, 20, 19).fill(f.dk); g.circle(20, 20, 19).stroke({ width: 1.8, color: f.col }); g.circle(20, 20, 16.2).stroke({ width: 0.7, color: f.col, alpha: 0.5 });
  const c = f.col, hi = 0xfff1c8;
  switch (factionId) {
    case 'concord': // laurel + star
      g.poly([20, 9, 22.6, 17, 31, 17, 24.2, 22, 26.8, 30, 20, 25, 13.2, 30, 15.8, 22, 9, 17, 17.4, 17]).fill(c);
      for (const s of [-1, 1]) { g.moveTo(20 + s * 12, 30).quadraticCurveTo(20 + s * 15.5, 20, 20 + s * 10, 11).stroke({ width: 1.3, color: hi, alpha: 0.9 }); for (let i = 0; i < 3; i++) g.ellipse(20 + s * (13.5 - i * 1.0), 25 - i * 5, 1.2, 2.2).fill({ color: hi, alpha: 0.85 }); }
      break;
    case 'quillari':
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.42; const f2 = new Graphics().ellipse(8, 0, 9, 3).fill(i % 2 ? hi : c); f2.position.set(20, 27); f2.rotation = a; root.addChild(f2); f2.scale.set(k); f2.x *= k; f2.y *= k; }
      g.circle(20, 27, 3.2).fill(hi);
      break;
    case 'vesperine':
      g.poly([20, 7, 28, 17, 20, 33, 12, 17]).fill({ color: c, alpha: 0.9 }); g.poly([20, 7, 28, 17, 20, 17]).fill({ color: 0xffffff, alpha: 0.35 }); g.poly([12, 17, 20, 33, 20, 17]).fill({ color: 0x000000, alpha: 0.2 });
      g.poly([20, 7, 28, 17, 20, 33, 12, 17]).stroke({ width: 1.2, color: hi, join: 'round' }); g.moveTo(12, 17).lineTo(28, 17).stroke({ width: 0.8, color: hi, alpha: 0.7 });
      g.moveTo(5, 20).quadraticCurveTo(8, 14, 5, 8).stroke({ width: 1, color: c, alpha: 0.6 }); g.moveTo(35, 20).quadraticCurveTo(32, 14, 35, 8).stroke({ width: 1, color: c, alpha: 0.6 });
      break;
    case 'archivists':
      g.circle(20, 20, 8.5).stroke({ width: 2, color: c }); g.circle(20, 20, 4).fill(hi); g.circle(20, 20, 2).fill(f.dk);
      g.moveTo(8, 29).lineTo(32, 29).stroke({ width: 1.6, color: c, cap: 'round' }); g.moveTo(11, 33).lineTo(29, 33).stroke({ width: 1.2, color: c, cap: 'round', alpha: 0.7 });
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.moveTo(20 + Math.cos(a) * 11, 20 + Math.sin(a) * 11).lineTo(20 + Math.cos(a) * 13.5, 20 + Math.sin(a) * 13.5); } g.stroke({ width: 1.2, color: c });
      break;
    case 'drifters':
      g.circle(20, 20, 4).stroke({ width: 1.8, color: hi }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.moveTo(20 + Math.cos(a) * 4, 20 + Math.sin(a) * 4).lineTo(20 + Math.cos(a) * 12, 20 + Math.sin(a) * 12); g.circle(20 + Math.cos(a) * 13, 20 + Math.sin(a) * 13, 1.7).fill(c); } g.stroke({ width: 1.8, color: c, cap: 'round' }); g.circle(20, 20, 11).stroke({ width: 1.4, color: c });
      break;
    default: g.circle(20, 20, 6).stroke({ width: 1.8, color: c }); g.circle(20, 20, 1.8).fill(c);
  }
  g.scale.set(k); root.addChildAt(g, 0);
  return root;
}
