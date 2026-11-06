import { Container, Graphics, Rectangle } from 'pixi.js';
import { Overlay } from './Overlay.js';
import { C, lighten, darken, grad } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Button } from '../kit/Button.js';
import { ScrollPane } from '../kit/Scroll.js';
import { Tooltip } from '../kit/Tooltip.js';
import { Input } from '../kit/input.js';
import { Anim } from '../kit/anim.js';
import { Modal } from '../kit/Modal.js';
import { S, sfx } from '../services.js';
import { ico, pill, well, hr, live, num, cap, sgn, shake, popIn, fadeIn } from './parts/common.js';
import { SLOT_META, SLOT_ORDER, BUILD_META, allUpgrades, upgradeById, bonusEntries, statRows, statusFor } from './parts/upgrades.js';

const LW = 570; // left column width
const SOCKETS = { // offsets from schematic centre
  comms: [-168, -100], hull: [0, -112], lounge: [168, -100],
  engine: [-238, 0], sensors: [238, 0],
  cargo: [-152, 98], special: [0, 120], lab: [152, 98],
};

/**
 * Shipyard - the ship schematic with 8 slot sockets; pick a slot to browse upgrade branches, compare stats before/after,
 * buy (with confirm) or sell. Works as a read-only ship view when not docked at a yard (U key from the bridge).
 */
export class Shipyard extends Overlay {
  title = 'SHIP & UPGRADES'; size = { w: 1200, h: 668 };

  build(modal) {
    this.g = this.game; this.slot = 'engine'; this.sel = null; this.statNodes = {};
    this.BW = modal.bodyW; this.BH = modal.bodyH; this.RX = LW + 20; this.RW = this.BW - this.RX;
    this.root = new Container(); modal.body.addChild(this.root);
    this._schematic(); this._statsPanel(); this._rightPanel();
    this.watch(() => this._refresh());
    Input.bind(this.root, SLOT_ORDER.map((_, i) => String(i + 1)), (e) => { const i = Number(e.key) - 1; if (SLOT_ORDER[i]) this._pickSlot(SLOT_ORDER[i]); });
    Input.bind(this.root, 'ArrowDown', () => this._stepItem(1)); Input.bind(this.root, 'ArrowUp', () => this._stepItem(-1));
    Input.bind(this.root, 'Enter', () => this._buy()); Input.bind(this.root, 'x', () => this._sell());
    try { this.ui.layers.toast.visible = false; } catch (e) { /* */ } // the install FX carry the feedback
    this._refresh(true);
    this.ui.music('station');
  }
  onClose() { try { this.ui.layers.toast.visible = true; } catch (e) { /* */ } const scene = this.ui.sceneName; this.ui.music(scene === 'GalaxyMap' ? 'map' : 'bridge'); }
  get hasYard() { const s = this.g.here(); return !!(s?.station && s.station.services.includes('shipyard') && this.g.state.docked); }

