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
            pass: { text: `{crew:engineering} reads the heat like a score and brings the flame to a perfect cherry-red. Ashka grunts approval and presses a bar of folded alloy into your hands.`, fx: [{ cargo: { machine_parts: 2 } }, { xp: { engineering: 2 } }, { rep: { drifters: 3 } }] },
            fail: { text: `The bellows kick back. A spray of sparks browns half your eyebrows. Ashka laughs so hard she drops her hammer, and, mollified, hands over one small bolt anyway.`, fx: [{ hull: -3 }, { cargo: { machine_parts: 1 } }, { morale: 1 }] } },
          { label: `Offer a glass of brandy to the forge`, tag: 'trade', if: [{ cargo: { glass_brandy: 1 } }],
            do: { text: `She pours half onto the coals. The flames turn blue-gold and sing. She pours the rest into two cups. "Now we can talk." You leave with a map to three nearby lava springs.`, fx: [{ cargo: { glass_brandy: -1 } }, { rep: { drifters: 5 } }, { reveal: { radius: 2 } }, { codex: 'codex_lava_forgers' }] } },
          { label: `Watch, and take notes for the log`, tag: 'wait', do: { text: `She forges a spoon. It is the most beautiful spoon you have ever seen. She hands it over without a word. The galley bot is overjoyed.`, fx: [{ morale: 4 }, { codex: 'codex_lava_forgers' }] } },
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
            pass: { text: `You tell it with pauses. Even the harbour cats listen. By the end the whole city is on the pier, and the dockmistress gives you a lamp from her own mantel.`, fx: [{ item: { kelp_lantern: 1 } }, { rep: { drifters: 4 } }, { flag: 'kelp_city_friend' }] },
            fail: { text: `You lose the thread of the story three times. The dockmistress accepts three dry biscuits, kindly, and tells you the harbour is open regardless.`, fx: [{ cargo: { ration_bars: -1 } }, { rep: { drifters: 1 } }] } },
          { label: `Trade at the floating market`, tag: 'trade', do: { text: `The kelp-weavers want hand-loomed cloth and medical kits; they pay in sea-silk, easy to resell. The market is shaped like a snail and entirely made of bargains.`, fx: [{ credits: 40 }, { codex: 'codex_kelp_cities' }] } },
          { label: `Offer hand looms as a gift`, tag: 'trade', if: [{ cargo: { hand_looms: 1 } }],
            do: { text: `The weavers burst into delighted argument over which pattern to try first. In the confusion you are given a lamp, a quilt-hung lounge, and lifetime moorage rights.`, fx: [{ cargo: { hand_looms: -1 } }, { item: { kelp_lantern: 1 } }, { upgrade: 'drifter_quilt_lounge' }, { rep: { drifters: 6 } }, { flag: 'kelp_city_friend' }, { codex: 'codex_kelp_cities' }] } },
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
            pass: { text: `The rhythm is a greeting, a pattern shared across a dozen Lantern fragments. {crew:science} puts it together: it means "we are here" and "you are not late".`, fx: [{ xp: { science: 3 } }, { flag: 'ancient_signal_heard' }, { codex: 'codex_ancient_signal' }, { reveal: { radius: 3 } }] },
            fail: { text: `The rhythm refuses to be decoded. It does seem to refuse kindly. {crew:science} writes "to be continued" in the margin.`, fx: [{ morale: 1 }, { flag: 'ancient_signal_heard' }] } },
          { label: `Tap the rhythm back on the hull`, tag: 'persuade', rand: [
            [2, { text: `The pulse pauses. Then answers: three beats, a pause, two long. It has added something. You feel greeted.`, fx: [{ morale: 6 }, { flag: 'ancient_signal_heard' }, { codex: 'codex_ancient_signal' }] }],
            [1, { text: `Nothing answers. But for the rest of the day, the hull ticks softly on its own, in the same rhythm. Nobody minds.`, fx: [{ morale: 2 }, { flag: 'ancient_signal_heard' }] }],
          ] },
          { label: `Log the coordinates and move on`, tag: 'wait', do: { text: `The signal fades from your instruments, still patient. It has waited a long time, and it can wait for tea.`, fx: [{ flag: 'ancient_signal_heard' }] } },
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
];
