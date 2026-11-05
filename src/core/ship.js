// Derived ship stats, skills, upgrade slot logic and service pricing. Pure functions over `state`.
import { C, IDX, SKILLS } from './content.js';

/** Difficulty tuning table (single source of truth). */
export const DIFF = {
  cozy:     { fuel: 0.85, upkeep: 0.7,  damage: 0.5,  odds: 0.07,  reward: 1.2,  price: 0.9,  deadline: 1.6,  hazard: 0.6,  tow: 0.6,  floors: true },
  standard: { fuel: 1.0,  upkeep: 1.0,  damage: 1.0,  odds: 0,     reward: 1.0,  price: 1.0,  deadline: 1.0,  hazard: 1.0,  tow: 1.0,  floors: false },
  rigorous: { fuel: 1.15, upkeep: 1.2,  damage: 1.3,  odds: -0.05, reward: 0.9,  price: 1.08, deadline: 0.85, hazard: 1.3,  tow: 1.3,  floors: false },
};
export const diffOf = (state) => DIFF[state.difficulty] || DIFF.standard;

export const BASE = { fuelMax: 40, suppliesMax: 40, hullMax: 100, cargoMax: 16, scanRange: 1, jumpRange: 1, efficiency: 1 };
/** Base sensor radius (map units) beyond lane-neighbours, scaled by scanRange. */
export const SENSOR_RADIUS = 300;

export function installed(state) {
  return (state.upgrades || []).map((id) => IDX.upgrade[id]).filter(Boolean);
}
export function hasSpecial(state, id) {
  return (state.upgrades || []).some((u) => IDX.upgrade[u] && IDX.upgrade[u].special === id);
}
export function hasUpgrade(state, id) {
  return (state.upgrades || []).includes(id) || hasSpecial(state, id);
}

/** Sum of mods from crew traits (TRAITS[t].mods uses the ship-bonus keys). */
function crewMods(state) {
  const out = { moraleRegen: 0, repairPerDay: 0, priceSell: 0, buyDiscount: 0, skills: {} };
  for (const c of state.crew || []) {
    const t = C.TRAITS[c.trait];
    const m = t && t.mods;
    if (!m) continue;
    for (const k of ['moraleRegen', 'repairPerDay', 'priceSell', 'buyDiscount']) out[k] += m[k] || 0;
    for (const [s, v] of Object.entries(m.skills || {})) out.skills[s] = (out.skills[s] || 0) + v;
  }
  return out;
}

/** Full derived stat block (contract §3 g.shipStats()). */
export function derive(state) {
  const s = { ...BASE, slots: { used: 0, total: C.SLOT_COUNT || 8 }, bonuses: {}, moraleRegen: 0, repairPerDay: 0, priceSell: 0, buyDiscount: 0, specials: [] };
  const sk = {};
  let eff = 1;
  let scan = 0;
  let jump = 0;
  for (const u of installed(state)) {
    const b = u.bonus || {};
    s.fuelMax += b.fuelMax || 0;
    s.suppliesMax += b.suppliesMax || 0;
    s.hullMax += b.hullMax || 0;
    s.cargoMax += b.cargoMax || 0;
    scan += b.scanRange || 0;
    jump += b.jumpRange || 0;
    if (typeof b.efficiency === 'number') eff *= b.efficiency;
    s.moraleRegen += b.moraleRegen || 0;
    s.repairPerDay += b.repairPerDay || 0;
    s.priceSell += b.priceSell || 0;
    s.buyDiscount += b.buyDiscount || 0;
    for (const [k, v] of Object.entries(b.skills || {})) sk[k] = (sk[k] || 0) + v;
    if (u.special) s.specials.push(u.special);
    s.slots.used++;
  }
  const cm = crewMods(state);
  s.moraleRegen += cm.moraleRegen;
  s.repairPerDay += cm.repairPerDay;
  s.priceSell += cm.priceSell;
  s.buyDiscount += cm.buyDiscount;
  s.scanRange = 1 + scan;
  s.jumpRange = 1 + jump;
  s.efficiency = Math.max(0.4, eff);
  s.bonuses = sk;
  s.fuelMax = Math.round(s.fuelMax);
  s.suppliesMax = Math.round(s.suppliesMax);
  s.hullMax = Math.round(s.hullMax);
  s.cargoMax = Math.round(s.cargoMax);
  s.sensorRadius = Math.round(SENSOR_RADIUS * s.scanRange);
  return s;
}

