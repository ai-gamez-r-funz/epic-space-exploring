#!/usr/bin/env node
// Headless bot runner for Halcyon Reach. Plays full games through the public Game API only.
//   node tools/sim.mjs --runs 200 --policy random|greedy|cautious [--seed n] [--days 800] [--difficulty standard] [--verbose]
// Prints win/loss/strand rates, average days, credits/day, endings distribution, event coverage and stuck detection.
// Exits non-zero on exception or soft-lock.
import { Game } from '../src/core/game.js';
import { C } from '../src/core/content.js';
import { setStorage, memoryStorage } from '../src/core/save.js';
import { RNG, hashString } from '../src/core/rng.js';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------------------------------------------
// navigation helpers (read-only use of g.state)
function graph(g) {
  const adj = {};
  for (const [a, b] of g.state.galaxy.lanes) { (adj[a] ||= []).push(b); (adj[b] ||= []).push(a); }
  return adj;
}
const known = (g, id) => g.system(id).status !== 'unknown';
/** BFS over known systems to the nearest system satisfying goal(sys). Returns {path:[ids], target} or null. */
function route(g, goal, from = g.state.pos) {
  const adj = graph(g);
  const prev = { [from]: null };
  const q = [from];
  while (q.length) {
    const u = q.shift();
    if (u !== from && goal(g.system(u))) {
      const path = []; let c = u;
      while (c !== from) { path.unshift(c); c = prev[c]; }
      return { path, target: u };
    }
    for (const v of adj[u] || []) if (!(v in prev) && known(g, v)) { prev[v] = u; q.push(v); }
  }
  return null;
}
const hasRepair = (s) => !!(s.station && s.station.services.includes('repair'));
function fuelTo(g, path, from = g.state.pos) {
  let cost = 0; let cur = from;
  for (const id of path) { const n = g.neighbors(cur).find((x) => x.id === id); if (!n) return Infinity; cost += n.fuelCost; cur = id; }
  return cost;
}
/** fuel needed to get from `id` to the nearest repair station (hops over known systems) */
function fuelToStation(g, id) {
  if (hasRepair(g.system(id))) return 0;
  const r = route(g, hasRepair, id);
  return r ? fuelTo(g, r.path, id) : 6;
}

// ---------------------------------------------------------------------------------------------------------------
// event choice policies
function chooseEvent(g, policy, rnd) {
  const v = g.pendingView();
  if (!v) return;
  if (v.continueOnly || !v.choices.length) { g.resolveChoice(0); return; }
  const ok = v.choices.filter((c) => c.enabled);
  if (!ok.length) { g.resolveChoice(0); return; }
  let pick;
  if (policy === 'random') pick = rnd.pick(ok);
  else {
    const score = (c) => {
      let s = c.odds !== undefined ? c.odds : 0.75;
      if (policy === 'cautious' && c.tag === 'flee') s -= 0.15;
      if (c.tag === 'wait') s += 0.02;
      return s + rnd.next() * ((policy === 'story' || policy === 'explorer') ? 0.4 : 0.05);
    };
    pick = ok.slice().sort((a, b) => score(b) - score(a))[0];
  }
  const r = g.resolveChoice(pick.index);
  if (!r.ok) g.resolveChoice(ok[0].index);
}

