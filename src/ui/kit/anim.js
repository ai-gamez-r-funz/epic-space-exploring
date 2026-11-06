// Tiny tween + per-frame watcher engine driven by one ticker callback.
export const Eases = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * 2.094) + 1),
};
const tweens = new Set();
const watchers = new Set();
export const Anim = {
  time: 0,
  /** Called by app with seconds. */
  step(dt) {
    dt = Math.min(dt, 0.1);
    Anim.time += dt;
    for (const tw of [...tweens]) {
      if (tw.obj.destroyed) { tweens.delete(tw); tw.resolve(false); continue; }
      if (tw.delay > 0) { tw.delay -= dt * 1000; continue; }
      if (!tw.from) { tw.from = {}; for (const k in tw.props) tw.from[k] = tw.obj[k]; }
      tw.t += dt * 1000;
      const p = Math.min(1, tw.t / tw.ms);
      const e = tw.ease(p);
      for (const k in tw.props) tw.obj[k] = tw.from[k] + (tw.props[k] - tw.from[k]) * e;
      tw.onUpdate?.(p);
      if (p >= 1) { tweens.delete(tw); tw.onDone?.(); tw.resolve(true); }
    }
    for (const w of [...watchers]) {
      if (w.obj.destroyed) { watchers.delete(w); continue; }
      try { w.fn(dt, Anim.time); } catch (err) { Anim.onError?.(err); watchers.delete(w); }
    }
  },
  /** Tween numeric props of obj. Returns a handle {promise, cancel()}. Auto-cancels if obj is destroyed. */
  to(obj, props, ms = 300, { ease = 'outCubic', delay = 0, onDone, onUpdate } = {}) {
    let resolve; const promise = new Promise((r) => (resolve = r));
    const tw = { obj, props, ms: Math.max(1, ms), t: 0, delay, ease: typeof ease === 'function' ? ease : Eases[ease] || Eases.linear, onDone, onUpdate, resolve, from: null };
    tweens.add(tw);
    return { promise, cancel() { tweens.delete(tw); resolve(false); } };
  },
  /** Run fn(dt, time) every frame while obj lives. Returns stop(). */
  watch(obj, fn) { const w = { obj, fn }; watchers.add(w); return () => watchers.delete(w); },
  wait(ms) { return new Promise((r) => setTimeout(r, ms)); },
  stats() { return { tweens: tweens.size, watchers: watchers.size }; },
};
