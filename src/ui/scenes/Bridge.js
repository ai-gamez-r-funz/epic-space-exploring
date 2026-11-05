import { Container, Graphics, Rectangle } from 'pixi.js';
import { Scene } from '../Scene.js';
import { W, H, C, MOOD_COLORS } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Button, IconButton } from '../kit/Button.js';
import { Panel, Lights } from '../kit/Panel.js';
import { ScrollList } from '../kit/Scroll.js';
import { Tooltip } from '../kit/Tooltip.js';
import { Input } from '../kit/input.js';
import { Anim } from '../kit/anim.js';
import { centerOn } from '../kit/layout.js';
import { Hud, stardate } from '../widgets/Hud.js';
import { Viewscreen, PLANET_NAMES, PHEN_NAMES, STAR_NAMES } from '../widgets/Viewscreen.js';
import { S, sfx } from '../services.js';

const HINTS = [
  'Click a planet on the viewscreen, then Orbit (O) and Scan (S).',
  'Open the Chart (C) to plan your next jump. Mind the fuel.',
  'Charting a system means scanning every planet in it.',
  'Hail (H) the locals — it costs nothing but a little courtesy.',
  'Dock (D) at a station to trade, repair and refuel.',
  'Rest (Z) a day to lift morale — it uses supplies.',
];

export class Bridge extends Scene {
  static scene = 'Bridge';
  async enter(params = {}) {
    const g = this.game, v = this.view;
    this.bg = new Graphics().rect(0, 0, W, H).fill(C.deep); v.addChild(this.bg);
    const grid = new Graphics(); for (let y = 0; y < H; y += 24) grid.rect(0, y, W, 1).fill({ color: 0x1b1f4a, alpha: 0.35 }); v.addChild(grid);
    this.hud = new Hud(this.ui); v.addChild(this.hud);
    // viewscreen
    this.vs = new Viewscreen({ w: 710, h: 470, onSelect: (sel) => { this.sel = sel; this.refresh(); } }); this.vs.x = 170; this.vs.y = 64; v.addChild(this.vs);
    this._buildCrew(); this._buildSidebar(); this._buildStrip(); this._buildCommands();
    this.sysId = null; this.sel = null; this.t = 0; this.hintI = 0;
    this._load(params.arrived !== false && !!params.arrive);
    this.onChanged(() => this.refresh());
    Input.bind(v, ['F1', '?'], () => this.ui.openOverlay('Help'));
    if (g.state.pending) setTimeout(() => this.ui.openEvent(), 50);
    if (params.arrive) this._banner();
  }
  onOverlayClosed() { this.refresh(); }