// ---------------------------------------------------------------------------------------------------------------
// the policies: each returns after taking ONE meaningful action (or a rest)
function manage(g, policy, mem, rnd) {
  const st = g.state;
  const sys = g.here();
  const careful = policy === 'cautious' || policy === 'story' || policy === 'explorer';
  const reckless = policy === 'reckless';
  const s = sys.station;
  if (!s) return;
  if (!st.docked) g.dock();
  if (st.pending || st.phase === 'ended') return;
  const svc = (n) => s.services.includes(n);
  // sell cargo (greedy/cautious sell everything they hold that's profitable or aged)
  if (svc('trade')) {
    const m = g.market();
    if (m) for (const gd of m.goods) {
      if (!gd.held) continue;
      const basis = mem.basis[gd.id] || 0;
      const wanted = g.activeMissions().some((am) => am.objectives.some((o) => !o.done && /\b(deliver|bring)\b/i.test(o.text) && o.text.includes(gd.name)));
      if (wanted) continue;
      if (gd.sell && (gd.sell >= basis * 0.98 || mem.holdDays > 12)) g.sell(gd.id, gd.held);
    }
  }
  if (svc('repair')) {
    const frac = policy === 'cautious' ? 0.33 : careful ? 0.8 : reckless ? 0.15 : 0.6; // cautious = a sensible player who lets minor scrapes ride
    if (st.ship.hull < st.ship.hullMax * frac) g.repair('max');
    if (st.ship.fuel < st.ship.fuelMax * (careful ? 0.9 : reckless ? 0.45 : 0.7)) g.refuel('max');
    if (st.ship.supplies < st.ship.suppliesMax * (careful ? 0.8 : reckless ? 0.35 : 0.6)) g.restock('max');
  }
  if (svc('missions') && st.missions.active.length < 4) {
    const offers = g.missionBoard().slice().sort((a, b) => ((b.arc === 'main' ? 1e6 : 0) + (b.reward.credits || 0)) - ((a.arc === 'main' ? 1e6 : 0) + (a.reward.credits || 0)));
    for (const o of offers) {
      if (st.missions.active.length >= 4) break;
      const noExtra = o.deadlineDays !== null && o.deadlineDays !== undefined && o.deadlineDays < 6;
      if (noExtra) continue;
      g.acceptMission(o.id);
      if (st.pending) return;
    }
  }
  // buy goods for "have" objectives
  if (svc('trade')) {
    for (const am of st.missions.active) for (const o of am.objectives) {
      if (o.type === 'have' && o.good && !o.done) {
        const need = (Number(o.qty) || 1) - (st.cargo[o.good] || 0);
        if (need > 0) {
          const gd = (g.market() || { goods: [] }).goods.find((x) => x.id === o.good);
          if (gd && gd.buy && gd.buy * need <= st.credits * (careful ? 0.4 : 0.7)) { const r = g.buy(o.good, need); if (r.ok) mem.basis[o.good] = 9999; }
        }
      }
    }
    if (policy === 'greedy') {
      const m = g.market();
      if (m && st.credits > 150) {
        const cand = m.goods.filter((x) => x.buy && x.stock > 3 && x.buy < x.base * 0.88 && !x.held).sort((a, b) => a.buy / a.base - b.buy / b.base)[0];
        if (cand) {
          const room = st.ship.cargoMax - g.cargoUsed();
          const qty = Math.min(Math.floor(room / cand.bulk), Math.floor((st.credits - 100) / cand.buy), 12);
          if (qty > 0) { const r = g.buy(cand.id, qty); if (r.ok) { mem.basis[cand.id] = r.cost / r.qty; mem.holdDays = 0; } }
        }
      }
    }
  }
  if (svc('shipyard')) {
    mem.yardDay = st.day;
    const reserve = careful ? 250 : 120;
    const prio = ['engine', 'hull', 'cargo', 'sensors', 'lounge', 'lab', 'comms', 'special'];
    const opts = g.shipyard().filter((u) => u.available && u.price <= st.credits - reserve && !u.reward);
    opts.sort((a, b) => prio.indexOf(a.slot) - prio.indexOf(b.slot) || a.price - b.price);
    if (opts[0] && !(opts[0].tier < 2 && opts[0].price > 400)) { const r = g.buyUpgrade(opts[0].id); if (r.ok) (mem.upgDays ||= []).push(st.day); }
  }
  if (svc('crew') && st.crew.length < (policy === 'explorer' ? 7 : 6) && st.credits > (policy === 'explorer' ? 250 : 400)) {
    const c = g.crewForHire().find((x) => x.available && x.hireCost < st.credits - 150);
    if (c) g.hireCrew(c.id);
  }
}

