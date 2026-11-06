// =============================================================================
// HALCYON REACH - content/missions.js  (WORLD-B)
// Pure data, node-runnable.
//
// EXPORTS: MISSIONS[] (hand-authored, 36), TEMPLATES[] (procedural, 9)
//
// MISSION SHAPE
//   { id, title, giver:{name,species,faction}, kind:'delivery'|'survey'|'investigate'|'ferry'|'relief'|
//                                                  'diplomacy'|'fetch'|'story',
//     distress?: true,                     // ENGINE hook: may also be spawned as a sector distress call (short deadline, relief)
//     arc?:'main'|'concord'|'quillari'|'vesperine'|'archivists'|'drifters'|'mediation'|null,
//     blurb, accept,                       // offer text / text on accept
//     offerWhen:[conds],                   // CONTRACT sec 5 conditions; evaluated against game state
//     offerAt?: Selector,                  // where it is offered (board of any station matching); default: any station with 'missions'
//     stationKinds?:[...],                 // restrict to these station kinds
//     secret?: true,                       // never shown as "locked"; appears only once offerWhen passes
//     ordered?: true,                      // objectives must be completed in listed order (default: any order)
//     objectives:[Objective],
//     reward:{ credits, rep:{faction:n}, item:{id:n}, upgrade?:id, codex?:id },
//     deadlineDays?: n,                    // days after acceptance; generous. On expiry: failFx + mission in state.missions.failed
//     onComplete:[fx], failFx:[fx], completeText?, repeatable?: bool }
//
// OBJECTIVE SHAPE      { id, text, type, ... }   `text` may contain {placeholders} resolved from the mission's bound targets
//   type 'goto'   : { target:Selector, docked?:true }               done when the ship is in that system (and docked if docked:true)
//   type 'have'   : { good?:goodId, item?:itemId, qty:n,            done when player holds >= qty. If deliverTo given, the player
//                     deliverTo?:Selector, consume?:true }          must be docked/in that system, and the qty is removed on completion
//   type 'scan'   : { target:Selector, what:'planets'|'planetType'|'phenomenon',
//                     planetType?:type, phenomenon?:id, count?:n }  done after count scans (g.scanPlanet / g.investigate) in matched system(s)
//   type 'chart'  : { target:Selector, count?:n }                   done when n systems matching the selector are 'charted'
//   type 'flag'   : { flag:'name', value?:any }                     done when state.flags[name] is truthy / equals value
//   type 'event'  : { event:'eventId' }                             done when that event has been resolved (engine records seen events)   (use sparingly; only for event ids that exist in events/)
//   Any type may carry `hidden:true` (not listed until the previous objective is done) and `optional:true`.
//
// SELECTOR GRAMMAR  (target of goto/scan/chart/have.deliverTo; also `offerAt`; resolved ONCE at acceptance and cached
//                    on the mission instance as resolved[objId] = systemId; templates resolve their `pick` the same way)
//   Selector :=
//       'story_id'                           shorthand for {story:'story_id'}  (id from STORY_SYSTEMS, i.e. System.story)
//     | { story:'story_id' }                 exact hand-authored system
//     | { faction:'quillari' [, station:true|'trade'|kind] [, region:'shoals'] }   nearest system owned by faction,
//                                                                    optionally having a station (any, or of that kind)
//     | { region:'veil' [, station:true|kind] [, status:'unknown'|'unvisited'|'uncharted'] }  any system in the region
//     | { phenomenon:'nebula' [, region] }   system with that phenomenon
//     | { planetType:'ice' [, region] }      system with a planet of that type
//     | { nearest:'station'|'trade'|'outpost'|'shipyard'|'embassy'|'archive'|'habitat' }  closest station of that kind
//     | { nearest:'unvisited'|'uncharted' [, region] }   closest system not yet visited / charted
//     | { here:true }                        the system the player is in at acceptance
//     | '{placeholder}'                      template placeholder: '{fromSystem}' | '{toSystem}' | '{planet}' bound by TEMPLATES.pick
//   Common modifiers valid on any object selector:
//       minHops:n / maxHops:n   lane distance from the player's system at acceptance (default: 1..8)
//       exclude:['story_id',..] never choose these;   notHere:true  exclude the current system;
//       count:n                 (chart/scan only) how many distinct matching systems must be handled
//   Resolution = nearest-by-lane-distance among matches; ties broken by seeded RNG. If a selector has no match,
//   the engine silently drops the offer (offers never dead-end: no match = not offered).
//   Region-only selectors with count:n (e.g. chart 3 systems in 'gate') track progress as "x/n" and are NOT pinned
//   to a single system.
//
// TEMPLATE SHAPE (procedural jobs, filled by engine)
//   { id, kind, weight, factions:[...]|'any', stationKinds?:[...], giverPool:[ {name,species} ... ],
//     title, blurb, accept, offerWhen?:[conds],
//     pick:{ fromSystem?:Selector, toSystem:Selector, goodId?: {category:[..]} | {ids:[..]}, qty?:[min,max], planet?:Selector },
//     objectives:[Objective w/ placeholders], deadlinePerJump?: days, deadlineBase?: days,
//     reward:{ credits:{ base, perUnit?, perJump? }, rep:{ '$faction': n }, item?:{...} }, repeatable:true,
//     failFx?:[fx] }
//   Placeholders in any string: {goodId} {goodName} {qty} {fromSystem} {toSystem} {planet} {faction} {giver} {reward}.
//   '$faction' as a reputation key means the template's giver faction. {fromSystem}/{toSystem} render as system names.
//
// REWARD UPGRADES used here (all exist in upgrades.js): concord_grant_lab, quillari_trade_licence, vesperine_harmonic_resonator,
//   archive_index_lens, drifter_quilt_lounge, lantern_attunement, singing_hull_plating, brass_astrolabe.
//   Rep-gated ones are granted free by the arc finale. Item definitions live in content/story.js ITEM_DEFS.
// =============================================================================


