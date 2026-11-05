import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/game.js';
import { newGame, freshStorage, drain } from './helpers.js';
import * as Save from '../src/core/save.js';

function play(g, n) {
  for (let i = 0; i < n && g.state.phase === 'play'; i++) {
    if (g.state.pending) { drain(g); continue; }
    if (g.here().planets.some((p) => !p.scanned)) { g.scanSystem(); continue; }
    const nb = g.neighbors().filter((x) => g.canJump(x.id).ok);
    if (nb.length) g.jump(nb[i % nb.length].id); else g.rest(1);
  }
}

test('save/load round trip preserves state and continues identically', () => {
  freshStorage();
  const a = newGame({ seed: 21 });
  play(a, 30);
  drain(a);
  const json = a.save();
  const b = Game.load(json, { autosave: false });
  assert.ok(b);
  const strip = (s) => { const c = JSON.parse(JSON.stringify(s)); delete c.savedAt; return c; };
  assert.deepEqual(strip(b.state), strip(a.state));
  play(a, 20); play(b, 20);
  assert.deepEqual(strip(b.state), strip(a.state), 'continued play diverged after load');
});

test('slots: write/read/delete and hasSave (storage injected)', () => {
  freshStorage();
  assert.equal(Game.hasSave(), false);
  const g = newGame();
  assert.ok(Game.writeSave(g, '1').ok);
  assert.ok(Game.hasSave('1'));
  assert.equal(Game.hasSave('2'), false);
  assert.ok(Game.hasSave());
  const info = Game.slotInfo('1');
  assert.equal(info.exists, true); assert.equal(info.day, 1);
  const g2 = Game.loadSlot('1', { autosave: false });
  assert.equal(g2.state.seed, g.state.seed);
  Game.deleteSave('1');
  assert.equal(Game.hasSave('1'), false);
});

test('corrupt or foreign saves are rejected without throwing', () => {
  freshStorage();
  for (const bad of ['', 'not json', '{}', '{"v":99}', JSON.stringify({ v: 1, galaxy: {} }), 'null']) {
    assert.equal(Game.load(bad), null);
  }
  assert.ok(Game.lastLoadError);
});

test('storage unavailable is handled', () => {
  Save.setStorage(null);
  const g = newGame();
  assert.equal(Game.writeSave(g).ok, false);
  assert.equal(Game.readSave(), null);
  assert.equal(Game.hasSave(), false);
  freshStorage();
});

test('legacy bonus accrues after an ending and boosts the next start', () => {
  const m = freshStorage();
  assert.equal(Save.readLegacy().bonus, 0);
  const g = Game.create({ seed: 1, legacy: true, autosave: false });
  const base = g.state.credits;
  g.endGame('wanderer');
  assert.equal(g.state.phase, 'ended');
  assert.ok(g.state.ending.score > 0);
  const lg = Save.readLegacy();
  assert.equal(lg.runs, 1); assert.ok(lg.bonus > 0);
  assert.ok(m.getItem('halcyon.legacy'));
  const g2 = Game.create({ seed: 1, legacy: true, autosave: false });
  assert.equal(g2.state.credits, base + lg.bonus);
  freshStorage();
});

test('after ending, actions are refused politely', () => {
  freshStorage();
  const g = newGame();
  g.endGame('cartographer');
  const n = g.neighbors()[0];
  const r = g.jump(n.id);
  assert.equal(r.ok, false);
  assert.equal(g.rest(1).ok, false);
});
