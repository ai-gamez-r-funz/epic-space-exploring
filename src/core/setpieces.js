// Engine-authored (inline) events: rough-lane hazards, scan finds, landing fallbacks, repeatable hails,
// the rival trader Captain Tamsin Vell and timed distress beacons. Each builder returns a normal event object
// (same shape as content/events) marked `internal`; the cursor stores it inline so saves stay self-contained.
import { C, IDX, goodName, factionName, prettify } from './content.js';
import { RNG, hashString } from './rng.js';

const ev = (id, ctx, title, art, nodes, extra = {}) => ({ id, ctx, title, art, weight: 1, tags: extra.tags || [], internal: true, inline: true, start: 'a', nodes });
const one = (label, text, fx = [], tag = 'wait') => ({ label, tag, do: { text, fx } });
const trunc = (s, n = 48) => { const w = String(s || '').split(/\s+/); return w.length > n ? w.slice(0, n).join(' ') + '…' : w.join(' '); };

// ------------------------------------------------------------------ rough lane
const HAZARD_TEXT = {
  ionstorm: [
    'An ion squall is boiling across the lane, all violet lightning and static. Dobbin reads out the forecast in a very small voice.',
    'The lane runs straight through a curtain of ionised weather. Every loose screw on the ship starts to sing in sympathy.',
    'St. Elmo\'s fire crawls along the hull and the kettle develops a faint halo. The squall ahead is wide and not remotely sorry.',
  ],
  asteroids: [
    'The lane threads a tumbling rock-field. Nothing is aimed at you, which is the trouble: nothing is aimed at anything.',
    'A scatter of ice-clad boulders drifts across the route, turning slowly like sleepy cattle. Some of them are the size of cathedrals.',
    'Gravel rattles faintly against the plating, then less faintly. The chart calls it "debris, light." The chart is an optimist.',
  ],
  pulsar: [
    'The pulsar sweeps the lane with a lighthouse beam of radio noise. Every console in the ship begins to hum the same note.',
    'Ahead, a neutron star ticks like a metronome the size of a city. The comm channel fills with perfect, relentless static.',
    'Pulses of hard light wash the viewscreen every few seconds. Ilse mutters about calibration and then about tea.',
  ],
  rift: [
    'Space creases ahead like a folded page. The helm shivers and the kettle slides gently sideways.',
    'A rift hums across the lane, and the stars on the far side are subtly the wrong colour. The deck tilts a degree and a half.',
    'The lane bends around a singing fold in space. It is beautiful, and it is also not entirely where the chart said it was.',
  ],
  nebula: [
    'Thick nebula gas drags at the hull and the sensors go milky. Visibility is a matter of opinion.',
    'The lane dives into a bank of luminous fog. Somewhere inside, a very large and patient current is pulling at the ship.',
    'Pastel gas swirls past the ports, pretty as a watercolour and about as navigable. Dobbin recommends caution and a lamp.',
  ],
  generic: [
    'The lane is ugly with space weather: shear, grit and bad manners. Nothing fatal, but nothing free either.',
    'A knot of turbulent plasma has drifted into the lane overnight. The helm reports it feels "personal."',
    'Conflicting currents slosh across the route like a tide in a bathtub. The Halcyon creaks in several languages.',
    'Sensors flag a patch of uncharted shear ahead. The crew exchange the look people exchange before a bump.',
  ],
};
export function hazardPhenomenon(dest) { return dest.phenomena.find((p) => HAZARD_TEXT[p] && p !== 'generic') || null; }
export function hazardEvent(dest, mult = 1, day = 1) {
  const d = Math.max(1, dest.danger);
  const ph = hazardPhenomenon(dest);
  const hull = Math.round((4 + 3 * d) * mult);
  return ev('core_hazard', 'travel', 'Rough Lane', { scene: ph && ['ionstorm', 'asteroids', 'pulsar', 'rift'].includes(ph) ? ph : 'nebula' }, {
    a: {
      speaker: { name: 'Dobbin', species: 'robot' },
      text: (() => { const arr = HAZARD_TEXT[ph || 'generic']; return arr[(day + dest.id.length * 7 + (dest.danger || 0)) % arr.length]; })() + [' How shall we take it, Captain?', ' Your orders, Captain?', ' Dobbin awaits instruction.', ' What\'s the plan, Captain?'][(day + dest.danger) % 4],
      choices: [
        one('Push straight through', 'The Halcyon shudders, rattles and holds. The hull will want attention at the next harbour.', [{ hull: -hull }]),
        one('Slow burn around the worst of it', 'You take the long way round, patiently. The paint survives; the fuel gauge does not approve.', [{ fuel: -(1 + d) }, { days: 1 }]),
        { label: 'Thread it by hand', tag: 'flee', check: { skill: 'piloting', diff: 2 + d },
          pass: { text: 'Fingertips on the stick, tongue between teeth: the ship slips through like a needle through felt.', fx: [{ xp: { piloting: 1 } }] },
          fail: { text: 'A wing of the storm clips you. The ship comes out dented and humbled.', fx: [{ hull: -(hull - 1) }, { fuel: -1 }] } },
        { label: 'Reroute power to the shields', tag: 'science', check: { skill: 'engineering', diff: 2 + d },
          pass: { text: 'Okonkwo coaxes the shield grid to hum. Only a few scratches get through.', fx: [{ hull: -1 }, { xp: { engineering: 1 } }] },
          fail: { text: 'The grid sulks and flickers. You take the worst of it on the plating.', fx: [{ hull: -hull }] } },
      ],
    },
  }, { tags: ['hazard'] });
}

