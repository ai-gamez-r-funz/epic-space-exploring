// Game: the single façade the UI talks to (contract §3). Pure JS, no DOM. Actions return { ok, reason?, ... }
// and never throw; notifications go out through g.on(type, fn).
import { C, IDX, goodName, itemName, prettify, factionName } from './content.js';
import { RNG, hashString, hashFloat } from './rng.js';
import { generateGalaxy, adjacency, bfs, laneBetween, laneLength } from './galaxy.js';
import { evalConds as evalCondsRaw } from './conds.js';
import { applyEffects, makeCrew, addCodex, addXp } from './effects.js';
import * as Ship from './ship.js';
import * as Econ from './economy.js';
import * as Missions from './missions.js';
import * as Events from './events.js';
import * as Survey from './survey.js';
import * as Save from './save.js';
import { BUILTIN } from './builtin.js';
import { template } from './text.js';
import * as SP from './setpieces.js';

const { DIFF, diffOf, clamp } = Ship;
export const STATE_VERSION = 1;
const MAX_CREW = 8;
const MAX_MISSIONS = 6;

const SURVEY_GATE_SCALE = 0.75; // main-arc survey gates are relaxed to 75 % of the authored values (story pacing)
function route0(g) {
  const st = g.state;
  const d = bfs(st.galaxy, st.pos);
  const c = st.galaxy.systems.filter((x) => x.status === 'detected').sort((a, b) => (d[a.id] ?? 99) - (d[b.id] ?? 99))[0];
  return c ? { kind: 'explore', text: `Explore ${c.name}`, systemId: c.id } : null;
}
const GOODS_FALLBACK_NAMES = ['Halcyon', 'Meridian Star', 'Kindly Light'];

function defaultResources(diff) {
  const t = (C.STARTING_RESOURCES || {})[diff];
  return { credits: 300, fuel: 30, supplies: 30, hull: 100, morale: 80, ...(t || {}) };
}

export class Game {
  constructor(state, opts = {}) {
    this.state = state;
    this.opts = { autosave: true, ...opts };
    this.listeners = new Map();
    this.rng = RNG.bound(state);
    this._hops = bfs(state.galaxy, state.galaxy.gate);
    this._pendingEnding = null;
    this._chain = null;
    this._shopAfter = false;
    this._settling = false;
    this.missions = {
      start: (id, o) => Missions.start(this, id, o),
      progress: (id, obj) => Missions.progress(this, id, obj),
    };
    Ship.recompute(state);
  }

  // =================================================================== construction / persistence
  static create(opts = {}) {
    const seed = Number.isFinite(opts.seed) ? opts.seed | 0 : Math.floor(Math.random() * 2 ** 31);
    const difficulty = DIFF[opts.difficulty] ? opts.difficulty : 'standard';
    const galaxy = generateGalaxy(seed);
    const res = defaultResources(difficulty);
    const legacy = opts.legacy === false ? { bonus: 0 } : Save.readLegacy();
    const names = (C.NAMES && C.NAMES.SHIP_NAME_SUGGESTIONS) || GOODS_FALLBACK_NAMES;
    const state = {
      v: STATE_VERSION, seed, day: 1, phase: 'play', rng: hashString('play:' + seed) || 1,
      captain: { name: String(opts.captainName || 'Captain').slice(0, 32) },
      difficulty,
      ship: { name: String(opts.shipName || names[0] || 'Halcyon').slice(0, 32), hull: res.hull, hullMax: 100, fuel: res.fuel, fuelMax: 40, supplies: res.supplies, suppliesMax: 40, morale: res.morale, cargoMax: 16 },
      credits: Math.round(res.credits + (legacy.bonus || 0)),
      cargo: {}, items: { ...(C.STARTING_ITEMS || {}) }, upgrades: [],
      crew: (C.CREW_START || []).map((t) => makeCrew(t)),
      rep: { concord: 0, quillari: 0, vesperine: 0, archivists: 0, drifters: 0 },
      flags: {}, counters: {},
      galaxy, pos: galaxy.gate, orbit: null, docked: false,
      missions: { active: [], done: [], failed: [] },
      codex: [], log: [], markets: {}, boards: {}, evt: { seen: {}, recent: [] },
      pending: null, rival: null, distress: null,
      stats: { jumps: 0, planetsScanned: 0, systemsCharted: 0, creditsEarned: 0, eventsSeen: 0, missionsDone: 0 },
      ending: null,
    };
    for (const e of C.CODEX) if (e.unlockedBy === null || e.unlockedBy === undefined) state.codex.push(e.id);
    const g = new Game(state, { autosave: opts.autosave !== false });
    g._enterSystem(galaxy.gate, { first: true });
    g.log('nav', `${state.ship.name} passes through the Gate into the Lantern Reach.`);
    g._initRival();
    g._chapters();
    g._codexSweep();
    return g;
  }

  /** Returns a Game, or null if the save is unusable (see Game.lastLoadError). */
  static load(json, opts = {}) {
    const r = Save.parse(json);
    if (!r.ok) { Game.lastLoadError = r.reason; return null; }
    Game.lastLoadError = null;
    return new Game(r.state, opts);
  }
  save() { this.state.savedAt = Date.now(); return JSON.stringify(this.state); }

  static hasSave(slot) { return Save.hasSlot(slot); }
  static writeSave(g, slot = 'auto') { return Save.writeSlot(g.save(), slot); }
  static readSave(slot = 'auto') { return Save.readSlot(slot); }
  static deleteSave(slot = 'auto') { return Save.deleteSlot(slot); }
  static loadSlot(slot = 'auto', opts) { const raw = Save.readSlot(slot); return raw ? Game.load(raw, opts) : null; }
  static slotInfo(slot) { return Save.slotInfo(slot); }
  static legacy() { return Save.readLegacy(); }

