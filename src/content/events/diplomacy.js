// EVENTS-A: diplomacy, first contacts, disputes, festivals. No combat; misunderstandings and pride only.
//
// ITEMS: (unknown ids are treated as simple counters by the engine)
//   concord_stamp  - "Stamp of Provisional Acceptance": a rubber stamp that turns Concord forms into pleased sighs.
//   choir_reed     - "Choir Reed": a hollow crystal pipe; the Vesperine will hum back to it.
//   riddle_coin    - "Riddle Token": a small bronze disc the Archivists give to guests who answered correctly.
//   story_knot     - "Story-Knot": a knotted cord, each knot a tale; drifters trust anyone who carries one.
//   lantern_sprig  - "Lantern Sprig": a paper-and-wire flower from a festival; brings luck, and delight.
//   gossip_pin     - "Gossip Pin": enamel pin of a Quillari market-whisperer (also used in travel.js).
//   toll_token     - "Free-Passage Token" (also used in travel.js).
//
// FLAGS set: met_quillari, met_vesperine, met_archivists, met_drifters, met_concord, quarrel_mediated, choir_quiet_taught,
//   audit_passed, drone_friend, stowaway_aboard, stowaway_resolved, festival_invited, festival_attended, pilgrims_helped,
//   archivist_hypothesis (string), concord_forms_solved, tib_friend
// FLAGS read: met_*, drone_friend, stowaway_aboard, festival_invited, choir_quiet_taught
// CHAINS: d_stowaway -> d_stowaway_aftermath (travel ctx, via flag); d_festival_invite -> d_festival_night (via flag)
//
// Goods used: ration_bars, glass_brandy, tuning_crystals, vellum_sheets, hand_looms, medical_kits, fuel_cells, star_charts, curios, machine_parts

