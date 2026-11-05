// Master signal graph: buses -> master -> compressor -> limiter -> soft ceiling -> destination.
import { mulberry32 } from './synth.js';

function makeImpulse(ctx, seconds = 2.6, decay = 3.2) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  const rng = mulberry32(1969);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const x = i / len;
      const k = 0.55 - 0.45 * x; // darker over time (warm tail)
      lp += (((rng() * 2 - 1)) - lp) * k;
      const pre = i < rate * 0.012 ? i / (rate * 0.012) : 1; // short pre-delay ramp
      d[i] = lp * Math.pow(1 - x, decay) * pre * 0.8;
    }
  }
  return buf;
}

export function buildGraph(ctx) {
  const master = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 5;
  comp.attack.value = 0.008; comp.release.value = 0.28;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -4; limiter.knee.value = 2; limiter.ratio.value = 20;
  limiter.attack.value = 0.002; limiter.release.value = 0.12;
  // final soft ceiling at 0.9: inputs beyond +-1 are clamped to the curve ends
  const shaper = ctx.createWaveShaper();
  const N = 2049; const curve = new Float32Array(N);
  const norm = Math.tanh(1.1);
  for (let i = 0; i < N; i++) { const x = (i / (N - 1)) * 2 - 1; curve[i] = 0.9 * Math.tanh(x * 1.1) / norm; }
  shaper.curve = curve; shaper.oversample = '2x';
  master.connect(comp); comp.connect(limiter); limiter.connect(shaper); shaper.connect(ctx.destination);

  const musicBus = ctx.createGain();
  const sfxBus = ctx.createGain();
  musicBus.connect(master); sfxBus.connect(master);

  // shared convolution reverb (generated impulse)
  const reverbIn = ctx.createGain();
  const conv = ctx.createConvolver();
  conv.buffer = makeImpulse(ctx);
  const wet = ctx.createGain(); wet.gain.value = 0.55;
  reverbIn.connect(conv); conv.connect(wet); wet.connect(master);

  // shared echo (dotted-eighth-ish) feeding the reverb as well
  const echoIn = ctx.createGain();
  const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.375;
  const fb = ctx.createGain(); fb.gain.value = 0.32;
  const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2400;
  const eOut = ctx.createGain(); eOut.gain.value = 0.5;
  echoIn.connect(delay); delay.connect(dlp); dlp.connect(fb); fb.connect(delay);
  dlp.connect(eOut); eOut.connect(master); eOut.connect(reverbIn);

  return { master, comp, limiter, shaper, musicBus, sfxBus, reverbIn, echoIn };
}
