// Halcyon Reach — NAME GENERATION DATA (WORLD-A). Pure data + tiny pure helpers, node-runnable.
//
// Exports:
//   SYSTEM_NAME_PARTS   { [regionId]: { patterns:[tpl], adj:[], noun:[], of:[], fixed:[] } }
//                       region ids: gate, shoals, veil, choir, archive, rim
//                       tpl tokens: {adj} {noun} {of} (random pick each), e.g. '{adj} {noun}', 'The {noun} of {of}'
//                       `fixed` = hand-picked evocative names; the generator should prefer these first.
//   PLANET_SUFFIXES     { roman:[...], greek:[...], letters:[...], epithets:{ [planetType]: [...] } }
//   STATION_NAMES       { [stationKind]: { patterns:[tpl], a:[], b:[] }, byFaction:{ [factionId]:{ prefix:[], suffix:[] } } }
//   CREW_NAME_POOLS     { [species]: { first:[], last:[], format? } }   (species: human, quillari, vesperine, archivist, drifter, robot)
//   SHIP_NAME_SUGGESTIONS  >= 12 names for the Halcyon dialog
//   CAPTAIN_NAME_SUGGESTIONS  for the new-game dialog
//
//   Helpers (take rng: () => number in [0,1)):
//     systemName(region, rng, used?:Set) -> string (adds to `used`, avoids duplicates)
//     planetName(systemName, index, type, rng) -> e.g. 'Marigold Shoals IV' or 'Marigold Shoals IV "Ember"' (type epithet ~30%)
//     stationName(kind, faction, rng) -> string
//     crewName(species, rng) -> string

// ---------------------------------------------------------------------------------------------
// SYSTEMS — distinctive lyrical sets per region
// ---------------------------------------------------------------------------------------------
export const SYSTEM_NAME_PARTS = {
  // The Gate and its neighbourhood: sober, hopeful, survey-ish, Meridian pride
  gate: {
    patterns: ['{adj} {noun}', '{noun} of {of}', 'The {noun}', '{adj} {noun}'],
    adj: ['First', 'Lantern', 'Welcome', 'Brass', 'Steady', 'Morning', 'Harbour', 'Threshold', 'Open', 'Early'],
    noun: ['Landing', 'Gate', 'Harbour', 'Lamp', 'Crossing', 'Doorstep', 'Beacon', 'Anchorage', 'Steps', 'Haven'],
    of: ['Good Hope', 'Small Beginnings', 'First Light', 'Safe Passage', 'Brass Hinges'],
    fixed: ['Halcyon Gate', 'Meridian Landing', 'Threshold Lamp', 'Welcome Mat'],
  },
  // Quillari-flavoured Marigold Shoals: golden, hospitable, mercantile
  shoals: {
    patterns: ['{adj} {noun}', '{adj} {noun}', '{noun} of {of}', '{adj} {noun}'],
    adj: ['Marigold', 'Saffron', 'Honeyed', 'Gilded', 'Amber', 'Candied', 'Copper', 'Glass-Fruit', 'Ember', 'Butterscotch', 'Quill', 'Tea-Rose'],
    noun: ['Shoals', 'Reach', 'Market', 'Hearth', 'Cove', 'Table', 'Feather', 'Spindle', 'Orchard', 'Strand', 'Bazaar'],
    of: ['Fair Dealing', 'Many Cups', 'Second Helpings', 'Good Gossip', 'Open Doors', 'Warm Welcomes'],
    fixed: ['Marigold Shoals', 'Hearth of Vell-Aroon', 'Saffron Strand', 'The Candied Market', 'Glass-Fruit Orchard'],
  },
  // Veil of Penny-Lace: nebula, soft, delicate; Vesperine choirs
  veil: {
    patterns: ['{noun} of {of}', 'Veil of {of}', '{adj} {noun}', 'The {adj} {noun}'],
    adj: ['Whispering', 'Lacewing', 'Pearl', 'Gossamer', 'Penny-Lace', 'Muslin', 'Silken', 'Dewdrop', 'Hushed', 'Opal', 'Moth-Wing'],
    noun: ['Veil', 'Curtain', 'Drift', 'Fold', 'Hush', 'Shawl', 'Mist', 'Reverie', 'Glimmer', 'Doily'],
    of: ['Penny-Lace', 'Soft Voices', 'Evening Lace', 'Pale Rain', 'Tender Hours', 'Quiet Music', 'Spun Moonlight'],
    fixed: ['Veil of Penny-Lace', 'Lacewing Drift', 'Gossamer Hush', 'Pearl Curtain'],
  },
  // The Choir: pulsars, rifts, music
  choir: {
    patterns: ['{noun} {adj}', '{adj} {noun}', '{noun} of {of}', 'The {adj} {noun}'],
    adj: ['Tuning', 'Resonant', 'Sustained', 'Falling', 'Rising', 'Open', 'Perfect', 'Plainsong', 'Cantata', 'Vespers'],
    noun: ['Fork', 'Chord', 'Choir', 'Harmonic', 'Cadence', 'Interval', 'Descant', 'Refrain', 'Reed', 'Octave', 'Fifth'],
    of: ['Third Voices', 'Held Breath', 'Long Notes', 'Common Time', 'Slow Bells', 'Distant Hymns'],
    fixed: ['Tuning Fork', 'Third Choir', 'Perfect Fifth', 'Cantata Reach', 'Slow Bell'],
  },
  // Hollow Archive: scholarly, cataloguey, vellum
  archive: {
    patterns: ['{adj} {noun}', '{noun} of {of}', '{adj} {noun}', 'The {adj} {noun}'],
    adj: ['Indexed', 'Annotated', 'Cross-Referenced', 'Vellum', 'Marginal', 'Footnoted', 'Bound', 'Cloistered', 'Pressed', 'Sealed', 'Catalogued'],
    noun: ['Stacks', 'Folio', 'Codex', 'Scriptorium', 'Appendix', 'Reading-Room', 'Colophon', 'Reliquary', 'Gloss', 'Quire', 'Verso'],
    of: ['Lost Footnotes', 'Pending Questions', 'Unanswered Letters', 'Last Revisions', 'Open Volumes'],
    fixed: ['Hollow Archive', 'The Reading-Room', 'Marginal Appendix', 'Appendix Zero'],
  },
  // The Rim: Drifter, quilty, wandering, deep mystery
  rim: {
    patterns: ['{adj} {noun}', '{noun} of {of}', '{adj} {noun}', 'The {noun}'],
    adj: ['Patchwork', 'Tattered', 'Quilted', 'Thimble', 'Long', 'Thirteenth', 'Mended', 'Darning', 'Wayward', 'Salvage', 'Stitched', 'Stray'],
    noun: ['Hem', 'Seam', 'Thread', 'Selvage', 'Warp', 'Quilt', 'Tapestry', 'Bobbin', 'Lamp', 'Hearthfire', 'Long Table'],
    of: ['Thirteen Aprils', 'Borrowed Time', 'Many Hands', 'Slow Stories', 'Faded Maps', 'Last Embers'],
    fixed: ['Fleet of Thirteen Aprils', 'The Long Table', 'Darning Needle', 'Last Lamp'],
  },
};

