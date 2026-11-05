// Low-level WebAudio synthesis helpers shared by sfx + music. No audio files, ever.
// Every started source is tracked so we can prove nothing leaks.

export const stats = {
  started: 0,
  ended: 0,
  registry: new Set(),
  get live() { return this.registry.size; },
  /** offline/simulated runs never fire onended; drop entries whose stop time has passed */
  prune(now) {
    for (const e of this.registry) if (e.stopAt < now) { this.registry.delete(e); this.ended++; }
  },
};

export function track(src, stopAt, cleanup = []) {
  const e = { stopAt };
  stats.registry.add(e);
  stats.started++;
  src.onended = () => {
    if (!stats.registry.delete(e)) return;
    stats.ended++;
    for (const n of cleanup) { try { n.disconnect(); } catch (_) { /* noop */ } }
    try { src.disconnect(); } catch (_) { /* noop */ }
  };
}

export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const finite = (x, d = 0) => (Number.isFinite(x) ? x : d);

export function mulberry32(a) {
  let s = a >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const noiseCache = new WeakMap();
function noiseBuffer(ctx) {
  let b = noiseCache.get(ctx);
  if (!b) {
    const len = Math.floor(ctx.sampleRate * 2);
    b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { // slightly softened white noise
      const w = Math.random() * 2 - 1;
      last = last * 0.35 + w * 0.65;
      d[i] = last;
    }
    noiseCache.set(ctx, b);
  }
  return b;
}

/** gain envelope: perc (attack then exp decay to dur) or swell (attack, hold, release r). */
function envelope(param, t, a, peak, dur, r) {
  const floor = 0.0001;
  a = clamp(a, 0.002, dur * 0.6);
  peak = Math.max(finite(peak, 0.1), floor * 2);
  param.setValueAtTime(floor, t);
  param.exponentialRampToValueAtTime(peak, t + a);
  if (r) {
    const rt = Math.min(r, dur - a);
    param.setValueAtTime(peak, t + dur - rt);
    param.exponentialRampToValueAtTime(floor, t + dur);
  } else {
    param.exponentialRampToValueAtTime(floor, t + dur);
  }
}

/**
 * c = { ctx, bus, t, end, wetIn?, echoIn? }  (voices write to c.bus and bump c.end)
 * o = { type,f,f2,gl,t,dur,a,peak,r,detune,lp,q,vib:{rate,depth,delay},wet,echo,dest,cleanup }
 */
export function tone(c, o) {
  const ctx = c.ctx;
  const t = o.t ?? c.t;
  const dur = Math.max(0.03, o.dur);
  const f = clamp(finite(o.f, 440), 10, 18000);
  const f2 = clamp(finite(o.f2 ?? f, f), 10, 18000);
  const osc = ctx.createOscillator();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(f, t);
  if (f2 !== f) osc.frequency.exponentialRampToValueAtTime(f2, t + (o.gl ?? dur));
  if (o.detune) osc.detune.value = o.detune;
  const g = ctx.createGain();
  envelope(g.gain, t, o.a ?? 0.005, o.peak ?? 0.2, dur, o.r);
  const cleanup = [g];
  if (o.lp) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = o.lp;
    lp.Q.value = o.q ?? 0.5;
    osc.connect(lp); lp.connect(g); cleanup.push(lp);
  } else osc.connect(g);
  g.connect(o.dest || c.bus);
  if (o.wet && c.wetIn) { const w = ctx.createGain(); w.gain.value = o.wet; g.connect(w); w.connect(c.wetIn); cleanup.push(w); }
  if (o.echo && c.echoIn) { const w = ctx.createGain(); w.gain.value = o.echo; g.connect(w); w.connect(c.echoIn); cleanup.push(w); }
  const stopAt = t + dur + 0.05;
  if (o.vib) {
    const l = ctx.createOscillator();
    l.frequency.value = o.vib.rate;
    const lg = ctx.createGain();
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(o.vib.depth, t + (o.vib.delay ?? 0.2));
    l.connect(lg); lg.connect(osc.detune);
    l.start(t); l.stop(stopAt);
    track(l, stopAt, [lg]);
  }
  osc.start(t); osc.stop(stopAt);
  track(osc, stopAt, cleanup.concat(o.cleanup || []));
  c.end = Math.max(c.end, stopAt);
  return g;
}

/** filtered noise burst. o = { t,dur,a,peak,r,ftype,f,f2,q,wet,dest } */
export function noise(c, o) {
  const ctx = c.ctx;
  const t = o.t ?? c.t;
  const dur = Math.max(0.03, o.dur);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const flt = ctx.createBiquadFilter();
  flt.type = o.ftype || 'bandpass';
  const f = clamp(finite(o.f, 1000), 20, 18000);
  const f2 = clamp(finite(o.f2 ?? f, f), 20, 18000);
  flt.frequency.setValueAtTime(f, t);
  if (f2 !== f) flt.frequency.exponentialRampToValueAtTime(f2, t + (o.gl ?? dur));
  flt.Q.value = o.q ?? 0.7;
  const g = ctx.createGain();
  envelope(g.gain, t, o.a ?? 0.005, o.peak ?? 0.1, dur, o.r);
  src.connect(flt); flt.connect(g); g.connect(o.dest || c.bus);
  const cleanup = [flt, g];
  if (o.wet && c.wetIn) { const w = ctx.createGain(); w.gain.value = o.wet; g.connect(w); w.connect(c.wetIn); cleanup.push(w); }
  const stopAt = t + dur + 0.05;
  src.start(t, Math.random() * 1.5); src.stop(stopAt);
  track(src, stopAt, cleanup);
  c.end = Math.max(c.end, stopAt);
  return g;
}

/** soft bell / vibraphone-ish additive voice */
export function bell(c, { f, t, dur = 1.2, peak = 0.12, wet = 0.5, echo = 0, bright = 1, kind = 'bell' }) {
  const partials = kind === 'marimba'
    ? [[1, 1, 1], [3.95, 0.28 * bright, 0.18], [9.9, 0.06 * bright, 0.05]]
    : kind === 'vibes'
      ? [[1, 1, 1], [3.98, 0.22 * bright, 0.22], [10.1, 0.05 * bright, 0.06]]
      : [[1, 1, 1], [2.76, 0.32 * bright, 0.4], [5.4, 0.1 * bright, 0.2]];
  for (const [ratio, amp, dd] of partials) {
    if (f * ratio > 12000) continue;
    tone(c, { f: f * ratio, t, dur: Math.max(0.08, dur * dd), a: 0.003, peak: peak * amp, wet: ratio === 1 ? wet : wet * 0.5, echo: ratio === 1 ? echo : 0 });
  }
}
