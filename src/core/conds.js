// Condition evaluation (contract §5). `g` is the Game (needs state, rng, skillTotal, surveyProgress).
// An object with several keys = AND. An array = AND. Returns { ok, reason? }; never throws.
import { C, IDX, goodName, itemName, upgradeName, factionName, prettify } from './content.js';
import { hasUpgrade } from './ship.js';

const ok = () => ({ ok: true });
const no = (reason) => ({ ok: false, reason });

/** Keys the evaluator understands (used by content validation). */
export const COND_KEYS = new Set([
  'credits', 'fuel', 'supplies', 'hull', 'morale', 'item', 'cargo', 'flag', 'notFlag', 'flagEq', 'rep', 'upgrade', 'skill',
  'crewRole', 'crew', 'day', 'mission', 'missionDone', 'codex', 'survey', 'system', 'planetType', 'feature', 'phenomenon',
  'random', 'not', 'any', 'counter', 'orbit', 'docked', 'visited', 'ringed',
]);

function ctxSystem(g, ctx) {
  const id = (ctx && ctx.systemId) || g.state.pos;
  return g.state.galaxy.systems.find((s) => s.id === id) || null;
}
function ctxPlanet(g, ctx, sys) {
  const pid = (ctx && ctx.planetId) || g.state.orbit;
  return sys && pid ? sys.planets.find((p) => p.id === pid) || null : null;
}

