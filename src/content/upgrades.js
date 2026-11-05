// Halcyon Reach — SHIP UPGRADES (WORLD-A). Pure data, node-runnable.
//
// The ISV Halcyon has SLOT_COUNT = 8 slots, one per slot kind:
//   engine, sensors, hull, cargo, comms, lab, lounge, special.
// Installing an upgrade REPLACES whatever is in that slot (sell-back 50% of the old one's cost is the
// engine's call). Each slot offers several branches (chains tier 1 -> 2 -> 3) so players choose a style.
//
// Fields: { id, name, slot, tier:1..3, cost, requires:[upgradeId], repGate?:{faction,min},
//           reward?:true (cost 0; granted only by missions/events via {upgrade:id}),
//           build:'explorer'|'trader'|'diplomat'|'caretaker'|'daredevil'|'general' (UI hint only),
//           desc, flavor, bonus:{...}, special?:'id' }
// `requires` = an upgrade id that must currently be INSTALLED (i.e. you are upgrading that exact item in place).
// Rep-gated and reward-only items have requires:[] and may be bought/received directly at any tier.
//
// ---------------------------------------------------------------------------------------------------
// BONUS KEYS (the ENGINE supports exactly these; everything is additive across installed upgrades except
// `efficiency`, which multiplies):
//
//   fuelMax        +n absolute fuel tank capacity
//   suppliesMax    +n absolute supplies capacity
//   hullMax        +n absolute hull points
//   cargoMax       +n absolute cargo slots (a good with bulk 2 uses 2)
//   scanRange      +fraction of base sensor radius        (0.15 = +15%)
//   jumpRange      +fraction of base max lane length/range (0.10 = +10%)
//   efficiency     multiplier on fuel cost per jump        (0.92 = 8% cheaper; 1.05 = 5% thirstier)
//   skills         { science|engineering|medicine|diplomacy|piloting : +n }  added to skillTotal()
//   moraleRegen    +n morale per day (while travelling/resting/docked)
//   repairPerDay   +n hull per day passed (any activity)
//   priceSell      +fraction on prices when SELLING goods   (0.05 = +5%)
//   buyDiscount    fraction knocked off prices when BUYING goods and docked services (0.05 = -5%)
//   (slots? is NOT used.)
//
// SPECIAL IDS (slot 'special' unless noted; engine implements by id; see SPECIALS table below for text):
//   tea_service        resting & docked days restore +50% morale; crew mood +1 after each rest
//   slide_rule_array   +5 percentage points odds on science and engineering checks
//   translator_parrot  diplomacy checks vs Vesperine/Archivist/unknown species: +1 effective skill; hails never "fail"
//   solar_sails        arriving at a white/blue/binary/yellow star refunds 1 fuel (blue/white: 2)
//   cargo_net          1 in 2 chance that an effect which would lose cargo is cancelled; +2 cargoMax listed in bonus
//   observation_dome   events tagged 'wonder' grant +4 extra morale and +15 scrip bonus; +0.3 moraleRegen listed in bonus
//   emergency_beacon   emergency tow costs 50% less (credits and rep)
//   cartographers_table charting a system pays a 25 scrip Meridian bounty
//   diplomatic_pouch   positive rep gains are +25% (rounded up, min +1 when any gain)
//   barrel_roll_gyro   'flee' tagged piloting checks +10 points odds; travel hazard hull damage -25%
//   bulk_contracts     refuel, repair and restock cost 15% less (stacks with buyDiscount)
//   rest_cure          rest(days): hull repair doubles, supplies use -25% while resting
//   trade_licence_quillari  (Quillari trade licence) Quillari stations: stock lists +2 extra goods;
//                           also +10% sell price at Quillari-faction systems (in addition to bonus)
//   steady_hand        (reward-only brass astrolabe) ionstorm / nebula / asteroids travel hull damage ignored
//   lantern_attunement (reward-only) mystery-tagged events weigh x2 and Lantern beacons reveal 1 extra neighbour
// ---------------------------------------------------------------------------------------------------

