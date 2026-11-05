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
    const hasSave = this.ui.hasSave('auto');
    const mk = (label, icon, variant, fn, hotkey, o = {}) => new Button({ label, icon, variant, w: 320, h: 54, fontSize: 18, onClick: fn, hotkey, ...o });
    this.btnContinue = mk('Continue', 'jump', 'teal', () => this.cont(), 'c', { disabled: !hasSave, disabledReason: 'No autosave found yet — start a new voyage.' });
    const btns = [
      mk('New Voyage', 'star', 'primary', () => this.ui.goto('NewGame', {}, { kind: 'wipe', dir: 'left' }), 'n'),
      this.btnContinue,
      mk('Settings', 'settings', 'brass', () => this.ui.openOverlay('Settings'), 's'),
      mk('Credits', 'log', 'brass', () => this.credits(), 'r'),
    ];
    vstack(btns, { gap: 14 });
    const menu = new Container(); menu.x = 90; menu.y = 330; btns.forEach((b, i) => { menu.addChild(b); b.alpha = 0; b.x = -30; Anim.to(b, { alpha: 1, x: 0 }, 500, { delay: 500 + i * 110 }); }); v.addChild(menu);
    // legacy panel
    const lg = readLegacy();
    if (lg.runs > 0) {
      const p = new Panel({ w: 300, h: 110, title: 'LEGACY OF THE SOCIETY', tone: 'deep', pad: 16 }); p.x = 90; p.y = 580; v.addChild(p);
      const t = new Label({ text: `Voyages completed ${lg.runs}\nBest score ${lg.best}\nStarting bonus +${lg.bonus} scrip`, preset: 'small', size: 15, color: C.cream, lineHeight: 20 }); p.content.addChild(t);
    }
    // footer
    const f = new Label({ text: 'No combat. Ever.  ·  v1.0', preset: 'tiny', color: C.textDim }); f.x = W - f.textWidth - 18; f.y = H - 26; v.addChild(f);
    const lights = new Lights({ count: 5, r: 4 }); lights.x = 94; lights.y = 648; v.addChild(lights);
    if (!S.real.game || !S.real.gfx) { const m = new Label({ text: `dev mocks: ${['game', 'gfx', 'audio'].filter((k) => !S.real[k]).join(', ')}`, preset: 'tiny', color: C.coral }); m.x = 12; m.y = H - 22; v.addChild(m); }
    this.t = 0;
  }
  async cont() {
    const g = this.ui.loadSlot('auto'); if (!g) { this.ui.toast('The autosave could not be loaded.', 'bad'); return; }
    this.ui.goto('Bridge', {}, { kind: 'iris', ms: 500 });
  }
  credits() {
    const m = new Modal({ w: 640, h: 440, title: 'CREDITS' });
    m.body.addChild(new Label({ text: 'HALCYON REACH\nA cozy, no-combat space survey.\n\nBuilt with PixiJS 8 and a great deal of tea.\nFonts: Josefin Sans, Syncopate, Space Mono (SIL OFL).\nAll art and sound are generated procedurally in your browser.\n\nWith thanks to the Meridian Society for Open Skies, who would like you to bring the ship back with the paint intact.', preset: 'body', w: m.bodyW, color: C.cream, lineHeight: 26 }));
    m.addButtons([{ label: 'Lovely', variant: 'primary', onClick: () => m.close(), hotkey: 'Enter' }]); m.open();
  }
  update(dt) {
    this.t += dt; this.bg.update(dt, this.t * 14, this.t * 2);
    this.planet?.update?.(dt); this.moon?.update?.(dt); this.ship.update?.(dt);
    const p = (this.t * 0.02 + 0.2) % 1.0; // ship crosses the right half, low across the planet's horizon
    this.ship.x = 640 + p * 820; this.ship.y = 330 + Math.sin(this.t * 0.8) * 12 + p * 60; this.ship.rotation = Math.sin(this.t * 0.5) * 0.04 + 0.05;
  }
}
