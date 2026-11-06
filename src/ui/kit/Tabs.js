import { Container, Graphics } from 'pixi.js';
import { C } from './theme.js';
import { Button } from './Button.js';
import { Input } from './input.js';

/**
 * Tabs — row of toggle buttons + one content Container per tab.
 *   const tabs = new Tabs({ w, tabs:[{id:'a',label:'Cargo',icon?}], selected:'a', onChange(id), tabH:36 });
 *   tabs.panes.a.addChild(...)   // each pane sits below the tab row at (0, tabH+8)
 *   tabs.select(id)  tabs.current  ; Ctrl-free hotkeys: Q / E cycle previous/next when cycleKeys:true.
 */
export class Tabs extends Container {
  constructor(o = {}) {
    super();
    this.o = { w: 400, tabH: 36, gap: 6, ...o };
    this.buttons = {}; this.panes = {}; this.current = null;
    const n = this.o.tabs.length; const bw = o.tabW || Math.floor((this.o.w - this.o.gap * (n - 1)) / n);
    this.o.tabs.forEach((t, i) => {
      const b = new Button({ label: t.label, icon: t.icon, w: bw, h: this.o.tabH, variant: 'ghost', fontSize: 14, toggle: false, onClick: () => this.select(t.id, true), tooltip: t.tooltip });
      b.x = i * (bw + this.o.gap); this.addChild(b); this.buttons[t.id] = b;
      const p = new Container(); p.y = this.o.tabH + 10; p.visible = false; this.addChild(p); this.panes[t.id] = p;
    });
    if (this.o.cycleKeys) { Input.bind(this, 'e', () => this.step(1)); Input.bind(this, 'q', () => this.step(-1)); }
    this.select(o.selected ?? this.o.tabs[0]?.id);
  }
  step(d) { const ids = this.o.tabs.map((t) => t.id); const i = ids.indexOf(this.current); this.select(ids[(i + d + ids.length) % ids.length], true); }
  select(id, fire = false) {
    if (id == null) return;
    this.current = id;
    for (const k in this.buttons) { this.buttons[k].setSelected(k === id); this.buttons[k].setVariant(k === id ? 'brass' : 'ghost'); this.panes[k].visible = k === id; }
    if (fire) this.o.onChange?.(id);
  }
}
