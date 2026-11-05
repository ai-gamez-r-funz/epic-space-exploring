// Player preferences (text speed, shake, animations, large UI, tutorial hints). Persisted in localStorage 'halcyon.prefs'.
// Installs two global, non-invasive patches the first time `installPrefs()` runs (called by app.js):
//   - Typewriter pacing follows Prefs.textSpeed (slow/normal/fast/instant)
//   - Anim.to durations collapse when Prefs.anim is false (reduced motion)
// Other UI code may read `Prefs.shake` / `Prefs.anim` (also on window.__halcyonPrefs).
import { Typewriter } from '../../kit/Typewriter.js';
import { Anim } from '../../kit/anim.js';
import { Display } from '../../kit/theme.js';

const KEY = 'halcyon.prefs';
const TUT_KEY = 'halcyon.tutorial';
const reduced = () => { try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

export const TEXT_SPEEDS = { slow: 0.6, normal: 1, fast: 2.2, instant: 0 };

function load() {
  let o = {};
  try { o = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { /* storage blocked */ }
  return {
    textSpeed: TEXT_SPEEDS[o.textSpeed] !== undefined ? o.textSpeed : 'normal',
    shake: o.shake ?? !reduced(),
    anim: o.anim ?? !reduced(),
    largeUI: !!o.largeUI,
  };
}

export const Prefs = {
  ...load(),
  listeners: new Set(),
  save() { try { localStorage.setItem(KEY, JSON.stringify({ textSpeed: this.textSpeed, shake: this.shake, anim: this.anim, largeUI: this.largeUI })); } catch (e) { /* ignore */ } },
  set(k, v) { this[k] = v; this.save(); Display.largeUI = this.largeUI; for (const f of [...this.listeners]) { try { f(k, v); } catch (e) { console.warn(e); } } },
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  get speedMul() { return TEXT_SPEEDS[this.textSpeed] ?? 1; },
};

/** Tutorial hint state, key 'halcyon.tutorial': { enabled, step, done } */
export const Tutorial = {
  state: (() => { try { const o = JSON.parse(localStorage.getItem(TUT_KEY) || 'null'); if (o) return { enabled: o.enabled !== false, step: o.step | 0, done: !!o.done }; } catch (e) { /* */ } return { enabled: true, step: 0, done: false }; })(),
  listeners: new Set(),
  save() { try { localStorage.setItem(TUT_KEY, JSON.stringify(this.state)); } catch (e) { /* */ } for (const f of [...this.listeners]) { try { f(); } catch (e) { /* */ } } },
  get enabled() { return this.state.enabled && !this.state.done; },
  setEnabled(on) { this.state.enabled = !!on; if (on) { this.state.done = false; } this.save(); },
  reset() { this.state = { enabled: true, step: 0, done: false }; this.save(); },
  advance(n = 1) { this.state.step += n; this.save(); },
  finish() { this.state.done = true; this.save(); },
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
};

let installed = false;
export function installPrefs() {
  if (installed) return; installed = true;
  Display.largeUI = Prefs.largeUI;
  const tick = Typewriter.prototype._tick;
  Typewriter.prototype._tick = function patched(dt) {
    const m = Prefs.speedMul;
    if (m === 0) { if (!this.done) this.skip(); return; }
    return tick.call(this, dt * m);
  };
  const to = Anim.to;
  Anim.to = function patchedTo(obj, props, ms, o) {
    if (Prefs.anim) return to.call(Anim, obj, props, ms, o);
    return to.call(Anim, obj, props, Math.min(ms ?? 300, 40), { ...(o || {}), delay: 0 });
  };
  if (typeof window !== 'undefined') window.__halcyonPrefs = Prefs;
}