// ---------------------------------------------------------------------------------------------
// PLANETS
// ---------------------------------------------------------------------------------------------
export const PLANET_SUFFIXES = {
  roman: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'],
  greek: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'],
  letters: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
  epithets: {
    terran: ['Verdant', 'Homestead', 'Greensward', 'Picnic', 'Meadowlark'],
    ocean: ['Tidewater', 'Lullaby', 'Sargasso', 'Blue Pewter', 'Bathwater'],
    desert: ['Biscuit', 'Cinnamon', 'Dune-Song', 'Sandpaper', 'Parchment'],
    ice: ['Peppermint', 'Frostwork', 'Snowglobe', 'Cold Comfort', 'Meringue'],
    lava: ['Ember', 'Forge-Heart', 'Hot Toddy', 'Hearthstone', 'Bonfire'],
    gas: ['Bellows', 'Tea Cosy', 'Windbag', 'Marble Cloud', 'Paisley'],
    barren: ['Pebble', 'Footnote', 'Dustpan', 'Quiet Rock', 'Thimble'],
    jungle: ['Tangle', 'Greenhouse', 'Emerald Murmur', 'Orchid', 'Canopy'],
    crystal: ['Chandelier', 'Glasswork', 'Winegoblet', 'Prism', 'Tuning Glass'],
    toxic: ['Pickle', 'Mustard', 'Smelling-Salts', 'Verdigris', 'Sulphur Posy'],
  },
};