function pickDestination(g, policy, mem, rnd) {
  const st = g.state;
  // a player with money to burn heads for a shipyard (every ~12 days at most)
  if (policy !== 'random' && policy !== 'reckless' && st.credits > 520 && st.day - (mem.yardDay || -99) > 10) {
    const hereYard = g.here().station && g.here().station.services.includes('shipyard');
    if (!hereYard) {
      const r = route(g, (x) => x.station && x.station.services.includes('shipyard'));
      if (r && r.path.length <= 4) return r;
    } else mem.yardDay = st.day;
  }
  if (policy === 'explorer') {
    const ah = st.galaxy.systems.find((x) => x.story === 'archive_heart');
    if (ah && ah.status !== 'unknown' && !ah.planets.every((p) => p.landed || p.type === 'gas') && ah.id !== st.pos) { const r0 = route(g, (x) => x.id === ah.id); if (r0) return r0; }
  }
  if (policy === 'story') {
    const no = g.nextObjective();
    if (no && no.systemId && no.systemId !== st.pos) { const r0 = route(g, (x) => x.id === no.systemId); if (r0) return r0; }
  }
  // 1. mission targets (skip deliveries we cannot yet fulfil)
  let bestMission = null;
  for (const am of st.missions.active) {
    for (const o of am.objectives) {
      if (o.done) continue;
      if (am.ordered && am.objectives.find((x) => !x.done && !x.optional) !== o) continue;
      let tgt = o.deliverResolved || o.resolved;
      if (o.type === 'have') {
        const held = o.good ? (st.cargo[o.good] || 0) : (st.items[o.item] || 0);
        if (held < (Number(o.qty) || 1)) tgt = null;
      }
      if (o.type === 'scan' && o.what === 'phenomenon' && !tgt) tgt = null;
      if (tgt && tgt !== st.pos) { const r = route(g, (s) => s.id === tgt); if (r && (!bestMission || r.path.length < bestMission.path.length)) bestMission = r; }
    }
  }
  // 2. retire when ready
  const sv = g.surveyProgress();
  if ((policy === 'cautious' && sv.pct >= 65) || ((policy === 'greedy' || policy === 'reckless') && sv.pct >= 85)) {
    if (g.canRetire().ok) return null; // handled by caller
    const r = route(g, (s) => s.station && (s.station.faction === 'concord' || /meridian/i.test(s.station.name)));
    if (r) return r;
  }
  // 3. unexplored: unvisited first, then uncharted (missions only when about as close)
  let r = route(g, (s) => s.status === 'detected') || route(g, (s) => s.status === 'visited');
  if (bestMission && (!r || bestMission.path.length <= r.path.length + 1)) return bestMission;
  if (r) return r;
  const any = route(g, (s) => s.id !== st.pos && hasRepair(s));
  return any;
}

