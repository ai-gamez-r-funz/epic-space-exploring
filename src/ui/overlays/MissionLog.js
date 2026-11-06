import { Container, Graphics } from 'pixi.js';
import { Overlay } from './Overlay.js';
import { C } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Button } from '../kit/Button.js';
import { Tabs } from '../kit/Tabs.js';
import { ScrollList, ScrollPane } from '../kit/Scroll.js';
import { Modal } from '../kit/Modal.js';
import { arcSeg } from '../kit/draw.js';
import { S } from '../services.js';
import { cap, pretty, factionName, factionColour, heading, chip, rewardLines, addText, slimBar } from './parts2/common.js';

const KIND_ICON = { delivery: 'cargo', survey: 'scan', investigate: 'science', ferry: 'crew', relief: 'medicine', diplomacy: 'diplomacy', fetch: 'cargo', story: 'star' };
const LOG_KINDS = [['all', 'All'], ['nav', 'Travel'], ['event', 'Events'], ['trade', 'Trade'], ['mission', 'Missions'], ['crew', 'Crew'], ['discovery', 'Discoveries'], ['ship', 'Ship']];
const KIND_COL = { nav: C.tealLight, event: C.cream, trade: C.mustard, mission: C.brassLight, crew: 0xe58fb0, discovery: C.good, ship: C.sage };
const hashStr = (s) => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h) % 997; };
const progressOf = (m) => { const o = (m.objectives || []); const req = o.filter((x) => !x.optional); const list = req.length ? req : o; return { done: list.filter((x) => x.done).length, n: list.length }; };

/** MissionLog — Active / Board / Done missions, Captain's Log (filterable) and Survey summary. */
export class MissionLog extends Overlay {
  title = "SHIP'S LOG & MISSIONS"; size = { w: 1100, h: 640 };
  build(modal, params = {}) {
    const g = this.game; this.sel = {}; this.logKind = 'all';
    this.tabs = new Tabs({ w: modal.bodyW, selected: params.tab || 'active', cycleKeys: true, tabW: 200, onChange: () => this.ui.sfx('page'),
      tabs: [{ id: 'active', label: 'Active', icon: 'mission' }, { id: 'board', label: 'Board', icon: 'station' }, { id: 'done', label: 'Done', icon: 'check' }, { id: 'log', label: "Captain's log", icon: 'log' }, { id: 'survey', label: 'Survey', icon: 'planet' }] });
    modal.body.addChild(this.tabs); this.paneH = modal.bodyH - 42 - 56; this.bw = modal.bodyW;
    this.lists = {}; this.details = {};
    for (const k of ['active', 'board', 'done']) this._buildSplit(k);
    this.logPane = new ScrollPane({ w: this.bw, h: this.paneH - 44 }); this.logPane.y = 44; this.tabs.panes.log.addChild(this.logPane);
    this.logFilters = new Container(); this.tabs.panes.log.addChild(this.logFilters);
    this.surveyPane = new ScrollPane({ w: this.bw, h: this.paneH }); this.tabs.panes.survey.addChild(this.surveyPane);
    modal.addButtons([{ label: 'Close', onClick: () => modal.close(), hotkey: 'Enter', variant: 'primary', w: 140 }]);
    this.watch(() => this.refresh()); this.refresh();
    void g;
  }
  _buildSplit(k) {
    const lw = 340;
    const list = new ScrollList({ w: lw, h: this.paneH, itemH: 66, gap: 6, items: [], onSelect: (it) => { this.sel[k] = it.id; this._renderDetail(k); }, render: (it, i, w, h) => this._row(it, w, h, k) });
    const det = new ScrollPane({ w: this.bw - lw - 16, h: this.paneH }); det.x = lw + 16;
    this.tabs.panes[k].addChild(list, det); this.lists[k] = list; this.details[k] = det;
  }
  refresh() {
    if (!this.modal || this.modal.destroyed) return;
    for (const k of ['active', 'board', 'done']) {
      const items = this._items(k); this.lists[k].setItems(items);
      if (!items.some((i) => i.id === this.sel[k])) this.sel[k] = items[0]?.id;
      this.lists[k].select(this.sel[k]); this._renderDetail(k);
    }
    this._renderLog(); this._renderSurvey();
    const n = this.game.state.missions.active.length;
    this.tabs.buttons.active.setLabel(`Active${n ? ` (${n})` : ''}`);
  }

