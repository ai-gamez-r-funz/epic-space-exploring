// Survey progress & scoring.
export function progress(state) {
  const systems = state.galaxy.systems;
  const total = systems.length;
  const charted = systems.filter((s) => s.status === 'charted').length;
  let planetsScanned = 0;
  let planetsTotal = 0;
  for (const s of systems) for (const p of s.planets) { planetsTotal++; if (p.scanned) planetsScanned++; }
  const pct = total ? (charted >= total ? 100 : Math.floor((charted / total) * 100)) : 0;
  const score = charted * 100 + planetsScanned * 25 + (state.codex ? state.codex.length : 0) * 10;
  return { charted, total, pct, planetsScanned, planetsTotal, score };
}

/** A system is chartable when visited and every planet is scanned. */
export function isChartable(sys) {
  return (sys.status === 'visited') && sys.planets.every((p) => p.scanned);
}