  // ---------------------------------------------------------------- layout pieces
  _buildCrew() {
    const P = this.crewPanel = new Panel({ w: 150, h: 470, title: 'CREW', tone: 'deep', pad: 10, lights: false }); P.x = 12; P.y = 64; this.view.addChild(P);
    this.crewBox = new Container(); P.content.addChild(this.crewBox);
  }
  _buildSidebar() {
    const P = this.side = new Panel({ w: 376, h: 470, title: 'SYSTEM', tone: 'indigo', pad: 14, lights: true }); P.x = 892; P.y = 64; this.view.addChild(P);
    const c = P.content; this.sysName = new Label({ text: '', preset: 'head', size: 18, color: C.cream, w: 340, fit: true, h: 24, upper: true }); c.addChild(this.sysName);
    this.sysSub = new Label({ text: '', preset: 'tiny', size: 13, color: C.tealLight, w: 340, fit: true, h: 16 }); this.sysSub.y = 28; c.addChild(this.sysSub);
    this.list = new ScrollList({ w: 346, h: 190, itemH: 42, gap: 4, items: [], onSelect: (it) => this.pickFromList(it) }); this.list.y = 56; c.addChild(this.list);
    this.detail = new Container(); this.detail.y = 258; c.addChild(this.detail);
    const sep = new Graphics().rect(0, 250, 346, 2).fill({ color: C.brassDark, alpha: 0.7 }); c.addChild(sep);
  }
  _buildStrip() {
    const P = this.strip = new Panel({ w: 1264, h: 32, tone: 'deep', radius: 12, pad: 0, shadow: false }); P.x = 8; P.y = 542; this.view.addChild(P);
    const lights = new Lights({ count: 6, r: 4, gap: 6, speed: 1 }); lights.x = 16; lights.y = 12; P.addChild(lights);
    const l2 = new Lights({ count: 3, r: 4, gap: 6, pattern: 'chase', colors: [C.teal, C.mustard, C.coral] }); l2.x = 1264 - 250; l2.y = 12; P.addChild(l2);
    this.stripTxt = new Label({ text: '', preset: 'mono', size: 13, color: C.tealLight, w: 760, fit: true, h: 18 }); this.stripTxt.x = 120; this.stripTxt.y = 8; P.addChild(this.stripTxt);
    this.stripState = new Label({ text: '', preset: 'tiny', size: 12, color: C.mustard, w: 230, align: 'right' }); this.stripState.x = 1264 - 480; this.stripState.y = 10; P.addChild(this.stripState);
    const small = [['codex', 'Codex (K)', 'k', () => this.ui.openOverlay('Codex')], ['supplies', 'Rest one day (Z)', 'z', () => this.act(() => this.game.rest(1))], ['settings', 'Help (F1)', null, () => this.ui.openOverlay('Help')], ['close', 'Pause (Esc)', null, () => this.ui.openPause()]];
    small.forEach(([icon, tip, hk, fn], i) => { const b = new IconButton({ icon, size: 26, variant: 'ghost', tooltip: tip, hotkey: hk || undefined, onClick: fn }); b.x = 1264 - 138 + i * 31; b.y = 3; if (b.badge) b.badge.visible = false; P.addChild(b); });
  }
  _buildCommands() {
    const P = this.cmdPanel = new Panel({ w: 1264, h: 132, tone: 'indigo', pad: 14, rivets: true }); P.x = 8; P.y = 580; this.view.addChild(P);
    const defs = [
      ['chart', 'Chart', 'star', 'c', () => this.ui.goto('GalaxyMap', {}, { kind: 'wipe', dir: 'left', ms: 350 })],
      ['orbit', 'Orbit', 'planet', 'o', () => this.doOrbit()],
      ['scan', 'Scan', 'scan', 's', () => this.doScan()],
      ['land', 'Land', 'land', 'l', () => this.doLand()],
      ['inv', 'Investigate', 'science', 'i', () => this.doInvestigate()],
      ['hail', 'Hail', 'hail', 'h', () => this.act(() => this.game.hail())],
      ['dock', 'Dock', 'dock', 'd', () => this.doDock()],
      ['trade', 'Trade', 'credits', 't', () => this.ui.openOverlay('Trade')],
      ['ship', 'Ship', 'ship', 'u', () => this.ui.openOverlay('Shipyard')],
      ['crew', 'Crew', 'crew', 'r', () => this.ui.openOverlay('CrewScreen')],
      ['log', 'Log', 'log', 'j', () => this.ui.openOverlay('MissionLog')],
    ];
    const gap = 8, bw = Math.floor((P.innerW - gap * (defs.length - 1)) / defs.length); this.cmds = {};
    defs.forEach(([id, label, icon, hk, fn], i) => {
      const b = new Button({ label, icon, hotkey: hk, w: bw, h: 100, vertical: true, variant: id === 'chart' ? 'primary' : 'brass', fontSize: 15, onClick: fn, tooltip: '' });
      b.x = i * (bw + gap); P.content.addChild(b); this.cmds[id] = b;
    });
  }