function actCareful(g, policy, mem, rnd) {
  const st = g.state;
  const sys = g.here();
  // local survey work
  if (sys.planets.some((p) => !p.scanned) && st.ship.supplies >= 3) { g.scanSystem(); if (st.pending) return; }
  if (policy !== 'random') {
    for (const p of sys.planets) {
      if (p.scanned && !p.landed && p.type !== 'gas' && st.ship.hull > 40 && (policy === 'cautious' || rnd.chance(0.7))) { g.landingParty(p.id); if (st.pending) return; }
    }
    for (const ph of sys.phenomena) {
      if (!sys.investigated || sys.investigated[ph] === undefined || st.day - sys.investigated[ph] >= 20) { const r = g.investigate(ph); if (r.ok && st.pending) return; }
    }
    if (sys.station && !mem.hailed.has(sys.id)) { mem.hailed.add(sys.id); g.hail(); if (st.pending) return; }
  }
  if (sys.station) { manage(g, policy, mem, rnd); if (st.pending || st.phase === 'ended') return; }
  // social time: chat with the crew now and then, rest occasionally (keeps morale up, exercises idle/crew events)
  if (policy !== 'reckless' && !st.pending && st.docked && (st.day - (mem.lastChat || 0)) > (policy === 'explorer' ? 4 : 9)) {
    mem.lastChat = st.day;
    const c = rnd.pick(st.crew); if (c) g.crewTalk(c.id);
    if (st.pending) return;
    if ((rnd.chance(0.5) || (policy === 'explorer' && st.ship.morale < 75)) && st.ship.supplies > 10) { g.rest(policy === 'explorer' ? 2 : 1); if (st.pending) return; }
  }
  if (g.canRetire().ok) {
    const sv = g.surveyProgress();
    if ((policy === 'cautious' && sv.pct >= 65) || ((policy === 'greedy' || policy === 'reckless') && sv.pct >= 85)) { g.retire(); return; }
  }
  // fuel safety: if the next hop would leave us below the return reserve, go to a station first
  const margin = (policy === 'cautious' || policy === 'story') ? 3 : policy === 'reckless' ? 0 : 1;
  let dest = pickDestination(g, policy, mem, rnd);
  if (!dest) { g.rest(1); return; }
  const next = dest.path[0];
  const nb = g.neighbors().find((n) => n.id === next);
  if (nb && st.ship.fuel - nb.fuelCost < fuelToStation(g, next) + margin) {
    // can we refuel here? then do so, else head to a station
    if (sys.station && sys.station.services.includes('repair') && st.docked) { g.refuel('max'); }
    if (st.ship.fuel - nb.fuelCost < fuelToStation(g, next) + margin) {
      const r2 = route(g, hasRepair);
      if (r2 && r2.path.length && !(sys.station && st.docked)) dest = r2;
      else if (sys.station && !r2) { g.rest(1); return; }
    }
  }
  // supplies: head home when low
  if (st.ship.supplies < 6 && !hasRepair(sys)) { const r3 = route(g, hasRepair); if (r3) dest = r3; }
  const nxt = dest.path[0];
  const can = g.canJump(nxt);
  if (!can.ok) { g.rest(1); return; }
  const wasDocked = st.docked;
  // loop breaker: a player who keeps revisiting the same harbour gives up on the jobs causing it
  mem.recent = mem.recent || [];
  mem.recent.push(st.pos); if (mem.recent.length > 20) mem.recent.shift();
  if (mem.recent.filter((x) => x === st.pos).length >= 5) {
    for (const m of st.missions.active.slice()) if (m.arc !== 'main') g.abandonMission(m.id);
    mem.recent = [];
  }
  if (wasDocked) g.undock();
  g.jump(nxt);
  mem.holdDays = (mem.holdDays || 0) + can.days;
}

function actRandom(g, mem, rnd) {
  const st = g.state;
  const sys = g.here();
  const acts = [];
  const jumps = g.neighbors().filter((n) => g.canJump(n.id).ok);
  if (jumps.length) acts.push([5, () => g.jump(rnd.pick(jumps).id)]);
  const unscanned = sys.planets.filter((x) => !x.scanned);
  if (unscanned.length) acts.push([3, () => g.scanPlanet(rnd.pick(unscanned).id)]);
  const landable = sys.planets.filter((x) => x.scanned && !x.landed && x.type !== 'gas');
  if (landable.length) acts.push([1, () => g.landingParty(rnd.pick(landable).id)]);
  if (sys.phenomena.length) acts.push([1, () => g.investigate(rnd.pick(sys.phenomena))]);
  if (sys.station && !st.docked) acts.push([2, () => g.dock()]);
  if (st.docked) {
    acts.push([1, () => g.undock()]);
    const m = g.market();
    if (m && m.goods.length) acts.push([2, () => { const gd = rnd.pick(m.goods); return rnd.chance(0.5) ? g.buy(gd.id, rnd.int(1, 4)) : g.sell(gd.id, rnd.int(1, 4)); }]);
    const offers = g.missionBoard();
    if (offers.length) acts.push([1, () => g.acceptMission(rnd.pick(offers).id)]);
    acts.push([1, () => (rnd.chance(0.5) ? g.refuel(rnd.int(1, 20)) : rnd.chance(0.5) ? g.repair(rnd.int(1, 20)) : g.restock(rnd.int(1, 20)))]);
    const ups = g.shipyard().filter((u) => u.available);
    if (ups.length) acts.push([0.5, () => g.buyUpgrade(rnd.pick(ups).id)]);
  }
  acts.push([1, () => g.hail()]);
  acts.push([1, () => g.rest(rnd.int(1, 3))]);
  if (st.crew.length) acts.push([0.5, () => g.crewTalk(rnd.pick(st.crew).id)]);
  const pick = rnd.weighted(acts, (a) => a[0]);
  pick[1]();
}

