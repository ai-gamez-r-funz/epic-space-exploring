// Seeded galaxy generation: ~42 systems on a 2400x1500 map across six regions, Gabriel-graph lanes (always
// connected, MST-backed), hand-authored story systems placed by region/hops, stations, planets, phenomena.
import { C, IDX } from './content.js';
import { RNG, hashString } from './rng.js';

export const MAP_W = 2400;
export const MAP_H = 1500;
export const SYSTEM_COUNT = 42;
export const MAX_LANE = 440;

const REGION_LAYOUT = {
  gate:    { cx: 330,  cy: 760,  rx: 230, ry: 330, w: 0.16 },
  shoals:  { cx: 860,  cy: 420,  rx: 270, ry: 270, w: 0.24 },
  veil:    { cx: 900,  cy: 1080, rx: 280, ry: 260, w: 0.20 },
  choir:   { cx: 1500, cy: 380,  rx: 260, ry: 250, w: 0.16 },
  archive: { cx: 1520, cy: 1100, rx: 240, ry: 250, w: 0.12 },
  rim:     { cx: 2060, cy: 760,  rx: 230, ry: 400, w: 0.12 },
};
const REGION_IDS = Object.keys(REGION_LAYOUT);

const FACTION_BY_REGION = { gate: ['concord'], shoals: ['quillari', 'concord'], veil: ['vesperine'], choir: ['vesperine', 'drifters'], archive: ['archivists'], rim: ['drifters'] };
const DANGER_BASE = { gate: 0, shoals: 1, veil: 2, choir: 3, archive: 1, rim: 2 };

const STAR_WEIGHTS = {
  gate:    { yellow: 4, orange: 3, white: 2, red: 1 },
  shoals:  { yellow: 3, orange: 3, binary: 3, white: 2, red: 1 },
  veil:    { red: 3, blue: 2, orange: 2, binary: 2, white: 1 },
  choir:   { neutron: 3, blue: 2, white: 2, orange: 1, binary: 1 },
  archive: { white: 3, orange: 2, yellow: 2, red: 1 },
  rim:     { red: 2, orange: 2, yellow: 1, binary: 1, neutron: 1, blackhole: 1 },
};
const PLANET_TYPES = {
  yellow: { terran: 3, ocean: 2, jungle: 2, desert: 2, barren: 1, gas: 1, ice: 0.5 },
  orange: { desert: 2, terran: 1.5, ocean: 1, jungle: 1, barren: 2, ice: 1, gas: 1 },
  red: { barren: 3, ice: 2, toxic: 1.5, desert: 1, gas: 1, terran: 0.5 },
  white: { crystal: 2, barren: 1.5, gas: 2, ice: 1, lava: 1, terran: 0.5 },
  blue: { lava: 2, crystal: 1.5, barren: 2, gas: 2, toxic: 1 },
  binary: { gas: 2, barren: 2, desert: 1, ocean: 1, jungle: 1, crystal: 1, lava: 1 },
  neutron: { barren: 3, ice: 2, crystal: 2, lava: 1 },
  blackhole: { barren: 3, ice: 2, lava: 1 },
};
const PLANET_COUNT = { yellow: [2, 4], orange: [2, 4], red: [1, 3], white: [1, 3], blue: [1, 3], binary: [2, 4], neutron: [0, 2], blackhole: [0, 2] };
const LIFE = {
  terran: { none: 0.2, microbial: 0.25, flora: 0.3, fauna: 0.2 }, ocean: { none: 0.2, microbial: 0.3, flora: 0.2, fauna: 0.3 },
  jungle: { microbial: 0.1, flora: 0.4, fauna: 0.5 }, desert: { none: 0.6, microbial: 0.3, fauna: 0.1 }, ice: { none: 0.8, microbial: 0.2 },
  lava: { none: 1 }, gas: { none: 1 }, barren: { none: 0.95, microbial: 0.05 }, crystal: { none: 0.85, microbial: 0.15 }, toxic: { none: 0.6, microbial: 0.4 },
};
const PHENOM = {
  gate: { asteroids: 0.15, comet: 0.1 }, shoals: { asteroids: 0.15, comet: 0.15, derelict: 0.08 },
  veil: { nebula: 0.55, aurora: 0.2, ionstorm: 0.1 }, choir: { pulsar: 0.3, rift: 0.25, ionstorm: 0.2, comet: 0.1 },
  archive: { derelict: 0.2, comet: 0.1, asteroids: 0.1 }, rim: { wormhole: 0.1, aurora: 0.2, asteroids: 0.15, derelict: 0.15 },
};
const PHENOM_DANGER = { ionstorm: 1, pulsar: 1, rift: 1, nebula: 0.5, asteroids: 0.3 };