  // ---------------------------------------------------------------- state sync
  _load(arrive = false) {
    const g = this.game, sys = g.here(); this.sysId = sys.id; this.sel = null;
    this.vs.setSystem(sys, g, { arrive });
    this.refresh();
  }
  refresh() {
    const g = this.game; if (!g) return; const st = g.state, sys = g.here();
    if (sys.id !== this.sysId) { this._load(true); this._banner(); return; }
    this.hud.refresh(); this.vs.refresh(g);
    if (this.sel) this.vs.selectById(this.sel.kind, this.sel.id); else this.vs.sel = null;
    this._refreshCrew(); this._refreshSide(sys); this._refreshCommands(sys); this._refreshStrip(sys);
  }
  _refreshCrew() {
    const crew = this.game.crewList?.() || this.game.state.crew; const key = crew.map((c) => c.id + ':' + Math.round(c.mood / 10)).join(',');
    if (key === this._crewKey) return; this._crewKey = key;
    this.crewBox.removeChildren().forEach((c) => c.destroy({ children: true }));
    crew.slice(0, 6).forEach((c, i) => {
      const n = new Container(); n.y = i * 68;
      const p = S.gfx.portrait({ species: c.portrait?.species || c.species, seed: c.portrait?.seed ?? i, size: 52, mood: c.mood }); n.addChild(p);
      const ring = new Graphics(); ring.roundRect(-2, -2, 56, 56, 9).stroke({ width: 2.5, color: MOOD_COLORS(c.mood) }); n.addChild(ring);
      const nm = new Label({ text: (c.name.split(' ').slice(-1)[0] || '').split('-')[0], preset: 'small', size: 14, color: C.cream, w: 74, fit: true, h: 16 }); nm.x = 60; nm.y = 6; n.addChild(nm);
      const ic = S.gfx.icon(c.role, { size: 16, color: C.tealLight }); centerOn(ic, 68, 36); n.addChild(ic);
      const mo = new Label({ text: `${Math.round(c.mood)}`, preset: 'numSm', size: 12, color: MOOD_COLORS(c.mood) }); mo.x = 80; mo.y = 29; n.addChild(mo);
      n.eventMode = 'static'; n.cursor = 'pointer'; n.hitArea = new Rectangle(-4, -4, 138, 60); n.on('pointertap', () => this.ui.openOverlay('CrewScreen'));
      Tooltip.attach(n, { title: c.name, body: `${c.role[0].toUpperCase() + c.role.slice(1)} officer${c.trait ? ' · ' + c.trait : ''}`, rows: [['Mood', Math.round(c.mood), c.mood > 60 ? 'good' : c.mood > 30 ? 'warn' : 'bad']], footer: 'Click to open the crew roster' });
      this.crewBox.addChild(n);
    });
  }
  _items(sys) {
    const items = [];
    sys.planets.forEach((p) => items.push({ id: 'planet:' + p.id, kind: 'planet', rid: p.id, label: p.name, sub: `${PLANET_NAMES[p.type] || p.type} · ${p.landed ? 'explored' : p.scanned ? 'scanned' : 'unscanned'}`, icon: S.gfx.icon(p.landed ? 'land' : p.scanned ? 'check' : 'scan', { size: 18, color: p.landed ? C.good : p.scanned ? C.tealLight : C.mustard }) }));
    sys.phenomena.forEach((ph) => items.push({ id: 'phen:' + ph, kind: 'phen', rid: ph, label: PHEN_NAMES[ph] || ph, sub: 'Phenomenon', icon: S.gfx.icon('science', { size: 18, color: C.plum === 0 ? C.cream : 0xc9a0e0 }) }));
    if (sys.station) items.push({ id: 'station:station', kind: 'station', rid: 'station', label: sys.station.name, sub: `${sys.station.kind} station`, icon: S.gfx.icon('station', { size: 18, color: C.cream }) });
    return items;
  }
  _refreshSide(sys) {
    this.sysName.setText(sys.name); this.sysSub.setText(`${STAR_NAMES[sys.star] || sys.star} · ${sys.status}`);
    const items = this._items(sys); const key = items.map((i) => i.id + i.sub).join('|') + '|' + (this.sel ? this.sel.kind + this.sel.id : '');
    if (key !== this._listKey) {
      this._listKey = key; items.forEach((i) => { if (!items.length) return; });
      this.list.setItems(items.length ? items : [{ id: 'none', label: 'Nothing of note here.', disabled: true }]);
      this.list.select(this.sel ? `${this.sel.kind}:${this.sel.id}` : null);
      this._renderDetail(sys);
    }
  }
  pickFromList(it) {
    if (!it || it.id === 'none') return;
    this.sel = { kind: it.kind, id: it.rid }; this.vs.selectById(it.kind, it.rid); this.refresh();
  }
  _renderDetail(sys) {
    const d = this.detail; d.removeChildren().forEach((c) => c.destroy({ children: true }));
    const s = this.sel; const add = (txt, o = {}) => { const l = new Label({ text: txt, preset: 'small', size: 15, w: 346, color: C.cream, lineHeight: 20, ...o }); l.y = this._dy; this._dy += l.textHeight + (o.gap ?? 5); d.addChild(l); return l; }; this._dy = 0;
    if (!s) {
      add('Select an object on the viewscreen or in the list above to see details.', { color: C.textDim });
      if (sys.story) add('There is a story here...', { color: C.mustard }); return;
    }
    if (s.kind === 'planet') {
      const p = sys.planets.find((x) => x.id === s.id); if (!p) return;
      add(p.name, { preset: 'bodyB', size: 19, color: C.mustard });
      add(`${PLANET_NAMES[p.type] || p.type}${p.ringed ? ' · ringed' : ''}${p.moons ? ` · ${p.moons} moon${p.moons > 1 ? 's' : ''}` : ''}`, { color: C.tealLight });
      if (p.scanned) { add(`Life: ${p.life}`); if (p.features?.length) add('Features: ' + p.features.map((f) => f.replace(/_/g, ' ')).join(', '), { color: C.cream }); else add('No notable features.', { color: C.textDim }); }
      else add('Not yet scanned. Orbit and scan to learn about its life and features.', { color: C.textDim });
      if (this.game.state.orbit === p.id) add('The ship is in orbit here.', { color: C.good });
    } else if (s.kind === 'phen') {
      add(PHEN_NAMES[s.id] || s.id, { preset: 'bodyB', size: 19, color: C.mustard });
      add('A phenomenon worth studying. Use Investigate (I) to send the science team.', { color: C.cream });
    } else {
      const st = sys.station; add(st.name, { preset: 'bodyB', size: 19, color: C.mustard });
      add(`${st.kind[0].toUpperCase() + st.kind.slice(1)} station${st.faction && st.faction !== 'none' ? ' · ' + (S.content.FACTIONS?.[st.faction]?.name || st.faction) : ''}`, { color: C.tealLight });
      add('Services: ' + (st.services || []).join(', '), { color: C.cream });
      add(this.game.state.docked ? 'You are docked.' : 'Dock (D) to use the station.', { color: this.game.state.docked ? C.good : C.textDim });
    }
  }

