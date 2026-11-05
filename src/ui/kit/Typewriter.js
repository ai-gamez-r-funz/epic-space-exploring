import { Container, CanvasTextMetrics, Text } from 'pixi.js';
import { C, textStyle } from './theme.js';
import { Anim } from './anim.js';
import { sfx } from '../services.js';

/**
 * Typewriter — wrapped text that types itself out. Click it (or call skip()) to reveal everything.
 *   const tw = new Typewriter({ w:600, text, preset:'body', color, cps:55, tick:true, onDone, align:'left' });
 *   tw.setText(str)  tw.skip()  tw.done (bool)  tw.height  tw.finished (Promise)
 * Layout is computed once from the full text, so lines never reflow while typing. Sets eventMode static for click-to-skip.
 */
export class Typewriter extends Container {
  constructor(o = {}) {
    super();
    this.o = { w: 600, preset: 'body', cps: 55, tick: false, ...o };
    this.t = new Text({ text: '', style: textStyle(this.o.preset, { ...(this.o.color != null ? { fill: this.o.color } : {}), ...(this.o.size ? { fontSize: this.o.size } : {}), ...(this.o.lineHeight ? { lineHeight: this.o.lineHeight } : {}), align: this.o.align || 'left' }) });
    this.addChild(this.t);
    this.eventMode = 'static'; this.on('pointertap', () => this.skip());
    Anim.watch(this, (dt) => this._tick(dt));
    this.setText(this.o.text || '');
  }
  setText(text) {
    const st = this.t.style.clone(); st.wordWrap = true; st.wordWrapWidth = this.o.w; st.breakWords = true;
    const m = CanvasTextMetrics.measureText(String(text), st);
    this.full = m.lines.join('\n'); this.pos = 0; this.done = !this.full.length; this._acc = 0;
    this.t.style = st; this.t.style.wordWrap = false; this.t.text = ''; this._th = m.height; this._lines = m.lines;
    this.finished = new Promise((r) => (this._fin = r));
    if (this.done) this._fin();
    this.hitArea = { contains: (x, y) => x >= 0 && x <= this.o.w && y >= 0 && y <= this._th };
  }
  get textHeight() { return this._th; }
  skip() { if (this.done) return false; this.pos = this.full.length; this.t.text = this.full; this._finish(); return true; }
  _finish() { this.done = true; this.o.onDone?.(); this._fin?.(); }
  _tick(dt) {
    if (this.done) return;
    this._acc += dt * this.o.cps; const n = Math.floor(this._acc);
    if (n < 1) return; this._acc -= n;
    let adv = n;
    while (adv-- > 0 && this.pos < this.full.length) {
      const ch = this.full[this.pos++];
      if (ch === '.' || ch === ',' || ch === '!' || ch === '?') this._acc -= ch === ',' ? 2 : 5; // brief pause on punctuation
    }
    this.t.text = this.full.slice(0, this.pos);
    if (this.o.tick && this.pos % 3 === 0) sfx('hover', { vol: 0.25, pitch: 1.5 });
    if (this.pos >= this.full.length) this._finish();
  }
}
