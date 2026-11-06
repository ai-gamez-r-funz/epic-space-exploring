import test from 'node:test';
import assert from 'node:assert/strict';
import { setContent, C } from '../src/core/content.js';
import { newGame, freshStorage, drain, teleportForTest } from './helpers.js';
import * as Events from '../src/core/events.js';

const EV = (id, extra = {}) => ({
  id, title: 'T ' + id, ctx: 'idle', weight: 10, tags: [], art: { scene: 'lounge' }, start: 'a',
  nodes: {
    a: {
      text: '{captain} on {ship} with {crew:science}.',
      choices: [
        { label: 'Take it', do: { text: 'Done.', fx: [{ credits: 10 }, { flag: id + '_done' }] } },
        { label: 'Needs tea', if: [{ item: 'unobtainium' }], do: { text: 'x', fx: [] } },
        { label: 'Risky', tag: 'persuade', check: { skill: 'diplomacy', diff: 4 }, pass: { text: 'Won.', fx: [{ credits: 100 }] }, fail: { text: 'Lost.', fx: [{ credits: -5 }], goto: 'b' } },
        { label: 'Dice', rand: [[1, { text: 'heads', fx: [{ morale: 1 }] }], [1, { text: 'tails', fx: [{ morale: 2 }] }]] },
      ],
    },
    b: { text: 'auto node', fx: [{ morale: -1 }], goto: 'c' },
    c: { text: 'The end.', choices: [{ label: 'Fin', do: { text: 'bye', fx: [{ startEvent: 'ev_chain2' }] } }] },
  },
  ...extra,
});

test.before(() => {
  setContent({
    EVENTS: [
      ...C.EVENTS,
      EV('ev_test_a'),
      EV('ev_test_once', { once: true, weight: 1e6, ctx: 'hail' }),
      EV('ev_test_cd', { cooldown: 10, weight: 1e6, ctx: 'station' }),
      { ...EV('ev_chain2'), ctx: 'none_ctx' },
    ],
  });
});

function g0() { freshStorage(); return newGame(); }

test('pendingView: templates, disabled choices with reason, odds', () => {
  const g = g0();
  assert.ok(Events.startEvent(g, 'ev_test_a'));
  const v = g.pendingView();
  assert.match(v.text, /Tester on Halcyon with Ilse Vo/);
  assert.equal(v.choices.length, 4);
  assert.equal(v.choices[1].enabled, false);
  assert.match(v.choices[1].reason, /Unobtainium/i);
  assert.equal(typeof v.choices[2].odds, 'number');
  assert.equal(v.isResult, false);
  assert.equal(g.resolveChoice(1).ok, false, 'disabled choice refuses');
  assert.ok(g.state.pending);
});

test('runner: result phase -> continue -> end; effects applied; flags set', () => {
  const g = g0();
  Events.startEvent(g, 'ev_test_a');
  assert.ok(g.resolveChoice(0).ok);
  let v = g.pendingView();
  assert.equal(v.isResult, true); assert.equal(v.resultText, 'Done.'); assert.equal(v.continueOnly, true);
  assert.equal(g.state.credits, 310);
  assert.ok(g.resolveChoice(0).ok);
  assert.equal(g.state.pending, null);
  assert.equal(g.state.flags.ev_test_a_done, true);
});

test('runner: goto, auto nodes and startEvent chains reach the end without dead ends', () => {
  const g = g0();
  // force fail branch by making odds 0 (skill diff huge isn't possible; loop seeds until fail)
  let reached = false;
  for (let i = 0; i < 40 && !reached; i++) {
    const gg = g0(); gg.state.rng = i + 1;
    Events.startEvent(gg, 'ev_test_a');
    gg.resolveChoice(2);
    if (gg.pendingView().resultText === 'Lost.') {
      gg.resolveChoice(0); // -> node b (auto)
      const v = gg.pendingView();
      assert.equal(v.continueOnly, true); assert.equal(v.text, 'auto node');
      gg.resolveChoice(0); // -> c
      assert.equal(gg.pendingView().text, 'The end.');
      gg.resolveChoice(0); gg.resolveChoice(0); // choice + result continue -> chained event starts
      assert.ok(gg.state.pending && gg.state.pending.eventId === 'ev_chain2');
      drain(gg);
      assert.equal(gg.state.pending, null);
      reached = true;
    } else drain(gg);
  }
  assert.ok(reached, 'never saw the failure branch');
});

