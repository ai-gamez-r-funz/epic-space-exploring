// =============================================================================
// HALCYON REACH - content/story.js  (WORLD-B)
// Pure data, node-runnable. No DOM, no Pixi.
//
// EXPORTS
//   REGIONS          { regionId: { id, name, blurb, colour:0xRRGGBB, hue:0-360 (nebula tint), factions:[pref],
//                                  danger:0..3, weight (share of generated systems), music } }
//   STORY_SYSTEMS    [ hand-authored systems the generator MUST place (see shape below) ]
//   CHAPTERS         main arc "Who Lit the Lanterns", 5 chapters
//   FINALE           the closing choice (flags the final Lantern event must set)
//   ENDINGS          { id: { id, title, text, scoreBonus, kind, trigger, priority, conditions } }
//   ENDING_ORDER     ids in evaluation order (first match wins within a trigger)
//   INTRO_TEXT[]     opening crawl (<=5 short paragraphs)
//   TIPS[]           loading-screen / hint tips
//   RANKS            [ { minScore, title } ] ascending; last matching wins
//   STARTING_ITEMS   { itemId: qty }  (all difficulties)
//   STARTING_RESOURCES { cozy|standard|rigorous: { credits, fuel, supplies, hull, morale } }
//   ITEM_DEFS        { itemId: { id, name, desc, kind:'key'|'gift'|'artifact'|'tool' } }  display data for state.items
//
// STORY_SYSTEM SHAPE
//   { id,                    // story id, referenced by missions ("goto" selectors) and by System.story
//     region,                // REGIONS id
//     name, star,            // star type from CONTRACT section 1
//     faction,               // owning faction id or 'none'
//     hopsFromGate,          // approximate lane distance from the Gate system (generator hint; 0 = the gate system)
//     placement,             // 'gate' | 'core' (middle of region) | 'edge' (region fringe) | 'deep' (far from gate in region)
//     phenomena:[...],       // MUST include 'beacon' for Lantern sites
//     danger: 0..3,
//     planets:[ { name, type, size, ringed, moons, life, features:[...] } ],
//     station: null | { name, kind, faction, services:[...] },
//     lantern: null | 1..5,  // which Lantern this is; sets flag lantern_N via the Lantern events
//     start: bool,           // the game starts here
//     hook }                 // 1-2 sentence text shown on first arrival / in the map tooltip
//
// ENDING FIELDS
//   kind:     'main' | 'survey' | 'loss' | 'special'
//   trigger:  'story'  - engine checks on every arrival & event end
//             'survey' - engine checks when survey % changes (cartographer ends at 100%; ENGINE may also offer
//                        the medal at >=75% as a "retire now?" prompt)
//             'retire' - evaluated when the player picks "Retire the commission" (offered by ENGINE when docked at
//                        a Meridian station with survey >= 50, or at any time in Settings); picks the highest-priority
//                        matching special, else 'cartographer' if survey >= 75, else a gentle 'recalled'-style fallback
//             'loss'   - fired explicitly by the engine (hull<=0 -> recalled, morale<=0 -> resignation)
//   priority: higher wins when several match the same trigger
//   conditions: standard CONTRACT section 5 condition array (AND)
//
// FLAG CONTRACT (EVENTS authors set these; missions/endings read them)
//   chapter_1..chapter_5   set by the engine at newGame (chapter_1) and by CHAPTERS[].onStart
//   lantern_1..lantern_5   set by the Lantern events (investigating each beacon, in order)
//   archive_key            set by the Hollow Archive welcome event / mission m_archive_card
//   fellowship_known       set when the Archive ledger is read (chapter 3)
//   lantern_path_diplomat | lantern_path_curious | lantern_path_quiet   exactly one set by event 'lantern_5_invitation'
//                          (diplomat -> lantern_keeper, curious -> lantern_friend, quiet -> lantern_silent)
//   retire_ready           engine convenience, set when the retire prompt is open
// =============================================================================

export const REGIONS = {
  gate: {
    id: 'gate', name: 'The Gate Shallows',
    blurb: 'Sheltered, sunny water just inside the Gate. Meridian buoys wink in the dark and the charts are still damp.',
    colour: 0x3fb6a8, hue: 175, factions: ['concord'], danger: 0, weight: 0.16, music: 'bridge',
  },
  shoals: {
    id: 'shoals', name: 'The Brightwater Shoals',
    blurb: 'A crowded, cheerful scatter of trade stars where Quillari clans haggle across every lane and gossip travels faster than light.',
    colour: 0xe0a93b, hue: 38, factions: ['quillari', 'concord'], danger: 1, weight: 0.24, music: 'station',
  },
  veil: {
    id: 'veil', name: 'The Vesper Veil',
    blurb: 'A vast, gently glowing nebula where the Vesperine sing their cities into being. Please keep your engines polite.',
    colour: 0x9a6fd0, hue: 275, factions: ['vesperine'], danger: 2, weight: 0.20, music: 'wonder',
  },
  choir: {
    id: 'choir', name: 'The Pulsar Choir',
    blurb: 'A ring of pulsars keeping slow, patient time, with singing rifts folded between them. Beautiful, and occasionally bumpy.',
    colour: 0x5aa0e0, hue: 210, factions: ['vesperine', 'drifters'], danger: 3, weight: 0.16, music: 'tense',
  },
  archive: {
    id: 'archive', name: 'The Hollow Archive',
    blurb: 'A quiet cluster of cold, tidy stars tended by the machine librarians. Every moon has a shelf; every shelf has a question.',
    colour: 0xc9b78a, hue: 45, factions: ['archivists'], danger: 1, weight: 0.12, music: 'wonder',
  },
  rim: {
    id: 'rim', name: 'The Quiet Rim',
    blurb: 'The far edge of the survey, where drifter habitats wander between stars and the last Lantern keeps its long vigil.',
    colour: 0xd0705a, hue: 12, factions: ['drifters'], danger: 2, weight: 0.12, music: 'map',
  },
};

