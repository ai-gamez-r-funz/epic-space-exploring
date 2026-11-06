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
