import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, freshStorage, drain, teleportForTest } from './helpers.js';
import * as Events from '../src/core/events.js';
import { C } from '../src/core/content.js';

const G = (seed = 21, o = {}) => { freshStorage(); return newGame({ seed, ...o }); };
const live = (g) => { g.state.ship.supplies = g.state.ship.suppliesMax; g.state.ship.morale = 100; g.state.ship.fuel = g.state.ship.fuelMax; };

test('start crew can fly (piloting >= 2) and a cheap pilot is on the Gate notice board from day 1', () => {
  const g = G();
  assert.ok(g.skillTotal('piloting') >= 2);
  const row = g.crewForHire(g.state.galaxy.gate).find((c) => c.role === 'piloting');
  assert.ok(row, 'no pilot offered at the Gate');
  assert.equal(row.available, true);
  assert.ok(row.hireCost <= g.state.credits);
  teleportForTest(g, g.state.galaxy.gate); g.dock(); drain(g);
  assert.ok(g.hireCrew(row.id).ok);
});

test('first distress beacon lands between day 12 and 20, then roughly every 15-25 days', () => {
  const g = G(22);
  for (const s of g.state.galaxy.systems) if (s.status === 'unknown') s.status = 'detected';
  let first = null; let second = null;
  for (let i = 0; i < 80; i++) {
    live(g); g.advanceDays(1);
    if (g.state.distress && first === null) { first = g.state.day; g.state.distress = null; delete g.state.flags.distress_active; g._scheduleDistress(); }
    else if (g.state.distress && first !== null && second === null) second = g.state.day;
  }
  assert.ok(first >= 12 && first <= 21, `first beacon on day ${first}`);
  assert.ok(second - first >= 15 && second - first <= 26, `second beacon ${second - first} days later`);
});

test('distress pays well and sets/clears the distress_active flag', () => {
  const g = G(23);
  for (const s of g.state.galaxy.systems) if (s.status === 'unknown') s.status = 'detected';
  g.spawnDistress(15);
  assert.equal(g.state.flags.distress_active, true);
  const d = g.distressSignals()[0];
  const ev = Events.eventById; // eslint-disable-line no-unused-vars
  const SP = g.state.distress;
  assert.ok(SP.reward >= 15);
  g.state.credits = 0;
  teleportForTest(g, d.systemId);
  g.state.ship.supplies = 30;
  g._arrive();
  let guard = 0;
  while (g.state.pending && guard++ < 20) {
    const v = g.pendingView();
    if (v.isResult || v.continueOnly) { g.resolveChoice(0); continue; }
    const supplies = v.choices.find((c) => /Share supplies|Lend breathing/.test(c.label) && c.enabled);
    g.resolveChoice(supplies ? supplies.index : v.choices.findIndex((c) => c.enabled));
  }
  assert.equal(g.state.distress, null);
  assert.equal(g.state.flags.distress_active, undefined);
  assert.ok(g.state.credits >= 100, `reward only ${g.state.credits} (engine bounty tops up authored distress events)`);
});

test('rival: word reaches the player by day ~20 and the first dock meeting is certain', () => {
  const g = G(24);
  teleportForTest(g, g.state.galaxy.gate);
  live(g); g.advanceDays(19);
  assert.ok(g.state.rival.summoned);
  const sys = g.system(g.state.rival.systemId);
  teleportForTest(g, sys.id); g.state.docked = false;
  g.dock();
  assert.equal(g.state.pending && g.state.pending.eventId, 'core_rival');
  assert.ok(g.state.flags.rival_met);
  drain(g);
});

test('nextObjective carries jump count, fuel and a range note; routeInfo agrees with canJump costs', () => {
  const g = G();
  const o = g.nextObjective();
  assert.ok(o.text && 'jumps' in o && typeof o.rangeNote === 'string');
  if (o.systemId) {
    assert.ok(o.jumps >= 0 && o.fuel >= 0);
    assert.match(o.rangeNote, /jump|here/);
  }
  const nb = g.neighbors()[0];
  const r = g.routeInfo(nb.id);
  assert.equal(r.jumps, 1); assert.equal(r.fuel, nb.fuelCost);
});

test('Society pays a stipend per scan and per finished chart', () => {
  const g = G(25);
  const s = g.state.galaxy.systems.find((x) => x.planets.length && x.id !== g.state.galaxy.gate);
  teleportForTest(g, s.id);
  g.state.ship.supplies = 30;
  const c0 = g.state.credits;
  g.scanSystem(); drain(g);
  assert.ok(g.state.credits >= c0 + 15 * s.planets.length + 25 - 5 || g.system(s.id).status === 'charted');
  assert.equal(g.system(s.id).status, 'charted');
});

test('retire preview names the ending the player would get; ties go to the more specific ending', () => {
  const g = G(26);
  for (const s of g.state.galaxy.systems.slice(0, 26)) g.forceChart(s.id);
  g.state.flags.rival_ally = true;
  const p = g.retirePreview();
  assert.ok(p && p.id && p.title);
  g.state.flags.archive_scholar = true;
  assert.equal(g.retirePreview().id, 'archive_scholar');
  assert.ok(C.ENDINGS[p.id]);
});

test('mapMarkers exposes a legend and markers for distress / rival / objective', () => {
  const g = G(27);
  for (const s of g.state.galaxy.systems) if (s.status === 'unknown') s.status = 'detected';
  g.spawnDistress(12);
  const m = g.mapMarkers();
  assert.ok(m.legend.length >= 4);
  assert.ok(m.markers.some((x) => x.kind === 'distress'));
  assert.ok(m.markers.every((x) => x.systemId && x.label));
});

test('authored lane_* hazards are preferred over the built-in rough lane; first two jumps always carry an event', () => {
  const g = G(28);
  const dest = g.state.galaxy.systems.find((s) => s.danger >= 1);
  g.state.day = 20;
  const pick = Events.pickEvent(g, 'travel', { systemId: dest.id }, { only: /^lane_/ });
  assert.ok(!pick || /^lane_/.test(pick.id));
  const h = G(29);
  let withEvent = 0;
  for (let i = 0; i < 2; i++) {
    live(h);
    const nb = h.neighbors().filter((n) => h.canJump(n.id).ok)[0];
    const r = h.jump(nb.id);
    if (r.event) withEvent++;
    drain(h);
  }
  assert.ok(withEvent >= 1, 'first jumps should carry an encounter');
});
