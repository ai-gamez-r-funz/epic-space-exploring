import { Container, Graphics, Rectangle } from 'pixi.js';
import { C, W, H, STAR_COLORS, hex, mix } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Tooltip } from '../kit/Tooltip.js';
import { Input } from '../kit/input.js';
import { Anim } from '../kit/anim.js';
import { centerOn } from '../kit/layout.js';
import { drawWell } from '../kit/draw.js';
import { S, sfx } from '../services.js';
import { makeBackdrop } from './Backdrop.js';

export const PLANET_NAMES = { terran: 'Terran', ocean: 'Ocean world', desert: 'Desert world', ice: 'Ice world', lava: 'Lava world', gas: 'Gas giant', barren: 'Barren rock', jungle: 'Jungle world', crystal: 'Crystal world', toxic: 'Toxic world' };
export const STAR_NAMES = { yellow: 'Yellow dwarf', orange: 'Orange star', red: 'Red dwarf', white: 'White star', blue: 'Blue giant', binary: 'Binary pair', neutron: 'Neutron star', blackhole: 'Black hole' };
export const PHEN_NAMES = { nebula: 'Nebula', pulsar: 'Pulsar', ionstorm: 'Ion storm', wormhole: 'Wormhole', asteroids: 'Asteroid field', derelict: 'Derelict vessel', comet: 'Comet', rift: 'Singing rift', aurora: 'Space aurora', beacon: 'Lantern beacon' };
const STAR_R = { yellow: 40, orange: 38, red: 48, white: 36, blue: 32, binary: 40, neutron: 12, blackhole: 22 };
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/**
 * Viewscreen — the bridge's big window: current system as an orbit diagram. Click objects to select.
 *   const vs = new Viewscreen({ w:710, h:470, onSelect(sel|null) })
 *   vs.setSystem(system, game)  vs.refresh(game)  vs.select({kind:'planet'|'phen'|'station', id})  vs.update(dt)
 * sel = { kind, id, obj } — id is planet.id / phenomenon kind / 'station'.
 */