export const MISSIONS = [
  // ===========================================================================
  // TUTORIAL-ISH WELCOME JOBS at the Gate station (day 1; ~120 scrip + a useful item in total)
  // ===========================================================================
  {
    id: 'm_tut_1_first_chart', title: 'Welcome Job: Chart the Neighbours', kind: 'survey', arc: 'tutorial',
    giver: { name: 'Dockmaster Oswin Pell', species: 'human', faction: 'concord' },
    blurb: 'Open the Chart (C), click the nearest unexplored system, Jump there, and Scan its planets. Easy money and an easy way to learn the buttons.',
    accept: '"Chart, jump, scan," says Pell. "Then come back and I\'ll pretend I\'m surprised."',
    offerWhen: [], offerAt: 'gate_anchorage',
    objectives: [
      { id: 'o1', type: 'chart', target: { nearest: 'uncharted', notHere: true, maxHops: 3 }, text: 'Chart the nearest uncharted system (jump there, then Scan each planet)' },
    ],
    reward: { credits: 50, rep: { concord: 2 } },
    deadlineDays: 40,
  },
  {
    id: 'm_tut_2_first_delivery', title: 'Welcome Job: A Small Delivery', kind: 'delivery', arc: 'tutorial',
    giver: { name: 'Dockmaster Oswin Pell', species: 'human', faction: 'concord' },
    blurb: 'Buy two ration bars at the market here (Dock, then Trade), fly to the nearest other station, and hand them over. You will learn Docking, Trading and Delivering in one afternoon.',
    accept: '"Two ration bars," says Pell. "Keep the receipt. I like receipts."',
    offerWhen: [], offerAt: 'gate_anchorage',
    objectives: [
      { id: 'o1', type: 'have', good: 'ration_bars', qty: 2, deliverTo: { nearest: 'station', notHere: true, maxHops: 3 }, consume: true, text: 'Buy 2 ration bars, then deliver them to the nearest other station' },
    ],
    reward: { credits: 40, rep: { concord: 2 } },
    deadlineDays: 40,
  },
  {
    id: 'm_tut_3_first_scan', title: 'Welcome Job: Look at the Neighbourhood', kind: 'survey', arc: 'tutorial',
    giver: { name: 'Dockmaster Oswin Pell', species: 'human', faction: 'concord' },
    blurb: 'Pick a planet in this very system, click it, and press Scan. The Society wants to know what Teacup is made of. Nobody has asked in at least a week.',
    accept: '"Scan the planets," says Pell, "and take a spare set of charts. You will need them for the first friendly stranger."',
    offerWhen: [], offerAt: 'gate_anchorage',
    objectives: [
      { id: 'o1', type: 'scan', target: 'gate_anchorage', what: 'planets', count: 1, text: 'Scan any planet at Gate Anchorage' },
    ],
    reward: { credits: 30, rep: { concord: 1 }, item: { sector_charts: 2 } },
    deadlineDays: 40,
  },

  // ===========================================================================
  // MAIN ARC: "Who Lit the Lanterns"
  // Robustness rules: the lantern_N flag is the only REQUIRED objective of a Lantern mission (goto/scan steps are
  // optional breadcrumbs), so the mission completes however the player gets the flag. Offers are gated by the
  // engine's chapter_N flags (see story.js CHAPTERS) and appear on ANY station mission board (no offerAt).
  // ===========================================================================
  {
    id: 'm_first_light', title: 'First Light Along the Shore', kind: 'survey', arc: 'main',
    giver: { name: 'Director Imogen Calloway', species: 'human', faction: 'concord' },
    blurb: 'The Society would like three systems near the Gate charted before the press arrives. The press, I regret to say, is already here and wants biscuits.',
    accept: 'Calloway presses a thermos into your hand. "Three charts. Don\'t get lost on purpose."',
    offerWhen: [], offerAt: 'gate_anchorage',
    objectives: [
      { id: 'o1', type: 'chart', target: { region: 'gate', count: 3 }, text: 'Chart three systems near the Gate (jump, then Scan each planet)' },
    ],
    reward: { credits: 250, rep: { concord: 6 }, item: { tea_tin: 2 } },
    onComplete: [{ flag: 'first_light_done' }],
    completeText: 'Calloway reads the charts twice, then once more for pleasure. "Splendid. Now, there\'s a lamp."',
  },
  {
    id: 'm_ch1_wickhaven', title: 'The Lamp at Wickhaven', kind: 'story', arc: 'main',
    giver: { name: 'Director Imogen Calloway', species: 'human', faction: 'concord' },
    blurb: 'A relay buoy has been reporting a patient little light at Wickhaven. It answers hails in a pattern nobody can read, which makes it the most interesting thing in the galaxy this week.',
    accept: '"Go and say hello," says Calloway. "Don\'t be clever. Be polite. Use Investigate on the beacon."',
    offerWhen: [{ flag: 'chapter_1' }, { notFlag: 'lantern_1' }], offerAt: 'gate_anchorage',
    objectives: [
      { id: 'o1', type: 'goto', target: 'lantern_wick', optional: true, text: 'Travel to Wickhaven, two hops from the Gate' },
      { id: 'o2', type: 'flag', flag: 'lantern_1', text: 'Investigate the beacon and answer the Lantern\'s greeting' },
    ],
    reward: { credits: 400, rep: { concord: 8 }, item: { lantern_shard: 1 }, codex: 'the_lanterns' },
    onComplete: [{ flag: 'chapter_1_done' }],
    completeText: 'The shard in your pocket is warm. The Lantern blinks twice, which you decide to take as a thank-you.',
  },
  {
    id: 'm_ch2_brightwater', title: 'The Light on the Water', kind: 'story', arc: 'main',
    giver: { name: 'Calloway (by relay)', species: 'human', faction: 'concord' },
    blurb: 'The first Lantern pointed somewhere. The star-map it projected shows a shining sliver in the Brightwater Shoals. Go see who is home.',
    accept: '"Wherever the lamp points," says Calloway, "that\'s where we go next."',
    offerWhen: [{ flag: 'chapter_2' }, { notFlag: 'lantern_2' }],
    objectives: [
      { id: 'o1', type: 'goto', target: 'lantern_brightwater', optional: true, text: 'Travel to Brightwater Light, beyond Pennywhistle Exchange' },
      { id: 'o2', type: 'flag', flag: 'lantern_2', text: 'Investigate the second Lantern' },
    ],
    reward: { credits: 500, rep: { quillari: 6, concord: 4 }, item: { lantern_shard: 1 } },
    onComplete: [{ flag: 'chapter_2_done' }],
  },
  {
    id: 'm_archive_card', title: 'A Question for the Archive', kind: 'story', arc: 'main',
    giver: { name: 'Reader-Warden Ink-Seven', species: 'archivist', faction: 'archivists' },
    blurb: 'The first Lantern uses a notation the Archive recognises. The Archivists will not say more until you have presented yourself, in person, with a question that has been properly formed. Optional, but it opens a quiet door.',
    accept: 'Ink-Seven stamps a card. "You may borrow one answer. Please return it in the condition you found it."',
    offerWhen: [{ flag: 'lantern_1' }], offerAt: { faction: 'archivists', station: true },
    objectives: [
      { id: 'o1', type: 'goto', target: 'hollow_archive', docked: true, text: 'Dock at the Central Catalogue (the Hollow Archive)' },
      { id: 'o2', type: 'have', item: 'tea_tin', qty: 1, deliverTo: 'hollow_archive', consume: true, optional: true, text: 'Present a tin of tea with your question (librarians appreciate a gift)' },
    ],
    reward: { credits: 300, rep: { archivists: 10 }, item: { archive_reader_card: 1 }, codex: 'hollow_archive' },
    onComplete: [{ flag: 'archive_key' }],
    completeText: 'The card has a due date. The due date is, you notice, in a very long time.',
  },
  {
    id: 'm_ch3_veilglass', title: 'The Nursery Light', kind: 'story', arc: 'main',
    giver: { name: 'Chorister Aelwyn-of-the-Third-Verse', species: 'vesperine', faction: 'vesperine' },
    blurb: 'A Lantern burns deep in the Veil, and the Vesperine have sung around it for generations without ever naming it. They would like you to find out whether it wants to be named.',
    accept: 'The chorister shimmers a soft chord. "Quietly, please. It is sleeping, or listening."',
    offerWhen: [{ flag: 'chapter_3' }, { notFlag: 'lantern_3' }],
    objectives: [
      { id: 'o1', type: 'goto', target: 'lantern_veilglass', optional: true, text: 'Cross the Vesper Veil to Veilglass' },
      { id: 'o2', type: 'flag', flag: 'lantern_3', text: 'Investigate the third Lantern (hum back)' },
    ],
    reward: { credits: 600, rep: { vesperine: 10 }, item: { lantern_shard: 1 } },
    onComplete: [{ flag: 'chapter_3_lantern' }],
  },
  {
    id: 'm_ch3_ledger', title: 'The Fellowship Ledger', kind: 'story', arc: 'main',
    giver: { name: 'Reader-Warden Ink-Seven', species: 'archivist', faction: 'archivists' },
    blurb: 'The Archive holds one sealed ledger that no one has asked to open. At Marginalia, the vault is quiet, shelved and very polite. Go and ask correctly.',
    accept: '"We have never been asked this correctly before," says Ink-Seven. "We should like to see how it goes."',
    offerWhen: [{ flag: 'chapter_3' }],
    objectives: [
      { id: 'o1', type: 'goto', target: 'archive_heart', text: 'Travel to Marginalia, the Archive\'s innermost margin' },
      { id: 'o2', type: 'scan', target: 'archive_heart', what: 'planets', text: 'Scan every world at Marginalia, including the Heart Vault' },
      { id: 'o3', type: 'flag', flag: 'fellowship_known', optional: true, text: 'Read the Fellowship Ledger (any Marginalia event may open it)' },
    ],
    reward: { credits: 700, rep: { archivists: 12 }, item: { fellowship_token: 1 }, codex: 'open_sky_fellowship' },
    onComplete: [{ flag: 'fellowship_known' }, { flag: 'chapter_3_done' }],
    completeText: 'The Ledger opens at last. The first page says, in a very old hand, "Please make yourself at home."',
  },
  {
    id: 'm_ch4_tessitura', title: 'Letter in Slow Time', kind: 'story', arc: 'main',
    giver: { name: 'Calloway (by relay)', species: 'human', faction: 'concord' },
    blurb: 'The third Lantern names a fourth lamp, ticking beside a neutron star. Pulsars are noisy and bumpy, so please bring a good pilot and a second thermos.',
    accept: '"You\'re the closest thing we have to a Fellowship now," says Calloway. "No pressure."',
    offerWhen: [{ flag: 'chapter_4' }, { notFlag: 'lantern_4' }],
    objectives: [
      { id: 'o1', type: 'goto', target: 'tessitura', optional: true, text: 'Fly to Tessitura, in the Pulsar Choir' },
      { id: 'o2', type: 'flag', flag: 'lantern_4', text: 'Investigate the fourth Lantern and listen to the whole letter' },
    ],
    reward: { credits: 800, rep: { vesperine: 6, drifters: 6 }, item: { lantern_shard: 1 } },
    onComplete: [{ flag: 'chapter_4_done' }],
  },
  {
    id: 'm_ch5_last_taper', title: 'The Last Taper', kind: 'story', arc: 'main',
    giver: { name: 'Elder Marrow-of-the-Long-Table', species: 'drifter', faction: 'drifters' },
    blurb: 'Every drifter story ends at a candle by a hungry star. Marrow says that candle is real, and that it has been waiting for a captain with good manners. Bring your Lantern shards.',
    accept: 'Marrow ties a story knot around your wrist. "Tell it kindly."',
    offerWhen: [{ flag: 'chapter_5' }, { notFlag: 'lantern_5' }],
    objectives: [
      { id: 'o1', type: 'goto', target: 'lantern_taper', optional: true, text: 'Sail to Last Taper on the far Quiet Rim' },
      { id: 'o2', type: 'flag', flag: 'lantern_5', text: 'Investigate the fifth Lantern and answer its question' },
    ],
    reward: { credits: 1500, rep: { concord: 4, quillari: 4, vesperine: 4, archivists: 4, drifters: 8 }, upgrade: 'lantern_attunement', codex: 'welcome_mat' },
    onComplete: [{ flag: 'chapter_5_done' }],
  },

  // ===========================================================================
  // FACTION MINI-ARCS (3 each; rep-gated; unique reward at the end)
  // ===========================================================================
  // ---- CONCORD OF LYRA -----------------------------------------------------
  {
    id: 'm_concord_1_census', title: 'The Gentle Census', kind: 'survey', arc: 'concord',
    giver: { name: 'Under-Secretary Pim Tolliver', species: 'human', faction: 'concord' },
    blurb: 'The Concord would like to know how many people live in the Reach. Not for tax purposes. For the pleasure of the number.',
    accept: 'Tolliver hands you a clipboard and an apologetic smile.',
    offerWhen: [{ rep: { concord: 0 } }], offerAt: { faction: 'concord', station: true },
    objectives: [
      { id: 'o1', type: 'scan', target: { region: 'gate' }, what: 'planets', count: 4, text: 'Scan four planets in the Gate Shallows' },
      { id: 'o2', type: 'goto', target: 'lyra_landing', docked: true, text: 'Return the census to Lyra Landing' },
    ],
    reward: { credits: 220, rep: { concord: 8 } },
  },
  {
    id: 'm_concord_2_form_27b', title: 'Form 27-B (Pre-Approved)', kind: 'delivery', arc: 'concord',
    giver: { name: 'Under-Secretary Pim Tolliver', species: 'human', faction: 'concord' },
    blurb: 'A crate of stamped forms must reach the Pennywhistle Exchange by autumn. The Quillari have never seen anything so beautiful.',
    accept: 'Tolliver gives the crate a pat. "Do not let them haggle me down on the stationery."',
    offerWhen: [{ missionDone: 'm_concord_1_census' }, { rep: { concord: 15 } }], offerAt: { faction: 'concord', station: true },
    objectives: [
      { id: 'o1', type: 'goto', target: 'pennywhistle', docked: true, text: 'Deliver the forms to Pennywhistle Exchange' },
    ],
    reward: { credits: 360, rep: { concord: 8, quillari: 3 }, item: { concord_charter_seal: 1 } },
    deadlineDays: 40,
  },
  {
    id: 'm_concord_3_charter', title: 'The Charter of Open Skies', kind: 'diplomacy', arc: 'concord',
    giver: { name: 'Ambassador Linnea Okoro', species: 'human', faction: 'concord' },
    blurb: 'The Concord want a short, friendly charter signed by every peoples of the Reach. It requires a captain with diplomacy, patience, and a very steady pen.',
    accept: 'Okoro smiles. "Five signatures. I shall bring the good ink."',
    offerWhen: [{ missionDone: 'm_concord_2_form_27b' }, { rep: { concord: 30 } }], offerAt: 'lyra_landing', ordered: true,
    objectives: [
      { id: 'o1', type: 'goto', target: { faction: 'quillari', station: true }, docked: true, text: 'Collect the Quillari signature' },
      { id: 'o2', type: 'goto', target: { faction: 'vesperine', station: true }, docked: true, text: 'Collect the Vesperine harmonic' },
      { id: 'o3', type: 'goto', target: 'lyra_landing', docked: true, text: 'Bring the Charter home' },
    ],
    reward: { credits: 700, rep: { concord: 12 }, upgrade: 'concord_grant_lab', codex: 'charter_open_skies' },
  },
  // ---- QUILLARI CLANS ------------------------------------------------------
  {
    id: 'm_quillari_1_feather', title: 'A Feather for the Hearth', kind: 'fetch', arc: 'quillari',
    giver: { name: 'Grandmother Peshwick', species: 'quillari', faction: 'quillari' },
    blurb: 'To be a guest at a Quillari table, one must first be seen to give. Peshwick would like three bolts of vellum-sheets for the hearth-ledger. She pays in conversation.',
    accept: 'Peshwick preens. "Bring it quick, dear. The tea gets cold, and so do my feelings."',
    offerWhen: [{ rep: { quillari: 0 } }], offerAt: { faction: 'quillari', station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'vellum_sheets', qty: 3, deliverTo: { faction: 'quillari', station: true }, consume: true, text: 'Deliver 3 vellum-sheets' },
    ],
    reward: { credits: 200, rep: { quillari: 10 }, item: { quillari_guest_feather: 1 } },
  },
  {
    id: 'm_quillari_2_wedding', title: 'Brandy for the Wedding', kind: 'delivery', arc: 'quillari',
    giver: { name: 'Uncle Tuckwhistle', species: 'quillari', faction: 'quillari' },
    blurb: 'The clan wedding is in nineteen days and the glass brandy is three hundred leagues from the groom. It is, strictly speaking, a crisis. It is also a party.',
    accept: 'Tuckwhistle waves four feathers at once. "Don\'t drop it! Don\'t drink it! Well, one glass."',
    offerWhen: [{ missionDone: 'm_quillari_1_feather' }, { rep: { quillari: 15 } }], offerAt: { faction: 'quillari', station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'glass_brandy', qty: 6, text: 'Obtain 6 casks of glass brandy' },
      { id: 'o2', type: 'goto', target: { faction: 'quillari', station: 'trade', notHere: true }, docked: true, text: 'Deliver the brandy to the wedding hall' },
    ],
    reward: { credits: 500, rep: { quillari: 10 }, item: { festival_ribbon: 1 } },
    deadlineDays: 30,
    failFx: [{ rep: { quillari: -3 } }, { morale: -3 }],
  },
  {
    id: 'm_quillari_3_clan_accord', title: 'The Clan Accord', kind: 'diplomacy', arc: 'quillari',
    giver: { name: 'Matriarch Sunnifer Quill', species: 'quillari', faction: 'quillari' },
    blurb: 'Two clans have not spoken since an argument about soup. You are not a clan, which makes you the only one who can carry a spoon between them.',
    accept: 'The matriarch lowers her voice. "We will meet halfway. I choose the halfway."',
    offerWhen: [{ missionDone: 'm_quillari_2_wedding' }, { rep: { quillari: 30 } }], offerAt: 'pennywhistle', ordered: true,
    objectives: [
      { id: 'o1', type: 'goto', target: 'lantern_brightwater', docked: true, text: 'Meet the western clan at Brightwater' },
      { id: 'o2', type: 'have', good: 'ration_bars', qty: 4, deliverTo: 'lantern_brightwater', consume: true, text: 'Bring 4 ration bars for the Soup Accord and broker the peace' },
    ],
    reward: { credits: 650, rep: { quillari: 12 }, upgrade: 'quillari_trade_licence' },
  },
  // ---- VESPERINE CHOIRS ----------------------------------------------------
  {
    id: 'm_vesperine_1_quiet_ship', title: 'The Quiet Ship', kind: 'investigate', arc: 'vesperine',
    giver: { name: 'Chorister Aelwyn-of-the-Third-Verse', species: 'vesperine', faction: 'vesperine' },
    blurb: 'The Veil is loud with traffic and the choirs are weary. If a ship could pass through without singing its engines, it would be a kindness. Prove it can be done.',
    accept: 'The chorister brightens. "Ten systems, no slammed doors."',
    offerWhen: [{ rep: { vesperine: 0 } }], offerAt: { faction: 'vesperine', station: true },
    objectives: [
      { id: 'o1', type: 'chart', target: { region: 'veil', count: 3 }, text: 'Chart three systems in the Veil, gently' },
    ],
    reward: { credits: 280, rep: { vesperine: 10 }, item: { vesperine_tuning_fork: 1 } },
  },
  {
    id: 'm_vesperine_2_missing_chord', title: 'The Missing Chord', kind: 'fetch', arc: 'vesperine',
    giver: { name: 'Cantor Brightharmonic', species: 'vesperine', faction: 'vesperine' },
    blurb: 'The grand harmony needs one note, and the note is stored in a tuning crystal that was, regrettably, loaned out. Bring three tuning crystals and a tuning fork.',
    accept: 'The cantor trills in relief. "A slight, polite fanfare would not be amiss."',
    offerWhen: [{ missionDone: 'm_vesperine_1_quiet_ship' }, { rep: { vesperine: 15 } }], offerAt: { faction: 'vesperine', station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'tuning_crystals', qty: 3, deliverTo: 'cantabile', consume: true, text: 'Deliver 3 tuning crystals to Cantabile' },
    ],
    reward: { credits: 380, rep: { vesperine: 10 } },
    deadlineDays: 45,
  },
  {
    id: 'm_vesperine_3_grand_harmonic', title: 'The Grand Harmonic', kind: 'diplomacy', arc: 'vesperine',
    giver: { name: 'Cantor Brightharmonic', species: 'vesperine', faction: 'vesperine' },
    blurb: 'Once in a lifetime the Veil sings its whole song, and a guest is invited to hold one note. The note is a rest. It is the hardest part.',
    accept: 'The cantor shimmers. "Stand, listen, and do not clap until the end."',
    offerWhen: [{ missionDone: 'm_vesperine_2_missing_chord' }, { rep: { vesperine: 30 } }], offerAt: 'cantabile', ordered: true,
    objectives: [
      { id: 'o1', type: 'have', item: 'vesperine_tuning_fork', qty: 1, deliverTo: 'cantabile', text: 'Bring the silver tuning fork to Cantabile and hold the rest at the Grand Harmonic' },
    ],
    reward: { credits: 600, rep: { vesperine: 12 }, upgrade: 'vesperine_harmonic_resonator', codex: 'grand_harmonic' },
  },
  // ---- ARCHIVISTS ----------------------------------------------------------
  {
    id: 'm_archivist_1_overdue', title: 'Overdue, With Apologies', kind: 'fetch', arc: 'archivists',
    giver: { name: 'Shelver Quire-Three', species: 'archivist', faction: 'archivists' },
    blurb: 'A volume was borrowed 4,112 years ago and is five minutes overdue by our clock. It has been tracked to a dusty ruin. The Archive does not mind. The Archive is merely noting it.',
    accept: 'Quire-Three tilts its lens. "No penalty. Merely a gentle note."',
    offerWhen: [{ rep: { archivists: 0 } }], offerAt: { faction: 'archivists', station: true },
    objectives: [
      { id: 'o1', type: 'scan', target: { planetType: 'desert' }, what: 'planets', count: 1, text: 'Find the lost volume on a desert world' },
      { id: 'o2', type: 'goto', target: { faction: 'archivists', station: true }, docked: true, text: 'Return the volume' },
    ],
    reward: { credits: 240, rep: { archivists: 10 } },
  },
  {
    id: 'm_archivist_2_question_stacks', title: 'A Question for the Stacks', kind: 'investigate', arc: 'archivists',
    giver: { name: 'Shelver Quire-Three', species: 'archivist', faction: 'archivists' },
    blurb: 'The Archive has been pondering a question for ninety years. They would like another opinion. Specifically, yours, and preferably in fewer than ninety years.',
    accept: '"We will not ask again," says Quire-Three. "We will only wait."',
    offerWhen: [{ missionDone: 'm_archivist_1_overdue' }, { rep: { archivists: 15 } }], offerAt: { faction: 'archivists', station: true }, ordered: true,
    objectives: [
      { id: 'o1', type: 'scan', target: { phenomenon: 'rift' }, what: 'phenomenon', phenomenon: 'rift', text: 'Investigate a singing rift' },
      { id: 'o2', type: 'goto', target: { faction: 'archivists', station: true }, docked: true, text: 'Present your answer to the Archive' },
    ],
    reward: { credits: 400, rep: { archivists: 10 }, codex: 'codex_singing_rifts' },
  },
  {
    id: 'm_archivist_3_index', title: 'The Index of Everything Else', kind: 'story', arc: 'archivists',
    giver: { name: 'Reader-Warden Ink-Seven', species: 'archivist', faction: 'archivists' },
    blurb: 'The Archive has indexed everything it knows. It now wishes to index everything it does not. It asks you, courteously, to help with the second volume.',
    accept: 'Ink-Seven hands you a quill. "Please begin with the first thing you do not know."',
    offerWhen: [{ missionDone: 'm_archivist_2_question_stacks' }, { rep: { archivists: 30 } }], offerAt: 'hollow_archive',
    objectives: [
      { id: 'o1', type: 'chart', target: { region: 'archive', count: 2 }, text: 'Chart two systems in the Archive' },
      { id: 'o2', type: 'goto', target: 'hollow_archive', docked: true, text: 'Return the index to Central Catalogue' },
    ],
    reward: { credits: 650, rep: { archivists: 12 }, upgrade: 'archive_index_lens', item: { scholars_pin: 1 } },
    onComplete: [{ flag: 'archive_scholar' }],
  },
  // ---- DRIFTER FLEETS ------------------------------------------------------
  {
    id: 'm_drifter_1_tale', title: 'A Tale for the Table', kind: 'investigate', arc: 'drifters',
    giver: { name: 'Elder Marrow-of-the-Long-Table', species: 'drifter', faction: 'drifters' },
    blurb: 'To sit at the Long Table, you must bring a story that happened to you. The Reach is full of them. Go and have one.',
    accept: 'Marrow grins. "Make it a good one. We can tell if you embroider."',
    offerWhen: [{ rep: { drifters: 0 } }], offerAt: { faction: 'drifters', station: true },
    objectives: [
      { id: 'o1', type: 'scan', target: { nearest: 'unvisited' }, what: 'planets', count: 1, text: 'Have something happen on a new world' },
      { id: 'o2', type: 'goto', target: 'long_table', docked: true, text: 'Tell the tale at the Long Table' },
    ],
    reward: { credits: 200, rep: { drifters: 10 }, item: { drifter_story_knot: 1 } },
  },
  {
    id: 'm_drifter_2_loom_run', title: 'The Loom Run', kind: 'delivery', arc: 'drifters',
    giver: { name: 'Weaver Tamsin Quickfold', species: 'drifter', faction: 'drifters' },
    blurb: 'The nearest hand-loom shop is two harbours away, and the winter blankets are due. Six looms, no hurry, and an outrageous amount of knitting.',
    accept: 'Tamsin tosses you a scarf. "Wear that. They can tell it\'s ours."',
    offerWhen: [{ missionDone: 'm_drifter_1_tale' }, { rep: { drifters: 15 } }], offerAt: { faction: 'drifters', station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'hand_looms', qty: 6, deliverTo: 'long_table', consume: true, text: 'Deliver 6 hand-looms to the Long Table' },
    ],
    reward: { credits: 420, rep: { drifters: 10 } },
    deadlineDays: 50,
  },
  {
    id: 'm_drifter_3_long_table', title: 'A Chair for the Captain', kind: 'story', arc: 'drifters',
    giver: { name: 'Elder Marrow-of-the-Long-Table', species: 'drifter', faction: 'drifters' },
    blurb: 'The Long Table has a vacant chair, held empty since before anyone born can remember. It is yours, if you can tell the table what you have seen out there.',
    accept: 'Marrow pulls out the chair. It is surprisingly well-worn.',
    offerWhen: [{ missionDone: 'm_drifter_2_loom_run' }, { rep: { drifters: 30 } }], offerAt: 'long_table', ordered: true,
    objectives: [
      { id: 'o1', type: 'have', item: 'drifter_story_knot', qty: 1, deliverTo: 'long_table', text: 'Take your seat at the Long Table and share the story knot' },
    ],
    reward: { credits: 600, rep: { drifters: 12 }, upgrade: 'drifter_quilt_lounge', item: { drifter_kin_cord: 1 } },
    onComplete: [{ flag: 'drifter_adopted' }],
  },

  // ===========================================================================
  // STAND-ALONE AND CHAINED MISSIONS
  // ===========================================================================
  {
    id: 'm_ferry_nervous_archivist', title: 'The Nervous Archivist', kind: 'ferry',
    giver: { name: 'Shelver Quire-Nine', species: 'archivist', faction: 'archivists' },
    blurb: 'Quire-Nine has never left the Archive, and is thrilled and alarmed in equal measure. It would like to visit a Quillari market. It would like to be home by supper. It has not yet had supper.',
    accept: 'Quire-Nine clutches a notebook. "I will be no trouble. I have eleven questions."',
    offerWhen: [{ rep: { archivists: 5 } }], offerAt: { faction: 'archivists', station: true }, ordered: true,
    objectives: [
      { id: 'o1', type: 'goto', target: { faction: 'quillari', station: 'trade' }, docked: true, text: 'Escort Quire-Nine to a Quillari market' },
      { id: 'o2', type: 'goto', target: { faction: 'archivists', station: true }, docked: true, text: 'Bring Quire-Nine home' },
    ],
    reward: { credits: 340, rep: { archivists: 8, quillari: 4 }, codex: 'quillari_markets' },
    deadlineDays: 40,
  },
  {
    id: 'm_survey_veil_weather', title: 'Weather Report for the Veil', kind: 'survey',
    giver: { name: 'Meteorologist Odalys Finch', species: 'human', faction: 'concord' },
    blurb: 'The Veil\'s weather moves in long, soft fronts. Finch would like three nebula samples to build a forecast. The forecast will be: "pleasant, with a chance of singing".',
    accept: 'Finch hands you a sample jar. "Don\'t shake it. It gets excited."',
    offerWhen: [{ survey: 10 }], offerAt: { nearest: 'station' },
    objectives: [
      { id: 'o1', type: 'scan', target: { phenomenon: 'nebula', count: 3 }, what: 'phenomenon', phenomenon: 'nebula', text: 'Sample three nebulae' },
    ],
    reward: { credits: 450, rep: { concord: 4, vesperine: 4 }, codex: 'nebula_weather' },
  },
  {
    id: 'm_mediation_1_tariff_teapot', title: 'The Great Tariff Teapot', kind: 'diplomacy', arc: 'mediation',
    giver: { name: 'Clerk Hobart Pyle', species: 'human', faction: 'concord' },
    blurb: 'A Concord customs clerk and a Quillari toll-keeper disagree about the status of a teapot. Both are right. Both are furious. Both have asked for you by name.',
    accept: 'Pyle fans himself with a tariff table. "The teapot is not for sale. It is merely for argument."',
    offerWhen: [{ rep: { concord: 5 } }, { rep: { quillari: 5 } }], offerAt: { faction: 'concord', station: true }, ordered: true,
    objectives: [
      { id: 'o1', type: 'goto', target: 'pennywhistle', docked: true, text: 'Hear the Quillari side at Pennywhistle' },
      { id: 'o2', type: 'goto', target: { faction: 'concord', station: true }, docked: true, text: 'Return to the Concord with a compromise' },
    ],
    reward: { credits: 280, rep: { concord: 5, quillari: 5 } },
  },
  {
    id: 'm_mediation_2_toll_ladder', title: 'The Toll Ladder', kind: 'diplomacy', arc: 'mediation',
    giver: { name: 'Toll-Keeper Wrenna', species: 'quillari', faction: 'quillari' },
    blurb: 'The teapot was a sign. Now every Concord ship pays a toll on every rung of a ladder nobody built. Wrenna would like it flattened into something fair.',
    accept: 'Wrenna taps her tally-stick. "We shall negotiate. I shall win. Gently."',
    offerWhen: [{ missionDone: 'm_mediation_1_tariff_teapot' }], offerAt: { faction: 'quillari', station: true }, ordered: true,
    objectives: [
      { id: 'o1', type: 'goto', target: 'lyra_landing', docked: true, text: 'Present the ladder at Lyra Landing' },
      { id: 'o2', type: 'goto', target: 'pennywhistle', docked: true, text: 'Return with the Concord counter-offer' },
    ],
    reward: { credits: 340, rep: { concord: 6, quillari: 6 } },
  },
  {
    id: 'm_mediation_3_summit_tea', title: 'The Summit of Tea', kind: 'diplomacy', arc: 'mediation',
    giver: { name: 'Ambassador Linnea Okoro', species: 'human', faction: 'concord' },
    blurb: 'Both parties have agreed to sit at the same table. Neither will speak until the tea is judged correct. You are the judge. No pressure.',
    accept: 'Okoro folds her hands. "The tea comes first. Everything else comes after."',
    offerWhen: [{ missionDone: 'm_mediation_2_toll_ladder' }, { item: 'tea_tin' }], offerAt: { faction: 'concord', station: true }, ordered: true,
    objectives: [
      { id: 'o1', type: 'have', item: 'tea_tin', qty: 1, deliverTo: 'pennywhistle', consume: true, text: 'Host the Summit of Tea at Pennywhistle with a tin of Meridian tea' },
    ],
    reward: { credits: 520, rep: { concord: 8, quillari: 8 }, item: { mediators_gavel: 1 }, codex: 'tea_summit' },
  },
  {
    id: 'm_relief_sniffles', title: 'Hollin\'s Great Sniffle', kind: 'relief',
    giver: { name: 'Nurse Bettany Oakes', species: 'human', faction: 'concord' },
    blurb: 'Hollin\'s Rest has a sniffle outbreak. It is not dangerous. It is, however, extremely loud, and the settlement has run out of tissue, tea, and medical kits.',
    accept: 'Nurse Oakes sneezes in greeting. "Excuse me. Four kits, please. And possibly a joke."',
    offerWhen: [{ crewRole: 'medicine' }], offerAt: { faction: 'concord', station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'medical_kits', qty: 4, deliverTo: 'hollin_rest', consume: true, text: 'Deliver 4 medical kits to Hollin\'s Rest' },
    ],
    reward: { credits: 300, rep: { concord: 8 }, codex: 'hollin_sniffle' },
    deadlineDays: 35,
    failFx: [{ morale: -4 }, { rep: { concord: -2 } }],
  },
  {
    id: 'm_find_the_probe', title: 'Where Did the Probe Go?', kind: 'investigate',
    giver: { name: 'Technician Rufus Bell', species: 'human', faction: 'concord' },
    blurb: 'Probe 7 left on a three-day weather mission and has not come home in three years. It is still, technically, transmitting. It sounds happy.',
    accept: 'Bell wipes his glasses. "Bring it back if you can. If it likes it out there, leave it be."',
    offerWhen: [{ survey: 20 }], offerAt: { faction: 'concord', station: true }, ordered: true,
    objectives: [
      { id: 'o1', type: 'goto', target: 'probes_rest', text: 'Follow the faint signal to Probe\'s Rest' },
      { id: 'o2', type: 'scan', target: 'probes_rest', what: 'planets', count: 2, text: 'Scan the system for Probe 7' },
    ],
    reward: { credits: 460, rep: { concord: 6 }, item: { probe_black_box: 1 }, codex: 'probe_seven' },
    onComplete: [{ flag: 'probe_found' }],
  },
  {
    id: 'm_rescue_the_choir', title: 'The Stranded Choir', kind: 'relief',
    giver: { name: 'Choirmaster Lull-of-the-Even-Verse', species: 'vesperine', faction: 'vesperine' },
    blurb: 'A travelling choir of nine has drifted into an ionstorm and is, politely, stuck. They are not in danger. They are, however, a half-tone flat, and it is distressing.',
    accept: '"We will hum while you search," says the choirmaster. "Please follow the pitch."',
    offerWhen: [{ rep: { vesperine: 3 } }], offerAt: { faction: 'vesperine', station: true }, ordered: true,
    objectives: [
      { id: 'o1', type: 'goto', target: 'weathervane', text: 'Find the choir in the Weathervane storm' },
      { id: 'o2', type: 'goto', target: { faction: 'vesperine', station: true, notHere: true }, docked: true, text: 'Tow the choir to safe harbour' },
    ],
    reward: { credits: 420, rep: { vesperine: 10 }, codex: 'vesperine_choirs' },
    deadlineDays: 30,
  },
  {
    id: 'm_festival_convoy', title: 'The Lamplight Festival Convoy', kind: 'delivery',
    giver: { name: 'Festival Marshal Dott', species: 'quillari', faction: 'quillari' },
    blurb: 'Every year the Quillari tow a thousand paper lanterns from Pennywhistle to Brightwater. The convoy is slow, loud and unarmed. Please fly gently behind it and be festive.',
    accept: 'Dott ties a ribbon to your mast. "Wave at everyone. Everyone waves back."',
    offerWhen: [{ rep: { quillari: 8 } }], offerAt: 'pennywhistle', ordered: true,
    objectives: [
      { id: 'o1', type: 'goto', target: 'lantern_brightwater', text: 'Accompany the convoy to Brightwater Light' },
      { id: 'o2', type: 'goto', target: 'pennywhistle', docked: true, text: 'Return to Pennywhistle for the feast' },
    ],
    reward: { credits: 380, rep: { quillari: 10 }, item: { festival_ribbon: 1 } },
    deadlineDays: 40,
  },
  {
    id: 'm_secret_lullaby', title: 'The Lullaby Behind the Rift', kind: 'investigate', secret: true,
    giver: { name: 'An Unmarked Signal', species: 'unknown', faction: 'none' },
    blurb: 'You hum a few bars of the rift\'s song to a passing Vesperine, who gasps and gives you a set of coordinates. The song, it turns out, has a second verse.',
    accept: 'Somewhere across the fold, something is humming along.',
    offerWhen: [{ any: [{ codex: 'codex_singing_rifts' }, { flag: 'lantern_3' }] }], offerAt: { faction: 'vesperine', station: true }, ordered: true,
    objectives: [
      { id: 'o1', type: 'goto', target: 'whispering_rift', text: 'Travel to the Whispering Rift' },
      { id: 'o2', type: 'scan', target: 'whispering_rift', what: 'phenomenon', phenomenon: 'rift', text: 'Hum back and listen' },
    ],
    reward: { credits: 500, rep: { vesperine: 8, archivists: 4 }, upgrade: 'singing_hull_plating', codex: 'rift_lullaby' },
  },
  {
    id: 'm_secret_fellowship_token', title: 'Return to Sender', kind: 'story', secret: true,
    giver: { name: 'Elder Marrow-of-the-Long-Table', species: 'drifter', faction: 'drifters' },
    blurb: 'Marrow sees the Fellowship Token on your desk and goes very still. Drifter stories speak of another disc like it, left in a hall at the rim. It has been waiting for its pair.',
    accept: '"Take it to the Taper," says Marrow. "Tell it the tea is still hot."',
    offerWhen: [{ any: [{ item: 'fellowship_token' }, { flag: 'fellowship_known' }] }, { rep: { drifters: 5 } }], offerAt: { faction: 'drifters', station: true },
    objectives: [
      { id: 'o1', type: 'goto', target: 'lantern_taper', text: 'Carry the Fellowship Token to Last Taper' },
    ],
    reward: { credits: 400, rep: { drifters: 8 }, upgrade: 'brass_astrolabe', codex: 'fellowship_tokens' },
  },
  {
    id: 'm_fetch_curios_museum', title: 'Curios for the Museum', kind: 'fetch',
    giver: { name: 'Curator Edwina Voss', species: 'human', faction: 'concord' },
    blurb: 'The Lyra Landing museum has an empty case labelled "Interesting Things From The Reach". It has been empty for a very long time. Fill it with four.',
    accept: 'Voss sweeps a hand over the case. "Anything charming. Nothing alive."',
    offerWhen: [{ survey: 5 }], offerAt: { faction: 'concord', station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'curios', qty: 4, deliverTo: 'lyra_landing', consume: true, text: 'Deliver 4 curios to the Lyra Landing museum' },
    ],
    reward: { credits: 360, rep: { concord: 6 }, codex: 'lyra_museum' },
  },

  // ===========================================================================
  // RIVAL TRADER: Captain Tamsin Vell of the free-trader Marigold (3 jobs; ends in the 'rival_friend' ending path)
  // ===========================================================================
  {
    id: 'm_rival_1_wager', title: 'A Friendly Wager', kind: 'delivery', arc: 'rival',
    giver: { name: 'Captain Tamsin Vell', species: 'human', faction: 'none' },
    blurb: 'A free-trader in a very shiny ship leans on your hull and bets you a round of tea that she can deliver four ration bars faster than you. She cannot. Probably.',
    accept: 'Vell grins and tips an imaginary hat. "Loser pays for the tea. Winner gets to be insufferable."',
    offerWhen: [], offerAt: { station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'ration_bars', qty: 4, deliverTo: { nearest: 'trade', notHere: true, minHops: 2, maxHops: 5 }, consume: true, text: 'Race Vell: deliver 4 ration bars to the nearest trade station 2-5 hops away' },
    ],
    reward: { credits: 280, rep: { quillari: 3, concord: 3 } },
    deadlineDays: 20,
    failFx: [{ morale: -2 }],
    onComplete: [{ flag: 'rival_met' }],
    completeText: 'Vell arrives six minutes after you, wheezing with laughter. "Best round of tea I never paid for."',
  },
  {
    id: 'm_rival_2_tied_race', title: 'A Tie Is a Tie', kind: 'fetch', arc: 'rival',
    giver: { name: 'Captain Tamsin Vell', species: 'human', faction: 'none' },
    blurb: 'Vell has won a contract for machine parts and lost the cargo to a very determined customs form. She needs you, her favourite rival, to carry five crates there before she does. She will pretend not to mind.',
    accept: '"Don\'t tell anyone I asked," says Vell. "Tell everyone I asked, and that you said yes."',
    offerWhen: [{ missionDone: 'm_rival_1_wager' }], offerAt: { station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'machine_parts', qty: 5, deliverTo: { nearest: 'station', notHere: true, minHops: 2, maxHops: 6 }, consume: true, text: 'Deliver 5 machine parts to a station 2-6 hops away' },
    ],
    reward: { credits: 420, rep: { quillari: 4, concord: 2 }, item: { vell_calling_card: 1 } },
    deadlineDays: 28,
    failFx: [{ rep: { quillari: -2 } }],
  },
  {
    id: 'm_rival_3_partners', title: 'Partners, Not Rivals', kind: 'diplomacy', arc: 'rival',
    giver: { name: 'Captain Tamsin Vell', species: 'human', faction: 'none' },
    blurb: 'Vell proposes a joint route: your charts and her cargo manifests, one tea service. She needs a Quillari clan to agree. You, she says, are the only one who can make them take her seriously.',
    accept: 'Vell holds out a hand. "Partners? Properly this time?"',
    offerWhen: [{ missionDone: 'm_rival_2_tied_race' }, { item: 'vell_calling_card' }, { rep: { quillari: 8 } }], offerAt: { station: true }, ordered: true,
    objectives: [
      { id: 'o1', type: 'goto', target: { faction: 'quillari', station: 'trade' }, docked: true, text: 'Present the partnership to a Quillari clan market' },
      { id: 'o2', type: 'goto', target: 'gate_anchorage', docked: true, text: 'Sign the joint route at Gate Anchorage' },
    ],
    reward: { credits: 650, rep: { quillari: 8, concord: 6 } },
    deadlineDays: 45,
    onComplete: [{ flag: 'rival_friend' }],
    completeText: 'Vell signs with a flourish that nearly tears the page. "Right. I shall be unbearable about this for years."',
  },

  // ===========================================================================
  // DISTRESS RELIEF (timed, repeatable). `distress:true` = the ENGINE may also spawn these as sector distress calls.
  // ===========================================================================
  {
    id: 'm_distress_medical', title: 'Distress: Medical Kits Needed', kind: 'relief', arc: 'distress', distress: true, repeatable: true,
    giver: { name: 'Relay Operator Fenwick', species: 'human', faction: 'concord' },
    blurb: 'A small settlement has put out a call: a fever is going round, nothing serious, but they have run out of kits and patience. Three medical kits would make a very large difference.',
    accept: '"Hurry, if you can," says Fenwick. "Not fast; just soon."',
    offerWhen: [{ survey: 8 }], offerAt: { station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'medical_kits', qty: 3, deliverTo: { nearest: 'station', notHere: true, minHops: 1, maxHops: 4 }, consume: true, text: 'Deliver 3 medical kits to the settlement (nearest station 1-4 hops away)' },
    ],
    reward: { credits: 320, rep: { concord: 6 }, item: { distress_medal: 1 } },
    deadlineDays: 12,
    failFx: [{ rep: { concord: -2 } }, { morale: -4 }],
  },
  {
    id: 'm_distress_fuel', title: 'Distress: Fuel for a Stranded Hauler', kind: 'relief', arc: 'distress', distress: true, repeatable: true,
    giver: { name: 'Hauler Captain Dunmore', species: 'quillari', faction: 'quillari' },
    blurb: 'A cargo hauler has run out of fuel cells one jump short of anywhere. Dunmore is calm, cheerful and extremely cold. Four fuel cells will get everyone moving again.',
    accept: '"Don\'t rush," says Dunmore, teeth chattering. "But also: rush."',
    offerWhen: [{ survey: 8 }], offerAt: { station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'fuel_cells', qty: 4, deliverTo: { nearest: 'outpost', notHere: true, minHops: 1, maxHops: 5 }, consume: true, text: 'Deliver 4 fuel cells to the stranded hauler (nearest outpost)' },
    ],
    reward: { credits: 300, rep: { quillari: 6 } },
    deadlineDays: 10,
    failFx: [{ rep: { quillari: -2 } }],
  },
  {
    id: 'm_distress_hungry_habitat', title: 'Distress: A Hungry Habitat', kind: 'relief', arc: 'distress', distress: true, repeatable: true,
    giver: { name: 'Harbour-Mother Teasel', species: 'drifter', faction: 'drifters' },
    blurb: 'A drifter habitat has run short of food after a bad harvest in the hydroponics. They will not ask for charity. They will ask you to bring six ration bars in exchange for a story.',
    accept: '"We don\'t beg," says Teasel. "We trade. We trade a good deal in stories."',
    offerWhen: [{ rep: { drifters: 0 } }, { survey: 12 }], offerAt: { faction: 'drifters', station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'ration_bars', qty: 6, deliverTo: { faction: 'drifters', station: true }, consume: true, text: 'Deliver 6 ration bars to the habitat (a drifter station)' },
    ],
    reward: { credits: 340, rep: { drifters: 8 }, item: { story_knot: 1 } },
    deadlineDays: 16,
    failFx: [{ rep: { drifters: -2 } }, { morale: -3 }],
  },

  {
    id: 'm_distress_power_failure', title: 'Distress: Lights Out at the Outpost', kind: 'relief', arc: 'distress', distress: true, repeatable: true,
    giver: { name: 'Outpost Keeper Marnie', species: 'human', faction: 'concord' },
    blurb: 'An outpost has lost a coil in its generator, and everyone is sitting politely in the dark. Three machine parts would put the lights back on. Bring a torch; they asked.',
    accept: '"We are fine," says Marnie, in the dark. "We would just like to be fine with lights."',
    offerWhen: [{ survey: 6 }], offerAt: { station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'machine_parts', qty: 3, deliverTo: { nearest: 'outpost', notHere: true, minHops: 1, maxHops: 5 }, consume: true, text: 'Deliver 3 machine parts to the dark outpost (nearest outpost)' },
    ],
    reward: { credits: 260, rep: { concord: 5 } },
    deadlineDays: 14,
    failFx: [{ rep: { concord: -2 } }, { morale: -3 }],
  },
  {
    id: 'm_distress_lost_pilgrims', title: 'Distress: Pilgrims Without a Ride', kind: 'ferry', arc: 'distress', distress: true, repeatable: true,
    giver: { name: 'Pilgrim Elder Wren', species: 'quillari', faction: 'quillari' },
    blurb: 'A group of pilgrims has missed the last shuttle to the Festival. They are cheerful about it and would be delighted if you gave them a lift to a trade hub. They have brought snacks.',
    accept: '"We have snacks," says Wren. "Lots of snacks. It is your destiny to share them."',
    offerWhen: [{ survey: 6 }], offerAt: { station: true },
    objectives: [
      { id: 'o1', type: 'goto', target: { nearest: 'trade', notHere: true, minHops: 1, maxHops: 4 }, docked: true, text: 'Ferry the pilgrims to the nearest trade station' },
    ],
    reward: { credits: 190, rep: { quillari: 5 }, item: { gossip_pin: 1 } },
    deadlineDays: 12,
    failFx: [{ rep: { quillari: -1 } }],
  },

  // ===========================================================================
  // SURVEY CONTRACTS (big payouts, longer deadlines)
  // ===========================================================================
  {
    id: 'm_contract_veil_atlas', title: 'Contract: An Atlas of the Veil', kind: 'survey', arc: 'contract',
    giver: { name: 'Atlas-Master Prudence Okafor', species: 'human', faction: 'concord' },
    blurb: 'The Society will pay generously for four fully charted systems in the Vesper Veil, to fill the long-blank page in the atlas. Chart gently; the Vesperine are listening.',
    accept: 'Okafor slides a contract across the table. "Sign here, here, and in the margin."',
    offerWhen: [{ survey: 12 }], offerAt: { station: true },
    objectives: [
      { id: 'o1', type: 'chart', target: { region: 'veil', count: 4 }, text: 'Chart four systems in the Vesper Veil' },
    ],
    reward: { credits: 1100, rep: { concord: 6, vesperine: 6 } },
    deadlineDays: 70,
    failFx: [{ rep: { concord: -2 } }],
  },
  {
    id: 'm_contract_choir_pulsars', title: 'Contract: The Pulsar Choir Survey', kind: 'survey', arc: 'contract',
    giver: { name: 'Atlas-Master Prudence Okafor', species: 'human', faction: 'concord' },
    blurb: 'Three systems and a pulsar reading from the Choir, bumpy and beautiful. The pay is large, and so are the bumps. Plan your fuel.',
    accept: '"Bring me the Choir in your notebook," says Okafor, "and I shall bring you the cheque."',
    offerWhen: [{ survey: 25 }], offerAt: { station: true }, ordered: true,
    objectives: [
      { id: 'o1', type: 'chart', target: { region: 'choir', count: 3 }, text: 'Chart three systems in the Pulsar Choir' },
      { id: 'o2', type: 'scan', target: { phenomenon: 'pulsar' }, what: 'phenomenon', phenomenon: 'pulsar', text: 'Take a pulsar reading' },
    ],
    reward: { credits: 1300, rep: { concord: 6, vesperine: 4 }, codex: 'codex_pulsar_radio' },
    deadlineDays: 75,
    failFx: [{ rep: { concord: -2 } }],
  },
  {
    id: 'm_contract_rim_atlas', title: 'Contract: The Quiet Rim Pages', kind: 'survey', arc: 'contract',
    giver: { name: 'Elder Marrow-of-the-Long-Table', species: 'drifter', faction: 'drifters' },
    blurb: 'The drifters have walked the Rim for ages and never drawn it down. They will pay well for three charted systems out there, signed and sealed in a good hand.',
    accept: 'Marrow taps the table. "Draw it true. We shall know if you embroider."',
    offerWhen: [{ survey: 30 }, { rep: { drifters: 5 } }], offerAt: { faction: 'drifters', station: true },
    objectives: [
      { id: 'o1', type: 'chart', target: { region: 'rim', count: 3 }, text: 'Chart three systems on the Quiet Rim' },
    ],
    reward: { credits: 1400, rep: { drifters: 8 } },
    deadlineDays: 80,
    failFx: [{ rep: { drifters: -2 } }],
  },

  // ===========================================================================
  // CARGO BOUNTIES (rare goods, big pay, no hurry)
  // ===========================================================================
  {
    id: 'm_bounty_aurora_silk', title: 'Bounty: Aurora Silk for the Embassy', kind: 'fetch', arc: 'bounty',
    giver: { name: 'Ambassador Linnea Okoro', species: 'human', faction: 'concord' },
    blurb: 'A gala at the nearest embassy needs three bolts of aurora silk, and nothing else will do. Silk is rare, expensive and often found where aurora-beings are shy.',
    accept: '"I need it by the gala," says Okoro, "and by dawn I shall need it even more."',
    offerWhen: [{ survey: 10 }], offerAt: { station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'aurora_silk', qty: 3, deliverTo: { nearest: 'embassy' }, consume: true, text: 'Deliver 3 aurora silk to the nearest embassy' },
    ],
    reward: { credits: 900, rep: { concord: 5, vesperine: 3 } },
    deadlineDays: 60,
  },
  {
    id: 'm_bounty_lantern_glass', title: 'Bounty: Lantern Glass for the Archive', kind: 'fetch', arc: 'bounty',
    giver: { name: 'Shelver Quire-Three', species: 'archivist', faction: 'archivists' },
    blurb: 'The Archive collects Lantern glass, small warm slivers that hum near their kin. Two pieces would be a magnificent acquisition. It would also be, as Quire-Three puts it, "most interesting".',
    accept: '"We will pay any price within reason," says Quire-Three, "and then another price beyond it."',
    offerWhen: [{ survey: 15 }], offerAt: { faction: 'archivists', station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'lantern_glass', qty: 2, deliverTo: { faction: 'archivists', station: true }, consume: true, text: 'Deliver 2 lantern glass to an Archive station' },
    ],
    reward: { credits: 800, rep: { archivists: 8 } },
    deadlineDays: 80,
  },
  {
    id: 'm_bounty_seed_vault', title: 'Bounty: Seed-Vault Crates for the Long Table', kind: 'fetch', arc: 'bounty',
    giver: { name: 'Weaver Tamsin Quickfold', species: 'drifter', faction: 'drifters' },
    blurb: 'The habitat gardens need seed-vault crates before the planting season, and nobody out here knows how to grow things from nothing. Four crates will keep forty habitats in tomatoes.',
    accept: '"Planting season waits for no one," says Tamsin. "Except me. I always arrive late."',
    offerWhen: [{ survey: 12 }], offerAt: { faction: 'drifters', station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'seed_vault_crates', qty: 4, deliverTo: { faction: 'drifters', station: true }, consume: true, text: 'Deliver 4 seed-vault crates to a drifter habitat' },
    ],
    reward: { credits: 650, rep: { drifters: 7 } },
    deadlineDays: 60,
  },
  {
    id: 'm_bounty_antiserum', title: 'Bounty: Antiserum for the Outpost', kind: 'relief', arc: 'bounty',
    giver: { name: 'Nurse Bettany Oakes', species: 'human', faction: 'concord' },
    blurb: 'A remote outpost reports a mildly unpleasant bug and wants a small supply of antiserum vials, just in case. The vials are tricky to find, and the outpost is not close.',
    accept: '"Three vials," says Oakes. "Handle them like soup."',
    offerWhen: [{ survey: 15 }, { rep: { concord: 3 } }], offerAt: { station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'antiserum_vials', qty: 3, deliverTo: { nearest: 'outpost', notHere: true, minHops: 2, maxHops: 6 }, consume: true, text: 'Deliver 3 antiserum vials to a remote outpost (2-6 hops away)' },
    ],
    reward: { credits: 720, rep: { concord: 6 } },
    deadlineDays: 40,
    failFx: [{ rep: { concord: -2 } }],
  },

  // ===========================================================================
  // FACTION DIPLOMACY CHAINS
  // ===========================================================================
  {
    id: 'm_dip_footnote_1', title: 'The Disputed Footnote (I)', kind: 'diplomacy', arc: 'footnote',
    giver: { name: 'Shelver Quire-Three', species: 'archivist', faction: 'archivists' },
    blurb: 'A Quillari clan claims a footnote in an Archive volume as a trade contract. The Archive claims it as a footnote. Both are polite and both are dug in. Carry the Archive\'s greetings to Pennywhistle.',
    accept: '"We shall be reasonable," says Quire-Three, "once they have admitted they are wrong."',
    offerWhen: [{ rep: { archivists: 3 } }, { rep: { quillari: 0 } }], offerAt: { faction: 'archivists', station: true }, ordered: true,
    objectives: [
      { id: 'o1', type: 'goto', target: 'pennywhistle', docked: true, text: 'Hear the Quillari clan at Pennywhistle Exchange' },
    ],
    reward: { credits: 240, rep: { archivists: 4, quillari: 4 } },
    deadlineDays: 35,
  },
  {
    id: 'm_dip_footnote_2', title: 'The Disputed Footnote (II)', kind: 'diplomacy', arc: 'footnote',
    giver: { name: 'Matriarch Sunnifer Quill', species: 'quillari', faction: 'quillari' },
    blurb: 'The clan will give up the footnote for two sheets of fresh Archive vellum, which they say is the principle of the thing. The Archive will accept this. You bring the vellum; everyone gets to be right.',
    accept: '"Vellum is a gift," says the matriarch. "A footnote is a lien. Let us trade honestly."',
    offerWhen: [{ missionDone: 'm_dip_footnote_1' }], offerAt: { station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'vellum_sheets', qty: 2, deliverTo: 'hollow_archive', consume: true, text: 'Deliver 2 vellum sheets to the Central Catalogue (the Hollow Archive)' },
    ],
    reward: { credits: 380, rep: { archivists: 6, quillari: 6 } },
    deadlineDays: 50,
  },
  {
    id: 'm_dip_quiet_treaty_1', title: 'The Quiet Treaty (I)', kind: 'diplomacy', arc: 'quiet_treaty',
    giver: { name: 'Chorister Aelwyn-of-the-Third-Verse', species: 'vesperine', faction: 'vesperine' },
    blurb: 'A drifter habitat parks too close to a Vesperine choir and its machinery clatters at all hours. Neither wants to be rude. Carry soft cloth to muffle the habitat\'s gears, and a kind word to the choir.',
    accept: '"A gift of quiet," says Aelwyn, "is the best gift."',
    offerWhen: [{ rep: { vesperine: 3 } }], offerAt: { faction: 'vesperine', station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'hand_looms', qty: 2, deliverTo: 'long_table', consume: true, text: 'Deliver 2 hand-looms (for muffling cloth) to the Long Table' },
    ],
    reward: { credits: 300, rep: { vesperine: 4, drifters: 4 } },
    deadlineDays: 45,
  },
  {
    id: 'm_dip_quiet_treaty_2', title: 'The Quiet Treaty (II)', kind: 'diplomacy', arc: 'quiet_treaty',
    giver: { name: 'Elder Marrow-of-the-Long-Table', species: 'drifter', faction: 'drifters' },
    blurb: 'The habitat has gone quiet. Now the choir wants to thank them with two tuning crystals, if someone will carry them. Peace by post, delivered by hand.',
    accept: '"Carry it gently," says Marrow. "It is the first quiet gift anyone has sent us."',
    offerWhen: [{ missionDone: 'm_dip_quiet_treaty_1' }], offerAt: { station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'tuning_crystals', qty: 2, deliverTo: 'long_table', consume: true, text: 'Deliver 2 tuning crystals to the Long Table' },
    ],
    reward: { credits: 400, rep: { vesperine: 5, drifters: 5 }, item: { vesperine_tuning_fork: 1 } },
    deadlineDays: 50,
  },

  // ===========================================================================
  // THE LAMPLIGHT FESTIVAL (cozy chain, 3 jobs)
  // ===========================================================================
  {
    id: 'm_festival_1_bunting', title: 'Festival: Bunting for the Bazaar', kind: 'delivery', arc: 'festival',
    giver: { name: 'Festival Marshal Dott', species: 'quillari', faction: 'quillari' },
    blurb: 'The Lamplight Festival is nearly here and the Bazaar has no bunting. Three hand-looms will make some, and the weavers have promised to stay up all night.',
    accept: '"Bunting," says Dott, "is the difference between a market and a party."',
    offerWhen: [{ rep: { quillari: 3 } }], offerAt: { station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'hand_looms', qty: 3, deliverTo: 'pennywhistle', consume: true, text: 'Deliver 3 hand-looms to the Pennywhistle Bazaar' },
    ],
    reward: { credits: 280, rep: { quillari: 5 }, item: { festival_bunting: 1 } },
    deadlineDays: 40,
  },
  {
    id: 'm_festival_2_lanterns', title: 'Festival: Brandy for the Lanterns', kind: 'delivery', arc: 'festival',
    giver: { name: 'Festival Marshal Dott', species: 'quillari', faction: 'quillari' },
    blurb: 'Lanterns burn best on brandy-soaked wicks, according to tradition and a surprisingly authoritative aunt. Three casks of glass brandy to Brightwater Light, please.',
    accept: '"It is for the lamps," says Dott. "Mostly."',
    offerWhen: [{ missionDone: 'm_festival_1_bunting' }], offerAt: { station: true },
    objectives: [
      { id: 'o1', type: 'have', good: 'glass_brandy', qty: 3, deliverTo: 'lantern_brightwater', consume: true, text: 'Deliver 3 casks of glass brandy to Brightwater Light' },
    ],
    reward: { credits: 400, rep: { quillari: 6 } },
    deadlineDays: 45,
  },
  {
    id: 'm_festival_3_parade', title: 'Festival: The Lamplight Parade', kind: 'story', arc: 'festival',
    giver: { name: 'Festival Marshal Dott', species: 'quillari', faction: 'quillari' },
    blurb: 'The parade route is three harbours long, and Halcyon is leading it. Wave at everyone, hang a ribbon from the mast, and arrive home before the pastries run out.',
    accept: 'Dott ties a ribbon to the mast, then a second one, then a third.',
    offerWhen: [{ missionDone: 'm_festival_2_lanterns' }], offerAt: { station: true }, ordered: true,
    objectives: [
      { id: 'o1', type: 'goto', target: 'pennywhistle', docked: true, text: 'Start the parade at Pennywhistle Exchange' },
      { id: 'o2', type: 'goto', target: 'lantern_brightwater', docked: true, text: 'Parade to Brightwater Light' },
      { id: 'o3', type: 'goto', target: 'gate_anchorage', docked: true, text: 'Finish the parade at Gate Anchorage' },
    ],
    reward: { credits: 500, rep: { quillari: 6, concord: 4 }, item: { festival_ribbon: 1 } },
    deadlineDays: 70,
    onComplete: [{ morale: 15 }, { flag: 'festival_chain_done' }],
    completeText: 'Confetti, pastries, and a flotilla of paper lanterns. Even Gus-7 cries a little, which is very out of character for a galley bot.',
  },
];