// -----------------------------------------------------------------------------
// STORY SYSTEMS (16)
// -----------------------------------------------------------------------------
export const STORY_SYSTEMS = [
  {
    id: 'gate_anchorage', region: 'gate', name: 'Gate Anchorage', star: 'yellow', faction: 'concord',
    hopsFromGate: 0, placement: 'gate', start: true, lantern: null, danger: 0,
    phenomena: ['wormhole'],
    planets: [
      { name: 'Anchorage I', type: 'barren', size: 0.7, ringed: false, moons: 0, life: 'none', features: ['ore'] },
      { name: 'Teacup', type: 'ocean', size: 1.0, ringed: false, moons: 1, life: 'microbial', features: ['hot_springs'] },
      { name: 'Anchorage III', type: 'gas', size: 1.8, ringed: true, moons: 2, life: 'none', features: [] },
    ],
    station: { name: 'Meridian Relay Halyard', kind: 'trade', faction: 'concord', services: ['trade', 'repair', 'missions', 'crew', 'shipyard'] },
    hook: 'The Gate hangs in the dark like a polished brass ring, and the Meridian relay hums beneath it. Everyone here is trying very hard not to look as excited as they are.',
  },
  {
    id: 'lyra_landing', region: 'gate', name: 'Lyra Landing', star: 'white', faction: 'concord',
    hopsFromGate: 1, placement: 'core', lantern: null, danger: 0,
    phenomena: [],
    planets: [
      { name: 'Landing', type: 'terran', size: 1.1, ringed: false, moons: 1, life: 'civilized', features: ['ruins'] },
      { name: 'Landing Rock', type: 'desert', size: 0.6, ringed: false, moons: 0, life: 'none', features: ['ore'] },
    ],
    station: { name: 'Concord Charter Hall', kind: 'embassy', faction: 'concord', services: ['diplomacy', 'missions', 'repair'] },
    hook: 'The Concord planted a flag, a fern, and a filing cabinet here on the first day. The fern is thriving.',
  },
  {
    id: 'lantern_wick', region: 'gate', name: 'Wickhaven', star: 'orange', faction: 'none',
    hopsFromGate: 2, placement: 'edge', lantern: 1, danger: 0,
    phenomena: ['beacon'],
    planets: [
      { name: 'Wickhaven Prime', type: 'ice', size: 0.9, ringed: false, moons: 0, life: 'none', features: ['ancient_signal'] },
      { name: 'Tallow', type: 'barren', size: 0.5, ringed: false, moons: 0, life: 'none', features: [] },
    ],
    station: null,
    hook: 'A small steady light burns in orbit where no light should be, pulsing in a rhythm that feels suspiciously like a greeting. It is the first Lantern, and it has been waiting a very long time to be noticed.',
  },
  {
    id: 'pennywhistle', region: 'shoals', name: 'Pennywhistle Exchange', star: 'binary', faction: 'quillari',
    hopsFromGate: 3, placement: 'core', lantern: null, danger: 1,
    phenomena: ['asteroids'],
    planets: [
      { name: 'Haggle', type: 'jungle', size: 1.2, ringed: false, moons: 2, life: 'civilized', features: ['ruins'] },
      { name: 'Tally', type: 'desert', size: 0.8, ringed: true, moons: 0, life: 'none', features: ['ore'] },
      { name: 'Bargain', type: 'ocean', size: 1.0, ringed: false, moons: 1, life: 'fauna', features: ['hot_springs'] },
    ],
    station: { name: 'The Grand Pennywhistle Bazaar', kind: 'trade', faction: 'quillari', services: ['trade', 'missions', 'crew', 'repair', 'diplomacy'] },
    hook: 'Two suns, four hundred stalls, and a sign reading "Prices Subject To Mood". Someone has already offered to buy your hat.',
  },
  {
    id: 'lantern_brightwater', region: 'shoals', name: 'Brightwater Light', star: 'white', faction: 'none',
    hopsFromGate: 4, placement: 'deep', lantern: 2, danger: 1,
    phenomena: ['beacon', 'comet'],
    planets: [
      { name: 'Lamplighter', type: 'ocean', size: 1.3, ringed: false, moons: 1, life: 'flora', features: ['aurora_fields'] },
      { name: 'Wake', type: 'gas', size: 1.6, ringed: false, moons: 0, life: 'none', features: [] },
    ],
    station: { name: 'Brightwater Slipway', kind: 'shipyard', faction: 'quillari', services: ['shipyard', 'repair', 'trade', 'missions'] },
    hook: 'The second Lantern floats above a drowned moon, throwing slow ribbons of gold across the water. Quillari traders leave small gifts on its dock and swear they never have.',
  },
  {
    id: 'hollin_rest', region: 'shoals', name: "Hollin's Rest", star: 'red', faction: 'concord',
    hopsFromGate: 3, placement: 'edge', lantern: null, danger: 1,
    phenomena: [],
    planets: [
      { name: 'Hollin', type: 'terran', size: 0.9, ringed: false, moons: 0, life: 'civilized', features: [] },
      { name: 'Cold Comfort', type: 'ice', size: 0.7, ringed: false, moons: 1, life: 'none', features: [] },
    ],
    station: { name: 'Hollin Colony Clinic', kind: 'outpost', faction: 'concord', services: ['repair', 'missions'] },
    hook: 'A small settlement of settlers, sneezes, and surprisingly good soup. Nothing here is dangerous, but everything here is damp.',
  },
  {
    id: 'cantabile', region: 'veil', name: 'Cantabile', star: 'blue', faction: 'vesperine',
    hopsFromGate: 5, placement: 'core', lantern: null, danger: 1,
    phenomena: ['nebula', 'aurora'],
    planets: [
      { name: 'First Chord', type: 'crystal', size: 1.1, ringed: true, moons: 1, life: 'civilized', features: ['ancient_signal'] },
      { name: 'Rest', type: 'ice', size: 0.6, ringed: false, moons: 0, life: 'none', features: [] },
    ],
    station: { name: 'Resonance Hall', kind: 'embassy', faction: 'vesperine', services: ['diplomacy', 'missions', 'trade'] },
    hook: 'The whole system hums in a major key. A Vesperine greeter shimmers politely and asks, in harmonics, that you kindly stop slamming doors.',
  },
  {
    id: 'lantern_veilglass', region: 'veil', name: 'Veilglass', star: 'red', faction: 'none',
    hopsFromGate: 6, placement: 'deep', lantern: 3, danger: 2,
    phenomena: ['beacon', 'nebula'],
    planets: [
      { name: 'Glasswing', type: 'crystal', size: 0.9, ringed: false, moons: 2, life: 'none', features: ['ruins'] },
      { name: 'Hush', type: 'toxic', size: 1.4, ringed: false, moons: 0, life: 'microbial', features: [] },
    ],
    station: null,
    hook: 'Inside a curtain of violet gas, the third Lantern glows like a night-light in a very large nursery. The nebula bends respectfully around it.',
  },
  {
    id: 'weathervane', region: 'veil', name: 'Weathervane', star: 'orange', faction: 'vesperine',
    hopsFromGate: 5, placement: 'edge', lantern: null, danger: 2,
    phenomena: ['ionstorm', 'nebula'],
    planets: [
      { name: 'Gust', type: 'gas', size: 1.9, ringed: true, moons: 3, life: 'none', features: [] },
      { name: 'Halfnote', type: 'crystal', size: 0.5, ringed: false, moons: 0, life: 'none', features: ['ore'] },
    ],
    station: { name: 'Weathervane Tuning Dock', kind: 'shipyard', faction: 'vesperine', services: ['shipyard', 'repair', 'missions'] },
    hook: 'A friendly storm that rearranges itself every few hours, which makes the Vesperine choir here very patient and the navigators very tired.',
  },
  {
    id: 'tessitura', region: 'choir', name: 'Tessitura', star: 'neutron', faction: 'none',
    hopsFromGate: 7, placement: 'core', lantern: 4, danger: 3,
    phenomena: ['beacon', 'pulsar', 'rift'],
    planets: [
      { name: 'Bass Clef', type: 'barren', size: 0.8, ringed: false, moons: 0, life: 'none', features: ['ancient_signal'] },
      { name: 'Treble', type: 'ice', size: 0.6, ringed: true, moons: 1, life: 'none', features: [] },
    ],
    station: null,
    hook: 'A pulsar ticks like a grandfather clock the size of a city. The fourth Lantern sits in its lee, keeping perfect time and, you suspect, a little amused by your instruments.',
  },
  {
    id: 'whispering_rift', region: 'choir', name: 'The Whispering Rift', star: 'white', faction: 'none',
    hopsFromGate: 7, placement: 'edge', lantern: null, danger: 3,
    phenomena: ['rift', 'derelict'],
    planets: [
      { name: 'Murmur', type: 'barren', size: 0.7, ringed: false, moons: 0, life: 'none', features: ['ancient_signal', 'ruins'] },
    ],
    station: null,
    hook: 'Space folds here like a page, and something on the other side is humming a half-remembered lullaby. Navigators are advised to hum back.',
  },
  {
    id: 'hollow_archive', region: 'archive', name: 'The Hollow Archive', star: 'white', faction: 'archivists',
    hopsFromGate: 6, placement: 'core', lantern: null, danger: 0,
    phenomena: [],
    planets: [
      { name: 'Reading Room', type: 'barren', size: 1.0, ringed: false, moons: 3, life: 'civilized', features: ['ruins', 'ancient_signal'] },
      { name: 'Stacks', type: 'ice', size: 0.8, ringed: true, moons: 0, life: 'none', features: [] },
      { name: 'Errata', type: 'desert', size: 0.5, ringed: false, moons: 0, life: 'none', features: [] },
    ],
    station: { name: 'Central Catalogue', kind: 'archive', faction: 'archivists', services: ['diplomacy', 'missions', 'trade', 'shipyard', 'repair'] },
    hook: 'Shelves the size of moons turn slowly in perfect order. A very polite machine asks whether you have come with a question, and whether it may keep it.',
  },
  {
    id: 'archive_heart', region: 'archive', name: 'Marginalia', star: 'orange', faction: 'archivists',
    hopsFromGate: 8, placement: 'deep', lantern: null, danger: 1,
    phenomena: ['derelict'],
    planets: [
      { name: 'Footnote', type: 'ice', size: 0.6, ringed: false, moons: 0, life: 'none', features: ['ancient_signal'] },
      { name: 'The Heart Vault', type: 'crystal', size: 1.2, ringed: false, moons: 1, life: 'none', features: ['ruins', 'ancient_signal'] },
    ],
    station: null,
    hook: 'At the Archive\'s innermost margin, a sealed vault holds the Fellowship Ledger. The librarians have never opened it, on the grounds that nobody ever asked politely enough.',
  },
  {
    id: 'long_table', region: 'rim', name: 'The Long Table', star: 'yellow', faction: 'drifters',
    hopsFromGate: 8, placement: 'core', lantern: null, danger: 1,
    phenomena: ['asteroids'],
    planets: [
      { name: 'Spindle', type: 'barren', size: 0.5, ringed: false, moons: 0, life: 'none', features: ['ore'] },
    ],
    station: { name: 'The Long Table', kind: 'habitat', faction: 'drifters', services: ['trade', 'missions', 'repair', 'crew', 'diplomacy', 'shipyard'] },
    hook: 'Forty habitats lashed together into one enormous dinner party. There is always a chair for you, provided you can tell a story.',
  },
  {
    id: 'lantern_taper', region: 'rim', name: 'Last Taper', star: 'blackhole', faction: 'none',
    hopsFromGate: 9, placement: 'deep', lantern: 5, danger: 3,
    phenomena: ['beacon', 'wormhole'],
    planets: [
      { name: 'Vigil', type: 'ocean', size: 1.0, ringed: false, moons: 1, life: 'fauna', features: ['aurora_fields', 'ancient_signal'] },
      { name: 'Ember', type: 'lava', size: 0.7, ringed: false, moons: 0, life: 'none', features: ['hot_springs'] },
    ],
    station: null,
    hook: 'The last Lantern burns beside a sleeping black hole like a candle in a very large window. Its light is steady, patient, and unmistakably addressed to you.',
  },
  {
    id: 'probes_rest', region: 'choir', name: "Probe's Rest", star: 'orange', faction: 'none',
    hopsFromGate: 6, placement: 'edge', lantern: null, danger: 2,
    phenomena: ['asteroids', 'comet'],
    planets: [
      { name: 'Wrinkle', type: 'ice', size: 0.6, ringed: false, moons: 0, life: 'none', features: [] },
      { name: 'Little Dipper', type: 'barren', size: 0.4, ringed: false, moons: 0, life: 'none', features: ['ore'] },
    ],
    station: { name: 'Salvage-Rest Yard', kind: 'shipyard', faction: 'drifters', services: ['shipyard', 'repair', 'trade', 'missions'] },
    hook: 'A quiet system with a small, patient robot drifting among the rocks, still dutifully transmitting a weather report nobody has asked for in years. A drifter salvage yard has set up nearby, mostly to be near the robot.',
  },
  {
    id: 'meridian_docks', region: 'gate', name: 'Dockside Bell', star: 'yellow', faction: 'none',
    hopsFromGate: 1, placement: 'edge', lantern: null, danger: 0,
    phenomena: ['asteroids'],
    planets: [
      { name: 'Bell', type: 'barren', size: 0.6, ringed: false, moons: 0, life: 'none', features: ['ore'] },
    ],
    station: { name: 'Meridian Society Drydock Bell', kind: 'shipyard', faction: 'concord', services: ['shipyard', 'repair', 'trade'] },
    hook: 'A cheerful drydock hung between rocks, ringing a ship-bell every time a hull is fitted. They ring it a lot.',
  },
];

