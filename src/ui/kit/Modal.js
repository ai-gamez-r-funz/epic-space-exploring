import { Container, Graphics, Rectangle } from 'pixi.js';
import { C, W, H } from './theme.js';
import { Panel } from './Panel.js';
import { Button, IconButton } from './Button.js';
import { Input } from './input.js';
import { Anim } from './anim.js';
import { Label } from './Label.js';
import { sfx } from '../services.js';

/**
 * Modal — dimmed backdrop + centred Panel, focus trap (hotkeys only reach widgets inside), Esc to close.
 *   const m = new Modal({ w:640, h:420, title:'SHIP LOG', tone:'indigo', closable:true, dismissOnBackdrop:false, onClose });
 *   Kit layer: Modal.layer is set by app.js; m.open() adds to it; m.body = content container (origin inside panel padding)
 *   m.bodyW / m.bodyH ; m.addButtons([{label,variant,onClick,hotkey,w}], {align:'right'|'center'}) -> bottom button row, returns buttons
 *   m.close(result) animates out, pops focus layer, destroys. m.closed (Promise<result>).
 * Stacking: nested modals are supported; only the top one receives hotkeys.
 */
export class Modal extends Container {
  static layer = null;
  static stack = [];
  constructor(o = {}) {
    super();
    this.o = { w: 640, h: 420, title: '', tone: 'indigo', closable: true, dismissOnBackdrop: false, pad: 18, ...o };
    this.closed = new Promise((r) => (this._resolve = r));
    this.backdrop = new Graphics().rect(0, 0, W, H).fill({ color: 0x03040d, alpha: 0.72 });
    this.backdrop.eventMode = 'static'; this.backdrop.on('pointertap', () => { if (this.o.dismissOnBackdrop && this.o.closable) this.close(); });
    this.addChild(this.backdrop);
    this.panel = new Panel({ w: this.o.w, h: this.o.h, title: this.o.title, tone: this.o.tone, pad: this.o.pad, rivets: true });
    this.panel.x = Math.round((W - this.o.w) / 2); this.panel.y = Math.round((H - this.o.h) / 2);
    this.panel.eventMode = 'static'; // swallow clicks
    this.addChild(this.panel);
    this.body = this.panel.content;
    this.bodyW = this.panel.innerW; this.bodyH = this.panel.innerH;
    if (this.o.closable) {
      this.closeBtn = new IconButton({ icon: 'close', size: 34, variant: 'coral', onClick: () => this.close(), tooltip: 'Close (Esc)' });
      this.closeBtn.x = this.o.w - 34 - 12; this.closeBtn.y = 10; this.panel.addChild(this.closeBtn);
    }
    this.footer = null;
  }
  open() {
    (Modal.layer || this.parent)?.addChild(this);
    Modal.stack.push(this);
    this._pop = Input.pushLayer({ root: this, name: 'modal', onKey: (e, key) => { if (key === 'Escape' && this.o.closable) { this.close(); return true; } return false; } });
    this.alpha = 0; this.panel.scale.set(0.96); this.panel.pivot.set(this.o.w / 2, this.o.h / 2); this.panel.x += this.o.w / 2; this.panel.y += this.o.h / 2;
    Anim.to(this, { alpha: 1 }, 160, { ease: 'linear' });
    Anim.to(this.panel.scale, { x: 1, y: 1 }, 220, { ease: 'outBack' });
    sfx('page');
    this.onOpen?.();
    return this;
  }
  /** Bottom button row. specs: [{label, variant, onClick(btn), hotkey, w, icon}] */
  addButtons(specs, { align = 'right', h = 42, gap = 12 } = {}) {
    this.footer?.destroy({ children: true });
    const f = new Container(); const btns = [];
    const total = specs.reduce((a, s) => a + (s.w || 150), 0) + gap * (specs.length - 1);
    let x = align === 'right' ? this.bodyW - total : align === 'center' ? (this.bodyW - total) / 2 : 0;
    for (const s of specs) { const b = new Button({ h, w: 150, variant: 'brass', ...s }); b.x = x; x += b.w + gap; f.addChild(b); btns.push(b); }
    f.y = this.bodyH - h; this.body.addChild(f); this.footer = f; return btns;
  }
  async close(result) {
    if (this._closing) return; this._closing = true;
    const i = Modal.stack.indexOf(this); if (i >= 0) Modal.stack.splice(i, 1);
    this._pop?.();
    this.eventMode = 'none';
    await Anim.to(this, { alpha: 0 }, 140, { ease: 'linear' }).promise;
    this.o.onClose?.(result); this._resolve(result);
    if (!this.destroyed) this.destroy({ children: true });
  }
  /** Convenience: title-less message box. */
  static async alert(text, { title = 'NOTICE', button = 'OK' } = {}) {
    const m = new Modal({ w: 520, h: 250, title, closable: true });
    const l = new Label({ text, preset: 'body', w: m.bodyW, color: C.cream }); m.body.addChild(l);
    m.addButtons([{ label: button, variant: 'primary', w: 140, onClick: () => m.close(true), hotkey: 'Enter' }]);
    m.open(); return m.closed;
  }
  static async confirm(text, { title = 'CONFIRM', yes = 'Yes', no = 'No' } = {}) {
    const m = new Modal({ w: 520, h: 250, title });
    m.body.addChild(new Label({ text, preset: 'body', w: m.bodyW, color: C.cream }));
    m.addButtons([{ label: no, w: 130, onClick: () => m.close(false), hotkey: 'n' }, { label: yes, variant: 'primary', w: 130, onClick: () => m.close(true), hotkey: 'y' }]);
    m.open(); return m.closed;
  }
}
