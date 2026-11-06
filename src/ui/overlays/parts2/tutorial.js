// Tutorial hint layer: a pulsing ring + speech bubble that walks a new captain through chart -> jump -> scan -> hail -> dock.
// Lives in its own layer (below modals, above scenes). Progress persisted via Tutorial ('halcyon.tutorial').
import { Container, Graphics, Rectangle } from 'pixi.js';
import { C, W, H } from '../../kit/theme.js';
import { Label } from '../../kit/Label.js';
import { Button } from '../../kit/Button.js';
import { drawPanel } from '../../kit/draw.js';
import { Tutorial } from './prefs.js';

const STEPS = [
  { id: 'chart', scene: 'Bridge', text: 'Open the Chart to see the Lantern Reach and plan your first jump.', key: 'C', target: (s) => s.cmds?.chart, done: (g, sc) => sc === 'GalaxyMap' },
  { id: 'jump', scene: 'GalaxyMap', text: 'Click a nearby system, then plan your jump. Teal lanes are in range; watch the fuel cost.', key: 'Enter', target: (s) => (s.planBtn?.visible ? s.planBtn : s.side || null), done: (g, sc, base) => g.state.stats.jumps > base.jumps },
  { id: 'scan', scene: 'Bridge', text: 'Pick a planet on the viewscreen, then Scan it to learn what lives there. Scanning every planet charts a system.', key: 'S', target: (s) => s.cmds?.scan, done: (g, sc, base) => g.state.stats.planetsScanned > base.scanned },
  { id: 'hail', scene: 'Bridge', text: 'Somebody lives here. Hail them: courtesy costs nothing and often pays.', key: 'H', target: (s) => (s.cmds?.hail?.enabled ? s.cmds.hail : null), done: () => false },
  { id: 'dock', scene: 'Bridge', text: 'Dock at the station to trade, repair, refuel and pick up missions.', key: 'D', target: (s) => (s.cmds?.dock?.enabled ? s.cmds.dock : null), done: (g) => !!g.state.docked },
];
export const TUTORIAL_STEPS = STEPS;

