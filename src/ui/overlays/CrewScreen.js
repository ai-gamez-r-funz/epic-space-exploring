import { Container, Graphics } from 'pixi.js';
import { Overlay } from './Overlay.js';
import { C, MOOD_COLORS } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Button } from '../kit/Button.js';
import { Tabs } from '../kit/Tabs.js';
import { ScrollList, ScrollPane } from '../kit/Scroll.js';
import { Tooltip } from '../kit/Tooltip.js';
import { Modal } from '../kit/Modal.js';
import { Input } from '../kit/input.js';
import { S } from '../services.js';
import { SKILLS, cap, pretty, factionName, heading, pips, chip, slimBar, moodWord, crewPortrait, addText } from './parts2/common.js';

const MAX_CREW = 8;
const traitOf = (id) => S.content.TRAITS?.[id] || { id, name: pretty(id || 'none'), desc: '', effect: '' };

/** CrewScreen — roster with portraits/skills/traits/mood/xp, talk, dismiss; coverage matrix; hire tab at crew-service stations. */
export class CrewScreen extends Overlay {
  title = 'CREW'; size = { w: 1100, h: 640 };
  build(modal, params = {}) {
    this.sel = params.crewId || this.game.state.crew[0]?.id; this.msgs = {};
    const g = this.game; this.canHire = !!g.here()?.station?.services?.includes('crew');
    const tabs = [{ id: 'roster', label: 'Roster', icon: 'crew' }, { id: 'cover', label: 'Skill coverage', icon: 'science' }];
    if (this.canHire) tabs.push({ id: 'hire', label: 'Hire', icon: 'star' });
    this.tabs = new Tabs({ w: modal.bodyW, tabs, selected: params.tab || 'roster', cycleKeys: true, tabW: 190, onChange: () => this._sfxTab() });
    modal.body.addChild(this.tabs);
    this.paneH = modal.bodyH - 42 - 56;
    this._buildRoster(this.tabs.panes.roster, modal.bodyW); this._buildCover(this.tabs.panes.cover, modal.bodyW);
    if (this.canHire) this._buildHire(this.tabs.panes.hire, modal.bodyW);
    this.summary = new Label({ text: '', preset: 'small', size: 14, color: C.textDim, w: 420 }); this.summary.y = modal.bodyH - 34; modal.body.addChild(this.summary);
    modal.addButtons([{ label: 'Close', onClick: () => modal.close(), hotkey: 'Enter', variant: 'primary', w: 140 }]);
    Input.bind(modal.body, 'ArrowDown', () => this._step(1)); Input.bind(modal.body, 'ArrowUp', () => this._step(-1));
    this.watch(() => this.refresh());
    this.refresh();
  }
  _sfxTab() { try { S.audio.sfx('page'); } catch (e) { /* */ } }
  _step(d) { const cr = this.game.state.crew; const i = cr.findIndex((c) => c.id === this.sel); const n = cr[(i + d + cr.length) % cr.length]; if (n) { this.sel = n.id; this.list.select(n.id); this._detail(); } }
  refresh() {
    if (!this.modal || this.modal.destroyed) return;
    const g = this.game, cr = g.state.crew;
    if (!cr.some((c) => c.id === this.sel)) this.sel = cr[0]?.id;
    this.list.setItems(this._items()); this.list.select(this.sel);
    this._detail(); this._cover(); if (this.canHire) this._hire();
    this.summary.setText(`${cr.length}/${MAX_CREW} berths in use  ·  ${Math.round(g.state.credits)} scrip`);
  }
  _items() { return this.game.state.crew.map((c) => ({ id: c.id, c })); }

