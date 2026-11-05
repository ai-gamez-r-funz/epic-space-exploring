// Rich numbered choice rows for the event dialog: tag icon, skill + lending officer, odds badge, lock reasons.
import { Container, Graphics, Rectangle } from 'pixi.js';
import { C, lighten, grad } from '../../kit/theme.js';
import { Label } from '../../kit/Label.js';
import { Anim } from '../../kit/anim.js';
import { Input } from '../../kit/input.js';
import { Tooltip } from '../../kit/Tooltip.js';
import { S, sfx } from '../../services.js';
import { ico, TAG_INFO, SKILL_COL, bestOfficer, shake, cap } from './common.js';

export class EventChoices extends Container {
  constructor({ w, choices, state, onChoose, onHover }) {
    super();
    this.w = w; this.rows = []; this.cursor = -1; this.locked = false; this.o = { onChoose, onHover };
    let y = 0;
    choices.forEach((ch, i) => {
      const row = this._row(ch, i, w, state); row.y = y; this.addChild(row); this.rows.push(row);
      y += row.h + 8;
      row.alpha = 0; row.x = 16; Anim.to(row, { alpha: 1, x: 0 }, 260, { delay: i * 70, ease: 'outCubic' });
    });
    this.h = Math.max(0, y - 8);
    this._keys = [];
    for (let i = 0; i < 9; i++) this._keys.push(Input.bind(this, String(i + 1), () => this.choose(i)));
    this._keys.push(Input.bind(this, 'ArrowDown', () => this.move(1)), Input.bind(this, 'ArrowUp', () => this.move(-1)));
    this.on('destroyed', () => this._keys.forEach((f) => f()));
    const first = choices.findIndex((c) => c.enabled !== false);
    this.firstEnabled = first;
  }
  get enabledCount() { return this.rows.filter((r) => r.ch.enabled !== false).length; }
  lock(on) { this.locked = on; this.rows.forEach((r) => { if (on) r.alpha = r.picked ? 1 : 0.4; }); }
  choose(i) {
    const r = this.rows[i]; if (!r || this.locked) return false;
    if (r.ch.enabled === false) { sfx('deny'); shake(r); return false; }
    r.picked = true; this.lock(true); r.flash?.(); sfx('confirm');
    this.o.onChoose?.(i, r.ch); return true;
  }
  activateCursor() { if (this.cursor >= 0) { this.choose(this.cursor); return true; } return false; }
  move(d) {
    const n = this.rows.length; if (!n || this.locked) return;
    let i = this.cursor; for (let k = 0; k < n; k++) { i = (i + d + n) % n; if (this.rows[i].ch.enabled !== false) break; }
    this.setCursor(i); sfx('hover');
  }
  setCursor(i) { this.cursor = i; this.rows.forEach((r, j) => r.paint(j === i)); this.o.onHover?.(i >= 0 ? this.rows[i].ch : null); }

