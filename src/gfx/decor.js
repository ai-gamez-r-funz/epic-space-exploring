import { Container, Sprite, Graphics, Texture, TilingSprite } from 'pixi.js';
import { makeCanvas, LRU } from './util.js';
import { palette } from './palette.js';

const P = palette;
const cache = new LRU(12);
export function createVignette(w, h, strength = 0.65) {
  const key = `v${strength}`;
  const tex = cache.memo(key, () => {
    const S = 256, c = makeCanvas(S, S), g = c.getContext('2d');
    const gr = g.createRadialGradient(S / 2, S / 2, S * 0.28, S / 2, S / 2, S * 0.72);
    gr.addColorStop(0, 'rgba(5,6,16,0)'); gr.addColorStop(0.6, `rgba(5,6,16,${strength * 0.35})`); gr.addColorStop(1, `rgba(5,6,16,${strength})`);
    g.fillStyle = gr; g.fillRect(0, 0, S, S); return Texture.from(c);
  });
  const s = new Sprite(tex); s.width = w; s.height = h; s.eventMode = 'none'; return s;
}
export function createScanlines(w, h, alpha = 0.08) {
  const tex = cache.memo('scan', () => {
    const c = makeCanvas(2, 4), g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, 2, 4); g.fillStyle = 'rgba(0,0,0,1)'; g.fillRect(0, 2, 2, 1.2); g.fillStyle = 'rgba(120,200,220,0.35)'; g.fillRect(0, 0, 2, 1);
    return Texture.from(c);
  });
  const t = new TilingSprite({ texture: tex, width: w, height: h }); t.alpha = alpha; t.eventMode = 'none';
  t.update = (dt) => { t.tilePosition.y += dt * 4; };
  return t;
}
const TONES = {
  panel: [P.panel, P.panelLight, 0x0f1330], light: [P.panelLight, 0x3a4a88, 0x1b2140], dark: [0x11152e, 0x1b2140, 0x070914],
  brass: [0x8a6a2a, P.brass, 0x5a4010], teal: [0x1f5f6a, 0x2f8a96, 0x0d2a34], coral: [0x8a3a34, P.coral, 0x4a1a18],
};
export function createPanelBg(w, h, { tone = 'panel', radius = 14, rivets = true, bevel = true } = {}) {
  const [base, hi, lo] = TONES[tone] || TONES.panel;
  const g = new Graphics();
  g.roundRect(0, 0, w, h, radius).fill(lo);
  g.roundRect(1, 1, w - 2, h - 2, radius - 1).fill(base);
  // soft sheen gradient via stacked bands
  const bands = 8;
  for (let i = 0; i < bands; i++) {
    const t = i / bands, a = 0.09 * (1 - t) * (1 - t);
    g.roundRect(2, 2 + i * (h * 0.04), w - 4, h * 0.5 - i * (h * 0.04), Math.max(2, radius - 2)).fill({ color: hi, alpha: a });
  }
  g.roundRect(2, h * 0.62, w - 4, h * 0.38 - 2, Math.max(2, radius - 2)).fill({ color: 0x000000, alpha: 0.14 });
  if (bevel) {
    g.roundRect(1.5, 1.5, w - 3, h - 3, radius - 1).stroke({ width: 1.2, color: hi, alpha: 0.55 });
    g.moveTo(radius, h - 1.5).lineTo(w - radius, h - 1.5).stroke({ width: 1.6, color: 0x000000, alpha: 0.4 });
    g.roundRect(4.5, 4.5, w - 9, h - 9, Math.max(2, radius - 4)).stroke({ width: 0.8, color: 0xffffff, alpha: 0.07 });
  }
  if (rivets && w > 60 && h > 40) {
    const o = Math.max(6, radius * 0.55);
    for (const [x, y] of [[o, o], [w - o, o], [o, h - o], [w - o, h - o]]) { g.circle(x, y, 2.4).fill(0x6a4a1a); g.circle(x, y - 0.3, 2).fill(P.brass); g.circle(x - 0.6, y - 0.9, 0.8).fill({ color: 0xfff6d8, alpha: 0.9 }); }
  }
  g.eventMode = 'none';
  return g;
}
