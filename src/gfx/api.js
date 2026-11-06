import { Container, Graphics } from 'pixi.js';
import { palette, FACTION_COLOURS } from './palette.js';
import { createStarfield, createNebula, createStar, nebulaTexture, STAR_COL } from './space.js';
import { createPlanet, bakePlanet, prebakePlanet } from './planets.js';
import { createPhenomenon } from './phenomena.js';
import { createShip } from './ships.js';
import { createPortrait } from './portraits.js';
import { createSceneArt, createStation } from './scenes.js';
import { createIcon, createGoodIcon, createFactionEmblem, ICON_NAMES } from './icons.js';
import { createVignette, createScanlines, createPanelBg } from './decor.js';
import { glowSprite, rng, TAU } from './util.js';
import { createRewardBadge, rewardBurst, rewardStyle, REWARD_STYLE, createLaneGlow, createMapMarker } from './feedback.js';

let _app = null;

/** Sparkle: scatter n twinkling stars over `container` (self-animated via app ticker). */
export function sparkle(container, n = 8, { color = 0xfff1c8, w, h } = {}) {
  const b = container.getLocalBounds ? container.getLocalBounds() : { x: 0, y: 0, width: 60, height: 60 };
  const W = w ?? (b.width || 60), H = h ?? (b.height || 60), X = b.x || 0, Y = b.y || 0;
  const R = rng((Math.random() * 1e9) | 0);
  const layer = new Container(); layer.eventMode = 'none';
  const list = [];
  for (let i = 0; i < n; i++) { const s = glowSprite(color, R.range(2, 5), 0, 1.6); s.position.set(X + R() * W, Y + R() * H); list.push({ s, ph: R() * TAU, sp: R.range(1, 3) }); layer.addChild(s); }
  let t = 0;
  layer.update = (dt) => { t += dt; for (const o of list) o.s.alpha = Math.max(0, Math.sin(t * o.sp + o.ph)) ** 2; };
  container.addChild(layer);
  if (_app) { const fn = (tk) => { if (layer.destroyed || !layer.parent) { _app.ticker.remove(fn); return; } layer.update(tk.deltaMS / 1000); }; _app.ticker.add(fn); }
  return layer;
}

/** Burst: a short self-destroying particle puff at x,y (add the returned container to your stage). */
export function burst(x = 0, y = 0, color = palette.brass, count = 14) {
  const c = new Container(); c.position.set(x, y); c.eventMode = 'none';
  const R = rng((Math.random() * 1e9) | 0), ps = [];
  for (let i = 0; i < count; i++) { const s = glowSprite(color, R.range(3, 7), 1, 1.7); const a = R() * TAU, v = R.range(30, 120); ps.push({ s, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20 }); c.addChild(s); }
  let t = 0;
  c.update = (dt) => { t += dt; for (const p of ps) { p.s.x += p.vx * dt; p.s.y += p.vy * dt; p.vx *= 0.95; p.vy = p.vy * 0.95 + 40 * dt; p.s.alpha = Math.max(0, 1 - t / 0.9); p.s.scale.set(p.s.scale.x * 0.99); } if (t > 0.95 && !c.destroyed) { if (c._fn && _app) _app.ticker.remove(c._fn); c.destroy({ children: true }); } };
  if (_app) { c._fn = (tk) => { if (c.destroyed) { _app.ticker.remove(c._fn); return; } c.update(tk.deltaMS / 1000); }; _app.ticker.add(c._fn); }
  return c;
}

export const gfx = {
  init(app) { _app = app || null; return gfx; },
  palette,
  starfield: createStarfield,
  nebula: createNebula,
  planet: createPlanet,
  star: createStar,
  phenomenon: createPhenomenon,
  ship: createShip,
  portrait: createPortrait,
  sceneArt: createSceneArt,
  icon: createIcon,
  goodIcon: createGoodIcon,
  factionEmblem: createFactionEmblem,
  sparkle, burst,
  vignette: createVignette,
  scanlines: createScanlines,
  panelBg: createPanelBg,
  // extras
  rewardStyle, rewardStyles: REWARD_STYLE,
  rewardBadge: createRewardBadge,
  rewardBurst: (kind, x, y, negative) => rewardBurst(burst, kind, x, y, negative),
  laneGlow: createLaneGlow,
  mapMarker: createMapMarker,
  station: createStation,
  iconNames: ICON_NAMES,
  factionColours: FACTION_COLOURS,
  starColours: STAR_COL,
  prebake(type, seed, life) { return bakePlanet(type, seed, life); },
  /** non-blocking (8ms slices) bake; returns a Promise */
  prebakeAsync(type, seed, life) { return prebakePlanet(type, seed, life); },
  nebulaTexture,
};

export { palette, createStarfield as starfield, createNebula as nebula, createPlanet as planet, createStar as star, createPhenomenon as phenomenon, createShip as ship, createPortrait as portrait, createSceneArt as sceneArt, createIcon as icon, createGoodIcon as goodIcon, createFactionEmblem as factionEmblem, createVignette as vignette, createScanlines as scanlines, createPanelBg as panelBg, createStation as station };
export const init = gfx.init;
export const rewardBadge = createRewardBadge, laneGlow = createLaneGlow, mapMarker = createMapMarker;
export { rewardStyle };
void Graphics;