// -----------------------------------------------------------------------------
// THE MAIN ARC: "WHO LIT THE LANTERNS"
// -----------------------------------------------------------------------------
export const CHAPTERS = [
  {
    n: 1, id: 'a_match_in_the_dark', title: 'A Match in the Dark', flag: 'chapter_1',
    etaDays: [3, 12], steps: [{ text: 'Chapter open', cond: [{ flag: 'chapter_1' }] }, { text: 'Lantern 1 answered', cond: [{ flag: 'lantern_1' }] }],
    hint: 'about 2 hops from the Gate',
    gate: [], // active from day 1
    onStart: [{ flag: 'chapter_1' }],
    hookMission: 'm_first_light', leadMissions: ['m_first_light', 'm_ch1_wickhaven'],
    lantern: 'lantern_wick',
    completeWhen: [{ flag: 'lantern_1' }],
    onComplete: [{ flag: 'chapter_1_done' }, { codex: 'the_lanterns' }],
    journal: 'A patient little light is burning at Wickhaven, about 2 hops from the Gate: a day or two of travel. Take the "Lamp at Wickhaven" job at Gate Anchorage, fly there, and use Investigate on the beacon.',
    journalDone: 'The first Lantern said hello. It pointed onward, toward the Brightwater Shoals.',
    reveal: 'A lamp is burning beyond the Gate, and it answers hails with a pattern of light that is clearly a greeting. Someone, long ago, left a light on.',
  },
  {
    n: 2, id: 'the_welcome_lamps', title: 'The Welcome Lamps', flag: 'chapter_2',
    etaDays: [8, 20], steps: [{ text: 'Chapter open', cond: [{ flag: 'chapter_2' }] }, { text: 'Lantern 2 answered', cond: [{ flag: 'lantern_2' }] }],
    hint: 'about 4 hops from the Gate, past Pennywhistle Exchange in the Shoals',
    gate: [{ flag: 'lantern_1' }, { survey: 8 }],
    onStart: [{ flag: 'chapter_2' }],
    leadMissions: ['m_ch2_brightwater', 'm_archive_card'],
    lantern: 'lantern_brightwater',
    completeWhen: [{ flag: 'lantern_2' }],
    onComplete: [{ flag: 'chapter_2_done' }],
    journal: 'The first Lantern pointed toward the Brightwater Shoals. Chart a little more of the Reach (8% survey), then look for a second beacon, Brightwater Light, about 4 hops from the Gate, just beyond Pennywhistle Exchange. The Archive (a scholarly cluster in the north) knows this notation too.',
    journalDone: 'The second Lantern is a chart, one page of a longer trail of breadcrumbs.',
    reveal: 'The second Lantern projects a star chart pointing onward, one page of a longer route. The Lanterns are not warnings or weapons. They are signposts, and they are laid out like a trail of breadcrumbs.',
  },
  {
    n: 3, id: 'what_the_archive_remembers', title: 'What the Archive Remembers', flag: 'chapter_3',
    etaDays: [14, 30], steps: [{ text: 'Chapter open', cond: [{ flag: 'chapter_3' }] }, { text: 'Lantern 3 answered', cond: [{ flag: 'lantern_3' }] }],
    hint: 'about 6 hops out, deep in the Veil (or 5-6 hops to the Archive)',
    gate: [{ flag: 'lantern_2' }, { survey: 18 }],
    onStart: [{ flag: 'chapter_3' }],
    leadMissions: ['m_ch3_veilglass', 'm_ch3_ledger'],
    lantern: 'lantern_veilglass',
    completeWhen: [{ flag: 'lantern_3' }],
    onComplete: [{ flag: 'chapter_3_done' }],
    journal: 'The third Lantern hides in the violet Vesper Veil, at Veilglass, about 6 hops from the Gate. In the quiet Hollow Archive, a sealed ledger at Marginalia may say who built them. Either path moves the story on.',
    journalDone: 'A name at last: the Open Sky Fellowship. They were an NGO, too.',
    reveal: 'In the Archive Ledger, a name finally appears: the Open Sky Fellowship, a vanished fleet of elder cartographers, interpreters and relief workers. They were an NGO. They were, in other words, the Meridian Society of their own age.',
  },
  {
    n: 4, id: 'the_fellowships_last_letter', title: "The Fellowship's Last Letter", flag: 'chapter_4',
    etaDays: [18, 36], steps: [{ text: 'Chapter open', cond: [{ flag: 'chapter_4' }] }, { text: 'Lantern 4 answered', cond: [{ flag: 'lantern_4' }] }],
    hint: 'about 7 hops out, in the Pulsar Choir',
    gate: [{ flag: 'lantern_3' }, { survey: 28 }],
    onStart: [{ flag: 'chapter_4' }],
    leadMissions: ['m_ch4_tessitura'],
    lantern: 'tessitura',
    completeWhen: [{ flag: 'lantern_4' }],
    onComplete: [{ flag: 'chapter_4_done' }],
    journal: 'The fourth Lantern ticks beside a neutron star at Tessitura, in the Pulsar Choir, about 7 hops from the Gate. Expect a bumpy ride; bring a pilot, fuel to spare, and patience.',
    journalDone: 'The Fellowship did not vanish. They sailed on and left the porch light burning.',
    reveal: 'The pulsar sings a letter in slow time. The Fellowship did not vanish in disaster; they grew old, retired, and sailed on, leaving a lamp at every harbour with the porch light on and the kettle warm for whoever came next.',
  },
  {
    n: 5, id: 'the_welcome_mat', title: 'The Welcome Mat', flag: 'chapter_5',
    etaDays: [24, 45], steps: [{ text: 'Chapter open', cond: [{ flag: 'chapter_5' }] }, { text: 'Lantern 5 answered', cond: [{ flag: 'lantern_5' }] }],
    hint: 'about 9 hops out, toward the Quiet Rim',
    gate: [{ flag: 'lantern_4' }, { survey: 40 }],
    onStart: [{ flag: 'chapter_5' }],
    leadMissions: ['m_ch5_last_taper'],
    lantern: 'lantern_taper',
    completeWhen: [{ flag: 'lantern_5' }],
    onComplete: [{ flag: 'chapter_5_done' }],
    journal: 'The last Lantern burns at Last Taper on the far Quiet Rim, about 9 hops from the Gate, beside a sleeping black hole. The drifters at the Long Table know the way. It will ask you a question; answer it kindly.',
    journalDone: 'You answered the last Lantern. Whatever you chose, the Reach will remember it.',
    reveal: 'The last Lantern asks one question, kindly, in every language you know: now that you have found the welcome mat, what would you like to do with it? The Fellowship left the answer entirely up to you.',
  },
];

