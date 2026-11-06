import { Container, Graphics, Rectangle } from 'pixi.js';
import { C, grad } from './theme.js';
import { Label } from './Label.js';
import { Anim } from './anim.js';
import { Input } from './input.js';
import { sfx } from '../services.js';

/**
 * TextInput — single-line text field drawn in Pixi, backed by a hidden DOM <input> (so IME / mobile keyboards work).
 *   new TextInput({ w=300, h=44, value:'', placeholder:'Captain name', maxLength:24, numeric:false, onChange(v), onSubmit(v) })
 *   .value  setValue(v)  focus()  blur()
 */
export class TextInput extends Container {
  constructor(o = {}) {
    super();
    this.o = { w: 300, h: 44, maxLength: 28, placeholder: '', ...o };
    this.w = this.o.w; this.h = this.o.h; this.value = this.o.value || ''; this.focused = false;
    this.bg = new Graphics(); this.addChild(this.bg);
    this.txt = new Label({ text: '', preset: 'body', size: 20, color: C.cream, w: this.w - 28, valign: 'middle', h: this.h }); this.txt.x = 14; this.addChild(this.txt);
    this.caret = new Graphics(); this.addChild(this.caret);
    this.eventMode = 'static'; this.cursor = 'text'; this.hitArea = new Rectangle(0, 0, this.w, this.h);
    this.on('pointertap', () => this.focus());
    Anim.watch(this, (dt, t) => { this.caret.visible = this.focused && Math.floor(t * 2) % 2 === 0; });
    this.dom = document.createElement('input');
    Object.assign(this.dom.style, { position: 'fixed', left: '-1000px', top: '0', opacity: '0', width: '10px' });
    this.dom.maxLength = this.o.maxLength; this.dom.autocomplete = 'off'; this.dom.spellcheck = false;
    if (this.o.numeric) this.dom.inputMode = 'numeric';
    document.body.appendChild(this.dom);
    this.dom.addEventListener('input', () => {
      let v = this.dom.value; if (this.o.numeric) v = v.replace(/[^0-9]/g, ''); this.dom.value = v;
      this.value = v; this._draw(); this.o.onChange?.(v);
    });
    this.dom.addEventListener('keydown', (e) => { if (e.key === 'Enter') { this.o.onSubmit?.(this.value); this.blur(); } else if (e.key === 'Escape') { this.blur(); e.stopPropagation(); } });
    this.dom.addEventListener('blur', () => { this.focused = false; this._draw(); });
    this.dom.value = this.value;
    this.on('destroyed', () => this.dom.remove());
    this._draw();
  }
  focus() { this.dom.focus(); this.focused = true; sfx('click'); this._draw(); }
  blur() { this.dom.blur(); this.focused = false; this._draw(); }
  setValue(v) { this.value = v; this.dom.value = v; this._draw(); }
  _draw() {
    const { w, h } = this; const g = this.bg; g.clear();
    g.roundRect(0, 0, w, h, 10).fill({ color: this.focused ? C.brassLight : C.brassDark });
    g.roundRect(2, 2, w - 4, h - 4, 8).fill(grad([[0, 0x0a0c1f], [1, 0x14173a]]));
    if (this.focused) g.roundRect(-3, -3, w + 6, h + 6, 13).stroke({ width: 2, color: C.teal, alpha: 0.7 });
    const empty = !this.value;
    this.txt.setText(empty ? this.o.placeholder : this.value); this.txt.setColor(empty ? C.textDim : C.cream);
    const tw = empty ? 0 : this.txt.textWidth;
    this.caret.clear().rect(0, 0, 2, h - 18).fill({ color: C.teal }); this.caret.x = 14 + Math.min(tw + 2, this.w - 24); this.caret.y = 9;
  }
}