// =============================================================================
// PROCEDURAL TEMPLATES (9)
// =============================================================================
export const TEMPLATES = [
  {
    id: 't_delivery_basic', kind: 'delivery', weight: 14, factions: 'any',
    giverPool: [
      { name: 'Dispatcher Marl', species: 'human' }, { name: 'Quartermaster Fenn', species: 'human' },
      { name: 'Trader Bellwhistle', species: 'quillari' }, { name: 'Weaver Sunny', species: 'drifter' },
    ],
    title: 'Freight to {toSystem}',
    blurb: '{giver} needs {qty} {goodName} moved to {toSystem}. Honest cargo, honest rates, and a short note about not tilting the crates.',
    accept: '"Straightforward," says {giver}. "Which is rarer than you\'d think."',
    pick: { toSystem: { nearest: 'station', notHere: true, minHops: 1, maxHops: 5 }, goodId: { category: ['food', 'material', 'tech'] }, qty: [3, 8] },
    objectives: [
      { id: 'o1', type: 'have', good: '{goodId}', qty: '{qty}', deliverTo: '{toSystem}', consume: true, text: 'Deliver {qty} {goodName} to {toSystem}' },
    ],
    deadlineBase: 14, deadlinePerJump: 8,
    reward: { credits: { base: 60, perUnit: 14, perJump: 25 }, rep: { $faction: 2 } },
    repeatable: true,
  },
  {
    id: 't_delivery_luxury', kind: 'delivery', weight: 6, factions: ['quillari', 'concord'],
    giverPool: [{ name: 'Madam Pellucid', species: 'quillari' }, { name: 'Steward Aldous', species: 'human' }],
    title: 'A Fine Thing for {toSystem}',
    blurb: '{giver} would like {qty} {goodName} delivered to {toSystem}, with a ribbon on, and not a scratch. The reward is generous and the standards are very high.',
    accept: '"Treat it like a baby bird," says {giver}. "Or an expensive vase."',
    pick: { toSystem: { nearest: 'trade', notHere: true, minHops: 2, maxHops: 6 }, goodId: { category: ['luxury'] }, qty: [2, 5] },
    objectives: [
      { id: 'o1', type: 'have', good: '{goodId}', qty: '{qty}', deliverTo: '{toSystem}', consume: true, text: 'Deliver {qty} {goodName} to {toSystem}' },
    ],
    deadlineBase: 20, deadlinePerJump: 8,
    reward: { credits: { base: 120, perUnit: 40, perJump: 35 }, rep: { $faction: 3 } },
    repeatable: true,
  },
  {
    id: 't_delivery_rush', kind: 'delivery', weight: 5, factions: 'any',
    giverPool: [{ name: 'Harried Postmaster Dill', species: 'human' }, { name: 'Courier Flit', species: 'quillari' }],
    title: 'Rush Order: {goodName}',
    blurb: 'It is only mildly urgent, say {giver}, in a voice that suggests it is deeply urgent. {qty} {goodName} to {toSystem}, as soon as is comfortable.',
    accept: '"Fast," says {giver}, "but please don\'t hurry."',
    pick: { toSystem: { nearest: 'station', notHere: true, minHops: 2, maxHops: 4 }, goodId: { category: ['medical', 'fuel', 'food'] }, qty: [2, 6] },
    objectives: [
      { id: 'o1', type: 'have', good: '{goodId}', qty: '{qty}', deliverTo: '{toSystem}', consume: true, text: 'Deliver {qty} {goodName} to {toSystem}' },
    ],
    deadlineBase: 8, deadlinePerJump: 5,
    reward: { credits: { base: 100, perUnit: 18, perJump: 45 }, rep: { $faction: 3 } },
    failFx: [{ rep: { $faction: -1 } }],
    repeatable: true,
  },
  {
    id: 't_survey_planets', kind: 'survey', weight: 9, factions: ['concord', 'archivists'],
    giverPool: [{ name: 'Field Cartographer Ines', species: 'human' }, { name: 'Surveyor Plumb-Two', species: 'archivist' }],
    title: 'Survey {toSystem}',
    blurb: '{giver} is missing a few planets from the catalogue of {toSystem}. They are almost certainly still there. Would you scan them and report back?',
    accept: '"All of them," says {giver}, "even the dull ones. Especially the dull ones."',
    pick: { toSystem: { nearest: 'uncharted', notHere: true, minHops: 1, maxHops: 4 } },
    objectives: [
      { id: 'o1', type: 'chart', target: '{toSystem}', text: 'Chart {toSystem}' },
    ],
    deadlineBase: 20, deadlinePerJump: 8,
    reward: { credits: { base: 110, perJump: 30 }, rep: { $faction: 3 } },
    repeatable: true,
  },
  {
    id: 't_survey_nebula', kind: 'survey', weight: 5, factions: ['concord', 'vesperine'],
    giverPool: [{ name: 'Meteorologist Odalys Finch', species: 'human' }, { name: 'Chorister Aelwyn', species: 'vesperine' }],
    title: 'Take a Reading at {toSystem}',
    blurb: '{giver} needs a nebula sample from {toSystem}. The nebula is cooperative. Mostly.',
    accept: '"Gentle hands," says {giver}. "It is shy."',
    pick: { toSystem: { phenomenon: 'nebula', notHere: true, minHops: 1, maxHops: 6 } },
    objectives: [
      { id: 'o1', type: 'goto', target: '{toSystem}', text: 'Travel to {toSystem}' },
      { id: 'o2', type: 'scan', target: '{toSystem}', what: 'phenomenon', phenomenon: 'nebula', text: 'Sample the nebula' },
    ],
    deadlineBase: 20, deadlinePerJump: 8,
    reward: { credits: { base: 130, perJump: 32 }, rep: { $faction: 3 } },
    repeatable: true,
  },
  {
    id: 't_ferry_passenger', kind: 'ferry', weight: 8, factions: 'any',
    giverPool: [{ name: 'Pilgrim Ormsby', species: 'human' }, { name: 'Student Tilly', species: 'quillari' }, { name: 'Dowager Resonance', species: 'vesperine' }],
    title: 'Passage to {toSystem}',
    blurb: '{giver} would like a berth to {toSystem}. They will be no trouble, though they will certainly have opinions about the tea.',
    accept: '"A comfortable bunk," says {giver}, "and a view. That\'s all."',
    pick: { toSystem: { nearest: 'station', notHere: true, minHops: 2, maxHops: 6 } },
    objectives: [
      { id: 'o1', type: 'goto', target: '{toSystem}', docked: true, text: 'Take {giver} to {toSystem}' },
    ],
    deadlineBase: 18, deadlinePerJump: 8,
    reward: { credits: { base: 90, perJump: 40 }, rep: { $faction: 3 } },
    repeatable: true,
  },
  {
    id: 't_relief_supplies', kind: 'relief', weight: 7, factions: ['concord', 'drifters', 'quillari'],
    giverPool: [{ name: 'Relief Coordinator Hale', species: 'human' }, { name: 'Harbour-Mother Teasel', species: 'drifter' }],
    title: 'Relief Run to {toSystem}',
    blurb: '{toSystem} is short on {goodName}. It is a small shortage, and nobody is in danger, but there is a small child who really wants some.',
    accept: '"Everything helps," says {giver}. "Even a little."',
    pick: { toSystem: { nearest: 'station', notHere: true, minHops: 1, maxHops: 5 }, goodId: { category: ['food', 'medical'] }, qty: [3, 7] },
    objectives: [
      { id: 'o1', type: 'have', good: '{goodId}', qty: '{qty}', deliverTo: '{toSystem}', consume: true, text: 'Deliver {qty} {goodName} to {toSystem}' },
    ],
    deadlineBase: 16, deadlinePerJump: 8,
    reward: { credits: { base: 70, perUnit: 12, perJump: 30 }, rep: { $faction: 5 } },
    repeatable: true,
  },
  {
    id: 't_fetch_curio', kind: 'fetch', weight: 6, factions: ['quillari', 'archivists', 'drifters'],
    giverPool: [{ name: 'Collector Dorwin', species: 'quillari' }, { name: 'Shelver Quire-Eleven', species: 'archivist' }, { name: 'Tinker Odd', species: 'drifter' }],
    title: 'Anything Interesting on {planet}?',
    blurb: '{giver} has a suspicion that {planet}, near {toSystem}, hides something delightful. Go scan it and tell them what you find.',
    accept: '"Take notes," says {giver}. "Or sketches. I am not fussy."',
    pick: { toSystem: { planetType: 'barren', notHere: true, minHops: 1, maxHops: 5 }, planet: { planetType: 'barren' } },
    objectives: [
      { id: 'o1', type: 'goto', target: '{toSystem}', text: 'Travel to {toSystem}' },
      { id: 'o2', type: 'scan', target: '{toSystem}', what: 'planets', count: 1, text: 'Scan {planet}' },
    ],
    deadlineBase: 20, deadlinePerJump: 8,
    reward: { credits: { base: 100, perJump: 28 }, rep: { $faction: 3 }, item: { sector_charts: 1 } },
    repeatable: true,
  },
  {
    id: 't_courier_letter', kind: 'delivery', weight: 6, factions: 'any',
    giverPool: [{ name: 'Lovelorn Clerk Pip', species: 'human' }, { name: 'Grandmother Peshwick', species: 'quillari' }, { name: 'Elder Marrow', species: 'drifter' }],
    title: 'A Letter for {toSystem}',
    blurb: '{giver} has a letter that must be carried by hand to {toSystem}. It smells of lavender. Please do not read it, though it is very tempting.',
    accept: '"By hand," says {giver}. "And with feeling."',
    pick: { toSystem: { nearest: 'station', notHere: true, minHops: 1, maxHops: 6 } },
    objectives: [
      { id: 'o1', type: 'goto', target: '{toSystem}', docked: true, text: 'Deliver the letter to {toSystem}' },
    ],
    deadlineBase: 20, deadlinePerJump: 8,
    reward: { credits: { base: 50, perJump: 28 }, rep: { $faction: 2 }, item: { tea_tin: 1 } },
    repeatable: true,
  },
];
