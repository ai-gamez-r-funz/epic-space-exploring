// EVENTS-A: mid-jump encounters and arrivals. No combat; every scrape dissolves through wit, trade, science or flight.
//
// ITEMS: (unknown ids are treated as simple counters by the engine)
//   auntie_patch   - "Rusted Aunties Patch": a stitched felt badge; salvage clans wave you through.
//   toll_token     - "Free-Passage Token": Quillari brass disc; pays one toll buoy.
//   gossip_pin     - "Gossip Pin": enamel pin of a Quillari market-whisperer; unlocks sly asides.
//   (others used by diplomacy.js: concord_stamp, choir_reed, riddle_coin, story_knot, lantern_sprig)
//
// FLAGS set: tutorial_tea, tutorial_odds, mirror_seen, auntie_friend, comet_tea
// FLAGS read here (set in diplomacy.js): stowaway_aboard, drone_friend, festival_invited
//
// FIX ROUND 1 additions (travel.js):
//   RIVAL (Capt. Tamsin Vell, free-trader of the Gadabout): rival_met, rival_friend, rival_grudge, vell_owes (-> rival_vell_rescue
//     pays off when low on fuel/supplies/hull), vell_best_friend; counter rival_n gates the sequence first -> dock -> breakdown.
//   DISTRESS family: dist_faint_call / dist_signal_fades set+clear flag `distress_active` (the engine may also set it for its
//     timed beacon); variants dist_air_thin, dist_lifepod, dist_dry_tank fire via startEvent or when distress_active is set.
//     Flags carried: distress_ignored, owed_by_drifters, courier_owed, orla_owes.
//   CALLBACKS: cb_courier_returns, cb_orla_repays, cb_hab_banquet, cb_tollkeeper_remembers (tollgate_friend),
//     cb_rumour_wreck (rumour_wreck), cb_pip_repays (pip_owes), cb_pell_favour (pell_friend).
//   Other flags set: rim_whisper, uncle_intro, teletype_ignored, wishlist_flush, dobbin_flower, rumour_storm_lane (diplomacy.js).
//   TEASERS for upgrades: tease_cartographers_table, tease_translator_parrot, tease_solar_sails (choices gated on those upgrades).
//   No new item ids were invented in round 1: every item used already exists in ITEM_DEFS.
//
// Goods used: ration_bars, glass_brandy, tuning_crystals, vellum_sheets, hand_looms, medical_kits, fuel_cells,
//             star_charts, curios, machine_parts

