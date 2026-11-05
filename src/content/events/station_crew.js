// EVENTS-B: dock-side happenings (ctx 'station'), crew heart-to-hearts and morale (ctx 'crew'), quiet ship-life (ctx 'idle').
//
// ITEMS: (invented item ids; WORLD may rename/describe)
//   theremin_reel    - Busker's Reel: a hand-labelled cassette of a theremin player's finest hour.
//   festival_ribbon  - Festival Ribbon: a hand-dyed ribbon from the Dock Festival, worn on the bridge for luck.
//   luggage_tag      - Brass Luggage Tag: proof you once reunited a stranger with a very small, very important suitcase.
//   recipe_card      - Galley Recipe Card: Gus-7's triumphant "Five-Star Stew", hand-lettered.
//   (also reuses from other files: ice_chime, tea_sample, comet_ice, pulsar_tape - all optional gates, never required)
//
// CODEX: (ids used in {codex:..}; WORLD please cover each)
//   codex_dock_festival    - Dock Festival Customs
//   codex_form_77b         - Concord Form 77-B and Its Discontents
//   codex_theremin         - The Theremin, an Instrument You Do Not Touch
//   codex_slide_rule       - Slide Rules and Why They Still Work
//   codex_galley_bot       - Galley Bot Gus-7: A Biography
//   codex_ship_tea         - Tea Aboard: A Brief Ritual
//
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
        speaker: { name: '{crew:engineering}', species: 'human' },
        text: `The engine room hums its steady bass. {crew:engineering} wipes their hands on a rag that has seen better decades. "Captain, I talk to the warp coils. Is that strange? They talk back, sort of. In vibrations. I think they miss the Gate."`,
        choices: [
          { label: `Ask what the coils are saying`, tag: 'science', do: { text: `They hum a pattern {crew:engineering} has been charting for weeks: a quiet, rising figure that repeats. "I think it's a lullaby," they say, ears pink. "The coils sing it to themselves." You sit in the hum for a while.`, fx: [{ mood: { random: 8 } }, { morale: 4 }, { xp: { engineering: 2 } }], goto: 'b' } },
          { label: `Offer to take a shift on the coils`, tag: 'persuade', check: { skill: 'engineering', diff: 2 },
            pass: { text: `You stand watch for an hour while {crew:engineering} naps in a pile of rags. The coils behave impeccably. The engineer wakes refreshed and mildly suspicious.`, fx: [{ mood: { random: 10 } }, { xp: { engineering: 1 } }], goto: 'b' },
            fail: { text: `You pull the wrong lever and the lights go purple for a minute. {crew:engineering} arrives at a dead run, laughing too hard to scold you.`, fx: [{ mood: { random: 6 } }, { hull: -2 }], goto: 'b' } },
          { label: `Tell them it isn't strange at all`, tag: 'diplomacy', do: { text: `"Everyone talks to something," you say. "I talk to the viewscreen." {crew:engineering} grins. The conversation is brief, but it's one you both remember.`, fx: [{ mood: { random: 8 } }, { morale: 3 }] } },
        ],
      },
      b: {
        speaker: { name: '{crew:engineering}', species: 'human' },
        text: `"Thanks, Captain. Honestly. Most captains want the engines faster. You ask what they're feeling." A pause. A small wrench is pressed into your hand. "For luck. Don't lose it. It's my second-favourite wrench."`,
        choices: [
          { label: `Accept it as a mark of trust`, tag: 'diplomacy', do: { text: `The wrench goes on a hook in your cabin. It doesn't do anything. It does, however, make the cabin feel more like yours.`, fx: [{ morale: 5 }, { mood: { random: 6 } }] } },
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
        speaker: { name: '{crew:science}', species: 'human' },
        text: `{crew:science} is staring at a data-slate with the expression of someone who has found a grain of sand and fears it may be a planet. "Captain, I've a theory about the Lanterns. It's too neat. I distrust it. Will you hear it anyway?"`,
        choices: [
          { label: `Hear it out`, tag: 'science', do: { text: `The theory takes forty minutes and three diagrams. It involves a lot of light, some patience, and a sentence that begins "what if they were never meant to be found by accident?" You nod. It might be right.`, fx: [{ xp: { science: 2 } }, { mood: { random: 8 } }], goto: 'b' } },
          { label: `Ask what would disprove it`, tag: 'persuade', check: { skill: 'science', diff: 2 },
            pass: { text: `A beaming pause. "That's the right question." You draft a test plan together on the back of a menu. By midnight there are three experiments, a flowchart, and a shared sense that the ship is doing real science.`, fx: [{ xp: { science: 3 } }, { mood: { random: 10 } }], goto: 'b' },
            fail: { text: `You ask a good question, badly. {crew:science} answers it before you finish, and then, kindly, answers the one you meant to ask. You both laugh.`, fx: [{ mood: { random: 5 } }], goto: 'b' } },
          { label: `Admit you only half understood it`, tag: 'diplomacy', do: { text: `"Half is plenty," says {crew:science}, relieved. "Most people stop at the first diagram." They draw you a small star on the slate, with a smiley face. You keep it.`, fx: [{ mood: { random: 8 } }, { morale: 3 }] } },
        ],
      },
      b: {
        speaker: { name: '{crew:science}', species: 'human' },
        text: `"I became a scientist because I wanted to know. And now I know a lot, and I find I mostly want to know what I don't. Is that an odd thing to say on a survey ship?" They wait. They really wait.`,
        choices: [
          { label: `"It's the right thing to say."`, tag: 'diplomacy', do: { text: `"Then we're in the right place," says {crew:science}, grinning. They go back to the slate. The glow of its screen lights their face in a way that looks, quite specifically, like happiness.`, fx: [{ mood: { random: 10 } }, { morale: 5 }] } },
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
        speaker: { name: '{crew:medicine}', species: 'human' },
        text: `Sickbay is quiet. {crew:medicine} sits among the neatly labelled drawers, polishing a stethoscope that does not need polishing. "Captain. Nobody's ill. I should be happy. Instead I keep wondering who I'm for, when nobody needs me."`,
        choices: [
          { label: `Sit down with them and offer tea`, tag: 'diplomacy', do: { text: `You pour two cups. You sit. The medic talks, then doesn't, then talks again. Eventually, a quiet settles that feels like medicine. "Thank you, Captain. This helped. This was the appointment."`, fx: [{ mood: { random: 10 } }, { morale: 5 }, { supplies: -1 }], goto: 'b' } },
          { label: `Say they are the reason the crew relaxes`, tag: 'persuade', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `"It's true," you say, and name three crew members who sleep better because there's a doctor aboard. {crew:medicine} listens, blinking. "I didn't know that." They do now.`, fx: [{ mood: { random: 12 } }, { morale: 4 }], goto: 'b' },
            fail: { text: `The line comes out stiffer than you meant. {crew:medicine} accepts it with the grace of long practice, and pats your shoulder as if you were the patient.`, fx: [{ mood: { random: 5 } }], goto: 'b' } },
          { label: `Suggest a social round of the ship`, tag: 'wait', do: { text: `The medic makes a round with a tray of tea and bad jokes. Within an hour, eleven small complaints have been aired and quietly solved. Everyone feels lighter.`, fx: [{ morale: 8 }, { mood: { all: 3 } }] } },
        ],
      },
      b: {
        speaker: { name: '{crew:medicine}', species: 'human' },
        text: `"I'll tell you my secret," says {crew:medicine}. "The best cure I know is somebody noticing. So: I noticed you haven't slept well. Take this. It's a mild sedative and a lot of caring." A small paper packet, hand-labelled, is pressed into your palm.`,
        choices: [
          { label: `Accept the packet, and the advice`, tag: 'diplomacy', do: { text: `You sleep eight hours for the first time in a fortnight. The packet is mostly chamomile. You never tell the medic you suspected.`, fx: [{ morale: 6 }, { hull: 0 }, { mood: { random: 6 } }, { xp: { medicine: 1 } }] } },
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
        speaker: { name: '{crew:diplomacy}', species: 'human' },
        text: `{crew:diplomacy} sits at the comms console, headphones askew. "Captain, I speak eleven languages and I've just realised I've no one to be quiet with in any of them. Do you ever feel like a bridge that everybody walks across?"`,
        choices: [
          { label: `Teach them to be quiet`, tag: 'wait', do: { text: `You offer a game: ten minutes of silence, no translation, no agenda. It is surprisingly hard, and then it isn't. By the end, {crew:diplomacy} is grinning at the ceiling.`, fx: [{ mood: { random: 10 } }, { morale: 5 }], goto: 'b' } },
          { label: `Ask them to teach you a phrase in each language`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: `You learn eleven ways to say "good evening", and one very rude word that's affectionate in Quillari. Your accent is awful. Their delight is not.`, fx: [{ xp: { diplomacy: 3 } }, { mood: { random: 10 } }], goto: 'b' },
            fail: { text: `Your accent is a crime. {crew:diplomacy} laughs until they cry, wipes their eyes, and says it's the best day of the voyage so far.`, fx: [{ mood: { random: 8 } }, { morale: 3 }], goto: 'b' } },
          { label: `Listen to the old broadcasts together`, tag: 'science', do: { text: `You tune across the bands, finding drifter lullabies, Concord weather reports, a Quillari quiz show. Each is a small proof that someone, somewhere, is listening too.`, fx: [{ mood: { random: 8 } }, { morale: 4 }] } },
        ],
      },
      b: {
        speaker: { name: '{crew:diplomacy}', species: 'human' },
        text: `"You know, I think what I like about this ship is that nobody here needs me to translate who we are. Thank you for that." A pause. "Also, I've been meaning to tell you: your hailing voice is much better than you think."`,
        choices: [
          { label: `Laugh, and say thank you`, tag: 'diplomacy', do: { text: `It is the nicest thing anyone has said about your voice. You log it quietly under 'confidence' and carry it with you.`, fx: [{ mood: { random: 8 } }, { morale: 4 }, { xp: { diplomacy: 1 } }] } },
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
          { label: `Brew something special: comet ice or cloud tea`, tag: 'science', if: [{ any: [{ item: 'comet_ice' }, { item: 'tea_sample' }] }],
            do: { text: `The water tastes of a thousand years; the leaves, of bergamot and impossible weather. The crew takes one sip, then another, then simply stops, with eyes closed. It is a spiritual experience, politely.`, fx: [{ morale: 14 }, { mood: { all: 5 } }, { codex: 'codex_ship_tea' }] } },
          { label: `Chime in on the cups`, tag: 'persuade', if: [{ item: 'ice_chime' }],
            do: { text: `You tap the ice-chime on the rim of each cup, and it rings a perfect fifth. The tea seems to settle into itself. The crew sits for a long, glowing moment.`, fx: [{ morale: 12 }, { codex: 'codex_ship_tea' }] } },
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
];
