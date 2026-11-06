// EVENTS-B (round 2): authored scan-finds (ctx 'planet'), feature landings, phenomenon investigations and Society telegrams.
// Single-node events are built with tiny local helpers (E, D, K, R) that return plain event/choice objects.
// NOTE: no {life} condition exists yet (see docs/REQUESTS.md); variants are keyed by planetType + feature instead.
//
// CODEX: (new ids; WORLD-B please add, title = readable form of id)
//   codex_scan_geyser_gardens codex_scan_ice_lake codex_scan_ice_ore codex_scan_ice_curtain codex_scan_cairns
//   codex_scan_lava_forge_ruins codex_scan_lava_seam codex_scan_lava_baths codex_scan_lava_hum
//   codex_scan_dune_ore codex_scan_obelisk codex_scan_desert_hum codex_scan_oasis
//   codex_scan_ocean_aurora codex_scan_drowned_spire codex_scan_nodules codex_scan_sonar_hum
//   codex_scan_jungle_stairs codex_scan_jungle_baths codex_scan_jungle_cliffs
//   codex_scan_terran_town codex_scan_terran_aurora codex_scan_quarry
//   codex_scan_barren_dome codex_scan_barren_hum codex_scan_warm_patch
//   codex_scan_crystal_vein codex_scan_crystal_ruin codex_scan_crystal_hum
//   codex_scan_toxic_ruin codex_scan_toxic_ore codex_scan_toxic_aurora
//   codex_scan_gas_eye codex_scan_gas_aurora codex_scan_gas_hum
//   codex_land_mining_camp codex_land_singing_vein codex_land_adit codex_land_bath_house codex_land_geyser_clock
//   codex_land_aurora_picnic codex_land_aurora_photos codex_land_tea_house codex_land_mosaic codex_land_old_lift
//   codex_land_buried_antenna codex_land_signal_choir
//   codex_phen_nebula_balloon codex_phen_star_nursery codex_phen_tumbling_library codex_phen_rock_garden
//   codex_phen_comet_postbox codex_phen_aurora_duet codex_phen_greenhouse codex_phen_toll_booth
//   codex_stipend_telegrams
// ITEMS: none new. FLAGS set: stipend_shoals, stipend_choir, stipend_rim, buried_antenna_heard, tea_house_regular, greenhouse_tended

const art = (scene, sp) => ({ scene, species: sp || 'unknown' });
// E: single-node event
const E = (id, title, ctx, tags, when, scene, text, choices, o = {}) => ({
  id, title, tags, ctx, weight: o.weight || 9, when,
  ...(o.once ? { once: true } : { cooldown: o.cooldown || 25 }),
  art: art(scene, o.sp),
  start: 'a',
  nodes: { a: { ...(o.speaker ? { speaker: o.speaker } : {}), text, choices } },
});
// D: plain choice. K: skill check. R: weighted random.
const D = (label, tag, text, fx, extra) => ({ label, tag, ...(extra || {}), do: { text, fx } });
const K = (label, tag, skill, diff, pt, pfx, ft, ffx, extra) => ({ label, tag, ...(extra || {}), check: { skill, diff }, pass: { text: pt, fx: pfx }, fail: { text: ft, fx: ffx } });
const R = (label, tag, rows, extra) => ({ label, tag, ...(extra || {}), rand: rows.map(([w, text, fx]) => [w, { text, fx }]) });