  // ------------------------------------------------------------------ roster
  _buildRoster(pane, bw) {
    const lw = 330; this.list = new ScrollList({ w: lw, h: this.paneH, itemH: 74, gap: 6, items: this._items(), selected: this.sel, onSelect: (it) => { this.sel = it.id; this._detail(); },
      render: (it, i, w, h) => {
        const c = it.c, k = new Container(); const p = crewPortrait(c, 54); p.x = 10; p.y = 10; k.addChild(p);
        const n = new Label({ text: c.name, preset: 'bodyB', size: 16, color: C.cream, w: w - 160, fit: true, h: 20 }); n.x = 76; n.y = 8; k.addChild(n);
        const ic = S.gfx.icon(c.role, { size: 16, color: C.tealLight }); ic.x = 76; ic.y = 31; k.addChild(ic);
        const r = new Label({ text: `${cap(c.role)} · ${cap(c.species)}`, preset: 'tiny', size: 12, color: C.textDim, w: w - 190, fit: true, h: 15 }); r.x = 96; r.y = 32; k.addChild(r);
        const mb = slimBar(w - 150, c.mood / 100, MOOD_COLORS(c.mood), 8); mb.x = 76; mb.y = 54; k.addChild(mb);
        const lv = new Label({ text: `LV ${c.level || 1}`, preset: 'numSm', size: 12, color: C.brassLight }); lv.x = w - lv.textWidth - 12; lv.y = 10; k.addChild(lv);
        const mw = new Label({ text: Math.round(c.mood) + '', preset: 'numSm', size: 11, color: MOOD_COLORS(c.mood) }); mw.x = w - mw.textWidth - 12; mw.y = 50; k.addChild(mw);
        return k;
      } });
    pane.addChild(this.list);
    this.dpane = new ScrollPane({ w: bw - lw - 16, h: this.paneH }); this.dpane.x = lw + 16; pane.addChild(this.dpane);
  }
  _detail() {
    const root = this.dpane.content; root.removeChildren().forEach((c) => c.destroy({ children: true }));
    const g = this.game, st = g.state, c = st.crew.find((x) => x.id === this.sel); if (!c) { this.dpane.refresh(); return; }
    const W = this.dpane.w - 14; const bon = g.shipStats?.().bonuses || {};
    const p = crewPortrait(c, 120); root.addChild(p);
    const nm = new Label({ text: c.name, preset: 'head', size: 20, color: C.cream, w: W - 150, fit: true, h: 26, upper: true }); nm.x = 142; nm.y = 0; root.addChild(nm);
    const sub = new Label({ text: `${cap(c.species)}  ·  ${cap(c.role)} officer`, preset: 'small', size: 15, color: C.tealLight }); sub.x = 142; sub.y = 32; root.addChild(sub);
    const need = 5 * (c.level || 1); const maxed = (c.level || 1) >= 6;
    const lv = new Label({ text: `LEVEL ${c.level || 1}`, preset: 'headSm', size: 11, color: C.brassLight }); lv.x = 142; lv.y = 62; root.addChild(lv);
    const xb = slimBar(240, maxed ? 1 : (c.xp || 0) / need, C.brass, 10); xb.x = 230; xb.y = 61; root.addChild(xb);
    const xl = new Label({ text: maxed ? 'MAX' : `${c.xp || 0} / ${need} xp`, preset: 'numSm', size: 11, color: C.textDim }); xl.x = 480; xl.y = 60; root.addChild(xl);
    const ml = new Label({ text: 'MOOD', preset: 'headSm', size: 11, color: C.brassLight }); ml.x = 142; ml.y = 90; root.addChild(ml);
    const mb = slimBar(240, c.mood / 100, MOOD_COLORS(c.mood), 10); mb.x = 230; mb.y = 89; root.addChild(mb);
    const mw = new Label({ text: `${moodWord(c.mood)} (${Math.round(c.mood)})`, preset: 'numSm', size: 11, color: MOOD_COLORS(c.mood) }); mw.x = 480; mw.y = 88; root.addChild(mw);
    let y = 138;
    const h1 = heading('Skills'); h1.y = y; root.addChild(h1);
    const lg = new Label({ text: '●  crew skill      ◆  ship bonus (shared by all)', preset: 'tiny', size: 12, color: C.textDim }); lg.x = W - lg.textWidth - 6; lg.y = y - 1; root.addChild(lg);
    y += 24;
    for (const sk of SKILLS) {
      const v = c.skills?.[sk] || 0; const b = bon[sk] || 0; const bestV = Math.max(...st.crew.map((x) => x.skills?.[sk] || 0)); const best = v > 0 && v === bestV;
      const row = new Container(); row.y = y; root.addChild(row);
      row.addChild(new Graphics().roundRect(0, 0, W, 32, 8).fill({ color: 0x0b0d1e, alpha: 0.35 }));
      const ic = S.gfx.icon(sk, { size: 20, color: v ? C.tealLight : C.textDim }); ic.x = 8; ic.y = 6; row.addChild(ic);
      const l = new Label({ text: cap(sk), preset: 'small', size: 15, color: v ? C.cream : C.textDim }); l.x = 40; l.y = 6; row.addChild(l);
      const pp = pips(v, b, { size: 7 }); pp.x = 170; pp.y = 9; row.addChild(pp);
      const tot = new Label({ text: `= ${v + b}`, preset: 'num', size: 14, color: C.brassLight }); tot.x = 340; tot.y = 6; row.addChild(tot);
      if (b) { const t = new Label({ text: `crew ${v} + ship ${b}`, preset: 'tiny', size: 12, color: C.tealLight }); t.x = 400; t.y = 9; row.addChild(t); }
      if (best) { const s = chip('★ best aboard', { color: C.mustard, h: 20, size: 11 }); s.x = W - s.w - 6; s.y = 6; row.addChild(s); }
      y += 36;
    }
    if (c.mood < 25) y = addText(root, y + 2, 'Sulking: -1 to every skill until their mood recovers. A chat might help.', { w: W, color: C.coral, size: 14 });
    y += 8;
    const tr = traitOf(c.trait); const h2 = heading('Trait'); h2.y = y; root.addChild(h2); y += 22;
    const tn = new Label({ text: tr.name, preset: 'bodyB', size: 18, color: C.mustard }); tn.y = y; root.addChild(tn); y += 26;
    y = addText(root, y, tr.desc, { w: W, color: C.cream, size: 15, preset: 'small' });
    if (tr.effect) { const e = chip(tr.effect, { color: C.tealLight, h: 24, size: 12 }); e.y = y; root.addChild(e); y += 32; }
    y += 6; const h3 = heading('About'); h3.y = y; root.addChild(h3); y += 22;
    y = addText(root, y, c.bio || '—', { w: W, color: C.cream, size: 15, lineHeight: 21, gap: 14 });
    // actions
    const cd = this._talkCooldown(c); const pend = !!st.pending;
    const talk = new Button({ label: 'Talk', icon: 'hail', w: 170, h: 46, variant: 'teal', onClick: () => this._talk(c), disabled: pend || cd > 0, disabledReason: pend ? 'Resolve the current event first.' : `${c.name.split(' ')[0]} could use some quiet first (${cd} more day${cd === 1 ? '' : 's'}).`,
      tooltip: { title: 'Have a chat', body: 'A quiet word lifts their mood and sometimes starts a little story. Once every 5 days per person.' } });
    talk.y = y; root.addChild(talk);
    const small = st.crew.length <= 2;
    const dis = new Button({ label: 'Dismiss', icon: 'close', w: 150, h: 46, variant: 'dark', disabled: small || pend, disabledReason: small ? 'You need at least two crew to run the ship.' : 'Resolve the current event first.', onClick: () => this._dismiss(c),
      tooltip: { title: 'Dismiss from crew', body: 'They leave with warm wishes. The others will miss them a little (-4 mood).' } });
    dis.x = 184; dis.y = y; root.addChild(dis);
    const m = this.msgs[c.id]; if (m) { const t = new Label({ text: m.text, preset: 'small', size: 15, color: m.ok ? C.good : C.coral, w: W - 350, lineHeight: 20 }); t.x = 350; t.y = y + 4; root.addChild(t); }
    this.dpane.refresh();
  }
  _talkCooldown(c) { const t = this.game.state.counters?.['talk_' + c.id]; return t ? Math.max(0, 5 - (this.game.state.day - t)) : 0; }
  _talk(c) {
    const r = this.game.crewTalk(c.id);
    this.msgs[c.id] = r?.ok === false ? { ok: false, text: r.reason || 'They are busy right now.' } : { ok: true, text: `You share a quiet moment with ${c.name.split(' ')[0]}. Their mood lifts.` };
    this._detail();
  }
  async _dismiss(c) {
    const ok = await Modal.confirm(`Dismiss ${c.name}? They leave with warm wishes, and the rest of the crew will be a little sad.`, { title: 'DISMISS CREW', yes: 'Dismiss', no: 'Keep aboard' });
    if (!ok) return; const r = this.game.dismissCrew(c.id);
    if (r?.ok === false) this.ui.toast(r.reason || 'That did not work.', 'warn'); else this.ui.toast(`${c.name} left the crew.`, 'info');
  }