  // ---------------------------------------------------------------- commands
  _planetTarget() {
    const st = this.game.state, sys = this.game.here();
    const id = st.orbit || (this.sel?.kind === 'planet' ? this.sel.id : null);
    return id ? sys.planets.find((p) => p.id === id) : null;
  }
  _refreshCommands(sys) {
    const st = this.game.state, c = this.cmds; const pend = !!st.pending; const docked = !!st.docked; const p = this._planetTarget();
    const set = (id, ok, reason, tip) => { c[id].setEnabled(ok, reason); c[id].setTooltip(tip); };
    const busy = pend ? 'Resolve the current event first.' : '';
    set('chart', !pend, busy, { title: 'Chart (C)', body: 'Open the galaxy map to plan a jump.' });
    const canOrbit = !pend && !docked && (st.orbit || p);
    c.orbit.setLabel(st.orbit ? 'Leave Orbit' : 'Orbit');
    set('orbit', canOrbit, busy || (docked ? 'Undock first.' : 'Select a planet first.'), { title: 'Orbit (O)', body: st.orbit ? 'Break orbit and return to open space.' : 'Take up orbit around the selected planet.' });
    const unscanned = sys.planets.filter((x) => !x.scanned);
    const scanTarget = p && !p.scanned ? p : null;
    set('scan', !pend && !docked && (scanTarget || (!p && unscanned.length)), busy || (docked ? 'Undock first.' : p && p.scanned ? 'That planet is already scanned.' : 'Every planet here is already scanned.'), { title: 'Scan (S)', body: scanTarget ? `Scan ${scanTarget.name} (1 day, a little supplies).` : 'Scan the whole system.' });
    set('land', !pend && !docked && p && p.scanned && !p.landed, busy || (docked ? 'Undock first.' : !p ? 'Select a planet first.' : !p.scanned ? 'Scan the planet before sending a landing party.' : 'Already explored.'), { title: 'Landing party (L)', body: 'Send an away team to the surface. Risky and rewarding.' });
    set('inv', !pend && sys.phenomena.length > 0, busy || 'No phenomena to investigate here.', { title: 'Investigate (I)', body: 'Study a phenomenon with the science team.' });
    set('hail', !pend && (sys.faction !== 'none' || !!sys.station), busy || 'Nobody here to hail.', { title: 'Hail (H)', body: 'Open a channel to the locals.' });
    c.dock.setLabel(docked ? 'Undock' : 'Dock'); c.dock.setIcon(docked ? 'undock' : 'dock');
    set('dock', !pend && !!sys.station, busy || 'No station in this system.', { title: 'Dock (D)', body: docked ? 'Cast off from the station.' : 'Dock to trade, repair and refuel.' });
    set('trade', !pend && docked, busy || (sys.station ? 'Dock at the station first.' : 'No station here.'), { title: 'Trade (T)', body: 'Buy and sell goods, repair, refuel.' });
    set('ship', !pend, busy, { title: 'Ship (U)', body: 'Installed systems and upgrades.' });
    set('crew', !pend, busy, { title: 'Crew (R)', body: 'Your officers.' });
    set('log', true, '', { title: 'Log (J)', body: "Captain's log and active missions." });
  }
  act(fn) {
    if (this.game.state.pending) { this.ui.openEvent(); return; }
    const r = fn(); if (r && r.ok === false) { this.ui.toast(r.reason || 'That did not work.', 'warn'); sfx('deny'); }
    return r;
  }
  doOrbit() {
    const st = this.game.state;
    if (st.orbit) { this.act(() => this.game.leaveOrbit()); return; }
    const p = this._planetTarget(); if (!p) return;
    const r = this.act(() => this.game.enterOrbit(p.id)); if (r?.ok !== false) { this.sel = { kind: 'planet', id: p.id }; sfx('confirm'); }
  }
  doScan() { const p = this._planetTarget(); if (p) this.act(() => this.game.scanPlanet(p.id)); else this.act(() => this.game.scanSystem()); }
  doLand() { const p = this._planetTarget(); if (p) this.act(() => this.game.landingParty(p.id)); }
  doInvestigate() { const sys = this.game.here(); const ph = this.sel?.kind === 'phen' ? this.sel.id : sys.phenomena[0]; this.act(() => this.game.investigate(ph)); }
  doDock() { this.act(() => (this.game.state.docked ? this.game.undock() : this.game.dock())); }

