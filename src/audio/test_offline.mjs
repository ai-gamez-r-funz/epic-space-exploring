// Audio verification: node src/audio/test_offline.mjs   (needs playwright; serves repo statically on :5198)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch (e) { pw = require(path.join(process.env.NODE_PATH || '/usr/lib/node_modules', 'playwright')); }
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = process.env.AUDIO_OUT || '/tmp/claude-0/-home-user-epic-space-exploring/636eb007-6bb8-55e6-a373-a8ea5b2cf0cb/scratchpad/audio';
fs.mkdirSync(OUT, { recursive: true });
const PORT = 5198;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const server = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
await new Promise((res) => server.listen(PORT, res));

const browser = await pw.chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream'] });
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(`http://localhost:${PORT}/src/audio/test_page.html`);

let failed = 0;
const check = (ok, msg) => { if (!ok) { failed++; console.log('  FAIL', msg); } };

// ---------- offline renders ----------
const result = await page.evaluate(async () => {
  const A = await import('/src/audio/index.js');
  const { MusicEngine } = await import('/src/audio/music.js');
  const SR = 44100;
  const wav = (buf) => {
    const n = buf.length, ch = buf.numberOfChannels; const out = new DataView(new ArrayBuffer(44 + n * ch * 2));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true);
    out.setUint16(22, ch, true); out.setUint32(24, buf.sampleRate, true); out.setUint32(28, buf.sampleRate * ch * 2, true);
    out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * ch * 2, true);
    const d = [...Array(ch).keys()].map((i) => buf.getChannelData(i));
    for (let i = 0, o = 44; i < n; i++) for (let c = 0; c < ch; c++, o += 2) out.setInt16(o, Math.max(-1, Math.min(1, d[c][i])) * 32767, true);
    let s = ''; const u = new Uint8Array(out.buffer); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const analyse = (buf) => {
    let peak = 0, sum = 0, n = 0, nan = 0, clip = 0, dc = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) for (const x of buf.getChannelData(c)) {
      if (!Number.isFinite(x)) { nan++; continue; }
      const a = Math.abs(x); if (a > peak) peak = a; if (a > 0.95) clip++; sum += x * x; dc += x; n++;
    }
    return { peak, rms: Math.sqrt(sum / n), nan, clip, dc: dc / n };
  };
  const mk = (secs) => { const ctx = new OfflineAudioContext(2, Math.ceil(SR * secs), SR); const g = A.buildGraph(ctx); g.master.gain.value = 0.8; g.musicBus.gain.value = 0.6; g.sfxBus.gain.value = 0.85; return { ctx, g }; };
  const out = { sfx: {}, music: {}, files: {} };
  for (const name of A.SFX_NAMES) {
    const { ctx, g } = mk(4.5);
    const end = A.playSfx(ctx, g, name, {}, 0.05);
    const buf = await ctx.startRendering();
    out.sfx[name] = { ...analyse(buf), dur: +end.toFixed(2) };
    out.files['sfx_' + name] = wav(buf);
  }
  for (const mood of A.MOODS) {
    const { ctx, g } = mk(30);
    const eng = new MusicEngine(ctx, g, { seed: 12345 });
    eng.start(mood, 0);
    for (let t = 0; t < 30; t += 0.09) eng.tick(t);
    const buf = await ctx.startRendering();
    const a = analyse(buf);
    // per-5s rms to check continuity
    const d = buf.getChannelData(0); const seg = [];
    for (let s = 0; s < 6; s++) { let q = 0; for (let i = s * SR * 5; i < (s + 1) * SR * 5; i++) q += d[i] * d[i]; seg.push(+Math.sqrt(q / (SR * 5)).toFixed(4)); }
    out.music[mood] = { ...a, seg, info: eng.info() };
    out.files['music_' + mood] = wav(buf);
  }
  // crossfade: bridge -> wonder at 10s, -> tense at 20s
  { const { ctx, g } = mk(32); const eng = new MusicEngine(ctx, g, { seed: 7 });
    eng.start('bridge', 0);
    for (let t = 0; t < 32; t += 0.09) { if (t >= 10 && eng.mood === 'bridge') eng.start('wonder', t); if (t >= 20 && eng.mood === 'wonder') eng.start('tense', t); eng.tick(t); }
    const buf = await ctx.startRendering(); out.music.crossfade = analyse(buf); out.files['music_crossfade'] = wav(buf); }
  // seed variation: same mood, two seeds should differ
  const sig = async (seed) => { const { ctx, g } = mk(12); const eng = new MusicEngine(ctx, g, { seed }); eng.start('map', 0); for (let t = 0; t < 12; t += 0.09) eng.tick(t); const b = await ctx.startRendering(); const d = b.getChannelData(0); let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + Math.round(d[i] * 1e4)) | 0; const i = eng.info(); return { h, info: `${i.bpm}/${i.rootMidi}/${i.chordDegree}/${i.bar}` }; };
  out.seedA = await sig(1); out.seedB = await sig(2); out.seedA2 = await sig(1);
  // long simulated run: node accounting
  { const { ctx, g } = mk(1); const eng = new MusicEngine(ctx, g, { seed: 99 }); const moods = A.MOODS; let maxLive = 0, maxLayers = 0, k = 0;
    A.nodeStats.registry.clear();
    const T = 600;
    for (let t = 0; t < T; t += 0.09) { if (Math.floor(t / 25) !== k || t === 0) { k = Math.floor(t / 25); eng.start(moods[k % moods.length], t); } eng.tick(t); A.nodeStats.prune(t); maxLive = Math.max(maxLive, A.nodeStats.live); maxLayers = Math.max(maxLayers, eng.disposals.length); }
    eng.stop(T); for (let t = T; t < T + 20; t += 0.09) { eng.tick(t); A.nodeStats.prune(t); }
    out.sim = { seconds: T, maxLive, maxLayers, finalLive: A.nodeStats.live, finalDisposals: eng.disposals.length, totalStarted: A.nodeStats.started }; }
  return out;
});

