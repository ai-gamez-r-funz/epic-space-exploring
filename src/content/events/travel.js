// EVENTS-A: mid-jump encounters and arrivals. No combat; every scrape dissolves through wit, trade, science or flight.
//
// ITEMS: (unknown ids are treated as simple counters by the engine)
//   auntie_patch   - "Rusted Aunties Patch": a stitched felt badge; salvage clans wave you through.
//   toll_token     - "Free-Passage Token": Quillari brass disc; pays one toll buoy.
//   gossip_pin     - "Gossip Pin": enamel pin of a Quillari market-whisperer; unlocks sly asides.
//   (others used by diplomacy.js: concord_stamp, choir_reed, riddle_coin, story_knot, lantern_sprig)
//
// FLAGS set: tutorial_tea, tutorial_odds, mirror_seen, auntie_friend, comet_tea, stowaway_aboard (read here), drone_friend (read here)
// FLAGS read: festival_invited, mirror_seen, auntie_friend
//
// Goods used: ration_bars, glass_brandy, tuning_crystals, vellum_sheets, hand_looms, medical_kits, fuel_cells,
//             star_charts, curios, machine_parts

export default [
  {
    id: 'travel_teletype_tea',
    title: 'The Chattering Teletype',
    tags: ['comedy', 'wonder'],
    ctx: 'travel',
    weight: 30,
    when: [{ day: [1, 8] }],
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
          { label: 'Submit to inspection', tag: 'diplomacy', do: { text: 'Pell\'s crew spend an hour and a half in your cargo bay and leave with great satisfaction and a stamped slip. You lose a morning but gain a friend.', fx: [{ days: 1 }, { rep: { concord: 3 } }] } },
          { label: 'Declare your cargo with panache', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"Whimsy: none, Lanterns: aspirational." Pell laughs, stamps the form, and wishes you fair skies.', fx: [{ rep: { concord: 2 } }, { morale: 2 }] }, fail: { text: 'Your triplicate comes out as quadruplicate. A recount costs time and a small processing fee.', fx: [{ credits: -15 }, { days: 1 }] } },
          { label: 'Wait: a Concord stamp is just the thing', tag: 'trade', if: [{ item: 'concord_stamp' }], do: { text: 'Pell sees the Provisional Stamp and salutes. "Carry on, Captain. Mind the Form 7s."', fx: [{ rep: { concord: 2 } }, { morale: 3 }] } },
          { label: 'Plot a clever evasive arc', tag: 'flee', check: { skill: 'piloting', diff: 4 }, pass: { text: 'You vanish into a dust lane. The cutter\'s radio crackles: "Well flown. We\'ll just mark you as inspected-in-spirit."', fx: [{ fuel: -1 }, { xp: { piloting: 1 } }] }, fail: { text: 'You flush a flock of survey drones. Pell sighs, collects an apology fee and a recount.', fx: [{ credits: -20 }, { days: 1 }] } },
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
    weight: 14,
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
          { label: 'Trace the signal', tag: 'science', check: { skill: 'science', diff: 4 }, pass: { text: 'The carrier wave points at no place at all, and is addressed in your own call-sign. A first-class puzzle for the log.', fx: [{ xp: { science: 2 } }, { flag: 'mirror_seen' }] }, fail: { text: 'The trace dissolves into static that sounds almost like laughter. Kindly laughter.', fx: [{ xp: { science: 1 } }] } },
          { label: 'File the tape in the captain\'s log', tag: 'wait', do: { text: 'You tuck the ribbon into the log with a felt-tip note: "Ask someone clever." Morale rises, in a worried way.', fx: [{ morale: 2 }, { flag: 'mirror_seen' }] } },
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
          { label: 'Drop everything for tea', tag: 'wait', do: { text: 'The whole crew crowds the lounge as the tail glides past in rose and aquamarine. Someone proposes a toast. Someone else proposes another.', fx: [{ morale: 8 }, { supplies: -1 }, { flag: 'comet_tea' }] } },
          { label: 'Take samples from the tail', tag: 'science', check: { skill: 'science', diff: 2 }, pass: { text: 'Pristine ice, clean data, and a rare chemical signature the Society will adore.', fx: [{ credits: 25 }, { xp: { science: 1 } }, { morale: 2 }] }, fail: { text: 'The sampler freezes shut. You still drink the tea.', fx: [{ morale: 2 }] } },
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
          { label: 'Beam over a treatment', tag: 'science', check: { skill: 'medicine', diff: 2 }, pass: { text: '{crew:medicine} diagnoses a harmless pollen. Three drops of sedative tea, and the hiccups hush.', fx: [{ rep: { drifters: 4 } }, { xp: { medicine: 2 } }, { morale: 3 }] }, fail: { text: 'The first treatment makes the hiccups louder; the second quiets them. Tamsin is grateful and slightly hoarse.', fx: [{ rep: { drifters: 2 } }, { xp: { medicine: 1 } }] } },
          { label: 'Donate a medical kit', tag: 'trade', if: [{ cargo: { medical_kits: 1 } }], do: { text: 'Tamsin pays what she can in scrip and thanks; the leaflet in the kit is, she says, hilarious.', fx: [{ cargo: { medical_kits: -1 } }, { rep: { drifters: 4 } }, { credits: 40 }] } },
          { label: 'Send best wishes and keep going', tag: 'wait', do: { text: '"Hic. Understood. We\'ll… hic… manage."', fx: [{ morale: -2 }] } },
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
          { label: 'Tell the story-horn a tale', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'You spin a yarn about a lost tea-cosy. The horn wheezes with laughter. Out pops a brass token: "FREE PASSAGE, ONE USE."', fx: [{ item: { toll_token: 1 } }, { rep: { quillari: 3 } }] }, fail: { text: 'The horn burps. "Insufficient plot." The gate nevertheless opens, out of pity.', fx: [{ morale: -1 }] } },
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
          { label: 'Land and picnic', tag: 'wait', rand: [[3, { text: 'The tea steams, the view is unbeatable, and the sandwiches turn out to be real. A glorious hour.', fx: [{ morale: 8 }, { supplies: -1 }] }], [1, { text: 'The rock turns out to rotate. Everyone gets a gentle spin and half the jam.', fx: [{ morale: 5 }, { supplies: -1 }] }]] },
          { label: 'Prospect the rock instead', tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: 'A seam of glittering ore! Not much, but a gift for the Society and a good story for the log.', fx: [{ credits: 35 }, { xp: { science: 1 } }] }, fail: { text: 'Only iron and gravel. Dobbin sighs and brings the hamper out anyway.', fx: [{ morale: 3 }] } },
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
          { label: 'Share three fuel cells', tag: 'trade', if: [{ fuel: 4 }], do: { text: 'Pip\'s crew cheers. They load you up with gossip: three secret shortcuts and one scandalous omelette recipe.', fx: [{ fuel: -3 }, { rep: { quillari: 5 } }, { reveal: { radius: 1 } }, { morale: 2 }] } },
          { label: 'Offer fuel for payment', tag: 'trade', if: [{ fuel: 3 }], do: { text: 'Pip forks over 50 scrip with only a little wailing. "Business is business, darling."', fx: [{ fuel: -2 }, { credits: 50 }, { rep: { quillari: 1 } }] } },
          { label: 'Radio the nearest tender', tag: 'diplomacy', do: { text: 'The Meridian tender will fetch them by dinner. Pip approves of the efficiency, and of you.', fx: [{ rep: { quillari: 2 } }, { rep: { concord: 1 } }] } },
          { label: 'Wish them well and press on', tag: 'wait', do: { text: '"Oh, I understand," says Pip. She does not sound as if she does.', fx: [{ rep: { quillari: -2 } }] } },
        ],
      },
    },
  },

  {
    id: 'travel_survey_thanks',
    title: 'Notes from the Chartroom',
    tags: ['wonder', 'diplomacy'],
    ctx: 'travel',
    weight: 9,
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
];
