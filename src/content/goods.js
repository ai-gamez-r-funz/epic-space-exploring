// Halcyon Reach — GOODS & ECONOMY (WORLD-A). Pure data, node-runnable.
//
// Exports:
//   GOODS          [ { id, name, category, base, volatility, desc, bulk, flavor, illegal? } ]
//                  category: 'food'|'tech'|'luxury'|'medical'|'material'|'curio'|'fuel'
//                  base: typical price in scrip (8..260). volatility 0..1: how far day-to-day prices swing
//                  and how hard trades move the price. bulk: cargo slots per unit (1..3).
//   GOODS_BY_ID    lookup map
//   ECONOMY_BIAS   { [stationKind | factionId | 'region:<id>']: { goodId: multiplier } }
//                  Multiplier applies to base price. < 1 = cheap here (produced), > 1 = dear here (wanted).
//                  The engine should multiply the station-kind bias, the system-faction bias, and (if it
//                  wants) the region bias together, then apply volatility noise. Keys are all optional.
//                  The 'region:' keys are an optional extra; the contract only requires kind + faction.
//   PRICE_RULES    suggested constants (spread, sell fraction, stock ranges) for the engine; optional.
//
// Design intent for trade routes (cheap -> dear):
//   glass_brandy    Quillari/Shoals  -> Drifter habitats, Concord embassies (as diplomatic gift stock)
//   tuning_crystals Vesperine/Veil   -> Archive, Quillari markets
//   vellum_sheets   Archive          -> Veil, Concord
//   hand_looms      Drifters (rim)   -> Shoals, Concord
//   ration_bars     Concord          -> Drifters, rim outposts
//   fuel_cells      Concord/outposts -> Drifters, choir (remote)
//   medical_kits    Concord          -> Drifters, Quillari outposts
//   machine_parts   Concord yards    -> Drifters, Archive
//   star_charts     Meridian/gate    -> everywhere remote (Quillari love them)
//   curios          rim/archive      -> Quillari, Concord
//   aurora_silk     Veil/choir       -> Quillari, Concord
//   etc.

