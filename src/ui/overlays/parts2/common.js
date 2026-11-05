// Shared bits for the 2B overlays: skill pips, chips, rewards text, headings.
import { Container, Graphics } from 'pixi.js';
import { C, MOOD_COLORS } from '../../kit/theme.js';
import { Label } from '../../kit/Label.js';
import { S } from '../../services.js';

export const SKILLS = ['science', 'engineering', 'medicine', 'diplomacy', 'piloting'];
export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
export const pretty = (s) => cap(String(s || '').replace(/_/g, ' '));
export const factionName = (id) => S.content.FACTIONS?.[id]?.name || cap(id);
export const factionColour = (id) => S.content.FACTIONS?.[id]?.colour ?? C.tealLight;

export function heading(text, color = C.brassLight, o = {}) { return new Label({ text, preset: 'headSm', size: 11, color, upper: true, ...o }); }

/** Row of skill pips: `val` filled mustard dots, optional ship `bonus` as teal diamonds, up to `max` empty slots. */
export function pips(val, bonus = 0, { max = 5, size = 7, gap = 4, color = C.mustard } = {}) {
  const c = new Container(); const g = new Graphics(); c.addChild(g);
  let x = 0;
  for (let i = 0; i < Math.max(max, val); i++) {
    const cx = x + size, cy = size;
    if (i < val) { g.circle(cx, cy, size).fill(color); g.circle(cx - size * 0.3, cy - size * 0.3, size * 0.35).fill({ color: 0xffffff, alpha: 0.4 }); }
    else g.circle(cx, cy, size - 0.5).fill({ color: 0x0b0d1e, alpha: 0.7 }).stroke({ width: 1.2, color: C.brassDark, alpha: 0.8 });
    x += size * 2 + gap;
  }
  if (bonus > 0) {
    x += 4;
    for (let i = 0; i < bonus; i++) { const cx = x + size, cy = size; g.poly([cx, cy - size, cx + size, cy, cx, cy + size, cx - size, cy]).fill(C.tealLight).stroke({ width: 1, color: C.tealDark }); x += size * 2 + gap; }
  }
  c.w = x; c.h = size * 2;
  return c;
}

/** Small rounded chip with text. */
export function chip(text, { color = C.tealLight, bg = 0x0b0d1e, size = 12, h = 22, padX = 10 } = {}) {
  const c = new Container(); const l = new Label({ text, preset: 'tiny', size, color }); const w = Math.ceil(l.textWidth) + padX * 2;
  const g = new Graphics().roundRect(0, 0, w, h, h / 2).fill({ color: bg, alpha: 0.8 }).roundRect(0, 0, w, h, h / 2).stroke({ width: 1.2, color, alpha: 0.7 });
  l.x = padX; l.y = (h - l.textHeight) / 2; c.addChild(g, l); c.w = w; c.h = h; return c;
}

/** Horizontal slim bar (0..1) drawn once. */
export function slimBar(w, frac, color, h = 10) {
  const g = new Graphics(); frac = Math.max(0, Math.min(1, frac));
  g.roundRect(0, 0, w, h, h / 2).fill({ color: 0x05060f });
  if (frac > 0) g.roundRect(1.5, 1.5, Math.max(h - 3, (w - 3) * frac), h - 3, (h - 3) / 2).fill(color);
  g.roundRect(0, 0, w, h, h / 2).stroke({ width: 1.2, color: C.brassDark });
  g.w = w; g.h = h; return g;
}

export const moodWord = (m) => (m >= 80 ? 'Delighted' : m >= 60 ? 'Content' : m >= 40 ? 'Steady' : m >= 20 ? 'Glum' : 'Miserable');
export { MOOD_COLORS };

/** Reward object -> array of {icon,text,color}. */
export function rewardLines(r = {}) {
  const out = [];
  if (r.credits) out.push({ icon: 'credits', text: `${r.credits} scrip`, color: C.mustard });
  for (const [f, n] of Object.entries(r.rep || {})) out.push({ icon: 'diplomacy', text: `${n > 0 ? '+' : ''}${n} ${f.startsWith('$') ? 'giver' : factionName(f)} standing`, color: n >= 0 ? C.good : C.bad });
  for (const [id, n] of Object.entries(r.item || {})) out.push({ icon: 'cargo', text: `${n}× ${S.content.ITEM_DEFS?.[id]?.name || pretty(id)}`, color: C.cream });
  if (r.upgrade) out.push({ icon: 'ship', text: `Upgrade: ${pretty(r.upgrade)}`, color: C.tealLight });
  if (r.codex) out.push({ icon: 'codex', text: 'Codex entry', color: C.tealLight });
  if (r.crew || r.recruit) out.push({ icon: 'crew', text: 'A new crew member', color: C.tealLight });
  return out;
}

/** Wrap-aware helper to add a label at running y within `parent`. Returns new y. */
export function addText(parent, y, text, { x = 0, w, preset = 'small', size = 15, color = C.cream, gap = 6, lineHeight } = {}) {
  const l = new Label({ text, preset, size, color, w, lineHeight: lineHeight || Math.round(size * 1.28) }); l.x = x; l.y = y; parent.addChild(l);
  return y + l.textHeight + gap;
}

/** Portrait of a crew-like object ({portrait:{species,seed}, species, mood}) at size, with a mood ring. */
export function crewPortrait(c, size = 56, ring = true) {
  const k = new Container();
  const p = S.gfx.portrait({ species: c.portrait?.species || c.species || 'unknown', seed: c.portrait?.seed ?? 1, size, mood: c.mood }); k.addChild(p);
  if (ring) k.addChild(new Graphics().roundRect(-2, -2, size + 4, size + 4, 9).stroke({ width: 2.5, color: MOOD_COLORS(c.mood ?? 70) }));
  k.w = size; k.h = size; return k;
}

/** Make a container tap-able with a hand cursor. */
export function tappable(obj, fn, hit) {
  obj.eventMode = 'static'; obj.cursor = 'pointer'; if (hit) obj.hitArea = hit; obj.on('pointertap', fn); return obj;
}

/** Switch widget: returns Container with .set(bool). onChange(bool). 56x28. */
export function switchW(value, onChange) {
  const k = new Container(); const g = new Graphics(); k.addChild(g); k.value = !!value; k.w = 56; k.h = 28;
  const draw = () => { g.clear(); g.roundRect(0, 0, 56, 28, 14).fill({ color: k.value ? C.tealDark : 0x05060f }).roundRect(0, 0, 56, 28, 14).stroke({ width: 2, color: k.value ? C.tealLight : C.brassDark });
    g.circle(k.value ? 42 : 14, 14, 10).fill(k.value ? C.tealLight : C.creamDark); };
  k.set = (v) => { k.value = !!v; draw(); };
  k.eventMode = 'static'; k.cursor = 'pointer'; k.hitArea = { contains: (x, y) => x >= -6 && x <= 62 && y >= -8 && y <= 36 };
  k.on('pointertap', () => { k.set(!k.value); try { S.audio.sfx('click'); } catch (e) { /* */ } onChange?.(k.value); });
  draw(); return k;
}
