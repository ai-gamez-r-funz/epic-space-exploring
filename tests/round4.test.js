import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, freshStorage, drain, teleportForTest, dockClean } from './helpers.js';
import { setContent, C } from '../src/core/content.js';
import * as Events from '../src/core/events.js';

const G = (seed = 41, o = {}) => { freshStorage(); return newGame({ seed, ...o }); };
const live = (g) => { g.state.ship.supplies = g.state.ship.suppliesMax; g.state.ship.morale = 100; g.state.ship.fuel = g.state.ship.fuelMax; };
function hotGame() {
  for (let seed = 1; seed <= 40; seed++) {
    const g = G(seed);
    for (const s of g.state.galaxy.systems) if (s.status === 'unknown') s.status = 'detected';
    const hot = g.hotLanes()[0];
    if (hot) { teleportForTest(g, hot.fromId); live(g); return { g, hot }; }
  }
  throw new Error('no hot lane');
}

test('hot-lane briefing: stages with odds, expected/worst cost, and odds move with crew, morale and armour', () => {
  const { g, hot } = hotGame();
  const b = g.hotLaneBriefing(hot.toId);
  assert.equal(b.hot, true);
  assert.equal(b.stages.length, 3);
  for (const st of b.stages) { assert.equal(st.options.length, 3); assert.ok(st.options.every((o) => o.odds >= 0.1 && o.odds <= 1)); }
  assert.ok(b.expected.hull >= 0 && b.worst.hull >= b.expected.hull && b.bonus >= 100 && typeof b.advice === 'string');
  assert.ok(b.modifiers.some((m) => /Rested/.test(m.label)));
  // a trained pilot, a glum crew and a thicker hull all show up
  const run = (x) => x.stages[0].options.find((o) => o.key === 'run').odds;
  const o0 = run(b);
  g.state.crew[0].skills.piloting = 5;
  assert.ok(run(g.hotLaneBriefing(hot.toId)) > o0, 'training moves odds');
  const trained = run(g.hotLaneBriefing(hot.toId));
  g.state.ship.morale = 20;
  assert.ok(run(g.hotLaneBriefing(hot.toId)) < trained, 'a glum crew flies worse');
  g.state.ship.morale = 100;
  g.state.upgrades = ['riveted_plating'];
  const b2 = g.hotLaneBriefing(hot.toId);
  assert.ok(b2.armorPct > 0 && b2.stages[0].options[0].failCost.hull <= b.stages[0].options[0].failCost.hull);
  assert.equal(g.hotLaneBriefing(g.neighbors().find((n) => !n.hot).id).hot, false);
});

test('authored lane_hot_* chains are used, pay the bounty and do not repeat within 20 days', () => {
  const mk = (id) => ({ id, title: id, ctx: 'travel', weight: 10, tags: ['hazard'], start: 'a', nodes: { a: { text: 'Hot.', choices: [{ label: 'Go', do: { text: 'Went.', fx: [] } }] } } });
  setContent({ EVENTS: [...C.EVENTS, mk('lane_hot_test_a'), mk('lane_hot_test_b')] });
  const { g, hot } = hotGame();
  const credits = g.state.credits;
  g.jump(hot.toId);
  const first = g.state.pending.eventId;
  assert.match(first, /^lane_hot_test_/);
  drain(g);
  assert.ok(g.state.credits >= credits + hot.bonus - 5, 'bounty paid for authored chain');
  // second hot run within 20 days picks the other chain
  const lane2 = g.hotLanes().find((h) => h.fromId === g.state.pos);
  if (lane2) {
    live(g);
    g.jump(lane2.toId);
    if (g.state.pending) assert.notEqual(g.state.pending.eventId, first);
    drain(g);
  }
});

test('spendHints names affordable refits / training / commissions when scrip is high', () => {
  const g = G(42);
  assert.deepEqual(g.spendHints(), []);
  g.state.credits = 4000;
  teleportForTest(g, g.state.galaxy.gate);
  const h = g.spendHints();
  assert.ok(h.length >= 1 && h.length <= 6);
  for (const x of h) { assert.ok(['refit', 'training', 'commission', 'upgrade'].includes(x.kind)); assert.ok(x.cost <= 4000 && x.systemName && Number.isFinite(x.jumps)); }
  assert.ok(h.some((x) => x.here));
});

test('mid-game beat: the Society dispatch arrives once between day 40 and 90', () => {
  const g = G(43);
  for (const s of g.state.galaxy.systems.slice(0, 8)) g.forceChart(s.id);
  teleportForTest(g, g.state.galaxy.gate);
  live(g); g.advanceDays(41);
  g.state.docked = false; g.dock();
  assert.equal(g.state.pending && g.state.pending.eventId, 'core_midgame');
  const v = g.pendingView();
  assert.equal(v.choices.length, 3);
  g.resolveChoice(0); drain(g);
  assert.ok(g.state.flags.midgame_done && g.state.flags.midgame_patron_society);
  g.state.docked = false; g.state.counters.lastIdleEv = g.state.day; g.dock(); drain(g);
  assert.ok(!(g.state.pending && g.state.pending.eventId === 'core_midgame'));
});

test('archive_heart_ledger really is offered when landing on the Heart Vault; chapter 3 reveals Marginalia and points to it', () => {
  const g = G(44);
  const ah = g.state.galaxy.systems.find((s) => s.story === 'archive_heart');
  ah.status = 'unknown';
  g.state.flags.lantern_2 = true; g.state.flags.archive_key = true;
  for (const s of g.state.galaxy.systems.slice(0, 20)) g.forceChart(s.id);
  g._chapters();
  assert.ok(g.state.flags.chapter_3, 'chapter 3 should open');
  assert.notEqual(ah.status, 'unknown', 'chapter 3 lead missions reveal Marginalia');
  g.state.flags.lantern_3 = true;
  const o = g.nextObjective();
  assert.match(o.text, /Fellowship Ledger|Lantern/);
  teleportForTest(g, ah.id); g.state.ship.supplies = 40;
  g.scanSystem(); drain(g);
  const vault = ah.planets.find((p) => p.features.includes('ruins'));
  assert.ok(g.landingParty(vault.id).ok);
  assert.equal(g.state.pending.eventId, 'archive_heart_ledger');
  drain(g);
});