const SERVICES = {
  trade: ['trade', 'repair', 'missions'], outpost: ['repair', 'trade'], shipyard: ['shipyard', 'repair', 'trade'],
  embassy: ['diplomacy', 'missions', 'repair'], archive: ['diplomacy', 'missions', 'trade', 'repair'], habitat: ['trade', 'repair', 'missions', 'crew', 'diplomacy'],
};
const KIND_BY_FACTION = {
  concord: { trade: 0.35, outpost: 0.3, embassy: 0.2, shipyard: 0.15 }, quillari: { trade: 0.7, outpost: 0.2, shipyard: 0.1 },
  vesperine: { embassy: 0.4, outpost: 0.4, trade: 0.2 }, archivists: { archive: 0.5, outpost: 0.2, trade: 0.3 },
  drifters: { habitat: 0.5, outpost: 0.3, trade: 0.2 }, none: { outpost: 1 },
};

const wpick = (rng, table) => { const e = Object.entries(table); return rng.weighted(e, (x) => x[1])[0]; };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ---- name helpers (use content/names.js helpers when present) ----------------------------------------------------
function makeNamer(rng, used) {
  const N = C.NAMES || {};
  const fn = () => rng.next();
  return {
    system(region, idx) {
      if (typeof N.systemName === 'function') { try { const n = N.systemName(region, fn, used); if (n) { used.add(n); return n; } } catch { /* fall through */ } }
      let n; let k = 0;
      do { n = `${region.toUpperCase().slice(0, 3)}-${100 + idx + k++}`; } while (used.has(n));
      used.add(n); return n;
    },
    planet(sysName, i, type) {
      if (typeof N.planetName === 'function') { try { const n = N.planetName(sysName, i, type, fn); if (n) return n; } catch { /* fall through */ } }
      return `${sysName} ${['I', 'II', 'III', 'IV', 'V', 'VI'][i] || i + 1}`;
    },
    station(kind, faction) {
      if (typeof N.stationName === 'function') { try { const n = N.stationName(kind, faction, fn); if (n) return n; } catch { /* fall through */ } }
      return `${kind[0].toUpperCase() + kind.slice(1)} Station`;
    },
  };
}

// ---- point sampling ---------------------------------------------------------------------------------------------
function samplePoints(rng, counts) {
  const pts = [];
  let minD = 165;
  for (const region of REGION_IDS) {
    const L = REGION_LAYOUT[region];
    for (let i = 0; i < counts[region]; i++) {
      let placed = false;
      let d = minD;
      for (let attempt = 0; attempt < 600 && !placed; attempt++) {
        if (attempt > 0 && attempt % 60 === 0) d *= 0.93;
        const a = rng.float(0, Math.PI * 2);
        const r = Math.sqrt(rng.next());
        const x = L.cx + Math.cos(a) * r * L.rx;
        const y = L.cy + Math.sin(a) * r * L.ry;
        if (x < 90 || x > MAP_W - 90 || y < 90 || y > MAP_H - 90) continue;
        if (pts.every((p) => Math.hypot(p.x - x, p.y - y) >= d)) { pts.push({ x: Math.round(x), y: Math.round(y), region }); placed = true; }
      }
      if (!placed) { // last resort: jitter around centre
        pts.push({ x: Math.round(L.cx + rng.float(-L.rx, L.rx)), y: Math.round(L.cy + rng.float(-L.ry, L.ry)), region });
      }
    }
  }
  return pts;
}

function regionCounts(total) {
  const weights = {};
  let sum = 0;
  for (const r of REGION_IDS) { weights[r] = (C.REGIONS[r] && C.REGIONS[r].weight) || REGION_LAYOUT[r].w; sum += weights[r]; }
  const counts = {};
  let used = 0;
  const rema = [];
  for (const r of REGION_IDS) { const x = (weights[r] / sum) * total; counts[r] = Math.floor(x); used += counts[r]; rema.push([r, x - counts[r]]); }
  rema.sort((a, b) => b[1] - a[1]);
  for (let i = 0; used < total; i++, used++) counts[rema[i % rema.length][0]]++;
  // ensure each region can hold its story systems
  for (const r of REGION_IDS) {
    const need = C.STORY_SYSTEMS.filter((s) => s.region === r).length + 1;
    while (counts[r] < need) {
      const donor = REGION_IDS.slice().sort((a, b) => counts[b] - counts[a])[0];
      counts[donor]--; counts[r]++;
    }
  }
  return counts;
}