export default [
  {
    id: 'travel_teletype_tea',
    title: 'The Chattering Teletype',
    tags: ['comedy', 'wonder'],
    ctx: 'travel',
    weight: 60,
    when: [{ day: [1, 14] }],
    once: true,
    art: { scene: 'lounge', species: 'robot', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Dobbin', species: 'robot' },
        text: 'The lounge teletype chatters on its own. Dobbin tears off the tape. "Captain, a reminder: jumps burn fuel and days, crew eat supplies, and morale runs on tea. These are the three laws of the Halcyon."',
        choices: [
          { label: 'Read the tape properly', tag: 'science', do: { text: 'The tape says: "Keep fuel above one jump, buy supplies before you need them, and chart everything." Dobbin adds, "Underlined twice."', fx: [{ flag: 'tutorial_tea' }, { morale: 2 }], goto: 'b' } },
          { label: 'Ask Dobbin for the short version', tag: 'wait', do: { text: '"Do not run out of things," says Dobbin. "Also, I have been told I am charming."', fx: [{ flag: 'tutorial_tea' }], goto: 'b' } },
          { label: 'Pour the tea and ignore the tape', tag: 'wait', do: { text: 'The tea is perfect. The tape curls onto the floor and, sulking, becomes a streamer.', fx: [{ flag: 'tutorial_tea' }, { morale: 5 }, { supplies: -1 }] } },
        ],
      },
      b: {
        speaker: { name: 'Dobbin', species: 'robot' },
        text: '"One more thing. When a choice shows a percentage, that is the odds of success. Failure is rarely fatal. Usually it merely costs scrip, or becomes a story to tell at supper."',
        choices: [
          { label: '"Noted. Thank you, Dobbin."', tag: 'wait', do: { text: 'Dobbin whirrs, pleased. The teletype adds, unprompted: "GOOD LUCK CAPTAIN."', fx: [{ flag: 'tutorial_odds' }] } },
        ],
      },
    },
  },

  {
    id: 'travel_concord_buoy_lesson',
    title: 'Beacon 7-Alpha, Unmanned',
    tags: ['science', 'diplomacy'],
    ctx: 'travel',
    weight: 22,
    when: [{ day: [1, 14] }],
    once: true,
    art: { scene: 'starfield', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Recorded Voice', species: 'human' },
        text: '"This is Concord Survey Beacon 7-Alpha. I am unmanned, cheerful, and slightly out of tune. If you are an explorer, please recalibrate me. If you are a cloud, please move along."',
        choices: [
          { label: 'Recalibrate the beacon', tag: 'science', check: { skill: 'science', diff: 2 }, pass: { text: '{crew:science} tunes the beacon to the hair. It plays a three-note jingle and uploads a tidy fold of charts into your library.', fx: [{ reveal: { radius: 1 } }, { rep: { concord: 2 } }, { xp: { science: 1 } }] }, fail: { text: 'The beacon hiccups, sings a sea shanty, and shuts off in embarrassment. Pride dented, charts intact.', fx: [{ morale: -1 }, { xp: { science: 1 } }] } },
          { label: 'Wave and move along', tag: 'wait', do: { text: '"Thank you for visiting," the beacon says, to nobody in particular, for the nine-thousandth time.', fx: [] } },
        ],
      },
    },
  },

  {
    id: 'travel_rusted_aunties',
    title: 'The Rusted Aunties',
    tags: ['diplomacy', 'persuade', 'flee', 'comedy'],
    ctx: 'travel',
    weight: 14,
    when: [{ day: [4, 999] }],
    cooldown: 25,
    art: { scene: 'ship_alien', species: 'drifter', palette: 'rust' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Mother Cog', species: 'drifter' },
        text: 'Three patchwork tugs close in, grapple-arms folded in what might be menace or a stretch. "HALCYON! Surrender your interesting cargo to the Rusted Aunties!" A pause. "Please?"',
        choices: [
          { label: 'Open a polite channel', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'You ask after their health. Mother Cog is so surprised that she answers honestly.', fx: [], goto: 'b' }, fail: { text: 'You mention "regulations" and she bristles. "Aunties don\'t do regulations." Still, she agrees to talk, for a modest consideration.', fx: [{ credits: -10 }], goto: 'b' } },
          { label: 'Hand over some machine parts', tag: 'trade', if: [{ cargo: { machine_parts: 1 } }], do: { text: 'A tug swallows the crate, whirs, and a tiny arm waves a stitched patch at you. "Family now. Don\'t tell the Concord."', fx: [{ cargo: { machine_parts: -1 } }, { item: { auntie_patch: 1 } }, { rep: { drifters: 4 } }, { flag: 'auntie_friend' }] } },
          { label: 'Bluff: "Concord inspectors are aboard"', tag: 'persuade', check: { skill: 'diplomacy', diff: 4 }, pass: { text: 'The tugs scatter like startled hens. Mother Cog radios, laughing: "Good one, Captain. Wave to the inspectors for us!"', fx: [{ morale: 3 }, { rep: { drifters: 1 } }] }, fail: { text: '"Inspectors! Splendid! We have forms!" They are unconvinced, and now rather curious.', fx: [{ morale: -2 }], goto: 'b' } },
          { label: 'Slip away on a tight arc', tag: 'flee', check: { skill: 'piloting', diff: 4 }, pass: { text: 'The Halcyon threads the tugs like a needle. Mother Cog radios a reluctant "nice flying."', fx: [{ fuel: -1 }, { xp: { piloting: 1 } }] }, fail: { text: 'A grapple-arm clings briefly to your hull plating and takes a flake of paint home as a souvenir.', fx: [{ hull: -3 }, { fuel: -1 }] } },
        ],
      },
      b: {
        speaker: { name: 'Mother Cog', species: 'drifter' },
        text: '"Truth is, our reactor is sulking and we are short of a few parts. The \'surrender\' routine works on Concord surveyors. Mostly they apologise and give us biscuits."',
        choices: [
          { label: 'Have {crew:random} take a look at the reactor', tag: 'science', check: { skill: 'engineering', diff: 3 }, pass: { text: 'One loose coupling and a firm word later, the reactor purrs. The Aunties cheer and stitch you a patch.', fx: [{ item: { auntie_patch: 1 } }, { rep: { drifters: 5 } }, { flag: 'auntie_friend' }, { xp: { engineering: 1 } }] }, fail: { text: 'It sulks louder, but you leave them enough advice to limp home. They pay in biscuits and goodwill.', fx: [{ rep: { drifters: 2 } }, { supplies: 1 }] } },
          { label: 'Spare two fuel cells', tag: 'trade', if: [{ fuel: 3 }], do: { text: 'They accept with great dignity and mild weeping.', fx: [{ fuel: -2 }, { rep: { drifters: 3 } }, { flag: 'auntie_friend' }] } },
          { label: 'Wish them luck and withdraw', tag: 'wait', do: { text: '"Biscuits next time," Mother Cog promises. You doubt it, but warmly.', fx: [] } },
        ],
      },
    },
  },

  {
    id: 'travel_customs_cutter',
    title: 'Customs Cutter Perpetua',
    tags: ['diplomacy', 'comedy', 'flee'],
    ctx: 'travel',
    weight: 11,
    when: [{ day: [6, 999] }],
    cooldown: 20,
    art: { scene: 'ship_alien', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Inspector Pell', species: 'human' },
        text: '"ISV Halcyon, this is Concord Customs Cutter Perpetua. We must inspect your vessel for contraband, undeclared whimsy, and improper lanterns. Hold position and prepare your manifest in triplicate."',
        choices: [
          { label: 'Submit to inspection', tag: 'diplomacy', do: { text: 'Pell\'s crew spend an hour and a half in your cargo bay and leave with great satisfaction and a stamped slip. You lose a morning but gain a friend.', fx: [{ days: 1 }, { rep: { concord: 3 } }], goto: 'b' } },
          { label: 'Declare your cargo with panache', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"Whimsy: none, Lanterns: aspirational." Pell laughs, stamps the form, and wishes you fair skies.', fx: [{ rep: { concord: 2 } }, { morale: 2 }], goto: 'b' }, fail: { text: 'Your triplicate comes out as quadruplicate. A recount costs time and a small processing fee.', fx: [{ credits: -15 }, { days: 1 }] } },
          { label: 'Wait: a Concord stamp is just the thing', tag: 'trade', if: [{ item: 'concord_stamp' }], do: { text: 'Pell sees the Provisional Stamp and salutes. "Carry on, Captain. Mind the Form 7s."', fx: [{ rep: { concord: 2 } }, { morale: 3 }] } },
          { label: 'Plot a clever evasive arc', tag: 'flee', check: { skill: 'piloting', diff: 4 }, pass: { text: 'You vanish into a dust lane. The cutter\'s radio crackles: "Well flown. We\'ll just mark you as inspected-in-spirit."', fx: [{ fuel: -1 }, { xp: { piloting: 1 } }] }, fail: { text: 'You flush a flock of survey drones. Pell sighs, collects an apology fee and a recount.', fx: [{ credits: -20 }, { days: 1 }] } },
        ],
      },
      b: {
        speaker: { name: 'Inspector Pell', species: 'human' },
        text: '"One last thing, Captain, off the record. Customs is short-handed this season. If you spot an unmarked buoy, a lost parcel, anything lost, would you be so kind as to radio it in? We would owe you a favour. A small one. A bureaucratic one."',
        choices: [
          { label: 'Promise to radio in anything odd', tag: 'diplomacy', do: { text: 'Pell makes a note: \'Halcyon: cooperative, tea-adjacent.\' You feel quietly deputised.', fx: [{ flag: 'pell_friend' }, { rep: { concord: 2 } }, { morale: 2 }] } },
          { label: 'Ask whether the favour comes with a fuel discount', tag: 'trade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"Twenty percent off the next top-up. Tell the clerk Pell sent you."', fx: [{ fuel: 3 }, { flag: 'pell_friend' }] }, fail: { text: '"Favours are not discounts, Captain. They are sentiments." He smiles, though.', fx: [{ flag: 'pell_friend' }] } },
        ],
      },
    },
  },

  {
    id: 'travel_glassmoth_swarm',
    title: 'Glassmoth Courtship',
    tags: ['science', 'wonder', 'flee'],
    ctx: 'travel',
    weight: 12,
    when: [{ day: [5, 999] }],
    cooldown: 30,
    art: { scene: 'starfield', species: 'unknown' },
    start: 'a',
    nodes: {
      a: {
        text: 'A cloud of crystalline moths, each the size of a hand, closes around the Halcyon. They tap the viewport in rhythm. The sensors report territorial behaviour. {crew:science} frowns. "Or possibly courtship."',
        choices: [
          { label: 'Study the rhythm', tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: 'Your science officer matches the pulse with a running-light flicker. The swarm swirls into a spiral, sheds a dusting of glittering scales, and bows away.', fx: [{ xp: { science: 2 } }, { morale: 4 }, { cargo: { curios: 1 } }], goto: 'b' }, fail: { text: 'You flicker the wrong rhythm. The swarm politely looks away, which is somehow worse.', fx: [{ morale: -2 }] } },
          { label: 'Hold still and hum', tag: 'wait', do: { text: 'The moths settle on the hull for an hour like glittering frost, then lift off together. Nothing is harmed, and everyone feels oddly blessed.', fx: [{ morale: 2 }] } },
          { label: 'Boost out of the cloud', tag: 'flee', check: { skill: 'piloting', diff: 3 }, pass: { text: 'You burst clear; the swarm trails for a moment, shimmering behind like a bridal veil.', fx: [{ fuel: -1 }] }, fail: { text: 'Moths flurry across the intake and your coolant takes a minute to forgive you.', fx: [{ fuel: -1 }, { hull: -2 }] } },
        ],
      },
      b: {
        text: 'Under the lab lens the scales refract in seven colours. They would make fine jewellery, or a respectable lab sample.',
        choices: [
          { label: 'Log them for the Meridian Society', tag: 'science', do: { text: 'The Society pays in glowing reports and a modest grant.', fx: [{ credits: 30 }, { rep: { concord: 1 } }] } },
          { label: 'Keep a sample for the lounge', tag: 'wait', do: { text: 'The scales go on the lounge shelf and cast tiny rainbows over the tea things.', fx: [{ morale: 4 }] } },
        ],
      },
    },
  },

  {
    id: 'travel_ion_squall_surf',
    title: 'Riding the Squall',
    tags: ['hazard', 'flee', 'wonder'],
    ctx: 'travel',
    weight: 22,
    when: [{ system: { danger: 2 } }],
    cooldown: 15,
    art: { scene: 'ionstorm', species: 'unknown' },
    start: 'a',
    nodes: {
      a: {
        text: 'An ion squall boils up across your lane, blue-white and crackling. The sensors chirp politely. {crew:random} grips the rail. "I have never surfed a storm before," they say, hopefully.',
        choices: [
          { label: 'Ride the wavefront', tag: 'flee', check: { skill: 'piloting', diff: 4 }, pass: { text: 'The Halcyon carves the squall\'s leading edge like a gull on a gale. You arrive with less fuel spent than planned, and a great deal of whooping.', fx: [{ fuel: 1 }, { morale: 5 }, { xp: { piloting: 2 } }] }, fail: { text: 'The wavefront shrugs you off. Lights flicker, tea sloshes, and a console sulks for an hour.', fx: [{ hull: -4 }, { morale: -2 }] } },
          { label: 'Shut down, shelter and wait', tag: 'wait', do: { text: 'You wait out the storm in a pocket of calm. Dobbin reads aloud from a seed catalogue.', fx: [{ days: 1 }, { supplies: -1 }] } },
          { label: 'Fly round the long way', tag: 'flee', do: { text: 'Plenty of space, plenty of patience. The detour stretches the jump, but the hull sails through unscarred.', fx: [{ fuel: -2 }] } },
        ],
      },
    },
  },

  {
    id: 'travel_phantom_teletype',
    title: 'Tomorrow\'s Message',
    tags: ['mystery', 'wonder'],
    ctx: 'travel',
    weight: 8,
    when: [{ day: [10, 999] }],
    once: true,
    art: { scene: 'void', species: 'unknown' },
    start: 'a',
    nodes: {
      a: {
        text: 'The bridge teletype stutters and prints a line on its own: "ISV HALCYON TO ISV HALCYON. WE HAVE BEEN WAITING. PLEASE REMEMBER THE LANTERN IS A QUESTION, NOT AN ANSWER." The ribbon ends mid-word.',
        choices: [
          { label: 'Trace the signal', tag: 'science', check: { skill: 'science', diff: 4 }, pass: { text: 'The carrier wave points at no place at all, and is addressed in your own call-sign. A first-class puzzle for the log.', fx: [{ xp: { science: 2 } }, { flag: 'mirror_seen' }], goto: 'b' }, fail: { text: 'The trace dissolves into static that sounds almost like laughter. Kindly laughter.', fx: [{ xp: { science: 1 } }], goto: 'b' } },
          { label: 'File the tape in the captain\'s log', tag: 'wait', do: { text: 'You tuck the ribbon into the log with a felt-tip note: "Ask someone clever." Morale rises, in a worried way.', fx: [{ morale: 2 }, { flag: 'mirror_seen' }], goto: 'b' } },
        ],
      },
      b: {
        text: 'Next morning, the teletype stutters again. A second ribbon: a string of coordinates, then the words "COME ALONE. NOT ALONE. BRING TEA." Dobbin examines the tape, then the teapot, then the tape.',
        choices: [
          { label: 'Plot the coordinates (1 day, 1 fuel)', tag: 'science', if: [{ fuel: 2 }], do: { text: 'The coordinates lead to a quiet patch of space with no star at all. The helm admits to a slight sense of occasion.', fx: [{ days: 1 }, { fuel: -1 }, { reveal: { radius: 2 } }], goto: 'c' } },
          { label: 'Ignore it and press on', tag: 'wait', do: { text: 'You file the ribbon in a drawer marked "LATER". The drawer hums faintly all night.', fx: [{ flag: 'teletype_ignored' }, { morale: -1 }] } },
        ],
      },
      c: {
        text: 'Nothing is there but a small brass buoy, no bigger than a kettle, playing a tinny version of the Halcyon\'s own departure jingle. Its lamp blinks once, politely, as if awaiting an answer.',
        choices: [
          { label: 'Scan the buoy', tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: 'The scan shows a mechanism older than the Gate, wound by hand. A tiny tag reads: "FOR THE ONE WHO CAME."', fx: [{ xp: { science: 2 } }], goto: 'd' }, fail: { text: 'The scan finds nothing but warmth. The buoy seems pleased with this.', fx: [{ xp: { science: 1 } }], goto: 'd' } },
          { label: 'Hail it', tag: 'diplomacy', do: { text: '"Hello," you say. The buoy replies in your own voice: "Hello. We have been expecting you for some time."', fx: [{ morale: 3 }], goto: 'd' } },
          { label: 'Leave a cup of tea on the airlock sill', tag: 'wait', do: { text: 'The tea steams outside the window for a full minute. Then the cup is gone, and in its place, a folded chart.', fx: [{ supplies: -1 }, { morale: 5 }], goto: 'd' } },
        ],
      },
      d: {
        text: 'The buoy unfolds like a paper crane. Inside is a hand-drawn chart of the way ahead, in felt-tip, with small marginal notes: "mind the third star", "this one sings", "here be tea". The buoy dims. It has done what it came for.',
        choices: [
          { label: 'Take the chart with thanks', tag: 'science', do: { text: 'The chart is a gift, and a promise. Whoever drew it knew the road ahead, and wished you well on it.', fx: [{ reveal: { radius: 4 } }, { item: { sector_charts: 1 } }, { flag: 'mirror_seen' }, { morale: 8 }] } },
        ],
      },
    },
  },

  {
    id: 'travel_comet_tea',
    title: 'Tea in the Comet\'s Tail',
    tags: ['wonder', 'comedy', 'science'],
    ctx: 'travel',
    weight: 10,
    when: [{ day: [3, 999] }],
    cooldown: 40,
    art: { scene: 'comet', species: 'robot' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Dobbin', species: 'robot' },
        text: '"Captain, there is a comet ahead. Its tail runs parallel to our course. The lounge viewport is, by my calculation, the best seat in the sector. I have taken the liberty of making tea."',
        choices: [
          { label: 'Drop everything for tea', tag: 'wait', do: { text: 'The whole crew crowds the lounge as the tail glides past in rose and aquamarine. Someone proposes a toast. Someone else proposes another.', fx: [{ morale: 8 }, { supplies: -1 }, { flag: 'comet_tea' }], goto: 'b' } },
          { label: 'Take samples from the tail', tag: 'science', check: { skill: 'science', diff: 2 }, pass: { text: 'Pristine ice, clean data, and a rare chemical signature the Society will adore.', fx: [{ credits: 25 }, { xp: { science: 1 } }, { morale: 2 }], goto: 'b' }, fail: { text: 'The sampler freezes shut. You still drink the tea.', fx: [{ morale: 2 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Dobbin', species: 'robot' },
        text: '"Captain, as the tail clears the viewport, I have noticed that the comet\'s ice is exactly the right temperature for iced tea. I would not presume. But I have a jug."',
        choices: [
          { label: 'Fill the jug with comet ice', tag: 'trade', do: { text: 'Comet ice, clean and bright, goes into the jug. Tomorrow\'s tea will be the best anyone has ever drunk on this ship.', fx: [{ item: { comet_ice: 1 } }, { morale: 3 }] } },
          { label: 'Turn the ship around to ride the tail longer (-1 fuel)', tag: 'wait', do: { text: 'The extra hour in the tail is pure joy. Dobbin plays a selection from his tape collection, quietly.', fx: [{ fuel: -1 }, { morale: 6 }] } },
        ],
      },
    },
  },

  {
    id: 'travel_coupling_hiccup',
    title: 'The Fuel Cells Are Fine',
    tags: ['hazard', 'comedy'],
    ctx: 'travel',
    weight: 13,
    when: [{ day: [3, 999] }],
    cooldown: 14,
    art: { scene: 'engine_room', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Chief Engineer', species: 'human' },
        text: '"Captain, the coolant… er, the fuel cells are fine. Mostly fine. There is a small whine from the number-two coupling that I am calling \'character\'."',
        choices: [
          { label: 'Have a look yourselves', tag: 'science', check: { skill: 'engineering', diff: 3 }, pass: { text: 'A bent shim and one very patient wrench later, the whine falls silent. Engineering is smug for the rest of the day.', fx: [{ xp: { engineering: 1 } }, { morale: 3 }] }, fail: { text: 'The coupling coughs a ring of steam over everyone, then forgives you.', fx: [{ hull: -3 }, { morale: -1 }] } },
          { label: 'Fit a spare from the machine parts', tag: 'trade', if: [{ cargo: { machine_parts: 1 } }], do: { text: 'The new coupling slides home with a pleased click. The old one is retired to the mantelpiece.', fx: [{ cargo: { machine_parts: -1 } }, { morale: 2 }] } },
          { label: 'Toss a coin and trust the whine', tag: 'wait', rand: [[3, { text: 'The whine fades on its own. The Chief shakes his head in awe.', fx: [{ morale: 1 }] }], [2, { text: 'The whine becomes a shriek, then a polite cough, and costs a little fuel to quiet.', fx: [{ fuel: -1 }] }]] },
        ],
      },
    },
  },

  {
    id: 'travel_sick_trader_beacon',
    title: 'The Hiccup Fever',
    tags: ['relief', 'science', 'diplomacy'],
    ctx: 'travel',
    weight: 11,
    when: [{ day: [6, 999] }],
    cooldown: 28,
    art: { scene: 'sickbay', species: 'drifter' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Tamsin Oru', species: 'drifter' },
        text: '"Halcyon, this is trader Tamsin Oru, drifting quietly. My whole crew has the hiccups. Not funny, we have been at it for two days. Any chance of a doctor? Hic."',
        choices: [
          { label: 'Beam over a treatment', tag: 'science', check: { skill: 'medicine', diff: 2 }, pass: { text: '{crew:medicine} diagnoses a harmless pollen. Three drops of sedative tea, and the hiccups hush.', fx: [{ rep: { drifters: 4 } }, { xp: { medicine: 2 } }, { morale: 3 }], goto: 'b' }, fail: { text: 'The first treatment makes the hiccups louder; the second quiets them. Tamsin is grateful and slightly hoarse.', fx: [{ rep: { drifters: 2 } }, { xp: { medicine: 1 } }], goto: 'b' } },
          { label: 'Donate a medical kit', tag: 'trade', if: [{ cargo: { medical_kits: 1 } }], do: { text: 'Tamsin pays what she can in scrip and thanks; the leaflet in the kit is, she says, hilarious.', fx: [{ cargo: { medical_kits: -1 } }, { rep: { drifters: 4 } }, { credits: 40 }], goto: 'b' } },
          { label: 'Send best wishes and keep going', tag: 'wait', do: { text: '"Hic. Understood. We\'ll… hic… manage."', fx: [{ morale: -2 }] } },
        ],
      },
      b: {
        speaker: { name: 'Tamsin Oru', species: 'drifter' },
        text: '"Hic… gone! Oh, bless you! I owe you. We drifters pay our debts in stories and shortcuts. Take your pick: the route my grandmother used before there were maps, or a very odd piece of news."',
        choices: [
          { label: 'The grandmother\'s route', tag: 'science', do: { text: 'A scrawled line through the dark, avoiding two squalls and a toll. It is not on any chart.', fx: [{ reveal: { radius: 2 } }, { fuel: 2 }, { rep: { drifters: 1 } }] } },
          { label: 'The odd news', tag: 'persuade', do: { text: '"There\'s a Concord clerk out near the Veil who\'s learned to sing. Badly. Terribly. And it cheers everyone up." It cheers you up, certainly.', fx: [{ morale: 6 }] } },
        ],
      },
    },
  },

  {
    id: 'travel_aurora_chorus',
    title: 'The Aurora Sings Back',
    tags: ['wonder', 'mystery'],
    ctx: 'travel',
    weight: 8,
    when: [{ day: [8, 999] }],
    once: true,
    art: { scene: 'aurora', species: 'unknown' },
    start: 'a',
    nodes: {
      a: {
        text: 'Ribbons of living aurora drift alongside the Halcyon, trailing the hull like dolphins. When you hum a note over the open channel, the ribbons hum it back, a fifth higher.',
        choices: [
          { label: 'Hum a longer phrase', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'You hum a little hymn; the aurora improvises a descant. For ten minutes the Halcyon is in a choir.', fx: [{ morale: 8 }, { rep: { vesperine: 2 } }] }, fail: { text: 'The aurora trills back a gentle, comprehensive, fully-justified critique of your pitch.', fx: [{ morale: 3 }] } },
          { label: 'Record the harmonics', tag: 'science', do: { text: 'The tape is gorgeous. The Meridian Society will want to listen at length, with tea.', fx: [{ xp: { science: 1 } }, { credits: 20 }] } },
          { label: 'Simply watch', tag: 'wait', do: { text: 'The ribbons dance and fade. Nobody speaks for a whole minute.', fx: [{ morale: 5 }] } },
        ],
      },
    },
  },

  {
    id: 'travel_navigator_pool',
    title: 'The Arrival Sweepstake',
    tags: ['comedy', 'trade'],
    ctx: 'travel',
    weight: 9,
    when: [{ day: [4, 999] }],
    cooldown: 20,
    art: { scene: 'bridge', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        text: 'Someone in engineering has started a sweepstake on the exact minute of arrival. {crew:random} slides a slip of paper across the console. "Captain, you appear to be the only one who hasn\'t entered. The stakes are sixty scrip and a cake."',
        choices: [
          { label: 'Enter with a safe guess', tag: 'trade', if: [{ credits: 5 }], do: { text: 'You guess early; you are late; you win nothing but the cake.', fx: [{ credits: -5 }, { morale: 4 }] } },
          { label: 'Bet boldly on a wild minute', tag: 'trade', if: [{ credits: 5 }], rand: [[1, { text: 'You win the pot. {crew:random} accuses you of insider knowledge.', fx: [{ credits: 55 }, { morale: 6 }] }], [3, { text: 'You lose by thirty seconds. The cake is consolation, and delicious.', fx: [{ credits: -5 }, { morale: 3 }] }]] },
          { label: 'Declare it unofficial, take the cake', tag: 'wait', do: { text: 'A solemn Captain\'s Ruling is entered in the log. The cake is divided in thirds.', fx: [{ morale: 2 }] } },
        ],
      },
    },
  },

  {
    id: 'travel_phantom_tollgate',
    title: 'The Unmanned Tollgate',
    tags: ['trade', 'comedy', 'diplomacy'],
    ctx: 'arrive',
    weight: 10,
    when: [{ day: [7, 999] }],
    cooldown: 25,
    art: { scene: 'station', species: 'quillari' },
    start: 'a',
    nodes: {
      a: {
        text: 'A brass gate hangs across the approach, stencilled with Quillari script: "TOLL: TWENTY SCRIP OR ONE GOOD STORY. DROP IN THE COIN-SLOT OR THE STORY-HORN." There is no one in sight.',
        choices: [
          { label: 'Drop twenty scrip in the slot', tag: 'trade', if: [{ credits: 20 }], do: { text: 'The gate clangs, plays a tinny jig, and swings aside. A sign lights: "THANK YOU FOR YOUR CUSTOM."', fx: [{ credits: -20 }, { rep: { quillari: 2 } }] } },
          { label: 'Tell the story-horn a tale', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'You spin a yarn about a lost tea-cosy. The horn wheezes with laughter. Out pops a brass token: "FREE PASSAGE, ONE USE."', fx: [{ item: { toll_token: 1 } }, { rep: { quillari: 3 } }, { flag: 'tollgate_friend' }] }, fail: { text: 'The horn burps. "Insufficient plot." The gate nevertheless opens, out of pity.', fx: [{ morale: -1 }] } },
          { label: 'Use a toll token', tag: 'trade', if: [{ item: 'toll_token' }], do: { text: 'The token clinks into the slot. The gate bows, and a hidden orchestra plays four bars of "Auld Lang Syne" before falling silent.', fx: [{ item: { toll_token: -1 } }, { rep: { quillari: 1 } }, { morale: 2 }] } },
          { label: 'Fly around the gate', tag: 'flee', check: { skill: 'piloting', diff: 2 }, pass: { text: 'Plenty of room to the side. An alarm bleeps once and decides against embarrassment.', fx: [{ fuel: -1 }] }, fail: { text: 'The gate\'s hidden tow-cable twangs on your hull. You apologise to the empty air and pay the fee.', fx: [{ credits: -15 }] } },
        ],
      },
    },
  },

  {
    id: 'travel_chartwright_trader',
    title: 'The Felt-Tip Cartographer',
    tags: ['trade', 'science', 'diplomacy'],
    ctx: 'travel',
    weight: 11,
    when: [{ day: [5, 999] }],
    cooldown: 22,
    art: { scene: 'market', species: 'quillari' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Ibbet Fenwick', species: 'quillari' },
        text: '"Dear traveller! Fenwick and Daughters, mapmakers since the Third Moult. I draw every star by hand with felt-tip. Care to swap charts? Or, ahem, buy a shortcut?"',
        choices: [
          { label: 'Swap for a star chart', tag: 'trade', if: [{ cargo: { star_charts: 1 } }], do: { text: 'Fenwick unrolls a roll of wonders. Your charts for his charts: everyone leaves richer.', fx: [{ cargo: { star_charts: -1 } }, { reveal: { radius: 2 } }, { rep: { quillari: 3 } }] } },
          { label: 'Buy a shortcut (60 scrip)', tag: 'trade', if: [{ credits: 60 }], do: { text: 'He inks a quick pencilled line on your map. "Trust me, Captain, I\'m an honest feather."', fx: [{ credits: -60 }, { reveal: 'nearest' }, { reveal: { radius: 1 } }] } },
          { label: 'Haggle to a friendlier price', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'Twenty-five scrip and a joke about hippogriffs. He draws you a full local sheet.', fx: [{ credits: -25 }, { reveal: { radius: 1 } }, { rep: { quillari: 2 } }] }, fail: { text: 'He has heard the hippogriff joke. He still sells you a map, with a sigh and a surcharge.', fx: [{ credits: -45 }, { reveal: 'nearest' }] } },
          { label: 'Admire his work and move on', tag: 'wait', do: { text: 'Fenwick bows, pleased. "People rarely appreciate felt-tip."', fx: [{ morale: 1 }, { rep: { quillari: 1 } }] } },
        ],
      },
    },
  },

  {
    id: 'travel_mirror_ship',
    title: 'The Halcyon Beside Us',
    tags: ['mystery', 'wonder'],
    ctx: 'travel',
    weight: 7,
    when: [{ day: [14, 999] }, { survey: 15 }],
    once: true,
    art: { scene: 'ship_alien', species: 'unknown' },
    start: 'a',
    nodes: {
      a: {
        text: 'A ship forms in your viewscreen, identical to the Halcyon in every rivet and scorch mark. Even the dent where {crew:random} once reversed into a buoy. It keeps pace, then fades, leaving a faint scent of tea.',
        choices: [
          { label: 'Hail it', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 4 }, pass: { text: 'Your own voice answers: "Don\'t worry, Captain, you are doing well." Then silence. Your crew is stunned and obscurely comforted.', fx: [{ flag: 'mirror_seen' }, { morale: 6 }] }, fail: { text: 'No reply, but a single felt-tip star blooms on your chart, as if from a friend\'s pen.', fx: [{ flag: 'mirror_seen' }, { reveal: 'nearest' }] } },
          { label: 'Scan it closely', tag: 'science', check: { skill: 'science', diff: 4 }, pass: { text: 'The sensors find nothing to measure, which {crew:science} calls "the most interesting result of my career."', fx: [{ flag: 'mirror_seen' }, { xp: { science: 3 } }] }, fail: { text: 'The scan returns your own sensor logs, perfectly. Nothing new, which is, of course, the clue.', fx: [{ flag: 'mirror_seen' }] } },
          { label: 'Wave. Politely.', tag: 'wait', do: { text: 'The other ship, impossibly, appears to wave back. Tea is served on both bridges.', fx: [{ flag: 'mirror_seen' }, { morale: 4 }] } },
        ],
      },
    },
  },

  {
    id: 'travel_veil_fog_blind',
    title: 'Fog in the Veil',
    tags: ['hazard', 'science', 'flee'],
    ctx: 'arrive',
    weight: 11,
    when: [{ system: { region: 'veil' } }],
    cooldown: 18,
    art: { scene: 'nebula', species: 'unknown' },
    start: 'a',
    nodes: {
      a: {
        text: 'You arrive in the Veil, and the nebula presses up against the glass, thick as milk. Sensors read pink. The helm requests permission to navigate by guesswork and optimism.',
        choices: [
          { label: 'Filter the readings', tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: '{crew:science} builds a filter from felt-tip overlays and a slide rule. A path opens through the milk.', fx: [{ xp: { science: 1 } }, { reveal: { radius: 1 } }] }, fail: { text: 'The filter yields more fog. You crawl in at quarter speed.', fx: [{ days: 1 }, { supplies: -1 }] } },
          { label: 'Fly by feel', tag: 'flee', check: { skill: 'piloting', diff: 4 }, pass: { text: 'You steer by the pulse of the ship. The nebula parts like a curtain.', fx: [{ xp: { piloting: 2 } }, { morale: 3 }] }, fail: { text: 'You graze a dust lane. The paint will recover; the helmsman\'s pride, less so.', fx: [{ hull: -4 }] } },
          { label: 'Idle until the fog thins', tag: 'wait', do: { text: 'The nebula drifts away by supper. You play three rounds of cribbage.', fx: [{ days: 1 }, { morale: 2 }] } },
        ],
      },
    },
  },

  {
    id: 'travel_drifter_parade',
    title: 'The Procession of Lamps',
    tags: ['wonder', 'diplomacy'],
    ctx: 'arrive',
    weight: 10,
    when: [{ system: { region: 'rim' } }],
    cooldown: 30,
    art: { scene: 'station', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Elder Marrow', species: 'drifter' },
        text: 'A fleet of habitats glides past in single file, each strung with paper lanterns that glow like hearth-light. "Join the procession, Halcyon. It is bad luck to watch alone."',
        choices: [
          { label: 'Fall in with the fleet', tag: 'diplomacy', do: { text: 'The Halcyon trails the parade for an hour. Children wave from airlocks. A gift of woven bunting is handed over by rope-and-pulley.', fx: [{ rep: { drifters: 4 } }, { morale: 6 }, { days: 1 }] } },
          { label: 'Offer a hand-loom gift', tag: 'trade', if: [{ cargo: { hand_looms: 1 } }], do: { text: 'Elder Marrow turns the loom in her hands and weeps a little. "Ours are the same pattern as your great-grandmother\'s, you know."', fx: [{ cargo: { hand_looms: -1 } }, { rep: { drifters: 6 } }, { item: { story_knot: 1 } }] } },
          { label: 'Salute from a respectful distance', tag: 'wait', do: { text: 'The fleet dips a lantern to you, a courteous refusal of your courteous refusal.', fx: [{ rep: { drifters: 1 } }] } },
        ],
      },
    },
  },

  {
    id: 'travel_meteor_picnic',
    title: 'Picnic on a Slow Rock',
    tags: ['comedy', 'wonder'],
    ctx: 'travel',
    weight: 8,
    when: [{ day: [6, 999] }, { phenomenon: 'asteroids' }],
    cooldown: 35,
    art: { scene: 'asteroids', species: 'robot' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Dobbin', species: 'robot' },
        text: '"Captain, I have found a drifting asteroid with a flat top, a view, and no apparent hazards. I have packed a hamper. The sandwiches are theoretical."',
        choices: [
          { label: 'Land and picnic', tag: 'wait', rand: [[3, { text: 'The tea steams, the view is unbeatable, and the sandwiches turn out to be real. A glorious hour.', fx: [{ morale: 8 }, { supplies: -1 }], goto: 'b' }], [1, { text: 'The rock turns out to rotate. Everyone gets a gentle spin and half the jam.', fx: [{ morale: 5 }, { supplies: -1 }], goto: 'b' }]] },
          { label: 'Prospect the rock instead', tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: 'A seam of glittering ore! Not much, but a gift for the Society and a good story for the log.', fx: [{ credits: 35 }, { xp: { science: 1 } }] }, fail: { text: 'Only iron and gravel. Dobbin sighs and brings the hamper out anyway.', fx: [{ morale: 3 }], goto: 'b' } },
        ],
      },
      b: {
        text: 'The rock begins, very slowly, to drift toward the shipping lane. {crew:piloting} notices first. "Captain, the picnic is moving. We are, technically, the picnic\'s tenants."',
        choices: [
          { label: 'Nudge the rock out of the lane with a tractor beam', tag: 'flee', check: { skill: 'piloting', diff: 3 }, pass: { text: 'Gentle as a nanny, you push the rock into a safe orbit. A passing trader hoots her horn in thanks.', fx: [{ rep: { quillari: 2 } }, { xp: { piloting: 1 } }, { fuel: -1 }] }, fail: { text: 'The rock spins and clips the Halcyon\'s antenna on its way out. The antenna files a complaint.', fx: [{ hull: -3 }, { fuel: -1 }] } },
          { label: 'Cast off quickly and leave it be', tag: 'wait', do: { text: 'You cast off, leaving a few crumbs for the rock. The rock keeps drifting, carefree.', fx: [] } },
        ],
      },
    },
  },

  {
    id: 'travel_stranded_quillari',
    title: 'Dead in the Water, Cheerfully',
    tags: ['relief', 'trade', 'diplomacy'],
    ctx: 'travel',
    weight: 12,
    when: [{ day: [5, 999] }, { fuel: 4 }],
    cooldown: 20,
    art: { scene: 'ship_alien', species: 'quillari' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Captain Pip Feathergrass', species: 'quillari' },
        text: '"Halcyon! Delighted to see you! We have run out of fuel, which is dreadful, and also in the middle of a very fine view, which is not. Any chance of a top-up? I can pay in gossip."',
        choices: [
          { label: 'Share three fuel cells', tag: 'trade', if: [{ fuel: 4 }], do: { text: 'Pip\'s crew cheers. They load you up with gossip: three secret shortcuts and one scandalous omelette recipe.', fx: [{ fuel: -3 }, { rep: { quillari: 5 } }, { reveal: { radius: 1 } }, { morale: 2 }], goto: 'b' } },
          { label: 'Offer fuel for payment', tag: 'trade', if: [{ fuel: 3 }], do: { text: 'Pip forks over 50 scrip with only a little wailing. "Business is business, darling."', fx: [{ fuel: -2 }, { credits: 50 }, { rep: { quillari: 1 } }], goto: 'b' } },
          { label: 'Radio the nearest tender', tag: 'diplomacy', do: { text: 'The Meridian tender will fetch them by dinner. Pip approves of the efficiency, and of you.', fx: [{ rep: { quillari: 2 } }, { rep: { concord: 1 } }] } },
          { label: 'Wish them well and press on', tag: 'wait', do: { text: '"Oh, I understand," says Pip. She does not sound as if she does.', fx: [{ rep: { quillari: -2 } }] } },
        ],
      },
      b: {
        speaker: { name: 'Captain Pip Feathergrass', species: 'quillari' },
        text: '"Now then, a Feathergrass pays what she owes, or at least in a fashion. I shall remember this, Captain. If you ever find yourself short in a Quillari port, say my name and see what happens."',
        choices: [
          { label: 'Take her at her word', tag: 'diplomacy', do: { text: 'Pip trims her sails in a salute and the *Fine Print* wheels away, wagging. Somewhere in the Reach, a tab has been opened in your favour.', fx: [{ flag: 'pip_owes' }, { morale: 2 }] } },
          { label: 'Ask for one tip right now', tag: 'persuade', do: { text: '"Fly the south edge of the next nebula. It is quiet, and there is a market." She winks. It is a good tip.', fx: [{ reveal: 'nearest' }, { flag: 'pip_owes' }] } },
        ],
      },
    },
  },

  {
    id: 'travel_survey_thanks',
    title: 'Notes from the Chartroom',
    tags: ['wonder', 'diplomacy'],
    ctx: 'travel',
    weight: 30,
    when: [{ survey: 40 }],
    once: true,
    art: { scene: 'bridge', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Recorded Voice', species: 'human' },
        text: '"Meridian Society, relaying. Captain, your charts are already hanging on four stations, two pilgrim ships, and a child\'s bedroom in Port Lyra. We thought you should know. Warmest regards, the Secretary."',
        choices: [
          { label: 'Reply with a wave and a thank-you', tag: 'diplomacy', do: { text: 'The crew crowd round the teletype to read it twice. {crew:random} admits to a sniffle.', fx: [{ morale: 10 }, { rep: { concord: 3 } }] } },
          { label: 'Ask for a little extra funding', tag: 'persuade', check: { skill: 'diplomacy', diff: 2 }, pass: { text: 'The Secretary responds with a stipend and a pressed flower.', fx: [{ credits: 80 }, { rep: { concord: 1 } }] }, fail: { text: 'The Secretary sends a cheerful note about budgets and sunrises. Still nice.', fx: [{ morale: 2 }] } },
        ],
      },
    },
  },
  // =============================================================== FIX ROUND 1 ADDITIONS
  // ---------------------------------------------------------------- EARLY GAME
  {
    id: 'early_relay_postcard',
    title: 'Postcard from the Secretary',
    tags: ['comedy', 'trade'],
    ctx: 'travel',
    weight: 70,
    when: [{ day: [1, 14] }],
    once: true,
    art: { scene: 'bridge', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Recorded Voice', species: 'human' },
        text: '"Meridian Relay Halyard, relaying a postcard. Captain, a few friendly notes: stations sell fuel and supplies at honest prices; goods bought cheap in one port often sell dear in the next; and the Society will not, repeat not, send a tender unless you really need one."',
        choices: [
          { label: 'Take notes in felt-tip', tag: 'science', do: { text: 'You underline "buy cheap, sell dear" twice. It feels like wisdom, and it is.', fx: [{ morale: 2 }, { item: { felt_tip_set: 1 } }], goto: 'b' } },
          { label: 'Skip to the postscript', tag: 'wait', do: { text: 'The postscript reads: "P.S. Do pack more tea than you think. Yours, the Secretary."', fx: [{ item: { tea_tin: 1 } }], goto: 'b' } },
        ],
      },
      b: {
        text: 'A last line scrolls past in the Secretary\'s looping hand: "The tow is free once. After that it is gloriously embarrassing and costs scrip." Dobbin adds a small bell sound for emphasis.',
        choices: [
          { label: 'Resolve never to need the tow', tag: 'wait', do: { text: 'You pin the postcard above the helm, next to the fuel gauge, where it can glare at you.', fx: [{ morale: 1 }] } },
        ],
      },
    },
  },

  {
    id: 'tease_cartographers_table',
    title: 'If Only We Had a Table',
    tags: ['science', 'comedy'],
    ctx: 'travel',
    weight: 14,
    when: [{ day: [6, 999] }],
    cooldown: 40,
    art: { scene: 'bridge', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        text: '{crew:science} has spread seven charts across the wardroom floor and is trying to read them all at once. "If only we had a proper Cartographer\'s Table," they sigh. "Gimballed. Backlit. With a little brass compass-rose." Dobbin looks wistful.',
        choices: [
          { label: 'Spread everything on the Table', tag: 'science', if: [{ upgrade: 'cartographers_table' }], do: { text: 'The Table hums, lights its rose, and merges seven charts into one. Three new stars appear in the corner like confetti.', fx: [{ reveal: { radius: 3 } }, { xp: { science: 2 } }, { morale: 4 }] } },
          { label: 'Improvise with the lounge card table', tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: 'You prop a lamp under the card table. It works. Disgracefully.', fx: [{ reveal: { radius: 2 } }, { xp: { science: 1 } }] }, fail: { text: 'The lamp tips; tea meets chart. A river of Earl Grey now flows through the Veil.', fx: [{ morale: -2 }, { supplies: -1 }] } },
          { label: 'Make a note to look at shipyards', tag: 'wait', do: { text: 'You write "TABLE" on the wish-list on the galley door, under "more biscuits".', fx: [{ morale: 1 }] } },
        ],
      },
    },
  },

  {
    id: 'tease_translator_parrot',
    title: 'The Mistranslated Compliment',
    tags: ['comedy', 'diplomacy'],
    ctx: 'arrive',
    weight: 12,
    when: [{ day: [5, 999] }, { not: { system: { faction: 'none' } } }],
    cooldown: 35,
    art: { scene: 'station', species: 'unknown' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Harbour Voice', species: 'unknown' },
        text: 'You greet the harbour with your best phrase-book smile. The harbour answers with a long, delighted trill. The universal translator renders it: "YOUR MOTHER IS A LOVELY SOUP." Nobody on the bridge is sure whether this is good.',
        choices: [
          { label: 'Ask the Translator Parrot', tag: 'diplomacy', if: [{ upgrade: 'translator_parrot' }], do: { text: 'The parrot ruffles. "Idiom. Means: your family is warm and nourishing. High praise." The harbour dips its lights. You are welcomed like kin.', fx: [{ rep: { quillari: 1, concord: 1, drifters: 1 } }, { morale: 3 }] } },
          { label: 'Reply "And yours is a lovely soup"', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'Triumph. It was the correct answer. The harbour sings, you feel fifteen metres taller, and a basket of fruit floats out to greet you.', fx: [{ supplies: 2 }, { morale: 4 }] }, fail: { text: 'It was not the correct answer. A long, offended whistle. You apologise for an hour and pay a "soup-honour" fee.', fx: [{ credits: -20 }, { morale: -2 }] } },
          { label: 'Smile and nod', tag: 'wait', do: { text: 'The harbour nods back, in its way, and is not offended. Everyone agrees to pretend this didn\'t happen.', fx: [] } },
        ],
      },
    },
  },

  {
    id: 'tease_solar_sails',
    title: 'The Sun-Gliders',
    tags: ['wonder', 'science'],
    ctx: 'travel',
    weight: 11,
    when: [{ day: [8, 999] }],
    cooldown: 40,
    art: { scene: 'starfield', species: 'drifter' },
    start: 'a',
    nodes: {
      a: {
        text: 'A flock of tiny drifter skiffs glides past, silent, on enormous silver sails that shimmer in the starlight. They aren\'t burning a drop of fuel. "Oh," says {crew:engineering}, in a voice full of longing, "if only we had sails."',
        choices: [
          { label: 'Unfurl your own solar sails', tag: 'science', if: [{ upgrade: 'solar_sails' }], do: { text: 'The sails open with a sigh of silver. The Halcyon glides with the flock for an hour and sips almost nothing.', fx: [{ fuel: 3 }, { morale: 6 }] } },
          { label: 'Ask the sailors for a tow-line', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'They toss a cable and pull you along, cackling kindly. You gain a few free leagues.', fx: [{ fuel: 2 }, { rep: { drifters: 2 } }] }, fail: { text: 'The cable snaps with a twang and a rude word in two languages.', fx: [{ hull: -2 }] } },
          { label: 'Just admire them', tag: 'wait', do: { text: 'Silver sails, black sky. The bridge crew goes quiet for a while.', fx: [{ morale: 4 }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- RIVAL: CAPTAIN TAMSIN VELL
  {
    id: 'rival_vell_first',
    title: 'The Gadabout Hails',
    tags: ['comedy', 'flee', 'persuade'],
    ctx: 'travel',
    weight: 30,
    when: [{ day: [4, 999] }, { notFlag: 'vell_race_done' }],
    once: true,
    art: { scene: 'ship_alien', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Capt. Tamsin Vell', species: 'human' },
        text: 'A gold-trimmed trader swings alongside. "Captain! Tamsin Vell, free-trader, *Gadabout*, fastest hull in the Reach. You\'re the chartered fellow with the felt-tips? Charming. I\'ll race you to the next buoy. Loser buys tea."',
        choices: [
          { label: 'Accept the race', tag: 'flee', check: { skill: 'piloting', diff: 3 }, pass: { text: 'You take the inside line on the last bend and flash past the buoy by a hair. Vell\'s whoop comes over the channel, half fury, half joy.', fx: [{ flag: 'rival_met' }, { flag: 'vell_race_done' }, { counter: { rival_n: 1 } }, { fuel: -1 }, { xp: { piloting: 2 } }], goto: 'b' }, fail: { text: 'The Gadabout sails past with a cheeky flourish. Your burn was needless and expensive.', fx: [{ flag: 'rival_met' }, { flag: 'vell_race_done' }, { counter: { rival_n: 1 } }, { fuel: -2 }], goto: 'c' } },
          { label: 'Propose a handicap: you navigate by charts only', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"Charts only? You\'re insane. Done!" Vell concedes you a head start, and cannot resist bragging all the way.', fx: [{ flag: 'rival_met' }, { flag: 'vell_race_done' }, { counter: { rival_n: 1 } }, { fuel: -1 }, { morale: 2 }], goto: 'b' }, fail: { text: '"Handicap? From a surveyor?" She laughs so hard she forgets to launch the race.', fx: [{ flag: 'rival_met' }, { flag: 'vell_race_done' }, { counter: { rival_n: 1 } }, { morale: 1 }], goto: 'c' } },
          { label: 'Decline politely, but warmly', tag: 'wait', do: { text: '"Dull," says Vell. "Delightful, but dull. We\'ll meet again." And, with a flourish of gold trim, she is gone.', fx: [{ flag: 'rival_met' }, { flag: 'vell_race_done' }, { counter: { rival_n: 1 } }] } },
        ],
      },
      b: {
        speaker: { name: 'Capt. Tamsin Vell', species: 'human' },
        text: '"Beginner\'s luck!" She grins like a gull. "I owe you tea. I\'ll pay in the usual way, which is flattery or scrip. Choose."',
        choices: [
          { label: 'Take the flattery', tag: 'wait', do: { text: '"Captain, you fly like an angel having a very good afternoon." Your bridge crew applauds. Morale soars.', fx: [{ morale: 5 }] } },
          { label: 'Take the scrip (30)', tag: 'trade', do: { text: 'She sighs, and counts out coins with great pomp. "Never let it be said that Tamsin Vell cannot lose with style."', fx: [{ credits: 30 }, { rep: { quillari: 1 } }] } },
          { label: 'Ask about her trade routes', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'Flattered, she reveals a tip: where the good lanes lie and who buys at what.', fx: [{ reveal: { radius: 2 } }, { credits: 10 }] }, fail: { text: '"A girl has to keep some secrets!" She keeps them, and winks.', fx: [{ morale: 1 }] } },
        ],
      },
      c: {
        speaker: { name: 'Capt. Tamsin Vell', species: 'human' },
        text: '"Tea\'s on you, then. I\'ll let you pick the pot. Good day, Captain!" The Gadabout rolls once, gaudily, and recedes into the dark.',
        choices: [
          { label: 'Pay the forfeit gracefully (10 scrip)', tag: 'trade', if: [{ credits: 10 }], do: { text: 'You send over a tin of tea by courier drone. A thank-you note arrives, reading simply: "Rematch."', fx: [{ credits: -10 }, { morale: 2 }] } },
          { label: 'Shout "Rematch!" down the channel', tag: 'persuade', do: { text: 'A distant, delighted shriek of laughter. The crew cheers. There will be a rematch.', fx: [{ morale: 3 }] } },
        ],
      },
    },
  },

  {
    id: 'rival_vell_dock',
    title: 'The Last Crate of Fuel Cells',
    tags: ['trade', 'comedy', 'persuade'],
    ctx: 'arrive',
    weight: 30,
    when: [{ flag: 'rival_met' }, { any: [{ counter: { rival_n: 1 } }, { counter: { rival_met: 2 } }] }, { system: { hasStation: true } }],
    once: true,
    art: { scene: 'market', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Capt. Tamsin Vell', species: 'human' },
        text: 'Vell lounges on the dock beside the very last crate of cheap fuel cells. "Hello, Captain. I got here first. Isn\'t that a hoot? Pay triple, or watch me waltz off with them."',
        choices: [
          { label: 'Outbid her (40 scrip)', tag: 'trade', if: [{ credits: 40 }], do: { text: 'You slap the coins down. Vell salutes with a cup of tea. "Fair play. Remember, I let you."', fx: [{ credits: -40 }, { fuel: 4 }, { counter: { rival_n: 1 } }], goto: 'b' } },
          { label: 'Propose to split the crate', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'She squints, then splits the crate with a theatrical groan. "Half and half. And you owe me a story."', fx: [{ fuel: 2 }, { counter: { rival_n: 1 } }], goto: 'b' }, fail: { text: '"Splitting is for pies," says Vell, and takes the lot.', fx: [{ counter: { rival_n: 1 } }, { morale: -1 }], goto: 'b' } },
          { label: 'Let her have the crate', tag: 'wait', do: { text: '"Don\'t sulk. It doesn\'t suit you." She winks and heads for the dock office.', fx: [{ counter: { rival_n: 1 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Dockmaster', species: 'human' },
        text: 'The Dockmaster intercepts Vell at the office. "Captain Vell, your docking fees are forty-five scrip in arrears." Vell\'s smile freezes. Behind it, for one moment, you see a very tired woman who has bluffed a long way on very little fuel.',
        choices: [
          { label: 'Quietly pay her fee (45 scrip)', tag: 'trade', if: [{ credits: 45 }], do: { text: 'You slip the Dockmaster the coins and say nothing. Vell stares at you across the dock. The smile, when it returns, is a different one.', fx: [{ credits: -45 }, { flag: 'rival_friend' }, { counter: { rival_n: 1 } }], goto: 'c' } },
          { label: 'Vouch for her to the Dockmaster', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"Captain Vell is good for it." The Dockmaster, who knows a Meridian commission when he sees one, grants a week\'s grace.', fx: [{ flag: 'rival_friend' }, { counter: { rival_n: 1 } }, { rep: { concord: 1 } }], goto: 'c' }, fail: { text: 'The Dockmaster is unmoved. Vell pays with her last pearl buttons, glaring at you with undeserved fury.', fx: [{ flag: 'rival_grudge' }, { counter: { rival_n: 1 } }] } },
          { label: 'Pretend to study the crate', tag: 'wait', do: { text: 'Vell hands over a pearl brooch with fixed dignity. Later, a single raised eyebrow across the dock says: "I saw you not look."', fx: [{ counter: { rival_n: 1 } }, { morale: -1 }] } },
        ],
      },
      c: {
        speaker: { name: 'Capt. Tamsin Vell', species: 'human' },
        text: 'A note arrives at your berth, in looping gold ink: "I do NOT owe you. Therefore I owe you. These are two entirely different things. Tamsin V." A small package is attached.',
        choices: [
          { label: 'Open the package', tag: 'diplomacy', do: { text: 'A festival ribbon, hand-stitched, for luck. Pinned inside: "Next time I\'ll let you win. Probably."', fx: [{ item: { festival_ribbon: 1 } }, { morale: 5 }] } },
        ],
      },
    },
  },

  {
    id: 'rival_vell_breakdown',
    title: 'A Stylish Stop',
    tags: ['relief', 'comedy', 'science'],
    ctx: 'travel',
    weight: 30,
    when: [{ flag: 'rival_met' }, { any: [{ counter: { rival_n: 2 } }, { counter: { rival_met: 3 } }] }],
    once: true,
    art: { scene: 'ship_alien', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Capt. Tamsin Vell', species: 'human' },
        text: 'The Gadabout is drifting, dark and gleaming. Vell\'s voice is breezy. "Oh, hello! Don\'t mind us. We\'re just… pausing. Stylishly. It\'s a brand-new technique called Not Moving."',
        choices: [
          { label: 'Send {crew:engineering} to look at the engines', tag: 'science', check: { skill: 'engineering', diff: 3 }, pass: { text: 'A cracked injector, bound with sweat and wire. It sings again within the hour. Vell hugs your engineer like a drowning sailor.', fx: [{ xp: { engineering: 2 } }, { flag: 'rival_friend' }, { counter: { rival_n: 1 } }, { days: 1 }], goto: 'b' }, fail: { text: 'You get the engines to cough but not to run. Vell\'s crew needs a tow after all.', fx: [{ days: 1 }, { supplies: -1 }], goto: 'b' } },
          { label: 'Tow her to the nearest port (-3 fuel)', tag: 'trade', if: [{ fuel: 4 }], do: { text: 'The tow-line goes taut. Vell, on the channel, composes herself into a gracious Captain Being Rescued.', fx: [{ fuel: -3 }, { days: 1 }, { flag: 'rival_friend' }, { counter: { rival_n: 1 } }], goto: 'b' } },
          { label: 'Offer a tow, at her best rate (credit 40)', tag: 'persuade', do: { text: '"You terrible man." She pays, the tow happens, and she tells no one. She will remember this.', fx: [{ credits: 40 }, { fuel: -2 }, { flag: 'rival_grudge' }, { counter: { rival_n: 1 } }, { days: 1 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Capt. Tamsin Vell', species: 'human' },
        text: 'Over a cup of lukewarm tea she admits it. "The *Gadabout* is mortgaged to her gold trim. I bluff for a living. It\'s not bad, really. It\'s the best seat in the house."',
        choices: [
          { label: 'Give her 30 scrip, no strings', tag: 'trade', if: [{ credits: 30 }], do: { text: 'She looks at the coins, then at you. "I\'m going to write a song about this." You hope she doesn\'t.', fx: [{ credits: -30 }, { flag: 'rival_friend' }, { clearFlag: 'rival_grudge' }, { morale: 4 }], goto: 'c' } },
          { label: 'Propose a convoy: share the lanes', tag: 'diplomacy', do: { text: '"A partnership. How unromantic. How sensible. Yes." Her handshake is crushingly sincere.', fx: [{ flag: 'rival_friend' }, { clearFlag: 'rival_grudge' }, { rep: { quillari: 2 } }], goto: 'c' } },
          { label: 'Wish her luck and part ways', tag: 'wait', do: { text: 'She waves with her teacup as the Gadabout limps onward. Pride intact; pockets not.', fx: [{ morale: 1 }] } },
        ],
      },
      c: {
        speaker: { name: 'Capt. Tamsin Vell', species: 'human' },
        text: '"Right. I owe you a favour. And I\'m the sort of woman who pays. Just once, at the worst possible moment, I\'ll turn up and make it better. Mark my words, Captain."',
        choices: [
          { label: 'Mark them', tag: 'wait', do: { text: 'The Gadabout trims its sails and rolls away in a gold blur. Dobbin notes "she still owes us biscuits."', fx: [{ flag: 'vell_owes' }, { morale: 3 }] } },
        ],
      },
    },
  },

  {
    id: 'rival_vell_rescue',
    title: 'Vell Pays Up',
    tags: ['relief', 'wonder', 'comedy'],
    ctx: 'travel',
    weight: 45,
    when: [{ any: [{ flag: 'vell_owes' }, { flag: 'rival_friend' }, { flag: 'rival_ally' }, { counter: { rival_friend: 1 } }] }, { any: [{ not: { fuel: 12 } }, { not: { supplies: 10 } }, { not: { hull: 80 } }] }],
    once: true,
    art: { scene: 'ship_alien', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Capt. Tamsin Vell', species: 'human' },
        text: '"HALCYON! You look dreadful! What a lucky coincidence that I happen to be passing, and that my hold is full of spares I was going to throw away." She is lying; you can tell, and you love her for it.',
        choices: [
          { label: 'Accept the "spares" with thanks', tag: 'trade', do: { text: 'Fuel cells, ration tins, patching foil. "Garbage," says Vell. "Terribly sorry about it. Do not thank me."', fx: [{ fuel: 5 }, { supplies: 4 }, { hull: 8 }, { clearFlag: 'vell_owes' }, { rep: { quillari: 2 } }, { morale: 6 }] } },
          { label: 'Ask her to share a pot of tea', tag: 'diplomacy', do: { text: 'The two captains sit across the airlock and toast the empty stars. Vell tells three lies and two truths; you could not say which is which.', fx: [{ fuel: 3 }, { supplies: 2 }, { clearFlag: 'vell_owes' }, { morale: 8 }, { flag: 'vell_best_friend' }] } },
        ],
      },
    },
  },

  {
    id: 'rival_vell_prank',
    title: 'FOR SALE',
    tags: ['comedy', 'persuade'],
    ctx: 'arrive',
    weight: 60,
    when: [{ any: [{ flag: 'rival_grudge' }, { counter: { rival_met: 3 } }] }, { notFlag: 'rival_friend' }, { notFlag: 'rival_ally' }, { system: { hasStation: true } }],
    once: true,
    art: { scene: 'station', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        text: 'The Halcyon has been decorated overnight. Across the hull, in cheerful gold paint: "FOR SALE. ONE CAREFUL OWNER. WILL CHART FOR BISCUITS." Down the dock, Vell is whistling, elaborately.',
        choices: [
          { label: 'Paint "SOLD" on the Gadabout in reply', tag: 'persuade', check: { skill: 'piloting', diff: 3 }, pass: { text: 'A midnight sortie with a brush on a long pole. By morning the Gadabout wears "SOLD, TO A LOVELY PERSON". Vell laughs till she weeps. The grudge dissolves in turpentine.', fx: [{ flag: 'rival_friend' }, { clearFlag: 'rival_grudge' }, { morale: 6 }] }, fail: { text: 'You paint the wrong ship. A cheerful Quillari captain thanks you for the unexpected upgrade. Vell is not appeased.', fx: [{ credits: -20 }, { morale: -1 }] } },
          { label: 'Take it in good humour', tag: 'diplomacy', do: { text: 'You leave the paint on for a day and answer every hail with, "Make me an offer." Vell concedes. Drinks, on her.', fx: [{ flag: 'rival_friend' }, { clearFlag: 'rival_grudge' }, { morale: 4 }] } },
          { label: 'Scrape it off in a sulk', tag: 'wait', do: { text: 'It takes two crew-days and half your solvent. Vell\'s grin could light a reactor.', fx: [{ supplies: -1 }, { morale: -3 }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- DISTRESS BEACON FAMILY
  {
    id: 'dist_faint_call',
    title: 'A Faint Mayday',
    tags: ['relief', 'mystery'],
    ctx: 'travel',
    weight: 9,
    when: [{ day: [7, 999] }, { notFlag: 'distress_active' }],
    cooldown: 25,
    art: { scene: 'void', species: 'unknown' },
    start: 'a',
    nodes: {
      a: {
        text: 'Under the static, a thin pulse repeats on the emergency band: "…mayday… mayday… or possibly May Day, the festival, apologies…" The signal is real, or at least sincere. It fades, then returns, weaker.',
        choices: [
          { label: 'Follow the signal', tag: 'science', rand: [
            [1, { text: 'The pulse resolves into a small skiff. Its scrubbers are dying.', fx: [{ flag: 'distress_active' }, { fuel: -1 }, { startEvent: 'dist_air_thin' }] }],
            [1, { text: 'The pulse resolves into a lone escape pod, drifting sweetly.', fx: [{ flag: 'distress_active' }, { fuel: -1 }, { startEvent: 'dist_lifepod' }] }],
            [1, { text: 'The pulse resolves into a barge that has run clean out of fuel.', fx: [{ flag: 'distress_active' }, { fuel: -1 }, { startEvent: 'dist_dry_tank' }] }],
          ] },
          { label: 'Radio the nearest station', tag: 'diplomacy', do: { text: 'The station promises to send help, and in the end does. A small, anonymous good deed.', fx: [{ rep: { concord: 2 } }, { morale: 1 }] } },
          { label: 'Log it and keep going', tag: 'wait', do: { text: 'You enter it in the log. {crew:random} says nothing for a long while.', fx: [{ morale: -4 }, { flag: 'distress_ignored' }] } },
        ],
      },
    },
  },

  {
    id: 'dist_signal_fades',
    title: 'The Signal Is Fading',
    tags: ['relief', 'flee'],
    ctx: 'travel',
    weight: 40,
    when: [{ flag: 'distress_active' }],
    cooldown: 2,
    art: { scene: 'void', species: 'unknown' },
    start: 'a',
    nodes: {
      a: {
        text: 'The distress pulse is thinning on the scopes. The helm raises an eyebrow. "We can burn hard and make it in time, Captain. It costs fuel. Or we can say a polite prayer and keep to the schedule."',
        choices: [
          { label: 'Burn hard for the signal (2 fuel)', tag: 'flee', if: [{ fuel: 3 }], rand: [
            [1, { text: 'You find them. A skiff, scrubbers dying.', fx: [{ fuel: -2 }, { startEvent: 'dist_air_thin' }] }],
            [1, { text: 'You find them. A lone pod, humming faintly.', fx: [{ fuel: -2 }, { startEvent: 'dist_lifepod' }] }],
            [1, { text: 'You find them. A barge with a dry tank.', fx: [{ fuel: -2 }, { startEvent: 'dist_dry_tank' }] }],
          ] },
          { label: 'Fly a precision intercept', tag: 'flee', check: { skill: 'piloting', diff: 4 }, pass: { text: 'You cut the corner so finely the stars seem to blur. Perfect.', fx: [{ fuel: -1 }, { xp: { piloting: 2 }, startEvent: 'dist_air_thin' }] }, fail: { text: 'The intercept slides wide. You lose the signal and a little fuel.', fx: [{ fuel: -2 }, { clearFlag: 'distress_active' }, { morale: -3 }] } },
          { label: 'Let the signal go', tag: 'wait', do: { text: 'The pulse winks out. The bridge is silent, and the silence is its own kind of loud.', fx: [{ clearFlag: 'distress_active' }, { flag: 'distress_ignored' }, { morale: -5 }] } },
        ],
      },
    },
  },

  {
    id: 'dist_air_thin',
    title: 'Scrubbers on the Skiff Kettle',
    tags: ['relief', 'science', 'diplomacy'],
    ctx: 'distress',
    weight: 10,
    when: [],
    cooldown: 12,
    art: { scene: 'sickbay', species: 'drifter' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Oru, skiff captain', species: 'drifter' },
        text: 'The skiff Kettle is no bigger than a barn. Six drifters, cheerful and wan, are breathing in short sips. "Scrubbers," coughs Oru. "Died around breakfast. Everyone\'s been very polite about it."',
        choices: [
          { label: 'Rebuild the scrubber stack', tag: 'science', check: { skill: 'engineering', diff: 3 }, pass: { text: '{crew:engineering} swaps a membrane, re-seats a fan, and the air tastes suddenly like morning. The Kettle cheers.', fx: [{ xp: { engineering: 2 } }, { clearFlag: 'distress_active' }], goto: 'b' }, fail: { text: 'The repair takes twice as long and half the spares. The Kettle breathes, but only just.', fx: [{ supplies: -2 }, { hull: -3 }, { clearFlag: 'distress_active' }], goto: 'b' } },
          { label: 'Stabilise the crew first', tag: 'science', check: { skill: 'medicine', diff: 2 }, pass: { text: '{crew:medicine} calms the worst cases with oxygen and tea. Nobody is in danger when the engineers arrive.', fx: [{ xp: { medicine: 2 }, clearFlag: 'distress_active' }, { rep: { drifters: 2 } }], goto: 'b' }, fail: { text: 'You do your best. Two of the crew are poorly, but everyone survives, grumbling.', fx: [{ supplies: -1 }, { clearFlag: 'distress_active' }], goto: 'b' } },
          { label: 'Lend breathing canisters (-3 supplies)', tag: 'trade', if: [{ supplies: 4 }], do: { text: 'You pass over six canisters and a thermos. The Kettle breathes freely at once.', fx: [{ supplies: -3 }, { clearFlag: 'distress_active' }, { rep: { drifters: 2 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Oru, skiff captain', species: 'drifter' },
        text: '"Captain. We\'re four days from Tansy Hab, and the Kettle limps. An escort would be a kindness. I have no right to ask."',
        choices: [
          { label: 'Escort them home (1 day, 1 fuel)', tag: 'diplomacy', if: [{ fuel: 2 }], do: { text: 'You shepherd the Kettle through the dark. At the hab, lanterns are lit in welcome.', fx: [{ days: 1 }, { fuel: -1 }, { rep: { drifters: 5 } }], goto: 'c' } },
          { label: 'Point out the safest route and part', tag: 'wait', do: { text: 'Oru salutes with a battered mug. "Safe skies, Captain."', fx: [{ rep: { drifters: 2 } }] } },
        ],
      },
      c: {
        speaker: { name: 'Hab Council', species: 'drifter' },
        text: 'The whole hab turns out. A child hands you a woven bookmark; an elder presses a knot-cord into your hand. "The hab remembers. If you ever need a berth, a loom, or a quarrel settled, we owe you."',
        choices: [
          { label: 'Accept their gratitude', tag: 'diplomacy', do: { text: 'You are fed, thanked, and teased. You leave with warm hands and a lighter heart.', fx: [{ flag: 'owed_by_drifters' }, { item: { drifter_story_knot: 1 } }, { morale: 7 }, { supplies: 2 }] } },
        ],
      },
    },
  },

  {
    id: 'dist_lifepod',
    title: 'The Courier in the Pod',
    tags: ['relief', 'mystery', 'comedy'],
    ctx: 'distress',
    weight: 10,
    when: [],
    cooldown: 12,
    art: { scene: 'derelict', species: 'archivist' },
    start: 'a',
    nodes: {
      a: {
        text: 'A battered escape pod, stencilled with the Archive\'s hollow-moon sigil, tumbles lazily by. Inside, a slim machine in a courier\'s sash sits perfectly upright and absolutely still. A tiny speaker whispers: "PLEASE. WHEN CONVENIENT."',
        choices: [
          { label: 'Wake the courier gently', tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: 'You reboot it with a hum and a lullaby. It sits up, brightens, and says: "THANK YOU. I WAS BEING NOBLE FOR NINE DAYS."', fx: [{ xp: { science: 1 } }, { clearFlag: 'distress_active' }], goto: 'b' }, fail: { text: 'It restarts crooked and recites the entire index of a tea catalogue before settling.', fx: [{ morale: 2 }, { clearFlag: 'distress_active' }], goto: 'b' } },
          { label: 'Tow the pod to the nearest port', tag: 'trade', do: { text: 'The tow takes a day, and a little fuel. The courier chatters politely the whole way.', fx: [{ days: 1 }, { fuel: -1 }, { clearFlag: 'distress_active' }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Courier 14-Verso', species: 'archivist' },
        text: '"I WAS CARRYING A QUESTION FOR THE ARCHIVE. IT HAS SPILLED. THE SPILLAGE IS IN SEVEN PIECES. PLEASE HELP ME GATHER THEM."',
        choices: [
          { label: 'Help it reassemble the question', tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: '"WHAT IS THE SHAPE OF A WELCOME?" The question, restored, is beautiful. It glows with something like relief.', fx: [{ xp: { science: 2 } }, { rep: { archivists: 6 } }], goto: 'c' }, fail: { text: 'You assemble six pieces. The seventh turns out to be a cat hair, and the courier is fine with it.', fx: [{ rep: { archivists: 3 } }], goto: 'c' } },
          { label: 'Offer a riddle of your own as comfort', tag: 'diplomacy', do: { text: '"WHY DID THE TEAPOT BLUSH?" The courier whirs for a full minute. "BECAUSE IT SAW THE KETTLE\'S SPOUT. A PUN. DELIGHTFUL."', fx: [{ rep: { archivists: 4 } }, { morale: 3 }], goto: 'c' } },
        ],
      },
      c: {
        speaker: { name: 'Courier 14-Verso', species: 'archivist' },
        text: '"I OWE YOU A FAVOUR OF THE ARCHIVE. I WILL REMEMBER YOU. THE ARCHIVE REMEMBERS EVERYTHING. THIS IS A COMFORT, MOSTLY."',
        choices: [
          { label: 'Accept the debt graciously', tag: 'diplomacy', do: { text: 'Its sash gleams as it saunters off down the dock, whispering to itself, "seven pieces, seven pieces, seven…"', fx: [{ flag: 'courier_owed' }, { item: { riddle_coin: 1 } }, { morale: 3 }] } },
        ],
      },
    },
  },

  {
    id: 'dist_dry_tank',
    title: 'The Wobbling Pudding',
    tags: ['relief', 'trade', 'comedy'],
    ctx: 'distress',
    weight: 10,
    when: [],
    cooldown: 12,
    art: { scene: 'ship_alien', species: 'quillari' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Granny Orla', species: 'quillari' },
        text: '"Oh, bless you! The *Wobbling Pudding* has run dry. It\'s a deplorable thing, on a dignified ship. I have eleven nieces aboard and a very impatient aunt."',
        choices: [
          { label: 'Share three fuel cells', tag: 'trade', if: [{ fuel: 4 }], do: { text: 'The nieces cheer and the aunt, as promised, is impatient. The Pudding lights up like a birthday cake.', fx: [{ fuel: -3 }, { clearFlag: 'distress_active' }, { rep: { quillari: 4 } }], goto: 'b' } },
          { label: 'Sell her fuel at a premium', tag: 'trade', if: [{ fuel: 3 }], do: { text: 'Granny Orla pays sixty scrip, a tiny sigh and a very long look. It is business. It does not feel like it.', fx: [{ fuel: -2 }, { credits: 60 }, { clearFlag: 'distress_active' }, { rep: { quillari: -3 } }], goto: 'b' } },
          { label: 'Tow the Pudding to the nearest port', tag: 'flee', check: { skill: 'piloting', diff: 3 }, pass: { text: 'A graceful two-day tow, nieces waving from every porthole. Nobody spills a drop.', fx: [{ days: 2 }, { fuel: -1 }, { clearFlag: 'distress_active' }, { rep: { quillari: 5 } }, { xp: { piloting: 1 } }], goto: 'b' }, fail: { text: 'The cable twists and the Pudding spins, to loud delight from the nieces and loud nausea from the aunt.', fx: [{ days: 2 }, { fuel: -2 }, { hull: -3 }, { clearFlag: 'distress_active' }, { rep: { quillari: 3 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Granny Orla', species: 'quillari' },
        text: '"Now, now. Quillari always pay what they owe, except when we don\'t, and today we do. Cargo, or a favour? A favour is worth more, I hear."',
        choices: [
          { label: 'Take two crates of brandy', tag: 'trade', do: { text: 'Orla slides two crates across with a flourish. "Don\'t drink it all in one go. Do drink it all in one go."', fx: [{ cargo: { glass_brandy: 2 } }], goto: 'c' } },
          { label: 'Take the favour', tag: 'diplomacy', do: { text: '"A favour! How old-fashioned. How lovely." She presses a feather into your palm. "Show this to any Quillari and ask for me."', fx: [{ flag: 'orla_owes' }, { item: { quillari_guest_feather: 1 } }], goto: 'c' } },
        ],
      },
      c: {
        speaker: { name: 'Granny Orla', species: 'quillari' },
        text: 'She waves from the Pudding\'s viewport until the barge is a pinprick, and then a rumour, and then a pleasant memory.',
        choices: [
          { label: 'Wave back', tag: 'wait', do: { text: 'The bridge crew waves with you. The deck feels a little warmer than before.', fx: [{ morale: 4 }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- CALLBACKS
  {
    id: 'cb_courier_returns',
    title: 'The Question, Resolved',
    tags: ['mystery', 'wonder', 'science'],
    ctx: 'travel',
    weight: 90,
    when: [{ any: [{ flag: 'courier_owed' }, { flag: 'audit_passed' }] }, { day: [10, 999] }],
    once: true,
    art: { scene: 'ship_alien', species: 'archivist' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Courier 14-Verso', species: 'archivist' },
        text: '"CAPTAIN. I HAVE DELIVERED THE QUESTION. THE ARCHIVE WAS MOVED. THEY HAVE SENT ME BACK WITH A GIFT AND AN INDEX CARD." Its sash gleams. It looks, for a machine, extremely pleased with itself.',
        choices: [
          { label: 'Accept the gift', tag: 'trade', do: { text: 'A sealed sheaf of star-charts, annotated in three kinds of ink. The Archive does not do this lightly.', fx: [{ reveal: { radius: 3 } }, { cargo: { star_charts: 2 } }, { clearFlag: 'courier_owed' }, { rep: { archivists: 4 } }], goto: 'b' } },
          { label: 'Ask what the question was', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"IT WAS: WHAT IS THE SHAPE OF A WELCOME?" The courier, beaming, adds: "ANSWER: ROUND, WITH A HANDLE."', fx: [{ rep: { archivists: 5 } }, { morale: 5 }, { clearFlag: 'courier_owed' }], goto: 'b' }, fail: { text: '"CONFIDENTIAL," says the courier, vibrating with the effort of not telling you.', fx: [{ clearFlag: 'courier_owed' }, { rep: { archivists: 2 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Courier 14-Verso', species: 'archivist' },
        text: '"ONE LAST THING. THE ARCHIVE CONSIDERS YOU A FRIEND OF THE FILES. THIS IS A MILD HONOUR, BUT NOT A SMALL ONE." It bows, ratchets, and shuffles off.',
        choices: [
          { label: 'Bow back', tag: 'diplomacy', do: { text: 'You bow. The courier\'s hat-feather quivers. Dobbin whispers, "I have never been so jealous in my life."', fx: [{ morale: 4 }] } },
        ],
      },
    },
  },

  {
    id: 'cb_orla_repays',
    title: 'Granny Orla Collects a Favour',
    tags: ['trade', 'comedy', 'relief'],
    ctx: 'arrive',
    weight: 90,
    when: [{ any: [{ flag: 'orla_owes' }, { flag: 'stew_of_nine' }] }, { system: { hasStation: true } }],
    once: true,
    art: { scene: 'market', species: 'quillari', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Granny Orla', species: 'quillari' },
        text: '"Captain! The *Wobbling Pudding* has docked three berths down, and the whole family is in uproar. I told the cousins: show them what it means to be owed. Now what shall it be? A feast? A fill-up? A nice sit-down?"',
        choices: [
          { label: 'A top-up for the tanks', tag: 'trade', do: { text: 'A cousin wheels out fuel cells and a barrel of supplies on a trolley. "No charge!" they shout. There is a charge. It is love.', fx: [{ fuel: 8 }, { supplies: 4 }, { clearFlag: 'orla_owes' }, { rep: { quillari: 3 } }], goto: 'b' } },
          { label: 'A family feast', tag: 'diplomacy', do: { text: 'Twelve courses and eleven nieces. Dobbin is allowed to taste something and glows with transcendent confusion.', fx: [{ morale: 10 }, { supplies: 2 }, { clearFlag: 'orla_owes' }, { rep: { quillari: 4 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Granny Orla', species: 'quillari' },
        text: '"One more thing, dear. A rumour, free of charge. There is a wreck in the next sector that nobody has bothered to loot. Tell no one but your entire crew."',
        choices: [
          { label: 'Take the rumour', tag: 'persuade', do: { text: 'She whispers a name, "the Teaspoon of Hope", and a rough bearing. It is probably true.', fx: [{ flag: 'rumour_wreck' }, { reveal: 'nearest' }] } },
        ],
      },
    },
  },

  {
    id: 'cb_hab_banquet',
    title: 'The Hab Remembers',
    tags: ['diplomacy', 'wonder', 'relief'],
    ctx: 'arrive',
    weight: 90,
    when: [{ any: [{ flag: 'owed_by_drifters' }, { flag: 'quarrel_mediated' }, { flag: 'apprentice_done' }] }, { system: { faction: 'drifters' } }],
    once: true,
    art: { scene: 'lounge', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Elder Marrow', species: 'drifter' },
        text: 'Word has travelled faster than your ship. As you dock, drifters line the passage with paper lanterns. "The Halcyon! The one who carried the Kettle home! You will sit. You will eat. The ones who say no will sit and eat anyway."',
        choices: [
          { label: 'Sit and eat', tag: 'diplomacy', do: { text: 'The banquet lasts four hours and three languages. Someone sings a ballad about you; the ballad is wildly inaccurate, and you let it be.', fx: [{ morale: 9 }, { supplies: 4 }, { rep: { drifters: 3 } }, { clearFlag: 'owed_by_drifters' }], goto: 'b' } },
          { label: 'Insist you must be on your way', tag: 'wait', do: { text: 'A procession accompanies you to the airlock regardless, bearing food. You do not escape unfed.', fx: [{ supplies: 3 }, { clearFlag: 'owed_by_drifters' }, { morale: 3 }] } },
        ],
      },
      b: {
        speaker: { name: 'Elder Marrow', species: 'drifter' },
        text: 'As the lanterns burn low, Marrow draws you aside. "There is a story the drifters keep. About a drifting wall of light, far out toward the Rim. If you hear it, don\'t be afraid. It only sings to those it likes."',
        choices: [
          { label: 'Ask where to listen', tag: 'persuade', do: { text: 'She draws a bearing on a napkin. It is, by any measure, not scientifically useful. It is exactly the sort of hint that gets a ship to a place.', fx: [{ reveal: { radius: 3 } }, { flag: 'rim_whisper' }, { morale: 3 }] } },
        ],
      },
    },
  },

  {
    id: 'cb_tollkeeper_remembers',
    title: 'The Toll-Keeper Remembers You',
    tags: ['diplomacy', 'trade', 'comedy'],
    ctx: 'arrive',
    weight: 90,
    when: [{ any: [{ flag: 'tollgate_friend' }, { item: 'toll_token' }] }, { system: { faction: 'quillari' } }],
    once: true,
    art: { scene: 'station', species: 'quillari' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Toll-Keeper Wrenna', species: 'quillari' },
        text: 'A brass gate swings open before you reach it. Out comes a plump Quillari in a toll-keeper\'s sash. "You! The one with the lost tea-cosy story! I have been practising a reply for weeks. My name is Wrenna. Welcome back, free of charge."',
        choices: [
          { label: 'Tell the next chapter of the tea-cosy story', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'The cosy turns up in a bakery, then a courtroom, then a wedding. Wrenna sobs with laughter and gifts you a toll-token and a bag of sweets.', fx: [{ item: { toll_token: 2 } }, { supplies: 2 }, { rep: { quillari: 4 } }, { clearFlag: 'tollgate_friend' }], goto: 'b' }, fail: { text: 'You forget the ending. Wrenna fills it in herself, magnificently, and it is better than yours.', fx: [{ item: { toll_token: 1 } }, { rep: { quillari: 2 } }, { clearFlag: 'tollgate_friend' }], goto: 'b' } },
          { label: 'Ask only for passage', tag: 'wait', do: { text: '"Passage granted, with delight." She waves you through, and a banner unfurls: "THE TEA-COSY LADY WAS HERE."', fx: [{ item: { toll_token: 1 } }, { clearFlag: 'tollgate_friend' }, { morale: 2 }] } },
        ],
      },
      b: {
        speaker: { name: 'Toll-Keeper Wrenna', species: 'quillari' },
        text: '"Between us, I have an uncle in the next sector who buys odd goods at excellent rates. Tell him Wrenna sent you, and mention the cosy."',
        choices: [
          { label: 'Take the introduction', tag: 'trade', do: { text: 'She scrawls a note on a toll-slip. Somewhere, an uncle is about to be pleasantly surprised.', fx: [{ flag: 'uncle_intro' }, { reveal: 'nearest' }] } },
        ],
      },
    },
  },

  {
    id: 'cb_rumour_wreck',
    title: 'The Teaspoon of Hope',
    tags: ['mystery', 'science', 'hazard'],
    ctx: 'travel',
    weight: 40,
    when: [{ flag: 'rumour_wreck' }],
    once: true,
    art: { scene: 'derelict', species: 'unknown' },
    start: 'a',
    nodes: {
      a: {
        text: 'Where the rumour said, a long, lean wreck hangs in the dark. Gold letters on the hull spell *TEASPOON OF HOPE*. Its lights are out. It looks, you decide, like a ship that knew how to throw a good party.',
        choices: [
          { label: 'Board with a tether team', tag: 'science', check: { skill: 'engineering', diff: 3 }, pass: { text: 'The airlock yields. Inside: a flooded ballroom, now frozen to glass, and a vault where the wine was kept.', fx: [{ xp: { engineering: 1 } }], goto: 'b' }, fail: { text: 'A bulkhead flexes; a panel swings. Hull scrapes on the way out. Nobody is hurt, but pride is.', fx: [{ hull: -6 }, { morale: -2 }], goto: 'b' } },
          { label: 'Scan from a safe distance', tag: 'science', check: { skill: 'science', diff: 2 }, pass: { text: 'The scan finds a sealed cargo hold and a weak transponder. It is enough.', fx: [{ xp: { science: 1 } }], goto: 'b' }, fail: { text: 'The scan finds a lot of mirror-glass. Mostly.', fx: [{ days: 1 }], goto: 'b' } },
          { label: 'Leave it, with respect', tag: 'wait', do: { text: 'You salute the wreck and move on. The crew isn\'t sure whether to be proud or disappointed.', fx: [{ clearFlag: 'rumour_wreck' }, { morale: 1 }] } },
        ],
      },
      b: {
        text: 'In the sealed hold: three crates of gleaming machine parts, a case of fine glass brandy, and an old black ghost-log cube in a velvet box.',
        choices: [
          { label: 'Take the cargo', tag: 'trade', do: { text: 'The crates go on board, the brandy goes into the bonded locker, and the velvet box goes to the lounge.', fx: [{ cargo: { machine_parts: 3, glass_brandy: 1 } }, { clearFlag: 'rumour_wreck' }], goto: 'c' } },
          { label: 'Take only the log cube', tag: 'science', do: { text: 'You leave the cargo for whoever comes next. The cube, plugged in, begins to murmur apologetically.', fx: [{ item: { ghost_log_cube: 1 } }, { clearFlag: 'rumour_wreck' }, { rep: { archivists: 2 } }], goto: 'c' } },
        ],
      },
      c: {
        speaker: { name: 'Teaspoon of Hope', species: 'unknown' },
        text: 'From the wreck, a last pulse answers your departure: "THANK YOU FOR VISITING. THE PARTY WAS GOOD. IT IS ALWAYS GOOD. COME AGAIN IN THE SPRING."',
        choices: [
          { label: 'Salute the old ship', tag: 'wait', do: { text: 'The wreck dims its single lamp in reply. Dobbin stands to attention for a full minute.', fx: [{ morale: 5 }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- HAZARDS WITH REAL STAKES
  {
    id: 'haz_micrometeor_sparkle',
    title: 'Sparkle Storm',
    tags: ['hazard', 'flee', 'science'],
    ctx: 'travel',
    weight: 14,
    when: [{ day: [6, 999] }, { system: { danger: 1 } }],
    cooldown: 12,
    art: { scene: 'asteroids', species: 'unknown' },
    start: 'a',
    nodes: {
      a: {
        text: 'The helm sniffs. "Captain. That sparkle on the viewport is a micrometeor shower. It is very pretty and very sandpaper. Do we weather it, outfly it, or hide behind that rock?"',
        choices: [
          { label: 'Roll the ship and thread the gaps', tag: 'flee', check: { skill: 'piloting', diff: 4 }, pass: { text: 'You corkscrew through the shower like a seed in a spoon. Not a mark on the paint. The bridge applauds.', fx: [{ xp: { piloting: 2 } }, { morale: 4 }] }, fail: { text: 'The roll is half a beat late. The hull sings like a gong and is pitted along one flank.', fx: [{ hull: -9 }, { fuel: -1 }], goto: 'b' } },
          { label: 'Shelter behind the big rock', tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: 'The rock tumbles slowly but tolerably. The shower passes while you sip tea in its shadow.', fx: [{ days: 1 }, { xp: { science: 1 } }] }, fail: { text: 'The rock is in on it. A bounce of pebbles strikes from the other side.', fx: [{ hull: -6 }, { days: 1 }], goto: 'b' } },
          { label: 'Take it on the shielded side', tag: 'wait', do: { text: 'You angle the thickest plating and hold on. The sound is like very small hail on a very large tin roof.', fx: [{ hull: -5 }, { morale: -2 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Chief Engineer', species: 'human' },
        text: '"Pitting along the port flank, Captain. Nothing structural, but I don\'t like how it sounds. I can patch it with proper compound, or we can tape it and say a prayer."',
        choices: [
          { label: 'Patch it properly', tag: 'science', check: { skill: 'engineering', diff: 2 }, pass: { text: 'The compound sets in an hour. The hull is smooth, and the Chief is smug.', fx: [{ hull: 6 }, { xp: { engineering: 1 } }] }, fail: { text: 'The compound sets lumpy. It looks like a cake nobody wants to eat.', fx: [{ hull: 2 }, { supplies: -1 }] } },
          { label: 'Tape it and hope', tag: 'wait', do: { text: 'The tape holds, as tape does. The Chief mutters in Latin.', fx: [{ morale: -1 }] } },
        ],
      },
    },
  },

  {
    id: 'haz_coolant_leak',
    title: 'Something Sweet in the Air',
    tags: ['hazard', 'science', 'comedy'],
    ctx: 'travel',
    weight: 12,
    when: [{ day: [8, 999] }],
    cooldown: 20,
    art: { scene: 'engine_room', species: 'robot' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Dobbin', species: 'robot' },
        text: '"Captain. I have detected a sweet smell near the number-two coil. In my experience of seven years, a sweet smell is either cake or coolant, and I regret to report that there is no cake."',
        choices: [
          { label: 'Isolate and patch the line', tag: 'science', check: { skill: 'engineering', diff: 3 }, pass: { text: 'You close the manifold, bind the pipe with wire, and save most of the coolant. The sweet smell fades.', fx: [{ xp: { engineering: 2 } }], goto: 'b' }, fail: { text: 'The valve sticks. A fine mist settles over the deck. You lose most of the coolant before it holds.', fx: [{ fuel: -2 }], goto: 'b' } },
          { label: 'Vent the compartment and wait', tag: 'wait', do: { text: 'The compartment is sealed and vented. The coolant, and a surprising amount of fuel, drifts away like a perfumed ghost.', fx: [{ fuel: -3 }, { days: 1 }], goto: 'b' } },
          { label: 'Call the medic first', tag: 'science', check: { skill: 'medicine', diff: 2 }, pass: { text: 'The medic spots a mild coolant giddiness among the crew before it spreads. The patch gets done by a sober team.', fx: [{ xp: { medicine: 1 } }, { morale: 2 }], goto: 'b' }, fail: { text: 'The crew are slightly giddy for an hour. A very silly song is composed and, regrettably, recorded.', fx: [{ morale: 3 }, { fuel: -1 }], goto: 'b' } },
        ],
      },
      b: {
        text: 'The leak is closed, but under the galley floor you find a second, smaller drip. Dobbin looks both ways. "I have a theory it was always there. I just never wished to alarm you."',
        choices: [
          { label: 'Replace the coupling (3 supplies of sealant)', tag: 'science', if: [{ supplies: 4 }], do: { text: 'The old coupling is retired to the mantel. The new one is smug.', fx: [{ supplies: -3 }, { hull: 2 }, { morale: 2 }], goto: 'c' } },
          { label: 'Mop it up and note it for later', tag: 'wait', do: { text: 'A bucket and a tea-towel. The Halcyon has been repaired with worse.', fx: [{ morale: -1 }], goto: 'c' } },
        ],
      },
      c: {
        speaker: { name: 'Chief Engineer', species: 'human' },
        text: '"Right. If we\'d had a proper coil-flush rig I\'d have done all this in an hour. Might be worth a trip to a shipyard, Captain. Someday."',
        choices: [
          { label: 'Write "FLUSH RIG" on the wish-list', tag: 'wait', do: { text: 'The wish-list on the galley door now reads: biscuits, Table, flush rig, biscuits.', fx: [{ flag: 'wishlist_flush' }, { morale: 1 }] } },
        ],
      },
    },
  },

  {
    id: 'haz_spoiled_stores',
    title: 'The Pickle Incident',
    tags: ['hazard', 'comedy', 'science'],
    ctx: 'travel',
    weight: 11,
    when: [{ day: [8, 999] }, { supplies: 4 }],
    cooldown: 18,
    art: { scene: 'lounge', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        text: '{crew:random} arrives at the bridge, holding a jar at arm\'s length. "Captain, I don\'t want to alarm anyone, but the pickles have moved. On their own. Also, in the night, the rations have begun to fur."',
        choices: [
          { label: 'Inspect the stores carefully', tag: 'science', check: { skill: 'medicine', diff: 3 }, pass: { text: 'Most of it is salvageable. Half is rinsed, half is boiled, and a third is renamed "Experimental Cuisine".', fx: [{ supplies: -1 }, { xp: { medicine: 1 } }, { morale: 2 }] }, fail: { text: 'Three crates are written off, and the crew take it as a personal betrayal.', fx: [{ supplies: -4 }, { morale: -3 }] } },
          { label: 'Throw the lot out the airlock', tag: 'flee', do: { text: 'A hasty airlock cycle. A cloud of furry rations floats away like a confused flock. Nobody is ill. Everybody is hungry.', fx: [{ supplies: -3 }, { morale: -2 }] } },
          { label: 'Eat it with great ceremony', tag: 'wait', rand: [[2, { text: 'It tastes of ancient history and cheese. Nobody dies. A legendary supper is born.', fx: [{ morale: 6 }, { supplies: -1 }] }], [1, { text: 'A very long night in sickbay. Nobody is ever the same again about pickles.', fx: [{ morale: -4 }, { supplies: -2 }] }]] },
        ],
      },
    },
  },

  {
    id: 'haz_homesick',
    title: 'The Long Quiet',
    tags: ['relief', 'comedy'],
    ctx: 'travel',
    weight: 30,
    when: [{ day: [8, 999] }, { any: [{ not: { morale: 60 } }, { day: [30, 999] }] }],
    cooldown: 15,
    art: { scene: 'lounge', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        text: 'The ship has gone quiet. Teacups sit unused. {crew:random} stares at a photo on the console. The tea has gone cold in every cup, and nobody has noticed. Dobbin hovers, uncertain whether to offer a joke or a blanket.',
        choices: [
          { label: 'Hold a lounge night (-1 supplies)', tag: 'diplomacy', if: [{ supplies: 2 }], do: { text: 'Cards, sing-alongs, and a very bad play about a cow. By midnight the lounge is warm and loud. The photo is passed around and everybody gets to say a word.', fx: [{ supplies: -1 }, { morale: 12 }], goto: 'b' } },
          { label: 'Make a short, honest speech', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"I miss home too. That\'s why we chart it: so someone can find the way back." A pause. Someone sniffs. Someone nods. It works.', fx: [{ morale: 9 }, { xp: { diplomacy: 1 } }], goto: 'b' }, fail: { text: 'The speech lands somewhere between a eulogy and a seed catalogue. They are kind about it.', fx: [{ morale: 3 }], goto: 'b' } },
          { label: 'Give everyone an afternoon off', tag: 'wait', do: { text: 'The crew scatter to bunks, books and cards. The ship drifts a while, and everyone is a little better for it.', fx: [{ days: 1 }, { morale: 7 }] } },
        ],
      },
      b: {
        speaker: { name: 'Dobbin', species: 'robot' },
        text: '"Captain, I have been told that morale is a function of tea, company and the knowledge that someone has noticed. I believe you have achieved all three. I will make a note in the log, in felt-tip."',
        choices: [
          { label: 'Thank Dobbin', tag: 'diplomacy', do: { text: 'Dobbin whirs, a bit moved. It tucks a small paper flower beside the helm.', fx: [{ morale: 3 }, { flag: 'dobbin_flower' }] } },
        ],
      },
    },
  },
  {
    id: 'cb_pip_repays',
    title: 'Pip Feathergrass Settles Her Tab',
    tags: ['trade', 'comedy', 'relief'],
    ctx: 'arrive',
    weight: 90,
    when: [{ any: [{ flag: 'pip_owes' }, { flag: 'lane_cake_friend' }, { flag: 'wedding_toasted' }] }, { system: { faction: 'quillari', hasStation: true } }],
    once: true,
    art: { scene: 'market', species: 'quillari', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Captain Pip Feathergrass', species: 'quillari' },
        text: '"HALCYON! I have been saying your name all over the harbour and half of it has been listening. My cousin runs the fuel dock and my other cousin runs the other fuel dock. Tell me which one you prefer. They are rivals. It is a very good feud."',
        choices: [
          { label: 'The first cousin, for fuel', tag: 'trade', do: { text: 'Cousin One sells you eight cells for the price of five, with a loud sniff in the direction of Cousin Two.', fx: [{ fuel: 8 }, { credits: -20 }, { clearFlag: 'pip_owes' }, { rep: { quillari: 2 } }], goto: 'b' } },
          { label: 'The second cousin, for supplies', tag: 'trade', do: { text: 'Cousin Two packs a hamper of ration bars and pickled something, and loudly insists that the first cousin\'s fuel is secretly watered.', fx: [{ supplies: 6 }, { credits: -15 }, { clearFlag: 'pip_owes' }, { rep: { quillari: 2 } }], goto: 'b' } },
          { label: 'Buy from both and make peace', tag: 'persuade', check: { skill: 'diplomacy', diff: 4 }, pass: { text: 'Both cousins cheer, embrace, and bicker over the invoice, which is the highest form of peace.', fx: [{ fuel: 5 }, { supplies: 4 }, { credits: -30 }, { clearFlag: 'pip_owes' }, { rep: { quillari: 5 } }], goto: 'b' }, fail: { text: 'Each demands you pay full price to prove your loyalty. You do, with a sigh.', fx: [{ fuel: 3 }, { supplies: 2 }, { credits: -50 }, { clearFlag: 'pip_owes' }, { rep: { quillari: 1 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Captain Pip Feathergrass', species: 'quillari' },
        text: '"Now we are even, you and I. Which is a pity, I rather liked owing you. It gave me a reason to come back. Come to think of it, I shall now owe you something else."',
        choices: [
          { label: 'Laugh, and accept the new debt', tag: 'diplomacy', do: { text: 'Pip hands you a luggage tag stamped with fifty harbours. "Show it to anyone. They will wonder."', fx: [{ item: { luggage_tag: 1 } }, { morale: 5 }] } },
        ],
      },
    },
  },

  {
    id: 'cb_pell_favour',
    title: 'Inspector Pell Calls In Nothing at All',
    tags: ['comedy', 'diplomacy', 'mystery'],
    ctx: 'travel',
    weight: 30,
    when: [{ flag: 'pell_friend' }, { day: [14, 999] }],
    once: true,
    art: { scene: 'ship_alien', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Inspector Pell', species: 'human' },
        text: '"Halcyon! Perpetua here. I\'m on the radio about a favour. Not mine. Yours. I\'ve found an unmarked parcel on the lane, addressed to \'The Halcyon, whenever.\' It is not in any manifest. Odd. May I hand it across?"',
        choices: [
          { label: 'Accept the parcel', tag: 'diplomacy', do: { text: 'A small box, wrapped in string and a customs seal. Pell pretends not to look. Inside is a felt-tip set and a note: \'From a well-wisher, with respect for the paperwork.\'', fx: [{ item: { felt_tip_set: 1 } }, { clearFlag: 'pell_friend' }, { rep: { concord: 3 } }], goto: 'b' } },
          { label: 'Ask Pell to open it first, for safety', tag: 'science', check: { skill: 'science', diff: 2 }, pass: { text: 'Pell opens it under a magnifier. A felt-tip set, a note, and a very small cheese. "Cleared!" he cries.', fx: [{ item: { felt_tip_set: 1 } }, { supplies: 1 }, { clearFlag: 'pell_friend' }, { rep: { concord: 4 } }], goto: 'b' }, fail: { text: 'The magnifier slips. The cheese rolls out. A brief chase through the Cutter\'s corridors ensues.', fx: [{ item: { felt_tip_set: 1 } }, { clearFlag: 'pell_friend' }, { rep: { concord: 2 } }, { morale: 3 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Inspector Pell', species: 'human' },
        text: '"Between ourselves, Captain, I have never enjoyed a job so much as this one. Out here, nothing is in order, and nobody minds. Do carry on."',
        choices: [
          { label: 'Salute and carry on', tag: 'wait', do: { text: 'The Perpetua drops away, flashing one lamp in a friendly code. You decide it means "good luck".', fx: [{ morale: 4 }] } },
        ],
      },
    },
  },
];
