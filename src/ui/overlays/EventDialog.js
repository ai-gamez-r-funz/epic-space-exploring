import { Container, Graphics } from 'pixi.js';
import { Overlay } from './Overlay.js';
import { C } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Typewriter } from '../kit/Typewriter.js';
import { ScrollPane } from '../kit/Scroll.js';
import { Button } from '../kit/Button.js';
import { Bar } from '../kit/Bar.js';
import { Lights } from '../kit/Panel.js';
import { Input } from '../kit/input.js';
import { Anim } from '../kit/anim.js';
import { Tooltip } from '../kit/Tooltip.js';
import { S, sfx } from '../services.js';
import { ico, pill, well, bezel, hr, live, fadeIn, popIn, TAG_INFO, SPECIES_FACTION, SKILL_COL, bestOfficer, emblem, cap, num, RES_COL } from './parts/common.js';
import { snapshot, diffChips, summaryChips, chipRow } from './parts/fx.js';
import { EventChoices } from './parts/EventChoices.js';

const LW = 470, GAP = 24, SCREEN_H = 326;
const INTERIOR = new Set(['station', 'bridge', 'lounge', 'market', 'engine_room', 'sickbay', 'landing', 'ruins']);
const hashStr = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h) % 9973; };

/**
 * EventDialog - the heart of the game. Renders game.pendingView(): viewscreen art, speaker, typewriter text, choices with
 * odds, result screen with animated effect chips. App calls open() via ui.openEvent() and refresh() on every 'changed';
 * we also listen to 'event' ourselves (engine emits only 'event' between nodes). Never closable by the player: the
 * dialog closes only when state.pending becomes null, and re-opens itself if it is ever closed with an event pending.
 */
export class EventDialog extends Overlay {
  title = 'INCOMING TRANSMISSION'; size = { w: 1200, h: 668 }; closable = false;

  build(modal) {
    this.root = new Container(); modal.body.addChild(this.root);
    this.RW = modal.bodyW - LW - GAP; this.BH = modal.bodyH; this.sig = null; this.lastDiff = null; this.done = false; this.mood = null; this.shop = false;
    this._buildLeft();
    this.rightHost = new Container(); this.rightHost.x = LW + GAP; this.root.addChild(this.rightHost);
    const g = this.game;
    try { this.ui.layers.toast.visible = false; } catch (e) { /* */ } // chips already show every effect; keep the header clear
    this._offs.push(g.on('event', () => this._sync()), g.on('shop', () => { this.shop = true; }));
    this.watch(() => this._updateBars());
    Input.bind(this.root, ['Space', 'Enter'], () => this._advanceKey());
    this._sync(true);
  }
  refresh() { if (!this.modal || this.modal.destroyed || this.done || this._resolving) return; this._sync(); }