// ---------------------------------------------------------------------------------------------
// STATIONS
// ---------------------------------------------------------------------------------------------
export const STATION_NAMES = {
  trade: {
    patterns: ['{a} {b}', 'The {a} {b}'],
    a: ['Copper', 'Gilded', 'Brass', 'Mulberry', 'Honeycomb', 'Gossip', 'Lantern', 'Silver Spoon', 'Teapot', 'Ledger'],
    b: ['Exchange', 'Emporium', 'Bazaar', 'Mart', 'Counter', 'Stall', 'Arcade', 'Trading-Post'],
  },
  outpost: {
    patterns: ['{a} {b}', '{a} {b}'],
    a: ['Lonely', 'Quiet', 'Cheerful', 'Stopgap', 'Last', 'Wayside', 'Kettle', 'Lamp', 'Little'],
    b: ['Waystation', 'Outpost', 'Stopover', 'Rest', 'Depot', 'Hostel', 'Pump', 'Light'],
  },
  shipyard: {
    patterns: ['{a} {b}', '{a} {b}'],
    a: ['Brassworks', 'Riveter\'s', 'Gantry', 'Foundry', 'Slipway', 'Drydock', 'Torque', 'Anvil'],
    b: ['Yard', 'Docks', 'Works', 'Berth', 'Cradle', 'Hangar', 'Spar', 'Forge'],
  },
  embassy: {
    patterns: ['{a} {b}', 'The {a} {b}'],
    a: ['Courtesy', 'Concordat', 'Accord', 'Protocol', 'Envoy', 'Amity', 'Good Offices', 'Common Ground'],
    b: ['House', 'Legation', 'Embassy', 'Chambers', 'Pavilion', 'Hall', 'Rotunda'],
  },
  archive: {
    patterns: ['{a} {b}', 'The {a} {b}'],
    a: ['Annex', 'Quire', 'Stacks', 'Reading-Room', 'Index', 'Folio', 'Scroll'],
    b: ['Reading Hall', 'Lending Desk', 'Repository', 'Branch Library', 'Study', 'Vault'],
  },
  habitat: {
    patterns: ['{a} {b}', 'The {a} {b}'],
    a: ['Patchwork', 'Thimble', 'Darning', 'Long', 'Mending', 'Hearthfire', 'Quilted', 'Stitched'],
    b: ['Habitat', 'Wheel', 'Commons', 'Ring', 'Table', 'Hive', 'Ark'],
  },
  byFaction: {
    concord: { prefix: ['Concord', 'Harbour Control', 'Ministry of'], suffix: ['Station', 'Depot', 'Platform', 'Office'] },
    quillari: { prefix: ['Clan Vell-Aroon', 'Clan Tessk', 'Clan Wren-Quill', 'Clan Sorrel'], suffix: ['Roost', 'Perch', 'Aerie', 'Market-Nest'] },
    vesperine: { prefix: ['Choir of', 'First', 'Third', 'Hush of'], suffix: ['Resonance', 'Hall', 'Sanctuary', 'Listening-Post'] },
    archivists: { prefix: ['Hollow', 'Annex of', 'Sub-', 'Branch of'], suffix: ['Archive', 'Stacks', 'Reading-Room', 'Annex'] },
    drifters: { prefix: ['Fleet of', 'Long', 'Mended', 'Stitched'], suffix: ['Habitat', 'Table', 'Commons', 'Ark'] },
  },
};

// ---------------------------------------------------------------------------------------------
// CREW NAME POOLS
// ---------------------------------------------------------------------------------------------
export const CREW_NAME_POOLS = {
  human: {
    first: ['Adaeze', 'Ilse', 'Marguerite', 'Odalys', 'Barnaby', 'Winnifred', 'Lucinda', 'Idris', 'Marigold', 'Sable', 'Pip', 'Hamid', 'Tobias', 'Ottoline', 'Rosalind', 'Cassius', 'Theodora', 'Ambrose', 'Philippa', 'Anselm', 'Juno', 'Percival', 'Zenobia', 'Mateo'],
    last: ['Okonkwo', 'Vo', 'Pemberton', 'Brandt', 'Quince', 'Gale', 'Ashgrove', 'Wren-Tolliver', 'Teague', 'Ito-Nakamura', 'Fennimore', 'Rashidov', 'Thistlewick', 'Abernathy', 'Hobday', 'Nwosu', 'Castellan', 'Marchetti', 'Bright', 'Ferreira'],
  },
  quillari: {
    first: ['Brisk', 'Orrin', 'Sorrel', 'Tessk', 'Wren', 'Pip-Pip', 'Marrow', 'Calla', 'Fennel', 'Thrush', 'Kestrel', 'Lark', 'Nib'],
    last: ['of Vell-Aroon', 'Whistle-Reed', 'of Clan Tessk', 'Quill-Dancer', 'of Sorrel Roost', 'Two-Feathers', 'Bright-Crest', 'Honey-Tongue', 'of the Long Perch'],
  },
  vesperine: {
    first: ['Aloe-Who-Hums', 'Merrin', 'Lumen-in-Rain', 'Soft-Third', 'Dewdrop-Chord', 'Echo-of-Dusk', 'Calm-Fifth', 'Velvet-Hum', 'Lyre-of-Morning', 'Lullaby-Held'],
    last: ['of the Third Choir', 'in D major', 'of Slow Bells', 'of the Hush', 'in the Long Note', 'of the Penny-Lace'],
    format: '{first} {last}',
  },
  archivist: {
    first: ['Cataloguer', 'Indexer', 'Verity', 'Collator', 'Annotator', 'Concordance', 'Appendix', 'Cross-Reference', 'Cantor', 'Marginalia'],
    last: ['Seventeen-Seventeen', 'Forty-One', 'Alpha-Nine', 'Delta-Folio', 'of the Fourth Stack', 'Rev. 3', 'Section Q', 'Pending'],
  },
  drifter: {
    first: ['Jo-Dara', 'Fennick', 'Rook', 'Oss', 'Thimble', 'Bobbin', 'Needle', 'Hester', 'Darby', 'Tansy', 'Moss', 'Cobb', 'Wick', 'Sprig'],
    last: ['Calloway', 'the Weaver', 'the Lamplighter', 'Seam-and-Hem', 'Thirteen-April', 'Patchwork', 'the Younger', 'of the Long Table', 'Selvage'],
  },
  robot: {
    first: ['Teacup', 'Gantry', 'Sprocket', 'Widget', 'Bolt', 'Valve', 'Rivet', 'Clank', 'Sixpence', 'Dumpling'],
    last: ['-3', '-7', '-9', '-12', ' Mk II', ' Mk IV', '-Alpha', '-of-the-Hold'],
    format: '{first}{last}',
  },
};

