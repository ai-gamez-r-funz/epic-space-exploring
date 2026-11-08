// EVENTS-B (round 3): Captain Tamsin Vell surfaces in the world. These read the engine's rival state through {rival:'here'}
// (she is at the current system) and the `rival_friend` counter / `rival_met` flag the engine and core_rival maintain.
// CODEX: none new. FLAGS set: vell_race_won, vell_race_lost, vell_note_left, vell_postcard. Counters: rival_friend (+).
const D = (label, tag, text, fx, extra) => { const { goto, ...rest } = extra || {}; return { label, tag, ...rest, do: { text, fx, ...(goto ? { goto } : {}) } }; };
const K = (label, tag, skill, diff, pt, pfx, ft, ffx, extra) => { const { goto, ...rest } = extra || {}; const g = goto ? { goto } : {}; return { label, tag, ...rest, check: { skill, diff }, pass: { text: pt, fx: pfx, ...g }, fail: { text: ft, fx: ffx, ...g } }; };
const VELL = { name: 'Captain Tamsin Vell', species: 'human' };

export default [
  {
    id: 'rival_vell_radio_hail', title: 'The Perihelion Answers', tags: ['comedy', 'diplomacy', 'trade'], ctx: 'hail', weight: 50, cooldown: 14,
    when: [{ rival: 'here' }],
    art: { scene: 'ship_alien', species: 'human', palette: 'warm' }, start: 'a',
    nodes: {
      a: { speaker: VELL,
        text: `The channel crackles, then Vell's voice, all teeth. "Halcyon! You hail like a gentleman. I'm in the next berth, pretending not to be. I've bought up the lot of everything worth buying. Care to be gracious about it?"`,
        choices: [
          D(`"Gracious as ever. What are you running?"`, 'diplomacy', `"Oh, you're no fun. Fine." She sighs, and tells you precisely what she's carrying, and a sliver of why. It's a gift disguised as a boast.`, [{ counter: { rival_friend: 1 } }, { morale: 2 }, { reveal: 'nearest' }], { goto: 'b' }),
          K(`Offer to swap market gossip`, 'persuade', 'diplomacy', 3, `Her gossip is good, yours is better. By the end, you've each given up something you meant to keep, and are better for it.`, [{ counter: { rival_friend: 1 } }, { credits: 30 }, { xp: { diplomacy: 1 } }], `She out-gossips you. You learn a lot and keep nothing. She hums, triumphant.`, [{ morale: -1 }], { goto: 'b' }),
          D(`Sign off politely`, 'wait', `"Coward," she says fondly. The channel clicks.`, []),
        ] },
      b: { speaker: VELL,
        text: `"Between us, since you're being so civil: the stalls at the next market are short on one good, and long on another. If you hurry, there's a tidy margin. If you dawdle, I take it. Race you?"`,
        choices: [
          D(`Accept the race`, 'flee', `"Splendid!" The channel closes with a whoop. Your helm sits up straighter. The next market, wherever it is, will be interesting.`, [{ flag: 'vell_race' }, { morale: 5 }]),
          D(`Decline, but wish her luck`, 'diplomacy', `"Luck is for amateurs," says Vell, delighted. She sends a sticker of a tiny trophy anyway.`, [{ counter: { rival_friend: 1 } }, { morale: 2 }]),
        ] },
    },
  },
  {
    id: 'rival_vell_dock_sighting', title: 'A Familiar Hull at the Dock', tags: ['comedy', 'trade', 'mystery'], ctx: 'station', weight: 45, cooldown: 12,
    when: [{ rival: 'here' }, { system: { hasStation: true } }],
    art: { scene: 'station', species: 'human', palette: 'warm' }, start: 'a',
    nodes: {
      a: { text: `Two berths down sits the Perihelion, lean and lacquered, the crew loading crates under a banner reading "NOT FOR YOU". Vell herself is nowhere. A cabin boy tries to look nonchalant on the gangway and fails charmingly.`,
        choices: [
          K(`Strike up a chat with the cabin boy`, 'persuade', 'diplomacy', 2, `Within four minutes you know the Perihelion's cargo, her schedule, and that Vell takes four sugars. The boy is mortified; you're gentle with it.`, [{ cargo: { star_charts: 1 } }, { counter: { rival_friend: 1 } }, { reveal: 'nearest' }], `The boy clams up so thoroughly that you feel a small guilt. You buy him a pastry as an apology.`, [{ credits: -3 }, { morale: 1 }], { goto: 'b' }),
          K(`Read her cargo manifest off the gangway board`, 'science', 'science', 3, `Piled in neat columns: fuel cells, brandy, a pallet of vellum. You note the prices she paid and what she'll charge. Useful, if a touch sneaky.`, [{ credits: 40 }, { xp: { science: 1 } }], `The board is in cipher. Vell, naturally. You decode two lines and a rude word.`, [{ morale: 1 }], { goto: 'b' }),
          D(`Leave a note on her gangway`, 'diplomacy', `"Nice hull. -H." You tuck it under the gangway chain. By next week, she'll send three back.`, [{ flag: 'vell_note_left' }, { counter: { rival_friend: 1 } }], { goto: 'b' }),
          D(`Ignore the Perihelion entirely`, 'wait', `A wholesome display of professionalism. Nobody in the crew believes you.`, []),
        ] },
      b: { speaker: VELL, text: `"Halcyon!" Vell arrives at a trot, hat in hand, trying not to look as though she's been listening. "I see you're busy being nosy. I'm busy being offended. Tea? I'll pour, and we'll pretend this never happened."`,
        choices: [
          D(`Accept the tea`, 'diplomacy', `An hour of banter over a surprisingly good pot. By the end, you're swapping lane advice across a table. Rivalries are better with biscuits.`, [{ supplies: 1 }, { morale: 6 }, { counter: { rival_friend: 1 } }, { reveal: { radius: 2 } }]),
          D(`Pass: you have a cargo to move`, 'trade', `"Of course you do." She grins, not offended. The Perihelion is gone by the evening tide.`, [{ credits: 10 }]),
        ] },
    },
  },
  {
    id: 'rival_vell_cargo_race', title: 'The Cargo Race', tags: ['hazard', 'trade', 'comedy'], ctx: 'arrive', weight: 35, cooldown: 20,
    when: [{ flag: 'vell_race' }, { notFlag: 'vell_race_won' }, { system: { hasStation: true } }],
    art: { scene: 'station', species: 'human', palette: 'dusk' }, start: 'a',
    nodes: {
      a: { speaker: VELL, text: `You dock with a flourish and discover the Perihelion already tied up, Vell on the quay with a stopwatch. "Eleven minutes," she says. "A new record. Tell me you weren't dawdling to admire the nebula."`,
        choices: [
          K(`Challenge her to a loading race`, 'flee', 'piloting', 3, `Crates fly. Cranes whirl. The Halcyon's crew, flush with pride, wins by a crate and a half. Vell shakes your hand with unnecessary violence.`, [{ flag: 'vell_race_won' }, { credits: 60 }, { morale: 8 }, { counter: { rival_friend: 1 } }], `The Perihelion's crew moves like clockwork. You lose by a margin that feels personal. Vell refrains from gloating for nearly half a minute.`, [{ flag: 'vell_race_lost' }, { credits: -20 }, { morale: -2 }], { goto: 'b' }),
          D(`Concede with grace`, 'diplomacy', `"A gracious loser. I could get used to it." She tips her hat. The race is over; the friendship survives it.`, [{ flag: 'vell_race_lost' }, { counter: { rival_friend: 1 } }, { morale: 2 }], { goto: 'b' }),
          D(`Counter-offer: a joint run to the next port`, 'trade', `Vell stops, mid-gloat. "You can't be serious." You are. By dusk, a deal is struck: split margins, shared charts, equal blame.`, [{ flag: 'rival_ally' }, { credits: 80 }, { reveal: { radius: 3 } }], { if: [{ counter: { rival_friend: 2 } }] }),
        ] },
      b: { speaker: VELL, text: `"Rematch," Vell declares. "Not now. When I'm better. Someday, somewhere, with an audience." A pause. "And with biscuits." She pins a card to your jacket: an unlimited rematch voucher, in her extravagant hand.`,
        choices: [
          D(`Accept the voucher`, 'diplomacy', `It goes in the lounge album. It will never be redeemed; it is, however, the proudest piece of paper aboard.`, [{ morale: 4 }, { counter: { rival_friend: 1 } }]),
        ] },
    },
  },
  {
    id: 'rival_vell_lane_meeting', title: 'Two Ships, One Lane', tags: ['comedy', 'relief', 'hazard'], ctx: 'travel', weight: 30, cooldown: 25,
    when: [{ flag: 'rival_met' }, { counter: { rival_friend: 1 } }],
    art: { scene: 'starfield', species: 'human', palette: 'cool' }, start: 'a',
    nodes: {
      a: { speaker: VELL, text: `The Perihelion slides alongside mid-lane, matching speed with offensive ease. Vell's face fills the viewscreen. "Lovely day for it. I seem to have a bit too much fuel and you look like you've got a bit too little. Fancy a trade?"`,
        choices: [
          D(`Swap two crates of supplies for four fuel`, 'trade', `A brisk swap across the gap on a tow line. Vell ties it off with a flourish. "Don't say I never did anything for you."`, [{ supplies: -2 }, { fuel: 4 }, { counter: { rival_friend: 1 } }]),
          K(`Match her speed and drift a minute for gossip`, 'flee', 'piloting', 3, `A neat matching, a minute of banter side by side. She passes a tin of ginger biscuits across; you pass back a lane tip.`, [{ supplies: 1 }, { reveal: { radius: 2 } }, { morale: 4 }], `You over-correct and bob for ten seconds. Vell watches, delighted. The biscuits are still handed over, out of pity.`, [{ supplies: 1 }, { morale: 1 }]),
          D(`Wave and keep flying`, 'wait', `"Cold, Captain," she transmits. "Very cold." The Perihelion pulls ahead in a flourish of ribbons.`, []),
        ] },
    },
  },
  {
    id: 'rival_vell_postcard', title: 'A Postcard from Vell', tags: ['comedy', 'relief'], ctx: 'idle', weight: 20, cooldown: 40,
    when: [{ flag: 'rival_met' }, { notFlag: 'vell_postcard' }],
    art: { scene: 'lounge', species: 'human', palette: 'warm' }, start: 'a',
    nodes: {
      a: { text: `A postcard drifts out of the relay slot, addressed in extravagant looping hand: "To the ISV Halcyon, c/o The Competition." On the front, a photograph of the Perihelion at a lovely harbour. On the back: "Wish you were slower."`,
        choices: [
          D(`Pin it to the bridge wall`, 'wait', `It joins the others. The helm adds a doodle of a tortoise in the margin. Vell will see it eventually.`, [{ flag: 'vell_postcard' }, { morale: 5 }]),
          D(`Write back (a cheeky reply)`, 'persuade', `"Dear Tamsin, we're very much enjoying your dust." The reply goes out on the next relay. Weeks later, a second card: "Brute."`, [{ flag: 'vell_postcard' }, { counter: { rival_friend: 1 } }, { morale: 6 }]),
        ] },
    },
  },
];