// The final choice. EVENTS' 'lantern_5_invitation' offers three answers and sets the matching path flag.
export const FINALE = {
  event: 'lantern_5_invitation',
  setsAlways: ['lantern_5'],
  choices: {
    keep: { flag: 'lantern_path_diplomat', ending: 'lantern_keeper', blurb: 'Keep the Lanterns lit and open them to everyone, negotiated and shared among all five peoples.' },
    carry: { flag: 'lantern_path_curious', ending: 'lantern_friend', blurb: 'Carry the flame outward and light new lamps in other sectors, for whoever comes next.' },
    dark: { flag: 'lantern_path_quiet', ending: 'lantern_silent', blurb: 'Let the Lanterns rest. Leave them dark, silent and undisturbed, as a gift of respect.' },
  },
};

// -----------------------------------------------------------------------------
// ENDINGS (8)
// -----------------------------------------------------------------------------
export const ENDINGS = {
  cartographer: {
    id: 'cartographer', kind: 'survey', trigger: 'survey', priority: 10, scoreBonus: 500,
    blurb: "Earned by charting every system in the Reach. The map is the prize.",
    title: "The Cartographer's Medal",
    text: 'The last blank on the chart fills in with a felt-tip flourish, and the Meridian Society strikes a medal for the occasion. The Lantern Reach has a map now, and every pilot who follows will thank a ship they never met. Somewhere out there, the Lanterns glow a little brighter, as though a page has been turned.',
    conditions: [{ survey: 100 }],
  },
  lantern_keeper: {
    id: 'lantern_keeper', kind: 'main', trigger: 'story', priority: 100, scoreBonus: 1200,
    blurb: "Earned by answering the last Lantern with diplomacy: keep the lamps lit and share them with everyone.",
    title: 'Keeper of the Lanterns',
    text: 'You and the five peoples sign the Lantern Accord on the observation-lounge table, with tea. The lamps stay lit, shared by all, with their light tended by a rotating council of cooks, clerks and choirs. The Fellowship wanted a welcome mat. You gave it a doorbell, a guest book, and a very long guest list.',
    conditions: [{ flag: 'lantern_5' }, { flag: 'lantern_path_diplomat' }],
  },
  lantern_friend: {
    id: 'lantern_friend', kind: 'main', trigger: 'story', priority: 100, scoreBonus: 1400,
    blurb: "Earned by answering the last Lantern with curiosity: carry the flame to other sectors.",
    title: 'Friend of the Flame',
    text: 'You take a spark from the last Lantern and Halcyon becomes a lamplighter, sailing past the edge of the chart with a hold full of small bright seeds. Far beyond the Reach, a new light flickers on above a strange world, and someone looks up. You are, you suspect, now the Fellowship.',
    conditions: [{ flag: 'lantern_5' }, { flag: 'lantern_path_curious' }],
  },
  lantern_silent: {
    id: 'lantern_silent', kind: 'main', trigger: 'story', priority: 100, scoreBonus: 1100,
    blurb: "Earned by answering the last Lantern with respect: leave the lamps dark and undisturbed.",
    title: 'The Quiet Respect',
    text: 'You dim the console lights, thank the Lanterns aloud, and turn away. The lamps fall softly dark one by one, undisturbed, their long vigil honoured and ended with grace. The Reach is yours to chart but not to claim, and the silence behind you sounds a great deal like a gentle goodnight.',
    conditions: [{ flag: 'lantern_5' }, { flag: 'lantern_path_quiet' }],
  },
  merchant_prince: {
    id: 'merchant_prince', kind: 'special', trigger: 'retire', priority: 60, scoreBonus: 800,
    blurb: "Earned by retiring with 9,000 scrip or more.",
    title: 'The Merchant Prince of the Reach',
    text: 'Halcyon retires with a hold full of brandy, a purse full of scrip, and a suspiciously good reputation among accountants. The Quillari name a gaudy hall after you, and the Concord quietly adjust their tariffs in your honour. The Meridian Society accepts your very large donation with a beaming, only slightly baffled, smile.',
    conditions: [{ credits: 9000 }],
  },
  beloved_by_all: {
    id: 'beloved_by_all', kind: 'special', trigger: 'retire', priority: 70, scoreBonus: 1000,
    blurb: "Earned by reaching 35 standing with all five peoples before retiring.",
    title: 'Beloved by All Peoples',
    text: 'At your retirement dinner, five delegations argue amiably about who gets to sit nearest. A Vesperine sings your name, an Archivist files it, and a drifter weaves it into a story that will outlast the ship. No one can remember a captain who made so many friends and lost so few.',
    conditions: [{ rep: { concord: 35 } }, { rep: { quillari: 35 } }, { rep: { vesperine: 35 } }, { rep: { archivists: 35 } }, { rep: { drifters: 35 } }],
  },
  wanderer: {
    id: 'wanderer', kind: 'special', trigger: 'retire', priority: 20, scoreBonus: 400,
    blurb: "The default retirement: at least 30% surveyed, a full tea tin, and no particular regrets.",
    title: 'The Contented Wanderer',
    text: 'You never did finish the map, and nobody minds. Halcyon spends her best years drifting from harbour to harbour, trading stories for fuel and fuel for sunsets. The charts are a little blotchy, but the tea is always warm.',
    conditions: [{ survey: 30 }],
  },
  rival_friend: {
    id: 'rival_friend', kind: 'special', trigger: 'retire', priority: 54, scoreBonus: 700,
    title: 'Partners in Open Skies',
    text: 'Captain Tamsin Vell started as your rival and ended as the best friend your ledger ever had. You retire together, two old free-traders with a shared teapot and a combined route map that nobody else can read. Halcyon and the Marigold fly their last run in formation, and the Society pins a ribbon on both.',
    blurb: 'Earned by befriending the rival free-trader through all three of her jobs and retiring at a Meridian station.',
    conditions: [{ any: [{ flag: 'rival_friend' }, { flag: 'rival_ally' }] }],
  },
  archive_scholar: {
    id: 'archive_scholar', kind: 'special', trigger: 'retire', priority: 55, scoreBonus: 800,
    title: 'Scholar of the Hollow Archive',
    text: 'The Archive asks you to stay. You are given a desk, a lamp, a very polite assistant, and a standing invitation to ask whatever you like. You spend your last years cataloguing the questions you never finished asking, and the machines file every one with obvious delight.',
    blurb: 'Earned by finishing the Archivists\' three favours and retiring while their goodwill is high.',
    conditions: [{ flag: 'archive_scholar' }],
  },
  drifter_adoption: {
    id: 'drifter_adoption', kind: 'special', trigger: 'retire', priority: 56, scoreBonus: 800,
    title: 'Adopted by the Long Table',
    text: 'At the retirement feast, an elder ties a story knot around your wrist and declares you drifter-kin. Halcyon is lashed to the Long Table with the rest of the fleet, her crew given bunks, her captain given a chair. Every winter, someone tells the tale of how you arrived, and every year it gets a little taller.',
    blurb: 'Earned by finishing the Drifters\' three favours and retiring with their friendship.',
    conditions: [{ flag: 'drifter_adopted' }],
  },
  lantern_pilgrim: {
    id: 'lantern_pilgrim', kind: 'special', trigger: 'retire', priority: 40, scoreBonus: 500,
    title: 'Pilgrim of the Lamps',
    text: 'You never reached the last Lantern, but you carried the first three in your heart. You retire with a shard in your pocket, a half-finished theory about the Fellowship, and an open invitation for whoever comes next to finish the trail. The lamps burn on, and so does the question.',
    blurb: 'Earned by finding at least the first three Lanterns and then retiring before the story is finished.',
    conditions: [{ flag: 'lantern_3' }],
  },
  chart_laureate: {
    id: 'chart_laureate', kind: 'special', trigger: 'retire', priority: 50, scoreBonus: 650,
    title: 'Laureate of the Chart',
    blurb: 'Earned by charting most of the Reach (60%+) and retiring before the Lanterns are fully understood.',
    text: 'You retire with the finest hand-lettered atlas the Society has ever seen, half of it still smelling of felt-tip and cardamom. The Lanterns remain a mystery in the margins, and you leave a note there for the next captain: "Ask politely." The Society names a lecture hall after the Halcyon.',
    conditions: [{ survey: 60 }, { notFlag: 'lantern_3' }],
  },
  friend_of_the_choir: {
    id: 'friend_of_the_choir', kind: 'special', trigger: 'retire', priority: 48, scoreBonus: 600,
    title: 'Friend of the Choir',
    blurb: 'Earned by winning the Vesperine\'s deep goodwill (30+ standing) and retiring at 50%+ survey.',
    text: 'At your farewell, the Vesperine choirs sing your name as a rest, the highest compliment their music has. The harmonics hang in the air long after the last guest has gone home. You leave Halcyon quietly, as one leaves a very large, very warm concert.',
    conditions: [{ rep: { vesperine: 30 } }],
  },
  quiet_gardener: {
    id: 'quiet_gardener', kind: 'special', trigger: 'retire', priority: 46, scoreBonus: 550,
    title: 'The Quiet Gardener',
    blurb: 'Earned by running the Lamplight Festival and keeping the crew happy (morale 70+) before retiring.',
    text: 'You retire to a small orbital greenhouse near the Gate, where you grow tomatoes for the festival and tea for the Society. Your old crew visit on holidays, and Gus-7 pointedly corrects your pruning. It is, everybody agrees, exactly the right size of life.',
    conditions: [{ flag: 'festival_chain_done' }, { morale: 70 }],
  },
  honest_mapmaker: {
    id: 'honest_mapmaker', kind: 'special', trigger: 'retire', priority: 32, scoreBonus: 450,
    title: 'The Honest Mapmaker',
    blurb: 'Earned by retiring with at least half the Reach charted and no grand storyline behind you. A job honestly done.',
    text: 'You hang up the commission with half the Reach in ink and the rest in good faith. The Society sends a small, sincere certificate and a larger, less sincere cake. Somewhere, a young navigator opens your charts, finds a safe lane through an unfriendly nebula, and silently says thank you.',
    conditions: [{ survey: 50 }],
  },
  comfortable_captain: {
    id: 'comfortable_captain', kind: 'special', trigger: 'retire', priority: 33, scoreBonus: 500,
    title: 'A Comfortable Captain',
    blurb: 'Earned by retiring with 3,000+ scrip in hand and at least half the Reach charted.',
    text: 'You retire to a small, well-lit house near the Gate with a view of the ring, a pantry of good brandy, and a reputation for fair dealing. The neighbours bring pastries. The charts on your wall are not complete, but they are yours, and every inked line has a story.',
    conditions: [{ survey: 50 }, { credits: 3000 }],
  },
  recalled: {
    id: 'recalled', kind: 'loss', trigger: 'loss', priority: 5, scoreBonus: 0,
    blurb: "The ship was disabled and towed home. Nobody minds; the score is simply smaller.",
    title: 'Recalled to Meridian',
    text: 'Halcyon limps into the tow-line of a Meridian tender, creaking and apologetic. The Society is not cross; they are mostly relieved, and slightly alarmed by the paint. You will be back out there, with a new hull and an old story.',
    conditions: [],
  },
  resignation: {
    id: 'resignation', kind: 'loss', trigger: 'loss', priority: 5, scoreBonus: 0,
    blurb: "The crew requested shore leave. Morale is a resource, too.",
    title: 'A Long, Well-Earned Leave',
    text: 'The crew send a polite petition, signed in six colours of ink, requesting shore leave and a large cake. The captain agrees at once. Whatever comes next for the Reach, it can wait until everyone has had a proper night\'s sleep.',
    conditions: [],
  },
};