  _refreshStrip(sys) {
    const st = this.game.state; let msg;
    const last = st.log?.[st.log.length - 1];
    if (st.docked) msg = `DOCKED at ${sys.station?.name || 'station'} — services available.`;
    else if (st.orbit) msg = `ORBIT ESTABLISHED — ${sys.planets.find((p) => p.id === st.orbit)?.name || ''}.`;
    else msg = last ? `LOG D${last.day}: ${last.text}` : 'ALL SYSTEMS NOMINAL.';
    this.stripTxt.setText(msg.toUpperCase());
    this.stripState.setText(`${stardate(st.day)}  ·  ${sys.name.toUpperCase()}`);
  }
  _banner() {
    const sys = this.game.here(); const b = new Container(); b.x = 170 + 355; b.y = 64 + 235; this.view.addChild(b);
    const t = new Label({ text: sys.name.toUpperCase(), preset: 'display', size: 34, color: C.cream, shadow: true }); t.x = -t.textWidth / 2; t.y = -30;
    const s = new Label({ text: sys.visits <= 1 ? 'NEW SYSTEM LOGGED' : 'ARRIVAL', preset: 'head', size: 12, color: C.mustard, letterSpacing: 6 }); s.x = -s.textWidth / 2; s.y = 20;
    b.addChild(t, s); b.alpha = 0; Anim.to(b, { alpha: 1 }, 400).promise.then(() => Anim.wait(1400)).then(() => Anim.to(b, { alpha: 0 }, 600).promise).then(() => b.destroy({ children: true }));
  }
  update(dt) {
    this.t += dt; this.vs.update(dt);
    if (this.t > 20 + this.hintI * 0 && !this._hinted && this.game.state.stats.jumps === 0) { this._hinted = true; this.ui.toast(HINTS[0], 'info', { ms: 7000 }); }
  }
  onEscape() { this.ui.openPause(); }
}
