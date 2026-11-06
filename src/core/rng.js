// Seeded RNG (mulberry32) + helpers. The generator state lives in a plain object
// ({ s: uint32 }) so that a game can keep it inside `state` and saves stay deterministic.

/** FNV-1a-ish string -> uint32 hash. Accepts numbers too (stringified). */
export function hashString(str) {
  const s = String(str);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  // final avalanche
  h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 3266489917) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/** Stateless: uint32 hash -> float in [0,1). Handy for deterministic per-(seed,key) noise. */
export function hashFloat(...parts) {
  return hashString(parts.join('|')) / 4294967296;
}

/** Classic closure-based mulberry32 (standalone use). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class RNG {
  /**
   * @param {number|object} seedOrStore number seed, or an object holding the state under `key`
   * @param {string} key property name used when a store object is supplied
   */
  constructor(seedOrStore = 1, key = 'rng') {
    if (typeof seedOrStore === 'object' && seedOrStore) {
      this.o = seedOrStore;
      this.k = key;
      if (!Number.isFinite(this.o[this.k])) this.o[this.k] = 1;
    } else {
      this.o = { s: (Number(seedOrStore) || 0) >>> 0 };
      this.k = 's';
    }
  }
  static from(seed) { return new RNG(seed); }
  /** RNG whose state is persisted in `state.rng` */
  static bound(state) { return new RNG(state, 'rng'); }
  get state() { return this.o[this.k]; }
  set state(v) { this.o[this.k] = v >>> 0; }

  /** float in [0,1) */
  next() {
    const a = (this.o[this.k] + 0x6d2b79f5) >>> 0;
    this.o[this.k] = a;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  float(a = 0, b = 1) { return a + (b - a) * this.next(); }
  range(a, b) { return this.float(a, b); }
  /** integer in [a,b] inclusive */
  int(a, b) {
    if (b === undefined) { b = a; a = 0; }
    return a + Math.floor(this.next() * (b - a + 1));
  }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr && arr.length ? arr[Math.floor(this.next() * arr.length)] : undefined; }
  /**
   * weighted pick. items: array; weight: fn(item)->number or the array of numbers, or [item,weight] pairs when omitted.
   */
  weighted(items, weight) {
    if (!items || !items.length) return undefined;
    const ws = items.map((it, i) => {
      const w = typeof weight === 'function' ? weight(it, i) : Array.isArray(weight) ? weight[i] : Array.isArray(it) ? it[1] : 1;
      return w > 0 && Number.isFinite(w) ? w : 0;
    });
    const total = ws.reduce((a, b) => a + b, 0);
    if (total <= 0) return undefined;
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= ws[i];
      if (r < 0) return items[i];
    }
    return items[items.length - 1];
  }
  /** returns a new shuffled copy (Fisher-Yates) */
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  /** approx gaussian (sum of 3 uniforms), mean 0, sd ~0.5 */
  gauss() { return (this.next() + this.next() + this.next() - 1.5); }
}

export const pick = (rng, arr) => rng.pick(arr);
export const weighted = (rng, items, w) => rng.weighted(items, w);
export const range = (rng, a, b) => rng.range(a, b);
export const shuffle = (rng, arr) => rng.shuffle(arr);
