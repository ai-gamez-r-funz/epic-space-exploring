// Save-slot helpers shared by Settings and Pause.
import { Container, Graphics } from 'pixi.js';
import { C } from '../../kit/theme.js';
import { Label } from '../../kit/Label.js';
import { Button } from '../../kit/Button.js';
import { S } from '../../services.js';

export function slotInfo(slot) {
  try {
    if (S.Game.slotInfo) return S.Game.slotInfo(slot);
    const raw = S.Game.readSave(slot); if (!raw) return { slot, exists: false };
    const st = typeof raw === 'string' ? JSON.parse(raw) : raw.state || raw;
    return { slot, exists: true, day: st.day, captain: st.captain?.name, ship: st.ship?.name, credits: st.credits, savedAt: st.savedAt };
  } catch (e) { return { slot, exists: true, corrupt: true }; }
}
export function fmtWhen(ts) {
  if (!ts) return 'time unknown';
  try { const d = new Date(ts); const now = new Date(); const same = d.toDateString() === now.toDateString();
    const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return same ? `today ${t}` : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${t}`; } catch (e) { return ''; }
}
export function writeSlot(game, slot) {
  try { const r = S.Game.writeSave(game, slot); return r === undefined ? true : (typeof r === 'object' ? r.ok !== false : !!r); } catch (e) { return false; }
}
export const slotName = (s) => (s === 'auto' ? 'Autosave' : 'Slot ' + s);

/** Card w x 84 with preview text and Save / Load buttons. */
export function slotCard(ui, slot, { w = 430, hasGame = true, onSaved, onLoad } = {}) {
  const k = new Container(); const info = slotInfo(slot); const h = 88;
  k.addChild(new Graphics().roundRect(0, 0, w, h, 12).fill({ color: 0x0b0d1e, alpha: 0.5 }).roundRect(0, 0, w, h, 12).stroke({ width: 1.5, color: info.exists ? C.brassDark : 0x30356a }));
  const t = new Label({ text: slotName(slot), preset: 'headSm', size: 11, color: C.brassLight, upper: true }); t.x = 14; t.y = 10; k.addChild(t);
  let l1, l2;
  if (!info.exists) { l1 = 'Empty'; l2 = slot === 'auto' ? 'Fills itself on arrival, docking and after events.' : 'Save here to keep a second voyage.'; }
  else if (info.corrupt) { l1 = 'Unreadable save'; l2 = 'This slot could not be read.'; }
  else { l1 = `${info.ship || 'Ship'} · Capt. ${info.captain || '?'}`; l2 = `Day ${info.day} · ${info.charted ?? '?'}/${info.total ?? '?'} charted · ${Math.round(info.credits ?? 0)} scrip`; }
  const a = new Label({ text: l1, preset: 'bodyB', size: 15, color: info.exists ? C.cream : C.textDim, w: w - 200, fit: true, h: 20 }); a.x = 14; a.y = 28; k.addChild(a);
  const b = new Label({ text: l2, preset: 'tiny', size: 12, color: C.textDim, w: w - 200, fit: true, h: 15 }); b.x = 14; b.y = 50; k.addChild(b);
  if (info.exists && !info.corrupt) { const c = new Label({ text: fmtWhen(info.savedAt), preset: 'tiny', size: 11, color: C.tealLight }); c.x = 14; c.y = 67; k.addChild(c); }
  const bs = new Button({ label: 'Save', w: 84, h: 38, fontSize: 14, variant: 'teal', disabled: slot === 'auto' || !hasGame, disabledReason: slot === 'auto' ? 'The autosave is managed for you.' : 'Start a voyage first.', onClick: () => { const ok = writeSlot(ui.game, slot); ui.toast(ok ? `Saved to ${slotName(slot)}.` : 'Could not save (storage blocked?).', ok ? 'good' : 'bad'); onSaved?.(); } });
  const bl = new Button({ label: 'Load', w: 84, h: 38, fontSize: 14, variant: 'brass', disabled: !info.exists || info.corrupt, disabledReason: 'Nothing to load here.', onClick: () => onLoad?.(slot) });
  bs.x = w - 188; bs.y = 8; bl.x = w - 96; bl.y = 8; k.addChild(bs, bl);
  k.w = w; k.h = h; return k;
}