  // -------------------------------------------------------------------------------- left column
  _buildLeft() {
    const L = this.left = new Container(); this.root.addChild(L);
    this.screen = new Container(); L.addChild(this.screen);
    this.screen.addChild(bezel(LW, SCREEN_H, 7, 14));
    this.artHost = new Container(); this.artHost.x = 7; this.artHost.y = 7; this.screen.addChild(this.artHost);
    const m = new Graphics().roundRect(7, 7, LW - 14, SCREEN_H - 14, 9).fill(0xffffff); this.screen.addChild(m); this.artHost.mask = m;
    try { const v = S.gfx.vignette(LW - 14, SCREEN_H - 14); v.x = 7; v.y = 7; v.alpha = 0.7; v.eventMode = 'none'; this.screen.addChild(v); } catch (e) { /* */ }
    try { const sc = S.gfx.scanlines(LW - 14, SCREEN_H - 14, 0.1); sc.x = 7; sc.y = 7; sc.eventMode = 'none'; this.screen.addChild(sc); } catch (e) { /* */ }
    this.chrome = new Container(); this.screen.addChild(this.chrome);
    const lights = new Lights({ count: 4, r: 3, gap: 5, speed: 0.8 }); lights.x = LW - 78; lights.y = SCREEN_H - 20; this.screen.addChild(lights);

    this.slot = new Container(); this.slot.y = SCREEN_H + 12; L.addChild(this.slot);
    // ship status panel (bottom-left): bars animate when a result lands
    const sy = this.BH - 124;
    const sp = this.status = new Container(); sp.y = sy; L.addChild(sp);
    sp.addChild(well(LW, 124));
    const lab = new Label({ text: 'SHIP STATUS', preset: 'headSm', size: 10, color: C.brassLight }); lab.x = 14; lab.y = 10; sp.addChild(lab);
    this.bars = {};
    [['hull', 0, 0], ['fuel', 1, 0], ['supplies', 0, 1], ['morale', 1, 1]].forEach(([k, cx, cy]) => {
      const b = new Bar({ w: 168, h: 18, value: 0, max: 100, color: RES_COL[k], icon: k, showMax: false, tooltip: cap(k) });
      b.x = 14 + cx * 226; b.y = 36 + cy * 30; sp.addChild(b); this.bars[k] = b;
    });
    const cr = ico('credits', 20, C.mustard); cr.x = 14; cr.y = 96; sp.addChild(cr);
    this.credL = new Label({ text: '', preset: 'num', size: 16, color: C.mustard }); this.credL.x = 40; this.credL.y = 96; sp.addChild(this.credL);
    this.sysL = new Label({ text: '', preset: 'tiny', size: 12, color: C.tealLight, w: 270, align: 'right' }); this.sysL.x = LW - 284; this.sysL.y = 100; sp.addChild(this.sysL);
    this._updateBars(true);
  }
  _updateBars(first) {
    if (!this.bars || this.status?.destroyed) return;
    const st = this.game.state, s = st.ship;
    for (const [k, mx] of [['hull', s.hullMax], ['fuel', s.fuelMax], ['supplies', s.suppliesMax], ['morale', 100]]) {
      const b = this.bars[k]; if (!b) continue;
      if (first) { b.val = b.shown = s[k]; b.max = mx; } else b.set(s[k], mx);
    }
    this.credL.setText(num(st.credits) + ' scrip');
    this.sysL.setText(((this.game.here?.()?.name) || '').toUpperCase() + '  ·  DAY ' + st.day);
  }

  _setArt(v) {
    const key = v.eventId + '|' + JSON.stringify(v.art || {});
    if (key === this.artKey) return; this.artKey = key;
    let spec = { ...(v.art || { scene: 'void' }) };
    if (v.speaker && INTERIOR.has(spec.scene)) delete spec.species;
    spec.seed = spec.seed ?? hashStr(v.eventId);
    let art = null;
    try { art = S.gfx.sceneArt(spec, LW - 14, SCREEN_H - 14); } catch (e) { /* art is optional */ }
    const old = this.curArt;
    if (art) { live(art); this.artHost.addChild(art); this.curArt = art; art.alpha = 0; Anim.to(art, { alpha: 1 }, old ? 450 : 250, { ease: 'linear' }); }
    else { this.curArt = null; }
    if (old) Anim.to(old, { alpha: 0 }, 480, { ease: 'linear', onDone: () => { if (!old.destroyed) old.destroy({ children: true }); } });
    this.chrome.removeChildren().forEach((c) => c.destroy({ children: true }));
    const k = (spec.scene || 'void').replace('_', ' ').toUpperCase();
    const tag = pill({ text: k, color: C.tealLight, h: 22, size: 10, preset: 'headSm', bg: 0x05060f, bgAlpha: 0.7 }); tag.x = 18; tag.y = 18; this.chrome.addChild(tag);
  }

