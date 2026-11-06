import { Container, Graphics, Rectangle } from 'pixi.js';
import { Scene } from '../Scene.js';
import { W, H, C, STAR_COLORS, mix, lighten } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Button, IconButton } from '../kit/Button.js';
import { Panel } from '../kit/Panel.js';
import { Tooltip } from '../kit/Tooltip.js';
import { Input } from '../kit/input.js';
import { Anim, Eases } from '../kit/anim.js';
import { centerOn } from '../kit/layout.js';
import { arcSeg } from '../kit/draw.js';
import { Hud } from '../widgets/Hud.js';
import { STAR_NAMES, prebakeSystem } from '../widgets/Viewscreen.js';
import { rangeNote } from '../widgets/objective.js';
import { makeBackdrop } from '../widgets/Backdrop.js';
import { S, sfx } from '../services.js';

const DANGER = ['Calm lanes', 'Some weather', 'Rough space', 'Hazardous — expect a bumpy ride'];
const hint = (n) => n;

/** Collect {systemId -> [mission titles]} by scanning active mission objectives for known system ids. */
function missionTargets(game) {
  const ids = new Set(game.state.galaxy.systems.map((s) => s.id)); const out = new Map();
  const walk = (o, title, depth) => {
    if (!o || depth > 3) return;
    if (typeof o === 'string') { if (ids.has(o)) { if (!out.has(o)) out.set(o, []); if (!out.get(o).includes(title)) out.get(o).push(title); } return; }
    if (typeof o !== 'object') return;
    for (const k of Object.keys(o)) { if (k === 'done' || k === 'text') continue; walk(o[k], title, depth + 1); }
  };
  try { for (const m of game.activeMissions?.() || []) { for (const ob of m.objectives || []) if (!ob.done) walk(ob, m.title, 0); for (const k of ['target', 'targetSystem', 'system', 'dest', 'to']) walk(m[k], m.title, 1); } } catch (e) { /* optional */ }
  return out;
}

export class GalaxyMap extends Scene {
  static scene = 'GalaxyMap';
  async enter() {
    const g = this.game, v = this.view, gal = g.state.galaxy;
    this.bg = makeBackdrop({ seed: 77, hue: 250, vignette: true }); v.addChild(this.bg);
    this.mapLayer = new Container(); this.mapLayer.eventMode = 'static'; this.mapLayer.hitArea = new Rectangle(0, 0, W, H); v.addChild(this.mapLayer);
    this.world = new Container(); this.mapLayer.addChild(this.world);
    this.tint = new Graphics(); this.lanes = new Graphics(); this.regionLabels = new Container(); this.nodeLayer = new Container(); this.fx = new Graphics(); this.shipLayer = new Container();
    this.markerLayer = new Container(); this.world.addChild(this.tint, this.regionLabels, this.lanes, this.nodeLayer, this.fx, this.markerLayer, this.shipLayer);
    this.nodes = new Map(); this.sel = null; this.t = 0; this.zoom = 0.8; this.jumping = false;
    // pan / zoom
    this.mapLayer.on('pointerdown', (e) => { if (this.jumping) return; Input.drag(e.nativeEvent, (dx, dy) => { this.world.x += dx; this.world.y += dy; this._clamp(); }, () => {}, 4); });
    this.mapLayer.on('wheel', (e) => { this.zoomAt(e.global.x, e.global.y, e.deltaY < 0 ? 1.15 : 1 / 1.15); });
    // UI
    this.hud = new Hud(this.ui); v.addChild(this.hud);
    this._buildSide(); this._buildControls();
    this.build();
    // camera: centre on ship
    const here = g.here(); this._fitKnown();
    this.select(null);
    this.onChanged(() => { if (!this.jumping) { this.build(); this.refreshSide(); this.hud.refresh(); } });
    Input.bind(v, 'Enter', () => this.planJump());
    for (const [k, dx, dy] of [['ArrowLeft', 60, 0], ['ArrowRight', -60, 0], ['ArrowUp', 0, 60], ['ArrowDown', 0, -60]]) Input.bind(v, k, () => { this.world.x += dx; this.world.y += dy; this._clamp(); });
    Input.bind(v, ['+', '='], () => this.zoomAt(W / 2, H / 2, 1.25)); Input.bind(v, ['-', '_'], () => this.zoomAt(W / 2, H / 2, 0.8));
    Input.bind(v, 'Home', () => this.centerOn(here.x, here.y, true)); Input.bind(v, 'f', () => this.centerOn(g.here().x, g.here().y, true));
    Input.bind(v, 'm', () => this.onEscape());
    Input.bind(v, 'c', () => this.onEscape());
    this.hud.refresh();
  }
  onEscape() { if (this.jumping) return; this.ui.goto('Bridge', {}, { kind: 'wipe', dir: 'right', ms: 350 }); }

