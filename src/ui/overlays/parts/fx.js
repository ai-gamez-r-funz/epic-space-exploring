// Effect chips: diff game state before/after a choice (the engine only reports text summaries) and render animated chips.
import { Container } from 'pixi.js';
import { C } from '../../kit/theme.js';
import { Anim } from '../../kit/anim.js';
import { S, sfx } from '../../services.js';
import { pill, ico, emblem, goodIco, sgn, RES_COL, RES_NAME, factionName, factionCol, goodName, itemName, prettify, popIn } from './common.js';

export function snapshot(game) {
  const st = game.state; const s = st.ship;
  let missions = [];
  try { missions = (game.activeMissions?.() || []).map((m) => ({ id: m.id, title: m.title })); } catch (e) { /* */ }
  return {
    fuel: s.fuel, supplies: s.supplies, hull: s.hull, morale: s.morale, credits: st.credits, day: st.day,
    rep: { ...st.rep }, cargo: { ...st.cargo }, items: { ...st.items }, codex: [...st.codex], upgrades: [...st.upgrades],
    crew: st.crew.map((c) => ({ id: c.id, name: c.name })), missions, done: [...(st.missions?.done || [])],
  };
}

function codexTitle(game, id) { try { return game.codexEntries().find((e) => e.id === id)?.title || prettify(id); } catch (e) { return prettify(id); } }
function upgradeName(id) { return (S.content.UPGRADES || []).find((u) => u.id === id)?.name || prettify(id); }

/** -> [{kind, text, tone, icon|iconNode, sfx}] */
export function diffChips(game, a, b) {
  const out = [];
  for (const k of ['fuel', 'supplies', 'hull', 'morale', 'credits']) {
    const d = Math.round(b[k] - a[k]); if (!d) continue;
    out.push({ kind: k, text: `${sgn(d)} ${RES_NAME[k]}`, tone: d > 0 ? 'good' : 'bad', icon: k, color: RES_COL[k], sfx: k === 'credits' && d > 0 ? 'coin' : null });
  }
  for (const f of Object.keys(b.rep)) {
    const d = Math.round((b.rep[f] || 0) - (a.rep[f] || 0)); if (!d) continue;
    out.push({ kind: 'rep', text: `${factionName(f)} ${sgn(d)}`, tone: d > 0 ? 'good' : 'bad', faction: f });
  }
  const ids = new Set([...Object.keys(a.cargo), ...Object.keys(b.cargo)]);
  for (const id of ids) { const d = (b.cargo[id] || 0) - (a.cargo[id] || 0); if (d) out.push({ kind: 'cargo', text: `${sgn(d)} ${goodName(id)}`, tone: d > 0 ? 'good' : 'bad', good: id }); }
  const iids = new Set([...Object.keys(a.items), ...Object.keys(b.items)]);
  for (const id of iids) { const d = (b.items[id] || 0) - (a.items[id] || 0); if (d) out.push({ kind: 'item', text: `${sgn(d)} ${itemName(id)}`, tone: d > 0 ? 'good' : 'bad', icon: 'star', color: C.brassLight }); }
  for (const id of b.codex) if (!a.codex.includes(id)) out.push({ kind: 'codex', text: `Codex: ${codexTitle(game, id)}`, tone: 'gold', icon: 'codex', color: 0xa99bff, sfx: 'discovery' });
  for (const m of b.missions) if (!a.missions.some((x) => x.id === m.id)) out.push({ kind: 'mission', text: `Mission: ${m.title}`, tone: 'gold', icon: 'mission', color: C.mustard });
  for (const m of a.missions) if (!b.missions.some((x) => x.id === m.id) && b.done.includes(m.id) && !a.done.includes(m.id)) out.push({ kind: 'mission', text: `Mission complete: ${m.title}`, tone: 'good', icon: 'check', color: C.good });
  for (const u of b.upgrades) if (!a.upgrades.includes(u)) out.push({ kind: 'upgrade', text: `Installed ${upgradeName(u)}`, tone: 'good', icon: 'ship', color: C.tealLight });
  for (const c of b.crew) if (!a.crew.some((x) => x.id === c.id)) out.push({ kind: 'crew', text: `${c.name} joins the crew`, tone: 'good', icon: 'crew', color: C.tealLight });
  const dd = b.day - a.day; if (dd > 0) out.push({ kind: 'days', text: `${dd} day${dd === 1 ? '' : 's'} pass`, tone: 'info', icon: 'log', color: C.textDim });
  return out;
}

