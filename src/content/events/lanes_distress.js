// EVENTS-A (fix round 3): (a) "hot lane" hazard CHAINS, ids `lane_hot_*`: the engine tries authored `lane_*` events first when a
// lane hazard rolls (see docs/REQUESTS.md [ENGINE] round 2). Each chain has 3 hazard stages and a payout node. Clean crossings of
// stages one and two set the flags hl_a / hl_b (stage three sets hl_c for a bonus); the payout node offers the full bounty only
// if both were earned, and ALWAYS clears all three flags, so nothing leaks between runs.
// (b) DISTRESS variants keyed to region/faction, ctx 'distress' (engine adds a Meridian Relief bounty when they end).
// ITEMS used (all exist): storm_glass, rift_chime, kelp_lantern, aurora_thread, riddle_coin, choir_reed, door_token, comet_ice,
// polite_seed, luggage_tag, tea_sample. FLAGS: hl_a hl_b hl_c (temporary), distress_* set-only hooks.

const o = (label, tag, text, fx = [], goto) => ({ label, tag, do: { text, fx, ...(goto ? { goto } : {}) } });
const k = (label, tag, skill, diff, pt, pfx, ft, ffx, goto) => ({ label, tag, check: { skill, diff }, pass: { text: pt, fx: pfx, ...(goto ? { goto } : {}) }, fail: { text: ft, fx: ffx, ...(goto ? { goto } : {}) } });
const CLEAR = [{ clearFlag: 'hl_a' }, { clearFlag: 'hl_b' }, { clearFlag: 'hl_c' }];

// A hot lane: stage nodes a, b, c then payout d. st = [{text, safe, check:[skill,diff, passText, failText, failFx], speak}]
export function hot(id, title, scene, when, st) {
  const pay = st[3];
  const stage = (i, nextNode) => {
    const s = st[i], flag = ['hl_a', 'hl_b', 'hl_c'][i];
    return {
      ...(s.speaker ? { speaker: s.speaker } : {}),
      text: s.text,
      choices: [
        k(s.check[2], s.check[3], s.check[0], s.check[1], s.check[4], [{ flag }, { xp: { [s.check[0]]: 1 } }], s.check[5], s.check[6], nextNode),
        o(s.safe[0], 'wait', s.safe[1], s.safe[2], nextNode),
        ...(s.extra ? [s.extra(nextNode)] : []),
      ],
    };
  };
  return {
    id, title, tags: ['hazard', 'flee', 'science'], ctx: 'travel', weight: 14, cooldown: 40, when,
    art: { scene, species: 'robot' }, start: 'a',
    nodes: {
      a: stage(0, 'b'), b: stage(1, 'c'), c: stage(2, 'd'),
      d: {
        text: pay.text,
        choices: [
          { ...o(pay.full[0], 'trade', pay.full[1], [...pay.full[2], ...CLEAR]), if: [{ flag: 'hl_a' }, { flag: 'hl_b' }] },
          o(pay.some[0], 'wait', pay.some[1], [...pay.some[2], ...CLEAR]),
        ],
      },
    },
  };
}