export const GOODS = [
  // ---- food -------------------------------------------------------------
  {
    id: 'ration_bars', name: 'Concord Ration Bars', category: 'food', base: 12, volatility: 0.15, bulk: 1,
    desc: 'Compact, nutritious, and labelled "Flavour: Optimism". Concord Standard Issue.',
    flavor: 'Technically a meal. Spiritually a pamphlet.',
  },
  {
    id: 'seed_vault_crates', name: 'Seed-Vault Crates', category: 'food', base: 45, volatility: 0.25, bulk: 2,
    desc: 'Sealed trays of heirloom seed stock for new habitat gardens. Fragile, hopeful.',
    flavor: 'Every crate is a small argument that tomorrow will have tomatoes.',
  },
  {
    id: 'nebula_tea', name: 'Nebula-Dried Tea', category: 'food', base: 30, volatility: 0.3, bulk: 1,
    desc: 'Leaves cured in the glow of the Veil of Penny-Lace. Faintly luminous in the cup.',
    flavor: 'Steeps in four minutes, or one long sunset.',
  },

  // ---- luxury -----------------------------------------------------------
  {
    id: 'glass_brandy', name: 'Glass-Fruit Brandy', category: 'luxury', base: 85, volatility: 0.35, bulk: 1,
    desc: 'Quillari spirit distilled from translucent shoal-fruit. Warm, clear, and a little bit bright.',
    flavor: 'Smooth as a good excuse.',
  },
  {
    id: 'vellum_sheets', name: 'Archive Vellum Sheets', category: 'luxury', base: 95, volatility: 0.2, bulk: 1,
    desc: 'Acid-free machine-pressed vellum from the Hollow Archive. Perfect for treaties and love-letters.',
    flavor: 'Does not yellow. Does not forgive typos.',
  },
  {
    id: 'hand_looms', name: 'Drifter Hand-Looms', category: 'luxury', base: 60, volatility: 0.3, bulk: 2,
    desc: 'Pocket-sized weaving frames and the cloth they make. Every pattern encodes a family story.',
    flavor: 'Warp, weft, and a decent amount of gossip.',
  },
  {
    id: 'aurora_silk', name: 'Aurora Silk', category: 'luxury', base: 210, volatility: 0.45, bulk: 1,
    desc: 'Threads spun from shed aurora-life, shimmering in three colours that do not exist in daylight.',
    flavor: 'Wear it once and be asked where you got it forever.',
  },
  {
    id: 'smuggler_spice', name: 'Duskpepper', category: 'luxury', base: 110, volatility: 0.5, bulk: 1,
    desc: 'A fiery relish ground from rim-grown peppercorns. Not illegal, merely frowned upon by three separate ministries.',
    flavor: 'Warning: contains a sunrise.',
  },

  // ---- tech -------------------------------------------------------------
  {
    id: 'tuning_crystals', name: 'Vesperine Tuning Crystals', category: 'tech', base: 140, volatility: 0.3, bulk: 1,
    desc: 'Perfectly pitched crystal wafers, grown in harmony and sung into shape. Used in everything from comms to clocks.',
    flavor: 'Tap one and the room tunes itself.',
  },
  {
    id: 'star_charts', name: 'Meridian Star-Charts', category: 'tech', base: 120, volatility: 0.25, bulk: 1,
    desc: 'Felt-tip survey sheets, hand-checked and cross-hatched. The common currency of the curious.',
    flavor: 'Smells of ink and ambition.',
  },
  {
    id: 'machine_parts', name: 'Machine Parts', category: 'tech', base: 55, volatility: 0.2, bulk: 2,
    desc: 'Gears, valves, and servo housings, stamped and ready. The unglamorous backbone of civilisation.',
    flavor: 'If it is not bolted down, it is probably a machine part.',
  },
  {
    id: 'slide_rule_blanks', name: 'Slide-Rule Blanks', category: 'tech', base: 65, volatility: 0.2, bulk: 1,
    desc: 'Engraved brass scales awaiting their cursors. Prized in the Slide-rule Guild and by sentimental navigators.',
    flavor: 'Calculates beautifully, with no batteries at all.',
  },

  // ---- medical ----------------------------------------------------------
  {
    id: 'medical_kits', name: 'Relief Medical Kits', category: 'medical', base: 70, volatility: 0.2, bulk: 1,
    desc: 'Sterile field kits with bandages, tonics, and an illustrated guide for beginners.',
    flavor: 'Includes one small stuffed bear. Do not ask why.',
  },
  {
    id: 'antiserum_vials', name: 'Antiserum Vials', category: 'medical', base: 90, volatility: 0.3, bulk: 1,
    desc: 'Cold-chain vials against assorted frontier fevers and sneezes. Needs a steady hand.',
    flavor: 'Shake gently. Pray lightly.',
  },

  // ---- fuel -------------------------------------------------------------
  {
    id: 'fuel_cells', name: 'Fuel Cells', category: 'fuel', base: 40, volatility: 0.2, bulk: 2,
    desc: 'Sealed deuterium cells for sale by the crate. Warm to the touch, cheerful to the engineer.',
    flavor: 'A tank of promises.',
  },
  {
    id: 'comet_ice', name: 'Comet Ice', category: 'material', base: 18, volatility: 0.35, bulk: 2,
    desc: 'Blocks of clean, ancient water-ice, packed in frost-cloth. Always in demand where the sun is far away.',
    flavor: 'Older than the oldest civilisation, and yours for eighteen scrip.',
  },

  // ---- material ---------------------------------------------------------
  {
    id: 'salvage_lace', name: 'Salvage Lace', category: 'material', base: 25, volatility: 0.35, bulk: 1,
    desc: 'Fine mesh hand-woven from reclaimed wire and thread. Strong as steel, soft as a rumour.',
    flavor: 'Drifters say it can mend almost anything.',
  },
  {
    id: 'teletype_ribbon', name: 'Teletype Ribbon', category: 'material', base: 8, volatility: 0.1, bulk: 1,
    desc: 'Inked ribbon for the great chattering printers aboard every respectable bureau. Ordinary, essential, cheap.',
    flavor: 'The sound of bureaucracy being born.',
  },

  // ---- curio ------------------------------------------------------------
  {
    id: 'curios', name: 'Lantern-Reach Curios', category: 'curio', base: 180, volatility: 0.6, bulk: 1,
    desc: 'Odd trinkets from ruins and rift-edges: ticking glass, humming seeds, a very small orrery. Value depends entirely on who is looking.',
    flavor: 'Possibly priceless. Possibly a doorstop.',
  },
  {
    id: 'lantern_glass', name: 'Lantern-Glass Shards', category: 'curio', base: 260, volatility: 0.7, bulk: 1,
    desc: 'Cooled slivers from the Lantern beacons. They glow faintly when someone nearby is telling the truth.',
    flavor: 'The most expensive thing on the market, and nobody can say what it does.',
  },

  // ---- fix round 1: rival-route goods (Captain Tamsin Vell's free-trader stock, see RIVAL_GOODS) ----------
  {
    id: 'tamsin_marmalade', name: "Tamsin's Dockside Marmalade", category: 'food', base: 38, volatility: 0.35, bulk: 1, rival: 'tamsin',
    desc: 'Orange-and-starfruit preserve boiled in a habitat galley on the Rim. Tamsin Vell swears the recipe came from her aunt, and the aunt swears otherwise.',
    flavor: 'Spreads on anything. Settles arguments.',
  },
  {
    id: 'rimlight_lanterns', name: 'Paper Rimlight Lanterns', category: 'luxury', base: 72, volatility: 0.4, bulk: 2, rival: 'tamsin',
    desc: 'Hand-folded paper lanterns lit by a pinch of glow-moss. Festival staple in the Shoals; a Drifter nursery rhyme in the Rim.',
    flavor: 'Light enough to carry. Bright enough to be asked about.',
  },
  {
    id: 'shoal_glass_beads', name: 'Shoal-Glass Beads', category: 'luxury', base: 48, volatility: 0.3, bulk: 1,
    desc: 'Tiny hollow beads blown from shoal-sand, strung on silk. Quillari children wear them; Drifters trade them as small change.',
    flavor: 'The sound of a good bargain is a handful of these.',
  },
  {
    id: 'felt_tip_cartridges', name: 'Felt-Tip Ink Cartridges', category: 'tech', base: 36, volatility: 0.15, bulk: 1,
    desc: 'Archival ink for the Meridian survey pens. Cheap at the Gate, dear anywhere a map is being made for the first time.',
    flavor: 'Smells of fresh ambition and mild solvent.',
  },
];

