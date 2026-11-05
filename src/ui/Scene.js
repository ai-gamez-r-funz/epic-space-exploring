import { Container } from 'pixi.js';
import { Input } from './kit/input.js';

/**
 * Scene base class. Subclass and override enter/exit/update/resize/onEscape.
 *   constructor(ui)   — `ui` is the App (ui.game, ui.goto, ui.openOverlay, ui.toast, ui.music ...)
 *   this.view         — Container added to the scene layer. Everything you create should live under it.
 *   this.own(fn)      — register a cleanup (e.g. event unsubscribe, ticker removal) run automatically on exit.
 *   this.onChanged(fn)— subscribe to game 'changed' (auto-unsubscribed on exit).
 *   async enter(params) · exit() · update(dt) · resize() · onEscape()
 */
export class Scene {
  static scene = 'Scene';
  constructor(ui) {
    this.ui = ui; this.view = new Container(); this._cleanups = [];
    this._unEsc = Input.bind(this.view, 'Escape', () => this.onEscape());
  }
  get game() { return this.ui.game; }
  own(fn) { this._cleanups.push(fn); return fn; }
  onChanged(fn) { const off = this.ui.onChanged(fn); this.own(off); return off; }
  async enter(params) {}
  update(dt) {}
  resize() {}
  onEscape() { this.ui.openPause(); }
  exit() {
    this._unEsc?.();
    for (const f of this._cleanups.splice(0)) { try { f(); } catch (e) { console.warn(e); } }
  }
  destroy() { this.exit(); if (!this.view.destroyed) this.view.destroy({ children: true }); }
}
