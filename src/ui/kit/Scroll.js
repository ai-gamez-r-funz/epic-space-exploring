import { Container, Graphics, Rectangle } from 'pixi.js';
import { C } from './theme.js';
import { Anim } from './anim.js';
import { Input } from './input.js';
import { Label } from './Label.js';
import { Tooltip } from './Tooltip.js';
import { sfx } from '../services.js';

/**
 * ScrollPane — clipped viewport with wheel + drag + touch (inertia) scrolling and a scrollbar.
 *   const pane = new ScrollPane({ w, h });  pane.content.addChild(...);  pane.refresh() (after content size changes)
 *   pane.scrollTo(y, animate?)  pane.scrollToChild(child)  pane.scrollY
 * Content height is measured from content bounds (+ `bottomPad`). Buttons inside still receive taps; a drag cancels taps.
 */
export class ScrollPane extends Container {
  constructor(o = {}) {
    super();
    this.o = { w: 300, h: 300, bottomPad: 6, bar: true, ...o };
    this.w = this.o.w; this.h = this.o.h;
    this.eventMode = 'static'; this.hitArea = new Rectangle(0, 0, this.w, this.h);
    this.viewport = new Container(); this.addChild(this.viewport);
    this.content = new Container(); this.viewport.addChild(this.content);
    this.maskG = new Graphics().rect(0, 0, this.w, this.h).fill(0xffffff); this.addChild(this.maskG); this.viewport.mask = this.maskG;
    this.barG = new Graphics(); this.addChild(this.barG);
    this.scrollY = 0; this.vel = 0; this.contentH = 0; this._dragging = false; this._barFade = 0;
    this.on('wheel', (e) => { if (this.maxScroll <= 0) return; this.scrollY = this._clamp(this.scrollY + e.deltaY * 0.6); this.vel = 0; this._apply(); this._barFade = 1; e.stopPropagation?.(); });
    this.on('pointerdown', (e) => this._down(e));
    Anim.watch(this, (dt) => this._tick(dt));
    this.refresh();
  }
  get maxScroll() { return Math.max(0, this.contentH - this.h); }
  _clamp(y) { return Math.max(0, Math.min(this.maxScroll, y)); }
  refresh() {
    const b = this.content.getLocalBounds();
    this.contentH = Math.max(0, b.y + b.height) + this.o.bottomPad;
    this.scrollY = this._clamp(this.scrollY); this._apply();
    return this;
  }
  resize(w, h) {
    this.w = w; this.h = h; this.hitArea = new Rectangle(0, 0, w, h);
    this.maskG.clear().rect(0, 0, w, h).fill(0xffffff); this.refresh();
  }
  scrollTo(y, animate = false) {
    y = this._clamp(y);
    if (animate) Anim.to(this, { scrollY: y }, 250, { onUpdate: () => this._apply() }); else { this.scrollY = y; this._apply(); }
  }
  scrollToChild(child) {
    const y = child.y; if (y < this.scrollY) this.scrollTo(y - 4, true); else if (y + (child.h || child.height) > this.scrollY + this.h) this.scrollTo(y + (child.h || child.height) - this.h + 4, true);
  }
  _apply() { this.content.y = -Math.round(this.scrollY); this._drawBar(); }
  _down(e) {
    if (this.maxScroll <= 0) return;
    this.vel = 0; this._dragging = true;
    const ev = e.nativeEvent || e;
    const stop = Input.drag(ev, (dx, dy) => { this.scrollY = this._clamp(this.scrollY - dy); this.vel = -dy * 60; this._apply(); this._barFade = 1; }, () => { this._dragging = false; });
  }
  _tick(dt) {
    if (!this._dragging && Math.abs(this.vel) > 5) { this.scrollY = this._clamp(this.scrollY + this.vel * dt); this.vel *= Math.pow(0.02, dt); this._apply(); }
    if (this._barFade > 0) { this._barFade = Math.max(0, this._barFade - dt * 0.6); this._drawBar(); }
  }
  _drawBar() {
    const g = this.barG; g.clear();
    if (!this.o.bar || this.maxScroll <= 0) return;
    const a = 0.35 + 0.45 * Math.min(1, this._barFade * 3);
    const th = Math.max(24, this.h * (this.h / this.contentH)); const ty = (this.h - th) * (this.scrollY / this.maxScroll);
    g.roundRect(this.w - 6, 2, 4, this.h - 4, 2).fill({ color: 0x000000, alpha: 0.25 });
    g.roundRect(this.w - 6, 2 + ty, 4, th - 4 > 8 ? th - 4 : 8, 2).fill({ color: C.brass, alpha: a });
  }
}

