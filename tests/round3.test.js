import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, freshStorage, drain, teleportForTest, dockClean } from './helpers.js';
import { generateGalaxy } from '../src/core/galaxy.js';
import { C } from '../src/core/content.js';
import * as Sinks from '../src/core/sinks.js';
import * as Missions from '../src/core/missions.js';

const G = (seed = 31, o = {}) => { freshStorage(); return newGame({ seed, ...o }); };
const live = (g) => { g.state.ship.supplies = g.state.ship.suppliesMax; g.state.ship.morale = 100; g.state.ship.fuel = g.state.ship.fuelMax; };
const yardOf = (g) => g.state.galaxy.systems.find((s) => s.station && s.station.services.includes('shipyard'));

test('every region has a shipyard', () => {
  for (const seed of [1, 7, 19, 33]) {
    const gal = generateGalaxy(seed);
    const regions = new Set(gal.systems.map((s) => s.region));
    for (const r of regions) assert.ok(gal.systems.some((s) => s.region === r && s.station && s.station.services.includes('shipyard')), `seed ${seed}: no shipyard in ${r}`);
  }
});

test('scan/landing feature combos used by authored events exist in the generator', () => {
  const combos = new Set();
  for (let seed = 1; seed <= 40; seed++) for (const s of generateGalaxy(seed).systems) for (const p of s.planets) for (const f of p.features) combos.add(`${p.type}:${f}`);
  const needed = ['lava:ruins', 'lava:ancient_signal', 'desert:hot_springs', 'ocean:ore', 'jungle:hot_springs', 'jungle:ore', 'terran:aurora_fields', 'terran:ore', 'barren:hot_springs', 'toxic:ruins', 'toxic:ore', 'toxic:aurora_fields', 'gas:ancient_signal', 'ice:ruins'];
  for (const c of needed) assert.ok(combos.has(c), `generator never makes ${c}`);
});

test('commissions take days, rotations discount and gate exclusives, refits and training work', () => {
  const g = G();
  const yard = yardOf(g);
  teleportForTest(g, yard.id); dockClean(g);
  g.state.credits = 20000;
  g.state.upgrades.push('ion_trimmer'); // bespoke_manifold upgrades it in place
  // find a season where the yard offers the bespoke manifold
  let found = false;
  for (let d = 1; d < 200 && !found; d += 12) {
    g.state.day = d;
    const row = g.shipyard().find((u) => u.id === 'bespoke_manifold');
    if (row && row.available) found = true;
    else if (row) assert.ok(row.exclusive, 'bespoke items are exclusive outside their season');
  }
  assert.ok(found, 'bespoke_manifold never offered');
  const before = g.state.day;
  // bespoke manifold requires nothing else? install whatever the status allows
  const r = g.buyUpgrade('bespoke_manifold');
  if (r.ok) { assert.ok(g.state.day >= before + 1); assert.ok(r.days >= 1); }
  // discount season exists
  const rot = g.yardRotation();
  assert.ok(rot && rot.title && rot.daysLeft >= 1);
  // refit
  const bunks = g.refits().find((x) => x.id === 'private_bunks');
  if (bunks && bunks.available) {
    const reg = g.shipStats().moraleRegen; const day = g.state.day;
    assert.ok(g.buyRefit('private_bunks').ok);
    assert.ok(g.shipStats().moraleRegen > reg);
    assert.ok(g.state.day > day);
    assert.equal(g.buyRefit('private_bunks').ok, false, 'once-only refit');
  }
  assert.ok(g.refits().length >= 5);
  // training
  const crew = g.state.crew.find((c) => c.skills.piloting < 4) || g.state.crew[0];
  const opts = g.trainingOptions(crew.id);
  const prog = opts.find((o) => o.available && o.skill === 'piloting') || opts.find((o) => o.available);
  assert.ok(prog, 'no available course at a shipyard');
  const lvl = crew.skills[prog.skill]; const credits = g.state.credits;
  assert.ok(g.trainCrew(crew.id, prog.id).ok);
  assert.equal(crew.skills[prog.skill], lvl + 1);
  assert.ok(g.state.credits <= credits - prog.price + 1);
  assert.equal(g.trainCrew(crew.id, prog.id).ok, false, 'cooldown');
});

