import { Container, Graphics } from 'pixi.js';
import { C, W, F, RES_COL, Display } from '../kit/theme.js';
import { Panel, Lights } from '../kit/Panel.js';
import { Bar } from '../kit/Bar.js';
import { Label } from '../kit/Label.js';
import { Tooltip } from '../kit/Tooltip.js';
import { Button, IconButton } from '../kit/Button.js';
import { centerOn } from '../kit/layout.js';
import { arcSeg } from '../kit/draw.js';
import { Anim } from '../kit/anim.js';
import { S } from '../services.js';
import { readScale } from './threads.js';

const RANK_FALLBACK = ['Survey Sloop', 'Pathfinder', 'Trailblazer', 'Lantern-Bearer', 'Flagship of the Reach'];
function shipRank(g) {
  const n = g.state.upgrades.length; const R = S.content.SHIP_RANKS;
  if (Array.isArray(R) && R.length) { let r = R[0]; for (const x of R) if (n >= (x.minUpgrades ?? x.min ?? 0)) r = x; return r.title || r.name || String(r); }
  return RANK_FALLBACK[Math.min(RANK_FALLBACK.length - 1, Math.floor(n / 2))];
}

export const stardate = (day) => `2461.${String(day).padStart(3, '0')}`;

/**
 * Hud — persistent top bar: ship/captain, fuel/supplies/hull/morale bars, credits, stardate, survey ring.
 *   const hud = new Hud(ui); view.addChild(hud); hud.refresh();   (call from onChanged)
 * Size 1264×48 at (8,8).
 */