export const ENDING_ORDER = [
  'lantern_keeper', 'lantern_friend', 'lantern_silent',
  'beloved_by_all', 'merchant_prince', 'drifter_adoption', 'archive_scholar', 'rival_friend', 'chart_laureate', 'friend_of_the_choir', 'quiet_gardener', 'lantern_pilgrim', 'comfortable_captain', 'honest_mapmaker', 'cartographer', 'wanderer',
  'recalled', 'resignation',
];

// -----------------------------------------------------------------------------
export const INTRO_TEXT = [
  'Stardate 2461. After three hundred years of patient staring, the Gate has opened onto a new corner of the galaxy: the Lantern Reach. No one knows what is out there, but the first probes reported warm light and no one shouting.',
  'The Meridian Society for Open Skies, an unarmed society of cartographers, relief workers and interpreters, has chartered one ship for the job. It is old, comfortable, and smells faintly of cardamom.',
  'You are her captain. Your crew has a slide rule, a kettle, and a very good feeling. Your orders are simple: map what you can, help whoever you meet, and make an honest living between the lines.',
  'Out in the dark, scattered like porch lights, are the Lanterns. Nobody knows who lit them, or why. Somebody has left the light on.',
  'Go gently. Say please. Bring tea.',
];

export const TIPS = [
  'Charting a system means visiting it and scanning every planet. Survey percentage is what opens the later chapters of the story.',
  'Fuel is life. Never jump without checking the fuel cost on the map, and keep a spare jump in reserve.',
  'The Quillari love haggling. Bring a diplomat to the table, and always counter the first offer.',
  'Vesperine dislike loud noises. A quiet approach with engines low earns more than any bribe.',
  'The Archivists answer only the question you ask, exactly as asked. Choose your words with care.',
  'Drifters trust people who tell stories. Say yes when they offer you a seat.',
  'The Concord adore paperwork. A filed form is a friendly gesture.',
  'Every faction has a short chain of favours. Finish three, and they will give you something unusual.',
  'Hovering in a system with a beacon is perfectly safe, and perhaps a little moving.',
  'Planets with ruins reward landing parties, but some are best seen through the viewscreen. Check your odds before you beam down.',
  'Crew morale is a quiet resource. Tea in the lounge and a good conversation mend more than repair crews do.',
  'A skill check shows its odds. A better officer, or the right upgrade, improves them.',
  'No fight is ever required. Every problem here has a gentler solution, and usually a funnier one.',
  'Stuck without fuel? Meridian will send a tender. It costs scrip and pride, but never the whole game.',
  'Prices rise where goods are scarce and fall where they are plentiful. Look for the trend arrows.',
  'Medical kits sell for little in the Shoals and are treasured at the Rim. Think about the whole map.',
  'Timed missions have generous deadlines, but they do not wait forever. The calendar is a gentle tyrant.',
  'Secret missions appear only after you learn something. The codex is a good place to wonder what you have missed.',
  'The Codex fills in as you scan and talk. Reading it often points to a new place or a new question.',
  'A good ear for rhythm helps at the pulsars. The Choir keeps time.',
  'Ionstorms are best crossed slowly, with a pilot who is paying attention and a crew who are not looking out the window.',
  'Upgrades are slotted. Replace the old with the new in the same slot, and sell the original at half price.',
  'The Lanterns do not move, and they do not mind waiting. Visit them in order if you want the story to make sense.',
  'You can rest in orbit to recover morale. It costs supplies, but it does wonders for the mood.',
  'Gifts matter. A tin of tea, a feather, or a song can open a closed door.',
  'If a conversation turns awkward, try the polite option first. It is usually the funniest, too.',
  'The Whispering Rift likes it when you hum back.',
  'Retire at the Relay when you are ready. The best endings depend on how you treated everyone along the way.',
  'The Meridian Society is very proud of you. They have not yet said so, but they are.',
  'Your first target: chart three systems near the Gate. The director at Gate Anchorage will pay you for it.',
  'Press Chart, click a system, press Jump. That is the whole game, plus tea.',
  'Stations hold mission boards. Re-check them each week; the jobs change.',
  'Jobs with a deadline are generous, but a lapsed deadline costs a little standing. Abandon what you cannot do.',
  'Rare goods (aurora silk, lantern glass, antiserum) have bounty jobs that pay far above market. Keep an eye out.',
  'The rival trader Captain Vell is competitive but fair. Be gracious, and she may become a friend.',
  'Distress beacons are optional, but they pay in standing and gratitude. Stranded folk remember who stopped.',
  'The festival jobs are the coziest in the Reach. Try them when you need a rest from surveying.',
  'The log pins your main story step. If you are lost, read it again; it always says where to go next.',
  'Retire only when you are ready. Not every good ending is the one with the biggest map.',
];


