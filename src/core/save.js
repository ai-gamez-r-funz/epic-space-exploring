// Persistence: localStorage slots ('auto','1','2'), legacy bonus, version + migration hook.
// All storage access is feature-detected and try/catch-wrapped; tests can inject a storage with setStorage().
export const SAVE_VERSION = 1;
export const SLOTS = ['auto', '1', '2'];
const KEY = (slot) => `halcyon.save.${slot}`;
const LEGACY_KEY = 'halcyon.legacy';

let injected;
export function setStorage(s) { injected = s; }
function storage() {
  if (injected !== undefined) return injected;
  try { if (typeof localStorage !== 'undefined' && localStorage) return localStorage; } catch { /* blocked */ }
  return null;
}
const goodSlot = (slot) => (SLOTS.includes(String(slot)) ? String(slot) : 'auto');

/** In-memory storage for tests / sims. */
export function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, _m: m };
}

/** Migrate older save objects to SAVE_VERSION. Returns state or null if unusable. */
export function migrate(obj) {
  if (!obj || typeof obj !== 'object') return null;
  let s = obj;
  if (!s.v) s.v = 1;
  // future: if (s.v === 1) { ...; s.v = 2 }
  if (s.v > SAVE_VERSION) return null;
  // fill fields added after v1 shipped
  s.rng = Number.isFinite(s.rng) ? s.rng : 1;
  s.evt = s.evt || { seen: {}, recent: [] };
  s.boards = s.boards || {};
  s.markets = s.markets || {};
  s.counters = s.counters || {};
  s.flags = s.flags || {};
  s.items = s.items || {};
  s.cargo = s.cargo || {};
  s.stats = s.stats || {};
  s.log = s.log || [];
  s.codex = s.codex || [];
  if (s.rival === undefined) s.rival = null;
  if (!Array.isArray(s.refits)) s.refits = [];
  if (s.distress === undefined) s.distress = null;
  s.missions = s.missions || { active: [], done: [], failed: [] };
  return s;
}

export function validate(s) {
  if (!s || typeof s !== 'object') return 'not an object';
  if (!s.galaxy || !Array.isArray(s.galaxy.systems) || !Array.isArray(s.galaxy.lanes)) return 'missing galaxy';
  if (!s.ship || typeof s.ship.fuel !== 'number') return 'missing ship';
  if (!Array.isArray(s.crew) || !Array.isArray(s.upgrades)) return 'missing crew/upgrades';
  if (!s.galaxy.systems.some((x) => x.id === s.pos)) return 'bad position';
  return null;
}

export function parse(json) {
  try {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    const st = migrate(obj);
    if (!st) return { ok: false, reason: 'Unsupported save version' };
    const bad = validate(st);
    if (bad) return { ok: false, reason: 'Corrupt save: ' + bad };
    return { ok: true, state: st };
  } catch (e) {
    return { ok: false, reason: 'Unreadable save' };
  }
}

export function writeSlot(json, slot = 'auto') {
  try {
    const st = storage();
    if (!st) return { ok: false, reason: 'Storage unavailable' };
    st.setItem(KEY(goodSlot(slot)), json);
    return { ok: true };
  } catch (e) { return { ok: false, reason: 'Could not write save' }; }
}
export function readSlot(slot = 'auto') {
  try { const st = storage(); return st ? st.getItem(KEY(goodSlot(slot))) : null; } catch { return null; }
}
export function deleteSlot(slot = 'auto') {
  try { const st = storage(); if (st) st.removeItem(KEY(goodSlot(slot))); return { ok: true }; } catch { return { ok: false }; }
}
export function hasSlot(slot) {
  if (slot === undefined) return SLOTS.some((s) => !!readSlot(s));
  return !!readSlot(slot);
}
/** Light metadata for slot pickers. */
export function slotInfo(slot) {
  const raw = readSlot(slot);
  if (!raw) return { slot: String(slot), exists: false };
  const r = parse(raw);
  if (!r.ok) return { slot: String(slot), exists: true, corrupt: true };
  const s = r.state;
  const charted = s.galaxy.systems.filter((x) => x.status === 'charted').length;
  return { slot: String(slot), exists: true, day: s.day, captain: s.captain && s.captain.name, ship: s.ship.name, credits: s.credits, charted, total: s.galaxy.systems.length, phase: s.phase, savedAt: s.savedAt || null };
}

// ---- legacy bonus -------------------------------------------------------------------------------------------
export function readLegacy() {
  try {
    const st = storage();
    const raw = st && st.getItem(LEGACY_KEY);
    if (raw) { const o = JSON.parse(raw); return { runs: o.runs | 0, best: o.best | 0, bonus: Math.max(0, Math.min(500, o.bonus | 0)) }; }
  } catch { /* ignore */ }
  return { runs: 0, best: 0, bonus: 0 };
}
export function recordLegacy(score, nonLoss) {
  const lg = readLegacy();
  lg.runs += 1;
  lg.best = Math.max(lg.best, score | 0);
  lg.bonus = Math.min(500, lg.bonus + (nonLoss ? 75 : 25));
  try { const st = storage(); if (st) st.setItem(LEGACY_KEY, JSON.stringify(lg)); } catch { /* ignore */ }
  return lg;
}
