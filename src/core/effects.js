// Effect application (contract §4 fx vocabulary). `g` is the Game. Returns { summary:[...], tone }.
// Resource changes clamp to [0,max]; negative hull/morale respects difficulty floors; specials/traits tweak results.
import { C, IDX, goodName, itemName, factionName, prettify } from './content.js';
import { template } from './text.js';
import { DIFF, diffOf, hasSpecial, clamp, recompute, installUpgrade } from './ship.js';
import { bfs, adjacency } from './galaxy.js';

export const FX_KEYS = new Set([
  'fuel', 'supplies', 'hull', 'morale', 'credits', 'days', 'rep', 'cargo', 'item', 'flag', 'clearFlag', 'counter', 'xp', 'mood', 'recruit',
  'mission', 'missionProgress', 'codex', 'reveal', 'chart', 'upgrade', 'teleport', 'shop', 'toast', 'tone', 'log', 'sfx', 'ending', 'startEvent',
  'distress', // spawn a timed distress signal: {distress: days}
  'tow', // internal: emergency tow (built-in events only)
]);

const sgn = (n) => (n > 0 ? '+' : '') + n;

export function makeCrew(t, suffix = '') {
  return {
    id: t.id + suffix, name: t.name, role: t.role, species: t.species, skills: { ...t.skills }, trait: t.trait,
    mood: 70, level: 1, xp: 0, bio: t.bio, portrait: { species: t.species, seed: t.portraitSeed ?? 1 },
  };
}

function addCodex(g, id, summary) {
  const st = g.state;
  if (!id || st.codex.includes(id)) return false;
  st.codex.push(id);
  const e = IDX.codex[id];
  g.emit('discovery', { kind: 'codex', id, text: e ? `Codex: ${e.title}` : 'New codex entry' });
  g.emit('sfx', { name: 'discovery' });
  if (summary) summary.push(`Codex: ${e ? e.title : prettify(id)}`);
  return true;
}
export { addCodex };

function levelCheck(g, c) {
  while (c.xp >= 5 * c.level && c.level < 6) {
    c.xp -= 5 * c.level;
    c.level += 1;
    const sk = c.role && c.skills[c.role] !== undefined ? c.role : null;
    if (sk && c.skills[sk] < 5) c.skills[sk] += 1;
    g.emit('toast', { text: `${c.name} reached level ${c.level}!`, tone: 'good' });
    g.emit('sfx', { name: 'powerup' });
    g.log('crew', `${c.name} reached level ${c.level}.`);
  }
}

export function addXp(g, skill, n) {
  const st = g.state;
  let best = null;
  for (const c of st.crew) { const v = c.skills[skill] || 0; if (!best || v > best.v) best = { v, c }; }
  if (!best) return;
  best.c.xp += n;
  levelCheck(g, best.c);
}

/** Change mood of a crew member (respecting Unflappable on bad events). */
function moodDelta(c, n) {
  let v = c.mood + n;
  if (n < 0 && c.trait === 'unflappable') v = Math.max(v, Math.min(c.mood, 30));
  c.mood = clamp(Math.round(v), 0, 100);
}

function repGain(g, f, n) {
  if (n > 0) {
    if (hasSpecial(g.state, 'diplomatic_pouch')) n = Math.max(1, Math.ceil(n * 1.25));
    for (const c of g.state.crew) {
      if (c.trait === 'former_clerk' && f === 'concord') { n += 1; break; }
      if (c.trait === 'serene' && f === 'vesperine') { n += 1; break; }
    }
  }
  return n;
}

