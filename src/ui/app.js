// App: Pixi Application, letterboxed 1280×720 stage, scene manager, overlay stack, input, error boundary, debug handle.
import { Application, Container, Graphics } from 'pixi.js';
import { W, H, C, Display, loadFonts } from './kit/theme.js';
import { Anim } from './kit/anim.js';
import { Input } from './kit/input.js';
import { Tooltip } from './kit/Tooltip.js';
import { Toasts } from './kit/Toast.js';
import { Modal } from './kit/Modal.js';
import { Fader } from './kit/Fader.js';
import { Panel } from './kit/Panel.js';
import { Button } from './kit/Button.js';
import { Label } from './kit/Label.js';
import { S, loadServices, sfx, DEBUG } from './services.js';
import { OVERLAYS } from './overlays/index.js';
import { Title } from './scenes/Title.js';
import { NewGame } from './scenes/NewGame.js';
import { Intro } from './scenes/Intro.js';
import { Bridge } from './scenes/Bridge.js';
import { GalaxyMap } from './scenes/GalaxyMap.js';
import { installPrefs, Prefs } from './overlays/parts2/prefs.js';
import { TutorialHints } from './overlays/parts2/tutorial.js';
import { Responsive } from './responsive.js';

const SCENES = { Title, NewGame, Intro, Bridge, GalaxyMap };
const MUSIC = { Title: 'title', NewGame: 'title', Intro: 'wonder', Bridge: 'bridge', GalaxyMap: 'map' };

export class App {
  constructor() {
    this.game = null; this.scene = null; this.sceneName = null; this.busy = false;
    this._changedFns = new Set(); this._offs = []; this.overlays = []; this._eventQueued = false; this._glitch = null; this.errors = [];
    this.S = S;
  }

  async init() {
    await Promise.all([loadFonts(), loadServices()]);
    if (import.meta.env.DEV) SCENES.KitDemo = (await import('./dev/KitDemo.js')).KitDemo; // gallery is dev-only
    const app = this.pixi = new Application();
    await app.init({ width: W, height: H, background: C.ink, antialias: true, resolution: 1, autoDensity: false, preference: 'webgl', powerPreference: 'high-performance' });
    const host = document.getElementById('game') || document.body;
    this.canvas = app.canvas; host.appendChild(app.canvas);
    Object.assign(app.canvas.style, { position: 'absolute', touchAction: 'none' });
    app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    app.stage.eventMode = 'static';
    const L = this.layers = {};
    for (const n of ['scene', 'hints', 'toast', 'overlay', 'tooltip', 'fader', 'glitch']) { L[n] = new Container(); L[n].label = n; app.stage.addChild(L[n]); }
    this.fader = new Fader(); L.fader.addChild(this.fader);
    Modal.layer = L.overlay; Toasts.init(L.toast, () => this.overlays.length > 0 || this.busy || this.holdEvents); Tooltip.init(L.tooltip);
    Anim.onError = (e) => this.fail(e);
    Input.init(); installPrefs();
    this.tutorial = new TutorialHints(this, L.hints);
    this.resp = new Responsive(this);
    this.popBase = Input.pushLayer({ root: L.scene, name: 'scene' });
    try { S.gfx.init(app); } catch (e) { console.warn('gfx.init failed', e); }
    this.resp.install(); this._fit();
    Prefs.on((k) => { if (k === 'largeUI') this._fit(); });
    const unlock = () => { try { S.audio.init(); } catch (e) { /* */ } };
    window.addEventListener('pointerdown', unlock, { once: true, capture: true }); window.addEventListener('keydown', unlock, { once: true, capture: true });
    app.ticker.add((t) => this._frame(Math.min(0.1, t.deltaMS / 1000)));
    window.addEventListener('error', (e) => this.fail(e.error || e.message));
    window.addEventListener('unhandledrejection', (e) => this.fail(e.reason));
    if (DEBUG) this._debugHandle();
    return this;
  }

  /** Letterbox + phone/tablet layout live in responsive.js (kept out of this file's hot path). */
  _fit() { this.resp.fit(); this.scene?.resize?.(); }
  applyLayout() { this._fit(); }
  get fullscreenSupported() { return this.resp.fullscreenSupported; }
  isFullscreen() { return this.resp.isFullscreen(); }
  toggleFullscreen() { return this.resp.toggleFullscreen(); }

  _frame(dt) {
    try {
      Anim.step(dt);
      if (!this._glitch) this.scene?.update?.(dt);
      this.tutorial?.update(dt);
    } catch (e) { this.fail(e); }
  }

