// Shared helpers for the 2A overlays (EventDialog, Trade, Shipyard, EndScreen).
import { Container, Graphics, Rectangle } from 'pixi.js';
import { C, lighten, darken, grad } from '../../kit/theme.js';
import { Label } from '../../kit/Label.js';
import { Anim } from '../../kit/anim.js';
import { Tooltip } from '../../kit/Tooltip.js';
import { S } from '../../services.js';

export const sgn = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(Math.round(n * 100) / 100);
export const num = (n) => Math.round(n).toLocaleString('en-US');
export const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
export const prettify = (id) => cap(String(id || '').replace(/_/g, ' '));

export const SKILL_COL = { science: 0x6fc7e8, engineering: C.mustard, medicine: 0xf08a9a, diplomacy: C.teal, piloting: 0xb58be0 };
export const SKILLS = ['science', 'engineering', 'medicine', 'diplomacy', 'piloting'];
export const RES_COL = { fuel: 0x3fc1b0, supplies: 0xe8b53a, hull: 0x8fb98b, morale: 0xe58fb0, credits: C.mustard }; // keep in sync with kit/theme.js RES_COL
export const RES_NAME = { fuel: 'Fuel', supplies: 'Supplies', hull: 'Hull', morale: 'Morale', credits: 'Scrip' };
export const SPECIES_FACTION = { human: 'concord', quillari: 'quillari', vesperine: 'vesperine', archivist: 'archivists', drifter: 'drifters' };

export const TAG_INFO = {
  diplomacy: { icon: 'diplomacy', col: C.teal, text: 'Diplomacy' },
  trade: { icon: 'credits', col: C.mustard, text: 'Trade' },
  flee: { icon: 'jump', col: C.coral, text: 'Flight' },
  persuade: { icon: 'hail', col: 0xb58be0, text: 'Persuasion' },
  science: { icon: 'science', col: 0x6fc7e8, text: 'Science' },
  mystery: { icon: 'scan', col: 0xa99bff, text: 'Mystery' },
  wonder: { icon: 'star', col: 0xffe08a, text: 'Wonder' },
  hazard: { icon: 'warning', col: 0xf08a4a, text: 'Hazard' },
  relief: { icon: 'medicine', col: 0xf08a9a, text: 'Relief' },
  comedy: { icon: 'morale', col: 0xe8b53a, text: 'Levity' },
  wait: { icon: 'log', col: C.textDim, text: 'Wait' },
};

export function factionOf(id) { return (S.content.FACTIONS || {})[id] || null; }
export function factionName(id) { return factionOf(id)?.name || prettify(id); }
export function factionCol(id) { return factionOf(id)?.colour ?? S.gfx.factionColours?.[id] ?? C.brass; }
export function goodDef(id) { return (S.content.GOODS || []).find((g) => g.id === id) || null; }
export function goodName(id) { return goodDef(id)?.name || prettify(id); }
export function itemName(id) { return (S.content.ITEM_DEFS || {})[id]?.name || prettify(id); }

/** Icon centred in a size x size box (container has .w/.h). */
export function ico(name, size = 20, color = C.cream) {
  const box = new Container(); box.w = box.h = size;
  try {
    const ic = S.gfx.icon(name, { size, color });
    const b = ic.getLocalBounds();
    ic.x = size / 2 - (b.x + b.width / 2); ic.y = size / 2 - (b.y + b.height / 2);
    box.addChild(ic);
  } catch (e) { /* optional */ }
  return box;
}
export function emblem(faction, size = 28) {
  const box = new Container(); box.w = box.h = size;
  try {
    const e = S.gfx.factionEmblem(faction, size);
    const b = e.getLocalBounds(); e.x = size / 2 - (b.x + b.width / 2); e.y = size / 2 - (b.y + b.height / 2);
    box.addChild(e); if (e.update) live(e);
  } catch (e) { /* optional */ }
  return box;
}
export function goodIco(goodId, size = 30) {
  const box = new Container(); box.w = box.h = size;
  try {
    const d = goodDef(goodId);
    const e = S.gfx.goodIcon(goodId, d?.category || 'material', size);
    const b = e.getLocalBounds(); e.x = size / 2 - (b.x + b.width / 2); e.y = size / 2 - (b.y + b.height / 2);
    box.addChild(e);
  } catch (e) { /* optional */ }
  return box;
}
/** Call node.update(dt) every frame while it lives. */
export function live(node) { if (node && node.update) Anim.watch(node, (dt) => node.update(dt)); return node; }

