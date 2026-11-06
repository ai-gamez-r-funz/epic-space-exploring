import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, freshStorage, stationSystem, teleportForTest, dockClean } from './helpers.js';
import { C } from '../src/core/content.js';
import * as Econ from '../src/core/economy.js';
import { bfs } from '../src/core/galaxy.js';

function tradeSetup(seed = 3) {
  freshStorage();
  const g = newGame({ seed });
  const s = g.state.galaxy.systems.filter((x) => x.station && x.station.services.includes('trade'))[0];
  teleportForTest(g, s.id);
  dockClean(g);
  g.state.credits = 100000;
  return { g, s };
}

test('market: prices positive, stock finite, buy > sell for every good', () => {
  const { g } = tradeSetup();
  const m = g.market();
  assert.ok(m && m.goods.length >= 8);
  for (const gd of m.goods) {
    assert.ok(gd.sell > 0);
    if (gd.buy !== null) assert.ok(gd.buy > gd.sell, `${gd.id} buy ${gd.buy} <= sell ${gd.sell}`);
  }
});

test('anti-exploit: buying then selling back immediately always loses money', () => {
  for (const seed of [1, 2, 3, 4]) {
    const { g } = tradeSetup(seed);
    const m = g.market();
    for (const gd of m.goods.filter((x) => x.stock > 0)) {
      const before = g.state.credits;
      const r = g.buy(gd.id, Math.min(10, gd.stock));
      if (!r.ok) continue;
      const s = g.sell(gd.id, r.qty);
      assert.ok(s.ok);
      assert.ok(g.state.credits < before, `${gd.id}: round trip gained ${g.state.credits - before}`);
      assert.ok(before - g.state.credits >= r.cost * 0.07, 'round trip should cost at least ~7%');
    }
  }
});

test('anti-exploit holds even with maxed discounts and bonuses', () => {
  const { g } = tradeSetup(2);
  g.state.upgrades = C.UPGRADES.map((u) => u.id); // absurd: all upgrades installed (bonus stacking worst case)
  g.state.rep.concord = 100; g.state.rep.quillari = 100;
  const s = g.here();
  for (const gd of C.GOODS) {
    const b = Econ.quoteBuy(g.state, s, gd.id, 5); const sl = Econ.quoteSell(g.state, s, gd.id, 5);
    assert.ok(sl < b, `${gd.id}: sell ${sl} >= buy ${b}`);
  }
});

test('selling many units depresses the price (diminishing returns); buying raises it', () => {
  const { g } = tradeSetup();
  const s = g.here();
  const gd = g.market().goods.find((x) => x.stock >= 12 && x.buy);
  const one = Econ.quoteBuy(g.state, s, gd.id, 1);
  const ten = Econ.quoteBuy(g.state, s, gd.id, 10);
  assert.ok(ten > one * 10, 'unit price should climb as you buy');
  g.buy(gd.id, 10);
  assert.ok(Econ.quoteBuy(g.state, s, gd.id, 1) > one, 'price stays elevated after buying');
});

test('prices drift by day deterministically', () => {
  const { g } = tradeSetup();
  const s = g.here();
  const good = C.GOODS[0];
  const p1 = Econ.midPrice(g.state, s, good, 5); const p2 = Econ.midPrice(g.state, s, good, 40);
  assert.equal(p1, Econ.midPrice(g.state, s, good, 5));
  assert.notEqual(p1, p2);
});

function sustainedPerDay(seed, loops = 10) {
  freshStorage();
  const g = newGame({ seed });
  const st = g.state;
  const sts = st.galaxy.systems.filter((x) => x.station && x.station.services.includes('trade'));
  let worst = { perday: 0 };
  for (const a of sts) {
    const d = bfs(st.galaxy, a.id);
    for (const b of sts) {
      if (a === b || d[b.id] > 3) continue;
      st.markets = {}; st.day = 30; st.credits = 1e6; st.cargo = {};
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const legDays = Math.max(1, Math.round(dist / 190));
      const fuel = Math.max(1, Math.round((dist / 70) * 1.25)) * 7; // per-leg fuel at ~7 scrip/unit
      const start = st.credits;
      for (let i = 0; i < loops; i++) {
        for (const [x, y] of [[a, b], [b, a]]) {
          let best = null;
          for (const gd of C.GOODS) {
            const m = Econ.ensureMarket(st, x);
            const qty = Math.min(m.stock[gd.id], Math.floor(16 / (gd.bulk || 1)));
            if (qty < 1) continue;
            const c = Econ.quoteBuy(st, x, gd.id, qty); const sl = Econ.quoteSell(st, y, gd.id, qty);
            if (!best || sl - c > best.p) best = { gd, qty, p: sl - c };
          }
          if (best && best.p > 0) { Econ.buyGoods(st, x, best.gd.id, best.qty); st.day += legDays; Econ.sellGoods(st, y, best.gd.id, best.qty); } else st.day += legDays;
          st.credits -= fuel;
        }
      }
      const days = loops * 2 * legDays;
      const perday = (st.credits - start) / days;
      if (perday > worst.perday) worst = { perday, a: a.name, b: b.name };
    }
  }
  return worst;
}

