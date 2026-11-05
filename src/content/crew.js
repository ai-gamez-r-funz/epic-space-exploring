// Halcyon Reach — CREW (WORLD-A). Pure data, node-runnable.
//
// Exports:
//   TRAITS      { [traitId]: { id, name, desc, effect, mods? } }
//                 effect: short human-readable rule text (UI tooltip).
//                 mods (optional, engine MAY sum these over crew): uses ONLY ship bonus keys —
//                   moraleRegen, repairPerDay, priceSell, buyDiscount, skills:{...}.
//   CREW_START  4 starting officer templates. Template ids are fixed (events use {crew:'id'}):
//                 chief_engineer, science_officer, medic, comms_officer
//   CREW_POOL   hireable templates (>= 16). Each:
//                 { id, name, species, role:skillId, skills:{science,engineering,medicine,diplomacy,piloting: 0..5},
//                   trait:traitId, bio, hireCost, minRep?:{faction,n}, portraitSeed, quote? }
//   CREW_TEMPLATES / CREW_BY_ID  lookup of every template (start + pool)
//   makeCrew(template, idSuffix?) -> a state.crew entry
//                 { id, name, role, species, skills, trait, mood:70, level:1, xp:0, bio, portrait:{species,seed} }
//
// `role` is the crew member's SPECIALTY skill id. The ship's skillTotal(skill) uses the best crew + upgrades.

export const TRAITS = {
  tea_evangelist: {
    id: 'tea_evangelist', name: 'Tea Evangelist',
    desc: 'Believes every problem is smaller after a cup of something hot.',
    effect: '+0.2 morale per day while aboard.',
    mods: { moraleRegen: 0.2 },
  },
  reluctant_hero: {
    id: 'reluctant_hero', name: 'Reluctant Hero',
    desc: 'Complains loudly, then does the brave thing anyway.',
    effect: 'Flee and daring piloting checks +1 effective skill when the ship is in trouble.',
  },
  unflappable: {
    id: 'unflappable', name: 'Unflappable',
    desc: 'Has seen a nebula collapse. Is not impressed by your emergency.',
    effect: 'Mood never drops below 30 from bad events.',
  },
  poet_of_the_engine_room: {
    id: 'poet_of_the_engine_room', name: 'Poet of the Engine Room',
    desc: 'Writes verse to the pistons. The pistons respond.',
    effect: '+0.3 hull repaired per day.',
    mods: { repairPerDay: 0.3 },
  },
  born_haggler: {
    id: 'born_haggler', name: 'Born Haggler',
    desc: 'Has never paid the first price in their life.',
    effect: '3% better prices when buying and selling.',
    mods: { buyDiscount: 0.03, priceSell: 0.03 },
  },
  compulsive_cataloguer: {
    id: 'compulsive_cataloguer', name: 'Compulsive Cataloguer',
    desc: 'Labels everything, including the labels.',
    effect: 'Scans give +1 science XP.',
  },
  midnight_baker: {
    id: 'midnight_baker', name: 'Midnight Baker',
    desc: 'The ship smells of warm bread at 0300 and nobody questions it.',
    effect: '+0.3 morale per day while aboard.',
    mods: { moraleRegen: 0.3 },
  },
  perfectionist: {
    id: 'perfectionist', name: 'Perfectionist',
    desc: 'Will not call it done until it is done well.',
    effect: 'Their specialty checks +5 points of odds; mood falls faster when rushed.',
  },
  wanderer: {
    id: 'wanderer', name: 'Wanderer',
    desc: 'Cannot stay in port more than three days without getting itchy.',
    effect: 'Mood rises on long jumps, falls when docked a long time.',
  },
  gossip: {
    id: 'gossip', name: 'Station Gossip',
    desc: 'Knows who is feuding with whom, and why, and how it ends.',
    effect: 'Hails reveal a rumour; +2% sell prices.',
    mods: { priceSell: 0.02 },
  },
  bluntly_literal: {
    id: 'bluntly_literal', name: 'Bluntly Literal',
    desc: 'Answers exactly the question asked. Always.',
    effect: 'Archivist diplomacy checks +1 effective skill; sometimes accidentally rude.',
  },
  optimist: {
    id: 'optimist', name: 'Incurable Optimist',
    desc: 'Insists the rain is "just the sky doing its laundry".',
    effect: '+0.2 morale per day while aboard.',
    mods: { moraleRegen: 0.2 },
  },
  former_clerk: {
    id: 'former_clerk', name: 'Former Clerk',
    desc: 'Once filed a form to request a form. Has fond memories.',
    effect: 'Concord rep gains +1 when positive.',
  },
  stargazer: {
    id: 'stargazer', name: 'Stargazer',
    desc: 'Sleeps in the observatory. Wakes up to admire it.',
    effect: 'Wonder events grant +3 morale.',
  },
  steady_hands: {
    id: 'steady_hands', name: 'Steady Hands',
    desc: 'Could thread a needle in a dust storm.',
    effect: '+5 points of odds on medicine and engineering repairs.',
  },
  lucky: {
    id: 'lucky', name: 'Wildly Lucky',
    desc: 'Coins fall on edge. Locks fall open. Nobody can explain it.',
    effect: 'Once per game, a failed check is rerolled.',
  },
  serene: {
    id: 'serene', name: 'Serene',
    desc: 'Speaks in even tones. Has never been seen to hurry.',
    effect: 'Vesperine rep gains +1 when positive; calms crew nearby.',
  },
  resonant: {
    id: 'resonant', name: 'Resonant',
    desc: 'Hums, constantly and in tune. The crew finds it soothing.',
    effect: '+0.2 morale per day aboard; Vesperine hails go smoothly.',
    mods: { moraleRegen: 0.2 },
  },
};

