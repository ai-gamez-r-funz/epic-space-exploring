import { Container, Graphics, Rectangle } from 'pixi.js';
import { C, lighten, darken, grad } from './theme.js';
import { Label } from './Label.js';
import { drawPill } from './draw.js';
import { Input } from './input.js';
import { Anim } from './anim.js';
import { Tooltip } from './Tooltip.js';
import { S, sfx } from '../services.js';

const TAG_ICON = { diplomacy: 'diplomacy', trade: 'credits', flee: 'jump', persuade: 'hail', science: 'science', wait: 'log' };
const TAG_COL = { diplomacy: C.teal, trade: C.mustard, flee: C.coral, persuade: C.plum, science: C.info, wait: C.textDim };

/**
 * ChoiceList — numbered (1–9) vertical choices for events/dialogs, with odds badges and disabled-with-reason rows.
 *   const cl = new ChoiceList({ w:560, choices:[{label, enabled=true, reason?, odds?:0..1, tag?}], onChoose(index) , gap:8 });
 *   cl.setChoices(list)   cl.height (total)   cl.setEnabled(false) to lock after a pick.
 * Keys 1–9 choose (if enabled). Up/Down/Enter also work (arrow focus). Choice index passed to onChoose is the array index
 * (so it maps 1:1 to g.resolveChoice(index)). Rows are ~ 48px high, taller for wrapped labels / disabled reasons.
 */
