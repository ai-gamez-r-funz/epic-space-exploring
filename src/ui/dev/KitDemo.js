import { Container, Graphics } from 'pixi.js';
import { Scene } from '../Scene.js';
import * as K from '../kit/index.js';
import { makeBackdrop } from '../widgets/Backdrop.js';

/** Dev-only gallery of every kit widget:  /?scene=KitDemo  — keep in sync with kit/README.md. */
export class KitDemo extends Scene {
  static scene = 'KitDemo';
  async enter() {
    const v = this.view; const { C, W, H } = K;
    this.bg = makeBackdrop({ seed: 3 }); v.addChild(this.bg);
    const t = new K.Label({ text: 'UI KIT GALLERY', preset: 'title', size: 22, color: C.cream }); t.x = 24; t.y = 14; v.addChild(t);
    // buttons
    const p1 = new K.Panel({ w: 400, h: 330, title: 'BUTTONS', pad: 16 }); p1.x = 20; p1.y = 60; v.addChild(p1);
    const variants = ['primary', 'brass', 'teal', 'coral', 'cream', 'ghost'];
    const bs = variants.map((vr, i) => new K.Button({ label: vr, variant: vr, w: 118, h: 42, icon: ['jump', 'scan', 'hail', 'dock', 'star', 'log'][i], onClick: () => K.Toasts.push(`Clicked ${vr}`, { tone: ['good', 'info', 'warn', 'bad'][i % 4] }), tooltip: { title: vr, body: 'A rich tooltip.', rows: [['Variant', vr, 'good']] } }));
    K.grid(bs, { cols: 3, cellW: 118, cellH: 42, gapX: 8, gapY: 8 }); p1.content.addChild(...bs);
    const dis = new K.Button({ label: 'Disabled', w: 180, h: 42, disabled: true, disabledReason: 'Dock first.', hotkey: 'x' }); dis.y = 110; p1.content.addChild(dis);
    const hk = new K.Button({ label: 'Hotkey C', w: 180, h: 42, hotkey: 'c', onClick: () => K.Toasts.push('C pressed') }); hk.x = 190; hk.y = 110; p1.content.addChild(hk);
    const vert = new K.Button({ label: 'Vertical', icon: 'planet', w: 100, h: 92, vertical: true, hotkey: 'v' }); vert.y = 165; p1.content.addChild(vert);
    const ib = new K.IconButton({ icon: 'settings', size: 48, tooltip: 'Icon button' }); ib.x = 120; ib.y = 175; p1.content.addChild(ib);
    const li = new K.Lights({ count: 6 }); li.x = 190; li.y = 190; p1.content.addChild(li);
    // bars
    const p2 = new K.Panel({ w: 330, h: 250, title: 'BARS & SLIDER', tone: 'teal', pad: 16 }); p2.x = 440; p2.y = 60; v.addChild(p2);
    const bars = [['fuel', C.teal, 70], ['supplies', C.mustard, 45], ['hull', C.sage, 15], ['morale', 0xe58fb0, 90]].map(([ic, col, val]) => new K.Bar({ w: 230, h: 18, icon: ic, color: col, value: val }));
    K.vstack(bars, { gap: 12 }); p2.content.addChild(...bars);
    const sl = new K.Slider({ w: 296, label: 'Volume', value: 0.6 }); sl.y = 140; p2.content.addChild(sl);
    const inc = new K.Button({ label: 'Hull -10', w: 130, h: 36, onClick: () => bars[2].set(Math.max(0, bars[2].val - 10)) }); inc.y = 180; p2.content.addChild(inc);
    // choices
    const p3 = new K.Panel({ w: 480, h: 330, title: 'CHOICE LIST', tone: 'deep', pad: 16 }); p3.x = 790; p3.y = 60; v.addChild(p3);
    const cl = new K.ChoiceList({ w: 446, choices: [{ label: 'Pay the toll (20 scrip)', tag: 'trade' }, { label: 'Haggle in the old style', tag: 'persuade', odds: 0.72 }, { label: 'Slip past on a low-power arc', tag: 'flee', odds: 0.33 }, { label: 'Offer star-charts instead', enabled: false, reason: 'Requires item: sector charts' }], onChoose: (i) => K.Toasts.push('Chose ' + (i + 1), { tone: 'good' }) });
    p3.content.addChild(cl);
    // typewriter + tabs + list
    const p4 = new K.Panel({ w: 560, h: 290, title: 'TYPEWRITER & TABS', pad: 16 }); p4.x = 20; p4.y = 410; v.addChild(p4);
    const tabs = new K.Tabs({ w: 528, tabs: [{ id: 'a', label: 'Log' }, { id: 'b', label: 'Cargo' }, { id: 'c', label: 'Notes' }], onChange: () => {} }); p4.content.addChild(tabs);
    tabs.panes.a.addChild(new K.Typewriter({ w: 520, text: 'The kettle whistles twice. Somewhere in the dark, a lantern flickers on. (Click to skip.)', cps: 30, preset: 'body' }));
    tabs.panes.b.addChild(new K.Label({ text: 'Cargo hold: 4/20 — Glass-fruit brandy ×2, ration bars ×2.', w: 520 }));
    tabs.panes.c.addChild(new K.Label({ text: 'Tabs expose one container per pane.', w: 520 }));
    const lst = new K.ScrollList({ w: 330, h: 270, itemH: 40, items: Array.from({ length: 14 }, (_, i) => ({ id: i, label: 'Item ' + (i + 1), sub: 'scroll me', right: String(i * 7) })), onSelect: (it) => K.Toasts.push('Selected ' + it.label) });
    const p5 = new K.Panel({ w: 370, h: 290, title: 'SCROLL LIST', tone: 'plum', pad: 16 }); p5.x = 600; p5.y = 410; v.addChild(p5); p5.content.addChild(lst); lst.h; lst.resize(338, 250);
    const p6 = new K.Panel({ w: 270, h: 290, title: 'MISC', tone: 'indigo', pad: 16 }); p6.x = 990; p6.y = 410; v.addChild(p6);
    const m = new K.Button({ label: 'Open modal', w: 230, h: 40, onClick: () => { const md = new K.Modal({ w: 520, h: 280, title: 'EXAMPLE' }); md.body.addChild(new K.Label({ text: 'Esc closes. Focus is trapped inside.', w: md.bodyW })); md.addButtons([{ label: 'OK', variant: 'primary', onClick: () => md.close() }]); md.open(); } });
    const f = new K.Button({ label: 'Wipe transition', w: 230, h: 40, onClick: async () => { await this.ui.fader.out({ kind: 'wipe', dir: 'right', ms: 500 }); await this.ui.fader.in({ ms: 500 }); } });
    const ti = new K.TextInput({ w: 230, placeholder: 'Text input' });
    const cd = new K.Card({ w: 230, h: 100, title: 'Card', body: 'Selectable', onClick: (c) => c.setSelected(!c.selected) });
    K.vstack([m, f, ti, cd], { gap: 12 }); p6.content.addChild(m, f, ti, cd);
    this.t = 0;
  }
  update(dt) { this.t += dt; this.bg.update(dt, this.t * 8, 0); }
  onEscape() { this.ui.goto('Title'); }
}
