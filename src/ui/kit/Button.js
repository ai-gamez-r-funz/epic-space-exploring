import { Container, Graphics, Rectangle } from 'pixi.js';
import { C, textStyle, lighten, darken, TEXT, Display } from './theme.js';
import { drawButtonFace, drawPill } from './draw.js';
import { Label } from './Label.js';
import { Tooltip } from './Tooltip.js';
import { Input } from './input.js';
import { Anim } from './anim.js';
import { S, sfx } from '../services.js';

export const VARIANTS = {
  brass:   { face: 0x2a2f6a, trim: C.brass, text: C.cream },
  primary: { face: C.mustard, trim: C.brassDark, text: C.textInk },
  teal:    { face: C.teal, trim: C.tealDark, text: C.textInk },
  coral:   { face: C.coral, trim: C.coralDark, text: C.textInk },
  cream:   { face: C.cream, trim: C.brassDark, text: C.textInk },
  dark:    { face: 0x161838, trim: C.brassDark, text: C.cream },
  ghost:   { face: 0x1c2050, trim: 0x4a5090, text: C.cream },
};

/**
 * Button — console button with hover/press/disabled/focus, sfx, optional icon + hotkey badge.
 *   new Button({ label, w=140, h=44, variant='brass', icon:'jump', hotkey:'c', onClick, disabled, disabledReason,
 *                tooltip, vertical:false, fontSize, sfx:'click', toggle:false, selected:false, iconSize })
 * variants: brass (default) | primary | teal | coral | cream | dark | ghost
 * API: setLabel(s) setEnabled(bool, reason?) setTooltip(c) setSelected(bool) setVariant(v) activate() focus
 * props: .enabled .label .selected ; `vertical:true` stacks icon over label (command bar style).
 * Hotkeys are scoped to whatever scene/modal contains the button (see Input.bind).
 */