// ------------------------------------------------------------------ scan discoveries
/** Pick a find for a freshly scanned planet. Returns { text, fx, label } (fx already valid effects). */
const FIND_ALTS = {
  ore: ['Metallic glints mark an exposed vein. Okonkwo is already measuring the drill-bay for it, and Ilse bags a respectable crate of salvage.', 'The scanner chimes at a seam of heavy ore under a skin of dust. A drone scrapes a few crates free before anyone can ask permission.'],
  ice: ['Blue-white ice fields run to the horizon. A cutter drone brings home glittering blocks that smell faintly of rain.', 'Ancient ice, clean as a bell. The cargo crew call dibs on a few blocks and dibs on the first cup of anything chilled with it.'],
  gas: ['Cloud bands the colour of tea-stains roll below. A hydrogen scoop trails through the top deck and the tank gauge twitches upward.', 'The gas giant breathes slowly; the ship takes a polite sip of it. Fuel gauges approve.'],
  lava: ['Glowing rivers thread the dark crust. Ilse files a thermal survey with the careful pride of a person who has been warm for once.', 'Basalt plates grind and glow. The geologists would like it noted that they were extremely brave from orbit.'],
  crystal: ['Crystal spires ring like glasses at a wedding. One tiny shard drops free into the sample net and hums a sustained, approving note.', 'The surface is a forest of singing glass. A sample tray catches a fragment, still faintly chiming.'],
  hot: ['Steam rises in slow ribbons from mineral pools, and the sensor feed is so soothing that the night watch asks for a copy.', 'Warm springs braid through the stone below. The science station quietly becomes the most popular room on the ship.'],
  ruins: ['A neat grid of foundations, a cistern, a faded mosaic of a teapot. A drone lifts a curio from the rubble with great delicacy.', 'The sweep catches regular stonework: someone built here, tidily, long ago. A salvage drone returns with a curio and a lens full of dust.'],
};
export function scanFind(rng, planet, sys) {
  const f = planet.features || [];
  const pool = [];
  if (f.includes('ore')) pool.push({ key: 'ore', text: 'Rich ore seams run through the crust. Ilse bags a few crates of salvage lace precursors.', fx: [{ cargo: { salvage_lace: 2 } }, { xp: { science: 1 } }] });
  if (f.includes('hot_springs')) pool.push({ key: 'hot', text: 'Mineral hot springs steam below the ridge. The sensor feed is so relaxing that three crew ask for a copy.', fx: [{ morale: 3 }] });
  if (f.includes('aurora_fields')) pool.push({ text: 'Aurora fields ripple across the sky, answering your scanner pulses with slow light. The log entry runs long and dreamy.', fx: [{ credits: 25 }, { codex: 'aurora_life' }, { morale: 2 }] });
  if (f.includes('ruins')) pool.push({ key: 'ruins', text: 'Weathered ruins show up in the sweep: tidy foundations, a cistern, one very old teacup. A drone retrieves a curio.', fx: [{ cargo: { curios: 1 } }, { xp: { science: 1 } }] });
  if (f.includes('ancient_signal')) pool.push({ text: 'A faint ancient signal repeats under the static. You record it carefully; the Archive will pay for a clean copy.', fx: [{ credits: 40 }, { xp: { science: 2 } }] });
  if (planet.life === 'microbial') pool.push({ text: 'Microbial mats bloom in the shallows. A sample vial is logged for the Meridian biologists.', fx: [{ credits: 15 }, { xp: { science: 1 } }] });
  if (planet.life === 'flora') pool.push({ text: 'Broad-leaved flora nod at the scanner. A viable seed pod drops into the sample net.', fx: [{ cargo: { seed_vault_crates: 1 } }] });
  if (planet.life === 'fauna') pool.push({ text: 'Curious fauna gather beneath the sensor drone and pose, as far as anyone can tell, for the camera.', fx: [{ morale: 3 }, { credits: 10 }] });
  if (planet.life === 'civilized') pool.push({ text: 'City lights wink back at the scan. A polite greeting arrives in three scripts and one cheerful whistle.', fx: [{ morale: 2 }, ...(sys.faction && sys.faction !== 'none' ? [{ rep: { [sys.faction]: 1 } }] : [])] });
  if (planet.type === 'gas') pool.push({ key: 'gas', text: 'The ship skims the upper cloud decks and scoops a little hydrogen before anyone thinks to object.', fx: [{ fuel: 2 }] });
  if (planet.type === 'ice') pool.push({ key: 'ice', text: 'Clean ice sheets glitter below. Okonkwo wonders aloud about cutting a few blocks. The comet-ice market is always hungry.', fx: [{ cargo: { comet_ice: 2 } }] });
  if (planet.type === 'crystal') pool.push({ key: 'crystal', text: 'Singing crystal spires ring in the scanner beam. One chip falls free and chimes politely in the sample tray.', fx: [{ cargo: { tuning_crystals: 1 } }] });
  if (planet.type === 'lava') pool.push({ key: 'lava', text: 'Rivers of molten rock paint the terminator line. The thermal data alone is worth a fine report.', fx: [{ credits: 20 }, { xp: { science: 1 } }] });
  if (!pool.length || rng.next() > 0.7) return null;
  const pick = rng.pick(pool);
  const alt = FIND_ALTS[pick.key];
  return { ...pick, text: alt ? rng.pick([pick.text, ...alt]) : pick.text };
}
/** Optional mini-narrative wrapper for a find, so the player can choose to leave it undisturbed. */
export function findEvent(planet, find) {
  return ev('core_scan_find', 'planet', `Discovery on ${planet.name}`, { scene: 'planet' }, {
    a: {
      text: trunc(find.text, 60),
      choices: [
        one('Collect and log everything', 'The samples are stowed, labelled and admired.', find.fx),
        one('Take only photographs', 'You leave the world as you found it. The crew approve of your restraint.', [{ morale: 3 }, { xp: { science: 1 } }]),
      ],
    },
  }, { tags: ['wonder'] });
}