/** Small pill: [icon] text. opts: {icon, iconNode, text, color, h, size, bg, bold, tip} -> Container with .w .h */
export function pill({ icon, iconNode, text = '', color = C.cream, h = 26, size = 13, bg = 0x0b0d1e, bgAlpha = 0.8, stroke, padX = 10, tip, preset = 'bodyB' } = {}) {
  const c = new Container();
  const lab = new Label({ text, preset, size, color });
  const iw = iconNode ? iconNode.w : icon ? h - 8 : 0;
  const w = Math.ceil(padX * 2 + iw + (iw && text ? 6 : 0) + lab.textWidth);
  const g = new Graphics(); g.roundRect(0, 0, w, h, h / 2).fill({ color: bg, alpha: bgAlpha });
  g.roundRect(0, 0, w, h, h / 2).stroke({ width: 1.5, color: stroke ?? color, alpha: 0.9 }); c.addChild(g);
  let x = padX;
  if (iconNode || icon) { const ic = iconNode || ico(icon, h - 8, color); ic.x = x; ic.y = (h - ic.h) / 2; c.addChild(ic); x += iw + (text ? 6 : 0); }
  lab.x = x; lab.y = (h - lab.textHeight) / 2 - 0.5; c.addChild(lab);
  c.w = w; c.h = h; c.lab = lab;
  if (tip) Tooltip.attach(c, tip);
  return c;
}

/** Recessed dark box with brass-dark border. */
export function well(w, h, { r = 10, color = 0x0a0c22, alpha = 0.9, border = C.brassDark } = {}) {
  const g = new Graphics();
  g.roundRect(0, 0, w, h, r).fill({ color, alpha });
  g.roundRect(1, 1, w - 2, h - 2, r - 1).stroke({ width: 1.5, color: border, alpha: 0.85 });
  g.w = w; g.h = h; return g;
}
/** Brass framed viewport; child content area is (inset, inset, w-2*inset, h-2*inset). */
export function bezel(w, h, inset = 6, r = 14) {
  const g = new Graphics();
  g.roundRect(0, 3, w, h, r).fill({ color: 0x000000, alpha: 0.4 });
  g.roundRect(0, 0, w, h, r).fill(grad([[0, C.brassLight], [0.5, C.brass], [1, C.brassDark]]));
  g.roundRect(inset - 2, inset - 2, w - inset * 2 + 4, h - inset * 2 + 4, r - 4).fill({ color: 0x05060f });
  return g;
}
export function hr(w, color = C.brassDark, alpha = 0.7) { const g = new Graphics(); g.rect(0, 0, w, 2).fill({ color, alpha }); g.rect(0, 2, w, 1).fill({ color: 0xffffff, alpha: 0.05 }); return g; }

/** Animate a number label counting up. */
export function countTo(label, from, to, ms = 500, fmt = (v) => num(v)) {
  const o = { v: from };
  label.setText(fmt(from));
  Anim.to(o, { v: to }, ms, { ease: 'outCubic', onUpdate: () => { if (!label.destroyed) label.setText(fmt(o.v)); } });
}
/** Pop-in with overshoot. */
export function popIn(node, { delay = 0, ms = 320, from = 0.4 } = {}) {
  node.alpha = 0; const s = node.scale.x || 1;
  node.pivot.set((node.w || node.width) / 2, (node.h || node.height) / 2);
  node.x += (node.w || node.width) / 2; node.y += (node.h || node.height) / 2;
  node.scale.set(from * s);
  Anim.to(node, { alpha: 1 }, ms * 0.6, { delay, ease: 'linear' });
  return Anim.to(node.scale, { x: s, y: s }, ms, { delay, ease: 'outBack' });
}
export function fadeIn(node, ms = 220, dy = 8) {
  const y = node.y; node.alpha = 0; node.y = y + dy;
  Anim.to(node, { alpha: 1, y }, ms, { ease: 'outCubic' });
}
export function shake(node, amp = 6) {
  const x = node.x; Anim.to(node, { x: x + amp }, 55, { onDone: () => Anim.to(node, { x }, 160, { ease: 'outElastic' }) });
}
export function hitRect(node, w, h) { node.eventMode = 'static'; node.hitArea = new Rectangle(0, 0, w, h); return node; }

/** Best crew officer for a skill (matches engine: highest skill; mood<25 => -1). */
export function bestOfficer(state, skill) {
  let best = null;
  for (const c of state.crew || []) {
    let v = (c.skills && c.skills[skill]) || 0; if (c.mood !== undefined && c.mood < 25) v -= 1; v = Math.max(0, v);
    if (!best || v > best.v) best = { c, v };
  }
  return best;
}