function evalOne(g, key, val, ctx, opts) {
  const st = g.state;
  switch (key) {
    case 'credits': return st.credits >= val ? ok() : no(`Needs ${val} scrip`);
    case 'fuel': return st.ship.fuel >= val ? ok() : no(`Needs ${val} fuel`);
    case 'supplies': return st.ship.supplies >= val ? ok() : no(`Needs ${val} supplies`);
    case 'hull': return st.ship.hull >= val ? ok() : no(`Needs ${val} hull integrity`);
    case 'morale': return st.ship.morale >= val ? ok() : no(`Needs ${val} morale`);
    case 'item': {
      const need = typeof val === 'string' ? { [val]: 1 } : val || {};
      for (const [id, n] of Object.entries(need)) if ((st.items[id] || 0) < n) return no(`Needs ${n > 1 ? n + ' x ' : ''}${itemName(id)}`);
      return ok();
    }
    case 'cargo': {
      const need = typeof val === 'string' ? { [val]: 1 } : val || {};
      for (const [id, n] of Object.entries(need)) if ((st.cargo[id] || 0) < n) return no(`Needs ${n} x ${goodName(id)} in the hold`);
      return ok();
    }
    case 'flag': return st.flags[val] ? ok() : no('Not yet unlocked');
    case 'notFlag': return !st.flags[val] ? ok() : no('No longer possible');
    case 'flagEq': {
      for (const [k, v] of Object.entries(val || {})) if (st.flags[k] !== v) return no('Not yet unlocked');
      return ok();
    }
    case 'counter': {
      for (const [k, v] of Object.entries(val || {})) if ((st.counters[k] || 0) < v) return no('Not yet unlocked');
      return ok();
    }
    case 'rep': {
      for (const [f, min] of Object.entries(val || {})) {
        const have = st.rep[f] || 0;
        if (min >= 0 ? have < min : have > min) return no(min >= 0 ? `Needs standing ${min} with ${factionName(f)}` : `Only if ${factionName(f)} think poorly of you`);
      }
      return ok();
    }
    case 'upgrade': {
      const ids = Array.isArray(val) ? val : [val];
      for (const id of ids) if (!hasUpgrade(st, id)) return no(`Needs ${upgradeName(id)}`);
      return ok();
    }
    case 'skill': {
      for (const [s, min] of Object.entries(val || {})) if (g.skillTotal(s) < min) return no(`Needs ${prettify(s)} ${min}`);
      return ok();
    }
    case 'crewRole': return st.crew.some((c) => c.role === val) ? ok() : no(`Needs a ${prettify(val)} specialist`);
    case 'crew': return st.crew.some((c) => c.id === val) ? ok() : no('Needs a particular crew member aboard');
    case 'day': {
      const [lo, hi] = Array.isArray(val) ? val : [val, null];
      if (lo != null && st.day < lo) return no('Too early');
      if (hi != null && st.day > hi) return no('Too late');
      return ok();
    }
    case 'mission': return st.missions.active.some((m) => m.defId === val || m.id === val) ? ok() : no('Mission not active');
    case 'missionDone': return st.missions.done.includes(val) ? ok() : no('Mission not completed');
    case 'codex': return st.codex.includes(val) ? ok() : no('Not yet discovered');
    case 'survey': return g.surveyProgress().pct >= val ? ok() : no(`Needs ${val}% surveyed`);
    case 'visited': {
      const s = st.galaxy.systems.find((x) => x.id === val || x.story === val);
      return s && (s.status === 'visited' || s.status === 'charted') ? ok() : no('Not yet visited');
    }
    case 'ringed': {
      const sys = ctxSystem(g, ctx);
      const p = ctxPlanet(g, ctx, sys);
      return (p ? !!p.ringed : false) === !!val || (!p && sys && sys.planets.some((x) => x.ringed) === !!val) ? ok() : no('Needs a ringed world');
    }
    case 'orbit': return st.orbit ? ok() : no('Must be in orbit');
    case 'docked': return st.docked ? ok() : no('Must be docked');
    case 'system': {
      const sys = ctxSystem(g, ctx);
      if (!sys) return no('Nowhere');
      for (const [k, v] of Object.entries(val || {})) {
        let pass = true;
        switch (k) {
          case 'faction': pass = sys.faction === v || !!(sys.station && sys.station.faction === v); break;
          case 'star': pass = sys.star === v; break;
          case 'region': pass = sys.region === v; break;
          case 'hasStation': pass = !!sys.station === !!v; break;
          case 'stationKind': pass = !!sys.station && sys.station.kind === v; break;
          case 'danger': pass = sys.danger >= v; break;
          case 'id': pass = sys.id === v; break;
          case 'story': pass = v === true ? !!sys.story : sys.story === v; break;
          case 'status': pass = sys.status === v; break;
          case 'phenomenon': pass = sys.phenomena.includes(v); break;
          default: pass = false;
        }
        if (!pass) return no('Not here');
      }
      return ok();
    }
    case 'planetType': {
      const p = ctxPlanet(g, ctx, ctxSystem(g, ctx));
      return p && p.type === val ? ok() : no('Wrong kind of world');
    }
    case 'feature': {
      const sys = ctxSystem(g, ctx);
      const p = ctxPlanet(g, ctx, sys);
      if (ctx && ctx.feature === val) return ok();
      if (val === 'ringed') return (p ? p.ringed : sys && sys.planets.some((x) => x.ringed)) ? ok() : no('Needs a ringed world');
      return p && p.features.includes(val) ? ok() : no('Nothing like that here');
    }
    case 'phenomenon': {
      const sys = ctxSystem(g, ctx);
      if (ctx && ctx.phenomenon) return ctx.phenomenon === val ? ok() : no('Nothing like that here');
      return sys && sys.phenomena.includes(val) ? ok() : no('Nothing like that here');
    }
    case 'random': {
      if (opts && opts.noRandom) return ok();
      return g.rng.next() < val ? ok() : no('Chance');
    }
    case 'not': {
      const r = evalCond(g, val, ctx, opts);
      return r.ok ? no('Not available') : ok();
    }
    case 'any': {
      const list = Array.isArray(val) ? val : [];
      if (!list.length) return ok();
      let first = null;
      for (const c of list) {
        const r = evalCond(g, c, ctx, opts);
        if (r.ok) return ok();
        first = first || r;
      }
      return no((first && first.reason) || 'Not available');
    }
    default:
      return no(`Unknown condition "${key}"`);
  }
}

/** Evaluate one condition object (all keys AND). */
export function evalCond(g, cond, ctx = {}, opts = {}) {
  if (cond === null || cond === undefined || cond === true) return ok();
  if (cond === false) return no('Unavailable');
  if (Array.isArray(cond)) return evalConds(g, cond, ctx, opts);
  if (typeof cond !== 'object') return no('Malformed condition');
  for (const [k, v] of Object.entries(cond)) {
    let r;
    try { r = evalOne(g, k, v, ctx, opts); } catch (e) { r = no('Malformed condition'); }
    if (!r.ok) return r;
  }
  return ok();
}

/** Evaluate an AND-list. opts.noRandom => {random} counts as true (for UI previews). */
export function evalConds(g, conds, ctx = {}, opts = {}) {
  if (!conds || (Array.isArray(conds) && conds.length === 0)) return ok();
  const list = Array.isArray(conds) ? conds : [conds];
  for (const c of list) {
    const r = evalCond(g, c, ctx, opts);
    if (!r.ok) return r;
  }
  return ok();
}

export { C, IDX };