export const HOT_LANES = [
  hot('lane_hot_ion_gauntlet', 'The Ion Gauntlet', 'ionstorm', [{ system: { phenomenon: 'ionstorm' } }, { system: { danger: 2 } }], [
    { speaker: { name: 'Dobbin', species: 'robot' }, text: 'Stage one. The leading front of an ion squall bars the lane, a curtain of violet lightning with one narrow, flickering gap. Dobbin has laid a Meridian bounty notice on the console: "CLEAR CROSSING OF THE GAUNTLET: HANDSOME."',
      check: ['piloting', 3, 'Thread the gap at speed', 'flee', 'You slide through on the flicker of the gap. Lightning licks the hull and the hull stays whole.', 'The gap closes a hair early. A hundred sparks go through the plating like a jug of wasps.', [{ hull: -6 }]],
      safe: ['Skirt the front, long and slow', 'You spend fuel and an afternoon going round the edge. Safe, expensive and quiet.', [{ fuel: -2 }, { days: 1 }]] },
    { text: 'Stage two. Inside the front the air is full of ball lightning, drifting about like curious ghosts. The shield grid whines. Any one of them could trip a breaker; there are forty.',
      check: ['engineering', 3, 'Tune the shields to the lightning', 'science', '{crew:engineering} sets the grid to the exact frequency of the sparks. They drift past like polite fish.', 'The tuning drifts and a breaker pops with a bang. The lights flicker and the tea jumps.', [{ hull: -4 }, { morale: -1 }]],
      safe: ['Cut power and coast through dark', 'You coast through forty drifting ghosts with no lights, a hot flask and a held breath.', [{ supplies: -1 }, { days: 1 }]] },
    { text: 'Stage three. The back of the storm is a wall of static, and somewhere in it there is a clean lane, perhaps a hundred metres wide. If {crew:science} can read the field lines, you can ride the last half of it for nothing.',
      check: ['science', 3, 'Read the field lines and ride the lane', 'science', 'The lane opens like a corridor. You ride a tail-wind of ion pressure out of the storm, pennants flying.', 'The lines blur. You fight out the rear of the storm the hard way, with the reactor shouting.', [{ fuel: -2 }]],
      safe: ['Punch through on engines alone', 'Brute force wins eventually. The reactor sulks for an hour afterwards.', [{ fuel: -2 }, { hull: -2 }]] },
    { text: 'Out the far side, the Halcyon coasts into clear space, battered and smelling of ozone. The Meridian relay pings: the bounty notice is live, and a clerk with a rubber stamp awaits your claim.',
      full: ['Claim the full Gauntlet bounty', 'Two clean crossings earn the full stamp, a purse of scrip and a storm glass from the weather office. The crew are insufferable about it all evening.', [{ credits: 120 }, { item: { storm_glass: 1 } }, { morale: 6 }]],
      some: ['Claim the consolation chit', 'The clerk looks at the damage, sighs, and stamps a small "SURVIVOR\'S ALLOWANCE".', [{ credits: 25 }, { morale: 1 }]] }]),

  hot('lane_hot_asteroid_slalom', 'The Rock Slalom', 'asteroids', [{ system: { phenomenon: 'asteroids' } }, { system: { danger: 2 } }], [
    { text: 'Stage one. The lane threads a tumbling field of rocks, each the size of a barn and none of them in the same place twice. A sign on a nav-buoy reads: "SLALOM. TIMES POSTED AT THE DOCK. NO PRIZES, BUT GLORY."',
      check: ['piloting', 3, 'Run the slalom at speed', 'flee', 'You carve the course like a skier, and the rocks wheel past in a stately blur. Nothing scrapes.', 'A rock clips the stern. The hull gongs, and the helm swears in a gentle, poetic way.', [{ hull: -6 }]],
      safe: ['Pick through slowly, nose-first', 'An hour of patient nudging. Nothing hits you, and nobody is impressed.', [{ days: 1 }, { fuel: -1 }]] },
    { speaker: { name: 'Foreman Dace', species: 'drifter' }, text: 'Stage two. A mining barge is blocking the narrowest gap, towing a line of ore-sleds. "Sorry, Halcyon! Can\'t shift till the tide of rocks turns. Unless you fancy asking nicely?"',
      check: ['diplomacy', 3, 'Ask Dace to hold the line aside', 'persuade', 'Dace laughs and swings the sleds wide. "For a slalom-runner, anything." The gap opens like a gate.', 'Dace is not moved. You wait for the tide, drinking tea.', [{ days: 1 }]],
      safe: ['Wait out the tide', 'You wait. Dace waves at you every ten minutes with a lantern, which is somehow worse.', [{ days: 1 }]] },
    { text: 'Stage three. A navigation beacon has torn loose from its moorings and is spinning toward the lane. If you catch it, the Society pays a recovery fee; if not, it will be a nuisance for years.',
      check: ['engineering', 3, 'Snag the beacon with the grapples', 'science', 'The grapple closes. The beacon gives a thankful chirp and is towed, struggling, into your hold.', 'The beacon bounces off the grapple and spins away. You watch it go, wistfully.', []],
      safe: ['Wave it by and hold course', 'It tumbles off the lane harmlessly. Not your problem.', []] },
    { text: 'At the end of the field, the buoy chirps and a small drone hands you a slip: "TIME: RESPECTABLE." A slip beneath it carries the Foreman\'s signature and a purse of scrip, if you have earned it.',
      full: ['Collect the slalom purse', 'The Foreman\'s purse, a crate of spare parts, and a stamp in the guild book. You are, in a minor sense, a local legend.', [{ credits: 90 }, { cargo: { machine_parts: 2 } }, { rep: { drifters: 3 } }, { morale: 5 }]],
      some: ['Take a polite pat on the back', 'The Foreman offers a handshake and half a sandwich. You accept both.', [{ supplies: 1 }, { rep: { drifters: 1 } }]] }]),

  hot('lane_hot_rift_run', 'The Rift Run', 'rift', [{ system: { phenomenon: 'rift' } }, { system: { danger: 2 } }], [
    { text: 'Stage one. A first crease of the rift lies across the lane. Stars double on either side of the fold and the helm reports that left is, for the moment, also right. It is a very bad moment to be indecisive.',
      check: ['piloting', 4, 'Pick a side and fly confidently', 'flee', 'You commit to a heading, and the fold accepts it. The stars slide back to one apiece.', 'You choose the wrong half of the fold. It spits you out with a sharp shove.', [{ hull: -6 }, { fuel: -1 }]],
      safe: ['Back off and wait for it to settle', 'The fold relaxes by itself within the hour. You lose time but not paint.', [{ days: 1 }]] },
    { text: 'Stage two. Inside the second fold, time runs oddly. The ship\'s clock ticks twice per second, then not at all. {crew:science} suggests that if you could measure the beat, you could ride it like a swell.',
      check: ['science', 4, 'Measure the beat and ride it', 'science', 'The beat comes clear in four cycles. You surf the swell and slide neatly through the second fold.', 'The beat slips away. The ship drifts for a handful of seconds that last an afternoon.', [{ days: 1 }, { supplies: -1 }]],
      safe: ['Stop engines and let it carry you', 'The fold carries you gently, like a leaf on a pond, and sets you down a mite off course.', [{ fuel: -1 }, { days: 1 }]] },
    { text: 'Stage three. At the far edge of the rift, a rising chord answers your hull. Something in the fold is singing, and it seems to want you to sing back.',
      check: ['diplomacy', 3, 'Hum the answering note', 'diplomacy', 'The chord resolves around you like an arm around a shoulder. A thread of music pulls you clear.', 'Your note drifts flat. The rift sniffs, politely, and lets you go anyway.', []],
      safe: ['Listen silently until it passes', 'The chord rises, falls, and fades. The crew stand quiet on the bridge.', [{ morale: 2 }]] },
    { text: 'Clear of the rift, the stars are singular once more. The Meridian relay logs the crossing and a clerk reads out the survey bounty with the faintest flutter of excitement. "No one has run it clean before."',
      full: ['Claim the Rift Run bounty', 'A purse, a plotted lane and a chime of rift-glass sent by the Archive in thanks. The helm\'s name goes on the plaque.', [{ credits: 100 }, { item: { rift_chime: 1 } }, { reveal: { radius: 2 } }, { morale: 6 }]],
      some: ['Take the courtesy stamp', 'The clerk marks a star next to your name and wishes you a restful week.', [{ credits: 20 }, { morale: 2 }]] }]),

  hot('lane_hot_nebula_brownout', 'The Nebula Brownout', 'nebula', [{ system: { phenomenon: 'nebula' } }, { system: { danger: 2 } }], [
    { text: 'Stage one. The nebula thickens until the sensors give up and the running lights shine back at you from the glass. "Brownout," says the helm. "We are flying by memory, Captain, and mine is poor."',
      check: ['science', 3, 'Rebuild the picture from the pulse echoes', 'science', 'Pulse by pulse the fog resolves into a corridor of clear gas. {crew:science} draws it on the glass in grease pencil.', 'The echoes smear into noise. You crawl through the murk and scrape a rock you cannot see.', [{ hull: -5 }]],
      safe: ['Idle at quarter speed', 'An hour of cribbage. The nebula thins slightly, then thickens again out of spite.', [{ days: 1 }]] },
    { text: 'Stage two. A narrow pillar of denser gas cuts the lane. It tugs at the hull like a tide-pool. The helm requests a delicate touch and a forgiving heart.',
      check: ['piloting', 3, 'Feather round the pillar', 'flee', 'A whisper of thrust and you swing round the pillar like a dancer. The tea stays in the cup.', 'The pillar claps the ship in a hug. It takes a lot of fuel to leave.', [{ fuel: -2 }, { hull: -3 }]],
      safe: ['Back off and wait for the gas to shift', 'The pillar slumps into a cloud. You wait for a day and slip by.', [{ days: 1 }]] },
    { text: 'Stage three. The fog has given the crew the collywobbles: queasy stomachs, ringing ears, and a faint feeling that someone is watching. {crew:medicine} suggests a short bout of treatment before it spreads.',
      check: ['medicine', 2, 'Treat the fog sickness', 'science', '{crew:medicine} hands out mint and a stern look. The crew rally and the last mile passes in good spirits.', 'The remedy is too strong; half the crew nap through the exit. The Halcyon drifts, snoring.', [{ morale: -1 }, { days: 1 }]],
      safe: ['Press on and hope', 'The crew grit their teeth and suffer through. Not a bad crossing, just a bad few hours.', [{ morale: -2 }]] },
    { text: 'At the clear edge of the Veil the sensors blink back on, one by one. The Society\'s Veil Pilots\' Office has left a standing bounty for clean nebula crossings and a pilot with a clipboard is waving a pen.',
      full: ['Claim the pilots\' bounty', 'A purse, a stamp, and a hand-lit lantern from the fog-wardens that glows with a soft green light.', [{ credits: 100 }, { item: { kelp_lantern: 1 } }, { rep: { vesperine: 2 } }, { morale: 5 }]],
      some: ['Take the mug of tea and the thanks', 'You are given tea and a pat on the shoulder. A good mug, as it happens.', [{ credits: 20 }, { supplies: 1 }]] }]),
];