/** Fallback: parse the engine's summary strings ("+3 fuel", "Concord of Lyra +2", "Codex: X"). */
export function summaryChips(list = []) {
  return list.map((s) => {
    let m = /^([+−-])(\d+) (fuel|supplies|hull|morale|scrip)$/i.exec(s);
    if (m) { const k = m[3].toLowerCase() === 'scrip' ? 'credits' : m[3].toLowerCase(); const neg = m[1] !== '+'; return { kind: k, text: `${neg ? '−' : '+'}${m[2]} ${RES_NAME[k]}`, tone: neg ? 'bad' : 'good', icon: k, color: RES_COL[k] }; }
    if (/^Codex:/.test(s)) return { kind: 'codex', text: s, tone: 'gold', icon: 'codex', color: 0xa99bff };
    if (/joins the crew/.test(s)) return { kind: 'crew', text: s, tone: 'good', icon: 'crew', color: C.tealLight };
    if (/^Installed/.test(s)) return { kind: 'upgrade', text: s, tone: 'good', icon: 'ship', color: C.tealLight };
    const neg = /(^[−-])|\s[−-]\d/.test(s);
    return { kind: 'misc', text: s, tone: neg ? 'bad' : 'info', icon: 'star', color: neg ? C.bad : C.cream };
  });
}

const TONE_COL = { good: C.good, bad: C.bad, gold: C.mustard, info: C.cream };

const RKIND = { credits: 'scrip', fuel: 'fuel', supplies: 'supplies', hull: 'hull', morale: 'morale', rep: 'rep', cargo: 'cargo', item: 'item', codex: 'codex', crew: 'crew', days: 'days', upgrade: 'item', mission: 'item' };

/** Badge for a chip's reward kind (GFX rewardBadge: round glowing coin in the kind's colour), or null. */
function badge(ch, size) {
  const k = RKIND[ch.kind]; if (!k) return null;
  try {
    const b = S.gfx.rewardBadge(k, { size, negative: ch.tone === 'bad' }); if (!b) return null;
    const box = new Container(); box.w = box.h = size; const bb = b.getLocalBounds(); b.x = size / 2 - (bb.x + bb.width / 2); b.y = size / 2 - (bb.y + bb.height / 2); box.addChild(b);
    if (b.update) Anim.watch(box, (dt) => b.update(dt));
    return box;
  } catch (e) { return null; }
}
function styleCol(ch) { try { const st = S.gfx.rewardStyle(RKIND[ch.kind], ch.tone === 'bad'); if (st && st.color != null) return st.color; } catch (e) { /* */ } return null; }

export function makeChip(ch, h = 34) {
  let col = TONE_COL[ch.tone] ?? C.cream; const kc = styleCol(ch); if (kc != null && ch.tone !== 'bad') col = kc;
  let iconNode = null;
  if (ch.faction) iconNode = emblem(ch.faction, h - 6);
  else if (ch.good) iconNode = goodIco(ch.good, h - 6);
  else iconNode = badge(ch, h - 6);
  if (!iconNode && ch.icon) iconNode = ico(ch.icon, h - 10, ch.color ?? col);
  return pill({ iconNode, text: ch.text, color: col, h, size: 15, bg: 0x0b0d1e, bgAlpha: 0.9, padX: 12 });
}

/** Lay chips out in wrapped rows inside width w; animate them in one after another. Returns {node, h}. */
export function chipRow(chips, w, { h = 34, gap = 8, delay = 150, step = 130 } = {}) {
  const node = new Container(); let x = 0, y = 0; let i = 0;
  for (const ch of chips) {
    const c = makeChip(ch, h);
    if (x + c.w > w && x > 0) { x = 0; y += h + gap; }
    c.x = x; c.y = y; x += c.w + gap; node.addChild(c);
    const d = delay + i * step; i++;
    popIn(c, { delay: d });
    if (ch.tone === 'good' || ch.tone === 'gold') Anim.to(c, {}, 1, { delay: d, onDone: () => { if (!c.destroyed) { sfx('hover', { pitch: 1.2 + i * 0.08, vol: 0.35 }); if (ch.sfx) sfx(ch.sfx); } } });
    else Anim.to(c, {}, 1, { delay: d, onDone: () => { if (!c.destroyed) sfx('hover', { pitch: 0.7, vol: 0.35 }); } });
  }
  node.h = chips.length ? y + h : 0;
  return node;
}