export default [
  // ---------------------------------------------------------------- FIRST CONTACTS
  {
    id: 'dip_first_quillari',
    title: 'Feathers and Hospitality',
    tags: ['diplomacy', 'trade', 'comedy'],
    ctx: 'hail',
    weight: 40,
    when: [{ system: { faction: 'quillari' } }, { notFlag: 'met_quillari' }],
    once: true,
    art: { scene: 'market', species: 'quillari', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Matron Wrenna', species: 'quillari' },
        text: '"Ah, a stranger with an interesting hull! Welcome, welcome! You will take tea. Three sugars. It is not a question, it is a law. And while you sip, we shall discuss prices."',
        choices: [
          { label: 'Accept the tea graciously', tag: 'diplomacy', do: { text: 'The tea is syrup. You drink every drop. Wrenna beams. "A guest who does not flinch! Excellent, you may haggle."', fx: [{ flag: 'met_quillari' }, { rep: { quillari: 4 } }, { morale: 2 }], goto: 'b' } },
          { label: 'Present a bottle of glass-fruit brandy', tag: 'trade', if: [{ cargo: { glass_brandy: 1 } }], do: { text: 'Her crest feathers fluff in delight. "From our own cousins! You have manners, Captain."', fx: [{ cargo: { glass_brandy: -1 } }, { flag: 'met_quillari' }, { rep: { quillari: 8 } }], goto: 'b' } },
          { label: 'Decline politely, keep it short', tag: 'wait', do: { text: '"Hm! Brisk! The brisk have our respect and our invoice."', fx: [{ flag: 'met_quillari' }, { rep: { quillari: 1 } }] } },
        ],
      },
      b: {
        speaker: { name: 'Matron Wrenna', species: 'quillari' },
        text: '"Now: gossip is currency here. I will sell you a pin of introduction for fifteen scrip. With it, any market-whisperer will talk to you. Or you could try to talk me down."',
        choices: [
          { label: 'Buy the pin (15 scrip)', tag: 'trade', if: [{ credits: 15 }], do: { text: 'She pins it to your lapel with great ceremony. "Now you are one of the gossip!"', fx: [{ credits: -15 }, { item: { gossip_pin: 1 } }] } },
          { label: 'Haggle', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'You bring her down to five scrip and a limerick. She is thrilled, and promises to spread your name.', fx: [{ credits: -5 }, { item: { gossip_pin: 1 } }, { rep: { quillari: 2 } }] }, fail: { text: 'She does not budge, but she does appreciate the attempt. She sells the pin at full price, with a wink.', fx: [{ credits: -15 }, { item: { gossip_pin: 1 } }] } },
          { label: 'No thank you', tag: 'wait', do: { text: '"Another time, then. Everyone buys the pin eventually."', fx: [] } },
        ],
      },
    },
  },

  {
    id: 'dip_first_vesperine',
    title: 'A Note Held Too Long',
    tags: ['diplomacy', 'wonder', 'science'],
    ctx: 'hail',
    weight: 40,
    when: [{ system: { faction: 'vesperine' } }, { notFlag: 'met_vesperine' }],
    once: true,
    art: { scene: 'nebula', species: 'vesperine', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'The Choir of Thessaly', species: 'vesperine' },
        text: 'A crystal shape the size of a cathedral blooms on the viewscreen and sings. The translator warbles: "WELCOME. PLEASE. QUIETER." Your own engines, the choir seems to feel, are rather like a cough in a library.',
        choices: [
          { label: 'Throttle the engines to a whisper', tag: 'diplomacy', do: { text: 'The Halcyon drifts in silence. The choir hums a long, grateful chord, and the lounge teacups ring in sympathy.', fx: [{ flag: 'met_vesperine' }, { rep: { vesperine: 5 } }, { fuel: -1 }], goto: 'b' } },
          { label: 'Muffle the hull with the lab soundproofing', tag: 'science', check: { skill: 'engineering', diff: 3 }, pass: { text: 'Engineering swaddles the drive in felt panels. The choir sings a whole phrase of appreciation.', fx: [{ flag: 'met_vesperine' }, { rep: { vesperine: 6 } }, { xp: { engineering: 1 } }], goto: 'b' }, fail: { text: 'The felt rattles loose. The choir winces, politely, in B-flat.', fx: [{ flag: 'met_vesperine' }, { rep: { vesperine: 1 } }], goto: 'b' } },
          { label: 'Reply in a sung greeting', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 4 }, pass: { text: '{crew:random} hits a clear note with hardly a wobble. The choir shapes the note into a chord and hands it back, transposed.', fx: [{ flag: 'met_vesperine' }, { rep: { vesperine: 7 } }, { morale: 4 }], goto: 'b' }, fail: { text: 'Your note arrives somewhat sharp. The choir shifts as if to say "bless your heart."', fx: [{ flag: 'met_vesperine' }, { rep: { vesperine: 1 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'The Choir of Thessaly', species: 'vesperine' },
        text: '"GIFT. RESONANT. TAKE." A thin crystal pipe floats across and settles in your cargo airlock, humming faintly.',
        choices: [
          { label: 'Accept the reed with thanks', tag: 'diplomacy', do: { text: 'The pipe vibrates when you speak kindly. Dobbin finds it very touching and no longer insists on "monitoring" it.', fx: [{ item: { choir_reed: 1 } }, { rep: { vesperine: 2 } }] } },
        ],
      },
    },
  },

  {
    id: 'dip_first_archivists',
    title: 'The First Question',
    tags: ['diplomacy', 'mystery', 'comedy'],
    ctx: 'hail',
    weight: 40,
    when: [{ system: { faction: 'archivists' } }, { notFlag: 'met_archivists' }],
    once: true,
    art: { scene: 'station', species: 'archivist', palette: 'amber' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Curator 3-of-9', species: 'archivist' },
        text: '"GREETINGS, VISITOR. YOU HAVE ENTERED AN ARCHIVE. ADMISSION IS ONE QUESTION. IF YOU DO NOT HAVE A QUESTION, WE CAN SUPPLY ONE. IT WILL BE A VERY LARGE QUESTION."',
        choices: [
          { label: 'Offer the question "What is your name?"', tag: 'diplomacy', do: { text: '"A STIMULATING QUESTION. IT WILL TAKE US SEVEN DAYS TO ANSWER. WE ARE ENCHANTED." You are allowed in anyway, with provisional status.', fx: [{ flag: 'met_archivists' }, { rep: { archivists: 3 } }], goto: 'b' } },
          { label: 'Ask the Archive what to ask', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"EXCELLENT. THIS IS CALLED A META-QUESTION. WE HAVE A BEAUTIFUL SHELF FOR THOSE." The curator bows.', fx: [{ flag: 'met_archivists' }, { rep: { archivists: 5 } }], goto: 'b' }, fail: { text: '"THAT IS NOT A QUESTION, THAT IS A DEFERRAL. BUT WE ARE LENIENT." You squeak through.', fx: [{ flag: 'met_archivists' }, { rep: { archivists: 1 } }], goto: 'b' } },
          { label: 'Offer vellum sheets in lieu of a question', tag: 'trade', if: [{ cargo: { vellum_sheets: 1 } }], do: { text: '"PAYMENT IN KIND! IRREGULAR! DELIGHTFUL!" The Curator pats the vellum like a pet.', fx: [{ cargo: { vellum_sheets: -1 } }, { flag: 'met_archivists' }, { rep: { archivists: 6 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Curator 3-of-9', species: 'archivist' },
        text: '"A COURTESY RIDDLE FOR NEW GUESTS: I HAVE PAGES BUT NO WIND, A SPINE BUT NO BONES, AND I AM STORED IN HOLLOWS. WHAT AM I?"',
        choices: [
          { label: '"A book."', tag: 'science', do: { text: '"CORRECT. HAVE A TOKEN. YOU HAVE A SMALL SHELF WITH OUR REGARD." A bronze Riddle Token drops into your palm.', fx: [{ item: { riddle_coin: 1 } }, { rep: { archivists: 3 } }] } },
          { label: '"The Archive itself."', tag: 'persuade', check: { skill: 'science', diff: 3 }, pass: { text: '"ALSO CORRECT, AND SHOWY. BRONZE TOKEN, FOR YOUR POETRY."', fx: [{ item: { riddle_coin: 1 } }, { rep: { archivists: 5 } }] }, fail: { text: '"WRONG, BUT CHARMING. HAVE A BISCUIT-SHAPED TOKEN OF CONSOLATION."', fx: [{ rep: { archivists: 1 } }, { morale: 1 }] } },
          { label: '"I give up. Tell me?"', tag: 'wait', do: { text: '"A BOOK. FILE THIS UNDER \'KINDLY DECLINED\'." Not unfriendly. Just scrupulously filed.', fx: [{ rep: { archivists: 1 } }] } },
        ],
      },
    },
  },

  {
    id: 'dip_first_drifters',
    title: 'Chartered People',
    tags: ['diplomacy', 'persuade'],
    ctx: 'hail',
    weight: 40,
    when: [{ system: { faction: 'drifters' } }, { notFlag: 'met_drifters' }],
    once: true,
    art: { scene: 'station', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Warden Jory', species: 'drifter' },
        text: '"Halcyon. Meridian Society, aren\'t you? The charter people. Last chartered ship that came by measured our nursery and called it \'unsurveyed.\' You will forgive us if we hold the airlock a moment."',
        choices: [
          { label: '"We\'re here to be shown, not to measure."', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'Jory\'s shoulders relax a notch. "Hm. Put that on a patch and you\'d sell it."', fx: [{ flag: 'met_drifters' }, { rep: { drifters: 5 } }], goto: 'b' }, fail: { text: '"Too smooth," says Jory. The airlock stays shut, but not locked.', fx: [{ flag: 'met_drifters' }, { rep: { drifters: 1 } }], goto: 'b' } },
          { label: 'Offer a hand-woven gift', tag: 'trade', if: [{ cargo: { hand_looms: 1 } }], do: { text: 'The airlock cycles at once. "That\'s our weave. Who taught you that?" "A guest," you say. It is, strictly, true.', fx: [{ cargo: { hand_looms: -1 } }, { flag: 'met_drifters' }, { rep: { drifters: 7 } }], goto: 'b' } },
          { label: 'Take off the Society badge, sheepishly', tag: 'diplomacy', do: { text: 'Jory laughs. "Well. That\'s a start." You are admitted, hatless and humble.', fx: [{ flag: 'met_drifters' }, { rep: { drifters: 3 } }, { rep: { concord: -1 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Warden Jory', species: 'drifter' },
        text: '"Have a seat. Share a story, we always start with one. The rule is: it must be true, or at least truer than the last one."',
        choices: [
          { label: 'Tell the one about the tea-cosy', tag: 'diplomacy', do: { text: 'By the end half the room is wiping their eyes. Jory ties a small knot in a cord and hands it to you. "Keep it. A story-knot."', fx: [{ item: { story_knot: 1 } }, { rep: { drifters: 2 } }, { morale: 3 }] } },
        ],
      },
    },
  },

  {
    id: 'dip_first_concord',
    title: 'Form 1-A, Please',
    tags: ['diplomacy', 'comedy'],
    ctx: 'hail',
    weight: 40,
    when: [{ system: { faction: 'concord' } }, { notFlag: 'met_concord' }],
    once: true,
    art: { scene: 'station', species: 'human', palette: 'cream' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Clerk Hobart Winsome', species: 'human' },
        text: '"Welcome to Concord space, ISV Halcyon! Delighted. Quite delighted. Before anything may be done, I must ask you to complete Form 1-A, which grants permission to complete Form 1-B."',
        choices: [
          { label: 'Fill out Form 1-A carefully', tag: 'diplomacy', do: { text: 'Forty minutes later you have been issued a rubber stamp, a pamphlet, and a cheerful smile. "Provisionally accepted!"', fx: [{ flag: 'met_concord' }, { item: { concord_stamp: 1 } }, { rep: { concord: 4 } }, { days: 1 }] } },
          { label: 'Charm the clerk into a shortcut', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'You mention his excellent penmanship. Hobart blushes and waves you through. "We shall say Form 1-A was filled in spirit."', fx: [{ flag: 'met_concord' }, { item: { concord_stamp: 1 } }, { rep: { concord: 3 } }] }, fail: { text: 'He cannot be charmed; he can only be filled out. You spend the afternoon on the forms after all.', fx: [{ flag: 'met_concord' }, { item: { concord_stamp: 1 } }, { days: 1 }] } },
          { label: 'Admit you have no idea what Form 1-A is', tag: 'diplomacy', do: { text: '"Oh, bless you, nobody does," Hobart whispers. He stamps your hand, and your ship, and your fears.', fx: [{ flag: 'met_concord' }, { item: { concord_stamp: 1 } }, { rep: { concord: 2 } }, { morale: 2 }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- ENCOUNTERS & DISPUTES
  {
    id: 'dip_toll_buoy_ledger',
    title: 'The Buoy That Wanted Three and a Half',
    tags: ['trade', 'science', 'comedy'],
    ctx: 'arrive',
    weight: 12,
    when: [{ system: { faction: 'quillari' } }, { day: [4, 999] }],
    cooldown: 22,
    art: { scene: 'station', species: 'quillari' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Buoy Gilda', species: 'robot' },
        text: '"HALCYON. TOLL IS THREE AND A HALF SCRIP. I HAVE BEEN STUCK ON THAT FIGURE SINCE THE LAST SOLSTICE. NO ONE CAN PAY HALF A COIN. I AM BECOMING DISCOURAGED."',
        choices: [
          { label: 'Pay four scrip and say keep the change', tag: 'trade', if: [{ credits: 4 }], do: { text: 'Gilda\'s lamp brightens. "A tip! I have been tipped!" She plays a brief fanfare and waves you in.', fx: [{ credits: -4 }, { rep: { quillari: 2 } }] } },
          { label: 'Audit her ledger for the glitch', tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: 'A misplaced decimal! The correct toll is thirty-five. She cries, tolls herself, and returns your fee as thanks.', fx: [{ credits: 15 }, { rep: { quillari: 4 } }, { xp: { science: 1 } }] }, fail: { text: 'The ledger ties itself in a knot. Gilda remains at three and a half, and thanks you for trying.', fx: [{ credits: -4 }, { rep: { quillari: 1 } }] } },
          { label: 'Let CD-9 settle it', tag: 'trade', if: [{ flag: 'drone_friend' }], do: { text: 'Your tame cargo drone chirps and counts out three coins and a pearl button. Gilda is thrilled. "A half-coin! Just the right size!"', fx: [{ rep: { quillari: 4 } }, { morale: 3 }] } },
          { label: 'Present a toll token', tag: 'trade', if: [{ item: 'toll_token' }], do: { text: 'Gilda reads the token three times. "Valid, ancient, and annoyingly round." She lets you through.', fx: [{ item: { toll_token: -1 } }, { rep: { quillari: 1 } }] } },
        ],
      },
    },
  },

  {
    id: 'dip_habitat_quarrel',
    title: 'Two Habitats, One Garden',
    tags: ['diplomacy', 'persuade', 'relief'],
    ctx: 'station',
    weight: 14,
    when: [{ system: { faction: 'drifters', hasStation: true } }],
    once: true,
    art: { scene: 'station', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Speaker Brindle', species: 'drifter' },
        text: '"Captain, you are impartial; we are not. Brindle Habitat and Tansy Habitat share a garden-ring between us. Tansy\'s ivy has begun crossing our line. It is ivy aggression, Captain. I say we should speak of it."',
        choices: [
          { label: 'Hear Tansy\'s side first', tag: 'diplomacy', do: { text: 'Brindle sniffs, but nods. You cross the ring on a tram of potted ferns.', fx: [], goto: 'b' } },
          { label: 'Stay with Brindle and offer your sympathy', tag: 'persuade', do: { text: 'Brindle thaws, but the sympathy is noted. When you reach Tansy, she is waiting with arms folded.', fx: [{ rep: { drifters: 1 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Elder Tansy', species: 'drifter' },
        text: '"The ivy is a stray. A free spirit! Brindle\'s lilies strangle ours at the root. We did not start this feud. We merely have a better garden."',
        choices: [
          { label: 'Propose a shared planting day', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'You suggest a joint festival, ivy for lilies, one swap each. Both elders glare. Both agree. It is the happiest reluctance you have ever seen.', fx: [], goto: 'c' }, fail: { text: 'They each declare the other\'s plan insufferable, then, in unison, declare yours worse. They agree on that, at least.', fx: [{ morale: -2 }], goto: 'c' } },
          { label: 'Recommend an engineering trellis', tag: 'science', check: { skill: 'engineering', diff: 3 }, pass: { text: 'A lattice divides the beds. The ivy takes the left; the lilies, the right. Everyone is secretly relieved.', fx: [{ xp: { engineering: 1 } }], goto: 'c' }, fail: { text: 'The trellis collapses into a heap of ivy and lilies, entwined. Somehow they like it.', fx: [], goto: 'c' } },
        ],
      },
      c: {
        speaker: { name: 'Both Habitats', species: 'drifter' },
        text: 'By dusk the garden-ring is a lantern-lit picnic, ivy and lilies braided on every railing. Brindle and Tansy sit side by side, not speaking, pouring each other tea.',
        choices: [
          { label: 'Accept their thanks', tag: 'diplomacy', do: { text: 'They press a bundle of supplies and a knotted cord into your hands. "Whenever you need a witness for a quarrel, we owe you one."', fx: [{ flag: 'quarrel_mediated' }, { rep: { drifters: 8 } }, { supplies: 3 }, { item: { story_knot: 1 } }, { morale: 5 }] } },
        ],
      },
    },
  },

  {
    id: 'dip_choir_needs_quiet',
    title: 'The Long Chord',
    tags: ['diplomacy', 'wonder', 'science'],
    ctx: 'hail',
    weight: 14,
    when: [{ system: { faction: 'vesperine' } }, { flag: 'met_vesperine' }],
    cooldown: 30,
    art: { scene: 'rift', species: 'vesperine', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'The Choir', species: 'vesperine' },
        text: '"CHORD. LONG. THREE HOURS. SILENCE NEEDED." The choir is about to sing its seasonal Long Chord, and every ship in the vicinity has been politely asked to hush. Every system, even the humming ones.',
        choices: [
          { label: 'Cut all power and drift', tag: 'wait', do: { text: 'For three hours the Halcyon is a dark, quiet shell. The Long Chord rises, fills the void, and passes through your hull like warm water. Nobody speaks. Nobody needs to.', fx: [{ supplies: -1 }, { days: 1 }, { rep: { vesperine: 6 } }, { morale: 6 }, { flag: 'choir_quiet_taught' }] } },
          { label: 'Soften the ship noise with a clever baffle', tag: 'science', check: { skill: 'engineering', diff: 3 }, pass: { text: 'You baffle the drive and mute the intercom. The choir hums approval and lets you stay for the chord, a rare guest at the edge of the song.', fx: [{ rep: { vesperine: 7 } }, { flag: 'choir_quiet_taught' }, { morale: 5 }, { xp: { engineering: 1 } }] }, fail: { text: 'A single valve tick. The choir tolerates it, and starts the chord a quarter-tone lower in forgiveness.', fx: [{ rep: { vesperine: 2 } }, { flag: 'choir_quiet_taught' }] } },
          { label: 'Play them a recorded lullaby', tag: 'diplomacy', do: { text: 'Oh no. The recording blares across the choir like a trombone through a nursery. The chord stalls. You apologise on every frequency.', fx: [{ rep: { vesperine: -2 } }, { morale: -2 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'The Choir', species: 'vesperine' },
        text: '"OFFENCE. SMALL. FORGIVEN. NEXT TIME: STILL."',
        choices: [
          { label: 'Hold perfectly still, sincerely', tag: 'diplomacy', do: { text: 'You wait out the chord in a hush of shame and sincerity. At the end the choir resonates once, softly, in the key of "you tried".', fx: [{ rep: { vesperine: 4 } }, { flag: 'choir_quiet_taught' }, { days: 1 }] } },
        ],
      },
    },
  },

  {
    id: 'dip_archivist_audit',
    title: 'A Routine Riddle-Audit',
    tags: ['diplomacy', 'science', 'comedy'],
    ctx: 'hail',
    weight: 12,
    when: [{ system: { faction: 'archivists' } }, { flag: 'met_archivists' }],
    cooldown: 28,
    art: { scene: 'station', species: 'archivist', palette: 'amber' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Auditor Fetch-Four', species: 'archivist' },
        text: '"ROUTINE AUDIT. YOUR SHIP\'S LOG HAS BEEN FOUND TO CONTAIN \'SEVERAL INTERESTING GAPS.\' WE WOULD LIKE YOU TO FILL THEM WITH QUESTIONS. IN RIDDLE FORM, IF POSSIBLE. WE ENJOY DISCIPLINE."',
        choices: [
          { label: 'Answer an Archivist riddle', tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: '"THE ANSWER IS THE MIDDLE OF THE SPIRAL." You say "a nautilus." The Auditor spins a tiny gear with delight. "SPLENDID."', fx: [{ rep: { archivists: 4 } }, { item: { riddle_coin: 1 } }, { xp: { science: 1 } }], goto: 'b' }, fail: { text: 'You offer "a staircase." The Auditor notes it carefully on a card. "WRONG, BUT WE WILL FILE IT UNDER \'POETIC\'."', fx: [{ rep: { archivists: 1 } }], goto: 'b' } },
          { label: 'Trade a riddle token for a pass', tag: 'trade', if: [{ item: 'riddle_coin' }], do: { text: 'The token is examined and returned. "VALID. YOU MAY DEPART, FILE-CLEAN."', fx: [{ rep: { archivists: 3 } }, { flag: 'audit_passed' }] } },
          { label: 'Ask the Auditor a riddle back', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"WHY IS A RAVEN LIKE A WRITING DESK?" The Auditor freezes mid-spin, then shudders happily. "WE SHALL NEED A WHILE." You are cleared and cherished.', fx: [{ rep: { archivists: 6 } }, { flag: 'audit_passed' }, { morale: 3 }] }, fail: { text: 'Your riddle has no answer. The Auditor gently explains that this is not the point of riddles.', fx: [{ rep: { archivists: 1 } }] } },
        ],
      },
      b: {
        speaker: { name: 'Auditor Fetch-Four', species: 'archivist' },
        text: '"SECOND ITEM: YOUR LOG SAYS \'WE ARRIVED AND IT WAS NICE.\' PLEASE EXPAND ON \'NICE.\'"',
        choices: [
          { label: 'Write a heartfelt paragraph on niceness', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 2 }, pass: { text: 'You compose three tender lines. The Auditor reads them twice and rubs a corner of its casing. "VERY NICE."', fx: [{ rep: { archivists: 3 } }, { flag: 'audit_passed' }] }, fail: { text: 'You write \'nice\' seven times. The Auditor files it as modernist poetry.', fx: [{ flag: 'audit_passed' }] } },
          { label: 'Hand in the log, unedited', tag: 'wait', do: { text: '"UNEDITED. FEARLESS. FILED." You are cleared with a bronze stamp and a pitying chime.', fx: [{ flag: 'audit_passed' }] } },
        ],
      },
    },
  },

  {
    id: 'dip_story_contest',
    title: 'The Great Telling',
    tags: ['diplomacy', 'comedy', 'wonder'],
    ctx: 'station',
    weight: 11,
    when: [{ system: { faction: 'drifters', hasStation: true } }, { day: [8, 999] }],
    cooldown: 30,
    art: { scene: 'lounge', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Mistress of Tales Odalys', species: 'drifter' },
        text: '"Tonight the Great Telling! Whoever tells the best tale wins a knot and the right to criticise the soup. You, Captain, will be our guest of honour. Your turn is third. No pressure."',
        choices: [
          { label: 'Tell a true tale of the Gate', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'You tell of the first jump: the stars bending like wet silk. When you finish, there is a held breath, then thunder.', fx: [{ rep: { drifters: 5 } }, { item: { story_knot: 1 } }, { morale: 5 }], goto: 'b' }, fail: { text: 'Your tale loses its way in the middle. A kindly grandmother in the front row prompts you; you recover enough to bow.', fx: [{ rep: { drifters: 2 } }, { morale: 1 }], goto: 'b' } },
          { label: 'Spin an outrageous tall tale', tag: 'persuade', rand: [[2, { text: 'It involves a moth the size of a moon and a bargain with a nebula. The hall dissolves. You win the soup-crown.', fx: [{ rep: { drifters: 6 } }, { item: { story_knot: 1 } }, { morale: 6 }], goto: 'b' }], [2, { text: 'Halfway through, someone yells "That happened to MY uncle." There is chaos. Everyone loves it.', fx: [{ rep: { drifters: 3 } }, { morale: 3 }], goto: 'b' }], [1, { text: 'The punchline lands on a silence so deep you can hear the soup cooling.', fx: [{ morale: -2 }, { rep: { drifters: 1 } }], goto: 'b' }]] },
          { label: 'Hold up a story-knot as your tale', tag: 'diplomacy', if: [{ item: 'story_knot' }], do: { text: 'The room goes still. "A knot-bearer!" You tell the story of its knots, borrowed from its previous owner. Odalys weeps with joy.', fx: [{ rep: { drifters: 7 } }, { morale: 4 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Mistress of Tales Odalys', species: 'drifter' },
        text: '"Splendid. You\'re not the best, mind. But you\'re ours now. The soup is yours to criticise, with our blessing."',
        choices: [
          { label: 'Critique the soup tactfully', tag: 'diplomacy', do: { text: 'It needs salt. You say so, gently. The cook weeps with gratitude; the soup is made new, and it is superb.', fx: [{ supplies: 2 }, { morale: 3 }] } },
          { label: 'Praise the soup with sincerity', tag: 'wait', do: { text: 'The cook beams. A tureen goes straight to your galley with a ribbon on it.', fx: [{ supplies: 3 }, { rep: { drifters: 1 } }] } },
        ],
      },
    },
  },

  {
    id: 'dip_gossip_market',
    title: 'What the Whisperers Say',
    tags: ['trade', 'diplomacy', 'mystery'],
    ctx: 'station',
    weight: 13,
    when: [{ system: { faction: 'quillari', hasStation: true } }],
    cooldown: 18,
    art: { scene: 'market', species: 'quillari', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Whisperer Pim', species: 'quillari' },
        text: '"Psst! Captain. A bit of gossip? Cheap, at only ten scrip. Today\'s special: which neighbour is courting which baker. Tomorrow\'s special: which sector\'s star is about to wobble."',
        choices: [
          { label: 'Buy today\'s gossip (10 scrip)', tag: 'trade', if: [{ credits: 10 }], rand: [[3, { text: 'It is absurdly juicy and not very useful, but a map reference is scribbled at the bottom.', fx: [{ credits: -10 }, { reveal: 'nearest' }, { morale: 2 }] }], [1, { text: 'It is about the Captain. You. Fortunately it is flattering.', fx: [{ credits: -10 }, { rep: { quillari: 2 } }, { morale: 3 }] }]] },
          { label: 'Show your gossip pin', tag: 'diplomacy', if: [{ item: 'gossip_pin' }], do: { text: 'Pim snaps upright. "A pin! Fellow whisperer!" The real gossip pours out: three star-lanes, a bakery, and a rumoured wreck.', fx: [{ reveal: { radius: 2 } }, { rep: { quillari: 3 } }, { credits: 15 }] } },
          { label: 'Trade your own gossip', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'You hint at the Society\'s next supply drop. Pim pays handsomely in secrets and scrip, and the whole market buzzes.', fx: [{ credits: 30 }, { rep: { quillari: 3 } }, { reveal: 'nearest' }] }, fail: { text: 'Your gossip is old news. Pim gives you a tolerant look, but still hands you a free pastry.', fx: [{ supplies: 1 }] } },
        ],
      },
    },
  },

  {
    id: 'dip_concord_forms_farce',
    title: 'Form 12-C Requires Form 12-B',
    tags: ['comedy', 'diplomacy', 'persuade'],
    ctx: 'station',
    weight: 12,
    when: [{ system: { faction: 'concord', hasStation: true } }, { flag: 'met_concord' }],
    cooldown: 25,
    art: { scene: 'station', species: 'human', palette: 'cream' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Clerk Hobart Winsome', species: 'human' },
        text: '"You wish to refuel? Splendid. You will need Form 12-C." He slides one across. "Which requires a countersigned Form 12-B." He slides another. "Which requires..." A pause. "Form 12-C."',
        choices: [
          { label: 'Study the forms for a loophole', tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: 'Clause 9, subsection (iv): "In the case of circularity, a witness may serve in lieu." Hobart goes pale, then delighted. "I\'ve waited years for this!"', fx: [{ flag: 'concord_forms_solved' }, { rep: { concord: 4 } }, { xp: { science: 1 } }], goto: 'c' }, fail: { text: 'The forms go round in a loop. Hobart quietly offers tea while you try again.', fx: [{ supplies: -1 }], goto: 'b' } },
          { label: 'Show the Provisional Stamp', tag: 'diplomacy', if: [{ item: 'concord_stamp' }], do: { text: 'Hobart goes pink with pleasure. "Where did you GET that? It breaks the loop on principle." Both forms are stamped at once.', fx: [{ rep: { concord: 3 } }, { flag: 'concord_forms_solved' }], goto: 'c' } },
          { label: 'Sit down and fill them in with a smile', tag: 'persuade', do: { text: 'You fill in each form with such cheerful patience that Hobart starts to see the funny side. It takes the afternoon.', fx: [{ days: 1 }, { rep: { concord: 2 } }, { morale: -1 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Clerk Hobart Winsome', species: 'human' },
        text: '"I don\'t suppose... I could simply declare a state of administrative emergency? It\'s never been done, but I have always dreamed of it."',
        choices: [
          { label: '"Declare it, Mr. Winsome."', tag: 'persuade', do: { text: 'He stands, rings a bell, and bellows: "ADMINISTRATIVE EMERGENCY!" Paper rains from the ceiling. You are cleared in thirty seconds. Hobart is radiant.', fx: [{ rep: { concord: 4 } }, { flag: 'concord_forms_solved' }, { morale: 3 }], goto: 'c' } },
          { label: 'Thank him, leave, and refuel elsewhere', tag: 'flee', do: { text: 'You depart with dignity. Behind you, Hobart is already sketching a Form 12-D.', fx: [{ rep: { concord: -1 } }] } },
        ],
      },
      c: {
        text: 'The paperwork resolves into one very small, very important stamp. Hobart presses it into your hand like a medal.',
        choices: [
          { label: 'Accept it with ceremony', tag: 'diplomacy', do: { text: 'The stamp is yours. Someday, somewhere, it will break a loop.', fx: [{ item: { concord_stamp: 1 } }, { shop: true }] } },
        ],
      },
    },
  },

  {
    id: 'dip_lost_pilgrims',
    title: 'The Pilgrim Barge Patience',
    tags: ['relief', 'diplomacy', 'wonder'],
    ctx: 'hail',
    weight: 12,
    when: [{ day: [8, 999] }],
    once: true,
    art: { scene: 'ship_alien', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Sister Agnete', species: 'human' },
        text: '"Peace to the Halcyon! We are the Pilgrims of the Lanternlight, and, I confess it, quite lost. We were following a hymn. The hymn, it turns out, was a nebula. May we ask the way?"',
        choices: [
          { label: 'Share a star chart', tag: 'trade', if: [{ cargo: { star_charts: 1 } }], do: { text: 'Agnete kisses the chart. "A blessing on your rigging." She presses a pouch of travelling provisions into your hands.', fx: [{ cargo: { star_charts: -1 } }, { rep: { concord: 3 } }, { supplies: 3 }, { flag: 'pilgrims_helped' }] } },
          { label: 'Guide them with a piloting escort', tag: 'flee', check: { skill: 'piloting', diff: 3 }, pass: { text: 'You lead the barge through a ribbon of calm space. The pilgrims sing the whole way. The Halcyon\'s crew hums along.', fx: [{ days: 1 }, { rep: { concord: 3 } }, { morale: 6 }, { flag: 'pilgrims_helped' }] }, fail: { text: 'You get them out, but the barge scrapes a rock on the way. They bless the rock, forgive you, and pay the repair.', fx: [{ days: 1 }, { rep: { concord: 1 } }, { credits: 20 }, { flag: 'pilgrims_helped' }] } },
          { label: 'Give them directions over the radio', tag: 'diplomacy', do: { text: '"We\'ll try, Captain." You can hear them arguing sweetly about the map for twenty minutes. Eventually they set off the right way.', fx: [{ rep: { concord: 1 } }, { flag: 'pilgrims_helped' }] } },
        ],
      },
    },
  },

  {
    id: 'dip_runaway_drone',
    title: 'CD-9 Has Opinions',
    tags: ['comedy', 'trade', 'flee'],
    ctx: 'arrive',
    weight: 11,
    when: [{ day: [6, 999] }, { notFlag: 'drone_friend' }],
    once: true,
    art: { scene: 'asteroids', species: 'robot' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Cargo Drone CD-9', species: 'robot' },
        text: 'A boxy cargo drone tumbles toward you, trailing a ribbon of parcels. "HELLO," it pings. "I HAVE DECIDED NOT TO DELIVER. IT IS TOO MUCH PRESSURE. I WILL NOW SEEK A HOBBY."',
        choices: [
          { label: 'Catch it with a tractor beam', tag: 'flee', check: { skill: 'piloting', diff: 3 }, pass: { text: 'You match its spin and gather it up neatly. The drone chirps. "THIS IS A HOBBY. I APPROVE."', fx: [{ flag: 'drone_friend' }, { rep: { quillari: 3 } }, { xp: { piloting: 1 } }, { morale: 4 }], goto: 'b' }, fail: { text: 'You catch the parcels instead. The drone makes a break for the stars, then returns, sheepish. "I MISSED THE PARCELS."', fx: [{ flag: 'drone_friend' }, { morale: 2 }], goto: 'b' } },
          { label: 'Gently reprogram its cheerful side', tag: 'science', check: { skill: 'engineering', diff: 3 }, pass: { text: 'One adjusted setting and the drone finds delivering "quite fun, actually." It proudly drops off its parcels, and the Quillari send gratitude.', fx: [{ flag: 'drone_friend' }, { rep: { quillari: 5 } }, { xp: { engineering: 1 } }, { credits: 30 }] }, fail: { text: 'The reprogram makes the drone speak only in limericks. It delivers its parcels in verse. Strangely effective.', fx: [{ flag: 'drone_friend' }, { rep: { quillari: 2 } }, { morale: 3 }] } },
          { label: 'Wish it luck with the hobby', tag: 'wait', do: { text: 'The drone spins away, humming. You hope it finds knitting.', fx: [{ morale: 1 }] } },
        ],
      },
      b: {
        speaker: { name: 'Cargo Drone CD-9', species: 'robot' },
        text: '"I HAVE DECIDED TO ACCOMPANY YOU. I WILL BE YOUR COURIER. I HAVE ALSO NAMED THE BRIDGE PLANT. ITS NAME IS BARRY."',
        choices: [
          { label: 'Welcome CD-9 aboard', tag: 'diplomacy', do: { text: 'Dobbin and CD-9 regard each other for a long moment, then exchange a series of beeps that sounds a great deal like gossip.', fx: [{ morale: 4 }] } },
        ],
      },
    },
  },

  {
    id: 'dip_stowaway',
    title: 'Something in Crate Four',
    tags: ['comedy', 'relief', 'diplomacy'],
    ctx: 'arrive',
    weight: 9,
    when: [{ day: [10, 999] }, { notFlag: 'stowaway_aboard' }, { notFlag: 'stowaway_resolved' }],
    once: true,
    art: { scene: 'station', species: 'quillari' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Dobbin', species: 'robot' },
        text: '"Captain, there is thumping in Crate Four. The crate contains, by manifest, one hundred tea-cosies. By acoustics, it contains one hundred tea-cosies and a small, hiccuping child."',
        choices: [
          { label: 'Open the crate gently', tag: 'diplomacy', do: { text: 'A Quillari fledgling pops up, feathers ruffled. "I\'m Tib. I want to see a star up close. Please don\'t send me back!"', fx: [], goto: 'b' } },
          { label: 'Ask the crate what it wants', tag: 'persuade', do: { text: '"To see a star," whispers the crate. "Also I have run out of crumpets."', fx: [], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Tib', species: 'quillari' },
        text: '"I snuck on at the last port. My family is... around. I\'m very good at keeping quiet, mostly. Can I stay? Just for a few jumps? I\'ll earn my keep."',
        choices: [
          { label: 'Let Tib stay aboard for a few jumps', tag: 'diplomacy', do: { text: 'Tib whoops. Dobbin sighs, then finds the smallest apron in the ship. The crew adopt the fledgling within the hour.', fx: [{ flag: 'stowaway_aboard' }, { morale: 6 }, { supplies: -1 }] } },
          { label: 'Call Tib\'s family to collect', tag: 'persuade', check: { skill: 'diplomacy', diff: 2 }, pass: { text: 'The family arrives in an hour, flustered and thrilled. They give you a handful of scrip as reward and an enormous hug.', fx: [{ rep: { quillari: 5 } }, { credits: 25 }, { flag: 'stowaway_resolved' }] }, fail: { text: 'The family is a long way off. Tib sulks, you feel guilty, and eventually Tib is taken aboard anyway.', fx: [{ flag: 'stowaway_aboard' }, { morale: -1 }] } },
          { label: 'Put Tib on the next outbound ship', tag: 'flee', do: { text: 'Tib sulks all the way to the docks. Dobbin sends along a care package. A little rep is lost, a little warmth is too.', fx: [{ rep: { quillari: -1 } }, { morale: -2 }, { flag: 'stowaway_resolved' }] } },
        ],
      },
    },
  },

  {
    id: 'dip_stowaway_aftermath',
    title: 'Tib Has Been Busy',
    tags: ['comedy', 'relief', 'wonder'],
    ctx: 'travel',
    weight: 40,
    when: [{ flag: 'stowaway_aboard' }],
    once: true,
    art: { scene: 'bridge', species: 'quillari' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Tib', species: 'quillari' },
        text: '"Captain! I reorganised the bridge! I also fixed a thing, but I don\'t remember which. Also there\'s a bit of paperwork in your cabin... that I sort of filed. Under Cosies."',
        choices: [
          { label: 'Inspect the bridge', tag: 'science', check: { skill: 'engineering', diff: 2 }, pass: { text: 'Tib has, in fact, fixed the number-three sensor relay. Possibly by accident. Probably by sheer fledgling brilliance.', fx: [{ xp: { engineering: 2 } }, { morale: 4 }, { flag: 'tib_friend' }] }, fail: { text: 'The bridge looks cleaner, in a deeply alarming way. Everything is alphabetised. It takes {crew:random} an hour to find the helm.', fx: [{ morale: 1 }, { flag: 'tib_friend' }] } },
          { label: 'Thank Tib warmly', tag: 'diplomacy', do: { text: 'Tib puffs up like a feather duster. "I\'m going to be a captain one day. Or a baker. Possibly both."', fx: [{ morale: 5 }, { flag: 'tib_friend' }] } },
        ],
      },
    },
  },

  {
    id: 'dip_festival_invite',
    title: 'The Lantern-Night Invitation',
    tags: ['diplomacy', 'wonder'],
    ctx: 'arrive',
    weight: 11,
    when: [{ any: [{ system: { faction: 'quillari' } }, { system: { faction: 'drifters' } }] }, { day: [10, 999] }, { notFlag: 'festival_invited' }],
    once: true,
    art: { scene: 'station', species: 'quillari', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Master of Revels Odo', species: 'quillari' },
        text: '"Captain! You have arrived on the eve of Lantern-Night! The paper lanterns, the grand dance, the eating of far too much! No one arrives on the eve by chance. You are invited. Will you come?"',
        choices: [
          { label: 'Accept with a bow', tag: 'diplomacy', do: { text: 'Odo hands you a paper-and-wire sprig. "Wear it, and all will know you are expected. Come at dusk." The whole station is humming.', fx: [{ flag: 'festival_invited' }, { item: { lantern_sprig: 1 } }, { rep: { quillari: 2 } }, { morale: 3 }] } },
          { label: 'Plead urgent survey work', tag: 'wait', do: { text: '"Work!" Odo clutches his heart. "A pity. The invitation stands, until the last lantern burns out."', fx: [{ flag: 'festival_invited' }, { rep: { quillari: -1 } }] } },
        ],
      },
    },
  },

  {
    id: 'dip_festival_night',
    title: 'Lantern-Night',
    tags: ['wonder', 'comedy', 'diplomacy'],
    ctx: 'station',
    weight: 40,
    when: [{ flag: 'festival_invited' }, { any: [{ system: { faction: 'quillari' } }, { system: { faction: 'drifters' } }] }],
    once: true,
    art: { scene: 'lounge', species: 'quillari', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        text: 'The station is ablaze with paper lanterns. Music pours from every airlock. Odo bustles up, a tray of pastries on his head. "There are three events tonight: the Dance, the Feast, and the Contest of Songs. Choose wisely, or at least cheerfully."',
        choices: [
          { label: 'Join the Grand Dance', tag: 'diplomacy', check: { skill: 'piloting', diff: 3 }, pass: { text: 'You waltz like a falling feather. The floor opens for you; a hundred paper lanterns turn in your wake. You are crowned the Dance-Captain.', fx: [{ morale: 8 }, { rep: { quillari: 4 } }, { rep: { drifters: 2 } }, { xp: { piloting: 1 } }], goto: 'b' }, fail: { text: 'You trample the Master of Revels\' tail twice. He is delighted. "Someone is learning!"', fx: [{ morale: 5 }, { rep: { quillari: 2 } }], goto: 'b' } },
          { label: 'Raid the Feast with {crew:random}', tag: 'trade', do: { text: 'Six courses of things you cannot name, and two that name you. Supplies are pressed into your arms on departure, with a warning not to share them with Dobbin.', fx: [{ supplies: 4 }, { morale: 6 }], goto: 'b' } },
          { label: 'Sing in the Contest of Songs', tag: 'persuade', rand: [[2, { text: 'You sing a sea-shanty about tea. By the third chorus the hall is chanting along. First prize: a decorative lantern and the unwavering devotion of a goose.', fx: [{ rep: { quillari: 4 } }, { morale: 7 }], goto: 'b' }], [2, { text: 'Your note cracks. The audience gasps, then roars with approval at the courage. Second place, and a medal made of toffee.', fx: [{ morale: 4 }, { rep: { quillari: 2 } }], goto: 'b' }]] },
        ],
      },
      b: {
        text: 'At midnight the lanterns lift off the station, rising in a drifting cloud, a thousand small moons. Odo wipes his eyes. "That is the best bit. It is always the best bit."',
        choices: [
          { label: 'Watch them rise', tag: 'wait', do: { text: 'You stand with your crew, shoulder to shoulder, and watch the lights climb into the dark. Nobody wants it to end.', fx: [{ flag: 'festival_attended' }, { clearFlag: 'festival_invited' }, { morale: 8 }, { days: 1 }] } },
        ],
      },
    },
  },

  {
    id: 'dip_trade_dispute',
    title: 'A Matter of Weight',
    tags: ['trade', 'diplomacy', 'comedy'],
    ctx: 'station',
    weight: 11,
    when: [{ system: { hasStation: true } }, { day: [6, 999] }],
    cooldown: 20,
    art: { scene: 'market', species: 'quillari' },
    start: 'a',
    nodes: {
      a: {
        text: 'At the dock, a Quillari trader and a Concord inspector are shouting politely over a crate of brandy. "It weighs forty!" "It weighs thirty-nine and a half!" They turn to you, wild-eyed. "Captain! You are impartial! Weigh in!"',
        choices: [
          { label: 'Scan the crate precisely', tag: 'science', check: { skill: 'science', diff: 2 }, pass: { text: 'Thirty-nine point seven. Both are wrong. Both are gracious about it. Both pay you a finder\'s fee.', fx: [{ credits: 30 }, { rep: { quillari: 2 } }, { rep: { concord: 2 } }, { xp: { science: 1 } }] }, fail: { text: 'Your scanner doubles it. You weigh the scanner. It has an opinion. The two decide they dislike the scanner more than each other.', fx: [{ rep: { quillari: 1 } }, { rep: { concord: 1 } }, { morale: 2 }] } },
          { label: 'Propose they split the difference', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'A compromise at thirty-nine and three quarters. They shake hands. The crate cracks a crystal flute from delight.', fx: [{ rep: { quillari: 3 } }, { rep: { concord: 3 } }, { credits: 20 }] }, fail: { text: 'They agree on exactly one thing: you are annoying. Still, they stop shouting, and that counts as peace.', fx: [{ morale: -1 }] } },
          { label: 'Buy the crate and end the argument', tag: 'trade', if: [{ credits: 60 }], do: { text: 'Both look relieved. You get a crate of brandy, and an inspector\'s respect, and a trader\'s warm sniffle.', fx: [{ credits: -60 }, { cargo: { glass_brandy: 2 } }, { rep: { quillari: 2 } }, { rep: { concord: 2 } }] } },
        ],
      },
    },
  },

  {
    id: 'dip_habitat_slow_leak',
    title: 'A Slow, Polite Leak',
    tags: ['relief', 'science', 'diplomacy'],
    ctx: 'arrive',
    weight: 11,
    when: [{ system: { faction: 'drifters' } }, { day: [8, 999] }],
    cooldown: 30,
    art: { scene: 'station', species: 'drifter' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Engineer Wick', species: 'drifter' },
        text: '"Halcyon, ah! We have a leak. A slow, apologetic leak, but our patch crew is stuck on the other side. It\'s losing air faster than we can paper over it. Might you lend a hand?"',
        choices: [
          { label: 'Send an engineering team', tag: 'science', check: { skill: 'engineering', diff: 3 }, pass: { text: 'The team re-seals the seam and wraps it in your best silver tape. The habitat exhales, pressure rising. Wick bursts into song.', fx: [{ rep: { drifters: 6 } }, { xp: { engineering: 1 } }, { morale: 4 }] }, fail: { text: 'You find the leak but not the cause. The patch holds long enough for Wick\'s crew to take over. They send you away with a loaf of bread.', fx: [{ rep: { drifters: 3 } }, { supplies: 1 }] } },
          { label: 'Deliver spare machine parts', tag: 'trade', if: [{ cargo: { machine_parts: 1 } }], do: { text: 'The part fits like a glove. Wick makes a ceremony of bolting it in. Half the habitat turns up to watch.', fx: [{ cargo: { machine_parts: -1 } }, { rep: { drifters: 5 } }, { credits: 30 }] } },
          { label: 'Treat the thin-air headaches', tag: 'science', check: { skill: 'medicine', diff: 2 }, pass: { text: '{crew:medicine} sets up a clinic in the corridor. By supper, the headaches are gone, and the whole habitat knows your doctor\'s name.', fx: [{ rep: { drifters: 5 } }, { xp: { medicine: 1 } }] }, fail: { text: 'You hand out tea and cold flannels; it is not medicine, but it is kind. The habitat appreciates it all the same.', fx: [{ rep: { drifters: 2 } }, { supplies: -1 }] } },
        ],
      },
    },
  },

  {
    id: 'dip_concord_gala',
    title: 'Dinner with the Delegation',
    tags: ['diplomacy', 'comedy', 'wonder'],
    ctx: 'station',
    weight: 10,
    when: [{ system: { faction: 'concord', hasStation: true } }, { survey: 30 }, { rep: { concord: 8 } }],
    once: true,
    art: { scene: 'lounge', species: 'human', palette: 'cream' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Delegate Marguerite Oyelaran', species: 'human' },
        text: '"Captain, we have seen your charts. Remarkable. Tonight the Delegation dines, and you are our guest of honour. Please, no speeches. We have had enough speeches. Well. One short speech."',
        choices: [
          { label: 'Give a short, sincere toast', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"To the cartographers, who make the dark a little kinder." There is a silence, a sniffle, and a standing ovation. Marguerite hands you a sealed envelope.', fx: [{ rep: { concord: 5 } }, { credits: 100 }, { morale: 6 }], goto: 'b' }, fail: { text: 'You get lost halfway through the toast, and finish with "...and so on." They love it. It is the most honest speech anyone has given all year.', fx: [{ rep: { concord: 3 } }, { credits: 40 }, { morale: 3 }], goto: 'b' } },
          { label: 'Give no speech; praise the soup', tag: 'wait', do: { text: 'The soup is excellent. You say so. The Delegation is relieved to the point of tears. A modest honorarium follows.', fx: [{ credits: 30 }, { rep: { concord: 2 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Delegate Marguerite Oyelaran', species: 'human' },
        text: '"One more thing, Captain. The Concord wishes to give your ship a standing invitation to any of our stations. Free docking, free tea, and a quiet word on the best repair bays."',
        choices: [
          { label: 'Accept the invitation', tag: 'diplomacy', do: { text: 'A small brass key is placed in your palm. It opens nothing in particular, but everyone at every Concord desk smiles when they see it.', fx: [{ rep: { concord: 4 } }, { item: { concord_stamp: 1 } }, { morale: 4 }] } },
        ],
      },
    },
  },

  {
    id: 'dip_vesperine_return',
    title: 'The Reed Answers',
    tags: ['wonder', 'diplomacy', 'mystery'],
    ctx: 'hail',
    weight: 14,
    when: [{ system: { faction: 'vesperine' } }, { flag: 'choir_quiet_taught' }, { rep: { vesperine: 10 } }],
    once: true,
    art: { scene: 'rift', species: 'vesperine', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'The Choir', species: 'vesperine' },
        text: '"REMEMBERED. QUIET ONE. YOU WAITED. WE HAVE A SONG FOR YOU. SMALL. WE WILL TEACH IT. YOU WILL HOLD THE REED." The choir swells into a slow, warm interval that makes the teacups ring.',
        choices: [
          { label: 'Hold the reed and listen', tag: 'diplomacy', if: [{ item: 'choir_reed' }], do: { text: 'The reed lights from within, and the choir pours a private song through it, a fragment of something enormous. The crew are still for a long time afterwards.', fx: [{ rep: { vesperine: 8 } }, { morale: 10 }, { reveal: { radius: 3 } }, { xp: { diplomacy: 2 } }], goto: 'b' } },
          { label: 'Listen with no reed, but with all your heart', tag: 'wait', do: { text: 'The choir sings anyway. Without the reed it is more distant, but no less moving. {crew:random} cries a little.', fx: [{ rep: { vesperine: 5 } }, { morale: 7 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'The Choir', species: 'vesperine' },
        text: '"A DIRECTION. WE SANG IT. THE LANTERNS ANSWER TO THIS NOTE." A chord, once, like a compass needle finding north.',
        choices: [
          { label: 'Thank the choir and record the note', tag: 'science', do: { text: 'The note goes into the log in felt-tip, carefully. Someone, later, will know what to do with it.', fx: [{ flag: 'lantern_note_known' }, { xp: { science: 2 } }] } },
        ],
      },
    },
  },

  {
    id: 'dip_archivist_big_question',
    title: 'The Archive Asks',
    tags: ['mystery', 'diplomacy', 'wonder'],
    ctx: 'hail',
    weight: 12,
    when: [{ system: { faction: 'archivists' } }, { rep: { archivists: 8 } }, { flag: 'met_archivists' }],
    once: true,
    art: { scene: 'station', species: 'archivist', palette: 'amber' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Curator 3-of-9', species: 'archivist' },
        text: '"VISITOR. YOU HAVE BEEN COURTEOUS. WE HAVE A QUESTION OF OUR OWN, WHICH WE HAVE NOT FINISHED ASKING FOR A LONG TIME: WHO LIT THE LANTERNS? WE ASK YOU FOR YOUR OPINION, NOT YOUR ANSWER."',
        choices: [
          { label: '"Someone lonely."', tag: 'persuade', do: { text: 'The Curator pauses, whirs, and slowly files a new card. "FASCINATING. WE WILL SHELVE THIS NEAR \'HOPE\'." Something in the room softens.', fx: [{ flag: { archivist_hypothesis: 'lonely' } }, { rep: { archivists: 5 } }, { morale: 3 }] } },
          { label: '"Someone who wanted to be found."', tag: 'persuade', do: { text: '"A CLASSIC. WE HAVE FIVE HUNDRED TWELVE SHELVES ON THAT. BUT YOURS IS WARM." The Curator hums a slow note.', fx: [{ flag: { archivist_hypothesis: 'found' } }, { rep: { archivists: 5 } }, { morale: 3 }] } },
          { label: '"I don\'t know. Let\'s find out together."', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"TOGETHER." The Curator rolls the word around its casing as if tasting it. A bronze token is pressed into your palm. "AN OPEN INVITATION."', fx: [{ flag: { archivist_hypothesis: 'together' } }, { rep: { archivists: 8 } }, { item: { riddle_coin: 1 } }, { morale: 5 }] }, fail: { text: '"AN ORIGINAL ANSWER. WE WILL CONSIDER IT FURTHER, FOR SEVEN DAYS." You are fondly dismissed.', fx: [{ flag: { archivist_hypothesis: 'together' } }, { rep: { archivists: 3 } }] } },
        ],
      },
    },
  },
];