// ---------------------------------------------------------------- DISTRESS VARIANTS (ctx 'distress')
const D = (id, title, tags, when, scene, species, a, b) => ({ id, title, tags, ctx: 'distress', weight: 10, cooldown: 40, when, art: { scene, species }, start: 'a', nodes: b ? { a, b } : { a } });
const SP = (name, species) => ({ name, species });

export const DISTRESS = [
  D('dist_veil_lamp_ship', 'The Lamp-Ship That Went Dark', ['relief', 'science'], [{ system: { region: 'veil' } }], 'nebula', 'vesperine',
    { speaker: SP('Warden Pell', 'drifter'), text: 'A fog-warden\'s lamp-ship has gone dark in the nebula, and with it a dozen small buoys that guide travellers out of the Veil. "Our reactor tripped. Without light the buoys are blind. A bad night for anyone caught in here."',
      choices: [
        k('Jump-start the lamp-ship\'s reactor', 'science', 'engineering', 3, 'A bypass, a hammer-tap, and the lamps blaze. Buoys flare awake across the fog, and the warden salutes with a lantern.', [{ rep: { vesperine: 3, drifters: 2 } }, { xp: { engineering: 2 } }, { flag: 'distress_veil_lamps' }], 'The reactor sparks and sulks. You lend a power cell instead, and the lamps return, dimmer.', [{ fuel: -2 }, { rep: { drifters: 2 } }], 'b'),
        o('Hand-light the buoys yourself with spare lamps', 'wait', 'You spend a night in a drone, lighting twelve buoys one by one. By dawn the Veil glows like a snow-globe.', [{ days: 1 }, { supplies: -1 }, { rep: { vesperine: 2 } }, { morale: 3 }], 'b'),
        o('Radio a Vesperine choir to guide the lost', 'diplomacy', 'The choir hums a trail through the fog. Every straggler follows it out. The warden weeps.', [{ rep: { vesperine: 4 } }, { morale: 2 }], 'b')] },
    { speaker: SP('Warden Pell', 'drifter'), text: '"You\'ve saved three ships tonight, I think, and you didn\'t know them. It is a quiet sort of heroism." Pell hands over a hand-lit lantern, still warm. "For the dark."',
      choices: [o('Accept the lantern', 'diplomacy', 'It glows with a soft green light, steady as a heart.', [{ item: { kelp_lantern: 1 } }, { morale: 4 }])] }),

  D('dist_choir_silent_singer', 'The Singer Who Cannot Be Heard', ['relief', 'wonder'], [{ system: { region: 'choir' } }], 'pulsar', 'vesperine',
    { speaker: SP('A Small Singer', 'vesperine'), text: 'A single Vesperine, adrift in a storm of pulsar noise, is trying to sing a call for help. The noise swallows every note. "SIGNAL. LOST. PLEASE. QUIET. PLEASE."',
      choices: [
        k('Shield the singer from the noise with your hull', 'flee', 'piloting', 3, 'You place the Halcyon between the singer and the pulsar, a great quiet shadow. The call rings out clear for the first time in hours.', [{ rep: { vesperine: 4 } }, { xp: { piloting: 2 } }, { fuel: -1 }], 'The shadow slips and the noise floods back. You try again, burning fuel, and finally manage.', [{ fuel: -2 }, { rep: { vesperine: 2 } }], 'b'),
        o('Cut every system and hum in unison', 'diplomacy', 'The Halcyon goes dark and quiet and hums the singer\'s own note back. Together the sound cuts through the noise.', [{ supplies: -1 }, { rep: { vesperine: 3 } }, { morale: 3 }], 'b'),
        k('Build a filter and cancel the pulsar', 'science', 'science', 4, 'A notch filter, a set of spoons and a quiet prayer. The pulsar fades to a whisper for ten minutes. It is enough.', [{ rep: { vesperine: 4 } }, { xp: { science: 2 } }], 'The filter squeals. You settle for escorting the singer out of the storm.', [{ rep: { vesperine: 1 } }, { fuel: -1 }], 'b')] },
    { speaker: SP('A Small Singer', 'vesperine'), text: '"THANK YOU. I WILL SING FOR YOU." The singer hums a four-note phrase to the Halcyon, and the ship\'s hull rings back in an uncanny, warm echo that lasts for days.',
      choices: [o('Keep the phrase', 'diplomacy', 'The phrase returns each time the ship passes a pulsar, like a lullaby.', [{ item: { choir_reed: 1 } }, { flag: 'distress_choir_phrase' }, { morale: 4 }])] }),

  D('dist_archive_runaway_cart', 'The Runaway Book-Cart', ['comedy', 'relief'], [{ system: { region: 'archive' } }], 'derelict', 'archivist',
    { speaker: SP('Cataloguer 5-of-9', 'archivist'), text: '"URGENT. A BOOK-CART HAS LEFT THE ARCHIVE AT HIGH VELOCITY, CARRYING FOUR HUNDRED VOLUMES AND A SMALL FOREIGN VISITOR WHO WANTED TO SEE THE ROOF. WE REQUEST ASSISTANCE. THE CART HAS NO BRAKES."',
      choices: [
        k('Match the cart\'s speed and board it', 'flee', 'piloting', 4, 'You come alongside at a hair\'s breadth and a team hops aboard. The visitor is delighted; the cart is stopped; the books are, if anything, tidier.', [{ rep: { archivists: 4 } }, { xp: { piloting: 2 } }], 'The match is imperfect; the cart bumps the hull and sheds a hundred books. You spend an hour gathering them from the void.', [{ hull: -3 }, { rep: { archivists: 2 } }], 'b'),
        k('Throw a tractor beam on the cart', 'science', 'engineering', 3, 'The beam holds. The cart slows with a long metallic sigh, and a bookmark flutters in the breeze.', [{ rep: { archivists: 3 } }, { xp: { engineering: 1 } }], 'The beam snaps the cart\'s axle. The cart stops. So does everything on it. Books everywhere.', [{ rep: { archivists: 1 } }, { days: 1 }], 'b'),
        o('Ask the Archive to open a docking arm in its path', 'diplomacy', 'The arm unfolds, catches the cart like a baseball glove, and the whole Archive applauds in unison.', [{ rep: { archivists: 3 } }, { morale: 3 }], 'b')] },
    { speaker: SP('Cataloguer 5-of-9', 'archivist'), text: '"THE VISITOR WISHES TO THANK YOU. IT HAS ASKED US TO RECORD THAT THE ROOF WAS EXCELLENT. THE ARCHIVE ADDS A SMALL TOKEN OF REGARD, FILED UNDER \'SURPRISES\'."',
      choices: [o('Accept the token', 'diplomacy', 'A bronze coin with a question on each face. Neither has an answer on the back.', [{ item: { riddle_coin: 1 } }, { morale: 3 }])] }),

  D('dist_rim_snapped_tether', 'The Snapped Tether', ['relief', 'flee'], [{ system: { region: 'rim' } }], 'asteroids', 'drifter',
    { speaker: SP('Matron Isolde', 'drifter'), text: '"Halcyon! The tether between our two halves has snapped, and my hab is drifting off from the other half, with my aunt and the cheese. We have an hour. Can you help us spin back into reach?"',
      choices: [
        k('Tow the drifting half back', 'flee', 'piloting', 3, 'A long, slow, meticulous tow. The halves kiss like two cats, and the aunt waves a cheese in triumph.', [{ rep: { drifters: 5 } }, { xp: { piloting: 2 } }, { fuel: -1 }], 'The tow line frays and snaps. A second try works; the halves meet, a little bruised.', [{ rep: { drifters: 3 } }, { fuel: -2 }, { hull: -3 }], 'b'),
        k('Splice a new tether with the cargo cables', 'science', 'engineering', 3, 'Cable, knots and a bit of improvisation. The new tether sings like a harp and holds like a promise.', [{ rep: { drifters: 5 } }, { xp: { engineering: 2 } }, { supplies: -1 }], 'The splice slips on the first try. On the second it holds, and so does your reputation.', [{ rep: { drifters: 2 } }, { supplies: -2 }], 'b'),
        o('Ferry the aunt and the cheese across by shuttle', 'trade', 'A dignified shuttle, a stern aunt and one very precious cheese. Everyone arrives intact and unbearably smug.', [{ rep: { drifters: 3 } }, { supplies: 1 }, { morale: 3 }], 'b')] },
    { speaker: SP('Matron Isolde', 'drifter'), text: '"Cheese for the Captain. It is a very special cheese. It is, I believe, older than the Gate." She hands over a wedge, wrapped in a story-knot.',
      choices: [o('Accept the cheese and the knot', 'diplomacy', 'The cheese is magnificent, and the knot tells a short, warm tale about a snapped tether.', [{ item: { story_knot: 1 } }, { supplies: 2 }, { morale: 4 }])] }),

  D('dist_shoals_tug_pileup', 'The Great Tug Pile-Up', ['relief', 'comedy'], [{ system: { region: 'shoals' } }], 'ship_alien', 'quillari',
    { speaker: SP('Convoy Boss Marl', 'quillari'), text: '"Halcyon, bless you! We have a pile-up. Nine tugs, all hooked together by mooring lines in a tangle I can only call \'artistic\'. We cannot untie them without a pilot to coax each one out. And a tug just caught the lunch."',
      choices: [
        k('Coax the tugs out one by one', 'flee', 'piloting', 4, 'You untie nine tugs in forty minutes, like undoing a knot with eyelashes. The tugs cheer, and so does lunch.', [{ rep: { quillari: 5 } }, { xp: { piloting: 3 } }, { credits: 40 }], 'The knot tightens before it loosens. Tugs clash and mutter. It takes an afternoon and some paint.', [{ rep: { quillari: 3 } }, { hull: -4 }, { days: 1 }], 'b'),
        k('Cut the lines with a precision cutter', 'science', 'engineering', 3, 'Nine snips, nine tugs free, and a mountain of rope for the tug-owners to argue about.', [{ rep: { quillari: 4 } }, { xp: { engineering: 2 } }], 'The cutter jams. The mess turns into a larger tangle, and Marl\'s lunch falls into it.', [{ rep: { quillari: 1 } }, { supplies: -1 }], 'b'),
        o('Negotiate a staggered departure', 'diplomacy', 'You assign each tug a number and a departure time. They follow the rota, grumbling, and the pile empties in order.', [{ rep: { quillari: 3 } }, { morale: 2 }], 'b')] },
    { speaker: SP('Convoy Boss Marl', 'quillari'), text: '"I owe you a favour and a lunch. You will take the lunch now and the favour later. That\'s how it\'s done." A hamper appears, with a note: "FOR THE CAPTAIN WHO DOES NOT PANIC."',
      choices: [o('Accept the lunch', 'trade', 'It contains seven sandwiches, a flask of tea, and a door-token engraved with a small tug.', [{ supplies: 3 }, { item: { door_token: 1 } }, { morale: 4 }])] }),

  D('dist_gate_sightseers', 'The Stalled Sightseeing Yacht', ['comedy', 'relief'], [{ system: { region: 'gate' } }], 'bridge', 'human',
    { speaker: SP('Captain Peabody', 'human'), text: '"Dear Halcyon! The yacht *Merry Anne* has stopped, you see, in the middle of the sightseeing tour, with forty passengers and no engine. They are being very good about it, but they are asking whether there will be tea."',
      choices: [
        o('Send over tea and biscuits (-2 supplies)', 'trade', 'The passengers cheer. Forty cups of tea go round. Peabody weeps into his collar.', [{ supplies: -2 }, { rep: { concord: 3 } }, { morale: 3 }], 'b'),
        k('Repair the yacht\'s engine', 'science', 'engineering', 2, 'A cracked pump. A new gasket. The engine cough-coughs, then purrs, and the yacht resumes its sightseeing with a fanfare.', [{ rep: { concord: 4 } }, { xp: { engineering: 1 } }], 'The pump needs a part you lack. You tow them to the nearest station instead.', [{ fuel: -2 }, { rep: { concord: 2 } }], 'b'),
        k('Narrate the sightseeing yourself while they wait', 'diplomacy', 'diplomacy', 2, 'You describe the stars with such gusto that the tourists applaud. Several ask for your autograph.', [{ rep: { concord: 3 } }, { morale: 4 }], 'You run out of facts after ten minutes. Dobbin takes over, to enormous success.', [{ morale: 2 }], 'b')] },
    { speaker: SP('Captain Peabody', 'human'), text: '"You\'ve saved the tour! And the reputation of the *Merry Anne*, which is considerable. Please accept a small souvenir, which has our name on it, and ours alone."',
      choices: [o('Accept the souvenir', 'diplomacy', 'A luggage tag stamped with fifty harbours and a tiny painted yacht.', [{ item: { luggage_tag: 1 } }, { morale: 3 }])] }),

  D('dist_ghost_lullaby', 'A Lullaby on the Emergency Band', ['mystery', 'wonder', 'relief'], [], 'void', 'unknown',
    { text: 'The emergency band carries a lullaby. No call-sign, no message, only a slow, endlessly repeating song in a voice that sounds like a very old music box. Somewhere out here, something is singing itself to sleep and asking not to be alone.',
      choices: [
        k('Trace the song to its source', 'science', 'science', 3, 'You follow it to a drifting probe, centuries old, its battery nearly spent. It has been singing since before the Gate opened.', [{ xp: { science: 2 } }], 'The song fades before you find it. You log the bearing and the sadness.', [{ morale: -1 }], 'b'),
        o('Sing along until it falls asleep', 'diplomacy', 'You sing the second verse, wobbling, and the music box takes it up again. By the final verse the signal is steady and peaceful.', [{ morale: 5 }], 'b'),
        o('Send a power cell on a drone', 'trade', 'The drone clicks onto a worn contact. The song swells, brighter, and the old probe begins to hum a thank-you.', [{ fuel: -1 }, { morale: 3 }], 'b')] },
    { text: 'The old probe wakes properly, running its last self-test with a faint, happy ping. It releases a memory core, a small dented cube, still faintly warm, and then goes quietly to sleep.',
      choices: [
        o('Take the memory core', 'science', 'The core remembers every sunrise it saw. It plays them, one by one, in the lounge.', [{ item: { ghost_log_cube: 1 } }, { reveal: { radius: 2 } }, { morale: 4 }]),
        o('Leave it to rest, with a blanket of silence', 'wait', 'You tuck the probe into a quiet orbit and dim your lights. The song ends, finally, on a major chord.', [{ rep: { archivists: 2 } }, { morale: 6 }])] }),
];
