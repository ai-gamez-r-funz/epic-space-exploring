// Missions: board generation (static + procedural TEMPLATES), selector resolution, objective tracking,
// deadlines, completion and failure. Instances are self-contained plain JSON in state.missions.active.
import { C, IDX, goodName, prettify, factionName } from './content.js';
import { RNG, hashString } from './rng.js';
import { evalConds } from './conds.js';
import { applyEffects } from './effects.js';
import { diffOf } from './ship.js';
import { bfs, adjacency } from './galaxy.js';

const WEEK = 7;
/** Engine-side scale on authored mission credits (keeps income in step with the tighter fuel/supply economy). */
const REWARD_SCALE = 0.7;
const sysById = (st, id) => st.galaxy.systems.find((s) => s.id === id);
const isKnown = (s) => s.status !== 'unknown';

// ------------------------------------------------------------------ selector resolution
const STATION_KINDS = ['trade', 'outpost', 'shipyard', 'embassy', 'archive', 'habitat'];

/**
 * Resolve a selector to a system id (or null). `bound` holds template placeholders ({toSystem}...).
 * Region-only selectors with count are "unpinned": returns { region, ... } marker via opts.allowUnpinned.
 */
export function resolveSelector(g, sel, fromId, rng, bound = {}, opts = {}) {
  const st = g.state;
  if (sel === undefined || sel === null) return null;
  if (typeof sel === 'string') {
    const m = sel.match(/^\{(\w+)\}$/);
    if (m) return bound[m[1]] || null;
    const s = st.galaxy.systems.find((x) => x.story === sel || x.id === sel);
    return s ? s.id : null;
  }
  if (typeof sel !== 'object') return null;
  if (sel.story) { const s = st.galaxy.systems.find((x) => x.story === sel.story); return s ? s.id : null; }
  if (sel.here) return fromId;
  const adj = adjacency(st.galaxy);
  const hops = bfs(st.galaxy, fromId, adj);
  const minH = sel.minHops ?? 0;
  const maxH = sel.maxHops ?? 99;
  const excl = new Set(sel.exclude || []);
  let cands = st.galaxy.systems.filter((s) => {
    if (excl.has(s.story) || excl.has(s.id)) return false;
    if (sel.notHere && s.id === fromId) return false;
    const h = hops[s.id];
    if (h === undefined || h < minH || h > maxH) return false;
    if (!isKnown(s) && sel.status !== 'unknown' && !opts.anyKnowledge) return false;
    if (sel.faction && s.faction !== sel.faction && !(s.station && s.station.faction === sel.faction)) return false;
    if (sel.region && s.region !== sel.region) return false;
    if (sel.station) {
      if (!s.station) return false;
      if (sel.station !== true && s.station.kind !== sel.station) return false;
    }
    if (sel.phenomenon && !s.phenomena.includes(sel.phenomenon)) return false;
    if (sel.planetType && !s.planets.some((p) => p.type === sel.planetType)) return false;
    if (sel.status === 'unknown' && s.status !== 'unknown') return false;
    if (sel.status === 'unvisited' && (s.status === 'visited' || s.status === 'charted')) return false;
    if (sel.status === 'uncharted' && s.status === 'charted') return false;
    if (sel.nearest) {
      const n = sel.nearest;
      if (n === 'station') { if (!s.station) return false; }
      else if (STATION_KINDS.includes(n)) { if (!s.station || s.station.kind !== n) return false; }
      else if (n === 'unvisited') { if (s.status === 'visited' || s.status === 'charted') return false; }
      else if (n === 'uncharted') { if (s.status === 'charted') return false; }
    }
    return true;
  });
  if (!cands.length) return null;
  if (sel.count && sel.count > 1 && !sel.nearest && !sel.story) return opts.allowUnpinned ? '*' : cands[0].id;
  const best = Math.min(...cands.map((s) => hops[s.id]));
  cands = cands.filter((s) => hops[s.id] === best);
  return (rng ? rng.pick(cands) : cands[0]).id;
}

// ------------------------------------------------------------------ templating of draft instances
function fillStr(str, vars) {
  if (typeof str !== 'string') return str;
  const whole = str.match(/^\{(\w+)\}$/);
  if (whole && vars[whole[1]] !== undefined) return vars[whole[1]];
  return str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
}
function deepFill(v, vars) {
  if (typeof v === 'string') return fillStr(v, vars);
  if (Array.isArray(v)) return v.map((x) => deepFill(x, vars));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepFill(x, vars)]));
  return v;
}

