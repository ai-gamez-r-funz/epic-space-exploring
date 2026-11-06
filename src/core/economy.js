// Economy: per-system markets with deterministic price drift, buy/sell spread, trade impact and stock.
// Prices are a pure function of (seed, system, good, day) plus a decaying "impact" from the player's own trades,
// so saves stay deterministic without consuming RNG state.
import { C, IDX, goodName } from './content.js';
import { hashFloat } from './rng.js';
import { derive, diffOf, hasSpecial, clamp } from './ship.js';

const RULES = () => ({ spread: 0.12, tradeImpact: 0.015, stockBase: 24, minPrice: 6, ...(C.PRICE_RULES || {}) });

/** Smooth value-noise in [-1,1] with a given period (days). */
function noise(seed, sysId, goodId, day, period, salt) {
  const k = Math.floor(day / period);
  const t = (day / period) - k;
  const a = hashFloat(seed, sysId, goodId, salt, k) * 2 - 1;
  const b = hashFloat(seed, sysId, goodId, salt, k + 1) * 2 - 1;
  const e = t * t * (3 - 2 * t);
  return a + (b - a) * e;
}

function biasFor(system, goodId) {
  const B = C.ECONOMY_BIAS || {};
  let m = 1;
  const st = system.station;
  if (st && B[st.kind] && B[st.kind][goodId]) m *= B[st.kind][goodId];
  const f = system.faction || 'none';
  if (B[f] && B[f][goodId]) m *= B[f][goodId];
  const reg = B['region:' + system.region];
  if (reg && reg[goodId]) m *= reg[goodId];
  // damp the compounded bias so cross-system spreads stay trade-worthy but not absurd (0.6 -> 0.74, 1.5 -> 1.27)
  return clamp(Math.pow(m, 0.6), 0.72, 1.3);
}

/** Whether (and how much) this system trades a good. */
// Every market has a personality: 6 goods it produces (cheap) and 6 it craves (dear). Pairs of neighbouring markets therefore
// almost always share two or three profitable goods in each direction - the engine of the trading loop.
const TILT_CACHE = new Map();
export const TILT_CHEAP = 0.78;
export const TILT_DEAR = 1.28;
function tiltOf(state, system, good) {
  const key = `${state.seed}|${system.id}|${C.GOODS.length}`;
  let t = TILT_CACHE.get(key);
  if (!t) {
    const ranked = C.GOODS.map((g) => [hashFloat(state.seed, system.id, g.id, 'tilt'), g.id]).sort((a, b) => a[0] - b[0]);
    t = {};
    const n = Math.min(7, Math.floor(ranked.length / 3.3));
    ranked.slice(0, n).forEach(([, id]) => { t[id] = TILT_CHEAP; });
    ranked.slice(-n).forEach(([, id]) => { t[id] = TILT_DEAR; });
    if (TILT_CACHE.size > 400) TILT_CACHE.clear();
    TILT_CACHE.set(key, t);
  }
  return t[good.id] || 1;
}

function profile(state, system, good) {
  const h = hashFloat(state.seed, system.id, good.id, 'prof');
  const prod = 0.85 + 0.35 * hashFloat(state.seed, system.id, good.id, 'prod'); // 0.85..1.2
  const stationKind = system.station && system.station.kind;
  let sold = h < 0.72;
  if (stationKind === 'outpost' && !['food', 'fuel', 'material', 'medical'].includes(good.category)) sold = h < 0.25;
  if (stationKind === 'archive' && ['curio', 'tech', 'luxury'].includes(good.category)) sold = true;
  if (hasQuillariLicence(state) && system.faction === 'quillari') sold = sold || h < 0.85;
  const bias = biasFor(system, good.id) * tiltOf(state, system, good);
  if (bias <= 0.85) sold = true; // locally produced goods are always on the shelf
  // rarer, pricier goods come in smaller lots: stock scales roughly with 1/sqrt(price)
  const lot = clamp(Math.sqrt(40 / Math.max(8, good.base)), 0.35, 2);
  const targetStock = Math.max(3, Math.round(RULES().stockBase * lot * (bias < 0.85 ? 1.5 : bias > 1.15 ? 0.6 : 1) * (0.7 + 0.6 * hashFloat(state.seed, system.id, good.id, 'stk'))
    * (stationKind === 'outpost' ? 0.6 : 1)));
  return { sold, prod, bias, targetStock };
}
const hasQuillariLicence = (state) => hasSpecial(state, 'trade_licence_quillari');