  // ------------------------------------------------------------------ camera
  /** Zoom/pan so every known system is visible (C27), clamped to a comfortable zoom. */
  _fitKnown() {
    const k = this.game.state.galaxy.systems.filter((s) => s.status !== 'unknown'); const here = this.game.here();
    const xs = k.map((s) => s.x), ys = k.map((s) => s.y); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const aw = W - 130 - 360, ah = H - 150; const z = Math.max(0.55, Math.min(1.25, Math.min(aw / Math.max(260, x1 - x0 + 200), ah / Math.max(200, y1 - y0 + 200))));
    this.world.scale.set(z); const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    this.world.x = 130 + aw / 2 - cx * z; this.world.y = 80 + ah / 2 - cy * z; this._clamp(); this._applyLOD();
  }
  _clamp() {
    const gal = this.game.state.galaxy, s = this.world.scale.x; const m = 160;
    const minX = W - (gal.w + m) * s, maxX = m * s, minY = H - (gal.h + m) * s, maxY = (m + 40) * s;
    this.world.x = Math.min(maxX, Math.max(Math.min(minX, maxX), this.world.x)); this.world.y = Math.min(maxY, Math.max(Math.min(minY, maxY), this.world.y));
  }
  zoomAt(px, py, f) {
    const s0 = this.world.scale.x, s1 = Math.max(0.35, Math.min(2.4, s0 * f)); if (s1 === s0) return;
    const wx = (px - this.world.x) / s0, wy = (py - this.world.y) / s0;
    this.world.scale.set(s1); this.world.x = px - wx * s1; this.world.y = py - wy * s1; this._clamp(); this._applyLOD();
  }
  centerOn(x, y, animate = true, zoom) {
    const s = zoom ?? this.world.scale.x; const tx = W / 2 - 80 - x * s, ty = H / 2 + 20 - y * s;
    if (animate) { return Promise.all([Anim.to(this.world, { x: tx, y: ty }, 600, { ease: 'inOutCubic', onUpdate: () => this._applyLOD() }).promise, zoom ? Anim.to(this.world.scale, { x: s, y: s }, 600, { ease: 'inOutCubic' }).promise : null]); }
    this.world.scale.set(s); this.world.x = tx; this.world.y = ty; this._clamp(); this._applyLOD();
  }
  _applyLOD() {
    const sc = this.world.scale.x; const cur = this.game.state.pos; const list = [];
    for (const n of this.nodes.values()) {
      const want = n.known && (sc > 0.62 || n.sys.id === this.sel || n.hover || n.sys.id === cur);
      n.label.scale.set(Math.max(0.7, Math.min(1.3, 1 / sc))); n.label.x = -n.label.width / 2 / 1; n.label.x = -(n.label.textWidth * n.label.scale.x) / 2;
      n.label.visible = false; if (want) list.push(n);
    }
    // collision culling: higher priority labels win (current > selected > hovered > charted > visited)
    const pri = (n) => (n.sys.id === cur ? 5 : n.sys.id === this.sel ? 4 : n.hover ? 3 : n.sys.status === 'charted' ? 2 : 1);
    list.sort((a, b) => pri(b) - pri(a)); const taken = [];
    for (const n of list) {
      const w = n.label.textWidth * n.label.scale.x * sc, h = 16 * n.label.scale.y * sc; const x = n.sys.x * sc - w / 2, y = n.sys.y * sc + 18 * sc;
      if (taken.some((t) => x < t.x + t.w + 4 && t.x < x + w + 4 && y < t.y + t.h + 2 && t.y < y + h + 2) && pri(n) < 3) continue;
      taken.push({ x, y, w, h }); n.label.visible = true;
    }
    this.regionLabels.alpha = Math.max(0, Math.min(1, 1.35 - sc * 0.9));
  }

