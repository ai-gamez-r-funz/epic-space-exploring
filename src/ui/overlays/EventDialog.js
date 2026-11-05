import { Container, Graphics } from 'pixi.js';
import { Overlay } from './Overlay.js';
import { C } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Typewriter } from '../kit/Typewriter.js';
import { ChoiceList } from '../kit/ChoiceList.js';
import { ScrollPane } from '../kit/Scroll.js';
import { S } from '../services.js';
import { Anim } from '../kit/anim.js';

/**
 * EventDialog — PLACEHOLDER (phase 1). Shows game.pendingView() with a ChoiceList so gameplay is never blocked.
 * The next UI engineer replaces the visuals (art viewscreen, portrait, typewriter pacing, result styling) but should keep:
 *  - open() is called by ui.openEvent(); refresh() is called by App on every game 'changed' (re-read pendingView()).
 *  - closing when game.state.pending becomes null; no Esc-close (closable:false).
 *  - choices go through game.resolveChoice(view.choices[i].index ?? i).
 */
export class EventDialog extends Overlay {
  title = 'INCOMING'; size = { w: 860, h: 640 }; closable = false;
  build(modal) {
    this.root = new Container(); modal.body.addChild(this.root);
    this._render(true);
  }
  refresh() {
    if (!this.modal || this.modal.destroyed) return;
    const v = this.game.pendingView?.();
    if (!v) { this.close(); return; }
    this._render(false);
  }
  _render() {
    const v = this.game.pendingView?.(); if (!v) { setTimeout(() => this.close(), 0); return; }
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
    const bw = this.modal.bodyW; let y = 0;
    const artH = 150;
    const frame = new Graphics().roundRect(0, 0, bw, artH, 10).fill(0x05060f); this.root.addChild(frame);
    try {
      const art = S.gfx.sceneArt(v.art || { scene: 'void' }, bw, artH);
      if (art) { const m = new Graphics().roundRect(0, 0, bw, artH, 10).fill(0xffffff); art.mask = m; this.root.addChild(art, m); this.art = art; if (art.update) this.modal.o.__u = Anim.watch(art, (dt) => art.update(dt)); }
    } catch (e) { /* art is optional */ }
    this.root.addChild(new Graphics().roundRect(0, 0, bw, artH, 10).stroke({ width: 2, color: C.brassDark }));
    y = artH + 12;
    const h = new Label({ text: v.title || '', preset: 'head', size: 17, color: C.brassLight, w: bw, upper: true, fit: true, h: 24 }); h.y = y; this.root.addChild(h); y += 30;
    if (v.speaker?.name) { const s = new Label({ text: v.speaker.name, preset: 'tiny', size: 13, color: C.tealLight }); s.y = y; this.root.addChild(s); y += 18; }
    const body = (v.resultText ? v.resultText + (v.text ? '\n\n' : '') : '') + (v.isResult ? '' : (v.text || ''));
    const tw = new Typewriter({ w: bw, text: v.isResult && v.resultText ? v.resultText : (v.text || ''), preset: 'body', size: 18, lineHeight: 25, cps: 90 }); tw.y = y; this.root.addChild(tw);
    y += Math.min(tw.textHeight, 150) + 12;
    const choices = v.continueOnly || !v.choices?.length ? [{ label: 'Continue', enabled: true }] : v.choices;
    const avail = this.modal.bodyH - y;
    const cl = new ChoiceList({ w: bw - 12, choices, onChoose: (i) => { const ch = choices[i]; cl.setEnabled(false); this.game.resolveChoice(ch.index ?? i); } });
    const pane = new ScrollPane({ w: bw, h: avail }); pane.y = y; pane.content.addChild(cl); pane.refresh(); this.root.addChild(pane);
    this.cl = cl;
  }
}