test('no profitable infinite loop: a perfect 16-hold shuttle sustains <= 160 scrip/day net of fuel', () => {
  // Price impact (+~1.3 %/unit, decays 5 %/day) and slow stock recovery (7 %/day) saturate any lane that is hammered repeatedly,
  // so the long-run rate sits far below the fresh-market rate. 160/day is the design ceiling.
  for (const seed of [1, 2, 3, 8]) {
    const w = sustainedPerDay(seed);
    assert.ok(w.perday < 160, `seed ${seed}: ${w.a} <-> ${w.b} sustains ${w.perday.toFixed(0)} scrip/day`);
  }
});

test('trade is a real profession: a fresh full-hold round trip nets a few hundred scrip on a typical lane; most lanes have a profitable good', () => {
  freshStorage();
  const g = newGame({ seed: 8 });
  const st = g.state;
  const sts = st.galaxy.systems.filter((x) => x.station && x.station.services.includes('trade'));
  const nets = []; let withGood = 0; let pairs = 0;
  for (const a of sts) {
    const d = bfs(st.galaxy, a.id);
    for (const b of sts) {
      if (a === b || d[b.id] > 2) continue;
      const leg = (x, y) => {
        let best = 0; let n25 = 0;
        for (const gd of C.GOODS) {
          st.markets = {};
          const qty = Math.floor(16 / (gd.bulk || 1));
          const c = Econ.quoteBuy(st, x, gd.id, qty);
          if (st.markets[x.id].stock[gd.id] < qty) continue;
          const sl = Econ.quoteSell(st, y, gd.id, qty);
          if (sl / c > 1.25) n25++;
          best = Math.max(best, sl - c);
        }
        return { best, n25 };
      };
      const l1 = leg(a, b); const l2 = leg(b, a);
      const fuel = 2 * Math.max(1, Math.round((Math.hypot(a.x - b.x, a.y - b.y) / 70) * 1.25)) * 7;
      nets.push(l1.best + l2.best - fuel); pairs++;
      if (l1.n25 + l2.n25 >= 1) withGood++;
    }
  }
  nets.sort((x, y) => x - y);
  const median = nets[Math.floor(nets.length / 2)];
  assert.ok(median >= 150 && median <= 600, `median loop ${median}`);
  assert.ok(withGood / pairs >= 0.6, `only ${withGood}/${pairs} lanes have a +25 % good`);
});

test('same-station spread is about 12-16 % (buy vs sell of one unit)', () => {
  const { g } = tradeSetup(3);
  for (const gd of g.market().goods.filter((x) => x.buy && x.base >= 40)) {
    const spread = 1 - gd.sell / gd.buy;
    assert.ok(spread >= 0.1 && spread <= 0.2, `${gd.id} spread ${(spread * 100).toFixed(1)}%`);
  }
});

test('market().bestSell lists known better destinations with jumps and pct', () => {
  const { g } = tradeSetup(3);
  // visit another trade station so it counts as known
  const others = g.state.galaxy.systems.filter((x) => x.station && x.station.services.includes('trade') && x.id !== g.here().id).slice(0, 4);
  for (const o of others) o.status = 'visited';
  const m = g.market();
  assert.ok(Array.isArray(m.bestSell));
  for (const row of m.bestSell) {
    assert.ok(row.goodId && row.systemId && row.systemName && row.price > 0 && row.pct >= 5);
    assert.ok(Number.isFinite(row.jumps));
  }
  const perGood = {};
  for (const r of m.bestSell) perGood[r.goodId] = (perGood[r.goodId] || 0) + 1;
  assert.ok(Object.values(perGood).every((n) => n <= 3));
});

test('cargo capacity and stock are respected', () => {
  const { g } = tradeSetup();
  const gd = g.market().goods.find((x) => x.stock > 0 && x.buy);
  const r = g.buy(gd.id, 9999);
  assert.ok(r.ok);
  assert.ok(g.cargoUsed() <= g.shipStats().cargoMax);
  const r2 = g.buy('no_such_good', 1);
  assert.equal(r2.ok, false);
  assert.equal(g.sell(gd.id, 0).ok, false);
});

test('services: refuel/restock/repair priced, partial buys when poor', () => {
  const { g } = tradeSetup();
  g.state.ship.fuel = 5; g.state.ship.hull = 50; g.state.ship.supplies = 5;
  g.state.credits = 20;
  const r = g.refuel('max');
  assert.ok(r.ok && r.cost <= 20 && g.state.ship.fuel > 5);
  g.state.credits = 0;
  assert.equal(g.repair('max').ok, false);
  g.state.credits = 1000;
  assert.ok(g.repair('max').ok);
  assert.equal(g.state.ship.hull, g.state.ship.hullMax);
});