  // ------------------------------------------------------------------ coverage
  _buildCover(pane, bw) { this.cpane = new ScrollPane({ w: bw, h: this.paneH }); pane.addChild(this.cpane); }
  _cover() {
    const root = this.cpane.content; root.removeChildren().forEach((c) => c.destroy({ children: true }));
    const g = this.game, st = g.state; const colX = (i) => 270 + i * 158; const bon = g.shipStats?.().bonuses || {};
    SKILLS.forEach((sk, i) => {
      const ic = S.gfx.icon(sk, { size: 24, color: C.tealLight }); ic.x = colX(i); ic.y = 0; root.addChild(ic);
      const l = new Label({ text: cap(sk), preset: 'headSm', size: 11, color: C.brassLight, upper: true }); l.x = colX(i) + 32; l.y = 6; root.addChild(l);
    });
    let y = 36;
    st.crew.forEach((c) => {
      const row = new Container(); row.y = y; root.addChild(row);
      row.addChild(new Graphics().roundRect(0, 0, 1040, 50, 10).fill({ color: 0x0b0d1e, alpha: 0.35 }));
      const p = crewPortrait(c, 38, false); p.x = 8; p.y = 6; row.addChild(p);
      const n = new Label({ text: c.name, preset: 'bodyB', size: 15, color: C.cream, w: 190, fit: true, h: 20 }); n.x = 56; n.y = 6; row.addChild(n);
      const r = new Label({ text: `${cap(c.role)}${c.mood < 25 ? ' · sulking' : ''}`, preset: 'tiny', size: 12, color: c.mood < 25 ? C.coral : C.textDim }); r.x = 56; r.y = 28; row.addChild(r);
      SKILLS.forEach((sk, i) => {
        const v = c.skills?.[sk] || 0; const best = v > 0 && v === Math.max(...st.crew.map((x) => x.skills?.[sk] || 0));
        const pp = pips(v, 0, { size: 6, gap: 3, color: best ? C.mustard : C.creamDark }); pp.x = colX(i); pp.y = 18; row.addChild(pp);
        if (best) { const s = new Label({ text: '★', preset: 'small', size: 14, color: C.mustard }); s.x = colX(i) + pp.w + 4; s.y = 14; row.addChild(s); }
      });
      y += 56;
    });
    root.addChild(new Graphics().rect(0, y + 2, 1040, 2).fill({ color: C.brassDark, alpha: 0.8 })); y += 14;
    const rowOf = (label, fn, col) => { const l = new Label({ text: label, preset: 'headSm', size: 11, color: C.brassLight }); l.x = 8; l.y = y + 6; root.addChild(l); SKILLS.forEach((sk, i) => { const t = fn(sk); if (t instanceof Container) { t.x = colX(i); t.y = y + 4; root.addChild(t); } }); y += 34; };
    rowOf('SHIP BONUS', (sk) => { const b = bon[sk] || 0; return b ? pips(0, b, { max: 0, size: 6, gap: 3 }) : new Label({ text: '—', preset: 'small', color: C.textDim }); });
    rowOf('BEST CREW', (sk) => { const bc = st.crew.reduce((a, x) => ((x.skills?.[sk] || 0) > (a?.skills?.[sk] || 0) ? x : a), null); return new Label({ text: bc && (bc.skills?.[sk] || 0) > 0 ? bc.name.split(' ')[0] : 'nobody', preset: 'small', size: 14, color: C.cream, w: 140, fit: true, h: 20 }); });
    rowOf('TOTAL', (sk) => { let t = 0; try { t = g.skillTotal(sk); } catch (e) { /* */ } return new Label({ text: String(t), preset: 'num', size: 22, color: t >= 5 ? C.good : t >= 3 ? C.mustard : C.coral }); });
    y += 8;
    const note = new Label({ text: 'Total = your best crew member in the skill + the ship\'s upgrade bonus. Checks in events use this total, so a well-rounded crew beats a crowd of specialists. Gaps (red) are good reasons to hire.', preset: 'small', size: 14, color: C.textDim, w: 1000, lineHeight: 19 }); note.y = y; root.addChild(note);
    this.cpane.refresh();
  }