  // ------------------------------------------------------------------ build map
  build() {
    const g = this.game, st = g.state, gal = st.galaxy; const cur = st.pos;
    const known = (s) => s.status !== 'unknown'; const byId = new Map(gal.systems.map((s) => [s.id, s]));
    // region tint
    this.tint.clear(); const regs = {};
    for (const s of gal.systems) if (known(s)) {
      const col = S.content.REGIONS?.[s.region]?.colour ?? C.teal;
      for (let k = 4; k >= 1; k--) this.tint.circle(s.x, s.y, 70 + k * 38).fill({ color: col, alpha: s.status === 'detected' ? 0.018 : 0.03 });
      (regs[s.region] ||= { x: 0, y: 0, n: 0, col }).x += s.x; regs[s.region].y += s.y; regs[s.region].n++;
    }
    this.regionLabels.removeChildren().forEach((c) => c.destroy({ children: true }));
    for (const [id, r] of Object.entries(regs)) {
      const name = S.content.REGIONS?.[id]?.name || id; const l = new Label({ text: name.toUpperCase(), preset: 'display', size: 34, color: r.col, letterSpacing: 10 }); l.alpha = 0.32; l.x = r.x / r.n - l.textWidth / 2; l.y = r.y / r.n - 120; this.regionLabels.addChild(l);
    }
    // lanes
    const L = this.lanes; L.clear(); const neigh = new Map(g.neighbors(cur).map((n) => [n.id, n]));
    for (const [a, b] of gal.lanes) {
      const A = byId.get(a), B = byId.get(b); if (!known(A) || !known(B)) continue;
      const both = ['visited', 'charted'].includes(A.status) && ['visited', 'charted'].includes(B.status);
      const hot = (a === cur && neigh.has(b)) || (b === cur && neigh.has(a));
      if (both || hot) { L.moveTo(A.x, A.y).lineTo(B.x, B.y).stroke({ width: hot ? 5 : 4, color: hot ? C.teal : C.brass, alpha: hot ? 0.18 : 0.1 }); L.moveTo(A.x, A.y).lineTo(B.x, B.y).stroke({ width: hot ? 2.2 : 1.8, color: hot ? C.tealLight : C.brass, alpha: hot ? 0.9 : 0.6 }); }
      else this._dash(L, A, B, 0.38);
    }
    // nodes
    const targets = missionTargets(g);
    const seen = new Set();
    for (const s of gal.systems) {
      if (!known(s)) { const old = this.nodes.get(s.id); if (old) { old.node.destroy({ children: true }); this.nodes.delete(s.id); } continue; }
      seen.add(s.id);
      let n = this.nodes.get(s.id);
      if (!n || n.status !== s.status || n.missions !== (targets.get(s.id)?.join('|') || '')) { if (n) n.node.destroy({ children: true }); n = this._makeNode(s, targets.get(s.id)); this.nodes.set(s.id, n); this.nodeLayer.addChild(n.node); }
      n.neigh = neigh.get(s.id) || null; n.node.alpha = 1;
    }
    // distress beacon + rival markers (state.distress / state.rival; only on systems the player knows)
    this.markerLayer.removeChildren().forEach((c) => c.destroy({ children: true })); this.beacons = [];
    for (const id of this._flagSystems(st.distress)) { const s = byId.get(id); if (!s || !known(s)) continue; const dd = g.distressSignals?.()[0];
      const m = new Container(); m.x = s.x; m.y = s.y - 62; const ic = S.gfx.icon('warning', { size: 26, color: C.coral }); centerOn(ic, 0, 0); m.addChild(ic);
      const l = new Label({ text: dd ? `SOS · ${dd.daysLeft}d` : 'SOS', preset: 'headSm', size: 10, color: C.coral, shadow: true }); l.x = -l.textWidth / 2; l.y = 14; m.addChild(l);
      m.eventMode = 'static'; Tooltip.attach(m, { title: 'Distress beacon', body: dd ? `${dd.title || 'Someone needs help'} near ${dd.systemName}. ${dd.daysLeft} day(s) left to answer.` : 'Someone needs help here.', tone: 'bad' });
      this.markerLayer.addChild(m); this.beacons.push(ic); }
    for (const id of this._flagSystems(st.rival)) { const s = byId.get(id); if (!s || !known(s)) continue; const rv = g.rivalInfo?.();
      const m = new Container(); m.x = s.x + 24; m.y = s.y - 24; const ic = S.gfx.icon('ship', { size: 18, color: C.mustard }); centerOn(ic, 0, 0); m.addChild(ic);
      m.eventMode = 'static'; Tooltip.attach(m, { title: rv?.name || 'Rival trader', body: rv?.note || 'A rival free-trader works this lane.' }); this.markerLayer.addChild(m); }
    this._applyLOD(); this.curNode = this.nodes.get(cur);
  }
  _dash(g, A, B, alpha) {
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d; let p = 0;
    while (p < d) { const e = Math.min(d, p + 7); g.moveTo(A.x + ux * p, A.y + uy * p).lineTo(A.x + ux * e, A.y + uy * e); p += 13; }
    g.stroke({ width: 1.4, color: C.textDim, alpha });
  }
  _makeNode(s, missionTitles) {
    const node = new Container(); node.x = s.x; node.y = s.y;
    const full = ['visited', 'charted'].includes(s.status);
    const g = new Graphics(); node.addChild(g); const col = STAR_COLORS[s.star] || 0xffffff;
    if (full) {
      g.circle(0, 0, 15).fill({ color: col, alpha: 0.12 }); g.circle(0, 0, 9).fill({ color: col, alpha: 0.25 });
      g.circle(0, 0, 7.5).fill({ color: col }); g.circle(-1.5, -1.5, 2.4).fill({ color: 0xffffff, alpha: 0.7 });
      const pl = s.planets.length, sc = s.planets.filter((p) => p.scanned).length;
      if (s.status === 'charted') g.circle(0, 0, 13).stroke({ width: 2.5, color: C.brassLight });
      else { g.circle(0, 0, 13).stroke({ width: 2.5, color: 0x1c2050, alpha: 0.9 }); if (pl && sc) arcSeg(g, 0, 0, 13, -Math.PI / 2, -Math.PI / 2 + (sc / pl) * Math.PI * 2).stroke({ width: 2.5, color: C.tealLight }); }
    } else {
      g.circle(0, 0, 9).fill({ color: C.textDim, alpha: 0.08 }); g.circle(0, 0, 6).stroke({ width: 1.8, color: C.textDim, alpha: 0.85 }); g.circle(0, 0, 1.6).fill({ color: C.textDim });
    }
    if (full && s.station) { g.rect(10, 6, 5, 5).fill(C.cream); g.rect(10, 6, 5, 5).stroke({ width: 1, color: 0x0b0d1e }); }
    if (full && s.phenomena?.includes('beacon')) { g.circle(0, 0, 20).stroke({ width: 1.5, color: C.mustard, alpha: 0.6 }); }
    const label = new Label({ text: full ? s.name : '???', preset: 'tiny', size: 13, color: full ? C.cream : C.textDim, shadow: true }); label.y = 18; node.addChild(label);
    if (full && s.faction && s.faction !== 'none') { const em = S.gfx.factionEmblem(s.faction, 14); em.x = -16; em.y = -14; node.addChild(em); }
    if (missionTitles?.length) { const m = new Graphics(); m.poly([0, -9, 7, 0, 0, 9, -7, 0]).fill(C.mustard).stroke({ width: 1.5, color: C.brassDark }); m.y = -30; m.x = 0; node.addChild(m); node.missionMark = m; }
    const hit = new Graphics().circle(0, 0, 22).fill({ color: 0xffffff, alpha: 0.001 }); node.addChild(hit);
    node.eventMode = 'static'; node.cursor = 'pointer';
    const n = { node, sys: s, label, status: s.status, known: full, hover: false, missions: missionTitles?.join('|') || '' };
    node.on('pointertap', () => { if (Input.clickAllowed() && !this.jumping) this.select(s.id, true); });
    node.on('pointerover', () => { n.hover = true; sfx('hover'); this._applyLOD(); }); node.on('pointerout', () => { n.hover = false; this._applyLOD(); });
    Tooltip.attach(node, () => this.nodeTip(s, missionTitles));
    return n;
  }
  nodeTip(s, missions) {
    const g = this.game; const full = ['visited', 'charted'].includes(s.status); const cur = s.id === g.state.pos; const rows = [];
    if (full) { rows.push(['Star', STAR_NAMES[s.star] || s.star]); if (s.faction !== 'none') rows.push(['Faction', S.content.FACTIONS?.[s.faction]?.name || s.faction]); rows.push(['Status', s.status, s.status === 'charted' ? 'good' : 'warn']); }
    else rows.push(['Status', 'Unexplored', 'warn']);
    const n = g.neighbors(g.state.pos).find((x) => x.id === s.id);
    if (cur) rows.push(['', 'You are here', 'good']);
    else if (n) { rows.push(['Distance', n.dist.toFixed(1) + ' ly']); rows.push(['Fuel', n.fuelCost, g.state.ship.fuel >= n.fuelCost ? 'info' : 'bad']); rows.push(['Travel', n.days + ' day' + (n.days > 1 ? 's' : '')]); }
    else rows.push(['Route', 'Not adjacent — multi-jump']);
    if (missions?.length) rows.push(['Mission', missions[0], 'warn']);
    return { title: full ? s.name : 'Unexplored system', rows, footer: 'Click to select' };
  }

