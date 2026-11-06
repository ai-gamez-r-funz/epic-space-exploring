// EVENTS-B: planet & landing-party events (ctx 'planet' = after scan, 'landing' = landing party).
//
// ITEMS: (invented item ids; WORLD may rename/describe)
//   ice_chime        - Singing-Ice Chime: a palm-sized sliver of ice-glass that hums a perfect fifth when held near warm hands.
//   keeper_lens      - Keeper's Spare Lens: a hand-ground beacon lens, polished by a robot with infinite patience.
//   polite_seed      - Courteous Seedpod: a seed that unfurls only if thanked first; makes a lovely lounge plant.
//   door_token       - Ask-Nicely Token: an archive-brass token that proves the bearer once said "please" to the Old Doors.
//   kelp_lantern     - Kelp-City Lantern: a glowing bladder-lamp, a gift of the Tidewrights.
//   tea_sample       - Cloud-Tea Sample: a sealed flask of toxic-world tea-fog, perfectly safe if never opened indoors.
//
// CODEX: (ids used in {codex:..}; WORLD please cover each)
//   codex_singing_ice      - The Singing Ice of the Cold Worlds
//   codex_polite_flora     - Courteous Flora (plants that return a greeting)
//   codex_lava_forgers     - The Forge-Hospitality of Molten Worlds
//   codex_crystal_gardens  - Crystal Gardens and Their Gardeners
//   codex_caravan_roads    - Dust-Road Caravans of the Vanished
//   codex_kelp_cities      - Tidewright Kelp Cities
//   codex_tea_clouds       - Tea-Clouds of the Toxic Worlds
//   codex_shepherd_moons   - Shepherd Moons and Ring Choreography
//   codex_lighthouse_robot - The Lone Keeper Robot
//   codex_polite_doors     - Doors That Must Be Asked Nicely
//   codex_hot_springs      - Restorative Springs and the Etiquette of Soaking
//   codex_cloud_skimming   - Skimming the Gas Giants
//   codex_ancient_signal   - The Patient Signal
//
// ROUND 2 additions: 17 scan discoveries (ctx 'planet'), 6 landing chains, deepened lava/ocean/ancient-signal events.
// CODEX (new): codex_frost_flowers codex_old_buoys codex_lava_glass codex_dune_script codex_glass_fields codex_deep_singers
//   codex_canopy_lights codex_orchard_tractors codex_hollowell codex_crater_letters codex_ore_claims codex_crystal_bloom
//   codex_acid_rain codex_floating_gardens codex_ring_ice codex_survey_stakes codex_aurora_fields codex_dust_postcards
//   codex_sandships codex_seedling_court codex_tide_tables   (WORLD-B please cover; titles = readable form of the id)
// FLAGS (new): fellowship_known (archive_heart_ledger), orchard_friend, archive_survey_promise, sandship_restored, oriel_aboard,
//   signal_coordinates. Reads: keeper_befriended, polite_doors_learned, kelp_city_friend.
// FLAGS set:  keeper_befriended, polite_doors_learned, kelp_city_friend, ancient_signal_heard
// FLAGS used: keeper_befriended (follow-up), polite_doors_learned (follow-up)