// ---- lanes --------------------------------------------------------------------------------------------------------
export function buildLanes(systems) {
  const n = systems.length;
  const lanes = new Map();
  const key = (i, j) => (i < j ? `${i}-${j}` : `${j}-${i}`);
  // Gabriel graph
  const gab = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const mx = (systems[i].x + systems[j].x) / 2; const my = (systems[i].y + systems[j].y) / 2;
    const r = dist(systems[i], systems[j]) / 2;
    let empty = true;
    for (let k = 0; k < n && empty; k++) if (k !== i && k !== j && Math.hypot(systems[k].x - mx, systems[k].y - my) < r - 1e-6) empty = false;
    if (empty) gab.push([i, j, r * 2]);
  }
  // MST (Prim) over complete graph guarantees connectivity
  const inT = new Array(n).fill(false); const best = new Array(n).fill(Infinity); const from = new Array(n).fill(-1);
  best[0] = 0;
  for (let it = 0; it < n; it++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!inT[i] && (u < 0 || best[i] < best[u])) u = i;
    inT[u] = true;
    if (from[u] >= 0) lanes.set(key(u, from[u]), [Math.min(u, from[u]), Math.max(u, from[u])]);
    for (let v = 0; v < n; v++) if (!inT[v]) { const d = dist(systems[u], systems[v]); if (d < best[v]) { best[v] = d; from[v] = u; } }
  }
  for (const [i, j, d] of gab) if (d <= MAX_LANE) lanes.set(key(i, j), [i, j]);
  return [...lanes.values()].map(([i, j]) => [systems[i].id, systems[j].id]);
}

export function adjacency(galaxy) {
  const adj = {};
  for (const s of galaxy.systems) adj[s.id] = [];
  for (const [a, b] of galaxy.lanes) { adj[a].push(b); adj[b].push(a); }
  return adj;
}
/** Hop distances from a system. */
export function bfs(galaxy, fromId, adj = adjacency(galaxy)) {
  const d = { [fromId]: 0 };
  const q = [fromId];
  while (q.length) {
    const u = q.shift();
    for (const v of adj[u] || []) if (d[v] === undefined) { d[v] = d[u] + 1; q.push(v); }
  }
  return d;
}
export function isConnected(galaxy) {
  const d = bfs(galaxy, galaxy.systems[0].id);
  return Object.keys(d).length === galaxy.systems.length;
}

// ---- system contents -----------------------------------------------------------------------------------------------
function makePlanets(rng, sys, namer) {
  const [lo, hi] = PLANET_COUNT[sys.star] || [1, 3];
  const n = rng.int(lo, hi);
  const planets = [];
  for (let i = 0; i < n; i++) {
    const type = wpick(rng, PLANET_TYPES[sys.star] || PLANET_TYPES.yellow);
    const size = type === 'gas' ? rng.float(1.2, 2) : type === 'barren' ? rng.float(0.5, 1.1) : rng.float(0.7, 1.4);
    const features = [];
    // every planet type can carry every feature (authored scan/landing events key on type+feature pairs)
    const oreP = ['barren', 'desert', 'lava', 'ice'].includes(type) ? 0.28 : type === 'gas' ? 0 : 0.14;
    if (rng.chance(oreP)) features.push('ore');
    const springP = ['ocean', 'ice', 'terran'].includes(type) ? 0.14 : type === 'gas' || type === 'lava' ? 0 : 0.1;
    if (rng.chance(springP)) features.push('hot_springs');
    const auroraP = ['ice', 'gas', 'ocean'].includes(type) ? 0.12 : 0.08;
    if (rng.chance(auroraP)) features.push('aurora_fields');
    const ruinP = (['archive', 'rim'].includes(sys.region) ? 0.14 : 0.07) * (type === 'gas' ? 0 : 1);
    if (rng.chance(ruinP)) features.push('ruins');
    if (rng.chance(type === 'gas' ? 0.05 : 0.06)) features.push('ancient_signal');
    let life = wpick(rng, LIFE[type] || { none: 1 });
    if (life === 'fauna' && sys.faction !== 'none' && rng.chance(0.08)) life = 'civilized';
    planets.push({
      id: `${sys.id}_p${i}`, name: namer.planet(sys.name, i, type), type, size: Math.round(size * 100) / 100,
      ringed: type === 'gas' ? rng.chance(0.35) : rng.chance(0.05), moons: type === 'gas' ? rng.int(0, 3) : rng.chance(0.4) ? rng.int(1, 2) : 0,
      life, features, scanned: false, landed: false,
    });
  }
  return planets;
}