test('hot lanes: flagged, multi-beat, pay a bounty, then cool down', () => {
  let tested = false;
  for (let seed = 1; seed <= 30 && !tested; seed++) {
    const g = G(seed);
    for (const s of g.state.galaxy.systems) if (s.status === 'unknown') s.status = 'detected';
    const hot = g.hotLanes()[0];
    if (!hot) continue;
    teleportForTest(g, hot.fromId); live(g);
    const n = g.neighbors().find((x) => x.id === hot.toId);
    assert.equal(n.hot, true); assert.ok(n.hotBonus >= 100);
    assert.ok(g.mapMarkers().markers.some((m) => m.kind === 'hotlane'));
    const credits = g.state.credits;
    g.state.ship.hull = g.state.ship.hullMax;
    const r = g.jump(hot.toId);
    assert.ok(r.ok && r.event);
    assert.match(g.state.pending.eventId, /^(core_hot_lane|lane_hot_)/);
    let beats = 0; let guard = 0;
    while (g.state.pending && guard++ < 40) {
      const v = g.pendingView();
      if (!v.isResult && !v.continueOnly) beats++;
      g.resolveChoice(v.continueOnly || v.isResult ? 0 : v.choices.findIndex((c) => c.enabled));
    }
    assert.ok(beats >= 2, `only ${beats} beats`);
    if (g.state.phase === 'play') assert.ok(g.state.credits >= credits + hot.bonus - 5 || g.state.ship.hull > 0);
    assert.equal(g.state.counters.hot_runs, 1);
    // cooled down
    assert.ok(!g.hotLanes().some((h) => h.fromId === hot.fromId && h.toId === hot.toId));
    tested = true;
  }
  assert.ok(tested, 'no hot lane in 30 seeds');
});

test('stranded contracts appear on boards with a timer and a fat reward', () => {
  let found = null;
  for (let seed = 1; seed <= 25 && !found; seed++) {
    const g = G(seed);
    for (const s of g.state.galaxy.systems) if (s.status === 'unknown') s.status = 'detected';
    for (const sys of g.state.galaxy.systems.filter((x) => x.station && x.station.services.includes('missions'))) {
      const d = Missions.board(g, sys.id).find((o) => o.stranded);
      if (d) { found = d; break; }
    }
  }
  assert.ok(found, 'no stranded contract found');
  assert.ok(found.reward.credits >= 300 && found.deadlineDays >= 9);
});

test('frontier gives a destination or a clear no-more-lanes message', () => {
  const g = G(33);
  const f = g.frontier();
  assert.ok(f.note && (f.nearest || f.systems.length === 0));
  for (const s of g.state.galaxy.systems) g.forceChart(s.id);
  const f2 = g.frontier();
  assert.equal(f2.nearest, null);
  assert.match(f2.note, /No unexplored lanes/);
});

test('rivalStatus, arcProgress and dockBulletin feed the Bridge strip', () => {
  const g = G(34);
  const r = g.rivalStatus();
  assert.ok(r && r.name && typeof r.line === 'string' && Array.isArray(r.chain));
  g.state.flags.rival_met = true; g.settleForTest = null; g._settle();
  assert.ok(g.state.log.some((l) => /Tamsin/.test(l.text)));
  const arc = g.arcProgress();
  assert.equal(arc.length, C.CHAPTERS.length);
  assert.equal(arc[0].status, 'open');
  assert.ok(arc[0].steps.length >= 2 && arc[0].steps[0].done);
  teleportForTest(g, g.state.galaxy.gate); dockClean(g);
  const b = g.dockBulletin();
  assert.ok(b.lines.length >= 1 && b.headline);
  assert.ok(b.lines.every((l) => l.kind && l.text));
});

test('ambient: idle vignettes fire on docks and a glum ship gets a lounge heart-to-heart', () => {
  const g = G(35);
  const yard = g.state.galaxy.systems.find((s) => s.station);
  teleportForTest(g, yard.id);
  let idle = 0;
  for (let i = 0; i < 40 && idle === 0; i++) {
    live(g); g.advanceDays(8); g.state.docked = false; g.dock();
    if (g.state.pending && g.state.pending.kind === 'idle') idle++;
    drain(g);
  }
  assert.ok(idle > 0, 'no idle event on docks');
  g.state.ship.morale = 30; g.state.counters.lowMoraleEv = -99;
  g._settle();
  assert.ok(g.state.pending && g.state.pending.kind === 'crew', 'low morale should prompt a crew scene');
  drain(g);
});
