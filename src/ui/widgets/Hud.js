import { Container, Graphics } from 'pixi.js';
import { C, W, F, RES_COL } from '../kit/theme.js';
import { Panel, Lights } from '../kit/Panel.js';
import { Bar } from '../kit/Bar.js';
import { Label } from '../kit/Label.js';
import { Tooltip } from '../kit/Tooltip.js';
import { Button, IconButton } from '../kit/Button.js';
import { centerOn } from '../kit/layout.js';
import { arcSeg } from '../kit/draw.js';
import { Anim } from '../kit/anim.js';
import { S } from '../services.js';

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
  refresh() {
    const g = this.ui.game; if (!g) return; const st = g.state, sh = st.ship;
    this.nameL.setText(sh.name.toUpperCase()); this.capt.setText(`Capt. ${String(st.captain.name).replace(/^(captain|capt\.?)\s+/i, '')}`);
    this.bars.fuel.set(sh.fuel, sh.fuelMax); this.bars.supplies.set(sh.supplies, sh.suppliesMax); this.bars.hull.set(sh.hull, sh.hullMax); this.bars.morale.set(sh.morale, 100);
    this.cred.setText(String(Math.round(st.credits)));
    const sdText = stardate(st.day); this.sd.setText(sdText); const x = 1160 - Math.max(this.sd.textWidth, this.sdl.textWidth); this.sd.x = x; this.sdl.x = x;
    this.pct = g.surveyProgress?.().pct ?? 0;
  }
}