console.log('--- SFX ---');
for (const [n, m] of Object.entries(result.sfx)) {
  console.log(`${n.padEnd(10)} peak ${m.peak.toFixed(3)} rms ${m.rms.toFixed(4)} dur ${m.dur}s`);
  check(m.nan === 0, `${n} NaN`); check(m.peak < 0.95, `${n} peak`); check(m.clip === 0, `${n} clip`); check(m.rms > 1e-4, `${n} silent`);
  check(Math.abs(m.dc) < 0.01, `${n} dc`);
}
console.log('--- MUSIC (30s) ---');
for (const [n, m] of Object.entries(result.music)) {
  console.log(`${n.padEnd(10)} peak ${m.peak.toFixed(3)} rms ${m.rms.toFixed(4)} ${m.seg ? 'seg ' + m.seg.join(',') : ''} ${m.info ? `bpm ${m.info.bpm} root ${m.info.rootMidi} ${m.info.mode}` : ''}`);
  check(m.nan === 0, `${n} NaN`); check(m.peak < 0.95, `${n} peak`); check(m.clip === 0, `${n} clip`); check(m.rms > 0.003, `${n} too quiet`);
  check(Math.abs(m.dc) < 0.01, `${n} dc`);
  if (m.seg) check(m.seg.slice(1).every((x) => x > 0.002), `${n} gaps`);
}
check(result.seedA.h !== result.seedB.h, 'different seeds should differ');
check(result.seedA.info === result.seedA2.info, 'same seed deterministic (tempo/key/chords)');
console.log('seed variation:', result.seedA.info, 'vs', result.seedB.info, 'repeat', result.seedA2.info);
console.log('long sim', JSON.stringify(result.sim));
check(result.sim.maxLive < 450, 'live nodes bounded'); check(result.sim.finalLive === 0, 'nodes all released'); check(result.sim.finalDisposals === 0, 'layers disposed');
for (const [k, b64] of Object.entries(result.files)) fs.writeFileSync(path.join(OUT, k + '.wav'), Buffer.from(b64, 'base64'));
console.log('WAVs written to', OUT);

