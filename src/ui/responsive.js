// Responsive / phone / tablet support for the letterboxed 1280x720 stage (owned by UI-2B).
//  - fit(): letterbox scale + crisp render resolution, Display.* flags
//  - "rotate your device" DOM overlay for portrait phones (with fullscreen + "play anyway")
//  - fullscreen button (DOM, shown in the side margin on phones) + toggleFullscreen()
//  - no page scroll / pinch zoom / pull-to-refresh / dbl-tap zoom / ctrl+wheel zoom
//  - touch hit slop: taps that land near (but not on) a control snap to it, so small scaled buttons stay >= ~40 css px
//  - modal boost: on small screens (or "Large UI") modal panels are scaled up to use the screen
//  - pause ticker + resume audio on visibilitychange
import { Container } from 'pixi.js';
import { W, H, Display } from './kit/theme.js';
import { Modal } from './kit/Modal.js';
import { Toasts } from './kit/Toast.js';
import { Prefs } from './overlays/parts2/prefs.js';
import { S } from './services.js';

const CSS = `
html,body{margin:0;height:100%;width:100%;background:#0b0d1e;overflow:hidden;overscroll-behavior:none;touch-action:none;
  -webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;-webkit-text-size-adjust:100%}
#game{position:fixed;inset:0;overflow:hidden;touch-action:none}
canvas{touch-action:none;-webkit-user-drag:none;outline:none}
#hx-rotate{position:fixed;inset:0;z-index:50;display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;padding:28px;
  background:radial-gradient(ellipse at 50% 30%,#1b1f4a 0%,#0b0d1e 70%);color:#f2e3b8;font-family:"Josefin Sans","Trebuchet MS",sans-serif}
#hx-rotate.on{display:flex}
#hx-rotate h1{font:700 15px Syncopate,"Josefin Sans",sans-serif;letter-spacing:.28em;margin:0;color:#e8b53a;text-transform:uppercase}
#hx-rotate p{margin:0;font-size:18px;line-height:1.45;max-width:20em;color:#f2e3b8}
#hx-rotate .phone{width:74px;height:124px;border:5px solid #c9994a;border-radius:16px;position:relative;animation:hx-rot 3.2s ease-in-out infinite;box-shadow:0 0 30px rgba(63,193,176,.25)}
#hx-rotate .phone::before{content:"";position:absolute;inset:8px;border-radius:8px;background:linear-gradient(160deg,#3fc1b0,#1b1f4a)}
#hx-rotate .phone::after{content:"";position:absolute;left:50%;bottom:-3px;width:16px;height:3px;margin-left:-8px;background:#c9994a;border-radius:2px}
@keyframes hx-rot{0%,15%{transform:rotate(0)}55%,85%{transform:rotate(-90deg)}100%{transform:rotate(0)}}
@media (prefers-reduced-motion:reduce){#hx-rotate .phone{animation:none;transform:rotate(-90deg)}}
#hx-rotate button,#hx-fs{font:700 16px "Josefin Sans",sans-serif;letter-spacing:.12em;text-transform:uppercase;border:0;cursor:pointer}
#hx-rotate button{min-height:48px;padding:0 26px;border-radius:12px;color:#1a1830;background:#e8b53a;box-shadow:0 3px 0 #7d5c24}
#hx-rotate button.alt{background:#2a2f6a;color:#f2e3b8;box-shadow:0 3px 0 #0f1230,inset 0 0 0 2px #c9994a}
#hx-fs{position:fixed;z-index:20;width:44px;height:44px;border-radius:12px;display:none;align-items:center;justify-content:center;padding:0;
  background:rgba(27,31,74,.78);box-shadow:inset 0 0 0 2px #c9994a;color:#f2e3b8}
#hx-fs.on{display:flex}
#hx-fs svg{width:24px;height:24px;stroke:#f2e3b8;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
`;

export class Responsive {
  constructor(app) { this.app = app; this.touching = false; this.rotateDismissed = false; this.layout = {}; }