  // ------------------------------------------------------------------ side panel + controls
  _buildSide() {
    const P = this.side = new Panel({ w: 330, h: 400, title: 'NAVIGATION', tone: 'indigo', pad: 16, lights: true }); P.x = W - 330 - 10; P.y = 72; this.view.addChild(P);
    this.sideBody = new Container(); P.content.addChild(this.sideBody);
    this.planBtn = new Button({ label: 'Plan jump', icon: 'jump', w: 298, h: 52, variant: 'primary', hotkey: undefined, onClick: () => this.planJump() }); this.planBtn.x = 16; this.planBtn.y = 400 - 52 - 18; this.side.addChild(this.planBtn);
  }
  _buildControls() {
    const v = this.view;
    const back = new Button({ label: 'Bridge', icon: 'arrow', w: 150, h: 46, variant: 'brass', onClick: () => this.onEscape(), tooltip: 'Return to the bridge (Esc)' }); back.x = 12; back.y = 72; v.addChild(back);
    const mk = (icon, tip, fn, y) => { const b = new IconButton({ icon, size: 44, variant: 'brass', tooltip: tip, onClick: fn }); b.x = 12; b.y = y; v.addChild(b); return b; };
    const zb = (label, tip, fn, y) => { const b = new Button({ label, w: 44, h: 44, fontSize: 26, variant: 'brass', tooltip: tip, onClick: fn, upper: false }); b.x = 12; b.y = y; v.addChild(b); };
    zb('+', 'Zoom in (+)', () => this.zoomAt(W / 2, H / 2, 1.3), 128); zb('\u2212', 'Zoom out (-)', () => this.zoomAt(W / 2, H / 2, 0.77), 178);
    mk('ship', 'Centre on ship (F)', () => this.centerOn(this.game.here().x, this.game.here().y, true), 228);
    // legend
    const lg = new Panel({ w: 220, h: 176, title: 'LEGEND', tone: 'deep', pad: 12 }); lg.x = 12; lg.y = H - 188; v.addChild(lg);
    const rows = [['Charted', C.brassLight, 'ring'], ['Visited', C.cream, 'dot'], ['Detected (unexplored)', C.textDim, 'hollow'], ['Mission target', C.mustard, 'diamond'], ['Distress beacon', C.coral, 'sos'], ['Rival trader', C.mustard, 'rival']];
    rows.forEach(([t, col, kind], i) => { const gg = new Graphics(); const y = i * 21 + 8; if (kind === 'ring') { gg.circle(8, y, 6).fill(col).circle(8, y, 8.5).stroke({ width: 2, color: col }); } else if (kind === 'dot') gg.circle(8, y, 5).fill(col); else if (kind === 'hollow') gg.circle(8, y, 5).stroke({ width: 1.8, color: col }); else if (kind === 'sos') { gg.circle(8, y, 7).stroke({ width: 1.5, color: col, alpha: 0.6 }); gg.circle(8, y, 3.5).fill(col); } else if (kind === 'rival') gg.poly([2, y - 5, 14, y, 2, y + 5]).fill(col); else gg.poly([8, y - 7, 14, y, 8, y + 7, 2, y]).fill(col); const l = new Label({ text: t, preset: 'tiny', size: 13, color: C.cream }); l.x = 26; l.y = y - 8; lg.content.addChild(gg, l); });
    const hint = new Label({ text: 'Drag to pan · wheel to zoom · click a system', preset: 'tiny', size: 12, color: C.textDim, shadow: true }); hint.x = W / 2 - 220; hint.y = H - 28; v.addChild(hint);
  }
  select(id, fire = false) {
    this.sel = id; if (id) prebakeSystem(this.game.system(id)); if (fire) sfx('click'); this.refreshSide(); this._applyLOD();
  }
  _route(toId) {
    const g = this.game, gal = g.state.galaxy; const known = new Set(gal.systems.filter((s) => s.status !== 'unknown').map((s) => s.id));
    const prev = new Map([[g.state.pos, null]]); const q = [g.state.pos];
    while (q.length) { const a = q.shift(); if (a === toId) break; for (const [x, y] of gal.lanes) { const b = x === a ? y : y === a ? x : null; if (b && known.has(b) && !prev.has(b)) { prev.set(b, a); q.push(b); } } }
    if (!prev.has(toId)) return null; const path = []; for (let c = toId; c; c = prev.get(c)) path.unshift(c); return path;
  }
  refreshSide() {
    const g = this.game, st = g.state, b = this.sideBody; b.removeChildren().forEach((c) => c.destroy({ children: true }));
    let y = 0; const add = (txt, o = {}) => { const l = new Label({ text: txt, preset: 'small', size: 15, w: 298, color: C.cream, lineHeight: 20, ...o }); l.y = y; y += l.textHeight + (o.gap ?? 6); b.addChild(l); return l; };
    const s = this.sel && g.system(this.sel);
    this.planBtn.visible = !!s;
    if (!s) {
      add('Select a system on the chart to plan a jump.', { color: C.textDim, gap: 12 });
      const pr = g.surveyProgress?.(); if (pr) { add(`Survey: ${pr.charted}/${pr.total} systems charted (${pr.pct}%)`, { color: C.tealLight }); add(rangeNote(g), { color: C.cream, gap: 10 });
      const dd = g.distressSignals?.()[0]; if (dd) add(`SOS: ${dd.title || 'distress call'} near ${dd.systemName} — ${dd.daysLeft} day${dd.daysLeft === 1 ? '' : 's'} left`, { color: C.coral });
      const rv = g.rivalInfo?.(); if (rv?.systemName) add(rv.note, { color: C.mustard }); }
      this.planBtn.visible = false; return;
    }
    const full = ['visited', 'charted'].includes(s.status); const cur = s.id === st.pos;
    add(full ? s.name : 'Unexplored system', { preset: 'bodyB', size: 21, color: C.mustard, gap: 2 });
    const reg = S.content.REGIONS?.[s.region]?.name || s.region; add(full ? `${STAR_NAMES[s.star] || s.star} · ${reg}` : 'Detected by long-range sensors', { color: C.tealLight, gap: 10 });
    if (full) {
      if (s.faction !== 'none') add(`${S.content.FACTIONS?.[s.faction]?.name || s.faction} space`);
      const sc = s.planets.filter((p) => p.scanned).length; add(`${s.planets.length} planet${s.planets.length === 1 ? '' : 's'} · ${sc} scanned${s.station ? ' · station' : ''}`);
      add(DANGER[Math.min(3, s.danger | 0)], { color: s.danger >= 2 ? C.mustard : C.good, gap: 10 });
    }
    const n = g.neighbors(st.pos).find((x) => x.id === s.id);
    if (cur) { add('You are here.', { color: C.good }); this.planBtn.setEnabled(false, 'Already in this system.'); this.planBtn.setLabel('Plan jump'); }
    else if (n) {
      const cj = g.canJump(s.id); const left = Math.floor(st.ship.fuel) - n.fuelCost;
      add(`Distance  ${n.dist.toFixed(1)} ly`, { preset: 'mono', size: 14, gap: 2 }); add(`Fuel cost  ${n.fuelCost}   (leaves ${Math.max(0, left)})`, { preset: 'mono', size: 14, color: cj.ok ? C.cream : C.coral, gap: 2 }); add(`Travel     ${n.days} day${n.days > 1 ? 's' : ''}`, { preset: 'mono', size: 14, gap: 8 });
      add(rangeNote(g), { color: C.textDim, size: 13 });
      if (cj.ok && left < 3) add('Low fuel after this jump. A station near the destination would be wise.', { color: C.mustard, size: 14 });
      this.planBtn.setLabel('Plan jump'); this.planBtn.setEnabled(cj.ok, cj.reason || 'Cannot jump right now.');
    } else {
      const path = this._route(s.id);
      if (path && path.length > 1) { add(`${path.length - 1} jumps away`, { color: C.cream, gap: 2 }); add('via ' + path.slice(1, -1).map((id) => g.system(id).name).concat(full ? [] : ['…']).join(' → ') || 'direct', { color: C.textDim, size: 14 });
        const first = path[1], cj = g.canJump(first); this.planBtn.setLabel('Jump toward'); this.planBtn.setEnabled(cj.ok, cj.reason); this.planBtn.towards = first; }
      else { add('No known route from here yet. Explore nearby systems to reveal more lanes.', { color: C.textDim }); this.planBtn.setEnabled(false, 'No known route.'); }
    }
    const mt = missionTargets(g).get(s.id); if (mt) add('Mission: ' + mt.join(', '), { color: C.mustard });
  }
  /** Tolerant extraction of system ids from state.distress / state.rival (array | map | single object | id string). */
  _flagSystems(v) {
    if (!v) return []; const out = [];
    const add = (o) => { if (!o) return; if (typeof o === 'string') out.push(o); else if (typeof o === 'object') { const id = o.systemId || o.system || o.pos || o.at || o.id; if (typeof id === 'string') out.push(id); } };
    if (Array.isArray(v)) v.forEach(add); else if (typeof v === 'object' && !(v.systemId || v.system || v.pos || v.at)) { for (const [k, x] of Object.entries(v)) { if (x && typeof x === 'object') add(x.systemId || x.system || x.pos ? x : k); else if (x) out.push(k); } } else add(v);
    return out;
  }
  planJump() {
    if (this.jumping || !this.sel) return; const g = this.game; const st = g.state;
    let to = this.sel; if (to === st.pos) return;
    if (!g.neighbors(st.pos).find((x) => x.id === to)) { const p = this._route(to); if (!p || p.length < 2) return; to = p[1]; }
    const cj = g.canJump(to); if (!cj.ok) { this.ui.toast(cj.reason || 'Cannot jump.', 'warn'); sfx('deny'); return; }
    this.playJump(to);
  }