  // ------------------------------------------------------------------ data
  _items(k) {
    const g = this.game, st = g.state;
    if (k === 'active') return (g.activeMissions?.() || []).map((m) => ({ id: m.id, m, mode: 'active' }));
    if (k === 'board') return (this._canBoard() ? (g.missionBoard?.() || []) : []).map((m) => ({ id: m.id, m, mode: 'board' }));
    const lookup = (id) => S.content.MISSIONS?.find((x) => x.id === id || x.id === String(id).split('@')[0]);
    const mk = (id, status) => { const d = lookup(id); return { id: id + ':' + status, m: { id, title: d?.title || pretty(String(id).split('@')[0].replace(/^m_/, '')), giver: d?.giver, blurb: d?.blurb, kind: d?.kind, reward: d?.reward, arc: d?.arc, objectives: (d?.objectives || []).map((o) => ({ text: o.text, done: status === 'done' })) }, mode: 'done', status }; };
    return [...[...st.missions.done].reverse().map((id) => mk(id, 'done')), ...[...(st.missions.failed || [])].reverse().map((id) => mk(id, 'failed'))];
  }
  _canBoard() { const s = this.game.here(); return !!s?.station?.services?.includes('missions'); }
  _row(it, w, h) {
    const m = it.m, k = new Container(); const col = it.status === 'failed' ? C.coral : C.cream;
    const ic = S.gfx.icon(KIND_ICON[m.kind] || 'mission', { size: 22, color: it.status === 'failed' ? C.coral : m.arc === 'main' ? C.mustard : C.tealLight }); ic.x = 12; ic.y = 12; k.addChild(ic);
    const t = new Label({ text: m.title, preset: 'bodyB', size: 16, color: col, w: w - 118, fit: true, h: 20 }); t.x = 46; t.y = 8; k.addChild(t);
    let sub = m.giver?.name || cap(m.kind || '');
    if (it.mode === 'active' && m.deadlineDay) { const left = m.deadlineDay - this.game.state.day; sub = `${left <= 0 ? 'Due today' : left + ' day' + (left === 1 ? '' : 's') + ' left'} · ${sub}`; }
    if (it.status) sub = (it.status === 'done' ? 'Completed' : 'Failed') + ' · ' + sub;
    const s = new Label({ text: sub, preset: 'tiny', size: 12, color: C.textDim, w: w - 118, fit: true, h: 15 }); s.x = 46; s.y = 32; k.addChild(s);
    if (it.mode === 'active') { const p = progressOf(m); const pl = new Label({ text: `${p.done}/${p.n}`, preset: 'num', size: 14, color: p.done === p.n ? C.good : C.brassLight }); pl.x = w - pl.textWidth - 12; pl.y = 10; k.addChild(pl); const b = slimBar(w - 58, p.n ? p.done / p.n : 0, C.teal, 7); b.x = 46; b.y = 52; k.addChild(b); }
    else if (m.reward?.credits) { const pl = new Label({ text: `${m.reward.credits}`, preset: 'numSm', size: 12, color: C.mustard }); pl.x = w - pl.textWidth - 12; pl.y = 10; k.addChild(pl); }
    return k;
  }

