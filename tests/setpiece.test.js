// The Night of a Thousand Lamps must fire on the first Pennywhistle arrival while its mission is active.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, drain, teleportForTest } from './helpers.js';
import { C } from '../src/core/content.js';

test('set piece fires deterministically on arrival at Pennywhistle (20 seeds)', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const g = newGame({ seed });
    const st = g.state;
    const pw = st.galaxy.systems.find((s) => s.story === 'pennywhistle');
    assert.ok(pw, `seed ${seed}: pennywhistle exists`);
    const lane = st.galaxy.lanes.find(([a, b]) => a === pw.id || b === pw.id);
    const start = { id: lane && (lane[0] === pw.id ? lane[1] : lane[0]) };
    assert.ok(start, `seed ${seed}: pennywhistle has a lane`);
    teleportForTest(g, start.id);
    st.day = 20; st.ship.fuel = st.ship.fuelMax;
    g.system(pw.id).status = 'detected';
    assert.ok(C.MISSIONS.find((m) => m.id === 'm_setpiece_night_of_lamps'));
    st.missions.active.push({ id: 'm_setpiece_night_of_lamps', defId: 'm_setpiece_night_of_lamps', title: 'x', objectives: [{ id: 'o2', type: 'event', event: 'setpiece_night_of_lamps', text: 'x', done: false }], reward: {}, onComplete: [], failFx: [] });
    g.state.pending = null;
    g.jump(pw.id);
    drain(g);
    assert.ok(st.evt.seen.setpiece_night_of_lamps, `seed ${seed}: set piece fired`);
  }
});