// ------------------------------------------------------------------ landing fallback
export function landingEvent(planet, sys) {
  const f = planet.features || [];
  const flavour = f.includes('ruins') ? 'Among the old foundations the landing party finds a door that is still, technically, ajar.'
    : f.includes('ore') ? 'The surface glitters with ore; the geologists have to be reminded to breathe.'
    : f.includes('hot_springs') ? 'Warm springs steam between the rocks, and discipline wavers.'
    : planet.life !== 'none' ? 'Life crowds the ground cover, small and busy and entirely uninterested in you.'
    : `${prettify(planet.type)} ground crunches underfoot beneath a sky that has opinions.`;
  const reward = f.includes('ruins') ? [{ cargo: { curios: 1 } }, { credits: 30 }] : f.includes('ore') ? [{ cargo: { salvage_lace: 3 } }, { credits: 15 }] : [{ credits: 30 }];
  return ev('core_landing_find', 'landing', `Landing on ${planet.name}`, { scene: f.includes('ruins') ? 'ruins' : 'landing' }, {
    a: {
      text: flavour + ' The party awaits instructions.',
      choices: [
        one('Collect and catalogue', 'A tidy haul, labelled in felt-tip: not glorious, but honest work.', [...reward, { xp: { science: 1 } }]),
        one('Make camp and enjoy the view', 'Tea is brewed on a rock. Someone starts a song; the song is terrible; everyone joins in.', [{ morale: 5 }, { supplies: -1 }]),
        { label: 'Climb the ridge for a better look', tag: 'science', check: { skill: 'piloting', diff: 3 },
          pass: { text: 'From the ridge you spot another light on the horizon: a nearby system you had not noticed before.', fx: [{ reveal: 'nearest' }, { credits: 15 }] },
          fail: { text: 'The ridge is steeper than it looks. You descend with dignity and a sprained ankle.', fx: [{ supplies: -2 }, { morale: -1 }] } },
      ],
    },
  }, { tags: ['mystery'] });
}