// First-minutes / contextual tips. Keyed by situation so the UI can show the right one at the right time.
// UI: show a tip when the situation first occurs (once per game), then fall back to TIPS in loading screens.
export const CONTEXT_TIPS = {
  first_bridge: 'Welcome aboard. The big round viewscreen shows where you are. Open the Chart (C) to see where you could go next.',
  first_chart: 'Click a glowing system, then Jump. The line shows fuel and days. Dim dots are only rumours until you visit.',
  first_jump: 'Every jump burns fuel and a few days. Stations sell fuel; gas giants and comets sometimes give some away.',
  first_arrival: 'Arrived. Scan the planets (S) to chart the system. Charting is what the Society pays for, and it opens the later chapters.',
  first_orbit: 'To study a different planet, click it first, then Scan. Leaving orbit is only needed to land somewhere else.',
  first_scan: 'Scanning takes a day and a little supplies. A fully scanned system counts as charted.',
  first_station: 'A station! Dock to trade, refuel, repair, hire crew, and pick up jobs from the mission board.',
  first_trade: 'Buy where a good is CHEAP, sell where it is DEAR. The trend arrows and percentages show the best bets.',
  first_mission: 'Open the Log to see your active jobs. The arrow beside each objective points to where you need to go.',
  first_main_story: 'Your main story job is pinned at the top of the Log: "Who Lit the Lanterns". Follow it at your own pace.',
  first_crew: 'Your crew help with skill checks. Hover a choice to see which officer lends a hand, and your odds.',
  low_fuel: 'Fuel is getting low. Head for a station, or look for a comet or gas giant. If you do run dry, Meridian will send a tender.',
  low_supplies: 'Supplies are running down. Restock at a station, or rest less and travel more efficiently.',
  low_morale: 'The crew are glum. A rest in a quiet system, a good event, or a visit to a hot spring will lift the mood.',
  first_lantern: 'You have found a Lantern. Use Investigate on the beacon (it is safe, and quite moving).',
  retire_ready: 'You have surveyed enough to retire at a Meridian station. The ending depends on who you befriended, not just how much you mapped.',
};