// ---------------------------------------------------------------- market news (seasonal festivals, gluts, shortages)
export const SEASON = 20; // days per market "season"
const FESTIVALS = {
  concord: ['Charter Day Fair', 'the Festival of Orderly Queues'], quillari: ['the Glass-Fruit Gala', 'Feather-and-Bargain Week'],
  vesperine: ['the Evening Resonance', 'the Festival of Held Notes'], archivists: ['Open Stacks Week', 'the Catalogue Jubilee'],
  drifters: ['the Long Table Supper', 'Story-Knot Week'], none: ['a Lantern-Lighting Fair', 'Harbour Day'],
};
/** Active/upcoming market news for a trade system. Pure function of (seed, system, day). */
export function newsFor(state, system, day = state.day) {
  if (!system || !system.station || !(system.station.services || []).includes('trade') || !C.GOODS.length) return [];
  const k = Math.floor((day - 1) / SEASON);
  const out = [];
  for (const kk of [k, k + 1]) {
    const h = hashFloat(state.seed, system.id, 'news', kk);
    const startDay = kk * SEASON + 1; const endDay = startDay + SEASON - 1;
    const pickGood = (cats) => { const pool = C.GOODS.filter((g) => !cats || cats.includes(g.category)); return pool.length ? pool[Math.floor(hashFloat(state.seed, system.id, 'ng', kk) * pool.length)] : null; };
    let item = null;
    if (h < 0.2) {
      const f = FESTIVALS[system.faction] || FESTIVALS.none;
      const name = f[Math.floor(hashFloat(state.seed, system.id, 'nf', kk) * f.length)];
      item = { kind: 'festival', title: name.charAt(0).toUpperCase() + name.slice(1), text: `${system.name} is celebrating ${name}. Luxuries and food fetch festival prices.`, goods: C.GOODS.filter((g) => ['luxury', 'food'].includes(g.category)).map((g) => g.id), mult: 1.3 };
    } else if (h < 0.34) {
      const g = pickGood(); if (g) item = { kind: 'glut', title: `${g.name} glut`, text: `Warehouses at ${system.name} are overflowing with ${g.name}. Bargains for anyone with cargo space.`, goods: [g.id], mult: 0.68 };
    } else if (h < 0.5) {
      const g = pickGood(['medical', 'food', 'material', 'tech']); if (g) item = { kind: 'shortage', title: `${g.name} shortage`, text: `${system.name} is running short of ${g.name}. Sellers are being thanked, loudly.`, goods: [g.id], mult: 1.42 };
    }
    if (item) out.push({ ...item, startDay, endDay, daysLeft: Math.max(0, endDay - day + 1), active: kk === k, upcoming: kk !== k });
  }
  return out;
}
function newsMult(state, system, goodId, day) {
  let m = 1;
  for (const n of newsFor(state, system, day)) if (n.active && n.goods.includes(goodId)) m *= n.mult;
  return m;
}

/** Mid-market price for a good on a given day, before impact/stock. */
export function midPrice(state, system, good, day = state.day) {
  const p = profile(state, system, good);
  const vol = clamp(good.volatility ?? 0.3, 0, 1);
  const drift = 1 + vol * (0.15 * noise(state.seed, system.id, good.id, day, 6, 'a') + 0.08 * noise(state.seed, system.id, good.id, day, 29, 'b'));
  // news can't push the combined bias outside the normal band: keeps cross-market spreads (and trade profit/day) bounded
  const eff = clamp(p.bias * newsMult(state, system, good.id, day), 0.58, 1.55);
  return good.base * p.prod * eff * drift;
}