  // ------------------------------------------------------------------ jump animation
  async playJump(to) {
    const g = this.game; const A = g.here(), B = g.system(to); prebakeSystem(B);
    this.jumping = true; this.ui.holdEvents = true; Tooltip.hide(); sfx('powerup');
    const prefs = window.__halcyonPrefs || { shake: true, anim: true };
    Anim.to(this.side, { alpha: 0, x: this.side.x + 40 }, 300); this.planBtn.eventMode = 'none';
    // ship glides along the lane
    const ship = S.gfx.ship({ kind: 'halcyon', scale: 0.32, thrust: 1 }); this.shipLayer.addChild(ship); ship.x = A.x; ship.y = A.y; ship.rotation = Math.atan2(B.y - A.y, B.x - A.x);
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2; const zoom = Math.min(1.4, Math.max(0.8, 520 / (Math.hypot(A.x - B.x, A.y - B.y) + 80)));
    this.centerOn(mx, my, true, zoom);
    // anticipation: engines spool up, a ring contracts onto the ship, the chart trembles
    if (prefs.anim !== false) {
      const ant = { p: 0 }; const ox = this.world.x, oy = this.world.y;
      await Anim.to(ant, { p: 1 }, 800, { ease: 'inQuad', onUpdate: () => {
        if (this._dead) return; const k = ant.p; this.fx.clear();
        for (let i = 0; i < 3; i++) { const q = (k * 1.6 - i * 0.25); if (q > 0 && q < 1) this.fx.circle(A.x, A.y, 8 + (1 - q) * 70).stroke({ width: 2.5, color: C.tealLight, alpha: 0.2 + q * 0.7 }); }
        ship.scale.set(0.32 * (1 + 0.18 * Math.sin(k * 30) * k)); ship.update?.(0.016);
        if (prefs.shake !== false) { this.world.x = ox + (Math.random() - 0.5) * 3.5 * k; this.world.y = oy + (Math.random() - 0.5) * 3.5 * k; }
      } }).promise;
      this.world.x = ox; this.world.y = oy; ship.scale.set(0.32); this.fx.clear();
    } else await Anim.wait(250);
    sfx('jump');
    const prog = { p: 0 }; const glide = Anim.to(prog, { p: 1 }, 1300, { ease: 'inOutCubic', onUpdate: () => { if (this._dead) return; ship.x = A.x + (B.x - A.x) * prog.p; ship.y = A.y + (B.y - A.y) * prog.p; ship.update?.(0.016); this.fx.clear().moveTo(A.x, A.y).lineTo(ship.x, ship.y).stroke({ width: 3, color: C.tealLight, alpha: 0.7 }); } });
    await glide.promise; if (this._dead) return;
    // warp streaks
    const warp = new Container(); this.view.addChild(warp); const sg = new Graphics(); warp.addChild(sg);
    const flash = new Graphics().rect(0, 0, W, H).fill(0xffffff); flash.alpha = 0; warp.addChild(flash);
    const dark = new Graphics().rect(0, 0, W, H).fill({ color: 0x03040d }); dark.alpha = 0; warp.addChildAt(dark, 0);
    const streaks = Array.from({ length: 150 }, () => ({ a: Math.random() * 6.283, d: 20 + Math.random() * 100, sp: 0.6 + Math.random() * 1.4, col: Math.random() < 0.3 ? C.tealLight : Math.random() < 0.5 ? C.cream : C.mustard }));
    const wp = { p: 0 }; const run = Anim.to(wp, { p: 1 }, 1100, { ease: 'inQuad', onUpdate: () => {
      if (this._dead) return;
      dark.alpha = Math.min(1, wp.p * 3); sg.clear(); const k = wp.p;
      for (const s of streaks) { const r0 = s.d + k * k * 900 * s.sp, r1 = r0 + 6 + k * 420 * s.sp; sg.moveTo(W / 2 + Math.cos(s.a) * r0, H / 2 + Math.sin(s.a) * r0 * 0.75).lineTo(W / 2 + Math.cos(s.a) * r1, H / 2 + Math.sin(s.a) * r1 * 0.75).stroke({ width: 1.2 + k * 2, color: s.col, alpha: 0.4 + k * 0.6 }); }
      flash.alpha = Math.max(0, (k - 0.82) / 0.18); if (prefs.shake !== false) { warp.x = (Math.random() - 0.5) * 6 * k; warp.y = (Math.random() - 0.5) * 6 * k; } } });
    // perform the actual jump mid-warp
    setTimeout(() => { this._result = g.jump(to); }, 300);
    await run.promise; if (this._dead) return;
    const r = this._result; this.fx.clear();
    if (!r || r.ok === false) { this.ui.toast(r?.reason || 'The jump fizzled.', 'bad'); warp.destroy({ children: true }); ship.destroy(); this.jumping = false; this.ui.holdEvents = false; this.planBtn.eventMode = 'static'; Anim.to(this.side, { alpha: 1, x: W - 340 }, 300); this.build(); this.refreshSide(); return; }
    this.ui.sfx('arrive');
    await this.ui.goto('Bridge', { arrive: true }, { kind: 'fade', ms: 250 });
  }