function resolveObjectives(g, objs, fromId, rng, bound, vars) {
  const out = [];
  for (const o0 of objs || []) {
    const o = deepFill(o0, vars);
    const inst = { ...o, done: false, resolved: null, n: 0 };
    for (const key of ['target', 'deliverTo']) {
      if (o[key] !== undefined) {
        let r = resolveSelector(g, typeof o[key] === 'string' ? o0[key] : o[key], fromId, rng, bound, { allowUnpinned: true, anyKnowledge: typeof o0[key] === 'string' });
        if (r === null) return null; // no match: drop the offer
        const sel0 = o[key];
        if (r !== '*' && sel0 && typeof sel0 === 'object' && !sel0.story && !sel0.nearest && !sel0.here && !sel0.phenomenon && !sel0.planetType && ((o.count || 0) > 1 || (sel0.count || 0) > 1)) r = '*'; // region-style counted objective: not pinned
        if (key === 'target') inst.resolved = r === '*' ? null : r;
        if (key === 'deliverTo') inst.deliverResolved = r === '*' ? null : r;
      }
    }
    out.push(inst);
  }
  return out;
}

function visibleText(vars) { return vars; }

/** Build a draft instance from a static definition. null if its selectors cannot resolve. */
function draftStatic(g, def, fromId, rng) {
  const vars = { giver: def.giver && def.giver.name, faction: factionName(def.giver && def.giver.faction) };
  const objectives = resolveObjectives(g, def.objectives, fromId, rng, {}, vars);
  if (!objectives) return null;
  const diff = diffOf(g.state);
  const reward = { ...(def.reward || {}) };
  if (reward.credits) reward.credits = Math.round(reward.credits * diff.reward * (def.arc === 'main' ? 1 : REWARD_SCALE));
  return {
    id: def.id, defId: def.id, title: def.title, giver: def.giver || null, faction: (def.giver && def.giver.faction) || 'none', kind: def.kind,
    blurb: def.blurb, accept: def.accept, reward, deadlineDays: def.deadlineDays ? Math.round(def.deadlineDays * diff.deadline) : null,
    objectives, onComplete: def.onComplete || [], failFx: def.failFx || [], completeText: def.completeText || null,
    ordered: !!def.ordered, secret: !!def.secret, repeatable: !!def.repeatable, procedural: false, originSystem: fromId, arc: def.arc || null,
  };
}

function draftTemplate(g, t, sys, rng, key) {
  const st = g.state;
  const bound = {};
  const pick = t.pick || {};
  const from = pick.fromSystem ? resolveSelector(g, pick.fromSystem, sys.id, rng) : sys.id;
  if (!from) return null;
  bound.fromSystem = from;
  const to = resolveSelector(g, pick.toSystem, from, rng, bound);
  if (!to) return null;
  bound.toSystem = to;
  const toSys = sysById(st, to);
  let planet = null;
  if (pick.planet) {
    const ps = toSys.planets.filter((p) => !pick.planet.planetType || p.type === pick.planet.planetType);
    planet = ps.length ? rng.pick(ps) : toSys.planets[0];
    if (!planet) return null;
  } else if (toSys.planets.length) planet = toSys.planets[0];
  let good = null; let qty = null;
  if (pick.goodId) {
    const pool = C.GOODS.filter((x) => (pick.goodId.ids ? pick.goodId.ids.includes(x.id) : (pick.goodId.category || []).includes(x.category)));
    good = rng.pick(pool);
    if (!good) return null;
  }
  if (pick.qty) qty = rng.int(pick.qty[0], pick.qty[1]);
  const hops = bfs(st.galaxy, from)[to] ?? 2;
  const giver = rng.pick(t.giverPool && t.giverPool.length ? t.giverPool : [{ name: 'A Local Clerk', species: 'human' }]);
  const faction = sys.station ? sys.station.faction : sys.faction;
  const diff = diffOf(st);
  const rw = t.reward || {};
  let credits = 0;
  if (rw.credits && typeof rw.credits === 'object') credits = (rw.credits.base || 0) + (rw.credits.perUnit || 0) * (qty || 0) + (rw.credits.perJump || 0) * hops;
  else credits = rw.credits || 0;
  credits = Math.max(10, Math.round((credits * diff.reward * REWARD_SCALE * (0.92 + rng.next() * 0.2)) / 5) * 5);
  const rep = {};
  for (const [f, n] of Object.entries(rw.rep || {})) {
    const fid = f === '$faction' ? faction : f;
    if (fid && fid !== 'none' && fid in st.rep) rep[fid] = n;
  }
  const vars = {
    goodId: good ? good.id : '', goodName: good ? good.name : '', qty: qty ?? 0, fromSystem: sysById(st, from).name, toSystem: toSys.name,
    planet: planet ? planet.name : '', faction: factionName(faction), giver: giver.name, reward: credits,
  };
  const objectives = resolveObjectives(g, t.objectives, from, rng, bound, vars);
  if (!objectives) return null;
  // placeholder targets referring to bound systems were resolved above; fix the `planet` scan wording
  const deadline = Math.round(((t.deadlineBase || 14) + (t.deadlinePerJump || 6) * hops) * diff.deadline);
  const failFx = deepFill(t.failFx || [], {});
  const fixFail = failFx.map((e) => (e.rep ? { rep: Object.fromEntries(Object.entries(e.rep).map(([f, n]) => [f === '$faction' ? faction : f, n]).filter(([f]) => f in st.rep)) } : e));
  const reward = { credits, rep, ...(rw.item ? { item: { ...rw.item } } : {}) };
  return {
    id: `gen:${sys.id}:${key}`, defId: t.id, title: fillStr(t.title, vars), giver: { ...giver, faction }, faction, kind: t.kind,
    blurb: fillStr(t.blurb, vars), accept: fillStr(t.accept, vars), reward, deadlineDays: deadline, objectives, onComplete: [], failFx: fixFail,
    ordered: false, repeatable: true, procedural: true, originSystem: sys.id, arc: null,
  };
}

