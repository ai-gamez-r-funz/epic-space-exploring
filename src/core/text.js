// Template substitution for event / toast / mission text.
// Tokens: {captain} {ship} {system} {planet} {faction} {crew:<skill>} {crew:random}
import { C, factionName } from './content.js';
import { hashString } from './rng.js';

function bestCrew(state, skill) {
  let best = null;
  for (const c of state.crew || []) {
    const v = (c.skills && c.skills[skill]) || 0;
    if (!best || v > best.v) best = { v, c };
  }
  return best ? best.c : null;
}

/** ctx may carry: systemId, planetId, crewRandom (crew id), crewId */
export function template(state, str, ctx = {}) {
  if (typeof str !== 'string' || !str.includes('{')) return str;
  const sys = (state.galaxy && state.galaxy.systems.find((s) => s.id === (ctx.systemId ?? state.pos))) || null;
  const planetId = ctx.planetId ?? state.orbit;
  const planet = sys && planetId ? sys.planets.find((p) => p.id === planetId) : null;
  return str.replace(/\{(captain|ship|system|planet|faction|crew(?::[a-z]+)?)\}/g, (m, key) => {
    switch (key) {
      case 'captain': return state.captain && state.captain.name || 'Captain';
      case 'ship': return state.ship && state.ship.name || 'Halcyon';
      case 'system': return sys ? sys.name : 'the system';
      case 'planet': return planet ? planet.name : (sys && sys.planets[0] ? sys.planets[0].name : 'the planet');
      case 'faction': {
        const f = ctx.factionId || (sys && sys.faction !== 'none' ? sys.faction : null) || (sys && sys.station && sys.station.faction);
        return f && f !== 'none' ? (C.FACTIONS[f] ? C.FACTIONS[f].name : f) : factionName('none');
      }
      default: {
        const skill = key.split(':')[1] || 'random';
        if (skill === 'random') {
          const id = ctx.crewRandom || ctx.crewId;
          const c = (id && (state.crew || []).find((x) => x.id === id)) || (state.crew || [])[hashString(state.day + ':' + (ctx.eventId || '')) % Math.max(1, (state.crew || []).length)];
          return c ? c.name : 'the crew';
        }
        const c = bestCrew(state, skill);
        return c ? c.name : 'the crew';
      }
    }
  });
}
