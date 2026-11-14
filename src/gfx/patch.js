// Pixi 8.22 leak fix: Graphics.destroy({children:true}) (any non-empty options object) does NOT destroy the Graphics'
// owned GraphicsContext, so the renderer's graphicsContext system keeps every context + its batches alive forever
// (~100 Graphics per system visit => ~1.5 MB/jump). Always destroy an owned context along with its Graphics.
import { Graphics } from 'pixi.js';

if (!Graphics.prototype.__ctxLeakPatched) {
  const orig = Graphics.prototype.destroy;
  Graphics.prototype.destroy = function patchedDestroy(options) {
    const owned = this._ownedContext;
    orig.call(this, options);
    if (owned && !owned.destroyed) { try { owned.destroy(); } catch (e) { /* already gone */ } }
  };
  Graphics.prototype.__ctxLeakPatched = true;
}
