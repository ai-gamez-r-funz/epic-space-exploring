// "Living threads" for the Bridge: where the rival is, the next Lantern chapter (pips + ETA), and the dock bulletin
// ("why jump now"). Uses ENGINE g.rivalStatus()/g.dockBulletin() when present, else derives from rivalInfo/mapMarkers/market.
import { Container, Graphics } from 'pixi.js';
import { C } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Tooltip } from '../kit/Tooltip.js';
import { S } from '../services.js';
import { jumpsTo } from './objective.js';

const sysName = (g, id) => g.system(id)?.name || id;

export function rivalLine(g) {
  try {
    if (typeof g.rivalStatus === 'function') { const r = g.rivalStatus(); if (r) return typeof r === 'string' ? { text: r } : { text: r.text || r.line, systemId: r.systemId || null }; }
  } catch (e) { /* derive */ }
  try {
    const ri = g.rivalInfo?.(); const R = S.content.RIVAL; const name = (R?.name || ri?.name || 'Tamsin Vell').replace(/^Captain\s+/, '');
    if (!ri && !R) return null;
    if (ri?.systemId) {
      const n = jumpsTo(g, ri.systemId); const here = ri.here ? ' — right here' : n ? ` · ${n} jump${n > 1 ? 's' : ''}` : '';
      return { text: `${name} is at ${ri.systemName}${here}`, systemId: ri.systemId, tip: ri.goodName ? `Hauling ${ri.goodName}. Beat her to the market.` : '' };
    }
    return { text: `${name}: whereabouts unknown`, tip: R?.systemHint || 'Dock at trade stations to catch the gossip.' };
  } catch (e) { return null; }
}

export function lanternLine(g) {
  try {
    const CH = S.content.CHAPTERS || []; const fl = g.state.flags; if (!CH.length) return null;
    const done = CH.map((c) => !!fl['lantern_' + c.n]);
    const cur = CH.find((c) => !fl['lantern_' + c.n]);
    if (!cur) return { pips: done, text: 'All five Lanterns answered', done: true };
    const open = !!fl[cur.flag || 'chapter_' + cur.n];
    const mk = g.mapMarkers?.().markers.find((m) => m.kind === 'lantern');
    const eta = cur.etaDays ? `${cur.etaDays[0]}–${cur.etaDays[1]} days` : '';
    const text = open ? `Lantern ${cur.n}: ${cur.title}${eta ? ' · ~' + eta : ''}` : `Lantern ${cur.n} — chart more of the Reach to open it`;
    return { pips: done, text, systemId: mk?.systemId || null, tip: cur.hint || '' };
  } catch (e) { return null; }
}

export function dockBulletin(g) {
  try {
    if (typeof g.dockBulletin === 'function') { const b = g.dockBulletin(); if (b) return typeof b === 'string' ? { text: b } : { text: b.text || b.line, systemId: b.systemId || null }; }
  } catch (e) { /* derive */ }
  try {
    const parts = []; let sid = null;
    const d = g.distressSignals?.()[0]; if (d) { parts.push(`Distress at ${d.systemName}, ${d.daysLeft} day${d.daysLeft === 1 ? '' : 's'} left`); sid = d.systemId; }
    const m = g.market?.(g.state.pos); const b = m?.bestSell?.[0];
    if (b) { parts.unshift(`Sell ${S.content.GOODS_BY_ID?.[b.goodId]?.name || b.goodId} at ${b.systemName}: +${Math.round(b.pct)}%${b.jumps ? ` (${b.jumps} jump${b.jumps > 1 ? 's' : ''})` : ''}`); sid = b.systemId; }
    const r = g.rivalInfo?.(); if (r?.systemId && !r.here && parts.length < 2) parts.push(`${(r.name || 'Tamsin').replace(/^Captain\s+/, '')} is hauling ${r.goodName} at ${r.systemName}`);
    if (!parts.length) { const o = g.nextObjective?.(); if (o?.text) { parts.push(o.text); sid = o.systemId || null; } }
    return parts.length ? { text: parts.slice(0, 2).join('  ·  '), systemId: sid } : null;
  } catch (e) { return null; }
}