  update(dt) {
    this.t += dt; this.bg.update(dt, -this.world.x * 0.04, -this.world.y * 0.04);
    for (const n of this.nodes.values()) if (n.node.missionMark) n.node.missionMark.y = -30 + Math.sin(this.t * 3 + n.sys.x) * 3;
    // overlay fx: current marker, selection ring
    if (!this.jumping) {
      const g = this.fx; g.clear(); const cur = this.game.here();
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 3);
      g.circle(cur.x, cur.y, 20 + pulse * 6).stroke({ width: 2, color: C.tealLight, alpha: 0.9 - pulse * 0.5 });
      g.poly([cur.x, cur.y - 26 - pulse * 3, cur.x - 6, cur.y - 36 - pulse * 3, cur.x + 6, cur.y - 36 - pulse * 3]).fill(C.tealLight);
      for (const [id, n] of this.nodes) if (n.neigh && id !== this.sel) { const ok = this.game.state.ship.fuel >= n.neigh.fuelCost; g.circle(n.sys.x, n.sys.y, 18).stroke({ width: 1.5, color: ok ? C.teal : C.coral, alpha: 0.35 }); }
      for (const id of this._flagSystems(this.game.state.distress)) { const s = this.game.system(id); if (s && this.nodes.has(id)) { const q = (this.t * 1.2) % 1; for (let k = 0; k < 2; k++) { const q2 = (q + k * 0.5) % 1; g.circle(s.x, s.y, 12 + q2 * 34).stroke({ width: 3 - q2 * 2, color: C.coral, alpha: 0.95 * (1 - q2) }); } g.circle(s.x, s.y, 13).stroke({ width: 2.5, color: C.coral, alpha: 0.9 }); } }
      for (const ic of this.beacons || []) { const k = 1 + 0.18 * Math.sin(this.t * 5); ic.scale.set(k); }
      if (this.sel) { const s = this.game.system(this.sel); if (s) for (let k = 0; k < 6; k++) { const a = this.t + k * Math.PI / 3; arcSeg(g, s.x, s.y, 24, a, a + 0.55).stroke({ width: 2.5, color: C.mustard }); } }
    }
  }
  exit() { this._dead = true; super.exit(); this.ui.holdEvents = false; }
}