export const GOODS_BY_ID = Object.fromEntries(GOODS.map((g) => [g.id, g]));

// Multipliers on base price. <1 = cheap here (surplus), >1 = dear here (demand).
export const ECONOMY_BIAS = {
  // ---- by station kind --------------------------------------------------
  trade: {
    // ordinary market: slight demand for luxury, surplus of bulk staples
    ration_bars: 0.95, machine_parts: 0.95, curios: 1.05, teletype_ribbon: 0.9, shoal_glass_beads: 1.05,
  },
  outpost: {
    // remote: fuel/food dear, finished goods fair
    fuel_cells: 1.3, ration_bars: 1.25, medical_kits: 1.25, comet_ice: 0.85, antiserum_vials: 1.2, nebula_tea: 1.1, tamsin_marmalade: 1.2,
  },
  shipyard: {
    machine_parts: 0.8, slide_rule_blanks: 0.9, salvage_lace: 1.2, fuel_cells: 0.9,
  },
  embassy: {
    vellum_sheets: 1.2, glass_brandy: 1.25, star_charts: 1.1, curios: 1.1, teletype_ribbon: 1.2,
  },
  archive: {
    vellum_sheets: 0.8, curios: 0.85, slide_rule_blanks: 0.9, teletype_ribbon: 0.8,
    machine_parts: 1.3, glass_brandy: 0.9, star_charts: 1.4, lantern_glass: 1.3,
  },
  habitat: {
    hand_looms: 0.65, salvage_lace: 0.6, curios: 0.85, comet_ice: 0.8, tamsin_marmalade: 0.7, rimlight_lanterns: 0.75,
    glass_brandy: 1.4, ration_bars: 1.3, machine_parts: 1.4, fuel_cells: 1.3, medical_kits: 1.35, seed_vault_crates: 1.25,
  },

  // ---- by controlling faction ------------------------------------------
  concord: {
    ration_bars: 0.8, medical_kits: 0.8, machine_parts: 0.9, fuel_cells: 0.85, seed_vault_crates: 0.8, teletype_ribbon: 0.8, felt_tip_cartridges: 0.85, shoal_glass_beads: 1.2,
    glass_brandy: 1.2, smuggler_spice: 1.45, hand_looms: 1.25, aurora_silk: 1.2, tuning_crystals: 1.15,
  },
  quillari: {
    glass_brandy: 0.65, nebula_tea: 0.9, smuggler_spice: 0.85, curios: 0.95, shoal_glass_beads: 0.7, rimlight_lanterns: 1.3, tamsin_marmalade: 1.3,
    star_charts: 1.35, vellum_sheets: 1.25, hand_looms: 1.2, tuning_crystals: 1.25, ration_bars: 1.25, medical_kits: 1.15, aurora_silk: 1.2,
  },
  vesperine: {
    tuning_crystals: 0.6, aurora_silk: 0.8, nebula_tea: 0.75, comet_ice: 0.9,
    machine_parts: 1.5, fuel_cells: 1.3, glass_brandy: 1.1, vellum_sheets: 1.3, curios: 1.2, slide_rule_blanks: 1.2, rimlight_lanterns: 1.25,
  },
  archivists: {
    vellum_sheets: 0.82, lantern_glass: 1.25, curios: 0.9, slide_rule_blanks: 0.9,
    tuning_crystals: 1.2, star_charts: 1.35, machine_parts: 1.2, antiserum_vials: 1.2, felt_tip_cartridges: 1.3,
  },
  drifters: {
    hand_looms: 0.7, salvage_lace: 0.65, smuggler_spice: 0.8, comet_ice: 0.85, curios: 0.85,
    glass_brandy: 1.35, machine_parts: 1.35, fuel_cells: 1.3, ration_bars: 1.25, medical_kits: 1.3, star_charts: 0.9, vellum_sheets: 1.2,
  },
  none: {
    // unaffiliated: gentle noise only
    comet_ice: 0.95, salvage_lace: 1.05,
  },

  // ---- by region (optional extra; engine may combine or ignore) ---------
  'region:gate': {
    star_charts: 0.8, teletype_ribbon: 0.85, ration_bars: 0.9, curios: 1.15, felt_tip_cartridges: 0.75, fuel_cells: 0.9, rimlight_lanterns: 1.1,
  },
  'region:shoals': {
    glass_brandy: 0.75, nebula_tea: 1.1, hand_looms: 1.15, fuel_cells: 1.05, shoal_glass_beads: 0.8, rimlight_lanterns: 1.2, tamsin_marmalade: 1.2, medical_kits: 1.1,
  },
  'region:veil': {
    nebula_tea: 0.7, aurora_silk: 0.8, tuning_crystals: 0.8, machine_parts: 1.2, fuel_cells: 1.2, ration_bars: 1.15, rimlight_lanterns: 1.15,
  },
  'region:choir': {
    aurora_silk: 0.85, fuel_cells: 1.35, antiserum_vials: 1.2, curios: 0.9, lantern_glass: 0.9, ration_bars: 1.2, comet_ice: 0.8, medical_kits: 1.2,
  },
  'region:archive': {
    vellum_sheets: 0.75, curios: 0.85, glass_brandy: 0.95, felt_tip_cartridges: 1.25, machine_parts: 1.15, ration_bars: 1.1,
  },
  'region:rim': {
    hand_looms: 0.75, salvage_lace: 0.75, smuggler_spice: 0.8, fuel_cells: 1.35, medical_kits: 1.3, star_charts: 1.1, tamsin_marmalade: 0.8, rimlight_lanterns: 0.8, ration_bars: 1.2, felt_tip_cartridges: 1.2,
  },
};