/** Pill row overlaid on the viewscreen bottom. Rebuilt by update(game). */
export class ThreadsBar extends Container {
  constructor(ui, w = 700) {
    super(); this.ui = ui; this.W = w; this.eventMode = 'passive';
  }
  _pill(x, y, w, h, col, iconName, text, onTap, tip) {
    const c = new Container(); c.x = x; c.y = y; c.eventMode = 'static'; c.cursor = 'pointer';
    const g = new Graphics().roundRect(0, 0, w, h, h / 2).fill({ color: 0x05060f, alpha: 0.78 }).roundRect(0, 0, w, h, h / 2).stroke({ width: 1.5, color: col, alpha: 0.85 }); c.addChild(g);
    let tx = 10;
    if (iconName) { try { const ic = S.gfx.icon(iconName, { size: 16, color: col }); const b = ic.getLocalBounds(); ic.x = 18 - (b.x + b.width / 2); ic.y = h / 2 - (b.y + b.height / 2); c.addChild(ic); tx = 32; } catch (e) { /* */ } }
    c.tx = tx; const l = new Label({ text, preset: 'small', size: 12, color: C.cream, w: w - tx - 10, h: h - 4, fit: true }); l.x = tx; l.y = (h - l.textHeight) / 2; c.addChild(l); c.label = null;
    c.on('pointertap', () => onTap?.()); if (tip) Tooltip.attach(c, tip);
    return c;
  }
  update(g, docked) {
    this.removeChildren().forEach((c) => c.destroy({ children: true }));
    const focus = (id, title) => () => { if (id && this.ui.showOnMap) this.ui.showOnMap([id], title); else this.ui.openOverlay('MissionLog'); };
    let y = 0; const H = 24;
    if (docked) { const b = dockBulletin(g); if (b) { this.addChild(this._pill(0, y, this.W, H, C.mustard, 'news', b.text, focus(b.systemId, 'Dock bulletin'), { title: 'Dock bulletin', body: b.text, footer: b.systemId ? 'Click to show it on the Chart' : '' })); y += H + 6; } }
    const r = rivalLine(g); const l = lanternLine(g); const parts = [r, l].filter(Boolean);
    let x = 0; const gap = 8; const w1 = r && l ? Math.floor((this.W - gap) * 0.46) : this.W;
    if (r) { this.addChild(this._pill(x, y, w1, H, 0xf08a9a, 'rival', r.text, focus(r.systemId, r.text), { title: 'Rival trader', body: r.tip || r.text, footer: r.systemId ? 'Click to show on the Chart' : '' })); x += w1 + gap; }
    if (l) {
      const w2 = r ? this.W - x : this.W; const p = this._pill(x, y, w2, H, 0xffe08a, 'lantern', l.text, focus(l.systemId, 'Next Lantern'), { title: 'The Lanterns', body: (l.tip ? l.tip + '\n' : '') + l.pips.filter(Boolean).length + ' of ' + l.pips.length + ' answered', footer: l.systemId ? 'Click to show on the Chart' : 'Click to open the Log' });
      // chapter pips at the right edge
      const pg = new Graphics(); l.pips.forEach((d, i) => { pg.circle(w2 - 14 - (l.pips.length - 1 - i) * 12, H / 2, 4).fill({ color: d ? 0xffe08a : 0x2b2f66 }).stroke({ width: 1, color: 0xffe08a, alpha: 0.6 }); }); p.addChild(pg);
      const t = p.children.find((o) => o instanceof Label); if (t) { t.opts.w = w2 - p.tx - 10 - l.pips.length * 12 - 6; t._layout(); }
      this.addChild(p);
    }
    void parts; this.h = y + H;
    this.y = 530 - 64 - this.h - 4; // bottom-aligned inside the viewscreen (viewscreen top = 64 in parent space)
  }
}