  // =================================================================== notifications
  on(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
    return () => this.listeners.get(type) && this.listeners.get(type).delete(fn);
  }
  emit(type, payload) {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const fn of [...set]) { try { fn(payload); } catch (e) { /* UI errors must not break the engine */ } }
  }
  log(kind, text) {
    const entry = { day: this.state.day, kind, text };
    this.state.log.push(entry);
    if (this.state.log.length > 400) this.state.log.splice(0, this.state.log.length - 400);
    this.emit('log', entry);
  }
  toast(text, tone = 'info') { this.emit('toast', { text, tone }); }
  _changed() { this.emit('changed', {}); }
  _autosave() { if (this.opts.autosave) { try { Game.writeSave(this, 'auto'); } catch { /* ignore */ } } }
  template(str) { return template(this.state, str, {}); }

  // =================================================================== queries
  system(id) { return this.state.galaxy.systems.find((s) => s.id === id) || null; }
  here() { return this.system(this.state.pos); }
  planet(sysId, planetId) { const s = this.system(sysId); return s ? s.planets.find((p) => p.id === planetId) || null : null; }
  _dist(a, b) { return laneLength(this.state.galaxy, a, b); }
  fuelCostFor(dist) {
    const d = Ship.derive(this.state);
    return Math.max(1, Math.round((dist / 70) * d.efficiency * diffOf(this.state).fuel));
  }
  daysFor(dist) { return Math.max(1, Math.round(dist / (190 * Ship.derive(this.state).jumpRange))); }
  neighbors(id = this.state.pos) {
    const out = [];
    for (const [a, b] of this.state.galaxy.lanes) {
      const o = a === id ? b : b === id ? a : null;
      if (!o) continue;
      const s = this.system(o);
      if (!s || s.status === 'unknown') continue;
      const dist = this._dist(id, o);
      out.push({ id: o, dist: Math.round(dist), fuelCost: this.fuelCostFor(dist), days: this.daysFor(dist), known: true });
    }
    return out.sort((x, y) => x.dist - y.dist);
  }
  canJump(toId) {
    const st = this.state;
    const dist = this._dist(st.pos, toId);
    const base = { fuelCost: Number.isFinite(dist) ? this.fuelCostFor(dist) : 0, days: Number.isFinite(dist) ? this.daysFor(dist) : 0 };
    if (st.phase === 'ended') return { ok: false, reason: 'The voyage is over', ...base };
    if (st.pending) return { ok: false, reason: 'Resolve the current event first', ...base };
    const s = this.system(toId);
    if (!s) return { ok: false, reason: 'Unknown destination', ...base };
    if (toId === st.pos) return { ok: false, reason: 'You are already here', ...base };
    if (!laneBetween(st.galaxy, st.pos, toId)) return { ok: false, reason: 'No lane from here', ...base };
    if (s.status === 'unknown') return { ok: false, reason: 'Destination not yet detected', ...base };
    if (st.ship.fuel < base.fuelCost) return { ok: false, reason: `Needs ${base.fuelCost} fuel (have ${Math.floor(st.ship.fuel)})`, ...base };
    return { ok: true, ...base };
  }
  surveyProgress() { return Survey.progress(this.state); }
  skillTotal(skill) { return Ship.skillTotal(this.state, skill); }
  checkOdds(skill, diff, opts) { return Ship.checkOdds(this.state, skill, diff, opts); }
  evalConds(conds, ctx) { return evalCondsRaw(this, conds, ctx || {}, { noRandom: true }); }
  shipStats() { return Ship.derive(this.state); }
  cargoUsed() { return Econ.cargoUsed(this.state); }
  crewList() { return this.state.crew; }
  codexEntries() { return C.CODEX.map((e) => ({ ...e, known: this.state.codex.includes(e.id) })); }
  itemList() { return Object.entries(this.state.items).map(([id, n]) => ({ id, n, name: itemName(id), ...(C.ITEM_DEFS[id] || {}) })); }
  servicePrices(sysId = this.state.pos) { return Ship.servicePrices(this.state, this.system(sysId), hashFloat, this._hops[sysId] || 0); }

  market(sysId = this.state.pos) {
    const s = this.system(sysId);
    if (!s || !s.station || !s.station.services.includes('trade')) return null;
    const m = Econ.listing(this.state, s);
    if (!m) return null;
    m.services = this.servicePrices(sysId);
    m.tips = Ship.hasSpecial(this.state, 'market_ear') ? this._marketTips(s, m) : [];
    m.cargoUsed = this.cargoUsed();
    m.cargoMax = this.state.ship.cargoMax;
    return m;
  }
  _marketTips(sys, m) {
    const st = this.state;
    const tips = [];
    for (const gd of m.goods) {
      if (!gd.buy) continue;
      let best = null;
      for (const o of st.galaxy.systems) {
        if (o.id === sys.id || (o.status !== 'visited' && o.status !== 'charted') || !st.markets[o.id]) continue;
        const sell = Econ.quoteSell(st, o, gd.id, 1);
        if (sell && (!best || sell > best.sell)) best = { goodId: gd.id, systemId: o.id, systemName: o.name, sell };
      }
      if (best && best.sell >= gd.buy * 1.25) tips.push({ ...best, ratio: best.sell / gd.buy });
    }
    return tips.sort((a, b) => b.ratio - a.ratio).slice(0, 3).map(({ ratio, ...t }) => t);
  }
  shipyard(sysId = this.state.pos) {
    const s = this.system(sysId);
    if (!s || !s.station || !s.station.services.includes('shipyard')) return [];
    return C.UPGRADES.map((u) => {
      const stt = Ship.upgradeStatus(this.state, u);
      let ok = stt.ok;
      let reason = stt.reason;
      if (ok && this.state.credits < stt.price) { ok = false; reason = `Needs ${stt.price} scrip`; }
      return { id: u.id, name: u.name, slot: u.slot, tier: u.tier, cost: u.cost, price: stt.price ?? u.cost, tradeIn: stt.tradeIn || 0, desc: u.desc, flavor: u.flavor, bonus: u.bonus || {}, special: u.special || null, available: !!ok, reason, owned: !!stt.owned, replaces: stt.replaces || null, reward: !!u.reward };
    });
  }
  missionBoard(sysId = this.state.pos) { return Missions.board(this, sysId).map(Missions.offerView); }
  activeMissions() { return Missions.activeView(this); }
  crewForHire(sysId = this.state.pos) {
    const s = this.system(sysId);
    if (!s || !s.station || !s.station.services.includes('crew')) return [];
    const win = Math.floor(this.state.day / 25);
    const aboard = new Set(this.state.crew.map((c) => c.id));
    const pool = C.CREW_POOL.filter((t) => !aboard.has(t.id));
    const picks = pool.filter((t) => hashFloat(this.state.seed, s.id, t.id, win) < 0.4);
    return picks.slice(0, 5).map((t) => {
      let reason = null;
      if (t.minRep && (this.state.rep[t.minRep.faction] || 0) < t.minRep.n) reason = `Needs standing ${t.minRep.n} with ${factionName(t.minRep.faction)}`;
      else if (this.state.credits < t.hireCost) reason = `Needs ${t.hireCost} scrip`;
      else if (this.state.crew.length >= MAX_CREW) reason = 'Crew quarters full';
      return { id: t.id, name: t.name, species: t.species, role: t.role, skills: t.skills, trait: t.trait, bio: t.bio, hireCost: t.hireCost, portrait: { species: t.species, seed: t.portraitSeed }, available: !reason, reason };
    });
  }
  pendingView() { return Events.pendingView(this); }
  tips() { return C.TIPS; }
  rank() {
    const sc = Survey.progress(this.state).score;
    let r = null;
    for (const x of C.RANKS || []) if (sc >= x.minScore) r = x.title;
    return r;
  }
  /** Stranded = cannot make even the cheapest jump (or no supplies) and cannot pay to fix it. */
  isStranded() {
    const st = this.state;
    if (st.phase === 'ended') return false;
    const nb = this.neighbors(st.pos);
    const all = [];
    for (const [a, b] of st.galaxy.lanes) { const o = a === st.pos ? b : b === st.pos ? a : null; if (o) all.push(this.fuelCostFor(this._dist(st.pos, o))); }
    const minCost = all.length ? Math.min(...all) : 1;
    const needFuel = st.ship.fuel < minCost;
    const needSup = st.ship.supplies < 1;
    if (!needFuel && !needSup) return false;
    const sys = this.here();
    if (!sys.station || !sys.station.services.includes('repair')) return true;
    const pr = this.servicePrices(sys.id);
    let cost = 0;
    if (needFuel) cost += Math.ceil((minCost - st.ship.fuel) * pr.fuel);
    if (needSup) cost += Math.ceil(3 * pr.supplies);
    let funds = st.credits;
    if (funds >= cost) return false;
    const mk = Econ.listing(st, sys);
    if (mk) for (const gd of mk.goods) if (gd.held) funds += Econ.quoteSell(st, sys, gd.id, gd.held) || 0;
    return funds < cost;
  }

  // =================================================================== guards
  _guard(opts = {}) {
    const st = this.state;
    if (st.phase === 'ended') return { ok: false, reason: 'The voyage is over' };
    if (st.pending && !opts.allowPending) return { ok: false, reason: 'Resolve the current event first' };
    return null;
  }
  _station(service) {
    const st = this.state;
    const s = this.here();
    if (!st.docked || !s || !s.station) return { err: { ok: false, reason: 'You must be docked at a station' } };
    if (service && !s.station.services.includes(service)) return { err: { ok: false, reason: `This station has no ${service} service` } };
    return { sys: s };
  }

  // =================================================================== time & upkeep
  /** Advance the calendar: supplies, morale, hull repair, deadlines. */
  advanceDays(n, opts = {}) {
    const st = this.state;
    const diff = diffOf(st);
    const d = Ship.derive(st);
    n = Math.max(0, Math.floor(n));
    for (let i = 0; i < n; i++) {
      st.day += 1;
      this._dayHooks();
      // supplies upkeep (fractional accumulator keeps it deterministic)
      let rate = (0.4 + 0.2 * st.crew.length) * diff.upkeep * (opts.extraUpkeep || 1);
      if (opts.rest && Ship.hasSpecial(st, 'rest_cure')) rate *= 0.75;
      if (Ship.hasSpecial(st, 'thrifty_galley')) rate *= 0.75;
      rate *= Math.max(0.7, Math.pow(0.9, Ship.abilityCount(st, 'thrifty_pantry')));
      st.counters.supAcc = (st.counters.supAcc || 0) + rate;
      const whole = Math.floor(st.counters.supAcc);
      st.counters.supAcc -= whole;
      if (whole > 0) {
        const have = st.ship.supplies;
        st.ship.supplies = Math.max(0, have - whole);
      }
      // morale
      let dm = d.moraleRegen - 0.6; // life aboard wears on a crew; lounges, rests and shore leave mend it
      if (st.docked) dm += 0.6;
      if (opts.rest && Ship.hasSpecial(st, 'field_hospital')) { dm += 2; st.ship.hull = clamp(st.ship.hull + 1, 0, st.ship.hullMax); }
      if (opts.rest) { dm += 3; if (Ship.hasSpecial(st, 'tea_service')) dm += 1.5; }
      if (st.docked && Ship.hasSpecial(st, 'tea_service')) dm += 0.5;
      if (st.ship.supplies <= 0) dm -= 2.5;
      st.counters.morAcc = (st.counters.morAcc || 0) + dm;
      const mw = Math.trunc(st.counters.morAcc);
      st.counters.morAcc -= mw;
      if (mw) st.ship.morale = clamp(st.ship.morale + mw, diff.floors && mw < 0 ? 5 : 0, 100);
      // hull repair
      let rep = d.repairPerDay;
      if (opts.rest && Ship.hasSpecial(st, 'rest_cure')) rep *= 2;
      if (rep > 0 && st.ship.hull < st.ship.hullMax) {
        st.counters.repAcc = (st.counters.repAcc || 0) + rep;
        const w = Math.floor(st.counters.repAcc);
        st.counters.repAcc -= w;
        st.ship.hull = clamp(st.ship.hull + w, 0, st.ship.hullMax);
      }
      // crew mood drifts toward ship morale
      for (const c of st.crew) {
        const gap = st.ship.morale - c.mood;
        if (Math.abs(gap) >= 12) c.mood = clamp(c.mood + Math.sign(gap), 0, 100);
      }
    }
    if (n > 0 && opts.rest && Ship.hasSpecial(st, 'tea_service')) for (const c of st.crew) c.mood = clamp(c.mood + 1, 0, 100);
    Ship.recompute(st);
    if (!opts.deferCheck) Missions.check(this);
  }


  // =================================================================== set pieces: rival, distress, market news
  _tradeStations() { return this.state.galaxy.systems.filter((x) => x.station && x.station.services.includes('trade')); }
  _initRival() {
    const st = this.state;
    const cands = this._tradeStations().filter((x) => (this._hops[x.id] || 0) >= 2 && (this._hops[x.id] || 0) <= 5);
    if (!cands.length || !C.GOODS.length) return;
    const at = cands[Math.floor(hashFloat(st.seed, 'rival0') * cands.length)];
    const good = C.GOODS.filter((x) => x.base >= 30 && x.category !== 'fuel')[Math.floor(hashFloat(st.seed, 'rivalg') * Math.max(1, C.GOODS.filter((x) => x.base >= 30 && x.category !== 'fuel').length))] || C.GOODS[0];
    st.rival = { name: SP.RIVAL_NAME, systemId: at.id, prevId: null, goodId: good.id, nextMoveDay: 6 + Math.floor(hashFloat(st.seed, 'rivalm') * 5), lastMetDay: -99 };
  }
  /** Tamsin hops between nearby trade stations every 6-11 days, buying out one good where she lands and dumping it at her last stop. */
  _rivalMove() {
    const st = this.state;
    const r = st.rival;
    if (!r || st.day < r.nextMoveDay) return;
    const here = this.system(r.systemId);
    const adj = adjacency(st.galaxy);
    const d = bfs(st.galaxy, r.systemId, adj);
    const options = this._tradeStations().filter((x) => x.id !== r.systemId && d[x.id] !== undefined && d[x.id] <= 3);
    const h = hashFloat(st.seed, 'rivalstep', st.day);
    const next = options.length ? options[Math.floor(h * options.length)] : here;
    const goods = C.GOODS.filter((x) => x.base >= 30 && x.category !== 'fuel');
    r.prevId = r.systemId;
    r.systemId = next.id;
    r.goodId = goods.length ? goods[Math.floor(hashFloat(st.seed, 'rivalgood', st.day) * goods.length)].id : r.goodId;
    r.nextMoveDay = st.day + 6 + Math.floor(hashFloat(st.seed, 'rivaldelay', st.day) * 6);
    if (!st.flags.rival_ally) {
      // she buys the good out at her new stop (price up, stock down) and has dumped her last cargo at the old one (price down)
      const now = Econ.ensureMarket(st, next);
      if (now) { now.impact[r.goodId] = Math.min(0.6, (now.impact[r.goodId] || 0) + 0.28); now.stock[r.goodId] = Math.max(0, Math.round((now.stock[r.goodId] || 0) * 0.4)); }
      const old = here && Econ.ensureMarket(st, here);
      if (old) old.impact[r.goodId] = Math.max(-0.6, (old.impact[r.goodId] || 0) - 0.22);
    }
  }
  rivalInfo() {
    const r = this.state.rival;
    if (!r) return null;
    const sys = this.system(r.systemId);
    const visible = !!sys && sys.status !== 'unknown';
    return { name: r.name, systemId: visible ? r.systemId : null, systemName: visible ? sys.name : null, goodId: r.goodId, goodName: goodName(r.goodId), ally: !!this.state.flags.rival_ally, here: r.systemId === this.state.pos, met: (this.state.counters.rival_met || 0) > 0, note: visible ? `${r.name} is trading ${goodName(r.goodId)} near ${sys.name}.` : `${r.name} is somewhere in the Reach.` };
  }
  /** Spawn a timed distress signal (engine roll or fx {distress:days}). */
  spawnDistress(days) {
    const st = this.state;
    if (st.distress) return false;
    const d = bfs(st.galaxy, st.pos);
    const cands = st.galaxy.systems.filter((x) => x.status !== 'unknown' && x.id !== st.pos && d[x.id] >= 2 && d[x.id] <= 5);
    if (!cands.length) return false;
    const rng = new RNG(hashString(`${st.seed}|distress|${st.day}`));
    const sys = rng.pick(cands);
    const kind = SP.pickDistressKind(rng);
    const fac = sys.faction !== 'none' ? sys.faction : sys.station ? sys.station.faction : 'none';
    const species = (C.FACTIONS[fac] && C.FACTIONS[fac].species) || 'human';
    const nm = (C.NAMES && typeof C.NAMES.crewName === 'function') ? C.NAMES.crewName(species, () => rng.next()) : 'Captain Unknown';
    const window = Math.round((days || (9 + d[sys.id] * 3)) * diffOf(st).deadline);
    st.distress = { id: `d${st.day}`, systemId: sys.id, kind, captain: nm || 'A Tired Captain', species, faction: fac, startedDay: st.day, deadlineDay: st.day + window, reward: 10 * d[sys.id] };
    this.emit('sfx', { name: 'alert' });
    this.toast(`Distress signal near ${sys.name}! (${window} days)`, 'info');
    this.log('event', `Distress signal detected near ${sys.name}; it will fade in ${window} days.`);
    return true;
  }
  distressSignals() {
    const dd = this.state.distress;
    if (!dd) return [];
    const sys = this.system(dd.systemId);
    return [{ id: dd.id, systemId: dd.systemId, systemName: sys.name, kind: dd.kind, title: (SP.DISTRESS_KINDS[dd.kind] || {}).title, deadlineDay: dd.deadlineDay, daysLeft: Math.max(0, dd.deadlineDay - this.state.day) }];
  }
  _dayHooks() {
    const st = this.state;
    if (st.phase === 'ended') return;
    if (st.distress && st.day > st.distress.deadlineDay) {
      const sys = this.system(st.distress.systemId);
      st.distress = null; st.counters.distress_missed = (st.counters.distress_missed || 0) + 1; st.counters.lastDistressDay = st.day;
      st.ship.morale = clamp(st.ship.morale - 2, 0, 100);
      this.toast(`The distress signal near ${sys.name} has faded.`, 'bad');
      this.log('event', `The distress signal near ${sys.name} faded before we could help.`);
    } else if (!st.distress && st.day >= 10 && st.day - (st.counters.lastDistressDay || 0) >= 10 && hashFloat(st.seed, 'distress', st.day) < 0.05) {
      this.spawnDistress();
    }
    this._rivalMove();
  }
  /** Market news (festivals, gluts, shortages) for a trade system: [{kind,title,text,goods,mult,startDay,endDay,daysLeft,active,upcoming}] */
  marketNews(sysId = this.state.pos) { return Econ.newsFor(this.state, this.system(sysId)); }
  /** News across systems the player has seen, for a bulletin screen. */
  newsFeed() {
    const out = [];
    for (const s of this.state.galaxy.systems) {
      if (s.status === 'unknown') continue;
      for (const n of Econ.newsFor(this.state, s)) if (n.active) out.push({ ...n, systemId: s.id, systemName: s.name });
    }
    return out;
  }
  /** What should the player do next? {kind, text, systemId?, title?} or null. */
  nextObjective() {
    const st = this.state;
    if (st.phase === 'ended') return null;
    const known = (id) => { const s = id && this.system(id); return s && s.status !== 'unknown' ? id : null; };
    for (const m of st.missions.active) {
      if (m.arc !== 'main') continue;
      const o = m.objectives.find((x) => !x.done && !x.optional);
      if (o) return { kind: 'mission', title: m.title, text: o.text, systemId: known(o.deliverResolved || o.resolved) };
    }
    let cur = null;
    for (const ch of C.CHAPTERS) if (st.flags[ch.flag]) cur = ch;
    if (cur && cur.lantern && !st.flags[`lantern_${cur.n}`]) {
      const s = st.galaxy.systems.find((x) => x.story === cur.lantern);
      if (s) return { kind: 'lantern', title: cur.title, text: `Investigate the Lantern at ${s.name}`, systemId: known(s.id) };
    }
    const next = C.CHAPTERS.find((ch) => !st.flags[ch.flag]);
    if (next) {
      const need = (next.gate || []).find((c) => c && c.survey !== undefined);
      const pct = this.surveyProgress().pct;
      if (need && pct < Math.round(need.survey * SURVEY_GATE_SCALE)) return { kind: 'survey', title: next.title, text: `Chart more of the Reach (${pct}% of ${Math.round(need.survey * SURVEY_GATE_SCALE)}%) to hear the next Lantern`, systemId: null };
      const flagNeed = (next.gate || []).find((c) => c && c.flag && !st.flags[c.flag]);
      if (flagNeed && flagNeed.flag === 'archive_key') {
        const s = st.galaxy.systems.find((x) => x.story === 'hollow_archive');
        return { kind: 'story', title: next.title, text: 'Ask the Hollow Archive your question', systemId: s ? known(s.id) : null };
      }
    }
    const dd = this.distressSignals()[0];
    if (dd) return { kind: 'distress', title: dd.title, text: `Answer the distress call near ${dd.systemName} (${dd.daysLeft} days left)`, systemId: known(dd.systemId) };
    const r = route0(this);
    return r || { kind: 'survey', text: 'Chart the remaining systems of the Reach', systemId: null };
  }

  // =================================================================== helpers
  _revealAround(sysId, extra = 0) {
    const st = this.state;
    const s = this.system(sysId);
    if (!s) return;
    const radius = Ship.derive(st).sensorRadius;
    const reveal = (o) => { if (o.status === 'unknown') o.status = 'detected'; };
    for (const [a, b] of st.galaxy.lanes) {
      const o = a === sysId ? b : b === sysId ? a : null;
      if (o) reveal(this.system(o));
    }
    for (const o of st.galaxy.systems) if (o.status === 'unknown' && Math.hypot(o.x - s.x, o.y - s.y) <= radius) reveal(o);
    for (let i = 0; i < extra; i++) {
      const cand = st.galaxy.systems.filter((o) => o.status === 'unknown').sort((p, q) => Math.hypot(p.x - s.x, p.y - s.y) - Math.hypot(q.x - s.x, q.y - s.y))[0];
      if (cand) cand.status = 'detected';
    }
  }
  /** fx {reveal} */
  reveal(v) {
    const st = this.state;
    if (v === 'nearest') { this._revealAround(st.pos, 1); return; }
    if (v && typeof v === 'object' && v.radius) {
      const d = bfs(st.galaxy, st.pos);
      for (const s of st.galaxy.systems) if (d[s.id] !== undefined && d[s.id] <= v.radius && s.status === 'unknown') s.status = 'detected';
      return;
    }
    if (typeof v === 'string') {
      const s = st.galaxy.systems.find((x) => x.id === v || x.story === v);
      if (s && s.status === 'unknown') s.status = 'detected';
    }
  }
  _enterSystem(id, { first = false } = {}) {
    const st = this.state;
    const s = this.system(id);
    if (!s) return;
    st.pos = id; st.orbit = null; st.docked = false;
    const firstVisit = s.status === 'unknown' || s.status === 'detected';
    if (firstVisit) s.status = 'visited';
    s.visits = (s.visits || 0) + (first ? 0 : 1);
    if (first) s.visits = 1;
    this._revealAround(id, s.phenomena.includes('beacon') && Ship.hasSpecial(st, 'lantern_attunement') ? 1 : 0);
    if (firstVisit) this._tryChart(s);
    return firstVisit;
  }
  teleport(v) {
    const st = this.state;
    let id = v;
    if (v === 'random') {
      const known = st.galaxy.systems.filter((s) => s.status !== 'unknown' && s.id !== st.pos);
      const s = this.rng.pick(known);
      id = s && s.id;
    } else {
      const s = st.galaxy.systems.find((x) => x.id === v || x.story === v);
      id = s && s.id;
    }
    if (!id || !this.system(id)) return;
    this._enterSystem(id);
    this._teleported = true;
  }
  forceChart(sysId) {
    const s = this.system(sysId);
    if (!s || s.status === 'charted') return;
    if (s.status === 'unknown' || s.status === 'detected') s.status = 'visited';
    for (const p of s.planets) p.scanned = true;
    this._chartNow(s);
  }
  _tryChart(s) {
    if (s.status === 'visited' && s.planets.every((p) => p.scanned)) this._chartNow(s);
  }
  _chartNow(s) {
    const st = this.state;
    if (s.status === 'charted') return;
    s.status = 'charted';
    st.stats.systemsCharted = (st.stats.systemsCharted || 0) + 1;
    this.log('discovery', `${s.name} charted.`);
    this.emit('discovery', { kind: 'chart', text: `${s.name} charted`, id: s.id });
    this.toast(`${s.name} charted`, 'good');
    if (Ship.abilityCount(st, 'pen_and_ink') > 0) { applyEffects(this, [{ credits: 10 }], {}); this.toast('Fair copy: +10 scrip', 'good'); }
    if (Ship.hasSpecial(st, 'cartographers_table')) { applyEffects(this, [{ credits: 25 }], {}); this.toast('Meridian bounty: +25 scrip', 'good'); }
    this.emit('sfx', { name: 'discovery' });
  }
  _flagSet() { this._flagsDirty = true; }

  // codex unlock grammar (see content/codex.js header)
  _codexTrigger(kind, value) {
    for (const e of C.CODEX) {
      const u = e.unlockedBy;
      if (!u || typeof u !== 'object' || this.state.codex.includes(e.id)) continue;
      if (u[kind] === undefined) continue;
      if (u[kind] === value) addCodex(this, e.id);
    }
  }
  _codexSweep() {
    const st = this.state;
    for (const e of C.CODEX) {
      const u = e.unlockedBy;
      if (!u || typeof u !== 'object' || st.codex.includes(e.id)) continue;
      if (u.flag && st.flags[u.flag]) addCodex(this, e.id);
      else if (u.mission && st.missions.done.includes(u.mission)) addCodex(this, e.id);
    }
  }
  _chapters() {
    const st = this.state;
    for (const ch of C.CHAPTERS || []) {
      if (!st.flags[ch.flag]) {
        const gate = (ch.gate || []).map((c) => (c && c.survey !== undefined ? { ...c, survey: Math.round(c.survey * SURVEY_GATE_SCALE) } : c));
        if (evalCondsRaw(this, gate, {}, { noRandom: true }).ok) {
          applyEffects(this, ch.onStart || [{ flag: ch.flag }], {});
          st.flags[ch.flag] = st.flags[ch.flag] || true;
          if (ch.n > 1) { this.toast(`Chapter ${ch.n}: ${ch.title}`, 'info'); this.log('event', `Chapter ${ch.n}: ${ch.title}`); }
          // the chapter's Lantern shows up on the chart so the arc is always legible
          const ls = ch.lantern && st.galaxy.systems.find((x) => x.story === ch.lantern);
          if (ls && ls.status === 'unknown') { ls.status = 'detected'; if (ch.n > 1) { this.log('discovery', `A new Lantern signal bears toward ${ls.name}.`); this.toast(`A Lantern signal: ${ls.name}`, 'good'); } }
        }
      } else if (!st.flags[`${ch.flag}_done`] && evalCondsRaw(this, ch.completeWhen || [{ flag: 'never_set' }], {}, { noRandom: true }).ok) {
        applyEffects(this, ch.onComplete || [{ flag: `${ch.flag}_done` }], {});
        st.flags[`${ch.flag}_done`] = true;
        if (ch.reveal) this.log('event', ch.reveal);
      }
    }
  }

  // =================================================================== settle (after every action)
  _settle() {
    if (this._settling) return;
    this._settling = true;
    try {
      const st = this.state;
      if (st.phase === 'ended') { this._changed(); return; }
      Ship.recompute(st);
      Missions.check(this);
      this._chapters();
      this._codexSweep();
      // loss conditions
      if (!st.pending) {
        if (st.ship.hull <= 0) { this.endGame('recalled'); return; }
        if (st.ship.morale <= 0) { this.endGame('resignation'); return; }
      }
      if (!st.pending) {
        if (this._pendingEnding) { const id = this._pendingEnding; this._pendingEnding = null; this.endGame(id); return; }
        if (this._chain) { const id = this._chain; this._chain = null; Events.startEvent(this, id, { systemId: st.pos }); }
      }
      if (!st.pending) {
        const id = this._checkEndings(['story', 'survey']);
        if (id) { this.endGame(id); return; }
      }
      if (!st.pending) {
        if (st.ship.supplies <= 0 && !st.flags._ration_ev) {
          st.flags._ration_ev = true;
          Events.startEvent(this, BUILTIN.rations, { systemId: st.pos });
        } else if (st.ship.supplies >= 5) delete st.flags._ration_ev;
      }
      if (!st.pending && this.isStranded()) Events.startEvent(this, BUILTIN.tow, { systemId: st.pos });
      this._changed();
    } finally { this._settling = false; }
  }
  _afterEvent(cur) {
    const st = this.state;
    if (st.phase === 'ended') return;
    if (cur.setPiece === 'distress' && st.distress) {
      st.distress = null; st.counters.lastDistressDay = st.day; st.counters.distress_answered = (st.counters.distress_answered || 0) + 1;
    }
    if (this._chain && !this._pendingEnding) {
      const id = this._chain; this._chain = null;
      if (Events.startEvent(this, id, cur.ctx, { afterArrive: cur.afterArrive })) return;
    }
    if (cur.afterArrive && !st.pending) this._arrive();
    if (this._shopAfter) { this._shopAfter = false; const s = this.here(); if (s && s.station) this.emit('shop', { systemId: s.id }); }
    this._settle();
    if (!st.pending) this._autosave();
  }

  // =================================================================== endings
  _checkEndings(triggers) {
    let best = null;
    for (const e of Object.values(C.ENDINGS)) {
      if (!triggers.includes(e.trigger) || !e.conditions || !e.conditions.length) continue;
      if (!evalCondsRaw(this, e.conditions, {}, { noRandom: true }).ok) continue;
      if (!best || (e.priority || 0) > (best.priority || 0)) best = e;
    }
    return best ? best.id : null;
  }
  score(endingId) {
    const st = this.state;
    const sv = Survey.progress(st);
    const e = C.ENDINGS[endingId] || {};
    const nonLoss = e.kind !== 'loss';
    const repSum = Object.values(st.rep).reduce((a, v) => a + Math.max(0, v), 0);
    return Math.round(sv.score + (e.scoreBonus || 0) + st.credits / 25 + (st.stats.missionsDone || 0) * 40 + repSum * 2 + (nonLoss ? Math.max(0, 400 - st.day) : 0));
  }
  endGame(id) {
    const st = this.state;
    if (st.phase === 'ended') return { ok: false, reason: 'The voyage is over' };
    const def = C.ENDINGS[id] || { id, title: prettify(id), text: 'The voyage ends here.', scoreBonus: 0, kind: id === 'recalled' || id === 'resignation' ? 'loss' : 'special' };
    st.pending = null;
    st.phase = 'ended';
    const score = this.score(id);
    st.ending = { id: def.id || id, title: def.title, text: def.text, score, kind: def.kind || 'special', rank: this.rank(), day: st.day };
    try { Save.recordLegacy(score, def.kind !== 'loss'); } catch { /* ignore */ }
    this.log('event', `The voyage ends: ${def.title}.`);
    this.emit('sfx', { name: def.kind === 'loss' ? 'fail' : 'fanfare' });
    this.emit('ended', { ending: st.ending });
    this._changed();
    return { ok: true, ending: st.ending };
  }
  canRetire() {
    const st = this.state;
    if (st.phase === 'ended') return { ok: false, reason: 'The voyage is over' };
    const sv = Survey.progress(st);
    if (sv.pct < 50) return { ok: false, reason: 'Survey at least 50% of the Reach first' };
    const s = this.here();
    const meridian = !!(st.docked && s && s.station && (s.station.faction === 'concord' || /meridian/i.test(s.station.name) || s.id === st.galaxy.gate));
    if (!meridian) return { ok: false, reason: 'Dock at a Meridian (Concord) station to retire the commission', needsStation: true };
    return { ok: true };
  }
  /** "Retire the commission". opts.anywhere (Settings) skips the station requirement. */
  retire(opts = {}) {
    const g0 = this._guard();
    if (g0) return g0;
    const st = this.state;
    const sv = Survey.progress(st);
    if (opts.anywhere) { if (sv.pct < 50) return { ok: false, reason: 'Survey at least 50% of the Reach first' }; }
    else { const c = this.canRetire(); if (!c.ok) return c; }
    let best = null;
    for (const e of Object.values(C.ENDINGS)) {
      if (e.trigger !== 'retire') continue;
      if (!evalCondsRaw(this, e.conditions || [], {}, { noRandom: true }).ok) continue;
      if (!best || (e.priority || 0) > (best.priority || 0)) best = e;
    }
    const id = best ? best.id : sv.pct >= 75 ? 'cartographer' : 'wanderer';
    return this.endGame(id);
  }

  // =================================================================== actions: travel
  jump(toId) {
    const g0 = this._guard();
    if (g0) return g0;
    const st = this.state;
    const can = this.canJump(toId);
    if (!can.ok) return can;
    const dest = this.system(toId);
    const diff = diffOf(st);
    st.ship.fuel -= can.fuelCost;
    this._teleported = false;
    this.advanceDays(can.days, { deferCheck: true });
    st.stats.jumps = (st.stats.jumps || 0) + 1;
    const firstVisit = this._enterSystem(toId);
    this.emit('sfx', { name: 'jump' });
    this.log('nav', `Jumped to ${dest.name} (${can.days}d, ${can.fuelCost} fuel).`);
    // solar sails
    if (Ship.hasSpecial(st, 'solar_sails') && ['white', 'blue', 'binary', 'yellow'].includes(dest.star)) {
      const refund = ['white', 'blue'].includes(dest.star) ? 2 : 1;
      st.ship.fuel = clamp(st.ship.fuel + refund, 0, st.ship.fuelMax);
    }
    // hazards (never combat: weather and rough space)
    let started = this._travelHazard(dest);
    Missions.check(this);
    // travel event
    if (st.phase === 'play' && !started) {
      const p = clamp((0.34 + 0.06 * dest.danger) * (st.difficulty === 'cozy' ? 0.85 : 1), 0.1, 0.7);
      if (this.rng.chance(p)) {
        const ev = Events.pickEvent(this, 'travel', { systemId: toId });
        if (ev) started = Events.startEvent(this, ev, { systemId: toId }, { afterArrive: true });
      }
    }
    if (!started) this._arrive(firstVisit);
    else this._changed();
    return { ok: true, event: started, fuelCost: can.fuelCost, days: can.days };
  }
  /** Rolls lane hazards. Returns true if a decision event was started (a pending "Rough Lane"). */
  _travelHazard(dest) {
    const st = this.state;
    const diff = diffOf(st);
    const ph = SP.hazardPhenomenon(dest);
    if (ph && ['ionstorm', 'nebula', 'asteroids'].includes(ph) && Ship.hasSpecial(st, 'steady_hand')) return false;
    // everyday wear and tear
    if (diff.damage > 0.6 && this.rng.chance(0.6)) applyEffects(this, [{ hull: -1 }], { noScale: true });
    let chance = (0.07 + 0.15 * dest.danger) * diff.hazard + (ph ? 0.08 : 0);
    if (Ship.hasSpecial(st, 'barrel_roll_gyro')) chance *= 0.75;
    chance *= Math.max(0.6, Math.pow(0.85, Ship.abilityCount(st, 'weather_eye')));
    const dmgMult = Ship.hasSpecial(st, 'brittle_array') ? 1.5 : 1;
    if (!this.rng.chance(chance)) return false;
    if (dest.danger === 0) {
      const r = applyEffects(this, [{ hull: -Math.round(2 * dmgMult) }], { noScale: true });
      this.toast(`Rough space: ${r.summary.join(', ')}`, 'bad');
      return false;
    }
    return Events.startEvent(this, SP.hazardEvent(dest, dmgMult), { systemId: dest.id }, { afterArrive: true });
  }
  _arrive(firstVisit) {
    const st = this.state;
    const s = this.here();
    this.emit('arrive', { systemId: s.id });
    this.emit('sfx', { name: 'arrive' });
    const def = s.story && IDX.storySystem[s.story];
    if (s.visits <= 1 && def && def.hook) this.emit('discovery', { kind: 'system', text: def.hook, id: s.id });
    // codex triggers
    this._codexTrigger('star', s.star);
    if (s.story) this._codexTrigger('visit', s.story);
    for (const ph of s.phenomena) this._codexTrigger('phenomenon', ph);
    if (s.faction !== 'none') this._codexTrigger('faction', s.faction);
    this._tryChart(s);
    if (Ship.hasSpecial(st, 'ice_scoop') && s.phenomena.includes('comet')) { applyEffects(this, [{ fuel: 3 }], {}); this.toast('Ice scoop: +3 fuel from the comet tail', 'good'); }
    if (st.phase === 'play' && st.distress && st.distress.systemId === s.id) {
      const ctx = { systemId: s.id };
      const ev = Events.pickEvent(this, 'distress', ctx) || SP.distressEvent(this, st.distress);
      Events.startEvent(this, ev, ctx, { setPiece: 'distress' });
    }
    if (st.phase === 'play' && !st.pending) {
      const first = s.visits <= 1;
      const pool = Events.eligible(this, 'arrive', { systemId: s.id });
      const p = pool.length ? (first ? 0.6 : 0.2) : 0;
      if (pool.length && this.rng.chance(p)) {
        const ev = Events.pickEvent(this, 'arrive', { systemId: s.id });
        if (ev) Events.startEvent(this, ev, { systemId: s.id });
      }
    }
    this._settle();
    if (!st.pending) this._autosave();
  }

  enterOrbit(planetId) {
    const g0 = this._guard(); if (g0) return g0;
    const p = this.planet(this.state.pos, planetId);
    if (!p) return { ok: false, reason: 'No such planet here' };
    this.state.orbit = planetId;
    this.emit('sfx', { name: 'ping' });
    this._changed();
    return { ok: true };
  }
  leaveOrbit() {
    const g0 = this._guard(); if (g0) return g0;
    this.state.orbit = null;
    this._changed();
    return { ok: true };
  }

  scanPlanet(planetId) {
    const g0 = this._guard(); if (g0) return g0;
    const st = this.state;
    const sys = this.here();
    const p = this.planet(sys.id, planetId);
    if (!p) return { ok: false, reason: 'No such planet here' };
    if (p.scanned) return { ok: false, reason: 'Already scanned' };
    if (st.ship.supplies < 1) return { ok: false, reason: 'Not enough supplies to run the survey' };
    st.orbit = planetId;
    st.ship.supplies = Math.max(0, st.ship.supplies - 1);
    this.advanceDays(1, { deferCheck: true });
    p.scanned = true;
    if (Ship.hasSpecial(st, 'prize_cartography')) {
      const prize = Math.min(60, 8 + 12 * p.features.length);
      applyEffects(this, [{ credits: prize }], {});
      this.toast(`Prize cartography +${prize} scrip`, 'good');
    }
    st.stats.planetsScanned = (st.stats.planetsScanned || 0) + 1;
    const lifeBonus = { microbial: 8, flora: 12, fauna: 18, civilized: 25 }[p.life] || 0;
    const bounty = Math.round((12 + lifeBonus + p.features.length * 8) * diffOf(st).reward * 0.7);
    applyEffects(this, [{ credits: bounty }, { xp: { science: st.crew.some((c) => c.trait === 'compulsive_cataloguer') ? 2 : 1 } }], {});
    this.emit('sfx', { name: 'scan' });
    this.log('discovery', `Scanned ${p.name}: ${prettify(p.type)}, life: ${p.life}${p.features.length ? ', ' + p.features.map(prettify).join('/') : ''} (+${bounty} scrip).`);
    this.emit('discovery', { kind: 'planet', text: `${p.name}: ${prettify(p.type)} world${p.life !== 'none' ? ' with ' + p.life + ' life' : ''}`, id: p.id });
    this._codexTrigger('scan', `planetType:${p.type}`);
    for (const f of p.features) this._codexTrigger('scan', `feature:${f}`);
    Missions.noteScan(this, sys, p);
    this._tryChart(sys);
    let ev = false;
    if (this.rng.chance(0.3)) {
      const e = Events.pickEvent(this, 'planet', { systemId: sys.id, planetId });
      if (e) ev = Events.startEvent(this, e, { systemId: sys.id, planetId });
    }
    // every scan can yield a real discovery (samples, credits, a codex line); some come with a choice
    let found = null;
    if (!ev) {
      found = SP.scanFind(this.rng, p, sys);
      if (found) {
        if (this.rng.chance(0.3)) ev = Events.startEvent(this, SP.findEvent(p, found), { systemId: sys.id, planetId });
        else {
          const r = applyEffects(this, found.fx, { systemId: sys.id, planetId });
          this.toast(`Find on ${p.name}: ${r.summary.join(', ') || 'data logged'}`, 'good');
          this.log('discovery', found.text);
          this.emit('discovery', { kind: 'find', text: found.text, id: p.id });
        }
      }
    }
    this._settle();
    return { ok: true, bounty, event: ev, find: found ? found.text : null };
  }
  scanSystem() {
    const g0 = this._guard(); if (g0) return g0;
    const sys = this.here();
    let n = 0;
    for (const p of sys.planets) {
      if (this.state.pending || this.state.phase === 'ended') break;
      if (p.scanned) continue;
      const r = this.scanPlanet(p.id);
      if (!r.ok) { if (n === 0) return r; break; }
      n++;
    }
    return { ok: true, scanned: n };
  }
  landingParty(planetId) {
    const g0 = this._guard(); if (g0) return g0;
    const st = this.state;
    const sys = this.here();
    const p = this.planet(sys.id, planetId);
    if (!p) return { ok: false, reason: 'No such planet here' };
    if (!p.scanned) return { ok: false, reason: 'Scan the planet from orbit first' };
    if (p.landed) return { ok: false, reason: 'The landing party has already been here' };
    if (p.type === 'gas') return { ok: false, reason: 'No solid ground to land on' };
    st.orbit = planetId;
    this.advanceDays(1, { deferCheck: true });
    p.landed = true;
    this.emit('sfx', { name: 'door' });
    this.log('discovery', `Landing party on ${p.name}.`);
    const ctx = { systemId: sys.id, planetId };
    for (const f of p.features) { this._codexTrigger('scan', `feature:${f}`); }
    const ev = Events.pickEvent(this, 'landing', ctx) || SP.landingEvent(p, sys);
    Events.startEvent(this, ev, ctx);
    this._settle();
    return { ok: true, event: true };
  }
  investigate(phenomenon) {
    const g0 = this._guard(); if (g0) return g0;
    const st = this.state;
    const sys = this.here();
    if (!phenomenon || !sys.phenomena.includes(phenomenon)) return { ok: false, reason: 'Nothing like that here' };
    sys.investigated = sys.investigated || {};
    const last = sys.investigated[phenomenon];
    if (last !== undefined && st.day - last < 20) return { ok: false, reason: 'Already studied; give it time to change' };
    this.advanceDays(1, { deferCheck: true });
    sys.investigated[phenomenon] = st.day;
    this.emit('sfx', { name: 'scan' });
    this._codexTrigger('phenomenon', phenomenon);
    Missions.noteInvestigate(this, sys, phenomenon);
    const ctx = { systemId: sys.id, phenomenon };
    const ev = Events.pickEvent(this, 'phenomenon', ctx);
    Events.startEvent(this, ev || BUILTIN.phenomenon, ctx);
    if (!ev) sys.investigated[phenomenon] = st.day - 10; // fallback only: allow a retry sooner (events may unlock later)
    this._settle();
    return { ok: true, event: true };
  }
  hail() {
    const g0 = this._guard(); if (g0) return g0;
    const st = this.state;
    const sys = this.here();
    const faction = sys.station ? sys.station.faction : sys.faction;
    if (!faction || faction === 'none') {
      if (Ship.hasSpecial(st, 'long_range_hails') && !st.counters['hails_' + sys.id]) {
        st.counters['hails_' + sys.id] = 1;
        applyEffects(this, [{ reveal: 'nearest' }], {});
        this.toast('Long-range hail: a distant signal answers, and a new system appears on the chart', 'good');
      }
      return { ok: true, event: false, message: 'Only the quiet hum of the void answers. Politely.' };
    }
    const key = 'hail_' + sys.id;
    if (st.counters[key] && st.day - st.counters[key] < 6) return { ok: true, event: false, message: 'They are still composing their reply to your last hail.' };
    st.counters[key] = st.day;
    this._codexTrigger('faction', faction);
    this.emit('sfx', { name: 'hail' });
    const ctx = { systemId: sys.id, factionId: faction };
    // authored hails are mostly one-shot; the engine's faction hail keeps the channel useful (gossip, goodwill) forever
    const authored = this.rng.chance(0.55) ? Events.pickEvent(this, 'hail', ctx) : null;
    Events.startEvent(this, authored || SP.hailEvent(this, faction, this.rng), ctx);
    this._settle();
    return { ok: true, event: true };
  }

  // =================================================================== actions: station
  dock() {
    const g0 = this._guard(); if (g0) return g0;
    const st = this.state;
    const sys = this.here();
    if (!sys.station) return { ok: false, reason: 'There is no station here' };
    if (st.docked) return { ok: false, reason: 'Already docked' };
    st.docked = true;
    st.orbit = null;
    st.counters.gab_used = 0;
    if (Ship.hasSpecial(st, 'false_floor') && (sys.faction === 'concord' || sys.station.faction === 'concord') && this.rng.chance(0.15)) {
      const fine = Math.min(40, st.credits);
      applyEffects(this, [{ credits: -fine }, { rep: { concord: -2 } }], {});
      this.toast(`Customs spot-check finds the false floor: -${fine} scrip, Concord -2`, 'bad');
    }
    this.emit('sfx', { name: 'dock' });
    this.log('nav', `Docked at ${sys.station.name}.`);
    if (sys.station.faction && sys.station.faction !== 'none') this._codexTrigger('faction', sys.station.faction);
    let started = false;
    // the rival trader, festival shore leave
    const rv = st.rival;
    if (rv && rv.systemId === sys.id && st.day - (rv.lastMetDay ?? -99) >= 6 && this.rng.chance(0.6)) {
      rv.lastMetDay = st.day;
      st.counters.rival_met = (st.counters.rival_met || 0) + 1; st.flags.rival_met = true;
      const ctx = { systemId: sys.id };
      const ev = Events.pickEvent(this, 'rival', ctx) || SP.rivalEvent(this, rv);
      started = Events.startEvent(this, ev, ctx);
    }
    if (!started) {
      const fest = Econ.newsFor(st, sys).find((n) => n.active && n.kind === 'festival');
      const key = fest && `fest_${sys.id}_${Math.floor((fest.startDay - 1) / Econ.SEASON)}`;
      if (fest && !st.counters[key]) { st.counters[key] = 1; started = Events.startEvent(this, SP.festivalEvent(fest, sys), { systemId: sys.id }); }
    }
    if (!started && this.rng.chance(0.3) && (st.counters.lastStationEv === undefined || st.day - st.counters.lastStationEv >= 3)) {
      const ctx = { systemId: sys.id, factionId: sys.station.faction };
      const ev = Events.pickEvent(this, 'station', ctx);
      if (ev) { st.counters.lastStationEv = st.day; started = Events.startEvent(this, ev, ctx); }
    }
    this._settle();
    if (!st.pending) this._autosave();
    return { ok: true, event: started };
  }
  undock() {
    const g0 = this._guard(); if (g0) return g0;
    if (!this.state.docked) return { ok: false, reason: 'Not docked' };
    this.state.docked = false;
    this.emit('sfx', { name: 'undock' });
    this._changed();
    return { ok: true };
  }
  buy(goodId, qty = 1) {
    const g0 = this._guard(); if (g0) return g0;
    const s = this._station('trade'); if (s.err) return s.err;
    const r = Econ.buyGoods(this.state, s.sys, goodId, qty);
    if (r.ok) { this.emit('sfx', { name: 'coin' }); this.log('trade', `Bought ${r.qty} ${goodName(goodId)} for ${r.cost}.`); }
    this._settle();
    return r;
  }
  sell(goodId, qty = 1) {
    const g0 = this._guard(); if (g0) return g0;
    const s = this._station('trade'); if (s.err) return s.err;
    const r = Econ.sellGoods(this.state, s.sys, goodId, qty);
    if (r.ok && Ship.hasSpecial(this.state, 'rival_handshake') && this.state.rival && goodId === this.state.rival.goodId) {
      const extra = Math.floor(r.gain * 0.08);
      this.state.credits += extra; r.gain += extra;
    }
    if (r.ok) {
      this.state.stats.creditsEarned = (this.state.stats.creditsEarned || 0) + r.gain;
      this.emit('sfx', { name: 'coin' });
      this.log('trade', `Sold ${r.qty} ${goodName(goodId)} for ${r.gain}.`);
    }
    this._settle();
    return r;
  }
  buyUpgrade(id) {
    const g0 = this._guard(); if (g0) return g0;
    const s = this._station('shipyard'); if (s.err) return s.err;
    const up = IDX.upgrade[id];
    if (!up) return { ok: false, reason: 'Unknown upgrade' };
    const stt = Ship.upgradeStatus(this.state, up);
    if (!stt.ok) return { ok: false, reason: stt.reason };
    if (this.state.credits < stt.price) return { ok: false, reason: `Needs ${stt.price} scrip` };
    this.state.credits -= stt.price;
    const r = Ship.installUpgrade(this.state, id);
    this.emit('sfx', { name: 'powerup' });
    this.log('ship', `Installed ${up.name}${r.replaced ? ` (replacing ${(IDX.upgrade[r.replaced] || {}).name || r.replaced})` : ''}.`);
    this.toast(`Installed ${up.name}`, 'good');
    this._settle();
    return { ok: true, price: stt.price, replaced: r.replaced };
  }
  sellUpgrade(id) {
    const g0 = this._guard(); if (g0) return g0;
    const s = this._station('shipyard'); if (s.err) return s.err;
    const st = this.state;
    const up = IDX.upgrade[id];
    if (!up || !st.upgrades.includes(id)) return { ok: false, reason: 'Not installed' };
    const dep = Ship.installed(st).find((u) => (u.requires || []).includes(id));
    if (dep) return { ok: false, reason: `${dep.name} depends on it` };
    const gain = Math.floor((up.cost || 0) * 0.5);
    Ship.removeUpgrade(st, id);
    st.credits += gain;
    this.emit('sfx', { name: 'coin' });
    this.log('ship', `Sold ${up.name} for ${gain}.`);
    this._settle();
    return { ok: true, gain };
  }
  _service(kind, amount, fieldFn) {
    const g0 = this._guard(); if (g0) return g0;
    const s = this._station('repair'); if (s.err) return s.err;
    const st = this.state;
    const pr = this.servicePrices(s.sys.id);
    const unit = pr[kind === 'repair' ? 'repair' : kind];
    const { cur, max } = fieldFn(st);
    let need = max - cur;
    if (need < 0.5) return { ok: false, reason: kind === 'repair' ? 'Hull is already sound' : 'Already full' };
    let want = amount === 'max' ? need : Math.floor(Number(amount));
    if (!(want > 0)) return { ok: false, reason: 'Nothing to buy' };
    want = Math.min(want, Math.floor(need) || 1);
    let cost = Math.ceil(want * unit);
    if (cost > st.credits) { want = Math.floor(st.credits / unit); cost = Math.ceil(want * unit); }
    if (want <= 0) return { ok: false, reason: 'Not enough scrip' };
    st.credits -= cost;
    return { ok: true, amount: want, cost, apply: true };
  }
  repair(amount = 'max') {
    const r = this._service('repair', amount, (st) => ({ cur: st.ship.hull, max: st.ship.hullMax }));
    if (!r.ok) return r;
    this.state.ship.hull = clamp(this.state.ship.hull + r.amount, 0, this.state.ship.hullMax);
    this.emit('sfx', { name: 'repair' }); this.log('ship', `Repaired ${r.amount} hull for ${r.cost}.`);
    this._settle();
    return { ok: true, amount: r.amount, cost: r.cost };
  }
  refuel(amount = 'max') {
    const r = this._service('fuel', amount, (st) => ({ cur: st.ship.fuel, max: st.ship.fuelMax }));
    if (!r.ok) return r;
    this.state.ship.fuel = clamp(this.state.ship.fuel + r.amount, 0, this.state.ship.fuelMax);
    this.emit('sfx', { name: 'repair' }); this.log('ship', `Refuelled ${r.amount} for ${r.cost}.`);
    this._settle();
    return { ok: true, amount: r.amount, cost: r.cost };
  }
  restock(amount = 'max') {
    const r = this._service('supplies', amount, (st) => ({ cur: st.ship.supplies, max: st.ship.suppliesMax }));
    if (!r.ok) return r;
    this.state.ship.supplies = clamp(this.state.ship.supplies + r.amount, 0, this.state.ship.suppliesMax);
    this.emit('sfx', { name: 'repair' }); this.log('ship', `Restocked ${r.amount} supplies for ${r.cost}.`);
    this._settle();
    return { ok: true, amount: r.amount, cost: r.cost };
  }

  // =================================================================== actions: missions & crew
  acceptMission(offerId) {
    const g0 = this._guard(); if (g0) return g0;
    const s = this._station('missions'); if (s.err) return s.err;
    const r = Missions.accept(this, offerId);
    this._settle();
    return r;
  }
  abandonMission(id) {
    const g0 = this._guard(); if (g0) return g0;
    const r = Missions.abandon(this, id);
    this._settle();
    return r;
  }
  hireCrew(templateId) {
    const g0 = this._guard(); if (g0) return g0;
    const s = this._station('crew'); if (s.err) return s.err;
    const st = this.state;
    const row = this.crewForHire(s.sys.id).find((c) => c.id === templateId);
    if (!row) return { ok: false, reason: 'Nobody by that name is looking for work here' };
    if (!row.available) return { ok: false, reason: row.reason };
    const t = IDX.crewTpl[templateId];
    st.credits -= t.hireCost;
    st.crew.push(makeCrew(t));
    Ship.recompute(st);
    this.emit('sfx', { name: 'confirm' });
    this.log('crew', `${t.name} signed on.`);
    this.toast(`${t.name} joins the crew`, 'good');
    this._settle();
    return { ok: true };
  }
  dismissCrew(id) {
    const g0 = this._guard(); if (g0) return g0;
    const st = this.state;
    const i = st.crew.findIndex((c) => c.id === id);
    if (i < 0) return { ok: false, reason: 'No such crew member' };
    if (st.crew.length <= 2) return { ok: false, reason: 'You need at least two crew to run the ship' };
    const [c] = st.crew.splice(i, 1);
    for (const o of st.crew) o.mood = clamp(o.mood - 4, 0, 100);
    Ship.recompute(st);
    this.log('crew', `${c.name} left the crew with warm wishes.`);
    this._settle();
    return { ok: true };
  }
  crewTalk(id) {
    const g0 = this._guard(); if (g0) return g0;
    const st = this.state;
    const c = st.crew.find((x) => x.id === id);
    if (!c) return { ok: false, reason: 'No such crew member' };
    const key = 'talk_' + id;
    if (st.counters[key] && st.day - st.counters[key] < 5) return { ok: false, reason: `${c.name} could use some quiet first` };
    st.counters[key] = st.day;
    c.mood = clamp(c.mood + 8, 0, 100);
    st.ship.morale = clamp(st.ship.morale + 1, 0, 100);
    const ctx = { systemId: st.pos, crewId: id };
    const ev = this.rng.chance(0.6) ? Events.pickEvent(this, 'crew', ctx) : null;
    Events.startEvent(this, ev || BUILTIN.crew, ctx);
    this._settle();
    return { ok: true };
  }
  rest(days = 1) {
    const g0 = this._guard(); if (g0) return g0;
    const st = this.state;
    days = Math.max(1, Math.min(10, Math.floor(Number(days) || 1)));
    if (st.ship.supplies < 1) { this._settle(); return { ok: false, reason: 'Not enough supplies to linger' }; }
    this.advanceDays(days, { rest: true });
    this.log('ship', `Rested ${days} day${days > 1 ? 's' : ''}.`);
    this.emit('sfx', { name: 'hum' });
    let ev = false;
    if (this.rng.chance(0.35)) {
      const ctx = { systemId: st.pos };
      const e = Events.pickEvent(this, 'idle', ctx);
      ev = Events.startEvent(this, e || BUILTIN.idle, ctx);
    }
    this._settle();
    return { ok: true, event: ev };
  }
  resolveChoice(index) {
    if (this.state.phase === 'ended') return { ok: false, reason: 'The voyage is over' };
    const r = Events.resolveChoice(this, index);
    if (!this.state.pending) this._changed();
    return r;
  }
  emergency() {
    const g0 = this._guard(); if (g0) return g0;
    if (!this.isStranded()) return { ok: false, reason: 'The Halcyon is not stranded' };
    Events.startEvent(this, BUILTIN.tow, { systemId: this.state.pos });
    this._changed();
    return { ok: true };
  }
  /** Emergency tow to the nearest repair-capable station. Costs scrip, goodwill and days; never fails. */
  tow(cheap = false) {
    const st = this.state;
    const diff = diffOf(st);
    let mult = diff.tow * (cheap ? 0.5 : 1);
    if (Ship.hasSpecial(st, 'emergency_beacon')) mult *= 0.5;
    const here = this.here();
    const d = bfs(st.galaxy, st.pos);
    let best = null;
    for (const s of st.galaxy.systems) {
      if (!s.station || !s.station.services.includes('repair')) continue;
      const h = d[s.id];
      if (h === undefined) continue;
      if (!best || h < best.h || (h === best.h && s.id === here.id)) best = { s, h };
    }
    const pay = Math.min(st.credits, Math.round(80 * mult));
    const days = 3;
    this.advanceDays(days, { deferCheck: true });
    st.credits -= pay;
    st.rep.concord = clamp(st.rep.concord - Math.max(1, Math.round(3 * mult)), -100, 100);
    st.ship.fuel = Math.max(st.ship.fuel, Math.min(st.ship.fuelMax, 12));
    st.ship.supplies = Math.max(st.ship.supplies, Math.min(st.ship.suppliesMax, 10));
    st.ship.hull = Math.max(st.ship.hull, Math.min(st.ship.hullMax, 20));
    st.stats.tows = (st.stats.tows || 0) + 1;
    if (best && best.s.id !== st.pos) { this._enterSystem(best.s.id); this.log('nav', `Towed to ${best.s.name}.`); }
    this.log('ship', `Meridian tender tow: -${pay} scrip, ${days} days.`);
    this.toast(`Towed to safety: -${pay} scrip`, 'info');
    this._teleported = true;
  }
}
Game.lastLoadError = null;
/** When true (tests / sim) internal errors propagate instead of being converted to {ok:false}. */
Game.strict = false;

// Safety net: UI-facing actions never throw; they return { ok:false, reason } and the error is logged.
const ACTIONS = ['jump', 'enterOrbit', 'leaveOrbit', 'scanPlanet', 'scanSystem', 'landingParty', 'investigate', 'hail', 'dock', 'undock', 'buy', 'sell',
  'buyUpgrade', 'sellUpgrade', 'repair', 'refuel', 'restock', 'acceptMission', 'abandonMission', 'hireCrew', 'dismissCrew', 'crewTalk', 'rest',
  'resolveChoice', 'emergency', 'retire'];
for (const name of ACTIONS) {
  const orig = Game.prototype[name];
  Game.prototype[name] = function (...args) {
    try { return orig.apply(this, args); } catch (e) {
      if (Game.strict) throw e;
      try { console.error(`[halcyon] ${name} failed:`, e); } catch { /* ignore */ }
      return { ok: false, reason: 'Something went wrong aboard the ship (internal error)' };
    }
  };
}
export default Game;