// ------------------------------------------------------------------ boards
function offerAtOk(g, def, sys) {
  const at = def.offerAt;
  if (!sys.station) return false;
  if (def.stationKinds && !def.stationKinds.includes(sys.station.kind)) return false;
  if (!at) return sys.station.services.includes('missions');
  if (typeof at === 'string') return sys.story === at || sys.id === at;
  if (typeof at === 'object') {
    if (at.story) return sys.story === at.story;
    if (at.faction && sys.faction !== at.faction && sys.station.faction !== at.faction) return false;
    if (at.region && sys.region !== at.region) return false;
    if (at.station && at.station !== true && sys.station.kind !== at.station) return false;
    return true;
  }
  return false;
}

const weekOf = (day) => Math.floor((day - 1) / WEEK);

/** Offers at a system (empty array if no mission service). */
export function board(g, sysId) {
  const st = g.state;
  const sys = sysById(st, sysId);
  if (!sys || !sys.station || !sys.station.services.includes('missions')) return [];
  const week = weekOf(st.day);
  let b = st.boards[sysId];
  if (!b || b.week !== week) b = st.boards[sysId] = { week, taken: [], proc: null };
  const activeDefs = new Set(st.missions.active.map((m) => m.defId));
  const offers = [];

  // static
  for (const def of C.MISSIONS) {
    if (b.taken.includes(def.id) || activeDefs.has(def.id)) continue;
    if (st.missions.done.includes(def.id) && !def.repeatable) continue;
    if (st.missions.failed.includes(def.id) && !def.repeatable) { /* failed story missions may be retaken */ }
    if (!offerAtOk(g, def, sys)) continue;
    if (def.offerWhen && def.offerWhen.length && !evalConds(g, def.offerWhen, { systemId: sysId }, { noRandom: true }).ok) continue;
    // non-story missions rotate: ~45 % of stations show a given job each week
    if (def.kind !== 'story' && def.arc !== 'main' && !def.offerAt && (hashString(`${st.seed}|${def.id}|${sysId}|${week}`) % 100) >= 45) continue;
    const rng = new RNG(hashString(`${st.seed}|d|${def.id}|${sysId}`));
    const d = draftStatic(g, def, sysId, rng);
    if (d) offers.push(d);
  }
  // procedural (cached per system-week)
  if (!b.proc) {
    b.proc = [];
    const rng = new RNG(hashString(`${st.seed}|proc|${sysId}|${week}`));
    const pool = (C.TEMPLATES || []).filter((t) => {
      if (t.stationKinds && !t.stationKinds.includes(sys.station.kind)) return false;
      const f = sys.station.faction;
      if (t.factions && t.factions !== 'any' && !(t.factions.includes(f))) return false;
      if (t.offerWhen && t.offerWhen.length && !evalConds(g, t.offerWhen, { systemId: sysId }, { noRandom: true }).ok) return false;
      return true;
    });
    const want = 2 + (rng.chance(0.5) ? 1 : 0);
    const usedKinds = new Set();
    for (let i = 0; i < want * 3 && b.proc.length < want && pool.length; i++) {
      const t = rng.weighted(pool, (x) => x.weight || 5);
      if (!t || usedKinds.has(t.id)) continue;
      const d = draftTemplate(g, t, sys, rng, `${week}:${i}`);
      if (d) { b.proc.push(d); usedKinds.add(t.id); }
    }
  }
  if (!b.strandedDone) {
    b.strandedDone = true;
    const rng2 = new RNG(hashString(`${st.seed}|stranded|${sysId}|${week}`));
    if (rng2.chance(0.45)) { const d = strandedDraft(g, sys, rng2, week); if (d) b.proc.push(d); }
  }
  for (const d of b.proc) if (!b.taken.includes(d.id) && !activeDefs.has(d.id)) offers.push(d);
  return offers;
}

