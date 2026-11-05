// Retro-futurist, warm, never-harsh sound effects. Pure synthesis.
import { tone, noise, bell, track, mtof } from './synth.js';

const R = () => Math.random();
const seq = (c, notes, o) => notes.forEach((f, i) => tone(c, { ...o, f: f * c.p, t: c.t + i * o.step, f2: o.slide ? f * c.p * o.slide : undefined }));

export const SFX = {
  click: { gap: 35, fn(c) {
    noise(c, { dur: 0.025, a: 0.002, peak: 0.12, f: 2600 * c.p, q: 1.2 });
    tone(c, { type: 'triangle', f: 1500 * c.p, f2: 800 * c.p, dur: 0.04, peak: 0.1, lp: 3000 });
  } },
  hover: { gap: 60, wet: 0.1, fn(c) {
    tone(c, { f: 920 * c.p, dur: 0.05, a: 0.008, peak: 0.05 });
  } },
  confirm: { fn(c) {
    seq(c, [587, 880], { type: 'triangle', dur: 0.14, step: 0.075, peak: 0.13, lp: 3200 });
    tone(c, { f: 880 * c.p, t: c.t + 0.075, dur: 0.3, peak: 0.05, wet: 0.5 });
  } },
  deny: { fn(c) {
    seq(c, [392, 311], { type: 'triangle', dur: 0.16, step: 0.1, peak: 0.13, lp: 1400, slide: 0.96 });
  } },
  jump: { wet: 0.3, fn(c) {
    const T = 2.2;
    noise(c, { dur: T, a: 0.5, r: 1.2, peak: 0.2, f: 220 * c.p, f2: 3200 * c.p, gl: T * 0.6, q: 1.4, wet: 0.3 });
    noise(c, { t: c.t + 0.6, dur: 1.4, a: 0.3, r: 0.8, peak: 0.1, f: 3000 * c.p, f2: 500 * c.p, q: 1, ftype: 'bandpass' });
    tone(c, { type: 'sine', f: 80 * c.p, f2: 420 * c.p, dur: T * 0.8, gl: T * 0.55, a: 0.5, r: 0.8, peak: 0.2, wet: 0.2 });
    tone(c, { type: 'triangle', f: 160 * c.p, f2: 840 * c.p, dur: T * 0.8, gl: T * 0.55, a: 0.6, r: 0.8, peak: 0.06, lp: 2400 });
  } },
  arrive: { wet: 0.4, fn(c) {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(c, { f: f * c.p, t: c.t + i * 0.16, dur: 1.4, peak: 0.12, wet: 0.7 }));
    tone(c, { type: 'sine', f: 130 * c.p, f2: 65 * c.p, dur: 1.2, a: 0.1, r: 0.6, peak: 0.1 });
  } },
  scan: { fn(c) {
    tone(c, { f: 380 * c.p, f2: 1500 * c.p, dur: 0.9, a: 0.1, r: 0.3, peak: 0.07, lp: 3000, vib: { rate: 9, depth: 40, delay: 0.05 } });
    [900, 1200, 1500].forEach((f, i) => tone(c, { f: f * c.p, t: c.t + 0.95 + i * 0.08, dur: 0.12, peak: 0.07, wet: 0.3 }));
  } },
  ping: { wet: 0.45, fn(c) { bell(c, { f: 1175 * c.p, dur: 1.1, peak: 0.12, wet: 0.7, echo: 0.2 }); } },
  coin: { wet: 0.3, fn(c) {
    bell(c, { f: 1568 * c.p, dur: 0.35, peak: 0.09, wet: 0.4 });
    bell(c, { f: 2093 * c.p, t: c.t + 0.07, dur: 0.6, peak: 0.09, wet: 0.5 });
    noise(c, { dur: 0.04, peak: 0.03, f: 6000, q: 2 });
  } },
  powerup: { fn(c) {
    tone(c, { type: 'triangle', f: 220 * c.p, f2: 880 * c.p, dur: 0.55, a: 0.04, r: 0.2, peak: 0.1, lp: 3000 });
    seq(c, [440, 554, 659, 880], { dur: 0.25, step: 0.1, peak: 0.07, wet: 0.4 });
  } },
  alert: { fn(c) {
    for (let i = 0; i < 3; i++) {
      tone(c, { f: 523 * c.p, t: c.t + i * 0.34, dur: 0.18, a: 0.02, r: 0.08, peak: 0.12, lp: 2200, wet: 0.2 });
      tone(c, { f: 392 * c.p, t: c.t + i * 0.34 + 0.17, dur: 0.18, a: 0.02, r: 0.08, peak: 0.12, lp: 2200, wet: 0.2 });
    }
  } },
  hail: { fn(c) {
    noise(c, { dur: 1.0, a: 0.05, r: 0.3, peak: 0.025, f: 3200, q: 0.8 });
    [740, 988, 740, 1175].forEach((f, i) => tone(c, { f: f * c.p, t: c.t + 0.05 + i * 0.2, dur: 0.17, a: 0.015, r: 0.07, peak: 0.1, lp: 3200, vib: { rate: 12, depth: 25, delay: 0.02 }, wet: 0.2 }));
  } },
  dock: { fn(c) {
    noise(c, { dur: 0.55, a: 0.08, r: 0.3, peak: 0.1, ftype: 'lowpass', f: 2200, f2: 500, q: 0.5 });
    tone(c, { f: 95 * c.p, f2: 55 * c.p, t: c.t + 0.5, dur: 0.35, peak: 0.28 });
    noise(c, { t: c.t + 0.5, dur: 0.05, peak: 0.1, f: 1800, q: 1 });
    tone(c, { f: 660 * c.p, t: c.t + 0.75, dur: 0.4, peak: 0.07, wet: 0.5 });
  } },
  undock: { fn(c) {
    noise(c, { dur: 0.1, peak: 0.1, f: 1800, q: 1 });
    tone(c, { f: 70 * c.p, f2: 100 * c.p, t: c.t + 0.05, dur: 0.3, peak: 0.25 });
    noise(c, { t: c.t + 0.3, dur: 0.7, a: 0.1, r: 0.4, peak: 0.1, ftype: 'lowpass', f: 400, f2: 2400, q: 0.5 });
    tone(c, { f: 440 * c.p, f2: 660 * c.p, t: c.t + 0.45, dur: 0.4, peak: 0.06, lp: 2500, wet: 0.4 });
  } },
  repair: { fn(c) {
    let t = c.t;
    for (let i = 0; i < 9; i++) {
      const f = (420 + R() * 500 + i * 30) * c.p;
      tone(c, { type: 'triangle', f, f2: f * (0.9 + R() * 0.3), t, dur: 0.07, a: 0.01, peak: 0.08, lp: 2500 });
      if (i % 3 === 2) noise(c, { t, dur: 0.03, peak: 0.07, f: 2200, q: 1.5 });
      t += 0.07 + R() * 0.06;
    }
    bell(c, { f: 1319 * c.p, t: t + 0.05, dur: 0.6, peak: 0.08, wet: 0.5 });
  } },
  discovery: { wet: 0.5, fn(c) {
    const scale = [523.25, 587.33, 659.25, 739.99, 783.99, 880, 987.77, 1046.5]; // C lydian
    [0, 2, 4, 5, 7, 4, 7].forEach((d, i) => bell(c, { f: scale[d] * c.p, t: c.t + i * 0.2, dur: 1.8, peak: 0.1, wet: 0.8, echo: 0.2, kind: 'vibes' }));
    [261.63, 329.63, 392].forEach((f) => tone(c, { type: 'triangle', f: f * c.p, dur: 2.4, a: 0.5, r: 1.2, peak: 0.04, lp: 1600, wet: 0.5 }));
  } },
  fanfare: { wet: 0.4, fn(c) {
    const chord = (t, fs, d, p) => fs.forEach((f) => {
      tone(c, { type: 'sawtooth', f: f * c.p, t, dur: d, a: 0.06, r: d * 0.5, peak: p * 0.35, lp: 1500, detune: -6, wet: 0.3 });
      tone(c, { type: 'sawtooth', f: f * c.p, t, dur: d, a: 0.06, r: d * 0.5, peak: p * 0.35, lp: 1500, detune: 6, wet: 0.3 });
    });
    chord(c.t, [261.63, 329.63, 392], 0.5, 0.1);
    chord(c.t + 0.42, [293.66, 370, 440], 0.5, 0.1);
    chord(c.t + 0.84, [329.63, 392, 493.88, 659.25], 1.6, 0.11);
    bell(c, { f: 1318.5 * c.p, t: c.t + 0.9, dur: 1.6, peak: 0.08, wet: 0.7 });
  } },
  success: { wet: 0.35, fn(c) {
    bell(c, { f: 783.99 * c.p, dur: 0.6, peak: 0.12, wet: 0.5 });
    bell(c, { f: 1046.5 * c.p, t: c.t + 0.14, dur: 1.1, peak: 0.12, wet: 0.7 });
    bell(c, { f: 1318.5 * c.p, t: c.t + 0.28, dur: 1.3, peak: 0.08, wet: 0.7 });
  } },
  fail: { fn(c) {
    tone(c, { type: 'triangle', f: 330 * c.p, f2: 196 * c.p, dur: 0.7, a: 0.03, r: 0.3, peak: 0.14, lp: 1200, vib: { rate: 5, depth: 30, delay: 0.1 } });
    tone(c, { type: 'sine', f: 247 * c.p, f2: 147 * c.p, t: c.t + 0.1, dur: 0.7, a: 0.03, r: 0.3, peak: 0.08, wet: 0.3 });
  } },
  door: { fn(c) {
    noise(c, { dur: 0.35, a: 0.03, r: 0.2, peak: 0.12, f: 700 * c.p, f2: 2400 * c.p, q: 0.8 });
    tone(c, { f: 150 * c.p, f2: 100 * c.p, t: c.t + 0.1, dur: 0.2, peak: 0.1 });
    noise(c, { t: c.t + 0.38, dur: 0.07, peak: 0.1, f: 900, q: 1 });
    tone(c, { f: 80 * c.p, t: c.t + 0.4, dur: 0.18, peak: 0.16 });
  } },
  page: { gap: 70, wet: 0.1, fn(c) {
    noise(c, { dur: 0.09, a: 0.01, peak: 0.07, ftype: 'highpass', f: 3500 * c.p, f2: 6000, q: 0.5 });
    noise(c, { t: c.t + 0.08, dur: 0.07, a: 0.01, peak: 0.05, ftype: 'highpass', f: 5000, q: 0.5 });
  } },
  thud: { wet: 0.15, fn(c) {
    tone(c, { f: 130 * c.p, f2: 48 * c.p, dur: 0.35, a: 0.004, peak: 0.34 });
    noise(c, { dur: 0.1, a: 0.003, peak: 0.1, ftype: 'lowpass', f: 400, q: 0.5 });
  } },
  hum: { gap: 400, wet: 0.1, fn(c) {
    const D = 2.6;
    tone(c, { f: 55 * c.p, dur: D, a: 0.6, r: 1.0, peak: 0.2, vib: { rate: 0.6, depth: 8, delay: 0.1 } });
    tone(c, { type: 'triangle', f: 110.4 * c.p, dur: D, a: 0.7, r: 1.0, peak: 0.09, lp: 500 });
    tone(c, { type: 'sine', f: 165 * c.p, dur: D, a: 0.8, r: 1.0, peak: 0.03 });
    noise(c, { dur: D, a: 0.7, r: 1.0, peak: 0.02, ftype: 'lowpass', f: 300, q: 0.4 });
  } },
};

export const SFX_NAMES = Object.keys(SFX);

/** Schedule one sfx at time t on graph g. Returns end time or -1 for unknown names. */
export function playSfx(ctx, g, name, opts = {}, t = ctx.currentTime + 0.005) {
  const def = SFX[name];
  if (!def) return -1;
  const vol = Math.min(2, Math.max(0, Number.isFinite(opts.vol) ? opts.vol : 1));
  const pitch = (Number.isFinite(opts.pitch) && opts.pitch > 0 ? opts.pitch : 1) * (1 + (R() - 0.5) * 0.06);
  const bus = ctx.createGain(); bus.gain.value = vol; bus.connect(g.sfxBus);
  const send = ctx.createGain(); send.gain.value = def.wet ?? 0.18; bus.connect(send); send.connect(g.reverbIn);
  const c = { ctx, bus, t, p: pitch, end: t, wetIn: g.reverbIn, echoIn: g.echoIn };
  def.fn(c);
  const k = ctx.createConstantSource(); k.offset.value = 0; k.connect(bus);
  const stopAt = c.end + 0.1; k.start(t); k.stop(stopAt);
  track(k, stopAt, [bus, send]);
  return stopAt;
}