export class TutorialHints {
  constructor(ui, layer) {
    this.ui = ui; this.layer = layer; this.ring = new Graphics(); this.bubble = null; this.key = ''; this.t = 0; this.wrapped = new WeakSet();
    layer.addChild(this.ring); this.ring.eventMode = 'none';
    Tutorial.on(() => { this.key = ''; });
  }
  get step() { return STEPS[Tutorial.state.step]; }
  _clear() { this.bubble?.destroy({ children: true }); this.bubble = null; this.ring.clear(); this.key = ''; }
  _base() {
    const g = this.ui.game; if (!g) return { jumps: 0, scanned: 0 };
    if (this._baseFor !== g || this._baseStep !== Tutorial.state.step) { this._baseFor = g; this._baseStep = Tutorial.state.step; this._b = { jumps: g.state.stats.jumps || 0, scanned: g.state.stats.planetsScanned || 0 }; }
    return this._b;
  }
  _advance() {
    Tutorial.advance(); this.ui.sfx('confirm');
    if (Tutorial.state.step >= STEPS.length) { Tutorial.finish(); this.ui.toast('That is the grand tour. Press F1 any time for help.', 'good'); }
    this._clear();
  }
  _watchTap(btn) {
    if (!btn || this.wrapped.has(btn)) return; this.wrapped.add(btn);
    const orig = btn.onClick; const step = Tutorial.state.step;
    btn.onClick = (b) => { orig?.(b); if (Tutorial.enabled && Tutorial.state.step === step) setTimeout(() => { if (Tutorial.state.step === step) this._advance(); }, 120); };
  }
  update(dt) {
    this.t += dt; const ui = this.ui; const g = ui.game;
    const active = Tutorial.enabled && g && !g.state.pending && !ui.busy && ui.overlays.length === 0 && ui.scene && !ui._glitch && this.step && (ui.sceneName === 'Bridge' || ui.sceneName === 'GalaxyMap');
    if (!active) { if (this.bubble || this.key) this._clear(); return; }
    const st = this.step, scene = ui.scene;
    if (st.done(g, ui.sceneName, this._base())) { this._advance(); return; }
    if (ui.sceneName !== st.scene) { if (this.bubble) this._clear(); return; }
    const target = st.target(scene);
    if (!target || target.destroyed || !target.visible) { if (this.bubble) this._clear(); return; }
    if (st.id !== 'jump') this._watchTap(target); else this._watchTap(target);
    const key = st.id + ':' + Tutorial.state.step;
    if (key !== this.key) this._build(st, key);
    this._place(target);
  }
  _build(st, key) {
    this._clear(); this.key = key;
    const bw = 330; const b = new Container(); b.eventMode = 'static';
    const txt = new Label({ text: st.text, preset: 'small', size: 15, color: C.cream, w: bw - 32, lineHeight: 20 });
    const head = new Label({ text: `TIP ${Tutorial.state.step + 1} OF ${STEPS.length}`, preset: 'headSm', size: 10, color: C.mustard });
    const bh = 16 + 16 + 8 + txt.textHeight + 12 + 36 + 14;
    const g = new Graphics(); drawPanel(g, bw, bh, { radius: 12, tone: 'deep', trim: 2 }); b.addChild(g);
    head.x = 16; head.y = 14; txt.x = 16; txt.y = 36; b.addChild(head, txt);
    const kb = new Label({ text: `Hotkey ${st.key}`, preset: 'tiny', size: 12, color: C.tealLight }); kb.x = bw - kb.textWidth - 16; kb.y = 14; b.addChild(kb);
    const by = bh - 48;
    const skip = new Button({ label: 'Next tip', w: 100, h: 34, fontSize: 13, variant: 'ghost', upper: false, onClick: () => this._advance() }); skip.x = 16; skip.y = by; b.addChild(skip);
    const off = new Button({ label: 'Hide tips', w: 100, h: 34, fontSize: 13, variant: 'ghost', upper: false, onClick: () => { Tutorial.setEnabled(false); this.ui.toast('Tips hidden. Turn them back on in Settings.', 'info'); this._clear(); } }); off.x = 124; off.y = by; b.addChild(off);
    this.layer.addChild(b); this.bubble = b; b.bw = bw; b.bh = bh; b.alpha = 0; this._fade = 0;
  }
  _place(target) {
    const p = this.layer.toLocal({ x: 0, y: 0 }, target); const tw = target.w || target.width, th = target.h || target.height; const b = this.bubble; if (!b) return;
    const cx = p.x + tw / 2, cy = p.y + th / 2; this._fade = Math.min(1, this._fade + 0.06); b.alpha = this._fade;
    const pulse = 0.5 + 0.5 * Math.sin(this.t * 4); const r = this.ring; r.clear();
    r.roundRect(p.x - 5 - pulse * 3, p.y - 5 - pulse * 3, tw + 10 + pulse * 6, th + 10 + pulse * 6, 14).stroke({ width: 3, color: C.mustard, alpha: 0.9 - pulse * 0.4 });
    let bx, by;
    if (cx > 700 && p.y < 560) { bx = p.x - b.bw - 28; by = cy - b.bh / 2; }             // right-hand panels: bubble to the LEFT so it never hides the info
    else if (p.y > 500) { bx = Math.max(180, cx - b.bw / 2); by = 528 - b.bh + Math.sin(this.t * 3) * 3; } // command bar: float over the viewscreen, clear of crew list + strip
    else if (p.y < 100) { bx = cx - b.bw / 2; by = p.y + th + 22; }
    else { bx = cx - b.bw / 2; by = p.y - b.bh - 22; }
    bx = Math.max(10, Math.min(W - b.bw - 10, bx)); by = Math.max(10, Math.min(H - b.bh - 10, by)); b.x = Math.round(bx); b.y = Math.round(by);
    // pointer notch (points at the target; stem drawn when the bubble floats away from it)
    const nx = Math.max(bx + 24, Math.min(bx + b.bw - 24, cx)); const bxr = bx + b.bw;
    if (by + b.bh < p.y - 2) { r.moveTo(nx, by + b.bh).lineTo(nx, p.y - 6).stroke({ width: 2, color: C.brass, alpha: 0.8 }); r.poly([nx - 9, by + b.bh - 1, nx + 9, by + b.bh - 1, nx, by + b.bh + 10]).fill({ color: C.brass }); }
    else if (by > p.y + th) r.poly([nx - 10, by + 1, nx + 10, by + 1, nx, by - 11]).fill({ color: C.brass });
    else if (bxr < p.x) r.poly([bxr - 1, cy - 10, bxr - 1, cy + 10, bxr + 11, cy]).fill({ color: C.brass });
    else r.poly([bx + 1, cy - 10, bx + 1, cy + 10, bx - 11, cy]).fill({ color: C.brass });
  }
}
void Rectangle;
