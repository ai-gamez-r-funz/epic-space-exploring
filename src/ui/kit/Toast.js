import { Container, Graphics } from 'pixi.js';
import { C, W } from './theme.js';
import { Label } from './Label.js';
import { drawPanel } from './draw.js';
import { Anim } from './anim.js';
import { S } from '../services.js';

const TONES = { good: { c: C.good, icon: 'check' }, bad: { c: C.coral, icon: 'warning' }, info: { c: C.teal, icon: 'star' }, warn: { c: C.mustard, icon: 'warning' } };
/**
 * Toasts — stacked notifications, top-right below the HUD.
 *   Toasts.push('Fuel low', { tone:'good'|'bad'|'info'|'warn', icon?, ms:3600 })     (static singleton; app.js calls Toasts.init(layer))
 */
let layer = null; const items = [];
function relayout() {
  let y = 66;
  for (const t of items) { Anim.to(t, { y }, 220); y += t._h + 8; }
}
export const Toasts = {
  init(parent) { layer = parent; },
  push(text, { tone = 'info', icon, ms = 3800 } = {}) {
    if (!layer) return;
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
    c.x = W + 20; c.y = 66 + items.reduce((a, t) => a + t._h + 8, 0);
    c.eventMode = 'static'; c.cursor = 'pointer'; c.on('pointertap', () => c._life = 0);
    layer.addChild(c); items.push(c);
    Anim.to(c, { x: W - w - 14 }, 320, { ease: 'outBack' });
    Anim.watch(c, (dt) => { c._life -= dt; if (c._life <= 0 && !c._dying) Toasts._kill(c); });
    while (items.length > 5) Toasts._kill(items[0]);
    relayout();
  },
  _kill(c) {
    c._dying = true; const i = items.indexOf(c); if (i >= 0) items.splice(i, 1); relayout();
    Anim.to(c, { x: W + 20, alpha: 0 }, 260, { ease: 'inCubic', onDone: () => c.destroy({ children: true }) });
  },
  clear() { [...items].forEach((c) => Toasts._kill(c)); },
};