// ------------------------------------------------------------------ helpers
const S = (science = 0, engineering = 0, medicine = 0, diplomacy = 0, piloting = 0) => ({
  science, engineering, medicine, diplomacy, piloting,
});

// ------------------------------------------------------------------ starting officers
export const CREW_START = [
  {
    id: 'chief_engineer', name: 'Adaeze Okonkwo', species: 'human', role: 'engineering',
    skills: S(1, 4, 0, 0, 1), trait: 'poet_of_the_engine_room', hireCost: 0, portraitSeed: 101,
    bio: 'Chief Engineer of the Halcyon and its fiercest defender. She has named every valve, and she will tell you which ones are sulking.',
    quote: '"She is not noisy. She is expressive."',
  },
  {
    id: 'science_officer', name: 'Ilse Vo', species: 'human', role: 'science',
    skills: S(4, 1, 1, 0, 0), trait: 'compulsive_cataloguer', hireCost: 0, portraitSeed: 102,
    bio: 'Science Officer, Slide-rule Guild member in good standing, and a compulsive labeller. Her sample drawers have sample drawers.',
    quote: '"Fascinating. Hold still while I classify you."',
  },
  {
    id: 'medic', name: 'Dr. Marguerite Pemberton-Okafor', species: 'human', role: 'medicine',
    skills: S(1, 0, 4, 1, 0), trait: 'unflappable', hireCost: 0, portraitSeed: 103,
    bio: 'Ship\'s surgeon, tea-drinker, and keeper of the good biscuits. Has delivered a baby, a toast, and a very difficult diagnosis in the same afternoon.',
    quote: '"Sit down. Drink this. Now tell me what hurts."',
  },
  {
    id: 'comms_officer', name: 'Lt. Odalys Brandt', species: 'human', role: 'diplomacy',
    skills: S(0, 1, 0, 4, 1), trait: 'optimist', hireCost: 0, portraitSeed: 104,
    bio: 'Communications Officer and translator-at-large. Speaks eleven languages and whistles in three more, to be safe.',
    quote: '"I am quite sure they meant that as a compliment."',
  },
];