  // ------------------------------------------------------------------ install
  install() {
    const app = this.app;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const meta = (n, c) => { let m = document.querySelector(`meta[name="${n}"]`); if (!m) { m = document.createElement('meta'); m.name = n; document.head.appendChild(m); } m.content = c; };
    meta('theme-color', '#0b0d1e'); meta('apple-mobile-web-app-capable', 'yes'); meta('mobile-web-app-capable', 'yes'); meta('apple-mobile-web-app-status-bar-style', 'black-translucent'); meta('format-detection', 'telephone=no');
    this._buildRotate(); this._buildFsButton();
    const opt = { passive: false };
    document.addEventListener('touchmove', (e) => { if (!e.target?.closest?.('input,textarea')) e.preventDefault(); }, opt);
    document.addEventListener('gesturestart', (e) => e.preventDefault(), opt);
    document.addEventListener('gesturechange', (e) => e.preventDefault(), opt);
    document.addEventListener('dblclick', (e) => e.preventDefault(), opt);
    document.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, opt);
    window.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault(); }, opt);
    const refit = () => this.app._fit();
    window.addEventListener('resize', refit); window.addEventListener('orientationchange', () => { setTimeout(refit, 120); setTimeout(refit, 450); });
    window.visualViewport?.addEventListener('resize', refit);
    document.addEventListener('fullscreenchange', () => { this._fsIcon(); refit(); }); document.addEventListener('webkitfullscreenchange', () => { this._fsIcon(); refit(); });
    // pointer type tracking for hit slop
    const track = (e) => { this.touching = e.pointerType === 'touch' || e.pointerType === 'pen'; };
    window.addEventListener('pointerdown', track, true); window.addEventListener('pointermove', track, true);
    this._installHitSlop();
    // modals: boost whenever one is added
    app.layers.overlay.on('childAdded', (child) => this._boost(child));
    // visibility
    document.addEventListener('visibilitychange', () => {
      try {
        if (document.hidden) app.pixi.ticker.stop();
        else { app.pixi.ticker.start(); S.audio?.init?.(); this.app._fit(); }
      } catch (e) { /* ignore */ }
    });
  }

  // ------------------------------------------------------------------ DOM bits
  _buildRotate() {
    const d = this.rot = document.createElement('div'); d.id = 'hx-rotate';
    d.innerHTML = '<div class="phone"></div><h1>Rotate your device</h1><p>Halcyon Reach is a widescreen bridge. Turn your phone sideways for the full view.</p><div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center"><button id="hx-rot-fs">Fullscreen</button><button class="alt" id="hx-rot-go">Play anyway</button></div>';
    document.body.appendChild(d);
    d.querySelector('#hx-rot-go').addEventListener('click', () => { this.rotateDismissed = true; this.app._fit(); });
    const fs = d.querySelector('#hx-rot-fs'); fs.addEventListener('click', () => this.toggleFullscreen());
    if (!this.fullscreenSupported) fs.style.display = 'none';
  }
  _buildFsButton() {
    const b = this.fsBtn = document.createElement('button'); b.id = 'hx-fs'; b.setAttribute('aria-label', 'Toggle fullscreen'); b.title = 'Fullscreen';
    b.addEventListener('click', () => this.toggleFullscreen()); document.body.appendChild(b); this._fsIcon();
  }
  _fsIcon() {
    if (!this.fsBtn) return;
    this.fsBtn.innerHTML = this.isFullscreen()
      ? '<svg viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  }
  get fullscreenSupported() { const d = document; return !!(d.fullscreenEnabled || d.webkitFullscreenEnabled); }
  isFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  async toggleFullscreen() {
    try {
      if (this.isFullscreen()) { await (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      const el = document.documentElement; await (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' });
      try { await screen.orientation?.lock?.('landscape'); } catch (e) { /* lock is optional */ }
    } catch (e) { Toasts.push('Fullscreen is not available here.', { tone: 'warn' }); }
  }

  // ------------------------------------------------------------------ layout
  fit() {
    const app = this.app; const vv = window.visualViewport;
    const iw = Math.max(1, Math.round(vv?.width || window.innerWidth)), ih = Math.max(1, Math.round(vv?.height || window.innerHeight));
    const scale = Math.min(iw / W, ih / H);
    const dpr = window.devicePixelRatio || 1; const res = Math.max(0.75, Math.min(3, dpr * scale));
    const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    Object.assign(Display, { scale, dpr, res, touch: coarse, iw, ih, small: Math.min(iw, ih) < 600, largeUI: Prefs.largeUI });
    app.pixi.renderer.resize(W, H, res);
    const s = app.canvas.style; s.width = Math.round(W * scale) + 'px'; s.height = Math.round(H * scale) + 'px';
    s.left = Math.round((iw - W * scale) / 2) + 'px'; s.top = Math.round((ih - H * scale) / 2) + 'px';
    // portrait phone/tablet -> rotate overlay
    const portrait = ih > iw * 1.05 && Math.min(iw, ih) < 820;
    if (!portrait) this.rotateDismissed = false;
    const showRot = portrait && !this.rotateDismissed;
    this.rot.classList.toggle('on', showRot);
    // fullscreen button: phones/tablets only, sits in the letterbox margin when there is one
    const margin = (iw - W * scale) / 2, marginY = (ih - H * scale) / 2; const canFs = this.fullscreenSupported && (coarse || Display.small) && !showRot;
    const fb = this.fsBtn.style; fb.left = fb.right = fb.top = fb.bottom = '';
    let place = false;
    if (margin >= 50) { fb.left = Math.round(margin / 2 - 22) + 'px'; fb.top = '10px'; place = true; }
    else if (marginY >= 50) { fb.right = '8px'; fb.top = '8px'; place = true; }
    this.fsBtn.classList.toggle('on', canFs && place);
    Display.margin = margin;
    for (const ch of app.layers.overlay.children) this._boost(ch);
  }
  /** Scale modal panels up on small screens so text is readable; capped to keep the panel inside the stage. */
  _boost(child) {
    if (!(child instanceof Modal) || child.destroyed) return;
    try {
      const o = child.o; const want = Prefs.largeUI ? 1.32 : Display.scale < 0.62 ? 1.2 : Display.scale < 0.8 ? 1.08 : 1;
      const s = Math.max(1, Math.min(want, (H - 16) / o.h, (W - 16) / o.w));
      child.pivot.set(W / 2, H / 2); child.position.set(W / 2, H / 2); child.scale.set(s);
      if (!child._bdFixed) { child._bdFixed = true; child.backdrop.clear().rect(-W, -H, W * 3, H * 3).fill({ color: 0x03040d, alpha: 0.72 }); }
    } catch (e) { /* cosmetic */ }
  }
  _isTap(obj) { for (let o = obj; o; o = o.parent) { if (o.cursor === 'pointer' || o.cursor === 'not-allowed' || o.cursor === 'text') return true; } return false; }
  _installHitSlop() {
    const rb = this.app.pixi.renderer.events?.rootBoundary; if (!rb) return;
    const orig = rb.hitTest.bind(rb); const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
    rb.hitTest = (x, y) => {
      const t = orig(x, y);
      if (!this.touching || (t && this._isTap(t))) return t;
      const slop = (Prefs.largeUI ? 26 : 20) / Math.max(0.3, Display.scale); // css px -> logical px
      if (slop < 4) return t;
      let best = null, bd = Infinity;
      for (const k of [0.5, 1]) for (const [dx, dy] of dirs) {
        const c = orig(x + dx * slop * k, y + dy * slop * k);
        if (c && this._isTap(c)) { const d = k * k; if (d < bd) { bd = d; best = c; } }
      }
      return best || t;
    };
  }
}
void Container;
