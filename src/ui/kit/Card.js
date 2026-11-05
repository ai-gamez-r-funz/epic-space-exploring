import { Container, Graphics, Rectangle } from 'pixi.js';
import { C, grad, lighten } from './theme.js';
import { Label } from './Label.js';
import { drawPanel } from './draw.js';
import { Tooltip } from './Tooltip.js';
import { Input } from './input.js';
import { S, sfx } from '../services.js';

/**
 * Card — selectable option card (difficulty picker, upgrade tile, etc.).
 *   new Card({ w=220, h=200, title, body, icon, tone:'teal', selected, onClick, tooltip, badge:'★' , hotkey })
 * setSelected(bool). Selected cards glow and lift.
 */
export class Card extends Container {
  constructor(o = {}) {
    super();
    this.o = { w: 220, h: 200, tone: 'indigo', ...o }; this.w = this.o.w; this.h = this.o.h; this.selected = !!o.selected; this.hover = false;
    this.bg = new Graphics(); this.addChild(this.bg);
    this.body = new Container(); this.addChild(this.body);
    let y = 16;
    if (o.icon) { const ic = S.gfx.icon(o.icon, { size: 40, color: o.iconColor ?? C.cream }); const b = ic.getLocalBounds(); ic.x = this.w / 2 - (b.x + b.width / 2); ic.y = y + 20 - (b.y + b.height / 2); this.body.addChild(ic); y += 52; }
    const t = new Label({ text: o.title || '', preset: 'head', size: 15, w: this.w - 28, align: 'center', color: C.cream, upper: true, fit: true, h: 22 }); t.x = 14; t.y = y; this.body.addChild(t); y += 32;
    if (o.body) { const b = new Label({ text: o.body, preset: 'small', size: 15, w: this.w - 32, align: 'center', color: C.cream, h: this.h - y - 10, fit: true }); b.x = 16; b.y = y; this.body.addChild(b); }
    this.eventMode = 'static'; this.cursor = 'pointer'; this.hitArea = new Rectangle(0, 0, this.w, this.h);
    this.on('pointerover', () => { this.hover = true; this._draw(); sfx('hover'); }); this.on('pointerout', () => { this.hover = false; this._draw(); });
    this.on('pointertap', () => { if (Input.clickAllowed()) { sfx('click'); o.onClick?.(this); } });
    if (o.tooltip) Tooltip.attach(this, o.tooltip);
    if (o.hotkey) Input.bind(this, o.hotkey, () => { sfx('click'); o.onClick?.(this); });
    this._draw();
  }
  setSelected(s) { this.selected = !!s; this._draw(); }
  _draw() {
    const g = this.bg; const tone = this.selected ? this.o.selTone || 'teal' : this.o.tone;
    drawPanel(g, this.w, this.h, { radius: 14, tone: this.hover || this.selected ? tone : this.o.tone, trim: this.selected ? 4 : 3, shadow: true });
    if (this.selected) g.roundRect(-3, -3, this.w + 6, this.h + 6, 17).stroke({ width: 3, color: C.brassLight });
    this.body.y = this.selected ? -2 : 0;
  }
}
