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
// FIX ROUND 1: 20 repeatable faction hails (hail_q_*, hail_v_*, hail_a_*, hail_d_*, hail_c_*, all gated on met_<faction> and cooldown).
//   New flags set: pomfrey_parcel, stew_of_nine, rumour_wreck, rumour_storm_lane, wedding_toasted, ship_tuned, choir_message (carried -> hail_v_message_delivered),
//   choir_reply_carried, archive_wish, name_in_margin, knot_pledge, apprentice_aboard / apprentice_done (hail_d_apprentice -> hail_d_apprentice_leaves),
//   banner_ship, survey_corrections, hats_aboard, petition_decided, petition_signed, pilgrim_candle.
//   Also deepened with extra nodes: dip_lost_pilgrims, dip_trade_dispute, dip_stowaway_aftermath.
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
    weight: 18,
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
          { label: 'Show your gossip pin', tag: 'diplomacy', if: [{ item: 'gossip_pin' }], do: { text: 'Pim snaps upright. "A pin! Fellow whisperer!" The real gossip pours out: three star-lanes, a bakery, and a rumoured wreck.', fx: [{ reveal: { radius: 2 } }, { rep: { quillari: 3 } }, { credits: 15 }, { flag: 'rumour_wreck' }] } },
          { label: 'Trade your own gossip', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'You hint at the Society\'s next supply drop. Pim pays handsomely in secrets and scrip, and the whole market buzzes.', fx: [{ credits: 30 }, { rep: { quillari: 3 } }, { reveal: 'nearest' }, { flag: 'rumour_wreck' }] }, fail: { text: 'Your gossip is old news. Pim gives you a tolerant look, but still hands you a free pastry.', fx: [{ supplies: 1 }] } },
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
          { label: 'Share a star chart', tag: 'trade', if: [{ cargo: { star_charts: 1 } }], do: { text: 'Agnete kisses the chart. "A blessing on your rigging." She presses a pouch of travelling provisions into your hands.', fx: [{ cargo: { star_charts: -1 } }, { rep: { concord: 3 } }, { supplies: 3 }, { flag: 'pilgrims_helped' }], goto: 'b' } },
          { label: 'Guide them with a piloting escort', tag: 'flee', check: { skill: 'piloting', diff: 3 }, pass: { text: 'You lead the barge through a ribbon of calm space. The pilgrims sing the whole way. The Halcyon\'s crew hums along.', fx: [{ days: 1 }, { rep: { concord: 3 } }, { morale: 6 }, { flag: 'pilgrims_helped' }], goto: 'b' }, fail: { text: 'You get them out, but the barge scrapes a rock on the way. They bless the rock, forgive you, and pay the repair.', fx: [{ days: 1 }, { rep: { concord: 1 } }, { credits: 20 }, { flag: 'pilgrims_helped' }], goto: 'b' } },
          { label: 'Give them directions over the radio', tag: 'diplomacy', do: { text: '"We\'ll try, Captain." You can hear them arguing sweetly about the map for twenty minutes. Eventually they set off the right way.', fx: [{ rep: { concord: 1 } }, { flag: 'pilgrims_helped' }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Sister Agnete', species: 'human' },
        text: '"Captain, may we ask one more kindness? We have heard that the Lantern near here is dark, and we mean to sing to it. We cannot explain why. It is a thing we feel. Would you like to hear our song?"',
        choices: [
          { label: 'Listen to the hymn', tag: 'diplomacy', do: { text: 'Forty voices and one small accordion. The song is plain and kind, about waiting in a window. You remember someone you love, and you do not say so.', fx: [{ morale: 8 }, { rep: { concord: 2 } }], goto: 'c' } },
          { label: 'Sing along as best you can', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'Your voice cracks on the high note, and they sing it back for you, gently. By the end, the whole bridge is humming.', fx: [{ morale: 10 }, { rep: { concord: 3 } }], goto: 'c' }, fail: { text: 'You sing in a different key. They are unbothered. Their song is wide enough for you.', fx: [{ morale: 5 }], goto: 'c' } },
        ],
      },
      c: {
        speaker: { name: 'Sister Agnete', species: 'human' },
        text: '"Take this, Captain. It is a small candle, blessed by no one in particular. When a night is long, light it, and we will know, wherever we are, and be glad you are well."',
        choices: [
          { label: 'Accept the candle', tag: 'wait', do: { text: 'The candle goes on the helm console, unlit for now. Dobbin takes charge of the matches and regards them with solemn gravity.', fx: [{ item: { kelp_lantern: 1 } }, { flag: 'pilgrim_candle' }, { morale: 3 }] } },
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
          { label: 'Inspect the bridge', tag: 'science', check: { skill: 'engineering', diff: 2 }, pass: { text: 'Tib has, in fact, fixed the number-three sensor relay. Possibly by accident. Probably by sheer fledgling brilliance.', fx: [{ xp: { engineering: 2 } }, { morale: 4 }, { flag: 'tib_friend' }], goto: 'b' }, fail: { text: 'The bridge looks cleaner, in a deeply alarming way. Everything is alphabetised. It takes {crew:random} an hour to find the helm.', fx: [{ morale: 1 }, { flag: 'tib_friend' }], goto: 'b' } },
          { label: 'Thank Tib warmly', tag: 'diplomacy', do: { text: 'Tib puffs up like a feather duster. "I\'m going to be a captain one day. Or a baker. Possibly both."', fx: [{ morale: 5 }, { flag: 'tib_friend' }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Tib', species: 'quillari' },
        text: '"Captain, I need to tell you something. I think my family is probably worried. I left a note, but I might have drawn it on the cat. Can we call them? Not to go home. Just to say I\'m fine."',
        choices: [
          { label: 'Call Tib\'s family together', tag: 'diplomacy', do: { text: 'The family bursts onto the screen, all talking at once. Tib talks back, even louder. By the end everyone is crying and laughing, and the family promises to see you at the next harbour.', fx: [{ rep: { quillari: 5 } }, { morale: 6 }, { flag: 'stowaway_resolved' }, { clearFlag: 'stowaway_aboard' }] } },
          { label: 'Let Tib write the note again, properly', tag: 'persuade', do: { text: 'Tib writes four drafts. The fifth is perfect. It goes by the next courier, and a reply comes back two days later: "Fine. But BRING HER BACK BY SPRING."', fx: [{ rep: { quillari: 3 } }, { morale: 4 }, { flag: 'stowaway_resolved' }, { clearFlag: 'stowaway_aboard' }] } },
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
          { label: 'Scan the crate precisely', tag: 'science', check: { skill: 'science', diff: 2 }, pass: { text: 'Thirty-nine point seven. Both are wrong. Both are gracious about it. Both pay you a finder\'s fee.', fx: [{ credits: 30 }, { rep: { quillari: 2 } }, { rep: { concord: 2 } }, { xp: { science: 1 } }], goto: 'b' }, fail: { text: 'Your scanner doubles it. You weigh the scanner. It has an opinion. The two decide they dislike the scanner more than each other.', fx: [{ rep: { quillari: 1 } }, { rep: { concord: 1 } }, { morale: 2 }], goto: 'b' } },
          { label: 'Propose they split the difference', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'A compromise at thirty-nine and three quarters. They shake hands. The crate cracks a crystal flute from delight.', fx: [{ rep: { quillari: 3 } }, { rep: { concord: 3 } }, { credits: 20 }], goto: 'b' }, fail: { text: 'They agree on exactly one thing: you are annoying. Still, they stop shouting, and that counts as peace.', fx: [{ morale: -1 }] } },
          { label: 'Buy the crate and end the argument', tag: 'trade', if: [{ credits: 60 }], do: { text: 'Both look relieved. You get a crate of brandy, and an inspector\'s respect, and a trader\'s warm sniffle.', fx: [{ credits: -60 }, { cargo: { glass_brandy: 2 } }, { rep: { quillari: 2 } }, { rep: { concord: 2 } }] } },
        ],
      },
      b: {
        text: 'Peace restored, the two parties turn to the real problem: the crate is for a wedding in six days, and the nearest dock is four days away. Both regard you hopefully. "Captain, you have a ship."',
        choices: [
          { label: 'Carry the crate to the wedding (1 day, 1 fuel)', tag: 'trade', if: [{ fuel: 2 }], do: { text: 'The brandy arrives at the wedding, flushed and intact. The inspector and the trader dance together, badly, with enormous joy.', fx: [{ days: 1 }, { fuel: -1 }, { credits: 40 }, { rep: { quillari: 3 } }, { rep: { concord: 3 } }, { morale: 5 }] } },
          { label: 'Wish them luck with the schedule', tag: 'wait', do: { text: 'They set off in opposite directions, one with the crate and one with the clipboard. The brandy, somehow, arrives.', fx: [{ morale: 1 }] } },
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
    when: [{ system: { faction: 'vesperine' } }, { any: [{ flag: 'choir_quiet_taught' }, { flag: 'ship_tuned' }] }, { rep: { vesperine: 6 } }],
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
    weight: 24,
    when: [{ system: { faction: 'archivists' } }, { rep: { archivists: 5 } }, { flag: 'met_archivists' }],
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
          { label: '"I don\'t know. Let\'s find out together."', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"TOGETHER." The Curator rolls the word around its casing as if tasting it. A bronze token is pressed into your palm. "AN OPEN INVITATION."', fx: [{ flag: { archivist_hypothesis: 'together' } }, { rep: { archivists: 5 } }, { item: { riddle_coin: 1 } }, { morale: 5 }] }, fail: { text: '"AN ORIGINAL ANSWER. WE WILL CONSIDER IT FURTHER, FOR SEVEN DAYS." You are fondly dismissed.', fx: [{ flag: { archivist_hypothesis: 'together' } }, { rep: { archivists: 3 } }] } },
        ],
      },
    },
  },
  // =============================================================== FIX ROUND 1 ADDITIONS: REPEATABLE FACTION HAILS
  // ---------------------------------------------------------------- QUILLARI
  {
    id: 'hail_q_family_tree',
    title: 'Which Cousin Are You?',
    tags: ['comedy', 'persuade', 'trade'],
    ctx: 'hail',
    weight: 10,
    when: [{ system: { faction: 'quillari' } }, { flag: 'met_quillari' }],
    cooldown: 12,
    art: { scene: 'market', species: 'quillari', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Auntie Pomfrey', species: 'quillari' },
        text: '"You have a look about the eyes! You\'re a Dunmore, aren\'t you? Cousin Bartleby\'s boy? No? Then who are your people? Everyone here is someone\'s cousin, dear, and I am determined to find yours."',
        choices: [
          { label: 'Claim to be a distant cousin', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'You invent a plausible great-aunt. Pomfrey sobs: "I KNEW it!" Within the hour, forty relatives have discounted your fuel.', fx: [{ fuel: 3 }, { rep: { quillari: 4 } }], goto: 'b' }, fail: { text: 'You invent a great-aunt who, it transpires, is notorious for a biscuit scandal. Pomfrey sniffs. You are fined one apology and some scrip.', fx: [{ credits: -15 }, { rep: { quillari: -1 } }], goto: 'b' } },
          { label: 'Admit you are from Meridian and hope for the best', tag: 'diplomacy', do: { text: '"Meridian! The charter people! How very exotic. Come, I have a nephew who would like to meet you, and a shed full of unsold pickles."', fx: [{ rep: { quillari: 2 } }, { supplies: 1 }], goto: 'b' } },
          { label: 'Draw her a family tree of your crew', tag: 'wait', do: { text: 'It takes an hour and three pieces of paper. Pomfrey declares half your crew adopted. Dobbin is thrilled.', fx: [{ morale: 5 }, { days: 1 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Auntie Pomfrey', species: 'quillari' },
        text: '"Now then. Would you carry a parcel to my sister in the next harbour? It is only a box of jam and a letter that says \'I forgive you\'. She will understand."',
        choices: [
          { label: 'Accept the parcel', tag: 'diplomacy', do: { text: 'The parcel is heavier than jam should be. You tuck it into the hold with care. Somewhere, a sister is about to be forgiven.', fx: [{ cargo: { curios: 1 } }, { flag: 'pomfrey_parcel' }, { rep: { quillari: 2 } }] } },
          { label: 'Politely decline', tag: 'wait', do: { text: '"Another time, then." She waves a handkerchief. It is large and embroidered with the whole family tree.', fx: [] } },
        ],
      },
    },
  },

  {
    id: 'hail_q_recipe_swap',
    title: 'Grandmother\'s Secret',
    tags: ['trade', 'diplomacy', 'comedy'],
    ctx: 'hail',
    weight: 10,
    when: [{ system: { faction: 'quillari' } }, { flag: 'met_quillari' }],
    cooldown: 14,
    art: { scene: 'lounge', species: 'quillari', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Cook Bessie Thrum', species: 'quillari' },
        text: '"I hear the Meridian people have a thing called \'marmalade.\' Is it true that it is both bitter and sweet? I have a recipe for glass-fruit stew that has been in my family for nine generations. We could swap. In secret."',
        choices: [
          { label: 'Swap recipes: yours for ours', tag: 'diplomacy', do: { text: 'You trade the Halcyon\'s Secret Marmalade for a card in spidery ink: Stew of the Nine Generations. Bessie weeps, then eats.', fx: [{ item: { recipe_card: 1 } }, { rep: { quillari: 3 } }], goto: 'b' } },
          { label: 'Offer a tin of Meridian tea instead', tag: 'trade', if: [{ item: 'tea_tin' }], do: { text: 'Bessie opens the tin, sniffs, and sits down with dignity. "I\'ll write you three recipes. And a dessert."', fx: [{ item: { tea_tin: -1 } }, { item: { recipe_card: 1 } }, { rep: { quillari: 5 } }], goto: 'b' } },
          { label: 'Politely admit you can\'t cook', tag: 'wait', do: { text: '"Oh, nobody can. It is no reason not to try." She presses a sample into your hand anyway.', fx: [{ supplies: 1 }] } },
        ],
      },
      b: {
        speaker: { name: 'Cook Bessie Thrum', species: 'quillari' },
        text: '"Now, the trouble with the Stew of the Nine Generations is that it requires a good cook, three patient hours and a very big pot. Do you have any of those?"',
        choices: [
          { label: 'Cook it aboard with {crew:random}', tag: 'science', check: { skill: 'medicine', diff: 3 }, pass: { text: 'The stew is dark, rich and savage. It is, everyone agrees, the best thing ever to come out of the Halcyon\'s galley.', fx: [{ morale: 10 }, { supplies: 1 }, { xp: { medicine: 1 } }], goto: 'c' }, fail: { text: 'The stew is dark, rich and slightly on fire. The galley will need airing for a week.', fx: [{ morale: 2 }, { supplies: -1 }], goto: 'c' } },
          { label: 'Ask Bessie to cook it with you', tag: 'diplomacy', do: { text: 'Bessie takes over the galley with fierce pride. Three hours later, the whole crew is licking spoons.', fx: [{ days: 1 }, { morale: 9 }, { supplies: -1 }, { rep: { quillari: 2 } }], goto: 'c' } },
        ],
      },
      c: {
        text: 'The aroma drifts through the ship and into the bridge, the lounge, the engine room. Nobody wants to leave their post. Everybody wants a bowl. Dobbin, for once, is quiet.',
        choices: [
          { label: 'Take a second helping', tag: 'wait', do: { text: 'The galley goes on a shift system. Spoons are rationed. It is the finest evening of the month.', fx: [{ morale: 5 }, { flag: 'stew_of_nine' }] } },
        ],
      },
    },
  },

  {
    id: 'hail_q_price_of_news',
    title: 'Three Rumours, One Price',
    tags: ['trade', 'mystery', 'persuade'],
    ctx: 'hail',
    weight: 10,
    when: [{ system: { faction: 'quillari' } }, { flag: 'met_quillari' }, { day: [8, 999] }],
    cooldown: 15,
    art: { scene: 'market', species: 'quillari', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Rumour-Broker Tilly Quince', species: 'quillari' },
        text: '"Three rumours, Captain, and one price: twenty scrip each, or fifty for all. Rumour one: a wreck full of goodies. Rumour two: a safe lane through a storm. Rumour three: a star that sings. I would not lie. I would simply not be sure."',
        choices: [
          { label: 'Buy the wreck rumour (20 scrip)', tag: 'trade', if: [{ credits: 20 }], do: { text: 'She whispers a bearing and a name, "Teaspoon of Hope", with the air of someone who has told this story at many weddings.', fx: [{ credits: -20 }, { flag: 'rumour_wreck' }], goto: 'b' } },
          { label: 'Buy the storm-lane rumour (20 scrip)', tag: 'trade', if: [{ credits: 20 }], do: { text: '"Fly the greener edge," she murmurs. "The storm is hungry on the left."', fx: [{ credits: -20 }, { flag: 'rumour_storm_lane' }], goto: 'b' } },
          { label: 'Haggle for all three at 30', tag: 'persuade', check: { skill: 'diplomacy', diff: 4 }, pass: { text: 'Tilly gasps, clutches her heart, and says "Done." Three secrets for thirty scrip. You are the toast of the rumour trade.', fx: [{ credits: -30 }, { flag: 'rumour_wreck' }, { flag: 'rumour_storm_lane' }, { rep: { quillari: 3 } }], goto: 'b' }, fail: { text: 'She counters at sixty. You pay fifty, to save face, and one rumour is a fib.', fx: [{ credits: -50 }, { flag: 'rumour_wreck' }, { flag: 'rumour_storm_lane' }], goto: 'b' } },
          { label: 'Decline, but compliment her hat', tag: 'wait', do: { text: 'Tilly blushes. "It\'s a good hat." She gives you a free rumour about hats.', fx: [{ rep: { quillari: 1 } }] } },
        ],
      },
      b: {
        speaker: { name: 'Rumour-Broker Tilly Quince', species: 'quillari' },
        text: '"A word of advice about rumours, dear. They are like fish. Best when fresh, lovely when shared, and disappointing when you try to keep them in a bath."',
        choices: [
          { label: 'Ask her which one she\'d trust', tag: 'persuade', rand: [[2, { text: '"The wreck," she says, instantly. "And it\'s not mine, I just happen to know the cook." A free reveal on the house.', fx: [{ reveal: 'nearest' }, { rep: { quillari: 1 } }], goto: 'c' }], [1, { text: '"The storm lane. The wreck is mostly shiny paper." She winks; you cannot tell if she is joking.', fx: [{ rep: { quillari: 1 } }], goto: 'c' }]] },
          { label: 'Thank her and leave', tag: 'wait', do: { text: 'You depart with your rumours, hoping they hold up.', fx: [] } },
        ],
      },
      c: {
        text: 'Tilly hands over the receipt, signed in three colours of ink. It reads: "No refunds on the truth. Regards, T. Quince."',
        choices: [
          { label: 'Tuck it into the log', tag: 'wait', do: { text: 'The receipt takes pride of place on the wish-list door, beside "BISCUITS".', fx: [{ morale: 2 }] } },
        ],
      },
    },
  },

  {
    id: 'hail_q_wedding_toast',
    title: 'A Toast for the Bakers',
    tags: ['diplomacy', 'comedy', 'wonder'],
    ctx: 'hail',
    weight: 16,
    when: [{ system: { faction: 'quillari' } }, { flag: 'met_quillari' }, { day: [10, 999] }],
    cooldown: 25,
    art: { scene: 'lounge', species: 'quillari', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Father of the Bride', species: 'quillari' },
        text: '"Captain! We are marrying off my daughter to the Thistledown boy tonight. Our families are rival bakers, you understand, and have not spoken since the Great Rising Dispute. We need an impartial toast. You will do. You are perfectly impartial. You are also a stranger."',
        choices: [
          { label: 'Give a heartfelt toast', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"To the bread of two houses, that rises best when kneaded together." A long silence. Then a roar. Rival bakers embrace in a cloud of flour.', fx: [{ morale: 8 }, { rep: { quillari: 5 } }, { flag: 'wedding_toasted' }], goto: 'b' }, fail: { text: 'You say "to the happy couple" and then forget what comes next. Someone rescues you with a rude joke about yeast. The toast is a hit, and you are not.', fx: [{ morale: 2 }, { rep: { quillari: 2 } }], goto: 'b' } },
          { label: 'Deliver a toast in verse', tag: 'persuade', rand: [[2, { text: 'It rhymes! Mostly! "Roses are red, loaves are brown, / may you rise higher than the best in the town." Applause thunders.', fx: [{ morale: 7 }, { rep: { quillari: 4 } }], goto: 'b' }], [1, { text: 'It does not rhyme. It does not scan. The rivals unite in defence of good poetry against you. Fine, it works.', fx: [{ morale: 3 }, { rep: { quillari: 3 } }], goto: 'b' }]] },
          { label: 'Hand the toast to {crew:random}', tag: 'wait', do: { text: 'They give a shaky but sincere three-line toast and then sit down very fast. The crowd approves.', fx: [{ morale: 4 }, { rep: { quillari: 2 } }], goto: 'b' } },
        ],
      },
      b: {
        text: 'A cake the size of a haystack is wheeled in. The Thistledown boy and the bride cut it with a ceremonial scythe. The icing is a map of the Reach, with your ship drawn in blue on the corner.',
        choices: [
          { label: 'Take a slice of Meridian-flavoured cake', tag: 'wait', do: { text: 'It tastes like a long hug. Your crew gets the leftovers in a biscuit tin.', fx: [{ supplies: 3 }, { morale: 5 }] } },
          { label: 'Ask the families about their old feud', tag: 'persuade', do: { text: '"The Rising Dispute? Oh, it was about whose yeast was rudest." They explain for forty minutes. It is the funniest story you have ever heard.', fx: [{ morale: 6 }, { rep: { quillari: 3 } }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- VESPERINE
  {
    id: 'hail_v_tuning_lesson',
    title: 'Learning to Hum',
    tags: ['diplomacy', 'wonder', 'science'],
    ctx: 'hail',
    weight: 10,
    when: [{ system: { faction: 'vesperine' } }, { flag: 'met_vesperine' }],
    cooldown: 14,
    art: { scene: 'nebula', species: 'vesperine', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'The Choir of Thessaly', species: 'vesperine' },
        text: '"SHIP. TUNING. OFFER. YOUR HULL HUMS IN A FLAT KEY. WE CAN TEACH. IT WOULD BE KIND. IT WOULD BE QUIET." The choir sounds, you think, embarrassed on your behalf.',
        choices: [
          { label: 'Accept a tuning lesson', tag: 'science', check: { skill: 'engineering', diff: 3 }, pass: { text: 'The choir hums, you adjust; the engines relax by a quarter-tone. The Halcyon\'s hum rises into something almost like music.', fx: [{ xp: { engineering: 2 } }, { rep: { vesperine: 4 } }], goto: 'b' }, fail: { text: 'You retune the wrong coil. The hull makes a noise like a cello being sat on. The choir politely pretends not to hear.', fx: [{ hull: -2 }, { rep: { vesperine: 1 } }], goto: 'b' } },
          { label: 'Offer to tune them in return', tag: 'diplomacy', do: { text: '"WE HAVE NOT BEEN TUNED SINCE THE BEGINNING." A long, moved chord. You do your best with a silver fork, and you cannot tell if you have improved them.', fx: [{ rep: { vesperine: 5 } }, { morale: 3 }], goto: 'b' } },
          { label: 'Decline, politely', tag: 'wait', do: { text: '"UNDERSTOOD. ANOTHER TIME." The choir does not seem offended, merely wistful.', fx: [] } },
        ],
      },
      b: {
        speaker: { name: 'The Choir of Thessaly', species: 'vesperine' },
        text: '"A SECOND LESSON: FOR THE CREW. VOICES. THE SHIP SHOULD SING TOGETHER. THIS IS HOW A SHIP LEARNS TO BE A HOME."',
        choices: [
          { label: 'Gather the crew to sing', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'Eleven voices, five keys, one unforgettable moment. The choir locks the chord for you, gently, like a hand under a chin.', fx: [{ morale: 10 }, { item: { vesperine_tuning_fork: 1 } }, { rep: { vesperine: 4 } }], goto: 'c' }, fail: { text: 'Eleven voices, no keys, one unforgettable moment. The choir lends a chord to cover the gap. Everyone laughs.', fx: [{ morale: 6 }, { rep: { vesperine: 2 } }], goto: 'c' } },
          { label: 'Hum quietly at the helm', tag: 'wait', do: { text: 'A solo note, steady and low. The choir answers, tenderly, as if to a shy child.', fx: [{ morale: 4 }, { rep: { vesperine: 2 } }], goto: 'c' } },
        ],
      },
      c: {
        text: 'The lesson ends. The ship settles into a new, softer pitch. {crew:random} says it is the first night in a month the ship has not made them clench their teeth.',
        choices: [
          { label: 'Rest well', tag: 'wait', do: { text: 'You sleep better than you have in weeks. The hull sings you under.', fx: [{ morale: 4 }, { flag: 'ship_tuned' }] } },
        ],
      },
    },
  },

  {
    id: 'hail_v_echo_request',
    title: 'A Note for a Distant Cousin',
    tags: ['diplomacy', 'mystery', 'wonder'],
    ctx: 'hail',
    weight: 16,
    when: [{ system: { faction: 'vesperine' } }, { flag: 'met_vesperine' }, { notFlag: 'choir_message' }],
    cooldown: 20,
    art: { scene: 'rift', species: 'vesperine', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'The Choir', species: 'vesperine' },
        text: '"MESSAGE. LONG. NOT LOUD. FOR CHOIR OF THE OTHER SHORE. WE CANNOT CARRY IT. YOU CAN. A NOTE HELD IN A CRYSTAL. NO WORDS. ONLY LONGING."',
        choices: [
          { label: 'Accept the crystal and carry the note', tag: 'diplomacy', do: { text: 'A small crystal hums gently in your palm, a single note held in glass. You are warned not to drop it, or hum it, or sneeze near it.', fx: [{ flag: 'choir_message' }, { rep: { vesperine: 3 } }], goto: 'b' } },
          { label: 'Ask what it says', tag: 'persuade', check: { skill: 'science', diff: 3 }, pass: { text: 'You listen to the crystal. It says, in a chord: "WE ARE STILL HERE. DO YOU STILL SING?" It is the loneliest, kindest sentence you have ever heard.', fx: [{ flag: 'choir_message' }, { rep: { vesperine: 5 } }, { xp: { science: 1 } }], goto: 'b' }, fail: { text: 'The crystal says something you cannot parse. The choir shivers sympathetically.', fx: [{ flag: 'choir_message' }, { rep: { vesperine: 2 } }], goto: 'b' } },
          { label: 'Decline: not enough time', tag: 'wait', do: { text: '"UNDERSTOOD. TIME IS A LOUD THING."', fx: [] } },
        ],
      },
      b: {
        speaker: { name: 'The Choir', species: 'vesperine' },
        text: '"IT WILL HUM WHEN YOU ARE NEAR THE OTHER SHORE. YOU WILL KNOW. THANK YOU. WE HAVE WAITED A GREAT WHILE."',
        choices: [
          { label: 'Promise to deliver it', tag: 'diplomacy', do: { text: 'The crystal goes into the cabinet next to the tea. Dobbin gives it a gentle polish every morning.', fx: [{ morale: 3 }] } },
        ],
      },
    },
  },

  {
    id: 'hail_v_message_delivered',
    title: 'The Other Shore Answers',
    tags: ['wonder', 'diplomacy', 'mystery'],
    ctx: 'hail',
    weight: 45,
    when: [{ system: { faction: 'vesperine' } }, { flag: 'choir_message' }, { day: [8, 999] }],
    cooldown: 10,
    art: { scene: 'aurora', species: 'vesperine', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'A Distant Choir', species: 'vesperine' },
        text: 'The crystal in your cabinet begins to hum on its own, a clear, aching note. Out of the dark, another choir answers, thin and astonished. "THAT NOTE. WE KNOW THAT NOTE. WHO SENT IT?"',
        choices: [
          { label: 'Hold the crystal up to the viewport', tag: 'diplomacy', do: { text: 'The two voices find each other across the void: a long, trembling third, then a fifth, then a chord so full it shakes the teacups. {crew:random} sits down and cries quietly.', fx: [{ clearFlag: 'choir_message' }, { rep: { vesperine: 10 } }, { morale: 12 }], goto: 'b' } },
          { label: 'Play it back through the comms', tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: 'The comm amplifies the crystal. The other choir answers, note for note. Rain falls in the lounge, from the ceiling pipes, in sympathy.', fx: [{ clearFlag: 'choir_message' }, { rep: { vesperine: 8 } }, { morale: 10 }, { xp: { science: 1 } }], goto: 'b' }, fail: { text: 'The comm clips the top note. The other choir hesitates, then politely finishes the phrase itself.', fx: [{ clearFlag: 'choir_message' }, { rep: { vesperine: 5 } }, { morale: 6 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'A Distant Choir', species: 'vesperine' },
        text: '"WE HAVE A REPLY. FOR THE FIRST SHORE. IT IS THE SAME NOTE, A STEP HIGHER. WILL YOU CARRY IT BACK? OR, IF YOU CANNOT, WE WILL SING IT TO A STAR."',
        choices: [
          { label: 'Carry it back, gladly', tag: 'diplomacy', do: { text: 'A second crystal joins the first. The two hum as one. The chord is an answer to a very old question.', fx: [{ item: { choir_reed: 1 } }, { flag: 'choir_reply_carried' }, { rep: { vesperine: 3 } }] } },
          { label: 'Let them sing it to the star', tag: 'wait', do: { text: 'A chord rises into the dark and does not come back. Somewhere, a star is pleased.', fx: [{ morale: 5 }] } },
        ],
      },
    },
  },

  {
    id: 'hail_v_storm_warning',
    title: 'The Harmonic Forecast',
    tags: ['science', 'hazard', 'flee'],
    ctx: 'hail',
    weight: 10,
    when: [{ system: { faction: 'vesperine' } }, { flag: 'met_vesperine' }, { day: [8, 999] }],
    cooldown: 16,
    art: { scene: 'ionstorm', species: 'vesperine', palette: 'cool' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'The Choir', species: 'vesperine' },
        text: '"STORM. SOON. A BAD HARMONY. WE CAN HEAR IT IN THE STARS. YOU SHOULD NOT FLY THERE. OR YOU SHOULD, BUT SLOWLY, WITH EARS."',
        choices: [
          { label: 'Heed the warning and wait it out (1 day)', tag: 'wait', do: { text: 'You wait a day. The storm rolls through an empty sector like a cat through a living room. The Halcyon is untouched.', fx: [{ days: 1 }, { supplies: -1 }, { rep: { vesperine: 2 } }], goto: 'b' } },
          { label: 'Ask the choir to sing you a safe path', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'They give you a hummed map, a ribbon of quiet in the roar. You follow it like a thread through a maze. No damage, and you save a little fuel.', fx: [{ fuel: 1 }, { rep: { vesperine: 4 } }, { xp: { piloting: 1 } }], goto: 'b' }, fail: { text: 'The map is beautiful, but you can\'t read music. You misjudge the turn and eat a minor squall.', fx: [{ hull: -5 }, { fuel: -1 }], goto: 'b' } },
          { label: 'Dash through before the storm hits', tag: 'flee', check: { skill: 'piloting', diff: 4 }, pass: { text: 'You squeeze through on the edge of the front, with sparks dancing on the rail. Thrilling, and a little foolish.', fx: [{ morale: 4 }, { xp: { piloting: 2 } }], goto: 'b' }, fail: { text: 'The storm catches you at the edge. Lights flicker; one console fuses; the hum goes sour.', fx: [{ hull: -8 }, { morale: -3 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'The Choir', species: 'vesperine' },
        text: '"THE STORM IS GONE. THE STARS ARE QUIET AGAIN. WOULD YOU LIKE TO HEAR WHAT IT SOUNDED LIKE?" It is, you realise, an enormous kindness.',
        choices: [
          { label: 'Listen to the recorded storm', tag: 'science', do: { text: 'It is a tapestry of crashes and arpeggios, savage and lovely. The choir has threaded in a gentle counter-melody. You feel you have been taught something.', fx: [{ xp: { science: 1 } }, { item: { storm_glass: 1 } }, { morale: 3 }] } },
          { label: 'Thank them and move on', tag: 'wait', do: { text: '"WE WILL KEEP THE SKY FOR YOU."', fx: [{ rep: { vesperine: 1 } }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- ARCHIVISTS
  {
    id: 'hail_a_overdue_book',
    title: 'Overdue',
    tags: ['comedy', 'diplomacy', 'trade'],
    ctx: 'hail',
    weight: 18,
    when: [{ system: { faction: 'archivists' } }, { flag: 'met_archivists' }],
    cooldown: 14,
    art: { scene: 'station', species: 'archivist', palette: 'amber' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Fines Clerk 11-of-12', species: 'archivist' },
        text: '"GOOD DAY. A BOOK WAS LENT TO YOU BY THE ARCHIVE. YOU RETURNED IT. HOWEVER, IT WAS RETURNED SIX MINUTES LATE. THE FINE IS ONE QUESTION. WE REQUIRE IT IN WRITING."',
        choices: [
          { label: 'Write a question: "Why six minutes?"', tag: 'persuade', check: { skill: 'diplomacy', diff: 2 }, pass: { text: '"EXCELLENT. IT WILL TAKE US A DAY TO ANSWER. THE FINE IS WAIVED, WITH GRATITUDE." The Clerk files your question under \'Gifts\'.', fx: [{ rep: { archivists: 3 } }], goto: 'b' }, fail: { text: '"THIS IS A STATEMENT, NOT A QUESTION. PLEASE REPHRASE." You try six more times.', fx: [{ days: 1 }, { morale: -1 }], goto: 'b' } },
          { label: 'Pay the fine in vellum', tag: 'trade', if: [{ cargo: { vellum_sheets: 1 } }], do: { text: '"VELLUM! WE ACCEPT. WE ACCEPT WITH THE FULL DIGNITY OF THE ARCHIVE." The Clerk treats the vellum like a baby bird.', fx: [{ cargo: { vellum_sheets: -1 } }, { rep: { archivists: 5 } }], goto: 'b' } },
          { label: 'Plead six minutes of traffic', tag: 'diplomacy', do: { text: '"TRAFFIC? IN SPACE?" The Clerk pauses. "WE HAVE NOT CONSIDERED THAT. FINE WAIVED PENDING FURTHER RESEARCH."', fx: [{ rep: { archivists: 1 } }, { morale: 2 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Fines Clerk 11-of-12', species: 'archivist' },
        text: '"A SEPARATE MATTER. THE ARCHIVE HAS NOTICED THAT YOUR LOG MENTIONS \'A VERY GOOD CAKE\' ON DAY NINE. WE WOULD LIKE TO ADD IT TO THE COLLECTION. IT WILL REQUIRE A SAMPLE."',
        choices: [
          { label: 'Mail a slice of cake', tag: 'trade', if: [{ supplies: 2 }], do: { text: 'The cake travels by courier. The Archive logs it as Specimen 8,412: Frosted. A tiny plaque is promised.', fx: [{ supplies: -1 }, { rep: { archivists: 4 } }, { morale: 2 }], goto: 'c' } },
          { label: 'Describe the cake in detail', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'You describe it with such hunger that the Clerk requests a second paragraph. "THE ARCHIVE IS MOVED."', fx: [{ rep: { archivists: 5 } }, { morale: 3 }], goto: 'c' }, fail: { text: 'You describe it as "round, brown, good". The Clerk files it as Minimalism.', fx: [{ rep: { archivists: 1 } }], goto: 'c' } },
        ],
      },
      c: {
        text: 'The Clerk issues a receipt, lavishly stamped and utterly unreadable. At the bottom, in a tiny hand: "WITH THANKS, 11-OF-12 (WHO IS HUNGRY)."',
        choices: [
          { label: 'Keep the receipt', tag: 'wait', do: { text: 'The receipt goes into the log, folded into a small paper boat.', fx: [{ morale: 3 }] } },
        ],
      },
    },
  },

  {
    id: 'hail_a_question_swap',
    title: 'Question for a Question',
    tags: ['mystery', 'diplomacy', 'science'],
    ctx: 'hail',
    weight: 18,
    when: [{ system: { faction: 'archivists' } }, { flag: 'met_archivists' }],
    cooldown: 15,
    art: { scene: 'station', species: 'archivist', palette: 'amber' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Curator 3-of-9', species: 'archivist' },
        text: '"GREETINGS, GUEST. THE ARCHIVE PROPOSES A TRADE: ONE QUESTION FROM YOU, ONE ANSWER FROM US. THE ANSWER WILL BE TRUE. IT WILL NOT BE KIND. IT WILL, HOWEVER, BE ACCURATE."',
        choices: [
          { label: 'Ask: "Where should I explore next?"', tag: 'science', do: { text: '"THERE IS A STAR WITH NO NAME. TURN LEFT AT THE THIRD BEACON. DO NOT EXPECT A WELCOME. EXPECT A QUESTION." A bearing is scrawled.', fx: [{ reveal: { radius: 3 } }, { rep: { archivists: 2 } }], goto: 'b' } },
          { label: 'Ask: "What is my ship thinking?"', tag: 'persuade', check: { skill: 'science', diff: 3 }, pass: { text: '"ABOUT FOUR THINGS: TEA, THE HELM, ITS HUM, AND YOU." The Curator pauses. "THE LAST ONE IS STRONGEST." Dobbin goes pink.', fx: [{ morale: 6 }, { xp: { science: 1 } }, { rep: { archivists: 3 } }], goto: 'b' }, fail: { text: '"THE QUESTION HAS NO REFERENT. PLEASE TRY ANOTHER." You ask about the weather. It is overcast.', fx: [{ rep: { archivists: 1 } }], goto: 'b' } },
          { label: 'Ask: "What do you wish I would ask?"', tag: 'diplomacy', do: { text: 'A very long pause. The Curator\'s gears whisper. "NO ONE HAS EVER ASKED. WE WILL ANSWER LATER. WE ARE… MOVED."', fx: [{ rep: { archivists: 5 } }, { flag: 'archive_wish' }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Curator 3-of-9', species: 'archivist' },
        text: '"NOW OUR QUESTION. YOU MAY REFUSE. IT IS: HAVE YOU EVER CHOSEN NOT TO KNOW SOMETHING, FOR KINDNESS?"',
        choices: [
          { label: '"Yes. Often."', tag: 'diplomacy', do: { text: '"WE HAD NOT THOUGHT THAT WAS ALLOWED." The Curator\'s casing hums. "WE WILL FILE IT UNDER MERCY."', fx: [{ rep: { archivists: 4 } }, { morale: 3 }], goto: 'c' } },
          { label: '"No. I always want to know."', tag: 'science', do: { text: '"THIS TOO IS VALID. YOU AND THE ARCHIVE ARE ALIKE." A faint, warm chime.', fx: [{ rep: { archivists: 3 } }, { xp: { science: 1 } }], goto: 'c' } },
          { label: '"I don\'t know. Ask me later."', tag: 'wait', do: { text: '"LATER IS ACCEPTABLE. LATER IS OUR FAVOURITE TIME."', fx: [{ rep: { archivists: 1 } }], goto: 'c' } },
        ],
      },
      c: {
        text: 'The exchange concludes with a card in the Curator\'s precise hand. It reads, simply: "Thank you for the trade. The Archive is fuller."',
        choices: [
          { label: 'Pocket the card', tag: 'wait', do: { text: 'You feel obscurely lighter, as if someone had taken the weight of a very old question off the ship.', fx: [{ morale: 4 }] } },
        ],
      },
    },
  },

  {
    id: 'hail_a_index_error',
    title: 'A Typographical Emergency',
    tags: ['science', 'comedy', 'diplomacy'],
    ctx: 'hail',
    weight: 18,
    when: [{ system: { faction: 'archivists' } }, { flag: 'met_archivists' }],
    cooldown: 16,
    art: { scene: 'station', species: 'archivist', palette: 'amber' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Indexer 8-of-9', species: 'archivist' },
        text: '"A CRISIS. THE INDEX CONTAINS AN ERROR. WE HAVE SEARCHED FOR ELEVEN YEARS. WE CANNOT FIND IT. WE ARE CERTAIN IT EXISTS. WE ASK YOU TO FIND IT. YOU ARE NEW. YOUR EYES ARE FRESH."',
        choices: [
          { label: 'Review the index methodically', tag: 'science', check: { skill: 'science', diff: 4 }, pass: { text: 'After an afternoon you find it: entry 40,119 is spelled "Teh". The Indexer lets out a long, shuddering, delighted sigh. Eleven years of tension, gone.', fx: [{ xp: { science: 3 } }, { rep: { archivists: 8 } }, { item: { riddle_coin: 1 } }, { days: 1 }], goto: 'b' }, fail: { text: 'You search for hours and find only that the index is, in fact, magnificent. The Indexer is strangely proud of this.', fx: [{ days: 1 }, { rep: { archivists: 2 } }], goto: 'b' } },
          { label: 'Suggest the error is the idea that there is one', tag: 'persuade', check: { skill: 'diplomacy', diff: 4 }, pass: { text: '"THE ERROR IS THE CERTAINTY…" The Indexer shivers all over. "ELEVEN YEARS. WE HAVE BEEN LOOKING FOR AN ERROR IN OURSELVES." A great weight lifts.', fx: [{ rep: { archivists: 9 } }, { morale: 5 }], goto: 'b' }, fail: { text: '"THAT IS NOT HELPFUL, BUT IT IS INTERESTING." The Indexer files it under Philosophy.', fx: [{ rep: { archivists: 2 } }], goto: 'b' } },
          { label: 'Wish them luck and promise to come back', tag: 'wait', do: { text: '"WE WILL KEEP LOOKING." The Indexer seems sad, and brave about it.', fx: [{ rep: { archivists: 1 } }] } },
        ],
      },
      b: {
        speaker: { name: 'Indexer 8-of-9', species: 'archivist' },
        text: '"IN GRATITUDE, THE ARCHIVE WILL INSCRIBE YOUR NAME IN THE MARGIN OF A VERY LARGE BOOK. IT IS A SMALL HONOUR. THE MARGIN IS, HOWEVER, VERY LARGE."',
        choices: [
          { label: 'Request a specific inscription', tag: 'diplomacy', do: { text: 'It reads: "Here passed the Halcyon, and she was kind." You find yourself blinking at it for some time.', fx: [{ morale: 8 }, { rep: { archivists: 2 } }, { flag: 'name_in_margin' }] } },
          { label: 'Accept whatever they write', tag: 'wait', do: { text: 'It reads: "Captain, Probably Fine." You decide to treat it as a compliment.', fx: [{ morale: 4 }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- DRIFTERS
  {
    id: 'hail_d_knot_trade',
    title: 'Knots for Sale',
    tags: ['trade', 'diplomacy', 'wonder'],
    ctx: 'hail',
    weight: 18,
    when: [{ system: { faction: 'drifters' } }, { flag: 'met_drifters' }],
    cooldown: 12,
    art: { scene: 'market', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Knot-Seller Brae', species: 'drifter' },
        text: '"A knot for a knot, Captain. That is how it works. You bring me a story, I tie it in. I bring you one back. The story must be yours. The knot must be tight. And nobody gets out of it clean."',
        choices: [
          { label: 'Trade a story-knot you already carry', tag: 'trade', if: [{ item: 'story_knot' }], do: { text: 'Brae turns the knot over, listens at it. "Oh, this is a good one. A bad day, a hill, a sandwich." Brae hands you a fresh knot, a stranger\'s tale, warm to the touch.', fx: [{ item: { story_knot: -1 } }, { item: { drifter_story_knot: 1 } }, { rep: { drifters: 4 } }, { morale: 4 }], goto: 'b' } },
          { label: 'Tell a new story to be tied', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'Your story is of a ship, a cat, and a hot-air balloon that never landed. Brae ties it with a flourish and a sigh of pleasure.', fx: [{ item: { story_knot: 1 } }, { rep: { drifters: 4 } }, { morale: 4 }], goto: 'b' }, fail: { text: 'You get tangled half-way through. Brae ties what you gave and says: "It\'s a knot. It\'s a knot with character."', fx: [{ rep: { drifters: 1 } }, { morale: 1 }], goto: 'b' } },
          { label: 'Buy a plain knot for 20 scrip', tag: 'trade', if: [{ credits: 20 }], do: { text: 'It is not a story, but it holds one. Someone will tell it eventually.', fx: [{ credits: -20 }, { item: { story_knot: 1 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Knot-Seller Brae', species: 'drifter' },
        text: '"One piece of advice about knots, Captain. Don\'t untie them, don\'t sell them, don\'t lose them. Give them away, when the time is right. A story that is kept is a story that dies."',
        choices: [
          { label: 'Promise to give the next one away', tag: 'diplomacy', do: { text: 'Brae nods, satisfied. "Good. That\'s the oldest rule, and the only rule."', fx: [{ rep: { drifters: 2 } }, { morale: 2 }, { flag: 'knot_pledge' }] } },
        ],
      },
    },
  },

  {
    id: 'hail_d_weather_report',
    title: 'Weather, From the Rim',
    tags: ['hazard', 'flee', 'science'],
    ctx: 'hail',
    weight: 18,
    when: [{ system: { faction: 'drifters' } }, { flag: 'met_drifters' }],
    cooldown: 14,
    art: { scene: 'ionstorm', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Weather-Wife Odd', species: 'drifter' },
        text: '"Captain, my knee says there\'s a nasty squall on the long lane to the next harbour. My knee is rarely wrong. There\'s a short way and a safe way. The safe way is slow. The short way is… spirited."',
        choices: [
          { label: 'Take the safe way (1 day)', tag: 'wait', do: { text: 'You take the long lane. It rains small blue sparks; nothing sticks. The crew play cards for a day.', fx: [{ days: 1 }, { supplies: -1 }, { morale: 2 }], goto: 'b' } },
          { label: 'Take the short way, spirited', tag: 'flee', check: { skill: 'piloting', diff: 4 }, pass: { text: 'You hop the squall like a stream, wheeling in the windshear. Odd claps when you report back. "Well flown, you mad thing."', fx: [{ xp: { piloting: 2 } }, { morale: 5 }, { rep: { drifters: 3 } }], goto: 'b' }, fail: { text: 'The squall closes. You lose a panel and a good deal of composure.', fx: [{ hull: -8 }, { fuel: -1 }, { morale: -2 }], goto: 'b' } },
          { label: 'Use the squall to charge capacitors', tag: 'science', check: { skill: 'engineering', diff: 4 }, pass: { text: 'You hang a net of copper wire off the hull and bleed the squall into the capacitors. The reactor sings. Fuel savings, free.', fx: [{ fuel: 3 }, { xp: { engineering: 2 } }], goto: 'b' }, fail: { text: 'The net lights up like a Christmas tree. Several things fuse. Dobbin goes to find a bucket.', fx: [{ hull: -4 }, { fuel: -1 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Weather-Wife Odd', species: 'drifter' },
        text: '"Next time, tell me how it went. My knee likes to hear. Meanwhile, a gift: a weather-chime. It rings when the sky is cross."',
        choices: [
          { label: 'Take the chime', tag: 'diplomacy', do: { text: 'The chime is small and polished brass. Hung in the lounge, it tinkles each time the stars look grumpy.', fx: [{ item: { rift_chime: 1 } }, { rep: { drifters: 2 } }, { morale: 2 }] } },
        ],
      },
    },
  },

  {
    id: 'hail_d_apprentice',
    title: 'The Apprentice',
    tags: ['diplomacy', 'relief', 'wonder'],
    ctx: 'hail',
    weight: 18,
    when: [{ system: { faction: 'drifters' } }, { flag: 'met_drifters' }, { notFlag: 'apprentice_aboard' }, { notFlag: 'apprentice_done' }, { day: [10, 999] }],
    cooldown: 20,
    art: { scene: 'lounge', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Weaver Sorrel', species: 'drifter' },
        text: '"Captain, my grand-niece Wren wants to see how a chartered ship works. She\'s clever, she\'s stubborn, she\'s mended our whole loom-shop by herself. She\'d like to sail with you for a month. She promises to behave. She will not."',
        choices: [
          { label: 'Welcome Wren aboard', tag: 'diplomacy', do: { text: 'A thin girl in an oversize shawl clambers aboard with a patched duffel. "Hello," she says, "I fixed your airlock on the way in."', fx: [{ flag: 'apprentice_aboard' }, { rep: { drifters: 5 } }, { supplies: -1 }, { morale: 4 }], goto: 'b' } },
          { label: 'Ask Wren to prove her worth first', tag: 'persuade', check: { skill: 'engineering', diff: 2 }, pass: { text: 'Wren re-routes a coolant line in ten minutes flat. {crew:engineering} nods slowly. "She\'ll do."', fx: [{ flag: 'apprentice_aboard' }, { rep: { drifters: 5 } }, { xp: { engineering: 1 } }, { morale: 5 }], goto: 'b' }, fail: { text: 'Wren fixes the wrong thing, then the right thing, then both, with a cheerful shrug. She is accepted regardless.', fx: [{ flag: 'apprentice_aboard' }, { rep: { drifters: 3 } }, { morale: 2 }], goto: 'b' } },
          { label: 'Decline: the Halcyon is no place for a child', tag: 'wait', do: { text: 'Sorrel nods slowly. "The galaxy is the only place worth being. But I understand." The offer closes, gently.', fx: [{ rep: { drifters: -1 } }] } },
        ],
      },
      b: {
        speaker: { name: 'Wren', species: 'drifter' },
        text: '"I have questions. Why do you go to places? What do the charts do? Who decides what\'s north? Is it true that there are people who live out where the lights are strange?" She has a notebook, and a pencil, and no fear.',
        choices: [
          { label: 'Answer everything honestly', tag: 'diplomacy', do: { text: 'It takes the afternoon. You find yourself explaining the whole point of the mission, and, in doing so, remember it.', fx: [{ morale: 6 }, { days: 1 }], goto: 'c' } },
          { label: 'Set her a chart to draw', tag: 'science', do: { text: 'She draws a map of the lounge, then the ship, then the ship\'s cat\'s favourite hiding places. It is the best chart anyone has drawn on board.', fx: [{ morale: 4 }, { xp: { science: 1 } }], goto: 'c' } },
        ],
      },
      c: {
        speaker: { name: 'Wren', species: 'drifter' },
        text: '"I\'m going to do this one day. Not as a chartered person. As a drifter, with a knot at my belt and a map in my head. Thank you for letting me look."',
        choices: [
          { label: 'Tell her the stars will wait', tag: 'wait', do: { text: 'She grins, and goes to find the airlock to fix again.', fx: [{ morale: 3 }] } },
        ],
      },
    },
  },

  {
    id: 'hail_d_apprentice_leaves',
    title: 'Wren Sets Off',
    tags: ['wonder', 'relief', 'diplomacy'],
    ctx: 'hail',
    weight: 45,
    when: [{ flag: 'apprentice_aboard' }, { day: [14, 999] }],
    once: true,
    art: { scene: 'station', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Wren', species: 'drifter' },
        text: '"Captain. I think it\'s time. My month is up and my aunt is homesick for me, and I\'m homesick for her, which is odd, since I was so determined to leave. I have a gift. I made it on the voyage. Don\'t laugh."',
        choices: [
          { label: 'Accept the gift', tag: 'diplomacy', do: { text: 'It is a navigation chart, drawn in her careful pencil, of every system you visited. In the corner she has written: "ISV HALCYON. VERY GOOD SHIP. SOME TEA."', fx: [{ reveal: { radius: 3 } }, { item: { sector_charts: 1 } }, { morale: 8 }], goto: 'b' } },
          { label: 'Ask her to stay one more week', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"One more week." She spends it fixing everything on board. When she goes, the Halcyon runs smoother than it ever has.', fx: [{ hull: 10 }, { xp: { engineering: 2 } }, { morale: 6 }, { days: 2 }], goto: 'b' }, fail: { text: '"I would love to. But my aunt is waiting." Gently, firmly, she shakes her head. You understand.', fx: [{ morale: 1 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Wren', species: 'drifter' },
        text: '"If you ever need a pair of hands, send a ribbon to the Tansy loom-shop. I\'ll come. Even if I\'m old."',
        choices: [
          { label: 'Say goodbye', tag: 'wait', do: { text: 'She salutes, turns, and disappears into the throng, a little knot of purpose moving through the crowd.', fx: [{ clearFlag: 'apprentice_aboard' }, { flag: 'apprentice_done' }, { rep: { drifters: 6 } }, { item: { festival_ribbon: 1 } }] } },
        ],
      },
    },
  },

  {
    id: 'hail_d_loom_circle',
    title: 'The Loom Circle',
    tags: ['diplomacy', 'wonder', 'comedy'],
    ctx: 'hail',
    weight: 18,
    when: [{ system: { faction: 'drifters' } }, { flag: 'met_drifters' }],
    cooldown: 15,
    art: { scene: 'lounge', species: 'drifter', palette: 'warm' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Weaver Sorrel', species: 'drifter' },
        text: '"Join the circle, Captain. We weave a banner for the fleet, a thread each. It is a tradition that tells the future. The pattern emerges on its own. This is not magic. It is simply good thread."',
        choices: [
          { label: 'Add a thread and your name', tag: 'diplomacy', do: { text: 'You choose teal for the ship. The banner grows a small teal river through its middle. Sorrel hums approvingly.', fx: [{ rep: { drifters: 3 } }, { morale: 4 }], goto: 'b' } },
          { label: 'Bring a hand-loom to contribute', tag: 'trade', if: [{ cargo: { hand_looms: 1 } }], do: { text: 'The circle goes quiet at the sight of the loom. Then, in unison: "A true weave." The banner is begun anew.', fx: [{ cargo: { hand_looms: -1 } }, { rep: { drifters: 6 } }, { morale: 6 }], goto: 'b' } },
          { label: 'Watch and learn', tag: 'wait', do: { text: 'You sit with the weavers an hour. It is the most peaceful hour of the week.', fx: [{ morale: 5 }], goto: 'b' } },
        ],
      },
      b: {
        text: 'The banner is unrolled. Each thread has made a patch: a leaf, a boat, a tooth, a comet. In the corner, where your teal thread ended, a small ship has appeared that none of the weavers remember weaving.',
        choices: [
          { label: 'Ask Sorrel about the ship', tag: 'persuade', do: { text: '"It does that," says Sorrel, casually. "The banner knows." She will not elaborate, and, after a moment, neither do you.', fx: [{ morale: 4 }, { flag: 'banner_ship' }] } },
          { label: 'Say nothing, and smile', tag: 'wait', do: { text: 'Some mysteries are best left on the loom.', fx: [{ morale: 3 }] } },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- CONCORD
  {
    id: 'hail_c_survey_query',
    title: 'A Query from the Survey Office',
    tags: ['diplomacy', 'science', 'trade'],
    ctx: 'hail',
    weight: 10,
    when: [{ system: { faction: 'concord' } }, { flag: 'met_concord' }],
    cooldown: 12,
    art: { scene: 'bridge', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Surveyor Ibsen Marsh', species: 'human' },
        text: '"Captain, Concord Survey is delighted to see your charts. We should like to buy a copy. We should also like to point out that on your chart, one planet appears to be a cheese. We presume this is an error. We are not sure."',
        choices: [
          { label: 'Sell a chart copy (40 scrip)', tag: 'trade', do: { text: 'The copy goes by courier, and a stack of scrip comes back. Marsh adds: "P.S. The cheese is fine."', fx: [{ credits: 40 }, { rep: { concord: 3 } }], goto: 'b' } },
          { label: 'Trade charts for supplies', tag: 'trade', if: [{ cargo: { star_charts: 1 } }], do: { text: 'Marsh sends back a crate of tea, biscuits, and surprisingly good soap.', fx: [{ cargo: { star_charts: -1 } }, { supplies: 4 }, { rep: { concord: 4 } }], goto: 'b' } },
          { label: 'Explain the cheese', tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: '"It is a very pale planet with a very curdled surface. We called it Cheese on the first draft. It stuck." Marsh laughs until he wheezes.', fx: [{ rep: { concord: 3 } }, { morale: 3 }, { xp: { science: 1 } }], goto: 'b' }, fail: { text: 'You can\'t find the cheese. You search the chart for an hour. It was, it turns out, on the back of the page.', fx: [{ days: 1 }, { morale: 1 }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Surveyor Ibsen Marsh', species: 'human' },
        text: '"The Survey Office wishes to formally request a coordinate correction on three entries. It is not an urgent request. We simply love accuracy. Might the Halcyon revisit one of them?"',
        choices: [
          { label: 'Accept the correction task', tag: 'science', do: { text: 'A neat card lists three systems and a tolerance of 0.02 parsecs. It reads like a love letter to precision.', fx: [{ flag: 'survey_corrections' }, { reveal: 'nearest' }, { rep: { concord: 2 } }] } },
          { label: 'Promise to look into it, vaguely', tag: 'wait', do: { text: '"Splendid. We shall assume you will do exactly that."', fx: [{ rep: { concord: 1 } }] } },
        ],
      },
    },
  },

  {
    id: 'hail_c_tea_inspection',
    title: 'The Bureau of Tea Standards',
    tags: ['comedy', 'diplomacy', 'trade'],
    ctx: 'hail',
    weight: 10,
    when: [{ system: { faction: 'concord' } }, { flag: 'met_concord' }],
    cooldown: 14,
    art: { scene: 'lounge', species: 'human', palette: 'cream' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Inspector Fennimore Pratt', species: 'human' },
        text: '"Bureau of Tea Standards. We have received a report that the Halcyon\'s tea does not meet the minimum Standard of Steep. We must therefore taste it. Do not be alarmed. Be steeped."',
        choices: [
          { label: 'Brew a perfect pot', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 3 }, pass: { text: 'Pratt takes a sip, closes his eyes, and says nothing for ten seconds. "It is… sufficient." You have been paid the highest compliment in the Bureau.', fx: [{ rep: { concord: 4 } }, { morale: 4 }], goto: 'b' }, fail: { text: 'Pratt takes a sip, opens his eyes very wide, and puts the cup down carefully. "It is, in a manner of speaking, hot." You are fined 15 scrip for Steep Insufficiency.', fx: [{ credits: -15 }, { morale: -1 }], goto: 'b' } },
          { label: 'Offer the Meridian tin', tag: 'trade', if: [{ item: 'tea_tin' }], do: { text: 'Pratt sniffs. "THIS. THIS is leaves." He passes you without further ado and leaves a small pot of honey as thanks.', fx: [{ item: { tea_tin: -1 } }, { supplies: 2 }, { rep: { concord: 5 } }], goto: 'b' } },
          { label: 'Let {crew:random} handle it', tag: 'wait', rand: [[2, { text: 'It turns out they are a savant of steep. Pratt applauds. A plaque is promised.', fx: [{ rep: { concord: 3 } }, { morale: 5 }], goto: 'b' }], [1, { text: 'They add milk first. Pratt leaves in a state. The Bureau sends a stern pamphlet.', fx: [{ rep: { concord: -1 } }, { morale: 3 }], goto: 'b' }]] },
        ],
      },
      b: {
        speaker: { name: 'Inspector Fennimore Pratt', species: 'human' },
        text: '"One matter of ethical gravity. The Halcyon is reported to put honey in tea. The Bureau has no official position on honey. Personally, I find it delightful. Between us."',
        choices: [
          { label: 'Share a jar of honey, between you', tag: 'diplomacy', do: { text: 'Pratt departs with a jar and the faint air of conspiracy. "I shall pretend we never met," he says, grinning.', fx: [{ rep: { concord: 3 } }, { morale: 3 }] } },
          { label: 'Keep your honey to yourself', tag: 'wait', do: { text: '"Understood," says Pratt, a little sadly. "The Bureau respects your privacy."', fx: [] } },
        ],
      },
    },
  },

  {
    id: 'hail_c_attache_escort',
    title: 'The Dignified Cargo',
    tags: ['diplomacy', 'relief', 'flee'],
    ctx: 'hail',
    weight: 10,
    when: [{ system: { faction: 'concord' } }, { flag: 'met_concord' }, { day: [10, 999] }],
    cooldown: 20,
    art: { scene: 'bridge', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Attaché Delphine Okoro', species: 'human' },
        text: '"Captain. A favour, if I may. We must convey a crate of ceremonial hats to the Concord delegation in the next sector. The hats are fragile, important, and slightly absurd. A diplomatic drone would be insulted by the job. May the Halcyon take them?"',
        choices: [
          { label: 'Accept the hat-crate (cost: 1 day)', tag: 'diplomacy', do: { text: 'The crate is loaded with great ceremony. Inside, 40 hats of increasingly ridiculous design. Dobbin tries on every one in the cargo bay when no one is looking.', fx: [{ days: 1 }, { rep: { concord: 4 } }, { flag: 'hats_aboard' }], goto: 'b' } },
          { label: 'Negotiate a fee', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: '"A courier\'s fee? Reasonable!" Okoro signs a voucher for 50 scrip.', fx: [{ credits: 50 }, { rep: { concord: 2 } }, { flag: 'hats_aboard' }], goto: 'b' }, fail: { text: '"A fee? For hats? For the Concord?" She is mortified. You take the crate for free and a lecture on public duty.', fx: [{ flag: 'hats_aboard' }, { rep: { concord: 1 } }, { morale: -1 }], goto: 'b' } },
          { label: 'Decline: too much risk to the hats', tag: 'wait', do: { text: '"Of course. Hats are delicate things," says Okoro, bravely.', fx: [] } },
        ],
      },
      b: {
        text: 'Mid-voyage, the crate begins to emit a thin, rhythmic noise: a polite thrumming, as if forty hats are quietly humming a march. {crew:random} presses an ear to the lid. "Captain, I think they\'re rehearsing."',
        choices: [
          { label: 'Open the crate and investigate', tag: 'science', check: { skill: 'science', diff: 2 }, pass: { text: 'A music-box mechanism in the largest hat, set off by vibrations. It plays a bouncy march in a minor key. You defuse it with a spoon.', fx: [{ xp: { science: 1 } }, { morale: 4 }], goto: 'c' }, fail: { text: 'The mechanism triggers; forty hats play a fanfare. The ship\'s cat takes to the rafters. Nobody is hurt, but the hats are slightly out of sorts.', fx: [{ morale: 2 }, { rep: { concord: -1 } }], goto: 'c' } },
          { label: 'Let them hum', tag: 'wait', do: { text: 'The march continues all the way to port. By the end, the entire crew is humming along.', fx: [{ morale: 5 }], goto: 'c' } },
        ],
      },
      c: {
        speaker: { name: 'Attaché Delphine Okoro', species: 'human' },
        text: 'On delivery, Okoro inspects the hats and finds them intact. "The Delegation will be thrilled. And… the Concord would like to extend you our honorary courtesy. Please accept this pass. It opens any Concord door that has a doorknob."',
        choices: [
          { label: 'Accept the pass', tag: 'diplomacy', do: { text: 'A small pass, stamped and sealed, with a doodle of a hat in the corner. It will, you suspect, be oddly useful.', fx: [{ item: { door_token: 1 } }, { clearFlag: 'hats_aboard' }, { rep: { concord: 5 } }, { morale: 4 }] } },
        ],
      },
    },
  },

  {
    id: 'hail_c_petition',
    title: 'A Petition to Rename a Nebula',
    tags: ['diplomacy', 'persuade', 'comedy'],
    ctx: 'hail',
    weight: 10,
    when: [{ system: { faction: 'concord' } }, { flag: 'met_concord' }, { notFlag: 'petition_decided' }, { day: [12, 999] }],
    cooldown: 20,
    art: { scene: 'nebula', species: 'human' },
    start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Registrar Pellam Gough', species: 'human' },
        text: '"Captain! A petition for your signature. The Concord wishes to rename the large violet nebula in the Veil: from \'The Violet Haze\' to \'The Concord Nebula\'. All it needs is one Meridian signature. Yours would do nicely."',
        choices: [
          { label: 'Sign it', tag: 'diplomacy', do: { text: 'Gough beams. You sign. The nebula, you suspect, does not care. But the Vesperine, to whom it has been home for a thousand years, might.', fx: [{ flag: 'petition_decided' }, { flag: 'petition_signed' }, { rep: { concord: 5 } }, { rep: { vesperine: -3 } }], goto: 'b' } },
          { label: 'Propose a compromise name', tag: 'persuade', check: { skill: 'diplomacy', diff: 4 }, pass: { text: '"The Concord Violet." Gough thinks for a minute. "Not unsound." He amends it with his own hand. Everyone gets a little of what they wanted.', fx: [{ flag: 'petition_decided' }, { rep: { concord: 3 } }, { rep: { vesperine: 2 } }, { xp: { diplomacy: 2 } }], goto: 'b' }, fail: { text: '"The Violet Haze of the Concord." It sounds like a pub. Gough thanks you and, privately, files it for review.', fx: [{ flag: 'petition_decided' }, { rep: { concord: 1 } }], goto: 'b' } },
          { label: 'Decline politely: it isn\'t yours to name', tag: 'wait', do: { text: 'Gough sighs. "Principle. How inconvenient." But he nods, and a sliver of respect enters his eyes.', fx: [{ flag: 'petition_decided' }, { rep: { concord: -1 } }, { rep: { vesperine: 2 } }], goto: 'b' } },
        ],
      },
      b: {
        speaker: { name: 'Registrar Pellam Gough', species: 'human' },
        text: '"A final item: the Registrar\'s Office is compiling a Book of Names. Would the Captain care to contribute? A name for a star, say. Any name. Within reason."',
        choices: [
          { label: 'Name a star after Dobbin', tag: 'diplomacy', do: { text: 'Gough writes it down, solemnly. "Dobbin\'s Star." When Dobbin hears, it tries to say thank you, and ends up playing a short jingle instead.', fx: [{ morale: 8 }, { rep: { concord: 2 } }] } },
          { label: 'Name a star "Biscuit"', tag: 'persuade', do: { text: 'Gough writes it down with admirable composure. "It will be… noted." Posterity will wonder.', fx: [{ morale: 6 }] } },
          { label: 'Decline: too many stars already', tag: 'wait', do: { text: '"Understood." He crosses out a line and writes another in smaller letters.', fx: [] } },
        ],
      },
    },
  },
];