// ---------------------------------------------------------------------------------------------------------------
/** Play one full game. Returns a result record. */
export function playGame({ seed = 1, policy = 'cautious', maxDays = 600, maxSteps = 8000, difficulty = 'standard', onEvent } = {}) {
  const rnd = new RNG(hashString(`bot:${policy}:${seed}`));
  const res = { seed, policy, ending: null, kind: null, day: 0, credits: 0, steps: 0, stuck: false, timeout: false, error: null, events: [], tows: 0, survey: 0, score: 0, missions: 0 };
  let g;
  try {
    g = Game.create({ seed, captainName: 'Bot', shipName: 'Halcyon', difficulty, legacy: false, autosave: false });
    const mem = { basis: {}, hailed: new Set(), holdDays: 0 };
    res.mem = mem;
    let lastDay = g.state.day; let sameDay = 0;
    while (g.state.phase !== 'ended') {
      res.steps++;
      if (res.steps > maxSteps) { res.timeout = true; break; }
      if (g.state.day > maxDays) { res.timeout = true; break; }
      if (g.state.day >= (res.nextSample ?? 10)) { (res.timeline ||= []).push([g.state.day, g.state.credits]); res.nextSample = (res.nextSample ?? 10) + 10; }
      if (g.state.pending) { chooseEvent(g, policy, rnd); }
      else if (policy === 'random') actRandom(g, mem, rnd);
      else actCareful(g, policy, mem, rnd);
      if (g.state.day === lastDay) { if (++sameDay > 400) { res.stuck = true; break; } } else { sameDay = 0; lastDay = g.state.day; }
    }
  } catch (e) {
    res.error = (e && e.stack) || String(e);
  }
  if (g) {
    const st = g.state;
    res.day = st.day; res.credits = st.credits; res.tows = st.stats.tows || 0; res.survey = g.surveyProgress().pct; res.missions = st.stats.missionsDone || 0;
    res.events = Object.keys(st.evt.seen);
    res.upgDays = (res.mem && res.mem.upgDays) || [];
    res.upgrades = st.upgrades.length;
    res.brokeDays = (res.timeline || []).filter(([d, c]) => d >= 20 && c < 30).length;
    delete res.mem;
    if (st.ending) { res.ending = st.ending.id; res.kind = st.ending.kind; res.score = st.ending.score; }
  }
  return res;
}