/** Re-derive maxima into state.ship and clamp current values. */
export function recompute(state) {
  const d = derive(state);
  const sh = state.ship;
  sh.fuelMax = d.fuelMax; sh.suppliesMax = d.suppliesMax; sh.hullMax = d.hullMax; sh.cargoMax = d.cargoMax;
  sh.fuel = clamp(sh.fuel, 0, sh.fuelMax);
  sh.supplies = clamp(sh.supplies, 0, sh.suppliesMax);
  sh.hull = clamp(sh.hull, 0, sh.hullMax);
  sh.morale = clamp(sh.morale, 0, 100);
  return d;
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---- crew & skills -----------------------------------------------------------------------------------------
export function effectiveCrewSkill(c, skill) {
  let v = (c.skills && c.skills[skill]) || 0;
  if (c.mood !== undefined && c.mood < 25) v -= 1; // sulking crew are a little less sharp
  return Math.max(0, v);
}
export function bestCrew(state, skill) {
  let best = null;
  for (const c of state.crew || []) {
    const v = effectiveCrewSkill(c, skill);
    if (!best || v > best.v) best = { v, c };
  }
  return best ? best.c : null;
}
export function skillTotal(state, skill) {
  const b = bestCrew(state, skill);
  const crew = b ? effectiveCrewSkill(b, skill) : 0;
  const d = derive(state);
  const cm = crewMods(state);
  return crew + (d.bonuses[skill] || 0) + (cm.skills[skill] || 0);
}

/**
 * Odds for a skill check. Contract: clamp(0.1, 0.95, 0.5 + 0.11*(skillTotal - diff)).
 * Difficulty shifts by a few points; specials / traits add small bonuses. opts: { tag, faction, species }.
 */
export function checkOdds(state, skill, diff, opts = {}) {
  let total = skillTotal(state, skill);
  let bonus = diffOf(state).odds;
  if (hasSpecial(state, 'slide_rule_array') && (skill === 'science' || skill === 'engineering')) bonus += 0.05;
  if (hasSpecial(state, 'barrel_roll_gyro') && skill === 'piloting' && opts.tag === 'flee') bonus += 0.10;
  if (hasSpecial(state, 'translator_parrot') && skill === 'diplomacy' && ['vesperine', 'archivists', 'unknown'].includes(opts.faction || opts.species)) total += 1;
  const b = bestCrew(state, skill);
  if (b) {
    if (b.trait === 'perfectionist' && b.role === skill) bonus += 0.05;
    if (b.trait === 'steady_hands' && (skill === 'medicine' || skill === 'engineering')) bonus += 0.05;
    if (b.trait === 'bluntly_literal' && skill === 'diplomacy' && (opts.faction === 'archivists' || opts.species === 'archivist')) total += 1;
  }
  return Math.round(clamp(0.5 + 0.11 * (total - diff) + bonus, 0.1, 0.95) * 100) / 100;
}

// ---- upgrades ----------------------------------------------------------------------------------------------
export function installedInSlot(state, slot) {
  return installed(state).find((u) => u.slot === slot) || null;
}

/** Can this upgrade be bought here/now? Returns {ok, reason?, tradeIn?, price} (price already net of trade-in). */
export function upgradeStatus(state, up, opts = {}) {
  const owned = (state.upgrades || []).includes(up.id);
  if (owned) return { ok: false, reason: 'Already installed', owned: true, price: up.cost };
  if (up.reward && !opts.free) return { ok: false, reason: 'Awarded through missions and favours', price: 0 };
  for (const r of up.requires || []) {
    if (!(state.upgrades || []).includes(r)) {
      const ru = IDX.upgrade[r];
      return { ok: false, reason: `Requires ${ru ? ru.name : r} installed`, price: up.cost };
    }
  }
  if (up.repGate && !opts.free) {
    const have = (state.rep && state.rep[up.repGate.faction]) || 0;
    if (have < up.repGate.min) {
      const f = C.FACTIONS[up.repGate.faction];
      return { ok: false, reason: `Needs ${up.repGate.min} standing with ${f ? f.name : up.repGate.faction}`, price: up.cost };
    }
  }
  const old = installedInSlot(state, up.slot);
  const tradeIn = old ? Math.floor((old.cost || 0) * 0.5) : 0;
  const price = Math.max(0, (up.cost || 0) - tradeIn);
  return { ok: true, price, tradeIn, replaces: old ? old.id : null };
}

/** Install (replacing the slot occupant). No money handling here. Returns the replaced id or null. */
export function installUpgrade(state, id) {
  const up = IDX.upgrade[id];
  if (!up) return { ok: false, reason: 'Unknown upgrade' };
  const old = installedInSlot(state, up.slot);
  if (old) state.upgrades = state.upgrades.filter((x) => x !== old.id);
  state.upgrades.push(id);
  recompute(state);
  return { ok: true, replaced: old ? old.id : null };
}

export function removeUpgrade(state, id) {
  state.upgrades = state.upgrades.filter((x) => x !== id);
  recompute(state);
}

// ---- service pricing (refuel / repair / restock) ----------------------------------------------------------
export const SERVICE_BASE = { fuel: 4, supplies: 3, repair: 3 };

export function repDiscount(rep) {
  if (rep >= 60) return 0.10;
  if (rep >= 25) return 0.05;
  if (rep <= -30) return -0.10; // surcharge for the disliked
  return 0;
}

/** Per-unit service prices at a system (null if no station with services). */
export function servicePrices(state, system, hash01) {
  if (!system || !system.station) return null;
  const st = system.station;
  const d = derive(state);
  const regional = 0.9 + 0.25 * hash01(`svc|${state.seed}|${system.id}`); // 0.9..1.15
  const remote = st.kind === 'outpost' ? 1.15 : st.kind === 'habitat' ? 1.05 : 1;
  const rep = (state.rep && st.faction && state.rep[st.faction]) || 0;
  let mult = regional * remote * diffOf(state).price * (1 - repDiscount(rep)) * (1 - Math.min(0.25, d.buyDiscount));
  if (hasSpecial(state, 'bulk_contracts')) mult *= 0.85;
  const f = (b) => Math.max(1, Math.round(b * mult * 10) / 10);
  return { fuel: f(SERVICE_BASE.fuel), supplies: f(SERVICE_BASE.supplies), repair: f(SERVICE_BASE.repair) };
}

export { SKILLS };
