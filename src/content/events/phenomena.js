// EVENTS-B: phenomenon events (ctx 'phenomenon', via {phenomenon:'...'}), including the five-part Lantern chain.
//
// ITEMS: (invented item ids; WORLD may rename/describe)
//   pulsar_tape       - Pulsar Concert Tape: a reel recording of the Choir's finest broadcast; plays beautifully on any speaker.
//   storm_glass       - Storm-Glass: a bottle of ion-storm lightning, lovely on the bridge shelf, humming mildly.
//   comet_ice         - Comet Ice: a cooler of frost that tastes of a thousand years of space; excellent in tea.
//   aurora_thread     - Aurora Thread: a filament of living light the aurora-beings left behind; the lounge glows when it is near.
//   ghost_log_cube    - Ghost-Log Cube: a memory cube from a derelict, holding one very long conversation.
//   lantern_shard     - Lantern Shard: a fragment of beacon-light, warm in the hand, pointing faintly toward the next Lantern.
//   rift_chime        - Rift Chime: a short bar of folded-space metal that rings by itself, once, at exactly noon.
//
// CODEX: (ids used in {codex:..}; WORLD please cover each)
//   codex_nebula_fog       - Navigating Nebula Fog
//   codex_pulsar_radio     - Pulsar Radio Stations
//   codex_ion_surfing      - Ion-Storm Surfing
//   codex_microjump        - Wormhole Micro-Jumps
//   codex_miner_coops      - Asteroid Mining Cooperatives
//   codex_ghost_logs       - Derelict Ghost-Logs
//   codex_wedding_ship     - The Wedding Ship Evensong
//   codex_comet_harvest    - Comet Tails and Cold Tea
//   codex_singing_rifts    - Singing Rifts
//   codex_aurora_beings    - The Aurora-Beings
//   codex_lantern_first    - The First Lantern: a Greeting
//   codex_lantern_question - The Lantern's Question
//   codex_lantern_memory   - What the Lanterns Remember
//   codex_lantern_voices   - The Voices in the Light
//   codex_lantern_invite   - The Lantern Invitation
//
// FLAGS set:  lantern_1, lantern_2, lantern_3, lantern_4, lantern_5 (each chained: lantern_N needs lantern_{N-1}),
//             lantern_hint (also set in planets.js), lantern_path_diplomat / lantern_path_curious / lantern_path_quiet
//             (how the captain answered the final Lantern; for story.js endings),
//             wedding_ship_visited, pulsar_fan
// FLAGS used: lantern_1..4 (gates), keeper_befriended (extra line in lantern_3 gate-free; see note)

