// Shared test helpers.
import { Game } from '../src/core/game.js';
import { setStorage, memoryStorage } from '../src/core/save.js';

export function freshStorage() { const m = memoryStorage(); setStorage(m); return m; }
Game.strict = true; // internal errors should fail tests loudly

export function newGame(opts = {}) {
  return Game.create({ seed: 1234, captainName: 'Tester', shipName: 'Halcyon', difficulty: 'standard', legacy: false, autosave: false, ...opts });
}

/** Resolve whatever event is pending by always taking the first enabled choice. */
export function drain(g, max = 60) {
  let n = 0;
  while (g.state.pending && n++ < max) {
    const v = g.pendingView();
    const c = v.continueOnly ? { index: 0 } : v.choices.find((x) => x.enabled);
    g.resolveChoice(c ? c.index : 0);
  }
}

/** Walk to a system by id along known lanes, refuelling for free if needed (test convenience). */
export function teleportForTest(g, id) {
  const s = g.system(id);
  g.state.pos = id; g.state.orbit = null; g.state.docked = false;
  if (s.status === 'unknown' || s.status === 'detected') s.status = 'visited';
}

export function stationSystem(g, service = 'trade') {
  return g.state.galaxy.systems.find((s) => s.station && s.station.services.includes(service));
}

/** dock and clear any station event that pops up */
export function dockClean(g) { const r = g.dock(); drain(g); return r; }