// ---------- realtime API checks ----------
const page2 = await browser.newPage();
page2.on('console', (m) => { if (m.type() === 'error') errors.push('p2 error: ' + m.text()); });
page2.on('pageerror', (e) => errors.push('p2 pageerror: ' + e.message));
await page2.goto(`http://localhost:${PORT}/src/audio/test_page.html`);
const rt = await page2.evaluate(async () => {
  const { default: audio, audio: a2, init, SFX_NAMES, MOODS } = await import('/src/audio/index.js');
  const o = {};
  o.sameObj = audio === a2;
  // before init: nothing throws, mood queued
  audio.sfx('click'); audio.setVolume({ music: 0.5 }); audio.mute(false); audio.music('title');
  o.pre = audio.debug();
  audio.init(); audio.init(); init();
  await new Promise((r) => setTimeout(r, 1500));
  o.started = audio.debug();
  for (const n of SFX_NAMES) { audio.sfx(n); await new Promise((r) => setTimeout(r, 90)); }
  audio.sfx('nonexistent'); audio.sfx('click'); audio.sfx('click'); // rate limit
  o.afterSfx = audio.debug();
  // hammer mood switching
  for (let i = 0; i < 18; i++) { audio.music(MOODS[i % MOODS.length]); await new Promise((r) => setTimeout(r, 400)); }
  o.afterSwitch = audio.debug();
  // visibility
  Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange'));
  await new Promise((r) => setTimeout(r, 700)); o.hidden = audio.debug(); const t1 = audio.debug().time;
  await new Promise((r) => setTimeout(r, 500)); o.hiddenLater = audio.debug().time - t1;
  Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange'));
  await new Promise((r) => setTimeout(r, 1500)); o.visible = audio.debug();
  // volume persistence
  audio.setVolume({ master: 0.33, music: 0.44, sfx: 0.55 }); audio.mute(true);
  o.stored = JSON.parse(localStorage.getItem('halcyon.audio')); o.muted = audio.isMuted(); o.vol = audio.getVolume(); audio.mute(false);
  // soak: 12 s steady with a few sfx
  await new Promise((r) => setTimeout(r, 12000)); o.soak = audio.debug();
  return o;
});
console.log('--- REALTIME ---');
console.log('pre-init', JSON.stringify({ inited: rt.pre.inited, requested: rt.pre.requestedMood, mood: rt.pre.mood }));
console.log('started ', JSON.stringify({ state: rt.started.state, mood: rt.started.mood, timers: rt.started.timers, live: rt.started.liveNodes }));
console.log('afterSfx', rt.afterSfx.sfxPlayed, 'played', rt.afterSfx.sfxDropped, 'dropped, live', rt.afterSfx.liveNodes);
console.log('switch  ', JSON.stringify({ mood: rt.afterSwitch.mood, live: rt.afterSwitch.liveNodes, timers: rt.afterSwitch.timers }));
console.log('hidden  ', rt.hidden.state, 'timers', rt.hidden.timers, 'clock advance while hidden', rt.hiddenLater.toFixed(3));
console.log('visible ', rt.visible.state, 'timers', rt.visible.timers);
console.log('soak    ', JSON.stringify({ live: rt.soak.liveNodes, timers: rt.soak.timers, started: rt.soak.nodesStarted, ended: rt.soak.nodesEnded, err: rt.soak.error }));
check(rt.sameObj, 'default export === audio');
check(!rt.pre.inited && rt.pre.requestedMood === 'title', 'queue before init');
check(rt.started.state === 'running' && rt.started.mood === 'title', 'started title after init');
check(rt.started.timers === 1 && rt.soak.timers === 1 && rt.afterSwitch.timers === 1, 'exactly one scheduler timer');
check(rt.afterSwitch.mood === MOODS_LAST(rt), 'mood switched');
check(rt.hidden.state === 'suspended' && rt.hidden.timers === 0 && rt.hiddenLater < 0.05, 'pauses when hidden');
check(rt.visible.state === 'running' && rt.visible.timers === 1, 'resumes when visible');
check(rt.soak.liveNodes < 300, 'realtime live nodes bounded');
check(rt.soak.nodesStarted - rt.soak.nodesEnded === rt.soak.liveNodes, 'accounting');
check(rt.stored.master === 0.33 && rt.stored.music === 0.44 && rt.stored.sfx === 0.55 && rt.stored.muted === true, 'persisted volume');
check(rt.muted === true, 'mute');
check(!rt.soak.error, 'no internal errors');
function MOODS_LAST(r) { return ['title','bridge','map','system','event','wonder','tense','station','ending'][17 % 9]; }

// reload: persistence read back
await page2.reload();
const back = await page2.evaluate(async () => { const { default: a } = await import('/src/audio/index.js'); return { v: a.getVolume(), m: a.isMuted() }; });
console.log('reload  ', JSON.stringify(back));
check(back.v.master === 0.33 && back.m === false, 'persistence readback');

console.log('--- console errors/warnings ---');
const real = errors.filter((e) => !/favicon/.test(e));
console.log(real.length ? real.join('\n') : '(none)');
check(real.length === 0, 'console clean');
await browser.close(); server.close();
console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);
