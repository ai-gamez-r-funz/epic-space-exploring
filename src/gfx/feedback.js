import { Container, Graphics, Sprite } from 'pixi.js';
import { palette } from './palette.js';
import { createIcon } from './icons.js';
import { glowSprite, animated, rng, TAU } from './util.js';

const P = palette;
/** reward kinds -> icon + colour (use for result screen chips, toasts, bursts) */
export const REWARD_STYLE = {
  scrip: { icon: 'credits', color: P.mustard, label: 'Scrip' },
  credits: { icon: 'credits', color: P.mustard, label: 'Scrip' },
  hull: { icon: 'hull', color: P.good, label: 'Hull' },
  fuel: { icon: 'fuel', color: P.teal, label: 'Fuel' },
  supplies: { icon: 'supplies', color: P.sage, label: 'Supplies' },
  morale: { icon: 'morale', color: P.coral, label: 'Morale' },
  rep: { icon: 'rep', color: P.brass, label: 'Standing' },
  item: { icon: 'item', color: P.cream, label: 'Item' },
  cargo: { icon: 'cargo', color: P.cream, label: 'Cargo' },
  xp: { icon: 'science', color: 0x9fd0ff, label: 'Experience' },
  days: { icon: 'log', color: P.textDim, label: 'Days' },
  codex: { icon: 'codex', color: 0xb28be0, label: 'Codex' },
  crew: { icon: 'crew', color: P.teal, label: 'Crew' },
};
export const rewardStyle = (kind, negative = false) => { const s = REWARD_STYLE[kind] || { icon: 'star', color: P.cream, label: kind }; return { ...s, color: negative ? P.bad : s.color, negative }; };

/** round badge: dark plate + coloured ring + icon (+ soft glow). update(dt) gives a gentle pulse. */
export function createRewardBadge(kind, { size = 32, negative = false } = {}) {
  const st = rewardStyle(kind, negative), c = animated(), k = size / 32;
  const glow = glowSprite(st.color, size * 0.95, 0.4, 2); c.addChild(glow);
  const g = new Graphics().circle(0, 0, 15 * k).fill(0x11152e).stroke({ width: 1.6 * k, color: st.color }).circle(0, 0, 12.6 * k).stroke({ width: 0.6 * k, color: st.color, alpha: 0.35 });
  c.addChild(g);
  const ic = createIcon(st.icon, { size: 18 * k, color: st.color }); ic.position.set(-9 * k, -9 * k); c.addChild(ic);
  let t = Math.random() * 6; c.update = (dt) => { t += dt; glow.alpha = 0.3 + 0.12 * Math.sin(t * 2.2); };
  c.style = st; return c;
}

/** coloured particle burst for a reward kind (self-destroys; add to stage). Uses provided burst fn. */
export function rewardBurst(burstFn, kind, x, y, negative = false) { const st = rewardStyle(kind, negative); return burstFn(x, y, st.color, negative ? 8 : 16); }

/** map lane highlight. danger 0..3, hot = trending/trade-hot lane. Returns container with update(dt). */
export function createLaneGlow(x1, y1, x2, y2, { danger = 0, hot = false, width = 3 } = {}) {
  const c = animated();
  const col = hot ? P.mustard : danger >= 3 ? P.coral : danger === 2 ? P.warn : danger === 1 ? 0xd9c27a : P.teal;
  const g = new Graphics(); const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: width * 3.2, color: col, alpha: 0.12, cap: 'round' });
  g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: width * 1.6, color: col, alpha: 0.22, cap: 'round' });
  g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: Math.max(1, width * 0.5), color: col, alpha: 0.85, cap: 'round' });
  c.addChild(g);
  const n = hot ? 3 : danger >= 2 ? 2 : 1, dots = [];
  for (let i = 0; i < n; i++) { const d = glowSprite(hot ? 0xfff0b0 : col, hot ? 9 : 6, 0.9, 1.8); dots.push([d, i / n]); c.addChild(d); }
  if (danger >= 2) { const w = new Graphics().poly([0, -4, 4, 3, -4, 3]).stroke({ width: 1.2, color: col, alpha: 0.9, join: 'round' }); w.position.set(x1 + dx / 2, y1 + dy / 2); c.addChild(w); c._warn = w; }
  let t = 0; c.update = (dt) => { t += dt; for (const [d, o] of dots) { const p = (t * (hot ? 0.35 : 0.18) + o) % 1; d.position.set(x1 + dx * p, y1 + dy * p); d.alpha = Math.sin(p * Math.PI); } g.alpha = hot ? 0.8 + 0.2 * Math.sin(t * 3) : danger >= 2 ? 0.75 + 0.25 * Math.sin(t * 4) : 1; if (c._warn) c._warn.alpha = 0.6 + 0.4 * Math.sin(t * 4); };
  return c;
}

const MARK = { rival: { icon: 'rival', col: P.coral }, lantern: { icon: 'lantern', col: 0xffd070 }, distress: { icon: 'distress', col: P.bad }, objective: { icon: 'objective', col: P.teal }, news: { icon: 'news', col: P.mustard }, hot: { icon: 'hot', col: P.mustard } };
/** pulsing map marker for g.mapMarkers() kinds: rival | lantern | distress | objective | news | hot */
export function createMapMarker(kind, { size = 22 } = {}) {
  const m = MARK[kind] || MARK.objective, c = animated(), k = size / 22;
  const halo = glowSprite(m.col, size * 1.5, 0.55, 2); c.addChild(halo);
  const ring = new Graphics().circle(0, 0, size * 0.55).stroke({ width: 1.2, color: m.col, alpha: 0.8 }); c.addChild(ring);
  const plate = new Graphics().circle(0, 0, 10 * k).fill(0x0d1030).stroke({ width: 1.4 * k, color: m.col }); c.addChild(plate);
  const ic = createIcon(m.icon, { size: 13 * k, color: m.col }); ic.position.set(-6.5 * k, -6.5 * k); c.addChild(ic);
  let t = Math.random() * 6;
  c.update = (dt) => { t += dt; const p = (t * 0.7) % 1; ring.scale.set(1 + p * 0.9); ring.alpha = (1 - p) * 0.7; halo.alpha = 0.4 + 0.2 * Math.sin(t * 2.4); if (kind === 'lantern') halo.alpha = 0.5 + 0.25 * Math.sin(t * 5) * Math.sin(t * 1.7); };
  return c;
}
void Sprite; void Container; void rng; void TAU;
