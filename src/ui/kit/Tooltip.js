import { Container, Graphics, Text } from 'pixi.js';
import { C, textStyle, W, H, F, hex } from './theme.js';
import { drawPanel } from './draw.js';
import { Anim } from './anim.js';

/**
 * Tooltip — one global tooltip that follows the pointer.
 *   Tooltip.attach(displayObject, content) -> detach()
 *   content: string | { title?, body?, rows?:[[label,value,tone?]], footer?, tone?:'info'|'good'|'bad'|'warn' } | () => same
 * Strings: first line (if body follows after '\n') is treated as the title. Tooltips need displayObject.eventMode = 'static'
 * (attach() sets it if needed). Touch: shows on long-press (450 ms) and hides on release.
 */
let layer = null, box = null, bg = null, texts = [], cur = null, timer = 0, px = 0, py = 0, stopWatch = null;
const TONE = { info: C.cream, good: C.good, bad: C.bad, warn: C.mustard, dim: C.textDim };

function normalise(c) {
  if (typeof c === 'function') c = c();
  if (c == null || c === '') return null;
  if (typeof c === 'string') {
    const i = c.indexOf('\n');
    return i > 0 ? { title: c.slice(0, i), body: c.slice(i + 1) } : { body: c };
  }
  return c;
}
function build(c) {
  for (const t of texts) { t.destroy(); }
  texts = [];
  const maxW = 300; let y = 10; let w = 0;
  const add = (str, preset, over = {}, x = 12, wrap = true) => {
    const t = new Text({ text: str, style: textStyle(preset, { ...over, ...(wrap ? { wordWrap: true, wordWrapWidth: maxW, breakWords: true } : {}) }) });
    t.x = x; t.y = y; box.addChild(t); texts.push(t); return t;
  };
  if (c.title) { const t = add(c.title, 'headSm', { fill: TONE[c.tone] || C.brassLight, fontSize: 11 }); y += t.height + 6; w = Math.max(w, t.width); }
  if (c.body) { const t = add(c.body, 'small', { fill: C.cream }); y += t.height + 4; w = Math.max(w, t.width); }
  if (c.rows) for (const r of c.rows) {
    const a = add(String(r[0]), 'small', { fill: C.textDim }, 12, false);
    const b = add(String(r[1]), 'small', { fill: TONE[r[2]] || C.cream, fontWeight: '700' }, 12, false);
    b.x = 12 + Math.max(a.width + 18, 110); y += 20; w = Math.max(w, b.x - 12 + b.width);
  }
  if (c.footer) { y += 3; const t = add(c.footer, 'tiny', { fill: C.textDim }); y += t.height; w = Math.max(w, t.width); }
  const bw = Math.ceil(w) + 24, bh = Math.ceil(y) + 10;
  drawPanel(bg, bw, bh, { radius: 10, tone: 'deep', trim: 2, shadow: true });
  box._w = bw; box._h = bh;
}
function place() {
  if (!box) return;
  let x = px + 16, y = py + 22;
  if (x + box._w > W - 6) x = px - box._w - 12;
  if (y + box._h > H - 6) y = py - box._h - 12;
  box.x = Math.max(6, x); box.y = Math.max(6, y);
}
function showNow() {
  const c = normalise(cur?.content);
  if (!c) return hide();
  build(c); place(); box.visible = true; box.alpha = 0;
  Anim.to(box, { alpha: 1 }, 120, { ease: 'linear' });
}
function hide() { clearTimeout(timer); cur = null; if (box) { box.visible = false; } }

export const Tooltip = {
  /** Called by app.js once with a top-most layer container. */
  init(parent) {
    layer = parent; box = new Container(); bg = new Graphics(); box.addChild(bg); box.visible = false; box.eventMode = 'none';
    layer.addChild(box);
    stopWatch = Anim.watch(box, () => { if (cur && box.visible) { const c = cur.target; if (!c || c.destroyed || !isShown(c)) hide(); } });
  },
  attach(target, content, { delay = 280 } = {}) {
    target.eventMode = target.eventMode === 'none' || !target.eventMode || target.eventMode === 'auto' ? 'static' : target.eventMode;
    const entry = { target, content };
    let pressTimer = 0;
    const over = (e) => {
      px = e.global.x; py = e.global.y; cur = entry; clearTimeout(timer);
      if (e.pointerType === 'touch') return;
      timer = setTimeout(showNow, delay);
    };
    const move = (e) => { px = e.global.x; py = e.global.y; if (cur === entry) place(); };
    const out = () => { if (cur === entry) hide(); clearTimeout(pressTimer); };
    const down = (e) => { if (e.pointerType === 'touch') { px = e.global.x; py = e.global.y; cur = entry; clearTimeout(pressTimer); pressTimer = setTimeout(showNow, 450); } else if (cur === entry) hide(); };
    const up = () => { clearTimeout(pressTimer); if (cur === entry) setTimeout(hide, 900); };
    target.on('pointerover', over).on('pointermove', move).on('pointerout', out).on('pointerdown', down).on('pointerup', up).on('pointerupoutside', up);
    entry.set = (c) => { entry.content = c; if (cur === entry && box.visible) showNow(); };
    target.__tip = entry;
    return () => { if (!target.destroyed) { target.off('pointerover', over).off('pointermove', move).off('pointerout', out).off('pointerdown', down).off('pointerup', up).off('pointerupoutside', up); } if (cur === entry) hide(); delete target.__tip; };
  },
  /** Change the content of an already attached tooltip. */
  set(target, content) { if (target.__tip) target.__tip.set(content); else Tooltip.attach(target, content); },
  hide,
};
function isShown(o) { for (; o; o = o.parent) if (o.visible === false) return false; return true; }
