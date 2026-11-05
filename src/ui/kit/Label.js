import { Container, Text } from 'pixi.js';
import { C, textStyle, TEXT } from './theme.js';

/**
 * Label — text with word-wrap, alignment and optional auto-fit.
 *   new Label({ text, preset:'body', color, size, w, h, align:'left'|'center'|'right', maxLines, fit:true, bold, mono })
 * - w: wrap width (omit = single line). h + fit:true shrinks the font (down to minSize) until the text fits w×h.
 * - Origin is top-left of the w×h box (box = natural size if w/h omitted). align positions text inside w.
 * Methods: setText(str), setColor(c), `.text` getter/setter, `.textWidth`, `.textHeight`.
 */
export class Label extends Container {
  constructor(o = {}) {
    super();
    this.opts = { preset: 'body', align: 'left', minSize: 9, ...o };
    this._text = o.text ?? '';
    this.t = new Text({ text: '', style: textStyle(this.opts.preset) });
    this.addChild(this.t);
    this._layout();
  }
  get text() { return this._text; }
  set text(v) { this.setText(v); }
  setText(v) { v = v == null ? '' : String(v); if (v === this._text) return this; this._text = v; this._layout(); return this; }
  setColor(c) { this.opts.color = c; this.t.style.fill = c; return this; }
  setOpts(o) { Object.assign(this.opts, o); this._layout(); return this; }
  get textWidth() { return this.t.width; }
  get textHeight() { return this.t.height; }
  _layout() {
    const o = this.opts;
    const over = {};
    if (o.color != null) over.fill = o.color;
    if (o.size) over.fontSize = o.size;
    if (o.bold != null) over.fontWeight = o.bold ? '700' : '400';
    if (o.mono) over.fontFamily = TEXT.mono.fontFamily;
    if (o.letterSpacing != null) over.letterSpacing = o.letterSpacing;
    if (o.lineHeight) over.lineHeight = o.lineHeight;
    if (o.stroke) over.stroke = { color: o.stroke, width: o.strokeWidth || 3, join: 'round' };
    if (o.shadow) over.dropShadow = { color: 0x000000, alpha: 0.6, blur: 3, distance: 2, angle: Math.PI / 2 };
    let txt = this._text;
    if (o.upper) txt = txt.toUpperCase();
    const base = textStyle(o.preset, over);
    const t = this.t;
    t.style = base;
    t.text = txt;
    if (o.w) { t.style.wordWrap = true; t.style.wordWrapWidth = o.w; t.style.breakWords = true; }
    t.style.align = o.align;
    const lh = (o.lineHeight || TEXT[o.preset]?.lineHeight || 0);
    const tooBig = () => (o.w && t.width > o.w + 0.5) || (o.h && t.height > o.h + 0.5) ||
      (o.maxLines && lh && t.height > lh * o.maxLines + 2);
    if (o.fit || o.maxLines) {
      let size = t.style.fontSize; let guard = 40;
      while (tooBig() && size > o.minSize && guard--) {
        size -= 1; t.style.fontSize = size;
        if (t.style.lineHeight) t.style.lineHeight = Math.round(t.style.lineHeight * (size / (size + 1)));
      }
      if (o.maxLines && tooBig() && !o.fit) { /* ellipsis fallback */ }
    }
    this._place();
  }
  _place() {
    const o = this.opts; const t = this.t; const w = o.w || t.width;
    if (o.align === 'center') t.x = (w - t.width) / 2; else if (o.align === 'right') t.x = w - t.width; else t.x = 0;
    const h = o.h || t.height;
    t.y = o.valign === 'middle' ? (h - t.height) / 2 : 0;
  }
}