  // ------------------------------------------------------------------ game wiring
  setGame(g) {
    this._offs.forEach((f) => f()); this._offs = []; this.game = g;
    if (!g) return;
    let hadPending = !!g.state.pending;
    this._offs.push(
      g.on('changed', () => {
        const pending = !!g.state.pending;
        for (const f of [...this._changedFns]) { try { f(); } catch (e) { this.fail(e); } }
        const ev = this.overlays.find((o) => o instanceof OVERLAYS.EventDialog);
        if (ev) ev.refresh?.();
        if (hadPending && !pending) this.autosave();
        hadPending = pending;
      }),
      g.on('event', () => this.openEvent()),
      g.on('toast', (t) => Toasts.push(t.text, { tone: t.tone })),
      g.on('sfx', (s) => sfx(s.name)),
      g.on('arrive', () => this.autosave()),
      g.on('discovery', (d) => { Toasts.push(d.text || 'Discovery logged.', { tone: 'good', icon: 'star', ms: 5000 }); sfx('discovery'); }),
      g.on('ended', (e) => { setTimeout(() => this.openOverlay('EndScreen', { ending: e?.ending || g.state.ending }), 400); }),
    );
  }
  onChanged(fn) { this._changedFns.add(fn); return () => this._changedFns.delete(fn); }
  autosave() { try { if (this.game && S.Game.writeSave) S.Game.writeSave(this.game, 'auto'); } catch (e) { console.warn('autosave failed', e); } }
  saveTo(slot) { try { return !!S.Game.writeSave(this.game, slot); } catch (e) { return false; } }
  newGame(opts) { const g = S.Game.create(opts); this.setGame(g); return g; }
  loadSlot(slot = 'auto') {
    try {
      const raw = S.Game.readSave(slot); if (!raw) return null;
      const g = typeof raw === 'string' ? S.Game.load(raw) : (raw.state ? raw : S.Game.load(JSON.stringify(raw)));
      this.setGame(g); return g;
    } catch (e) { console.warn('load failed', e); this.toast('That save could not be read.', 'bad'); return null; }
  }
  hasSave(slot = 'auto') { try { return !!S.Game.hasSave(slot); } catch (e) { return false; } }
  quickStart(opts = {}) { return this.newGame({ seed: 4242, captainName: 'Rhea Okonkwo', shipName: 'ISV Halcyon', difficulty: 'standard', ...opts }); }

  // ------------------------------------------------------------------ helpers for scenes/overlays
  toast(text, tone = 'info', o = {}) { Toasts.push(text, { tone, ...o }); }
  sfx(n, o) { sfx(n, o); }
  music(m) { try { S.audio.music(m); } catch (e) { /* */ } }
  get sceneBlocked() { return this.busy || this.overlays.length > 0; }

  // ------------------------------------------------------------------ scenes
  async goto(name, params = {}, { kind = 'fade', dir = 'right', ms = 300 } = {}) {
    const Cls = SCENES[name]; if (!Cls) throw new Error('Unknown scene ' + name);
    if (this.busy) return;
    if (name === 'Bridge' || name === 'GalaxyMap') { if (!this.game) this.quickStart(); }
    this.busy = true;
    try {
      if (this.scene) await this.fader.out({ kind, dir, ms });
      this._glitch?.destroy({ children: true }); this._glitch = null;
      this.overlays.slice().forEach((o) => o.close?.(true));
      if (this.scene) { try { this.scene.destroy(); } catch (e) { console.warn(e); } this.scene = null; }
      Tooltip.hide();
      const sc = new Cls(this); this.layers.scene.addChild(sc.view);
      this.scene = sc; this.sceneName = name;
      await sc.enter(params);
      this.music(MUSIC[name] || 'bridge');
      await this.fader.in({ ms: ms + 40 });
    } catch (e) { this.fail(e); await this.fader.in({ ms: 100 }).catch(() => {}); }
    this.busy = false; this.holdEvents = false;
    this._flush();
  }
  _flush() { if (this._eventQueued && this.game?.state.pending) { this._eventQueued = false; this.openEvent(); } else this._eventQueued = false; }

  // ------------------------------------------------------------------ overlays
  openOverlay(name, params = {}) {
    const Cls = OVERLAYS[name]; if (!Cls) { console.warn('no overlay', name); return null; }
    const existing = this.overlays.find((o) => o instanceof Cls); if (existing) return existing;
    const o = new Cls(this); this.overlays.push(o);
    o.onClosed = () => { const i = this.overlays.indexOf(o); if (i >= 0) this.overlays.splice(i, 1); this.scene?.onOverlayClosed?.(name); };
    try { o.open(params); } catch (e) { const i = this.overlays.indexOf(o); if (i >= 0) this.overlays.splice(i, 1); this.fail(e); }
    return o;
  }
  closeOverlay(name) { this.overlays.filter((o) => !name || o instanceof OVERLAYS[name]).forEach((o) => o.close()); }
  /** Called when the engine says an event is pending. Hook for src/ui/overlays/EventDialog.js */
  openEvent() {
    if (!this.game?.state.pending) return;
    if (this.busy || this.holdEvents || !this.scene) { this._eventQueued = true; return; }
    this.openOverlay('EventDialog', {});
  }
  /** Jump to the Chart and spotlight system(s) — used by the mission log's "Show on map". */
  async showOnMap(ids, title) {
    ids = [].concat(ids || []).filter(Boolean); const g = this.game; if (!ids.length || !g) return;
    this.mapFocus = { ids, title }; if (typeof window !== 'undefined' && window.__halcyon) window.__halcyon.mapFocus = this.mapFocus;
    if (this.sceneName !== 'GalaxyMap') await this.goto('GalaxyMap', { focus: ids }, { kind: 'wipe', dir: 'left', ms: 350 });
    const sc = this.scene; if (this.sceneName !== 'GalaxyMap' || !sc) return;
    const sys = g.system(ids[0]); if (!sys) return;
    try { sc.select?.(ids[0]); sc.centerOn?.(sys.x, sys.y, true); } catch (e) { console.warn('showOnMap', e); }
    if (sc.world) for (const id of ids) {
      const t = g.system(id); if (!t) continue; const ring = new Graphics(); ring.x = t.x; ring.y = t.y; sc.world.addChild(ring); let life = 7;
      Anim.watch(ring, (dt, tm) => { life -= dt; ring.clear(); const k = (tm * 1.4) % 1; ring.circle(0, 0, 18 + k * 46).stroke({ width: 3, color: C.mustard, alpha: Math.max(0, (1 - k) * Math.min(1, life)) }); ring.circle(0, 0, 14).stroke({ width: 2, color: C.cream, alpha: Math.min(1, life) * 0.8 }); if (life <= 0) ring.destroy(); });
    }
    if (title) this.toast(`Mission target: ${title}`, 'info');
  }
  openPause() { if (['Title', 'NewGame', 'KitDemo', 'Intro'].includes(this.sceneName)) return; this.openOverlay('Pause'); }