// ------------------------------------------------------------------ hireable officers & specialists
export const CREW_POOL = [
  {
    id: 'ensign_fennimore', name: 'Ensign Pip Fennimore', species: 'human', role: 'piloting',
    skills: S(0, 1, 0, 1, 3), trait: 'reluctant_hero', hireCost: 90, portraitSeed: 201,
    bio: 'Fresh from the Meridian flight academy and convinced they are not ready for anything. They are, repeatedly.',
    quote: '"I would rather not. But fine. Hold on."',
  },
  {
    id: 'tessk_haggler', name: 'Brisk-of-Vell Tessk', species: 'quillari', role: 'diplomacy',
    skills: S(0, 0, 0, 3, 1), trait: 'born_haggler', hireCost: 150, portraitSeed: 202,
    minRep: { faction: 'quillari', n: 10 },
    bio: 'A Clan Vell-Aroon cadet exiled for "excessive honesty in a pricing context". Will haggle for the ship\'s paint and win.',
    quote: '"Your first price was an opening gambit. Let us proceed to my second."',
  },
  {
    id: 'aloe_hums', name: 'Aloe-Who-Hums', species: 'vesperine', role: 'science',
    skills: S(4, 0, 1, 2, 0), trait: 'resonant', hireCost: 260, portraitSeed: 203,
    minRep: { faction: 'vesperine', n: 15 },
    bio: 'A young crystalline listener who maps stars by their harmonics. Hums when happy, which is nearly always.',
    quote: '[a warm fifth] "...The nebula is humming in D."',
  },
  {
    id: 'cataloguer_1717', name: 'Cataloguer Seventeen-Seventeen', species: 'archivist', role: 'science',
    skills: S(4, 1, 0, 1, 0), trait: 'bluntly_literal', hireCost: 300, portraitSeed: 204,
    minRep: { faction: 'archivists', n: 15 },
    bio: 'An Archive librarian on extended field loan. Wants to log "everything that has a surface" and apologises in advance.',
    quote: '"THIS SHIP IS CATALOGUED. YOUR SANDWICH IS NOT, BUT IT IS INTERESTING."',
  },
  {
    id: 'mama_dara', name: 'Mama Jo-Dara', species: 'drifter', role: 'engineering',
    skills: S(0, 4, 1, 1, 0), trait: 'poet_of_the_engine_room', hireCost: 180, portraitSeed: 205,
    minRep: { faction: 'drifters', n: 10 },
    bio: 'Grandmother, welder, and keeper of three habitat boilers. Fixes things the way other people knit.',
    quote: '"Hand me that spanner, love. The one that looks like a fish."',
  },
  {
    id: 'teacup_3', name: 'Teacup-3', species: 'robot', role: 'engineering',
    skills: S(1, 2, 1, 1, 0), trait: 'tea_evangelist', hireCost: 110, portraitSeed: 206,
    bio: 'A maintenance bot with a samovar built into its torso. Repairs things quietly and then offers you a cup.',
    quote: '"Beep. Shall I put the kettle on?"',
  },
  {
    id: 'dr_hamid', name: 'Dr. Hamid Rashidov', species: 'human', role: 'medicine',
    skills: S(1, 0, 4, 1, 0), trait: 'steady_hands', hireCost: 280, portraitSeed: 207,
    bio: 'A frontier surgeon who has stitched everything from Quillari wings to Drifter hulls. Insists on silence, then hums while working.',
    quote: '"Hold still. This will be extremely boring, which is the best kind of surgery."',
  },
  {
    id: 'cmdr_gale', name: 'Commander Winnifred Gale (ret.)', species: 'human', role: 'piloting',
    skills: S(1, 1, 0, 1, 5), trait: 'wanderer', hireCost: 400, portraitSeed: 208,
    minRep: { faction: 'concord', n: 30 },
    bio: 'A retired Concord test pilot who flew the first Gate transit and has not stopped talking about it since. Terrible at paperwork, wonderful at everything else.',
    quote: '"Nothing is impossible with enough velocity and a very good sense of timing."',
  },
  {
    id: 'clerk_quince', name: 'Barnaby Quince', species: 'human', role: 'diplomacy',
    skills: S(0, 0, 0, 2, 0), trait: 'former_clerk', hireCost: 70, portraitSeed: 209,
    bio: 'A junior clerk who escaped the Ministry of Small Mercies after six years in the Stamping Pool. Can notarise a sandwich.',
    quote: '"Technically, that would require Form 12, but I could improvise."',
  },
  {
    id: 'orrin_whistle', name: 'Orrin Whistle-Reed', species: 'quillari', role: 'piloting',
    skills: S(0, 1, 0, 2, 3), trait: 'gossip', hireCost: 130, portraitSeed: 210,
    minRep: { faction: 'quillari', n: 5 },
    bio: 'A freight-clan pilot who has flown every shoal route and gossiped about each. Narrates your jumps like a sports commentator.',
    quote: '"And here we come around the Marigold Spur, folks, with a little bit of wind shear."',
  },
  {
    id: 'sable_ito', name: 'Sable Ito-Nakamura', species: 'human', role: 'science',
    skills: S(3, 1, 0, 1, 1), trait: 'stargazer', hireCost: 160, portraitSeed: 211,
    bio: 'An amateur astronomer who sold her telescope to book passage and then realised she could look through the ship\'s instead.',
    quote: '"It is not just a star. It is *that* star. Look at the colour."',
  },
  {
    id: 'fennick_weaver', name: 'Fennick the Weaver', species: 'drifter', role: 'medicine',
    skills: S(0, 1, 3, 2, 0), trait: 'steady_hands', hireCost: 140, portraitSeed: 212,
    minRep: { faction: 'drifters', n: 5 },
    bio: 'A habitat healer who mixes folk tinctures and mends with needle, thread and a surprising amount of tact.',
    quote: '"Drink. Sleep. Come back when you\'re ready to tell me the real story."',
  },
  {
    id: 'merrin_two', name: 'Chorus-of-Two Merrin', species: 'vesperine', role: 'diplomacy',
    skills: S(1, 0, 0, 5, 0), trait: 'serene', hireCost: 380, portraitSeed: 213,
    minRep: { faction: 'vesperine', n: 30 },
    bio: 'A paired voice, two crystalline bodies singing one thought. The most gifted translator in the Veil and very sorry about the noise you make.',
    quote: '[a sustained, calming third] "...Let us begin with the silence."',
  },
  {
    id: 'verity_archivist', name: 'Verity (Interpretive Division)', species: 'archivist', role: 'diplomacy',
    skills: S(2, 0, 0, 3, 0), trait: 'bluntly_literal', hireCost: 200, portraitSeed: 214,
    minRep: { faction: 'archivists', n: 10 },
    bio: 'An Archive diplomat who has memorised every treaty ever signed, though not always what they meant. Politely candid to a fault.',
    quote: '"YOUR NEGOTIATING POSITION IS WEAK. HOWEVER, YOUR TEA IS EXCELLENT. THEREFORE: OPTIMISM."',
  },
  {
    id: 'dolores_pike', name: 'Mrs. Dolores Abernathy-Pike', species: 'human', role: 'medicine',
    skills: S(0, 0, 2, 2, 0), trait: 'midnight_baker', hireCost: 110, portraitSeed: 215,
    bio: 'A retired ship\'s cook who found retirement unbearable. Her scones have prevented three mutinies.',
    quote: '"Eat first. We\'ll discuss the catastrophe afterwards."',
  },
  {
    id: 'rook_calloway', name: 'Rook Calloway', species: 'drifter', role: 'piloting',
    skills: S(0, 2, 0, 0, 4), trait: 'lucky', hireCost: 220, portraitSeed: 216,
    minRep: { faction: 'drifters', n: 20 },
    bio: 'A fleet-runner who has threaded the Thirteen Aprils through gaps no one else would try. Claims it is "mostly luck", and appears to mean it.',
    quote: '"Good news: there is a gap. Bad news: it is very small."',
  },
  {
    id: 'prof_ashgrove', name: 'Professor Lucinda Ashgrove', species: 'human', role: 'science',
    skills: S(5, 1, 0, 0, 0), trait: 'perfectionist', hireCost: 400, portraitSeed: 217,
    minRep: { faction: 'concord', n: 20 },
    bio: 'A renowned xenologist from the Concord Academy, famous for her 600-page footnotes. Will not leave a sample half-measured.',
    quote: '"One decimal point is not data. It is an anecdote with ambition."',
  },
  {
    id: 'gantry_9', name: 'Gantry-9', species: 'robot', role: 'engineering',
    skills: S(1, 4, 0, 0, 1), trait: 'unflappable', hireCost: 240, portraitSeed: 218,
    bio: 'A heavy-duty maintenance unit retired from a Gate construction crew. Slow to speak, quick with a torque wrench.',
    quote: '"Understood. The wall will remain a wall."',
  },
  {
    id: 'idris_wren', name: 'Idris Wren-Tolliver', species: 'human', role: 'engineering',
    skills: S(1, 2, 2, 1, 1), trait: 'optimist', hireCost: 100, portraitSeed: 219,
    bio: 'A cheerful generalist who has worked as a plumber, a nurse, and a fireworks consultant. Never fully qualified; never fully unqualified.',
    quote: '"How hard can it be? Rhetorical. Please do not answer."',
  },
  {
    id: 'marigold_teague', name: 'Marigold Teague', species: 'human', role: 'diplomacy',
    skills: S(0, 0, 1, 4, 1), trait: 'tea_evangelist', hireCost: 210, portraitSeed: 220,
    bio: 'A tea-ceremony mistress turned freelance mediator. Has talked three feuding clans into a single pot of Earl Grey.',
    quote: '"Sit. Sip. The treaty will keep for ten minutes."',
  },
  {
    id: 'lamplighter_oss', name: 'Oss the Lamplighter', species: 'drifter', role: 'science',
    skills: S(3, 2, 0, 1, 0), trait: 'stargazer', hireCost: 200, portraitSeed: 221,
    minRep: { faction: 'drifters', n: 15 },
    bio: 'A Drifter fleet-lamplighter who knows the old signal-lights by heart. Believes the Lanterns were lit on purpose, and politely, too.',
    quote: '"A lamp is only a question with a flame in it."',
  },
];

export const CREW_TEMPLATES = [...CREW_START, ...CREW_POOL];
export const CREW_BY_ID = Object.fromEntries(CREW_TEMPLATES.map((c) => [c.id, c]));

/** Build a state.crew entry from a template. */
export function makeCrew(t, idSuffix = '') {
  return {
    id: t.id + idSuffix,
    name: t.name,
    role: t.role,
    species: t.species,
    skills: { ...t.skills },
    trait: t.trait,
    mood: 70,
    level: 1,
    xp: 0,
    bio: t.bio,
    portrait: { species: t.species, seed: t.portraitSeed },
  };
}
