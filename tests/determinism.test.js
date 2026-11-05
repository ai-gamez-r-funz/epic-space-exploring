import test from 'node:test';
import assert from 'node:assert/strict';
import { RNG, hashString, mulberry32 } from '../src/core/rng.js';
import { generateGalaxy } from '../src/core/galaxy.js';
import { newGame, freshStorage, drain } from './helpers.js';

test('rng: same seed same stream; helpers behave', () => {
  const a = new RNG(42); const b = new RNG(42);
  for (let i = 0; i < 50; i++) assert.equal(a.next(), b.next());
  const f = mulberry32(42); const r = new RNG(42);
  assert.equal(f(), r.next());
  const rng = new RNG(7);
  for (let i = 0; i < 200; i++) { const n = rng.int(3, 5); assert.ok(n >= 3 && n <= 5); }
  assert.equal(rng.shuffle([1, 2, 3, 4]).length, 4);
  assert.equal(rng.weighted(['a', 'b'], [0, 1]), 'b');
  assert.notEqual(hashString('a'), hashString('b'));
  const bound = RNG.bound({ rng: 5 });
  assert.ok(bound.next() >= 0);
});

test('galaxy generation is deterministic in the seed', () => {
  assert.deepEqual(generateGalaxy(99), generateGalaxy(99));
  assert.notDeepEqual(generateGalaxy(99).systems.map((s) => s.name), generateGalaxy(100).systems.map((s) => s.name));
});

function script(seed) {
  freshStorage();
  const g = newGame({ seed });
  const trail = [];
  for (let i = 0; i < 120 && g.state.phase === 'play'; i++) {
    if (g.state.pending) { drain(g); continue; }
    const sys = g.here();
    if (sys.planets.some((p) => !p.scanned)) g.scanSystem();
    if (g.state.pending) continue;
    if (sys.station) { g.dock(); if (g.state.pending) continue; g.refuel('max'); g.restock('max'); g.undock(); }
    const nb = g.neighbors().filter((n) => g.canJump(n.id).ok);
    if (!nb.length) { g.rest(1); continue; }
    g.jump(nb[i % nb.length].id);
    trail.push([g.state.day, g.state.pos, g.state.credits, g.state.ship.fuel]);
  }
  return { trail, json: g.save().replace(/"savedAt":\d+,?/, '') };
}

test('full play is deterministic for the same seed and inputs', () => {
  const a = script(77); const b = script(77);
  assert.deepEqual(a.trail, b.trail);
  assert.equal(a.json.length, b.json.length);
  assert.notDeepEqual(script(78).trail, a.trail);
});
