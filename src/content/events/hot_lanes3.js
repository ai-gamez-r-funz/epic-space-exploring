// EVENTS-A (fix round 5): region-agnostic hot-lane chains (no `when`), so the engine's generic fallback is rare.
// Different shapes: ragged debris, signal wash, gravity washboard, a stalled convoy, a dust squall, a lost beacon.
import { hot } from './lanes_distress.js';
const ex = (label, tag, cond, text, fx = []) => (next) => ({ label, tag, if: cond, do: { text, fx, goto: next } });
const FL = (n) => ({ flag: n });

export const HOT_LANES_3 = [
  hot('lane_hot_ragged_lane', 'The Ragged Lane', 'asteroids', [], [
    { text: 'Stage one. The lane is ragged with old debris: bolts, panels, a surprising number of spoons. Nothing is large. All of it is fast. The Meridian chart says "tidy up if you can" in the margin, in someone\'s wry hand.',
      check: ['piloting', 3, 'Thread the debris at speed', 'flee', 'Spoons ping off the shields like hail on a tin roof, and the Halcyon is through without a dent.', 'A panel the size of a door catches the stern. The ship rings like a bell.', [{ hull: -5 }]],
      safe: ['Pick through at a crawl', 'Slow, tedious, and the fuel gauge notes it.', [{ fuel: -2 }, { days: 1 }]] },
    { text: 'Stage two. A coolant line has taken a hit. The engineers are halfway into a bulkhead with a torch and a flask of tea, and the leak is sweet-smelling and growing.',
      check: ['engineering', 3, 'Patch the line while underway', 'science', 'A clamp, a prayer, a drop of solder. The leak stops, and the engine room cheers.', 'The patch slips and a spray of coolant coats the corridor. You lose fuel and a mop.', [{ fuel: -2 }, { morale: -1 }]],
      safe: ['Slow down and patch at leisure', 'You lose half a day, but the patch is tidy.', [{ days: 1 }, { supplies: -1 }]],
      extra: ex('Fit a spare from the cargo hold', 'trade', [{ cargo: { machine_parts: 1 } }], 'The spare slides home with a click. The engineers look almost bored.', [FL('hl_b'), { cargo: { machine_parts: -1 } }]) },
    { text: 'Stage three. The tail of the debris field hangs in a drifting wall. Behind it is clean space. The scanner can pick out a gap if {crew:science} squints at the right numbers.',
      check: ['science', 3, 'Plot the gap and fly it', 'science', 'The gap opens as predicted, a narrow gold slot in the dark. You slide through like a letter into a box.', 'The gap shifts while you aim. You bump through the wall the hard way.', [{ hull: -4 }]],
      safe: ['Burn through the wall', 'A brute-force exit with a trail of sparks.', [{ fuel: -2 }, { hull: -2 }]] },
    { text: 'Out in clean space, a Meridian road-gang radios a thank-you: whoever clears the Ragged Lane saves them a week\'s sweeping. A bounty follows.',
      full: ['Collect the road-gang bounty', 'A purse, a crate of tidy spare parts and a drawing of a spoon in your honour.', [{ credits: 85 }, { cargo: { machine_parts: 2 } }, { morale: 5 }]],
      some: ['Take a thank-you and a spoon', 'A single bent spoon, signed. It goes in the galley.', [{ credits: 15 }, { morale: 2 }]] }]),

  hot('lane_hot_signal_wash', 'The Static Wash', 'ionstorm', [], [
    { speaker: { name: 'Lane Warden Ibb', species: 'human' }, text: 'Stage one. The lane\'s beacons are drowned in static. A tired warden calls from the dark: "Halcyon, I can talk you through, if you can hear me. It helps if you say please. I don\'t know why."',
      check: ['diplomacy', 3, 'Ask politely and listen carefully', 'persuade', 'Ibb brightens, and walks you through the first stretch like a nanny.', 'The static eats his words. You guess, and guess poorly.', [{ hull: -4 }]],
      safe: ['Wait for the static to thin', 'You listen to hiss for half a day.', [{ days: 1 }]] },
    { text: 'Stage two. A second storm of noise swamps the sensors. {crew:science} builds a filter from a coat-hanger and a lot of faith.',
      check: ['science', 3, 'Filter the noise by hand', 'science', 'The coat-hanger works. A clear channel opens like a window.', 'The filter whines, then howls. You fly by guess.', [{ fuel: -2 }]],
      safe: ['Shut down the sensors and fly by eye', 'The old way. It costs fuel and nerves.', [{ fuel: -2 }, { morale: -1 }]],
      extra: ex('Ring the signal flags to the warden', 'diplomacy', [{ upgrade: 'signal_flags' }], 'Bright flags unfurl from the mast. Ibb answers in kind, and the lane is yours.', [FL('hl_b')]) },
    { text: 'Stage three. The last beacon is dark. A craft hangs near it, adrift, with a lamp waving. It is a lone mender, trying to relight it.',
      check: ['piloting', 3, 'Hold station to help relight it', 'flee', 'You hold perfectly still while the mender swaps the lamp. The beacon flares and the lane lights up.', 'You drift off station, and the mender relights it on their own, kindly.', [{ morale: -1 }]],
      safe: ['Pass with a wave', 'The mender waves back, unoffended.', [{ morale: 1 }]] },
    { text: 'At the lane\'s end, Ibb signs off with a stamp. "That\'s the quietest crossing I\'ve heard in a year."',
      full: ['Accept the warden\'s bounty', 'A purse, a warden\'s whistle and a promise to keep the lamp lit.', [{ credits: 90 }, { item: { door_token: 1 } }, { rep: { concord: 2 } }, { morale: 5 }]],
      some: ['Take a kindly sign-off', 'Ibb sends a bar of chocolate.', [{ supplies: 1 }, { credits: 15 }]] }]),

  hot('lane_hot_gravity_washboard', 'The Gravity Washboard', 'rift', [], [
    { text: 'Stage one. The lane is a washboard of gravity ripples, each one a small hill. The Halcyon bucks and pitches. {crew:engineering} grabs the doorframe and mutters about stabilisers.',
      check: ['engineering', 3, 'Tune the stabilisers to the ripple', 'science', 'The stabilisers hum into phase. The ripples pass under you like waves under a keel.', 'The stabilisers fight the ripple and lose. Everything not tied down goes for a ride.', [{ hull: -4 }, { supplies: -1 }]],
      safe: ['Slow to a crawl over the ripples', 'It takes forever, but the cups stay on the table.', [{ days: 1 }, { fuel: -1 }]] },
    { text: 'Stage two. The ripples quicken. The helm calls out each crest like a rower. "Left on the hill, right on the dip." {crew:piloting} is grinning in a way that worries the others.',
      check: ['piloting', 4, 'Ride the crests, hands light', 'flee', 'You surf the washboard like a skier on a good slope. The crew whoops from the galley.', 'You miss a crest. The ship bangs down hard.', [{ hull: -6 }]],
      safe: ['Cut speed and bump through', 'Bump, bump, bump. The hull creaks but holds.', [{ hull: -2 }, { fuel: -1 }]],
      extra: ex('Let the barrel-roll gyro smooth it', 'flee', [{ upgrade: 'barrel_roll_gyro' }], 'The gyro absorbs the worst of it. The Halcyon rolls through like a swan on a pond.', [FL('hl_b'), { morale: 2 }]) },
    { text: 'Stage three. The motion has gone to the crew\'s stomachs. {crew:medicine} is doing the rounds with a basin and a firm, kind voice.',
      check: ['medicine', 2, 'Settle the crew with mint and a firm word', 'science', 'Mint, a cold flannel, and a promise of toast. The crew are restored.', 'Half the crew are green. A sorry hour in the lounge.', [{ morale: -2 }]],
      safe: ['Everyone grits their teeth', 'You power through. The galley is quiet and slightly damp.', [{ morale: -2 }]] },
    { text: 'The washboard smooths into open space. A survey crew on a nearby buoy has been measuring your passage, and holds up a clipboard with a number on it.',
      full: ['Claim the survey bounty', 'A purse and a calibrated gravity-meter, a gift from the surveyors.', [{ credits: 90 }, { item: { rift_chime: 1 } }, { xp: { piloting: 1 } }, { morale: 5 }]],
      some: ['Take a polite wave', 'The surveyors wave a flag. You wave back.', [{ credits: 15 }]] }]),

  hot('lane_hot_stalled_convoy', 'The Stalled Convoy', 'ship_alien', [], [
    { speaker: { name: 'Convoy Boss Marl', species: 'quillari' }, text: 'Stage one. A convoy of freight tugs is stalled in the middle of the lane, nose to tail, going nowhere. Marl\'s voice crackles: "Captain! Our lead tug has a cold. We\'re waiting for it to feel better."',
      check: ['diplomacy', 3, 'Ask them to shuffle aside', 'persuade', 'Marl is delighted to be asked. The tugs part like a curtain, and the lead one coughs a goodbye.', 'The tugs refuse to move. You wait while they argue about it.', [{ days: 1 }]],
      safe: ['Slip along the outside', 'Slow, careful, and rude, but effective.', [{ fuel: -2 }]] },
    { text: 'Stage two. The lane beyond is a gauntlet of tow-lines stretched taut across the gap, a dozen thin steel threads. A mistake would be loud and expensive.',
      check: ['piloting', 4, 'Slalom between the lines', 'flee', 'You weave through the lines without a hum. The tug crews salute.', 'A line twangs across the hull with a note like a harp string. The hull sulks.', [{ hull: -5 }]],
      safe: ['Ask the tugs to slacken the lines', 'They do, slowly. It takes a while.', [{ days: 1 }, { rep: { quillari: 1 } }]] },
    { text: 'Stage three. The lead tug lurches and stalls again, drifting toward the lane wall. If it hits, the whole convoy will tangle. Its engineer is waving a wrench.',
      check: ['engineering', 3, 'Board and restart the tug', 'science', 'A cough, a spark, and the tug roars. The engineer kisses your hand.', 'The restart fails. You tow the tug clear instead, at a price.', [{ fuel: -2 }, { rep: { quillari: 1 } }]],
      safe: ['Nudge it off the wall with the bow', 'A gentle shove. The tug lives, and the paint is scuffed.', [{ hull: -3 }]],
      extra: ex('Hook it with the tow gear', 'trade', [{ upgrade: 'tow_hook' }], 'The hook bites, the tug swings clear and the convoy rolls on in a happy line.', [FL('hl_c'), { rep: { quillari: 2 } }]) },
    { text: 'Marl\'s convoy clears the lane in good order, and the boss shouts a toast across the channel. "A drink on the house!" He tosses you a bottle.',
      full: ['Accept the convoy\'s reward', 'A purse, a case of glass brandy and the freedom of the next three toll gates.', [{ credits: 95 }, { cargo: { glass_brandy: 2 } }, { item: { toll_token: 1 } }, { rep: { quillari: 3 } }]],
      some: ['Take a bottle and a cheer', 'One bottle, one cheer. Good enough.', [{ cargo: { glass_brandy: 1 } }, { credits: 10 }]] }]),

  hot('lane_hot_dust_squall', 'The Dust Squall', 'nebula', [], [
    { text: 'Stage one. A squall of fine dust is racing down the lane, red as rust, eating the stars one at a time. {crew:science} has a theory about its path and a pencil behind each ear.',
      check: ['science', 3, 'Plot its path and sidestep it', 'science', 'You slide round the squall\'s shoulder with a minute to spare. The dust goes by in a long red sigh.', 'The squall changes its mind. You take it on the flank.', [{ hull: -5 }]],
      safe: ['Back off and wait it out', 'A day in the lee. Boring, safe, and slightly gritty.', [{ days: 1 }, { supplies: -1 }]] },
    { text: 'Stage two. The dust has got in the lungs. The whole ship is coughing, and the air smells of old attics. {crew:medicine} sets up a clinic in the corridor with a pot of honey.',
      check: ['medicine', 3, 'Treat the cough and filter the air', 'science', 'Honey, steam and a dose of common sense. The crew breathe easy again.', 'The cough lingers. A grumpy, wheezy afternoon.', [{ morale: -2 }]],
      safe: ['Seal the vents and ride it out', 'You cut the air flow and hold your breath. It costs a little in supplies.', [{ supplies: -2 }]],
      extra: ex('Brew the herb-cupboard tonic', 'science', [{ upgrade: 'herb_cupboard' }], 'The herb cupboard produces a tonic that clears every chest on board. The crew are almost suspicious.', [FL('hl_b'), { morale: 3 }]) },
    { text: 'Stage three. The squall\'s end is a wall of dark red. The sensors can\'t see through it. The helm asks for a steady hand and an unsteady prayer.',
      check: ['piloting', 3, 'Fly the last mile by instinct', 'flee', 'You fly it by feel, and the dust parts. The Halcyon bursts into sunlight with a hum.', 'The wall bites back. You bump out the far side.', [{ hull: -4 }]],
      safe: ['Edge forward on thrusters', 'Slow, uneasy, and eventually through.', [{ fuel: -2 }]] },
    { text: 'Clear of the dust, a hab-farm\'s harvest crew signals from their skiff: they have been waiting for a safe route for a week, and they have a barrel of something.',
      full: ['Accept the harvest crew\'s gift', 'A purse, a crate of rations and a barrel of dust-roasted nuts.', [{ credits: 80 }, { cargo: { ration_bars: 3 } }, { item: { tea_sample: 1 } }, { rep: { drifters: 2 } }]],
      some: ['Take a handful of nuts', 'Warm, salty and delicious.', [{ supplies: 1 }, { credits: 10 }]] }]),

  hot('lane_hot_lost_beacon', 'The Lost Beacon', 'beacon', [], [
    { text: 'Stage one. The lane\'s guiding beacon has gone missing. Its mooring cable swings loose in the dark. Somewhere ahead, it is drifting, still blinking, lost. If you find it, the lane can be mended.',
      check: ['science', 3, 'Track its faint blink on the scanners', 'science', 'A tiny pulse, three seconds apart. You home in on it like a bat.', 'The blink fades into noise. You search for an hour.', [{ days: 1 }]],
      safe: ['Search the lane methodically', 'A long careful sweep. It costs fuel but finds nothing yet.', [{ fuel: -2 }, { days: 1 }]],
      extra: ex('Light the lamp mast to call it in', 'science', [{ upgrade: 'lamp_mast' }], 'The mast flares and the beacon, somewhere out there, blinks in answer. It sounds relieved.', [FL('hl_a')]) },
    { text: 'Stage two. The beacon has drifted into a cloud of drifting rock. It is a small hurt thing, spinning gently. To reach it, you must fly through the cloud.',
      check: ['piloting', 3, 'Ease in and grapple it', 'flee', 'A delicate dance among the stones. You snag the beacon in one try.', 'The rocks jostle you. You snag the beacon on the third try.', [{ hull: -4 }]],
      safe: ['Send a drone in to fetch it', 'The drone does the work, slowly, at some cost.', [{ fuel: -1 }, { days: 1 }]] },
    { speaker: { name: 'Keeper Mott', species: 'drifter' }, text: 'Stage three. A lone lane-keeper hails, delighted. "My beacon! You found it! Would you help re-moor it? I am not good at heights."',
      check: ['engineering', 3, 'Re-moor the beacon yourselves', 'science', 'A bolt, a cable, a firm tug. The beacon blinks bright and proud.', 'The mooring slips twice, but on the third try holds.', [{ days: 1 }]],
      safe: ['Hand the beacon to Mott and wish him luck', 'He fumbles but manages. It takes an hour.', [{ days: 1 }, { rep: { drifters: 1 } }]] },
    { text: 'The beacon blazes, and the lane is open to all ships again. Keeper Mott presses a lantern into your hands and a purse from the Society.',
      full: ['Accept the keeper\'s thanks', 'A purse, a lantern lit from the beacon and a chart of three quiet lanes.', [{ credits: 90 }, { item: { kelp_lantern: 1 } }, { reveal: { radius: 2 } }, { rep: { drifters: 2 } }, { morale: 5 }]],
      some: ['Take a handshake and a thermos', 'The keeper presses a thermos on you. It is full of cocoa.', [{ supplies: 1 }, { credits: 15 }]] }]),
];