  // ------------------------------------------------------------------ detail
  _renderDetail(k) {
    const pane = this.details[k], root = pane.content; root.removeChildren().forEach((c) => c.destroy({ children: true }));
    const it = this.lists[k].lo.items.find((x) => x.id === this.sel[k]); const W = pane.w - 14;
    if (!it) {
      const msg = k === 'active' ? 'No active missions. Dock at a station with a mission board and pick up a job.' : k === 'board' ? (this._canBoard() ? 'The board is empty for now. Check back in a few days.' : 'This system has no mission board. Mission boards hang in stations with the "missions" service.') : 'Nothing finished yet. Your first completed mission will be filed here.';
      const l = new Label({ text: msg, preset: 'body', size: 17, color: C.textDim, w: Math.min(W, 520), lineHeight: 24 }); l.y = 20; root.addChild(l); pane.refresh(); return;
    }
    const m = it.m, g = this.game, st = g.state; let y = 0;
    const gv = m.giver; const pt = S.gfx.portrait({ species: gv?.species || 'unknown', seed: hashStr(gv?.name || m.id), size: 84 }); root.addChild(pt);
    const tt = new Label({ text: m.title, preset: 'head', size: 19, color: C.cream, w: W - 110, fit: true, h: 52, upper: true }); tt.x = 104; root.addChild(tt);
    const gl = new Label({ text: gv ? `${gv.name}${gv.faction && gv.faction !== 'none' ? ' · ' + factionName(gv.faction) : ''}` : '', preset: 'small', size: 14, color: gv?.faction ? factionColour(gv.faction) : C.tealLight, w: W - 110, fit: true, h: 20 }); gl.x = 104; gl.y = 56; root.addChild(gl);
    const chips = []; if (m.kind) chips.push(chip(cap(m.kind), { color: C.tealLight })); if (m.arc === 'main') chips.push(chip('Main story', { color: C.mustard })); if (m.repeatable) chips.push(chip('Repeatable', { color: C.sage }));
    if (it.mode === 'active' && m.deadlineDay) { const left = m.deadlineDay - st.day; chips.push(chip(left <= 0 ? 'Due today!' : `${left} day${left === 1 ? '' : 's'} left (day ${m.deadlineDay})`, { color: left <= 3 ? C.coral : left <= 7 ? C.mustard : C.tealLight })); }
    if (it.mode === 'board') chips.push(chip(m.deadlineDays ? `${m.deadlineDays} days to finish` : 'No deadline', { color: m.deadlineDays ? C.mustard : C.sage }));
    if (it.status) chips.push(chip(it.status === 'done' ? 'Completed' : 'Failed', { color: it.status === 'done' ? C.good : C.coral }));
    let cx = 104; for (const c of chips) { c.x = cx; c.y = 80; root.addChild(c); cx += c.w + 8; }
    y = 112;
    y = addText(root, y, m.blurb || '', { w: W, color: C.cream, size: 15, lineHeight: 21, gap: 14 });
    const p = progressOf(m); const h1 = heading(it.mode === 'board' ? 'Objectives' : `Objectives  ${p.done}/${p.n}`); h1.y = y; root.addChild(h1); y += 24;
    for (const o of (m.objectives || [])) {
      const row = new Container(); row.y = y; root.addChild(row);
      const box = new Graphics().roundRect(0, 2, 20, 20, 5).fill({ color: o.done ? C.good : 0x0b0d1e, alpha: o.done ? 0.9 : 0.8 }).roundRect(0, 2, 20, 20, 5).stroke({ width: 1.5, color: o.done ? C.good : C.brassDark }); row.addChild(box);
      if (o.done) { const ck = S.gfx.icon('check', { size: 14, color: 0x10132b }); ck.x = 3; ck.y = 5; row.addChild(ck); }
      const l = new Label({ text: o.text + (o.optional ? '  (optional)' : ''), preset: 'small', size: 15, color: o.done ? C.textDim : C.cream, w: W - 34, lineHeight: 20 }); l.x = 30; l.y = 2; row.addChild(l);
      y += Math.max(26, l.textHeight + 8);
    }
    y += 10; const h2 = heading('Reward'); h2.y = y; root.addChild(h2); y += 24;
    const rl = rewardLines(m.reward);
    if (!rl.length) y = addText(root, y, 'The Society\'s thanks.', { w: W, color: C.textDim });
    else { let rx = 0; for (const r of rl) { const ic = S.gfx.icon(r.icon, { size: 16, color: r.color }); const l = new Label({ text: r.text, preset: 'small', size: 15, color: r.color }); const w = 24 + l.textWidth + 18; if (rx + w > W) { rx = 0; y += 28; } ic.x = rx; ic.y = y + 2; l.x = rx + 24; l.y = y; root.addChild(ic, l); rx += w; } y += 38; }
    // actions
    const pend = !!st.pending;
    if (it.mode === 'active') {
      const targets = [...new Set((m.objectives || []).filter((o) => !o.done && o.target).map((o) => o.target))].filter((id) => g.system(id) && g.system(id).status !== 'unknown');
      const map = new Button({ label: 'Show on map', icon: 'star', w: 230, h: 46, variant: 'teal', disabled: !targets.length, disabledReason: 'The destination is not on your charts yet.', onClick: () => { this.close(); this.ui.showOnMap?.(targets, m.title); } }); map.y = y; root.addChild(map);
      const ab = new Button({ label: 'Abandon', icon: 'close', w: 160, h: 46, variant: 'dark', disabled: pend, disabledReason: 'Resolve the current event first.', onClick: () => this._abandon(m) }); ab.x = 244; ab.y = y; root.addChild(ab);
      if (m.arc === 'main') { const n = new Label({ text: 'Main story missions cannot be lost, only delayed.', preset: 'tiny', size: 12, color: C.textDim }); n.x = 420; n.y = y + 16; root.addChild(n); }
    } else if (it.mode === 'board') {
      const full = st.missions.active.length >= 6; const reason = !st.docked ? 'Dock at the station to accept jobs.' : full ? 'Your mission log is full (6). Finish or abandon one.' : pend ? 'Resolve the current event first.' : '';
      const ac = new Button({ label: 'Accept mission', icon: 'mission', w: 220, h: 48, variant: 'primary', disabled: !!reason, disabledReason: reason, onClick: () => this._accept(m) }); ac.y = y; root.addChild(ac);
    }
    pane.refresh();
  }
  _accept(m) {
    const r = this.game.acceptMission(m.id);
    if (r?.ok === false) { this.ui.toast(r.reason || 'That job is no longer available.', 'warn'); this.ui.sfx('deny'); return; }
    if (r?.accept) this.ui.toast(r.accept, 'good', { ms: 6000 });
    this.tabs.select('active'); this.sel.active = m.id; this.refresh();
  }
  async _abandon(m) {
    const ok = await Modal.confirm(`Abandon "${m.title}"? The giver will be understanding, but any progress is lost.`, { title: 'ABANDON MISSION', yes: 'Abandon', no: 'Keep it' });
    if (!ok) return; const r = this.game.abandonMission(m.id);
    if (r?.ok === false) this.ui.toast(r.reason || 'Could not abandon that.', 'warn');
  }