// ------------------------------------------------------------------ hails
export function hailEvent(g, factionId, rng) {
  const F = C.FACTIONS[factionId] || {};
  const lines = F.greetings && F.greetings.length ? F.greetings : F.greeting ? [F.greeting] : ['A polite voice answers your hail.'];
  const rumours = F.rumours && F.rumours.length ? F.rumours : ['"Nothing much to report," says the voice, "which is how we like it."'];
  const rumour = rng.pick(rumours);
  const name = `${F.adjective || prettify(factionId)} Harbour Voice`;
  const choices = [
    one('Exchange pleasantries', `${F.farewell ? F.farewell + ' ' : ''}A small, warm exchange. Goodwill accrues quietly.`, [{ rep: { [factionId]: 1 } }, { morale: 1 }], 'diplomacy'),
    one('Ask for local gossip', `${trunc(rumour, 55)} You jot down a coordinate and a raised eyebrow.`, [{ reveal: 'nearest' }, { xp: { diplomacy: 1 } }], 'diplomacy'),
  ];
  choices.push({ label: 'Offer a copy of the sector charts', tag: 'trade', if: [{ item: 'sector_charts' }], do: { text: 'The charts are received with real delight. A gift basket is promised and, remarkably, delivered.', fx: [{ item: { sector_charts: -1 } }, { rep: { [factionId]: 3 } }, { credits: 20 }] } });
  return ev('core_hail_' + factionId, 'hail', `${F.adjective || prettify(factionId)} Hail`, { scene: 'station', species: F.species }, {
    a: { speaker: { name, species: F.species || 'unknown' }, text: trunc(rng.pick(lines), 60), choices },
  }, { tags: ['diplomacy'] });
}

// ------------------------------------------------------------------ rival trader
export const RIVAL_NAME = 'Captain Tamsin Vell';
export function rivalEvent(g, rival) {
  const gname = goodName(rival.goodId);
  const friend = (g.state.counters.rival_friend || 0);
  const choices = [
    one('Share a pot of tea and swap market gossip', `Tamsin tips her cup. "I'm running ${gname} on the quiet. Don't tell the Concord." You trade rumours and leave on warmer terms.`, [{ counter: { rival_friend: 1 } }, { morale: 2 }, { reveal: 'nearest' }, { xp: { diplomacy: 1 } }], 'diplomacy'),
    { label: 'Challenge her to a friendly bidding match', tag: 'persuade', check: { skill: 'diplomacy', diff: 4 },
      pass: { text: 'You out-haggle her over a single crate and she laughs out loud. "Take it, you scoundrel." A free lot and a respectful nod.', fx: [{ cargo: { [rival.goodId]: 3 } }, { counter: { rival_friend: 1 } }] },
      fail: { text: 'She out-haggles you so politely that you thank her for it. The tea bill, you notice, is yours.', fx: [{ credits: -25 }] } },
  ];
  choices.push({ label: 'Propose a joint run', tag: 'trade', if: [{ counter: { rival_friend: 2 } }, { notFlag: 'rival_ally' }], do: { text: '"Fine," says Tamsin. "Split the margin, share the maps, and stop undercutting me at Candied Market." A handshake, a contract, a better route for both.', fx: [{ flag: 'rival_ally' }, { credits: 120 }, { rep: { quillari: 2 } }] } });
  return ev('core_rival', 'rival', `${RIVAL_NAME}`, { scene: 'market', species: 'human' }, {
    a: {
      speaker: { name: RIVAL_NAME, species: 'human' },
      text: friend ? `"Halcyon! Still after my ${gname} routes?" Tamsin Vell leans on a crate of it with a grin, pleased to see you again.` : `A weathered free-trader in a patched flight jacket looks up from a crate of ${gname}. "You're the Meridian ship. I'm Tamsin Vell. Mind the margins out here; I was here first."`,
      choices,
    },
  }, { tags: ['trade', 'comedy'] });
}

