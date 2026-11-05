import { Container, Graphics } from 'pixi.js';
import { W, H, C } from './theme.js';
import { Anim } from './anim.js';

/**
 * Fader — full-stage transition cover. Lives on the topmost layer (created by app.js).
 *   await fader.out({ kind:'fade'|'wipe'|'iris', ms:320, dir:'left'|'right'|'up'|'down', color })   // cover the screen
 *   await fader.in({ ...same })                                                                     // reveal
 *   await fader.through(async () => { swap scene }, opts)                                           // out → fn → in
 */
export class Fader extends Container {
  constructor() {
    super();
    this.g = new Graphics(); this.addChild(this.g); this.visible = false; this.eventMode = 'none';
    this.p = 0; this.kind = 'fade'; this.dir = 'right'; this.color = C.ink; this.covered = false;
  }
  _draw() {
    const g = this.g; g.clear(); const p = this.p; if (p <= 0) { this.visible = false; return; } this.visible = true;
    if (this.kind === 'fade') g.rect(0, 0, W, H).fill({ color: this.color, alpha: p });
    else if (this.kind === 'iris') {
      const r = Math.hypot(W, H) / 2 * (1 - p);
      g.rect(0, 0, W, H).fill({ color: this.color }); if (r > 1) g.circle(W / 2, H / 2, r).cut();
      g.circle(W / 2, H / 2, r).stroke({ width: 4, color: C.brass });
    } else { // wipe: brass-edged curtain
      const d = this.dir; const horiz = d === 'left' || d === 'right';
      const len = horiz ? W : H; const edge = p * (len + 40);
      const slant = 40;
      g.poly(this._wipePoly(d, edge, slant)).fill({ color: this.color });
      g.poly(this._wipePoly(d, edge - 6, slant, 6)).fill({ color: C.brass, alpha: 0.9 });
    }
  }
  _wipePoly(d, edge, s, band = 0) {
    const e = edge;
    if (d === 'right') return band ? [e - band, 0, e, 0, e - s, H, e - s - band, H] : [0, 0, e, 0, e - s, H, 0, H];
    if (d === 'left') return band ? [W - e, 0, W - e + band, 0, W - e + s + band, H, W - e + s, H] : [W, 0, W - e, 0, W - e + s, H, W, H];
    if (d === 'down') return band ? [0, e - band, W, e - band, W, e, 0, e] : [0, 0, W, 0, W, e, 0, e];
    return band ? [0, H - e, W, H - e, W, H - e + band, 0, H - e + band] : [0, H, W, H, W, H - e, 0, H - e];
  }
  async out({ kind = 'fade', ms = 320, dir = 'right', color = C.ink } = {}) {
    this.kind = kind; this.dir = dir; this.color = color; this.eventMode = 'static'; // block input while covered
    await Anim.to(this, { p: 1 }, ms, { ease: 'inOutQuad', onUpdate: () => this._draw() }).promise; this.p = 1; this._draw();
  }
  async in({ ms = 360 } = {}) {
    await Anim.to(this, { p: 0 }, ms, { ease: 'inOutQuad', onUpdate: () => this._draw() }).promise; this.p = 0; this._draw(); this.eventMode = 'none';
  }
  async through(fn, opts = {}) { await this.out(opts); try { await fn(); } finally { await this.in(opts); } }
}