export default [
  // ======================================================== ICE
  E('scan_ice_geyser_gardens', 'Gardens of Geysers', 'planet', ['wonder', 'science'], [{ planetType: 'ice' }], 'planet',
    `Scan returns a plain of ice dotted with geysers that erupt in careful rotation, like a fountain display with a rota. Each plume freezes mid-air into a feathered sculpture. Somebody has clearly never been told this is a hazard.`,
    [K(`Fly a drone through the schedule`, 'flee', 'piloting', 3, `The drone threads four plumes and brings back a vial of fresh-frozen vapour. Fuel-grade, if you squint. The geysers take a bow.`, [{ fuel: 2 }, { xp: { piloting: 2 } }, { codex: 'codex_scan_geyser_gardens' }], `The drone arrives a beat late and wears a plume as a hat. It returns encased in a lovely, useless ice sculpture.`, [{ credits: -15 }, { morale: 1 }]),
     D(`Time the eruptions and publish the roster`, 'science', `A tidy table of geyser times goes into the log. Meridian files it under "Delightful" and pays a small handling stipend.`, [{ credits: 30 }, { xp: { science: 1 } }, { codex: 'codex_scan_geyser_gardens' }]),
     D(`Watch one full cycle from orbit`, 'wait', `Seventeen minutes of silent fountains under starlight. Nobody speaks. Somebody brings out biscuits.`, [{ morale: 4 }, { supplies: -1 }])]),
  E('scan_ice_lake_below', 'The Lake Under the Lid', 'planet', ['mystery', 'science'], [{ planetType: 'ice' }, { feature: 'hot_springs' }], 'planet',
    `Deep radar finds liquid water under four kilometres of ice, warm and faintly lit from below. Something down there is generating a soft yellow glow. It is either geothermal or a very large lamp left on.`,
    [K(`Lower a sounding probe`, 'science', 'engineering', 3, `The probe sings back a map: a warm lake, kelp-like filaments, and a ring of lights. Good for a paper and a polite stipend.`, [{ credits: 40 }, { xp: { engineering: 2 } }, { codex: 'codex_scan_ice_lake' }], `The cable freezes at two kilometres and snaps with a sound like a dropped spoon. The probe is now a permanent resident.`, [{ credits: -25 }, { morale: -1 }]),
     D(`Send a hello down on the sonar`, 'persuade', `A long pause. A single, soft pulse returns, slow as a cat's blink. You take this as hospitality.`, [{ morale: 5 }, { codex: 'codex_scan_ice_lake' }]),
     D(`Mark it on the chart, with a star`, 'wait', `A felt-tip star, labelled "Lamp?". Future surveyors will find it irresistible.`, [{ reveal: { radius: 1 } }])]),
  E('scan_ice_ore_veins', 'Blue Veins in the Glacier', 'planet', ['trade', 'science'], [{ planetType: 'ice' }, { feature: 'ore' }], 'asteroids',
    `The glacier is veined with metal: blue-green copper salts and a thread of something that sparkles like salt in a spotlight. A mining outfit could carve a cathedral here. A passing ship could chip a souvenir.`,
    [D(`Carve a souvenir sample with the lab drone`, 'science', `A tidy cube of veined ice goes into cold storage. It sells to a collector as "genuine antique glacier".`, [{ cargo: { curios: 1 } }, { codex: 'codex_scan_ice_ore' }]),
     K(`Core a proper sample for the foundry`, 'science', 'engineering', 3, `A clean core and a fistful of machine parts for your trouble. The foundry will want to talk.`, [{ cargo: { machine_parts: 2 } }, { xp: { engineering: 2 } }], `The core binds in the ice and the drill is left as a monument. A very expensive monument.`, [{ credits: -30 }]),
     D(`Sell the coordinates to a co-op`, 'trade', `A Drifter co-op pays a fair fee for the claim and promises to name a pit after you. Modest honour, real money.`, [{ credits: 70 }, { rep: { drifters: 1 } }])]),
  E('scan_ice_aurora_curtain', 'A Curtain Hung for You', 'planet', ['wonder'], [{ planetType: 'ice' }, { feature: 'aurora_fields' }], 'aurora',
    `Ice below, aurora above, and between them a long soft curtain of pale green that ripples whenever the ship's drive hums. The magnetometer sounds almost embarrassed to report that the sky is showing off.`,
    [D(`Hum the drive up and down, conducting`, 'persuade', `The curtain follows your baton in three long swells. Nobody on the bridge says a word. The helm is crying, politely.`, [{ morale: 8 }, { codex: 'codex_scan_ice_curtain' }]),
     K(`Collect charged particles in a flask`, 'science', 'science', 3, `The flask glows for a week. {crew:science} labels it "mild weather in a jar" and it powers a fuel cell to boot.`, [{ fuel: 2 }, { xp: { science: 2 } }], `The flask arcs out through the cap and gives the lab a sparkly sneeze. Nothing is harmed except dignity.`, [{ morale: -1 }]),
     D(`Take a long exposure for the lounge wall`, 'wait', `The print is stunning. It goes above the tea table and doubles as a sunrise.`, [{ morale: 4 }])]),
  E('scan_ice_cairns', 'Cairns on the Ice', 'planet', ['mystery'], [{ planetType: 'ice' }, { feature: 'ruins' }], 'ruins',
    `A line of ice-block cairns crosses the white plain, each exactly one stride from the next, each topped with a flat stone. They lead to a low doorway in a glacier. Someone marked this road for walkers in a hurry or in doubt.`,
    [D(`Follow the cairns to the door`, 'science', `The door is open and the hall inside is dry and bare, with a bench and a lamp-niche. A rest stop, centuries old. You leave a ration bar on the bench.`, [{ cargo: { ration_bars: -1 } }, { morale: 4 }, { rep: { drifters: 1 } }, { codex: 'codex_scan_cairns' }]),
     K(`Date the stones`, 'science', 'science', 2, `Nine centuries, give or take. The cairns were rebuilt every generation, until they weren't. {crew:science} files it carefully.`, [{ xp: { science: 2 } }, { codex: 'codex_scan_cairns' }], `The dating is vague. "Old," says the report. {crew:science} is honest about being impressed.`, [{ morale: 1 }]),
     D(`Add a stone to the last cairn`, 'diplomacy', `You place a flat pebble on top and say a short thanks. The wind stops for a moment. You decide not to look for causes.`, [{ morale: 5 }])]),

  // ======================================================== LAVA
  E('scan_lava_forge_ruins', 'A Forge Without a Smith', 'planet', ['mystery', 'trade'], [{ planetType: 'lava' }, { feature: 'ruins' }], 'ruins',
    `On a basalt shelf above the lava, a vast forge-hall sits with anvils polished by wind. The bellows still breathe. Tools hang in order of size. A sign says, in three scripts, "BACK SOON". It has been soon for a very long time.`,
    [K(`Scavenge the tool racks`, 'science', 'engineering', 3, `Good steel, well kept. {crew:engineering} takes two hammers and a heartfelt apology note.`, [{ cargo: { machine_parts: 3 } }, { xp: { engineering: 2 } }, { codex: 'codex_scan_lava_forge_ruins' }], `The racks are sealed with a tidy, very old lock. The lock wins.`, [{ morale: -1 }]),
     D(`Leave a token under the sign`, 'diplomacy', `A scrip coin and a note: "Kept your forge warm." The bellows give one slow breath. Nice.`, [{ credits: -5 }, { rep: { drifters: 2 } }, { morale: 4 }, { codex: 'codex_scan_lava_forge_ruins' }]),
     D(`Scan the anvils for maker's marks`, 'science', `The marks match a drifter family-line; the Long Table may remember them. A neat lead for the charts.`, [{ reveal: { radius: 2 } }])]),
  E('scan_lava_ore_seam', 'A Seam of Warm Money', 'planet', ['trade', 'hazard'], [{ planetType: 'lava' }, { feature: 'ore' }], 'asteroids',
    `A river of lava has cut through a seam of gold-bearing quartz and left it plated along the bank like a jeweller's tray. The seam is bright, the bank is unstable, and the odds of a bad idea are good.`,
    [K(`Skim the bank with a drone`, 'flee', 'piloting', 4, `One flawless pass, a basket of gold-flecked quartz. The traders will gasp.`, [{ cargo: { curios: 2 } }, { credits: 40 }, { xp: { piloting: 2 } }, { codex: 'codex_scan_lava_seam' }], `The bank slumps. The drone swims for a moment and sinks with dignity. A costly lesson.`, [{ credits: -40 }, { morale: -1 }]),
     D(`Document the seam and sell the survey`, 'trade', `A mining house pays for the data, no questions, no risk. Good, honest money.`, [{ credits: 60 }, { codex: 'codex_scan_lava_seam' }]),
     D(`Admire it. It's very pretty`, 'wait', `The seam shines like a lantern. It will be there tomorrow, and the day after, and you will not.`, [{ morale: 3 }])]),
  E('scan_lava_baths', 'The Bath That Boils', 'planet', ['comedy', 'relief'], [{ planetType: 'lava' }, { feature: 'hot_springs' }], 'planet',
    `Among the lava flows sits a perfectly circular pool, steaming gently, edged with smooth stones and a rack of thick, abandoned towels. The scanner reports the water at "uncomfortably pleasant". The medic reports nothing, but is already packing a flannel.`,
    [K(`Check the water with the field kit`, 'science', 'medicine', 2, `Mineral-rich, scalding at the middle, lovely at the rim. {crew:medicine} prescribes forty minutes and issues towels.`, [{ morale: 8 }, { xp: { medicine: 2 } }, { codex: 'codex_scan_lava_baths' }], `The kit says "yes", the medic says "no", and the argument ends with a very pink officer and an excellent soak.`, [{ morale: 5 }]),
     D(`Send the drone in first`, 'science', `The drone emerges pleasantly steamed, humming. You take that as consent.`, [{ morale: 4 }, { codex: 'codex_scan_lava_baths' }]),
     D(`Admire it from orbit and keep your towels`, 'wait', `Sensible. Boring. Nobody speaks to you for the next hour.`, [{ morale: -1 }])]),
  E('scan_lava_hum', 'The Hum Below the Heat', 'planet', ['mystery'], [{ planetType: 'lava' }, { feature: 'ancient_signal' }], 'planet',
    `Beneath the lava crust, something taps a slow rhythm. Not seismic, not thermal, too regular for either. It repeats the pulse of the nearest Lantern, only slower, as if remembering it.`,
    [K(`Listen with a seismic array`, 'science', 'science', 4, `The tapping has structure: a lullaby in four beats. {crew:science} files three pages and goes pale with joy. The signal points toward a nearby system.`, [{ reveal: { radius: 3 } }, { xp: { science: 3 } }, { codex: 'codex_scan_lava_hum' }], `The heat distorts everything. You catch only the rhythm, fond and unreadable.`, [{ morale: 1 }, { codex: 'codex_scan_lava_hum' }]),
     D(`Tap back on the hull`, 'persuade', `The rhythm pauses, then resumes a half-beat faster. You made it happy.`, [{ morale: 5 }]),
     D(`Note it and move on`, 'wait', `The hum fades from the speakers. It lingers in the mind.`, [{ codex: 'codex_scan_lava_hum' }])]),

  // ======================================================== DESERT
  E('scan_desert_dune_ore', 'Treasure in the Dunes', 'planet', ['trade', 'science'], [{ planetType: 'desert' }, { feature: 'ore' }], 'asteroids',
    `The wind has stripped a ridge to bedrock and exposed a seam of dark, heavy ore, bright as a freshly cleaned stove. A cluster of abandoned sand-sleds sits half-buried beside it, with a bucket and a very optimistic shovel.`,
    [D(`Fill the bucket and be on your way`, 'trade', `A bucket of ore is hardly a mine, but the foundry pays by the pound. A modest haul and a tidy day.`, [{ cargo: { machine_parts: 2 } }, { codex: 'codex_scan_dune_ore' }]),
     K(`Survey the seam properly`, 'science', 'science', 3, `The seam runs a kilometre. {crew:science} drafts a claim and sells it to a Quillari broker for a tidy profit.`, [{ credits: 100 }, { xp: { science: 2 } }], `The survey is half-done when a sandstorm sweeps the camp. The data is patchy; the broker pays a pittance.`, [{ credits: 20 }]),
     D(`Return the shovel to its owner's sled`, 'diplomacy', `You prop it neatly against the sled with a note: "Carry on." The wind agrees.`, [{ morale: 3 }, { rep: { drifters: 1 } }])]),
  E('scan_desert_obelisk', 'The Obelisk That Points', 'planet', ['mystery', 'wonder'], [{ planetType: 'desert' }, { feature: 'ruins' }], 'ruins',
    `A single black obelisk stands in the middle of the dunes, taller than any hill, perfectly clean. Its shadow points at no sun the planet has. The sensors disagree about its age and agree about its manners: it is very, very polite.`,
    [K(`Read the carvings`, 'persuade', 'diplomacy', 3, `They are a long, courteous list: names of travellers who stopped here, and what they asked for. At the bottom, a space with your ship's name beginning to appear.`, [{ rep: { archivists: 3 } }, { morale: 6 }, { codex: 'codex_scan_obelisk' }], `The carvings resist you. One word comes through clearly: "please".`, [{ codex: 'codex_scan_obelisk' }]),
     D(`Chart the shadow's direction`, 'science', `The shadow points to a blank patch of the chart. A lane, perhaps. You mark it.`, [{ reveal: { radius: 3 } }]),
     D(`Leave a small gift at its foot`, 'trade', `A hand loom thread, a ration bar and a good wish. The obelisk hums once. The ground is warm for the rest of the day.`, [{ cargo: { ration_bars: -1 } }, { morale: 5 }])]),
  E('scan_desert_hum', 'The Singing Dune', 'planet', ['wonder', 'mystery'], [{ planetType: 'desert' }, { feature: 'ancient_signal' }], 'planet',
    `One dune on the horizon booms at dusk: a deep, hollow note that rolls across the sands. The pitch is steady. The pitch is, the comm officer notes with a raised eyebrow, a perfect B-flat, and matches an old Lantern chord.`,
    [D(`Hum the B-flat back`, 'persuade', `The dune adds a harmonic. You make a duet with a hill. Morale goes up faster than the dune.`, [{ morale: 6 }, { codex: 'codex_scan_desert_hum' }]),
     K(`Analyse the grain-size and wind`, 'science', 'science', 2, `The sand is a single grain-size, bred by wind over a million years. The chord is the dune's own. A lovely paper for the Society.`, [{ xp: { science: 2 } }, { credits: 25 }, { codex: 'codex_scan_desert_hum' }], `The analysis is inconclusive, but delightful. {crew:science} names the dune "Percival".`, [{ morale: 2 }]),
     D(`Slide down it in a cargo tray`, 'flee', `Loud, glorious, undignified. The dune sings. The crew applauds. The tray survives.`, [{ morale: 7 }, { hull: -1 }])]),
  E('scan_desert_oasis', 'The Oasis That Waits', 'planet', ['relief', 'wonder'], [{ planetType: 'desert' }, { feature: 'hot_springs' }], 'planet',
    `A ring of green in the middle of the dunes: palms, reeds and a clear warm pool. A hand-lettered signboard stands at the edge, bleached nearly white but still legible: "ALL ARE WELCOME. PLEASE REFILL YOUR FLASKS."`,
    [D(`Refill the flasks, with thanks`, 'wait', `Cool sweet water, a morning of shade. You leave with full tanks and a feeling of having been looked after by a stranger.`, [{ supplies: 3 }, { morale: 5 }, { codex: 'codex_scan_oasis' }]),
     K(`Sample the pool for medicine`, 'science', 'medicine', 2, `Mild minerals, good for the joints. {crew:medicine} bottles a litre and dispenses it, with a smile, to anyone who has been grumpy lately.`, [{ cargo: { medical_kits: 1 } }, { xp: { medicine: 2 } }], `The sample is just water, really good water. The medic is slightly disappointed and entirely refreshed.`, [{ morale: 3 }]),
     D(`Repaint the signboard`, 'diplomacy', `A fresh coat of white and a clean black stencil. The next traveller will find the welcome as bright as the day it was made.`, [{ morale: 4 }, { rep: { drifters: 2 } }])]),

  // ======================================================== OCEAN
  E('scan_ocean_aurora', 'Light on the Water', 'planet', ['wonder'], [{ planetType: 'ocean' }, { feature: 'aurora_fields' }], 'aurora',
    `Aurora above, mirrored below: the ocean holds the curtain on its surface like a second sky. Between them, the ship seems to float in a bowl of green light. Even the engines hush.`,
    [D(`Skim low and fly between the skies`, 'flee', `A slow glide through glowing air with the sea shining beneath. The crew treats the air like holy ground.`, [{ morale: 9 }, { fuel: -1 }, { codex: 'codex_scan_ocean_aurora' }]),
     K(`Photograph the reflections for the Society`, 'science', 'science', 2, `A single frame goes into the Meridian gallery. The Society prints it on the annual card and sends a stipend.`, [{ credits: 45 }, { xp: { science: 1 } }, { codex: 'codex_scan_ocean_aurora' }], `The exposure blurs. The result is an Impressionist masterpiece and an unusable record.`, [{ morale: 2 }]),
     D(`Serve tea in the observation dome`, 'wait', `The dome fills with green light. The tea tastes like sunrise. Few words are said.`, [{ morale: 6 }, { supplies: -1 }], { if: [{ upgrade: 'observation_dome' }] })]),
  E('scan_ocean_drowned_spire', 'The Spire Under the Swell', 'planet', ['mystery', 'science'], [{ planetType: 'ocean' }, { feature: 'ruins' }], 'ruins',
    `At the bottom of a clear shallow, a spire rises from the sea-floor: pale, fluted, covered in a delicate filigree of coral. The lowest windows are open. A school of silver fish swims in and out through the front door like commuters.`,
    [K(`Send a submersible through the door`, 'science', 'engineering', 3, `The sub finds a round hall with a mosaic floor: a map of the sea, with the Reach drawn like a distant shore. It prints a copy on the way out.`, [{ reveal: { radius: 3 } }, { xp: { engineering: 2 } }, { codex: 'codex_scan_drowned_spire' }], `A current spins the sub into a pillar. It is recovered by line and shame.`, [{ credits: -20 }, { morale: -1 }]),
     D(`Scan from above and leave the fish to their commute`, 'wait', `A fine scan, a polite wave to the fish, and a cheerful note in the log.`, [{ xp: { science: 1 } }, { codex: 'codex_scan_drowned_spire' }]),
     D(`Drop a hand-lantern at the door`, 'diplomacy', `The lantern sinks, glowing. The fish rearrange themselves around it as if it had always been there.`, [{ morale: 4 }, { rep: { drifters: 1 } }])]),
  E('scan_ocean_nodules', 'Pearls of Iron', 'planet', ['trade'], [{ planetType: 'ocean' }, { feature: 'ore' }], 'asteroids',
    `The sea-floor is carpeted with dark fist-sized nodules, rich in manganese and perfectly spherical, like a billiard table for giants. A scoop on a long cable could harvest a few before the next tide.`,
    [K(`Dredge a load with the cargo winch`, 'trade', 'engineering', 2, `The winch brings up a satisfying clatter of nodules. The foundry will take them by the crate.`, [{ cargo: { machine_parts: 3 } }, { xp: { engineering: 1 } }, { codex: 'codex_scan_nodules' }], `The dredge snags on a boulder. You recover the cable and lose the afternoon.`, [{ days: 1 }]),
     D(`Pick up one for the mantelpiece`, 'wait', `A single perfect nodule goes into the lounge. Guests are invited to guess what it is.`, [{ morale: 3 }, { cargo: { curios: 1 } }]),
     D(`Leave them; the sea-floor likes its own jewellery`, 'diplomacy', `You file the location for the Meridian marine charts and let the nodules be.`, [{ rep: { concord: 1 } }, { codex: 'codex_scan_nodules' }])]),
  E('scan_ocean_sonar_hum', 'The Sea Answers in Triplets', 'planet', ['mystery', 'wonder'], [{ planetType: 'ocean' }, { feature: 'ancient_signal' }], 'planet',
    `Your sonar ping comes back with an echo, then another, then a third: a perfect triplet, spaced exactly as a Lantern greeting. Something on the sea-floor answers every ping. It is patient. It is, perhaps, amused.`,
    [D(`Ping back, but add a flourish`, 'persuade', `The echo adds a flourish of its own. The sea has a sense of humour, and it's better than yours.`, [{ morale: 6 }, { codex: 'codex_scan_sonar_hum' }]),
     K(`Trace the echo to its source`, 'science', 'science', 4, `Four hundred metres down: a buried sphere, humming. {crew:science} marks it on the chart and writes "NOT TODAY" with a very sensible look.`, [{ reveal: { radius: 3 } }, { xp: { science: 3 } }, { codex: 'codex_scan_sonar_hum' }], `The echo scatters. The sea guards its privacy.`, [{ morale: 1 }]),
     D(`Stop pinging; it is rude to keep asking`, 'diplomacy', `The echoes fade after one last, gentle triplet. You imagine a polite nod.`, [{ morale: 3 }])]),

  // ======================================================== JUNGLE
  E('scan_jungle_stairs', 'Stairs into the Green', 'planet', ['mystery', 'wonder'], [{ planetType: 'jungle' }, { feature: 'ruins' }], 'ruins',
    `A stair of pale stone climbs out of the canopy, step after perfect step, to a platform where a bell the size of a hut hangs on a beam. Vines have wrapped everything but the bell. The bell has been wiped. Recently.`,
    [D(`Ring the bell, once`, 'persuade', `A warm, deep note rolls over the treetops. The canopy ripples with answering calls. A hundred birds applaud.`, [{ morale: 7 }, { codex: 'codex_scan_jungle_stairs' }]),
     K(`Study the wipe marks`, 'science', 'science', 3, `Small, quick, three-fingered prints. The bell is cleaned by something that cares for it daily. {crew:science} hopes to meet it.`, [{ xp: { science: 2 } }, { codex: 'codex_scan_jungle_stairs' }], `The marks are inconclusive. The bell hums, unbothered.`, [{ morale: 1 }]),
     D(`Leave a small bundle of fruit at the top`, 'diplomacy', `The fruit is gone by the time you turn around. In its place is a carved wooden bead, still warm.`, [{ cargo: { curios: 1 } }, { rep: { drifters: 1 } }])]),
  E('scan_jungle_baths', 'The Warm Stream and the Wrong Fruit', 'planet', ['comedy', 'relief'], [{ planetType: 'jungle' }, { feature: 'hot_springs' }], 'planet',
    `A warm stream threads the canopy, fed by springs, lined with fruit trees whose pods hang over the water like bunting. A baboon-ish creature with an enormous moustache is soaking in the pool. It looks you up and down and sighs.`,
    [D(`Share the pool, with a polite nod`, 'diplomacy', `The creature shifts over three inches. A truce is made. The soak is the best of the voyage; the creature declines to introduce itself.`, [{ morale: 8 }, { codex: 'codex_scan_jungle_baths' }]),
     K(`Test the fruit`, 'science', 'medicine', 2, `Edible, sweet, mildly sedative. {crew:medicine} limits everyone to two and watches the rest sleep soundly.`, [{ supplies: 3 }, { xp: { medicine: 2 } }], `Edible, sweet and very laxative. The less said the better.`, [{ morale: -3 }, { supplies: -1 }]),
     D(`Leave the creature to its bath`, 'wait', `You back away slowly. It nods once, gravely. A sovereign's farewell.`, [{ morale: 2 }])]),
  E('scan_jungle_cliffs', 'The Cliff That Glitters', 'planet', ['trade', 'hazard'], [{ planetType: 'jungle' }, { feature: 'ore' }], 'asteroids',
    `A cliff face above the canopy glitters with silver-white ore, laced with vines. A rope ladder dangles from a ledge halfway up. It looks well used. It looks like the sort of rope ladder a person trusts, once.`,
    [K(`Rappel down to the ledge and chip a sample`, 'flee', 'piloting', 3, `A tidy swing, a clatter of ore, and a smug return. The haul is solid.`, [{ cargo: { machine_parts: 2 }}, { credits: 30 }, { codex: 'codex_scan_jungle_cliffs' }], `The rope gives, gently. You land in the canopy among a startled colony of tree-hugging sloths. They file a complaint.`, [{ hull: -3 }, { morale: -2 }]),
     D(`Send a drone to hover and sample`, 'science', `The drone does it in four minutes and returns with ore and a surprised vine.`, [{ cargo: { machine_parts: 1 } }, { codex: 'codex_scan_jungle_cliffs' }]),
     D(`Admire the glitter and mark the claim`, 'trade', `You file a quick claim at the next station. Someone else will do the climbing. You will take a polite fee.`, [{ credits: 45 }])]),

  // ======================================================== TERRAN
  E('scan_terran_town', 'A Town on Pause', 'planet', ['mystery', 'relief'], [{ planetType: 'terran' }, { feature: 'ruins' }], 'ruins',
    `A small town: tidy roofs, a clock tower, a bakery with its shutters half open. Every window is lit. The streets are empty, but the bakery is still warm, and a bell chimes the hour. A note on the door reads, "OUT, BACK FOR TEA."`,
    [D(`Leave a coin for the bread`, 'trade', `You take a loaf and leave two coins. The bell chimes. The bread is the best you've tasted in weeks.`, [{ credits: -2 }, { supplies: 3 }, { morale: 6 }, { codex: 'codex_scan_terran_town' }]),
     K(`Check the clock tower's logs`, 'science', 'engineering', 2, `The clock has run on a trickle charge for fifty years. The log's last entry: "All well. Gone to the Lanterns. - Mayor." {crew:engineering} winds it by hand, for luck.`, [{ xp: { engineering: 2 } }, { morale: 4 }, { codex: 'codex_scan_terran_town' }], `The clock fights your wrench. It strikes thirteen in revenge.`, [{ morale: 1 }]),
     D(`Leave a note: "Called. Will visit again."`, 'diplomacy', `You pin it to the door beside theirs. A tidy bit of manners in the quiet.`, [{ morale: 3 }])]),
  E('scan_terran_aurora', 'Evening Lights Over the Meadow', 'planet', ['wonder', 'relief'], [{ planetType: 'terran' }, { feature: 'aurora_fields' }], 'aurora',
    `Green fields, a slow river, and a night sky wearing ribbons of aurora. A broad meadow lies directly beneath the brightest band. Someone has thoughtfully planted a bench there. Perhaps for the purpose.`,
    [D(`Send a party down with blankets and tea`, 'wait', `The party sits on the bench until dawn. Nobody can explain what was said. Everyone is changed, slightly, for the better.`, [{ morale: 10 }, { supplies: -1 }, { codex: 'codex_scan_terran_aurora' }]),
     K(`Record the light and the silence`, 'science', 'science', 2, `{crew:science} captures a 90-minute recording of wind, river and aurora hiss. The Society adds it to a library of Soothing Things.`, [{ credits: 35 }, { xp: { science: 1 } }], `The recording is mostly {crew:random} saying "oh" very quietly. Which is also, honestly, accurate.`, [{ morale: 3 }]),
     D(`Name the meadow after the crew`, 'persuade', `"Halcyon Meadow" goes on the chart. It is the least scientific decision of the week and gets the loudest cheer.`, [{ morale: 5 }, { reveal: { radius: 1 } }])]),
  E('scan_terran_quarry', 'The Friendly Quarry', 'planet', ['trade', 'comedy'], [{ planetType: 'terran' }, { feature: 'ore' }], 'asteroids',
    `A quarry cut into a hillside, tidy as a layer cake. A sign, newly painted, reads "OPEN DAY: ALL VISITORS WELCOME, PLEASE WEAR A HAT". A figure in a large hat waves with both arms.`,
    [D(`Join the tour and buy the souvenir slate`, 'trade', `Forty minutes of excellent quarry history and a cut slab of blue slate. The hat is optional but strongly recommended.`, [{ credits: -10 }, { cargo: { curios: 1 } }, { morale: 4 }, { codex: 'codex_scan_quarry' }]),
     K(`Offer to appraise their ore`, 'persuade', 'science', 2, `Your appraisal impresses the quarrymaster. A discount on stone, a recommendation to a foundry, and a hat.`, [{ credits: 40 }, { rep: { concord: 1 } }, { xp: { science: 1 } }], `You misidentify a feldspar as a quartz. The quarrymaster is gentle. The hat is rescinded.`, [{ morale: -1 }]),
     D(`Wave from orbit, hat on`, 'wait', `The figure waves both arms vigorously for the next ten minutes. It's very hard to leave.`, [{ morale: 3 }])]),

  // ======================================================== BARREN
  E('scan_barren_dome', 'The Dome with a Doormat', 'planet', ['mystery', 'comedy'], [{ planetType: 'barren' }, { feature: 'ruins' }], 'ruins',
    `A silver dome stands on a bare plain. Beside the airlock lies a doormat that reads "WELCOME" in four languages. The dome is sealed, dark, and spotless. The doormat is spotless too. Someone cleans it, or something does.`,
    [K(`Knock politely`, 'persuade', 'diplomacy', 2, `A hatch whirs; a tiny cleaning drone rolls out, bows, and hands over a small brass key marked "TO WHOEVER". The dome remains shut, but the key will fit something.`, [{ item: { door_token: 1 } }, { morale: 5 }, { codex: 'codex_scan_barren_dome' }], `Nobody answers. The doormat looks reproachful. You wipe your feet anyway.`, [{ morale: 1 }]),
     D(`Scan the dome's power core`, 'science', `A tiny, patient reactor, tuned to run for ten thousand years. Whoever built it expected to be forgotten and wanted tidy surroundings anyway.`, [{ xp: { science: 2 } }, { codex: 'codex_scan_barren_dome' }]),
     D(`Add a second "WELCOME" in chalk`, 'diplomacy', `You write it in Meridian script. A tiny gust sweeps the dust off the mat as if in thanks.`, [{ morale: 4 }])]),
  E('scan_barren_hum', 'The Tuning Fork Planet', 'planet', ['mystery', 'wonder'], [{ planetType: 'barren' }, { feature: 'ancient_signal' }], 'planet',
    `The whole planet rings faintly, like a fork struck once long ago and still fading. The note is an exact fifth below the Lantern chord. The ship's hull hums in sympathy. The cat leaves the bridge in protest.`,
    [D(`Hum the missing note`, 'persuade', `The planet's note and yours settle into a fifth. The crew goes silent. A warm shiver passes through the deck.`, [{ morale: 8 }, { codex: 'codex_scan_barren_hum' }]),
     K(`Map the standing waves`, 'science', 'science', 3, `The waves map the planet's interior like an x-ray: a cavity in the core, big as a cathedral. A neat paper and a quiet question.`, [{ xp: { science: 3 } }, { credits: 40 }], `The map is mostly interference. Still, it's pretty.`, [{ morale: 1 }]),
     D(`Dampen the hull and stay quiet`, 'wait', `A kindness to the cat and to your ears. The planet keeps humming without you.`, [{ morale: 2 }])]),
  E('scan_barren_warm_patch', 'A Warm Patch on a Cold Rock', 'planet', ['relief', 'science'], [{ planetType: 'barren' }, { feature: 'hot_springs' }], 'planet',
    `One circular patch of ground, ten metres across, stays comfortably warm in the middle of a frozen plain. Frost forms a perfect ring around it. A single small plant, improbably, flowers there. It is the loneliest, bravest flower in the Reach.`,
    [D(`Water the flower`, 'diplomacy', `A cup of tea leaf water. The flower turns, ever so slightly, and opens another petal. The crew calls it Gwen.`, [{ morale: 7 }, { supplies: -1 }, { codex: 'codex_scan_warm_patch' }]),
     K(`Core the warm patch`, 'science', 'engineering', 3, `A pocket of geothermal heat, tapped with a thin pipe. A free hour of warmth for the ship's tanks.`, [{ fuel: 2 }, { xp: { engineering: 2 } }, { codex: 'codex_scan_warm_patch' }], `The pipe cracks. Steam hisses. Gwen is moved aside by a considerate drone.`, [{ hull: -2 }]),
     D(`Take a seed and leave the flower`, 'wait', `A single seed in a jar. A very small garden begins in the lab window.`, [{ morale: 4 }, { cargo: { seed_vault_crates: 1 } }])]),

  // ======================================================== CRYSTAL
  E('scan_crystal_vein', 'Veins That Hum', 'planet', ['trade', 'science'], [{ planetType: 'crystal' }, { feature: 'ore' }], 'planet',
    `A whole cliff of crystal is laced with veins of hum-bright metal that sing under the sensors. Some of the veins are tuned. A tuned vein makes a better tuning crystal than any lab could grow. The Vesperine would pay well for a clean sample.`,
    [K(`Cut a tuned vein with the ultrasonic saw`, 'science', 'engineering', 3, `A perfect cut, a long clean note, a tray of crystals ringing in the cargo hold.`, [{ cargo: { tuning_crystals: 3 } }, { xp: { engineering: 2 } }, { codex: 'codex_scan_crystal_vein' }], `The saw hits a harmonic and shrieks. The vein shatters into sparkling gravel. Painful ears, thin yield.`, [{ cargo: { tuning_crystals: 1 } }, { morale: -2 }]),
     D(`Ask the nearest Vesperine relay for permission first`, 'diplomacy', `A long chord of agreement comes back, with a request to take only three. You take three. Rep, and a thank-you hum.`, [{ cargo: { tuning_crystals: 3 } }, { rep: { vesperine: 3 } }, { codex: 'codex_scan_crystal_vein' }]),
     D(`Listen to the cliff sing for an hour`, 'wait', `Three overtones and a whole sky of quiet. The bridge is hushed as a library.`, [{ morale: 6 }])]),
  E('scan_crystal_ruin', 'The Glass Cathedral', 'planet', ['mystery', 'wonder'], [{ planetType: 'crystal' }, { feature: 'ruins' }], 'ruins',
    `A cathedral grown, not built: slender crystal arches, windows of pure facets, a nave empty except for a ring of tall, silent chairs. When light moves across the roof, the whole building rings very softly, as if turning pages.`,
    [K(`Sit in a chair and listen`, 'persuade', 'diplomacy', 3, `The chair hums. The cathedral answers in a warm chord. A voice, almost a voice, says "welcome back", and you are not sure who it meant.`, [{ rep: { vesperine: 4 } }, { morale: 7 }, { codex: 'codex_scan_crystal_ruin' }], `The chair is very cold and very quiet. You feel politely unwelcome. You thank it anyway.`, [{ morale: -1 }]),
     D(`Chart the arches for the Archive`, 'science', `A fine record of acoustics and geometry. The Archivists will weep with pleasure.`, [{ rep: { archivists: 2 } }, { xp: { science: 2 } }, { codex: 'codex_scan_crystal_ruin' }]),
     D(`Light a single candle in the nave`, 'wait', `The flame multiplies in the facets, a thousand tiny stars. It's the best light show in the sector.`, [{ morale: 6 }])]),
  E('scan_crystal_hum', 'A Crystal That Says Hello', 'planet', ['wonder', 'comedy'], [{ planetType: 'crystal' }, { feature: 'ancient_signal' }], 'planet',
    `One crystal, standing alone on a plateau, pulses at the exact interval of the Lantern greeting. Three short, one long. It repeats, patient, expectant, like a doorbell waiting to be answered.`,
    [D(`Answer the doorbell`, 'persuade', `The crystal flares, then sings a six-note melody that feels, unmistakably, like a welcome. A tiny shard drops free.`, [{ cargo: { tuning_crystals: 1 } }, { morale: 6 }, { codex: 'codex_scan_crystal_hum' }]),
     K(`Compare its pulse with the Lantern records`, 'science', 'science', 3, `The pulse matches a Lantern signal to the millisecond. {crew:science} suspects a relay network and says so, quite loudly.`, [{ xp: { science: 3 } }, { reveal: { radius: 3 } }], `The comparison is close but not exact. Interesting. Frustrating.`, [{ morale: 1 }]),
     D(`Ignore it and see if it sulks`, 'flee', `It does. The pulse stutters, fades and returns, a little faster. You feel obscurely rude.`, [{ morale: -2 }])]),

  // ======================================================== TOXIC
  E('scan_toxic_ruin', 'The Tea House in the Fog', 'planet', ['comedy', 'mystery'], [{ planetType: 'toxic' }, { feature: 'ruins' }], 'ruins',
    `Through the green fog, a sealed pavilion: round windows, a curved roof, and a sign in neat calligraphy that reads, per the translator, "TEA, SERVED WITHIN." The sealed door is warm. The kettle, inside, is audibly boiling.`,
    [K(`Match the airlock cycle and enter`, 'science', 'engineering', 3, `The pavilion's airlock admits you with a delicate hiss. Inside: a table for eight, a kettle, a pot of something fragrant. A note: "Please help yourself."`, [{ supplies: 3 }, { morale: 7 }, { xp: { engineering: 1 } }, { codex: 'codex_scan_toxic_ruin' }], `The airlock rejects you three times. The kettle whistles pointedly. You retreat.`, [{ morale: -1 }, { fuel: -1 }]),
     D(`Send Gus-7 in a sealed suit`, 'wait', `Gus-7 returns with a tray, a small paper fan, and an expression you have never seen on a robot. He's smitten.`, [{ morale: 7 }, { supplies: 2 }, { codex: 'codex_scan_toxic_ruin' }]),
     D(`Leave the tea for whoever it's meant for`, 'diplomacy', `Courteous. You close the log and your stomach grumbles loudly.`, [{ morale: 2 }, { rep: { drifters: 1 } }])]),
  E('scan_toxic_ore', 'Sulphur and Silver', 'planet', ['trade', 'hazard'], [{ planetType: 'toxic' }, { feature: 'ore' }], 'asteroids',
    `The poison clouds rain sulphur onto a plain of bright silver slag. A stripe of ore runs right through it, lit like a runway by lightning. Everything is shining and nothing is safe to touch.`,
    [K(`Skim the plain in the sealed lander`, 'flee', 'piloting', 4, `A hot, loud pass and a lucky scoop. The lander returns with a bright haul and a lot of explaining to do to the paint.`, [{ cargo: { machine_parts: 2 } }, { credits: 50 }, { xp: { piloting: 2 } }], `A gust catches the lander. Sulphur eats the paint and half the antenna. The ore is just a handful.`, [{ hull: -6 }, { cargo: { machine_parts: 1 } }]),
     D(`Sell the survey to a refining house`, 'trade', `A refiner buys the data and gasps at the lightning photograph. Safe money for dangerous scenery.`, [{ credits: 55 }, { codex: 'codex_scan_toxic_ore' }]),
     D(`Admire the lightning`, 'wait', `A thousand strikes an hour over a silver floor. A show worth the oxygen.`, [{ morale: 4 }])]),
  E('scan_toxic_aurora', 'Green on Green', 'planet', ['wonder', 'comedy'], [{ planetType: 'toxic' }, { feature: 'aurora_fields' }], 'aurora',
    `The poison sky glows green. The aurora above it glows green. The ship's console glows green. {crew:random} observes, "I have never seen so many shades of green on one afternoon" and is told to stop talking before it becomes a competition.`,
    [D(`Hold a green-tone appreciation hour`, 'wait', `Eleven named greens by the end, including one christened "Mildly Concerned Lime". The hour is memorable.`, [{ morale: 7 }, { codex: 'codex_scan_toxic_aurora' }]),
     K(`Filter the spectrum for new lines`, 'science', 'science', 3, `Two unfamiliar emission lines. A paper, a plaque and a stipend for the first record of "Halcyon Green".`, [{ credits: 40 }, { xp: { science: 2 } }, { codex: 'codex_scan_toxic_aurora' }], `The filters clog with sulphur. The spectrum comes back, in the lab's words, "a sort of Tuesday".`, [{ morale: 1 }]),
     D(`Turn off the console lights, just for a minute`, 'persuade', `A minute of true dark, with only the aurora. Somebody says, "oh". It's enough.`, [{ morale: 4 }])]),

  // ======================================================== GAS
  E('scan_gas_eye', 'The Eye of a Very Slow Storm', 'planet', ['wonder', 'hazard'], [{ planetType: 'gas' }], 'planet',
    `A storm the size of a continent, three hundred years old, with a calm eye at its centre. Inside, the sky is clear and the bands slide by in slow ribbons. A probe could sit inside the eye and listen to a century of weather.`,
    [K(`Fly a probe into the eye`, 'flee', 'piloting', 4, `The probe reaches the still centre and broadcasts three hours of eerie calm. The Society pays for the recording.`, [{ credits: 60 }, { xp: { piloting: 2 } }, { codex: 'codex_scan_gas_eye' }], `The eyewall catches the probe and sends it spinning into the dark. A moment of silence, please.`, [{ credits: -35 }, { morale: -1 }]),
     D(`Model the storm from orbit`, 'science', `A quiet simulation, a smooth movie of centuries in four minutes. The lab applauds.`, [{ xp: { science: 2 } }, { codex: 'codex_scan_gas_eye' }]),
     D(`Name the storm and wave goodbye`, 'wait', `"Old Gerald" is entered on the chart with a drawing of a very large eyebrow. Morale improves.`, [{ morale: 4 }])]),
  E('scan_gas_aurora', 'Polar Curtains, Slightly Rude', 'planet', ['wonder', 'comedy'], [{ planetType: 'gas' }, { feature: 'aurora_fields' }], 'aurora',
    `The giant's poles are crowned with auroras that roll in great slow arcs, flaring suddenly at the ship's engines as if clearing their throat. The magnetometer reports "interference". The ship's cat reports "outrage".`,
    [K(`Dip the antenna in the field for a power boost`, 'science', 'engineering', 3, `The antenna drinks the field for a minute. The fuel cells gain a quiet top-up.`, [{ fuel: 2 }, { xp: { engineering: 2 } }], `The field bites back. A small cloud of sparks, a larger cloud of language. The antenna is singed.`, [{ hull: -3 }]),
     D(`Record the arcs and compare with pulsar tapes`, 'science', `The arcs match the tapes' rhythm at a tenth the speed. A good cosmic joke.`, [{ codex: 'codex_scan_gas_aurora' }, { xp: { science: 1 } }]),
     D(`Dim the lights and watch`, 'wait', `The curtains dance for an hour. Gus-7 pours cocoa without being asked.`, [{ morale: 6 }])]),
  E('scan_gas_hum', 'Whale-Song in the Clouds', 'planet', ['mystery', 'wonder'], [{ planetType: 'gas' }, { feature: 'ancient_signal' }], 'planet',
    `The gas giant's upper decks carry a long, rhythmic call, repeated every nineteen minutes. It could be a storm, a whale, or the world's own heartbeat. It matches the Lantern pulse stretched to a hundred times its length.`,
    [D(`Tune a transmitter to the same slow rhythm`, 'persuade', `The next call arrives exactly in time. Something answered. The ship's cat sits up and looks at the speaker with deep suspicion.`, [{ morale: 6 }, { codex: 'codex_scan_gas_hum' }]),
     K(`Triangulate the source`, 'science', 'science', 4, `The call comes from deep in the clouds, from a floating mass the size of a county. A nursery, perhaps. {crew:science} sits down on the floor.`, [{ reveal: { radius: 3 } }, { xp: { science: 3 } }, { codex: 'codex_scan_gas_hum' }], `The call bounces through the storm bands and comes back from everywhere. Charming. Useless.`, [{ morale: 1 }]),
     D(`Let the clouds keep their secret`, 'diplomacy', `You turn the receiver down. The call goes on without you, like an old song on a far radio.`, [{ morale: 3 }])]),

  // ======================================================== LANDINGS BY FEATURE
  {
    id: 'landing_ore_mining_camp', title: 'The Camp That Waited', tags: ['mystery', 'trade'], ctx: 'landing', weight: 9,
    when: [{ feature: 'ore' }], cooldown: 25, art: art('landing', 'drifter'), start: 'a',
    nodes: {
      a: { text: `A tidy mining camp: six bunks, a stove, a pile of sorted ore under a tarpaulin, and a calendar stopped on a Thursday. A handwritten sign on the stove reads "BACK BY SUPPER". The kettle is full. The stove is cold.`,
        choices: [
          D(`Add your name to the visitors' book`, 'diplomacy', `Page after page of scrawled signatures, going back decades. You sign, with a flourish, and add "Kettle looks good."`, [{ morale: 3 }, { rep: { drifters: 1 } }], { }),
          { label: `Sort through the ore pile`, tag: 'science', check: { skill: 'engineering', diff: 2 }, pass: { text: `Prime ore, graded and labelled. You take the red-flagged half and leave the blue, as the labels request. Fair is fair.`, fx: [{ cargo: { machine_parts: 3 } }, { xp: { engineering: 1 } }], goto: 'b' }, fail: { text: `The labels are in a shorthand you don't speak. You leave it untouched, fairly sure you've mis-sorted one crate.`, fx: [{ morale: -1 }], goto: 'b' } },
          D(`Make a pot of tea and wait an hour`, 'wait', `Nobody arrives. The tea is good. You feel part of something, for an hour.`, [{ supplies: -1 }, { morale: 5 }], { }),
        ] },
      b: { text: `At the back of the cabin, a locker holds a single envelope addressed "To whoever relieves us." Inside: a claim form, signed and witnessed, transferring the camp to the finder, plus a hand-drawn map to the nearest friendly harbour.`,
        choices: [
          D(`Accept the claim, and file it kindly`, 'trade', `The claim sells at the next harbour for a fair price. You send half the proceeds to the Drifter relief fund, with a note.`, [{ credits: 90 }, { rep: { drifters: 3 } }, { reveal: { radius: 3 } }, { codex: 'codex_land_mining_camp' }]),
          D(`Leave the envelope; add a note and go`, 'wait', `"Found it. Kept it warm. Come home." The cabin feels briefly less empty.`, [{ morale: 5 }, { codex: 'codex_land_mining_camp' }]),
        ] },
    },
  },
  {
    id: 'landing_ore_singing_vein', title: 'The Vein That Sings Back', tags: ['wonder', 'science'], ctx: 'landing', weight: 8,
    when: [{ feature: 'ore' }], cooldown: 30, art: art('landing', 'vesperine'), start: 'a',
    nodes: {
      a: { text: `Your boots ring on the rock. Everywhere. The ore underfoot rings with each step in a different note: a stone keyboard half a kilometre wide. {crew:random} tries a scale and the whole hillside plays along.`,
        choices: [
          D(`Compose something short`, 'persuade', `Eight bars of "Greensleeves", slightly flat, performed on the mountain. A Vesperine relay, miles away, applauds in cascading chords.`, [{ morale: 8 }, { rep: { vesperine: 2 } }, { codex: 'codex_land_singing_vein' }]),
          K(`Cut a clean sample of the tuned seam`, 'science', 'engineering', 3, `A sliver of ore that still hums. Set on the bridge shelf, it rings whenever the engines idle. Sweet.`, [{ cargo: { tuning_crystals: 2 } }, { xp: { engineering: 2 } }, { codex: 'codex_land_singing_vein' }], `The seam chips with a cry. You collect the shards, apologising, and pocket two dull stones.`, [{ morale: -1 }, { cargo: { curios: 1 } }]),
          D(`Dance a little, for science`, 'wait', `The rock plays the Charleston. The chief engineer is no dancer; the ore forgives her.`, [{ morale: 6 }]),
        ] },
    },
  },
  {
    id: 'landing_ore_collapsed_adit', title: 'Tunnel with a Question Mark', tags: ['hazard', 'relief'], ctx: 'landing', weight: 8,
    when: [{ feature: 'ore' }], cooldown: 30, art: art('landing', 'drifter'), start: 'a',
    nodes: {
      a: { text: `A tunnel mouth, propped with ancient timbers, tapped with a faint thump-thump from within. The scanner suggests a pocket of air and one very small something moving about. A recent-ish rockfall has sealed the middle of the passage.`,
        choices: [
          { label: `Shore the roof and clear the fall`, tag: 'science', check: { skill: 'engineering', diff: 4 }, pass: { text: `Beam by beam, with {crew:engineering} calling the lifts, the way opens. Out waddles a startled tunnel-hog with a pouch of gems and a look of profound relief.`, fx: [{ xp: { engineering: 3 } }, { cargo: { curios: 2 } }, { morale: 6 }], goto: 'b' }, fail: { text: `A beam slips; the fall shifts; everyone scrambles out in a cloud of dust. The tunnel-hog, unharmed, escapes the other way. Nobody is hurt but the shuttle's paint.`, fx: [{ hull: -4 }, { morale: -2 }], goto: 'b' } },
          { label: `Speak through the rock; calm whoever it is`, tag: 'diplomacy', check: { skill: 'diplomacy', diff: 2 }, pass: { text: `A gentle voice on the speaker, a patient breath, and the tunnel-hog finds its own way round the fall by a crawl you didn't know existed. Everyone is relieved.`, fx: [{ morale: 5 }, { xp: { diplomacy: 1 } }], goto: 'b' }, fail: { text: `You talk for an hour. The thumping stops, then resumes in a rhythm that sounds like boredom. It leaves via another route.`, fx: [{ morale: 1 }], goto: 'b' } },
          D(`Mark it for the Drifter rescue crews and leave`, 'wait', `A beacon and a note go in the mouth of the tunnel. Rescuers will be along. You hope the hog likes cheese.`, [{ rep: { drifters: 2 } }]),
        ] },
      b: { text: `The tunnel-hog sits outside, polishing one gem on its sleeve. It pushes the gem toward you with a nose that has seen better years. "Thank you" is the only possible translation of its expression.`,
        choices: [
          D(`Accept the gem`, 'diplomacy', `A sparkling blue gem the size of a thumbnail. It goes to the lounge, where it receives more compliments than the captain.`, [{ cargo: { curios: 1 } }, { codex: 'codex_land_adit' }]),
          D(`Insist it keep it; give it a ration bar`, 'trade', `The hog snuffles at the bar with sceptical delight. A pocket full of bright pebbles follows you to the shuttle.`, [{ cargo: { ration_bars: -1 } }, { cargo: { curios: 2 } }, { morale: 5 }, { codex: 'codex_land_adit' }]),
        ] },
    },
  },
  {
    id: 'landing_springs_bath_house', title: 'The Bath-House Rules', tags: ['comedy', 'relief'], ctx: 'landing', weight: 9,
    when: [{ feature: 'hot_springs' }], cooldown: 25, art: art('landing', 'human'), start: 'a',
    nodes: {
      a: { speaker: { name: 'Attendant Bobbin', species: 'robot' },
        text: `A bath-house stands over the spring, wood-clad and spotless. A robot attendant bows from the door. "Welcome. Please remove your boots, your worries and your jackets in that order. The water is thirty-nine degrees and the towels are a gift of the management."`,
        choices: [
          D(`Follow every rule, in order`, 'wait', `Boots, worries, jackets. An hour later you float in a thick quiet, mind unwound, skin pruney, soul clean. Bobbin gives you a ceremonial nod.`, [{ morale: 12 }, { mood: { all: 4 } }, { codex: 'codex_land_bath_house' }]),
          K(`Ask Bobbin about the spring's chemistry`, 'science', 'science', 2, `Bobbin is overjoyed. A twenty-minute lecture on pH and sulphur follows, in lovely detail. The data is sound and gets your name in a footnote.`, [{ xp: { science: 2 } }, { credits: 20 }, { morale: 4 }], `Bobbin mixes up its sulphur and its selenium. Neither of you notices till later. The soak is still wonderful.`, [{ morale: 5 }]),
          D(`Offer to carry the towels`, 'diplomacy', `You carry towels all afternoon in a manner the attendant describes as "exquisitely hospitable". A tip of a small jar of bath salts, which the crew uses in a week.`, [{ morale: 6 }, { supplies: 1 }]),
        ] },
    },
  },
  {
    id: 'landing_springs_geyser_clock', title: 'The Geyser Clock', tags: ['wonder', 'science', 'comedy'], ctx: 'landing', weight: 8,
    when: [{ feature: 'hot_springs' }], cooldown: 30, art: art('landing', 'unknown'), start: 'a',
    nodes: {
      a: { text: `Six geysers stand in a circle, each marked with a numeral of cunningly carved stone. They erupt one by one, hour by hour, forming a clock the size of a village. The twelfth has been out of order for decades. The local wind seems to want it back.`,
        choices: [
          { label: `Unblock the twelfth geyser`, tag: 'science', check: { skill: 'engineering', diff: 3 }, pass: { text: `A blocked vent, a hand-drill, a satisfying whoomph. The twelfth erupts and the clock is whole. The crew cheers like a county fair.`, fx: [{ xp: { engineering: 3 } }, { morale: 9 }, { rep: { drifters: 2 } }], goto: 'b' }, fail: { text: `The vent chokes the drill and spits it back with a cloud of steam. You are boiled slightly pink. The twelfth remains shy.`, fx: [{ hull: -3 }, { morale: -1 }], goto: 'b' } },
          D(`Set your watch by it`, 'wait', `The clock is accurate to four seconds in a week. The chief engineer holds her watch against it with the look of a convert.`, [{ morale: 4 }], { }),
        ] },
      b: { text: `At noon, the full clock erupts together: twelve plumes rising in a ring, a column of rainbow mist. Somewhere, a bell rings that was not there before. A small shape waves from a nearby ridge: the clock's keeper, hat in hand.`,
        choices: [
          D(`Wave back and ask the hour`, 'diplomacy', `"Noon," shouts the keeper. "Always noon here. It's our favourite hour." A gift of a tin of brass geyser-gears follows, hand-delivered by a delighted child.`, [{ cargo: { machine_parts: 2 } }, { rep: { drifters: 2 } }, { codex: 'codex_land_geyser_clock' }]),
          D(`Record the eruption and leave a thank-you`, 'science', `The recording is sublime and the thank-you note says only "Well done." The keeper keeps it above the mantel.`, [{ morale: 5 }, { codex: 'codex_land_geyser_clock' }]),
        ] },
    },
  },
  {
    id: 'landing_aurora_picnic', title: 'A Picnic Beneath the Lights', tags: ['relief', 'wonder'], ctx: 'landing', weight: 9,
    when: [{ feature: 'aurora_fields' }], cooldown: 25, art: art('landing', 'human'), start: 'a',
    nodes: {
      a: { text: `The aurora is thick enough to read by. {crew:random} spreads a blanket on the frost and produces sandwiches, a flask and, improbably, a gramophone. "For the record, Captain, this is a work event. We are measuring ambient light."`,
        choices: [
          D(`Join the picnic, with notebook`, 'wait', `Sandwiches, cocoa and four pages of "ambient light" observations that describe the sky as "extremely showing off". Morale soars, as does the log.`, [{ morale: 10 }, { supplies: -1 }, { mood: { all: 3 } }, { codex: 'codex_land_aurora_picnic' }]),
          K(`Actually measure the ambient light`, 'science', 'science', 2, `Thirty-one lux of green fire. A handsome little number for the Society's Soothing Things collection, and a tidy stipend.`, [{ credits: 35 }, { xp: { science: 2 } }, { codex: 'codex_land_aurora_picnic' }], `The light meter reads "yes". The picnic, regardless, is excellent.`, [{ morale: 5 }]),
          D(`Play the gramophone loud`, 'persuade', `A scratchy waltz. The lights ripple in time. You are almost sure it's coincidence.`, [{ morale: 7 }]),
        ] },
    },
  },
  {
    id: 'landing_aurora_photographer', title: 'The Photographer Who Stayed', tags: ['wonder', 'trade', 'comedy'], ctx: 'landing', weight: 8,
    when: [{ feature: 'aurora_fields' }], cooldown: 30, art: art('landing', 'quillari'), start: 'a',
    nodes: {
      a: { speaker: { name: 'Photographer Wen Tarlow', species: 'quillari' },
        text: `A tent under the aurora, a tripod, and a Quillari in fingerless gloves who has been photographing the sky for nine winters. "Shh! The seven-oh-two ribbon is about to curl. Be a dear and hold the reflector. Breathe slowly. Beautiful."`,
        choices: [
          { label: `Hold the reflector steady`, tag: 'persuade', check: { skill: 'piloting', diff: 2 }, pass: { text: `Your hands stay still for four long minutes. The ribbon curls. The shutter clicks. Wen weeps a little and hands over a print and a bag of dried fruit.`, fx: [{ xp: { piloting: 1 } }, { cargo: { curios: 1 } }, { supplies: 2 }, { rep: { quillari: 3 } }], goto: 'b' }, fail: { text: `You sneeze at the key moment. The ribbon curls, but is blurred. Wen takes it with grace and mutters a mild Quillari oath.`, fx: [{ rep: { quillari: 1 } }], goto: 'b' } },
          D(`Buy a print from the portfolio`, 'trade', `A superb print of a ribbon like a violin's scroll. It goes in the lounge and anchors a hundred conversations.`, [{ credits: -35 }, { morale: 6 }, { rep: { quillari: 2 } }], { if: [{ credits: 35 }] }),
          D(`Watch quietly from the edge of the tent`, 'wait', `You hold your tongue. The seven-oh-two curls, and Wen smiles like sunrise.`, [{ morale: 5 }]),
        ] },
      b: { speaker: { name: 'Photographer Wen Tarlow', species: 'quillari' },
        text: `"Now, a favour," says Wen, wrapping the camera in a fleece. "Nine winters, no company but the sky. Would you carry a letter to my sister at the nearest harbour? And, if it's not too much, ask her if she remembers where I left the other tripod."`,
        choices: [
          D(`Carry the letter`, 'diplomacy', `The letter is warm in your pocket. The sister, when you find her, laughs until she cries, and returns with a hamper of preserves.`, [{ rep: { quillari: 4 } }, { supplies: 3 }, { codex: 'codex_land_aurora_photos' }]),
          D(`Offer a radio link instead`, 'science', `Wen talks to her sister for an hour over your comm. The tripod is, it transpires, in the attic. The reunion is tender.`, [{ morale: 6 }, { rep: { quillari: 3 } }, { codex: 'codex_land_aurora_photos' }]),
        ] },
    },
  },
  {
    id: 'landing_ruins_tea_house', title: 'The Tea House of the Vanished', tags: ['mystery', 'relief', 'comedy'], ctx: 'landing', weight: 9,
    when: [{ feature: 'ruins' }], cooldown: 30, art: art('ruins', 'drifter'), start: 'a',
    nodes: {
      a: { text: `Among the ruins, one building stands intact: a tea house, doors open, floor-cushions set out, a pot on a low table. A menu is chalked on a slate: "TODAY: Mild. Tomorrow: Mild. Always: Mild." The pot, when touched, is warm.`,
        choices: [
          D(`Sit and pour a cup`, 'wait', `Mild. Entirely, perfectly mild. By the second cup, the whole crew is relaxing into the cushions. The ruins feel kind.`, [{ morale: 8 }, { flag: 'tea_house_regular' }], { goto: 'b' }),
          K(`Scan the pot for a heat source`, 'science', 'engineering', 2, `A fusion-cell the size of a thimble, drawing from the ground. The ruin is a thousand years old and the tea is still warm. {crew:engineering} takes notes with open envy.`, [{ xp: { engineering: 2 } }, { flag: 'tea_house_regular' }], `The pot is warm, and the scan refuses to say why. Mystery tea. Excellent.`, [{ morale: 2 }, { flag: 'tea_house_regular' }]),
        ] },
      b: { text: `As you rise, the slate changes. A new line appears in chalk: "THANK YOU FOR SITTING. THE LAST GUESTS LEFT A SPARE KEY." The slate swings open on a hidden cupboard holding a tin of leaves and a small stack of pamphlets about the Fellowship.`,
        choices: [
          D(`Take the tin and the pamphlets`, 'diplomacy', `The tin is a Meridian tea blend you've never heard of. The pamphlets describe a Fellowship picnic in minute detail. It makes the whole voyage feel more connected.`, [{ item: { tea_tin: 1 } }, { rep: { archivists: 1 } }, { codex: 'codex_land_tea_house' }]),
          D(`Leave the tin; take only the pamphlets`, 'wait', `A respectful choice. The tin stays for the next guests. The pamphlets are read aloud in the lounge to general delight.`, [{ morale: 6 }, { codex: 'codex_land_tea_house' }]),
        ] },
    },
  },
  {
    id: 'landing_ruins_mosaic', title: 'The Floor That Is a Map', tags: ['mystery', 'science', 'wonder'], ctx: 'landing', weight: 8,
    when: [{ feature: 'ruins' }], cooldown: 30, art: art('ruins', 'archivist'), start: 'a',
    nodes: {
      a: { text: `The ruin's central hall has a floor of tiny coloured tiles forming a vast map. Rivers of blue, hills of red, a gold spiral at the centre. A single tile near your boot is missing, leaving a small, expectant square of bare plaster.`,
        choices: [
          { label: `Identify the map's region`, tag: 'science', check: { skill: 'science', diff: 3 }, pass: { text: `It's the Reach, as seen from the Gate, with the Lanterns marked in gold tile. The missing tile is where you are standing. A fine record for the survey.`, fx: [{ reveal: { radius: 4 } }, { xp: { science: 2 } }, { codex: 'codex_land_mosaic' }], goto: 'b' }, fail: { text: `The map is lovely, abstract and completely resistant. {crew:science} suspects a joke at their expense.`, fx: [{ morale: 1 }], goto: 'b' } },
          D(`Sweep the dust from the hall`, 'diplomacy', `Eight crew, twelve brooms, an hour. The map gleams. The hall, grateful, hums a chord that warms the stones.`, [{ morale: 5 }, { rep: { archivists: 1 } }], { goto: 'b' }),
        ] },
      b: { text: `Near the gold spiral, an inscription: "A tile for each who came. If the hall is ever swept, you are one of us." Beside it lies a bag of plain white tiles and a pot of glue. The missing square waits.`,
        choices: [
          D(`Add a tile marked with your ship's name`, 'diplomacy', `The tile fits with a soft click. The whole mosaic brightens by one shade. A distant bell rings once. You've joined something.`, [{ morale: 9 }, { rep: { archivists: 3, drifters: 2 } }, { codex: 'codex_land_mosaic' }]),
          D(`Take a rubbing of the map and leave the square`, 'science', `A beautiful rubbing for the Archive. The square remains for the next visitor, who will do right by it.`, [{ rep: { archivists: 2 } }, { xp: { science: 1 } }, { codex: 'codex_land_mosaic' }]),
        ] },
    },
  },
  {
    id: 'landing_ruins_old_lift', title: 'A Lift Going Down, Courteously', tags: ['mystery', 'hazard', 'comedy'], ctx: 'landing', weight: 8,
    when: [{ feature: 'ruins' }], cooldown: 30, art: art('ruins', 'archivist'), start: 'a',
    nodes: {
      a: { text: `A brass lift stands in the ruin's centre, doors open, a polite chime sounding every thirty seconds. A brass plate reads "DOWN: LIBRARY. UP: ALSO LIBRARY." There are no other buttons. The lift is, it would seem, patient.`,
        choices: [
          { label: `Step in and press DOWN`, tag: 'flee', check: { skill: 'piloting', diff: 2 }, pass: { text: `A smooth, silent descent through two hundred metres of rock, and a cool, dry reading-room with a thousand slender volumes. The lift pings. "Welcome."`, fx: [{ xp: { piloting: 1 } }, { rep: { archivists: 2 } }], goto: 'b' }, fail: { text: `The lift lurches, thinks, and sighs. It descends at a gentle crawl and opens in a dusty corridor with a stack of overdue slips. You are, apparently, a patron.`, fx: [{ days: 1 }, { rep: { archivists: 1 } }], goto: 'b' } },
          D(`Scan the shaft and send a drone first`, 'science', `The drone reports a library, intact, with a reception desk. It also reports being asked, politely, to wipe its feet. It has no feet.`, [{ xp: { science: 1 } }], { goto: 'b' }),
          D(`Decline; it's too convenient`, 'wait', `The lift chimes, sadly. As you turn away, a small paper slip emerges from a slot: "Another time."`, [{ morale: 1 }]),
        ] },
      b: { speaker: { name: 'Librarian Drone Filo', species: 'archivist' }, text: `A tiny drone floats up with a card. "Welcome, visitor. Borrowing is free; returning is traditional. You may take one volume. Choose well, or choose quickly. The shelves like a decisive reader."`,
        choices: [
          D(`Take a book of star-charts`, 'science', `A leather volume of charts so old they include a few constellations nobody has yet been born under. Reveal, perhaps, a few lanes.`, [{ reveal: { radius: 4 } }, { cargo: { star_charts: 1 } }, { codex: 'codex_land_old_lift' }]),
          D(`Take a book of poems`, 'persuade', `Slim and warm, every poem about a different kind of rain. The crew passes it round the lounge for a week.`, [{ morale: 8 }, { codex: 'codex_land_old_lift' }]),
          D(`Borrow nothing; just thank Filo`, 'diplomacy', `"Thanks is also a volume," says Filo, graciously. A sticker is placed on your jacket: GOOD VISITOR.`, [{ rep: { archivists: 3 } }, { codex: 'codex_land_old_lift' }]),
        ] },
    },
  },
  {
    id: 'landing_signal_buried_antenna', title: 'The Buried Antenna', tags: ['mystery', 'science'], ctx: 'landing', weight: 9,
    when: [{ feature: 'ancient_signal' }], cooldown: 30, art: art('landing', 'unknown'), start: 'a',
    nodes: {
      a: { text: `A hundred metres of rusted lattice rises out of the ground, bent over like a heron: an antenna, enormous, half-buried in sand. A cable runs from its base into the dark. The cable is warm, and a faint rhythm drums along it, three short and one long.`,
        choices: [
          { label: `Trace the cable to the source`, tag: 'science', check: { skill: 'engineering', diff: 3 }, pass: { text: `A buried shed, a patient generator, a small dish. The signal's a looped greeting, pinging toward a Lantern. You swap one worn fuse and the pulse strengthens.`, fx: [{ xp: { engineering: 2 } }, { flag: 'buried_antenna_heard' }, { reveal: { radius: 3 } }], goto: 'b' }, fail: { text: `The cable dips into a flooded cavity and the trace ends in mud. You get wet, surly and no further.`, fx: [{ morale: -2 }, { hull: -1 }], goto: 'b' } },
          D(`Listen at the antenna's base`, 'wait', `The pulse is almost a heartbeat. You sit with it. After a while, you catch yourself tapping along.`, [{ morale: 4 }, { flag: 'buried_antenna_heard' }], { goto: 'b' }),
        ] },
      b: { text: `The antenna's pulse quickens. A second rhythm answers from far to the south, then a third from the east. They weave, a call-and-response chain across the sky, a network of old friends passing a message hand to hand.`,
        choices: [
          D(`Add your own pulse to the chain`, 'persuade', `The hull taps three short and one long. The network stutters, then adds you, warm as a handshake. The pulse carries your hello a hundred light-years in under a second.`, [{ morale: 9 }, { rep: { archivists: 2 } }, { reveal: { radius: 5 } }, { codex: 'codex_land_buried_antenna' }]),
          D(`Record the whole chain`, 'science', `Seven hours of overlapping rhythms. It will keep {crew:science} busy for a month. They do not complain.`, [{ xp: { science: 3 } }, { codex: 'codex_land_buried_antenna' }]),
        ] },
    },
  },
  {
    id: 'landing_signal_choir', title: 'The Choir in the Cave', tags: ['wonder', 'mystery', 'diplomacy'], ctx: 'landing', weight: 8,
    when: [{ feature: 'ancient_signal' }], cooldown: 30, art: art('landing', 'vesperine'), start: 'a',
    nodes: {
      a: { text: `The signal leads into a cave where a hundred glass pipes stand in rows like an organ. Wind runs through them in a slow, shifting chord that matches the Lantern greeting. The cave is unlit, but the pipes glow faintly at each note.`,
        choices: [
          { label: `Play a pipe by blowing across it`, tag: 'persuade', check: { skill: 'diplomacy', diff: 2 }, pass: { text: `A clear note, sweet as a flute. The cave answers with a harmony. A few pipes brighten and the chord warms. You are playing an organ with the planet.`, fx: [{ morale: 9 }, { rep: { vesperine: 3 } }, { codex: 'codex_land_signal_choir' }] }, fail: { text: `Your note is a honk. The cave winces. A pipe or two goes dark in disapproval. You apologise to the dark.`, fx: [{ morale: -2 }, { rep: { vesperine: -1 } }] } },
          D(`Sit and listen as the chord resolves`, 'wait', `Twenty minutes, a single long chord that finally settles on its home note. In the silence, a pipe glows once, in thanks.`, [{ morale: 7 }, { codex: 'codex_land_signal_choir' }]),
          D(`Take a measurement of the pipe lengths`, 'science', `The lengths match a Lantern's frequencies to the micron. A Vesperine tuner would give a month's pay for the data. You consider it an even trade for a good story.`, [{ xp: { science: 2 } }, { reveal: { radius: 2 } }, { codex: 'codex_land_signal_choir' }]),
        ] },
    },
  },

  // ======================================================== PHENOMENON INVESTIGATIONS
  {
    id: 'nebula_weather_balloon', title: 'The Weather Balloon', tags: ['comedy', 'science'], ctx: 'phenomenon', weight: 9,
    when: [{ phenomenon: 'nebula' }], cooldown: 25, art: art('nebula', 'robot'), start: 'a',
    nodes: {
      a: { text: `A battered silver balloon, six metres across, drifts in the nebula with a small dish on its belly and a handwritten sign: "WEATHER STATION 9. PLEASE DO NOT POP." It transmits the nebula forecast in a steady, chipper monotone: "Mist. Followed by mist."`,
        choices: [
          D(`Dock the balloon's feed and subscribe`, 'science', `The forecasts are surprisingly accurate. For the rest of the voyage, the ship knows what the nebula is about to do. Useful, and soothing.`, [{ reveal: { radius: 3 } }, { xp: { piloting: 1 } }, { codex: 'codex_phen_nebula_balloon' }]),
          K(`Repair its dish`, 'science', 'engineering', 2, `A turn of the wrench and the signal sharpens. The balloon bobs with gratitude and transmits a thank-you in the shape of a cheerful haiku.`, [{ xp: { engineering: 2 } }, { morale: 6 }, { codex: 'codex_phen_nebula_balloon' }], `The dish snaps off. The balloon, undaunted, now forecasts only in mime. A small loss for science.`, [{ morale: -1 }]),
          D(`Leave it be; nod to a fellow professional`, 'wait', `"Mist," says the balloon, warmly. "Followed by good company." You like it more than most colleagues.`, [{ morale: 3 }]),
        ] },
    },
  },
  {
    id: 'nebula_star_nursery', title: 'The Star Nursery', tags: ['wonder', 'science'], ctx: 'phenomenon', weight: 8,
    when: [{ phenomenon: 'nebula' }], cooldown: 30, art: art('nebula', 'unknown'), start: 'a',
    nodes: {
      a: { text: `Deep in the fog, a knot of bright pinks and reds: a nursery where new stars are being born, a dozen at a time, glowing like coals in a stove. The nebula murmurs, a low sustained note. It is, astonishingly, rocking them.`,
        choices: [
          K(`Take readings of the youngest star`, 'science', 'science', 3, `A baby star, just lit, three days old. {crew:science} sits on the deck and takes notes in a very small voice. A paper, a plaque, a stipend.`, [{ credits: 60 }, { xp: { science: 3 } }, { codex: 'codex_phen_star_nursery' }], `The baby star flares and your sensors go white. You lose an hour and a decent lens cover.`, [{ credits: -20 }, { morale: 1 }]),
          D(`Dim the lights and listen to the lullaby`, 'wait', `The nebula hums on. Gus-7 hums along. The whole crew is, for a while, wonderfully hushed.`, [{ morale: 8 }, { codex: 'codex_phen_star_nursery' }]),
          D(`Tow the ship in a lazy orbit`, 'flee', `A quiet loop around the nursery, hull bathed in pink. A day of drifting wonder.`, [{ days: 1 }, { morale: 6 }, { reveal: { radius: 2 } }]),
        ] },
    },
  },
  {
    id: 'asteroids_tumbling_library', title: 'The Library That Tumbles', tags: ['mystery', 'comedy'], ctx: 'phenomenon', weight: 8,
    when: [{ phenomenon: 'asteroids' }], cooldown: 30, art: art('asteroids', 'archivist'), start: 'a',
    nodes: {
      a: { text: `A hollowed-out asteroid slowly turns, doors wide, shelves visible within. It is a library, or was. Books drift in lazy orbit around the stacks. A recorded voice repeats, every ten seconds: "Overdue notices are not a threat. They are a hope."`,
        choices: [
          K(`Match its spin and board`, 'flee', 'piloting', 3, `A deft match, a clean airlock, and the quiet inside is deep. A Reading Room, a few thousand books and a mild sense of being observed by a cheerful clerk-bot.`, [{ xp: { piloting: 2 } }, { rep: { archivists: 2 } }], `The asteroid's spin catches you wrong. The shuttle bounces off the doorframe. The library chimes a polite "Please mind the door."`, [{ hull: -4 }, { morale: -1 }]),
          D(`Grab a drifting volume with the arm`, 'science', `A beautifully bound atlas of rain. It enters the log under "Miscellaneous". The lounge begins a quiet campaign for its permanent loan.`, [{ cargo: { vellum_sheets: 1 } }, { morale: 4 }, { codex: 'codex_phen_tumbling_library' }]),
          D(`Radio the nearest Archive station about its location`, 'diplomacy', `A flurry of delighted chimes returns. The Archive will send a retrieval crew and a thank-you card within the week.`, [{ rep: { archivists: 4 } }, { credits: 40 }, { codex: 'codex_phen_tumbling_library' }]),
        ] },
    },
  },
  {
    id: 'asteroids_rock_garden', title: 'A Garden of Floating Stones', tags: ['wonder', 'comedy'], ctx: 'phenomenon', weight: 8,
    when: [{ phenomenon: 'asteroids' }], cooldown: 30, art: art('asteroids', 'drifter'), start: 'a',
    nodes: {
      a: { text: `Somebody has arranged forty asteroids in a spiral, balanced with tethers and tiny thrusters, a raked pattern of fine dust between them. A small hut sits at the centre. Smoke rises. A hand-lettered sign reads "PLEASE BE QUIET. THE ROCKS ARE THINKING."`,
        choices: [
          D(`Float in silence for an hour`, 'wait', `The rocks think. You think. Nobody says anything. Somebody says "ah." It's the nicest hour of the month.`, [{ morale: 9 }, { codex: 'codex_phen_rock_garden' }]),
          K(`Ask the gardener about the pattern`, 'persuade', 'diplomacy', 2, `The gardener (a retired miner named Pim) lectures for forty minutes on "negative space" and gives you a rake. You rake a small patch of dust. It's meditative.`, [{ morale: 6 }, { rep: { drifters: 3 } }, { cargo: { curios: 1 } }, { codex: 'codex_phen_rock_garden' }], `You laugh too loudly at a koan. The rocks tremble. Pim sighs and offers a cup of tea in lieu of a lecture.`, [{ morale: 2 }, { supplies: 1 }]),
          D(`Quietly leave a stone of your own`, 'diplomacy', `A small pebble from the Halcyon's hull plate, placed on the spiral's edge. The spiral rearranges itself, ever so gently, to include it.`, [{ morale: 5 }, { rep: { drifters: 2 } }]),
        ] },
    },
  },
  {
    id: 'comet_postbox', title: 'The Postbox on the Comet', tags: ['wonder', 'comedy', 'trade'], ctx: 'phenomenon', weight: 8,
    when: [{ phenomenon: 'comet' }], cooldown: 30, art: art('comet', 'quillari'), start: 'a',
    nodes: {
      a: { text: `A red postbox is bolted to the comet's nucleus. A hand-painted sign reads "NEXT COLLECTION: WHEN THE COMET RETURNS (74 YEARS)". A small stack of letters waits inside, tied with string. It would be the work of a moment to take them somewhere useful.`,
        choices: [
          D(`Take the letters and post them at the next harbour`, 'diplomacy', `Seventeen letters. The first recipient cries. The last is a cheque. Quillari postmasters gift you a stamp album and a free week of moorage.`, [{ rep: { quillari: 5 } }, { credits: 40 }, { morale: 6 }, { codex: 'codex_phen_comet_postbox' }]),
          D(`Post a letter of your own for the next collection`, 'wait', `A note: "Hello from the Halcyon. We were here." Seventy-four years later, somebody will be glad.`, [{ morale: 7 }, { codex: 'codex_phen_comet_postbox' }]),
          K(`Inspect the postbox's power and mechanism`, 'science', 'engineering', 2, `A tidy little thermoelectric wonder, still working. {crew:engineering} salvages a coil, with apology. The postbox does not seem to mind.`, [{ cargo: { machine_parts: 1 } }, { xp: { engineering: 2 } }], `The postbox bites. A spring slaps your thumb. The comet seems to chuckle.`, [{ morale: -1 }]),
        ] },
    },
  },
  {
    id: 'aurora_tuning_duet', title: 'A Duet in the Ribbons', tags: ['wonder', 'diplomacy'], ctx: 'phenomenon', weight: 8,
    when: [{ phenomenon: 'aurora' }], cooldown: 30, art: art('aurora', 'vesperine'), start: 'a',
    nodes: {
      a: { speaker: { name: 'Chorister Ebb-of-the-Second-Verse', species: 'vesperine' },
        text: `*A chord:* "Ship Halcyon. The ribbons here are learning a new song and need a second voice. Our own is not quite their register. Might you, with your delightful machine voices, take a part?"`,
        choices: [
          K(`Sing the second part (comms hum)`, 'persuade', 'diplomacy', 3, `A thin, careful harmony. The ribbons take it, braid it into their own, and for three minutes the sky sings back in two parts. Ebb weeps in crystal.`, [{ rep: { vesperine: 5 } }, { morale: 10 }, { codex: 'codex_phen_aurora_duet' }], `Your hum is a half-tone off. The ribbons wince and politely ask for a different instrument. Ebb is kind.`, [{ rep: { vesperine: 1 } }, { morale: 1 }]),
          D(`Play the pulsar tape as the second voice`, 'trade', `The tape's heartbeat underpins the aurora's melody. Ebb says it's exactly the missing register. The sky answers with a flare.`, [{ rep: { vesperine: 6 } }, { morale: 12 }, { codex: 'codex_phen_aurora_duet' }], { if: [{ item: 'pulsar_tape' }] }),
          D(`Apologise; you can't hold a note`, 'wait', `"Then listen," says Ebb. And so you do, and the quiet is its own kind of part.`, [{ morale: 5 }]),
        ] },
    },
  },
  {
    id: 'derelict_greenhouse', title: 'The Greenhouse That Kept Going', tags: ['relief', 'mystery', 'wonder'], ctx: 'phenomenon', weight: 9,
    when: [{ phenomenon: 'derelict' }], cooldown: 30, art: art('derelict', 'human'), start: 'a',
    nodes: {
      a: { text: `A wrecked freighter's hull is cracked open and inside, lit by a single grow-lamp, a greenhouse flourishes: tomatoes, beans, a pot of marigolds, a watering-can drone limping from pot to pot. The ship has been dead for thirty years. The garden is in excellent shape.`,
        choices: [
          D(`Offer to help the drone water the plants`, 'diplomacy', `The drone shyly gives you the can. You water every pot, by hand, one by one. It makes a happy trill. The marigolds nod.`, [{ morale: 6 }, { flag: 'greenhouse_tended' }], { goto: 'b' }),
          K(`Fix the failing grow-lamp`, 'science', 'engineering', 3, `Twelve minutes with a spanner and a screw of tape. The lamp brightens, the plants gasp, and the drone does a small pirouette.`, [{ xp: { engineering: 2 } }, { flag: 'greenhouse_tended' }], `The lamp flickers and dies. The drone looks at you. You hand it a spare bulb, ashamed. It's not a match.`, [{ morale: -2 }], { goto: 'b' }),
        ] },
      b: { text: `The drone leads you to a chest of seed packets, each labelled in the same neat hand: Tomato, Bean, Marigold. A note: "FOR WHOEVER CARES FOR THEM." The drone looks at you, then at the chest, then at you again, and tucks the packets carefully into your arms.`,
        choices: [
          D(`Take the seeds, and promise to plant them`, 'diplomacy', `The seeds go in the ship's garden. Within a fortnight there are tomatoes on the bridge, and the drone's voice, recorded, sings from the speaker in their honour.`, [{ cargo: { seed_vault_crates: 1 } }, { supplies: 3 }, { morale: 8 }, { codex: 'codex_phen_greenhouse' }]),
          D(`Take the drone too`, 'trade', `The drone beeps with astonishment, then consents. It is installed in the lounge window with a tiny can. The ship's plants have never been so happy.`, [{ supplies: 2 }, { morale: 10 }, { mood: { all: 3 } }, { codex: 'codex_phen_greenhouse' }]),
        ] },
    },
  },
  {
    id: 'wormhole_toll_booth', title: 'The Toll Booth at the Throat', tags: ['comedy', 'trade', 'persuade'], ctx: 'phenomenon', weight: 8,
    when: [{ phenomenon: 'wormhole' }], cooldown: 30, art: art('wormhole', 'robot'), start: 'a',
    nodes: {
      a: { speaker: { name: 'Toll-Bot 4', species: 'robot' },
        text: `A small automated booth floats at the mouth of the wormhole with a striped barrier and a sign: "WORMHOLE TOLL: 5 SCRIP OR A GOOD STORY." The bot is wearing a tiny cap. It has the weary dignity of a civil servant at the end of a long shift.`,
        choices: [
          D(`Pay the five scrip`, 'trade', `The barrier lifts. "Safe travels," says the bot, in the same tone it uses to everyone. A receipt prints. You file it under "Hope."`, [{ credits: -5 }, { codex: 'codex_phen_toll_booth' }], { if: [{ credits: 5 }] }),
          K(`Tell a good story`, 'persuade', 'diplomacy', 3, `You tell the one about the crater letters. The bot has a moment, then a minute. The barrier lifts, a free pass is stamped, and a small paper cap drops into your hand.`, [{ morale: 5 }, { rep: { concord: 1 } }, { codex: 'codex_phen_toll_booth' }], `Your story rambles. The bot patiently notes "Insufficient". You pay the five scrip, a little humbled.`, [{ credits: -5 }]),
          D(`Quietly point out that it's a natural phenomenon`, 'science', `The bot freezes. "I... hadn't considered that." A long whirr. The barrier lifts. You feel a small pang of guilt and a larger one of curiosity.`, [{ xp: { science: 1 } }, { morale: -1 }]),
        ] },
    },
  },

  // ======================================================== SOCIETY STIPEND TELEGRAMS (ctx 'arrive', once per region)
  {
    id: 'telegram_stipend_shoals', title: 'Telegram from Mission Control', tags: ['comedy', 'relief'], ctx: 'arrive', weight: 40,
    when: [{ system: { region: 'shoals' } }], once: true, art: art('bridge', 'human'), start: 'a',
    nodes: {
      a: { speaker: { name: 'Mission Control, Meridian Society', species: 'human' },
        text: `The teletype clatters. "TO ISV HALCYON STOP CHARTS OF THE SHOALS RECEIVED STOP VERY NEAT STOP SOCIETY HAS APPROVED A STIPEND OF ONE PURSE PER REGION CHARTED STOP PLEASE DO NOT SPEND ALL ON TEA STOP SIGNED, THE TREASURER STOP"`,
        choices: [
          D(`Reply: "Tea is not the problem. Biscuits are."`, 'persuade', `A second telegram, three minutes later: "BISCUITS APPROVED STOP BUDGET LINE ADDED." The Treasurer is, evidently, a human.`, [{ credits: 120 }, { morale: 5 }, { flag: 'stipend_shoals' }, { codex: 'codex_stipend_telegrams' }]),
          D(`Reply formally with thanks`, 'diplomacy', `A formal acknowledgement, a hearty stamp, and a purse of scrip delivered by relay. The crew toasts the Society.`, [{ credits: 120 }, { rep: { concord: 1 } }, { flag: 'stipend_shoals' }, { codex: 'codex_stipend_telegrams' }]),
          D(`Read it twice and save it for the album`, 'wait', `The telegram goes in the lounge album. The stipend arrives with the next relay.`, [{ credits: 120 }, { morale: 3 }, { flag: 'stipend_shoals' }]),
        ] },
    },
  },
  {
    id: 'telegram_stipend_choir', title: 'Telegram: The Choir Chart Pays', tags: ['comedy', 'relief'], ctx: 'arrive', weight: 40,
    when: [{ system: { region: 'choir' } }], once: true, art: art('bridge', 'human'), start: 'a',
    nodes: {
      a: { speaker: { name: 'Mission Control, Meridian Society', species: 'human' },
        text: `"TO ISV HALCYON STOP FIRST CHARTS OF THE CHOIR RECEIVED STOP THE VESPERINE AMBASSADOR HAS SENT A THANK-YOU IN FOUR PART HARMONY WHICH WE HAVE STOPPED PLAYING IN THE CANTEEN STOP STIPEND ENCLOSED STOP PLEASE HUM RESPONSIBLY STOP"`,
        choices: [
          D(`Hum a reply down the line`, 'persuade', `The reply is faint, sweet and four-part. Mission Control's operators stop what they are doing for a full minute.`, [{ credits: 150 }, { morale: 6 }, { rep: { vesperine: 2 } }, { flag: 'stipend_choir' }, { codex: 'codex_stipend_telegrams' }]),
          D(`Send a formal "message received"`, 'diplomacy', `Efficient, courteous, slightly dull. The stipend arrives anyway, with a note that says "Do hum, though."`, [{ credits: 150 }, { flag: 'stipend_choir' }, { codex: 'codex_stipend_telegrams' }]),
          D(`Ask Mission Control to send the recording`, 'science', `A tape arrives with the next relay: forty minutes of Vesperine thanks. The lounge is thoroughly changed by it.`, [{ credits: 150 }, { morale: 8 }, { flag: 'stipend_choir' }]),
        ] },
    },
  },
  {
    id: 'telegram_stipend_rim', title: 'Telegram: A Long Way From Home', tags: ['relief', 'wonder'], ctx: 'arrive', weight: 40,
    when: [{ system: { region: 'rim' } }], once: true, art: art('bridge', 'human'), start: 'a',
    nodes: {
      a: { speaker: { name: 'Mission Control, Meridian Society', species: 'human' },
        text: `"TO ISV HALCYON STOP YOU HAVE CHARTED FARTHER THAN ANY MERIDIAN SHIP BEFORE STOP THE BOARD HAS CRIED A LITTLE STOP STIPEND DOUBLED STOP KEEP SAFE STOP KEEP WARM STOP KEEP GOING STOP THERE IS CAKE WHEN YOU GET BACK STOP"`,
        choices: [
          D(`Reply: "What kind of cake?"`, 'persuade', `A reply, within the hour: "LEMON. NO ARGUMENT." The crew adopts it as a motto. The stipend lands with a purse and a drawing of the cake.`, [{ credits: 220 }, { morale: 10 }, { flag: 'stipend_rim' }, { codex: 'codex_stipend_telegrams' }]),
          D(`Reply: "Understood. We'll go carefully."`, 'diplomacy', `The line crackles. "THAT IS ALL WE ASK STOP." The stipend and a warm hand-signed card arrive by relay.`, [{ credits: 220 }, { rep: { concord: 2 } }, { morale: 6 }, { flag: 'stipend_rim' }, { codex: 'codex_stipend_telegrams' }]),
          D(`Pin it to the bridge wall without answering`, 'wait', `Sometimes the right reply is a quiet corner of the wall. The stipend goes into the strongbox.`, [{ credits: 220 }, { morale: 7 }, { flag: 'stipend_rim' }]),
        ] },
    },
  },
];
