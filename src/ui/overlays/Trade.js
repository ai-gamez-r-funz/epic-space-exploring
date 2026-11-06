import { Container, Graphics, Rectangle } from 'pixi.js';
import { Overlay } from './Overlay.js';
import { C, grad, lighten } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Button } from '../kit/Button.js';
import { Bar } from '../kit/Bar.js';
import { Tabs } from '../kit/Tabs.js';
import { Slider } from '../kit/Slider.js';
import { ScrollPane } from '../kit/Scroll.js';
import { Tooltip } from '../kit/Tooltip.js';
import { Input } from '../kit/input.js';
import { Anim } from '../kit/anim.js';
import { S, sfx } from '../services.js';
import { quoteBuy, quoteSell } from '../../core/economy.js';
import { ico, pill, well, hr, emblem, goodIco, live, num, cap, sgn, countTo, fadeIn, shake, factionOf, factionName, factionCol, goodDef, RES_COL } from './parts/common.js';

const TW = 700; // table width
const COL = { name: 48, held: 258, stock: 306, buy: 360, sell: 432, trend: 512, tag: 540 };

const arrow = (dir, col) => { const g = new Graphics(); if (dir > 0) g.poly([0, 8, 5, 0, 10, 8]).fill(col); else if (dir < 0) g.poly([0, 0, 5, 8, 10, 0]).fill(col); else g.rect(0, 3, 10, 2.5).fill({ color: C.textDim, alpha: 0.7 }); return g; };

/**
 * Trade - station market + services. Opened with T when docked, or automatically after an event with {shop:true}.
 * Market tab: goods table (prices, trend, stock, held), detail pane with quantity stepper and exact quotes (price impact
 * included). Services tab: repair / refuel / restock with sliders. Everything goes through game.buy/sell/repair/refuel/restock.
 */
export class Trade extends Overlay {
  title = 'TRADE & SERVICES'; size = { w: 1100, h: 640 };

  build(modal, params = {}) {
    this.g = this.game; this.qty = 1; this.sel = null; this.shift = false; this.svc = {};
    const g = this.g; const st = g.state; const sys = g.here();
    this.sys = sys;
    if (params.fromEvent && !st.docked && sys?.station) { try { g.dock(); } catch (e) { /* */ } }
    this.root = new Container(); modal.body.addChild(this.root);
    if (!sys?.station) { const l = new Label({ text: 'There is no station here. Find a port of call and dock to trade.', preset: 'body', w: modal.bodyW, color: C.cream }); this.root.addChild(l); return; }
    if (!g.state.paid) { /* in-memory only; profit hints */ }
    g.__paid = g.__paid || {};
    this._kd = (e) => { if (e.key === 'Shift') this.shift = true; }; this._ku = (e) => { if (e.key === 'Shift') this.shift = false; };
    window.addEventListener('keydown', this._kd); window.addEventListener('keyup', this._ku);
    this._offs.push(() => { window.removeEventListener('keydown', this._kd); window.removeEventListener('keyup', this._ku); });
    this._banner(modal.bodyW);
    const has = (s) => sys.station.services.includes(s);
    this.tabs = new Tabs({ w: 520, tabs: [{ id: 'market', label: 'Market', icon: 'credits' }, { id: 'services', label: 'Repair & Refuel', icon: 'engineering' }], selected: params.tab || (has('trade') ? 'market' : 'services'), cycleKeys: true, tabH: 36 });
    this.tabs.y = 96; this.root.addChild(this.tabs);
    this.done = new Button({ label: 'Done', icon: 'check', w: 130, h: 36, variant: 'primary', onClick: () => this.close(), fontSize: 14, tooltip: 'Close (Esc)' }); this.done.x = modal.bodyW - 130; this.done.y = 96; this.root.addChild(this.done);
    this.PH = modal.bodyH - 96 - 46;
    this.marketPane = this.tabs.panes.market; this.svcPane = this.tabs.panes.services;
    this.marketPane.y = this.svcPane.y = 96 + 46;
    this.root.addChild(this.marketPane, this.svcPane); // panes were children of tabs (relative y); re-parent at absolute y
    this._buildMarket(); this._buildServices();
    Input.bind(this.root, 'b', () => this._buy(this.shift ? this._maxBuy() : this.qty));
    Input.bind(this.root, 's', () => this._sell(this.shift ? this._held() : this.qty));
    Input.bind(this.root, 'a', () => this._sell(this._held()));
    Input.bind(this.root, ['ArrowDown'], () => this._step(1)); Input.bind(this.root, ['ArrowUp'], () => this._step(-1));
    Input.bind(this.root, ['+', '=', 'ArrowRight'], () => this._setQty(this.qty + 1)); Input.bind(this.root, ['-', 'ArrowLeft'], () => this._setQty(this.qty - 1));
    this.watch(() => this._refresh(true));
    this._refresh(false);
    this.tabs.o.onChange = () => { sfx('page', { vol: 0.5 }); this.marketPane.visible = this.tabs.current === 'market'; this.svcPane.visible = this.tabs.current === 'services'; };
    this.marketPane.visible = this.tabs.current === 'market'; this.svcPane.visible = this.tabs.current === 'services';
    try { this.ui.layers.toast.visible = false; } catch (e) { /* */ } // floats + inline notes carry feedback; keep the banner clear
    this.ui.music('station');
  }
  onClose() { try { this.ui.layers.toast.visible = true; } catch (e) { /* */ } this._offs.splice(0).forEach((f) => f()); const scene = this.ui.sceneName; this.ui.music(scene === 'GalaxyMap' ? 'map' : 'bridge'); }

