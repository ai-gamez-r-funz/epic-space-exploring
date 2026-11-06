import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGalaxy, isConnected, bfs, adjacency, MAX_LANE, laneLength } from '../src/core/galaxy.js';
import { C } from '../src/core/content.js';

test('galaxy: 42 systems, connected, sane for 60 seeds', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const g = generateGalaxy(seed);
    assert.equal(g.systems.length, 42);
    assert.ok(isConnected(g), `seed ${seed} disconnected`);
    assert.ok(g.lanes.length >= 41);
    const ids = new Set(g.systems.map((s) => s.id));
    assert.equal(ids.size, 42);
    for (const s of g.systems) {
      assert.ok(s.x >= 0 && s.x <= g.w && s.y >= 0 && s.y <= g.h);
      assert.ok(s.danger >= 0 && s.danger <= 3);
      for (const p of s.planets) assert.ok(p.id && p.type && p.size > 0);
    }
    // lane lengths stay jumpable
    for (const [a, b] of g.lanes) assert.ok(laneLength(g, a, b) < MAX_LANE * 1.5);
    // fuel stops: every system within 2 hops of a repair station
    const adj = adjacency(g);
    for (const s of g.systems) {
      const d = bfs(g, s.id, adj);
      assert.ok(g.systems.some((t) => d[t.id] <= 2 && t.station && t.station.services.includes('repair')), `seed ${seed}: ${s.name} has no fuel stop in 2 hops`);
    }
  }
});

test('galaxy: story systems placed in their regions with start at the gate', () => {
  for (const seed of [3, 11, 29]) {
    const g = generateGalaxy(seed);
    for (const def of C.STORY_SYSTEMS) {
      const s = g.systems.find((x) => x.story === def.id);
      assert.ok(s, `story system ${def.id} missing (seed ${seed})`);
      assert.equal(s.region, def.region);
      assert.equal(s.name, def.name);
      assert.equal(s.planets.length, (def.planets || []).length);
      if (def.phenomena.includes('beacon')) assert.ok(s.phenomena.includes('beacon'));
    }
    const gate = g.systems.find((s) => s.id === g.gate);
    assert.equal(gate.story, C.STORY_SYSTEMS.find((d) => d.start).id);
    assert.equal(gate.status, 'visited');
  }
});

test('galaxy: lantern sites get farther from the gate in order', () => {
  const g = generateGalaxy(5);
  const d = bfs(g, g.gate);
  const hop = (id) => d[g.systems.find((s) => s.story === id).id];
  assert.ok(hop('lantern_wick') <= hop('lantern_brightwater'));
  assert.ok(hop('lantern_brightwater') <= hop('lantern_taper'));
});
