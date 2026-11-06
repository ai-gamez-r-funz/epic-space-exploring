// Halcyon Reach — NAME GENERATION DATA (WORLD-A). Pure data + tiny pure helpers, node-runnable.
//
// Exports:
//   SYSTEM_NAME_PARTS   { [regionId]: { patterns:[tpl], adj:[], noun:[], of:[], fixed:[] } }
//                       region ids: gate, shoals, veil, choir, archive, rim
//                       tpl tokens: {adj} {noun} {of} (random pick each), e.g. '{adj} {noun}', 'The {noun} of {of}'
//                       `fixed` = hand-picked evocative names; the generator should prefer these first.
//   PLANET_SUFFIXES     { roman:[...], greek:[...], letters:[...], epithets:{ [planetType]: [...] } }
//   STATION_NAMES       { [stationKind]: { names:[full names], patterns:[tpl], a:[], b:[] }, byFaction:{ [factionId]:{ names:[full names] } } }
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
  // `names` = hand-authored full names (preferred; no tautologies by construction).
  // `a`/`b` + `patterns` = combinatorial fallback; stationName() rejects redundant results (see isRedundantName).
  trade: {
    names: ['Copper Kettle Exchange', 'The Gilded Ledger', 'Honeycomb Arcade', 'Mulberry Mart', 'Gossip Row', 'The Silver Spoon', 'Lantern Lane Bazaar', 'Teapot & Tally', 'The Brass Abacus', 'Haggler\'s Rest', 'Marmalade Market', 'The Counting Cat', 'Pennyweight Plaza', 'Saffron Stall', 'The Open Ledger'],
    patterns: ['{a} {b}'],
    a: ['Copper', 'Gilded', 'Brass', 'Mulberry', 'Honeycomb', 'Gossip', 'Lantern', 'Teapot', 'Ledger'],
    b: ['Exchange', 'Emporium', 'Bazaar', 'Mart', 'Arcade', 'Trading-Post'],
  },
  outpost: {
    names: ['Lonely Lamp', 'The Cheerful Stopgap', 'Kettle Rest', 'Wayside Light', 'Little Hearth', 'The Last Lantern', 'Quiet Pump', 'Dusk Hostel', 'Penny Depot', 'The Warm Window', 'Stopover Seven', 'Thimble Light', 'Cinder Shelter', 'The Patient Pump', 'Haven Nine'],
    patterns: ['{a} {b}'],
    a: ['Lonely', 'Quiet', 'Cheerful', 'Last', 'Kettle', 'Lamp', 'Little'],
    b: ['Stopover', 'Rest', 'Depot', 'Hostel', 'Pump', 'Light'],
  },
  shipyard: {
    names: ['Anvil & Spar', 'The Rivet Cathedral', 'Torque Hall', 'Gantry Gardens', 'Slipway Nine', 'The Patient Drydock', 'Brassworks', 'Hammer & Hum', 'The Tinkerers\' Cradle', 'Welder\'s Rest', 'Bolt & Bracket', 'Keelhaven', 'The Tuning Berth', 'Forge of Small Wonders', 'Cog & Candle'],
    patterns: ['{a} {b}'],
    a: ['Gantry', 'Anvil', 'Torque', 'Bracket', 'Spar'],
    b: ['Yard', 'Works', 'Cradle', 'Hangar', 'Forge'],
  },
  embassy: {
    names: ['Courtesy House', 'The Accord Rotunda', 'Amity Pavilion', 'The Good Offices', 'Common Ground Hall', 'Envoy\'s Rest', 'The Protocol Room', 'Concordat Gardens', 'Handshake Terrace', 'The Round Table', 'Parley Point', 'Goodwill Gallery'],
    patterns: ['{a} {b}'],
    a: ['Courtesy', 'Accord', 'Protocol', 'Envoy', 'Amity'],
    b: ['House', 'Legation', 'Chambers', 'Pavilion', 'Rotunda'],
  },
  archive: {
    names: ['The Lending Desk', 'Quire & Quill', 'The Quiet Stacks', 'Annex of Small Questions', 'The Footnote Library', 'Index Hall', 'The Open Folio', 'Marginal Study', 'Cloister of Cross-References', 'The Patient Shelf', 'Vellum Reading-Room', 'The Last Page'],
    patterns: ['{a} {b}'],
    a: ['Index', 'Folio', 'Quire', 'Scroll', 'Colophon'],
    b: ['Repository', 'Branch Library', 'Study', 'Vault', 'Lending Desk'],
  },
  habitat: {
    names: ['The Long Table', 'Thimble Wheel', 'Patchwork Commons', 'Darning Ring', 'Hearthfire Hive', 'The Mended Ark', 'Quilted Commons', 'Story-Knot Wheel', 'The Stitched Sky', 'Bobbin Ring', 'Needle & Thread Ark', 'The Slow Supper', 'Warp & Weft', 'Selvage Wheel', 'The Borrowed Hearth'],
    patterns: ['{a} {b}'],
    a: ['Patchwork', 'Thimble', 'Darning', 'Hearthfire', 'Stitched'],
    b: ['Commons', 'Wheel', 'Ring', 'Ark', 'Table'],
  },
  // Faction flavour: complete names (no prefix+suffix gluing)
  byFaction: {
    concord: { names: ['Concord Harbour Control', 'Ministry of Small Mercies Annex', 'Harbour Office Seven', 'Concord Depot Lyra', 'The Stamping Pool', 'Committee Room Four', 'Charter Day Platform', 'Form 7-B Waystation'] },
    quillari: { names: ['Clan Vell-Aroon Roost', 'Clan Tessk Perch', 'Clan Wren-Quill Aerie', 'Clan Sorrel Market-Nest', 'Two-Feathers Landing', 'The Honey-Tongue Perch', 'Long Perch Exchange', 'Bright-Crest Roost'] },
    vesperine: { names: ['Choir of the Third Hush', 'First Resonance Hall', 'The Listening-Post', 'Hush of Evening Sanctuary', 'Held-Note Hall', 'The Slow Bells', 'Third Voices Sanctuary', 'Chime of Quiet'] },
    archivists: { names: ['The Hollow Annex', 'Branch of the Fourth Stack', 'Sub-Index Reading-Room', 'The Cross-Reference Desk', 'Annex Q', 'Pending Questions Hall', 'Stack Nine', 'Catalogue Jubilee Branch'] },
    drifters: { names: ['Fleet of Thirteen Aprils', 'The Long Table', 'Mended Commons', 'Stitched Ark Eleven', 'Selvage Commons', 'The Patchwork Supper', 'Hem & Hearth', 'Darning Needle Ark'] },
  },
};

