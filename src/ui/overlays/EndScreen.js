import { Container, Graphics } from 'pixi.js';
import { Overlay } from './Overlay.js';
import { C, lighten, darken, grad } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Button } from '../kit/Button.js';
import { Typewriter } from '../kit/Typewriter.js';
import { ScrollPane } from '../kit/Scroll.js';
import { Input } from '../kit/input.js';
import { Anim } from '../kit/anim.js';
import { S, sfx } from '../services.js';
import { ico, pill, well, hr, live, num, cap, sgn, countTo, popIn, fadeIn } from './parts/common.js';

const LEGACY_KEY = 'halcyon.legacy';

function readLegacy() { try { const o = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null'); return o && typeof o === 'object' ? { runs: o.runs | 0, best: o.best | 0, bonus: o.bonus | 0 } : null; } catch (e) { return null; } }
function writeLegacy(score, nonLoss) {
  try { const lg = readLegacy() || { runs: 0, best: 0, bonus: 0 }; lg.runs += 1; lg.best = Math.max(lg.best, score | 0); lg.bonus = Math.min(500, lg.bonus + (nonLoss ? 75 : 25)); localStorage.setItem(LEGACY_KEY, JSON.stringify(lg)); return lg; } catch (e) { return null; }
}

/**
 * EndScreen - ending title, typed epilogue, animated score breakdown, rank, highlights, legacy bonus, and buttons.
 * The engine records the legacy bonus itself (Save.recordLegacy in endGame); we only write the fallback if it is missing.
 * Space/click skips the reveal. Buttons always appear (never a dead end).
 */
export class EndScreen extends Overlay {
  title = 'VOYAGE COMPLETE'; size = { w: 1060, h: 664 }; closable = false;

  build(modal, params = {}) {
    const g = this.game; const st = g.state;
    const e = params.ending || st.ending || { id: 'end', title: 'The End', text: '', score: 0, kind: 'special' };
    this.e = e; this.loss = e.kind === 'loss'; this.BW = modal.bodyW; this.BH = modal.bodyH; this.steps = []; this.revealed = false;
    this.root = new Container(); modal.body.addChild(this.root);
    this.legacy = this._legacy(e);
    this.ui.music('ending');
    try { this.ui.layers.toast.visible = false; } catch (er) { /* */ }
    this._header(); this._epilogue(); this._highlights(); this._score(); this._buttons();
    Input.bind(this.root, ['Space', 'Enter'], () => this._skip());
    this.root.eventMode = 'static';
    this._run();
  }
  onClose() { try { this.ui.layers.toast.visible = true; } catch (er) { /* */ } }

  _legacy(e) {
    // engine already recorded it; only fall back when the key is genuinely missing
    let lg = readLegacy(); let gained = this.loss ? 25 : 75; let wrote = false;
    if (!lg) { lg = writeLegacy(e.score || 0, !this.loss); wrote = !!lg; }
    return { lg: lg || { runs: 1, best: e.score || 0, bonus: gained }, gained, wrote };
  }

  // ------------------------------------------------------------------ layout
  _header() {
    const W = this.BW; const h = new Container(); this.root.addChild(h); this.head = h;
    // medal
    const cx = W / 2; const col = this.loss ? C.tealLight : C.mustard;
    const medal = new Container(); medal.x = 70; medal.y = 36; h.addChild(medal);
    const m = new Graphics(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; m.poly([Math.cos(a - 0.12) * 30, Math.sin(a - 0.12) * 30, Math.cos(a) * 36, Math.sin(a) * 36, Math.cos(a + 0.12) * 30, Math.sin(a + 0.12) * 30]).fill(darken(col, 0.2)); }
    m.circle(0, 0, 29).fill(col); m.circle(0, 0, 29).stroke({ width: 3, color: C.brassDark }); m.circle(0, 0, 22).stroke({ width: 1.5, color: darken(col, 0.45), alpha: 0.8 });
    medal.addChild(m); const star = ico(this.loss ? 'ship' : 'star', 28, C.textInk); star.x = -14; star.y = -14; medal.addChild(star);
    medal.rot = Anim.watch(medal, (dt, t) => { medal.rotation = Math.sin(t * 1.3) * 0.05; });
    const kind = { main: 'THE LANTERNS ANSWER', survey: 'THE CHART IS COMPLETE', special: 'A VOYAGE REMEMBERED', loss: 'A GENTLE RECALL' }[this.e.kind] || 'VOYAGE COMPLETE';
    const kl = new Label({ text: kind, preset: 'headSm', size: 10, color: C.tealLight, w: W, align: 'center' }); kl.y = 2; h.addChild(kl);
    const t = new Label({ text: this.e.title || 'The End', preset: 'title', size: 28, color: C.brassLight, w: W - 220, h: 40, fit: true, align: 'center', shadow: true }); t.x = 110; t.y = 22; h.addChild(t);
    const d = new Label({ text: `ISV ${String(st_name(this.game)).replace(/^ISV\s+/i, '')}  ·  Captain ${this.game.state.captain?.name || ''}  ·  Day ${this.e.day ?? this.game.state.day}`, preset: 'tiny', size: 12, color: C.textDim, w: W, align: 'center' }); d.y = 62; h.addChild(d);
    h.addChild(Object.assign(hr(W), { y: 82 }));
    this.title_ = t; h.alpha = 0; Anim.to(h, { alpha: 1 }, 700, { ease: 'linear' });
    if (!this.loss) try { const sp = S.gfx.sparkle(h, 18, { w: W, h: 80 }); } catch (er) { /* */ }
  }
  _epilogue() {
    const P = this.ep = new Container(); P.x = 0; P.y = 96; this.root.addChild(P);
    const H = 214; const W = 500; P.addChild(well(W, H));
    const lab = new Label({ text: 'EPILOGUE', preset: 'headSm', size: 10, color: C.brassLight }); lab.x = 16; lab.y = 10; P.addChild(lab);
    this.tw = new Typewriter({ w: W - 36, text: this.e.text || 'The voyage ends here.', preset: 'body', size: 16, lineHeight: 23, cps: 48, color: C.cream, onDone: () => this._afterText() });
    const pane = new ScrollPane({ w: W - 24, h: H - 38, bottomPad: 4 }); pane.x = 14; pane.y = 32; pane.content.addChild(this.tw); P.addChild(pane); this.pane = pane;
    this.tw.on('pointertap', () => { /* typewriter handles skip */ });
    P.alpha = 0; Anim.to(P, { alpha: 1 }, 500, { delay: 300, ease: 'linear' });
    this.twStarted = false;
  }
  _highlights() {
    const P = this.hl = new Container(); P.x = 0; P.y = 96 + 214 + 12; this.root.addChild(P);
    const W = 500, H = this.BH - 60 - P.y; P.addChild(well(W, H));
    const lab = new Label({ text: 'HIGHLIGHTS OF THE VOYAGE', preset: 'headSm', size: 10, color: C.brassLight }); lab.x = 16; lab.y = 10; P.addChild(lab);
    const items = this._highlightItems().slice(0, 6); this.hlRows = [];
    const rh = Math.min(30, Math.floor((H - 38) / Math.max(1, items.length)));
    items.forEach((it, i) => {
      const r = new Container(); r.y = 34 + i * rh; r.x = 14; P.addChild(r);
      const ic = ico(it.icon, 18, it.col || C.tealLight); ic.y = 2; r.addChild(ic);
      const l = new Label({ text: it.text, preset: 'small', size: 13, color: C.cream, w: W - 70, h: rh - 4, fit: true }); l.x = 28; l.y = 2; r.addChild(l);
      r.alpha = 0; this.hlRows.push(r);
    });
  }
  _highlightItems() {
    const st = this.game.state; const sv = this.game.surveyProgress?.() || {}; const s = st.stats || {}; const out = [];
    out.push({ icon: 'star', text: `Charted ${sv.charted ?? s.systemsCharted ?? 0} of ${sv.total ?? '?'} systems (${sv.pct ?? 0}% of the Reach)`, col: C.mustard });
    out.push({ icon: 'jump', text: `${s.jumps || 0} jumps, ${s.planetsScanned || 0} worlds scanned, ${st.codex.length} codex entries`, col: C.tealLight });
    if (s.missionsDone) out.push({ icon: 'mission', text: `${s.missionsDone} mission${s.missionsDone === 1 ? '' : 's'} seen through to the end`, col: C.good });
    const ranked = Object.entries(st.rep).sort((a, b) => b[1] - a[1])[0];
    if (ranked && ranked[1] > 0) out.push({ icon: 'hail', text: `Warmest friends: ${S.content.FACTIONS?.[ranked[0]]?.name || cap(ranked[0])} (standing ${Math.round(ranked[1])})`, col: 0xb58be0 });
    out.push({ icon: 'credits', text: `${num(st.credits)} scrip in the strongbox; ${num(s.creditsEarned || 0)} earned along the way`, col: C.mustard });
    if (s.checksPassed) out.push({ icon: 'check', text: `${s.checksPassed} clever skill checks passed`, col: C.good });
    if (s.tows) out.push({ icon: 'ship', text: `Towed home by the Meridian tender ${s.tows} time${s.tows === 1 ? '' : 's'} — no shame in it`, col: C.textDim });
    const log = st.log || []; const wonder = [...log].reverse().find((l) => l.kind === 'discovery'); if (wonder) out.push({ icon: 'codex', text: wonder.text, col: 0xa99bff });
    const crew = st.crew.length; out.push({ icon: 'crew', text: `${crew} officers aboard at journey's end`, col: C.tealLight });
    return out;
  }
  _breakdown() {
    const st = this.game.state; const sv = this.game.surveyProgress?.() || { charted: 0, planetsScanned: 0 };
    const def = S.content.ENDINGS?.[this.e.id] || {}; const nonLoss = !this.loss;
    const repSum = Object.values(st.rep).reduce((a, v) => a + Math.max(0, v), 0);
    const rows = [
      { icon: 'star', name: 'Systems charted', detail: `${sv.charted} × 100`, v: sv.charted * 100 },
      { icon: 'planet', name: 'Worlds scanned', detail: `${sv.planetsScanned} × 25`, v: sv.planetsScanned * 25 },
      { icon: 'codex', name: 'Codex entries', detail: `${st.codex.length} × 10`, v: st.codex.length * 10 },
      { icon: 'mission', name: 'Missions done', detail: `${st.stats.missionsDone || 0} × 40`, v: (st.stats.missionsDone || 0) * 40 },
      { icon: 'credits', name: 'Scrip in hand', detail: `${num(st.credits)} ÷ 25`, v: Math.round(st.credits / 25) },
      { icon: 'hail', name: 'Goodwill', detail: `${Math.round(repSum)} standing × 2`, v: Math.round(repSum * 2) },
    ];
    if (nonLoss) rows.push({ icon: 'jump', name: 'Swift voyage', detail: `${Math.max(0, 400 - st.day)} days to spare`, v: Math.max(0, 400 - st.day) });
    if (def.scoreBonus) rows.push({ icon: 'check', name: 'Ending bonus', detail: this.e.title, v: def.scoreBonus });
    const sum = rows.reduce((a, r) => a + r.v, 0); const total = this.e.score ?? sum;
    if (Math.abs(total - sum) >= 1) rows.push({ icon: 'log', name: 'Other flourishes', detail: '', v: total - sum });
    return { rows: rows.filter((r) => r.v !== 0 || ['Systems charted'].includes(r.name)), total };
  }
  _score() {
    const P = this.sc = new Container(); P.x = 524; P.y = 96; this.root.addChild(P);
    const W = this.BW - 524, H = this.BH - 60 - 96; P.addChild(well(W, H));
    const lab = new Label({ text: 'FINAL SCORE', preset: 'headSm', size: 10, color: C.brassLight }); lab.x = 16; lab.y = 10; P.addChild(lab);
    const { rows, total } = this._breakdown(); this.total = total; this.rowNodes = [];
    const rh = Math.min(30, Math.floor((H - 250) / Math.max(1, rows.length)));
    rows.forEach((r, i) => {
      const n = new Container(); n.y = 36 + i * rh; n.x = 16; P.addChild(n);
      const ic = ico(r.icon, 18, C.tealLight); ic.y = 2; n.addChild(ic);
      const nm = new Label({ text: r.name, preset: 'bodyB', size: 14, color: C.cream }); nm.x = 28; nm.y = 1; n.addChild(nm);
      const dt = new Label({ text: r.detail, preset: 'tiny', size: 11, color: C.textDim, w: 150 }); dt.x = 28 + 130; dt.y = 4; n.addChild(dt);
      const v = new Label({ text: '0', preset: 'num', size: 15, color: r.v < 0 ? C.coral : C.mustard, w: 70, align: 'right' }); v.x = W - 32 - 70; v.y = 1; n.addChild(v);
      n.valL = v; n.target = r.v; n.alpha = 0; this.rowNodes.push(n);
    });
    const y1 = 36 + rows.length * rh + 6;
    const rule = hr(W - 32); rule.x = 16; rule.y = y1; P.addChild(rule);
    const tl = new Label({ text: 'TOTAL', preset: 'head', size: 14, color: C.brassLight }); tl.x = 16; tl.y = y1 + 16; P.addChild(tl);
    this.totalL = new Label({ text: '0', preset: 'num', size: 38, color: C.mustard, w: 260, align: 'right', shadow: true }); this.totalL.x = W - 16 - 260; this.totalL.y = y1 + 6; P.addChild(this.totalL); this.totalL.alpha = 0.0;
    // rank
    const ry = y1 + 62; this.rankY = ry; this.W_ = W;
    const rk = this.game.rank?.() || this.e.rank || 'Probationary Cartographer';
    const rb = new Container(); rb.x = 16; rb.y = ry; P.addChild(rb); this.rankBox = rb;
    const rbg = new Graphics(); rbg.roundRect(0, 0, W - 32, 56, 12).fill({ color: 0x0a0c22 }); rbg.roundRect(0, 0, W - 32, 56, 12).stroke({ width: 2, color: C.brass }); rb.addChild(rbg);
    const rl = new Label({ text: 'RANK ACHIEVED', preset: 'headSm', size: 9, color: C.textDim }); rl.x = 70; rl.y = 8; rb.addChild(rl);
    const rt = new Label({ text: rk, preset: 'head', size: 15, color: C.brassLight, w: W - 32 - 90, h: 24, fit: true, upper: true }); rt.x = 70; rt.y = 24; rb.addChild(rt);
    const seal = new Graphics(); seal.circle(0, 0, 20).fill(C.mustard); seal.circle(0, 0, 20).stroke({ width: 3, color: C.brassDark }); seal.circle(0, 0, 14).stroke({ width: 1.5, color: C.brassDark }); seal.x = 36; seal.y = 28; rb.addChild(seal);
    const si = ico('check', 20, C.textInk); si.x = 26; si.y = 18; rb.addChild(si);
    rb.alpha = 0;
    // legacy
    const ly = ry + 68; const lg = this.legacy; const lb = new Container(); lb.x = 16; lb.y = ly; P.addChild(lb); this.legBox = lb;
    const lbg = new Graphics(); lbg.roundRect(0, 0, W - 32, 62, 12).fill({ color: 0x143a3a, alpha: 0.7 }); lbg.roundRect(0, 0, W - 32, 62, 12).stroke({ width: 1.5, color: C.teal }); lb.addChild(lbg);
    const li = ico('credits', 26, C.tealLight); li.x = 16; li.y = 18; lb.addChild(li);
    const l1 = new Label({ text: `LEGACY BONUS  +${lg.gained} scrip`, preset: 'head', size: 13, color: C.tealLight }); l1.x = 56; l1.y = 10; lb.addChild(l1);
    const l2 = new Label({ text: `Your next voyage starts with +${lg.lg.bonus} extra scrip · ${lg.lg.runs} voyage${lg.lg.runs === 1 ? '' : 's'} flown · best score ${num(lg.lg.best)}`, preset: 'small', size: 13, color: C.cream, w: W - 32 - 70, h: 34, fit: true }); l2.x = 56; l2.y = 32; lb.addChild(l2);
    lb.alpha = 0;
  }
  _buttons() {
    const y = this.BH - 46; const g = this.game; const f = this.btns = new Container(); f.y = y; this.root.addChild(f);
    const specs = [
      { label: 'New Voyage', icon: 'jump', variant: 'primary', w: 210, hotkey: 'n', onClick: () => { this.close(); this.ui.goto('NewGame', {}, { kind: 'iris' }); } },
      { label: 'Title Screen', icon: 'star', variant: 'brass', w: 190, hotkey: 't', onClick: () => { this.close(); this.ui.goto('Title'); } },
    ];
    const canKeep = !this.loss && typeof g.continueVoyage === 'function';
    if (canKeep) specs.push({ label: 'Keep Exploring', icon: 'planet', variant: 'teal', w: 210, hotkey: 'k', onClick: () => { const r = g.continueVoyage(); if (r?.ok === false) { this.ui.toast(r.reason || 'Cannot continue.', 'bad'); return; } this.close(); } });
    let x = 0; const total = specs.reduce((a, s) => a + s.w, 0) + 14 * (specs.length - 1); x = this.BW - total;
    this.btnList = specs.map((s) => { const b = new Button({ h: 46, ...s }); b.x = x; x += s.w + 14; f.addChild(b); return b; });
    const hint = new Label({ text: 'Press Space to skip the reveal', preset: 'tiny', size: 11, color: C.textDim }); hint.y = 16; f.addChild(hint); this.hint = hint;
    f.visible = false;
  }

  // ------------------------------------------------------------------ sequence
  _afterText() { if (this._textDone) return; this._textDone = true; this._startScore(); }
  _run() {
    // highlights drift in while the epilogue types
    this.hlRows.forEach((r, i) => { Anim.to(r, { alpha: 1 }, 400, { delay: 900 + i * 350, ease: 'linear' }); });
    // safety: if typewriter never finishes (it will), the buttons still show
    this._guard = setTimeout(() => { if (!this.modal.destroyed) this._skip(); }, 30000);
    this._offs.push(() => clearTimeout(this._guard));
  }
  _startScore() {
    if (this._scoring) return; this._scoring = true; let t = 0;
    this.rowNodes.forEach((n, i) => {
      t += 260;
      setTimeout(() => { if (this.modal.destroyed || n.destroyed) return; Anim.to(n, { alpha: 1 }, 200, { ease: 'linear' }); fadeIn(n, 200, 6); countTo(n.valL, 0, n.target, 380, (v) => (n.target < 0 ? '−' : '') + num(Math.abs(v))); sfx('hover', { pitch: 1.2 + i * 0.07, vol: 0.5 }); }, t);
    });
    t += 450;
    setTimeout(() => { if (this.modal.destroyed) return; this.totalL.alpha = 1; countTo(this.totalL, 0, this.total, 1100, (v) => num(v)); sfx('coin'); }, t);
    t += 1300;
    setTimeout(() => { if (this.modal.destroyed) return; popIn(this.rankBox, { from: 1.6, ms: 420 }); sfx(this.loss ? 'confirm' : 'fanfare'); try { this.sc.addChild(S.gfx.burst(60, this.rankY + 28, C.mustard, 20)); } catch (er) { /* */ } }, t);
    t += 700;
    setTimeout(() => { if (this.modal.destroyed) return; fadeIn(this.legBox, 400, 10); sfx('powerup'); }, t);
    t += 800;
    setTimeout(() => this._showButtons(), t);
  }
  _showButtons() { if (this.btns.visible || this.modal.destroyed) return; this.btns.visible = true; fadeIn(this.btns, 400, 10); this.hint.visible = false; }
  _skip() {
    if (this.revealed || this.modal.destroyed) return;
    if (!this.tw.done) { this.tw.skip(); return; }
    this.revealed = true; clearTimeout(this._guard);
    this.hlRows.forEach((r) => { r.alpha = 1; });
    this.rowNodes.forEach((n) => { n.alpha = 1; n.y = n.y; n.valL.setText((n.target < 0 ? '−' : '') + num(Math.abs(n.target))); });
    this.totalL.alpha = 1; this.totalL.setText(num(this.total)); this.rankBox.alpha = 1; this.legBox.alpha = 1; this._scoring = true; this._showButtons();
  }
}
function st_name(g) { return g.state.ship?.name || 'Halcyon'; }
