import { Container, Graphics, Rectangle } from 'pixi.js';
import { C, lighten, grad } from './theme.js';
import { Label } from './Label.js';
import { Input } from './input.js';
import { sfx } from '../services.js';

/**
 * Slider — horizontal slider with knob.  new Slider({ w=240, min=0, max=1, step=0.01, value, onChange(v), label:'Music', format:(v)=>... })
 * setValue(v, silent?) . Dragging fires onChange continuously; wheel nudges; click on track jumps.
 */
export class Slider extends Container {
  constructor(o = {}) {
    super();
    this.o = { w: 240, min: 0, max: 1, step: 0.01, value: 0.5, format: (v) => Math.round(v * 100) + '%', ...o };
    this.value = this.o.value; this.h = 30;
    this.g = new Graphics(); this.addChild(this.g);
    this.trackX = 0; this.tw = this.o.w;
    if (o.label) {
      this.lab = new Label({ text: o.label, preset: 'label', size: 13, color: C.cream, upper: true }); this.addChild(this.lab);
      this.trackX = 110; this.tw = this.o.w - 110 - 54;
    } else { this.tw = this.o.w - 54; }
    this.val = new Label({ text: '', preset: 'numSm', color: C.brassLight }); this.addChild(this.val);
    this.eventMode = 'static'; this.cursor = 'pointer'; this.hitArea = new Rectangle(0, 0, this.o.w, this.h);
    this.on('pointerdown', (e) => { const sx = e.getLocalPosition(this).x; this._setFromX(sx); Input.drag(e.nativeEvent, (dx, dy, tx) => this._setFromX(sx + tx), () => sfx('click'), 1); });
    this.on('wheel', (e) => { this.setValue(this.value - Math.sign(e.deltaY) * this.o.step * 5); this.o.onChange?.(this.value); });
    this._draw();
  }
  _setFromX(x) {
    const t = Math.max(0, Math.min(1, (x - this.trackX) / this.tw));
    let v = this.o.min + t * (this.o.max - this.o.min);
    v = Math.round(v / this.o.step) * this.o.step;
    if (v !== this.value) { this.value = v; this._draw(); this.o.onChange?.(v); }
  }
  setValue(v, silent = true) { this.value = Math.max(this.o.min, Math.min(this.o.max, v)); this._draw(); if (!silent) this.o.onChange?.(this.value); }
  _draw() {
    const g = this.g; g.clear(); const { min, max } = this.o; const t = (this.value - min) / (max - min); const cy = this.h / 2; const x0 = this.trackX;
    g.roundRect(x0, cy - 5, this.tw, 10, 5).fill({ color: 0x05060f });
    g.roundRect(x0 + 1.5, cy - 3.5, this.tw - 3, 7, 3.5).fill({ color: 0x151838 });
    if (t > 0) g.roundRect(x0 + 2, cy - 3, Math.max(6, (this.tw - 4) * t), 6, 3).fill(grad([[0, C.tealLight], [1, C.teal]]));
    const kx = x0 + this.tw * t;
    g.circle(kx, cy + 2, 11).fill({ color: 0x000000, alpha: 0.35 });
    g.circle(kx, cy, 11).fill({ color: C.brassDark });
    g.circle(kx, cy, 9.5).fill(grad([[0, C.brassLight], [1, C.brass]]));
    g.circle(kx - 2.5, cy - 3, 3).fill({ color: 0xffffff, alpha: 0.45 });
    this.val.setText(this.o.format(this.value)); this.val.x = this.o.w - this.val.textWidth; this.val.y = (this.h - this.val.textHeight) / 2;
    if (this.lab) this.lab.y = (this.h - this.lab.textHeight) / 2;
  }
}