  // ------------------------------------------------------------------ error boundary
  fail(err) {
    const msg = String(err?.message || err || 'unknown error');
    console.error('[halcyon] console glitch:', err);
    this.errors.push({ msg, stack: err?.stack || '', t: Date.now() });
    if (this._glitch || this.errors.length > 25) return;
    try { this._showGlitch(msg, err?.stack || ''); } catch (e2) { this._domGlitch(msg); }
  }
  _showGlitch(msg, stack) {
    const c = this._glitch = new Container(); this.layers.glitch.addChild(c);
    c.addChild(new Graphics().rect(0, 0, W, H).fill({ color: 0x05060f, alpha: 0.82 }));
    c.eventMode = 'static';
    const p = new Panel({ w: 640, h: 360, title: 'CONSOLE GLITCH', tone: 'coral', rivets: true, lights: true });
    p.x = (W - 640) / 2; p.y = (H - 360) / 2; c.addChild(p);
    p.content.addChild(new Label({ text: 'Something on the bridge console has hiccuped.', preset: 'bodyB', size: 22, w: 590, color: C.cream }));
    const l2 = new Label({ text: 'The crew assures you it is nothing serious, and has put the kettle on. Your voyage is safe; you can carry on, or reboot the console.', preset: 'body', w: 590, color: C.cream }); l2.y = 40; p.content.addChild(l2);
    const l3 = new Label({ text: msg.slice(0, 220), preset: 'mono', size: 12, w: 590, color: 0xffd9c9, maxLines: 3 }); l3.y = 120; p.content.addChild(l3);
    const close = () => { c.destroy({ children: true }); this._glitch = null; this.errors.length = Math.min(this.errors.length, 10); };
    const mk = (label, x, variant, fn) => { const b = new Button({ label, w: 180, h: 44, variant, onClick: fn }); b.x = x; b.y = 235; p.content.addChild(b); };
    mk('Carry on', 0, 'primary', close);
    mk('Back to title', 195, 'brass', () => { close(); this.goto('Title'); });
    mk('Reboot console', 390, 'coral', () => location.reload());
  }
  _domGlitch(msg) {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0b0d1e;color:#f2e3b8;font:18px system-ui;z-index:99;text-align:center;padding:20px';
    d.innerHTML = '<h2>CONSOLE GLITCH</h2><p>Something hiccuped. The crew has put the kettle on.</p><button style="font:18px system-ui;padding:10px 20px" onclick="location.reload()">Reboot console</button><pre style="opacity:.6;max-width:80vw;white-space:pre-wrap">' + msg.replace(/</g, '&lt;') + '</pre>';
    document.body.appendChild(d);
  }

  _debugHandle() {
    const self = this;
    window.__halcyon = {
      app: self,
      get game() { return self.game; },
      get scene() { return self.sceneName; },
      get state() { return self.game?.state; },
      scenes: Object.keys(SCENES),
      overlays: Object.keys(OVERLAYS),
      goto: (n, p) => self.goto(n, p),
      showOnMap: (ids, t) => self.showOnMap(ids, t),
      openOverlay: (n, p) => self.openOverlay(n, p),
      quickStart: (o) => self.quickStart(o),
      get errors() { return self.errors; },
      services: S, anim: Anim,
      get busy() { return self.busy; },
    };
  }
}

export async function boot() {
  const app = new App();
  try {
    await app.init();
    const q = new URLSearchParams(location.search);
    const first = (DEBUG && q.get('scene')) || 'Title';
    if (DEBUG && q.get('quick') === '1') app.quickStart();
    document.getElementById('boot')?.remove();
    await app.goto(first, {}, { ms: 400 });
  } catch (e) {
    console.error(e); app._domGlitch(String(e?.message || e)); document.getElementById('boot')?.remove();
  }
  return app;
}
