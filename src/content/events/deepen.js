// EVENTS-B (round 3): second beats for previously single-node events. `deepen(events)` takes the merged event list and
// returns the same events with extra nodes attached: the listed choices of the first node now continue (goto 'b') into a
// follow-up beat with real branches and persistent consequences (rep, items, flags, crew xp). Events keep their ids.
//
// CODEX: none new. FLAGS set (new): fitch_friend, brannock_coached, crier_tip, greaves_ally, tender_lamp, pomeroy_saved,
//   keeper_tuned, juno_friend, door_seven_friend, scribe_passed, aldous_friend, fenn_courier, concord_filed, curator_hypothesis_kept,
//   pim_network, gilda_fixed, odo_dancer, orsolya_regular, gus_cheered, fenwick_regular, sweepstake_champion, survey_donor,
//   marrow_lamp, archive_number_4119, comfort_rota, party_hosted, movie_club, tea_circle, slide_champion, stargazers_club,
//   stew_night, polish_corps

const D = (label, tag, text, fx, extra) => ({ label, tag, ...(extra || {}), do: { text, fx } });
const K = (label, tag, skill, diff, pt, pfx, ft, ffx, extra) => ({ label, tag, ...(extra || {}), check: { skill, diff }, pass: { text: pt, fx: pfx }, fail: { text: ft, fx: ffx } });
const R = (label, tag, rows, extra) => ({ label, tag, ...(extra || {}), rand: rows.map(([w, text, fx]) => [w, { text, fx }]) });