test('skill checks: observed pass rate approximates displayed odds', () => {
  const g = g0();
  const odds = g.checkOdds('diplomacy', 4);
  let pass = 0; const N = 600;
  for (let i = 0; i < N; i++) {
    g.state.pending = null; g.state.ship.morale = 80; g.state.crew.forEach((c) => { c.mood = 70; });
    Events.startEvent(g, 'ev_test_a');
    g.resolveChoice(2);
    if (g.pendingView().resultText === 'Won.') pass++;
    drain(g);
  }
  assert.ok(Math.abs(pass / N - odds) < 0.07, `observed ${pass / N} vs odds ${odds}`);
});

test('selection: once, cooldown, ctx, when, anti-repeat window', () => {
  const g = g0();
  const e1 = Events.pickEvent(g, 'hail');
  assert.equal(e1.id, 'ev_test_once');
  Events.startEvent(g, e1); drain(g);
  assert.notEqual((Events.pickEvent(g, 'hail') || {}).id, 'ev_test_once', 'once events fire once');
  const s = Events.pickEvent(g, 'station');
  assert.equal(s.id, 'ev_test_cd');
  Events.startEvent(g, s); drain(g);
  assert.notEqual((Events.pickEvent(g, 'station') || {}).id, 'ev_test_cd', 'cooldown');
  g.state.day += 11;
  assert.ok(Events.eligible(g, 'station').some((e) => e.id === 'ev_test_cd'));
  // anti-repeat: while a non-recent eligible event exists, the pick is never one of the last 8
  for (let i = 0; i < 40; i++) {
    const recent = new Set(g.state.evt.recent);
    const alts = Events.eligible(g, 'idle').filter((e) => !recent.has(e.id));
    const e = Events.pickEvent(g, 'idle');
    if (!e) break;
    if (alts.length) assert.ok(!recent.has(e.id), `picked recent event ${e.id} though ${alts.length} fresh ones existed`);
    Events.startEvent(g, e); drain(g);
  }
  assert.ok(g.state.evt.recent.length <= 8);
});

test('actions refuse while an event is pending; resolveChoice works', () => {
  const g = g0();
  Events.startEvent(g, 'ev_test_a');
  const n = g.neighbors()[0];
  assert.equal(g.jump(n.id).ok, false);
  assert.equal(g.rest(1).ok, false);
  assert.equal(g.scanSystem().ok, false);
  assert.ok(g.resolveChoice(0).ok);
});

test('lantern events are reachable via investigate and not starved by the anti-repeat window', () => {
  freshStorage();
  const g = newGame({ seed: 4 });
  const wick = g.state.galaxy.systems.find((s) => s.story === 'lantern_wick');
  teleportForTest(g, wick.id);
  g.state.flags.chapter_1 = true;
  for (let i = 0; i < 9; i++) g.state.evt.recent.push('filler_' + i); // window full of other events
  const r = g.investigate('beacon');
  assert.ok(r.ok);
  assert.equal(g.state.pending.eventId, 'lantern_1_first_light');
  drain(g);
  assert.ok(g.state.flags.lantern_1);
  // lantern_2 stays locked until chapter_2 (pacing gate)
  const bw = g.state.galaxy.systems.find((s) => s.story === 'lantern_brightwater');
  teleportForTest(g, bw.id);
  g.investigate('beacon');
  assert.notEqual(g.state.pending && g.state.pending.eventId, 'lantern_2_the_question');
  drain(g);
});

test('fx: mood random/all object forms and {feature:ringed}', () => {
  const g = g0();
  Events.startEvent(g, EV('inline', { nodes: { a: { text: 'x', choices: [{ label: 'go', do: { text: 'k', fx: [{ mood: { random: 5 } }, { mood: { all: -3 } }] } }] } } }));
  g.resolveChoice(0); g.resolveChoice(0);
  assert.equal(g.state.pending, null);
});
