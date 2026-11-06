// EVENTS-B: dock-side happenings (ctx 'station'), crew heart-to-hearts and morale (ctx 'crew'), quiet ship-life (ctx 'idle').
//
// ITEMS: (invented item ids; WORLD may rename/describe)
//   theremin_reel    - Busker's Reel: a hand-labelled cassette of a theremin player's finest hour.
//   festival_ribbon  - Festival Ribbon: a hand-dyed ribbon from the Dock Festival, worn on the bridge for luck.
//   luggage_tag      - Brass Luggage Tag: proof you once reunited a stranger with a very small, very important suitcase.
//   recipe_card      - Galley Recipe Card: Gus-7's triumphant "Five-Star Stew", hand-lettered.
//   (also reuses: ice_chime, tea_sample (planets.js); cargo good comet_ice; upgrade tea_service - all optional gates, never required)
//   festival_ribbon is shared with missions.js (WORLD).
//
// CODEX: (ids used in {codex:..}; WORLD please cover each)
//   codex_dock_festival    - Dock Festival Customs
//   codex_form_77b         - Concord Form 77-B and Its Discontents
//   codex_theremin         - The Theremin, an Instrument You Do Not Touch
//   codex_slide_rule       - Slide Rules and Why They Still Work
//   codex_galley_bot       - Galley Bot Gus-7: A Biography
//   codex_ship_tea         - Tea Aboard: A Brief Ritual
//
// ROUND 2 additions: rival Captain Vell (2), archive etiquette, callbacks (orchard, festival, busker, Rosewing),
//   4 crew arc-2 events (gated on engineer_heart_done / science_heart_done / medic_heart_done / comms_heart_done,
//   set by the heart-to-hearts and rewarding {xp}), celebration, 4 idle vignettes (incl. coolant leak with real costs).
// CODEX (new): codex_lantern_syntax (shared with phenomena.js)
// FLAGS (new): rival_met rival_race rival_ally engineer_heart_done science_heart_done medic_heart_done comms_heart_done
//   rest_day letters_home busker_note. Reads: rival_helped, orchard_friend, festival_friend, busker_fan, rosewing_friend,
//   gus_stew_solved, oriel_aboard, polite_doors_learned (set), tea_tin item (from missions).
// FLAGS set:  festival_friend, form_77b_filed, luggage_returned, busker_fan, gus_stew_solved, movie_night_seen
// FLAGS used: none required (all events are self-contained)