  _setSlot(v) {
    const key = v.speaker ? 'sp:' + v.speaker.name + v.speaker.species : 'crew';
    if (key === this.slotKey) return; this.slotKey = key;
    this.slot.removeChildren().forEach((c) => c.destroy({ children: true }));
    const H = this.BH - 124 - 12 - (SCREEN_H + 12);
    const box = well(LW, H); this.slot.addChild(box);
    if (v.speaker) {
      const sp = v.speaker; const ps = Math.min(H - 20, 104);
      const hold = new Container(); hold.x = 12; hold.y = (H - ps) / 2; this.slot.addChild(hold);
      try { const p = S.gfx.portrait({ species: sp.species || 'unknown', seed: hashStr(sp.name), size: ps }); live(p); hold.addChild(p); } catch (e) { /* */ }
      hold.alpha = 0; Anim.to(hold, { alpha: 1 }, 300, { ease: 'linear' });
      const x = ps + 28; const w = LW - x - 14;
      const fid = SPECIES_FACTION[sp.species];
      const hdr = new Label({ text: 'SPEAKING', preset: 'headSm', size: 9, color: C.textDim }); hdr.x = x; hdr.y = 12; this.slot.addChild(hdr);
      const plate = new Graphics(); plate.roundRect(0, 0, w, 40, 8).fill(C.brassDark); plate.roundRect(1.5, 1.5, w - 3, 37, 7).fill({ color: C.brass }); plate.roundRect(4, 4, w - 8, 12, 5).fill({ color: 0xffffff, alpha: 0.2 });
      plate.x = x; plate.y = 28; this.slot.addChild(plate);
      const nm = new Label({ text: sp.name, preset: 'head', size: 15, color: C.textInk, w: w - 20, h: 24, fit: true }); nm.x = x + 10; nm.y = 28 + (40 - 20) / 2 - 1; this.slot.addChild(nm);
      let sx = x;
      if (fid) { const em = emblem(fid, 26); em.x = sx; em.y = 76; this.slot.addChild(em); sx += 32; }
      const sl = new Label({ text: cap(sp.species === 'archivist' ? 'archivist' : sp.species || 'unknown') + (fid ? ' · ' + (S.content.FACTIONS?.[fid]?.name || '') : ''), preset: 'tiny', size: 12, color: C.tealLight, w: w - (sx - x), fit: true, h: 16 }); sl.x = sx; sl.y = 81; this.slot.addChild(sl);
    } else {
      const hdr = new Label({ text: 'BRIDGE CREW', preset: 'headSm', size: 10, color: C.brassLight }); hdr.x = 14; hdr.y = 10; this.slot.addChild(hdr);
      this.crewIcons = {};
      const crew = this.game.state.crew.slice(0, 6); const cw = Math.min(70, (LW - 24) / Math.max(1, crew.length));
      crew.forEach((c, i) => {
        const cell = new Container(); cell.x = 12 + i * cw; cell.y = 30; this.slot.addChild(cell);
        const hl = new Graphics(); cell.addChild(hl); cell.hl = hl;
        try { const p = S.gfx.portrait({ species: c.portrait?.species || c.species, seed: c.portrait?.seed ?? i, size: 54, mood: c.mood }); live(p); p.x = 3; p.y = 3; cell.addChild(p); } catch (e) { /* */ }
        const n = new Label({ text: c.name.split(' ')[0], preset: 'tiny', size: 11, color: C.cream, w: cw - 4, fit: true, h: 14, align: 'center' }); n.x = 0; n.y = 62; cell.addChild(n);
        cell.crew = c; this.crewIcons[c.id] = cell;
        cell.eventMode = 'static'; Tooltip.attach(cell, { title: c.name, body: `${cap(c.role)} specialist`, rows: [['Mood', Math.round(c.mood) + '%']] });
      });
    }
  }
  _highlightOfficer(ch) {
    if (!this.crewIcons) return;
    const best = ch && ch.skill ? bestOfficer(this.game.state, ch.skill) : null;
    for (const id in this.crewIcons) {
      const cell = this.crewIcons[id]; if (cell.destroyed) continue; const on = best && best.c.id === id;
      cell.hl.clear(); if (on) { cell.hl.roundRect(-1, -1, 62, 82, 9).fill({ color: SKILL_COL[ch.skill] || C.brass, alpha: 0.3 }); cell.hl.roundRect(-1, -1, 62, 82, 9).stroke({ width: 2, color: SKILL_COL[ch.skill] || C.brass }); }
    }
  }

