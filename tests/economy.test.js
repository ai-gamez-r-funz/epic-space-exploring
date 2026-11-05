import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, freshStorage, stationSystem, teleportForTest, dockClean } from './helpers.js';
import { C } from '../src/core/content.js';
import * as Econ from '../src/core/economy.js';

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
      assert.ok(before - g.state.credits >= r.cost * 0.10, 'round trip should cost at least ~10%');
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

test('no profitable infinite loop: best two-station run is bounded per day', () => {
  // Greedy search over all station pairs with a full hold at start-game capacity; requires travel days between them.
  freshStorage();
  const g = newGame({ seed: 8 });
  const sts = g.state.galaxy.systems.filter((x) => x.station && x.station.services.includes('trade'));
  let best = 0;
  for (const a of sts) for (const b of sts) {
    if (a === b) continue;
    const days = 2 * Math.max(1, Math.round(Math.hypot(a.x - b.x, a.y - b.y) / 190));
    for (const day of [1, 20, 60]) {
      g.state.day = day;
      for (const gd of C.GOODS) {
        const qty = Math.floor(g.state.ship.cargoMax / (gd.bulk || 1));
        // price at a (buy) and b (sell) using fresh markets (no impact carry-over)
        g.state.markets = {};
        const cost = Econ.quoteBuy(g.state, a, gd.id, qty);
        const mA = g.state.markets[a.id];
        if (!mA || mA.stock[gd.id] < qty) continue;
        const gain = Econ.quoteSell(g.state, b, gd.id, qty);
        best = Math.max(best, (gain - cost) / days);
      }
    }
  }
  assert.ok(best < 160, `best trade run ${best.toFixed(1)} scrip/day is too lucrative`);
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