export const SLOT_COUNT = 8;
export const SLOTS = ['engine', 'sensors', 'hull', 'cargo', 'comms', 'lab', 'lounge', 'special'];

export const BONUS_KEYS = [
  'fuelMax', 'suppliesMax', 'hullMax', 'cargoMax', 'scanRange', 'jumpRange', 'efficiency',
  'skills', 'moraleRegen', 'repairPerDay', 'priceSell', 'buyDiscount',
];

export const SPECIAL_IDS = [
  'tea_service', 'slide_rule_array', 'translator_parrot', 'solar_sails', 'cargo_net', 'observation_dome',
  'emergency_beacon', 'cartographers_table', 'diplomatic_pouch', 'barrel_roll_gyro', 'bulk_contracts',
  'rest_cure', 'trade_licence_quillari', 'steady_hand', 'lantern_attunement',
];

export const SPECIALS = {
  tea_service: 'Resting and docked days restore 50% more morale; crew mood +1 after each rest.',
  slide_rule_array: '+5 points of odds on science and engineering checks.',
  translator_parrot: 'Diplomacy checks against Vesperine, Archivist and unknown species count as +1 skill; hails never fail outright.',
  solar_sails: 'Arriving at a white, blue, binary or yellow star refunds fuel (1; 2 at white/blue).',
  cargo_net: 'Half the time, an effect that would lose cargo is cancelled.',
  observation_dome: 'Wonder events grant +4 morale and a 15 scrip tour bonus.',
  emergency_beacon: 'Emergency tows cost 50% less in credits and goodwill.',
  cartographers_table: 'Each system you chart pays a 25 scrip Meridian bounty.',
  diplomatic_pouch: 'Positive reputation gains are 25% larger.',
  barrel_roll_gyro: 'Flee-tagged piloting checks +10 points of odds; travel hazard hull damage -25%.',
  bulk_contracts: 'Refuel, repair and restock cost 15% less.',
  rest_cure: 'Resting repairs the hull twice as fast and uses 25% less supplies.',
  trade_licence_quillari: 'Quillari markets stock 2 extra goods and pay 10% more for your cargo.',
  steady_hand: 'Ionstorms, nebulae and asteroid fields no longer damage the hull in transit.',
  lantern_attunement: 'Mystery events are twice as likely; Lantern beacons reveal one extra neighbouring system.',
};

function U(id, name, slot, tier, cost, o) {
  return {
    id, name, slot, tier, cost,
    requires: o.requires || [],
    ...(o.repGate ? { repGate: o.repGate } : {}),
    ...(o.reward ? { reward: true } : {}),
    build: o.build || 'general',
    desc: o.desc,
    flavor: o.flavor,
    bonus: o.bonus || {},
    ...(o.special ? { special: o.special } : {}),
  };
}