// Suggested constants for the engine (optional use)
export const PRICE_RULES = {
  spread: 0.12,            // station buys at (price * (1 - spread)), sells at price * (1 + spread/2)
  dailyDrift: 0.05,        // fraction of volatility applied per market refresh
  tradeImpact: 0.015,      // price shift per unit traded, scaled by volatility
  stockBase: 24,           // typical stock per good before bias
  stockCheapBonus: 1.5,    // cheap goods (bias < 0.85) stock more
  minPrice: 6,
};

// ---------------------------------------------------------------------------------------------
// TRADE LANES WITH PERSONALITY (hints for UI/missions; buy where cheap, sell where dear)
// ---------------------------------------------------------------------------------------------
export const TRADE_LANES = [
  { good: 'glass_brandy', from: 'region:shoals', to: 'region:rim', note: 'The Shoals brew it; the Rim toasts with it.' },
  { good: 'tuning_crystals', from: 'region:veil', to: 'region:archive', note: 'Choir-grown, Archive-catalogued.' },
  { good: 'vellum_sheets', from: 'region:archive', to: 'region:veil', note: 'Paper for people who sing.' },
  { good: 'hand_looms', from: 'region:rim', to: 'region:shoals', note: 'Drifter weaving on Quillari shelves.' },
  { good: 'fuel_cells', from: 'region:gate', to: 'region:choir', note: 'Cheap at the Gate; precious past the pulsars.' },
  { good: 'felt_tip_cartridges', from: 'region:gate', to: 'region:archive', note: 'Ink for those mapping the unmapped.' },
  { good: 'tamsin_marmalade', from: 'region:rim', to: 'region:shoals', note: "Tamsin's own route; she will wave." },
  { good: 'rimlight_lanterns', from: 'region:rim', to: 'region:shoals', note: 'Festival stock, in season.' },
  { good: 'shoal_glass_beads', from: 'region:shoals', to: 'region:gate', note: 'Small, light, always welcome.' },
  { good: 'comet_ice', from: 'region:choir', to: 'region:rim', note: 'Water where the sun is a rumour.' },
];

// Goods with `rival:'tamsin'` are the signature stock of the rival free-trader Captain Tamsin Vell. The engine may
// prefer these when it picks state.rival.goodId (any good is still legal). See SPECIALS.rival_handshake.
export const RIVAL_GOODS = GOODS.filter((g) => g.rival).map((g) => g.id);