/** Timed "stranded" relief contract: haul supplies to a ship stuck near trouble before the clock runs out. */
function strandedDraft(g, sys, rng, week) {
  const st = g.state;
  const goodId = rng.pick(['fuel_cells', 'medical_kits', 'ration_bars'].filter((x) => IDX.good[x]));
  if (!goodId) return null;
  const hops = bfs(st.galaxy, sys.id);
  const cands = st.galaxy.systems.filter((s) => s.id !== sys.id && s.status !== 'unknown' && hops[s.id] >= 2 && hops[s.id] <= 4 && s.danger >= 1);
  if (!cands.length) return null;
  const to = rng.pick(cands);
  const qty = rng.int(4, 6);
  const diff = diffOf(st);
  const jumps = hops[to.id];
  const good = IDX.good[goodId];
  const credits = Math.round((200 + 55 * jumps) * diff.reward / 5) * 5;
  const faction = sys.station ? sys.station.faction : sys.faction;
  const rep = faction && faction !== 'none' && faction in st.rep ? { [faction]: 3 } : {};
  const vars = { to: to.name };
  return {
    id: `gen:${sys.id}:str${week}`, defId: 'stranded_contract', title: `Stranded near ${to.name}`, giver: { name: 'Harbour Master Quill', species: 'human', faction }, faction, kind: 'relief',
    blurb: `A hauler has run dry near ${to.name} and the weather there is turning. ${qty} ${good.name} would see her home. The Harbour Master stresses that the clock is real.`,
    accept: '"Quick as you can," says the Harbour Master. "Slow is the one thing she cannot afford."',
    reward: { credits, rep }, deadlineDays: Math.round((6 + 3 * jumps) * diff.deadline),
    objectives: [{ id: 'o1', type: 'have', good: goodId, qty, deliverTo: to.name, consume: true, text: `Deliver ${qty} ${good.name} to ${to.name} before the deadline`, done: false, resolved: null, deliverResolved: to.id, n: 0 }],
    onComplete: [{ morale: 3 }], failFx: [{ morale: -2 }], ordered: false, repeatable: true, procedural: true, originSystem: sys.id, arc: null, stranded: true,
  };
}

/** UI-facing offer summary. */
export function offerView(d) {
  return { id: d.id, title: d.title, giver: d.giver, faction: d.faction, kind: d.kind, blurb: d.blurb, reward: d.reward, deadlineDays: d.deadlineDays, objectives: d.objectives.map((o) => ({ text: o.text, optional: !!o.optional })), arc: d.arc, repeatable: d.repeatable };
}

// ------------------------------------------------------------------ lifecycle
function instantiate(g, d) {
  const st = g.state;
  const inst = JSON.parse(JSON.stringify(d));
  inst.id = d.procedural ? `${d.id}@${st.day}` : d.id;
  inst.acceptedDay = st.day;
  inst.deadlineDay = d.deadlineDays ? st.day + d.deadlineDays : null;
  inst.baseline = { scanned: st.stats.planetsScanned || 0 };
  return inst;
}

