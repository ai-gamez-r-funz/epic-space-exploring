// Event engine: selection (ctx/weights/cooldown/once/when/anti-repeat), cursor-based node runner, skill checks,
// templating and the render-ready pendingView(). The cursor lives in state.pending (plain JSON).
import { C, IDX } from './content.js';
import { evalConds } from './conds.js';
import { applyEffects } from './effects.js';
import { template } from './text.js';
import { hasSpecial, diffOf, clamp } from './ship.js';
import { BUILTIN, BUILTIN_BY_ID } from './builtin.js';

export const RECENT_WINDOW = 8;

export function eventById(id) { return IDX.event[id] || BUILTIN_BY_ID[id] || null; }

/** The event definition behind a cursor (inline events are stored on the cursor itself). */
function evOf(cur) { return cur.inline || eventById(cur.eventId); }

function seenInfo(st, id) { return (st.evt.seen[id]) || null; }

/** Eligible events for a context kind. */
export function eligible(g, kind, ctx = {}) {
  const st = g.state;
  const out = [];
  for (const e of C.EVENTS) {
    if (e.ctx !== kind) continue;
    const seen = seenInfo(st, e.id);
    if (e.once && seen) continue;
    // Lantern chain pacing: lantern_N_* events wait for the matching story chapter (survey-gated in CHAPTERS)
    const lm = /^lantern_([1-5])_/.exec(e.id);
    if (lm && C.CHAPTERS.length && !st.flags['chapter_' + lm[1]]) continue;
    if (e.cooldown && seen && st.day - seen.last < e.cooldown) continue;
    if (e.when && e.when.length && !evalConds(g, e.when, ctx).ok) continue;
    out.push(e);
  }
  return out;
}

function weightOf(g, e, ctx) {
  const st = g.state;
  let w = Number.isFinite(e.weight) ? e.weight : 10;
  const sys = st.galaxy.systems.find((s) => s.id === (ctx.systemId || st.pos));
  const tags = e.tags || [];
  if (tags.includes('hazard')) w *= 0.5 + 0.35 * (sys ? sys.danger : 0);
  if (tags.includes('relief') && st.ship.morale < 50) w *= 1.8;
  if (tags.includes('relief') && hasSpecial(st, 'distress_transponder')) w *= 1.5;
  if (tags.includes('mystery') && hasSpecial(st, 'lantern_attunement')) w *= 2;
  if (tags.includes('wonder') && st.ship.morale < 60) w *= 1.3;
  return Math.max(0.01, w);
}

/** Choose an event for a context (or null). Honors the anti-repeat window when alternatives exist. */
export function pickEvent(g, kind, ctx = {}, opts = {}) {
  let all = eligible(g, kind, ctx);
  if (opts.only) all = all.filter((e) => opts.only.test(e.id));
  if (opts.not) all = all.filter((e) => !opts.not.test(e.id));
  if (!all.length) return null;
  const recent = new Set(g.state.evt.recent);
  const fresh = all.filter((e) => !recent.has(e.id));
  let pool = fresh.length ? fresh : all;
  // story-critical events (weight >= 50) always win over ambient ones when eligible
  const heavy = pool.filter((e) => (e.weight || 0) >= 50);
  if (heavy.length) pool = heavy;
  return g.rng.weighted(pool, (e) => weightOf(g, e, ctx)) || null;
}

/** Begin an event (sets state.pending). ev may be an id or an event object. Returns true if started. */
export function startEvent(g, ev, ctx = {}, opts = {}) {
  const event = typeof ev === 'string' ? eventById(ev) : ev;
  if (!event || !event.nodes || !event.nodes[event.start]) return false;
  const st = g.state;
  const crew = st.crew.length ? st.crew[g.rng.int(0, st.crew.length - 1)] : null;
  const cur = {
    eventId: event.id, node: null, phase: 'node', kind: event.ctx,
    ctx: { systemId: ctx.systemId || st.pos, planetId: ctx.planetId || null, phenomenon: ctx.phenomenon || null, feature: ctx.feature || null, crewId: ctx.crewId || null, crewRandom: ctx.crewId || (crew && crew.id) || null, eventId: event.id, tags: event.tags || [] },
    result: null, next: null, afterArrive: !!opts.afterArrive, auto: null, setPiece: opts.setPiece || null, bonus: opts.bonus || 0,
  };
  if (event.inline || (!IDX.event[event.id] && !BUILTIN_BY_ID[event.id])) cur.inline = event;
  st.pending = cur;
  const rec = st.evt.seen[event.id] || { n: 0, last: 0 };
  rec.n += 1; rec.last = st.day;
  st.evt.seen[event.id] = rec;
  if (!event.internal) {
    st.evt.recent.push(event.id);
    while (st.evt.recent.length > RECENT_WINDOW) st.evt.recent.shift();
  }
  st.stats.eventsSeen = (st.stats.eventsSeen || 0) + 1;
  enterNode(g, cur, event.start);
  g.emit('sfx', { name: 'hail' });
  g.emit('event', { id: event.id });
  return true;
}

function enterNode(g, cur, nodeId) {
  const event = evOf(cur);
  const node = event && event.nodes && event.nodes[nodeId];
  if (!node) { finish(g, cur); return; }
  cur.node = nodeId; cur.phase = 'node'; cur.result = null; cur.next = null; cur.auto = null;
  if (!node.choices || !node.choices.length) {
    // auto node: apply its effects on entry, then Continue
    const r = applyEffects(g, node.fx, cur.ctx);
    cur.auto = { summary: r.summary, tone: r.tone, goto: node.goto || null };
    if (r.summary.length) g.emit('toast', { text: r.summary.join(', '), tone: r.tone });
  }
}