  // ------------------------------------------------------------------ hire
  _buildHire(pane, bw) { this.hpane = new ScrollPane({ w: bw, h: this.paneH }); pane.addChild(this.hpane); }
  _hire() {
    const root = this.hpane.content; root.removeChildren().forEach((c) => c.destroy({ children: true }));
    const g = this.game, st = g.state; const sys = g.here(); let y = 0;
    const intro = new Label({ text: `${sys.station.name} recruiting board — ${st.docked ? 'applicants are waiting.' : 'dock at the station to sign anyone on.'}`, preset: 'small', size: 15, color: C.tealLight, w: 1000 }); root.addChild(intro); y += 28;
    const pool = g.crewForHire?.() || [];
    if (!pool.length) { const l = new Label({ text: 'Nobody is looking for work here right now. The board changes every few weeks; check back later or at another station.', preset: 'body', size: 17, color: C.textDim, w: 900 }); l.y = y + 10; root.addChild(l); this.hpane.refresh(); return; }
    for (const row of pool) {
      const W = 1040, h = 128; const card = new Container(); card.y = y; root.addChild(card);
      card.addChild(new Graphics().roundRect(0, 0, W, h, 12).fill({ color: 0x0b0d1e, alpha: 0.45 }).roundRect(0, 0, W, h, 12).stroke({ width: 1.5, color: row.available ? C.brassDark : 0x3a3f6a }));
      const p = crewPortrait({ ...row, mood: 70 }, 92, false); p.x = 14; p.y = 18; card.addChild(p);
      const n = new Label({ text: row.name, preset: 'head', size: 16, color: C.cream, upper: true, w: 360, fit: true, h: 22 }); n.x = 122; n.y = 10; card.addChild(n);
      const sub = new Label({ text: `${cap(row.species)} · ${cap(row.role)} officer`, preset: 'small', size: 14, color: C.tealLight }); sub.x = 122; sub.y = 36; card.addChild(sub);
      const tr = traitOf(row.trait); const tl = new Label({ text: tr.name, preset: 'bodyB', size: 15, color: C.mustard }); tl.x = 122; tl.y = 58; card.addChild(tl); Tooltip.attach(tl, { title: tr.name, body: tr.desc, footer: tr.effect });
      const bio = new Label({ text: row.bio || '', preset: 'tiny', size: 13, color: C.textDim, w: 330, maxLines: 3, lineHeight: 16 }); bio.x = 122; bio.y = 80; card.addChild(bio);
      SKILLS.forEach((sk, i) => {
        const v = row.skills?.[sk] || 0; const have = Math.max(0, ...st.crew.map((x) => x.skills?.[sk] || 0));
        const cx = 480 + (i % 3) * 150, cy = 14 + Math.floor(i / 3) * 40;
        const ic = S.gfx.icon(sk, { size: 16, color: v ? C.tealLight : C.textDim }); ic.x = cx; ic.y = cy; card.addChild(ic);
        const pp = pips(v, 0, { size: 5, gap: 3 }); pp.x = cx + 22; pp.y = cy + 3; card.addChild(pp);
        if (v > have) { const u = new Label({ text: '▲ upgrade', preset: 'tiny', size: 10, color: C.good }); u.x = cx + 22; u.y = cy + 18; card.addChild(u); }
      });
      const cost = new Label({ text: `${row.hireCost} scrip`, preset: 'num', size: 18, color: st.credits >= row.hireCost ? C.mustard : C.coral }); cost.x = W - 170; cost.y = 12; card.addChild(cost);
      const btn = new Button({ label: 'Hire', icon: 'star', w: 150, h: 44, variant: 'primary', disabled: !row.available || !st.docked, disabledReason: !st.docked ? 'Dock at the station first.' : row.reason, onClick: () => this._confirmHire(row) });
      btn.x = W - 164; btn.y = 74; card.addChild(btn);
      if (!row.available) { const lk = S.gfx.icon('lock', { size: 16, color: C.warn }); lk.x = 480; lk.y = 96; card.addChild(lk); const rl = new Label({ text: row.reason, preset: 'small', size: 14, color: C.warn, w: 360, fit: true, h: 20 }); rl.x = 504; rl.y = 96; card.addChild(rl); }
      y += h + 10;
    }
    this.hpane.refresh();
  }
  async _confirmHire(row) {
    const ok = await Modal.confirm(`Sign ${row.name} aboard for ${row.hireCost} scrip? They will take a berth and join the bridge rota straight away.`, { title: 'HIRE CREW', yes: 'Hire', no: 'Not yet' });
    if (!ok) return; const r = this.game.hireCrew(row.id);
    if (r?.ok === false) { this.ui.toast(r.reason || 'Could not hire.', 'warn'); this.ui.sfx('deny'); } else { this.sel = row.id; this.tabs.select('roster'); }
  }
}