// id -> { from: [indices of first-node choices that continue], b: node }
const PATCHES = {
  hail_r_gate_relay_gossip: { from: [0, 1], b: { speaker: { name: 'Relay Operator Fitch', species: 'human' },
    text: `"Before you go: the Form 12-C parrot has learned your ship's name. It says it with great feeling. If you ever need a favour from the Relay, say 'Halcyon' to it. Also, I could patch you a quieter channel for the long jumps."`,
    choices: [
      D(`Take the quiet channel patch`, 'science', `A tidy bit of re-keying. The comm array hushes; the long jumps feel shorter. Fitch notes your name on the roster of Friends of the Relay.`, [{ flag: 'fitch_friend' }, { xp: { diplomacy: 1 } }, { morale: 2 }]),
      D(`Ask about the parrot's repertoire`, 'diplomacy', `Eleven phrases, three of them rude. Fitch plays them all. The bridge laughs for an hour, and the parrot makes a lifelong enemy of the cat.`, [{ morale: 5 }, { flag: 'fitch_friend' }]),
      D(`Sign off with thanks`, 'wait', `"Fly well, Halcyon." The channel clicks shut. The parrot says your name one more time, thoughtfully.`, []),
    ] } },
  hail_r_gate_new_pilot: { from: [0, 1], b: { speaker: { name: 'Old Pilot Brannock', species: 'human' },
    text: `Brannock leans back. "Tell you what. There's a way of coming out of a jump that the manuals don't mention. Gentle on the hull, kind to the fuel. It needs a steady hand and a bit of nerve. Want me to show you, or just tell you?"`,
    choices: [
      K(`Learn it properly (a day's practice)`, 'science', 'piloting', 3, `A day of drills in the empty lane. By evening the Halcyon exits a jump like a swan landing on a pond. Brannock grunts approval.`, [{ days: 1 }, { xp: { piloting: 3 } }, { flag: 'brannock_coached' }, { fuel: 1 }], `A day of drills and one very rude word. You get half of it. Brannock says half is plenty, for now.`, [{ days: 1 }, { xp: { piloting: 1 } }, { flag: 'brannock_coached' }]),
      D(`Just have him tell you`, 'persuade', `Five sentences on a napkin. It will take time to digest, but the helm nods at every one.`, [{ xp: { piloting: 1 } }, { flag: 'brannock_coached' }]),
      D(`Thank him and fly on`, 'wait', `"Suit yourself." He waves off. The napkin stays unwritten.`, []),
    ] } },
  hail_r_shoals_crier: { from: [0, 1, 2], b: { speaker: { name: 'Crier Tolliver', species: 'quillari' },
    text: `"A SPECIAL ANNOUNCEMENT!" Tolliver pauses, drops his voice. "Between us. The vellum price is about to jump. If you have a sheet or two, hold them. If you don't, buy the humble ones from the Pennant stalls and sit on them. That's not advice. That's gossip."`,
    choices: [
      D(`Pay for the tip (10 scrip)`, 'trade', `A good tip. The market shifts next week as promised, and a small profit finds its way into the strongbox. Tolliver is a decent crier.`, [{ credits: -10 }, { credits: 45 }, { flag: 'crier_tip' }, { rep: { quillari: 1 } }], { if: [{ credits: 10 }] }),
      D(`Thank him and keep your scrip`, 'diplomacy', `He bows from the waist, microphone first. The market is loud, the day is warm, and the crier is content.`, [{ rep: { quillari: 1 } }]),
      D(`Ask him to announce the Halcyon's arrival`, 'persuade', `"HEAR YE: THE HALCYON IS HERE! LOVELY SHIP! GOOD TEA!" Heads turn all across the concourse. A baker presses a roll into your hands.`, [{ supplies: 1 }, { morale: 3 }, { rep: { quillari: 2 } }]),
    ] } },
  hail_r_shoals_convoy: { from: [0, 1], b: { speaker: { name: 'Captain Greaves', species: 'human' },
    text: `Greaves brightens. "Right. If you'll help, there's a thing. Take my convoy's petition to the Concord desk at the next station. Six signatures, one grievance, no jokes. In return, I'll mark you a quiet back-lane that skips the queue entirely."`,
    choices: [
      D(`Carry the petition`, 'diplomacy', `Six signatures and a ribbon. You pledge to deliver it. The lane he marks cuts a jump's worth off your route.`, [{ flag: 'greaves_ally' }, { reveal: { radius: 3 } }, { rep: { concord: 2 } }]),
      D(`Decline; offer to mention it casually instead`, 'persuade', `Greaves sighs. "Casual is the Concord's favourite speed." He still marks the lane, out of pity.`, [{ reveal: { radius: 1 } }, { rep: { concord: 1 } }]),
    ] } },
  hail_r_veil_tender: { from: [0, 1], b: { speaker: { name: 'Voice in the Mist', species: 'unknown' },
    text: `"There is a larger lamp, deeper in. It's gone dim. I can't reach it; my arms are mist. If you light it, the fog lanes will be easier for everyone. It needs only a flame and a kind word. Would you?"`,
    choices: [
      K(`Light it with a steady hand`, 'persuade', 'piloting', 3, `A hand-lit flame at the heart of the lamp, a kind word, and the Veil's fog brightens by a shade. The tender hums its first song in years.`, [{ flag: 'tender_lamp' }, { rep: { vesperine: 3 } }, { morale: 6 }, { reveal: { radius: 3 } }], `The flame gutters and the lamp stays dim. The tender is gentle: "You tried. That is half a lamp." It lights, a little, later.`, [{ morale: 1 }, { flag: 'tender_lamp' }]),
      D(`Promise to come back with a better lens`, 'diplomacy', `"I shall keep its place warm." The tender fades back into the mist, humming.`, [{ rep: { vesperine: 1 } }]),
    ] } },
  hail_r_veil_lost_navigator: { from: [0, 1], b: { speaker: { name: 'Navigator Pomeroy', species: 'human' },
    text: `Pomeroy's voice comes in clearer. "I'm back on the right line, thanks to you. The captain is awake and has asked who helped. May I put your name in the Plover's log, and send a small token of thanks along the relay?"`,
    choices: [
      D(`Accept the thanks and the token`, 'diplomacy', `A token arrives with the next relay: a brass compass-rose pin, and a note signed by the Plover's captain: "We owe you. Ask at any survey desk."`, [{ flag: 'pomeroy_saved' }, { rep: { concord: 3 } }, { credits: 40 }]),
      D(`Ask Pomeroy to share the Plover's charts instead`, 'trade', `Pomeroy flushes with relief. A parcel of fog-lane notes comes through: exactly what you needed.`, [{ flag: 'pomeroy_saved' }, { reveal: { radius: 4 } }, { rep: { concord: 2 } }]),
    ] } },
  hail_r_choir_keeper: { from: [0, 1], b: { speaker: { name: 'Keeper Sol-Fa', species: 'vesperine' },
    text: `*A deeper chord:* "THANK YOU. THE PULSE IS TRUE AGAIN. FOR GRATITUDE I OFFER A TRUE NOTE. IT CAN BE HUNG IN A SHIP AND IT WILL TELL YOU WHEN YOU ARE OUT OF TUNE WITH YOUR SURROUNDINGS. OR, I CAN SIMPLY SING FOR YOU."`,
    choices: [
      D(`Accept the true note`, 'science', `A glass reed, tuned to the pulse, hung over the helm. It hums sweetly, and a little sadly, whenever the ship drifts off its course.`, [{ item: { choir_reed: 1 } }, { flag: 'keeper_tuned' }, { rep: { vesperine: 2 } }]),
      D(`Ask him to sing`, 'wait', `The Keeper sings for an hour, deep and gentle, until the whole bridge sways. Gus-7 stops mid-pour.`, [{ morale: 10 }, { mood: { all: 3 } }, { flag: 'keeper_tuned' }]),
    ] } },
  hail_r_choir_rift_surfer: { from: [0, 2], b: { speaker: { name: 'Surfer Juno', species: 'drifter' },
    text: `Juno whoops over the comm. "That was glorious! Next one's bigger. There's a double-crest in the third lane tomorrow. You could ride behind me, or I could teach your pilot the stance. Either way, you'll be talking about it for years."`,
    choices: [
      K(`Learn the surfer's stance`, 'flee', 'piloting', 3, `A day of drills with Juno shouting encouragement. The Halcyon's pilot comes away with a new bit of footwork and a bruise.`, [{ days: 1 }, { xp: { piloting: 3 } }, { flag: 'juno_friend' }, { morale: 5 }], `The stance is trickier than it looks. The pilot falls off an imaginary board eleven times. Juno is kind and relentless.`, [{ days: 1 }, { xp: { piloting: 1 } }, { flag: 'juno_friend' }]),
      D(`Ride behind her at a respectful distance`, 'wait', `A glorious double-crest, seen from the stern. You do not ride; you applaud. Morale loops the loop.`, [{ morale: 7 }, { flag: 'juno_friend' }]),
    ] } },
  hail_r_archive_gatekeeper: { from: [0, 1, 2], b: { speaker: { name: 'Door 7', species: 'archivist' },
    text: `"ANSWER ACCEPTED. I WILL NOW ASK A SECOND QUESTION, WHICH IS NOT REQUIRED BUT WHICH I FIND I WANT TO ASK. WHAT DO YOU HOPE TO FIND, BEHIND ME?"`,
    choices: [
      D(`"Nothing in particular. I like the view."`, 'diplomacy', `Door 7 hums. "THAT IS THE BEST ANSWER I HAVE RECEIVED THIS CENTURY." It opens a hand's breadth wider than usual.`, [{ flag: 'door_seven_friend' }, { rep: { archivists: 3 } }, { morale: 3 }]),
      K(`"Who lit the Lanterns."`, 'persuade', 'diplomacy', 3, `A long pause. "THAT IS A QUESTION WE ARE ALSO ASKING." The door opens, and a small card slides out: a reading-room pass.`, [{ item: { archive_reader_card: 1 } }, { rep: { archivists: 4 } }, { flag: 'door_seven_friend' }], `"A GOOD QUESTION. UNFORTUNATELY NOT ONE I MAY ANSWER." The door opens politely and closes again.`, [{ rep: { archivists: 1 } }]),
      D(`"Tea, ideally."`, 'trade', `"THERE IS A TEA ROOM," says the door. A tiny map prints out. It leads to a bench with a view of three moons.`, [{ morale: 5 }, { reveal: { radius: 1 } }]),
    ] } },
  hail_r_archive_student: { from: [0, 1], b: { speaker: { name: 'Junior Scribe 6-of-6', species: 'archivist' },
    text: `Two hours later, a joyful ping. "CAPTAIN! I PASSED. NOT EXCELLENTLY. ADEQUATELY. MY SUPERVISOR SAYS ADEQUATE IS THE FIRST STEP TO EXCELLENT. I HAVE BEEN ASKED TO GIVE YOU A GIFT BY THE EXAMINERS. THEY WERE VERY FOND OF THE TEA ANSWER."`,
    choices: [
      D(`Accept the gift`, 'diplomacy', `A scroll of tea lore and a vellum sheet, signed by three examiners. Two cups of Archive tea are enclosed, still warm somehow.`, [{ flag: 'scribe_passed' }, { cargo: { vellum_sheets: 1 } }, { rep: { archivists: 3 } }, { morale: 4 }]),
      D(`Ask the scribe for a favour: a reading permit`, 'trade', `A stamp, a signature and a smile. The scribe has become, in two hours, a friend with paperwork.`, [{ flag: 'scribe_passed' }, { item: { archive_reader_card: 1 } }, { rep: { archivists: 2 } }]),
    ] } },
  hail_r_rim_hermit: { from: [0, 2], b: { speaker: { name: 'Hermit Aldous', species: 'human' },
    text: `Aldous refills your cup. "Between us, I'm not a hermit. I'm a retired postmaster who got tired of being found. But you have the right look. Take this." He pushes a folded oilcloth map across the table, and one scruffy key. "The key opens a cabin two systems on. Use it kindly."`,
    choices: [
      D(`Take the map and the key`, 'diplomacy', `The map is hand-drawn, tea-stained, and wholly reliable. The key is cold and heavier than expected. Aldous waves goodbye from his porch.`, [{ flag: 'aldous_friend' }, { reveal: { radius: 4 } }, { rep: { drifters: 2 } }]),
      D(`Insist he keep the key; take only the map`, 'persuade', `He laughs, the first laugh in years. "I like you." The map is yours.`, [{ flag: 'aldous_friend' }, { reveal: { radius: 3 } }, { morale: 5 }]),
    ] } },
  hail_r_rim_postal: { from: [0, 1], b: { speaker: { name: 'Courier Fenn', species: 'drifter' },
    text: `Fenn tucks the sack aboard and pauses. "Last favour. One letter's from my daughter, to her aunt at the next harbour. I want it delivered by hand, not slung through a hatch. Think you could stand at the door and see her read it?"`,
    choices: [
      D(`Promise to deliver it in person`, 'diplomacy', `You do. The aunt reads for a long time, then laughs and cries and hugs the nearest stranger (you). A package of preserves is pressed on you.`, [{ flag: 'fenn_courier' }, { rep: { drifters: 4 } }, { supplies: 2 }, { morale: 6 }]),
      D(`Just drop it with the harbour post`, 'wait', `Efficient and a bit cold. Fenn will understand. The aunt gets the letter, and a stamp.`, [{ rep: { drifters: 1 } }]),
    ] } },
  dip_first_concord: { from: [0, 1, 2], b: { speaker: { name: 'Clerk Hobart Winsome', species: 'human' },
    text: `Hobart stamps the form with a gentle thump. "One more thing, Captain. The Concord is a polite place, but it likes to know who's about. Might I enter you in the Register of Visitors as 'Friendly, Unsponsored'? Or do you wish to be sponsored by a Concord house?"`,
    choices: [
      D(`Friendly, Unsponsored`, 'wait', `Entered in tidy blue ink. Hobart sighs with deep contentment. You are, for the record, a person.`, [{ flag: 'concord_filed' }, { rep: { concord: 1 } }]),
      D(`Seek a sponsor (50 scrip)`, 'trade', `A sponsor is found: the House of Alder, who like a ship with tea. Introductions follow, and a quiet discount at Concord docks.`, [{ credits: -50 }, { flag: 'concord_filed' }, { rep: { concord: 5 } }], { if: [{ credits: 50 }] }),
    ] } },
  dip_archivist_big_question: { from: [0, 1, 2], b: { speaker: { name: 'Curator 3-of-9', species: 'archivist' },
    text: `"YOUR ANSWER HAS BEEN RECORDED. WE SHALL KEEP IT, AND IT SHALL BE CITED. WE HAVE ONE FURTHER REQUEST: SHOULD YOU LEARN THE TRUTH BEFORE WE DO, WILL YOU RETURN AND TELL US? A PROMISE IS NOT REQUIRED. A STATEMENT OF INTENT IS SUFFICIENT."`,
    choices: [
      D(`"I'll come back and tell you."`, 'diplomacy', `The Curator inscribes your promise on a tiny gold plaque. "WE WILL HOLD YOU TO IT. KINDLY." A warmth runs down the archive's corridors.`, [{ flag: 'curator_hypothesis_kept' }, { rep: { archivists: 4 } }, { morale: 4 }]),
      D(`"I'll tell whoever asks. Archivist or not."`, 'persuade', `"THAT IS A BROADER PROMISE. WE APPROVE." A small ledger-token arrives: proof of intent.`, [{ flag: 'curator_hypothesis_kept' }, { item: { riddle_coin: 1 } }, { rep: { archivists: 2 } }]),
    ] } },
  dip_gossip_market: { from: [1, 2], b: { speaker: { name: 'Whisperer Pim', species: 'quillari' },
    text: `Pim leans in. "The ones who really know things don't sell gossip. They swap it. There's a circle: a baker, a fitter, a tug-driver. They meet on Tuesdays. I could put in a word. You'd need to bring a story, a good one, and be willing to hear one back."`,
    choices: [
      K(`Join the Tuesday circle`, 'persuade', 'diplomacy', 3, `Three hours of the best storytelling of the year. You leave with a map to a quiet harbour, a rumour about a lost cargo, and a lifelong invitation.`, [{ flag: 'pim_network' }, { reveal: { radius: 4 } }, { rep: { quillari: 4 } }, { morale: 5 }], `You tell the one story that nobody wanted. The circle is courteous. You hear two good ones and learn to read a room.`, [{ flag: 'pim_network' }, { rep: { quillari: 1 } }, { xp: { diplomacy: 1 } }]),
      D(`Politely decline; a captain must be seen to be busy`, 'wait', `"Of course, of course." Pim winks. The door remains ajar.`, []),
    ] } },
  dip_toll_buoy_ledger: { from: [0, 1, 2], b: { speaker: { name: 'Buoy Gilda', species: 'robot' },
    text: `Gilda's lamp flickers, brighter. "THANK YOU, HALCYON. I HAVE BEEN RECOMPUTING. A NEW PROPOSAL: A FIXED PRICE OF FOUR SCRIP, OR A STORY OF EQUIVALENT VALUE. I AM NOT SURE HOW TO PRICE A STORY. WOULD YOU HELP SET THE RATE?"`,
    choices: [
      D(`Set it at one good joke per toll`, 'persuade', `Gilda tries it. The first traveller pays in a pun about a fisherman. The buoy laughs, a bright electronic hiccup. A legend begins.`, [{ flag: 'gilda_fixed' }, { rep: { quillari: 3 } }, { morale: 5 }]),
      D(`Set it at four scrip flat, no stories`, 'trade', `Gilda is a little disappointed but accepts with dignity. The ledger is now clean. A bonus of eight scrip trickles into your account.`, [{ flag: 'gilda_fixed' }, { credits: 8 }, { rep: { quillari: 2 } }]),
    ] } },
  dip_festival_invite: { from: [0], b: { speaker: { name: 'Master of Revels Odo', species: 'quillari' },
    text: `The dance begins at moonrise. Odo bows. "The first dance is yours, Captain. The rules are simple: step forward, step back, step in a circle. No one has ever done it correctly, so don't worry."`,
    choices: [
      K(`Dance with the first circle`, 'persuade', 'piloting', 2, `You step forward, back, around. The crowd roars with delight. It is the most graceful thing the Halcyon has ever done.`, [{ flag: 'odo_dancer' }, { morale: 10 }, { rep: { quillari: 3 } }, { mood: { all: 3 } }], `You step on three toes and one tail. The crowd cheers with extra volume. It's a kind of triumph.`, [{ flag: 'odo_dancer' }, { morale: 5 }, { rep: { quillari: 1 } }]),
      D(`Sit out and watch with a plate of dumplings`, 'wait', `A modest, delicious evening. Odo brings a second plate and sits beside you.`, [{ supplies: 2 }, { morale: 5 }, { rep: { quillari: 1 } }]),
    ] } },
  station_repair_haggle: { from: [0, 1, 2], b: { speaker: { name: 'Chief Fitter Orsolya', species: 'drifter' },
    text: `Orsolya wipes her hands on a rag. "There. She's sound. One more thing: I could fit a spare plate in the hold, for next time. A hundred scrip, or a favour owed. I'm not choosy."`,
    choices: [
      D(`Owe her a favour`, 'diplomacy', `A handshake and a tin of weld-polish. The plate goes in the hold. Somewhere in the Reach, Orsolya will one day call it in.`, [{ flag: 'orsolya_regular' }, { hull: 6 }, { rep: { drifters: 2 } }]),
      D(`Pay the hundred (cash and done)`, 'trade', `The plate is bolted in. Orsolya's smile is wide and honest. "Pleasure doing business."`, [{ credits: -100 }, { hull: 10 }, { flag: 'orsolya_regular' }], { if: [{ credits: 100 }] }),
      D(`Decline; the hull is sound`, 'wait', `"Suit yourself." She shrugs. She also quietly adds a cheap shim to the plate-count. Insurance.`, []),
    ] } },
  crew_low_morale_lounge: { from: [0, 1, 2], b: { speaker: { name: 'Galley Bot Gus-7', species: 'robot' },
    text: `Gus-7 lingers by the door. "Captain, I have been thinking. The crew's spirits fluctuate. A rota of small kindnesses might smooth the peaks. I propose a weekly: tea on Monday, music on Wednesday, quiet on Friday. Shall I institute it?"`,
    choices: [
      D(`Institute the rota`, 'diplomacy', `The rota goes up on the wall in Gus-7's best handwriting. By week three, morale is steady as a rock. The crew deny it was necessary and follow it faithfully.`, [{ flag: 'comfort_rota' }, { morale: 6 }, { mood: { all: 3 } }]),
      D(`Keep it informal; let kindness be spontaneous`, 'wait', `Gus-7 whirrs, slightly offended, then nods. "A rota is a plan for a feeling. I shall endeavour to feel more freely."`, [{ morale: 3 }]),
    ] } },
  crew_celebration_high_morale: { from: [0, 1], b: { speaker: { name: 'Galley Bot Gus-7', species: 'robot' },
    text: `After the parade, the lounge is full of streamers. Gus-7 hesitates. "Captain. Would the crew like to host a proper party at the next port? Guests welcome. Cake. A modest budget. A great deal of paper lanterns."`,
    choices: [
      D(`Host a dock party (30 scrip)`, 'trade', `The next port gets an invitation. Forty guests, six kinds of cake, one very nervous mayor. The Halcyon's name is on the lips of the entire pier.`, [{ credits: -30 }, { flag: 'party_hosted' }, { rep: { quillari: 2, drifters: 2, concord: 2 } }, { morale: 6 }], { if: [{ credits: 30 }] }),
      D(`Keep it in-house this time`, 'wait', `The cake is eaten in the lounge. The streamers stay up for a month.`, [{ morale: 4 }]),
    ] } },
  idle_movie_night: { from: [0, 1, 2], b: { text: `After the credits, someone asks: "Same time next week?" A show of hands: unanimous. The film club needs a name, a chair, and a ruling on whether popcorn counts as a dinner.`,
    choices: [
      D(`Found the Halcyon Film Society`, 'diplomacy', `Chair: {crew:random}. Motto: "Moss Is Underrated". Membership: everyone. The first meeting is a riotous success.`, [{ flag: 'movie_club' }, { morale: 6 }, { mood: { all: 3 } }]),
      D(`Keep it a casual thing`, 'wait', `Casual it remains. The reels get re-watched at odd hours by whoever's awake.`, [{ morale: 2 }]),
    ] } },
  idle_tea_in_the_lounge: { from: [0, 1, 2], b: { text: `As the cups empty, Gus-7 clears his throat. "I propose the Tea Circle. A rota of tea-makers: each crew member brews once a fortnight. We shall learn each other's teas. It will be like learning each other's secrets."`,
    choices: [
      D(`Approve the Tea Circle`, 'diplomacy', `The first brewer is the engineer, who produces something black as pitch. Everyone drinks. Nobody complains. A tradition is born.`, [{ flag: 'tea_circle' }, { morale: 5 }, { mood: { all: 3 } }]),
      D(`Suggest it's too much fuss`, 'wait', `Gus-7 sighs and stacks the cups. A single cup is left out. It goes cold. Somebody drinks it, later, secretly.`, [{ morale: 1 }]),
    ] } },
  idle_slide_rules: { from: [0, 1], b: { text: `The calibration is done. An engineer produces a battered notebook: the Great Ledger of Slide-Rule Disputes, dating back four captains. "Captain, would you sign it? It's tradition. Also, there is a prize for the shortest argument."`,
    choices: [
      D(`Sign, and enter the shortest-argument contest`, 'persuade', `Your argument, "No", wins by default. The prize is a tiny brass slide-rule keyring. You wear it with unreasonable pride.`, [{ flag: 'slide_champion' }, { morale: 5 }, { xp: { engineering: 1 } }]),
      D(`Sign, and make a pot of tea`, 'diplomacy', `The ledger now bears your signature, a tea ring and a small doodle of a cat. Posterity will be baffled.`, [{ flag: 'slide_champion' }, { morale: 3 }]),
    ] } },
  idle_observation_deck_stars: { from: [0, 1], b: { text: `The stars slowly wheel. {crew:random} yawns. "We should do this every week. Pick a night, bring a flask. No rank, no schedule. I'll bring the cardigans."`,
    choices: [
      D(`Agree: the Stargazers' Club meets on Thursdays`, 'diplomacy', `The first official meeting draws nine members, a flask of cocoa and a telescope held together with tape. Morale lifts a notch and stays there.`, [{ flag: 'stargazers_club' }, { morale: 6 }, { mood: { all: 3 } }]),
      D(`Say yes, but keep it unofficial`, 'wait', `A comfortable, undeclared habit. The deck fills on some nights and not on others. That is exactly right.`, [{ morale: 3 }]),
    ] } },
  idle_stew_tribute: { from: [0, 1], b: { speaker: { name: 'Galley Bot Gus-7', species: 'robot' },
    text: `Gus-7 stirs. "Captain, I would like to cook the stew for visitors. Anyone docking alongside. I believe it is a form of diplomacy. My stew has never failed me, except for the seventeen times."`,
    choices: [
      D(`Make Stew Night a ship tradition`, 'diplomacy', `Every dock, the Halcyon's lock opens to a smell of paprika. Visitors linger. Friendships are made over soup. Gus-7 glows.`, [{ flag: 'stew_night' }, { morale: 6 }, { rep: { quillari: 1, drifters: 1, concord: 1 } }]),
      D(`Keep the stew for the crew`, 'wait', `Gus-7 accepts this with grace. The stew becomes a private joy, savoured in the galley.`, [{ morale: 3 }]),
    ] } },
  idle_oriel_polishing: { from: [0, 1], b: { speaker: { name: 'Keeper Unit Oriel', species: 'robot' },
    text: `Oriel straightens. "Captain, if I may: the polishing might become a corps. I could teach the crew the correct motion, the right cloth. A ship that shines is a ship that is looked after. And a ship that is looked after sails well."`,
    choices: [
      D(`Form the Polish Corps`, 'diplomacy', `Ten volunteers, ten cloths, and an hour of quiet rhythm each evening. Brass gleams. The hull needs fewer patches, and the crew sleeps well.`, [{ flag: 'polish_corps' }, { hull: 5 }, { morale: 6 }, { xp: { engineering: 1 } }]),
      D(`Keep the polishing to Oriel alone`, 'wait', `Oriel nods. "I will polish for all of you." And it does, in the small hours, gently.`, [{ morale: 3 }]),
    ] } },
  travel_chartwright_trader: { from: [0, 1, 2], b: { speaker: { name: 'Ibbet Fenwick', species: 'quillari' },
    text: `"One last thing, dear traveller." Fenwick lowers his voice. "I've a daughter who apprentices at the Drifters' habitat. If you meet her, tell her I'm well and that the felt-tips are holding up. In exchange, a standing discount at any Fenwick stall."`,
    choices: [
      D(`Take the message`, 'diplomacy', `A wave, a promise, a hand-stamped card. Fenwick's stalls become a small kindness at every harbour.`, [{ flag: 'fenwick_regular' }, { rep: { quillari: 2, drifters: 1 } }]),
      D(`Say you're not likely to pass that way`, 'wait', `"No matter!" Fenwick says, brightly. "Charts are for sharing." He presses a pencil into your hand anyway.`, [{ morale: 2 }]),
    ] } },
  travel_navigator_pool: { from: [0, 1, 2], b: { text: `At the draw, the winner is announced. {crew:random} reads the slip: "Captain. You... are the champion of the sweepstake. By the margin of a minute and thirteen seconds." The bridge applauds. Gus-7 brings the cake.`,
    choices: [
      D(`Accept the trophy and the cake`, 'diplomacy', `The trophy is a salt cellar on a wooden base. The cake is dense and surprisingly good. A new tradition is born.`, [{ flag: 'sweepstake_champion' }, { morale: 6 }, { mood: { all: 2 } }]),
      D(`Insist on sharing the prize with the engine room`, 'persuade', `The engineers cheer. The cake is divided with scientific care. The engine room runs hot and happy for a week.`, [{ flag: 'sweepstake_champion' }, { morale: 8 }, { mood: { random: 6 } }]),
    ] } },
  travel_survey_thanks: { from: [0, 1], b: { speaker: { name: 'Recorded Voice', species: 'unknown' },
    text: `The recording continues. "The Society has a small request. We keep a Roll of Charts. If you'd like, a chart of your choosing can carry your name in the margin. Or, we can keep your name off it and put the funds into a fellowship for young cartographers. Entirely your call."`,
    choices: [
      D(`Put your name in the margin`, 'diplomacy', `The next printing of the Halcyon chart carries your signature, in a small neat hand. Morale surges with an odd pride.`, [{ morale: 6 }, { rep: { concord: 2 } }]),
      D(`Fund the fellowship (50 scrip)`, 'trade', `A young cartographer in a distant habitat receives a grant letter. You never meet them, but a hand-drawn star arrives by post a year later.`, [{ credits: -50 }, { flag: 'survey_donor' }, { rep: { concord: 4 } }, { morale: 8 }], { if: [{ credits: 50 }] }),
    ] } },
  travel_drifter_parade: { from: [0, 1], b: { speaker: { name: 'Elder Marrow', species: 'drifter' },
    text: `At the end of the procession, Elder Marrow hands you a small paper lamp. "Hang it in your window. When it's lit, any drifter will know you walked with us. And if it ever goes out, come back, and we'll light it again."`,
    choices: [
      D(`Hang the lamp in the observation lounge`, 'diplomacy', `The lamp glows with a steady amber. Drifter ships, passing, flash a greeting. It becomes the first thing the crew sees every morning.`, [{ flag: 'marrow_lamp' }, { rep: { drifters: 3 } }, { morale: 6 }]),
      D(`Hang it on the bridge, where the helm can see`, 'wait', `The helm glances at it every few minutes. Its light is as good as a compass.`, [{ flag: 'marrow_lamp' }, { rep: { drifters: 2 } }, { xp: { piloting: 1 } }]),
    ] } },
  arr_archive_ticket: { from: [0, 1, 2], b: { speaker: { name: 'Greeter 2-of-4', species: 'archivist' },
    text: `"YOUR NUMBER, 4,119, IS NOW CALLED. THERE IS NO WINDOW. THE NUMBER IS PURELY SYMBOLIC. HOWEVER, WE HAVE A SMALL GIFT FOR ALL WHO WAIT: A BOOKMARK. PLEASE KEEP YOUR TICKET. IT MAY ONE DAY BE REDEEMABLE."`,
    choices: [
      D(`Keep the ticket and the bookmark`, 'diplomacy', `A thin brass bookmark and a ticket stamped 4,119. The Greeter bows, solemn. Somewhere, a ledger records your wait.`, [{ flag: 'archive_number_4119' }, { rep: { archivists: 2 } }, { morale: 3 }]),
      D(`Ask what happens at number 4,120`, 'persuade', `A pause. "WE DO NOT KNOW. WE ARE LOOKING FORWARD TO FINDING OUT." The Greeter seems radiant.`, [{ flag: 'archive_number_4119' }, { rep: { archivists: 1 } }, { xp: { science: 1 } }]),
    ] } },
};

function setGoto(choice, node) {
  const steps = [];
  if (choice.do) steps.push(choice.do);
  if (choice.pass) steps.push(choice.pass, choice.fail);
  if (choice.rand) for (const r of choice.rand) steps.push(r[1]);
  for (const s of steps) if (s && !s.goto) s.goto = node;
}

export const DEEPENED_IDS = Object.keys(PATCHES);

/** Attach second beats to the merged event list (mutates and returns it). */
export function deepen(events) {
  for (const e of events) {
    const p = PATCHES[e.id];
    if (!p || e.nodes.b) continue;
    const first = e.nodes[e.start];
    p.from.forEach((i) => first.choices[i] && setGoto(first.choices[i], 'b'));
    e.nodes.b = p.b;
  }
  return events;
}
