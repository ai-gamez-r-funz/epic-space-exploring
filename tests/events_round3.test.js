// EVENTS-A round 3: follow-up beats, hot-lane chains and keyed distress variants.
import test from 'node:test';
import assert from 'node:assert/strict';
import { C } from '../src/core/content.js';
import { FOLLOW } from '../src/content/events/followups.js';

test('follow-ups: at least 35 single-beat vignettes became multi-beat with a persistent consequence', () => {
  const ids = Object.keys(FOLLOW);
  assert.ok(ids.length >= 35, `only ${ids.length} follow-ups`);
  for (const id of ids) {
    const e = C.EVENTS.find((x) => x.id === id);
    assert.ok(e, `follow-up for unknown event ${id}`);
    assert.ok(e.nodes.b, `${id}: node b missing`);
    const persistent = JSON.stringify(e.nodes.b).match(/"(item|flag|rep|reveal)":/);
    assert.ok(persistent, `${id}: second beat has no persistent consequence`);
    const a = JSON.stringify(e.nodes.a);
    assert.ok(a.includes('"goto":"b"'), `${id}: node a never leads to b`);
  }
});

test('hot lanes: lane_hot_* chains have 4 nodes, pay out, and always clear their temporary flags', () => {
  const hot = C.EVENTS.filter((e) => e.id.startsWith('lane_hot_'));
  assert.ok(hot.length >= 4);
  for (const e of hot) {
    assert.equal(Object.keys(e.nodes).length, 4, e.id);
    for (const c of e.nodes.d.choices) {
      const fx = JSON.stringify(c.do.fx);
      for (const f of ['hl_a', 'hl_b', 'hl_c']) assert.ok(fx.includes(`"clearFlag":"${f}"`), `${e.id}: payout choice does not clear ${f}`);
    }
    assert.ok(e.nodes.d.choices.some((c) => !c.if), `${e.id}: no always-available payout`);
  }
});

test('distress: at least 6 authored variants keyed to region or faction, plus the originals', () => {
  const d = C.EVENTS.filter((e) => e.ctx === 'distress');
  assert.ok(d.length >= 9, `distress variants ${d.length}`);
  const keyed = d.filter((e) => JSON.stringify(e.when || []).match(/region|faction/));
  assert.ok(keyed.length >= 6, `keyed ${keyed.length}`);
});
