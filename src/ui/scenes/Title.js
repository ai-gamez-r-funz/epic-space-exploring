import { Container, Graphics } from 'pixi.js';
import { Scene } from '../Scene.js';
import { W, H, C, mix } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Button } from '../kit/Button.js';
import { Panel, Lights } from '../kit/Panel.js';
import { Anim } from '../kit/anim.js';
import { vstack } from '../kit/layout.js';
import { Tooltip } from '../kit/Tooltip.js';
import { S } from '../services.js';
import { makeBackdrop } from '../widgets/Backdrop.js';
import { Modal } from '../kit/Modal.js';
import { slimBar } from '../overlays/parts2/common.js';
import { slotCard, slotInfo } from '../overlays/parts2/slots.js';
import { openCredits } from '../overlays/parts2/Credits.js';

function readLegacy() {
  try { const o = JSON.parse(localStorage.getItem('halcyon.legacy') || 'null'); if (o) return { runs: o.runs | 0, best: o.best | 0, bonus: o.bonus | 0 }; } catch (e) { /* */ }
  return { runs: 0, best: 0, bonus: 0 };
}

export class Title extends Scene {
  static scene = 'Title';
  async enter() {
    const v = this.view;
    this.bg = makeBackdrop({ seed: 11, hue: 250 }); v.addChild(this.bg);
    // a big planet rising in the lower right, lit by an unseen sun
    try {
      this.planet = S.gfx.planet({ type: 'ocean', seed: 5, radius: 330, ringed: false, moons: 1, life: 'civilized' }); this.planet.x = 1080; this.planet.y = 860; v.addChild(this.planet);
      this.moon = S.gfx.planet({ type: 'barren', seed: 9, radius: 36 }); this.moon.x = 760; this.moon.y = 330; v.addChild(this.moon);
    } catch (e) { /* art optional */ }
    this.ship = S.gfx.ship({ kind: 'halcyon', scale: 1.5, thrust: 0.7 }); v.addChild(this.ship);
    // title block
    const tb = new Container(); tb.x = 80; tb.y = 90; v.addChild(tb); this.tb = tb;
    const l1 = new Label({ text: 'HALCYON', preset: 'display', size: 76, color: C.cream, shadow: true }); const l2 = new Label({ text: 'REACH', preset: 'display', size: 76, color: C.mustard, shadow: true }); l2.y = 84;
    const line = new Graphics().rect(0, 190, 440, 3).fill(C.brass).rect(0, 190, 120, 3).fill(C.coral);
    const sub = new Label({ text: 'A COZY VOYAGE OF OPEN SKIES', preset: 'head', size: 12, color: C.tealLight, letterSpacing: 5 }); sub.y = 206;
    tb.addChild(l1, l2, line, sub);
    tb.alpha = 0; tb.y += 14; Anim.to(tb, { alpha: 1, y: 90 }, 900, { delay: 200 });
    // menu panel
    const hasSave = this.ui.hasSave('auto'); const info = hasSave ? slotInfo('auto') : null;
    const mk = (label, icon, variant, fn, hotkey, o = {}) => new Button({ label, icon, variant, w: 320, h: 48, fontSize: 17, onClick: fn, hotkey, ...o });
    this.btnContinue = mk('Continue', 'jump', 'teal', () => this.cont(), 'c', { disabled: !hasSave, disabledReason: 'No autosave found yet — start a new voyage.' });
    const anySave = ['1', '2'].some((k) => this.ui.hasSave(k)) || hasSave;
    const btns = [
      mk('New Voyage', 'star', 'primary', () => this.ui.goto('NewGame', {}, { kind: 'wipe', dir: 'left' }), 'n'),
      this.btnContinue,
      mk('Load game', 'log', 'brass', () => this.loadMenu(), 'l', { disabled: !anySave, disabledReason: 'No saved voyages yet.' }),
      mk('Settings', 'settings', 'brass', () => this.ui.openOverlay('Settings'), 's'),
      mk('How to play', 'codex', 'brass', () => this.ui.openOverlay('Help'), 'h'),
      mk('Credits', 'crew', 'brass', () => this.credits(), 'r'),
    ];
    vstack(btns, { gap: 9 });
    const menu = new Container(); menu.x = 90; menu.y = 326; btns.forEach((b, i) => { menu.addChild(b); b.alpha = 0; b.x = -30; Anim.to(b, { alpha: 1, x: 0 }, 500, { delay: 500 + i * 90 }); }); v.addChild(menu);
    if (info?.exists && !info.corrupt) { const sub = new Label({ text: `${info.ship || 'ISV'} · day ${info.day} · ${info.charted ?? 0}/${info.total ?? '?'} charted`, preset: 'tiny', size: 11, color: C.tealLight, w: 250, fit: true, h: 14 }); sub.x = 334; sub.y = this.btnContinue.y + 17; sub.alpha = 0; menu.addChild(sub); Anim.to(sub, { alpha: 0.9 }, 400, { delay: 900 }); this.contSub = sub; }
    // legacy panel (top right)
    const lg = readLegacy();
    const lp = new Panel({ w: 300, h: lg.runs > 0 ? 150 : 96, title: 'LEGACY OF THE SOCIETY', tone: 'deep', pad: 16 }); lp.x = W - 330; lp.y = 44; v.addChild(lp);
    if (lg.runs > 0) {
      const rows = [['Voyages completed', lg.runs], ['Best score', lg.best], ['Starting bonus', `+${lg.bonus} scrip`]];
      rows.forEach(([k, val], i) => { const kl = new Label({ text: k, preset: 'small', size: 14, color: C.textDim }); kl.y = i * 28; const vl = new Label({ text: String(val), preset: 'num', size: 16, color: i === 2 ? C.mustard : C.cream }); vl.x = 268 - vl.textWidth; vl.y = i * 28 - 1; lp.content.addChild(kl, vl); });
      const bar = slimBar(268, Math.min(1, lg.bonus / 500), C.mustard, 8); bar.y = 90; lp.content.addChild(bar);
    } else lp.content.addChild(new Label({ text: 'Finish a voyage and the Society\nremembers you with a head start.', preset: 'small', size: 14, color: C.textDim, lineHeight: 19 }));
    Tooltip.attach(lp, { title: 'Legacy bonus', body: 'Each completed voyage adds starting scrip to every future one (up to +500).' });
    // footer
    const f = new Label({ text: 'No combat. Ever.  ·  v1.0', preset: 'tiny', color: C.textDim }); f.x = W - f.textWidth - 18; f.y = H - 26; v.addChild(f);
    if (!S.real.game || !S.real.gfx) { const m = new Label({ text: `dev mocks: ${['game', 'gfx', 'audio'].filter((k) => !S.real[k]).join(', ')}`, preset: 'tiny', color: C.coral }); m.x = 12; m.y = H - 22; v.addChild(m); }
    this.t = 0;
  }
  async cont() {
    const g = this.ui.loadSlot('auto'); if (!g) { this.ui.toast('The autosave could not be loaded.', 'bad'); return; }
    this.ui.goto('Bridge', {}, { kind: 'iris', ms: 500 });
  }
  credits() { openCredits(this.ui); }
  loadMenu() {
    const m = new Modal({ w: 560, h: 450, title: 'LOAD A VOYAGE' }); let y = 0;
    for (const slot of ['auto', '1', '2']) { const c = slotCard(this.ui, slot, { w: m.bodyW, hasGame: false, onLoad: (sl) => { const g = this.ui.loadSlot(sl); if (!g) { this.ui.toast('That save could not be read.', 'bad'); return; } m.close(); this.ui.goto('Bridge', {}, { kind: 'iris', ms: 500 }); } }); c.y = y; m.body.addChild(c); y += 100; }
    m.addButtons([{ label: 'Back', variant: 'brass', onClick: () => m.close(), hotkey: 'Enter' }]); m.open();
  }
  update(dt) {
    this.t += dt; this.bg.update(dt, this.t * 14, this.t * 2);
    this.planet?.update?.(dt); this.moon?.update?.(dt); this.ship.update?.(dt);
    const p = (this.t * 0.02 + 0.2) % 1.0; // ship crosses the right half, low across the planet's horizon
    this.ship.x = 640 + p * 820; this.ship.y = 330 + Math.sin(this.t * 0.8) * 12 + p * 60; this.ship.rotation = Math.sin(this.t * 0.5) * 0.04 + 0.05;
  }
}