/**
 * ScrollList — vertical selectable list built on ScrollPane.
 *   new ScrollList({ w, h, itemH:40, items:[{id,label,sub?,icon?,right?,color?,disabled?,tooltip?}], selected:id, onSelect(item,i), onActivate(item) , render(item,i,w,h)->Container })
 * setItems(items) rebuilds; select(id) highlights; custom `render` returns a Container drawn at (0,0) size w×itemH.
 */
export class ScrollList extends ScrollPane {
  constructor(o = {}) {
    super({ ...o });
    this.lo = { itemH: 40, gap: 4, items: [], ...o };
    this.rows = []; this.selectedId = o.selected ?? null;
    this.setItems(this.lo.items);
  }
  setItems(items) {
    this.lo.items = items;
    for (const r of this.rows) r.destroy({ children: true });
    this.rows = [];
    const { itemH, gap } = this.lo; const w = this.w - 8;
    items.forEach((it, i) => {
      const row = new Container(); row.item = it; row.y = i * (itemH + gap); row.h = itemH;
      row.eventMode = 'static'; row.cursor = it.disabled ? 'default' : 'pointer';
      const bg = new Graphics(); row.bg = bg; row.addChild(bg);
      const body = this.lo.render ? this.lo.render(it, i, w, itemH) : this._defaultRow(it, w, itemH);
      row.addChild(body);
      row.hitArea = new Rectangle(0, -Math.floor(gap / 2), w, itemH + gap);
      row.hover = false; this._paintRow(row, w, itemH);
      row.on('pointerover', () => { row.hover = true; this._paintRow(row, w, itemH); });
      row.on('pointerout', () => { row.hover = false; this._paintRow(row, w, itemH); });
      row.on('pointertap', () => { if (!Input.clickAllowed() || it.disabled) return; sfx('click'); this.select(it.id, true); });
      if (it.tooltip) Tooltip.attach(row, it.tooltip);
      this.content.addChild(row); this.rows.push(row);
    });
    this.refresh();
    return this;
  }
  _defaultRow(it, w, h) {
    const c = new Container(); let x = 10;
    if (it.icon) { c.addChild(it.icon); const b = it.icon.getLocalBounds(); it.icon.x = x + 11 - (b.x + b.width / 2); it.icon.y = h / 2 - (b.y + b.height / 2); x += 30; }
    const l = new Label({ text: it.label, preset: 'small', size: 16, color: it.disabled ? C.textDim : (it.color ?? C.cream), w: w - x - (it.right ? 90 : 10), fit: true, h: it.sub ? 20 : h });
    l.x = x; l.y = it.sub ? 4 : (h - l.textHeight) / 2; c.addChild(l);
    if (it.sub) { const s = new Label({ text: it.sub, preset: 'tiny', color: C.textDim, w: w - x - 10, maxLines: 1, fit: true, h: 14 }); s.x = x; s.y = 23; c.addChild(s); }
    if (it.right) { const r = new Label({ text: it.right, preset: 'numSm', color: it.rightColor ?? C.brassLight }); r.x = w - r.textWidth - 10; r.y = (h - r.textHeight) / 2; c.addChild(r); }
    return c;
  }
  _paintRow(row, w, h) {
    const sel = row.item.id === this.selectedId; const g = row.bg; g.clear();
    g.roundRect(0, 0, w, h, 8).fill({ color: sel ? C.panelLight : 0x0b0d1e, alpha: sel ? 0.95 : row.hover ? 0.55 : 0.35 });
    if (sel) g.roundRect(0, 0, w, h, 8).stroke({ width: 1.5, color: C.brass });
  }
  select(id, fire = false) {
    this.selectedId = id; const w = this.w - 8;
    this.rows.forEach((r) => this._paintRow(r, w, this.lo.itemH));
    if (fire) { const i = this.lo.items.findIndex((x) => x.id === id); this.lo.onSelect?.(this.lo.items[i], i); }
  }
}