  // -------------------------------------------------------------------------------- sync + transitions
  _sig(v) { return [v.eventId, v.isResult, v.text, v.resultText, v.continueOnly, (v.choices || []).map((c) => c.label + c.enabled).join('|')].join('¦'); }
  _sync(first) {
    if (this.done || this._resolving || !this.modal || this.modal.destroyed) return;
    const v = this.game.pendingView?.();
    if (!v) { this._finish(); return; }
    const sig = this._sig(v); if (sig === this.sig) return; this.sig = sig;
    this._setArt(v); this._setSlot(v); this._setMusic(v);
    const old = this.right;
    const next = this._buildRight(v, first);
    next.alpha = 0; this.rightHost.addChild(next); this.right = next;
    Anim.to(next, { alpha: 1 }, 240, { delay: old ? 120 : 0, ease: 'linear' });
    if (old) { old.eventMode = 'none'; Anim.to(old, { alpha: 0 }, 140, { ease: 'linear', onDone: () => { if (!old.destroyed) old.destroy({ children: true }); } }); }
    this.lastDiff = null;
  }
  _setMusic(v) {
    const odds = (v.choices || []).map((c) => c.odds).filter((o) => o != null);
    const tags = v.tags || [];
    let mood = 'event';
    if (tags.includes('wonder') || tags.includes('mystery')) mood = 'wonder';
    if (tags.includes('hazard') || tags.includes('flee') || odds.some((o) => o < 0.4) || (v.choices || []).some((c) => c.tag === 'flee')) mood = 'tense';
    if (v.isResult && v.outcome === 'pass') mood = tags.includes('wonder') ? 'wonder' : 'event';
    if (v.isResult && v.outcome === 'fail') mood = this.mood || 'event';
    if (mood !== this.mood) { this.mood = mood; this.ui.music(mood); }
  }
  async _finish() {
    if (this.done) return; this.done = true;
    if (this.right) Anim.to(this.right, { alpha: 0 }, 160, { ease: 'linear' });
    this.close();
  }
  onClose() {
    this._offs.forEach((f) => f()); this._offs = [];
    try { this.ui.layers.toast.visible = true; } catch (e) { /* */ }
    const ui = this.ui, g = this.game; const wantShop = this.shop && !this._noShop;
    const scene = ui.sceneName; ui.music(scene === 'GalaxyMap' ? 'map' : 'bridge');
    setTimeout(() => {
      if (!g || g !== ui.game) return;
      if (g.state.pending) { ui.openEvent(); return; } // never leave an unresolved event hanging
      if (wantShop && g.state.phase !== 'ended') { try { if (!g.state.docked && g.here?.()?.station) g.dock(); } catch (e) { /* */ } ui.openOverlay('Trade', { fromEvent: true }); }
    }, 40);
  }

