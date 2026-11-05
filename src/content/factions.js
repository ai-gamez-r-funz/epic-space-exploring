// Halcyon Reach — FACTIONS (WORLD-A). Pure data, node-runnable.
//
// Exports:
//   FACTIONS      { [factionId]: { id, name, adjective, species, colour, blurb, greeting, homeRegion,
//                                  likes:[goodId], dislikes:[goodId], flavor... } }
//   FACTION_IDS   ['concord','quillari','vesperine','archivists','drifters']
//   REP_TITLES    rep thresholds -> label (UI may use for display)
//   repTitle(n)   helper -> label for a -100..100 rep value
//
// Extra (optional) fields beyond the contract, safe to ignore:
//   greetings[]   several hail lines (engine/UI may pick randomly)
//   farewell      sign-off line
//   quirk         one-line summary of how to get on with them
//   rumours[]     bar-gossip lines for station flavour
//   emblem        short motif description for GFX
//   homeRegion    one of REGIONS in story.js: gate|shoals|veil|choir|archive|rim

export const FACTION_IDS = ['concord', 'quillari', 'vesperine', 'archivists', 'drifters'];

export const FACTIONS = {
  concord: {
    id: 'concord',
    name: 'Concord of Lyra',
    adjective: 'Concord',
    species: 'human',
    colour: 0x4aa3a8,
    blurb:
      'Terran-descended settlers who believe, with great sincerity, that most problems can be solved by a well-run committee and a sufficiently clear form. They are earnest, kind, and extremely punctual.',
    greeting:
      'Concord Harbour Control, good day! Please state your vessel, your purpose, and whether you have had tea. Form 7-B is optional but appreciated.',
    greetings: [
      'Good day, Halcyon. You are cleared to approach, and may I say the Concord is delighted by your punctuality.',
      'Harbour Control here. Mind the buoys, mind the paperwork, and do enjoy your stay.',
      'Welcome! Please remain seated while your arrival is stamped in triplicate.',
    ],
    farewell: 'Safe travels. Do write.',
    homeRegion: 'shoals',
    likes: ['ration_bars', 'medical_kits', 'star_charts', 'vellum_sheets', 'seed_vault_crates'],
    dislikes: ['glass_brandy', 'smuggler_spice'],
    quirk: 'Rewards honesty, paperwork, and relief work. Faintly suspicious of anything fun that is not scheduled.',
    rumours: [
      'The Ministry of Small Mercies has been asked to fund a Ministry of Slightly Larger Mercies. The committee is meeting.',
      'Somebody left a kettle on in Committee Room Four in the year 2431. Nobody dares check.',
    ],
    emblem: 'compass rose over a teacup',
  },

  quillari: {
    id: 'quillari',
    name: 'Quillari Clans',
    adjective: 'Quillari',
    species: 'quillari',
    colour: 0xe0a33a,
    blurb:
      'Feathered free-trader clans who regard commerce as a branch of hospitality and gossip as a branch of commerce. Every bargain begins with a drink and ends with a rumour.',
    greeting:
      '*ruffles crest* Ah, the Halcyon! Sit, sit! A bargain is only as warm as the cup it is poured in. What have you brought, what do you want, and who told you about us?',
    greetings: [
      'Feathers up and welcome, cousin! Prices are negotiable; affection is not.',
      'Ah, a ship with tea aboard, I can smell it from here. Come, trade!',
      'Hail, Halcyon! Clan Vell-Aroon has a table, a kettle, and an opinion about your prices.',
    ],
    farewell: 'May your hold be heavy and your gossip fresh.',
    homeRegion: 'shoals',
    likes: ['star_charts', 'curios', 'vellum_sheets', 'hand_looms', 'tuning_crystals'],
    dislikes: ['ration_bars', 'machine_parts'],
    quirk: 'Haggle with warmth, never with a stopwatch. Gossip is a legitimate currency.',
    rumours: [
      'Clan Vell-Aroon swears the Shoals glow brighter in wet years. Clan Tessk swears it is the brandy.',
      'A grandmother in the Shoals has reportedly out-haggled an Archivist. The Archivist is still recalculating.',
    ],
    emblem: 'tail-feather crossed with a scale-beam',
  },

  vesperine: {
    id: 'vesperine',
    name: 'Vesperine Choirs',
    adjective: 'Vesperine',
    species: 'vesperine',
    colour: 0xb58ad8,
    blurb:
      'Crystalline beings who speak in sustained harmonics and think in chords. They are gentle, slow to speak, and deeply wounded by clatter, slamming doors, and brass bands.',
    greeting:
      '[a soft major third rises through the speaker, like a glass rim being stroked] ...Welcome. We are glad of your quiet. Please, lower your engines to a hum.',
    greetings: [
      '[a warm open fifth] ...Be at peace in our resonance, Halcyon.',
      '[a slow chord, three voices deep] ...You arrive softly. We note this. We are pleased.',
      '[a hush, then a bright harmonic] ...Greetings. Please do not whistle.',
    ],
    farewell: '[a falling sixth, slowly] ...Go gently.',
    homeRegion: 'veil',
    likes: ['tuning_crystals', 'vellum_sheets', 'aurora_silk', 'curios'],
    dislikes: ['machine_parts', 'smuggler_spice', 'fuel_cells'],
    quirk: 'Arrive quietly, answer slowly, and never interrupt a chord. Rep comes from patience and poetry.',
    rumours: [
      'The Third Choir held a note for eleven days. Nobody has ever been so rested.',
      'A trader once dropped a wrench in a Vesperine hall. The echo is, reportedly, still being forgiven.',
    ],
    emblem: 'three nested tuning-fork arcs',
  },

  archivists: {
    id: 'archivists',
    name: 'Hollow Archive',
    adjective: 'Archivist',
    species: 'archivist',
    colour: 0x7fa88b,
    blurb:
      'Ancient machine librarians who have been cataloguing the Reach for longer than anyone can verify. They are polite, literal, and hoard unanswered questions the way dragons hoard gold.',
    greeting:
      'GREETINGS, VISITOR. YOU ARE CATALOGUED AS "SHIP, SMALL, TEA-SCENTED". THE ARCHIVE WILL ANSWER ONE QUESTION. PLEASE PHRASE IT PRECISELY.',
    greetings: [
      'QUERY RECEIVED BEFORE IT WAS ASKED. PLEASE ASK IT ANYWAY. THE ARCHIVE LIKES TO BE POLITE.',
      'WELCOME. YOUR LAST VISIT IS NOT ON RECORD, WHICH IS EXCITING.',
      'GOOD CYCLE. PLEASE DO NOT FOLD THE VELLUM.',
    ],
    farewell: 'FAREWELL. YOUR DEPARTURE HAS BEEN INDEXED UNDER "F".',
    homeRegion: 'archive',
    likes: ['vellum_sheets', 'star_charts', 'curios', 'tuning_crystals', 'machine_parts'],
    dislikes: ['glass_brandy', 'smuggler_spice'],
    quirk: 'Answer literally. Bring them new questions, old paper, and well-formed citations.',
    rumours: [
      'The Archive has a card catalogue of its own card catalogue. It is, they admit, a little bit behind.',
      'One Archivist asked a question in the year 2201. It is still thinking about the answer, and is happy.',
    ],
    emblem: 'open book with a single lit window',
  },

  drifters: {
    id: 'drifters',
    name: 'Drifter Fleets',
    adjective: 'Drifter',
    species: 'drifter',
    colour: 0xd9704a,
    blurb:
      'Nomad habitat-fleets of patched hulls and long memories. Weavers, welders, and storytellers, all wary of anyone who arrives with a charter and a clipboard.',
    greeting:
      'Halcyon, is it? Meridian paint on the hull... well. The kettle is on, the airlock is open, and the stories are free if you stay for the ending. Wipe your boots.',
    greetings: [
      'Come aboard if you mean to listen. We trade in stories first and scrip second.',
      'Mind the patches, they are load-bearing. Welcome to the Long Table.',
      'You have the look of someone who has never lost a habitat. Sit, we will fix that, gently.',
    ],
    farewell: 'Bring us a better story next time.',
    homeRegion: 'rim',
    likes: ['hand_looms', 'machine_parts', 'fuel_cells', 'ration_bars', 'salvage_lace'],
    dislikes: ['star_charts', 'medical_kits'],
    quirk: 'Skip the charter-talk. Bring a story, a spare part, or a willing pair of hands.',
    rumours: [
      'The Fleet of Thirteen Aprils has been in motion for four hundred years. Its map is a quilt, and its quilt is a map.',
      'A Drifter patched a hole in the hull with a bedspread. It still holds. The bedspread is now considered a hero.',
    ],
    emblem: 'needle and thread forming a ring',
  },
};

export const REP_TITLES = [
  { min: -100, label: 'Persona non grata' },
  { min: -60, label: 'Distrusted' },
  { min: -25, label: 'Cool' },
  { min: -5, label: 'Strangers' },
  { min: 10, label: 'Acquainted' },
  { min: 30, label: 'Friendly' },
  { min: 55, label: 'Trusted' },
  { min: 80, label: 'Honoured' },
];

export function repTitle(n) {
  let out = REP_TITLES[0].label;
  for (const t of REP_TITLES) if (n >= t.min) out = t.label;
  return out;
}