  // -------------------------------------------------------------------- banner
  _banner(W) {
    const st = this.sys.station; const fid = st.faction; const f = factionOf(fid); const col = factionCol(fid);
    const b = new Container(); this.root.addChild(b);
    const bg = well(W, 84); b.addChild(bg);
    const stripe = new Graphics(); stripe.roundRect(2, 2, 8, 80, 4).fill({ color: col }); b.addChild(stripe);
    const em = emblem(fid || 'concord', 58); em.x = 24; em.y = 13; if (fid && fid !== 'none') b.addChild(em);
    const nm = new Label({ text: st.name, preset: 'head', size: 20, color: C.brassLight, w: 430, h: 28, fit: true, upper: true }); nm.x = 96; nm.y = 10; b.addChild(nm);
    const sub = new Label({ text: `${cap(st.kind)} · ${fid && fid !== 'none' ? factionName(fid) : 'Independent'} · ${this.sys.name}`, preset: 'tiny', size: 12, color: C.tealLight, w: 430, fit: true, h: 16 }); sub.x = 96; sub.y = 40; b.addChild(sub);
    const greets = f?.greetings?.length ? f.greetings : [f?.greeting || 'Welcome aboard. Mind the gap.'];
    let h = 0; for (const ch of String(this.sys.id) + st.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    h = (h + this.g.state.day) % greets.length;
    const gr = new Label({ text: '“' + greets[h].replace(/^"|"$/g, '') + '”', preset: 'small', size: 13, color: C.cream, w: 430, h: 30, fit: true }); gr.x = 96; gr.y = 58; gr.alpha = 0.85; b.addChild(gr);
    // right: credits, cargo, standing
    const cx = 560;
    const cic = ico('credits', 26, C.mustard); cic.x = cx; cic.y = 10; b.addChild(cic);
    this.credL = new Label({ text: '', preset: 'num', size: 24, color: C.mustard }); this.credL.x = cx + 34; this.credL.y = 8; b.addChild(this.credL);
    const scrip = new Label({ text: 'SCRIP', preset: 'headSm', size: 10, color: C.textDim }); scrip.x = cx + 34; scrip.y = 40; b.addChild(scrip); this.scripL = scrip;
    this.cargoBar = new Bar({ w: 210, h: 20, value: 0, max: 16, icon: 'cargo', color: C.sage, showMax: true, tooltip: 'Cargo hold: space used / capacity' }); this.cargoBar.x = cx + 190; this.cargoBar.y = 12; b.addChild(this.cargoBar);
    const cl = new Label({ text: 'CARGO HOLD', preset: 'headSm', size: 10, color: C.textDim }); cl.x = cx + 190 + 30; cl.y = 38; b.addChild(cl);
    this.standing = new Container(); this.standing.x = cx + 190; this.standing.y = 56; b.addChild(this.standing);
    this.sayL = new Label({ text: '', preset: 'tiny', size: 12, color: C.coral, w: 180 }); this.sayL.x = cx; this.sayL.y = 62; this.sayL.alpha = 0; b.addChild(this.sayL);
    this.banner = b;
    this._credShown = this.g.state.credits; this.credL.setText(num(this._credShown));
  }
  _updateBanner() {
    const st = this.g.state; const m = this.market;
    if (st.credits !== this._credShown) { countTo(this.credL, this._credShown, st.credits, 500); const up = st.credits > this._credShown; this._credShown = st.credits; this.credL.setColor(up ? C.good : C.coral); Anim.to({}, {}, 1, { delay: 600, onDone: () => !this.credL.destroyed && this.credL.setColor(C.mustard) }); }
    const used = m ? m.cargoUsed : this.g.cargoUsed(); const mx = m ? m.cargoMax : st.ship.cargoMax;
    this.cargoBar.set(used, mx);
    this.standing.removeChildren().forEach((c) => c.destroy({ children: true }));
    const fid = this.sys.station.faction; if (fid && fid !== 'none') {
      const rep = Math.round(st.rep[fid] || 0); const title = S.content.repTitle ? S.content.repTitle(rep) : '';
      const p = pill({ text: `${title ? title + ' · ' : ''}${sgn(rep)}`, color: rep >= 0 ? C.tealLight : C.coral, h: 20, size: 11, padX: 8, tip: { title: `Standing with ${factionName(fid)}`, body: 'Better standing means friendlier prices on services here.' } }); this.standing.addChild(p);
    }
  }

  // -------------------------------------------------------------------- market tab
  _buildMarket() {
    const P = this.marketPane; const has = this.sys.station.services.includes('trade');
    if (!has) { const l = new Label({ text: 'This station keeps no market. Try the Repair & Refuel tab.', preset: 'body', color: C.textDim, w: 600 }); l.y = 20; P.addChild(l); return; }
    const hd = new Container(); P.addChild(hd);
    [['GOOD', COL.name], ['HELD', COL.held, 'c', 44], ['STOCK', COL.stock, 'c', 50], ['BUY', COL.buy, 'r', 60], ['SELL', COL.sell, 'r', 60], ['', COL.trend], ['HINT', COL.tag]].forEach(([t, x, al, w]) => {
      const l = new Label({ text: t, preset: 'headSm', size: 9, color: C.textDim, w: w || 100, align: al === 'c' ? 'center' : al === 'r' ? 'right' : 'left' }); l.x = x; l.y = 4; hd.addChild(l);
    });
    hd.addChild(hr(TW + 4)); hd.getChildAt(hd.children.length - 1).y = 22;
    this.pane = new ScrollPane({ w: TW + 6, h: this.PH - 30, bottomPad: 6 }); this.pane.y = 30; P.addChild(this.pane);
    this.detail = new Container(); this.detail.x = TW + 20; P.addChild(this.detail);
  }
  _rows() {
    const m = this.market; if (!m) return;
    const keep = this.pane.scrollY; const c = this.pane.content; c.removeChildren().forEach((x) => x.destroy({ children: true }));
    const fac = factionOf(this.sys.station.faction);
    let y = 0; this.rowNodes = {};
    m.goods.forEach((gd, i) => {
      const row = new Container(); row.y = y; row.h = 46; c.addChild(row); this.rowNodes[gd.id] = row;
      row.eventMode = 'static'; row.cursor = 'pointer'; row.hitArea = new Rectangle(0, 0, TW, 44);
      const bg = new Graphics(); row.addChild(bg);
      row.paint = (hov) => { bg.clear(); const sel = this.sel === gd.id; bg.roundRect(0, 0, TW, 44, 9).fill({ color: sel ? 0x3b4399 : hov ? 0x2a3070 : i % 2 ? 0x14173a : 0x181c46, alpha: sel ? 1 : 0.9 }); if (sel) bg.roundRect(0, 0, TW, 44, 9).stroke({ width: 2, color: C.brassLight }); };
      row.paint(false);
      const ic = goodIco(gd.id, 32); ic.x = 8; ic.y = 6; row.addChild(ic);
      const like = fac?.likes?.includes(gd.id) ? 1 : fac?.dislikes?.includes(gd.id) ? -1 : 0;
      const nm = new Label({ text: gd.name, preset: 'bodyB', size: 15, color: C.cream, w: COL.held - COL.name - (like ? 22 : 4), h: 20, fit: true }); nm.x = COL.name; nm.y = 5; row.addChild(nm);
      const sub = new Label({ text: cap(gd.category) + (gd.bulk > 1 ? ' · bulky x' + gd.bulk : ''), preset: 'tiny', size: 10, color: C.textDim }); sub.x = COL.name; sub.y = 26; row.addChild(sub);
      if (like) { const h = ico(like > 0 ? 'morale' : 'warning', 14, like > 0 ? C.good : C.coral); h.x = COL.name + Math.min(nm.textWidth, COL.held - COL.name - 22) + 4; h.y = 7; h.eventMode = 'static'; row.addChild(h); Tooltip.attach(h, { title: like > 0 ? `${factionName(fac.id)} likes this` : `${factionName(fac.id)} dislikes this`, body: like > 0 ? 'Slightly better prices here.' : 'Slightly worse prices here.', tone: like > 0 ? 'good' : 'bad' }); }
      const held = new Label({ text: gd.held ? String(gd.held) : '–', preset: 'num', size: 15, color: gd.held ? C.tealLight : C.textDim, w: 44, align: 'center' }); held.x = COL.held; held.y = 12; row.addChild(held);
      const stock = new Label({ text: gd.stock > 0 ? String(gd.stock) : 'out', preset: 'num', size: 14, color: gd.stock > 0 ? C.cream : C.coral, w: 50, align: 'center' }); stock.x = COL.stock; stock.y = 13; row.addChild(stock);
      const base = gd.base || 1;
      const bcol = gd.buy == null ? C.textDim : gd.buy < base * 0.92 ? C.good : gd.buy > base * 1.1 ? C.coral : C.cream;
      const scol = gd.sell > base * 1.08 ? C.good : gd.sell < base * 0.92 ? C.coral : C.cream;
      const bl = new Label({ text: gd.buy == null ? '–' : String(gd.buy), preset: 'num', size: 16, color: bcol, w: 60, align: 'right' }); bl.x = COL.buy; bl.y = 11; row.addChild(bl);
      const sl = new Label({ text: gd.held || gd.sell ? String(gd.sell) : '–', preset: 'num', size: 16, color: scol, w: 60, align: 'right' }); sl.x = COL.sell; sl.y = 11; row.addChild(sl);
      const ar = arrow(gd.trend, gd.trend > 0 ? C.coral : gd.trend < 0 ? C.good : C.textDim); ar.x = COL.trend + 4; ar.y = 18; row.addChild(ar); ar.eventMode = 'static';
      Tooltip.attach(ar, { title: gd.trend > 0 ? 'Prices rising' : gd.trend < 0 ? 'Prices falling' : 'Steady prices', body: 'Compared with five days ago.' });
      const hint = this._hint(gd); if (hint) { const p = pill({ text: hint.text, color: hint.col, h: 20, size: 10, padX: 8, preset: 'headSm' }); p.x = COL.tag; p.y = 12; row.addChild(p); }
      row.on('pointerover', () => row.paint(true)); row.on('pointerout', () => row.paint(false));
      row.on('pointertap', () => { if (Input.clickAllowed()) { this._select(gd.id); sfx('click'); } });
      y += 48;
    });
    this.pane.refresh(); this.pane.scrollTo(keep);
  }
  _hint(gd) {
    const base = gd.base || 1; const paid = this.g.__paid[gd.id];
    if (gd.held && paid && paid.n) { const avg = paid.cost / paid.n; const p = Math.round(((gd.sell - avg) / avg) * 100); return { text: `${p >= 0 ? 'PROFIT' : 'LOSS'} ${sgn(p)}%`, col: p >= 0 ? C.good : C.coral }; }
    if (gd.held && gd.sell > base * 1.08) return { text: `SELL HIGH +${Math.round((gd.sell / base - 1) * 100)}%`, col: C.good };
    if (gd.buy != null && gd.buy < base * 0.92) return { text: `CHEAP −${Math.round((1 - gd.buy / base) * 100)}%`, col: C.good };
    if (gd.buy != null && gd.buy > base * 1.1) return { text: `DEAR +${Math.round((gd.buy / base - 1) * 100)}%`, col: C.coral };
    if (gd.sell < base * 0.92 && gd.held) return { text: `LOW −${Math.round((1 - gd.sell / base) * 100)}%`, col: C.coral };
    return null;
  }
  _good() { return this.market?.goods.find((x) => x.id === this.sel) || null; }
  _held() { return this._good()?.held || 0; }
  _maxBuy() {
    const gd = this._good(); if (!gd || gd.buy == null) return 0; const st = this.g.state; const m = this.market;
    const fit = Math.floor((m.cargoMax - m.cargoUsed) / (gd.bulk || 1)); let q = Math.max(0, Math.min(gd.stock, fit));
    while (q > 0 && this._quote('buy', gd.id, q) > st.credits) q--;
    return q;
  }
  _quote(kind, id, q) {
    if (q <= 0) return 0;
    try { const v = (kind === 'buy' ? quoteBuy : quoteSell)(this.g.state, this.sys, id, q); if (Number.isFinite(v)) return v; } catch (e) { /* */ }
    const gd = this.market.goods.find((x) => x.id === id); return Math.round((kind === 'buy' ? gd.buy : gd.sell) * q);
  }
  _select(id) { this.sel = id; this.qty = 1; this.rowNodes && Object.entries(this.rowNodes).forEach(([k, r]) => r.paint(false)); this._detail(); }
  _step(d) {
    const gs = this.market?.goods; if (!gs?.length || this.tabs.current !== 'market') return;
    const i = Math.max(0, gs.findIndex((x) => x.id === this.sel)); const n = gs[(i + d + gs.length) % gs.length]; this._select(n.id); sfx('hover');
    const r = this.rowNodes[n.id]; if (r) this.pane.scrollToChild(r);
  }
  _setQty(q) { const gd = this._good(); if (!gd) return; const mx = Math.max(1, gd.buy != null ? Math.max(this._maxBuy(), gd.held) : gd.held, 1); this.qty = Math.max(1, Math.min(Math.max(mx, 1), Math.round(q))); this._detail(); sfx('hover', { pitch: 1.3 }); }

  _detail() {
    const D = this.detail; D.removeChildren().forEach((c) => c.destroy({ children: true }));
    const gd = this._good(); const DW = this.modal.bodyW - TW - 20; const DH = this.PH;
    D.addChild(well(DW, DH));
    if (!gd) { const l = new Label({ text: 'Select a good to see prices and trade.', preset: 'small', color: C.textDim, w: DW - 40 }); l.x = 20; l.y = 20; D.addChild(l); return; }
    const def = goodDef(gd.id) || {};
    const ic = goodIco(gd.id, 54); ic.x = 16; ic.y = 14; D.addChild(ic);
    const nm = new Label({ text: gd.name, preset: 'head', size: 14, color: C.brassLight, w: DW - 100, h: 36, fit: true, upper: true }); nm.x = 82; nm.y = 12; D.addChild(nm);
    const ct = new Label({ text: `${cap(gd.category)} · takes ${gd.bulk} hold space`, preset: 'tiny', size: 11, color: C.tealLight }); ct.x = 82; ct.y = 56; D.addChild(ct);
    const desc = new Label({ text: def.desc || '', preset: 'small', size: 13, lineHeight: 17, color: C.cream, w: DW - 32, maxLines: 4 }); desc.x = 16; desc.y = 84; D.addChild(desc);
    let y = 84 + Math.min(desc.textHeight, 70) + 6;
    if (def.flavor) { const fl = new Label({ text: def.flavor, preset: 'tiny', size: 11, color: C.textDim, w: DW - 32, maxLines: 2 }); fl.x = 16; fl.y = y; D.addChild(fl); y += Math.min(fl.textHeight, 30) + 4; }
    y = Math.max(y, 150);
    D.addChild(Object.assign(hr(DW - 32), { x: 16, y }));
    y += 10;
    // price gauge: buy/sell vs sector average
    const base = gd.base || 1; const gx = 16, gw = DW - 32;
    const gauge = new Graphics(); gauge.roundRect(gx, y + 16, gw, 8, 4).fill({ color: 0x05060f }); D.addChild(gauge);
    const lo = base * 0.6, hi = base * 1.5; const pos = (v) => gx + Math.max(0, Math.min(1, (v - lo) / (hi - lo))) * gw;
    gauge.rect(pos(base) - 1, y + 10, 2, 20).fill({ color: C.cream, alpha: 0.8 });
    if (gd.buy != null) gauge.circle(pos(gd.buy), y + 20, 6).fill(C.coral).stroke({ width: 2, color: 0x000000, alpha: 0.5 });
    gauge.circle(pos(gd.sell), y + 20, 6).fill(C.good).stroke({ width: 2, color: 0x000000, alpha: 0.5 });
    const gl = new Label({ text: `BUY ${gd.buy ?? '–'}   ·   SELL ${gd.sell}   ·   AVG ${base}`, preset: 'headSm', size: 9, color: C.textDim }); gl.x = gx; gl.y = y; D.addChild(gl);
    y += 36;
    const fac = factionOf(this.sys.station.faction);
    const like = fac?.likes?.includes(gd.id) ? 1 : fac?.dislikes?.includes(gd.id) ? -1 : 0;
    if (like) { const t = new Label({ text: like > 0 ? `${fac.adjective || fac.name} stations like this — friendlier price.` : `${fac.adjective || fac.name} stations dislike this — pricier to sell.`, preset: 'tiny', size: 11, color: like > 0 ? C.good : C.coral, w: gw }); t.x = gx; t.y = y; D.addChild(t); y += t.textHeight + 4; }
    const paid = this.g.__paid[gd.id];
    const hl = new Label({ text: gd.held ? `IN HOLD: ${gd.held}` + (paid && paid.n ? `  ·  AVG PAID ${(paid.cost / paid.n).toFixed(1)}` : '') : 'IN HOLD: none', preset: 'headSm', size: 10, color: gd.held ? C.tealLight : C.textDim, w: gw }); hl.x = gx; hl.y = y; D.addChild(hl); y += 22;
    // quantity stepper
    const mxB = this._maxBuy();
    this.qty = Math.max(1, Math.min(this.qty, Math.max(mxB, gd.held, 1)));
    const minus = new Button({ label: '−', w: 40, h: 38, variant: 'ghost', fontSize: 22, tooltip: 'Fewer (Shift: 5)', onClick: () => this._setQty(this.qty - (this.shift ? 5 : 1)) });
    const plus = new Button({ label: '+', w: 40, h: 38, variant: 'ghost', fontSize: 22, tooltip: 'More (Shift: 5)', onClick: () => this._setQty(this.qty + (this.shift ? 5 : 1)) });
    const ql = new Label({ text: String(this.qty), preset: 'num', size: 24, color: C.cream, w: 60, align: 'center' });
    minus.x = gx; minus.y = y; ql.x = gx + 44; ql.y = y + 4; plus.x = gx + 108; plus.y = y; D.addChild(minus, ql, plus);
    const presets = [['1', () => 1, 40], ['5', () => 5, 40], ['Max', () => Math.max(mxB, gd.held), 66]];
    let px = gx + 156; presets.forEach(([t, fn, w]) => { const b = new Button({ label: t, w, h: 38, variant: 'ghost', fontSize: 13, onClick: () => this._setQty(fn()) }); b.x = px; px += w + 4; b.y = y; D.addChild(b); });
    y += 48;
    const q = this.qty;
    const buyCost = gd.buy != null ? this._quote('buy', gd.id, Math.min(q, Math.max(mxB, q))) : 0;
    const docked = this.g.state.docked;
    const buyOK = docked && gd.buy != null && mxB > 0;
    const buyReason = !docked ? 'Dock first.' : gd.buy == null ? 'Out of stock here.' : mxB <= 0 ? (this.g.state.credits < gd.buy ? 'Not enough scrip.' : 'Cargo hold is full.') : '';
    const bb = new Button({ label: gd.buy == null ? 'Out of stock' : `Buy ${Math.min(q, Math.max(mxB, 1))} · ${num(this._quote('buy', gd.id, Math.min(q, Math.max(mxB, 1))))}`, icon: 'credits', w: gw, h: 44, variant: 'primary', hotkey: undefined, tooltip: 'Buy (B). Shift-click buys as many as you can.', disabled: !buyOK, disabledReason: buyReason, onClick: () => this._buy(this.shift ? mxB : Math.min(q, mxB)) });
    bb.x = gx; bb.y = y; D.addChild(bb); y += 52;
    const sq = Math.min(q, gd.held);
    const sellOK = docked && gd.held > 0;
    const sb = new Button({ label: gd.held ? `Sell ${sq} · ${num(this._quote('sell', gd.id, sq))}` : 'Nothing to sell', w: Math.floor(gw * 0.58) - 4, h: 44, variant: 'teal', fontSize: 15, tooltip: 'Sell (S). Shift-click sells everything.', disabled: !sellOK, disabledReason: !docked ? 'Dock first.' : 'None in your hold.', onClick: () => this._sell(this.shift ? gd.held : sq) });
    const sa = new Button({ label: `All · ${num(this._quote('sell', gd.id, gd.held))}`, w: Math.ceil(gw * 0.42) - 4, h: 44, variant: 'coral', fontSize: 14, tooltip: 'Sell every one in the hold (A)', disabled: !sellOK, disabledReason: 'None in your hold.', onClick: () => this._sell(gd.held) });
    sb.x = gx; sb.y = y; sa.x = gx + Math.floor(gw * 0.58) + 4; sa.y = y; D.addChild(sb, sa);
    this.detailBtns = { bb, sb, sa };
  }

  _say(text, color = C.coral) {
    if (!this.sayL || this.sayL.destroyed) return;
    this.sayL.setText(text); this.sayL.setColor(color); this.sayL.alpha = 1; this._sayT?.cancel();
    this._sayT = Anim.to(this.sayL, { alpha: 0 }, 600, { delay: 2600, ease: 'linear' });
  }
  _float(text, color, atBtn) {
    const l = new Label({ text, preset: 'num', size: 22, color, shadow: true }); const D = this.detail;
    l.x = D.x + (this.modal.bodyW - TW - 20) / 2 - l.textWidth / 2; l.y = D.y + this.PH - 130 - (atBtn ? 26 : 0); this.marketPane.addChild(l);
    Anim.to(l, { y: l.y - 70, alpha: 0 }, 1100, { ease: 'outCubic', onDone: () => !l.destroyed && l.destroy() });
  }
  _buy(q) {
    const gd = this._good(); if (!gd || q <= 0) { sfx('deny'); return; }
    const r = this.g.buy(gd.id, q);
    if (!r.ok) { this._say(r.reason || 'Could not buy.'); sfx('deny'); if (this.detailBtns?.bb) shake(this.detailBtns.bb); return; }
    const p = this.g.__paid[gd.id] || (this.g.__paid[gd.id] = { n: 0, cost: 0 }); p.n += r.qty; p.cost += r.cost;
    this._float(`−${num(r.cost)}`, C.coral);
    this._coinFx(false);
  }
  _sell(q) {
    const gd = this._good(); if (!gd || q <= 0 || !gd.held) { sfx('deny'); return; }
    const paid = this.g.__paid[gd.id]; const avg = paid && paid.n ? paid.cost / paid.n : null;
    const r = this.g.sell(gd.id, q);
    if (!r.ok) { this._say(r.reason || 'Could not sell.'); sfx('deny'); return; }
    if (paid) { paid.n -= r.qty; paid.cost -= (avg || 0) * r.qty; if (paid.n <= 0) delete this.g.__paid[gd.id]; }
    this._float(`+${num(r.gain)}`, C.good);
    if (avg != null) { const profit = Math.round(r.gain - avg * r.qty); this._float(profit >= 0 ? `profit +${num(profit)}` : `loss ${num(profit)}`, profit >= 0 ? C.tealLight : C.textDim, 1); }
    this._coinFx(true);
  }
  _coinFx(sell) {
    try { const b = S.gfx.burst(this.modal.panel.x + 640, this.modal.panel.y + 60, sell ? C.mustard : C.tealLight, sell ? 18 : 8); this.modal.addChild(b); } catch (e) { /* */ }
  }

  // -------------------------------------------------------------------- services tab
  _buildServices() {
    const P = this.svcPane; const sys = this.sys; const ok = sys.station.services.includes('repair');
    const defs = [
      { id: 'repair', title: 'HULL REPAIR', unit: 'hull point', icon: 'hull', color: RES_COL.hull, cur: (s) => s.ship.hull, max: (s) => s.ship.hullMax, act: (n) => this.g.repair(n), blurb: 'Patch plates, re-seat rivets, polish the brass.' },
      { id: 'fuel', title: 'REFUEL', unit: 'fuel unit', icon: 'fuel', color: RES_COL.fuel, cur: (s) => s.ship.fuel, max: (s) => s.ship.fuelMax, act: (n) => this.g.refuel(n), blurb: 'Top up the warp tanks.' },
      { id: 'supplies', title: 'RESTOCK SUPPLIES', unit: 'supply crate', icon: 'supplies', color: RES_COL.supplies, cur: (s) => s.ship.supplies, max: (s) => s.ship.suppliesMax, act: (n) => this.g.restock(n), blurb: 'Tea, ration bars, and the good biscuits.' },
    ];
    const W = this.modal.bodyW; const CH = Math.min(128, Math.floor((this.PH - 24) / 3));
    if (!ok) { const l = new Label({ text: 'This station has no dockyard. Repairs, fuel and supplies are not offered here.', preset: 'body', color: C.textDim, w: 700 }); l.y = 20; P.addChild(l); return; }
    defs.forEach((d, i) => {
      const card = new Container(); card.y = i * (CH + 12); P.addChild(card);
      card.addChild(well(W, CH));
      const ic = ico(d.icon, 40, d.color); ic.x = 20; ic.y = 20; card.addChild(ic);
      const t = new Label({ text: d.title, preset: 'head', size: 15, color: C.brassLight }); t.x = 76; t.y = 16; card.addChild(t);
      const bl = new Label({ text: d.blurb, preset: 'small', size: 13, color: C.textDim, w: 250 }); bl.x = 76; bl.y = 40; card.addChild(bl);
      const unit = new Label({ text: '', preset: 'tiny', size: 12, color: C.mustard, w: 250 }); unit.x = 76; unit.y = CH - 32; card.addChild(unit);
      const bar = new Graphics(); bar.x = 350; bar.y = 20; card.addChild(bar);
      const info = new Label({ text: '', preset: 'num', size: 13, color: C.cream, w: 330 }); info.x = 350; info.y = 52; card.addChild(info);
      const slider = new Slider({ w: 330, min: 0, max: 1, step: 1, value: 0, format: (v) => '+' + Math.round(v), onChange: () => this._svcUpdate(d.id) }); slider.x = 350; slider.y = CH - 40; card.addChild(slider);
      const buy = new Button({ label: 'Buy', icon: 'credits', w: 190, h: 40, variant: 'primary', onClick: () => this._svcBuy(d), fontSize: 15 }); buy.x = W - 210; buy.y = 20; card.addChild(buy);
      const fill = new Button({ label: 'Fill up', w: 190, h: 40, variant: 'teal', onClick: () => { slider.setValue(slider.o.max); this._svcUpdate(d.id); this._svcBuy(d); }, fontSize: 15 }); fill.x = W - 210; fill.y = CH - 56; card.addChild(fill);
      this.svc[d.id] = { d, card, bar, info, slider, buy, fill, unit };
    });
  }
  _svcUpdate(id) {
    const s = this.svc[id]; if (!s) return; const st = this.g.state; const d = s.d; const prices = this.market?.services || this.g.servicePrices?.(this.sys.id) || {};
    const price = prices[id] ?? prices[d.id] ?? 3; const cur = d.cur(st), mx = d.max(st); const need = Math.floor(mx - cur + 1e-6);
    const afford = Math.floor(st.credits / price); const cap_ = Math.max(0, Math.min(need, afford));
    s.slider.o.max = Math.max(1, cap_); if (s.slider.value > s.slider.o.max) s.slider.value = s.slider.o.max;
    const v = Math.round(s.slider.value); const cost = Math.ceil(v * price); const docked = st.docked;
    s.unit.setText(`${price.toFixed(1)} scrip per ${d.unit}`);
    const bw = 330, bh = 22; const g = s.bar; g.clear();
    g.roundRect(0, 0, bw, bh, 11).fill({ color: 0x05060f }); g.roundRect(1.5, 1.5, bw - 3, bh - 3, 10).fill({ color: 0x151838 });
    const f0 = Math.max(0, Math.min(1, cur / mx)), f1 = Math.max(0, Math.min(1, (cur + v) / mx));
    if (f1 > f0) g.roundRect(2, 2, Math.max(8, (bw - 4) * f1), bh - 4, 9).fill({ color: lighten(d.color, 0.5), alpha: 0.85 });
    if (f0 > 0) g.roundRect(2, 2, Math.max(8, (bw - 4) * f0), bh - 4, 9).fill(grad([[0, lighten(d.color, 0.3)], [1, d.color]]));
    g.roundRect(0, 0, bw, bh, 11).stroke({ width: 1.5, color: C.brassDark });
    s.info.setText(`${Math.round(cur)} / ${Math.round(mx)}${v ? `  →  ${Math.round(cur + v)}` : ''}`);
    const reason = !docked ? 'Dock first.' : need <= 0 ? 'Already full.' : afford <= 0 ? 'Not enough scrip.' : '';
    s.slider.alpha = need > 0 && afford > 0 ? 1 : 0.4; s.slider.eventMode = need > 0 && afford > 0 ? 'static' : 'none';
    s.buy.setLabel(v ? `Buy ${v} · ${num(cost)}` : need <= 0 ? 'Full' : 'Choose').setEnabled(!reason && v > 0, reason || 'Slide to choose an amount.');
    const fcost = Math.ceil(Math.min(need, afford) * price);
    s.fill.setLabel(need > 0 && afford > 0 ? `Fill up · ${num(fcost)}` : 'Fill up').setEnabled(!reason && cap_ > 0, reason);
  }
  _svcBuy(d) {
    const s = this.svc[d.id]; const v = Math.round(s.slider.value); if (v <= 0) return;
    const r = d.act(v);
    if (!r.ok) { this._say(r.reason || 'Could not complete that.'); sfx('deny'); return; }
    this._say(`${d.title.toLowerCase().replace(/^./, (c) => c.toUpperCase())}: +${r.amount} for ${num(r.cost)} scrip`, C.good);
    s.slider.setValue(0);
    try { S.gfx.sparkle?.(s.card, 10); } catch (e) { /* */ }
  }

  // -------------------------------------------------------------------- refresh
  _refresh(fromChange) {
    if (!this.modal || this.modal.destroyed || !this.root || !this.banner) return;
    if (this.g.state.pending) return;
    this.market = this.g.market(this.sys.id);
    this._updateBanner();
    if (this.market && this.pane) {
      if (!this.sel || !this.market.goods.some((x) => x.id === this.sel)) this.sel = (this.market.goods.find((x) => x.held) || this.market.goods[0])?.id || null;
      this._rows(); this._detail();
    }
    for (const id in this.svc) this._svcUpdate(id);
  }
}
