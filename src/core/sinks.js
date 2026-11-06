// Scrip sinks: shipyard rotations and commissions, refits, crew training. Data lives in content/{upgrades,crew}.js.
import { C, IDX } from './content.js';
import { hashFloat, hashString } from './rng.js';
import { applyEffects } from './effects.js';
import * as Ship from './ship.js';

const clamp = Ship.clamp;

/** The current seasonal shipyard rotation at a yard (or null). Changes every ROTATION_DAYS days. */
export function rotation(g, sysId) {
  const list = C.SHIPYARD_ROTATIONS;
  if (!list.length) return null;
  const st = g.state;
  const season = Math.floor((st.day - 1) / C.ROTATION_DAYS);
  const i = hashString(`${st.seed}|rot|${sysId}|${season}`) % list.length;
  const r = list[i];
  const endDay = (season + 1) * C.ROTATION_DAYS;
  return { ...r, daysLeft: Math.max(0, endDay - st.day + 1), season };
}

const EXCLUSIVE_IDS = () => new Set(C.SHIPYARD_ROTATIONS.flatMap((r) => r.exclusive || []));

/** Price/availability of an upgrade at a particular yard right now. */
export function yardOffer(g, sysId, up, base) {
  const rot = rotation(g, sysId);
  const ex = EXCLUSIVE_IDS();
  const isExclusive = ex.has(up.id);
  const offeredHere = !!(rot && (rot.exclusive || []).includes(up.id));
  let price = base.price;
  let sale = false;
  if (rot && rot.discount && (rot.discount.ids || []).includes(up.id)) { price = Math.round(price * (1 - (rot.discount.pct || 0))); sale = true; }
  let days = up.commission ? Math.max(1, up.commission.days - ((rot && rot.commissionBonus) || 0)) : 0;
  let reason = null;
  if (isExclusive && !offeredHere) reason = 'Only offered during a special yard season';
  return { price, sale, days, exclusiveHidden: !!reason, reason, rotation: rot };
}

// ------------------------------------------------------------------ refits
export function refitList(g, sysId) {
  const st = g.state;
  const sys = g.system(sysId);
  const kind = sys && sys.station && sys.station.kind;
  return C.REFITS.map((r) => {
    const owned = (st.refits || []).includes(r.id);
    let reason = null;
    if (!kind || !(r.where || []).includes(kind)) reason = `Not done at ${kind || 'this'} stations`;
    else if (r.once && owned) reason = 'Already fitted';
    else if (st.credits < r.cost) reason = `Needs ${r.cost} scrip`;
    return { id: r.id, name: r.name, desc: r.desc, flavor: r.flavor, cost: r.cost, days: r.days, once: !!r.once, owned, available: !reason, reason, where: r.where };
  });
}
export function buyRefit(g, id) {
  const st = g.state;
  const r = IDX.refit[id];
  if (!r) return { ok: false, reason: 'Unknown refit' };
  const sys = g.here();
  if (!st.docked || !sys.station) return { ok: false, reason: 'You must be docked at a station' };
  const row = refitList(g, sys.id).find((x) => x.id === id);
  if (!row.available) return { ok: false, reason: row.reason };
  st.credits -= r.cost;
  g.advanceDays(r.days || 1, { rest: true, deferCheck: true });
  if (r.once) { st.refits = st.refits || []; st.refits.push(id); }
  const out = applyEffects(g, r.fx || [], { systemId: sys.id });
  Ship.recompute(st);
  g.log('ship', `${r.name} (${r.cost} scrip, ${r.days} day${r.days === 1 ? '' : 's'}).`);
  g.toast(`${r.name}: ${out.summary.join(', ') || 'done'}`, 'good');
  g.emit('sfx', { name: 'repair' });
  g._settle();
  return { ok: true, cost: r.cost, days: r.days, summary: out.summary };
}

// ------------------------------------------------------------------ training
export function trainingOptions(g, crewId, sysId = g.state.pos) {
  const st = g.state;
  const crew = st.crew.find((c) => c.id === crewId);
  const sys = g.system(sysId);
  const kind = sys && sys.station && sys.station.kind;
  if (!crew) return [];
  return C.TRAINING.map((p) => {
    const skill = p.skill || crew.role;
    const cur = (crew.skills && crew.skills[skill]) || 0;
    const price = Math.round(p.cost * (1 + 0.5 * cur));
    let reason = null;
    const last = st.counters[`train_${crew.id}_${skill}`];
    if (!kind || !(p.where || []).includes(kind)) reason = `Not taught at ${kind || 'this'} stations`;
    else if (cur >= p.max) reason = `Already at their ceiling (${p.max}) for this course`;
    else if (p.minRep && (st.rep[p.minRep.faction] || 0) < p.minRep.n) reason = `Needs standing ${p.minRep.n} with ${C.FACTIONS[p.minRep.faction] ? C.FACTIONS[p.minRep.faction].name : p.minRep.faction}`;
    else if (last !== undefined && st.day - last < 20) reason = 'They need a few weeks to absorb the last course';
    else if (st.credits < price) reason = `Needs ${price} scrip`;
    return { id: p.id, name: p.name, desc: p.desc, skill, price, days: p.days, current: cur, max: p.max, available: !reason, reason };
  });
}
export function trainCrew(g, crewId, programId) {
  const st = g.state;
  const crew = st.crew.find((c) => c.id === crewId);
  if (!crew) return { ok: false, reason: 'No such crew member' };
  const p = IDX.training[programId];
  if (!p) return { ok: false, reason: 'Unknown course' };
  const sys = g.here();
  if (!st.docked || !sys.station) return { ok: false, reason: 'You must be docked at a station' };
  const opt = trainingOptions(g, crewId, sys.id).find((x) => x.id === programId);
  if (!opt.available) return { ok: false, reason: opt.reason };
  st.credits -= opt.price;
  g.advanceDays(p.days || 1, { deferCheck: true });
  crew.skills[opt.skill] = clamp((crew.skills[opt.skill] || 0) + 1, 0, 5);
  st.counters[`train_${crew.id}_${opt.skill}`] = st.day;
  applyEffects(g, p.fx || [], { systemId: sys.id });
  Ship.recompute(st);
  g.log('crew', `${crew.name} trained in ${opt.skill} (${p.name}, ${opt.price} scrip).`);
  g.toast(`${crew.name}: ${opt.skill} ${opt.current} -> ${opt.current + 1}`, 'good');
  g.emit('sfx', { name: 'powerup' });
  g._settle();
  return { ok: true, skill: opt.skill, level: crew.skills[opt.skill], cost: opt.price, days: p.days };
}
export { hashFloat };
