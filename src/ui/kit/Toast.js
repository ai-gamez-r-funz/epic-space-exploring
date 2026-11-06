import { Container, Graphics } from 'pixi.js';
import { C, W } from './theme.js';
import { Label } from './Label.js';
import { drawPanel } from './draw.js';
import { Anim } from './anim.js';
import { S } from '../services.js';

const TONES = { good: { c: C.good, icon: 'check' }, bad: { c: C.coral, icon: 'warning' }, info: { c: C.teal, icon: 'star' }, warn: { c: C.mustard, icon: 'warning' } };
/**
 * Toasts — stacked notifications, top-centre below the HUD.
 *   Toasts.push('Fuel low', { tone:'good'|'bad'|'info'|'warn', icon?, ms:3600 })     (static singleton; app.js calls Toasts.init(layer))
 */
let layer = null; const items = []; const queue = [];
/** Set by app.js: returns true while toasts should wait (modal open, scene transition, jump). */
let holdFn = () => false;
function relayout() {
  let y = 62;
  for (const t of items) { Anim.to(t, { y }, 220); y += t._h + 8; }
}
export const Toasts = {
  init(parent, hold) { layer = parent; if (hold) holdFn = hold; Anim.watch(parent, () => { if (queue.length && !holdFn()) { const q = queue.shift(); Toasts.push(q.text, q.o); } }); },
  push(text, { tone = 'info', icon, ms = 3800 } = {}) {
    if (!layer) return;
    if (holdFn()) { if (!queue.find((q) => q.text === text) && queue.length < 4) queue.push({ text, o: { tone, icon, ms } }); return; }
    if (items.find((t) => t._text === text)) { const e = items.find((t) => t._text === text); e._life = ms / 1000; return; }
    const tn = TONES[tone] || TONES.info; const w = 320;
    const c = new Container(); c._text = text; c._life = ms / 1000;
    const l = new Label({ text, preset: 'small', size: 15, w: w - 62, color: C.cream });
    const h = Math.max(42, l.textHeight + 20); c._h = h;
    const g = new Graphics(); drawPanel(g, w, h, { radius: 12, tone: 'deep', trim: 2 });
    g.roundRect(4, 4, 5, h - 8, 2.5).fill({ color: tn.c });
    const ic = S.gfx.icon(icon || tn.icon, { size: 22, color: tn.c }); const b = ic.getLocalBounds();
    ic.x = 32 - (b.x + b.width / 2); ic.y = h / 2 - (b.y + b.height / 2);
    l.x = 52; l.y = (h - l.textHeight) / 2;
    c.addChild(g, ic, l);
    c.x = (W - w) / 2; c.alpha = 0; c.y = 60 + items.reduce((a, t) => a + t._h + 8, 0);
    c.eventMode = 'static'; c.cursor = 'pointer'; c.on('pointertap', () => c._life = 0);
    layer.addChild(c); items.push(c);
    Anim.to(c, { alpha: 1 }, 260);
    Anim.watch(c, (dt) => { c._life -= dt; if (c._life <= 0 && !c._dying) Toasts._kill(c); });
    while (items.length > 3) Toasts._kill(items[0]);
    relayout();
  },
  _kill(c) {
    c._dying = true; const i = items.indexOf(c); if (i >= 0) items.splice(i, 1); relayout();
    Anim.to(c, { alpha: 0, y: c.y - 14 }, 260, { ease: 'inCubic', onDone: () => c.destroy({ children: true }) });
  },
  clear() { [...items].forEach((c) => Toasts._kill(c)); },
};