function finish(g, cur) {
  const st = g.state;
  const event = evOf(cur);
  st.pending = null;
  // wonder bonuses
  if (event && (event.tags || []).includes('wonder')) {
    const fx = [];
    if (hasSpecial(st, 'observation_dome')) fx.push({ morale: 4 }, { credits: 15 });
    if (st.crew.some((c) => c.trait === 'stargazer')) fx.push({ morale: 3 });
    if (fx.length) { const r = applyEffects(g, fx, cur.ctx); if (r.summary.length) g.emit('toast', { text: 'Wonder: ' + r.summary.join(', '), tone: 'good' }); }
  }
  g.emit('changed', {});
  g._afterEvent(cur);
}

function choiceEnabled(g, c, cur) {
  if (!c.if || !c.if.length) return { ok: true };
  return evalConds(g, c.if, cur.ctx, { noRandom: true });
}

/** Advance the pending event. */
export function resolveChoice(g, index) {
  const st = g.state;
  const cur = st.pending;
  if (!cur) return { ok: false, reason: 'No event in progress' };
  const event = evOf(cur);
  if (!event) { st.pending = null; return { ok: false, reason: 'Event data missing' }; }

  if (cur.phase === 'result') {
    if (cur.next) enterNode(g, cur, cur.next); else finish(g, cur);
    g.emit('event', { id: cur.eventId });
    return { ok: true };
  }
  const node = event.nodes[cur.node];
  if (cur.auto) { // auto node -> continue
    const nxt = cur.auto.goto;
    if (nxt) enterNode(g, cur, nxt); else finish(g, cur);
    g.emit('event', { id: cur.eventId });
    return { ok: true };
  }
  const c = node.choices[index];
  if (!c) return { ok: false, reason: 'No such choice' };
  const en = choiceEnabled(g, c, cur);
  if (!en.ok) return { ok: false, reason: en.reason || 'Unavailable' };

  let step; let passed = null; let odds = null;
  if (c.check) {
    odds = g.checkOdds(c.check.skill, c.check.diff, { tag: c.tag, faction: (event.art && event.art.species) || undefined });
    let roll = g.rng.next();
    passed = roll < odds;
    if (!passed && !st.flags._lucky_used) {
      const lucky = st.crew.find((x) => x.trait === 'lucky');
      if (lucky) { st.flags._lucky_used = true; passed = g.rng.next() < odds; g.emit('toast', { text: `${lucky.name}'s luck turns it around!`, tone: 'good' }); }
    }
    step = passed ? c.pass : c.fail;
  } else if (c.rand && c.rand.length) {
    const pick = g.rng.weighted(c.rand, (e) => e[0]);
    step = pick ? pick[1] : null;
  } else {
    step = c.do || ((c.fx || c.goto || c.text) ? c : null);
  }
  step = step || {};
  const r = applyEffects(g, step.fx, cur.ctx);
  if (r.summary.length) g.emit('toast', { text: r.summary.join(', '), tone: r.tone });
  if (c.check) g.emit('sfx', { name: passed ? 'success' : 'fail' });
  if (c.check && passed) g.state.stats.checksPassed = (g.state.stats.checksPassed || 0) + 1;

  // ending/chain/teleport fx may already have invalidated the cursor (e.g. endGame) - re-check
  if (st.pending !== cur) return { ok: true, passed };
  if (step.text) {
    cur.phase = 'result';
    cur.result = { text: step.text, summary: r.summary, tone: r.tone, passed, skill: c.check ? c.check.skill : null, odds };
    cur.next = step.goto || null;
    g.emit('event', { id: cur.eventId });
  } else if (step.goto) {
    enterNode(g, cur, step.goto);
    g.emit('event', { id: cur.eventId });
  } else finish(g, cur);
  return { ok: true, passed };
}

/** Render-ready view of the pending node (contract §3). */
export function pendingView(g) {
  const st = g.state;
  const cur = st.pending;
  if (!cur) return null;
  const event = evOf(cur);
  if (!event) return null;
  const node = event.nodes[cur.node] || {};
  const T = (s) => template(st, s, cur.ctx);
  const isResult = cur.phase === 'result';
  const view = {
    eventId: event.id, title: T(event.title), text: T(node.text || ''), art: event.art || null, tags: event.tags || [],
    speaker: node.speaker ? { name: T(node.speaker.name), species: node.speaker.species } : null,
    choices: [], isResult, continueOnly: false,
  };
  if (isResult) {
    view.resultText = T(cur.result.text);
    view.summary = cur.result.summary || [];
    view.outcome = cur.result.passed === null ? null : cur.result.passed ? 'pass' : 'fail';
    view.continueOnly = true;
  } else if (cur.auto) {
    view.continueOnly = true;
    view.summary = cur.auto.summary || [];
  } else {
    view.choices = (node.choices || []).map((c, index) => {
      const en = choiceEnabled(g, c, cur);
      const o = { index, label: T(c.label), enabled: en.ok, tag: c.tag };
      if (!en.ok) o.reason = en.reason;
      if (c.check) { o.odds = g.checkOdds(c.check.skill, c.check.diff, { tag: c.tag, faction: event.art && event.art.species }); o.skill = c.check.skill; }
      return o;
    });
  }
  return view;
}

export { BUILTIN };
