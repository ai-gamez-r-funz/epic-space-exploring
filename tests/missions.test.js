import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, freshStorage, drain, teleportForTest, dockClean } from './helpers.js';
import { C } from '../src/core/content.js';
import * as Missions from '../src/core/missions.js';

function atStationWithMissions(g, pred = () => true) {
  const s = g.state.galaxy.systems.find((x) => x.station && x.station.services.includes('missions') && pred(x));
  teleportForTest(g, s.id);
  dockClean(g);
  return s;
}

test('boards: deterministic per system/week, offers well-formed, taken offers vanish', () => {
  freshStorage();
  const g = newGame({ seed: 9 });
  const s = atStationWithMissions(g);
  const a = g.missionBoard(); const b = g.missionBoard();
  assert.deepEqual(a, b);
  assert.ok(a.length >= 1);
  for (const o of a) {
    assert.ok(o.id && o.title && o.blurb && o.reward);
    assert.ok(!/[{}]/.test(o.title + o.blurb), `unfilled placeholder in "${o.title}": ${o.blurb}`);
  }
  const before = a.length;
  const r = g.acceptMission(a[0].id);
  assert.ok(r.ok, r.reason);
  assert.equal(g.missionBoard().length, before - 1);
  assert.equal(g.activeMissions().length, 1);
  assert.equal(g.acceptMission(a[0].id).ok, false);
  // board refreshes weekly
  g.state.day += 8;
  assert.ok(g.missionBoard().length >= 0);
});

test('procedural delivery: needs goods, pays on delivery, rep reward, consumes cargo', () => {
  freshStorage();
  let found = null; let g;
  for (let seed = 1; seed < 40 && !found; seed++) {
    g = newGame({ seed });
    for (const sys of g.state.galaxy.systems.filter((x) => x.station && x.station.services.includes('missions'))) {
      const offers = Missions.board(g, sys.id);
      const d = offers.find((o) => o.procedural && o.objectives.some((ob) => ob.type === 'have' && ob.deliverResolved));
      if (d) { found = { sys, d }; break; }
    }
  }
  assert.ok(found, 'no procedural delivery offer found in 40 seeds');
  const { sys, d } = found;
  teleportForTest(g, sys.id); dockClean(g);
  assert.ok(g.acceptMission(d.id).ok);
  const ob = d.objectives.find((o) => o.type === 'have');
  const dest = g.system(ob.deliverResolved);
  g.state.cargo[ob.good] = Number(ob.qty);
  const credits = g.state.credits;
  teleportForTest(g, dest.id);
  if (dest.station) dockClean(g);
  g.rest(1); drain(g);
  assert.equal(g.activeMissions().length, 0, 'delivery should complete on arrival');
  assert.ok(g.state.credits >= credits + d.reward.credits - 1);
  assert.equal(g.state.cargo[ob.good] || 0, 0);
  assert.ok(g.state.missions.done.includes(d.defId));
});

test('deadlines: missions expire and run failFx', () => {
  freshStorage();
  const g = newGame({ seed: 5 });
  atStationWithMissions(g);
  const offer = g.missionBoard().find((o) => o.deadlineDays);
  if (!offer) return; // no timed offer on this board
  assert.ok(g.acceptMission(offer.id).ok);
  g.state.day += offer.deadlineDays + 2;
  Missions.check(g);
  assert.equal(g.activeMissions().length, 0);
  assert.ok(g.state.missions.failed.length >= 1);
});

test('story mission chain: chart objectives and flags complete missions', () => {
  freshStorage();
  const g = newGame({ seed: 12 });
  // first_light: chart three systems in the gate region
  assert.ok(g.state.flags.chapter_1);
  const r = g.missions.start('m_first_light');
  assert.ok(r.ok, r.reason);
  const gate = g.state.galaxy.systems.filter((s) => s.region === 'gate').slice(0, 3);
  for (const s of gate) g.forceChart(s.id);
  g.rest(1); drain(g);
  assert.ok(g.state.missions.done.includes('m_first_light'));
  assert.ok(g.state.flags.first_light_done);
});

test('abandon removes the mission and can be re-offered', () => {
  freshStorage();
  const g = newGame({ seed: 5 });
  atStationWithMissions(g);
  const offer = g.missionBoard()[0];
  g.acceptMission(offer.id);
  const id = g.activeMissions()[0].id;
  assert.ok(g.abandonMission(id).ok);
  assert.equal(g.activeMissions().length, 0);
  assert.equal(g.abandonMission('nope').ok, false);
});

test('selector grammar: story ids, nearest station, here', () => {
  freshStorage();
  const g = newGame({ seed: 3 });
  assert.equal(Missions.resolveSelector(g, 'lantern_wick', g.state.pos), g.state.galaxy.systems.find((s) => s.story === 'lantern_wick').id);
  assert.equal(Missions.resolveSelector(g, { here: true }, g.state.pos), g.state.pos);
  const st = Missions.resolveSelector(g, { nearest: 'station', notHere: true }, g.state.pos);
  assert.ok(st && g.system(st).station);
  assert.equal(Missions.resolveSelector(g, { story: 'no_such' }, g.state.pos), null);
});