  // ------------------------------------------------------------------ captain's log
  _renderLog() {
    const f = this.logFilters; f.removeChildren().forEach((c) => c.destroy({ children: true }));
    let x = 0; const counts = {}; for (const e of this.game.state.log || []) counts[e.kind] = (counts[e.kind] || 0) + 1;
    for (const [id, label] of LOG_KINDS) {
      const b = new Button({ label, w: id === 'discovery' ? 130 : 100, h: 34, fontSize: 13, variant: this.logKind === id ? 'brass' : 'ghost', selected: this.logKind === id, upper: false, onClick: () => { this.logKind = id; this._renderLog(); } });
      b.x = x; f.addChild(b); x += b.w + 6;
    }
    const root = this.logPane.content; root.removeChildren().forEach((c) => c.destroy({ children: true }));
    const all = [...(this.game.state.log || [])].reverse().filter((e) => this.logKind === 'all' || e.kind === this.logKind).slice(0, 400);
    if (!all.length) { const l = new Label({ text: 'Nothing logged under this heading yet.', preset: 'body', size: 17, color: C.textDim }); l.y = 12; root.addChild(l); this.logPane.refresh(); return; }
    let y = 0, lastDay = null;
    for (const e of all) {
      if (e.day !== lastDay) { lastDay = e.day; const d = new Label({ text: `DAY ${e.day}`, preset: 'headSm', size: 11, color: C.brassLight }); d.y = y + 6; root.addChild(d); root.addChild(new Graphics().rect(70, y + 13, this.bw - 100, 1).fill({ color: C.brassDark, alpha: 0.7 })); y += 28; }
      const col = KIND_COL[e.kind] || C.cream; const dot = new Graphics().circle(6, 11, 4.5).fill(col); dot.x = 8; dot.y = y; root.addChild(dot);
      const k = new Label({ text: pretty(e.kind), preset: 'tiny', size: 11, color: col, upper: true }); k.x = 28; k.y = y + 5; root.addChild(k);
      const l = new Label({ text: e.text, preset: 'small', size: 15, color: C.cream, w: this.bw - 180, lineHeight: 20 }); l.x = 120; l.y = y + 2; root.addChild(l);
      y += Math.max(26, l.textHeight + 8);
    }
    this.logPane.refresh();
  }