export function accept(g, offerId) {
  const st = g.state;
  const sys = sysById(st, st.pos);
  if (!sys) return { ok: false, reason: 'Nowhere' };
  const offers = board(g, sys.id);
  const d = offers.find((o) => o.id === offerId);
  if (!d) return { ok: false, reason: 'That job is no longer on the board' };
  if (st.missions.active.length >= 6) return { ok: false, reason: 'Your mission log is full (6)' };
  const inst = instantiate(g, d);
  st.missions.active.push(inst);
  st.boards[sys.id].taken.push(d.id);
  revealTargets(g, inst);
  g.log('mission', `Accepted: ${inst.title}.`);
  g.emit('sfx', { name: 'confirm' });
  g.emit('toast', { text: `Mission accepted: ${inst.title}`, tone: 'good' });
  check(g);
  return { ok: true, mission: inst.id, accept: inst.accept };
}

/** Start a static mission directly (fx {mission}). */
export function start(g, defId, opts = {}) {
  const st = g.state;
  const def = IDX.mission[defId];
  if (!def) return { ok: false, reason: 'Unknown mission' };
  if (st.missions.active.some((m) => m.defId === defId)) return { ok: false, reason: 'Already active' };
  const rng = new RNG(hashString(`${st.seed}|s|${defId}|${st.day}`));
  const d = draftStatic(g, def, st.pos, rng);
  if (!d) return { ok: false, reason: 'Cannot place mission' };
  const inst = instantiate(g, d);
  st.missions.active.push(inst);
  revealTargets(g, inst);
  g.log('mission', `New mission: ${inst.title}.`);
  g.emit('toast', { text: `New mission: ${inst.title}`, tone: 'good' });
  return { ok: true, mission: inst.id };
}

function revealTargets(g, inst) {
  for (const o of inst.objectives) for (const id of [o.resolved, o.deliverResolved]) {
    const s = id && sysById(g.state, id);
    if (s && s.status === 'unknown') s.status = 'detected';
  }
}

export function abandon(g, id) {
  const st = g.state;
  const i = st.missions.active.findIndex((m) => m.id === id);
  if (i < 0) return { ok: false, reason: 'No such mission' };
  const [m] = st.missions.active.splice(i, 1);
  if (st.boards[m.originSystem] && !m.procedural) st.boards[m.originSystem].taken = st.boards[m.originSystem].taken.filter((x) => x !== m.defId);
  g.log('mission', `Abandoned: ${m.title}.`);
  g.emit('toast', { text: `Abandoned: ${m.title}`, tone: 'info' });
  return { ok: true };
}

/** Mark an objective done by id (fx missionProgress). */
export function progress(g, missionId, objId) {
  const m = g.state.missions.active.find((x) => x.id === missionId || x.defId === missionId);
  if (!m) return;
  const o = m.objectives.find((x) => x.id === objId);
  if (o) o.done = true;
}

export function noteScan(g, sys, planet) {
  for (const m of g.state.missions.active) for (const o of m.objectives) {
    if (o.type !== 'scan' || o.done) continue;
    if (o.what === 'phenomenon') continue;
    if (!targetMatches(o, sys)) continue;
    if (o.what === 'planetType' && planet.type !== o.planetType) continue;
    o.n = (o.n || 0) + 1;
  }
}
export function noteInvestigate(g, sys, phenomenon) {
  for (const m of g.state.missions.active) for (const o of m.objectives) {
    if (o.type !== 'scan' || o.done || o.what !== 'phenomenon') continue;
    if (!targetMatches(o, sys)) continue;
    if (o.phenomenon && o.phenomenon !== phenomenon) continue;
    o.n = (o.n || 0) + 1;
  }
}
function targetMatches(o, sys) {
  if (o.resolved) return o.resolved === sys.id;
  const t = o.target;
  if (t && typeof t === 'object') { if (t.region && t.region !== sys.region) return false; if (t.faction && t.faction !== sys.faction) return false; }
  return true;
}

