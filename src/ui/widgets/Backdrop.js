import { Container, Graphics } from 'pixi.js';
import { S } from '../services.js';
import { W, H } from '../kit/theme.js';

/** Starfield (+optional nebula/vignette) background container with update(dt, camX, camY). */
export function makeBackdrop({ w = W, h = H, seed = 7, hue, nebula = true, density = 1, vignette = true } = {}) {
  const c = new Container(); const parts = [];
  const sf = S.gfx.starfield({ w, h, seed, density, parallax: 1 }); c.addChild(sf); parts.push(sf);
  if (nebula) { try { const nb = S.gfx.nebula({ w, h, seed: seed + 3, hue }); nb.alpha = 0.55; c.addChildAt(nb, 1); parts.push(nb); } catch (e) { /* optional */ } }
  if (vignette) { try { const v = S.gfx.vignette(w, h); if (v) c.addChild(v); } catch (e) { /* optional */ } }
  c.update = (dt, cx, cy) => { for (const p of parts) p.update?.(dt, cx, cy); };
  return c;
}