  // ---------------------------------------------------------------- schematic
  _schematic() {
    const H = 346; const P = this.sch = new Container(); this.root.addChild(P);
    const bg = well(LW, H, { color: 0x081428, alpha: 1, border: 0x2d6f9a }); P.addChild(bg);
    const grid = new Graphics(); // blueprint grid
    for (let x = 14; x < LW; x += 28) grid.rect(x, 4, 1, H - 8).fill({ color: 0x2d6f9a, alpha: 0.18 });
    for (let y = 14; y < H; y += 28) grid.rect(4, y, LW - 8, 1).fill({ color: 0x2d6f9a, alpha: 0.18 });
    P.addChild(grid);
    const cx = LW / 2, cy = H / 2 - 12; this.cx = cx; this.cy = cy;
    const cap_ = new Label({ text: 'ISV ' + (this.g.state.ship.name || 'HALCYON').replace(/^ISV\s+/i, '').toUpperCase() + ' · SCHEMATIC', preset: 'headSm', size: 10, color: 0x6fc7e8 }); cap_.x = 16; cap_.y = 12; P.addChild(cap_);
    const lines = new Graphics(); P.addChild(lines); this.lines = lines;
    try { const ship = S.gfx.ship({ kind: 'halcyon', scale: 1.5, thrust: 0.35 }); ship.x = cx + 2; ship.y = cy + 10; live(ship); ship.alpha = 0.95; P.addChild(ship); this.ship = ship; } catch (e) { /* */ }
    const mk = new Graphics().roundRect(2, 2, LW - 4, H - 4, 10).fill(0xffffff); P.addChild(mk); P.mask = mk;
    this.sockets = {};
    SLOT_ORDER.forEach((slot, i) => {
      const [dx, dy] = SOCKETS[slot]; const x = cx + dx, y = cy + dy; const meta = SLOT_META[slot];
      lines.moveTo(x, y).lineTo(cx + dx * 0.35, cy + dy * 0.22 + 4).stroke({ width: 1.5, color: 0x6fc7e8, alpha: 0.35 });
      const s = new Container(); s.x = x; s.y = y; P.addChild(s); s.eventMode = 'static'; s.cursor = 'pointer'; s.hitArea = new Rectangle(-44, -34, 88, 78);
      s.ring = new Graphics(); s.addChild(s.ring);
      const ic = ico(meta.icon, 28, meta.col); ic.x = -14; ic.y = -14; s.addChild(ic); s.ic = ic;
      s.pips = new Graphics(); s.addChild(s.pips);
      s.nameL = new Label({ text: meta.name.toUpperCase(), preset: 'headSm', size: 8, color: 0x9ec9e8, w: 90, align: 'center' }); s.nameL.x = -45; s.nameL.y = 32; s.addChild(s.nameL);
      s.itemL = new Label({ text: '', preset: 'tiny', size: 11, color: C.cream, w: 110, align: 'center', h: 14, fit: true }); s.itemL.x = -55; s.itemL.y = 44; s.addChild(s.itemL);
      const key = new Label({ text: String(i + 1), preset: 'num', size: 10, color: 0x9ec9e8 }); key.x = -38; key.y = -30; s.addChild(key);
      s.on('pointertap', () => { if (Input.clickAllowed()) this._pickSlot(slot); });
      s.on('pointerover', () => { s.hov = true; this._paintSocket(slot); sfx('hover'); }); s.on('pointerout', () => { s.hov = false; this._paintSocket(slot); });
      this.sockets[slot] = s;
    });
    Anim.watch(P, (dt, t) => { const s = this.sockets[this.slot]; if (s && !s.destroyed) { s.ring.alpha = 0.75 + 0.25 * Math.sin(t * 4); } });
  }
  _installedIn(slot) { const st = this.g.state; for (const id of st.upgrades) { const u = upgradeById(id); if (u && u.slot === slot) return u; } return null; }
  _paintSocket(slot) {
    const s = this.sockets[slot]; const meta = SLOT_META[slot]; const u = this._installedIn(slot); const sel = this.slot === slot;
    const g = s.ring; g.clear();
    g.circle(0, 0, 31).fill({ color: 0x000000, alpha: 0.35 });
    g.circle(0, 0, 28).fill({ color: u ? darken(meta.col, 0.65) : 0x0a1a30 });
    g.circle(0, 0, 28).stroke({ width: sel ? 4 : 2.5, color: sel ? C.brassLight : u ? meta.col : 0x2d6f9a, alpha: sel ? 1 : 0.95 });
    if (!u) { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.moveTo(Math.cos(a) * 33, Math.sin(a) * 33).lineTo(Math.cos(a + 0.2) * 33, Math.sin(a + 0.2) * 33); } g.stroke({ width: 1, color: 0x6fc7e8, alpha: 0.4 }); }
    if (s.hov) g.circle(0, 0, 33).stroke({ width: 2, color: C.brassLight, alpha: 0.7 });
    s.ic.alpha = u ? 1 : 0.45;
    s.pips.clear(); const tier = u ? u.tier : 0;
    for (let i = 0; i < 3; i++) s.pips.circle(-10 + i * 10, 21, 2.6).fill({ color: i < tier ? C.mustard : 0x1a3550 });
    s.itemL.setText(u ? u.name : 'empty'); s.itemL.setColor(u ? C.cream : 0x5d86a8);
  }

  // ---------------------------------------------------------------- stats panel
  _statsPanel() {
    const y0 = 358; const H = this.BH - y0; const P = this.statP = new Container(); P.y = y0; this.root.addChild(P);
    P.addChild(well(LW, H));
    const t = new Label({ text: 'SHIP STATS', preset: 'headSm', size: 10, color: C.brassLight }); t.x = 16; t.y = 10; P.addChild(t);
    this.statHint = new Label({ text: '', preset: 'tiny', size: 11, color: C.tealLight, w: 340, align: 'right' }); this.statHint.x = LW - 356; this.statHint.y = 10; P.addChild(this.statHint);
    this.statBody = new Container(); this.statBody.y = 34; P.addChild(this.statBody); this.statH = H;
    const sl = new Label({ text: '', preset: 'tiny', size: 12, color: C.textDim }); sl.x = 16; sl.y = H - 24; P.addChild(sl); this.slotsL = sl;
    this.credL = new Label({ text: '', preset: 'num', size: 16, color: C.mustard, w: 260, align: 'right' }); this.credL.x = LW - 276; this.credL.y = H - 28; P.addChild(this.credL);
  }
  _drawStats() {
    const swap = this.sel && !statusFor(this.g, upgradeById(this.sel), this.hasYard).owned ? this.sel : null;
    const rows = statRows(this.g, swap); const B = this.statBody; B.removeChildren().forEach((c) => c.destroy({ children: true }));
    const colW = (LW - 40) / 2; const rh = Math.floor((this.statH - 34 - 30) / 6);
    rows.forEach((r, i) => {
      const col = i < 6 ? 0 : 1; const row = i < 6 ? i : i - 6; const x = 16 + col * (colW + 8); const y = row * rh;
      const d = r.b - r.a; const better = r.lowerBetter ? d < -1e-6 : d > 1e-6; const worse = r.lowerBetter ? d > 1e-6 : d < -1e-6;
      const bg = new Graphics(); bg.roundRect(x, y, colW, rh - 4, 7).fill({ color: 0x0a0c22, alpha: row % 2 ? 0.3 : 0.55 }); B.addChild(bg);
      const ic = ico(r.icon, 18, C.tealLight); ic.x = x + 8; ic.y = y + (rh - 4 - 18) / 2; B.addChild(ic);
      const nm = new Label({ text: r.name, preset: 'small', size: 13, color: C.cream }); nm.x = x + 32; nm.y = y + (rh - 4 - nm.textHeight) / 2; B.addChild(nm);
      const vb = new Label({ text: r.fmt(r.a), preset: 'num', size: 13, color: better || worse ? C.textDim : C.cream, w: 56, align: 'right' }); vb.x = x + colW - 160; vb.y = y + (rh - 4 - vb.textHeight) / 2; B.addChild(vb);
      if (better || worse) {
        const ar = new Label({ text: '→', preset: 'num', size: 13, color: C.textDim }); ar.x = x + colW - 98; ar.y = vb.y; B.addChild(ar);
        const va = new Label({ text: r.fmt(r.b), preset: 'num', size: 14, color: better ? C.good : C.coral, w: 56, align: 'right' }); va.x = x + colW - 66; va.y = vb.y - 1; B.addChild(va); fadeIn(va, 300, 4);
      }
    });
    this.statHint.setText(swap ? 'PREVIEW: ' + upgradeById(swap).name.toUpperCase() : 'CURRENT');
    const st = this.g.state; const used = this.g.shipStats().slots.used;
    this.slotsL.setText(`${used} / 8 SLOTS FITTED`); this.credL.setText(num(st.credits) + ' scrip');
  }

  // ---------------------------------------------------------------- right: slot list + detail
  _rightPanel() {
    const R = this.R = new Container(); R.x = this.RX; this.root.addChild(R);
    this.slotTitle = new Label({ text: '', preset: 'head', size: 17, color: C.brassLight, w: this.RW - 300, h: 26, fit: true, upper: true }); R.addChild(this.slotTitle);
    this.yardNote = new Container(); this.yardNote.x = this.RW - 280; this.yardNote.y = 0; R.addChild(this.yardNote);
    this.listPane = new ScrollPane({ w: this.RW, h: 262, bottomPad: 4 }); this.listPane.y = 34; R.addChild(this.listPane);
    this.detail = new Container(); this.detail.y = 34 + 262 + 10; R.addChild(this.detail); this.DH = this.BH - this.detail.y;
  }
  _slotItems(slot) {
    const list = allUpgrades().filter((u) => u.slot === slot);
    const order = { explorer: 0, trader: 1, diplomat: 2, caretaker: 3, daredevil: 4, general: 5 };
    return list.sort((a, b) => (order[a.build] - order[b.build]) || (a.tier - b.tier) || (a.cost - b.cost));
  }
  _pickSlot(slot) {
    if (this.slot === slot && this.sel) return;
    this.slot = slot; this.sel = null; sfx('page', { vol: 0.5, pitch: 1.2 });
    Object.keys(this.sockets).forEach((k) => this._paintSocket(k)); this._buildList(); this._drawStats();
  }
  _buildList() {
    const slot = this.slot; const meta = SLOT_META[slot]; const inst = this._installedIn(slot);
    this.slotTitle.setText(`${meta.name} · ${inst ? 'fitted: ' + inst.name : 'empty socket'}`); this.slotTitle.setColor(meta.col === C.mustard ? C.brassLight : lighten(meta.col, 0.3));
    this.yardNote.removeChildren().forEach((c) => c.destroy({ children: true }));
    const yp = pill({ icon: this.hasYard ? 'check' : 'lock', text: this.hasYard ? 'SHIPYARD OPEN' : 'VIEW ONLY · DOCK AT A YARD', color: this.hasYard ? C.good : C.mustard, h: 22, size: 10, preset: 'headSm', padX: 10 }); yp.x = 280 - yp.w; yp.y = 2; this.yardNote.addChild(yp);
    const c = this.listPane.content; c.removeChildren().forEach((x) => x.destroy({ children: true }));
    let y = 0; let lastBuild = null; this.cards = {}; const W = this.RW - 12;
    const items = this._slotItems(slot);
    if (!this.sel) { const pick = items.find((u) => statusFor(this.g, u, this.hasYard).available) || inst || items[0]; this.sel = pick ? pick.id : null; }
    for (const u of items) {
      if (u.build !== lastBuild) {
        lastBuild = u.build; const bm = BUILD_META[u.build] || BUILD_META.general;
        const h = new Label({ text: bm.name.toUpperCase() + ' BRANCH', preset: 'headSm', size: 9, color: bm.col }); h.y = y + 2; c.addChild(h);
        const ln = new Graphics(); ln.rect(h.textWidth + 10, y + 8, W - h.textWidth - 10, 1).fill({ color: bm.col, alpha: 0.35 }); c.addChild(ln); y += 20;
      }
      const st = statusFor(this.g, u, this.hasYard); const card = this._card(u, st, W); card.y = y; c.addChild(card); this.cards[u.id] = card; y += card.h + 6;
    }
    this.listPane.refresh(); this._paintCards();
    const cd = this.cards[this.sel]; if (cd) this.listPane.scrollToChild(cd);
    this._detail();
  }
  _card(u, st, W) {
    const h = 58; const c = new Container(); c.h = h; c.u = u; c.eventMode = 'static'; c.cursor = 'pointer'; c.hitArea = new Rectangle(0, 0, W, h);
    c.bg = new Graphics(); c.addChild(c.bg); c.st = st;
    const bm = BUILD_META[u.build] || BUILD_META.general;
    for (let i = 0; i < 3; i++) { const d = new Graphics(); d.poly([0, -5, 5, 0, 0, 5, -5, 0]).fill(i < u.tier ? C.mustard : 0x2b2f66); d.x = 22; d.y = 14 + i * 14; c.addChild(d); }
    const nm = new Label({ text: u.name, preset: 'bodyB', size: 16, color: st.owned ? C.tealLight : st.available || (!st.reward && st.reason && !/standing|Requires|Awarded|Dock/.test(st.reason)) ? C.cream : C.textDim, w: W - 190, h: 22, fit: true }); nm.x = 46; nm.y = 6; c.addChild(nm);
    const ents = bonusEntries(u.bonus).slice(0, 3).map((e) => e.text).join('  ·  ');
    const sub = new Label({ text: ents || (u.special ? 'Special equipment' : ''), preset: 'tiny', size: 12, color: C.textDim, w: W - 190, h: 16, fit: true }); sub.x = 46; sub.y = 30; c.addChild(sub);
    if (!st.owned && !st.reward && (st.available || st.price)) { const pr = new Label({ text: num(st.price ?? u.cost), preset: 'num', size: 17, color: st.available ? C.mustard : C.textDim }); pr.x = W - 16 - pr.textWidth; pr.y = 6; c.addChild(pr); const cn = ico('credits', 16, st.available ? C.mustard : C.textDim); cn.x = pr.x - 20; cn.y = 8; c.addChild(cn); }
    if (st.owned) { const p = pill({ icon: 'check', text: 'INSTALLED', color: C.tealLight, h: 22, size: 9, preset: 'headSm', padX: 8 }); p.x = W - p.w - 12; p.y = 6; c.addChild(p); }
    else if (st.reward) { const p = pill({ icon: 'star', text: 'MISSION REWARD', color: C.mustard, h: 22, size: 9, preset: 'headSm', padX: 8 }); p.x = W - p.w - 12; p.y = 6; c.addChild(p); }
    else if (!st.available) { const lk = ico('lock', 16, C.mustard); lk.x = W - 30; lk.y = 33; c.addChild(lk); }
    const tag = pill({ text: bm.name.toUpperCase(), color: bm.col, h: 16, size: 8, preset: 'headSm', padX: 7 }); tag.x = W - tag.w - (st.owned || st.reward || !st.available ? 36 : 14); tag.y = 34; c.addChild(tag); if (!st.owned && !st.reward && st.available) tag.x = W - tag.w - 14;
    c.on('pointerover', () => { c.hov = true; this._paintCards(); sfx('hover'); }); c.on('pointerout', () => { c.hov = false; this._paintCards(); });
    c.on('pointertap', () => { if (!Input.clickAllowed()) return; this.sel = u.id; sfx('click'); this._paintCards(); this._detail(); this._drawStats(); });
    c.W = W; return c;
  }
  _paintCards() {
    for (const id in this.cards) {
      const c = this.cards[id]; if (c.destroyed) continue; const sel = this.sel === id; const g = c.bg; const W = c.W; g.clear();
      const bm = BUILD_META[c.u.build] || BUILD_META.general;
      g.roundRect(0, 0, W, c.h, 10).fill({ color: sel ? 0x3b4399 : c.hov ? 0x2a3070 : 0x181c46 });
      g.roundRect(0, 0, 5, c.h, 3).fill({ color: bm.col, alpha: sel ? 1 : 0.5 });
      if (c.st.owned) g.roundRect(0, 0, W, c.h, 10).stroke({ width: 1.5, color: C.tealLight, alpha: 0.6 });
      if (sel) g.roundRect(0, 0, W, c.h, 10).stroke({ width: 2, color: C.brassLight });
    }
  }
  _stepItem(d) {
    const items = this._slotItems(this.slot); if (!items.length) return; const i = Math.max(0, items.findIndex((u) => u.id === this.sel));
    this.sel = items[(i + d + items.length) % items.length].id; sfx('hover'); this._paintCards(); this._detail(); this._drawStats(); const c = this.cards[this.sel]; if (c) this.listPane.scrollToChild(c);
  }

  _detail() {
    const D = this.detail; D.removeChildren().forEach((c) => c.destroy({ children: true }));
    const W = this.RW; D.addChild(well(W, this.DH));
    const u = this.sel ? upgradeById(this.sel) : null; if (!u) return;
    const st = statusFor(this.g, u, this.hasYard); const bm = BUILD_META[u.build] || BUILD_META.general; const meta = SLOT_META[u.slot];
    const ic = ico(meta.icon, 34, meta.col); ic.x = 16; ic.y = 14; D.addChild(ic);
    const nm = new Label({ text: u.name, preset: 'head', size: 16, color: C.brassLight, w: W - 230, h: 24, fit: true, upper: true }); nm.x = 62; nm.y = 10; D.addChild(nm);
    const sub = new Label({ text: `TIER ${u.tier} · ${meta.name.toUpperCase()} · ${bm.name.toUpperCase()} BRANCH`, preset: 'headSm', size: 9, color: bm.col }); sub.x = 62; sub.y = 38; D.addChild(sub);
    const desc = new Label({ text: u.desc || '', preset: 'small', size: 14, lineHeight: 18, color: C.cream, w: W - 36, maxLines: 2 }); desc.x = 18; desc.y = 58; D.addChild(desc);
    const fl = new Label({ text: u.flavor ? '“' + u.flavor + '”' : '', preset: 'tiny', size: 12, color: C.textDim, w: W - 36, maxLines: 2 }); fl.x = 18; fl.y = 58 + Math.min(desc.textHeight, 38) + 4; D.addChild(fl);
    let y = fl.y + Math.min(fl.textHeight, 30) + 8;
    // bonus chips vs installed
    const ents = bonusEntries(u.bonus, u.special); let x = 18;
    for (const e of ents) {
      if (e.special) { const l = new Label({ text: e.text, preset: 'small', size: 12, color: C.tealLight, w: W - 36 }); l.x = 18; l.y = y; D.addChild(l); y += l.textHeight + 4; continue; }
      const p = pill({ text: e.text, color: e.good ? C.good : C.coral, h: 22, size: 11, padX: 9 });
      if (x + p.w > W - 18) { x = 18; y += 26; } p.x = x; p.y = y; x += p.w + 6; D.addChild(p);
    }
    y += 30;
    const inst = this._installedIn(u.slot);
    // status line
    let msg = '', mcol = C.textDim;
    if (st.owned) { msg = 'Installed on the Halcyon.'; mcol = C.tealLight; }
    else if (st.reward) { msg = 'Awarded through missions and favours — cannot be bought.'; mcol = C.mustard; }
    else if (!st.available && st.reason) { msg = st.reason; mcol = C.mustard; }
    else if (inst) { msg = `Replaces ${inst.name} — trade-in ${num(st.tradeIn)} scrip.`; mcol = C.tealLight; }
    if (msg) { const ml = new Label({ text: msg, preset: 'small', size: 13, color: mcol, w: W - 60 }); ml.x = 18; ml.y = this.DH - 94; D.addChild(ml); if (!st.available && !st.owned) { const lk = ico('lock', 16, C.mustard); lk.x = 18; lk.y = ml.y; ml.x = 40; D.addChild(lk); } }
    // buttons
    const canBuy = this.hasYard && st.available && !st.owned;
    const price = st.price ?? u.cost;
    const bb = new Button({ label: st.owned ? 'Installed' : st.reward ? 'Reward only' : `Install · ${num(price)}`, icon: st.owned ? 'check' : 'credits', w: 220, h: 46, variant: 'primary', disabled: !canBuy, disabledReason: !this.hasYard ? 'Dock at a shipyard first.' : st.reason || '', tooltip: 'Install (Enter)', onClick: () => this._buy() });
    bb.x = W - 238; bb.y = this.DH - 62; D.addChild(bb);
    if (st.owned) {
      const refund = Math.floor((u.cost || 0) * 0.5);
      const sb = new Button({ label: `Sell · +${num(refund)}`, w: 200, h: 36, variant: 'coral', fontSize: 14, disabled: !this.hasYard || !u.cost, disabledReason: !this.hasYard ? 'Dock at a shipyard first.' : 'This one cannot be sold.', tooltip: 'Sell back for half its cost (X)', onClick: () => this._sell() });
      sb.x = W - 238 - 214; sb.y = this.DH - 57; D.addChild(sb); bb.setVariant('teal');
    }
    this.buyBtn = bb;
  }

  // ---------------------------------------------------------------- actions
  async _buy() {
    const u = this.sel && upgradeById(this.sel); if (!u) return;
    const st = statusFor(this.g, u, this.hasYard);
    if (!this.hasYard || !st.available || st.owned) { sfx('deny'); if (this.buyBtn) shake(this.buyBtn); return; }
    const inst = this._installedIn(u.slot);
    const txt = inst ? `Install ${u.name} for ${num(st.price)} scrip?\n(${num(u.cost)} less ${num(st.tradeIn)} trade-in for ${inst.name}.)` : `Install ${u.name} for ${num(st.price)} scrip?`;
    const ok = await Modal.confirm(txt, { title: 'CONFIRM INSTALL', yes: 'Install', no: 'Not yet' });
    if (!ok || this.modal.destroyed) return;
    const r = this.g.buyUpgrade(u.id);
    if (!r.ok) { this.ui.toast(r.reason || 'Could not install.', 'bad'); sfx('deny'); return; }
    this._installFx(u);
  }
  async _sell() {
    const u = this.sel && upgradeById(this.sel); if (!u || !this._installedIn(u.slot) || this._installedIn(u.slot).id !== u.id) return;
    const refund = Math.floor((u.cost || 0) * 0.5);
    const ok = await Modal.confirm(`Sell ${u.name} back to the yard for ${num(refund)} scrip? The socket will be left empty.`, { title: 'CONFIRM SALE', yes: 'Sell', no: 'Keep it' });
    if (!ok || this.modal.destroyed) return;
    const r = this.g.sellUpgrade(u.id);
    if (!r.ok) { this.ui.toast(r.reason || 'Could not sell.', 'bad'); sfx('deny'); return; }
    const s = this.sockets[u.slot]; try { const b = S.gfx.burst(s.x, s.y, C.mustard, 14); this.sch.addChild(b); } catch (e) { /* */ }
  }
  _installFx(u) {
    const s = this.sockets[u.slot]; if (!s) return;
    sfx('fanfare'); setTimeout(() => sfx('powerup'), 200);
    const ring = new Graphics(); ring.circle(0, 0, 30).stroke({ width: 5, color: C.brassLight }); ring.x = s.x; ring.y = s.y; this.sch.addChild(ring);
    Anim.to(ring.scale, { x: 4, y: 4 }, 800, { ease: 'outCubic' }); Anim.to(ring, { alpha: 0 }, 800, { ease: 'linear', onDone: () => ring.destroy() });
    try { this.sch.addChild(S.gfx.burst(s.x, s.y, C.brassLight, 26)); this.sch.addChild(S.gfx.burst(s.x, s.y, C.tealLight, 16)); } catch (e) { /* */ }
    popIn(s.ic, { from: 0.2, ms: 500 });
    if (this.ship) { Anim.to(this.ship, { alpha: 0.5 }, 120, { onDone: () => Anim.to(this.ship, { alpha: 0.95 }, 500) }); }
    const lab = new Label({ text: u.name.toUpperCase() + ' INSTALLED', preset: 'head', size: 14, color: C.brassLight, shadow: true }); lab.x = this.cx - lab.textWidth / 2; lab.y = this.cy - 20; this.sch.addChild(lab);
    Anim.to(lab, { y: lab.y - 40, alpha: 0 }, 1800, { delay: 400, ease: 'outCubic', onDone: () => !lab.destroyed && lab.destroy() });
    this.sel = u.id;
  }

  _refresh(first) {
    if (!this.modal || this.modal.destroyed) return;
    if (this.g.state.pending) return;
    Object.keys(this.sockets).forEach((k) => this._paintSocket(k));
    const keep = this.listPane.scrollY; this._buildList(); this.listPane.scrollTo(keep); this._drawStats();
  }
}