export function applyEffects(g, fx, ctx = {}) {
  const summary = [];
  let tone = 'info';
  const st = g.state;
  const diff = diffOf(st);
  const list = Array.isArray(fx) ? fx : fx ? [fx] : [];
  let good = 0; let bad = 0;
  const T = (s) => template(st, s, ctx);

  for (const e of list) {
    if (!e || typeof e !== 'object') continue;
    for (const [k, v] of Object.entries(e)) {
      try {
        switch (k) {
          case 'fuel': case 'supplies': {
            const max = st.ship[k + 'Max'];
            const before = st.ship[k];
            st.ship[k] = clamp(before + v, 0, max);
            const d = st.ship[k] - before;
            if (d) { summary.push(`${sgn(d)} ${k}`); d > 0 ? good++ : bad++; }
            break;
          }
          case 'hull': {
            let d = v;
            if (d < 0 && !ctx.noScale) d = -Math.max(1, Math.round(-d * diff.damage));
            const before = st.ship.hull;
            const floor = d < 0 && diff.floors ? 1 : 0;
            st.ship.hull = clamp(before + d, Math.min(before, floor), st.ship.hullMax);
            const dd = st.ship.hull - before;
            if (dd) { summary.push(`${sgn(dd)} hull`); dd > 0 ? good++ : bad++; }
            break;
          }
          case 'morale': {
            let d = v;
            const before = st.ship.morale;
            const floor = d < 0 && diff.floors ? 5 : 0;
            st.ship.morale = clamp(before + d, Math.min(before, floor), 100);
            const dd = Math.round(st.ship.morale - before);
            if (dd) { summary.push(`${sgn(dd)} morale`); dd > 0 ? good++ : bad++; }
            break;
          }
          case 'credits': {
            const before = st.credits;
            st.credits = Math.max(0, Math.round(before + v));
            const d = st.credits - before;
            if (d) { summary.push(`${sgn(d)} scrip`); d > 0 ? good++ : bad++; }
            if (d > 0) st.stats.creditsEarned = (st.stats.creditsEarned || 0) + d;
            break;
          }
          case 'days': if (v > 0) { g.advanceDays(Math.round(v), { reason: 'event' }); summary.push(`${v} day${v === 1 ? '' : 's'} pass`); } break;
          case 'rep': {
            for (const [f, n0] of Object.entries(v || {})) {
              if (!(f in st.rep)) continue;
              const n = repGain(g, f, n0);
              const before = st.rep[f];
              st.rep[f] = clamp(before + n, -100, 100);
              const d = st.rep[f] - before;
              if (d) { summary.push(`${factionName(f)} ${sgn(d)}`); d > 0 ? good++ : bad++; }
            }
            break;
          }
          case 'cargo': {
            for (const [id, n0] of Object.entries(v || {})) {
              let n = n0;
              if (n < 0 && hasSpecial(st, 'cargo_net') && g.rng.chance(0.5)) { summary.push('Cargo net saved the load'); continue; }
              const bulk = (IDX.good[id] && IDX.good[id].bulk) || 1;
              if (n > 0) {
                const space = Math.floor((st.ship.cargoMax - g.cargoUsed()) / bulk);
                n = Math.max(0, Math.min(n, space));
              } else n = -Math.min(-n, st.cargo[id] || 0);
              if (!n) continue;
              st.cargo[id] = (st.cargo[id] || 0) + n;
              if (st.cargo[id] <= 0) delete st.cargo[id];
              summary.push(`${sgn(n)} ${goodName(id)}`); n > 0 ? good++ : bad++;
            }
            break;
          }
          case 'item': {
            for (const [id, n] of Object.entries(typeof v === 'string' ? { [v]: 1 } : v || {})) {
              const before = st.items[id] || 0;
              const after = Math.max(0, before + n);
              if (after) st.items[id] = after; else delete st.items[id];
              if (after !== before) { summary.push(`${sgn(after - before)} ${itemName(id)}`); after > before ? good++ : bad++; }
            }
            break;
          }
          case 'flag': {
            if (typeof v === 'string') { st.flags[v] = true; g._flagSet(v); } else for (const [n, val] of Object.entries(v || {})) { st.flags[n] = val; g._flagSet(n); }
            break;
          }
          case 'clearFlag': for (const n of Array.isArray(v) ? v : [v]) delete st.flags[n]; break;
          case 'counter': for (const [n, d] of Object.entries(v || {})) st.counters[n] = (st.counters[n] || 0) + d; break;
          case 'xp': for (const [s, n] of Object.entries(v || {})) addXp(g, s, n); break;
          case 'mood': {
            const entries = typeof v === 'number' ? [['all', v]] : Object.entries(v || {});
            for (const [who, n] of entries) {
              let targets;
              if (who === 'all') targets = st.crew;
              else if (who === 'random') targets = st.crew.length ? [st.crew[g.rng.int(0, st.crew.length - 1)]] : [];
              else targets = st.crew.filter((c) => c.id === who);
              for (const c of targets) moodDelta(c, n);
            }
            break;
          }
          case 'recruit': {
            const t = IDX.crewTpl[v];
            if (t && !st.crew.some((c) => c.id === t.id) && st.crew.length < 8) {
              st.crew.push(makeCrew(t));
              summary.push(`${t.name} joins the crew`); good++;
              g.log('crew', `${t.name} joined the crew.`);
              g.emit('sfx', { name: 'confirm' });
              recompute(st);
            }
            break;
          }
          case 'mission': g.missions.start(v, { free: true }); break;
          case 'missionProgress': g.missions.progress(v && v.id, v && v.obj); break;
          case 'codex': for (const id of Array.isArray(v) ? v : [v]) addCodex(g, id, summary); break;
          case 'reveal': g.reveal(v); break;
          case 'chart': if (v) g.forceChart(st.pos); break;
          case 'upgrade': {
            const up = IDX.upgrade[v];
            if (up && !st.upgrades.includes(v)) {
              const r = installUpgrade(st, v);
              if (r.ok) { summary.push(`Installed ${up.name}`); good++; g.log('ship', `Installed ${up.name}.`); g.emit('sfx', { name: 'powerup' }); }
            }
            break;
          }
          case 'teleport': g.teleport(v); break;
          case 'shop': g._shopAfter = true; break;
          case 'toast': g.emit('toast', { text: T(v), tone: e.tone || 'info' }); break;
          case 'tone': break;
          case 'log': g.log('event', T(v)); break;
          case 'sfx': g.emit('sfx', { name: v }); break;
          case 'ending': g._pendingEnding = v; break;
          case 'startEvent': g._chain = v; break;
          case 'distress': g.spawnDistress(typeof v === 'number' ? v : undefined); break;
          case 'tow': g.tow(v === 'cheap'); break;
          default: break; // unknown keys are reported by content validation, ignored at runtime
        }
      } catch (err) {
        // never let one bad effect take the game down
        try { g.log('ship', `(effect ${k} failed)`); } catch { /* ignore */ }
      }
    }
  }
  tone = good > bad ? 'good' : bad > good ? 'bad' : 'info';
  recompute(st);
  return { summary, tone };
}