function makeStation(rng, sys, namer) {
  const kind = wpick(rng, KIND_BY_FACTION[sys.faction] || KIND_BY_FACTION.none);
  const faction = sys.faction !== 'none' ? sys.faction : (FACTION_BY_REGION[sys.region] || ['none'])[0];
  const services = SERVICES[kind].slice();
  if (['trade', 'shipyard'].includes(kind) && rng.chance(0.5)) services.push('crew');
  if (kind === 'trade' && rng.chance(0.5) && !services.includes('diplomacy')) services.push('diplomacy');
  return { name: namer.station(kind, faction), kind, faction, services };
}

function materialiseStory(def, sys, rng, namer) {
  sys.name = def.name || sys.name;
  sys.star = def.star || sys.star;
  sys.faction = def.faction || 'none';
  sys.story = def.id;
  sys.danger = typeof def.danger === 'number' ? def.danger : sys.danger;
  sys.phenomena = (def.phenomena || []).slice();
  sys.planets = (def.planets || []).map((p, i) => ({
    id: `${sys.id}_p${i}`, name: p.name || namer.planet(sys.name, i, p.type), type: p.type, size: p.size ?? 1, ringed: !!p.ringed, moons: p.moons | 0,
    life: p.life || 'none', features: (p.features || []).slice(), scanned: false, landed: false,
  }));
  sys.station = def.station ? { name: def.station.name, kind: def.station.kind, faction: def.station.faction || sys.faction, services: (def.station.services || SERVICES[def.station.kind] || ['repair']).slice() } : null;
  if (sys.station && !sys.station.services.includes('repair')) sys.station.services.push('repair');
}