export class Viewscreen extends Container {
  constructor(o) {
    super(); this.o = o; this.w = o.w; this.h = o.h; this.sel = null; this.items = [];
    this.well = new Graphics(); drawWell(this.well, this.w, this.h, { radius: 16, color: C.ink, border: C.brass }); this.addChild(this.well);
    this.screen = new Container(); this.screen.x = 8; this.screen.y = 8; this.sw = this.w - 16; this.sh = this.h - 16; this.addChild(this.screen);
    this.mask_ = new Graphics().roundRect(8, 8, this.sw, this.sh, 10).fill(0xffffff); this.addChild(this.mask_); this.screen.mask = this.mask_;
    this.bgHolder = new Container(); this.screen.addChild(this.bgHolder);
    this.scene = new Container(); this.screen.addChild(this.scene);
    this.orbits = new Graphics(); this.scene.addChild(this.orbits);
    this.hud = new Container(); this.screen.addChild(this.hud);
    this.selG = new Graphics(); this.scene.addChild(this.selG);
    const scan = S.gfx.scanlines?.(this.sw, this.sh, 0.05); if (scan) { scan.x = 8; scan.y = 8; scan.eventMode = 'none'; this.addChild(scan); scan.mask = null; }
    // bezel screws + trim
    const g = new Graphics(); for (const [x, y] of [[8, 8], [this.w - 8, 8], [8, this.h - 8], [this.w - 8, this.h - 8]]) { g.circle(x, y, 3).fill(C.brassDark); g.circle(x - 0.7, y - 0.7, 1.5).fill({ color: C.brassLight, alpha: 0.7 }); } g.eventMode = 'none'; this.addChild(g);
    this.title = new Label({ text: '', preset: 'head', size: 15, color: C.cream, shadow: true }); this.title.x = 24; this.title.y = 20; this.hud.addChild(this.title);
    this.subtitle = new Label({ text: '', preset: 'tiny', size: 13, color: C.tealLight, shadow: true }); this.subtitle.x = 24; this.subtitle.y = 42; this.hud.addChild(this.subtitle);
    this.hint = new Label({ text: '', preset: 'tiny', size: 13, color: C.textDim, shadow: true }); this.hud.addChild(this.hint);
    this.screen.eventMode = 'static'; this.screen.hitArea = new Rectangle(0, 0, this.sw, this.sh);
    this.screen.on('pointertap', (e) => { if (e.target === this.screen || e.target === this.bgHolder) this.select(null, true); });
    this.t = 0;
  }
  setSystem(sys, game, { arrive = false } = {}) {
    this.sys = sys; this.game = game; this.sel = null;
    this.bgHolder.removeChildren().forEach((c) => c.destroy({ children: true }));
    for (const it of this.items) it.node.destroy({ children: true }); this.items = [];
    const seed = hashStr(sys.id); const hue = (S.content.REGIONS?.[sys.region]?.hue) ?? 240;
    this.bg = makeBackdrop({ w: this.sw, h: this.sh, seed, hue, nebula: sys.phenomena.includes('nebula') || seed % 3 === 0, vignette: false }); this.bgHolder.addChild(this.bg);
    const cy = this.sh / 2 + 12; const sx = 64;
    // star
    const sr = STAR_R[sys.star] || 38;
    if (this.star) this.star.destroy({ children: true });
    this.star = S.gfx.star({ type: sys.star, radius: sr }); this.star.x = sx - 4; this.star.y = cy; this.scene.addChildAt(this.star, 1);
    this.starItem = { kind: 'star' };
    const n = sys.planets.length; const maxR = this.sw - sx - 70; const first = 150 + sr; const step = n > 1 ? Math.min(118, (maxR - first) / (n - 1)) : 0;
    const angs = [-0.42, 0.36, -0.2, 0.52, -0.5, 0.2]; this.orbits.clear();
    sys.planets.forEach((p, i) => {
      const rx = first + i * step; const ry = rx * 0.5; const th = angs[i % angs.length];
      this.orbits.ellipse(sx - 4, cy, rx, ry).stroke({ width: 1.5, color: C.teal, alpha: 0.2 });
      const x = sx - 4 + rx * Math.cos(th), y = cy + ry * Math.sin(th);
      const rad = 17 + (p.size || 1) * 11;
      this._addItem({ kind: 'planet', id: p.id, obj: p, x, y, r: rad, make: () => S.gfx.planet({ type: p.type, seed: hashStr(p.id), radius: rad, ringed: p.ringed, moons: p.moons, life: p.scanned ? p.life : 'none' }), name: p.name });
    });
    // phenomena
    sys.phenomena.forEach((ph, i) => {
      const x = this.sw * 0.34 + i * 150, y = i % 2 ? this.sh - 78 : 76 + (n ? 0 : 20);
      this._addItem({ kind: 'phen', id: ph, obj: ph, x, y, r: 36, make: () => S.gfx.phenomenon(ph, { size: 72 }), name: PHEN_NAMES[ph] || ph });
    });
    if (sys.station) this._addItem({ kind: 'station', id: 'station', obj: sys.station, x: this.sw - 90, y: this.sh - 84, r: 34, make: () => this._stationNode(sys.station), name: sys.station.name });
    // ship
    if (this.ship) this.ship.destroy({ children: true });
    this.ship = S.gfx.ship({ kind: 'halcyon', scale: 0.62, thrust: 0.2 }); this.ship.x = 120; this.ship.y = this.sh - 60; this.scene.addChild(this.ship); this.shipTarget = { x: 120, y: this.sh - 60 };
    this.title.setText(sys.name.toUpperCase());
    const reg = S.content.REGIONS?.[sys.region]?.name || sys.region; const fac = sys.faction && sys.faction !== 'none' ? ' · ' + (S.content.FACTIONS?.[sys.faction]?.name || sys.faction) : '';
    this.subtitle.setText(`${STAR_NAMES[sys.star] || sys.star} · ${reg}${fac}`);
    this.hint.setText(n || sys.phenomena.length || sys.station ? 'Click an object to select it' : 'An empty system. Peaceful.'); this.hint.x = this.sw - this.hint.textWidth - 24; this.hint.y = 24;
    this.refresh(game);
    if (arrive) { this.scene.alpha = 0; this.ship.x = -80; Anim.to(this.scene, { alpha: 1 }, 700); this.bg.alpha = 0.2; Anim.to(this.bg, { alpha: 1 }, 900); }
  }
  _stationNode(st) {
    const c = new Container(); const g = new Graphics(); g.circle(0, 0, 30).fill({ color: 0x0b0d1e, alpha: 0.7 }); g.circle(0, 0, 30).stroke({ width: 3, color: C.brass }); g.circle(0, 0, 23).stroke({ width: 1.5, color: C.teal, alpha: 0.6 }); c.addChild(g);
    const ic = S.gfx.icon('station', { size: 34, color: C.cream }); centerOn(ic, 0, 0); c.addChild(ic);
    c.update = (dt) => { g.rotation += dt * 0.05; }; return c;
  }
  _addItem(it) {
    const node = new Container(); node.x = it.x; node.y = it.y; node.baseY = it.y;
    const art = it.make(); node.addChild(art); it.art = art; it.node = node;
    const lab = new Label({ text: it.name, preset: 'tiny', size: 13, color: C.cream, shadow: true }); lab.x = -lab.textWidth / 2; lab.y = it.r + 6; node.addChild(lab); it.label = lab;
    const badge = new Container(); badge.x = it.r * 0.75; badge.y = -it.r * 0.75; node.addChild(badge); it.badge = badge;
    node.eventMode = 'static'; node.cursor = 'pointer'; node.hitArea = new Rectangle(-it.r - 6, -it.r - 6, (it.r + 6) * 2, (it.r + 6) * 2 + 24);
    node.on('pointertap', () => { if (Input.clickAllowed()) this.select(it, true); });
    node.on('pointerover', () => { it.hover = true; sfx('hover'); }); node.on('pointerout', () => { it.hover = false; });
    Tooltip.attach(node, () => this.tip(it));
    this.scene.addChild(node); this.items.push(it);
  }
  tip(it) {
    if (it.kind === 'planet') { const p = it.obj; const rows = [['Type', PLANET_NAMES[p.type] || p.type]]; rows.push(['Status', p.landed ? 'Explored' : p.scanned ? 'Scanned' : 'Unscanned', p.scanned ? 'good' : 'warn']); if (p.scanned) rows.push(['Life', p.life]); return { title: p.name, rows, footer: 'Click to select' }; }
    if (it.kind === 'station') return { title: it.obj.name, rows: [['Kind', it.obj.kind], ['Services', (it.obj.services || []).join(', ')]], footer: 'Click to select' };
    return { title: PHEN_NAMES[it.id] || it.id, body: 'A phenomenon worth a closer look.', footer: 'Select, then Investigate (I)' };
  }
  select(it, fire = false) {
    this.sel = it ? { kind: it.kind, id: it.id, obj: it.obj } : null; if (fire) { sfx('click'); this.o.onSelect?.(this.sel); }
  }
  selectById(kind, id) { const it = this.items.find((x) => x.kind === kind && x.id === id); this.select(it || null, false); }
  /** Update dynamic bits (scanned badges, ship position). */
  refresh(game) {
    this.game = game || this.game; const st = this.game.state;
    for (const it of this.items) {
      it.badge.removeChildren().forEach((c) => c.destroy({ children: true }));
      if (it.kind === 'planet') {
        const p = it.obj;
        const mk = (name, col) => { const b = new Container(); const g = new Graphics(); g.circle(0, 0, 10).fill({ color: 0x0b0d1e, alpha: 0.9 }); g.circle(0, 0, 10).stroke({ width: 1.5, color: col }); const ic = S.gfx.icon(name, { size: 13, color: col }); centerOn(ic, 0, 0); b.addChild(g, ic); return b; };
        if (p.landed) it.badge.addChild(mk('land', C.good)); else if (p.scanned) it.badge.addChild(mk('check', C.tealLight)); else it.badge.addChild(mk('scan', C.mustard));
        if (it.lastLife !== (p.scanned ? p.life : 'none')) { /* life visuals change on scan; rebuild art */ const old = it.art; it.art = S.gfx.planet({ type: p.type, seed: hashStr(p.id), radius: it.r, ringed: p.ringed, moons: p.moons, life: p.scanned ? p.life : 'none' }); it.node.addChildAt(it.art, 0); old.destroy({ children: true }); it.lastLife = p.scanned ? p.life : 'none'; }
      }
    }
    // ship placement
    let t = { x: 120, y: this.sh - 60 };
    if (st.orbit) { const it = this.items.find((x) => x.kind === 'planet' && x.id === st.orbit); if (it) t = { x: it.x - it.r - 34, y: it.y - it.r * 0.4 }; }
    else if (st.docked) { const it = this.items.find((x) => x.kind === 'station'); if (it) t = { x: it.x - 70, y: it.y - 8 }; }
    this.shipTarget = t; this.orbitId = st.orbit;
  }
  update(dt) {
    this.t += dt; this.bg?.update(dt, this.t * 4, 0); this.star?.update?.(dt);
    for (const it of this.items) { it.art.update?.(dt); it.node.y = it.node.baseY + Math.sin(this.t * 0.7 + it.x * 0.01) * 2.5; }
    if (this.ship) { const tg = this.shipTarget; this.ship.x += (tg.x - this.ship.x) * Math.min(1, dt * 2.2); this.ship.y += (tg.y - this.ship.y) * Math.min(1, dt * 2.2) + Math.sin(this.t * 1.3) * 0.12; this.ship.update?.(dt); this.ship.rotation = Math.sin(this.t * 0.9) * 0.03; }
    // selection ring
    const g = this.selG; g.clear();
    const mark = (it, col, a) => { const r = it.r + 10; for (let k = 0; k < 4; k++) { const s = this.t * 0.8 + k * Math.PI / 2; g.arc(it.node.x, it.node.y, r, s, s + 0.9).stroke({ width: 2.5, color: col, alpha: a }); } };
    if (this.sel) { const it = this.items.find((x) => x.kind === this.sel.kind && x.id === this.sel.id); if (it) mark(it, C.mustard, 0.95); }
    const oi = this.orbitId && this.items.find((x) => x.kind === 'planet' && x.id === this.orbitId); if (oi) g.circle(oi.node.x, oi.node.y, oi.r + 18).stroke({ width: 1.5, color: C.tealLight, alpha: 0.5 + 0.3 * Math.sin(this.t * 3) });
    for (const it of this.items) if (it.hover && !(this.sel && this.sel.id === it.id)) g.circle(it.node.x, it.node.y, it.r + 8).stroke({ width: 1.5, color: C.cream, alpha: 0.5 });
  }
}
