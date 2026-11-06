// Global input router: keyboard hotkeys scoped to the top "layer" (scene or modal), focus cycling, click guard.
import { Display } from './theme.js';

const layers = [];          // stack: { root:Container|null, onKey?(e,key):boolean, name }
const hotkeys = [];         // { keys:[], owner, fn, when }
const focusables = new Set();
let focused = null;
let keyboardMode = false;

function normKey(e) {
  let k = e.key;
  if (k === ' ') return 'Space';
  if (k.length === 1) return k.toLowerCase();
  return k;
}
function isIn(obj, root) {
  if (!root) return true;
  for (let o = obj; o; o = o.parent) { if (o === root) return true; }
  return false;
}
function visibleChain(obj) {
  for (let o = obj; o; o = o.parent) { if (o.visible === false || o.destroyed) return false; }
  return true;
}
const domTyping = () => {
  const a = typeof document !== 'undefined' ? document.activeElement : null;
  return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA');
};

export const Input = {
  /** performance.now() until which taps are ignored (set after a drag so a drag-release doesn't click). */
  clickGuard: 0,
  keyboardMode: false,
  get top() { return layers[layers.length - 1] || null; },
  init() {
    window.addEventListener('keydown', Input._onKey, true);
    window.addEventListener('pointerdown', () => { Input.clickGuard = 0; keyboardMode = false; Input.keyboardMode = false; if (focused) focused._setFocus?.(false); }, true);
  },
  /** Push a scope. Hotkeys owned by objects inside `root` are active only while this is the top layer. Returns pop(). */
  pushLayer(layer) {
    layers.push(layer);
    const prevFocus = focused; if (focused) { focused._setFocus?.(false); focused = null; }
    return () => {
      const i = layers.indexOf(layer); if (i >= 0) layers.splice(i, 1);
      if (focused) { focused._setFocus?.(false); focused = null; }
      if (prevFocus && !prevFocus.destroyed) focused = null;
    };
  },
  /** Register a hotkey: keys 'c' | 'Escape' | 'Enter' | 'Space' | '1'... or array. `owner` = container (scope + visibility). */
  bind(owner, keys, fn, when) {
    const h = { keys: [].concat(keys).map((k) => (k.length === 1 ? k.toLowerCase() : k)), owner, fn, when };
    hotkeys.push(h);
    return () => { const i = hotkeys.indexOf(h); if (i >= 0) hotkeys.splice(i, 1); };
  },
  /** Make a widget Tab-focusable. Widget needs `_setFocus(bool)` and `activate()`. */
  addFocusable(w) { focusables.add(w); return () => { focusables.delete(w); if (focused === w) focused = null; }; },
  _onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = normKey(e);
    if (domTyping()) return; // TextInput handles its own keys
    const top = Input.top;
    // Tab focus cycling
    if (key === 'Tab') {
      const list = [...focusables].filter((w) => !w.destroyed && visibleChain(w) && isIn(w, top?.root) && w.enabled !== false);
      if (list.length) {
        e.preventDefault();
        let i = list.indexOf(focused);
        i = e.shiftKey ? (i <= 0 ? list.length - 1 : i - 1) : (i + 1) % list.length;
        if (focused) focused._setFocus(false);
        focused = list[i]; keyboardMode = true; Input.keyboardMode = true; focused._setFocus(true);
      }
      return;
    }
    if ((key === 'Enter' || key === 'Space') && focused && !focused.destroyed && visibleChain(focused)) {
      e.preventDefault(); focused.activate?.(); return;
    }
    if (top?.onKey && top.onKey(e, key) === true) { e.preventDefault(); return; }
    for (let i = hotkeys.length - 1; i >= 0; i--) {
      const h = hotkeys[i];
      if (!h.keys.includes(key)) continue;
      if (h.owner.destroyed) { hotkeys.splice(i, 1); continue; }
      if (!isIn(h.owner, top?.root) || !visibleChain(h.owner)) continue;
      if (h.when && !h.when()) continue;
      e.preventDefault(); h.fn(e); return;
    }
  },
  /**
   * Track a pointer drag using window listeners (immune to pointer leaving the Pixi object).
   * Deltas are in LOGICAL stage px. onMove(dx, dy, totalDx, totalDy), onEnd(moved:boolean).
   */
  drag(startEvent, onMove, onEnd, threshold = 5) {
    let lx = startEvent.clientX, ly = startEvent.clientY; const sx = lx, sy = ly; let moved = false;
    const id = startEvent.pointerId;
    const mv = (ev) => {
      if (ev.pointerId !== id) return;
      const tdx = ev.clientX - sx, tdy = ev.clientY - sy;
      if (!moved && Math.hypot(tdx, tdy) < threshold) return;
      moved = true;
      const s = Display.scale || 1;
      onMove((ev.clientX - lx) / s, (ev.clientY - ly) / s, tdx / s, tdy / s, ev);
      lx = ev.clientX; ly = ev.clientY;
    };
    const up = (ev) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      if (moved) Input.clickGuard = performance.now() + 60;
      onEnd?.(moved);
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  },
  clickAllowed() { return performance.now() >= Input.clickGuard; },
  _setFocused(w) { focused = w; },
};