export class ChoiceList extends Container {
  constructor(o = {}) {
    super();
    this.o = { w: 560, gap: 8, fontSize: 17, ...o };
    this.rows = []; this.locked = false; this.cursor_ = -1; this.height_ = 0;
    this._unbind = [];
    for (let i = 0; i < 9; i++) this._unbind.push(Input.bind(this, String(i + 1), () => this.choose(i)));
    this._unbind.push(Input.bind(this, 'ArrowDown', () => this._move(1)), Input.bind(this, 'ArrowUp', () => this._move(-1)), Input.bind(this, 'Enter', () => { if (this.cursor_ >= 0) this.choose(this.cursor_); }));
    this.on('destroyed', () => this._unbind.forEach((f) => f()));
    if (o.choices) this.setChoices(o.choices);
  }
  get listHeight() { return this.height_; }
  setChoices(choices) {
    this.rows.forEach((r) => r.destroy({ children: true })); this.rows = []; this.locked = false; this.cursor_ = -1;
    let y = 0; const w = this.o.w;
    choices.forEach((ch, i) => {
      const row = this._row(ch, i, w); row.y = y; this.addChild(row); this.rows.push(row); y += row.h + this.o.gap;
      row.alpha = 0; Anim.to(row, { alpha: 1 }, 220, { delay: i * 60, ease: 'linear' });
    });
    this.height_ = Math.max(0, y - this.o.gap);
  }
  setEnabled(on) { this.locked = !on; this.rows.forEach((r) => (r.alpha = on ? 1 : 0.55)); }
  choose(i) {
    const r = this.rows[i]; if (!r || this.locked) return;
    if (!r.choice.enabled && r.choice.enabled !== undefined) { sfx('deny'); Anim.to(r, { x: 6 }, 60, { onDone: () => Anim.to(r, { x: 0 }, 120, { ease: 'outElastic' }) }); return; }
    sfx('confirm'); this.o.onChoose?.(i, r.choice);
  }
  _move(d) {
    const n = this.rows.length; if (!n) return;
    let i = this.cursor_; for (let k = 0; k < n; k++) { i = (i + d + n) % n; if (this.rows[i].choice.enabled !== false) break; }
    this.cursor_ = i; this.rows.forEach((r, j) => r.paint(j === i)); sfx('hover');
  }
  _row(ch, i, w) {
    const enabled = ch.enabled !== false; const row = new Container(); row.choice = ch;
    const fs = this.o.fontSize; const numW = 36; const oddsW = ch.odds != null ? 66 : 0; const textW = w - numW - 14 - oddsW - 12 - (ch.tag && TAG_ICON[ch.tag] ? 26 : 0);
    const lab = new Label({ text: ch.label, preset: 'body', size: fs, w: textW, color: enabled ? C.cream : C.textDim, lineHeight: fs + 5 });
    let rh = Math.max(46, lab.textHeight + 20); let reasonL = null;
    if (!enabled && ch.reason) { reasonL = new Label({ text: ch.reason, preset: 'tiny', size: 13, color: C.mustard, w: textW }); rh += reasonL.textHeight + 2; }
    row.h = rh; row.eventMode = 'static'; row.cursor = enabled ? 'pointer' : 'not-allowed'; row.hitArea = new Rectangle(0, 0, w, rh);
    const bg = new Graphics(); row.addChild(bg);
    row.paint = (hov) => {
      bg.clear();
      bg.roundRect(0, 2, w, rh, 12).fill({ color: 0x000000, alpha: 0.3 });
      bg.roundRect(0, 0, w, rh, 12).fill({ color: enabled ? C.brassDark : 0x2a2d55 });
      bg.roundRect(1.5, 1.5, w - 3, rh - 3, 11).fill(enabled ? grad([[0, hov ? 0x4a52a8 : 0x353b86], [1, hov ? 0x2e3478 : 0x232859]]) : { color: 0x181b40 });
      if (enabled && hov) bg.roundRect(0, 0, w, rh, 12).stroke({ width: 2, color: C.brassLight, alpha: 0.9 });
    };
    row.paint(false); row.addChild();
    // number badge
    const nb = new Graphics(); nb.circle(0, 0, 14).fill({ color: enabled ? C.mustard : 0x3b3f78 }); nb.circle(0, 0, 14).stroke({ width: 2, color: C.brassDark });
    nb.x = 24; nb.y = rh / 2; row.addChild(nb);
    const nl = new Label({ text: String(i + 1), preset: 'num', size: 14, color: enabled ? C.textInk : C.textDim }); nl.x = 24 - nl.textWidth / 2; nl.y = rh / 2 - nl.textHeight / 2; row.addChild(nl);
    let x = numW + 14;
    if (ch.tag && TAG_ICON[ch.tag]) { const ic = S.gfx.icon(TAG_ICON[ch.tag], { size: 20, color: enabled ? (TAG_COL[ch.tag] || C.cream) : C.textDim }); const b = ic.getLocalBounds(); ic.x = x + 10 - (b.x + b.width / 2); ic.y = rh / 2 - (b.y + b.height / 2) - (reasonL ? reasonL.textHeight / 2 : 0); row.addChild(ic); x += 26; }
    lab.x = x; lab.y = reasonL ? 10 : (rh - lab.textHeight) / 2; row.addChild(lab);
    if (reasonL) { reasonL.x = x; reasonL.y = lab.y + lab.textHeight + 2; row.addChild(reasonL); }
    if (!enabled) { const lk = S.gfx.icon('lock', { size: 18, color: C.textDim }); const b = lk.getLocalBounds(); lk.x = w - 26 - (b.x + b.width / 2); lk.y = rh / 2 - (b.y + b.height / 2); row.addChild(lk); }
    if (ch.odds != null) {
      const pct = Math.round(ch.odds * 100); const col = pct >= 70 ? C.good : pct >= 40 ? C.mustard : C.coral;
      const pill = new Container(); const pg = new Graphics(); drawPill(pg, 58, 24, 0x0b0d1e, { alpha: 0.85, stroke: col });
      const pl = new Label({ text: pct + '%', preset: 'num', size: 14, color: col }); pl.x = (58 - pl.textWidth) / 2; pl.y = (24 - pl.textHeight) / 2;
      pill.addChild(pg, pl); pill.x = w - 58 - 12; pill.y = (rh - 24) / 2; row.addChild(pill);
      Tooltip.attach(pill, { title: 'Chance of success', body: `About ${pct} in 100 — based on your crew's skill.`, tone: pct >= 70 ? 'good' : pct >= 40 ? 'warn' : 'bad' });
    }
    row.on('pointerover', () => { if (this.locked) return; row.paint(true); if (enabled) sfx('hover'); this.cursor_ = i; });
    row.on('pointerout', () => row.paint(false));
    row.on('pointertap', () => { if (Input.clickAllowed()) this.choose(i); });
    return row;
  }
}