export default [
  // ================================================================ NEBULA
  {
    id: 'nebula_fog_navigation',
    title: 'Through the Fog',
    tags: ['hazard', 'science', 'wonder'],
    ctx: 'phenomenon',
    weight: 10,
    when: [{ phenomenon: 'nebula' }],
    cooldown: 15,
    art: { scene: 'nebula', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `The nebula swallows the stars one by one. The viewscreen turns to rose and green velvet. The sensors report "fog" in a tone that suggests they are being dramatic. A comfortable, drifting quiet settles over the bridge.`,
        choices: [
          { label: `Navigate by pulse-echo, slow and steady`, tag: 'science', check: { skill: 'piloting', diff: 3 },
            pass: { text: `Nothing hits anything. A thin lane through the gas opens up, and the ship slips along it like a thread through a needle. The survey chart gains a tidy new shortcut.`, fx: [{ xp: { piloting: 2 } }, { reveal: { radius: 2 } }, { codex: 'codex_nebula_fog' }] },
            fail: { text: `The ship noses into a dense pocket. Ionised gas sparkles along the hull and the engines hum a worried tune. You back out, politely, fuel the worse for it.`, fx: [{ fuel: -2 }, { hull: -3 }] } },
          { label: `Hum to the nebula until something answers`, tag: 'persuade', rand: [
            [2, { text: `The fog thins in a spiral. You follow it, laughing a bit, through a hall of glowing curtains and out the other side. Nobody can explain it. Nobody tries.`, fx: [{ morale: 6 }, { codex: 'codex_nebula_fog' }] }],
            [1, { text: `The fog thickens. The ship drifts for half a day, sounding hollow and pleased with itself. Eventually the haze lifts, unbothered.`, fx: [{ days: 1 }, { supplies: -1 }] }],
          ] },
          { label: `Wait it out with tea and a good book`, tag: 'wait', do: { text: `The nebula drifts. The tea steeps. By evening a gap opens and the stars come back, one at a time, like guests arriving.`, fx: [{ days: 1 }, { morale: 4 }] } },
        ],
      },
    },
  },

  // ================================================================ PULSAR
  {
    id: 'pulsar_radio_concert',
    title: 'The Pulsar Hour',
    tags: ['wonder', 'comedy'],
    ctx: 'phenomenon',
    weight: 10,
    when: [{ phenomenon: 'pulsar' }],
    cooldown: 20,
    art: { scene: 'pulsar', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `Static clears. A steady beat, forty times a second, thrums through the speakers. Then a melody, wrapped around it: a pulsar broadcast, tuned by someone long ago to a pleasant keys. The comm officer starts tapping a foot. Then the helm.`,
        choices: [
          { label: `Tune in and record the whole concert`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `The recording is clean. Hours of it. The pulsar turns out to have a repertoire, including a waltz you would swear is "The Blue Danube", only slower and much more vast.`, fx: [{ item: { pulsar_tape: 1 } }, { morale: 6 }, { xp: { science: 1 } }, { codex: 'codex_pulsar_radio' }] },
            fail: { text: `The recording is mostly hiss, plus a very beautiful forty seconds. {crew:science} insists these are the best forty seconds in history. They may be right.`, fx: [{ morale: 3 }, { codex: 'codex_pulsar_radio' }] } },
          { label: `Dance on the bridge`, tag: 'wait', do: { text: `For one beautiful hour, the entire crew dances. The captain does something close to a waltz. The galley bot beats time on a pot. Morale reaches an unprecedented peak.`, fx: [{ morale: 10 }, { mood: { all: 5 } }, { flag: 'pulsar_fan' }] } },
          { label: `Broadcast a request`, tag: 'persuade', check: { skill: 'diplomacy', diff: 3 },
            pass: { text: `You transmit a simple "encore, please". The pulsar's next verse is unmistakably a reply. The comm officer weeps a little. The chart gets a new coordinate for a Choir listening post.`, fx: [{ rep: { vesperine: 3 } }, { reveal: { radius: 3 } }, { morale: 6 }, { flag: 'pulsar_fan' }] },
            fail: { text: `The request is received, or ignored; the pulsar is a pulsar. The next verse is, however, a bit faster. Possibly a coincidence.`, fx: [{ morale: 2 }] } },
        ],
      },
    },
  },

  // ================================================================ ION STORM
  {
    id: 'ionstorm_surfing',
    title: 'Riding the Ion Swell',
    tags: ['hazard', 'wonder'],
    ctx: 'phenomenon',
    weight: 10,
    when: [{ phenomenon: 'ionstorm' }],
    cooldown: 15,
    art: { scene: 'ionstorm', species: 'unknown', palette: 'dusk' },
    start: 'a',
    nodes: {
      a: {
        text: `The ion storm is a rolling cliff of lavender lightning. The sensors scream gently. {crew:piloting} leans over the helm with a look that can only be described as "hopeful, and slightly illegal".`,
        choices: [
          { label: `Surf the leading edge`, tag: 'flee', check: { skill: 'piloting', diff: 4 },
            pass: { text: `The ship rides the crest. Lightning crawls along the hull in curls and loops. Fuel gauges drift upward, charged by the storm's generous field. The crew whoops. {crew:piloting} is insufferable for days.`, fx: [{ fuel: 3 }, { morale: 8 }, { xp: { piloting: 3 } }, { codex: 'codex_ion_surfing' }] },
            fail: { text: `The wave tips. The ship tumbles end over end through a purple wall of static, rights itself and sulks. The hull is singed; the pilot is humbled.`, fx: [{ hull: -6 }, { fuel: -2 }] } },
          { label: `Bottle some lightning in an insulated flask`, tag: 'science', check: { skill: 'engineering', diff: 3 },
            pass: { text: `{crew:engineering} traps a small ball of storm in a thermos and a prayer. It hums contentedly on the bridge shelf. It also charges one fuel cell, quietly, on the side.`, fx: [{ item: { storm_glass: 1 } }, { fuel: 1 }, { xp: { engineering: 2 } }] },
            fail: { text: `The flask fills. The flask also leaks. The bridge smells of ozone for a week; every doorknob has become mildly argumentative.`, fx: [{ morale: -2 }, { hull: -2 }] } },
          { label: `Detour around the storm`, tag: 'wait', do: { text: `A long, quiet loop. The storm shrugs behind you, sparkling and unbothered. Nobody has lost anything but time and a bit of fuel.`, fx: [{ fuel: -1 }, { days: 1 }] } },
        ],
      },
    },
  },

  // ================================================================ WORMHOLE
  {
    id: 'wormhole_microjump',
    title: 'The Small Door',
    tags: ['wonder', 'science', 'hazard'],
    ctx: 'phenomenon',
    weight: 9,
    when: [{ phenomenon: 'wormhole' }],
    cooldown: 25,
    art: { scene: 'wormhole', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `A small, stable wormhole, no wider than a hangar door, yawns in the dark. Beyond it, a different star. The sensors state, with some pride, that the throat is "approximately safe". The chief engineer sighs the sigh of a person who has heard that word before.`,
        choices: [
          { label: `Take the micro-jump`, tag: 'flee', goto: 'b', do: { text: `The ship slides into the throat. The stars stretch and fold into a sheet of silver. For a heartbeat, there is no ship, no crew, no tea. Then there is.`, goto: 'b' } },
          { label: `Study the throat before committing`, tag: 'science', check: { skill: 'science', diff: 3 },
            pass: { text: `{crew:science} maps the throat's wobble, finding its safe window. The jump will cost nothing and shave days off the journey. The codex is delighted.`, fx: [{ xp: { science: 2 } }, { codex: 'codex_microjump' }], goto: 'b' },
            fail: { text: `The throat's wobble refuses to be mapped. You decide, with admirable caution, to go anyway, but with the cargo lashed down.`, fx: [{ days: 1 }], goto: 'b' } },
          { label: `Leave it be; mark it on the chart`, tag: 'wait', do: { text: `You log the wormhole for the Meridian Society and move on. Someone braver will need it one day. Possibly you.`, fx: [{ reveal: { radius: 1 } }, { codex: 'codex_microjump' }] } },
        ],
      },
      b: {
        text: `The ship pops out into a new sky. A star you've never seen glows in the viewscreen. A few cups have gone over, and the cat, who is not supposed to be aboard, is. Everyone pretends not to see it.`,
        choices: [
          { label: `Scan the new neighbourhood`, tag: 'science', rand: [
            [2, { text: `The jump landed you well. Surveyed lanes unfold on the display, including a hidden waystation. Good luck is a kind of navigation.`, fx: [{ reveal: { radius: 4 } }, { fuel: 1 }, { codex: 'codex_microjump' }] }],
            [1, { text: `The scan shows you slightly off-lane, with a long way to the nearest known light. The ship hums, philosophical. You note the cost in fuel, and the gain in perspective.`, fx: [{ fuel: -2 }, { reveal: { radius: 2 } }] }],
          ] },
          { label: `Take a moment to check the cargo`, tag: 'wait', do: { text: `Everything is where it was, but a jar of pickles has become a jar of slightly different pickles. The galley bot is intrigued.`, fx: [{ morale: 3 }] } },
        ],
      },
    },
  },

  // ================================================================ ASTEROIDS
  {
    id: 'asteroid_miners_coop',
    title: 'The Rock-Pickers\' Co-op',
    tags: ['trade', 'diplomacy'],
    ctx: 'phenomenon',
    weight: 10,
    when: [{ phenomenon: 'asteroids' }],
    cooldown: 20,
    art: { scene: 'asteroids', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Shift-Boss Dara Kell', species: 'drifter' },
        text: `A hail from a ring of lit-up work-pods. "Survey ship! You've got the sort of face that fixes things. Our sorter's down, and we've two tonnes of nickel-iron and no one to run the numbers. Fancy an afternoon's work?"`,
        choices: [
          { label: `Offer the engineer's services`, tag: 'science', check: { skill: 'engineering', diff: 3 },
            pass: { text: `{crew:engineering} reroutes a conveyor, cools a motor, and patches the sorter with a sock. The co-op cheers. You're paid in parts, scrip and an invitation to a share of tomorrow's catch.`, fx: [{ cargo: { machine_parts: 2 } }, { credits: 30 }, { rep: { drifters: 4 } }, { codex: 'codex_miner_coops' }] },
            fail: { text: `The sorter works for forty minutes, then sulks. The co-op is kind about it. You get a hot meal and a share of what's left.`, fx: [{ supplies: 2 }, { rep: { drifters: 1 } }] } },
          { label: `Negotiate a fair rate for sorted ore`, tag: 'trade', check: { skill: 'diplomacy', diff: 3 },
            pass: { text: `You land a rate everyone feels slightly cheated by, which is the sign of a good deal. Credits change hands. The co-op throws in a crate of rock-candy.`, fx: [{ credits: 50 }, { rep: { drifters: 3 } }, { codex: 'codex_miner_coops' }] },
            fail: { text: `The haggling ends in a draw and a long argument over lunch. Nobody wins, everybody eats, a modest sum is paid.`, fx: [{ credits: 15 }, { supplies: 1 }] } },
          { label: `Wave and fly on with thanks`, tag: 'wait', do: { text: `Dara waves a spanner at you from the work-pod. "Come back when you're in need!" It sounds like a promise. It might be a threat. Hard to tell.`, fx: [{ rep: { drifters: 1 } }] } },
        ],
      },
    },
  },

  // ================================================================ DERELICT 1: GHOST LOG
  {
    id: 'derelict_ghost_log',
    title: 'The Ghost-Log of the Marguerite',
    tags: ['mystery', 'wonder'],
    ctx: 'phenomenon',
    weight: 10,
    when: [{ phenomenon: 'derelict' }],
    once: true,
    art: { scene: 'derelict', species: 'unknown', palette: 'dusk' },
    start: 'a',
    nodes: {
      a: {
        text: `A small cargo hauler drifts here, hull cold, name still legible: MARGUERITE. The airlock stands open as if someone stepped out for a moment. On the bridge, a log recorder still blinks, patient as a lighthouse.`,
        choices: [
          { label: `Play the log`, tag: 'science', do: { text: `A voice, tired and kind: "Day 211. Cargo's fine. Engine's fine. I am very lonely, but the stars are marvellous. If anyone finds this, there is a pot of jam in the pantry. It's good jam."`, goto: 'b' } },
          { label: `Scan the ship's engine for answers`, tag: 'science', check: { skill: 'engineering', diff: 2 },
            pass: { text: `The engine is flawless. The ship was simply left, on purpose. {crew:engineering} finds a note stuck to the console: "Gone to see what the lights are about. Back soon. P.S. do not touch the jam."`, fx: [{ xp: { engineering: 1 } }], goto: 'b' },
            fail: { text: `The engine's logs are sealed behind a puzzle lock and a very strongly worded sticker. Better to go to the personal log.`, goto: 'b' } },
        ],
      },
      b: {
        text: `The log goes on. The pilot drew stars in the margins of the memory, and listed every system passed, with a small commentary on each. She was following the Lanterns. The last entry is cheerful: "Going on ahead."`,
        choices: [
          { label: `Copy the star-notes into the ship's charts`, tag: 'science', do: { text: `Her little notes are better than the survey's. She'd drawn a safe lane through three systems you had no data on. You add a line in the margin: "Thank you, Marguerite."`, fx: [{ reveal: { radius: 4 } }, { item: { ghost_log_cube: 1 } }, { codex: 'codex_ghost_logs' }, { flag: 'lantern_hint' }] } },
          { label: `Take the jam, leave the ship in peace`, tag: 'wait', do: { text: `It is excellent jam. Raspberry and something floral. You leave the airlock as you found it, and a note: "Message received."`, fx: [{ supplies: 2 }, { morale: 5 }, { codex: 'codex_ghost_logs' }] } },
        ],
      },
    },
  },

  // ================================================================ DERELICT 2: WEDDING SHIP
  {
    id: 'derelict_wedding_ship',
    title: 'Evensong on the Wedding Ship',
    tags: ['mystery', 'wonder', 'diplomacy'],
    ctx: 'phenomenon',
    weight: 8,
    when: [{ phenomenon: 'derelict' }, { notFlag: 'wedding_ship_visited' }],
    once: true,
    art: { scene: 'derelict', species: 'quillari', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `The wreck is all bunting. Ribbons of silk float inside the shattered ballroom, tangled in chandeliers that still glow. A banner reads "CONGRATULATIONS, CEDRA AND HOLM". The ship's guest list is intact. No guests are.`,
        choices: [
          { label: `Cross the ballroom with respect`, tag: 'diplomacy', do: { text: `The chandeliers brighten as you pass. A music box, somewhere, begins an old waltz. The ship is welcoming company, in the manner of lonely ships everywhere.`, fx: [{ flag: 'wedding_ship_visited' }], goto: 'b' } },
          { label: `Run a quick structural scan first`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `Hull sound; power cells intact; no one aboard, now or recently. The ship has been standing watch for decades, patient as a cake under glass.`, fx: [{ flag: 'wedding_ship_visited' }, { xp: { science: 1 } }], goto: 'b' },
            fail: { text: `The scan gets tangled in ribbon. The ship hums apologetically as you pick bunting out of the antenna.`, fx: [{ flag: 'wedding_ship_visited' }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Ship\'s Steward (recorded)', species: 'quillari' },
        text: `A recorded steward bows from a podium. "Dearly beloved, the happy couple departed for the Lanterns, hand in hand. They said they would be back by morning. It is a long morning. Would the guests please enjoy the cake?"`,
        choices: [
          { label: `Sit and eat a slice with the crew`, tag: 'wait', do: { text: `The cake has crystallised into something like honeyed glass. It is spectacular. The crew toasts the couple with tea and a long silence. You leave warm-hearted.`, fx: [{ morale: 8 }, { supplies: 1 }, { rep: { quillari: 3 } }, { codex: 'codex_wedding_ship' }] } },
          { label: `Leave a message for the couple, should they return`, tag: 'diplomacy', do: { text: `You record: "Congratulations. We were here. The cake held up." The steward bows. The chandeliers dim in thanks. A tiny reel of silver thread is left on the podium for you.`, fx: [{ rep: { quillari: 4 } }, { item: { aurora_thread: 1 } }, { codex: 'codex_wedding_ship' }, { morale: 4 }] } },
        ],
      },
    },
  },

  // ================================================================ COMET
  {
    id: 'comet_tail_harvest',
    title: 'Chasing the Tail',
    tags: ['wonder', 'comedy'],
    ctx: 'phenomenon',
    weight: 10,
    when: [{ phenomenon: 'comet' }],
    cooldown: 20,
    art: { scene: 'comet', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `A comet sweeps by, tail glowing like a spilled tin of silver paint. The nav computer calculates a rendezvous in four hours and adds, very quietly, "tea is made from water, and comets are mostly water." Everyone looks at each other.`,
        choices: [
          { label: `Rendezvous and harvest comet ice`, tag: 'science', check: { skill: 'piloting', diff: 3 },
            pass: { text: `You match speed to within a hair. The scoop gathers a hold of sparkling ice, cold as a promise. It tastes of a thousand years and a faint hint of vanilla.`, fx: [{ item: { comet_ice: 1 } }, { supplies: 3 }, { xp: { piloting: 2 } }, { codex: 'codex_comet_harvest' }] },
            fail: { text: `The comet is faster than the forecast. The scoop bends, the ship rattles, and a shower of ice rains across the hull like applause.`, fx: [{ hull: -3 }, { supplies: 1 }] } },
          { label: `Stream the comet's spectrum`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `{crew:science} finds organic compounds that smell, improbably, of cinnamon. A paper is drafted. A cup of tea is raised. Both are well received.`, fx: [{ xp: { science: 2 } }, { morale: 3 }, { codex: 'codex_comet_harvest' }] },
            fail: { text: `The spectrum shows mostly ice. The analyst is disappointed; the cat, who again should not be aboard, is not.`, fx: [{ morale: 1 }] } },
          { label: `Watch it go; make a wish`, tag: 'wait', do: { text: `Nobody tells what they wished for. {crew:random} wished for good weather. {crew:random} wished for a cake. Nobody gets either, but everyone feels better.`, fx: [{ morale: 5 }] } },
        ],
      },
    },
  },

  // ================================================================ RIFT
  {
    id: 'rift_singing_choir',
    title: 'The Rift Sings Back',
    tags: ['mystery', 'wonder', 'diplomacy'],
    ctx: 'phenomenon',
    weight: 10,
    when: [{ phenomenon: 'rift' }],
    cooldown: 25,
    art: { scene: 'rift', species: 'vesperine', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `Space folds here like a sheet of silk. Through the fold comes a sound: long, rising, somewhere between a cello and a lullaby. The Vesperine hum along from a distant station; they call this one "Evenmother".`,
        choices: [
          { label: `Hum along, gently`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 },
            pass: { text: `The rift answers in a chord that leaves the bridge glowing. A Vesperine choir far off picks it up and relays it, and your comm channel is suddenly full of grateful, ringing voices.`, fx: [{ rep: { vesperine: 5 } }, { morale: 6 }, { codex: 'codex_singing_rifts' }] },
            fail: { text: `Your hum cracks halfway. The rift pauses, then plays the crack back, softly, as a tiny delicate variation. It's a kind of forgiveness.`, fx: [{ rep: { vesperine: 1 } }, { morale: 2 }] } },
          { label: `Measure the fold and take a sample of its shimmer`, tag: 'science', check: { skill: 'science', diff: 4 },
            pass: { text: `A sliver of folded space comes away in the sample box, ringing once, at exactly noon. {crew:science} calls it "an extraordinarily polite paradox".`, fx: [{ item: { rift_chime: 1 } }, { xp: { science: 3 } }, { codex: 'codex_singing_rifts' }, { reveal: { radius: 2 } }] },
            fail: { text: `The sample box rings for a minute, then is empty. The rift seems to take it back, apologetically.`, fx: [{ morale: 1 }] } },
          { label: `Sit in silence and let it sing`, tag: 'wait', do: { text: `Five minutes. Ten. The sound rises through the deck plates and into the bones. When it ends, nobody speaks for a while. It is a good silence.`, fx: [{ morale: 8 }, { codex: 'codex_singing_rifts' }] } },
        ],
      },
    },
  },

  // ================================================================ AURORA
  {
    id: 'aurora_beings_dance',
    title: 'The Dancers in the Light',
    tags: ['wonder', 'diplomacy', 'mystery'],
    ctx: 'phenomenon',
    weight: 10,
    when: [{ phenomenon: 'aurora' }],
    cooldown: 25,
    art: { scene: 'aurora', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `Ribbons of green and gold unfurl across the viewscreen. They shift, braid, and, with a clarity that raises hairs on the back of every neck, answer to the ship's running lights. The aurora is alive, and curious.`,
        choices: [
          { label: `Flash the running lights in greeting`, tag: 'diplomacy', goto: 'b', do: { text: `The aurora ripples. A dozen ribbons turn together toward the ship, like sunflowers. One flares green, then gold, then green again. They are mimicking the pattern. They are learning it.`, goto: 'b' } },
          { label: `Record the spectrum for the codex`, tag: 'science', check: { skill: 'science', diff: 3 },
            pass: { text: `The ribbons carry structure: a pattern of pulses that repeats with variations. It is language, or the thing a language grows from. {crew:science} cannot stop grinning.`, fx: [{ xp: { science: 2 } }, { codex: 'codex_aurora_beings' }], goto: 'b' },
            fail: { text: `The spectrum is too fluid to catch. The ribbons seem amused by the scanner and drift past it, trailing glitter.`, goto: 'b' } },
        ],
      },
      b: {
        text: `The ribbons draw closer, wrapping the ship in a slow, glowing helix. A thread of light curls from one, a loose filament. It hangs near the airlock, as if offering. The comm officer whispers: "Captain, I think it's a gift."`,
        choices: [
          { label: `Accept the thread, with great care`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `The thread lands in a sample jar and glows, gentle as a nightlight. The aurora spins once in thanks, and departs with a shimmer. The chart blooms with three new waypoints.`, fx: [{ item: { aurora_thread: 1 } }, { rep: { vesperine: 2 } }, { reveal: { radius: 3 } }, { codex: 'codex_aurora_beings' }, { morale: 6 }] },
            fail: { text: `The thread slips away as you reach. The aurora seems, if anything, amused. It leaves a faint streak of light across the viewscreen, like a wave goodbye.`, fx: [{ morale: 3 }, { codex: 'codex_aurora_beings' }] } },
          { label: `Play the pulsar tape back to them`, tag: 'persuade', if: [{ item: 'pulsar_tape' }],
            do: { text: `The ribbons stop. They sway to the music, pulsing in time. Then, with a flourish, they paint the entire sky in a pattern you will never forget. The tape plays on. The ship glows.`, fx: [{ item: { pulsar_tape: -1 } }, { item: { aurora_thread: 2 } }, { morale: 10 }, { codex: 'codex_aurora_beings' }] } },
          { label: `Wave and bow; let them keep the thread`, tag: 'wait', do: { text: `The thread retreats. The aurora spirals away across the dark, brighter than before. Far out, a handful of ribbons twist into the shape of a hand, waving.`, fx: [{ morale: 5 }, { codex: 'codex_aurora_beings' }] } },
        ],
      },
    },
  },

  // ================================================================ LANTERN 1
  {
    id: 'lantern_1_first_light',
    title: 'The First Lantern',
    tags: ['mystery', 'wonder', 'science'],
    ctx: 'phenomenon',
    weight: 14,
    when: [{ phenomenon: 'beacon' }, { notFlag: 'lantern_1' }],
    once: true,
    art: { scene: 'beacon', species: 'unknown', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `A tall, slender spire floats in the dark, crowned with a soft golden light. It does not pulse. It breathes. The sensors list it under "beacon" for lack of a better word. Everyone aboard calls it, without discussion, a Lantern.`,
        choices: [
          { label: `Hail it, courteously`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `The Lantern's light warms by a half-shade. It sends back your hail, note for note, with a small flourish at the end, as if signing its name. You have been greeted.`, fx: [{ flag: 'lantern_1' }, { rep: { archivists: 1 } }, { codex: 'codex_lantern_first' }, { morale: 6 }] },
            fail: { text: `Your hail echoes. The light holds steady, thoughtful. Then, slowly, it dims to blue and brightens back, as though clearing its throat. A second try is accepted. You have been greeted.`, fx: [{ flag: 'lantern_1' }, { codex: 'codex_lantern_first' }, { morale: 3 }] } },
          { label: `Scan the spire`, tag: 'science', check: { skill: 'science', diff: 3 },
            pass: { text: `The spire is hollow, glass-clear, built in segments. The light inside is not a flame but a pattern, very slowly rewriting itself. {crew:science} stares. "It's a sentence. It's been saying the same sentence for centuries."`, fx: [{ flag: 'lantern_1' }, { xp: { science: 3 } }, { codex: 'codex_lantern_first' }, { reveal: { radius: 3 } }] },
            fail: { text: `The scanner reads only gold. {crew:science} suspects the scanner was told to. The Lantern accepts the attempt gracefully, with a flicker that might be a smile.`, fx: [{ flag: 'lantern_1' }, { codex: 'codex_lantern_first' }] } },
          { label: `Sit with it a while`, tag: 'wait', do: { text: `You drift alongside for a full hour. The light gentles, brightens, gentles. The crew has the feeling of having been seen. It is a kind of tea for the soul.`, fx: [{ flag: 'lantern_1' }, { morale: 8 }, { codex: 'codex_lantern_first' }] } },
        ],
      },
    },
  },

  // ================================================================ LANTERN 2
  {
    id: 'lantern_2_the_question',
    title: 'The Lantern Asks',
    tags: ['mystery', 'diplomacy', 'wonder'],
    ctx: 'phenomenon',
    weight: 14,
    when: [{ phenomenon: 'beacon' }, { flag: 'lantern_1' }, { notFlag: 'lantern_2' }],
    once: true,
    art: { scene: 'beacon', species: 'unknown', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `This Lantern is brighter than the first. As the ship approaches, its light resolves into a series of pulses: three short, one long, then an unmistakable pause, a held breath. A question mark, in light. It is waiting for an answer.`,
        choices: [
          { label: `Answer: "We are looking for you."`, tag: 'persuade', goto: 'b', do: { text: `The Lantern brightens, delighted. Its pulses stutter, then settle into a rhythm like laughter. "Good," it seems to say. "Come closer." The ship edges in.`, goto: 'b' } },
          { label: `Answer: "We are lost, and happy about it."`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 },
            pass: { text: `The Lantern flickers in amusement. A rope of gold light unspools toward the ship and ties itself in a bow around the antenna. This is, apparently, a compliment.`, fx: [{ rep: { archivists: 1 } }], goto: 'b' },
            fail: { text: `The Lantern considers your answer for a long moment. It pulses a gentler version of the question. Honesty seems to be valued. You try again, with less wit.`, fx: [], goto: 'b' } },
          { label: `Stay quiet and just listen`, tag: 'wait', do: { text: `The pause stretches. The Lantern, gently, answers its own question, with a slow warm pulse: "Ah. Good." It seems to find silence an acceptable reply.`, fx: [{ morale: 3 }], goto: 'b' } },
        ],
      },
      b: {
        text: `The light draws in, forming a map of golden threads between stars. Three points glow brighter: nearby Lanterns, unlit by anyone you've met. A fourth is faint and far away. The map hangs between you, patient, like a hand held open.`,
        choices: [
          { label: `Copy the map into the charts`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `The golden threads resolve into exact coordinates. The sensor array records them to the last decimal. A lane of safe passage opens on the chart, wide as a promise.`, fx: [{ flag: 'lantern_2' }, { reveal: { radius: 5 } }, { codex: 'codex_lantern_question' }, { xp: { science: 2 } }] },
            fail: { text: `The map is lovely but loose; you capture most of it, and the rest is left to inference. Good enough: a Lantern's map is more a suggestion than a promise.`, fx: [{ flag: 'lantern_2' }, { reveal: { radius: 3 } }, { codex: 'codex_lantern_question' }] } },
          { label: `Thank the Lantern and ask what it is for`, tag: 'diplomacy', do: { text: `The pulses form a short, gentle phrase: "To be found." Then, shyly: "And to help you find each other." The crew falls quiet. You log the exchange with great care.`, fx: [{ flag: 'lantern_2' }, { reveal: { radius: 3 } }, { codex: 'codex_lantern_question' }, { morale: 6 }, { rep: { archivists: 2 } }] } },
        ],
      },
    },
  },

  // ================================================================ LANTERN 3
  {
    id: 'lantern_3_memory',
    title: 'What the Light Remembers',
    tags: ['mystery', 'wonder', 'science'],
    ctx: 'phenomenon',
    weight: 14,
    when: [{ phenomenon: 'beacon' }, { flag: 'lantern_2' }, { notFlag: 'lantern_3' }],
    once: true,
    art: { scene: 'beacon', species: 'unknown', palette: 'dusk' },
    start: 'a',
    nodes: {
      a: {
        text: `This Lantern is cracked down one side, its light dim and ragged, like a candle in a draught. The pulses stutter: confused, then ashamed. It has been alone a long time. The ship approaches with all lights on, as if to say: here, here.`,
        choices: [
          { label: `Offer repairs: realign its lens`, tag: 'science', check: { skill: 'engineering', diff: 4 },
            pass: { text: `{crew:engineering} lays a patient hand on the housing, and the light steadies. The crack seals with a hiss of soft gold. The Lantern, overwhelmed, projects a wave of warmth across the whole bridge.`, fx: [{ xp: { engineering: 3 } }, { morale: 6 }], goto: 'b' },
            fail: { text: `The lens resists. The repair doesn't take, but the Lantern appreciates the effort and brightens a little. A good start, not an end.`, fx: [{ morale: 2 }], goto: 'b' } },
          { label: `Speak to it: say that someone is here`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 },
            pass: { text: `You say it gently, over and over: you are here, you are seen. The light steadies. A sweet chord rolls through the speakers, the sound of a very old thing exhaling.`, fx: [{ morale: 6 }, { rep: { archivists: 2 } }], goto: 'b' },
            fail: { text: `Your words come out stiff. The Lantern flickers, but patiently. It seems to recognise the tone of someone who means well.`, fx: [{ morale: 2 }], goto: 'b' } },
          { label: `Keep company; tend it with tea and quiet`, tag: 'wait', do: { text: `The crew gathers at the viewscreen with cups. No one speaks. The Lantern, slowly, brightens, one shade at a time, until the bridge is bathed in honey-coloured light.`, fx: [{ morale: 8 }, { supplies: -1 }], goto: 'b' } },
        ],
      },
      b: {
        text: `Light spills across the viewscreen in patterns that resolve into images: tiny figures lighting spires across the dark. Dozens of them. Hands joined. Each one carries a small gold flame. The images hold, then fade, leaving one word in many scripts: "Remember."`,
        choices: [
          { label: `Record everything for the archive`, tag: 'science', do: { text: `The recording takes hours and every minute is worth it. The faces of the lighters, varied and unfamiliar, are part of the survey now. A shard of the light is left in the sample jar, warm.`, fx: [{ flag: 'lantern_3' }, { item: { lantern_shard: 1 } }, { codex: 'codex_lantern_memory' }, { xp: { science: 2 } }, { reveal: { radius: 3 } }] } },
          { label: `Answer: "We will."`, tag: 'diplomacy', do: { text: `You say it aloud, to the Lantern and the crew and the dark. The light flares, soft and glad. A single thread of gold curls toward the ship and settles onto the hull, warm as breath.`, fx: [{ flag: 'lantern_3' }, { item: { lantern_shard: 1 } }, { codex: 'codex_lantern_memory' }, { morale: 8 }, { rep: { archivists: 3 } }] } },
        ],
      },
    },
  },

  // ================================================================ LANTERN 4
  {
    id: 'lantern_4_voices',
    title: 'Voices in the Light',
    tags: ['mystery', 'wonder', 'diplomacy'],
    ctx: 'phenomenon',
    weight: 14,
    when: [{ phenomenon: 'beacon' }, { flag: 'lantern_3' }, { notFlag: 'lantern_4' }],
    once: true,
    art: { scene: 'beacon', species: 'unknown', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `The Lantern here hums with static, and under the static, voices. Dozens, overlapping: a Quillari laugh, a Vesperine chord, a human whistle, an Archivist's careful pronunciation. They are saying one thing, over and over, in a hundred accents: "Hello? Is anyone there?"`,
        choices: [
          { label: `Answer them all: "We are here. Hello."`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 4 },
            pass: { text: `The voices go quiet. Then, one by one, they answer: "Hello. Hello. We were wondering." The Lantern brightens and the static melts into music. Your comm officer is crying and grinning at once.`, fx: [{ rep: { archivists: 3, vesperine: 2, quillari: 2 } }, { morale: 10 }, { xp: { diplomacy: 3 } }], goto: 'b' },
            fail: { text: `You overlap the voices, and the Lantern stumbles. Static roars up and fades. But a few voices answer, tentatively. A fair beginning.`, fx: [{ rep: { archivists: 1 } }, { morale: 3 }], goto: 'b' } },
          { label: `Separate the voices with the spectrum analyser`, tag: 'science', check: { skill: 'science', diff: 4 },
            pass: { text: `{crew:science} untangles them: twenty-three speakers, all different, all saying hello. They are the lighters: recorded in the glass, the last words they said at each Lantern. A choir across centuries.`, fx: [{ xp: { science: 3 } }, { codex: 'codex_lantern_voices' }], goto: 'b' },
            fail: { text: `The voices refuse to separate. They seem to prefer being a crowd. {crew:science} sighs and admits it is a lovely crowd.`, fx: [{ morale: 2 }], goto: 'b' } },
          { label: `Listen to the choir in silence`, tag: 'wait', do: { text: `They go on. You stay. No one on the bridge speaks. At the end, a single voice says, quiet and clear: "Thank you for coming." The crew nods at the viewscreen, as one.`, fx: [{ morale: 8 }], goto: 'b' } },
        ],
      },
      b: {
        text: `One voice rises over the rest, human and unhurried: "If you are hearing this, we did what we meant to. We lit them so no one would be lost. We went on ahead. The last light is where it began. Bring something to say." The recording ends, softly.`,
        choices: [
          { label: `Log the message and mark the final Lantern`, tag: 'science', do: { text: `A glowing line appears on the chart, running toward the heart of the Reach. The Lantern's voices fade into a soft hum. You have never felt so thoroughly invited.`, fx: [{ flag: 'lantern_4' }, { reveal: { radius: 6 } }, { codex: 'codex_lantern_voices' }, { item: { lantern_shard: 1 } }, { rep: { archivists: 2 } }] } },
          { label: `Reply: "We will bring it."`, tag: 'diplomacy', do: { text: `The Lantern pulses, warm and glad. The crew exchanges looks that say: we're in this, now. The path to the last light lies clear and bright on the chart.`, fx: [{ flag: 'lantern_4' }, { reveal: { radius: 6 } }, { codex: 'codex_lantern_voices' }, { morale: 8 }, { rep: { archivists: 3 } }] } },
        ],
      },
    },
  },

  // ================================================================ LANTERN 5
  {
    id: 'lantern_5_invitation',
    title: 'The Last Light',
    tags: ['mystery', 'wonder', 'diplomacy'],
    ctx: 'phenomenon',
    weight: 14,
    when: [{ phenomenon: 'beacon' }, { flag: 'lantern_4' }, { notFlag: 'lantern_5' }],
    once: true,
    art: { scene: 'beacon', species: 'unknown', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `The last Lantern is smaller than the others. It is not floating; it is waiting. At its base is an empty socket, shaped for a hand. The Lantern's light is a small, patient flame, as if saying: it is your turn. Something is wanted. The crew holds its breath.`,
        choices: [
          { label: `Offer your shard of Lantern-light`, tag: 'diplomacy', if: [{ item: 'lantern_shard' }], do: { text: `The shard glows as it nears the socket. It slips in with a soft click, and the whole Lantern blooms with warm light, all the others answering across the dark. You can feel them: a hundred small suns, saying hello.`, fx: [{ item: { lantern_shard: -1 } }, { flag: 'lantern_5' }, { flag: 'lantern_path_diplomat' }, { codex: 'codex_lantern_invite' }, { rep: { archivists: 5, vesperine: 3, quillari: 3, drifters: 3, concord: 3 } }, { morale: 15 }, { chart: true }] } },
          { label: `Study the socket; learn how it was made`, tag: 'science', check: { skill: 'science', diff: 4 },
            pass: { text: `The socket is a key and a question. {crew:science} works out what it asks: not an object, but a person, willing. You offer your hand. The Lantern lights, and shows you the shape of everything the Reach once was.`, fx: [{ flag: 'lantern_5' }, { flag: 'lantern_path_curious' }, { codex: 'codex_lantern_invite' }, { xp: { science: 4 } }, { morale: 12 }, { reveal: { radius: 8 } }, { chart: true }] },
            fail: { text: `The socket stays a mystery. But the Lantern, patient, brightens until you can see the answer in the glow: the offer of a hand. You place yours in it. The light answers.`, fx: [{ flag: 'lantern_5' }, { flag: 'lantern_path_curious' }, { codex: 'codex_lantern_invite' }, { morale: 10 }, { reveal: { radius: 5 } }] } },
          { label: `Sit beside it, and say nothing`, tag: 'wait', do: { text: `The crew sits in the glow. No orders, no questions. After a time, the Lantern's flame leans toward the ship like a flower. It asks nothing more. You decide, together, to keep its secret. A calm settles that stays with you.`, fx: [{ flag: 'lantern_5' }, { flag: 'lantern_path_quiet' }, { codex: 'codex_lantern_invite' }, { morale: 15 }, { rep: { archivists: 2 } }] } },
        ],
      },
    },
  },
];