export const UPGRADES = [
  // ===================================================================== ENGINE
  U('ion_trimmer', 'Ion Trimmer', 'engine', 1, 220, {
    build: 'explorer',
    desc: 'Careful valve-balancing for thriftier jumps.',
    flavor: 'Chief Engineer Okonkwo calls it "listening to the engine until it tells you what it wants".',
    bonus: { efficiency: 0.92 },
  }),
  U('long_haul_drive', 'Long-Haul Drive', 'engine', 2, 650, {
    build: 'explorer', requires: ['ion_trimmer'],
    desc: 'Bigger tanks, longer reach, patient pistons.',
    flavor: 'Rated for the kind of journey that needs sandwiches.',
    bonus: { efficiency: 0.85, jumpRange: 0.10, fuelMax: 2 },
  }),
  U('deep_reach_engine', 'Deep-Reach Engine', 'engine', 3, 1700, {
    build: 'explorer', requires: ['long_haul_drive'],
    desc: 'A proper survey-class warp core with a cathedral of brass.',
    flavor: 'It hums in a key that makes the plants lean toward the bridge.',
    bonus: { efficiency: 0.78, jumpRange: 0.25, fuelMax: 4 },
  }),
  U('tuned_manifold', 'Tuned Manifold', 'engine', 1, 260, {
    build: 'daredevil',
    desc: 'Snappier throttle response and a bit more reach, for pilots who like to feel the ship lean.',
    flavor: 'The manifold sings a little sharp. The helmsman says that is the point.',
    bonus: { skills: { piloting: 1 }, jumpRange: 0.10 },
  }),
  U('afterburner_coils', 'Afterburner Coils', 'engine', 2, 720, {
    build: 'daredevil', requires: ['tuned_manifold'],
    desc: 'Dramatic acceleration at a dramatic price at the pump.',
    flavor: 'Comes with a warning sticker and a small scarf.',
    bonus: { skills: { piloting: 2 }, jumpRange: 0.15, efficiency: 1.05 },
  }),
  U('comet_chaser_drive', 'Comet-Chaser Drive', 'engine', 3, 1600, {
    build: 'daredevil', requires: ['afterburner_coils'],
    desc: 'The kind of engine that makes comets look up and wave.',
    flavor: 'Tuned by someone who has never once said "that sounds unwise".',
    bonus: { skills: { piloting: 3 }, jumpRange: 0.22, efficiency: 0.97 },
  }),
  U('wormhole_stabiliser', 'Wormhole Stabiliser Core', 'engine', 3, 0, {
    build: 'explorer', reward: true,
    desc: 'A gift from the Gate Surveyors. It smooths the ride through every fold of space.',
    flavor: 'Engraved: "For those who go first, and come home."',
    bonus: { efficiency: 0.80, jumpRange: 0.28, fuelMax: 3, skills: { engineering: 1 } },
  }),

  // ===================================================================== SENSORS
  U('brass_spyglass', 'Brass Spyglass Array', 'sensors', 1, 140, {
    build: 'explorer',
    desc: 'Polished lenses and a sturdy tripod. Reaches farther than you would think.',
    flavor: 'Yes, it is literally a very large telescope. It works.',
    bonus: { scanRange: 0.15 },
  }),
  U('sweep_array', 'Sweep Array', 'sensors', 2, 560, {
    build: 'explorer', requires: ['brass_spyglass'],
    desc: 'A rotating dish with a pleasing mechanical whirr.',
    flavor: 'The whirr is not required, but morale insists.',
    bonus: { scanRange: 0.25, skills: { science: 1 } },
  }),
  U('deep_field_array', 'Deep-Field Array', 'sensors', 3, 1500, {
    build: 'explorer', requires: ['sweep_array'],
    desc: 'A great lattice of antennae that listens to the dark with infinite patience.',
    flavor: 'Hears the stars gossip.',
    bonus: { scanRange: 0.45, skills: { science: 2 } },
  }),
  U('phase_sniffer', 'Phase Sniffer', 'sensors', 1, 190, {
    build: 'general',
    desc: 'A little instrument that tastes the light off a planet and tells you what is in it.',
    flavor: 'Mostly reliable; occasionally prone to hiccups near neutron stars.',
    bonus: { skills: { science: 1 }, scanRange: 0.05 },
  }),
  U('spectral_comb', 'Spectral Comb', 'sensors', 2, 620, {
    build: 'general', requires: ['phase_sniffer'],
    desc: 'Splits starlight into forty-one colours and names each one.',
    flavor: 'Lab Technician Vo calls it "the rainbow, with footnotes".',
    bonus: { skills: { science: 2 }, scanRange: 0.12 },
  }),
  U('archive_index_lens', 'Archive Index-Lens', 'sensors', 2, 520, {
    build: 'explorer', repGate: { faction: 'archivists', min: 20 },
    desc: 'A lens ground by Hollow Archive librarians, cross-referenced to every star ever catalogued.',
    flavor: 'The Archive lent it on condition that you return it, someday, with annotations.',
    bonus: { skills: { science: 2 }, scanRange: 0.20 },
  }),

  // ===================================================================== HULL
  U('riveted_plating', 'Riveted Plating', 'hull', 1, 130, {
    build: 'daredevil',
    desc: 'Extra plates, a lot of rivets, and the comforting clang of hard work.',
    flavor: 'Each rivet was hammered in by someone who said a small prayer.',
    bonus: { hullMax: 20 },
  }),
  U('dust_shield_lattice', 'Dust-Shield Lattice', 'hull', 2, 520, {
    build: 'daredevil', requires: ['riveted_plating'],
    desc: 'A fine layered mesh that turns micrometeorites into gentle sparkles.',
    flavor: 'Looks like lace, behaves like a bank vault.',
    bonus: { hullMax: 40 },
  }),
  U('bulwark_frame', 'Bulwark Frame', 'hull', 3, 1500, {
    build: 'daredevil', requires: ['dust_shield_lattice'],
    desc: 'A reinforced keel and braced ribs, built to shrug off anything the Reach can throw at it.',
    flavor: 'Heavy, honest, and entirely unbothered.',
    bonus: { hullMax: 70 },
  }),
  U('self_sealing_seams', 'Self-Sealing Seams', 'hull', 1, 200, {
    build: 'caretaker',
    desc: 'Gummy resin in the joints that quietly mends hairline cracks.',
    flavor: 'The ship, as it were, knits itself a scarf.',
    bonus: { repairPerDay: 0.5, hullMax: 5 },
  }),
  U('tinker_bay_plating', 'Tinker-Bay Plating', 'hull', 2, 650, {
    build: 'caretaker', requires: ['self_sealing_seams'],
    desc: 'Plating with maintenance crawlways built right in. The crew can fix anything from within.',
    flavor: 'The maintenance bot calls them "the scenic route".',
    bonus: { repairPerDay: 1, hullMax: 15, skills: { engineering: 1 } },
  }),
  U('living_hull_lattice', 'Living-Hull Lattice', 'hull', 3, 1700, {
    build: 'caretaker', requires: ['tinker_bay_plating'],
    desc: 'A symbiotic skin grown from aurora-seed and good intentions. It heals as it travels.',
    flavor: 'It purrs. We have asked it not to. It does anyway.',
    bonus: { repairPerDay: 2, hullMax: 30, skills: { engineering: 1 } },
  }),
  U('drifter_patchwork_hull', 'Drifter Patchwork Hull', 'hull', 2, 480, {
    build: 'caretaker', repGate: { faction: 'drifters', min: 25 },
    desc: 'Layer upon layer of salvaged plate, stitched with Drifter pride. Unbeatable and slightly colourful.',
    flavor: 'Every patch carries a story. Some carry two.',
    bonus: { hullMax: 35, repairPerDay: 0.8, cargoMax: 2 },
  }),
  U('singing_hull_plating', 'Singing Hull Plating', 'hull', 3, 0, {
    build: 'diplomat', reward: true,
    desc: 'Crystalline plating grown by the Third Choir. It resonates harmlessly with every nearby tone.',
    flavor: 'The ship hums "welcome" in thirds wherever it goes.',
    bonus: { hullMax: 60, skills: { diplomacy: 1 } },
  }),

  // ===================================================================== CARGO
  U('folding_crates', 'Folding Crates', 'cargo', 1, 150, {
    build: 'trader',
    desc: 'Stackable, collapsible, and surprisingly tidy.',
    flavor: 'Origami for the freight-minded.',
    bonus: { cargoMax: 4 },
  }),
  U('modular_bay', 'Modular Cargo Bay', 'cargo', 2, 560, {
    build: 'trader', requires: ['folding_crates'],
    desc: 'A reconfigurable hold with rails and tie-downs for everything from barrels to botany.',
    flavor: 'There is a spot for everything, and everything has a label.',
    bonus: { cargoMax: 9 },
  }),
  U('grand_hold', 'Grand Hold', 'cargo', 3, 1400, {
    build: 'trader', requires: ['modular_bay'],
    desc: 'An enormous hold that turns the Halcyon into a respectable freighter. Slightly heavier on the throttle.',
    flavor: 'You could lose a small moon in there. Please do not.',
    bonus: { cargoMax: 16, efficiency: 1.05 },
  }),
  U('haggler_desk', "Haggler's Desk", 'cargo', 1, 280, {
    build: 'trader',
    desc: 'A teak desk, a brass abacus, and a leather chair that makes people agree to things.',
    flavor: 'Smells of old receipts and fresh optimism.',
    bonus: { priceSell: 0.04, buyDiscount: 0.04, cargoMax: 1 },
  }),
  U('counting_house', 'Counting-House', 'cargo', 2, 780, {
    build: 'trader', requires: ['haggler_desk'],
    desc: 'A shipboard bureau with ledgers, a ticker, and a clerk who dreams of margins.',
    flavor: 'The ticker tape reads, in every language, "buy low".',
    bonus: { priceSell: 0.07, buyDiscount: 0.07, cargoMax: 2 },
  }),
  U('merchant_prince_vault', "Merchant Prince's Vault", 'cargo', 3, 1900, {
    build: 'trader', requires: ['counting_house'],
    desc: 'A vault of gleaming drawers, a brass scale, and a reputation that opens doors before you knock.',
    flavor: 'At last, someone calls you "your Excellency". Briefly.',
    bonus: { priceSell: 0.10, buyDiscount: 0.10, cargoMax: 4, skills: { diplomacy: 1 } },
  }),
  U('cold_locker', 'Cold Locker', 'cargo', 1, 240, {
    build: 'caretaker',
    desc: 'An insulated store with extra shelf-room for rations and tonics.',
    flavor: 'Always cold, always stocked, always mildly smug.',
    bonus: { suppliesMax: 6, cargoMax: 2 },
  }),

  // ===================================================================== COMMS
  U('teletype_relay', 'Teletype Relay', 'comms', 1, 160, {
    build: 'diplomat',
    desc: 'A chattering teletype that renders alien greetings into printed, politely stamped paper.',
    flavor: 'Clack-clack-clack. "Dear Captain, they say hello."',
    bonus: { skills: { diplomacy: 1 } },
  }),
  U('wideband_array', 'Wideband Array', 'comms', 2, 600, {
    build: 'diplomat', requires: ['teletype_relay'],
    desc: 'Hears and speaks across a dozen bands, from Concord common to Vesperine chord.',
    flavor: 'Once, accidentally, it joined a barbershop quartet.',
    bonus: { skills: { diplomacy: 2 }, scanRange: 0.05 },
  }),
  U('choral_translator_bank', 'Choral Translator Bank', 'comms', 3, 1500, {
    build: 'diplomat', requires: ['wideband_array'],
    desc: 'A rack of tuned crystal reeds and valve-driven translators that treat any language as music.',
    flavor: 'Tea-time conversations are now a genuine linguistic event.',
    bonus: { skills: { diplomacy: 3 } },
  }),
  U('gossip_switchboard', 'Gossip Switchboard', 'comms', 2, 480, {
    build: 'trader', requires: ['teletype_relay'],
    desc: 'A Quillari-style patch bay that routes rumours, offers, and the occasional lullaby.',
    flavor: 'The best bargains come through the back-channel.',
    bonus: { skills: { diplomacy: 1 }, priceSell: 0.03, buyDiscount: 0.03 },
  }),
  U('vesperine_harmonic_resonator', 'Vesperine Harmonic Resonator', 'comms', 3, 1500, {
    build: 'diplomat', repGate: { faction: 'vesperine', min: 35 },
    desc: 'A crystal reed tuned by the Choirs. It lets the ship sing back, correctly, at last.',
    flavor: 'The first note it ever played made the helmsman cry. Pleasantly.',
    bonus: { skills: { diplomacy: 3, science: 1 } },
  }),

  // ===================================================================== LAB
  U('field_lab_bench', 'Field Lab Bench', 'lab', 1, 180, {
    build: 'explorer',
    desc: 'A folding bench, a microscope, and a rack of flasks with hopeful labels.',
    flavor: 'Smells slightly of copper and curiosity.',
    bonus: { skills: { science: 1 } },
  }),
  U('analysis_suite', 'Analysis Suite', 'lab', 2, 600, {
    build: 'explorer', requires: ['field_lab_bench'],
    desc: 'Mass spectrometer, chromatograph, and a very patient punch-card sorter.',
    flavor: 'Lab Technician Vo says it understands rocks better than most geologists.',
    bonus: { skills: { science: 2 } },
  }),
  U('quantum_slide_lab', 'Quantum Slide-Lab', 'lab', 3, 1600, {
    build: 'explorer', requires: ['analysis_suite'],
    desc: 'An analogue-digital hybrid built around a monumental slide-rule and a bank of valves.',
    flavor: 'Calculates the improbable to four decimal places and one raised eyebrow.',
    bonus: { skills: { science: 3 } },
  }),
  U('sickbay_annex', 'Sickbay Annex', 'lab', 1, 200, {
    build: 'caretaker',
    desc: 'Two extra cots, a proper autoclave, and the good lamp.',
    flavor: 'Every patient gets a cup of broth and a cheerful lie.',
    bonus: { skills: { medicine: 1 }, suppliesMax: 2 },
  }),
  U('surgery_theatre', 'Surgery Theatre', 'lab', 2, 640, {
    build: 'caretaker', requires: ['sickbay_annex'],
    desc: 'A proper operating table, instrument cabinets, and the gentle glow of a surgical lamp.',
    flavor: 'Cleaner than the captain\'s quarters. Everyone agrees.',
    bonus: { skills: { medicine: 2 }, repairPerDay: 0.3 },
  }),
  U('pemberton_okafor_clinic', 'Pemberton-Okafor Clinic', 'lab', 3, 1500, {
    build: 'caretaker', requires: ['surgery_theatre'],
    desc: 'The clinic that Dr. Pemberton-Okafor designed on the back of a menu. Brilliant, cosy, and always smells of mint.',
    flavor: 'The sign on the door reads: "Come in. We have biscuits."',
    bonus: { skills: { medicine: 3 }, moraleRegen: 0.3 },
  }),
  U('makers_workshop', "Maker's Workshop", 'lab', 1, 220, {
    build: 'daredevil',
    desc: 'A lathe, a vice, a drawer of mysterious fasteners, and a portrait of an ancestor.',
    flavor: 'Nothing in the Halcyon has ever been truly broken, only "awaiting a bracket".',
    bonus: { skills: { engineering: 1 } },
  }),
  U('fabrication_bay', 'Fabrication Bay', 'lab', 2, 680, {
    build: 'daredevil', requires: ['makers_workshop'],
    desc: 'A proper automatic lathe and a sheet-forming press. Parts made to order.',
    flavor: 'A cheerful stamping rhythm accompanies every repair.',
    bonus: { skills: { engineering: 2 }, repairPerDay: 0.4 },
  }),
  U('foundry_of_small_wonders', 'Foundry of Small Wonders', 'lab', 3, 1600, {
    build: 'daredevil', requires: ['fabrication_bay'],
    desc: 'A miniature foundry where metal sings into shape and the engineers get gloriously sooty.',
    flavor: 'Smells of hot copper and satisfaction.',
    bonus: { skills: { engineering: 3 }, repairPerDay: 0.6 },
  }),
  U('concord_grant_lab', 'Concord Grant-Funded Lab', 'lab', 3, 1200, {
    build: 'general', repGate: { faction: 'concord', min: 30 },
    desc: 'A laboratory funded by the Concord Ministry of Small Mercies, equipped for all sorts of practical research. Comes with a grant form.',
    flavor: 'Please file your findings in triplicate. Tea is provided.',
    bonus: { skills: { science: 2, engineering: 1, medicine: 1 } },
  }),

  // ===================================================================== LOUNGE
  U('cushioned_benches', 'Cushioned Benches', 'lounge', 1, 120, {
    build: 'caretaker',
    desc: 'Plush seats, soft lamps, and a bowl of toffees.',
    flavor: 'Nobody sits there out of duty. They sit there out of love.',
    bonus: { moraleRegen: 0.4 },
  }),
  U('brass_and_velvet_lounge', 'Brass-and-Velvet Lounge', 'lounge', 2, 480, {
    build: 'caretaker', requires: ['cushioned_benches'],
    desc: 'A proper wardroom with a gramophone, a card table, and a very comfortable sofa.',
    flavor: 'The gramophone only plays one record. It is a very good record.',
    bonus: { moraleRegen: 0.8 },
  }),
  U('grand_saloon', 'Grand Saloon', 'lounge', 3, 1250, {
    build: 'diplomat', requires: ['brass_and_velvet_lounge'],
    desc: 'A salon for entertaining alien guests, complete with chandelier, piano, and mood lighting.',
    flavor: 'Three treaties have been negotiated here. Two were over sherry.',
    bonus: { moraleRegen: 1.4, skills: { diplomacy: 1 } },
  }),
  U('galley_garden', 'Galley Garden', 'lounge', 1, 200, {
    build: 'caretaker',
    desc: 'Window-boxes of herbs and tomatoes beside the galley.',
    flavor: 'Smells of basil and gentle regret over last week\'s casserole.',
    bonus: { suppliesMax: 5, moraleRegen: 0.2 },
  }),
  U('hydroponic_galley', 'Hydroponic Galley', 'lounge', 2, 560, {
    build: 'caretaker', requires: ['galley_garden'],
    desc: 'Racks of greens, a miniature orchard, and a small but opinionated chef.',
    flavor: 'The chef\'s signature dish is "salad, but with feeling".',
    bonus: { suppliesMax: 10, moraleRegen: 0.4 },
  }),
  U('orchard_deck', 'Orchard Deck', 'lounge', 3, 1300, {
    build: 'caretaker', requires: ['hydroponic_galley'],
    desc: 'A full orchard deck beneath a skylight. The crew eat peaches in deep space.',
    flavor: 'Nobody has ever been unhappy under a peach tree.',
    bonus: { suppliesMax: 18, moraleRegen: 0.8 },
  }),
  U('drifter_quilt_lounge', "Quilt-Hung Lounge", 'lounge', 2, 0, {
    build: 'caretaker', reward: true,
    desc: 'A lounge hung with Drifter story-quilts, each panel recording a family secret. A rare gift.',
    flavor: 'Whoever sits here is told a story, whether they want it or not.',
    bonus: { moraleRegen: 1.0, suppliesMax: 4, skills: { diplomacy: 1 } },
  }),

  // ===================================================================== SPECIAL
  U('tea_service', 'Brass Tea Service', 'special', 1, 180, {
    build: 'caretaker', special: 'tea_service',
    desc: 'A samovar, six cups, and a rule that no emergency begins before the second pot.',
    flavor: 'The tea is a little too strong. That is the point.',
    bonus: { moraleRegen: 0.2 },
  }),
  U('cargo_net', 'Cargo Net & Tie-Downs', 'special', 1, 220, {
    build: 'trader', special: 'cargo_net',
    desc: 'A web of nets and magnets that keeps freight where it belongs.',
    flavor: 'Because nothing ruins a day like a loose crate of brandy.',
    bonus: { cargoMax: 2 },
  }),
  U('emergency_beacon', 'Emergency Beacon', 'special', 1, 300, {
    build: 'daredevil', special: 'emergency_beacon',
    desc: 'A loud, cheerful distress beacon tied directly to the Meridian tender network.',
    flavor: 'It plays a sad little tune. The tender hears it and comes cheaper.',
    bonus: {},
  }),
  U('slide_rule_array', 'Slide-Rule Array', 'special', 1, 260, {
    build: 'explorer', special: 'slide_rule_array',
    desc: 'A rack of brass slide-rules wired to the nav computer. Answers faster than a valve ever did.',
    flavor: 'The Slide-Rule Guild offers a free membership and a very long newsletter.',
    bonus: { skills: { science: 1 } },
  }),
  U('translator_parrot', 'Translator Parrot', 'special', 2, 520, {
    build: 'diplomat', special: 'translator_parrot',
    desc: 'A mechanical parrot that repeats alien phrases a second after hearing them. Charming and surprisingly accurate.',
    flavor: 'Says "Polly wants a protocol" in six languages.',
    bonus: { skills: { diplomacy: 1 } },
  }),
  U('observation_dome', 'Observation Dome', 'special', 2, 640, {
    build: 'caretaker', special: 'observation_dome',
    desc: 'A glass dome above the bridge with sofas and a view of everything. Wonders feel better beneath it.',
    flavor: 'Best seat in the galaxy. Bring a blanket.',
    bonus: { moraleRegen: 0.3 },
  }),
  U('solar_sails', 'Solar Sails', 'special', 2, 700, {
    build: 'explorer', special: 'solar_sails',
    desc: 'Gossamer sails that drink bright starlight and trickle it into the fuel tanks.',
    flavor: 'The crew call them "the washing line". The engineer calls them "genius".',
    bonus: { fuelMax: 1 },
  }),
  U('cartographers_table', "Cartographer's Table", 'special', 2, 600, {
    build: 'explorer', special: 'cartographers_table',
    desc: 'A drafting table with felt-tip pens, rulers, and a bounty slot from Meridian HQ.',
    flavor: 'The ink never smudges. Nobody asks why.',
    bonus: { skills: { piloting: 1 } },
  }),
  U('diplomatic_pouch', 'Diplomatic Pouch', 'special', 2, 540, {
    build: 'diplomat', special: 'diplomatic_pouch',
    desc: 'A sealed leather pouch of letters, seals, and well-chosen gifts. Opens doors, often literally.',
    flavor: 'Stamped "By appointment of a very polite committee".',
    bonus: { skills: { diplomacy: 1 } },
  }),
  U('barrel_roll_gyro', 'Barrel-Roll Gyro', 'special', 2, 580, {
    build: 'daredevil', special: 'barrel_roll_gyro',
    desc: 'A gyroscope the size of a pumpkin. It lets a clever pilot turn a ship like a leaf in a breeze.',
    flavor: 'Not approved by the Meridian safety board. Not disapproved either. Just unmentioned.',
    bonus: { skills: { piloting: 1 } },
  }),
  U('rest_cure_hammocks', 'Hammock Deck', 'special', 3, 1250, {
    build: 'caretaker', special: 'rest_cure',
    desc: 'A deck of hammocks beneath sun-lamps. Resting aboard has never been so effective.',
    flavor: 'Doctor\'s orders: lie down. The doctor is lying down too.',
    bonus: { moraleRegen: 0.3, repairPerDay: 0.2 },
  }),
  U('bulk_contracts', 'Dock-Side Bulk Contracts', 'special', 3, 1300, {
    build: 'trader', special: 'bulk_contracts',
    desc: 'Standing agreements with dockmasters from here to the Rim. Fuel, patches, and food all come cheaper.',
    flavor: 'It is amazing what a letterhead can do.',
    bonus: { buyDiscount: 0.03 },
  }),
  U('quillari_trade_licence', 'Quillari Trade Licence', 'special', 2, 600, {
    build: 'trader', special: 'trade_licence_quillari', repGate: { faction: 'quillari', min: 25 },
    desc: 'A feathered scroll that grants you the Clans\' blessing at every table. Their markets list more goods and pay better for your cargo.',
    flavor: 'Hospitality is a contract. This is the paper version.',
    bonus: { buyDiscount: 0.05, priceSell: 0.04 },
  }),
  U('brass_astrolabe', 'Brass Astrolabe of Steady Hands', 'special', 2, 0, {
    build: 'daredevil', reward: true, special: 'steady_hand',
    desc: 'An antique astrolabe gifted by a retired Drifter navigator. Lets you thread any storm like a needle.',
    flavor: 'Inscribed: "Hold it lightly, steer it kindly."',
    bonus: { skills: { piloting: 1 } },
  }),
  U('lantern_attunement', 'Lantern Attunement Prism', 'special', 3, 0, {
    build: 'explorer', reward: true, special: 'lantern_attunement',
    desc: 'A prism of Lantern-glass that hums when mysteries are near. A gift of the Reach itself.',
    flavor: 'It has warmed to you. We are as surprised as you.',
    bonus: { skills: { science: 1 } },
  }),
];

export const UPGRADES_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
