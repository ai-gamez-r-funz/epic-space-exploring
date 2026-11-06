import { Container, Graphics } from 'pixi.js';
import { C, lighten, darken, grad, mix } from './theme.js';
import { Label } from './Label.js';
import { Anim } from './anim.js';
import { S } from '../services.js';
import { Tooltip } from './Tooltip.js';

/**
 * Bar — animated resource bar (fuel/supplies/hull/morale).
 *   new Bar({ w=160, h=16, value, max=100, color, icon:'fuel', label:'FUEL', showValue:true, danger:0.25, ticks:10, tooltip })
 * set(value, max?) animates the fill; below `danger` fraction the bar pulses (coral). With icon, the icon sits left of the bar.
 */
export class Bar extends Container {
  constructor(o = {}) {
    super();
    this.o = { w: 160, h: 16, max: 100, value: 100, color: C.teal, danger: 0.25, showValue: true, ticks: 10, ...o };
    this.val = this.o.value; this.shown = this.val; this.max = this.o.max; this.flash = 0; this.flashCol = C.cream;
    this.g = new Graphics(); this.addChild(this.g);
    const iconW = this.o.icon ? this.o.h + 8 : 0; this.ox = iconW;
    if (this.o.icon) { this.ic = S.gfx.icon(this.o.icon, { size: this.o.h + 4, color: this.o.color }); const b = this.ic.getLocalBounds(); this.ic.x = (this.o.h + 4) / 2 - (b.x + b.width / 2); this.ic.y = this.o.h / 2 - (b.y + b.height / 2); this.addChild(this.ic); }
    this.txt = new Label({ text: '', preset: 'numSm', size: Math.max(10, this.o.h - 5), color: C.cream, shadow: true });
    this.addChild(this.txt);
    if (this.o.tooltip) Tooltip.attach(this, this.o.tooltip);
    this.eventMode = this.o.tooltip ? 'static' : 'passive';
    Anim.watch(this, (dt, t) => this._tick(dt, t));
    this._draw(0);
  }
  get w() { return this.o.w + this.ox; }
  get h() { return this.o.h; }
  set(value, max) {
    if (max != null) this.max = max;
    if (value > this.val) { this.flash = 0.6; this.flashCol = C.good; } else if (value < this.val) { this.flash = 0.6; this.flashCol = C.coral; }
    this.val = value; return this;
  }
  setColor(c) { this.o.color = c; return this; }
  _tick(dt, t) {
    const diff = this.val - this.shown;
    if (Math.abs(diff) > 0.01) this.shown += diff * Math.min(1, dt * 6); else this.shown = this.val;
    if (this.flash > 0) this.flash -= dt;
    this._draw(t);
  }
  _draw(t) {
    const { h, color, danger, ticks, showValue } = this.o; const w = this.o.w; const g = this.g; const x0 = this.ox;
    g.clear();
    const frac = Math.max(0, Math.min(1, this.max ? this.shown / this.max : 0));
    const low = this.max && this.val / this.max <= danger;
    const pulse = low ? 0.5 + 0.5 * Math.sin(t * 6) : 0;
    g.roundRect(x0, 0, w, h, h / 2).fill({ color: 0x05060f });
    g.roundRect(x0 + 1.5, 1.5, w - 3, h - 3, h / 2 - 1).fill({ color: 0x151838 });
    if (frac > 0.002) {
      const fw = Math.max(h - 4, (w - 4) * frac);
      const base = low ? mix(C.coral, C.mustard, 1 - pulse) : color;
      g.roundRect(x0 + 2, 2, fw, h - 4, (h - 4) / 2).fill(grad([[0, lighten(base, 0.35)], [0.5, base], [1, darken(base, 0.35)]]));
      g.roundRect(x0 + 4, 3, Math.max(2, fw - 4), (h - 6) * 0.38, 3).fill({ color: 0xffffff, alpha: 0.22 });
    }
    // tick marks
    for (let i = 1; i < ticks; i++) g.rect(x0 + (w / ticks) * i - 0.5, 3, 1, h - 6).fill({ color: 0x000000, alpha: 0.28 });
    if (this.flash > 0) g.roundRect(x0, 0, w, h, h / 2).stroke({ width: 2, color: this.flashCol, alpha: Math.min(1, this.flash * 2) });
    if (low) g.roundRect(x0 - 2, -2, w + 4, h + 4, h / 2 + 2).stroke({ width: 2, color: C.coral, alpha: 0.25 + 0.55 * pulse });
    else g.roundRect(x0, 0, w, h, h / 2).stroke({ width: 1.5, color: C.brassDark });
    if (showValue) {
      this.txt.setText(`${Math.round(this.shown)}${this.o.showMax ? '/' + Math.round(this.max) : ''}`);
      this.txt.x = x0 + w - this.txt.textWidth - 8; this.txt.y = (h - this.txt.textHeight) / 2;
    }
  }
}
