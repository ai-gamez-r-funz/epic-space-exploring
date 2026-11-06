import { Modal } from '../kit/Modal.js';

/**
 * Overlay base class — wraps a kit Modal. Subclass, set `title`/`size`, override build().
 *   class Foo extends Overlay { title='FOO'; size={w:720,h:480}; build(modal, params){ modal.body.addChild(...); modal.addButtons([...]) } }
 * Lifecycle: ui.openOverlay('Foo', params) -> new Foo(ui).open(params) ; close() ; refresh() is called on every game 'changed'
 * for EventDialog only (override `onChanged()` in your overlay and register in build() via this.watch() to get updates).
 * Useful: this.game, this.ui, this.watch(fn) (auto-unsubscribed on close), this.modal.
 */
export class Overlay {
  title = ''; size = { w: 720, h: 480 }; tone = 'indigo'; closable = true;
  constructor(ui) { this.ui = ui; this.modal = null; this._offs = []; }
  get game() { return this.ui.game; }
  open(params = {}) {
    this.params = params;
    this.modal = new Modal({ ...this.size, title: this.title, tone: this.tone, closable: this.closable, onClose: () => { this._offs.splice(0).forEach((f) => f()); this.onClose?.(); this.onClosed?.(); } });
    this.build(this.modal, params);
    this.modal.open();
    return this;
  }
  watch(fn) { const off = this.ui.onChanged(fn); this._offs.push(off); return off; }
  close() { this.modal?.close(); }
  build(modal, params) {}
  refresh() {}
}