export function ensureMarket(state, system) {
  if (!system || !system.station || !(system.station.services || []).includes('trade')) return null;
  state.markets = state.markets || {};
  let m = state.markets[system.id];
  if (!m) {
    m = state.markets[system.id] = { prices: {}, stock: {}, impact: {}, updatedDay: state.day };
    for (const g of C.GOODS) {
      const p = profile(state, system, g);
      m.stock[g.id] = p.sold ? p.targetStock : 0;
      m.impact[g.id] = 0;
    }
  }
  const elapsed = state.day - (m.updatedDay ?? state.day);
  if (elapsed > 0) {
    for (const g of C.GOODS) {
      const p = profile(state, system, g);
      const tgt = p.sold ? p.targetStock : 0;
      const cur = m.stock[g.id] ?? tgt;
      // regenerate ~7%/day of the gap (busy lanes saturate) (also drains over-stocked piles)
      m.stock[g.id] = Math.round(tgt + (cur - tgt) * Math.pow(0.93, elapsed));
      m.impact[g.id] = (m.impact[g.id] || 0) * Math.pow(0.95, elapsed);
      if (Math.abs(m.impact[g.id]) < 0.002) m.impact[g.id] = 0;
    }
    m.updatedDay = state.day;
  }
  for (const g of C.GOODS) m.prices[g.id] = Math.max(RULES().minPrice * 0.5, Math.round(midPrice(state, system, g)));
  return m;
}

/** Multipliers applied to the buy / sell side, including rep, upgrades and spread. Guarantees sell <= 0.9 * buy. */
export function sideMultipliers(state, system, good) {
  const R = RULES();
  const d = derive(state);
  const st = system.station;
  const rep = (state.rep && st && state.rep[st.faction]) || 0;
  const repDisc = rep >= 60 ? 0.06 : rep >= 25 ? 0.03 : 0;
  const diff = diffOf(state);
  let disc = clamp(d.buyDiscount + repDisc, 0, 0.18);
  let bonus = clamp(d.priceSell + (rep >= 60 ? 0.04 : rep >= 25 ? 0.02 : 0), 0, 0.2);
  if (hasQuillariLicence(state) && system.faction === 'quillari') bonus += 0.10;
  // likes / dislikes of the controlling faction
  const fac = C.FACTIONS[system.faction];
  let taste = 1;
  if (fac) { if ((fac.likes || []).includes(good.id)) taste = 1.06; else if ((fac.dislikes || []).includes(good.id)) taste = 0.94; }
  // same-station spread ~12-14 %; difficulty pricing applies to services, not to trade goods
  const buy = 1.065 * (1 - disc);
  let sell = 0.935 * (1 + bonus) * taste;
  sell = Math.min(sell, buy * 0.88); // anti-exploit: an immediate round trip must lose >= ~10 % even after impact
  return { buy, sell };
}

function unitImpact(good) { return 1.3 * RULES().tradeImpact * (0.6 + clamp(good.volatility ?? 0.3, 0, 1)); }

/** Total cost of buying `qty` units now, walking the price up per unit. */
export function quoteBuy(state, system, goodId, qty) {
  const good = IDX.good[goodId];
  const m = ensureMarket(state, system);
  if (!good || !m) return null;
  const { buy } = sideMultipliers(state, system, good);
  const mid = m.prices[goodId];
  const imp = unitImpact(good);
  let total = 0;
  for (let k = 0; k < qty; k++) total += mid * (1 + (m.impact[goodId] || 0) + imp * k) * buy;
  return Math.ceil(total);
}
export function quoteSell(state, system, goodId, qty) {
  const good = IDX.good[goodId];
  const m = ensureMarket(state, system);
  if (!good || !m) return null;
  const { sell } = sideMultipliers(state, system, good);
  const mid = m.prices[goodId];
  const imp = unitImpact(good);
  let total = 0;
  for (let k = 0; k < qty; k++) total += mid * Math.max(0.35, 1 + (m.impact[goodId] || 0) - imp * k) * sell;
  return Math.floor(total);
}

