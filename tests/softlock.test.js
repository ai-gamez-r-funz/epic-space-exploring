import test from 'node:test';
import assert from 'node:assert/strict';
import { playGame } from '../tools/sim.mjs';
import { newGame, freshStorage, drain, teleportForTest } from './helpers.js';
import { Game } from '../src/core/game.js';

test('no soft-lock, no exceptions under random play (25 games)', () => {
  freshStorage();
  for (let seed = 1; seed <= 25; seed++) {
    const r = playGame({ seed, policy: 'random', maxDays: 250, maxSteps: 3000 });
    assert.equal(r.error, null, r.error);
    assert.equal(r.stuck, false, `soft-lock seed ${seed}`);
  }
});

test('policies complete without exceptions (greedy/cautious, 8 games each)', () => {
  freshStorage();
  for (const policy of ['greedy', 'cautious']) for (let seed = 1; seed <= 8; seed++) {
    const r = playGame({ seed, policy, maxDays: 400, maxSteps: 5000 });
    assert.equal(r.error, null, r.error);
    assert.equal(r.stuck, false);
  }
});

test('stranded with no fuel and no money in deep space: emergency tow rescues, never soft-locks', () => {
  freshStorage();
  const g = newGame({ seed: 14 });
  const far = g.state.galaxy.systems.find((s) => !s.station && s.id !== g.state.galaxy.gate);
  teleportForTest(g, far.id);
  g.state.ship.fuel = 0; g.state.credits = 0; g.state.cargo = {}; g.state.ship.supplies = 20;
  g.rest(1); drain(g, 5); // settle: engine should offer the tow
  g.state.pending ? drain(g) : null;
  assert.ok(g.state.ship.fuel > 0, 'tow should leave fuel on board');
  const nb = g.neighbors().filter((n) => g.canJump(n.id).ok);
  assert.ok(nb.length > 0, 'must be able to jump after rescue');
  assert.ok(g.jump(nb[0].id).ok);
});

test('emergency() offers a tow only when stranded', () => {
  freshStorage();
  const g = newGame({ seed: 14 });
  assert.equal(g.emergency().ok, false);
  const far = g.state.galaxy.systems.find((s) => !s.station);
  teleportForTest(g, far.id);
  g.state.ship.fuel = 0;
  const r = g.emergency();
  assert.ok(r.ok);
  assert.equal(g.state.pending.eventId, 'core_tow');
  drain(g);
  assert.ok(g.state.ship.fuel > 0);
  assert.ok(g.state.rep.concord < 0 || g.state.credits === 0 || g.state.credits < 300);
});

test('zero supplies triggers the ration event, not a crash; hull 0 -> recalled; morale 0 -> resignation', () => {
  freshStorage();
  let g = newGame({ seed: 2 });
  g.state.ship.supplies = 0;
  g.rest(1);
  assert.ok(g.state.pending || g.state.ship.supplies > 0);
  drain(g);
  g = newGame({ seed: 2 });
  g.state.ship.hull = 0; g.rest(1);
  assert.equal(g.state.ending && g.state.ending.id, 'recalled');
  g = newGame({ seed: 2 });
  g.state.ship.morale = 0; g._settle();
  assert.equal(g.state.ending && g.state.ending.id, 'resignation');
});

test('actions never throw on garbage input', () => {
  freshStorage();
  Game.strict = false;
  const g = newGame({ seed: 2 });
  const junk = [undefined, null, NaN, -1, 'x', {}, [], 1e9];
  for (const j of junk) {
    for (const m of ['jump', 'enterOrbit', 'scanPlanet', 'landingParty', 'investigate', 'buy', 'sell', 'buyUpgrade', 'sellUpgrade', 'repair', 'refuel', 'restock', 'acceptMission', 'abandonMission', 'hireCrew', 'dismissCrew', 'crewTalk', 'rest', 'resolveChoice']) {
      const r = g[m](j, j);
      assert.equal(typeof r, 'object');
      assert.equal(typeof r.ok, 'boolean');
    }
  }
  Game.strict = true;
});

test('retire: needs survey and a Meridian station; picks an ending', () => {
  freshStorage();
  const g = newGame({ seed: 6 });
  assert.equal(g.retire().ok, false);
  for (const s of g.state.galaxy.systems.slice(0, 25)) g.forceChart(s.id);
  assert.ok(g.surveyProgress().pct >= 50);
  teleportForTest(g, g.state.galaxy.gate); g.dock(); drain(g);
  assert.ok(g.canRetire().ok);
  const r = g.retire();
  assert.ok(r.ok);
  assert.equal(g.state.phase, 'ended');
});

test('survey 100% ends the game with the cartographer ending', () => {
  freshStorage();
  const g = newGame({ seed: 6 });
  for (const s of g.state.galaxy.systems) g.forceChart(s.id);
  g.rest(1); drain(g);
  assert.equal(g.state.ending.id, 'cartographer');
});

test('difficulty changes tuning: cozy is gentler than rigorous', () => {
  freshStorage();
  const c = newGame({ difficulty: 'cozy' }); const r = newGame({ difficulty: 'rigorous' });
  assert.ok(c.state.credits > r.state.credits);
  const a = c.neighbors()[0]; const b = r.neighbors().find((n) => n.id === a.id);
  assert.ok(a.fuelCost <= b.fuelCost);
});