export const RANKS = [
  { minScore: 0, title: 'Probationary Cartographer' },
  { minScore: 300, title: 'Junior Survey Officer' },
  { minScore: 800, title: 'Lieutenant of Open Skies' },
  { minScore: 1500, title: 'Commander of the Reach' },
  { minScore: 2500, title: 'Captain of the Lantern Reach' },
  { minScore: 3800, title: 'Senior Captain, Meridian Society' },
  { minScore: 5500, title: 'Commodore of Open Skies' },
  { minScore: 8000, title: 'Admiral of the Lamplight' },
];

export const STARTING_ITEMS = {
  meridian_commission: 1,
  sector_charts: 2,
  tea_tin: 3,
  felt_tip_set: 1,
};

export const STARTING_RESOURCES = {
  cozy:     { credits: 500, fuel: 40, supplies: 40, hull: 100, morale: 90 },
  standard: { credits: 300, fuel: 30, supplies: 30, hull: 100, morale: 80 },
  rigorous: { credits: 150, fuel: 22, supplies: 22, hull: 90,  morale: 70 },
};

export const ITEM_DEFS = {
  meridian_commission: { id: 'meridian_commission', name: 'Meridian Commission', kind: 'key', desc: 'Your letters of introduction, signed in four colours of ink. Opens polite doors.' },
  sector_charts: { id: 'sector_charts', name: 'Sector Charts', kind: 'gift', desc: 'Felt-tip star charts. Traders will happily pay in friendship.' },
  tea_tin: { id: 'tea_tin', name: 'Tin of Meridian Tea', kind: 'gift', desc: 'A small round tin. Universally understood as a gesture of goodwill.' },
  felt_tip_set: { id: 'felt_tip_set', name: 'Felt-Tip Set', kind: 'tool', desc: 'Twelve colours for hand-annotating charts. Morale in a box.' },
  lantern_shard: { id: 'lantern_shard', name: 'Lantern Shard', kind: 'artifact', desc: 'A warm glass sliver shed by a Lantern. It hums when it is near another.' },
  archive_reader_card: { id: 'archive_reader_card', name: 'Archive Reader Card', kind: 'key', desc: 'A laminated card granting reading privileges at the Hollow Archive. Return by the due date, or at least say sorry.' },
  concord_charter_seal: { id: 'concord_charter_seal', name: 'Concord Charter Seal', kind: 'key', desc: 'A heavy brass stamp that makes any form feel official.' },
  quillari_guest_feather: { id: 'quillari_guest_feather', name: 'Guest Feather', kind: 'gift', desc: 'A long russet feather. Wear it, and any Quillari hearth is yours.' },
  vesperine_tuning_fork: { id: 'vesperine_tuning_fork', name: 'Silver Tuning Fork', kind: 'tool', desc: 'Sounds a pure A. Calms Vesperine and cats.' },
  drifter_story_knot: { id: 'drifter_story_knot', name: 'Story Knot', kind: 'gift', desc: 'A knotted cord that remembers one tale per knot. Handle with respect.' },
  probe_black_box: { id: 'probe_black_box', name: 'Probe Memory Core', kind: 'artifact', desc: 'A small dented core, still faintly warm. It remembers every sunrise it saw.' },
  festival_ribbon: { id: 'festival_ribbon', name: 'Festival Ribbon', kind: 'gift', desc: 'A bright ribbon tied to your mast. Guarantees smiles at the next three harbours.' },
  mediators_gavel: { id: 'mediators_gavel', name: "Mediator's Gavel", kind: 'tool', desc: 'A wooden gavel with a soft felt head. It has never been used to hit anything.' },
  fellowship_token: { id: 'fellowship_token', name: 'Fellowship Token', kind: 'artifact', desc: 'A small blue disc stamped with an open eye and a lamp. The oldest membership card in the galaxy.' },
  gossip_pin: { id: "gossip_pin", name: "Gossip Pin", kind: "gift", desc: "A tiny enamel pin that Quillari wear to show they are open to news." },
  choir_reed: { id: "choir_reed", name: "Choir Reed", kind: "gift", desc: "A hollow reed that sings a pure note when blown. A Vesperine keepsake." },
  riddle_coin: { id: "riddle_coin", name: "Riddle Coin", kind: "gift", desc: "An Archivist coin with a question on each face. Neither has an answer on the back." },
  concord_stamp: { id: "concord_stamp", name: "Concord Stamp", kind: "key", desc: "A rubber stamp that says APPROVED in three languages." },
  toll_token: { id: "toll_token", name: "Toll Token", kind: "gift", desc: "A brass token proving you paid a Quillari toll. Good for a free cup of tea." },
  lantern_sprig: { id: "lantern_sprig", name: "Lantern Sprig", kind: "artifact", desc: "A sprig of glowing plant growing from a Lantern." },
  pulsar_tape: { id: "pulsar_tape", name: "Pulsar Tape", kind: "artifact", desc: "A reel of tape recorded from a pulsar broadcast." },
  storm_glass: { id: "storm_glass", name: "Storm Glass", kind: "artifact", desc: "A glass that clouds before an ionstorm." },
  ghost_log_cube: { id: "ghost_log_cube", name: "Ghost-Log Cube", kind: "artifact", desc: "A small cube replaying a derelict ship's last log, politely." },
  aurora_thread: { id: "aurora_thread", name: "Aurora Thread", kind: "artifact", desc: "A fine thread of shimmering light spun by aurora-beings." },
  story_knot: { id: "story_knot", name: "Story Knot", kind: "gift", desc: "A drifter knot-cord, one tale per knot." },
  rift_chime: { id: "rift_chime", name: "Rift Chime", kind: "artifact", desc: "A chime that rings when near a singing rift." },
  ice_chime: { id: "ice_chime", name: "Ice Chime", kind: "artifact", desc: "A chime carved from singing ice." },
  polite_seed: { id: "polite_seed", name: "Polite Seed", kind: "gift", desc: "A seed from a courteous plant. It will grow, and say thank you." },
  kelp_lantern: { id: "kelp_lantern", name: "Kelp Lantern", kind: "gift", desc: "A small lantern woven from living kelp, glowing a soft green." },
  tea_sample: { id: "tea_sample", name: "Tea Sample", kind: "gift", desc: "A sealed vial of unusual tea. Sample responsibly." },
  keeper_lens: { id: "keeper_lens", name: "Keeper's Lens", kind: "artifact", desc: "A polished lens from the lighthouse robot's beacon." },
  door_token: { id: "door_token", name: "Door Token", kind: "key", desc: "A brass token that persuades polite doors." },
  luggage_tag: { id: "luggage_tag", name: "Luggage Tag", kind: "gift", desc: "A well-travelled tag with fifty stamps and a handwritten Thank you." },
  theremin_reel: { id: "theremin_reel", name: "Theremin Reel", kind: "gift", desc: "A recording of a very old theremin concert." },
  recipe_card: { id: "recipe_card", name: "Recipe Card", kind: "gift", desc: "A handwritten recipe card, with notes in the margins and a thumbprint of jam." },
  auntie_patch: { id: "auntie_patch", name: "Auntie's Patch", kind: "gift", desc: "A hand-sewn patch from a drifter auntie. Brings luck, or at least comfort." },
  comet_ice: { id: "comet_ice", name: "Comet Ice", kind: "gift", desc: "A jar of fresh comet ice. Makes excellent tea." },
  vell_calling_card: { id: 'vell_calling_card', name: "Vell's Calling Card", kind: 'gift', desc: 'A scented card from Captain Tamsin Vell: "Meet me anywhere there is tea." A rival\'s highest compliment.' },
  scholars_pin: { id: 'scholars_pin', name: "Scholar's Pin", kind: 'key', desc: 'A tiny brass pin shaped like a question mark. Archivists nod when they see it.' },
  drifter_kin_cord: { id: 'drifter_kin_cord', name: 'Kin Cord', kind: 'gift', desc: 'A braided cord worn only by drifter-kin. Every habitat will light a lamp for you.' },
  festival_bunting: { id: 'festival_bunting', name: 'Festival Bunting', kind: 'gift', desc: 'A long string of paper pennants. Brightens any bridge.' },
  rare_chart_fragment: { id: 'rare_chart_fragment', name: 'Old Chart Fragment', kind: 'artifact', desc: 'A torn corner of a chart in the Fellowship\'s hand. The ink is still wet, somehow.' },
  distress_medal: { id: 'distress_medal', name: 'Meridian Rescue Medal', kind: 'artifact', desc: 'A small enamel medal for answering a call. It does not weigh much and means a great deal.' },
};

