import { Container, Graphics } from 'pixi.js';
import { Overlay } from './Overlay.js';
import { C } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Button } from '../kit/Button.js';
import { Slider } from '../kit/Slider.js';
import { ScrollPane } from '../kit/Scroll.js';
import { Modal } from '../kit/Modal.js';
import { S } from '../services.js';
import { heading, switchW } from './parts2/common.js';
import { Prefs, Tutorial, TEXT_SPEEDS } from './parts2/prefs.js';
import { slotCard } from './parts2/slots.js';

/** Settings — audio, text speed, accessibility toggles, tutorial hints, save/load slots, retire, quit. */
export class Settings extends Overlay {
  title = 'SETTINGS'; size = { w: 1040, h: 640 };
  build(modal) {
    const bw = modal.bodyW, bh = modal.bodyH; const hasGame = !!this.game;
    const left = new ScrollPane({ w: 500, h: bh - 54 }); modal.body.addChild(left); const L = left.content; let y = 0;
    const au = S.audio; const v = au.getVolume?.() || { master: 0.8, music: 0.6, sfx: 0.85 };
    const h1 = heading('Sound'); L.addChild(h1); y += 26;
    for (const [label, key] of [['Master', 'master'], ['Music', 'music'], ['Effects', 'sfx']]) {
      const s = new Slider({ w: 470, label, value: v[key] ?? 0.7, min: 0, max: 1, step: 0.05, onChange: (x) => { au.setVolume({ [key]: x }); if (key === 'sfx') this.ui.sfx('click'); } }); s.y = y; L.addChild(s); y += 40;
    }
    this.muteBtn = new Button({ label: au.isMuted?.() ? 'Unmute' : 'Mute all', icon: au.isMuted?.() ? 'mute' : 'sound', w: 190, h: 42, onClick: (b) => { au.mute(!au.isMuted()); b.setLabel(au.isMuted() ? 'Unmute' : 'Mute all'); b.setIcon(au.isMuted() ? 'mute' : 'sound'); } }); this.muteBtn.y = y; L.addChild(this.muteBtn); y += 62;
    const h2 = heading('Reading & comfort'); h2.y = y; L.addChild(h2); y += 28;
    const tl = new Label({ text: 'TEXT SPEED', preset: 'label', size: 13, color: C.cream }); tl.y = y + 10; L.addChild(tl);
    this.speedBtns = {}; Object.keys(TEXT_SPEEDS).forEach((id, i) => {
      const b = new Button({ label: id[0].toUpperCase() + id.slice(1), w: 84, h: 38, fontSize: 13, upper: false, variant: Prefs.textSpeed === id ? 'brass' : 'ghost', selected: Prefs.textSpeed === id, onClick: () => { Prefs.set('textSpeed', id); for (const k in this.speedBtns) { this.speedBtns[k].setSelected(k === id); this.speedBtns[k].setVariant(k === id ? 'brass' : 'ghost'); } } });
      b.x = 130 + i * 90; b.y = y; L.addChild(b); this.speedBtns[id] = b;
    }); y += 52;
    const row = (label, desc, val, fn) => {
      const r = new Container(); r.y = y; L.addChild(r);
      const t = new Label({ text: label, preset: 'bodyB', size: 16, color: C.cream, w: 380, fit: true, h: 20 }); r.addChild(t);
      const d = new Label({ text: desc, preset: 'tiny', size: 12, color: C.textDim, w: 380, lineHeight: 15 }); d.y = 22; r.addChild(d);
      const s = switchW(val, fn); s.x = 414; s.y = 6; r.addChild(s); y += 28 + Math.max(16, d.textHeight) + 14; return s;
    };
    row('Screen shake', 'Little bumps and rumbles on rough jumps.', Prefs.shake, (on) => Prefs.set('shake', on));
    row('Animations', 'Slides, fades and flourishes. Off = instant (follows your system\'s reduced-motion setting by default).', Prefs.anim, (on) => Prefs.set('anim', on));
    row('Large UI', 'Bigger panels and roomier touch targets on small screens.', Prefs.largeUI, (on) => { Prefs.set('largeUI', on); this.ui.applyLayout?.(); });
    this.tutSw = row('Tutorial hints', 'Pulsing hints that walk you through chart, jump, scan, hail and dock.', Tutorial.enabled, (on) => { if (on) Tutorial.reset(); else Tutorial.setEnabled(false); });
    if (this.ui.fullscreenSupported) {
      const fb = new Button({ label: this.ui.isFullscreen?.() ? 'Exit fullscreen' : 'Fullscreen', icon: 'arrow', w: 220, h: 42, onClick: (b) => { this.ui.toggleFullscreen(); setTimeout(() => b.setLabel(this.ui.isFullscreen() ? 'Exit fullscreen' : 'Fullscreen'), 400); } }); fb.y = y; L.addChild(fb); y += 56;
    }
    left.refresh();
    // right column: saves
    const rx = 530, rw = bw - rx; const R = new Container(); R.x = rx; modal.body.addChild(R); this.R = R; this.rw = rw;
    this._saves();
    modal.addButtons([{ label: 'Done', onClick: () => modal.close(), hotkey: 'Enter', variant: 'primary', w: 140 }]);
  }
  _saves() {
    const R = this.R; R.removeChildren().forEach((c) => c.destroy({ children: true })); const hasGame = !!this.game; let y = 0;
    const h = heading('Voyage'); R.addChild(h); y += 26;
    ['auto', '1', '2'].forEach((slot) => {
      const c = slotCard(this.ui, slot, { w: this.rw, hasGame, onSaved: () => this._saves(), onLoad: (s) => this._load(s) }); c.y = y; R.addChild(c); y += 98;
    });
    if (!hasGame) { const n = new Label({ text: 'Start or continue a voyage to save.', preset: 'small', size: 14, color: C.textDim }); n.y = y; R.addChild(n); y += 28; }
    y += 6;
    if (hasGame) {
      const g = this.game; let can = { ok: false, reason: 'Survey at least 50% of the Reach first.' };
      try { const sv = g.surveyProgress(); can = sv.pct >= 50 ? { ok: true } : { ok: false, reason: `Survey at least 50% of the Reach first (now ${sv.pct}%).` }; if (g.state.pending) can = { ok: false, reason: 'Resolve the current event first.' }; if (g.state.phase === 'ended') can = { ok: false, reason: 'The voyage is over.' }; } catch (e) { /* */ }
      if (g.retire) {
        const rb = new Button({ label: 'Retire the commission', icon: 'star', w: this.rw, h: 46, variant: 'coral', disabled: !can.ok, disabledReason: can.reason, tooltip: { title: 'Retire the commission', body: 'End your voyage here with honour. Your ending depends on what you have achieved. Needs 50% of the Reach surveyed.' }, onClick: () => this._retire() });
        rb.y = y; R.addChild(rb); y += 58;
      }
      const qb = new Button({ label: 'Quit to title', icon: 'close', w: this.rw, h: 46, variant: 'dark', onClick: () => this._quit() }); qb.y = y; R.addChild(qb);
    }
  }
  async _load(slot) {
    if (this.game) { const ok = await Modal.confirm('Load this save? Unsaved progress in the current voyage will be lost.', { title: 'LOAD GAME', yes: 'Load', no: 'Cancel' }); if (!ok) return; }
    const g = this.ui.loadSlot(slot); if (!g) { this.ui.toast('That save could not be read.', 'bad'); return; }
    this.close(); this.ui.goto('Bridge', {}, { kind: 'iris', ms: 500 });
  }
  async _retire() {
    const ok = await Modal.confirm('Retire the commission? The voyage ends here, and your ending is decided by what you have charted and who you have helped.', { title: 'RETIRE', yes: 'Retire', no: 'Keep sailing' });
    if (!ok) return; const r = this.game.retire({ anywhere: true });
    if (r?.ok === false) this.ui.toast(r.reason || 'Not yet.', 'warn'); else this.close();
  }
  async _quit() {
    const ok = await Modal.confirm('Leave this voyage and return to the title screen? Your last autosave is kept.', { title: 'QUIT TO TITLE', yes: 'Quit', no: 'Stay' });
    if (ok) { this.close(); this.ui.autosave(); this.ui.goto('Title'); }
  }
}
