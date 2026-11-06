import { Container, Graphics } from 'pixi.js';
import { C } from './theme.js';
import { drawPanel, drawWell, TONES } from './draw.js';
import { Label } from './Label.js';
import { Anim } from './anim.js';

/**
 * Panel — brass-trimmed rounded console panel with optional title plate and blinking lights.
 *   new Panel({ w, h, title:'CREW', tone:'indigo'|'deep'|'teal'|'coral'|'mustard'|'cream'|'plum', radius:14, lights:false, rivets:false, well:false, pad:14 })
 * Put children into `panel.content` (origin = inner top-left, below the title plate).
 * `panel.innerW / innerH` = usable size. `panel.resize(w,h)` redraws. `well:true` draws a recessed dark screen instead.
 */
export class Panel extends Container {
  constructor(o = {}) {
    super();
    this.o = { w: 200, h: 120, tone: 'indigo', radius: 14, pad: 14, ...o };
    this.bg = new Graphics(); this.addChild(this.bg);
    this.content = new Container(); this.addChild(this.content);
    this.plate = null; this.lights = null;
    this.resize(this.o.w, this.o.h);
  }
  get innerW() { return this.o.w - this.o.pad * 2; }
  get innerH() { return this.o.h - this.o.pad * 2 - (this.o.title ? 14 : 0); }
  resize(w, h) {
    const o = this.o; o.w = w; o.h = h; this.w = w; this.h = h;
    if (o.well) drawWell(this.bg, w, h, { radius: o.radius, color: o.wellColor });
    else drawPanel(this.bg, w, h, { radius: o.radius, tone: o.tone, rivets: o.rivets, shadow: o.shadow !== false });
    this.content.x = o.pad; this.content.y = o.pad + (o.title ? 14 : 0);
    this.plate?.destroy({ children: true }); this.plate = null;
    if (o.title) {
      const p = new Container(); const g = new Graphics();
      const l = new Label({ text: o.title, preset: 'headSm', size: 10, color: C.textInk, upper: true });
      const pw = Math.min(w - 30, l.textWidth + 28), ph = 20;
      g.roundRect(0, 0, pw, ph, 9).fill({ color: C.brassDark });
      g.roundRect(1.5, 1.5, pw - 3, ph - 3, 8).fill({ color: C.brass });
      g.roundRect(4, 3, pw - 8, 6, 3).fill({ color: 0xffffff, alpha: 0.25 });
      l.x = (pw - l.textWidth) / 2; l.y = (ph - l.textHeight) / 2;
      p.addChild(g, l); p.x = 18; p.y = -9; this.addChild(p); this.plate = p;
    }
    this.lights?.destroy({ children: true }); this.lights = null;
    if (o.lights) { this.lights = new Lights({ count: 3, r: 4 }); this.lights.x = w - 24 - 3 * 14; this.lights.y = 12; this.addChild(this.lights); }
    this.removeChild(this.content); this.addChild(this.content);
    return this;
  }
}

/**
 * Lights — row of blinking console LEDs.  new Lights({ count:4, r:4, gap:6, colors:[teal,coral,mustard,good], speed:1, pattern:'random'|'chase'|'steady' })
 * `lights.setColors([...])`, `lights.setLevel(i, 0..1)` for steady mode.
 */
export class Lights extends Container {
  constructor(o = {}) {
    super();
    this.o = { count: 4, r: 4, gap: 6, speed: 1, pattern: 'random', colors: [C.teal, C.mustard, C.coral, C.good], ...o };
    this.g = new Graphics(); this.addChild(this.g);
    this.phase = Array.from({ length: this.o.count }, () => Math.random() * 10);
    this.rate = Array.from({ length: this.o.count }, () => 0.6 + Math.random() * 1.8);
    this.level = new Array(this.o.count).fill(1);
    Anim.watch(this, (dt, t) => this._draw(t));
    this._draw(0);
  }
  setColors(c) { this.o.colors = c; }
  setLevel(i, v) { this.level[i] = v; }
  _draw(t) {
    const { count, r, gap, colors, speed, pattern } = this.o; const g = this.g; g.clear();
    for (let i = 0; i < count; i++) {
      let a;
      if (pattern === 'steady') a = this.level[i];
      else if (pattern === 'chase') a = Math.max(0, Math.cos((t * speed * 2 - i * 0.7))) ** 2;
      else a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * this.rate[i] * speed + this.phase[i])) ** 2;
      const col = colors[i % colors.length]; const cx = r + i * (r * 2 + gap), cy = r;
      g.circle(cx, cy, r + 3).fill({ color: col, alpha: 0.18 * a });
      g.circle(cx, cy, r).fill({ color: 0x10132b });
      g.circle(cx, cy, r - 0.8).fill({ color: col, alpha: 0.25 + 0.75 * a });
      g.circle(cx - r * 0.3, cy - r * 0.3, r * 0.3).fill({ color: 0xffffff, alpha: 0.5 * a });
    }
  }
}
