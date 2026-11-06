// Generative, endless, calm music. Lookahead scheduler driven by tick(now); no timers of its own.
import { tone, noise, bell, mtof, mulberry32, clamp } from './synth.js';

export const MODES = {
  lydian: [0, 2, 4, 6, 7, 9, 11], ionian: [0, 2, 4, 5, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10],
};
const degNote = (root, mode, deg) => {
  const o = Math.floor(deg / 7); const i = ((deg % 7) + 7) % 7;
  return root + MODES[mode][i] + 12 * o;
};

// pad: level, plink: density 0..1, kind, bass: 0 off /1 halves /2 walking, shaker: level, brush: swishes,
// flute: chance per bar, swing: 0..0.3, sus: 0 none /1 sometimes /2 always, oct: melody degree offset
export const MOOD_CFG = {
  title:   { root: 62, mode: 'lydian',     bpm: 68, progs: [[0, 1, 0, 4], [0, 5, 1, 4], [0, 2, 5, 1]], pad: 1.0, plink: 0.30, kind: 'vibes',   bass: 1, shaker: 0,    brush: 0, flute: 0.40, swing: 0,    sus: 0, oct: 7, cut: 1000 },
  bridge:  { root: 65, mode: 'lydian',     bpm: 84, progs: [[0, 1, 4, 0], [0, 4, 5, 3], [0, 2, 1, 4]], pad: 0.8, plink: 0.42, kind: 'marimba', bass: 2, shaker: 0.6,  brush: 0, flute: 0.12, swing: 0.08, sus: 0, oct: 7, cut: 1100 },
  map:     { root: 57, mode: 'mixolydian', bpm: 64, progs: [[0, 3, 4, 3], [0, 6, 3, 4], [0, 1, 3, 0]], pad: 1.0, plink: 0.22, kind: 'vibes',   bass: 1, shaker: 0,    brush: 0, flute: 0.30, swing: 0,    sus: 1, oct: 7, cut: 900 },
  system:  { root: 63, mode: 'lydian',     bpm: 76, progs: [[0, 1, 0, 5], [0, 4, 1, 3], [0, 5, 2, 4]], pad: 0.9, plink: 0.36, kind: 'marimba', bass: 1, shaker: 0.35, brush: 0, flute: 0.25, swing: 0.05, sus: 0, oct: 7, cut: 1050 },
  event:   { root: 55, mode: 'dorian',     bpm: 72, progs: [[0, 3, 0, 4], [0, 2, 3, 4], [0, 5, 3, 1]], pad: 0.9, plink: 0.30, kind: 'vibes',   bass: 1, shaker: 0.2,  brush: 0, flute: 0.25, swing: 0,    sus: 1, oct: 7, cut: 950 },
  wonder:  { root: 60, mode: 'lydian',     bpm: 54, progs: [[0, 1, 4, 5], [0, 2, 1, 0], [0, 5, 1, 2]], pad: 1.2, plink: 0.34, kind: 'bell',    bass: 0, shaker: 0,    brush: 0, flute: 0.65, swing: 0,    sus: 0, oct: 14, cut: 1300 },
  tense:   { root: 57, mode: 'aeolian',    bpm: 56, progs: [[0, 5, 0, 6], [0, 3, 5, 4], [0, 6, 5, 3]], pad: 0.9, plink: 0.14, kind: 'vibes',   bass: 1, shaker: 0,    brush: 0, flute: 0.15, swing: 0,    sus: 2, oct: 7, cut: 700 },
  station: { root: 58, mode: 'dorian',     bpm: 100, progs: [[1, 4, 0, 0], [1, 4, 0, 5], [0, 3, 1, 4]], pad: 0.55, plink: 0.40, kind: 'vibes',  bass: 2, shaker: 0,    brush: 0.8, flute: 0.0, swing: 0.28, sus: 0, oct: 7, cut: 1000, ext: true },
  ending:  { root: 64, mode: 'lydian',     bpm: 58, progs: [[0, 1, 0, 4], [0, 5, 3, 0], [0, 2, 1, 0]], pad: 1.1, plink: 0.28, kind: 'vibes',   bass: 1, shaker: 0,    brush: 0, flute: 0.55, swing: 0,    sus: 0, oct: 7, cut: 1200 },
};
export const MOODS = Object.keys(MOOD_CFG);