  _row(ch, i, w, state) {
    const enabled = ch.enabled !== false; const row = new Container(); row.ch = ch;
    const tag = TAG_INFO[ch.tag]; const tagCol = tag ? tag.col : C.brassLight;
    const numW = 40; const oddsW = ch.odds != null ? 74 : 0; const lockW = !enabled ? 26 : 0;
    const textX = numW + 12 + (tag ? 28 : 0); const textW = w - textX - oddsW - lockW - 16;
    const lab = new Label({ text: ch.label, preset: 'body', size: 17, lineHeight: 22, w: textW, color: enabled ? C.cream : C.textDim });
    let subs = null; let subH = 0;
    if (ch.skill && enabled) {
      const off = bestOfficer(state, ch.skill);
      const sk = cap(ch.skill);
      const txt = off && off.v > 0 ? `${sk} ${off.v} · ${off.c.name} lends a hand` : `${sk} check · no specialist aboard`;
      subs = new Label({ text: txt.toUpperCase(), preset: 'tiny', size: 11, color: SKILL_COL[ch.skill] || C.textDim, w: textW, letterSpacing: 1 });
      subH = subs.textHeight + 2;
    }
    let reasonL = null;
    if (!enabled && ch.reason) { reasonL = new Label({ text: ch.reason, preset: 'tiny', size: 13, color: C.mustard, w: textW }); subH = reasonL.textHeight + 2; }
    const h = Math.max(50, lab.textHeight + subH + 22); row.h = h; row.w = w;
    row.eventMode = 'static'; row.cursor = enabled ? 'pointer' : 'not-allowed'; row.hitArea = new Rectangle(0, 0, w, h);
    const bg = new Graphics(); row.addChild(bg);
    row.paint = (hov) => {
      bg.clear();
      bg.roundRect(0, 3, w, h, 12).fill({ color: 0x000000, alpha: 0.3 });
      bg.roundRect(0, 0, w, h, 12).fill({ color: enabled ? (hov ? C.brassLight : C.brassDark) : 0x2a2d55 });
      bg.roundRect(1.5, 1.5, w - 3, h - 3, 11).fill(enabled ? grad([[0, hov ? 0x4c55ad : 0x363d88], [1, hov ? 0x2f367c : 0x232859]]) : { color: 0x161940 });
      if (enabled) bg.roundRect(1.5, 1.5, 6, h - 3, 3).fill({ color: tagCol, alpha: hov ? 0.95 : 0.55 });
      if (enabled && hov) bg.roundRect(0, 0, w, h, 12).stroke({ width: 2, color: C.brassLight, alpha: 0.9 });
    };
    row.paint(false);
    const nb = new Graphics(); nb.circle(0, 0, 14).fill({ color: enabled ? C.mustard : 0x3b3f78 }); nb.circle(0, 0, 14).stroke({ width: 2, color: C.brassDark }); nb.x = 28; nb.y = h / 2; row.addChild(nb);
    const nl = new Label({ text: String(i + 1), preset: 'num', size: 14, color: enabled ? C.textInk : C.textDim }); nl.x = 28 - nl.textWidth / 2; nl.y = h / 2 - nl.textHeight / 2; row.addChild(nl);
    if (tag) { const ic = ico(tag.icon, 20, enabled ? tagCol : C.textDim); ic.x = numW + 10; ic.y = h / 2 - 10; row.addChild(ic); Tooltip.attach(ic, { title: tag.text, body: 'The style of this approach.' }); }
    const blockH = lab.textHeight + subH; lab.x = textX; lab.y = (h - blockH) / 2; row.addChild(lab);
    if (subs) { subs.x = textX; subs.y = lab.y + lab.textHeight + 2; row.addChild(subs); }
    if (reasonL) { reasonL.x = textX; reasonL.y = lab.y + lab.textHeight + 2; row.addChild(reasonL); }
    if (!enabled) { const lk = ico('lock', 18, C.mustard); lk.x = w - 30; lk.y = h / 2 - 9; row.addChild(lk); }
    if (ch.odds != null) {
      const pct = Math.round(ch.odds * 100); const col = pct >= 70 ? C.good : pct >= 40 ? C.mustard : C.coral;
      const off = ch.skill ? bestOfficer(state, ch.skill) : null;
      const pw = 62;
      const g = new Graphics(); g.roundRect(0, 0, pw, 28, 14).fill({ color: 0x070815, alpha: 0.9 }); g.roundRect(0, 0, pw, 28, 14).stroke({ width: 2, color: col });
      // odds fill meter
      g.roundRect(4, 21, (pw - 8) * ch.odds, 3, 1.5).fill({ color: col });
      const pl = new Label({ text: pct + '%', preset: 'num', size: 15, color: col }); pl.x = (pw - pl.textWidth) / 2; pl.y = 3;
      const pc = new Container(); pc.addChild(g, pl); pc.x = w - pw - 12; pc.y = (h - 28) / 2; row.addChild(pc);
      pc.eventMode = 'static';
      Tooltip.attach(pc, { title: `${pct}% chance`, rows: [['Skill', cap(ch.skill || '')], ['Officer', off && off.v > 0 ? `${off.c.name} (${off.v})` : 'none'], ['Odds', pct + '%', pct >= 70 ? 'good' : pct >= 40 ? 'warn' : 'bad']], footer: 'Failure is never fatal — just interesting.', tone: pct >= 70 ? 'good' : pct >= 40 ? 'warn' : 'bad' });
    }
    row.flash = () => { const f = new Graphics().roundRect(0, 0, w, h, 12).fill({ color: 0xffffff, alpha: 0.5 }); row.addChild(f); Anim.to(f, { alpha: 0 }, 300, { onDone: () => f.destroy() }); };
    row.on('pointerover', () => { if (this.locked) return; this.setCursor(i); if (enabled) sfx('hover'); });
    row.on('pointerout', () => { if (this.cursor === i) this.setCursor(-1); });
    row.on('pointertap', () => { if (Input.clickAllowed()) this.choose(i); });
    return row;
  }
}
