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
    const r = g.rivalStatus?.(); if (!r) return null;
    const name = (r.name || 'Tamsin Vell').replace(/^Captain\s+/, '');
    if (r.systemId) {
      const n = r.jumps; const tail = r.here ? ' \u2014 right here' : n ? ` \u00b7 ${n} jump${n > 1 ? 's' : ''}` : '';
      return { text: `${name} is at ${r.systemName}${tail}`, systemId: r.systemId, tip: r.line + (r.beaten ? '' : ' Beat her to the best market.') };
    }
    return { text: `${name}: whereabouts unknown`, tip: r.line || r.systemHint || 'Dock at trade stations to catch the gossip.' };
  } catch (e) { return null; }
}

export function lanternLine(g) {
  try {
    const arc = g.arcProgress?.() || []; if (!arc.length) return null;
    const pips = arc.map((c) => c.status === 'done'); const cur = arc.find((c) => c.status !== 'done');
    if (!cur) return { pips, text: 'All five Lanterns answered', done: true };
    const eta = cur.etaDays ? `${cur.etaDays[0]}\u2013${cur.etaDays[1]} days` : '';
    const text = cur.status === 'open' ? `Lantern ${cur.n}: ${cur.title}${eta ? ' \u00b7 ~' + eta : ''}` : `Lantern ${cur.n} \u2014 chart more of the Reach to open it`;
    const step = (cur.steps || []).find((x) => !x.done);
    return { pips, text, systemId: cur.lanternSystemId || null, tip: (cur.journal || '') + (step ? `\nNext: ${step.text}` : '') };
  } catch (e) { return null; }
}

/** One dock line (rotates daily through the engine's bulletin) + all lines for the tooltip. */
export function dockBulletin(g) {
  try {
    const b = g.dockBulletin?.(); if (!b || !b.lines?.length) return null;
    const pick = b.lines.filter((l) => l.kind !== 'objective');
    const main = (pick.length ? pick : b.lines)[(g.state.day || 0) % (pick.length || b.lines.length)];
    return { text: main.text, systemId: main.systemId || null, all: b.lines };
  } catch (e) { return null; }
}

/** "You could spend that" nudge. ENGINE g.spendHints() when present, else derived from scrip, refits and training at this station. */
export function spendLine(g) {
  try {
    const h = g.spendHints?.();
    if (h) { const a = Array.isArray(h) ? h : h.hints || h.lines || []; if (a.length) { const f = a[0]; return { text: typeof f === 'string' ? f : f.text, overlay: f.overlay || 'Shipyard' }; } return null; }
  } catch (e) { /* derive */ }
  try {
    const st = g.state; const sys = g.here(); if (!st.docked || !sys.station) return null;
    const refit = (g.refits?.() || []).find((r) => r.available && !r.owned);
    const yard = sys.station.services.includes('shipyard');
    if (refit && yard) return { text: `Refit on offer: ${refit.name} (${refit.cost} scrip, ${refit.days}d) \u2014 open the yard`, overlay: 'Shipyard' };
    if (st.credits >= 1000 && yard) return { text: `${Math.floor(st.credits)} scrip in the hold: the yard has upgrades, refits and training to spend it on`, overlay: 'Shipyard' };
    if (st.credits >= 1000) return { text: `${Math.floor(st.credits)} scrip in the hold: find a shipyard to put it to work`, overlay: null };
  } catch (e) { /* */ }
  return null;
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
    const sp = spendLine(g); if (sp) { this.addChild(this._pill(0, y, this.W, H, C.good, 'credits', sp.text, () => (sp.overlay ? this.ui.openOverlay(sp.overlay) : this.ui.toast('Chart a course to a shipyard.', 'info')), { title: 'Spend your scrip', body: sp.text, footer: sp.overlay ? 'Click to open it' : '' })); y += H + 6; }
    if (docked) { const b = dockBulletin(g); if (b) { this.addChild(this._pill(0, y, this.W, H, C.mustard, 'news', b.text, focus(b.systemId, 'Dock bulletin'), { title: 'Dock bulletin', body: b.all.map((l) => '\u2022 ' + l.text).join('\n'), footer: b.systemId ? 'Click to show it on the Chart' : '' })); y += H + 6; } }
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
