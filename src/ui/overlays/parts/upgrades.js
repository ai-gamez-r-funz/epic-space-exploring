// Shared upgrade helpers for the Shipyard (bonus text, stat diffs, slot metadata).
import { C } from '../../kit/theme.js';
import { S } from '../../services.js';
import { derive, upgradeStatus } from '../../../core/ship.js';
import { SKILLS, cap } from './common.js';

export const SLOT_META = {
  engine: { icon: 'engineering', name: 'Engine', col: 0xf0a04a },
  sensors: { icon: 'scan', name: 'Sensors', col: 0x6fc7e8 },
  hull: { icon: 'hull', name: 'Hull', col: 0x7fb4e8 },
  cargo: { icon: 'cargo', name: 'Cargo', col: 0x8fb98b },
  comms: { icon: 'hail', name: 'Comms', col: 0xb58be0 },
  lab: { icon: 'science', name: 'Lab', col: 0x3fc1b0 },
  lounge: { icon: 'morale', name: 'Lounge', col: 0xf08a9a },
  special: { icon: 'star', name: 'Special', col: 0xffe08a },
};
export const SLOT_ORDER = ['engine', 'sensors', 'hull', 'cargo', 'comms', 'lab', 'lounge', 'special'];
export const BUILD_META = {
  explorer: { name: 'Explorer', col: 0x6fc7e8 }, trader: { name: 'Trader', col: C.mustard }, diplomat: { name: 'Diplomat', col: C.teal },
  caretaker: { name: 'Caretaker', col: 0xf08a9a }, daredevil: { name: 'Daredevil', col: 0xf06c5a }, general: { name: 'General', col: C.brassLight },
};

export const allUpgrades = () => S.content.UPGRADES || [];
export const upgradeById = (id) => allUpgrades().find((u) => u.id === id) || null;

/** Human-readable bonus entries: [{ text, good }]. */
export function bonusEntries(b = {}, special) {
  const out = []; const pct = (v) => Math.round(v * 100);
  if (b.fuelMax) out.push({ text: `${b.fuelMax > 0 ? '+' : ''}${b.fuelMax} fuel tank`, good: b.fuelMax > 0 });
  if (b.suppliesMax) out.push({ text: `${b.suppliesMax > 0 ? '+' : ''}${b.suppliesMax} supplies hold`, good: b.suppliesMax > 0 });
  if (b.hullMax) out.push({ text: `${b.hullMax > 0 ? '+' : ''}${b.hullMax} hull`, good: b.hullMax > 0 });
  if (b.cargoMax) out.push({ text: `${b.cargoMax > 0 ? '+' : ''}${b.cargoMax} cargo`, good: b.cargoMax > 0 });
  if (b.scanRange) out.push({ text: `${b.scanRange > 0 ? '+' : ''}${pct(b.scanRange)}% scan range`, good: b.scanRange > 0 });
  if (b.jumpRange) out.push({ text: `${b.jumpRange > 0 ? '+' : ''}${pct(b.jumpRange)}% jump range`, good: b.jumpRange > 0 });
  if (typeof b.efficiency === 'number' && b.efficiency !== 1) out.push({ text: b.efficiency < 1 ? `${pct(1 - b.efficiency)}% less fuel per jump` : `${pct(b.efficiency - 1)}% more fuel per jump`, good: b.efficiency < 1 });
  for (const [k, v] of Object.entries(b.skills || {})) out.push({ text: `${v > 0 ? '+' : ''}${v} ${cap(k)}`, good: v > 0, skill: k });
  if (b.moraleRegen) out.push({ text: `+${b.moraleRegen} morale / day`, good: true });
  if (b.repairPerDay) out.push({ text: `+${b.repairPerDay} hull repaired / day`, good: true });
  if (b.priceSell) out.push({ text: `+${pct(b.priceSell)}% sale prices`, good: true });
  if (b.buyDiscount) out.push({ text: `${pct(b.buyDiscount)}% off purchases`, good: true });
  if (special && S.content.SPECIALS?.[special]) out.push({ text: S.content.SPECIALS[special], good: true, special: true });
  return out;
}

/** Ship stat rows with before/after values. `swap` = upgrade id to install (replacing slot occupant), or null. */
export function statRows(game, swap) {
  const st = game.state;
  const before = derive(st);
  let after = before; let skAfter = (sk) => game.skillTotal(sk);
  if (swap) {
    const up = upgradeById(swap);
    const ups = st.upgrades.filter((id) => upgradeById(id)?.slot !== up.slot);
    if (!ups.includes(swap)) ups.push(swap);
    after = derive({ ...st, upgrades: ups });
    skAfter = (sk) => game.skillTotal(sk) + (after.bonuses[sk] || 0) - (before.bonuses[sk] || 0);
  }
  const rows = [
    { k: 'fuel', icon: 'fuel', name: 'Fuel tank', a: before.fuelMax, b: after.fuelMax, fmt: (v) => String(Math.round(v)) },
    { k: 'supplies', icon: 'supplies', name: 'Supplies hold', a: before.suppliesMax, b: after.suppliesMax, fmt: (v) => String(Math.round(v)) },
    { k: 'hull', icon: 'hull', name: 'Hull strength', a: before.hullMax, b: after.hullMax, fmt: (v) => String(Math.round(v)) },
    { k: 'cargo', icon: 'cargo', name: 'Cargo hold', a: before.cargoMax, b: after.cargoMax, fmt: (v) => String(Math.round(v)) },
    { k: 'jump', icon: 'jump', name: 'Jump range', a: before.jumpRange, b: after.jumpRange, fmt: (v) => '×' + v.toFixed(2) },
    { k: 'scan', icon: 'scan', name: 'Scan range', a: before.scanRange, b: after.scanRange, fmt: (v) => '×' + v.toFixed(2) },
    { k: 'eff', icon: 'fuel', name: 'Fuel per jump', a: before.efficiency, b: after.efficiency, fmt: (v) => Math.round(v * 100) + '%', lowerBetter: true },
  ];
  for (const sk of SKILLS) rows.push({ k: sk, icon: sk, name: cap(sk), a: game.skillTotal(sk), b: skAfter(sk), fmt: (v) => String(Math.round(v * 10) / 10) });
  return rows;
}

export function statusFor(game, up, hasYard) {
  const st = game.state;
  if (hasYard) { const r = game.shipyard().find((x) => x.id === up.id); if (r) return r; }
  const s = upgradeStatus(st, up);
  return { id: up.id, available: false, reason: hasYard ? s.reason : 'Dock at a shipyard to buy upgrades.', owned: !!s.owned, price: s.price ?? up.cost, tradeIn: s.tradeIn || 0, replaces: s.replaces || null, reward: !!up.reward, cost: up.cost };
}
