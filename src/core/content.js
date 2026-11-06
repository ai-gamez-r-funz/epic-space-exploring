// Content registry. Pulls every WORLD/EVENTS module in tolerantly (a missing or partial file just yields
// empty data) and builds lookup indexes. Tests may swap data in with setContent().
//

const EMPTY = () => ({
  FACTIONS: {}, GOODS: [], ECONOMY_BIAS: {}, PRICE_RULES: {},
  UPGRADES: [], SLOT_COUNT: 8, REFITS: [], SHIPYARD_ROTATIONS: [], ROTATION_DAYS: 12, TRAINING: [], RIVAL: null,
  CREW_START: [], CREW_POOL: [], TRAITS: {},
  MISSIONS: [], TEMPLATES: [],
  REGIONS: {}, STORY_SYSTEMS: [], CHAPTERS: [], ENDINGS: {}, ENDING_ORDER: [], INTRO_TEXT: [], TIPS: [], RANKS: [],
  STARTING_ITEMS: {}, STARTING_RESOURCES: {}, ITEM_DEFS: {},
  CODEX: [],
  NAMES: { SYSTEM_NAME_PARTS: null, PLANET_SUFFIXES: null, STATION_NAMES: null, CREW_NAME_POOLS: null, SHIP_NAME_SUGGESTIONS: null, systemName: null, planetName: null, stationName: null, crewName: null },
  EVENTS: [],
});

/** The live registry object (mutated in place so importers always see current data). */
export const C = EMPTY();
export const missing = []; // kept for API compatibility (always empty now that imports are static)

const asArray = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []);
const asObjById = (v) => {
  if (Array.isArray(v)) return Object.fromEntries(v.filter((x) => x && x.id).map((x) => [x.id, x]));
  return v && typeof v === 'object' ? v : {};
};

function absorb(m) {
  if (!m) return;
  const pick = (name) => (m[name] !== undefined ? m[name] : undefined);
  const set = (key, v, fn = (x) => x) => { if (v !== undefined && v !== null) C[key] = fn(v); };
  set('FACTIONS', pick('FACTIONS'), asObjById);
  set('GOODS', pick('GOODS'), asArray);
  set('ECONOMY_BIAS', pick('ECONOMY_BIAS'));
  set('PRICE_RULES', pick('PRICE_RULES'));
  set('UPGRADES', pick('UPGRADES'), asArray);
  set('REFITS', pick('REFITS'), asArray);
  set('SHIPYARD_ROTATIONS', pick('SHIPYARD_ROTATIONS'), asArray);
  if (typeof m.ROTATION_DAYS === 'number') C.ROTATION_DAYS = m.ROTATION_DAYS;
  set('TRAINING', pick('TRAINING'), asArray);
  if (m.RIVAL && typeof m.RIVAL === 'object') C.RIVAL = m.RIVAL;
  if (typeof m.SLOT_COUNT === 'number') C.SLOT_COUNT = m.SLOT_COUNT;
  set('CREW_START', pick('CREW_START'), asArray);
  set('CREW_POOL', pick('CREW_POOL'), asArray);
  set('TRAITS', pick('TRAITS'), asObjById);
  set('MISSIONS', pick('MISSIONS'), asArray);
  set('TEMPLATES', pick('TEMPLATES'), asArray);
  set('REGIONS', pick('REGIONS'), asObjById);
  set('STORY_SYSTEMS', pick('STORY_SYSTEMS'), asArray);
  set('CHAPTERS', pick('CHAPTERS'), asArray);
  set('ENDINGS', pick('ENDINGS'), asObjById);
  set('ENDING_ORDER', pick('ENDING_ORDER'));
  set('INTRO_TEXT', pick('INTRO_TEXT'));
  set('TIPS', pick('TIPS'));
  set('RANKS', pick('RANKS'));
  set('STARTING_ITEMS', pick('STARTING_ITEMS'));
  set('STARTING_RESOURCES', pick('STARTING_RESOURCES'));
  if (m.ITEM_DEFS) C.ITEM_DEFS = { ...C.ITEM_DEFS, ...asObjById(m.ITEM_DEFS) };
  else if (m.ITEMS) C.ITEM_DEFS = { ...C.ITEM_DEFS, ...asObjById(m.ITEMS) };
  set('CODEX', pick('CODEX'), asArray);
  for (const k of Object.keys(C.NAMES)) if (m[k] !== undefined) C.NAMES[k] = m[k];
  if (m.EVENTS) C.EVENTS = asArray(m.EVENTS);
}

/** Lookup tables, rebuilt whenever content changes. */
export const IDX = { refit: {}, training: {}, good: {}, upgrade: {}, crewTpl: {}, mission: {}, codex: {}, event: {}, storySystem: {}, chapter: {} };

export function rebuild() {
  IDX.refit = Object.fromEntries(C.REFITS.map((r) => [r.id, r]));
  IDX.training = Object.fromEntries(C.TRAINING.map((r) => [r.id, r]));
  IDX.good = Object.fromEntries(C.GOODS.map((g) => [g.id, g]));
  IDX.upgrade = Object.fromEntries(C.UPGRADES.map((u) => [u.id, u]));
  IDX.crewTpl = Object.fromEntries([...C.CREW_START, ...C.CREW_POOL].map((c) => [c.id, c]));
  IDX.mission = Object.fromEntries(C.MISSIONS.map((m) => [m.id, m]));
  IDX.codex = Object.fromEntries(C.CODEX.map((c) => [c.id, c]));
  IDX.event = Object.fromEntries(C.EVENTS.map((e) => [e.id, e]));
  IDX.storySystem = Object.fromEntries(C.STORY_SYSTEMS.map((s) => [s.id, s]));
  IDX.chapter = Object.fromEntries(C.CHAPTERS.map((c) => [c.id, c]));
}

// Static imports: a broken content file fails loudly at build/start-up instead of being swallowed.
import * as factions from '../content/factions.js';
import * as goods from '../content/goods.js';
import * as upgrades from '../content/upgrades.js';
import * as crew from '../content/crew.js';
import * as missionsMod from '../content/missions.js';
import * as story from '../content/story.js';
import * as codex from '../content/codex.js';
import * as names from '../content/names.js';
import * as events from '../content/events/index.js';

for (const m of [factions, goods, upgrades, crew, missionsMod, story, codex, names, events]) absorb(m);
rebuild();

/** Replace/extend content (tests, fixtures). Pass `{ __reset: true }` to start from empty. */
export function setContent(over = {}) {
  if (over.__reset) Object.assign(C, EMPTY());
  const { __reset, ...rest } = over;
  absorb(rest);
  rebuild();
  return C;
}

// ---- tiny name helpers (never throw) ------------------------------------------------------------------------
export function prettify(id) {
  return String(id ?? '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}
export const goodName = (id) => (IDX.good[id] && IDX.good[id].name) || prettify(id);
export const itemName = (id) => (C.ITEM_DEFS[id] && C.ITEM_DEFS[id].name) || prettify(id);
export const upgradeName = (id) => (IDX.upgrade[id] && IDX.upgrade[id].name) || prettify(id);
export const factionName = (id) => (C.FACTIONS[id] && C.FACTIONS[id].name) || (id === 'none' ? 'the locals' : prettify(id));
export const SKILLS = ['science', 'engineering', 'medicine', 'diplomacy', 'piloting'];
export const FACTION_IDS = ['concord', 'quillari', 'vesperine', 'archivists', 'drifters'];