// ---------------------------------------------------------------------------------------------------------------
function summarize(results, policy) {
  const n = results.length;
  const wins = results.filter((r) => r.ending && r.kind !== 'loss').length;
  const lantern = results.filter((r) => r.ending && /^lantern_/.test(r.ending)).length;
  const losses = results.filter((r) => r.kind === 'loss').length;
  const timeouts = results.filter((r) => r.timeout && !r.ending).length;
  const stuck = results.filter((r) => r.stuck).length;
  const errors = results.filter((r) => r.error).length;
  const strand = results.filter((r) => r.tows > 0).length;
  const pct = (x) => ((100 * x) / n).toFixed(1) + '%';
  const avg = (f) => (results.reduce((a, r) => a + f(r), 0) / n).toFixed(1);
  const endings = {};
  for (const r of results) endings[r.ending || (r.timeout ? 'TIMEOUT' : 'none')] = (endings[r.ending || (r.timeout ? 'TIMEOUT' : 'none')] || 0) + 1;
  const seen = new Set(results.flatMap((r) => r.events));
  const never = C.EVENTS.filter((e) => !seen.has(e.id)).map((e) => e.id);
  const cpd = results.reduce((a, r) => a + r.credits / Math.max(1, r.day), 0) / n;
  const out = [];
  out.push(`policy=${policy} runs=${n}`);
  out.push(`non-loss endings: ${pct(wins)} | lantern_* endings: ${pct(lantern)} | loss endings: ${pct(losses)} | timeouts: ${pct(timeouts)} | needed a tow: ${pct(strand)}`);
  out.push(`avg days: ${avg((r) => r.day)} | avg credits at end: ${avg((r) => r.credits)} | credits/day (end balance): ${cpd.toFixed(1)} | avg survey: ${avg((r) => r.survey)}% | avg missions: ${avg((r) => r.missions)} | avg score: ${avg((r) => r.score)}`);
  out.push('endings: ' + Object.entries(endings).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(', '));
  out.push(`event coverage: ${seen.size - [...seen].filter((id) => id.startsWith('core_')).length}/${C.EVENTS.length}; never fired (${never.length}): ${never.join(', ') || '-'}`);
  const at = (day) => { const v = results.map((r) => (r.timeline || []).find(([d]) => d === day)).filter(Boolean).map((x) => x[1]); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : '-'; };
  out.push(`credits over time (avg, day 20/40/60/90/120/160): ${[20, 40, 60, 90, 120, 160].map(at).join(' / ')}`);
  const gaps = results.flatMap((r) => r.upgDays.map((d, i) => d - (i ? r.upgDays[i - 1] : 0)));
  const firstUp = results.filter((r) => r.upgDays.length).map((r) => r.upgDays[0]);
  out.push(`upgrades: ${(results.reduce((a, r) => a + r.upgrades, 0) / n).toFixed(1)}/run | first upgrade day ${firstUp.length ? (firstUp.reduce((a, b) => a + b, 0) / firstUp.length).toFixed(0) : '-'} | avg days between upgrades ${gaps.length ? (gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(1) : '-'} | broke (<30 scrip after day 20) in ${pct(results.filter((r) => r.brokeDays >= 2).length)} of runs`);
  out.push(`stuck: ${stuck} | exceptions: ${errors}`);
  return { text: out.join('\n'), wins: wins / n, stuck, errors, timeouts };
}

function parseArgs(argv) {
  const a = { runs: 200, policy: 'cautious', seed: 1, days: 600, difficulty: 'standard', verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--runs') a.runs = +argv[++i];
    else if (k === '--policy') a.policy = argv[++i];
    else if (k === '--seed') a.seed = +argv[++i];
    else if (k === '--days') a.days = +argv[++i];
    else if (k === '--difficulty') a.difficulty = argv[++i];
    else if (k === '--verbose') a.verbose = true;
  }
  return a;
}

async function main() {
  setStorage(memoryStorage());
  Game.strict = true;
  const a = parseArgs(process.argv.slice(2));
  const policies = a.policy === 'all' ? ['random', 'reckless', 'greedy', 'cautious', 'story', 'explorer'] : [a.policy];
  let fail = false;
  for (const policy of policies) {
    const results = [];
    for (let i = 0; i < a.runs; i++) {
      const r = playGame({ seed: a.seed + i, policy, maxDays: a.days, difficulty: a.difficulty });
      results.push(r);
      if (r.error) { console.error(`EXCEPTION seed ${r.seed}:\n${r.error}`); fail = true; }
      if (r.stuck) { console.error(`SOFT-LOCK seed ${r.seed} policy ${policy} day ${r.day}`); fail = true; }
      if (a.verbose) console.log(`seed ${r.seed}: ${r.ending || (r.timeout ? 'TIMEOUT' : 'none')} day ${r.day} credits ${r.credits} survey ${r.survey}% tows ${r.tows}`);
    }
    const s = summarize(results, policy);
    console.log(s.text + '\n');
  }
  process.exit(fail ? 1 : 0);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