/** UI market listing. */
export function listing(state, system) {
  const m = ensureMarket(state, system);
  if (!m) return null;
  const goods = [];
  for (const g of C.GOODS) {
    const p = profile(state, system, g);
    const stock = m.stock[g.id] || 0;
    const held = state.cargo[g.id] || 0;
    if (!p.sold && !held) continue; // nobody here trades it and you carry none
    const b1 = quoteBuy(state, system, g.id, 1);
    const s1 = quoteSell(state, system, g.id, 1);
    const prev = midPrice(state, system, g, Math.max(1, state.day - 5));
    const now = midPrice(state, system, g);
    const trend = now > prev * 1.04 ? 1 : now < prev * 0.96 ? -1 : 0;
    goods.push({ id: g.id, name: g.name, category: g.category, bulk: g.bulk || 1, buy: stock > 0 ? b1 : null, sell: s1, stock, trend, held, base: g.base });
  }
  return { goods, station: system.station };
}

export function cargoUsed(state) {
  let n = 0;
  for (const [id, q] of Object.entries(state.cargo || {})) n += q * ((IDX.good[id] && IDX.good[id].bulk) || 1);
  return n;
}

export function buyGoods(state, system, goodId, qty) {
  qty = Math.floor(qty);
  const good = IDX.good[goodId];
  if (!good) return { ok: false, reason: 'Unknown good' };
  if (!(qty > 0)) return { ok: false, reason: 'Nothing to buy' };
  const m = ensureMarket(state, system);
  if (!m) return { ok: false, reason: 'No market here' };
  if ((m.stock[goodId] || 0) <= 0) return { ok: false, reason: 'Out of stock' };
  qty = Math.min(qty, m.stock[goodId]);
  const space = derive(state).cargoMax - cargoUsed(state);
  const fit = Math.floor(space / (good.bulk || 1));
  if (fit <= 0) return { ok: false, reason: 'Cargo hold is full' };
  qty = Math.min(qty, fit);
  const cost = quoteBuy(state, system, goodId, qty);
  if (state.credits < cost) {
    // buy as many as affordable
    let q = qty;
    while (q > 0 && quoteBuy(state, system, goodId, q) > state.credits) q--;
    if (q <= 0) return { ok: false, reason: 'Not enough scrip' };
    return buyGoods(state, system, goodId, q);
  }
  state.credits -= cost;
  state.cargo[goodId] = (state.cargo[goodId] || 0) + qty;
  m.stock[goodId] -= qty;
  m.impact[goodId] = clamp((m.impact[goodId] || 0) + unitImpact(good) * qty, -0.6, 0.6);
  return { ok: true, qty, cost, goodId };
}

export function sellGoods(state, system, goodId, qty) {
  qty = Math.floor(qty);
  const good = IDX.good[goodId];
  if (!good) return { ok: false, reason: 'Unknown good' };
  const held = state.cargo[goodId] || 0;
  if (!(qty > 0) || held <= 0) return { ok: false, reason: 'Nothing to sell' };
  qty = Math.min(qty, held);
  const m = ensureMarket(state, system);
  if (!m) return { ok: false, reason: 'No market here' };
  const gain = quoteSell(state, system, goodId, qty);
  state.credits += gain;
  state.cargo[goodId] = held - qty;
  if (state.cargo[goodId] <= 0) delete state.cargo[goodId];
  m.stock[goodId] = (m.stock[goodId] || 0) + qty;
  m.impact[goodId] = clamp((m.impact[goodId] || 0) - unitImpact(good) * qty, -0.6, 0.6);
  return { ok: true, qty, gain, goodId };
}

export { goodName };