function objectiveDone(g, m, o, idx) {
  const st = g.state;
  if (o.done) return true;
  if (m.ordered && idx > 0 && m.objectives.slice(0, idx).some((p) => !p.done && !p.optional)) return false;
  switch (o.type) {
    case 'goto': return !!o.resolved && st.pos === o.resolved && (!o.docked || st.docked);
    case 'have': {
      const qty = Number(o.qty) || 1;
      const held = o.good ? (st.cargo[o.good] || 0) : o.item ? (st.items[o.item] || 0) : 0;
      if (held < qty) return false;
      if (o.deliverTo !== undefined) {
        if (!o.deliverResolved || st.pos !== o.deliverResolved) return false;
        const sys = sysById(st, st.pos);
        if (sys.station && !st.docked) return false;
        if (o.consume) {
          if (o.good) { st.cargo[o.good] -= qty; if (st.cargo[o.good] <= 0) delete st.cargo[o.good]; }
          else if (o.item) { st.items[o.item] -= qty; if (st.items[o.item] <= 0) delete st.items[o.item]; }
        }
      }
      return true;
    }
    case 'scan': {
      const need = o.count || 1;
      if (o.what === 'planets' && !o.count && o.resolved) { // "scan everything there"
        const s = sysById(st, o.resolved);
        return !!s && s.planets.length > 0 && s.planets.every((p) => p.scanned);
      }
      return (o.n || 0) >= need;
    }
    case 'chart': {
      if (o.resolved && !(o.target && o.target.count > 1)) { const s = sysById(st, o.resolved); return !!s && s.status === 'charted'; }
      const t = o.target || {};
      const n = st.galaxy.systems.filter((s) => s.status === 'charted' && (!t.region || s.region === t.region) && (!t.faction || s.faction === t.faction)).length;
      o.have = n;
      return n >= (t.count || o.count || 1);
    }
    case 'flag': return o.value !== undefined ? st.flags[o.flag] === o.value : !!st.flags[o.flag];
    case 'event': return !!st.evt.seen[o.event];
    default: return false;
  }
}

/** Re-evaluate active missions: objectives, completion, deadlines. Safe to call often. */
export function check(g) {
  const st = g.state;
  if (st.phase === 'ended') return;
  for (const m of st.missions.active.slice()) {
    if (m.deadlineDay && st.day > m.deadlineDay) { fail(g, m, 'expired'); continue; }
    m.objectives.forEach((o, i) => { if (!o.done && objectiveDone(g, m, o, i)) o.done = true; });
    if (m.objectives.every((o) => o.done || o.optional)) complete(g, m);
  }
}

function rewardFx(r) {
  const fx = [];
  if (r.credits) fx.push({ credits: r.credits });
  if (r.rep) fx.push({ rep: r.rep });
  if (r.item) fx.push({ item: r.item });
  if (r.upgrade) fx.push({ upgrade: r.upgrade });
  if (r.codex) fx.push({ codex: r.codex });
  return fx;
}

function complete(g, m) {
  const st = g.state;
  st.missions.active = st.missions.active.filter((x) => x !== m);
  if (!st.missions.done.includes(m.defId)) st.missions.done.push(m.defId);
  st.stats.missionsDone = (st.stats.missionsDone || 0) + 1;
  applyEffects(g, [...rewardFx(m.reward || {}), ...(m.onComplete || [])], {});
  g.log('mission', `Completed: ${m.title}${m.reward && m.reward.credits ? ` (+${m.reward.credits} scrip)` : ''}.`);
  g.emit('toast', { text: `Mission complete: ${m.title}${m.reward && m.reward.credits ? `  +${m.reward.credits} scrip` : ''}`, tone: 'good' });
  if (m.completeText) g.emit('toast', { text: m.completeText, tone: 'info' });
  g.emit('sfx', { name: 'fanfare' });
}

function fail(g, m, why) {
  const st = g.state;
  st.missions.active = st.missions.active.filter((x) => x !== m);
  if (!st.missions.failed.includes(m.defId)) st.missions.failed.push(m.defId);
  applyEffects(g, [...(m.failFx || [])], {});
  g.log('mission', `Failed: ${m.title} (${why}).`);
  g.emit('toast', { text: `Mission lapsed: ${m.title}`, tone: 'bad' });
  g.emit('sfx', { name: 'fail' });
}

/** UI view of active missions. */
export function activeView(g) {
  const st = g.state;
  return st.missions.active.map((m) => {
    const objectives = [];
    m.objectives.forEach((o, i) => {
      if (o.hidden && i > 0 && !m.objectives[i - 1].done && !o.done) return;
      let text = o.text;
      if (o.type === 'chart' && o.have !== undefined && o.target && o.target.count) text += ` (${Math.min(o.have, o.target.count)}/${o.target.count})`;
      objectives.push({ id: o.id, text, done: !!o.done, optional: !!o.optional, target: o.resolved || o.deliverResolved || null });
    });
    return { id: m.id, title: m.title, giver: m.giver, kind: m.kind, blurb: m.blurb, objectives, reward: m.reward, deadlineDay: m.deadlineDay || undefined, arc: m.arc };
  });
}
export { prettify, goodName };