// ------------------------------------------------------------------ distress beacon
const DISTRESS_KINDS = {
  engine: { title: 'Dead Drive', who: 'a drifting free-trader', text: 'her drive coils have gone cold and she is drifting on dwindling air.', skill: 'engineering', need: 'repair' },
  medical: { title: 'Fever Aboard', who: 'a small passenger packet', text: 'a fever is going round the cabins and the only doctor has caught it first.', skill: 'medicine', need: 'treat' },
  supplies: { title: 'Empty Pantry', who: 'a pilgrim barge', text: 'the pantry ran out two days ago and the pilgrims are being very brave about it.', skill: 'diplomacy', need: 'share' },
};
export function pickDistressKind(rng) { return rng.pick(Object.keys(DISTRESS_KINDS)); }
export function distressEvent(g, d) {
  const k = DISTRESS_KINDS[d.kind] || DISTRESS_KINDS.engine;
  const fac = d.faction && d.faction !== 'none' ? d.faction : null;
  const repFx = fac ? [{ rep: { [fac]: 4 }, }, { rep: { concord: 1 } }] : [{ rep: { concord: 3 } }];
  const reward = 150 + d.reward;
  return ev('core_distress', 'distress', `Distress: ${k.title}`, { scene: 'ship_alien', species: d.species }, {
    a: {
      speaker: { name: d.captain, species: d.species },
      text: `The beacon leads you to ${k.who}: ${k.text} A tired voice crackles over the comm: "Halcyon, is that you? Please say you have a minute."`,
      choices: [
        { label: `Lend your ${k.skill} officer`, tag: k.skill === 'diplomacy' ? 'diplomacy' : 'science', check: { skill: k.skill, diff: 3 },
          pass: { text: 'It takes patience and a great deal of tea, but the problem yields. Their relief is loud and wet-eyed.', fx: [{ xp: { [k.skill]: 2 } }, { credits: reward }, ...repFx, { morale: 4 }], goto: 'b' },
          fail: { text: 'You do what you can; it is not quite enough, but they are alive and grateful for the effort.', fx: [{ xp: { [k.skill]: 1 } }, { credits: Math.round(reward * 0.4) }, { supplies: -2 }], goto: 'b' } },
        { label: 'Share supplies (6)', tag: 'trade', if: [{ supplies: 6 }], do: { text: 'Crates cross between the ships. Nobody is going hungry tonight.', fx: [{ supplies: -6 }, { credits: Math.round(reward * 0.7) }, ...repFx, { morale: 3 }], goto: 'b' } },
        one('Relay their position to Meridian', 'You file the coordinates with Meridian Relief. It is the proper thing, if not the heroic one. Dobbin logs it with a small sigh.', [{ morale: -1 }, { rep: { concord: 1 } }]),
      ],
    },
    b: { speaker: { name: d.captain, species: d.species }, text: `"You've saved us a day we didn't have, Captain {captain}. Take this, and take the thanks that comes with it. There's a story about the Halcyon in the next harbour already."`, fx: [{ morale: 2 }, { flag: 'distress_helped' }, { counter: { distress_helped: 1 } }] },
  }, { tags: ['relief'] });
}
export { DISTRESS_KINDS };

// ------------------------------------------------------------------ festival night (shore leave)
export function festivalEvent(news, sys) {
  return ev('core_festival', 'station', news.title, { scene: 'market' }, {
    a: {
      text: `${news.text} Stalls spill onto the docking ring; somebody hands you a paper lantern and a skewer of something fried.`,
      choices: [
        one('Join the festivities', 'You dance badly, eat enthusiastically and sign a stranger\'s guest book. The crew come back glowing.', [{ morale: 6 }, { credits: -8 }]),
        one('Work the crowd for news', 'Festival crowds talk freely. You pick up prices, rumours and one excellent recipe.', [{ reveal: 'nearest' }, { xp: { diplomacy: 1 } }], 'diplomacy'),
      ],
    },
  }, { tags: ['wonder', 'comedy'] });
}