  // ------------------------------------------------------------------ survey
  _renderSurvey() {
    const root = this.surveyPane.content; root.removeChildren().forEach((c) => c.destroy({ children: true }));
    const g = this.game, st = g.state; const sv = g.surveyProgress?.() || { charted: 0, total: 1, pct: 0, planetsScanned: 0, planetsTotal: 0, score: 0 };
    // ring
    const r = 78, cx = 100, cy = 100; const ring = new Graphics(); root.addChild(ring);
    ring.circle(cx, cy, r).stroke({ width: 18, color: 0x05060f }); ring.circle(cx, cy, r).stroke({ width: 12, color: 0x1c2050 });
    if (sv.pct > 0) arcSeg(ring, cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (sv.pct / 100) * Math.PI * 2).stroke({ width: 12, color: C.tealLight, cap: 'round' });
    const big = new Label({ text: `${sv.pct}%`, preset: 'display', size: 44, color: C.cream, shadow: true }); big.x = cx - big.textWidth / 2; big.y = cy - 30; root.addChild(big);
    const bl = new Label({ text: 'CHARTED', preset: 'headSm', size: 10, color: C.tealLight }); bl.x = cx - bl.textWidth / 2; bl.y = cy + 22; root.addChild(bl);
    const rank = g.rank?.(); if (rank) { const rl = new Label({ text: rank, preset: 'bodyB', size: 17, color: C.mustard, w: 210, align: 'center' }); rl.x = cx - 105; rl.y = 200; root.addChild(rl); }
    const stats = [['Systems charted', `${sv.charted} / ${sv.total}`], ['Planets scanned', `${sv.planetsScanned} / ${sv.planetsTotal}`], ['Survey score', sv.score], ['Codex entries', `${st.codex.length} / ${S.content.CODEX?.length || '?'}`],
      ['Jumps made', st.stats.jumps || 0], ['Missions done', st.stats.missionsDone || 0], ['Scrip earned', st.stats.creditsEarned || 0], ['Events seen', st.stats.eventsSeen || 0], ['Days elapsed', st.day]];
    stats.forEach(([k, v], i) => {
      const col = i % 3, row = Math.floor(i / 3); const x = 250 + col * 270, y = 10 + row * 72;
      root.addChild(new Graphics().roundRect(x, y, 256, 62, 10).fill({ color: 0x0b0d1e, alpha: 0.45 }).roundRect(x, y, 256, 62, 10).stroke({ width: 1.2, color: C.brassDark }));
      const kl = new Label({ text: k, preset: 'tiny', size: 12, color: C.textDim, upper: true }); kl.x = x + 14; kl.y = y + 9; root.addChild(kl);
      const vl = new Label({ text: String(v), preset: 'num', size: 22, color: C.cream }); vl.x = x + 14; vl.y = y + 28; root.addChild(vl);
    });
    // regions
    let y = 292; const h = heading('Regions charted'); h.y = y; root.addChild(h); y += 26;
    const regs = S.content.REGIONS || {}; const by = {};
    for (const s of st.galaxy.systems) { const r0 = (by[s.region] ||= { total: 0, charted: 0, known: 0, planets: 0, scanned: 0 }); r0.total++; if (s.status === 'charted') r0.charted++; if (s.status !== 'unknown') r0.known++; for (const p of s.planets) { r0.planets++; if (p.scanned) r0.scanned++; } }
    const ids = Object.keys(regs).filter((id) => by[id]).concat(Object.keys(by).filter((id) => !regs[id]));
    ids.forEach((id, i) => {
      const r0 = by[id], def = regs[id] || { name: pretty(id), colour: C.teal }; const col = def.colour ?? C.teal; const seen = r0.known > 0;
      const x = (i % 2) * 520, yy = y + Math.floor(i / 2) * 64;
      root.addChild(new Graphics().roundRect(x, yy, 506, 56, 10).fill({ color: 0x0b0d1e, alpha: 0.4 }));
      root.addChild(new Graphics().roundRect(x, yy + 8, 5, 40, 2.5).fill(seen ? col : 0x3a3f6a));
      const nl = new Label({ text: seen ? def.name : '??? Uncharted region', preset: 'bodyB', size: 16, color: seen ? C.cream : C.textDim, w: 280, fit: true, h: 20 }); nl.x = x + 18; nl.y = yy + 7; root.addChild(nl);
      const sl = new Label({ text: seen ? `${r0.charted}/${r0.total} systems · ${r0.scanned}/${r0.planets} planets` : 'Not yet detected', preset: 'tiny', size: 12, color: C.textDim }); sl.x = x + 18; sl.y = yy + 32; root.addChild(sl);
      if (seen) { const b = slimBar(150, r0.total ? r0.charted / r0.total : 0, col, 10); b.x = x + 340; b.y = yy + 12; root.addChild(b); const pl = new Label({ text: `${Math.round(100 * r0.charted / r0.total)}%`, preset: 'numSm', size: 12, color: C.cream }); pl.x = x + 340 + 152 - pl.textWidth; pl.y = yy + 28; root.addChild(pl); }
    });
    this.surveyPane.refresh();
  }
}
