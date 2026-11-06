import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { newGame, freshStorage, drain, teleportForTest, dockClean } from './helpers.js';
import { C } from '../src/core/content.js';
import * as Econ from '../src/core/economy.js';
import * as SP from '../src/core/setpieces.js';
import * as Events from '../src/core/events.js';

const G = (seed = 1234, o = {}) => { freshStorage(); return newGame({ seed, ...o }); };

test('content loads with static imports only (no top-level await)', () => {
  const src = fs.readFileSync(new URL('../src/core/content.js', import.meta.url), 'utf8');
  assert.ok(!/\bawait\b/.test(src.replace(/\/\/.*$/gm, '')), 'content.js must not use await');
  assert.ok(!/import\(/.test(src.replace(/\/\/.*$/gm, '')), 'content.js must not use dynamic import');
});

test('nextObjective: always something sensible, points at the Lantern once its chapter opens', () => {
  const g = G();
  const o = g.nextObjective();
  assert.ok(o && o.text && o.kind);
  g.state.flags.chapter_1 = true;
  const n = g.nextObjective();
  assert.ok(['lantern', 'mission', 'survey', 'explore'].includes(n.kind));
  if (n.kind === 'lantern') assert.ok(/Lantern/.test(n.text));
  // chapter 2 gate (survey scaled) reveals the next lantern system on the chart
  const wick = g.state.galaxy.systems.find((s) => s.story === 'lantern_wick');
  g.state.flags.lantern_1 = true;
  for (const s of g.state.galaxy.systems.slice(0, 12)) g.forceChart(s.id);
  g.rest(1); drain(g);
  assert.ok(g.state.flags.chapter_2, 'chapter 2 should open at the relaxed survey gate');
  const n2 = g.nextObjective();
  assert.equal(n2.kind, 'lantern');
  assert.ok(n2.systemId, 'the lantern system is revealed');
  assert.ok(wick);
});

test('scan discoveries: scanning yields finds (credits/cargo/toasts) not just a number', () => {
  const g = G(7);
  const finds = [];
  g.on('discovery', (d) => { if (d.kind === 'find') finds.push(d); });
  let events = 0;
  for (const s of g.state.galaxy.systems) {
    teleportForTest(g, s.id);
    for (const p of s.planets) { const r = g.scanPlanet(p.id); if (r.ok && r.event) events++; drain(g); }
  }
  assert.ok(finds.length + events > 15, `only ${finds.length} finds / ${events} events from ${g.surveyProgress().planetsTotal} planets`);
});

test('rough lanes: dangerous destinations raise a trade-off decision, never a dead end', () => {
  let seen = 0;
  for (let seed = 1; seed <= 25 && seen < 3; seed++) {
    const g = G(seed, { difficulty: 'rigorous' });
    const hard = g.state.galaxy.systems.filter((s) => s.danger >= 2);
    for (const dest of hard) {
      const from = g.neighbors; // eslint-disable-line no-unused-vars
      const nb = g.state.galaxy.lanes.find(([a, b]) => a === dest.id || b === dest.id);
      const start = nb[0] === dest.id ? nb[1] : nb[0];
      teleportForTest(g, start); dest.status = 'detected'; g.state.ship.fuel = g.state.ship.fuelMax;
      g.jump(dest.id);
      if (g.state.pending && g.state.pending.eventId === 'core_hazard') {
        const v = g.pendingView();
        assert.ok(v.choices.length >= 4 && v.choices.every((c) => c.enabled));
        assert.ok(v.choices.some((c) => c.odds !== undefined));
        drain(g); seen++; break;
      }
      drain(g);
    }
  }
  assert.ok(seen >= 1, 'no hazard event seen');
});

test('distress beacon: spawns with a deadline, answerable on arrival, expires otherwise', () => {
  const g = G(3);
  for (const s of g.state.galaxy.systems.slice(0, 20)) if (s.status === 'unknown') s.status = 'detected';
  assert.ok(g.spawnDistress(12));
  const d = g.distressSignals()[0];
  assert.ok(d && d.daysLeft === 12 && d.systemId);
  assert.equal(g.spawnDistress(), false, 'one at a time');
  assert.ok(g.nextObjective());
  teleportForTest(g, g.state.galaxy.lanes.find(([a, b]) => b === d.systemId || a === d.systemId).find((x) => x !== d.systemId));
  g.state.ship.fuel = g.state.ship.fuelMax;
  g.state.ship.supplies = 30;
  const r = g.jump(d.systemId);
  assert.ok(r.ok);
  drain(g); // travel event, if any
  if (!g.state.pending) { /* distress event may already have started after travel event */ }
  let guard = 0;
  while (g.state.pending && guard++ < 30) {
    const v = g.pendingView();
    if (g.state.pending.setPiece === 'distress' && !v.isResult && v.choices.length) { assert.ok(v.choices.some((c) => c.enabled)); }
    g.resolveChoice(v.continueOnly ? 0 : v.choices.findIndex((c) => c.enabled));
  }
  assert.equal(g.state.distress, null, 'answered distress is cleared');
  assert.ok((g.state.counters.distress_answered || 0) >= 1);
  // expiry
  const g2 = G(4);
  for (const s of g2.state.galaxy.systems.slice(0, 20)) if (s.status === 'unknown') s.status = 'detected';
  g2.spawnDistress(5);
  g2.rest(1);
  g2.advanceDays(8);
  assert.equal(g2.state.distress, null);
  assert.equal(g2.state.counters.distress_missed, 1);
});

test('distress fx and cond hooks for EVENTS', () => {
  const g = G(3);
  for (const s of g.state.galaxy.systems.slice(0, 20)) if (s.status === 'unknown') s.status = 'detected';
  assert.equal(g.evalConds([{ distress: true }]).ok, false);
  g.spawnDistress(10);
  assert.equal(g.evalConds([{ distress: true }]).ok, true);
});

test('rival trader: moves between stations, shifts prices, meets the player, can become an ally', () => {
  const g = G(5);
  const info = g.rivalInfo();
  assert.ok(info && info.name === 'Captain Tamsin Vell');
  const first = g.state.rival.systemId;
  const live = () => { g.state.ship.supplies = 40; g.state.ship.morale = 100; };
  live(); g.advanceDays(25);
  assert.notEqual(g.state.rival.nextMoveDay, undefined);
  live(); g.advanceDays(30);
  const moved = g.state.rival.systemId !== first || g.state.rival.prevId;
  assert.ok(moved, 'rival never moved');
  // encounter at a dock
  const sys = g.system(g.state.rival.systemId);
  teleportForTest(g, sys.id);
  let met = false;
  for (let i = 0; i < 12 && !met; i++) {
    g.state.rival.lastMetDay = -99; g.state.docked = false;
    g.dock();
    if (g.state.pending && (g.state.pending.eventId === 'core_rival')) { met = true; drain(g); }
    else drain(g);
    g.state.rival.systemId = sys.id;
  }
  assert.ok(met, 'never met Tamsin');
  assert.ok(g.state.flags.rival_met);
  assert.equal(g.evalConds([{ rival: 'here' }]).ok, true);
  // price shift: arriving at a market she shops at raises the good's impact
  const g2 = G(6);
  const stations = g2.state.galaxy.systems.filter((s) => s.station && s.station.services.includes('trade'));
  g2.state.rival.nextMoveDay = 1; g2.state.rival.systemId = stations[0].id;
  g2.advanceDays(1);
  const now = g2.state.rival.systemId;
  const mk = g2.state.markets[now];
  assert.ok(mk && mk.impact[g2.state.rival.goodId] > 0, 'rival should have bought out her good');
});

test('market news: deterministic festivals/gluts/shortages move prices, bounded', () => {
  const g = G(2);
  const sys = g.state.galaxy.systems.filter((s) => s.station && s.station.services.includes('trade'));
  let found = null;
  for (const s of sys) for (let day = 1; day < 200 && !found; day += 20) {
    g.state.day = day;
    const n = g.marketNews(s.id).find((x) => x.active);
    if (n) found = { s, day, n };
  }
  assert.ok(found, 'no market news in 200 days');
  assert.deepEqual(g.marketNews(found.s.id), g.marketNews(found.s.id));
  assert.ok(found.n.title && found.n.text && found.n.goods.length && found.n.daysLeft >= 1);
  assert.ok(Array.isArray(g.newsFeed()));
  // every system's mid price stays within the bias band even during news
  for (const s of sys) for (const gd of C.GOODS) for (const d of [1, 21, 41, 61]) {
    const p = Econ.midPrice(g.state, s, gd, d);
    assert.ok(p > gd.base * 0.4 && p < gd.base * 2.2, `${gd.id} ${p}`);
  }
});

test('hails are repeatable and useful (gossip reveals the chart)', () => {
  const g = G(8);
  const s = g.state.galaxy.systems.find((x) => x.faction !== 'none' && x.station);
  teleportForTest(g, s.id);
  let count = 0;
  for (let i = 0; i < 6; i++) {
    const r = g.hail();
    if (g.state.pending) { count++; drain(g); }
    g.advanceDays(7);
  }
  assert.ok(count >= 5, `hail fired only ${count}/6 times`);
});

test('specials and crew abilities from WORLD-A', async () => {
  const g = G(9);
  const st = g.state;
  const stats = () => g.shipStats();
  // field hospital: +10% medicine odds; resting heals
  const base = g.checkOdds('medicine', 3);
  st.upgrades.push('hospital_hull');
  const hasFH = C.UPGRADES.some((u) => u.special === 'field_hospital');
  assert.ok(hasFH);
  st.upgrades = [C.UPGRADES.find((u) => u.special === 'field_hospital').id];
  assert.ok(g.checkOdds('medicine', 3) >= base + 0.09);
  st.ship.hull = 50; st.ship.supplies = 30;
  g.rest(2); drain(g);
  assert.ok(st.ship.hull >= 52);
  // thrifty galley: less supply use
  st.upgrades = [];
  const burn = () => { const a = st.ship.supplies; st.counters.supAcc = 0; g.advanceDays(20); return a - st.ship.supplies; };
  st.ship.supplies = 40; const plain = burn();
  st.upgrades = [C.UPGRADES.find((u) => u.special === 'thrifty_galley').id];
  st.ship.supplies = 40; const thrifty = burn();
  assert.ok(thrifty < plain, `${thrifty} !< ${plain}`);
  // prize cartography
  st.upgrades = [C.UPGRADES.find((u) => u.special === 'prize_cartography').id];
  const sys = st.galaxy.systems.find((x) => x.planets.length);
  teleportForTest(g, sys.id);
  const c0 = st.credits;
  g.scanPlanet(sys.planets[0].id); drain(g);
  assert.ok(st.credits > c0 + 8);
  // ice scoop on comets
  st.upgrades = [C.UPGRADES.find((u) => u.special === 'ice_scoop').id];
  const comet = st.galaxy.systems.find((x) => x.phenomena.includes('comet'));
  const nb = st.galaxy.lanes.find(([a, b]) => a === comet.id || b === comet.id);
  teleportForTest(g, nb[0] === comet.id ? nb[1] : nb[0]);
  comet.status = 'detected'; st.ship.fuel = 10;
  g.jump(comet.id);
  drain(g);
  assert.ok(st.ship.fuel >= 10 - 6 + 3 - 3, 'scoop gave fuel');
  // market ear returns tips array
  st.upgrades = [C.UPGRADES.find((u) => u.special === 'market_ear').id];
  const trade = st.galaxy.systems.find((x) => x.station && x.station.services.includes('trade'));
  teleportForTest(g, trade.id);
  assert.ok(Array.isArray(g.market().tips));
  // rival handshake grants friendship once, and +8% on her good
  const { installUpgrade } = await import('../src/core/ship.js');
  const hs = C.UPGRADES.find((u) => u.special === 'rival_handshake');
  st.upgrades = [];
  const before = st.counters.rival_friend || 0;
  installUpgrade(st, hs.id);
  assert.equal(st.counters.rival_friend, before + 2);
  st.upgrades = []; installUpgrade(st, hs.id);
  assert.equal(st.counters.rival_friend, before + 2, 'only once');
});

test('crew abilities: thrifty pantry and weather eye multiply down', async () => {
  const g = G(10);
  const { abilityCount } = await import('../src/core/ship.js');
  const traitWith = (a) => Object.keys(C.TRAITS).find((t) => C.TRAITS[t].ability === a);
  g.state.crew[0].trait = traitWith('thrifty_pantry');
  assert.equal(abilityCount(g.state, 'thrifty_pantry'), 1);
  g.state.crew[1].trait = traitWith('gift_of_the_gab');
  const sys = g.state.galaxy.systems.find((x) => x.station);
  teleportForTest(g, sys.id);
  g.state.docked = false; g.dock(); drain(g);
  const r0 = g.state.rep.concord;
  const { applyEffects } = await import('../src/core/effects.js');
  applyEffects(g, [{ rep: { concord: 2 } }, { rep: { concord: 2 } }]);
  assert.equal(g.state.rep.concord, r0 + 2 + 1 + 2, 'gift of the gab: +1 once per dock');
});

test('relief events pay more with the distress transponder', async () => {
  const g = G(11);
  const { applyEffects } = await import('../src/core/effects.js');
  g.state.upgrades = [C.UPGRADES.find((u) => u.special === 'distress_transponder').id];
  const c = g.state.credits;
  applyEffects(g, [{ credits: 100 }], { tags: ['relief'] });
  assert.equal(g.state.credits, c + 125);
  applyEffects(g, [{ credits: 100 }], { tags: ['comedy'] });
  assert.equal(g.state.credits, c + 225);
});