// ---------------------------------------------------------------------------------------------
// SHIP & CAPTAIN
// ---------------------------------------------------------------------------------------------
export const SHIP_NAME_SUGGESTIONS = [
  'ISV Halcyon', 'ISV Marigold Compass', 'ISV Gentle Persistence', 'ISV Teacup Parade', 'ISV Brass Lantern',
  'ISV Ribbon of Dawn', 'ISV Thistledown', 'ISV Quiet Ambition', 'ISV Meridian Dream', 'ISV Slow Comet',
  'ISV Kettle and Compass', 'ISV Paper Moon', 'ISV Pleasant Detour', 'ISV Wishing Well', 'ISV Cheerful Error',
  'ISV Afternoon Light', 'ISV Gilded Bobbin', 'ISV Felt-Tip Star',
];

export const CAPTAIN_NAME_SUGGESTIONS = [
  'Captain Ada Merriweather', 'Captain Julian Ostrander', 'Captain Priya Winterbourne', 'Captain Tobias Hale',
  'Captain Nell Fairweather', 'Captain Rafael Lindqvist', 'Captain Sunniva Reyes', 'Captain Mabel Cartwright',
];

// ---------------------------------------------------------------------------------------------
// HELPERS (pure; rng: () => [0,1))
// ---------------------------------------------------------------------------------------------
const pick = (arr, rng) => arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];

export function systemName(region, rng, used) {
  const parts = SYSTEM_NAME_PARTS[region] || SYSTEM_NAME_PARTS.gate;
  const seen = used || new Set();
  // fixed names first (shuffled by rng, ~35% chance to use one if available)
  const fixedLeft = parts.fixed.filter((n) => !seen.has(n));
  if (fixedLeft.length && rng() < 0.35) {
    const n = pick(fixedLeft, rng);
    seen.add(n);
    return n;
  }
  for (let i = 0; i < 40; i++) {
    const tpl = pick(parts.patterns, rng);
    const n = tpl
      .replace('{adj}', () => pick(parts.adj, rng))
      .replace('{noun}', () => pick(parts.noun, rng))
      .replace('{of}', () => pick(parts.of, rng));
    if (!seen.has(n)) {
      seen.add(n);
      return n;
    }
  }
  // exhaustion fallback: guaranteed-unique via suffix
  let k = 2;
  const base = pick(parts.fixed, rng);
  while (seen.has(`${base} ${k}`)) k++;
  const n = `${base} ${k}`;
  seen.add(n);
  return n;
}

export function planetName(sysName, index, type, rng) {
  const roman = PLANET_SUFFIXES.roman[index % PLANET_SUFFIXES.roman.length];
  const base = `${sysName} ${roman}`;
  const eps = PLANET_SUFFIXES.epithets[type];
  if (eps && rng() < 0.3) return `${base} "${pick(eps, rng)}"`;
  return base;
}

export function stationName(kind, faction, rng) {
  const f = STATION_NAMES.byFaction[faction];
  if (f && rng() < 0.5) return `${pick(f.prefix, rng)} ${pick(f.suffix, rng)}`.replace(/ {2,}/g, ' ');
  const k = STATION_NAMES[kind] || STATION_NAMES.trade;
  return pick(k.patterns, rng).replace('{a}', pick(k.a, rng)).replace('{b}', pick(k.b, rng));
}

export function crewName(species, rng) {
  const pool = CREW_NAME_POOLS[species] || CREW_NAME_POOLS.human;
  const first = pick(pool.first, rng);
  const last = pick(pool.last, rng);
  const fmt = pool.format || '{first} {last}';
  return fmt.replace('{first}', first).replace('{last}', last);
}