export const XFADE = 5;          // seconds
const LOOKAHEAD = 0.6;           // seconds scheduled ahead

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export class MusicEngine {
  constructor(ctx, graph, { seed } = {}) {
    this.ctx = ctx; this.g = graph;
    this.seed = (seed ?? ((Math.random() * 2 ** 32) >>> 0)) >>> 0;
    this.cur = null; this.mood = null; this.switches = 0;
    this.disposals = [];
    this.xfade = XFADE;
  }

  start(mood, now = this.ctx.currentTime) {
    const cfg = MOOD_CFG[mood];
    if (!cfg || (this.cur && this.mood === mood)) return false;
    const ctx = this.ctx;
    // fade out + schedule disposal of previous layer
    if (this.cur) {
      const old = this.cur;
      old.layer.gain.cancelScheduledValues(now);
      old.layer.gain.setTargetAtTime(0, now, this.xfade / 4.5);
      this.disposals.push({ t: now + this.xfade * 1.6 + 1, layer: old.layer });
    }
    const first = !this.cur;
    this.switches++;
    const rng = mulberry32(this.seed ^ hashStr(mood) ^ (this.switches * 2654435761));
    const trans = [-2, -1, 0, 0, 0, 1, 2][Math.floor(rng() * 7)]; // per-session key colour
    const bpm = cfg.bpm * (0.96 + rng() * 0.08);
    const layer = ctx.createGain();
    layer.gain.setValueAtTime(first ? 0.0001 : 0.0001, now);
    layer.gain.setTargetAtTime(1, now, (first ? this.xfade * 0.6 : this.xfade) / 4.5);
    layer.connect(this.g.musicBus);
    const r = {
      mood, cfg, rng, layer, root: cfg.root + trans, bpm,
      stepDur: 60 / bpm / 2, step: 0, bar: 0, nextT: now + 0.12,
      prog: cfg.progs[Math.floor(rng() * cfg.progs.length)], chord: null, nextChord: null,
      motif: this._makeMotif(rng, cfg), plan: new Array(8).fill(null), melDeg: 7,
      c: { ctx, bus: layer, t: 0, end: 0, wetIn: this.g.reverbIn, echoIn: this.g.echoIn },
    };
    this.cur = r; this.mood = mood;
    return true;
  }

  stop(now = this.ctx.currentTime) {
    if (!this.cur) return;
    const old = this.cur;
    old.layer.gain.cancelScheduledValues(now);
    old.layer.gain.setTargetAtTime(0, now, 0.4);
    this.disposals.push({ t: now + 4, layer: old.layer });
    this.cur = null; this.mood = null;
  }

  _makeMotif(rng, cfg) {
    const n = 3 + Math.floor(rng() * 3);
    const slots = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => rng() - 0.5).slice(0, n).sort((a, b) => a - b);
    let d = [0, 2, 4][Math.floor(rng() * 3)];
    return slots.map((s) => { d = clamp(d + [-2, -1, 1, 2, 1, -1, 2][Math.floor(rng() * 7)], -2, 7); return { s, d }; });
  }

  tick(now = this.ctx.currentTime) {
    // dispose faded layers
    if (this.disposals.length) {
      this.disposals = this.disposals.filter((d) => {
        if (now >= d.t) { try { d.layer.disconnect(); } catch (_) { /* noop */ } return false; }
        return true;
      });
    }
    const r = this.cur;
    if (!r) return;
    if (r.nextT < now - 0.25) r.nextT = now + 0.05; // after a stall: re-anchor, never burst-catch-up
    let guard = 0;
    while (r.nextT < now + LOOKAHEAD && guard++ < 32) {
      const swingOff = (r.step % 2 === 1) ? r.cfg.swing * r.stepDur : 0;
      this._runStep(r, r.nextT + swingOff);
      r.nextT += r.stepDur;
      r.step++;
      if (r.step >= 8) { r.step = 0; r.bar++; }
    }
  }

  _chordFor(r, bar) {
    const cfg = r.cfg; const prog = r.prog;
    const d = prog[bar % prog.length];
    const stack = [d, d + 2, d + 4, d + 6];
    if (cfg.ext && r.rng() < 0.5) stack.push(d + 8);
    else if (r.rng() < 0.25) stack.push(d + 8);
    const sus = cfg.sus === 2 || (cfg.sus === 1 && r.rng() < 0.4);
    if (sus) stack[1] = d + (r.rng() < 0.5 ? 3 : 1);
    let notes = stack.map((x) => degNote(r.root, cfg.mode, x));
    // voice into 50..78
    notes = notes.map((n, i) => { while (n > (i === 0 ? 62 : 78)) n -= 12; while (n < (i === 0 ? 48 : 52)) n += 12; return n; });
    return { d, notes, stack };
  }

  _runStep(r, t) {
    const cfg = r.cfg; const c = r.c; c.t = t;
    const beat = r.stepDur * 2;
    if (r.step === 0) {
      if (r.bar > 0 && r.bar % r.prog.length === 0 && r.rng() < 0.6) r.prog = cfg.progs[Math.floor(r.rng() * cfg.progs.length)];
      r.chord = this._chordFor(r, r.bar);
      r.nextRootDeg = r.prog[(r.bar + 1) % r.prog.length];
      this._pad(r, t, beat * 4);
      this._plan(r);
      if (cfg.flute > 0 && r.rng() < cfg.flute * (r.bar % 2 === 0 ? 1 : 0.4)) this._flute(r, t + r.rng() * beat, beat);
    }
    // melody
    const deg = r.plan[r.step];
    if (deg != null) this._plink(r, t, deg);
    // bass
    if (cfg.bass) this._bass(r, t, beat);
    // percussion
    if (cfg.shaker > 0 && (r.step % 2 === 1 || (r.step === 0 && r.rng() < 0.5)) && r.rng() < 0.9) {
      noise(c, { t, dur: 0.07, a: 0.012, peak: (r.step % 2 ? 0.05 : 0.025) * cfg.shaker, f: 6500, q: 0.9, ftype: 'bandpass' });
    }
    if (cfg.brush > 0) {
      // jazz brush: swish on 2 and 4, soft ride-ish skip pattern
      if (r.step % 2 === 0) noise(c, { t, dur: r.step % 4 === 2 ? 0.22 : 0.14, a: 0.03, r: 0.08, peak: 0.05 * cfg.brush, f: 4200, f2: 7000, q: 0.5, ftype: 'bandpass' });
      else if (r.rng() < 0.6) noise(c, { t, dur: 0.1, a: 0.012, peak: 0.03 * cfg.brush, f: 7000, q: 0.7, ftype: 'bandpass' });
    }
  }

  _pad(r, t, dur) {
    const { ctx } = this; const cfg = r.cfg; const c = r.c;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6;
    lp.frequency.setValueAtTime(cfg.cut * 0.6, t);
    lp.frequency.linearRampToValueAtTime(cfg.cut * (0.95 + r.rng() * 0.3), t + dur * 0.55);
    lp.frequency.linearRampToValueAtTime(cfg.cut * 0.65, t + dur * 1.15);
    lp.connect(r.layer);
    const w = ctx.createGain(); w.gain.value = 0.5; lp.connect(w); w.connect(this.g.reverbIn);
    const D = dur * 1.18; const per = 0.04 * cfg.pad / Math.sqrt(r.chord.notes.length / 3);
    r.chord.notes.forEach((m, i) => {
      const f = mtof(m);
      const o = { dur: D, a: dur * 0.35, r: dur * 0.5, peak: per, dest: lp, cleanup: [lp, w] };
      tone(c, { ...o, type: 'sawtooth', f, detune: -8 - r.rng() * 4 });
      tone(c, { ...o, type: 'sawtooth', f, detune: 8 + r.rng() * 4 });
      tone(c, { ...o, type: 'triangle', f: f / 2, peak: per * 0.9 });
    });
    // a slow, soft root drone under the pad for body
    if (r.cfg.pad > 0) tone(c, { type: 'sine', f: mtof(r.chord.notes[0] - 12), dur: D, a: dur * 0.3, r: dur * 0.5, peak: 0.05 * cfg.pad, dest: lp });
  }

  _plan(r) {
    const cfg = r.cfg; const rng = r.rng; const plan = new Array(8).fill(null);
    const rd = r.chord.d + cfg.oct;
    if (rng() < 0.42) { // motif, varied
      const shift = [0, 0, 0, 1, 2, -1, -2][Math.floor(rng() * 7)];
      const rev = rng() < 0.12;
      const m = r.motif;
      m.forEach((e, i) => { const src = rev ? m[m.length - 1 - i].d : e.d; if (rng() < 0.9) plan[e.s] = rd + src + shift; });
    } else {
      let cur = r.melDeg; const tones = [0, 2, 4, 6, 1];
      for (let s = 0; s < 8; s++) {
        const strong = s % 4 === 0 ? 1.4 : s % 2 === 0 ? 1 : 0.6;
        if (rng() < cfg.plink * 0.55 * strong) {
          if (rng() < 0.6) { // chord tone nearest to cur
            const base = r.chord.d; let best = null;
            for (let k = -7; k <= 21; k++) { const d = base + k; if (tones.slice(0, 4).includes(((d - base) % 7 + 7) % 7)) { if (best === null || Math.abs(d - cur) < Math.abs(best - cur) + rng() * 2) best = d; } }
            cur = best ?? cur;
          } else cur += [-2, -1, 1, 2][Math.floor(rng() * 4)];
          cur = clamp(cur, r.chord.d + cfg.oct - 4, r.chord.d + cfg.oct + 6);
          plan[s] = cur;
        }
      }
      r.melDeg = cur;
    }
    // thin out per density
    for (let s = 0; s < 8; s++) if (plan[s] != null && rng() > 0.35 + cfg.plink * 1.6) plan[s] = null;
    r.plan = plan;
  }

  _plink(r, t, deg) {
    const cfg = r.cfg;
    let m = degNote(r.root, cfg.mode, deg);
    while (m > 92) m -= 12; while (m < 58) m += 12;
    const vel = 0.7 + r.rng() * 0.5;
    const slow = cfg.kind === 'bell' ? 2.4 : cfg.kind === 'marimba' ? 0.7 : 1.6;
    bell(r.c, { f: mtof(m), t, dur: slow, peak: 0.075 * vel, wet: 0.55, echo: 0.28, kind: cfg.kind, bright: 0.8 + r.rng() * 0.4 });
  }

  _bass(r, t, beat) {
    const cfg = r.cfg; const rng = r.rng; const ch = r.chord;
    let deg = null; const s = r.step;
    if (cfg.bass === 1) {
      if (s === 0) deg = ch.d;
      else if (s === 4 && rng() < 0.7) deg = ch.d + (rng() < 0.6 ? 4 : 2);
      else if (s === 6 && rng() < 0.2) deg = ch.d + 4;
    } else if (s % 2 === 0) {
      const b = s / 2;
      if (b === 0) deg = ch.d;
      else if (b === 1) deg = ch.d + (rng() < 0.5 ? 2 : 4);
      else if (b === 2) deg = ch.d + (rng() < 0.5 ? 4 : 7);
      else deg = r.nextRootDeg + (rng() < 0.5 ? -1 : 1); // diatonic approach tone
      if (b !== 0 && rng() < 0.12) deg = null; // occasional rest
    }
    if (deg == null) return;
    let m = degNote(r.root, cfg.mode, deg);
    while (m > 50) m -= 12; while (m < 34) m += 12;
    const f = mtof(m); const d = beat * (cfg.bass === 2 ? 0.95 : 1.6);
    tone(r.c, { type: 'sine', f, f2: f * 0.995, t, dur: d, a: 0.012, peak: 0.2, lp: 520 });
    tone(r.c, { type: 'triangle', f: f * 2, t, dur: d * 0.35, a: 0.008, peak: 0.05, lp: 900 });
    noise(r.c, { t, dur: 0.04, a: 0.004, peak: 0.02, ftype: 'lowpass', f: 700, q: 0.5 });
  }

  _flute(r, t, beat) {
    const cfg = r.cfg; const rng = r.rng;
    const tones = [0, 2, 4, 1, 6];
    const d = r.chord.d + cfg.oct + tones[Math.floor(rng() * tones.length)] + (rng() < 0.3 ? 7 : 0);
    let m = degNote(r.root, cfg.mode, d); while (m > 86) m -= 12; while (m < 70) m += 12;
    const f = mtof(m); const D = beat * (2 + rng() * 2.5);
    const c = r.c;
    tone(c, { type: 'sine', f, f2: f * 1.003, t, dur: D, a: 0.22, r: D * 0.5, peak: 0.055, wet: 0.7, vib: { rate: 4.8 + rng(), depth: 9, delay: 0.5 } });
    tone(c, { type: 'triangle', f: f * 2, t, dur: D, a: 0.25, r: D * 0.5, peak: 0.008, lp: 3000, wet: 0.6 });
    noise(c, { t, dur: D, a: 0.15, r: D * 0.5, peak: 0.012, f: f * 1.5, q: 3, wet: 0.5 });
  }

  info() {
    const r = this.cur;
    return r ? { mood: r.mood, bpm: Math.round(r.bpm * 10) / 10, mode: r.cfg.mode, rootMidi: r.root, bar: r.bar, chordDegree: r.chord ? r.chord.d : null, layers: 1 + this.disposals.length } : { mood: null, layers: this.disposals.length };
  }
}