// -----------------------------------------------------------------------------
// RIVAL: Captain Tamsin Vell of the free-trader Marigold. A recurring friendly competitor.
// ENGINE/UI hooks: `systemHint` -> show "Tamsin Vell is at <system>" on the Bridge strip once flag rival_met is set;
// `log` lines are written to the ship's log when the matching flag/mission fires.
export const RIVAL = {
  id: 'tamsin_vell', name: 'Captain Tamsin Vell', ship: 'Marigold', species: 'human', faction: 'none',
  codex: ['tamsin_vell', 'vell_marigold'],
  chain: ['m_rival_1_wager', 'm_rival_2_tied_race', 'm_rival_3_partners', 'm_rival_4_regatta'],
  flags: { met: 'rival_met', ally: 'rival_friend', beaten: 'rival_beaten' },
  log: {
    rival_met: 'Met Captain Tamsin Vell of the Marigold, who bet you a round of tea. She hangs about trade hubs and loves a deadline.',
    rival_friend: 'Tamsin Vell and you have formed a proper partnership. The Marigold now sails with Halcyon\'s route notes in her chart table.',
    rival_beaten: 'You beat Tamsin Vell fair and square at the Reach Regatta. She promised to be unbearable about the rematch.',
  },
  systemHint: 'Tamsin Vell is usually found at a trade station in the Shoals or the Gate Shallows.',
};
