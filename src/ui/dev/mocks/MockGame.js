// MockGame — minimal in-browser stand-in for src/core/game.js implementing the contract surface the UI needs.
const STARS = ['yellow', 'orange', 'red', 'white', 'blue', 'binary', 'neutron'];
const PTYPES = ['terran', 'ocean', 'desert', 'ice', 'lava', 'gas', 'barren', 'jungle', 'crystal', 'toxic'];
const PHEN = ['nebula', 'pulsar', 'ionstorm', 'wormhole', 'asteroids', 'derelict', 'comet', 'rift', 'aurora', 'beacon'];
const REGIONS = ['gate', 'shoals', 'veil', 'choir', 'archive', 'rim'];
const FACTIONS = ['concord', 'quillari', 'vesperine', 'archivists', 'drifters'];
const NAMES = ['Aldera', 'Brisa', 'Cassio', 'Dovecote', 'Elsewhere', 'Fennel', 'Gantry', 'Hollis', 'Ixion', 'Juniper', 'Kettle', 'Lumen', 'Marrow', 'Nacre', 'Oriole', 'Pennant', 'Quince', 'Reverie', 'Sorrel', 'Tamarind', 'Umber', 'Vesper', 'Wicket', 'Yarrow', 'Zephyr', 'Larkspur'];
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export class MockGame {
  static create({ seed = 1234, captainName = 'Captain', shipName = 'ISV Halcyon', difficulty = 'standard' } = {}) { return new MockGame(MockGame._gen(seed, captainName, shipName, difficulty)); }
  static load(json) { return new MockGame(JSON.parse(json)); }
  static hasSave(slot = 'auto') { try { return !!localStorage.getItem('mock.save.' + slot); } catch (e) { return false; } }
  static writeSave(g, slot = 'auto') { try { localStorage.setItem('mock.save.' + slot, g.save()); return true; } catch (e) { return false; } }
  static readSave(slot = 'auto') { try { return localStorage.getItem('mock.save.' + slot); } catch (e) { return null; } }
  static deleteSave(slot = 'auto') { try { localStorage.removeItem('mock.save.' + slot); } catch (e) { /* */ } }
  static _gen(seed, captainName, shipName, difficulty) {
    const r = mulberry(seed); const systems = []; const W = 2400, H = 1500;
    for (let i = 0; i < 34; i++) {
      const ang = r() * 6.283, rad = Math.sqrt(r()) * 0.46; const x = W / 2 + Math.cos(ang) * rad * W, y = H / 2 + Math.sin(ang) * rad * H;
      const nP = Math.floor(r() * 5);
      const region = REGIONS[Math.min(5, Math.floor((Math.atan2(y - H / 2, x - W / 2) + 3.1416) / 6.2832 * 6))];
      const planets = Array.from({ length: nP }, (_, k) => ({ id: `p${i}_${k}`, name: `${NAMES[i % NAMES.length]} ${'I II III IV V'.split(' ')[k]}`, type: PTYPES[Math.floor(r() * 10)], size: 0.5 + r() * 1.5, ringed: r() < 0.2, moons: Math.floor(r() * 4), life: ['none', 'microbial', 'flora', 'fauna', 'civilized'][Math.floor(r() * 5)], features: r() < 0.4 ? ['ruins'] : [], scanned: false, landed: false }));
      systems.push({ id: 's' + i, name: i === 0 ? 'The Gate' : NAMES[i % NAMES.length] + (i >= NAMES.length ? ' Minor' : ''), x, y, star: STARS[Math.floor(r() * STARS.length)], region: i === 0 ? 'gate' : region, faction: r() < 0.5 ? FACTIONS[Math.floor(r() * 5)] : 'none', status: 'unknown', planets, phenomena: r() < 0.4 ? [PHEN[Math.floor(r() * 10)]] : [], station: r() < 0.3 ? { name: NAMES[(i * 3) % NAMES.length] + ' Station', kind: ['trade', 'outpost', 'shipyard', 'embassy'][Math.floor(r() * 4)], faction: 'concord', services: ['trade', 'repair', 'missions'] } : null, story: null, danger: Math.floor(r() * 4), visits: 0 });
    }
    systems[0].x = W / 2; systems[0].y = H / 2; systems[0].status = 'visited'; systems[0].station = { name: 'Gate Station', kind: 'trade', faction: 'concord', services: ['trade', 'repair', 'missions'] };
    const lanes = []; const key = new Set();
    for (const a of systems) {
      const near = systems.filter((b) => b !== a).map((b) => [b, Math.hypot(a.x - b.x, a.y - b.y)]).sort((p, q) => p[1] - q[1]).slice(0, 3);
      for (const [b] of near) { const k = [a.id, b.id].sort().join('|'); if (!key.has(k)) { key.add(k); lanes.push([a.id, b.id]); } }
    }
    const crew = [['Oriel Vance', 'science', 'human'], ['Tam Brightwater', 'engineering', 'quillari'], ['Dr. Ilse Moran', 'medicine', 'human'], ['Ambassador Pell', 'diplomacy', 'drifter']].map(([name, role, species], i) => ({ id: 'c' + i, name, role, species, skills: { [role]: 3 }, trait: 'steady', mood: 70 - i * 9, level: 1, xp: 0, bio: '', portrait: { species, seed: i + 3 } }));
    const state = { v: 1, seed, day: 1, phase: 'play', captain: { name: captainName }, difficulty, ship: { name: shipName, hull: 80, hullMax: 100, fuel: 14, fuelMax: 20, supplies: 40, suppliesMax: 60, morale: 72, cargoMax: 20 }, credits: 300, cargo: {}, items: {}, upgrades: [], crew, rep: { concord: 5, quillari: 0, vesperine: 0, archivists: 0, drifters: 0 }, flags: {}, counters: {}, galaxy: { systems, lanes, w: W, h: H, gate: 's0' }, pos: 's0', orbit: null, docked: false, missions: { active: [], done: [], failed: [] }, codex: [], log: [], markets: {}, pending: null, stats: { jumps: 0, planetsScanned: 0, systemsCharted: 0 }, ending: null };
    const g = new MockGame(state); g._reveal('s0'); return g.state;
  }
  constructor(state) { this.state = state; this._h = {}; this.isMock = true; }
  on(type, fn) { (this._h[type] ||= new Set()).add(fn); return () => this._h[type].delete(fn); }
  _emit(type, p) { (this._h[type] || []).forEach((f) => f(p)); }
  _changed() { this._emit('changed'); }
  system(id) { return this.state.galaxy.systems.find((s) => s.id === id); }
  here() { return this.system(this.state.pos); }
  planet(sid, pid) { return this.system(sid)?.planets.find((p) => p.id === pid); }
  _adj(id) { return this.state.galaxy.lanes.filter((l) => l.includes(id)).map((l) => (l[0] === id ? l[1] : l[0])); }
  _reveal(id) { for (const n of this._adj(id)) { const s = this.system(n); if (s.status === 'unknown') s.status = 'detected'; } }
  neighbors(id) { const a = this.system(id); return this._adj(id).map((n) => this.system(n)).filter((s) => s.status !== 'unknown').map((s) => { const dist = Math.hypot(a.x - s.x, a.y - s.y) / 60; return { id: s.id, dist, fuelCost: Math.max(1, Math.round(dist * 0.9)), days: Math.max(1, Math.round(dist / 2)), known: true }; }); }
  canJump(to) {
    const n = this.neighbors(this.state.pos).find((x) => x.id === to);
    if (!n) return { ok: false, reason: 'No direct lane from here.', fuelCost: 0, days: 0 };
    if (this.state.pending) return { ok: false, reason: 'Resolve the current event first.', fuelCost: n.fuelCost, days: n.days };
    if (this.state.ship.fuel < n.fuelCost) return { ok: false, reason: `Need ${n.fuelCost} fuel, have ${Math.floor(this.state.ship.fuel)}.`, fuelCost: n.fuelCost, days: n.days };
    return { ok: true, fuelCost: n.fuelCost, days: n.days };
  }
  surveyProgress() { const sys = this.state.galaxy.systems; const charted = sys.filter((s) => s.status === 'charted').length; const pl = sys.flatMap((s) => s.planets); const sc = pl.filter((p) => p.scanned).length; return { charted, total: sys.length, pct: Math.round(charted / sys.length * 100), planetsScanned: sc, planetsTotal: pl.length, score: charted * 10 + sc }; }
  skillTotal(sk) { return Math.max(0, ...this.state.crew.map((c) => c.skills[sk] || 0)); }
  checkOdds(sk, d) { return Math.min(0.95, Math.max(0.1, 0.5 + 0.11 * (this.skillTotal(sk) - d))); }
  shipStats() { return { fuelMax: 20, suppliesMax: 60, hullMax: 100, cargoMax: 20, scanRange: 1, jumpRange: 1, efficiency: 1, slots: { used: 0, total: 8 }, bonuses: {} }; }
  cargoUsed() { return 0; } crewList() { return this.state.crew; } codexEntries() { return []; } activeMissions() { return this.state.missions.active; }
  market(id) { return null; } shipyard() { return []; } missionBoard() { return []; } evalConds() { return { ok: true }; }
  _guard() { return this.state.pending ? { ok: false, reason: 'An event is in progress.' } : null; }
  _log(kind, text) { this.state.log.push({ day: this.state.day, kind, text }); this._emit('log', { kind, text }); }
  jump(to) {
    const c = this.canJump(to); if (!c.ok) return c; const s = this.state;
    s.ship.fuel -= c.fuelCost; s.ship.supplies = Math.max(0, s.ship.supplies - c.days); s.day += c.days; s.pos = to; s.orbit = null; s.docked = false; s.stats.jumps++;
    const sys = this.here(); if (sys.status !== 'charted') sys.status = 'visited'; sys.visits++; this._reveal(to);
    this._log('nav', `Arrived at ${sys.name}.`); this._emit('sfx', { name: 'arrive' }); this._emit('arrive', { systemId: to });
    if (Math.random() < 0.4) { s.pending = { id: 'mock', node: 'a' }; this._emit('event'); }
    this._changed(); return { ok: true };
  }
  enterOrbit(pid) { const g = this._guard(); if (g) return g; this.state.orbit = pid; this._changed(); return { ok: true }; }
  leaveOrbit() { this.state.orbit = null; this._changed(); return { ok: true }; }
  scanPlanet(pid) {
    const g = this._guard(); if (g) return g; const p = this.planet(this.state.pos, pid); if (!p) return { ok: false, reason: 'No such planet.' };
    p.scanned = true; this.state.day++; this.state.stats.planetsScanned++; this._maybeChart(); this._emit('sfx', { name: 'scan' }); this._emit('toast', { text: `Scanned ${p.name}.`, tone: 'good' }); this._changed(); return { ok: true };
  }
  scanSystem() { for (const p of this.here().planets) p.scanned = true; this._maybeChart(); this._changed(); return { ok: true }; }
  _maybeChart() { const s = this.here(); if (s.planets.every((p) => p.scanned)) s.status = 'charted'; }
  landingParty(pid) { const p = this.planet(this.state.pos, pid); if (!p?.scanned) return { ok: false, reason: 'Scan the planet first.' }; p.landed = true; this.state.pending = { id: 'mock', node: 'a' }; this._emit('event'); this._changed(); return { ok: true }; }
  investigate() { this.state.pending = { id: 'mock', node: 'a' }; this._emit('event'); this._changed(); return { ok: true }; }
  hail() { this.state.pending = { id: 'mock', node: 'a' }; this._emit('event'); this._changed(); return { ok: true }; }
  dock() { if (!this.here().station) return { ok: false, reason: 'No station.' }; this.state.docked = true; this._emit('sfx', { name: 'dock' }); this._changed(); return { ok: true }; }
  undock() { this.state.docked = false; this._changed(); return { ok: true }; }
  rest(d = 1) { this.state.day += d; this.state.ship.morale = Math.min(100, this.state.ship.morale + 3 * d); this.state.ship.supplies = Math.max(0, this.state.ship.supplies - d); this._changed(); return { ok: true }; }
  repair() { this.state.ship.hull = this.state.ship.hullMax; this._changed(); return { ok: true }; } refuel() { this.state.ship.fuel = this.state.ship.fuelMax; this._changed(); return { ok: true }; }
  restock() { this.state.ship.supplies = this.state.ship.suppliesMax; this._changed(); return { ok: true }; }
  resolveChoice() { this.state.pending = null; this._changed(); return { ok: true }; }
  pendingView() { if (!this.state.pending) return null; return { title: 'A Mock Encounter', text: 'The mock engine is pretending something charming has happened. Press a choice to carry on.', art: { scene: 'nebula' }, speaker: { name: 'Mock Officer', species: 'human' }, choices: [{ index: 0, label: 'Carry on gently', enabled: true, tag: 'wait' }, { index: 1, label: 'Hail them with great ceremony', enabled: true, odds: 0.62, tag: 'diplomacy' }, { index: 2, label: 'Offer a gift (you have none)', enabled: false, reason: 'Requires item: gift basket' }], isResult: false, continueOnly: false }; }
  save() { return JSON.stringify(this.state); }
}
