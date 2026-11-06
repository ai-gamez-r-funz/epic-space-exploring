// Halcyon Reach audio: WebAudio-only synthesis (sfx + generative music). See docs/CONTRACT.md §8.
import { buildGraph } from './graph.js';
import { playSfx, SFX, SFX_NAMES } from './sfx.js';
import { MusicEngine, MOODS } from './music.js';
import { stats } from './synth.js';

export { SFX_NAMES, MOODS, buildGraph, playSfx, MusicEngine, stats as nodeStats };

const KEY = 'halcyon.audio';
const DEFAULT_VOL = { master: 0.8, music: 0.6, sfx: 0.85 };
const TICK_MS = 90;

const S = {
  ctx: null, graph: null, engine: null,
  vol: { ...DEFAULT_VOL }, muted: false,
  pendingMood: null, wantMood: null,
  timer: 0, timers: 0, hidden: false, hooked: false,
  lastSfx: new Map(), recent: [], sfxPlayed: 0, sfxDropped: 0, error: null,
};

const clamp01 = (x, d) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : d);

(function load() {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw);
      for (const k of ['master', 'music', 'sfx']) S.vol[k] = clamp01(o && o[k], DEFAULT_VOL[k]);
      S.muted = !!(o && o.muted);
    }
  } catch (_) { /* storage unavailable */ }
})();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ ...S.vol, muted: S.muted })); } catch (_) { /* ignore */ }
}

function applyVolumes(fast) {
  if (!S.graph || !S.ctx) return;
  const t = S.ctx.currentTime; const tc = fast ? 0.005 : 0.05;
  S.graph.master.gain.setTargetAtTime(S.muted ? 0 : S.vol.master, t, tc);
  S.graph.musicBus.gain.setTargetAtTime(S.vol.music, t, tc);
  S.graph.sfxBus.gain.setTargetAtTime(S.vol.sfx, t, tc);
}

function stopTimer() { if (S.timer) { clearTimeout(S.timer); S.timer = 0; S.timers = 0; } }
function loop() {
  S.timer = 0; S.timers = 0;
  if (!S.ctx || S.hidden || S.ctx.state === 'closed') return;
  try { if (S.ctx.state === 'running') S.engine.tick(); } catch (e) { S.error = String(e); }
  S.timer = setTimeout(loop, TICK_MS); S.timers = 1;
}
function startTimer() { stopTimer(); S.timer = setTimeout(loop, TICK_MS); S.timers = 1; }

function onVisibility() {
  const hidden = typeof document !== 'undefined' && document.hidden;
  S.hidden = hidden;
  if (!S.ctx) return;
  if (hidden) {
    stopTimer();
    S.ctx.suspend().catch(() => {});
  } else {
    S.ctx.resume().then(() => { applyVolumes(true); }).catch(() => {});
    startTimer();
  }
}

function applyMood() {
  if (!S.engine || !S.wantMood) return;
  if (S.ctx.state !== 'running') return; // started when the context actually runs
  S.engine.start(S.wantMood);
  S.engine.tick();
}

function hookGestures() {
  if (typeof window === 'undefined' || S.hooked) return;
  S.hooked = true;
  const h = () => {
    audio.init();
    if (S.ctx && S.ctx.state === 'running') for (const e of ['pointerdown', 'keydown', 'touchend', 'click']) window.removeEventListener(e, h, true);
  };
  for (const e of ['pointerdown', 'keydown', 'touchend', 'click']) window.addEventListener(e, h, { capture: true, passive: true });
  document.addEventListener('visibilitychange', onVisibility);
}

const audio = {
  /** Create/resume the AudioContext. Call from a user gesture; safe to call repeatedly. */
  init() {
    try {
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return false;
      if (!S.ctx || S.ctx.state === 'closed') {
        S.ctx = new AC({ latencyHint: 'interactive' });
        S.graph = buildGraph(S.ctx);
        S.engine = new MusicEngine(S.ctx, S.graph);
        S.ctx.addEventListener('statechange', () => { if (S.ctx.state === 'running') { applyVolumes(true); applyMood(); } });
        applyVolumes(true);
        S.hidden = typeof document !== 'undefined' && document.hidden;
        startTimer();
      }
      if (S.ctx.state !== 'running' && !S.hidden) S.ctx.resume().then(applyMood).catch(() => {});
      applyMood();
      return true;
    } catch (e) { S.error = String(e); return false; }
  },

  /** Play a sound effect. Silently ignored until audio is running. */
  sfx(name, opts = {}) {
    try {
      const def = SFX[name];
      if (!def || !S.ctx || S.ctx.state !== 'running' || S.hidden || S.muted || S.vol.master * S.vol.sfx <= 0) return false;
      const now = performance.now();
      if (now - (S.lastSfx.get(name) || -1e9) < (def.gap ?? 80)) { S.sfxDropped++; return false; }
      S.recent = S.recent.filter((x) => now - x < 300);
      if (S.recent.length >= 8) { S.sfxDropped++; return false; }
      S.lastSfx.set(name, now); S.recent.push(now);
      S.sfxPlayed++;
      return playSfx(S.ctx, S.graph, name, opts || {}) > 0;
    } catch (e) { S.error = String(e); return false; }
  },

  /** Request a music mood (queued if audio is not running yet). Crossfades ~5 s. */
  music(mood) {
    if (!MOODS.includes(mood)) return false;
    S.wantMood = mood;
    if (S.engine && S.ctx.state === 'running') applyMood();
    return true;
  },

  setVolume(v = {}) {
    for (const k of ['master', 'music', 'sfx']) if (v && v[k] != null) S.vol[k] = clamp01(+v[k], S.vol[k]);
    applyVolumes(false); save();
  },
  getVolume() { return { ...S.vol }; },
  mute(b = true) { S.muted = !!b; applyVolumes(false); save(); },
  isMuted() { return S.muted; },

  debug() {
    const e = S.engine ? S.engine.info() : { mood: null };
    return {
      inited: !!S.ctx, state: S.ctx ? S.ctx.state : 'none', mood: e.mood, requestedMood: S.wantMood, music: e,
      muted: S.muted, volume: { ...S.vol }, hidden: S.hidden, time: S.ctx ? S.ctx.currentTime : 0,
      liveNodes: stats.live, nodesStarted: stats.started, nodesEnded: stats.ended, timers: S.timers,
      sfxPlayed: S.sfxPlayed, sfxDropped: S.sfxDropped, error: S.error,
      sampleRate: S.ctx ? S.ctx.sampleRate : 0,
    };
  },
};

hookGestures();

export const init = audio.init, sfx = audio.sfx, music = audio.music;
export const setVolume = audio.setVolume, getVolume = audio.getVolume, mute = audio.mute, isMuted = audio.isMuted, debug = audio.debug;
export { audio };
export default audio;
