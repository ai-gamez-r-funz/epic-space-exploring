// Shared drawing helpers for the retrofuturist console look.
import { Graphics } from 'pixi.js';
import { C, grad, mix, lighten, darken } from './theme.js';

export const TONES = {
  indigo: { top: 0x2d3375, bot: 0x1c2152, trim: C.brass },
  deep:   { top: 0x1a1e47, bot: 0x0f1230, trim: C.brassDark },
  teal:   { top: 0x24807c, bot: 0x15494f, trim: C.brass },
  coral:  { top: 0xb8483e, bot: 0x7a2a2a, trim: C.brassLight },
  mustard:{ top: 0xe8b53a, bot: 0xb98a1c, trim: C.brassDark },
  cream:  { top: 0xf6ebc8, bot: 0xdccb98, trim: C.brassDark },
  plum:   { top: 0x59397a, bot: 0x35224f, trim: C.brass },
};

/** Draw a brass-trimmed rounded console panel onto an (empty) Graphics. */
export function drawPanel(g, w, h, { radius = 14, tone = 'indigo', trim = 3, rivets = false, shadow = true, alpha = 1 } = {}) {
  const t = TONES[tone] || TONES.indigo;
  g.clear();
  if (shadow) g.roundRect(2, 5, w, h, radius).fill({ color: 0x000000, alpha: 0.35 });
  // outer brass ring
  g.roundRect(0, 0, w, h, radius).fill({ color: t.trim });
  g.roundRect(0, 0, w, h, radius).fill(grad([[0, lighten(t.trim, 0.35)], [0.45, t.trim], [1, darken(t.trim, 0.45)]]));
  // inner face
  const i = trim;
  g.roundRect(i, i, w - i * 2, h - i * 2, Math.max(2, radius - i)).fill({ color: darken(t.bot, 0.5) });
  g.roundRect(i + 1, i + 1, w - i * 2 - 2, h - i * 2 - 2, Math.max(2, radius - i - 1)).fill(grad([[0, t.top], [1, t.bot]]));
  g.alpha = alpha;
  // top sheen
  g.roundRect(i + 3, i + 2, w - i * 2 - 6, Math.min(18, h * 0.12), Math.max(2, radius - 6)).fill({ color: 0xffffff, alpha: 0.06 });
  if (rivets) for (const [x, y] of [[9, 9], [w - 9, 9], [9, h - 9], [w - 9, h - 9]]) {
    g.circle(x, y, 2.6).fill({ color: darken(t.trim, 0.5) });
    g.circle(x - 0.6, y - 0.8, 1.4).fill({ color: lighten(t.trim, 0.4), alpha: 0.9 });
  }
  return g;
}

/** Recessed dark screen (for viewscreens, lists): inner shadow + subtle border. */
export function drawWell(g, w, h, { radius = 10, color = C.deep, border = C.brassDark, alpha = 1 } = {}) {
  g.clear();
  g.roundRect(0, 0, w, h, radius).fill({ color: darken(color, 0.4), alpha });
  g.roundRect(1.5, 1.5, w - 3, h - 3, radius - 1).fill({ color, alpha });
  g.roundRect(1.5, 1.5, w - 3, h - 3, radius - 1).stroke({ width: 1.5, color: border, alpha: 0.9 });
  g.roundRect(3, 3, w - 6, h - 6, radius - 2).stroke({ width: 2, color: 0x000000, alpha: 0.35 });
  return g;
}

/** Glossy console button face. */
export function drawButtonFace(g, w, h, { face, trim = C.brassDark, radius = 10, state = 'idle', glow = 0 }) {
  g.clear();
  const hov = state === 'hover' ? 0.12 : state === 'press' ? -0.12 : 0;
  const f = hov >= 0 ? lighten(face, hov) : darken(face, -hov);
  if (glow > 0) g.roundRect(-3, -3, w + 6, h + 6, radius + 3).fill({ color: lighten(face, 0.3), alpha: 0.28 * glow });
  g.roundRect(0, state === 'press' ? 1 : 3, w, h - (state === 'press' ? 1 : 0), radius).fill({ color: 0x000000, alpha: 0.4 });
  g.roundRect(0, 0, w, h, radius).fill({ color: trim });
  g.roundRect(1.5, 1.5, w - 3, h - 3, radius - 1).fill(grad([[0, lighten(f, 0.22)], [0.5, f], [1, darken(f, 0.28)]]));
  g.roundRect(4, 3, w - 8, (h - 6) * 0.42, radius - 3).fill({ color: 0xffffff, alpha: 0.16 });
  return g;
}

/** Pill / badge background. */
export function drawPill(g, w, h, color, { alpha = 1, stroke } = {}) {
  g.clear();
  g.roundRect(0, 0, w, h, h / 2).fill({ color, alpha });
  if (stroke) g.roundRect(0, 0, w, h, h / 2).stroke({ width: 1.5, color: stroke });
  return g;
}

export function makeGraphics() { return new Graphics(); }
export { mix, lighten, darken };