export class Button extends Container {
  constructor(o = {}) {
    super();
    this.o = { w: 140, h: 44, variant: 'brass', fontSize: 16, sfx: 'click', ...o };
    this.w = this.o.w; this.h = this.o.h;
    this.enabled = !o.disabled; this.disabledReason = o.disabledReason || '';
    this.selected = !!o.selected; this.onClick = o.onClick;
    this._state = 'idle'; this._focus = false; this._flash = 0; this._glow = 0;
    this.face = new Graphics(); this.addChild(this.face);
    this.content = new Container(); this.addChild(this.content);
    this.badge = null;
    this.eventMode = 'static'; this.cursor = 'pointer';
    const pad = Display.touch ? Math.min(7, Math.max(0, (44 / Math.max(0.3, Display.scale) - this.h) / 2)) : 0; // phones: slightly fatter touch target
    this.hitArea = new Rectangle(-pad, -pad, this.w + pad * 2, this.h + pad * 2);
    this._build();
    this.on('pointerover', () => { if (!this.enabled) return; this._set('hover'); if (this._hoverSfxOk()) sfx('hover'); });
    this.on('pointerout', () => this._set('idle'));
    this.on('pointerdown', () => { if (this.enabled) this._set('press'); });
    this.on('pointerup', () => { if (this.enabled) this._set('hover'); });
    this.on('pointerupoutside', () => this._set('idle'));
    this.on('pointertap', (e) => { if (!Input.clickAllowed()) return; this._click(e); });
    if (o.hotkey) this._unbind = Input.bind(this, o.hotkey, () => this.activate(), () => this.enabled || true);
    this._unfocus = Input.addFocusable(this);
    this._tip = null;
    this._refreshTip();
    this.on('destroyed', () => { this._unbind?.(); this._unfocus?.(); });
    Anim.watch(this, (dt) => this._tick(dt));
  }
  _hoverSfxOk() { const n = performance.now(); if (n - (Button._lastHover || 0) < 60) return false; Button._lastHover = n; return true; }
  _build() {
    const o = this.o; const v = VARIANTS[o.variant] || VARIANTS.brass;
    this.content.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.iconObj = null; this.labelObj = null;
    const textCol = this.enabled ? v.text : lighten(v.text, 0) ;
    const pad = 12; let iconSz = o.iconSize || (o.vertical ? Math.min(34, this.h * 0.42) : Math.min(26, this.h - 14));
    if (o.icon) { this.iconObj = S.gfx.icon(o.icon, { size: iconSz, color: v.text }); this.content.addChild(this.iconObj); }
    if (o.label != null && o.label !== '') {
      if (o.vertical) this.labelObj = new Label({ text: o.label, preset: 'button', size: o.fontSize, color: v.text, upper: o.upper !== false, w: this.w - 10, fit: true, align: 'center', h: 20 });
      else {
        this.labelObj = new Label({ text: o.label, preset: 'button', size: o.fontSize, color: v.text, upper: o.upper !== false });
        const avail = this.w - pad * 2 - (this.iconObj ? iconSz + 8 : 0) - (o.hotkey ? 14 : 0);
        if (this.labelObj.textWidth > avail) this.labelObj.setOpts({ w: avail, fit: true });
      }
      this.content.addChild(this.labelObj);
    }
    // layout
    if (o.vertical) {
      const lh = this.labelObj ? this.labelObj.textHeight : 0; const gap = 2;
      const total = (this.iconObj ? iconSz : 0) + (this.labelObj ? lh + gap : 0);
      let y = (this.h - total) / 2 + 1;
      if (this.iconObj) { this._placeIcon(this.iconObj, this.w / 2, y + iconSz / 2); y += iconSz + gap; }
      if (this.labelObj) { this.labelObj.x = 5; this.labelObj.y = y; }
    } else {
      const lw = this.labelObj ? this.labelObj.textWidth : 0;
      const total = (this.iconObj ? iconSz + (lw ? 8 : 0) : 0) + lw;
      const centered = (o.align || 'center') === 'center';
      let x = centered ? (this.w - total) / 2 : pad;
      if (this.iconObj) { this._placeIcon(this.iconObj, x + iconSz / 2, this.h / 2); x += iconSz + 8; }
      if (this.labelObj) { this.labelObj.x = x; this.labelObj.y = Math.round((this.h - this.labelObj.textHeight) / 2); }
    }
    if (o.hotkey) {
      this.badge?.destroy({ children: true });
      const b = new Container(); const g = new Graphics();
      const k = String(o.hotkey).length === 1 ? o.hotkey.toUpperCase() : o.hotkeyLabel || String(o.hotkey).slice(0, 3);
      const l = new Label({ text: k, preset: 'numSm', size: 10, color: C.cream });
      const bw = Math.max(16, l.textWidth + 8);
      drawPill(g, bw, 15, 0x0b0d1e, { alpha: 0.85, stroke: C.brassDark }); l.x = (bw - l.textWidth) / 2; l.y = 1;
      b.addChild(g, l); b.x = this.w - bw - 4; b.y = 3; this.addChild(b); this.badge = b;
    }
    this._redraw();
  }
  _placeIcon(ic, cx, cy) {
    // icons are expected to be centred on origin; if they aren't (bounds say top-left), correct by bounds.
    const b = ic.getLocalBounds();
    ic.x = cx - (b.x + b.width / 2); ic.y = cy - (b.y + b.height / 2);
  }
  _set(s) { if (this._state === s) return; this._state = s; this._redraw(); }
  _redraw() {
    const o = this.o; const v = VARIANTS[o.variant] || VARIANTS.brass;
    let face = v.face; let st = this._state;
    if (!this.enabled) { face = darken(v.face, 0.15); st = 'idle'; }
    if (this.selected) face = lighten(face, 0.18);
    drawButtonFace(this.face, this.w, this.h, { face, trim: this.selected ? C.brassLight : v.trim, state: this._flash > 0 ? 'press' : st, glow: this.selected ? 1 : this._glow });
    this.content.alpha = this.enabled ? 1 : 0.42; this.face.alpha = this.enabled ? 1 : 0.6;
    this.content.y = (this._state === 'press' || this._flash > 0) ? 1 : 0;
    if (this.badge) this.badge.alpha = this.enabled ? 1 : 0.4;
    if (this._focusG) { this._focusG.destroy(); this._focusG = null; }
    if (this._focus && Input.keyboardMode) {
      const g = new Graphics(); g.roundRect(-4, -4, this.w + 8, this.h + 8, 13).stroke({ width: 2, color: C.cream, alpha: 0.95 });
      this.addChild(g); this._focusG = g;
    }
    this.cursor = this.enabled ? 'pointer' : 'not-allowed';
  }
  _tick(dt) {
    if (this._flash > 0) { this._flash -= dt; if (this._flash <= 0) this._redraw(); }
    if (this._shake > 0) { this._shake -= dt; this.content.x = Math.sin(this._shake * 70) * 3 * (this._shake / 0.25); if (this._shake <= 0) this.content.x = 0; }
  }
  _setFocus(f) { this._focus = f; this._redraw(); }
  _click() {
    if (!this.enabled) { sfx('deny'); this._shake = 0.25; return; }
    sfx(this.o.sfx);
    if (this.o.toggle) this.setSelected(!this.selected);
    this.onClick?.(this);
  }
  /** Programmatic click (also used by hotkeys). Shows a press flash. */
  activate() {
    if (!this.enabled) { sfx('deny'); this._shake = 0.25; return; }
    this._flash = 0.12; this._redraw(); this._click();
  }
  get label() { return this.o.label; }
  setLabel(s) { if (s === this.o.label) return this; this.o.label = s; this._build(); return this; }
  setIcon(n) { this.o.icon = n; this._build(); return this; }
  setEnabled(on, reason) {
    on = !!on; reason = reason || '';
    if (on === this.enabled && reason === this.disabledReason) return this;
    this.enabled = on; this.disabledReason = on ? '' : reason; this._build(); this._refreshTip(); return this;
  }
  setSelected(s) { this.selected = !!s; this._redraw(); return this; }
  setVariant(v) { this.o.variant = v; this._build(); return this; }
  setTooltip(t) { this.o.tooltip = t; this._refreshTip(); return this; }
  _refreshTip() {
    const fn = () => {
      const base = typeof this.o.tooltip === 'function' ? this.o.tooltip() : this.o.tooltip;
      if (!this.enabled && this.disabledReason) {
        const b = typeof base === 'string' ? { title: this.o.label || '', body: base } : (base || { title: this.o.label || '' });
        return { ...b, title: b.title || this.o.label, rows: [...(b.rows || []), ['Unavailable', this.disabledReason, 'warn']] };
      }
      return base;
    };
    if (this.o.tooltip || this.disabledReason) { if (!this._tip) this._tip = Tooltip.attach(this, fn); else Tooltip.set(this, fn); }
    else if (this._tip) { this._tip(); this._tip = null; }
  }
}

/** IconButton — square (or round) button holding only an icon. new IconButton({ icon:'settings', size:44, variant, onClick, tooltip, hotkey }) */
export class IconButton extends Button {
  constructor(o = {}) {
    const size = o.size || 44;
    super({ ...o, label: '', w: size, h: size, iconSize: o.iconSize || Math.round(size * 0.58), vertical: false, align: 'center' });
  }
}