/** Generate the galaxy. Deterministic in `seed` (+ content). */
export function generateGalaxy(seed) {
  const rng = new RNG(hashString('galaxy:' + seed));
  const counts = regionCounts(SYSTEM_COUNT);
  const pts = samplePoints(rng, counts);
  const used = new Set(C.STORY_SYSTEMS.map((s) => s.name));
  const namer = makeNamer(rng, used);

  const systems = pts.map((p, i) => ({
    id: `s${String(i + 1).padStart(2, '0')}`, name: '', x: p.x, y: p.y, star: 'yellow', region: p.region, faction: 'none',
    status: 'unknown', planets: [], phenomena: [], station: null, story: null, danger: 0, visits: 0,
  }));
  const galaxy = { systems, lanes: [], w: MAP_W, h: MAP_H, gate: null };
  galaxy.lanes = buildLanes(systems);
  const adj = adjacency(galaxy);

  // --- base attributes
  systems.forEach((s, i) => {
    s.star = wpick(rng, STAR_WEIGHTS[s.region]);
    const prefs = (C.REGIONS[s.region] && C.REGIONS[s.region].factions) || FACTION_BY_REGION[s.region] || [];
    const table = { none: 1.3 };
    prefs.forEach((f, k) => { table[f] = k === 0 ? 4 : 2; });
    s.faction = wpick(rng, table);
    s.name = namer.system(s.region, i);
  });

  // --- place story systems: gate first, then by hops from the gate
  const gateDef = C.STORY_SYSTEMS.find((d) => d.start || d.placement === 'gate');
  const gateRegion = systems.filter((s) => s.region === 'gate');
  // gate = westernmost gate-region system
  const gateSys = gateRegion.slice().sort((a, b) => a.x - b.x)[0] || systems[0];
  galaxy.gate = gateSys.id;
  const hopsFromGate = bfs(galaxy, gateSys.id, adj);
  const taken = new Set();
  const defs = C.STORY_SYSTEMS.slice().sort((a, b) => (a.start ? -1 : b.start ? 1 : (a.hopsFromGate || 0) - (b.hopsFromGate || 0)));
  const regionCentre = (r) => { const m = systems.filter((s) => s.region === r); return { x: m.reduce((a, s) => a + s.x, 0) / m.length, y: m.reduce((a, s) => a + s.y, 0) / m.length }; };
  for (const def of defs) {
    let target;
    if (def === gateDef || def.start) target = gateSys;
    else {
      const cands = systems.filter((s) => s.region === def.region && !taken.has(s.id) && s.id !== gateSys.id);
      const pool = cands.length ? cands : systems.filter((s) => !taken.has(s.id) && s.id !== gateSys.id);
      const c = regionCentre(def.region);
      const maxHop = Math.max(...pool.map((s) => hopsFromGate[s.id] ?? 0), 1);
      const score = (s) => {
        const h = hopsFromGate[s.id] ?? 0;
        let sc = Math.abs(h - (def.hopsFromGate ?? h)) * 1.0;
        const dc = dist(s, c) / 250;
        if (def.placement === 'core') sc += dc * 2;
        else if (def.placement === 'edge') sc -= dc * 1.2;
        else if (def.placement === 'deep') sc += (maxHop - h) * 1.5;
        return sc + rng.float(0, 0.3);
      };
      target = pool.slice().sort((a, b) => score(a) - score(b))[0];
    }
    if (!target) continue;
    taken.add(target.id);
    materialiseStory(def, target, rng, namer);
  }
  // --- fill the generated systems
  for (const s of systems) {
    if (s.story) continue;
    s.planets = makePlanets(rng, s, namer);
    const pt = PHENOM[s.region] || {};
    for (const [ph, p] of Object.entries(pt)) if (rng.chance(p * 0.7)) s.phenomena.push(ph);
    if (s.star === 'neutron' && !s.phenomena.includes('pulsar')) s.phenomena.push('pulsar');
    let danger = DANGER_BASE[s.region] + (rng.chance(0.3) ? 1 : 0) - (rng.chance(0.3) ? 1 : 0);
    for (const ph of s.phenomena) danger += PHENOM_DANGER[ph] || 0;
    s.danger = Math.max(0, Math.min(3, Math.round(danger)));
    const stationP = s.faction !== 'none' ? 0.5 : 0.15;
    if (rng.chance(stationP)) s.station = makeStation(rng, s, namer);
  }
  // --- fuel-stop coverage: every system within 2 hops of a station with repair
  const hasRepair = (s) => s.station && s.station.services.includes('repair');
  for (let pass = 0; pass < 12; pass++) {
    let changed = false;
    for (const s of systems) {
      const d = bfs(galaxy, s.id, adj);
      const near = Object.entries(d).some(([id, h]) => h <= 2 && hasRepair(systems.find((x) => x.id === id)));
      if (!near) {
        if (!s.station) s.station = makeStation(rng, s, namer);
        if (!s.station.services.includes('repair')) s.station.services.push('repair');
        changed = true;
      }
    }
    if (!changed) break;
  }
  // --- guarantee some variety of services
  const stations = systems.filter((s) => s.station);
  if (!stations.some((s) => s.station.services.includes('shipyard') && s.id !== gateSys.id)) {
    const c = stations.find((s) => s.region === 'shoals') || stations[1];
    if (c) { c.station.services.push('shipyard'); }
  }
  // one shipyard per region (scrip must always have somewhere to go)
  for (const region of REGION_IDS) {
    const inRegion = systems.filter((s) => s.region === region && s.station);
    if (!inRegion.length || inRegion.some((s) => s.station.services.includes('shipyard'))) continue;
    const pref = inRegion.find((s) => ['trade', 'habitat', 'embassy', 'archive'].includes(s.station.kind)) || inRegion[0];
    pref.station.services.push('shipyard');
  }
  // start state
  gateSys.status = 'visited';
  gateSys.visits = 1;
  return galaxy;
}

/** Lane list helpers */
export function laneBetween(galaxy, a, b) {
  return galaxy.lanes.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}
export function laneLength(galaxy, a, b) {
  const sa = galaxy.systems.find((s) => s.id === a); const sb = galaxy.systems.find((s) => s.id === b);
  return sa && sb ? dist(sa, sb) : Infinity;
}
export { IDX };