// ------------------------------------------------------------------ hot lanes (multi-beat hazard chain with a payout)
const HOT_BEATS = [
  ['A hot lane, flagged in red on the Meridian charts: debris, heat-shimmer and gossip all agree it is worth a fortune to whoever gets through. The first stretch lies ahead.',
   'Run the gauntlet at full burn', 'The Halcyon screams through the first stretch and out the other side, ears ringing and paint blistered.', 'The first stretch grabs at the hull as you fly. You come out of it limping and grinning.',
   'Creep through on thrusters', 'Slow, patient, nerve-wracking. The first stretch passes at walking pace and the fuel gauge winces.',
   'Reinforce the plating first', 'Okonkwo bolts a spare panel to the weak spot. It holds, mostly.', 'The patch peels at the worst moment and the plating takes it all.'],
  ['The lane narrows. Things drift in the glare that are definitely not on the chart. {crew:piloting} says a short word and tightens both hands on the controls.',
   'Thread the gap by eye', 'Needle, meet thread. The gap swallows you and spits you out unscratched.', 'The gap is narrower than it looked. Something scrapes the keel.',
   'Cut the engines and coast', 'Silence, drift, held breath. The ship slides through on momentum and the fuel gauge forgives you slowly.',
   'Steady the crew and trust the helm', 'A calm word, a warm drink, a firm hand: the crew steadies and the helm does the rest.', 'Nerves jangle and the helm overcorrects. The hull pays for it.'],
  ['The last stretch is the worst: the lane bucks, the lights flicker, and every instrument has an opinion. Beyond it, open space and a good payout.',
   'Burn for the exit', 'Everything you have, all at once. The Halcyon bursts from the lane like a cork.', 'The exit is closer than it feels, and further than the hull would like.',
   'Edge out one careful metre at a time', 'You inch along the last stretch, patient as a snail, until the stars come back.',
   'Have engineering coax the drive', 'Okonkwo talks to the engine and the engine, grudgingly, listens.', 'The drive coughs, stutters and dumps its heat into the plating.'],
];
export function hotLaneEvent(dest, mult, bonus, fromName) {
  const d = Math.max(1, dest.danger);
  const hull = Math.round((4 + 3 * d) * mult);
  const nodes = {};
  const names = ['a', 'b', 'c'];
  HOT_BEATS.forEach((b, i) => {
    const next = i < 2 ? names[i + 1] : 'p';
    nodes[names[i]] = {
      text: i === 0 ? b[0].replace('The first stretch', `The first stretch of the ${fromName} lane`) : b[0],
      choices: [
        { label: b[1], tag: 'flee', check: { skill: 'piloting', diff: 3 + d },
          pass: { text: b[2], fx: [{ xp: { piloting: 1 } }], goto: next }, fail: { text: b[3], fx: [{ hull: -hull }, { fuel: -1 }], goto: next } },
        { label: b[4], tag: 'wait', do: { text: b[5], fx: [{ fuel: -(1 + d) }, { days: 1 }], goto: next } },
        { label: b[6], tag: 'science', check: { skill: i === 1 ? 'medicine' : 'engineering', diff: 2 + d },
          pass: { text: b[7], fx: [{ hull: -1 }, { morale: 2 }], goto: next }, fail: { text: b[8], fx: [{ hull: -Math.max(2, hull - 1) }, { morale: -2 }], goto: next } },
      ],
    };
  });
  nodes.p = {
    text: `Through! The lane spits you out into clean space and the Meridian relay pings a hazard-pay bounty for your trouble. Dobbin counts the dents with quiet pride.`,
    fx: [{ credits: bonus }, { cargo: { curios: 1 } }, { reveal: 'nearest' }, { morale: 3 }, { counter: { hot_runs: 1 } }, { toast: `Hot lane cleared: +${bonus} scrip`, tone: 'good' }],
  };
  return ev('core_hot_lane', 'travel', 'Hot Lane', { scene: 'asteroids' }, nodes, { tags: ['hazard'] });
}

// ------------------------------------------------------------------ stranded contract (timed delivery)
export const STRANDED_GOODS = ['fuel_cells', 'medical_kits', 'ration_bars'];