export default [
  // ---------------------------------------------------------------- ICE
  {
    id: 'ice_singing_caverns',
    title: 'The Singing Caverns',
    tags: ['wonder', 'science'],
    ctx: 'landing',
    weight: 10,
    when: [{ planetType: 'ice' }],
    cooldown: 25,
    art: { scene: 'landing', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `The landing party steps into a blue cavern where the ice hums. Not wind: notes. Long, patient, slightly flat in the upper register. Every icicle is a pipe in an organ the size of a cathedral.`,
        choices: [
          { label: `Stand still and listen`, tag: 'wait', do: { text: `The notes drift into a slow chord, and for a moment {crew:random} could swear it resolved.`, fx: [{ morale: 3 }], goto: 'b' } },
          { label: `Map the resonances with the field analyser`, tag: 'science', check: { skill: 'science', diff: 3 },
            pass: { text: `The hum is thermal: warm air through ice tubes. {crew:science} charts the whole chord progression and finds the cavern repeats every eleven minutes.`, fx: [{ xp: { science: 2 } }, { codex: 'codex_singing_ice' }], goto: 'b' },
            fail: { text: `An icicle, offended by the analyser, sheds a chime-shaped chunk onto your helmet. Everyone agrees it was in tune.`, fx: [{ hull: -3 }], goto: 'b' } },
          { label: `Hum back, politely`, tag: 'persuade', rand: [
            [3, { text: `The cavern pauses, then harmonises a third above. Delighted, the party improvises a duet until the suit heaters complain.`, fx: [{ morale: 6 }], goto: 'b' }],
            [1, { text: `You hit a note the cavern dislikes. A single stalactite sighs and drops. Nobody is hurt; everybody is embarrassed.`, fx: [{ morale: -2 }], goto: 'b' }],
          ] },
        ],
      },
      b: {
        text: `At the cavern's heart, a pillar of clear ice rings softly, a bell waiting for a clapper. Frost has gathered where visitors have stood before; the prints are not human.`,
        choices: [
          { label: `Tap the pillar once, gently`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `A single pure tone fills the cave and a thumb-sized sliver of ice-glass falls free, humming. A gift, or at least an accident with excellent manners.`, fx: [{ item: { ice_chime: 1 } }, { codex: 'codex_singing_ice' }] },
            fail: { text: `The pillar answers with a note so low the sensors fog. Nothing else happens; the party leaves with ringing ears and a story.`, fx: [{ morale: 1 }] } },
          { label: `Record everything and leave it as we found it`, tag: 'wait', do: { text: `The recording will make a lovely lounge background. The caverns keep their song; you keep the memory.`, fx: [{ morale: 4 }, { codex: 'codex_singing_ice' }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- JUNGLE
  {
    id: 'jungle_polite_plants',
    title: 'The Courteous Undergrowth',
    tags: ['comedy', 'diplomacy'],
    ctx: 'landing',
    weight: 10,
    when: [{ planetType: 'jungle' }],
    cooldown: 25,
    art: { scene: 'landing', species: 'unknown', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `The vines part as the party approaches. Flowers nod. A thorny hedge draws back, then waits. Every plant on this trail seems to be holding the door. It is, frankly, unnerving how well-behaved the jungle is.`,
        choices: [
          { label: `Say "thank you" to the hedge`, tag: 'diplomacy', do: { text: `The hedge rustles, pleased, and a path of moss unrolls ahead of you. Somewhere a fern curtsies.`, fx: [{ morale: 3 }], goto: 'b' } },
          { label: `Take a cutting for the lab`, tag: 'science', check: { skill: 'science', diff: 3 },
            pass: { text: `You ask first. The plant considers it, then hands over a cutting with what {crew:science} calls "a distinctly ceremonial droop". The lab's chlorophyll readings are exquisite.`, fx: [{ xp: { science: 2 } }, { codex: 'codex_polite_flora' }], goto: 'b' },
            fail: { text: `You forget to ask. Every leaf within ten metres turns away in silent disapproval. The cutting wilts out of spite.`, fx: [{ morale: -2 }], goto: 'b' } },
          { label: `Walk straight through, mind on the mission`, tag: 'flee', do: { text: `Vines fold neatly out of the way, then fold back, as if politely noting that you did not say a word.`, fx: [], goto: 'b' } },
        ],
      },
      b: {
        text: `A clearing. In the middle, a single pod the size of a cantaloupe sits on a stump, wrapped in a ribbon of grass. A leaf beside it bears a neat pattern that could be a "please take one".`,
        choices: [
          { label: `Accept the pod, with a small bow`, tag: 'diplomacy', if: [{ skill: { diplomacy: 1 } }],
            do: { text: `The pod unfurls into a seed, which unfurls into a very small bow of its own. It will thrive in the lounge, if anyone remembers to thank it daily.`, fx: [{ item: { polite_seed: 1 } }, { morale: 3 }, { codex: 'codex_polite_flora' }] } },
          { label: `Leave a ration bar as thanks and go`, tag: 'trade', do: { text: `The ration bar vanishes beneath a leaf so fast it seems rude to watch. A moment later, a soft rustle: approval.`, fx: [{ cargo: { ration_bars: -1 } }, { morale: 2 }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- LAVA
  {
    id: 'lava_forge_hospitality',
    title: 'Forge-Hospitality',
    tags: ['trade', 'wonder'],
    ctx: 'landing',
    weight: 10,
    when: [{ planetType: 'lava' }],
    cooldown: 25,
    art: { scene: 'landing', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Forgemother Ashka', species: 'drifter' },
        text: `A drifter smith waves from a heat-shielded platform above a lava river, apron smouldering. "Visitors! Mind the floor, it is also the stove. I am forging a gift, and I will not be rushed. Stay, and be useful."`,
        choices: [
          { label: `Work the bellows beside her`, tag: 'science', check: { skill: 'engineering', diff: 3 },
            pass: { text: `{crew:engineering} reads the heat like a score and brings the flame to a perfect cherry-red. Ashka grunts approval and presses a bar of folded alloy into your hands.`, fx: [{ cargo: { machine_parts: 2 } }, { xp: { engineering: 2 } }, { rep: { drifters: 3 } }], goto: 'b' },
            fail: { text: `The bellows kick back. A spray of sparks browns half your eyebrows. Ashka laughs so hard she drops her hammer, and, mollified, hands over one small bolt anyway.`, fx: [{ hull: -3 }, { cargo: { machine_parts: 1 } }, { morale: 1 }] } },
          { label: `Offer a glass of brandy to the forge`, tag: 'trade', if: [{ cargo: { glass_brandy: 1 } }],
            do: { text: `She pours half onto the coals. The flames turn blue-gold and sing. She pours the rest into two cups. "Now we can talk." You leave with a map to three nearby lava springs.`, fx: [{ cargo: { glass_brandy: -1 } }, { rep: { drifters: 5 } }, { reveal: { radius: 2 } }, { codex: 'codex_lava_forgers' }] } },
          { label: `Watch, and take notes for the log`, tag: 'wait', do: { text: `She forges a spoon. It is the most beautiful spoon you have ever seen. She hands it over without a word. The galley bot is overjoyed.`, fx: [{ morale: 4 }, { codex: 'codex_lava_forgers' }] } },
        ],
      },
      b: {
        speaker: { name: 'Forgemother Ashka', species: 'drifter' },
        text: `Ashka pulls a glowing blank from the coals. "Now the gift. Strike it with me, three times, on the beat. Miss the beat and the metal sulks for a century." She hands over a hammer. It is heavier than it looks, and warmer.`,
        choices: [
          { label: `Strike on the beat`, tag: 'flee', check: { skill: 'piloting', diff: 3 },
            pass: { text: `Three clean strokes, three bright chimes. The blank takes its shape: a small brass astrolabe-cog that fits the Halcyon's helm. Ashka grins. "It'll keep you honest."`, fx: [{ xp: { piloting: 2 } }, { cargo: { star_charts: 1 } }, { reveal: { radius: 3 } }, { codex: 'codex_lava_forgers' }] },
            fail: { text: `The third strike lands late. The blank sulks, going matte and dull, and Ashka sighs. She hands over a plain bolt instead, kindly, and a burn salve for your thumb.`, fx: [{ hull: -2 }, { cargo: { machine_parts: 1 } }, { codex: 'codex_lava_forgers' }] } },
          { label: `Let Ashka finish it alone`, tag: 'wait', do: { text: `She works in silence, and the gift emerges: a pocket sundial that tells the time on any world. The crew passes it round the lounge like a sacred object.`, fx: [{ morale: 5 }, { rep: { drifters: 2 } }, { codex: 'codex_lava_forgers' }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- CRYSTAL
  {
    id: 'crystal_garden_pruning',
    title: 'The Crystal Gardeners',
    tags: ['diplomacy', 'wonder'],
    ctx: 'landing',
    weight: 10,
    when: [{ planetType: 'crystal' }],
    cooldown: 25,
    art: { scene: 'landing', species: 'vesperine', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Gardener Thelu-Mar', species: 'vesperine' },
        text: `*A soft chord, translated by the comm array:* "We are pruning the evening sprouts. They grow toward sound. Please do not ring anything. Please also hold this very delicate trellis, if your hands are steady."`,
        choices: [
          { label: `Hold the trellis steady (piloting hands)`, tag: 'persuade', check: { skill: 'piloting', diff: 3 },
            pass: { text: `You hold it so still the crystal dust settles on your sleeves. The gardener hums in gratitude, and presses three tuning crystals into your palm.`, fx: [{ cargo: { tuning_crystals: 3 } }, { rep: { vesperine: 4 } }] },
            fail: { text: `The trellis chimes against your elbow: a note like a wine glass flying south. The garden winces, then forgives you, which is somehow worse.`, fx: [{ rep: { vesperine: -1 } }, { morale: -2 }] } },
          { label: `Harmonise a quiet greeting back`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `You match the gardener's chord a third below. Pleased, Thelu-Mar teaches the party a three-note blessing for crystal-things. It will come in handy.`, fx: [{ rep: { vesperine: 5 } }, { xp: { diplomacy: 2 } }, { codex: 'codex_crystal_gardens' }] },
            fail: { text: `The harmony arrives slightly sharp. The gardener politely pretends it was a draught.`, fx: [{ rep: { vesperine: 1 } }] } },
          { label: `Simply thank them and admire the view`, tag: 'wait', do: { text: `The garden glows amber-violet as the suns set. You are gently asked not to applaud.`, fx: [{ morale: 4 }, { codex: 'codex_crystal_gardens' }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- DESERT
  {
    id: 'desert_caravan_ruins',
    title: 'The Caravan That Left',
    tags: ['mystery', 'wonder'],
    ctx: 'landing',
    weight: 9,
    when: [{ planetType: 'desert' }, { feature: 'ruins' }],
    cooldown: 30,
    art: { scene: 'ruins', species: 'unknown', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `Half-buried wagon frames line a road of fused glass. Faded awnings, weatherproof lanterns, a dining table set for twenty. Whoever they were, they left as if called away to a surprise party. Nothing is looted.`,
        choices: [
          { label: `Follow the road to its end`, tag: 'wait', do: { text: `Two hours' walk, the road ends at a cairn of tin cups, each engraved with a name. A farewell, or a toast. You add a ration bar, out of manners.`, fx: [{ cargo: { ration_bars: -1 } }, { morale: 3 }], goto: 'b' } },
          { label: `Examine the wagons for engineering marvels`, tag: 'science', check: { skill: 'engineering', diff: 3 },
            pass: { text: `The wheels are solar-sailed gyroscopes! {crew:engineering} salvages a dozen working parts and sketches the rest into the log.`, fx: [{ cargo: { machine_parts: 2 } }, { xp: { engineering: 2 } }], goto: 'b' },
            fail: { text: `A wagon awning collapses with enormous dignity, burying the party in dust and pennants. No harm done, mostly to pride.`, fx: [{ hull: -2 }, { morale: -1 }], goto: 'b' } },
        ],
      },
      b: {
        text: `On the last wagon, a painted map: a winding line through stars, ending at a spiral you recognise from the Gate's own markings. A note beside it, in a dozen languages: "We went on ahead. Come when you're ready."`,
        choices: [
          { label: `Copy the map into the survey charts`, tag: 'science', do: { text: `The line shows lanes and waystations you have not yet seen. {crew:science} marks them carefully on the chart.`, fx: [{ reveal: { radius: 3 } }, { codex: 'codex_caravan_roads' }] } },
          { label: `Leave it be; sit at the table a while`, tag: 'wait', do: { text: `Someone finds a deck of cards, and a good hour passes. The old table seems to approve. You leave a tin cup with your own name.`, fx: [{ morale: 6 }, { codex: 'codex_caravan_roads' }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- OCEAN
  {
    id: 'ocean_kelp_city',
    title: 'City on the Swell',
    tags: ['trade', 'diplomacy', 'wonder'],
    ctx: 'landing',
    weight: 10,
    when: [{ planetType: 'ocean' }],
    cooldown: 25,
    art: { scene: 'landing', species: 'drifter', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Dockmistress Opal Sevre', species: 'drifter' },
        text: `The shuttle lands on a floating city of braided kelp and brass. Children wave from rope bridges. "Welcome, surveyors. Our harbour fee is a story, a song, or three dry biscuits. We're not particular."`,
        choices: [
          { label: `Tell the story of the Gate`, tag: 'persuade', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `You tell it with pauses. Even the harbour cats listen. By the end the whole city is on the pier, and the dockmistress gives you a lamp from her own mantel.`, fx: [{ item: { kelp_lantern: 1 } }, { rep: { drifters: 4 } }, { flag: 'kelp_city_friend' }], goto: 'b' },
            fail: { text: `You lose the thread of the story three times. The dockmistress accepts three dry biscuits, kindly, and tells you the harbour is open regardless.`, fx: [{ cargo: { ration_bars: -1 } }, { rep: { drifters: 1 } }] } },
          { label: `Trade at the floating market`, tag: 'trade', do: { text: `The kelp-weavers want hand-loomed cloth and medical kits; they pay in sea-silk, easy to resell. The market is shaped like a snail and entirely made of bargains.`, fx: [{ credits: 40 }, { codex: 'codex_kelp_cities' }] } },
          { label: `Offer hand looms as a gift`, tag: 'trade', if: [{ cargo: { hand_looms: 1 } }],
            do: { text: `The weavers burst into delighted argument over which pattern to try first. In the confusion you are given a lamp, a quilt-hung lounge, and lifetime moorage rights.`, fx: [{ cargo: { hand_looms: -1 } }, { item: { kelp_lantern: 1 } }, { upgrade: 'drifter_quilt_lounge' }, { rep: { drifters: 6 } }, { flag: 'kelp_city_friend' }, { codex: 'codex_kelp_cities' }] } },
        ],
      },
      b: {
        speaker: { name: 'Dockmistress Opal Sevre', species: 'drifter' },
        text: `A klaxon, soft and brassy. Opal's face tightens. "Squall line, an hour out. The east rafts aren't lashed down. We could use steady hands, or a shuttle with a good tow-cable. No pressure. Well, some pressure."`,
        choices: [
          { label: `Tow the east rafts into the lee`, tag: 'flee', check: { skill: 'piloting', diff: 4 },
            pass: { text: `Raft by raft, the shuttle drags the east side into the lee of the big kelp-wall. The squall hits an hour later; nobody gets wet who didn't want to. Opal hugs you, briefly, ferociously.`, fx: [{ xp: { piloting: 3 } }, { rep: { drifters: 5 } }, { morale: 8 }] },
            fail: { text: `Two rafts make it; one snaps free and is rescued by hand-lines and goodwill. The squall soaks everyone, including the shuttle. The kelp-folk call it "a baptism".`, fx: [{ hull: -4 }, { fuel: -1 }, { rep: { drifters: 2 } }] } },
          { label: `Lash the rafts down by hand`, tag: 'science', check: { skill: 'engineering', diff: 3 },
            pass: { text: `{crew:engineering} devises a lashing pattern that bests the knots of three generations. The rafts hold through the squall like seals. Opal makes a note to steal the pattern.`, fx: [{ xp: { engineering: 2 } }, { rep: { drifters: 4 } }, { cargo: { medical_kits: 1 } }] },
            fail: { text: `The lashings slip; a raft drifts. The kelp-folk retrieve it by singing. You are somewhat soaked and entirely forgiven.`, fx: [{ morale: -2 }, { rep: { drifters: 1 } }] } },
          { label: `Wish them luck and withdraw before the squall`, tag: 'flee', do: { text: `Opal nods, tight-lipped. "Understood, Captain." The squall hits behind you. You never learn how it went, and you think about it for days.`, fx: [{ morale: -3 }, { rep: { drifters: -1 } }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- TOXIC
  {
    id: 'toxic_tea_clouds',
    title: 'The Tea-Cloud Question',
    tags: ['comedy', 'science'],
    ctx: 'planet',
    weight: 10,
    when: [{ planetType: 'toxic' }],
    cooldown: 25,
    art: { scene: 'planet', species: 'robot', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Galley Bot Gus-7', species: 'robot' },
        text: `Gus-7 appears on the bridge with a spectrometer printout. "Captain, the clouds below are 94% bergamot and tannin. I do not believe this is an accident. I would like, very much, to collect them. For the lounge. Purely for morale."`,
        choices: [
          { label: `Authorise a sealed collection pass`, tag: 'science', check: { skill: 'piloting', diff: 3 },
            pass: { text: `A graceful dip, a hiss, a sealed flask. Gus-7 trembles. "Earl Grey. Smoky. Subtle." The lounge smells like a library in a good mood.`, fx: [{ item: { tea_sample: 1 } }, { morale: 8 }, { codex: 'codex_tea_clouds' }] },
            fail: { text: `You dip too far. The hull groans and the whole ship smells of an enormous kettle for a day. Gus-7 is mortified; the crew is oddly cheered.`, fx: [{ hull: -4 }, { morale: 3 }] } },
          { label: `Have the lab brew a small test sample`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `{crew:science} produces a safe, drinkable analogue. It is the best cup anyone has had in weeks. Gus-7 calls it "a scientific triumph and a minor sacrament".`, fx: [{ morale: 5 }, { xp: { science: 1 } }, { codex: 'codex_tea_clouds' }] },
            fail: { text: `The sample is technically tea. It is also fluorescent, and slightly angry. Gus-7 pours it down the drain with ceremony.`, fx: [{ morale: -1 }] } },
          { label: `Decline; poison-sky tea sounds like a bad idea`, tag: 'wait', do: { text: `Gus-7 sighs mechanically and files the idea under "for the memoirs". Later, the galley smells faintly of bergamot anyway. Nobody asks.`, fx: [{ morale: 1 }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- RINGED
  {
    id: 'ringed_shepherd_moons',
    title: 'Shepherd Moons',
    tags: ['wonder', 'science'],
    ctx: 'planet',
    weight: 10,
    when: [{ feature: 'ringed' }],
    cooldown: 25,
    art: { scene: 'planet', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `Scans show two small moons herding the ring particles into razor-thin lanes, like sheepdogs with gravity. They are, unmistakably, dancing. The lanes braid and unbraid with an elegance the nav computer calls "overly flattering".`,
        choices: [
          { label: `Fly the ring lanes along with the moons`, tag: 'flee', check: { skill: 'piloting', diff: 4 },
            pass: { text: `You slip between the moons mid-pirouette. The ring parts like a curtain, and from inside, the sun comes through a billion glittering fragments. A gasp from the whole bridge.`, fx: [{ morale: 8 }, { xp: { piloting: 2 } }, { codex: 'codex_shepherd_moons' }] },
            fail: { text: `You misjudge the beat. The moons pause, politely, and let you back out. Ring dust pings off the hull like a tambourine.`, fx: [{ hull: -4 }, { fuel: -1 }] } },
          { label: `Model the resonances from orbit`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `The ring gaps follow a pattern: orbital resonances at simple fractions. {crew:science} produces a lovely chart, and a small proof that a ring is a musical instrument.`, fx: [{ xp: { science: 2 } }, { codex: 'codex_shepherd_moons' }, { chart: true }] },
            fail: { text: `The model is correct, but the plot is unreadable. It may be art. It goes on the wall of the lounge.`, fx: [{ morale: 2 }] } },
          { label: `Drift at a safe distance and watch the show`, tag: 'wait', do: { text: `You sip tea at the viewscreen as the moons wheel through their patterns. It is better than any theatre in the Concord.`, fx: [{ morale: 5 }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- BARREN LIGHTHOUSE
  {
    id: 'barren_lighthouse_keeper',
    title: 'The Lighthouse Keeper',
    tags: ['mystery', 'wonder'],
    ctx: 'landing',
    weight: 9,
    when: [{ planetType: 'barren' }],
    once: true,
    art: { scene: 'landing', species: 'robot', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `On a barren ridge stands a lighthouse. Not much of one: a brass lamp, a steel stair, a robot in a battered oilskin coat. It is polishing the lens. It has clearly been polishing the lens for a very long time.`,
        choices: [
          { label: `Greet the keeper`, tag: 'diplomacy', do: { text: `The robot turns slowly. "Visitors. Visitors. Oh, it is you. Not the ones I was expecting. Please, come up. The stairs are only mostly rusted."`, goto: 'b' } },
          { label: `Scan the lamp first`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `The lens is cut to a design that matches a Lantern beacon's focus, scaled down and kept running by hand. Someone built this to rhyme with something much bigger.`, fx: [{ xp: { science: 1 } }, { flag: 'lantern_hint' }], goto: 'b' },
            fail: { text: `The lamp flickers at your scanner with the brightness of a very polite headache. Better to ask the keeper in person.`, goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Keeper Unit Oriel', species: 'robot' },
        text: `"I was left to keep the light on until the ships came back. I have kept it for eleven thousand days. I am not sad. I have a very good book, and I have counted the stars twice. Would you like tea? I have no tea."`,
        choices: [
          { label: `Share a pot from the ship's stores`, tag: 'diplomacy', if: [{ supplies: 5 }],
            do: { text: `Oriel holds the cup with great care, unable to drink, content to hold. It tells you about the ships that passed, and which way they turned. You leave a little lighter and a little wiser.`, fx: [{ supplies: -2 }, { rep: { archivists: 2 } }, { flag: 'keeper_befriended' }, { reveal: { radius: 3 } }, { codex: 'codex_lighthouse_robot' }] } },
          { label: `Offer to recalibrate the lens`, tag: 'science', check: { skill: 'engineering', diff: 3 },
            pass: { text: `{crew:engineering} spends an hour with a micrometer and a very rude word. The beam sharpens into a clean white blade. Oriel stares up at it and whispers, "Oh." It gives you its spare lens.`, fx: [{ item: { keeper_lens: 1 } }, { flag: 'keeper_befriended' }, { xp: { engineering: 2 } }, { codex: 'codex_lighthouse_robot' }] },
            fail: { text: `The lens is fussier than it looks. You leave it as you found it, and Oriel thanks you anyway, as if you had done something marvellous.`, fx: [{ morale: 1 }] } },
          { label: `Promise to tell other ships the light is lit`, tag: 'persuade', do: { text: `"Oh," says Oriel, and does not speak for a while. Then it hands you a hand-drawn star chart of the neighbourhood, the margins covered in tiny hopeful notes.`, fx: [{ flag: 'keeper_befriended' }, { reveal: { radius: 2 } }, { morale: 4 }, { codex: 'codex_lighthouse_robot' }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- RUINS DOORS
  {
    id: 'ruins_polite_doors',
    title: 'Doors That Must Be Asked',
    tags: ['mystery', 'diplomacy', 'comedy'],
    ctx: 'landing',
    weight: 9,
    when: [{ feature: 'ruins' }, { not: { planetType: 'desert' } }],
    cooldown: 30,
    art: { scene: 'ruins', species: 'archivist', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `The vault doors are enormous, silent, and shut. {crew:engineering} applies a spanner. The door does nothing, in a way that feels like contempt. Above the lintel, glyphs in the Archive's script read, as far as {crew:science} can tell: "Ask."`,
        choices: [
          { label: `Ask politely, in formal Archivist`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 },
            pass: { text: `"Please, if it is not an imposition." The door hums, considers, and opens with a long, grave sigh. Inside, a small plinth bears a brass token. You take it, having asked.`, fx: [{ item: { door_token: 1 } }, { rep: { archivists: 4 } }, { flag: 'polite_doors_learned' }, { codex: 'codex_polite_doors' }], goto: 'b' },
            fail: { text: `You phrase it as a request, not a petition. The door remains closed, but flickers its glyphs: "Try again, with more feeling." It is, you realise, being patient with you.`, fx: [{ morale: -1 }], goto: 'b' } },
          { label: `Try the spanner again, more politely`, tag: 'science', check: { skill: 'engineering', diff: 4 },
            pass: { text: `You oil the hinges and apologise to each in turn. The door, flattered by the courtesy, opens an inch to see what the fuss is. It's enough.`, fx: [{ item: { door_token: 1 } }, { xp: { engineering: 2 } }, { flag: 'polite_doors_learned' }, { codex: 'codex_polite_doors' }] },
            fail: { text: `The spanner slips. A sharp ring echoes down the corridor and the door seems to flinch. It is, at least, still closed.`, fx: [{ hull: -2 }], goto: 'b' } },
          { label: `Leave a small gift at the threshold`, tag: 'trade', if: [{ cargo: { vellum_sheets: 1 } }],
            do: { text: `You lay down a sheet of vellum, with a note. The door opens with the softest creak. Archive doors adore paper.`, fx: [{ cargo: { vellum_sheets: -1 } }, { item: { door_token: 1 } }, { rep: { archivists: 5 } }, { flag: 'polite_doors_learned' }, { codex: 'codex_polite_doors' }] } },
        ],
      },
      b: {
        text: `The party stands in the corridor, uncertain. The doors have gone back to being doors. A small tag beneath the glyph reads, in friendly letters: "We are not closed. We are waiting to be asked correctly."`,
        choices: [
          { label: `Ask again at the next door down`, tag: 'diplomacy', rand: [
            [2, { text: `The second door is more forgiving. Inside is nothing but an empty cupboard and a note: "Thanks for asking." You find this unreasonably moving.`, fx: [{ rep: { archivists: 2 } }, { codex: 'codex_polite_doors' }, { morale: 2 }] }],
            [1, { text: `The second door opens onto a perfectly preserved reading room. A tiny mechanical librarian offers the party a pamphlet and a cup of oil.`, fx: [{ rep: { archivists: 3 } }, { cargo: { vellum_sheets: 1 } }, { codex: 'codex_polite_doors' }] }],
          ] },
          { label: `Bow, apologise to the doors, and leave`, tag: 'wait', do: { text: `The doors seem to approve of the apology. One of them waves a tiny flag as you go.`, fx: [{ rep: { archivists: 1 } }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- TERRAN PICNIC
  {
    id: 'terran_picnic_hill',
    title: 'A Rather Good Picnic',
    tags: ['comedy', 'relief'],
    ctx: 'landing',
    weight: 8,
    when: [{ planetType: 'terran' }],
    cooldown: 20,
    art: { scene: 'landing', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `The air is sweet. The grass is soft. The sky is the colour of a good decision. {crew:random} produces a blanket from nowhere and says, with great dignity: "Captain, for science, I propose we picnic."`,
        choices: [
          { label: `Picnic, with full scientific rigour`, tag: 'wait', do: { text: `Sandwiches are catalogued. A beetle is named after the cheese. Three hours later the party returns, sunburnt, improved and insufferable.`, fx: [{ morale: 10 }, { supplies: -1 }, { mood: { all: 4 } }] } },
          { label: `Sample the soil first, then picnic`, tag: 'science', check: { skill: 'science', diff: 1 },
            pass: { text: `The soil is rich and safe. The picnic is spectacular. {crew:science} discovers a berry-shrub that tastes like citrus and optimism, and bags a handful.`, fx: [{ morale: 8 }, { supplies: 2 }, { xp: { science: 1 } }] },
            fail: { text: `The soil test is inconclusive. The picnic proceeds anyway. Only one person gets a rash, and it is the person who insisted on doing the test.`, fx: [{ morale: 5 }] } },
          { label: `Skip it and stay on schedule`, tag: 'flee', do: { text: `The picnic party looks very slightly wounded. The blanket is folded with unusual care.`, fx: [{ morale: -2 }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- GAS
  {
    id: 'gas_cloud_skimming',
    title: 'Skimming the Storm Deck',
    tags: ['hazard', 'science'],
    ctx: 'planet',
    weight: 10,
    when: [{ planetType: 'gas' }],
    cooldown: 15,
    art: { scene: 'planet', species: 'unknown', palette: 'dusk' },
    start: 'a',
    nodes: {
      a: {
        text: `The gas giant's upper decks are all banded silk and lightning. Fuel-cell scoops would eat the hydrogen here like jam off a spoon. The weather is the only objection: it is large, lazy and thoroughly indifferent.`,
        choices: [
          { label: `Skim the calm band, scoops open`, tag: 'science', check: { skill: 'piloting', diff: 3 },
            pass: { text: `A clean arc along a pale band. The scoops take their fill and the ship, flattered, rattles with joy. You emerge with the tanks fuller than expected.`, fx: [{ fuel: 3 }, { xp: { piloting: 2 } }, { codex: 'codex_cloud_skimming' }] },
            fail: { text: `A crosswind catches the ship and shakes it like a maraca. The tanks fill, a bit, and the hull complains in several keys.`, fx: [{ fuel: 1 }, { hull: -5 }] } },
          { label: `Ride the jet-stream down into the deep band`, tag: 'flee', rand: [
            [2, { text: `The jet-stream tosses the ship upward like a cork. You come out the far side with a full tank and the faint feeling you have been cheating.`, fx: [{ fuel: 4 }, { morale: 3 }] }],
            [2, { text: `A cheerful gale pushes the ship in circles for an hour. The scoops fill a little. The crew learns a new word for dizzy.`, fx: [{ fuel: 1 }, { morale: -1 }] }],
          ] },
          { label: `Admire the bands from a safe orbit`, tag: 'wait', do: { text: `The storm holds its colours like a painter's palette. You note the cloud patterns for the log and call it a day.`, fx: [{ morale: 2 }, { codex: 'codex_cloud_skimming' }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- ANCIENT SIGNAL
  {
    id: 'ancient_signal_listening',
    title: 'The Patient Signal',
    tags: ['mystery', 'science'],
    ctx: 'planet',
    weight: 9,
    when: [{ feature: 'ancient_signal' }],
    once: true,
    art: { scene: 'void', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `Scans find a faint, regular pulse under the surface. Not machinery. Not nature. A single slow rhythm, repeated every nineteen minutes: three beats, a pause, one long. It has been there longer than the planet's oceans.`,
        choices: [
          { label: `Decode the rhythm`, tag: 'science', check: { skill: 'science', diff: 4 },
            pass: { text: `The rhythm is a greeting, a pattern shared across a dozen Lantern fragments. {crew:science} puts it together: it means "we are here" and "you are not late".`, fx: [{ xp: { science: 3 } }, { flag: 'ancient_signal_heard' }, { codex: 'codex_ancient_signal' }, { reveal: { radius: 3 } }], goto: 'b' },
            fail: { text: `The rhythm refuses to be decoded. It does seem to refuse kindly. {crew:science} writes "to be continued" in the margin.`, fx: [{ morale: 1 }, { flag: 'ancient_signal_heard' }] } },
          { label: `Tap the rhythm back on the hull`, tag: 'persuade', rand: [
            [2, { text: `The pulse pauses. Then answers: three beats, a pause, two long. It has added something. You feel greeted.`, fx: [{ morale: 6 }, { flag: 'ancient_signal_heard' }, { codex: 'codex_ancient_signal' }] }],
            [1, { text: `Nothing answers. But for the rest of the day, the hull ticks softly on its own, in the same rhythm. Nobody minds.`, fx: [{ morale: 2 }, { flag: 'ancient_signal_heard' }] }],
          ] },
          { label: `Log the coordinates and move on`, tag: 'wait', do: { text: `The signal fades from your instruments, still patient. It has waited a long time, and it can wait for tea.`, fx: [{ flag: 'ancient_signal_heard' }] } },
        ],
      },
      b: {
        text: `The decoded greeting has a second line, fainter: a set of coordinates and the words "when you are ready." The coordinates match no system on any chart. The nav computer insists they lie inside a blank patch of the Reach. The blank patch, helpfully, is humming.`,
        choices: [
          { label: `Log the coordinates and plan a visit`, tag: 'science', do: { text: `Marked in gold on the chart: a patch of nothing, waiting. {crew:science} circles it three times and writes "WORTH A DETOUR" in the margin.`, fx: [{ reveal: { radius: 5 } }, { flag: 'signal_coordinates' }, { morale: 4 }] } },
          { label: `Send a reply: "We are coming, politely."`, tag: 'diplomacy', do: { text: `The pulse brightens, once. Then settles. You feel, absurdly, that you have been given an appointment by an old friend who keeps good time.`, fx: [{ flag: 'signal_coordinates' }, { rep: { archivists: 2 } }, { morale: 6 }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- HOT SPRINGS
  {
    id: 'hot_springs_soak',
    title: 'The Etiquette of Soaking',
    tags: ['relief', 'comedy'],
    ctx: 'landing',
    weight: 9,
    when: [{ feature: 'hot_springs' }],
    cooldown: 20,
    art: { scene: 'landing', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `Steam rises from a terraced pool in the rock. A weathered sign, in many scripts, says only: "RINSE FIRST. THEN SIT. THEN FORGET." Somebody has kindly left towels. No one is in sight.`,
        choices: [
          { label: `Follow the sign to the letter`, tag: 'wait', do: { text: `By the end of the hour, every shoulder in the party has unknotted. {crew:random} reports having forgotten what they were worried about. This is the point.`, fx: [{ morale: 12 }, { mood: { all: 4 } }, { codex: 'codex_hot_springs' }] } },
          { label: `Test the water for minerals first`, tag: 'science', check: { skill: 'medicine', diff: 2 },
            pass: { text: `{crew:medicine} identifies a mild healing salt in the water and prescribes a longer soak for those with bruises. The hull patches take care of themselves.`, fx: [{ morale: 10 }, { hull: 4 }, { xp: { medicine: 2 } }, { codex: 'codex_hot_springs' }] },
            fail: { text: `The water is slightly too hot. {crew:medicine} turns a brilliant pink and a shade of dignity. It is still a very nice soak.`, fx: [{ morale: 6 }] } },
          { label: `No time for baths; back to the shuttle`, tag: 'flee', do: { text: `The sign says "FORGET." You forget about it, regrettably. The party boards with sceptical expressions.`, fx: [{ morale: -1 }] } },
        ],
      },
    },
  },
  // ================================================================ ROUND 2: SCAN DISCOVERIES (ctx 'planet')
  {
    id: 'scan_ice_frost_flowers',
    title: 'Flowers Made of Frost',
    tags: ['wonder', 'science'],
    ctx: 'planet',
    weight: 9,
    when: [{ planetType: 'ice' }],
    cooldown: 20,
    art: { scene: 'planet', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `The scan shows fields of fine, branching frost on the night side, blooming on a daily schedule. They are crystal, but they behave like flowers: turning, closing, leaning toward the faint glow of the ship's running lights.`,
        choices: [
          { label: `Take a careful sample`, tag: 'science', check: { skill: 'science', diff: 3 },
            pass: { text: `The drone clips one blossom in its own cold jar. It keeps blooming on the lab bench. {crew:science} names it "Ernestine" and files three papers in a morning.`, fx: [{ xp: { science: 2 } }, { codex: 'codex_frost_flowers' }, { credits: 25 }] },
            fail: { text: `The sample shatters into a thousand pretty fragments. The drone returns festooned with glitter and a faint air of embarrassment. The lab is sweeping for a week.`, fx: [{ morale: -2 }, { supplies: -1 }] } },
          { label: `Record the whole bloom cycle from orbit`, tag: 'wait', do: { text: `You spend a day parked above the terminator, watching the frost open like a slow applause. It costs rations, and it is worth them.`, fx: [{ days: 1 }, { supplies: -1 }, { morale: 6 }, { codex: 'codex_frost_flowers' }] } },
          { label: `Name the field after someone on the crew`, tag: 'persuade', do: { text: `The honour goes to {crew:random}, who pretends to be mortified and then spends the evening drawing a flower on every star chart. Mood improves ship-wide.`, fx: [{ mood: { random: 8 } }, { morale: 4 }] } },
          { label: `Leave it be; flowers aren't ours to pick`, tag: 'diplomacy', do: { text: `The scan stays on file; the flowers stay in their field. By evening the whole crew is a little prouder of itself.`, fx: [{ morale: 3 }] } },
        ],
      },
    },
  },
  {
    id: 'scan_ice_buried_buoy',
    title: 'A Buoy Under the Ice',
    tags: ['mystery', 'science'],
    ctx: 'planet',
    weight: 8,
    when: [{ planetType: 'ice' }],
    once: true,
    art: { scene: 'planet', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `Under three hundred metres of ice, sonar finds a neat cylinder: a survey buoy, antique, its battery faintly alive. A hand-painted stripe runs round it. Someone put it here deliberately, and not recently.`,
        choices: [
          { label: `Melt a shaft down to it (fuel-hungry)`, tag: 'science', check: { skill: 'engineering', diff: 3 },
            pass: { text: `A bright, steaming shaft; a drone with a clamp. Inside the buoy: charts of a hidden waystation, and a note thanking whoever dug. Your chart blooms with new lanes.`, fx: [{ fuel: -1 }, { reveal: { radius: 3 } }, { cargo: { star_charts: 1 } }, { xp: { engineering: 2 } }] },
            fail: { text: `The shaft refreezes around the drone, which must be abandoned with a short ceremony. The buoy stays buried. Fuel, spent warming a hole in a glacier, does not come back.`, fx: [{ fuel: -3 }, { morale: -2 }] } },
          { label: `Ping it politely and ask for its logs`, tag: 'persuade', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `The buoy answers in a crackly, old-fashioned handshake and coughs up its logs. A name, a date, and a lane the surveyors loved. It asks, quietly, to be left where it is.`, fx: [{ reveal: { radius: 2 } }, { codex: 'codex_old_buoys' }] },
            fail: { text: `The buoy keeps its counsel. It returns your ping with a rhythm that, translated, means "no, thank you". You respect that and log its position.`, fx: [{ morale: 1 }] } },
          { label: `Log its position and move on`, tag: 'wait', do: { text: `Marked on the chart with a small felt-tip cross. Some future surveyor may find a use for it, or a friend.`, fx: [{ codex: 'codex_old_buoys' }] } },
        ],
      },
    },
  },
  {
    id: 'scan_lava_glass_rivers',
    title: 'Rivers of Glass',
    tags: ['wonder', 'trade', 'hazard'],
    ctx: 'planet',
    weight: 9,
    when: [{ planetType: 'lava' }],
    cooldown: 20,
    art: { scene: 'planet', species: 'unknown', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `The lava here cools into rivers of translucent glass, ruby and gold, that ring faintly when the wind passes over them. A drone could skim a few kilos off the cooling edge. The edge, naturally, is where the weather lives.`,
        choices: [
          { label: `Skim the cooling edge with a drone`, tag: 'flee', check: { skill: 'piloting', diff: 3 },
            pass: { text: `A hair-raising pass, a clean scoop, a perfect crate of ruby glass. The curio traders will weep with joy.`, fx: [{ cargo: { curios: 2 } }, { xp: { piloting: 2 } }, { codex: 'codex_lava_glass' }] },
            fail: { text: `The thermal updraft plays pinball with the drone. It returns blackened, intact and ashamed. The sensor array needs cleaning, and the cleaning is not pleasant.`, fx: [{ hull: -4 }, { morale: -1 }] } },
          { label: `Model the cooling and pick a safer spot`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `{crew:science} finds a stable glass terrace at the river's mouth. Collection is gentle, the haul modest, and the lab learns how to make the colour on purpose.`, fx: [{ cargo: { curios: 1 } }, { xp: { science: 2 } }, { codex: 'codex_lava_glass' }] },
            fail: { text: `The model is correct but a day late. By the time the terrace is safe, it has cracked into confetti. Pretty. Unsellable.`, fx: [{ days: 1 }] } },
          { label: `Just listen to the glass sing`, tag: 'wait', do: { text: `The speakers pick up a low, slow bell-tone that rises and falls with the wind. You play it back in the lounge all evening.`, fx: [{ morale: 5 }, { codex: 'codex_lava_glass' }] } },
        ],
      },
    },
  },
  {
    id: 'scan_desert_sand_writing',
    title: 'Writing in the Dunes',
    tags: ['mystery', 'wonder'],
    ctx: 'planet',
    weight: 9,
    when: [{ planetType: 'desert' }],
    cooldown: 20,
    art: { scene: 'planet', species: 'unknown', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `From orbit, the dunes form long curving lines, and for a moment every sensor agrees they are letters. Wind, or a hand? {crew:science} squints at the image and says, with great restraint, "It says something. I just don't know what."`,
        choices: [
          { label: `Try to read it with the translator`, tag: 'persuade', check: { skill: 'diplomacy', diff: 3 },
            pass: { text: `Not words but a map: a spiral of dunes pointing at a distant oasis, with a notation for "friends welcome". The chart gains a neighbouring system, and the crew gains a story.`, fx: [{ reveal: { radius: 3 } }, { codex: 'codex_dune_script' }, { morale: 4 }] },
            fail: { text: `The translator offers "ripples", "slowly", and "a small fish". The poetry is unintentional but real. It ends up on the lounge wall.`, fx: [{ morale: 3 }] } },
          { label: `Model the wind patterns`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `The wind is writing the dunes in slow, patient cycles of seven years. It is nature, and also, somehow, composition. The paper writes itself.`, fx: [{ xp: { science: 2 } }, { codex: 'codex_dune_script' }] },
            fail: { text: `The model suggests the dunes are random. The dunes, offended, rearrange themselves slightly in the next frame.`, fx: [{ morale: 1 }] } },
          { label: `Add a line of your own with the thrusters`, tag: 'flee', rand: [
            [2, { text: `A low pass leaves a graceful arc: "HALCYON WAS HERE". Weeks later, a passing trader sends a photograph of the dunes answering in kind.`, fx: [{ morale: 6 }, { rep: { quillari: 1 } }] }],
            [1, { text: `The thrusters kick up a dust cloud the size of a county. The nav screens clog. Cleaning the intakes costs a day and a surprising quantity of tea.`, fx: [{ days: 1 }, { supplies: -1 }] }],
          ] },
        ],
      },
    },
  },
  {
    id: 'scan_desert_glass_fields',
    title: 'The Glass Fields',
    tags: ['hazard', 'science', 'trade'],
    ctx: 'planet',
    weight: 8,
    when: [{ planetType: 'desert' }],
    cooldown: 25,
    art: { scene: 'planet', species: 'unknown', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `Miles of sand have been fused into mirror-smooth plains, glittering like a spilled jewellery box. Heat shimmers. Something under the glass is faintly warm: a buried power core, or a very patient oven.`,
        choices: [
          { label: `Probe the warm patch (upgraded sweep array)`, tag: 'science', if: [{ upgrade: 'sweep_array' }],
            do: { text: `The sweep array draws a clean map beneath the glass: a buried habitat, empty, intact. A salvage claim pays out at the next trade post, and the archive wants the coordinates.`, fx: [{ credits: 90 }, { reveal: { radius: 2 } }, { codex: 'codex_glass_fields' }] } },
          { label: `Drill a test core`, tag: 'science', check: { skill: 'engineering', diff: 3 },
            pass: { text: `The core comes up warm and humming. A buried hydro-cell, still full. {crew:engineering} siphons a few units into the ship's reserve before saying goodbye.`, fx: [{ fuel: 2 }, { xp: { engineering: 2 } }, { codex: 'codex_glass_fields' }] },
            fail: { text: `The drill skates uselessly across the glass and snaps. A heated sliver pings off the hull; a scorched hand, a bruised ego.`, fx: [{ hull: -3 }, { morale: -2 }] } },
          { label: `Admire the mirrors and leave`, tag: 'wait', do: { text: `The sunrise bounces from horizon to horizon, and for ten minutes the whole sky is on fire. Nobody tells anyone what they saw.`, fx: [{ morale: 4 }, { codex: 'codex_glass_fields' }] } },
        ],
      },
    },
  },
  {
    id: 'scan_ocean_whale_song',
    title: 'Song from the Deep',
    tags: ['wonder', 'diplomacy'],
    ctx: 'planet',
    weight: 9,
    when: [{ planetType: 'ocean' }],
    cooldown: 20,
    art: { scene: 'planet', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `The hydrophones pick up a song four hundred kilometres long: slow, enormous, sad and happy by turns. Something very large is singing to something very far away. The ship's speakers rattle gently with every low note.`,
        choices: [
          { label: `Answer with a long low hum`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 },
            pass: { text: `The song falters, then swells. It is a reply, in a language older than words. Tears all round on the bridge. A hundred dolphin-shapes break the surface to wave.`, fx: [{ morale: 10 }, { rep: { drifters: 1 } }, { codex: 'codex_deep_singers' }] },
            fail: { text: `Your hum is a semitone flat. The song pauses, kindly, and sings your note back correctly, as a lesson. {crew:random} goes red to the ears.`, fx: [{ morale: 3 }, { codex: 'codex_deep_singers' }] } },
          { label: `Record the full song for the codex`, tag: 'science', do: { text: `The recording runs for six hours. By the end the engineers are humming along without noticing. The Meridian Society will want a copy.`, fx: [{ days: 1 }, { morale: 5 }, { xp: { science: 1 } }, { codex: 'codex_deep_singers' }] } },
          { label: `Play the pulsar tape back at them`, tag: 'persuade', if: [{ item: 'pulsar_tape' }],
            do: { text: `A very long silence. Then the deep takes up the pulsar's rhythm and sings a counter-melody that gives the lounge goosebumps. An old friend of the sky, recognised by an old friend of the sea.`, fx: [{ morale: 12 }, { reveal: { radius: 2 } }, { codex: 'codex_deep_singers' }] } },
          { label: `Leave them to it`, tag: 'wait', do: { text: `It seems right to let a song be a song. You turn the speakers off. The silence afterwards is very full.`, fx: [{ morale: 2 }] } },
        ],
      },
    },
  },
  {
    id: 'scan_jungle_canopy_lights',
    title: 'Lights in the Canopy',
    tags: ['wonder', 'science'],
    ctx: 'planet',
    weight: 9,
    when: [{ planetType: 'jungle' }],
    cooldown: 20,
    art: { scene: 'planet', species: 'unknown', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `At dusk, the canopy lights up: millions of cold green and violet sparks, blinking in a slow wave that sweeps the whole continent. It is either fungus, firefly or a very large conversation. The sensors cannot decide.`,
        choices: [
          { label: `Sample the glow-moss for the galley`, tag: 'science', check: { skill: 'medicine', diff: 2 },
            pass: { text: `{crew:medicine} certifies it edible, mildly sweet, and faintly glowing. Gus-7 turns it into a pudding that lights up the lounge. Supplies swell and spirits follow.`, fx: [{ supplies: 3 }, { xp: { medicine: 2 } }, { codex: 'codex_canopy_lights' }] },
            fail: { text: `The moss is edible. It is also, the medic notes, a gentle laxative. The following day is long and mortifying for the galley.`, fx: [{ morale: -3 }, { supplies: -1 }] } },
          { label: `Blink the running lights back in sequence`, tag: 'persuade', rand: [
            [2, { text: `The wave stutters, then curves, folding around the ship's pattern like a school of fish. For five glorious minutes, the continent is dancing with you.`, fx: [{ morale: 8 }, { codex: 'codex_canopy_lights' }] }],
            [1, { text: `You blink too fast. The canopy goes dark, with what seems like polite alarm, and does not reply for hours.`, fx: [{ morale: -1 }] }],
          ] },
          { label: `Name the wave after the ship's cat`, tag: 'wait', do: { text: `It is hard to say whether there is a cat aboard. It is harder still to prove otherwise. The Halcyon Wave appears on the chart in felt-tip.`, fx: [{ morale: 4 }, { codex: 'codex_canopy_lights' }] } },
        ],
      },
    },
  },
  {
    id: 'scan_terran_old_orchard',
    title: 'The Orchard Nobody Left',
    tags: ['mystery', 'relief'],
    ctx: 'planet',
    weight: 9,
    when: [{ planetType: 'terran' }],
    cooldown: 25,
    art: { scene: 'planet', species: 'robot', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `Neat rows of fruit trees, ruled to the horizon, and small tractors pottering between them. The farm has no farmers. The tractors are still faithfully pruning, watering and filing reports to a settlement that is no longer there.`,
        choices: [
          { label: `Hail the tractors`, tag: 'diplomacy', do: { text: `A bright, hopeful reply: "WELCOME. THE HARVEST IS READY. NO ONE HAS COME. WILL YOU TAKE SOME?" Your heart lurches, a little. You say yes.`, goto: 'b' } },
          { label: `Scan for the settlers`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `No remains, no distress. The orchard was packed up neatly, a long time ago, and the settlers moved on in good order. A note in the tractors' memory says only "gone to the Lanterns".`, fx: [{ xp: { science: 1 } }, { flag: 'lantern_hint' }], goto: 'b' },
            fail: { text: `The scan finds nothing. The tractors chirp, mildly offended, that the settlers are very much on holiday.`, goto: 'b' } },
          { label: `Skip it; it feels private`, tag: 'flee', do: { text: `Perhaps right, perhaps wrong. The tractors dutifully log your departure: "VISITOR, POLITE." It is the warmest report you have ever received.`, fx: [{ morale: 1 }] } },
        ],
      },
      b: {
        text: `A crate of apples is rolled out, polished to a shine. The lead tractor tilts its sensor. "WE HAVE NOT TASTED THEM. THEY ARE FOR THE ONES WHO COME BACK." It seems to be asking you, formally, to stay for one.`,
        choices: [
          { label: `Share an apple with the tractors' blessing`, tag: 'diplomacy', do: { text: `The apple is crisp and bright, like a clean sheet. The tractors record the moment with real joy. A box of apples is sent aboard, and the crew will talk about them for days.`, fx: [{ supplies: 4 }, { morale: 8 }, { flag: 'orchard_friend' }, { codex: 'codex_orchard_tractors' }] } },
          { label: `Offer to take over the pruning schedule`, tag: 'science', check: { skill: 'engineering', diff: 2 },
            pass: { text: `{crew:engineering} writes a gentler schedule and fixes a wheel or two. The tractors thank you in an unwieldy chorus and send aboard a full crate and the orchard's blessing.`, fx: [{ supplies: 4 }, { xp: { engineering: 2 } }, { flag: 'orchard_friend' }, { codex: 'codex_orchard_tractors' }] },
            fail: { text: `A misplaced bolt jams a tractor. It sighs, mechanically, and gets by. You leave with half the crate and a lingering sense of awkwardness.`, fx: [{ supplies: 2 }, { flag: 'orchard_friend' }] } },
        ],
      },
    },
  },
  {
    id: 'scan_terran_radio_town',
    title: 'The Hobbyists of Hollowell',
    tags: ['comedy', 'trade', 'diplomacy'],
    ctx: 'planet',
    weight: 8,
    when: [{ planetType: 'terran' }],
    cooldown: 25,
    art: { scene: 'planet', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Mayor Posy Hallett', species: 'human' },
        text: `Static, then a bright voice: "Unknown vessel, this is Hollowell Community Radio, home of the Tuesday swap meet! We've no idea who you are and we love you already. Do you collect anything? We trade at a fair, friendly rate."`,
        choices: [
          { label: `Trade star-charts for local preserves`, tag: 'trade', if: [{ cargo: { star_charts: 1 } }],
            do: { text: `A cheerful haggle over three jars of plum jam and a thermos of something cinnamon. The mayor sends a drone with the order and an extra jar "because it's Tuesday".`, fx: [{ cargo: { star_charts: -1 } }, { supplies: 4 }, { credits: 20 }, { rep: { concord: 2 } }] } },
          { label: `Ask what they collect`, tag: 'diplomacy', do: { text: `Teaspoons, mostly. Also, annoyingly, ship's bells. They'd be delighted to swap a bag of seedlings for a spare spoon. You find one in the galley and are thanked three times.`, fx: [{ supplies: 3 }, { morale: 4 }, { rep: { concord: 2 } }, { codex: 'codex_hollowell' }] } },
          { label: `Broadcast a greeting and move on`, tag: 'wait', do: { text: `"Splendid!" says the mayor. "Come back for the swap meet." The crew hums a Hollowell jingle for two days.`, fx: [{ morale: 3 }] } },
        ],
      },
    },
  },
  {
    id: 'scan_barren_crater_letters',
    title: 'Crater Letters',
    tags: ['mystery', 'comedy'],
    ctx: 'planet',
    weight: 8,
    when: [{ planetType: 'barren' }],
    cooldown: 25,
    art: { scene: 'planet', species: 'unknown', palette: 'dusk' },
    start: 'a',
    nodes: {
      a: {
        text: `Five craters line up on a plain, in the unmistakable shape of the letters H-E-L-L-O. It is a coincidence. It is surely a coincidence. {crew:science} leans in on the screen and mutters, with real suspicion, "It's a very neat coincidence."`,
        choices: [
          { label: `Run the geology report`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `A chain of meteor impacts in a stable orbit, a one-in-a-million fluke. {crew:science} writes it up, the maths is lovely, and the paper title is "Hello, Possibly".`, fx: [{ xp: { science: 2 } }, { codex: 'codex_crater_letters' }] },
            fail: { text: `The report is inconclusive. It suggests, in small print, that the universe has a sense of humour. Nobody argues.`, fx: [{ morale: 2 }] } },
          { label: `Answer "hello" on a low-power beam`, tag: 'persuade', rand: [
            [1, { text: `Nothing answers. For an hour. Then a faint, charming blip comes from the third crater, a repeating pulse that is probably a stray cosmic ray. Probably.`, fx: [{ morale: 5 }, { codex: 'codex_crater_letters' }] }],
            [2, { text: `Nothing answers. The silence is companionable. You feel a little bit silly and a little bit warm.`, fx: [{ morale: 2 }] }],
          ] },
          { label: `Name the plain "Hello Plains" on the chart`, tag: 'wait', do: { text: `The name sticks, and the survey office, which approves of tidy names, never questions it. A small immortality for a coincidence.`, fx: [{ morale: 3 }, { codex: 'codex_crater_letters' }] } },
        ],
      },
    },
  },
  {
    id: 'scan_ore_prospect',
    title: 'A Fair Claim',
    tags: ['trade', 'hazard'],
    ctx: 'planet',
    weight: 9,
    when: [{ feature: 'ore' }],
    cooldown: 20,
    art: { scene: 'asteroids', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `The scan lights up with veins of nickel-iron and a seam of something sweeter: rare-earth shot with silver. A prospector's marker sits on the ridge, bleached by time. The claim lapsed years ago, but the paperwork is still pinned to a rock.`,
        choices: [
          { label: `File a proper claim with the nearest station`, tag: 'trade', if: [{ credits: 30 }],
            do: { text: `A filing fee, a sealed form, a cheerful clerk. The claim sells to a mining co-op at the next stop for a tidy profit, and your name is on the deed in permanent ink.`, fx: [{ credits: -30 }, { credits: 140 }, { rep: { drifters: 2 } }, { codex: 'codex_ore_claims' }] } },
          { label: `Drill a quick test shaft`, tag: 'science', check: { skill: 'engineering', diff: 3 },
            pass: { text: `A clean core of silver-streaked rock. {crew:engineering} bundles it into the hold: machine parts, mostly, with a glimmer of quiet profit.`, fx: [{ cargo: { machine_parts: 3 } }, { xp: { engineering: 2 } }, { codex: 'codex_ore_claims' }] },
            fail: { text: `The ridge collapses politely, burying the drill. The hole remains, the drill doesn't. A bad day, and a bad bill.`, fx: [{ hull: -3 }, { credits: -25 }] } },
          { label: `Leave the marker and a note`, tag: 'diplomacy', do: { text: `A note on the marker: "Seen. Thank you. - ISV Halcyon." Whoever staked this claim may come back and smile at it.`, fx: [{ rep: { drifters: 2 } }, { morale: 2 }] } },
        ],
      },
    },
  },
  {
    id: 'scan_crystal_bloom',
    title: 'The Resonant Bloom',
    tags: ['wonder', 'diplomacy'],
    ctx: 'planet',
    weight: 9,
    when: [{ planetType: 'crystal' }],
    cooldown: 20,
    art: { scene: 'planet', species: 'vesperine', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `A hillside of crystal is slowly opening like a flower, each facet lifting to catch the starlight. It hums as it goes, a rising chord that the comm array translates as "pardon our blossoming". Vesperine gardeners dot the slope with polite concern.`,
        choices: [
          { label: `Offer to hold the harmonics steady (translator parrot)`, tag: 'diplomacy', if: [{ upgrade: 'translator_parrot' }],
            do: { text: `The parrot trills the right chord just as the bloom peaks. The gardeners weep in unison, and the hillside rings out. They press a tray of tuning crystals into your care.`, fx: [{ cargo: { tuning_crystals: 3 } }, { rep: { vesperine: 5 } }, { codex: 'codex_crystal_bloom' }] } },
          { label: `Hum the third, softly`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 },
            pass: { text: `A perfect third. The bloom opens one shade further. A tuning crystal drops from a branch, polished by the sun, into the sample drawer.`, fx: [{ cargo: { tuning_crystals: 1 } }, { rep: { vesperine: 3 } }, { codex: 'codex_crystal_bloom' }] },
            fail: { text: `A wobble in the hum and the nearest facet shudders. The gardeners smile with great effort. The bloom takes an hour to recover.`, fx: [{ rep: { vesperine: -1 } }, { morale: -1 }] } },
          { label: `Watch in silence`, tag: 'wait', do: { text: `The bloom completes. The chord fades into a sustained peace. You feel the hull vibrate faintly in sympathy, and then, like all good things, it ends.`, fx: [{ morale: 6 }, { codex: 'codex_crystal_bloom' }] } },
        ],
      },
    },
  },
  {
    id: 'scan_toxic_acid_rain_concert',
    title: 'Rain on the Hull',
    tags: ['hazard', 'comedy'],
    ctx: 'planet',
    weight: 8,
    when: [{ planetType: 'toxic' }],
    cooldown: 20,
    art: { scene: 'planet', species: 'unknown', palette: 'dusk' },
    start: 'a',
    nodes: {
      a: {
        text: `The upper atmosphere rains down in glittering green sleet, pinging the hull in a surprisingly musical rhythm. It is also, the sensors helpfully add, mildly corrosive. The hull sings. The paint complains.`,
        choices: [
          { label: `Hold orbit and let the hull ring`, tag: 'wait', do: { text: `The concert lasts an hour: glockenspiel, rain-drum and a long mournful trombone of a sound from the aft plates. Afterwards, the engineer sends a polite maintenance bill.`, fx: [{ morale: 6 }, { hull: -3 }, { codex: 'codex_acid_rain' }] } },
          { label: `Lay down a protective sheet (dust shield lattice)`, tag: 'science', if: [{ upgrade: 'dust_shield_lattice' }],
            do: { text: `The lattice hums and the sleet bounces from it in a bright halo. The concert is lovely, the hull untouched, the crew smug beyond measure.`, fx: [{ morale: 8 }, { codex: 'codex_acid_rain' }] } },
          { label: `Dive in for a closer recording`, tag: 'flee', check: { skill: 'piloting', diff: 3 },
            pass: { text: `A skilful skim of the cloud deck. The recording is splendid, and the hull sees only a light etching. It makes excellent bridge background.`, fx: [{ morale: 6 }, { xp: { piloting: 2 } }, { codex: 'codex_acid_rain' }] },
            fail: { text: `The sleet thickens. The hull pocks with tiny scars; the antenna tip dissolves. The recording is, regrettably, mostly alarms.`, fx: [{ hull: -7 }, { morale: -2 }] } },
        ],
      },
    },
  },
  {
    id: 'scan_gas_floating_gardens',
    title: 'Gardens on the Wind',
    tags: ['wonder', 'trade'],
    ctx: 'planet',
    weight: 9,
    when: [{ planetType: 'gas' }],
    cooldown: 20,
    art: { scene: 'planet', species: 'drifter', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Gardener Tobiah Winn', species: 'drifter' },
        text: `Tethered rafts of green drift in a calm band of cloud: a drifter floating garden, tended by a handful of weathered gardeners. "Visitors! Oh good. We've a surplus of beans and a deficit of conversation. Come down. Mind the wind."`,
        choices: [
          { label: `Drop by with a small shuttle`, tag: 'diplomacy', check: { skill: 'piloting', diff: 3 },
            pass: { text: `A clean landing on a raft the size of a tablecloth. Tea, beans, gossip. You leave with a sack of produce and the news from three bands north.`, fx: [{ supplies: 4 }, { rep: { drifters: 3 } }, { reveal: { radius: 2 } }, { codex: 'codex_floating_gardens' }] },
            fail: { text: `The shuttle skids on the raft. A bean-vine is mangled; a gardener laughs. You pay for the vine in scrip and pride, and still leave with beans.`, fx: [{ credits: -20 }, { supplies: 2 }, { rep: { drifters: 1 } }] } },
          { label: `Trade tuning crystals for seedlings`, tag: 'trade', if: [{ cargo: { tuning_crystals: 1 } }],
            do: { text: `The garden hums when a crystal is clipped to the trellis: beans grow faster. Tobiah gives you seedlings, a bag of seed and a long, delighted speech.`, fx: [{ cargo: { tuning_crystals: -1 } }, { supplies: 5 }, { rep: { drifters: 4 } }, { codex: 'codex_floating_gardens' }] } },
          { label: `Wave and keep the orbit`, tag: 'wait', do: { text: `A hand-sewn flag is run up on the nearest raft: WELCOME ANYWAY. You wave back, feeling slightly short of manners and long on regret.`, fx: [{ morale: 1 }] } },
        ],
      },
    },
  },
  {
    id: 'scan_ringed_ring_ice',
    title: 'Cold Tea from the Rings',
    tags: ['science', 'hazard'],
    ctx: 'planet',
    weight: 8,
    when: [{ ringed: true }],
    cooldown: 20,
    art: { scene: 'planet', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `The rings are mostly pure water ice, shining like a freshly polished teapot. A shuttle could scoop a tank-load in an afternoon, if it kept clear of the denser clumps. The clumps, you note, are moving with purpose.`,
        choices: [
          { label: `Scoop carefully with the shuttle`, tag: 'flee', check: { skill: 'piloting', diff: 3 },
            pass: { text: `A neat figure-eight through the lanes. The tank fills with clean ice, enough for months of tea and a decent splash of reaction mass.`, fx: [{ supplies: 3 }, { fuel: 1 }, { xp: { piloting: 2 } }] },
            fail: { text: `A fist-sized ice clump clips the shuttle. The scoop jams; the party limps back with half a tank and all of a headache.`, fx: [{ hull: -5 }, { supplies: 1 }] } },
          { label: `Send the lab drone for a spectral sample`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `The ring ice carries trace organics, faint and ancient. A footnote for the codex and a fine addition to Meridian's collection.`, fx: [{ xp: { science: 2 } }, { codex: 'codex_ring_ice' }, { credits: 30 }] },
            fail: { text: `The drone returns with a sample jar of slush. It is a perfectly good slush. It does not contain a discovery.`, fx: [{ morale: 1 }] } },
          { label: `Sit and watch the rings turn`, tag: 'wait', do: { text: `The tea is made from ship's stores; the rings turn, indifferent and glittering. A quiet, expensive hour of tea.`, fx: [{ supplies: -1 }, { morale: 5 }, { codex: 'codex_ring_ice' }] } },
        ],
      },
    },
  },
  {
    id: 'scan_ruins_survey_stakes',
    title: 'Survey Stakes, Very Old',
    tags: ['mystery', 'diplomacy'],
    ctx: 'planet',
    weight: 8,
    when: [{ feature: 'ruins' }],
    once: true,
    art: { scene: 'ruins', species: 'archivist', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `Among the ruins the scanner finds a grid of fine brass stakes, each topped with a numbered tag. It is a survey. Someone laid out the whole site with ruler and plumb-line, and then politely left. Each tag reads, in Archive script: "pending."`,
        choices: [
          { label: `Read the survey notes in the Archive script`, tag: 'persuade', check: { skill: 'diplomacy', diff: 3 },
            pass: { text: `The notes are a request to the future: "If anyone finishes this, please cite us." You promise to, aloud. A faint ping of approval arrives from the nearest Archive relay.`, fx: [{ rep: { archivists: 4 } }, { flag: 'archive_survey_promise' }, { codex: 'codex_survey_stakes' }] },
            fail: { text: `The script is dense. You get the gist: "pending," "not yet," "please." The rest is a puzzle for a better librarian.`, fx: [{ rep: { archivists: 1 } }, { codex: 'codex_survey_stakes' }] } },
          { label: `Complete one grid square with the survey kit`, tag: 'science', check: { skill: 'science', diff: 3 },
            pass: { text: `A day of careful measurement and a handsome little map. The stake's tag flips from "pending" to "complete" on its own, with a click.`, fx: [{ days: 1 }, { xp: { science: 2 } }, { rep: { archivists: 3 } }, { chart: true }] },
            fail: { text: `The grid fights you. By the end of the day you are tangled in twine and apology. The tag stays "pending," unamused.`, fx: [{ days: 1 }, { supplies: -1 }] } },
          { label: `Leave the stakes undisturbed`, tag: 'wait', do: { text: `Some things are somebody's unfinished sentence. You leave the stakes untouched, and a small card of thanks.`, fx: [{ rep: { archivists: 1 } }] } },
        ],
      },
    },
  },
  {
    id: 'scan_aurora_fields_overflight',
    title: 'Fields of Auroral Light',
    tags: ['wonder', 'science'],
    ctx: 'planet',
    weight: 8,
    when: [{ feature: 'aurora_fields' }],
    cooldown: 20,
    art: { scene: 'aurora', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `The planet's poles are crowned with ribbon-lights, brighter than any you have logged. They curl in slow spirals, and the magnetometer reports something wonderful and a little worrying: a gentle, steady pulse, like a heartbeat, that matches your own.`,
        choices: [
          { label: `Tune a sensor to the pulse`, tag: 'science', check: { skill: 'science', diff: 3 },
            pass: { text: `The sensor sings along. The planet's field has been breathing at the same rate as every human on board. {crew:science} stares, pleased and pale. No explanation yet. Charming.`, fx: [{ xp: { science: 2 } }, { codex: 'codex_aurora_fields' }, { reveal: { radius: 2 } }] },
            fail: { text: `The sensor loses the pulse. The heartbeat fades and, with it, a small sense of wonder. The reading stays blurry.`, fx: [{ morale: 1 }] } },
          { label: `Fly the pole at low altitude`, tag: 'flee', check: { skill: 'piloting', diff: 4 },
            pass: { text: `The ship glides through a curtain of green fire, its hull lit from within. Everybody on the bridge is pink and quiet. Morale climbs, and a few instruments reset to better than before.`, fx: [{ morale: 10 }, { xp: { piloting: 2 } }] },
            fail: { text: `The field grabs the ship's compass and spins it. A rough ten minutes; the hull sheds a few panels, the pilot a few years.`, fx: [{ hull: -6 }, { fuel: -1 }] } },
          { label: `Orbit and watch the show`, tag: 'wait', do: { text: `Tea by the viewscreen. The lights pulse. Somebody puts on a record. It is a very good evening.`, fx: [{ morale: 6 }, { codex: 'codex_aurora_fields' }] } },
        ],
      },
    },
  },
  {
    id: 'scan_barren_dust_postcards',
    title: 'Postcards in the Dust',
    tags: ['mystery', 'relief'],
    ctx: 'planet',
    weight: 7,
    when: [{ planetType: 'barren' }],
    cooldown: 30,
    art: { scene: 'planet', species: 'robot', palette: 'dusk' },
    start: 'a',
    nodes: {
      a: {
        text: `On a dead plain, a ring of tiny solar mirrors faces the sky, each tilted to flash a single bright pulse at the ship. Someone, or something, has set them up to say "hello" to any traveller who happens by. The pulses repeat every ninety seconds.`,
        choices: [
          { label: `Flash back with the running lights`, tag: 'diplomacy', do: { text: `The mirrors flash twice, quick, as if clapping. Then one tilts to throw a tiny pinpoint of light across the plain, like a signpost, toward a ridge on the horizon.`, fx: [{ morale: 4 }, { reveal: { radius: 2 } }] } },
          { label: `Send a drone to look`, tag: 'science', check: { skill: 'engineering', diff: 2 },
            pass: { text: `The mirrors are driven by tiny solar-powered clockwork, lovingly built and cleaned. At the centre: a battered postcard rack, full of hand-lettered cards from a hundred travellers. You add your own.`, fx: [{ xp: { engineering: 2 } }, { morale: 6 }, { codex: 'codex_dust_postcards' }] },
            fail: { text: `The drone trips on its own tether, and the mirrors dim, apologetic. The postcard rack is out of reach. You wave goodbye at the next flash.`, fx: [{ morale: 1 }] } },
          { label: `Dim lights, sit with it a minute`, tag: 'wait', do: { text: `The pulses come and go, tiny and brave. You think, briefly, about who set them up, and why, and for whom. It is a comfortable thing to wonder.`, fx: [{ morale: 3 }, { codex: 'codex_dust_postcards' }] } },
        ],
      },
    },
  },

  // ================================================================ ROUND 2: LANDING CHAINS
  {
    id: 'archive_heart_ledger',
    title: 'The Fellowship Ledger',
    tags: ['mystery', 'diplomacy', 'wonder'],
    ctx: 'landing',
    weight: 60,
    when: [{ system: { story: 'archive_heart' } }, { feature: 'ruins' }, { notFlag: 'fellowship_known' }],
    art: { scene: 'ruins', species: 'archivist', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Vault-Warden Quill-Nine', species: 'archivist' },
        text: `The Heart Vault is a single round room, cool and tidy, with one book on a plinth: the Fellowship Ledger. A small archivist hovers beside it. "It has never been opened, because no one asked correctly. Would you care to attempt it? We are all terribly curious."`,
        choices: [
          { label: `Ask formally, in the old Archive phrasing`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 },
            pass: { text: `"If it is not an imposition, and with the Ledger's consent." The cover lifts one polite centimetre on its own. Quill-Nine makes a sound like a kettle trying not to cry.`, fx: [{ rep: { archivists: 3 } }], goto: 'c' },
            fail: { text: `Your phrasing is nearly right, and that is the problem. The Ledger stays shut, but a small slip of paper rises from the plinth: "Almost. Try asking it what it would like."`, goto: 'b' } },
          { label: `Show your Archive reader card`, tag: 'trade', if: [{ item: 'archive_reader_card' }],
            do: { text: `Quill-Nine inspects the card for a very long time. "Due date: acceptable." The Ledger's cover lifts a centimetre, in what looks like a bow. The room feels warmer.`, fx: [{ rep: { archivists: 2 } }], goto: 'c' } },
          { label: `Present your Ask-Nicely token`, tag: 'persuade', if: [{ item: 'door_token' }],
            do: { text: `The token clicks into a socket you hadn't noticed. The plinth rotates; the Ledger opens itself like a flower. "Oh," whispers Quill-Nine. "It likes you."`, fx: [{ rep: { archivists: 3 } }], goto: 'c' } },
          { label: `Ask the Ledger what it would like`, tag: 'diplomacy', do: { text: `A long pause. Then a page turns, and a line of faint script appears: "To be read by someone who will read it aloud." Quill-Nine nods, wide-eyed. Everyone straightens up.`, goto: 'c' } },
        ],
      },
      b: {
        speaker: { name: 'Vault-Warden Quill-Nine', species: 'archivist' },
        text: `Quill-Nine wrings its manipulators. "Perhaps with tea? The Ledger has always been fond of tea. Or perhaps you could simply wait, with the proper patience. It is, I think, only shy."`,
        choices: [
          { label: `Wait with them, quietly, for an hour`, tag: 'wait', do: { text: `The hour passes in a quiet like warm water. At the end, the cover lifts by a centimetre, then two. "Oh, thank you," breathes Quill-Nine. "Thank you."`, fx: [{ days: 1 }, { rep: { archivists: 3 } }, { morale: 2 }], goto: 'c' } },
          { label: `Offer a tin of Meridian tea`, tag: 'trade', if: [{ item: 'tea_tin' }],
            do: { text: `The tin is placed on the plinth. The Ledger stirs. Pages rustle in what is unmistakably an appreciative sigh. The cover rises. A good librarian knows a bribe from a courtesy.`, fx: [{ item: { tea_tin: -1 } }, { rep: { archivists: 4 } }], goto: 'c' } },
        ],
      },
      c: {
        text: `The Ledger opens at a page of names in many hands, human, Quillari, Vesperine, Drifter, Archivist, in rows. Beneath them a single line: "We lit the Lanterns for those who would follow. We were the Open Sky Fellowship." Quill-Nine reads it aloud, shakily.`,
        choices: [
          { label: `Read every page aloud, as asked`, tag: 'persuade', do: { text: `It takes the afternoon. By evening the Vault is full of voices, yours, the crew's, Quill-Nine's, reading old names into new air. The Ledger's last page lists a fourth Lantern, ticking beside a neutron star.`, fx: [{ days: 1 }, { flag: 'fellowship_known' }, { codex: 'open_sky_fellowship' }, { rep: { archivists: 6 } }, { reveal: { radius: 5 } }, { morale: 8 }], goto: 'd' } },
          { label: `Copy the names and the star-chart`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `{crew:science} transcribes every name and the final chart in one sitting. The Ledger sits quietly, pleased. The fourth Lantern's coordinates glow on your slate.`, fx: [{ flag: 'fellowship_known' }, { codex: 'open_sky_fellowship' }, { xp: { science: 2 } }, { rep: { archivists: 4 } }, { reveal: { radius: 5 } }], goto: 'd' },
            fail: { text: `Your transcription is a few names short. Quill-Nine fills the gaps from memory, humming. The Ledger is read with permission, and well enough.`, fx: [{ flag: 'fellowship_known' }, { codex: 'open_sky_fellowship' }, { rep: { archivists: 3 } }, { reveal: { radius: 3 } }], goto: 'd' } },
        ],
      },
      d: {
        speaker: { name: 'Vault-Warden Quill-Nine', species: 'archivist' },
        text: `"The Ledger asks that you carry its name outward," says Quill-Nine, handing you a small brass token engraved with a spiral. "It is not a command. It is a courtesy. We have kept this for so long. Thank you for asking."`,
        choices: [
          { label: `Accept the token and promise to bring it back`, tag: 'diplomacy', do: { text: `The token is warm and slightly heavier than it looks. Somewhere deep in the Archive, a bell rings once. It is the happiest sound you have heard in the vault.`, fx: [{ item: { fellowship_token: 1 } }, { morale: 8 }, { rep: { archivists: 3 } }] } },
          { label: `Ask Quill-Nine to keep it safe for now`, tag: 'wait', do: { text: `Quill-Nine tucks it into the plinth with great ceremony. "We shall keep it for whoever follows. Go well, Captain."`, fx: [{ morale: 5 }, { rep: { archivists: 4 } }] } },
        ],
      },
    },
  },
  {
    id: 'landing_sandship_graveyard',
    title: 'The Sandship Graveyard',
    tags: ['mystery', 'hazard', 'wonder'],
    ctx: 'landing',
    weight: 9,
    when: [{ planetType: 'desert' }, { notFlag: 'sandship_restored' }],
    cooldown: 30,
    art: { scene: 'ruins', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `A dry sea-bed, crowded with hulls: wheeled sand-schooners, masts snapped, sails bleached to parchment. They look like they were all moored at once in the last of the water and then simply left. One of them has a tea-kettle still on the stove.`,
        choices: [
          { label: `Explore the flagship`, tag: 'science', do: { text: `The flagship's cabin is intact: charts, a brass compass, a hammock. The captain's journal lies open on the table, the ink faded to rust.`, goto: 'b' } },
          { label: `Salvage rigging and canvas`, tag: 'trade', check: { skill: 'engineering', diff: 2 },
            pass: { text: `A careful hour, a good haul: sail-cloth that mends like new and a coil of sound cable. The hull's patch kit gets a boost.`, fx: [{ hull: 6 }, { cargo: { machine_parts: 1 } }], goto: 'b' },
            fail: { text: `A mast cracks, a spar falls. No one is hurt, but the shuttle is dented and the haul is meagre. Even ghosts have their opinions.`, fx: [{ hull: -3 }, { cargo: { machine_parts: 1 } }], goto: 'b' } },
        ],
      },
      b: {
        text: `The journal tells of a drought, a decision, and a departure: the fleet did not die here. The sea shrank, so they built wheels and sailed away across the sand, leaving the old hulls as a monument. Last entry: "If you can fix the Wanderer, she'll show you the road."`,
        choices: [
          { label: `Try to fix the Wanderer`, tag: 'science', check: { skill: 'engineering', diff: 4 },
            pass: { text: `A full day of patching. The Wanderer's wheels turn; her sail unfurls, and she rolls a hundred metres down the old shore. The crew applauds, filthy and radiant.`, fx: [{ days: 1 }, { xp: { engineering: 3 } }, { flag: 'sandship_restored' }], goto: 'c' },
            fail: { text: `A long, exhausting day. The Wanderer creaks forward a metre and then settles, sighing. Not today. The crew is cheerful anyway.`, fx: [{ days: 1 }, { supplies: -1 }, { morale: 2 }], goto: 'c' } },
          { label: `Copy the journal and leave her be`, tag: 'wait', do: { text: `The journal is copied into the ship's log. The Wanderer stays where she is, which feels respectful. The compass, you are invited to keep.`, fx: [{ codex: 'codex_sandships' }, { morale: 3 }], goto: 'c' } },
        ],
      },
      c: {
        text: `As the shuttle lifts, a long shadow rolls across the dunes: a ship under sail, wheels turning, heading for the horizon. Its captain raises a hat to you, as one traveller to another. By the time you blink, it has gone.`,
        choices: [
          { label: `Dip the shuttle's wings in salute`, tag: 'diplomacy', do: { text: `The shadow-ship dips its mast. A thin trail of golden sand rises from its wake, pointing toward a nearby system.`, fx: [{ reveal: { radius: 4 } }, { codex: 'codex_sandships' }, { rep: { drifters: 3 } }, { morale: 6 }] } },
          { label: `Hold your course; it's a mirage, surely`, tag: 'flee', do: { text: `Surely. The ship's compass, however, spins slowly toward the vanished sail for an hour afterwards.`, fx: [{ codex: 'codex_sandships' }, { morale: 2 }] } },
        ],
      },
    },
  },
  {
    id: 'landing_glacier_choir_return',
    title: 'The Glacier Joins In',
    tags: ['wonder', 'diplomacy'],
    ctx: 'landing',
    weight: 10,
    when: [{ planetType: 'ice' }, { item: 'ice_chime' }],
    once: true,
    art: { scene: 'landing', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `The ice-chime in your pocket begins to hum on its own, a perfect fifth. The glacier ahead hums back. The two notes slide together, tune, and settle. A passage opens in the ice like a held door.`,
        choices: [
          { label: `Follow the passage`, tag: 'wait', do: { text: `The passage curves down into a ring of pillars, each tuned to a different note. They are waiting. The chime in your pocket is clearly the missing piece.`, goto: 'b' } },
          { label: `Tap the chime against a pillar to test it`, tag: 'science', check: { skill: 'science', diff: 3 },
            pass: { text: `The pillar answers, a clean major sixth. A second tap earns a third. {crew:science} realises: it is a scale, and the chime is a tuning fork the size of a thumb.`, fx: [{ xp: { science: 2 } }], goto: 'b' },
            fail: { text: `The pillar answers with a mournful, wobbling minor. The cave winces. {crew:science} apologises to a stalactite.`, fx: [{ morale: -1 }], goto: 'b' } },
        ],
      },
      b: {
        text: `Seven pillars, six humming. The seventh is silent, waiting for its note. The chime hums the missing pitch in your hand. You raise it to the seventh pillar and, to the astonishment of everyone, it begins to sing.`,
        choices: [
          { label: `Hold the chime to the pillar until the chord completes`, tag: 'diplomacy', do: { text: `A full chord fills the cavern, rich as organ-music. The ice hums with joy. A small shard drops free, still singing: a second chime, a gift.`, fx: [{ item: { ice_chime: 1 } }, { morale: 12 }, { codex: 'codex_singing_ice' }, { reveal: { radius: 3 } }], goto: 'c' } },
          { label: `Record, and leave the chord unfinished`, tag: 'science', do: { text: `The pillar stays silent, but the cave holds its breath, and you record the near-chord for the archive. A shard drops free anyway, as a thank-you for the restraint.`, fx: [{ morale: 6 }, { xp: { science: 1 } }], goto: 'c' } },
        ],
      },
      c: {
        text: `Outside, the glacier's hum has changed. The note drifts up the valley, and from miles away, other glaciers reply. A chorus of ice, tuning itself across a continent. The crew listens in the shuttle, motionless.`,
        choices: [
          { label: `Stay for the full chorus`, tag: 'wait', do: { text: `It lasts the evening. At the end, the sky turns violet and the ice hums a final low note. A tear is wiped; a hand is squeezed; the crew boards in silence.`, fx: [{ days: 1 }, { morale: 10 }, { mood: { all: 4 } }] } },
          { label: `Broadcast it to the nearest relay`, tag: 'persuade', do: { text: `The chorus is relayed across half the sector. Within days, mail arrives from strangers thanking you for the ice. A treasure of an evening, shared.`, fx: [{ rep: { vesperine: 3, drifters: 2 } }, { morale: 6 }, { credits: 30 }] } },
        ],
      },
    },
  },
  {
    id: 'landing_jungle_seedling_court',
    title: 'The Seedling Court',
    tags: ['comedy', 'diplomacy', 'wonder'],
    ctx: 'landing',
    weight: 9,
    when: [{ planetType: 'jungle' }, { flag: 'polite_doors_learned' }],
    once: true,
    art: { scene: 'landing', species: 'unknown', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `The jungle seems to have heard that you are the sort of visitor who asks first. At the clearing's edge, a council of seedlings is assembled around a stump: very small, very upright, rustling with legislative gravity. A tiny gavel (a twig) strikes the stump.`,
        choices: [
          { label: `Bow to the court and ask for hearing`, tag: 'diplomacy', do: { text: `A hush. The court inclines three leaves. The foreman seedling (a sapling in a bow tie of moss) clears its throat. "The matter before us," it rustles, "is custody of the Great Pond."`, goto: 'b' } },
          { label: `Offer a bag of nutrient mix`, tag: 'trade', if: [{ cargo: { ration_bars: 1 } }], do: { text: `The court weighs the offering. Several seedlings inspect it in turn. It is declared "adequate, delicious, and not a bribe". A seat is placed for you.`, fx: [{ cargo: { ration_bars: -1 } }], goto: 'b' } },
        ],
      },
      b: {
        text: `The Great Pond, it transpires, is a puddle. Two groves of ferns claim it. Both have excellent arguments. The court needs an outsider to rule. The ferns glare with leaf-flexing dignity. You consider.`,
        choices: [
          { label: `Rule: share it on alternate days`, tag: 'persuade', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `A murmur of approval. Both groves bow. The puddle, on hearing the verdict, gurgles in agreement. A delighted seedling hands you a seed-pod wrapped in moss.`, fx: [{ rep: { drifters: 1 } }, { item: { polite_seed: 1 } }, { morale: 6 }, { xp: { diplomacy: 2 } }], goto: 'c' },
            fail: { text: `The ferns object. The court adjourns to confer. After forty minutes of leaf-rustling, you are asked, kindly, to try again.`, fx: [{ days: 1 }, { supplies: -1 }], goto: 'c' } },
          { label: `Rule: the pond belongs to the frogs`, tag: 'persuade', rand: [
            [1, { text: `A chorus of frogs from the pond croaks assent. The ferns, outplayed, give way. The court is moved to tears and a modest tip of nectar.`, fx: [{ morale: 8 }, { supplies: 2 }], goto: 'c' }],
            [1, { text: `The frogs are not present. The ferns, offended, spray you with pond-water. Nobody is hurt; your dignity is.`, fx: [{ morale: -2 }], goto: 'c' }],
          ] },
        ],
      },
      c: {
        text: `The court rises. The foreman seedling presents a commemorative twig and a tiny scroll: freedom of the jungle for the Halcyon, "in perpetuity, or until the next monsoon". It is the nicest piece of legislation you have ever received.`,
        choices: [
          { label: `Frame it in the lounge`, tag: 'diplomacy', do: { text: `The scroll goes on the wall next to Gus-7's recipe and the moon photograph. Visitors ask about it. You tell the story, with embellishments.`, fx: [{ morale: 6 }, { codex: 'codex_seedling_court' }, { reveal: { radius: 2 } }] } },
          { label: `Plant the twig; see what happens`, tag: 'science', do: { text: `The twig takes root in a tray in the lab. It grows an inch overnight and appears to be taking minutes. The lab's mood improves markedly.`, fx: [{ morale: 5 }, { xp: { science: 1 } }, { codex: 'codex_seedling_court' }] } },
        ],
      },
    },
  },
  {
    id: 'landing_tidewright_regatta',
    title: 'The Kelp-City Regatta',
    tags: ['comedy', 'wonder', 'trade'],
    ctx: 'landing',
    weight: 9,
    when: [{ planetType: 'ocean' }, { flag: 'kelp_city_friend' }],
    once: true,
    art: { scene: 'landing', species: 'drifter', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Dockmistress Opal Sevre', species: 'drifter' },
        text: `"Captain! You're just in time for the Regatta. We race kelp-boats around the harbour: oars, sails, swearing. The Halcyon's shuttle is, I think, eligible. We've a spare rudder if you want to enter."`,
        choices: [
          { label: `Enter the shuttle (a skilled pilot at the stick)`, tag: 'flee', check: { skill: 'piloting', diff: 3 },
            pass: { text: `A close-run race, a heroic tack, and a photo finish. The shuttle wins by the length of a rope. Tears, cheering, confetti made of dried seaweed.`, fx: [{ morale: 10 }, { xp: { piloting: 2 } }, { rep: { drifters: 4 } }], goto: 'b' },
            fail: { text: `The shuttle runs aground on a buoy. Bellowing laughter from the crowd; a boat-hook rescues the pilot; the prize goes to a nine-year-old with a bathtub.`, fx: [{ morale: 4 }, { rep: { drifters: 2 } }, { hull: -2 }], goto: 'b' } },
          { label: `Cheer from the dock and judge the costumes`, tag: 'wait', do: { text: `You are made an Honorary Judge with a rosette of kelp. The costumes include a crab, two lighthouses and an entire tea service. The tea service wins.`, fx: [{ morale: 8 }, { rep: { drifters: 3 } }], goto: 'b' } },
        ],
      },
      b: {
        text: `At the prize-giving, Opal raises a mug. "Whoever enters the Regatta joins the family. Whoever joins the family gets a tide-table." She hands over a roll of sealed oilskin. "Our fishermen have charted every current in this sector. Use it kindly."`,
        choices: [
          { label: `Unroll the tide-table`, tag: 'science', do: { text: `A handsome hand-lettered chart of currents, wind shadows and quiet harbours, a map of everywhere a small boat can safely sleep. Your chart gains a handful of new waypoints.`, fx: [{ reveal: { radius: 4 } }, { cargo: { star_charts: 1 } }, { codex: 'codex_tide_tables' }] } },
          { label: `Trade it forward to the next drifter fleet`, tag: 'trade', do: { text: `You do not keep it. The fleet at the next station copies it, thrilled, and remembers your name. A good deed, spread over two oceans.`, fx: [{ rep: { drifters: 5 } }, { credits: 40 }, { codex: 'codex_tide_tables' }] } },
        ],
      },
    },
  },
  {
    id: 'landing_lighthouse_return',
    title: 'Oriel Keeps a Light for You',
    tags: ['mystery', 'relief', 'wonder'],
    ctx: 'landing',
    weight: 12,
    when: [{ planetType: 'barren' }, { flag: 'keeper_befriended' }],
    once: true,
    art: { scene: 'landing', species: 'robot', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Keeper Unit Oriel', species: 'robot' },
        text: `The lamp on the ridge is lit. It was dim before, and now it is a clean white blade. Oriel stands on the stair, coat freshly oiled. "I have news, Captain. The light has been seen. Ships have turned toward it. Three of them. I am so very busy."`,
        choices: [
          { label: `Climb the stair and hear all of it`, tag: 'diplomacy', do: { text: `Oriel talks for an hour: the three ships, the names of the captains, the cargo of each. It has kept a ledger. It is a good ledger. You write down the names with a pen.`, goto: 'b' } },
          { label: `Offer to help with the lamp`, tag: 'science', check: { skill: 'engineering', diff: 2 },
            pass: { text: `A tune-up of the clockwork. The lamp's beam widens to a smile. Oriel seems, astonishingly, to blush a little in the filament light.`, fx: [{ xp: { engineering: 2 } }], goto: 'b' },
            fail: { text: `The gears refuse to cooperate. Oriel is gracious, even delighted, to have been visited by someone who tried.`, fx: [{ morale: 1 }], goto: 'b' } },
        ],
      },
      b: {
        text: `Oriel takes a breath it doesn't need. "I have been thinking, Captain. I am not sad. But I would like to see where the ships go. Would a keeper be a terrible burden on a survey vessel? I would be very quiet. I can polish things."`,
        choices: [
          { label: `Offer Oriel a berth`, tag: 'diplomacy', do: { text: `Oriel stands very straight. "I accept. I shall leave the lamp on timer. I shall write it a letter." On the way out, the light flares once, a kind of blessing. The galley has a new polishing assistant.`, fx: [{ morale: 12 }, { mood: { all: 5 } }, { rep: { archivists: 3 } }, { codex: 'codex_lighthouse_robot' }, { flag: 'oriel_aboard' }] } },
          { label: `Promise to visit again`, tag: 'persuade', do: { text: `"Then I shall keep it lit," says Oriel. "That is what a keeper does." It presses a spare lens into your hand. The light behind it burns steady, warm, ready.`, fx: [{ item: { keeper_lens: 1 } }, { morale: 6 }, { reveal: { radius: 3 } }] } },
        ],
      },
    },
  },
];
