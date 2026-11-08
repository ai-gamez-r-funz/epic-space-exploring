// Static reachability: every authored event must be eligible in SOME generated world state (best case: rich, all flags/items,
// every system/planet/phenomenon context, both morale extremes). Catches impossible `when` conditions (typos, wrong ctx, bad ids).
import test from 'node:test';
import assert from 'node:assert/strict';
import { C } from '../src/core/content.js';
import { evalConds } from '../src/core/conds.js';
import { newGame } from './helpers.js';

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const flagsIn = (list, out = new Set()) => { for (const c of list || []) { if (c.notFlag) out.add(c.notFlag); if (c.not) flagsIn([c.not], out); if (c.any) flagsIn(c.any, out); } return out; };

const ALL_FLAGS = new Set();
const ALL_COUNTERS = new Set();
const grab = (list) => { for (const c of list || []) { if (c.counter) for (const k of Object.keys(c.counter)) ALL_COUNTERS.add(k); if (c.flag) ALL_FLAGS.add(c.flag); if (c.not) grab([c.not]); if (c.any) grab(c.any); } };
for (const e of C.EVENTS) { grab(e.when); for (const n of Object.values(e.nodes)) for (const c of n.choices || []) grab(c.if); }

// state variants: late/rich/happy, early/poor/gloomy, late/rich/gloomy
const VARIANTS = [
  (st, forbid) => { st.day = 120; st.credits = 9999; st.ship.morale = 100; st.ship.hull = st.ship.hullMax; st.ship.fuel = st.ship.fuelMax; st.ship.supplies = st.ship.suppliesMax;
    for (const fl of ALL_FLAGS) { if (forbid.has(fl)) delete st.flags[fl]; else st.flags[fl] = true; }
    for (const id of Object.keys(C.ITEM_DEFS)) st.items[id] = 3;
    for (const x of C.GOODS) st.cargo[x.id] = 3;
    st.upgrades = C.UPGRADES.map((u) => u.id); st.codex = C.CODEX.map((c) => c.id);
    for (const f of Object.keys(st.rep)) st.rep[f] = 60;
    st.missions.done = C.MISSIONS.map((m) => m.id); st.counters.rival_friend = 5; for (const k of ALL_COUNTERS) st.counters[k] = 5; },
  (st) => { st.day = 3; st.credits = 0; st.ship.morale = 10; st.flags = {}; st.items = {}; st.cargo = {}; st.upgrades = []; st.codex = []; for (const f of Object.keys(st.rep)) st.rep[f] = 0; st.missions.done = []; st.counters.rival_friend = 0; },
  (st, forbid) => { st.day = 120; st.credits = 9999; st.ship.morale = 10;
    for (const fl of ALL_FLAGS) { if (forbid.has(fl)) delete st.flags[fl]; else st.flags[fl] = true; }
    for (const id of Object.keys(C.ITEM_DEFS)) st.items[id] = 3; st.items.door_token = 0; st.ship.fuel = 1; st.ship.hull = 20; for (const k of ALL_COUNTERS) st.counters[k] = 5; },
];

function contextsFor(g, e) {
  const out = [];
  for (const s of g.state.galaxy.systems) {
    const base = { systemId: s.id };
    if (e.ctx === 'planet' || e.ctx === 'landing') for (const p of s.planets) { out.push({ ...base, planetId: p.id }); for (const f of p.features) out.push({ ...base, planetId: p.id, feature: f }); }
    else if (e.ctx === 'phenomenon') for (const ph of s.phenomena) out.push({ ...base, phenomenon: ph });
    else if (e.ctx === 'hail') { out.push({ ...base, factionId: s.faction }); if (s.station) out.push({ ...base, factionId: s.station.faction }); }
    else out.push(base);
  }
  return out;
}

test('reachability: every authored event can become eligible somewhere', () => {
  const games = SEEDS.map((seed) => newGame({ seed }));
  const dead = [];
  for (const e of C.EVENTS) {
    let ok = false;
    const allNot = flagsIn(e.when);
    for (const g of games) {
      const st = g.state;
      g.surveyProgress = () => ({ pct: 100, charted: 1, total: 1 });
      for (const variant of VARIANTS) {
        variant(st, allNot);
        for (const ctx of contextsFor(g, e)) {
          st.pos = ctx.systemId;
          for (const rival of [false, true]) {
            st.rival = rival ? { name: 'T', systemId: ctx.systemId, prevId: null, goodId: 'curios', nextMoveDay: 99, lastMetDay: -99 } : null;
            if (evalConds(g, e.when || [], ctx, { noRandom: true }).ok) { ok = true; break; }
          }
          if (ok) break;
        }
        if (ok) break;
      }
      if (ok) break;
    }
    if (!ok) dead.push(e.id);
  }
  assert.deepEqual(dead, [], 'events with an unsatisfiable `when` in every sampled world: ' + dead.join(', '));
});

import { eligible } from '../src/core/events.js';
import { teleportForTest } from './helpers.js';

test('reachability: key events are eligible in a fresh game at the real place (not only in a rich dream state)', () => {
  const g = newGame({ seed: 5 });
  const sys = g.state.galaxy.systems.find((s) => s.story === 'archive_heart');
  assert.ok(sys, 'archive_heart system exists');
  teleportForTest(g, sys.id);
  const vault = sys.planets.find((p) => p.features.includes('ruins'));
  assert.ok(vault, 'Heart Vault has ruins');
  vault.scanned = true;
  const ids = eligible(g, 'landing', { systemId: sys.id, planetId: vault.id }).map((e) => e.id);
  assert.ok(ids.includes('archive_heart_ledger'), 'ledger eligible when landing at the Heart Vault: ' + ids.join(','));
  // idle vignettes with no gating are eligible on a fresh game
  const idle = eligible(g, 'idle', { systemId: sys.id }).map((e) => e.id);
  for (const id of ['idle_movie_night', 'idle_tea_in_the_lounge', 'idle_slide_rules', 'idle_coolant_leak', 'idle_observation_deck_stars']) assert.ok(idle.includes(id), `${id} idle-eligible`);
  // every region has authored hails in the fresh state
  for (const region of ['gate', 'shoals', 'veil', 'choir', 'archive', 'rim']) {
    const s = g.state.galaxy.systems.find((x) => x.region === region && x.faction !== 'none');
    if (!s) continue;
    const hails = eligible(g, 'hail', { systemId: s.id, factionId: s.faction }).filter((e) => /^hail_r_/.test(e.id));
    assert.ok(hails.length, `region ${region} has an eligible hail_r_* (${s.faction})`);
  }
});
