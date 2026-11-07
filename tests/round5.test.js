import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, freshStorage, drain, teleportForTest, dockClean } from './helpers.js';
import { Game } from '../src/core/game.js';
import { C } from '../src/core/content.js';

const G = (seed = 51, o = {}) => { freshStorage(); return newGame({ seed, ...o }); };
const live = (g) => { g.state.ship.supplies = g.state.ship.suppliesMax; g.state.ship.morale = 100; g.state.ship.fuel = g.state.ship.fuelMax; };
function hotGame() {
  for (let seed = 1; seed <= 40; seed++) {
    const g = G(seed);
    for (const s of g.state.galaxy.systems) if (s.status === 'unknown') s.status = 'detected';
    const hot = g.hotLanes()[0];
    if (hot) { teleportForTest(g, hot.fromId); live(g); return { g, hot }; }
  }
  throw new Error('no hot lane');
}

test('creep is not free: it has a fail chance, a bounty penalty, and bold running pays a bonus', () => {
  const { g, hot } = hotGame();
  const b = g.hotLaneBriefing(hot.toId);
  for (const st of b.stages) {
    const creep = st.options.find((o) => o.key === 'creep');
    assert.ok(creep.odds < 1 && creep.odds >= 0.65 && creep.odds <= 0.85, `creep odds ${creep.odds}`);
    assert.ok(creep.failCost.hull > 0 && creep.bonusPct < 0);
    assert.ok(st.options.find((o) => o.key === 'run').bonusPct > 0);
    assert.ok(st.options.every((o) => o.odds < 1), 'no option is a sure thing');
  }
});

test('hot-lane pool: with authored chains present the built-in fallback is never used', () => {
  let builtin = 0; let authored = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const g = G(seed);
    for (const s of g.state.galaxy.systems) if (s.status === 'unknown') s.status = 'detected';
    for (const h of g.hotLanes().slice(0, 2)) {
      teleportForTest(g, h.fromId); live(g); g.state.counters = {};
      g.jump(h.toId);
      if (g.state.pending) { if (g.state.pending.eventId === 'core_hot_lane') builtin++; else if (/^lane_hot_/.test(g.state.pending.eventId)) authored++; }
      drain(g);
    }
  }
  assert.ok(authored >= 10, `authored ${authored}`);
  assert.equal(builtin, 0, 'built-in hot lane should only appear when no authored chain exists');
});

test('limping guard: warning below 25% hull, one-time free emergency repair, hull hints', () => {
  const g = G(52);
  teleportForTest(g, g.state.galaxy.gate); dockClean(g);
  assert.equal(g.departureCheck(g.neighbors()[0].id).warn, false);
  g.state.ship.hull = 12;
  const d = g.departureCheck(g.neighbors()[0].id);
  assert.equal(d.warn, true); assert.match(d.message, /Hull at/);
  assert.equal(d.freeRepair.available, true);
  assert.match(g.nextObjective().warning, /repair/i);
  assert.ok(g.dockBulletin().lines.some((l) => l.kind === 'hull'));
  const r = g.claimFreeRepair();
  assert.ok(r.ok); assert.ok(g.state.ship.hull >= 59);
  g.state.ship.hull = 10;
  assert.equal(g.claimFreeRepair().ok, false, 'only once');
});

test('captain names are normalised at the source (no "Captain Captain")', () => {
  for (const [raw, want] of [['Captain Ada Merriweather', 'Ada Merriweather'], ['Capt. Rafael', 'Rafael'], ['  captain captain Zed ', 'Zed'], ['Ada', 'Ada'], ['Captain', 'Voyager'], ['', 'Voyager'], [undefined, 'Voyager']]) {
    freshStorage();
    const g = Game.create({ seed: 1, captainName: raw, legacy: false, autosave: false });
    assert.equal(g.state.captain.name, want);
  }
});

test('200-day soak: state size stays bounded and the heap does not balloon', () => {
  const g = G(53);
  const size = () => JSON.stringify(g.state).length;
  let at100 = 0;
  for (let i = 0; i < 4000 && g.state.day < 200 && g.state.phase === 'play'; i++) {
    if (g.state.pending) { drain(g); continue; }
    live(g); g.state.ship.hull = g.state.ship.hullMax; g.state.credits = Math.max(g.state.credits, 500);
    const sys = g.here();
    if (sys.planets.some((p) => !p.scanned)) g.scanSystem();
    if (g.state.pending) continue;
    if (sys.station) { g.dock(); drain(g); g.undock(); }
    const nb = g.neighbors().filter((n) => g.canJump(n.id).ok);
    if (!nb.length) { g.rest(1); drain(g); continue; }
    g.jump(nb[i % nb.length].id); drain(g);
    if (!at100 && g.state.day >= 100) at100 = size();
  }
  const end = size();
  assert.ok(g.state.log.length <= 400, 'log is capped');
  assert.ok(end < 400000, `state is ${end} bytes`);
  if (at100) assert.ok(end < at100 * 2.2, `state grew ${at100} -> ${end}`);
  const saved = g.save();
  assert.ok(Game.load(saved), 'still loads after 200 days');
  if (global.gc) {
    global.gc();
    const before = process.memoryUsage().heapUsed;
    for (let i = 0; i < 30; i++) { g.market(); g.mapMarkers(); g.dockBulletin(); g.nextObjective(); g.spendHints(); }
    global.gc();
    assert.ok(process.memoryUsage().heapUsed - before < 20 * 1024 * 1024, 'query calls do not leak');
  }
});