  // -------------------------------------------------------------------------------- right column
  _buildRight(v, first) {
    const col = new Container(); const W = this.RW; const BH = this.BH;
    // header: tag chips + title
    let tx = 0;
    for (const t of (v.tags || []).slice(0, 4)) {
      const ti = TAG_INFO[t]; if (!ti) continue;
      const p = pill({ icon: ti.icon, text: ti.text.toUpperCase(), color: ti.col, h: 22, size: 10, preset: 'headSm', padX: 9 }); p.x = tx; tx += p.w + 6; col.addChild(p);
    }
    const title = new Label({ text: v.title || '', preset: 'head', size: 21, color: C.brassLight, w: W, h: 30, fit: true, upper: true, shadow: true }); title.y = 30; col.addChild(title);
    const rule = hr(W); rule.y = 66; col.addChild(rule);
    let y = 80;
    const isResult = v.isResult;
    const text = isResult ? (v.resultText || '') : (v.text || '');
    const auto = !isResult && v.continueOnly;
    let tw = null; let after = null;

    if (isResult && v.outcome) {
      const ok = v.outcome === 'pass'; const pk = this._pick;
      const label = ok ? 'SUCCESS' : 'A SETBACK';
      const sub = pk && pk.skill ? `${cap(pk.skill)} check${pk.odds != null ? ' · ' + Math.round(pk.odds * 100) + '% odds' : ''}` : '';
      const b = pill({ icon: ok ? 'check' : 'warning', text: label + (sub ? '   ' + sub : ''), color: ok ? C.good : C.coral, h: 30, size: 13, padX: 14 }); b.y = y; col.addChild(b); popIn(b, { delay: 60 });
      y += 42;
    }
    if (text) {
      tw = new Typewriter({ w: W, text, preset: 'body', size: 19, lineHeight: 27, cps: first ? 62 : 70, color: isResult ? C.cream : C.cream, onDone: () => after && after() });
      tw.y = y; col.addChild(tw);
      if (tw.textHeight > 230) { /* long text: still fine, choices scroll */ }
      y += Math.min(tw.textHeight, 260) + 18;
    }
    this.tw = tw;
    const hint = new Label({ text: 'CLICK OR PRESS SPACE TO SKIP', preset: 'tiny', size: 10, color: C.textDim }); hint.x = W - hint.textWidth; hint.y = BH - 18; col.addChild(hint);
    const hideHint = () => { if (!hint.destroyed) Anim.to(hint, { alpha: 0 }, 200, { ease: 'linear' }); };

    if (isResult || auto) {
      let chips = this.lastDiff && this.lastDiff.length ? this.lastDiff : null;
      if (!chips) chips = summaryChips(v.summary || []);
      const cont = new Button({ label: this._contLabel(v), icon: 'arrow', w: 230, h: 48, variant: 'primary', onClick: () => this._continue(), sfx: 'confirm' });
      cont.x = W - 230; cont.y = BH - 56; cont.visible = false; col.addChild(cont); this.contBtn = cont; this.mode = 'continue';
      after = () => {
        hideHint();
        if (chips.length) {
          const lab = new Label({ text: 'EFFECTS', preset: 'headSm', size: 10, color: C.textDim }); lab.y = y - 4; col.addChild(lab);
          const row = chipRow(chips, W, { delay: 120 }); row.y = y + 18; col.addChild(row);
          const net = chips.some((c) => c.tone === 'bad') && !chips.some((c) => c.tone === 'good') ? 'bad' : 'good';
          void net;
        } else {
          const nl = new Label({ text: 'Nothing changes hands. The moment passes quietly.', preset: 'small', size: 14, color: C.textDim }); nl.y = y; col.addChild(nl);
        }
        cont.visible = true; fadeIn(cont, 260, 10);
      };
      if (!tw) after(); else if (tw.done) after();
      this.choices = null;
    } else {
      this.mode = 'choose'; this.contBtn = null;
      const showChoices = () => {
        hideHint();
        const cy = y; const avail = BH - cy;
        const pane = new ScrollPane({ w: W, h: avail, bottomPad: 4 });
        const cl = new EventChoices({
          w: W - 12, choices: v.choices, state: this.game.state,
          onChoose: (i, ch) => this._choose(i, ch), onHover: (ch) => this._highlightOfficer(ch),
        });
        pane.content.addChild(cl); pane.refresh(); pane.y = cy; col.addChild(pane); this.choices = cl;
        sfx('page', { vol: 0.4, pitch: 1.4 });
        if (cl.h > avail) { const sc = new Label({ text: '▼ MORE', preset: 'tiny', size: 10, color: C.mustard }); sc.x = W - 70; sc.y = BH - 14; col.addChild(sc); }
      };
      after = showChoices;
      if (!tw || tw.done) showChoices();
    }
    return col;
  }
  _contLabel(v) { return this.game.state.pending && v.isResult ? 'Continue' : 'Continue'; }

  _resolve(index) {
    const g = this.game; const before = snapshot(g); this._resolving = true; let r;
    try { r = g.resolveChoice(index); } catch (e) { r = { ok: false, reason: 'Something went wrong aboard.' }; }
    this._resolving = false;
    return { r, diff: r && r.ok !== false ? diffChips(g, before, snapshot(g)) : [] };
  }
  _choose(i, ch) {
    this._pick = { skill: ch.skill, odds: ch.odds, tag: ch.tag };
    const { r, diff } = this._resolve(ch.index ?? i);
    if (!r || r.ok === false) {
      this.choices?.lock(false); this.choices?.rows.forEach((row) => { row.alpha = 1; row.picked = false; });
      this.ui.toast(r?.reason || 'That did not work.', 'bad'); sfx('deny'); this.sig = null; this._sync(); return;
    }
    this.lastDiff = diff; this.sig = null; this._sync();
    if (!ch.skill && diff.some((c) => c.kind === 'credits' && c.tone === 'good')) sfx('coin');
  }
  _continue() {
    if (this._busy) return; this._busy = true; setTimeout(() => (this._busy = false), 250);
    const { r, diff } = this._resolve(0);
    if (!r || r.ok === false) { this.ui.toast(r?.reason || 'Cannot continue.', 'bad'); this.sig = null; this._sync(); return; }
    this._pick = null; this.lastDiff = diff; this.sig = null; this._sync();
  }
  _advanceKey() {
    if (this.done) return;
    if (this.tw && !this.tw.destroyed && !this.tw.done) { this.tw.skip(); return; }
    if (this.mode === 'continue' && this.contBtn && this.contBtn.visible) { this.contBtn.activate(); return; }
    if (this.mode === 'choose' && this.choices) this.choices.activateCursor();
  }
}
