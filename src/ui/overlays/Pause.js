import { Container } from 'pixi.js';
import { Overlay } from './Overlay.js';
import { C } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Button } from '../kit/Button.js';
import { Modal } from '../kit/Modal.js';
import { vstack } from '../kit/layout.js';
import { slotInfo, writeSlot, fmtWhen } from './parts2/slots.js';

/** Pause — Esc menu: resume / save / settings / help / quit. */
export class Pause extends Overlay {
  title = 'PAUSED'; size = { w: 460, h: 500 };
  build(modal) {
    const bw = modal.bodyW; const g = this.game;
    const sub = new Label({ text: g ? `${g.state.ship.name} · Day ${g.state.day}` : '', preset: 'small', size: 14, color: C.tealLight, w: bw, align: 'center' }); modal.body.addChild(sub);
    const mk = (label, variant, fn, hk, icon) => new Button({ label, variant, w: bw, h: 52, onClick: fn, hotkey: hk, icon, fontSize: 17 });
    const btns = [
      mk('Resume', 'primary', () => modal.close(), 'Enter', 'arrow'),
      mk('Settings', 'brass', () => { modal.close(); this.ui.openOverlay('Settings'); }, 's', 'settings'),
      mk('Help & hotkeys', 'brass', () => { modal.close(); this.ui.openOverlay('Help'); }, 'h', 'log'),
    ];
    const saveRow = new Container(); saveRow.w = bw; saveRow.h = 66;
    this.saveBtns = ['1', '2'].map((slot, i) => {
      const b = new Button({ label: `Save to slot ${slot}`, icon: 'log', w: (bw - 12) / 2, h: 46, fontSize: 14, variant: 'teal', upper: false, disabled: !g, onClick: () => { const ok = writeSlot(this.ui.game, slot); this.ui.toast(ok ? `Saved to slot ${slot}.` : 'Could not save.', ok ? 'good' : 'bad'); this._info(); } });
      b.x = i * ((bw - 12) / 2 + 12); saveRow.addChild(b);
      const l = new Label({ text: '', preset: 'tiny', size: 11, color: C.textDim, w: (bw - 12) / 2, align: 'center', fit: true, h: 14 }); l.x = b.x; l.y = 50; saveRow.addChild(l); b.info = l; return b;
    });
    this._info();
    btns.push(saveRow);
    btns.push(mk('Quit to title', 'coral', async () => { const ok = await Modal.confirm('Leave this voyage and return to the title screen? Your last autosave is kept.', { title: 'QUIT TO TITLE', yes: 'Quit', no: 'Stay' }); if (ok) { modal.close(); this.ui.autosave(); this.ui.goto('Title'); } }, null, 'close'));
    vstack(btns, { gap: 14, y: 28 }); modal.body.addChild(...btns);
  }
  _info() { this.saveBtns.forEach((b, i) => { const s = slotInfo(String(i + 1)); b.info.setText(s.exists && !s.corrupt ? `Day ${s.day} · ${fmtWhen(s.savedAt)}` : 'empty'); }); }
}