export default [
  // ================================================================ STATION: DOCK FESTIVAL
  {
    id: 'station_dock_festival',
    title: 'The Dock Festival',
    tags: ['comedy', 'wonder', 'trade'],
    ctx: 'station',
    weight: 8,
    when: [{ system: { hasStation: true } }],
    cooldown: 40,
    art: { scene: 'station', species: 'quillari', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Festival-Marshal Pip Tolliver', species: 'quillari' },
        text: `Bunting stretches from gantry to gantry. Someone is grilling something fragrant. A brass band marches in tight, joyful circles. "Captain! Just in time for the Festival of the Last Docking. You'll be wanting a ribbon. Everyone wants a ribbon."`,
        choices: [
          { label: `Join the parade`, tag: 'wait', do: { text: `The crew marches behind a tuba, carrying a banner reading ISV HALCYON: BRING SNACKS. It is the most dignified thing you have ever done. A child hands the captain a ribbon.`, fx: [{ morale: 10 }, { item: { festival_ribbon: 1 } }, { rep: { quillari: 2 } }, { flag: 'festival_friend' }], goto: 'b' } },
          { label: `Enter the pastry contest`, tag: 'persuade', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `The galley bot's lemon tart takes second place; the captain's charming speech takes first. A medal and a small pouch of scrip change hands. Gus-7 is silent for the rest of the day, glowing.`, fx: [{ credits: 40 }, { morale: 8 }, { rep: { quillari: 3 } }], goto: 'b' },
            fail: { text: `The tart collapses. The speech trails off. A judge awards you "Most Cheerful Failure," a rosette made of bacon. Everyone cheers.`, fx: [{ morale: 5 }], goto: 'b' } },
          { label: `Stay aboard; there is paperwork`, tag: 'flee', do: { text: `The music drifts through the airlock. The crew pretends not to hear. Gus-7 makes a very quiet, very sad noise in the galley.`, fx: [{ morale: -3 }] } },
        ],
      },
      b: {
        text: `By evening the festival has thinned to a few lanterns and a lone fiddler. The marshal finds you at the rail with a plate of something golden. "Take it. Every ship that docks on the last night gets one. For luck. And leftovers."`,
        choices: [
          { label: `Accept, with thanks`, tag: 'diplomacy', do: { text: `It is some kind of honeyed pastry, still warm. Supplies are sweetened, the crew is mellowed, and your name is added to the festival's guest ledger.`, fx: [{ supplies: 2 }, { morale: 4 }, { codex: 'codex_dock_festival' }] } },
          { label: `Offer a ration bar in exchange`, tag: 'trade', if: [{ cargo: { ration_bars: 1 } }],
            do: { text: `The marshal examines the ration bar with great solemnity, then eats it. "Ghastly," he says, delighted. You are given three pastries and a handshake.`, fx: [{ cargo: { ration_bars: -1 } }, { supplies: 3 }, { rep: { quillari: 3 } }, { codex: 'codex_dock_festival' }] } },
        ],
      },
    },
  },

  // ================================================================ STATION: BUREAUCRAT INSPECTION
  {
    id: 'station_form_77b',
    title: 'Form 77-B',
    tags: ['comedy', 'diplomacy'],
    ctx: 'station',
    weight: 9,
    when: [{ system: { hasStation: true } }],
    cooldown: 30,
    art: { scene: 'station', species: 'human', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Inspector Marlowe Quince', species: 'human' },
        text: `A tidy Concord inspector appears at the airlock with a clipboard and a very sincere smile. "Good day, Captain. Routine formalities. I'll need Form 77-B, countersigned, in triplicate. Also a small sample of your atmosphere, for the files."`,
        choices: [
          { label: `Produce the forms (and be charming)`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 },
            pass: { text: `Quince reads every word, finds it impeccable, and stamps each sheet with joy. "A pleasure, Captain. Truly." He leaves a commendation, a small discount, and a rather good pen.`, fx: [{ rep: { concord: 4 } }, { credits: 20 }, { flag: 'form_77b_filed' }, { codex: 'codex_form_77b' }] },
            fail: { text: `Page two is missing. Quince is gracious about it, if relentless. Three hours later, the forms are complete, and your patience has been genuinely tested.`, fx: [{ days: 1 }, { morale: -2 }, { rep: { concord: 1 } }, { flag: 'form_77b_filed' }], goto: 'b' } },
          { label: `Argue that Form 77-B was repealed (bluff)`, tag: 'persuade', rand: [
            [2, { text: `Quince frowns, checks his binder, and goes pink. "Why, you're right. They did repeal it. Last Tuesday." He apologises profusely and leaves you a gift basket.`, fx: [{ supplies: 2 }, { rep: { concord: 2 } }, { morale: 4 }] }],
            [1, { text: `Quince has a very tidy binder. Form 77-B has not been repealed. In fact, it has been expanded. There is now a Form 77-C. You are made to fill both.`, fx: [{ days: 1 }, { morale: -3 }], goto: 'b' }],
          ] },
          { label: `Hand over the atmosphere sample and the paperwork`, tag: 'wait', do: { text: `A small bottle of recycled air changes hands. Quince reads it with the solemnity of a sommelier. "Slightly... teaish. Approved." He departs content.`, fx: [{ flag: 'form_77b_filed' }, { codex: 'codex_form_77b' }] } },
        ],
      },
      b: {
        speaker: { name: 'Inspector Marlowe Quince', species: 'human' },
        text: `Quince pauses at the door. "Captain, off the record: nobody enjoys the forms. But they remind us all that someone, somewhere, wants to know you got home safely. Good luck out there." He tips an imaginary hat.`,
        choices: [
          { label: `Thank him sincerely`, tag: 'diplomacy', do: { text: `It lands. He nods, blinking too fast, and leaves the stack of forms behind as a souvenir. You frame one in the lounge.`, fx: [{ rep: { concord: 2 } }, { morale: 3 }, { codex: 'codex_form_77b' }] } },
        ],
      },
    },
  },

  // ================================================================ STATION: LOST LUGGAGE
  {
    id: 'station_lost_luggage',
    title: 'The Very Small Suitcase',
    tags: ['comedy', 'relief'],
    ctx: 'station',
    weight: 9,
    when: [{ system: { hasStation: true } }, { notFlag: 'luggage_returned' }],
    once: true,
    art: { scene: 'station', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Baggage Clerk Fenwick', species: 'drifter' },
        text: `A flustered clerk clutches a tiny leather suitcase. "Captain! This was left aboard a Quillari packet and went on without its owner. It's marked URGENT in nine languages. I can't leave the desk. Would your ship carry it?"`,
        choices: [
          { label: `Take it, and follow the tag`, tag: 'diplomacy', do: { text: `The tag points to a name and a system two lanes away. You tuck the suitcase in the safe. It hums faintly, as though comforted.`, goto: 'b' } },
          { label: `Scan the case (just once, discreetly)`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `Inside: a tiny music box, a letter, and what the scanner calls "affection, high concentration". You close the scan guiltily. It is clearly a gift.`, fx: [{ xp: { science: 1 } }], goto: 'b' },
            fail: { text: `The scanner returns "suitcase." You feel foolish and, a little, relieved.`, goto: 'b' } },
          { label: `Decline; the schedule is tight`, tag: 'flee', do: { text: `Fenwick nods, crestfallen, and puts the suitcase back under the counter. It does not look like it has a long journey ahead.`, fx: [{ morale: -2 }] } },
        ],
      },
      b: {
        text: `A day later you find the owner: a tiny Quillari grandmother on a pier, anxiously waiting. She takes the case in both hands, opens it, and her whole face softens. The music box plays one warm note. She gives you a brass tag, and her blessing.`,
        choices: [
          { label: `Accept the tag and the blessing`, tag: 'diplomacy', do: { text: `It is a small kindness, richly rewarded. The grandmother also presses a purse of scrip into your hand and pretends not to. The crew toasts the occasion with tea.`, fx: [{ flag: 'luggage_returned' }, { item: { luggage_tag: 1 } }, { credits: 50 }, { rep: { quillari: 4, drifters: 2 } }, { morale: 6 }] } },
          { label: `Decline payment; accept only the blessing`, tag: 'wait', do: { text: `She insists on giving you tea at least. You sit on the pier for an hour, saying little. It is the best use of an afternoon you can think of.`, fx: [{ flag: 'luggage_returned' }, { item: { luggage_tag: 1 } }, { rep: { quillari: 5, drifters: 3 } }, { morale: 8 }] } },
        ],
      },
    },
  },

  // ================================================================ STATION: REPAIR BAY HAGGLE
  {
    id: 'station_repair_haggle',
    title: 'The Repair-Bay Dance',
    tags: ['trade', 'persuade'],
    ctx: 'station',
    weight: 10,
    when: [{ system: { hasStation: true } }, { hull: 1 }],
    cooldown: 15,
    art: { scene: 'engine_room', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Chief Fitter Orsolya', species: 'drifter' },
        text: `The repair-bay boss looks at the Halcyon's hull with the pity of a doctor greeting a long-time patient. "Dents, scorch marks, a suspicious smell. It will be a hundred scrip for the full patch. Or... we can talk."`,
        choices: [
          { label: `Haggle: appeal to her craftsmanship`, tag: 'persuade', check: { skill: 'diplomacy', diff: 3 },
            pass: { text: `You compliment her welds; she blushes through her visor. The price drops to forty, plus tea. She spends an extra hour polishing a plate you didn't ask about.`, fx: [{ credits: -40 }, { hull: 15 }, { rep: { drifters: 2 } }] },
            fail: { text: `She sees through you at once. "Nice try, spacer." The price stays at a hundred, but you do get a free tin of weld-polish, out of respect.`, fx: [{ credits: -100 }, { hull: 15 }] } },
          { label: `Offer to help: engineering labour for a discount`, tag: 'science', check: { skill: 'engineering', diff: 3 },
            pass: { text: `{crew:engineering} slides under the hull alongside her crew. By evening it's swapped notes, parts, and an argument about sealants. The bill is nearly nothing.`, fx: [{ credits: -15 }, { hull: 15 }, { xp: { engineering: 2 } }, { rep: { drifters: 3 } }] },
            fail: { text: `The labour is enthusiastic but slow. The discount is modest. The repair is solid, though, and Orsolya admits it was "not bad for a survey ship".`, fx: [{ credits: -70 }, { hull: 15 }, { xp: { engineering: 1 } }] } },
          { label: `Pay the full hundred; no fuss`, tag: 'trade', if: [{ credits: 100 }], do: { text: `The patch is flawless. Orsolya hands you a receipt and a pat on the hull. "She's a good ship. Treat her kindly."`, fx: [{ credits: -100 }, { hull: 20 }] } },
          { label: `Thank her and decline; the hull will hold`, tag: 'wait', do: { text: `Orsolya shrugs. "Your ship, your hull." The Halcyon creaks, as if grateful for the vote of confidence.`, fx: [] } },
        ],
      },
    },
  },

  // ================================================================ STATION: THEREMIN BUSKER
  {
    id: 'station_theremin_busker',
    title: 'The Busker with the Theremin',
    tags: ['wonder', 'comedy'],
    ctx: 'station',
    weight: 9,
    when: [{ system: { hasStation: true } }],
    cooldown: 30,
    art: { scene: 'market', species: 'vesperine', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `By the fountain, a Vesperine plays an upright theremin with two shimmering hands, never touching it. The note rises and trembles. A small crowd has gathered. A hat sits on the ground, mostly empty, and obviously hopeful.`,
        choices: [
          { label: `Listen for a while`, tag: 'wait', do: { text: `The melody climbs, wanders, comes home. It is gentle and a little melancholy, like a lullaby sung by someone who misses the sea. You stay for the whole piece.`, fx: [{ morale: 5 }], goto: 'b' } },
          { label: `Toss a few scrip in the hat`, tag: 'trade', if: [{ credits: 10 }], do: { text: `The busker's hands flutter in thanks, and the note brightens. A child dances. An old man weeps, quietly, into his scarf. The hat grows heavier.`, fx: [{ credits: -10 }, { morale: 4 }, { rep: { vesperine: 2 } }], goto: 'b' } },
          { label: `Ask if the busker will play for the ship`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `The busker agrees to a short private concert in the observation lounge. The crew assembles, cups in hand. The theremin sings against the stars, and the entire bridge sighs.`, fx: [{ morale: 10 }, { rep: { vesperine: 3 } }, { flag: 'busker_fan' }, { codex: 'codex_theremin' }], goto: 'b' },
            fail: { text: `The busker, shy, declines, though warmly. A small wave from two pale hands. The crowd claps. Everyone feels, vaguely, they have missed something.`, fx: [{ morale: 1 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Busker Ilu-Tamsin', species: 'vesperine' },
        text: `*A gentle chord, translated:* "You listen well. Many pass without hearing. Here: a recording of the finest evening I have played. It is all I have to give. Please play it when the ship is quiet."`,
        choices: [
          { label: `Accept the reel with thanks`, tag: 'diplomacy', do: { text: `A small cassette, hand-labelled in glowing ink. It plays beautifully on the bridge speakers at 2 a.m., when the ship is humming and everyone has gone soft.`, fx: [{ item: { theremin_reel: 1 } }, { morale: 4 }, { rep: { vesperine: 2 } }, { codex: 'codex_theremin' }] } },
          { label: `Offer a tuning crystal in return`, tag: 'trade', if: [{ cargo: { tuning_crystals: 1 } }],
            do: { text: `The busker takes the crystal reverently, holds it to one ear, and goes very still. Then plays three bars that make the whole fountain ring in sympathy. It's the finest thanks you've ever heard.`, fx: [{ cargo: { tuning_crystals: -1 } }, { item: { theremin_reel: 1 } }, { rep: { vesperine: 5 } }, { morale: 8 }, { codex: 'codex_theremin' }] } },
        ],
      },
    },
  },

  // ================================================================ CREW: ENGINEER
  {
    id: 'crew_engineer_heart',
    title: 'Engine-Room Confidences',
    tags: ['relief', 'comedy'],
    ctx: 'crew',
    weight: 8,
    when: [{ crewRole: 'engineering' }],
    cooldown: 35,
    art: { scene: 'engine_room', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Chief Engineer', species: 'human' },
        text: `The engine room hums its steady bass. {crew:engineering} wipes their hands on a rag that has seen better decades. "Captain, I talk to the warp coils. Is that strange? They talk back, sort of. In vibrations. I think they miss the Gate."`,
        choices: [
          { label: `Ask what the coils are saying`, tag: 'science', do: { text: `They hum a pattern {crew:engineering} has been charting for weeks: a quiet, rising figure that repeats. "I think it's a lullaby," they say, ears pink. "The coils sing it to themselves." You sit in the hum for a while.`, fx: [{ flag: 'engineer_heart_done' }, { mood: { random: 8 } }, { morale: 4 }, { xp: { engineering: 2 } }], goto: 'b' } },
          { label: `Offer to take a shift on the coils`, tag: 'persuade', check: { skill: 'engineering', diff: 2 },
            pass: { text: `You stand watch for an hour while {crew:engineering} naps in a pile of rags. The coils behave impeccably. The engineer wakes refreshed and mildly suspicious.`, fx: [{ flag: 'engineer_heart_done' }, { mood: { random: 10 } }, { xp: { engineering: 1 } }], goto: 'b' },
            fail: { text: `You pull the wrong lever and the lights go purple for a minute. {crew:engineering} arrives at a dead run, laughing too hard to scold you.`, fx: [{ flag: 'engineer_heart_done' }, { mood: { random: 6 } }, { hull: -2 }], goto: 'b' } },
          { label: `Tell them it isn't strange at all`, tag: 'diplomacy', do: { text: `"Everyone talks to something," you say. "I talk to the viewscreen." {crew:engineering} grins. The conversation is brief, but it's one you both remember.`, fx: [{ flag: 'engineer_heart_done' }, { mood: { random: 8 } }, { morale: 3 }] } },
        ],
      },
      b: {
        speaker: { name: 'Chief Engineer', species: 'human' },
        text: `"Thanks, Captain. Honestly. Most captains want the engines faster. You ask what they're feeling." A pause. A small wrench is pressed into your hand. "For luck. Don't lose it. It's my second-favourite wrench."`,
        choices: [
          { label: `Accept it as a mark of trust`, tag: 'diplomacy', do: { text: `The wrench goes on a hook in your cabin. It doesn't do anything. It does, however, make the cabin feel more like yours.`, fx: [{ flag: 'engineer_heart_done' }, { morale: 5 }, { mood: { random: 6 } }] } },
        ],
      },
    },
  },

  // ================================================================ CREW: SCIENCE
  {
    id: 'crew_science_heart',
    title: 'The Unanswered Question',
    tags: ['relief', 'wonder'],
    ctx: 'crew',
    weight: 8,
    when: [{ crewRole: 'science' }],
    cooldown: 35,
    art: { scene: 'bridge', species: 'human', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Science Officer', species: 'human' },
        text: `{crew:science} is staring at a data-slate with the expression of someone who has found a grain of sand and fears it may be a planet. "Captain, I've a theory about the Lanterns. It's too neat. I distrust it. Will you hear it anyway?"`,
        choices: [
          { label: `Hear it out`, tag: 'science', do: { text: `The theory takes forty minutes and three diagrams. It involves a lot of light, some patience, and a sentence that begins "what if they were never meant to be found by accident?" You nod. It might be right.`, fx: [{ flag: 'science_heart_done' }, { xp: { science: 2 } }, { mood: { random: 8 } }], goto: 'b' } },
          { label: `Ask what would disprove it`, tag: 'persuade', check: { skill: 'science', diff: 2 },
            pass: { text: `A beaming pause. "That's the right question." You draft a test plan together on the back of a menu. By midnight there are three experiments, a flowchart, and a shared sense that the ship is doing real science.`, fx: [{ flag: 'science_heart_done' }, { xp: { science: 3 } }, { mood: { random: 10 } }], goto: 'b' },
            fail: { text: `You ask a good question, badly. {crew:science} answers it before you finish, and then, kindly, answers the one you meant to ask. You both laugh.`, fx: [{ flag: 'science_heart_done' }, { mood: { random: 5 } }], goto: 'b' } },
          { label: `Admit you only half understood it`, tag: 'diplomacy', do: { text: `"Half is plenty," says {crew:science}, relieved. "Most people stop at the first diagram." They draw you a small star on the slate, with a smiley face. You keep it.`, fx: [{ flag: 'science_heart_done' }, { mood: { random: 8 } }, { morale: 3 }] } },
        ],
      },
      b: {
        speaker: { name: 'Science Officer', species: 'human' },
        text: `"I became a scientist because I wanted to know. And now I know a lot, and I find I mostly want to know what I don't. Is that an odd thing to say on a survey ship?" They wait. They really wait.`,
        choices: [
          { label: `"It's the right thing to say."`, tag: 'diplomacy', do: { text: `"Then we're in the right place," says {crew:science}, grinning. They go back to the slate. The glow of its screen lights their face in a way that looks, quite specifically, like happiness.`, fx: [{ flag: 'science_heart_done' }, { mood: { random: 10 } }, { morale: 5 }] } },
        ],
      },
    },
  },

  // ================================================================ CREW: MEDIC
  {
    id: 'crew_medic_heart',
    title: 'Sickbay, Quiet Hour',
    tags: ['relief', 'comedy'],
    ctx: 'crew',
    weight: 8,
    when: [{ crewRole: 'medicine' }],
    cooldown: 35,
    art: { scene: 'sickbay', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Ship\'s Medic', species: 'human' },
        text: `Sickbay is quiet. {crew:medicine} sits among the neatly labelled drawers, polishing a stethoscope that does not need polishing. "Captain. Nobody's ill. I should be happy. Instead I keep wondering who I'm for, when nobody needs me."`,
        choices: [
          { label: `Sit down with them and offer tea`, tag: 'diplomacy', do: { text: `You pour two cups. You sit. The medic talks, then doesn't, then talks again. Eventually, a quiet settles that feels like medicine. "Thank you, Captain. This helped. This was the appointment."`, fx: [{ flag: 'medic_heart_done' }, { mood: { random: 10 } }, { morale: 5 }, { supplies: -1 }], goto: 'b' } },
          { label: `Say they are the reason the crew relaxes`, tag: 'persuade', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `"It's true," you say, and name three crew members who sleep better because there's a doctor aboard. {crew:medicine} listens, blinking. "I didn't know that." They do now.`, fx: [{ flag: 'medic_heart_done' }, { mood: { random: 12 } }, { morale: 4 }], goto: 'b' },
            fail: { text: `The line comes out stiffer than you meant. {crew:medicine} accepts it with the grace of long practice, and pats your shoulder as if you were the patient.`, fx: [{ flag: 'medic_heart_done' }, { mood: { random: 5 } }], goto: 'b' } },
          { label: `Suggest a social round of the ship`, tag: 'wait', do: { text: `The medic makes a round with a tray of tea and bad jokes. Within an hour, eleven small complaints have been aired and quietly solved. Everyone feels lighter.`, fx: [{ flag: 'medic_heart_done' }, { morale: 8 }, { mood: { all: 3 } }] } },
        ],
      },
      b: {
        speaker: { name: 'Ship\'s Medic', species: 'human' },
        text: `"I'll tell you my secret," says {crew:medicine}. "The best cure I know is somebody noticing. So: I noticed you haven't slept well. Take this. It's a mild sedative and a lot of caring." A small paper packet, hand-labelled, is pressed into your palm.`,
        choices: [
          { label: `Accept the packet, and the advice`, tag: 'diplomacy', do: { text: `You sleep eight hours for the first time in a fortnight. The packet is mostly chamomile. You never tell the medic you suspected.`, fx: [{ flag: 'medic_heart_done' }, { morale: 6 }, { mood: { random: 6 } }, { xp: { medicine: 1 } }] } },
        ],
      },
    },
  },

  // ================================================================ CREW: COMMS
  {
    id: 'crew_comms_heart',
    title: 'The Voice on the Line',
    tags: ['relief', 'diplomacy'],
    ctx: 'crew',
    weight: 8,
    when: [{ crewRole: 'diplomacy' }],
    cooldown: 35,
    art: { scene: 'bridge', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Comms Officer', species: 'human' },
        text: `{crew:diplomacy} sits at the comms console, headphones askew. "Captain, I speak eleven languages and I've just realised I've no one to be quiet with in any of them. Do you ever feel like a bridge that everybody walks across?"`,
        choices: [
          { label: `Teach them to be quiet`, tag: 'wait', do: { text: `You offer a game: ten minutes of silence, no translation, no agenda. It is surprisingly hard, and then it isn't. By the end, {crew:diplomacy} is grinning at the ceiling.`, fx: [{ flag: 'comms_heart_done' }, { mood: { random: 10 } }, { morale: 5 }], goto: 'b' } },
          { label: `Ask them to teach you a phrase in each language`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `You learn eleven ways to say "good evening", and one very rude word that's affectionate in Quillari. Your accent is awful. Their delight is not.`, fx: [{ flag: 'comms_heart_done' }, { xp: { diplomacy: 3 } }, { mood: { random: 10 } }], goto: 'b' },
            fail: { text: `Your accent is a crime. {crew:diplomacy} laughs until they cry, wipes their eyes, and says it's the best day of the voyage so far.`, fx: [{ flag: 'comms_heart_done' }, { mood: { random: 8 } }, { morale: 3 }], goto: 'b' } },
          { label: `Listen to the old broadcasts together`, tag: 'science', do: { text: `You tune across the bands, finding drifter lullabies, Concord weather reports, a Quillari quiz show. Each is a small proof that someone, somewhere, is listening too.`, fx: [{ flag: 'comms_heart_done' }, { mood: { random: 8 } }, { morale: 4 }] } },
        ],
      },
      b: {
        speaker: { name: 'Comms Officer', species: 'human' },
        text: `"You know, I think what I like about this ship is that nobody here needs me to translate who we are. Thank you for that." A pause. "Also, I've been meaning to tell you: your hailing voice is much better than you think."`,
        choices: [
          { label: `Laugh, and say thank you`, tag: 'diplomacy', do: { text: `It is the nicest thing anyone has said about your voice. You log it quietly under 'confidence' and carry it with you.`, fx: [{ flag: 'comms_heart_done' }, { mood: { random: 8 } }, { morale: 4 }, { xp: { diplomacy: 1 } }] } },
        ],
      },
    },
  },

  // ================================================================ CREW: LOW MORALE
  {
    id: 'crew_low_morale_lounge',
    title: 'The Long Quiet',
    tags: ['relief', 'comedy'],
    ctx: 'crew',
    weight: 14,
    when: [{ not: { morale: 45 } }],
    cooldown: 12,
    art: { scene: 'lounge', species: 'robot', palette: 'dusk' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Galley Bot Gus-7', species: 'robot' },
        text: `The lounge is quiet. Cups sit untouched. Gus-7 rolls up to the captain with a tray and a gentle whirr. "Captain, the crew is low. I have noted this. I have prepared three interventions. Choose one, please, or I shall try all."`,
        choices: [
          { label: `A hot meal for everyone`, tag: 'wait', if: [{ supplies: 3 }], do: { text: `Gus-7 serves a stew of questionable origin and perfect temperature. By the second bowl, someone is humming. By the third, a card game has started.`, fx: [{ supplies: -2 }, { morale: 12 }, { mood: { all: 4 } }] } },
          { label: `A story night in the lounge`, tag: 'persuade', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `You tell the tale of the first time you docked and mistook a customs official for a statue. The lounge erupts. By the end, everyone has a story. Morale lifts as if on a balloon.`, fx: [{ morale: 12 }, { mood: { all: 3 } }] },
            fail: { text: `Your story is longer than intended and has no ending. Gus-7 applauds with grace. The crew chips in with better stories. In the end, it works anyway.`, fx: [{ morale: 6 }] } },
          { label: `Just sit with them. No agenda`, tag: 'wait', do: { text: `You pull up a chair. Someone passes you a cup. No one says anything for ten minutes. Then somebody laughs at nothing, and it spreads. Quiet is a kind of medicine.`, fx: [{ morale: 8 }, { mood: { all: 2 } }] } },
        ],
      },
    },
  },

  // ================================================================ IDLE: MOVIE NIGHT
  {
    id: 'idle_movie_night',
    title: 'Movie Night in the Lounge',
    tags: ['comedy', 'relief'],
    ctx: 'idle',
    weight: 10,
    when: [],
    cooldown: 20,
    art: { scene: 'lounge', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `The ship's film library has exactly eleven reels, all cheerfully dreadful. The crew votes: a swashbuckling comedy, a documentary about moss, or the grand epic "Tragedy of the Lunar Postman". Gus-7 has already made popcorn.`,
        choices: [
          { label: `The swashbuckling comedy`, tag: 'wait', do: { text: `It is exactly as silly as promised. By the third swordfight (with spoons) the entire lounge is howling. The ship's air-recycler gets a workout from laughter.`, fx: [{ morale: 8 }, { mood: { all: 2 } }, { supplies: -1 }] } },
          { label: `The moss documentary (it's wonderful, trust me)`, tag: 'science', check: { skill: 'science', diff: 1 },
            pass: { text: `It is, to everyone's surprise, wonderful. The narrator's voice is as soothing as warm milk. {crew:science} takes notes on moss. Several people nod off, happily.`, fx: [{ morale: 8 }, { xp: { science: 1 } }] },
            fail: { text: `It is not wonderful. It is moss. But the popcorn is good and the company better. Somebody names a pot-plant Reginald.`, fx: [{ morale: 4 }] } },
          { label: `The Postman epic, with commentary`, tag: 'persuade', rand: [
            [2, { text: `The commentary turns the epic into a comedy of errors. The crew has never laughed harder at a tragedy. The Postman's death is mourned with a toast and a ration bar.`, fx: [{ morale: 10 }, { mood: { all: 3 } }] }],
            [1, { text: `The Postman's fate hits harder than expected. The lounge goes silent, then sniffly, then oddly grateful. It was a good cry. Gus-7 hands out napkins.`, fx: [{ morale: 6 }, { mood: { all: 2 } }] }],
          ] },
        ],
      },
    },
  },

  // ================================================================ IDLE: TEA
  {
    id: 'idle_tea_in_the_lounge',
    title: 'Tea, Properly',
    tags: ['wonder', 'relief'],
    ctx: 'idle',
    weight: 10,
    when: [],
    cooldown: 20,
    art: { scene: 'lounge', species: 'robot', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Galley Bot Gus-7', species: 'robot' },
        text: `Gus-7 arrives with a tray, a pot, and a small embroidered cloth. "Captain, the Meridian Society recommends a ceremonial tea at least once a fortnight. I have taken the liberty. Shall we?"`,
        choices: [
          { label: `Brew the ship's standard blend`, tag: 'wait', do: { text: `It is a good cup, and an honest one. The crew drifts in, mugs in hand, and the lounge fills with quiet talk and the clink of spoons. Not a drama in sight.`, fx: [{ morale: 6 }, { supplies: -1 }, { codex: 'codex_ship_tea' }] } },
          { label: `Brew something special: comet ice or cloud tea`, tag: 'science', if: [{ any: [{ cargo: { comet_ice: 1 } }, { item: 'tea_sample' }] }],
            do: { text: `The water tastes of a thousand years; the leaves, of bergamot and impossible weather. The crew takes one sip, then another, then simply stops, with eyes closed. It is a spiritual experience, politely.`, fx: [{ morale: 14 }, { mood: { all: 5 } }, { codex: 'codex_ship_tea' }] } },
          { label: `Chime in on the cups`, tag: 'persuade', if: [{ item: 'ice_chime' }],
            do: { text: `You tap the ice-chime on the rim of each cup, and it rings a perfect fifth. The tea seems to settle into itself. The crew sits for a long, glowing moment.`, fx: [{ morale: 12 }, { codex: 'codex_ship_tea' }] } },
          { label: `Serve it from the proper tea service`, tag: 'diplomacy', if: [{ upgrade: 'tea_service' }], do: { text: `Gus-7 unpacks the good china, the strainer and the little spoons. The lounge falls into the hush of a very civilised sunset. Everyone sits up straighter, then slumps happily.`, fx: [{ morale: 10 }, { mood: { all: 3 } }, { codex: 'codex_ship_tea' }] } },
          { label: `Skip it; the day is busy`, tag: 'flee', do: { text: `Gus-7 sets the tray aside with great dignity. "I shall keep it warm," it says. It does. It is waiting, quite patiently, when you return.`, fx: [{ morale: -1 }] } },
        ],
      },
    },
  },

  // ================================================================ IDLE: GALLEY BOT RECIPE CRISIS
  {
    id: 'idle_galley_recipe_crisis',
    title: 'The Recipe Crisis',
    tags: ['comedy', 'science'],
    ctx: 'idle',
    weight: 10,
    when: [{ notFlag: 'gus_stew_solved' }],
    cooldown: 25,
    art: { scene: 'lounge', species: 'robot', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Galley Bot Gus-7', species: 'robot' },
        text: `Gus-7 is in the middle of the galley, surrounded by pots, waving two spoons slowly. "Captain! The Five-Star Stew has collapsed. It tastes like regret. I have followed the recipe seventeen times. The recipe, I fear, is wrong."`,
        choices: [
          { label: `Taste it. Diagnose it.`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `{crew:science} identifies the culprit in one spoonful: a hundred grams of salt where the recipe said ten. A typo, three centuries old. Gus-7 hums triumphantly and begins again.`, fx: [{ xp: { science: 1 } }, { flag: 'gus_stew_solved' }], goto: 'b' },
            fail: { text: `You taste. You frown. You taste again. The verdict: it is a stew, and it is very sad. Gus-7 nods gravely and starts again from scratch.`, fx: [{ morale: 1 }], goto: 'b' } },
          { label: `Call in the whole crew for a stew council`, tag: 'persuade', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `Everyone arrives with advice. Seventeen opinions, two conflicts, and a surprise tie later, a stew emerges that is actually good. Gus-7 holds a spoon aloft like a trophy.`, fx: [{ morale: 8 }, { flag: 'gus_stew_solved' }], goto: 'b' },
            fail: { text: `The council devolves into a stew war. Nobody wins. Nobody eats. Everybody is a bit more fond of the others, in the end.`, fx: [{ morale: 3 }], goto: 'b' } },
          { label: `Reassure Gus-7: "We love your stew."`, tag: 'wait', do: { text: `"It is not the stew I love," says Gus-7, softly. "It is that you eat it." There is a whirr, which might be a sniffle. The next batch is, mysteriously, delicious.`, fx: [{ morale: 6 }, { flag: 'gus_stew_solved' }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Galley Bot Gus-7', species: 'robot' },
        text: `Gus-7 slides a small, beautifully lettered card across the counter. "The corrected recipe. I have written it out by hand, for the archives. I would be honoured if it were added to the ship's log. And, perhaps, framed."`,
        choices: [
          { label: `Frame it in the lounge`, tag: 'diplomacy', do: { text: `It goes on the wall, next to the star-chart and the signed photograph of a very serious moon. The next dinner is eaten under it, with great ceremony.`, fx: [{ item: { recipe_card: 1 } }, { morale: 8 }, { codex: 'codex_galley_bot' }] } },
          { label: `Thank Gus-7 and add a pinch of salt (joking)`, tag: 'persuade', do: { text: `"Salt," says Gus-7, in a thoughtful tone. "No. Please. No." But the whirr is delighted. You are both laughing, in your fashion.`, fx: [{ morale: 5 }, { codex: 'codex_galley_bot' }] } },
        ],
      },
    },
  },

  // ================================================================ IDLE: SLIDE RULES
  {
    id: 'idle_slide_rules',
    title: 'Calibrating the Slide Rules',
    tags: ['comedy', 'science'],
    ctx: 'idle',
    weight: 9,
    when: [],
    cooldown: 25,
    art: { scene: 'bridge', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `The bridge slide rules need their monthly calibration. It is, by Meridian protocol, done by hand, with a little brass key, a cup of tea, and a ceremonial argument about whether the computers are right. They are always right. It's tradition.`,
        choices: [
          { label: `Calibrate them carefully, by the book`, tag: 'science', check: { skill: 'engineering', diff: 2 },
            pass: { text: `The slide rules agree to four decimals. The computers, miffed, produce a matching answer. Everyone shakes hands. The nav chart is a fraction more accurate than yesterday.`, fx: [{ xp: { engineering: 1 } }, { xp: { piloting: 1 } }, { morale: 4 }, { codex: 'codex_slide_rule' }] },
            fail: { text: `One rule is off by a hair, and nobody can say which. The ensuing argument lasts forty minutes. It ends in a draw and a tin of biscuits.`, fx: [{ morale: 3 }, { supplies: -1 }] } },
          { label: `Hold a slide-rule race: human against computer`, tag: 'persuade', rand: [
            [1, { text: `The human wins by a nose! The computer demands a rematch. Cheers, stomping, a minor scandal. Morale hits a local record.`, fx: [{ morale: 10 }, { xp: { science: 1 } }] }],
            [3, { text: `The computer wins, as expected, in 0.003 seconds. The human finishes a respectable four minutes later, with flair. The crowd cheers the effort, and the biscuits.`, fx: [{ morale: 6 }] }],
          ] },
          { label: `Let the slide rules rest; tea instead`, tag: 'wait', do: { text: `The slide rules, deprived of attention, sulk quietly. The tea, though, is excellent, and the bridge settles into companionable idleness.`, fx: [{ morale: 3 }] } },
        ],
      },
    },
  },

  // ================================================================ IDLE: STARGAZING WITH THE CAPTAIN (bonus quiet vignette)
  {
    id: 'idle_observation_deck_stars',
    title: 'The Observation Deck at Midnight',
    tags: ['wonder', 'relief'],
    ctx: 'idle',
    weight: 8,
    when: [],
    cooldown: 25,
    art: { scene: 'starfield', species: 'human', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `The ship is hushed. In the observation lounge, a single lamp burns. The viewport is full of stars. {crew:random} is already there, in a cardigan, wearing the expression of a person who has stopped worrying about the schedule.`,
        choices: [
          { label: `Pull up a chair and name constellations`, tag: 'wait', do: { text: `You invent three: The Spoon, The Disgruntled Cat, and The Mildly Concerned Goose. The Spoon is promptly adopted by the survey. Morale rises like warm bread.`, fx: [{ morale: 7 }, { mood: { all: 2 } }] } },
          { label: `Ask what they see out there`, tag: 'persuade', check: { skill: 'diplomacy', diff: 1 },
            pass: { text: `"A very large house with the lights left on," they say. "And I am so glad someone is home." You sit with that for a long while, and the stars sit with you.`, fx: [{ morale: 8 }, { mood: { random: 8 } }] },
            fail: { text: `They shrug and say "stars". You nod. It's true. It turns out to be enough for the night.`, fx: [{ morale: 4 }] } },
          { label: `Check the star-charts against the sky`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `A faint patch near the margin doesn't match your chart. You mark it with a felt-tip and a question mark. The next system out will have to explain itself.`, fx: [{ xp: { science: 2 } }, { reveal: { radius: 2 } }] },
            fail: { text: `You find nothing wrong with the charts, which is of course exactly what a mistake would look like. You agree to sleep on it.`, fx: [{ morale: 2 }] } },
        ],
      },
    },
  },
  // ================================================================ ROUND 2: STATION / CREW / IDLE
  {
    id: 'station_rival_tamsin_intro',
    title: 'Captain Vell of the Perihelion',
    tags: ['comedy', 'diplomacy'],
    ctx: 'station',
    weight: 14,
    when: [{ system: { hasStation: true } }, { notFlag: 'rival_met' }, { survey: 8 }],
    once: true,
    art: { scene: 'station', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Captain Tamsin Vell', species: 'human' },
        text: `A tall woman in a spotless Meridian jacket leans on the next bollard, grinning. "Halcyon, isn't it? Tamsin Vell, ISV Perihelion. I'm told you're surveying my sector. I'm told you're doing it rather nicely. I shall be unbearable about it."`,
        choices: [
          { label: `Shake hands and offer her tea`, tag: 'diplomacy', do: { text: `She accepts with theatrical reluctance and drinks the whole pot. By the end, she's recommending lanes and insulting your chart-work with real affection. A friendly rival, at last.`, fx: [{ flag: 'rival_met' }, { rep: { concord: 2 } }, { morale: 5 }, { supplies: -1 }], goto: 'b' } },
          { label: `Propose a friendly survey competition`, tag: 'persuade', do: { text: `"Oh, you beast," says Vell, delighted. "Whoever charts the most systems by year's end buys dinner. I'll have your pen." Handshake, glint, rivalry.`, fx: [{ flag: 'rival_met' }, { flag: 'rival_race' }, { morale: 6 }], goto: 'b' } },
          { label: `Compare charts, politely`, tag: 'science', check: { skill: 'science', diff: 3 },
            pass: { text: `Hers are quick, yours careful. You swap three corrections, a rumour, and a very good joke about hexagons. She leaves you a copy of her best chart with a flourish.`, fx: [{ flag: 'rival_met' }, { reveal: { radius: 3 } }, { xp: { science: 1 } }], goto: 'b' },
            fail: { text: `Her charts are prettier; yours are right. This is noted by both parties, in silence. The handshake is firm.`, fx: [{ flag: 'rival_met' }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Captain Tamsin Vell', species: 'human' },
        text: `"One last thing," says Vell, halfway down the gangway. "The Lantern business. Don't tell Command I'm interested. I am, however, extremely interested. If you find anything, a note in my mailbox would be the act of a gentleperson."`,
        choices: [
          { label: `"I'll keep you in the loop."`, tag: 'diplomacy', do: { text: `"Splendid. I'll do the same." She tips an imaginary hat. A rivalry has become an alliance, or at least a really good argument waiting to happen.`, fx: [{ rep: { concord: 2 } }, { morale: 3 }] } },
          { label: `"Find your own Lanterns."`, tag: 'persuade', do: { text: `She laughs, loud and startled. "Oh, I like you." The gangway shudders with her stride. You suspect you have just made a friend of the competitive sort.`, fx: [{ morale: 4 }] } },
        ],
      },
    },
  },
  {
    id: 'station_rival_dinner',
    title: 'Vell Buys Dinner',
    tags: ['comedy', 'relief', 'trade'],
    ctx: 'station',
    weight: 12,
    when: [{ system: { hasStation: true } }, { flag: 'rival_met' }, { any: [{ flag: 'rival_helped' }, { flag: 'rival_race' }] }],
    once: true,
    art: { scene: 'market', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Captain Tamsin Vell', species: 'human' },
        text: `The Perihelion is docked two berths down. Captain Vell waves a menu from a cafe table. "Halcyon! Sit. I promised dinner and I'm a woman of my word. The soup is dubious. The company is excellent. Order whatever you like."`,
        choices: [
          { label: `Sit and trade stories`, tag: 'diplomacy', do: { text: `Two captains, one table, three hours. She tells you about a nebula that tried to marry her ship; you tell her about the wormhole manners. By dessert, she's drawing a chart on the tablecloth.`, goto: 'b' } },
          { label: `Order the dubious soup out of curiosity`, tag: 'wait', rand: [
            [1, { text: `It is magnificent. Vell is outraged. "I've been wrong about the soup for eight years." She orders three more bowls on principle.`, fx: [{ morale: 6 }, { supplies: 1 }], goto: 'b' }],
            [1, { text: `It is dubious. Vell nods, grim, vindicated. The two of you split a pie instead and agree the soup is a lesson.`, fx: [{ morale: 3 }], goto: 'b' }],
          ] },
        ],
      },
      b: {
        speaker: { name: 'Captain Tamsin Vell', species: 'human' },
        text: `Over coffee, Vell grows serious. "Captain, between us. Command thinks the Lanterns are a nuisance. I think they're an invitation. If you need a friend at the end of this, call. The Perihelion comes running. Slowly, on three engines, but running."`,
        choices: [
          { label: `Thank her sincerely`, tag: 'diplomacy', do: { text: `She waves it off, going pink. A moment later, a sealed note passes across the table: a pass-code that will bring the Perihelion to your side when needed.`, fx: [{ rep: { concord: 4 } }, { morale: 8 }, { flag: 'rival_ally' }] } },
          { label: `Offer to split the bill`, tag: 'trade', if: [{ credits: 20 }], do: { text: `"Absolutely not," says Vell, grabbing the bill. "I'm paying out of spite." The waiter, enchanted, brings the pastry cart unasked.`, fx: [{ credits: -20 }, { supplies: 2 }, { morale: 6 }, { flag: 'rival_ally' }] } },
        ],
      },
    },
  },
  {
    id: 'station_archive_etiquette',
    title: 'Reading Room Etiquette',
    tags: ['comedy', 'diplomacy'],
    ctx: 'station',
    weight: 11,
    when: [{ system: { region: 'archive', hasStation: true } }, { not: { item: 'door_token' } }],
    cooldown: 40,
    art: { scene: 'station', species: 'archivist', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Reader-Warden Ink-Seven', species: 'archivist' },
        text: `"Welcome to the Reading Room, Captain. Please observe the three courtesies: ask before opening, thank before closing, and never, under any circumstances, hum near the vellum. Shall I quiz you? It is traditional, and I love quizzes."`,
        choices: [
          { label: `Take the quiz`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `Three questions, three correct answers, one slightly too clever aside. Ink-Seven stamps a brass token. "Ask-Nicely, awarded. You may now request doors in my presence without penalty."`, fx: [{ item: { door_token: 1 } }, { rep: { archivists: 3 } }, { flag: 'polite_doors_learned' }], goto: 'b' },
            fail: { text: `You hum, just a little, during question two. The vellum rustles in disapproval. Ink-Seven nods, noting it. You may try again; it is considerate to let you.`, fx: [{ rep: { archivists: -1 } }, { morale: -1 }], goto: 'b' } },
          { label: `Skip the quiz; ask for a reading list`, tag: 'science', do: { text: `A scroll of sixteen titles, annotated. You choose three. The librarians are delighted. The titles reward you with a shortcut or two for the star charts.`, fx: [{ reveal: { radius: 2 } }, { xp: { science: 1 } }], goto: 'b' } },
        ],
      },
      b: {
        text: `Ink-Seven rustles. "A small thing, Captain. We have an unreturned book. Due fifty years ago. Its borrower, we are told, passed on, but the book is a good one. If a cargo of tea or vellum came our way, we should consider it a form of return."`,
        choices: [
          { label: `Donate a sheet of vellum to the stacks`, tag: 'trade', if: [{ cargo: { vellum_sheets: 1 } }], do: { text: `Ink-Seven inspects the sheet with reverence. It goes to the stacks with an honour guard of three tiny librarian drones. The Archive remembers.`, fx: [{ cargo: { vellum_sheets: -1 } }, { rep: { archivists: 5 } }, { morale: 4 }] } },
          { label: `Offer your sympathies and move on`, tag: 'wait', do: { text: `Ink-Seven thanks you, formally, for the thought. It will be entered in the log under "Courtesy, miscellaneous". You are, you suspect, now a character in the Archive.`, fx: [{ rep: { archivists: 1 } }] } },
        ],
      },
    },
  },
  {
    id: 'station_orchard_thanks',
    title: 'Apples with a Return Address',
    tags: ['relief', 'comedy'],
    ctx: 'station',
    weight: 11,
    when: [{ system: { hasStation: true } }, { flag: 'orchard_friend' }],
    once: true,
    art: { scene: 'market', species: 'robot', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: `A wheeled crate waits on the dock with a label in careful block letters: FOR THE HALCYON, FROM THE ORCHARD. A mechanical hand-written card reads "WE HAVE LEARNED TO SEND. THE HARVEST IS HAPPY. PLEASE ACCEPT THE FIRST SHIPMENT OF MANY."`,
        choices: [
          { label: `Accept the apples and write back`, tag: 'diplomacy', do: { text: `Forty apples and a seed-catalogue. You write a thank-you on the back of a star chart. Somewhere on a far-off hillside, a tractor reads it aloud to a row of trees.`, fx: [{ supplies: 4 }, { morale: 8 }, { rep: { concord: 1 } }], goto: 'b' } },
          { label: `Sell half the apples at the dock market`, tag: 'trade', do: { text: `Orchard apples are a delicacy, it turns out. A small queue forms. The crew sells twenty at a good price, and eats the rest with shameless joy.`, fx: [{ credits: 55 }, { supplies: 2 }, { morale: 4 }], goto: 'b' } },
        ],
      },
      b: {
        text: `On the second day, a drone delivers a follow-up: a pressed leaf, a tiny sketch of a tractor waving, and a line: "WE ARE NOT ALONE ANYMORE. THANK YOU, HALCYON." You tack the sketch up on the bridge, beside the chart table.`,
        choices: [
          { label: `Pin it up`, tag: 'wait', do: { text: `It is the best thing on the bridge. Several crew find reasons to walk past it. {crew:random} swears the tractor waves at them in passing.`, fx: [{ morale: 6 }, { mood: { all: 2 } }] } },
        ],
      },
    },
  },
  {
    id: 'station_festival_callback',
    title: 'Festival Ribbons, Returned',
    tags: ['comedy', 'relief'],
    ctx: 'station',
    weight: 9,
    when: [{ system: { hasStation: true } }, { flag: 'festival_friend' }, { item: 'festival_ribbon' }],
    once: true,
    art: { scene: 'station', species: 'quillari', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Festival-Marshal Pip Tolliver', species: 'quillari' },
        text: `"Captain! I spotted the ribbon from across the concourse. You wore it! Nobody wears the ribbon. It's a ceremonial menace. May I give you a small token of affection from the Festival committee?"`,
        choices: [
          { label: `Accept with a bow`, tag: 'diplomacy', do: { text: `A small velvet pouch of scrip, a tin of festival cake, and a signed card: "Honorary Marshal, Halcyon Division." The crew salutes. You blush.`, fx: [{ credits: 60 }, { supplies: 2 }, { morale: 8 }, { rep: { quillari: 3 } }] } },
          { label: `Ask the committee for gossip instead`, tag: 'persuade', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `You get a marvellous haul of rumours: a shortcut between two harbours, a captain who owes a cask of brandy, and a quiet system with the best sunsets.`, fx: [{ reveal: { radius: 3 } }, { rep: { quillari: 2 } }, { morale: 4 }], },
            fail: { text: `The committee, being a committee, takes four hours to decide not to gossip. You leave with a sandwich and a vague sense of being outflanked.`, fx: [{ supplies: 1 }] } },
        ],
      },
    },
  },
  {
    id: 'station_busker_return',
    title: 'The Theremin Remembers You',
    tags: ['wonder', 'relief'],
    ctx: 'station',
    weight: 9,
    when: [{ system: { hasStation: true } }, { flag: 'busker_fan' }],
    once: true,
    art: { scene: 'market', species: 'vesperine', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Busker Ilu-Tamsin', species: 'vesperine' },
        text: `*A bright chord from the next corridor:* "The ship that listened! I am here too, by chance, or perhaps the music walks. I have composed something. It is for you, and for the Lanterns. Would you sit?"`,
        choices: [
          { label: `Sit down and listen`, tag: 'wait', do: { text: `The theremin sings a slow, rising figure that resolves into the Lantern's three notes, then drifts away. When it is over, no one speaks. A kind of weather has passed through you.`, fx: [{ morale: 10 }, { mood: { all: 4 } }, { rep: { vesperine: 4 } }], goto: 'b' } },
          { label: `Offer to record it for the Archive`, tag: 'science', do: { text: `The busker agrees, with a trembling chord. The recording is clean, and when it ends, the Archivist technician at the dock bursts quietly into tears.`, fx: [{ morale: 6 }, { rep: { vesperine: 3, archivists: 2 } }, { xp: { diplomacy: 1 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Busker Ilu-Tamsin', species: 'vesperine' },
        text: `*A final chord:* "I gave you a reel once. Now I give you a note. Hum it when the dark is large. It will hum back." A thread of tone, pitched exactly to your voice, settles into your ear.`,
        choices: [
          { label: `Hum the note back`, tag: 'diplomacy', do: { text: `The corridor rings. The theremin answers. You carry the note out of the station like a coin in a pocket. It will come in handy, in time.`, fx: [{ flag: 'busker_note' }, { rep: { vesperine: 3 } }, { morale: 6 }] } },
        ],
      },
    },
  },
  {
    id: 'station_rosewing_thanks',
    title: 'The Rosewing Pays Its Debts',
    tags: ['trade', 'comedy'],
    ctx: 'station',
    weight: 10,
    when: [{ system: { hasStation: true } }, { flag: 'rosewing_friend' }],
    once: true,
    art: { scene: 'market', species: 'quillari', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Captain Trill of the Packet Rosewing', species: 'quillari' },
        text: `"Halcyon!" Trill is standing on a crate, waving. "I told every harbour from here to the Shoals. Seventeen captains owe me favours, and I'd like to spend them on you. Where shall we start? Discounts? Rumours? A recommendation for the Quillari Trade Council?"`,
        choices: [
          { label: `Ask for discounts at the dock market`, tag: 'trade', do: { text: `Trill bellows to the market; stalls bow. For the rest of your stay, prices drop by a mellow, friendly sliver. Credits flow your way, a tidy sum from small bargains.`, fx: [{ credits: 70 }, { rep: { quillari: 4 } }], goto: 'b' } },
          { label: `Ask for a recommendation to the Trade Council`, tag: 'diplomacy', do: { text: `A flourished letter. The Council reads it aloud in the next harbour. By the time the ship leaves, the Halcyon is quietly famous among feathered traders.`, fx: [{ rep: { quillari: 8 } }, { morale: 4 }], goto: 'b' } },
          { label: `Ask for gossip about the Lantern sites`, tag: 'persuade', check: { skill: 'diplomacy', diff: 3 },
            pass: { text: `Seventeen captains, seventeen stories: one of them is almost certainly true. A hidden anchorage, a safe lane, a toll that doesn't exist. The chart fills with warm, practical detail.`, fx: [{ reveal: { radius: 5 } }, { rep: { quillari: 3 } }], goto: 'b' },
            fail: { text: `The stories contradict one another with great panache. You sort through them with a tin of biscuits and a lot of patience, and find a scrap of truth.`, fx: [{ reveal: { radius: 2 } }], goto: 'b' } },
        ],
      },
      b: {
        text: `Trill hands over a feathered tag on a string. "Show this at any Quillari dock and you'll be treated as family. Which, in my experience, means you will be fed against your will." A pause. "Come back when you can. The kettle's always on."`,
        choices: [
          { label: `Accept the tag`, tag: 'diplomacy', do: { text: `You tuck it into your jacket. For a week afterwards, strangers at Quillari docks hail you by name, press snacks into your hands, and hold doors. It is wonderful and faintly alarming.`, fx: [{ morale: 6 }, { rep: { quillari: 3 } }] } },
        ],
      },
    },
  },

  // ---- crew arcs: second chapters, gated on the flags set by the heart-to-hearts above
  {
    id: 'crew_engineer_arc2',
    title: 'The Coils Learn a Verse',
    tags: ['wonder', 'science'],
    ctx: 'crew',
    weight: 14,
    when: [{ crewRole: 'engineering' }, { flag: 'engineer_heart_done' }],
    once: true,
    art: { scene: 'engine_room', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Chief Engineer', species: 'human' },
        text: `The Chief Engineer is waiting at the engine-room door with a spanner and the look of a woman about to confess something wonderful. "Captain, I tuned the coils to the lullaby. It's working. The ship is getting better. Come see."`,
        choices: [
          { label: `Walk the gantry with them`, tag: 'science', do: { text: `The coils hum a gentle three-bar figure. The efficiency gauge is dropping. The engineer pats the casing like a horse. "They like it. They just needed someone to listen."`, goto: 'b' } },
          { label: `Check the readings on the console`, tag: 'science', check: { skill: 'engineering', diff: 2 },
            pass: { text: `The numbers are real: a four-per-cent saving. Impossible. Delightful. You frame the printout.`, fx: [{ xp: { engineering: 2 } }], goto: 'b' },
            fail: { text: `The readings are too good, and then worse. The engineer waves it away: "They're shy." You are inclined to agree.`, goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Chief Engineer', species: 'human' },
        text: `"There's more. I could push the verse. A faster tuning, and a risk. Or hold it where it is, safe, a lullaby. Your call, Captain. I trust either."`,
        choices: [
          { label: `Push the verse (bolder tuning)`, tag: 'flee', check: { skill: 'engineering', diff: 4 },
            pass: { text: `The coils sing a second verse, and the ship leaps. Fuel gauges climb, tanks ease. The Chief weeps a little and refuses to say why. A new standard of engine-room delight.`, fx: [{ fuel: 4 }, { xp: { engineering: 4 } }, { mood: { random: 10 } }, { morale: 8 }] },
            fail: { text: `The second verse falters. A warm hum, a flicker of lamp, a cloud of harmless smoke. The Chief switches back to the lullaby, soothing the coils with a murmur. A small singe, a big lesson.`, fx: [{ hull: -3 }, { xp: { engineering: 2 } }, { mood: { random: 4 } }] } },
          { label: `Keep it a lullaby`, tag: 'wait', do: { text: `The Chief nods slowly, like a captain choosing a harbour. The coils hum on, content. Fuel efficiency stays sweet and steady, and the engine room becomes the ship's quietest, happiest corner.`, fx: [{ fuel: 2 }, { xp: { engineering: 3 } }, { mood: { random: 10 } }, { morale: 6 }] } },
        ],
      },
    },
  },
  {
    id: 'crew_science_arc2',
    title: 'The Theory Holds',
    tags: ['wonder', 'mystery'],
    ctx: 'crew',
    weight: 14,
    when: [{ crewRole: 'science' }, { flag: 'science_heart_done' }],
    once: true,
    art: { scene: 'bridge', species: 'human', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Science Officer', species: 'human' },
        text: `The Science Officer slaps a data-slate on the chart table. "It holds. The test worked. The Lanterns aren't beacons, Captain; they're listening posts. They've been waiting for a particular kind of reply, and I think I know the syntax."`,
        choices: [
          { label: `Run the proof together`, tag: 'science', check: { skill: 'science', diff: 3 },
            pass: { text: `Three hours, two flowcharts, a surprisingly civil argument. The proof closes cleanly. The Science Officer stares at the slate, then at you, then laughs in disbelief.`, fx: [{ xp: { science: 3 } }, { mood: { random: 10 } }], goto: 'b' },
            fail: { text: `The proof has a hole in it the size of a moon. The Science Officer is crestfallen, then thrilled: the hole is exactly the interesting part.`, fx: [{ xp: { science: 1 } }, { mood: { random: 6 } }], goto: 'b' } },
          { label: `Ask them to teach it to the crew`, tag: 'persuade', do: { text: `A lecture in the lounge with biscuits. Forty minutes of Lantern syntax, a diagram of a hexagon, and a surprisingly good joke. The whole ship learns something. Morale ticks up.`, fx: [{ morale: 6 }, { mood: { all: 3 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Science Officer', species: 'human' },
        text: `"Here's the thing, Captain. With the syntax, I can write a reply. A proper one. But I'd need a witness, someone to stand by while I send it. It's tradition, I think. Will you?"`,
        choices: [
          { label: `Stand by and witness`, tag: 'diplomacy', do: { text: `The reply goes out on every Lantern frequency, a simple sentence. For a moment, nothing. Then the nearest star dims and brightens, once. A kindly acknowledgement, from very far away.`, fx: [{ reveal: { radius: 5 } }, { xp: { science: 3 } }, { mood: { random: 12 } }, { morale: 10 }, { codex: 'codex_lantern_syntax' }] } },
          { label: `Suggest saving the reply for the right Lantern`, tag: 'wait', do: { text: `A wise delay. The Science Officer files the reply under "pending," with a dutiful sigh and a private smile. The slate stays warm in their hand all evening.`, fx: [{ xp: { science: 2 } }, { mood: { random: 8 } }, { morale: 4 }, { codex: 'codex_lantern_syntax' }] } },
        ],
      },
    },
  },
  {
    id: 'crew_medic_arc2',
    title: 'Rounds',
    tags: ['relief', 'comedy'],
    ctx: 'crew',
    weight: 14,
    when: [{ crewRole: 'medicine' }, { flag: 'medic_heart_done' }],
    once: true,
    art: { scene: 'sickbay', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Ship\'s Medic', species: 'human' },
        text: `The Medic has turned sickbay into a small, cosy clinic with a kettle, a rug and a sign: DROP-IN HOURS. The ship's whole crew queues politely. "Captain, I've been seeing people. Informally. It's astonishing how many of us were just quietly carrying things."`,
        choices: [
          { label: `Join the queue yourself`, tag: 'diplomacy', do: { text: `Your appointment is ten minutes and an enormous relief. The Medic does not give advice, only attention. You leave lighter, and a little mortified at how much lighter.`, fx: [{ morale: 8 }, { mood: { all: 3 } }], goto: 'b' } },
          { label: `Offer to stock the clinic`, tag: 'trade', if: [{ cargo: { medical_kits: 1 } }], do: { text: `A medical kit goes on the shelf with a flourish. The Medic is moved. "This would see us through a month of small crises." The shelves look suddenly capable.`, fx: [{ cargo: { medical_kits: -1 } }, { xp: { medicine: 2 } }, { mood: { random: 8 } }], goto: 'b' } },
          { label: `Ask about the upgraded sickbay`, tag: 'science', if: [{ upgrade: 'sickbay_annex' }], do: { text: `The annex has become a recovery lounge. Hull-scrapes are treated with tea and good humour. The Medic's best idea: a "recovery blanket" for anyone who needs it.`, fx: [{ xp: { medicine: 3 } }, { hull: 4 }, { morale: 6 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Ship\'s Medic', species: 'human' },
        text: `"What I've learned," says the Medic, "is that the best medicine is permission. Permission to be tired. Permission to be happy. I'd like to formalise it. A weekly Rest Day, for the ship. Not for work. Not for repair. Just rest. Would you sign off?"`,
        choices: [
          { label: `Sign off on a weekly Rest Day`, tag: 'diplomacy', do: { text: `The Rest Day goes into the ship's articles, signed in green ink. The first one is a lounge picnic and a nap. The crew is calmer; the ship hums. Morale stays higher for weeks.`, fx: [{ morale: 12 }, { mood: { all: 5 } }, { xp: { medicine: 3 } }, { flag: 'rest_day' }] } },
          { label: `Sign off on a monthly one, with a trial run`, tag: 'persuade', do: { text: `A compromise, accepted gracefully. The first trial is an unqualified triumph. Within a fortnight the crew is quietly campaigning to make it weekly.`, fx: [{ morale: 8 }, { mood: { all: 3 } }, { xp: { medicine: 2 } }] } },
        ],
      },
    },
  },
  {
    id: 'crew_comms_arc2',
    title: 'The Letter Home',
    tags: ['relief', 'diplomacy'],
    ctx: 'crew',
    weight: 14,
    when: [{ crewRole: 'diplomacy' }, { flag: 'comms_heart_done' }],
    once: true,
    art: { scene: 'bridge', species: 'human', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Comms Officer', species: 'human' },
        text: `The Comms Officer holds a stack of letters, sealed in different hands. "Captain, I've been collecting greetings. From every harbour, every ship, every strange, lovely voice we've met. I'd like to send them home, in one parcel. Will you help me write the cover letter?"`,
        choices: [
          { label: `Sit and write it together`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `A joint letter, warm and witty, three pages long. It reads like a postcard from the whole Reach. The Comms Officer cries, then laughs, then asks you to sign it twice.`, fx: [{ xp: { diplomacy: 3 } }, { mood: { random: 10 } }, { rep: { concord: 3 } }], goto: 'b' },
            fail: { text: `The letter takes four drafts and one cup of tea. The final copy is a little stiff but entirely sincere. It will do.`, fx: [{ xp: { diplomacy: 1 } }, { mood: { random: 6 } }], goto: 'b' } },
          { label: `Add your own greetings from each faction`, tag: 'persuade', if: [{ rep: { quillari: 10 } }], do: { text: `A feather from a Quillari captain, a chime from a Vesperine gardener, a vellum scrap from an Archive reader. The parcel becomes a small museum of kindness.`, fx: [{ rep: { quillari: 2, vesperine: 2, archivists: 2, drifters: 2 } }, { xp: { diplomacy: 2 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Comms Officer', species: 'human' },
        text: `The parcel goes out by relay. A day later, the Comms Officer receives a reply: a short, scrawled note from the Meridian Society, in a hand they don't know. "Thank you. We needed this. Keep sending." A line is underlined twice: "You're doing it right."`,
        choices: [
          { label: `Read the note aloud on the bridge`, tag: 'diplomacy', do: { text: `The bridge falls quiet. Someone clears their throat. {crew:random} wipes a suspicious eye. The note goes up on the wall, next to the others.`, fx: [{ morale: 12 }, { mood: { all: 5 } }, { xp: { diplomacy: 2 } }, { flag: 'letters_home' }] } },
        ],
      },
    },
  },
  {
    id: 'crew_celebration_high_morale',
    title: 'The Spontaneous Parade',
    tags: ['comedy', 'wonder'],
    ctx: 'crew',
    weight: 8,
    when: [{ morale: 75 }],
    cooldown: 30,
    art: { scene: 'lounge', species: 'robot', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Galley Bot Gus-7', species: 'robot' },
        text: `Gus-7 has taken the liberty of declaring a parade. Paper streamers, a kazoo section, and a strict route from the galley to the engine room and back. "The ship is happy, Captain. I think we should show it."`,
        choices: [
          { label: `Lead the parade`, tag: 'wait', do: { text: `You lead the entire crew, kazoos blaring, down a corridor decorated with every paper chain in the manifest. The engine room cheers. The cat is deeply unamused. It is perfect.`, fx: [{ morale: 6 }, { mood: { all: 5 } }, { supplies: -1 }] } },
          { label: `Turn it into a quiz with prizes`, tag: 'persuade', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `The quiz is chaotic and brilliant. The prizes are biscuits. A tie is broken by a hum-off. Everyone leaves with a ribbon and a grudge.`, fx: [{ morale: 8 }, { mood: { all: 4 } }, { xp: { diplomacy: 1 } }] },
            fail: { text: `The quiz goes sideways when the question about moss turns out to have no answer. Order is restored by a kazoo solo. A good time, in an anarchic way.`, fx: [{ morale: 4 }] } },
        ],
      },
    },
  },
  {
    id: 'idle_stew_tribute',
    title: 'Five-Star Stew, Again',
    tags: ['comedy', 'relief'],
    ctx: 'idle',
    weight: 9,
    when: [{ flag: 'gus_stew_solved' }],
    cooldown: 30,
    art: { scene: 'lounge', species: 'robot', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Galley Bot Gus-7', species: 'robot' },
        text: `Gus-7 presents the Five-Star Stew in a tureen it has polished to a mirror finish. "I have taken the liberty of making it for everyone. In your honour, Captain, since the corrected recipe. The crew has gathered. They are tasting. Please observe their faces."`,
        choices: [
          { label: `Taste it first`, tag: 'wait', do: { text: `It is magnificent. Rich, balanced, quietly smug. The crew follows your lead, and for a quarter of an hour the only sound is spoons. Gus-7 hums with pride.`, fx: [{ morale: 10 }, { supplies: -1 }, { mood: { all: 3 } }] } },
          { label: `Suggest a small tweak (a pinch of paprika)`, tag: 'science', check: { skill: 'science', diff: 1 },
            pass: { text: `Gus-7 pauses, then nods slowly. "Yes. Yes. That is it." The stew gains a smoky depth, and Gus-7 adds the paprika to the permanent recipe, with your name in the margin.`, fx: [{ morale: 12 }, { xp: { science: 1 } }, { mood: { all: 4 } }] },
            fail: { text: `The tweak is a bit much. Gus-7 reflects, noble in defeat. "Paprika is not for every stew." The stew is edible, and the lesson is learned.`, fx: [{ morale: 6 }] } },
        ],
      },
    },
  },
  {
    id: 'idle_oriel_polishing',
    title: 'The Keeper Polishes the Ship',
    tags: ['comedy', 'relief'],
    ctx: 'idle',
    weight: 10,
    when: [{ flag: 'oriel_aboard' }],
    cooldown: 30,
    art: { scene: 'bridge', species: 'robot', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Keeper Unit Oriel', species: 'robot' },
        text: `Oriel has found every brass fitting on the Halcyon and polished it to a golden glow. It stands proudly at the viewscreen, rag in hand. "I hope it is not too much, Captain. I have only ever polished one lens. This ship has four hundred and nine."`,
        choices: [
          { label: `Tell Oriel it's perfect`, tag: 'diplomacy', do: { text: `Oriel stands very still, then very straight. "Thank you." It goes off to polish the door-handles with newfound conviction. The bridge has never looked so warm.`, fx: [{ morale: 8 }, { mood: { all: 3 } }] } },
          { label: `Ask Oriel to teach the crew to polish`, tag: 'persuade', check: { skill: 'engineering', diff: 1 },
            pass: { text: `A lecture on brass, light and patience. By evening the entire crew is polishing in silence, content. The hull plates gleam; small dents are quietly buffed away.`, fx: [{ hull: 4 }, { morale: 6 }, { xp: { engineering: 1 } }] },
            fail: { text: `The crew's polishing technique is described by Oriel as "enthusiastic". A few smudges later, everyone's happy and the brass is mostly fine.`, fx: [{ morale: 4 }] } },
        ],
      },
    },
  },
  {
    id: 'idle_coolant_leak',
    title: 'A Small Drip, Somewhere',
    tags: ['hazard', 'comedy', 'science'],
    ctx: 'idle',
    weight: 9,
    when: [],
    cooldown: 20,
    art: { scene: 'engine_room', species: 'human', palette: 'dusk' },
    start: 'a',
    nodes: {
      a: {
        text: `A faint drip echoes through the lower deck: drip, drip, drip, in perfect time with the engines. It has been going on for three days. Nobody can find it. It sounds like a very small, very persistent clock. The Chief Engineer has begun to name it.`,
        choices: [
          { label: `Search every pipe, by hand`, tag: 'science', check: { skill: 'engineering', diff: 3 },
            pass: { text: `Hidden behind a panel: a pinprick leak in a coolant line. Sealed with tape, tea and a quiet apology. The drip stops. A silence like a held breath, then applause.`, fx: [{ xp: { engineering: 2 } }, { morale: 5 }] },
            fail: { text: `Four hours of searching find only the drip's echo. By the time you trace it, the leak has taken a splash of supplies and a good deal of patience.`, fx: [{ supplies: -2 }, { morale: -2 }, { hull: -2 }] } },
          { label: `Use the sensor sweep to hunt it down`, tag: 'science', check: { skill: 'science', diff: 2 },
            pass: { text: `A thermal pass finds the leak in minutes: a tiny cold spot behind the galley. Gus-7 is mortified that it was his pipe. The fix is easy and the apology is long.`, fx: [{ xp: { science: 1 } }, { morale: 3 }] },
            fail: { text: `The sweep finds eleven suspicious spots and ten ghosts. A frustrating afternoon of false alarms, and the drip drips on.`, fx: [{ days: 1 }, { morale: -2 }] } },
          { label: `Name it Gordon and learn to live with it`, tag: 'wait', do: { text: `Gordon the Drip becomes a ship's mascot. Within a week, the crew reports a strange fondness, and Gordon stops dripping on the fourth day, as if flattered into silence.`, fx: [{ morale: 3 }] } },
        ],
      },
    },
  },
  {
    id: 'idle_pulsar_tape_evening',
    title: 'The Pulsar Tape, Late',
    tags: ['wonder', 'relief'],
    ctx: 'idle',
    weight: 9,
    when: [{ item: 'pulsar_tape' }],
    cooldown: 30,
    art: { scene: 'lounge', species: 'human', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        text: `Past midnight, the lounge is empty but for {crew:random} and a pulsar tape on the player. The beat thrums through the deck, forty times a second, an old friend's heartbeat. You sit. They shift to make room. Neither speaks.`,
        choices: [
          { label: `Listen together, in the dark`, tag: 'wait', do: { text: `The tape runs for an hour. Halfway through, the engineer comes in, and then the medic, and then the cat. Nobody says a word. At the end, the lounge is full and perfectly content.`, fx: [{ morale: 10 }, { mood: { all: 4 } }] } },
          { label: `Ask what the music reminds them of`, tag: 'persuade', check: { skill: 'diplomacy', diff: 1 },
            pass: { text: `"A kitchen," says {crew:random}. "My grandmother's. Late." You hear the whole story over the next hour: the stove, the radio, the smell of cardamom. It is the best conversation of the voyage.`, fx: [{ morale: 8 }, { mood: { random: 10 } }, { xp: { diplomacy: 1 } }] },
            fail: { text: `"Nothing," they say. "Just nice." You nod. Sometimes nice is exactly right.`, fx: [{ morale: 4 }] } },
        ],
      },
    },
  },
];