export class Hud extends Container {
  constructor(ui) {
    super(); this.ui = ui; this.x = 8; this.y = 8; this.w = 1264; this.h = 50;
    this.panel = new Panel({ w: 1264, h: 50, tone: 'indigo', radius: 14, pad: 0 }); this.addChild(this.panel);
    this.nameL = new Label({ text: '', preset: 'head', size: 12, color: C.cream, w: 190, fit: true, h: 16 }); this.nameL.x = 18; this.nameL.y = 9; this.addChild(this.nameL);
    this.capt = new Label({ text: '', preset: 'tiny', size: 12, color: C.tealLight, w: 190, fit: true, h: 14 }); this.capt.x = 18; this.capt.y = 27; this.addChild(this.capt);
    const mk = (key, icon, color, x, tip) => { const b = new Bar({ w: 108, h: 16, icon, color, label: key, tooltip: tip, showMax: false }); b.x = x; b.y = 17; this.addChild(b); return b; };
    this.bars = {
      fuel: mk('fuel', 'fuel', RES_COL.fuel, 236, () => this.barTip('Fuel', 'fuel', 'Spent on every jump. Refuel at stations; running dry means a tow.')),
      supplies: mk('supplies', 'supplies', RES_COL.supplies, 388, () => this.barTip('Supplies', 'supplies', 'Food, tea and spare parts. Used a little each day.')),
      hull: mk('hull', 'hull', RES_COL.hull, 540, () => this.barTip('Hull', 'hull', 'Hull integrity. Rough weather wears it down; repair when docked.')),
      morale: mk('morale', 'morale', RES_COL.morale, 692, () => this.barTip('Morale', 'morale', 'Crew spirits. Good company, tea and discoveries lift them.')),
    };
    // credits
    this.cIcon = S.gfx.icon('credits', { size: 22, color: C.mustard }); centerOn(this.cIcon, 880, 25); this.addChild(this.cIcon);
    this.cred = new Label({ text: '0', preset: 'num', size: 18, color: C.mustard }); this.cred.x = 896; this.cred.y = 13; this.addChild(this.cred);
    Tooltip.attach(this.cred, { title: 'Scrip', body: 'The Society\'s everyday currency. Earned from trade, missions and gratitude.' });
    this.sd = new Label({ text: '', preset: 'num', size: 14, color: C.cream }); this.sd.y = 8; this.addChild(this.sd);
    this.sdl = new Label({ text: 'STARDATE', preset: 'tiny', size: 10, color: C.textDim }); this.sdl.y = 28; this.addChild(this.sdl);
    // survey ring
    this.ring = new Graphics(); this.ring.x = 1226; this.ring.y = 25; this.addChild(this.ring);
    this.ringL = new Label({ text: '0%', preset: 'numSm', size: 11, color: C.cream }); this.addChild(this.ringL);
    this.ringHit = new Container(); this.ringHit.x = 1204; this.ringHit.y = 3; this.ringHit.hitArea = { contains: (x, y) => x >= 0 && x < 44 && y >= 0 && y < 44 }; this.addChild(this.ringHit);
    Tooltip.attach(this.ringHit, () => { const s = this.ui.game?.surveyProgress?.(); return s ? { title: 'Survey progress', rows: [['Systems charted', `${s.charted}/${s.total}`], ['Planets scanned', `${s.planetsScanned}/${s.planetsTotal}`], ['Survey score', s.score ?? 0, 'good']], footer: 'Chart every system to complete the survey.' } : null; });
    this.pips = new Graphics(); this.addChild(this.pips); this.pips.eventMode = 'static'; Tooltip.attach(this.pips, () => { const g = this.ui.game; return { title: shipRank(g), body: `${g.state.upgrades.length} of 8 ship systems upgraded. Visit a shipyard to grow the Halcyon.` }; });
    this.shown = 0; this.pct = 0;
    Anim.watch(this, () => this._drawRing());
  }
  barTip(title, key, body) {
    const s = this.ui.game.state.ship; const mx = s[key + 'Max'] ?? 100;
    return { title, body, rows: [['Current', `${Math.round(s[key])} / ${Math.round(mx)}`, s[key] / mx < 0.25 ? 'bad' : 'good']] };
  }
  _drawRing() {
    this.shown += (this.pct - this.shown) * 0.1; const g = this.ring; g.clear(); const r = 15;
    g.circle(0, 0, r).stroke({ width: 5, color: 0x05060f }); g.circle(0, 0, r).stroke({ width: 3, color: 0x1c2050 });
    if (this.shown > 0.5) arcSeg(g, 0, 0, r, -Math.PI / 2, -Math.PI / 2 + (this.shown / 100) * Math.PI * 2).stroke({ width: 4, color: C.tealLight, cap: 'round' });
    this.ringL.setText(`${Math.round(this.shown)}%`); centerOn(this.ringL, 1226, 25);
  }
  /** Readability: on small screens (css px of 12-logical text < ~10) or with Large UI, bump HUD type and bar height. */
  _readable() {
    const f = Math.round(readScale() * 20) / 20; if (f === this._f) return; this._f = f;
    const sz = (l, b) => l.setOpts({ size: Math.round(b * f) });
    sz(this.nameL, 12); sz(this.capt, 12); sz(this.cred, 18); sz(this.sd, 14); sz(this.sdl, 10); sz(this.ringL, 11);
    this.capt.y = 27 + Math.round((f - 1) * 5); this.capt.opts.w = 205; this.capt._layout(); this.sdl.y = 28 + Math.round((f - 1) * 6);
    for (const b of Object.values(this.bars)) { b.o.h = Math.round(16 * Math.min(f, 1.25)); b.y = 25 - b.o.h / 2; b.txt.setOpts({ size: Math.max(11, Math.round(b.o.h - 4)) }); }
  }
  refresh() {
    const g = this.ui.game; if (!g) return; this._readable(); const st = g.state, sh = st.ship;
    this.nameL.setText(sh.name.toUpperCase()); this.capt.setText(`Capt. ${String(st.captain.name).replace(/^(captain|capt\.?)\s+/i, '')} \u00b7 ${shipRank(g)}`);
    { const n = st.upgrades.length; const p = this.pips; p.clear(); const x0 = 18 + Math.min(this.nameL.textWidth, 170) + 8; for (let i = 0; i < 8; i++) p.circle(x0 + i * 7, this.nameL.y + 7, 2.6).fill({ color: i < n ? C.mustard : 0x2b2f66 }).stroke({ width: 0.8, color: C.brassDark }); p.hitArea = { contains: (x, y) => x >= x0 - 5 && x <= x0 + 56 && Math.abs(y - (this.nameL.y + 7)) < 8 }; }
    this.bars.fuel.set(sh.fuel, sh.fuelMax); this.bars.supplies.set(sh.supplies, sh.suppliesMax); this.bars.hull.set(sh.hull, sh.hullMax); this.bars.morale.set(sh.morale, 100);
    this.cred.setText(String(Math.round(st.credits)));
    const sdText = stardate(st.day); this.sd.setText(sdText); const x = 1160 - Math.max(this.sd.textWidth, this.sdl.textWidth); this.sd.x = x; this.sdl.x = x;
    this.pct = g.surveyProgress?.().pct ?? 0;
  }
}
