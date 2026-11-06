// Derives the persistent "Next objective" line. Uses g.nextObjective() when the ENGINE provides it, else active missions / survey.
export function nextObjective(g) {
  try {
    if (typeof g.nextObjective === 'function') {
      const o = g.nextObjective();
      if (o) return typeof o === 'string' ? { text: o } : { text: o.text || o.title || String(o), systemId: o.systemId || o.system || null, kind: o.kind };
    }
  } catch (e) { /* fall through to the derived version */ }
  try {
    const ms = [...(g.activeMissions?.() || [])].sort((a, b) => (b.arc ? 1 : 0) - (a.arc ? 1 : 0));
    for (const m of ms) {
      const ob = (m.objectives || []).find((o) => !o.done && !o.optional);
      if (ob) return { text: `${m.title}: ${ob.text}`, kind: 'mission', mission: m };
    }
    const sp = g.surveyProgress?.();
    if (sp) {
      const here = g.here();
      const unscanned = here.planets.filter((p) => !p.scanned).length;
      if (unscanned) return { text: `Scan the ${unscanned} unscanned planet${unscanned > 1 ? 's' : ''} here to chart ${here.name}`, kind: 'survey' };
      return { text: `Chart the Lantern Reach: ${sp.charted}/${sp.total} systems (${sp.pct}%). Pick a new system on the Chart (C)`, kind: 'survey' };
    }
  } catch (e) { /* none */ }
  return { text: 'Explore, and bring the ship home with the paint intact.' };
}
/** Optional market-news ticker line (when ENGINE exposes g.marketNews()). */
export function marketNewsLine(g) {
  try {
    if (typeof g.marketNews !== 'function') return '';
    const n = g.marketNews(g.state.pos);
    const first = Array.isArray(n) ? n[0] : n;
    return !first ? '' : typeof first === 'string' ? first : first.text || first.headline || '';
  } catch (e) { return ''; }
}

/** Number of lane hops (over systems the player knows) from the ship to `toId`; null when unreachable/unknown. */
export function jumpsTo(g, toId) {
  try {
    const gal = g.state.galaxy; const known = new Set(gal.systems.filter((s) => s.status !== 'unknown').map((s) => s.id));
    if (!known.has(toId)) return null; const dist = new Map([[g.state.pos, 0]]); const q = [g.state.pos];
    while (q.length) { const a = q.shift(); if (a === toId) return dist.get(a); for (const [x, y] of gal.lanes) { const b = x === a ? y : y === a ? x : null; if (b && known.has(b) && !dist.has(b)) { dist.set(b, dist.get(a) + 1); q.push(b); } } }
  } catch (e) { /* */ }
  return null;
}
/** One-line fuel/range note: "Fuel 30/32 — each hop costs ~4–5". */
export function rangeNote(g) {
  try {
    const sh = g.state.ship; const ns = g.neighbors(g.state.pos); const costs = ns.map((n) => n.fuelCost).filter((c) => c > 0);
    const cost = costs.length ? (Math.min(...costs) === Math.max(...costs) ? `${costs[0]}` : `${Math.min(...costs)}–${Math.max(...costs)}`) : '?';
    const hops = costs.length ? Math.floor(sh.fuel / Math.max(...costs)) : 0;
    return `Fuel ${Math.floor(sh.fuel)}/${sh.fuelMax} — each hop costs ~${cost} (about ${hops} hop${hops === 1 ? '' : 's'} of range)`;
  } catch (e) { return ''; }
}