// Words that mean "the same kind of place" - a name containing two of the same group reads as a tautology.
const SYNONYM_GROUPS = [
  ['dock', 'docks', 'drydock', 'slipway', 'berth', 'cradle', 'yard', 'hangar'],
  ['works', 'brassworks', 'forge', 'foundry', 'anvil'],
  ['station', 'depot', 'outpost', 'waystation', 'stopover', 'post'],
  ['archive', 'stacks', 'library', 'repository', 'vault', 'reading-room', 'annex', 'branch', 'study'],
  ['habitat', 'wheel', 'ring', 'ark', 'commons', 'hive'],
  ['market', 'mart', 'bazaar', 'emporium', 'exchange', 'arcade', 'trading-post'],
  ['embassy', 'legation', 'chambers', 'pavilion', 'rotunda', 'house', 'hall'],
];

/** True if a station name repeats itself ("Drydock Docks", "Wayside Waystation", "Brassworks Works"). */
export function isRedundantName(name) {
  const w = String(name).toLowerCase().replace(/[^a-z\- ]/g, ' ').split(/\s+/).filter(Boolean);
  for (let i = 0; i < w.length; i++) {
    for (let j = i + 1; j < w.length; j++) {
      const x = w[i], y = w[j];
      if (x === y) return true;
      if (x.length >= 4 && y.length >= 4 && (x.startsWith(y) || y.startsWith(x) || x.slice(0, 5) === y.slice(0, 5))) return true;
      if (x.length >= 4 && y.length >= 4 && (y.includes(x) || x.includes(y))) return true;
    }
  }
  let hits = 0;
  for (const g of SYNONYM_GROUPS) {
    const n = new Set(w.filter((t) => g.includes(t)));
    if (n.size >= 2) return true;
    hits += n.size;
  }
  return false;
}

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
  const k = STATION_NAMES[kind] || STATION_NAMES.trade;
  for (let i = 0; i < 12; i++) {
    let n;
    const r = rng();
    if (f && f.names && r < 0.4) n = pick(f.names, rng);
    else if (k.names && r < 0.85) n = pick(k.names, rng);
    else n = pick(k.patterns, rng).replace('{a}', pick(k.a, rng)).replace('{b}', pick(k.b, rng));
    if (!isRedundantName(n)) return n;
  }
  return pick(k.names, rng);
}

export function crewName(species, rng) {
  const pool = CREW_NAME_POOLS[species] || CREW_NAME_POOLS.human;
  const first = pick(pool.first, rng);
  const last = pick(pool.last, rng);
  const fmt = pool.format || '{first} {last}';
  return fmt.replace('{first}', first).replace('{last}', last);
}
