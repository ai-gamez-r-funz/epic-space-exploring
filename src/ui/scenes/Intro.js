import { Container, Graphics } from 'pixi.js';
import { Scene } from '../Scene.js';
import { W, H, C } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Button } from '../kit/Button.js';
import { Typewriter } from '../kit/Typewriter.js';
import { Anim } from '../kit/anim.js';
import { Input } from '../kit/input.js';
import { S } from '../services.js';
import { makeBackdrop } from '../widgets/Backdrop.js';

/** Intro crawl: typed paragraphs from INTRO_TEXT. Click/Space/Enter completes the current paragraph, then advances. */
export class Intro extends Scene {
  static scene = 'Intro';
  async enter() {
    const v = this.view; this.bg = makeBackdrop({ seed: 31, hue: 230 }); v.addChild(this.bg);
    this.paras = S.content.INTRO_TEXT || ['...']; this.i = 0; this.t = 0;
    const tint = new Graphics().rect(0, 0, W, H).fill({ color: 0x05060f, alpha: 0.35 }); v.addChild(tint);
    this.box = new Container(); this.box.x = 240; this.box.y = 150; v.addChild(this.box);
    this.ship = S.gfx.ship({ kind: 'halcyon', scale: 0.8, thrust: 0.6 }); this.ship.alpha = 0.85; v.addChildAt(this.ship, 2);
    this.counter = new Label({ text: '', preset: 'tiny', color: C.textDim }); this.counter.x = 240; this.counter.y = 640; v.addChild(this.counter);
    this.skipBtn = new Button({ label: 'Skip', w: 120, h: 40, variant: 'ghost', hotkey: 'Escape', onClick: () => this.finish() }); this.skipBtn.x = W - 150; this.skipBtn.y = H - 66; v.addChild(this.skipBtn);
    this.nextBtn = new Button({ label: 'Continue', icon: 'arrow', w: 200, h: 46, variant: 'primary', hotkey: ['Enter', 'Space'], onClick: () => this.next() }); this.nextBtn.x = W - 380; this.nextBtn.y = H - 69; v.addChild(this.nextBtn);
    v.eventMode = 'static'; v.hitArea = { contains: () => true }; v.on('pointertap', (e) => { if (e.target === v || e.target === tint) this.next(); });
    this.show();
  }
  show() {
    this.box.removeChildren().forEach((c) => c.destroy({ children: true }));
    const text = this.paras[this.i]; const first = this.i === 0;
    const head = new Label({ text: first ? 'STARDATE 2461' : '', preset: 'head', size: 14, color: C.mustard }); this.box.addChild(head);
    this.tw = new Typewriter({ w: 800, text, preset: 'body', size: 28, lineHeight: 42, color: C.cream, cps: 42, tick: true }); this.tw.y = 40; this.box.addChild(this.tw);
    this.box.alpha = 0; Anim.to(this.box, { alpha: 1 }, 400);
    this.counter.setText('●'.repeat(this.i + 1) + '○'.repeat(this.paras.length - this.i - 1) + '   Space or click to continue');
    this.nextBtn.setLabel(this.i === this.paras.length - 1 ? 'Take the helm' : 'Continue');
  }
  next() { if (this.tw && !this.tw.done) { this.tw.skip(); return; } if (this.i >= this.paras.length - 1) return this.finish(); this.i++; this.show(); }
  finish() { if (this._done) return; this._done = true; this.ui.goto('Bridge', {}, { kind: 'wipe', dir: 'left', ms: 500 }); }
  onEscape() { this.finish(); }
  update(dt) { this.t += dt; this.bg.update(dt, this.t * 10, 0); this.ship?.update?.(dt); if (this.ship) { this.ship.x = ((this.t * 24) % 1700) - 200; this.ship.y = 600 + Math.sin(this.t * 0.7) * 14; } }
}
