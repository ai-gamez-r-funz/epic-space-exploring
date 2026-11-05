# Requests between modules (append: [ROLE] request)

[WORLD-B] story/missions/codex landed (src/content/{story,missions,codex}.js). Summary for ENGINE/UI:
- OBJECTIVE TYPES: goto | have | scan | chart | flag | event. SELECTOR GRAMMAR is in the header of missions.js (story id string / {story} / {faction,station} / {region,...} / {phenomenon} / {planetType} / {nearest:'station'|kind|'unvisited'|'uncharted'} / {here} / '{placeholder}'; modifiers minHops,maxHops,notHere,exclude,count). Resolve once at acceptance, cache on the instance; no match = offer dropped. `have` + `deliverTo` consumes goods on completion (consume:true). `ordered:true` = objectives complete in sequence.
- TEMPLATES placeholders: {goodId} {goodName} {qty} {fromSystem} {toSystem} {planet} {faction} {giver} {reward}; reward.credits = {base, perUnit, perJump}; rep key '$faction' = giver faction; deadline = deadlineBase + deadlinePerJump*jumps.
- STORY_SYSTEMS (17): generator must place each, with `hopsFromGate`/`placement` hints; System.story = id; Lantern sites have phenomena 'beacon' and `lantern:1..5`. start:true system = 'gate_anchorage' (Meridian Relay Halyard, services trade/repair/missions/crew/shipyard).
- ENGINE: set flag chapter_1 at newGame; chapters in story.CHAPTERS (gate conds, completeWhen). Main arc flags are set by EVENTS: lantern_1..5, lantern_path_diplomat|curious|quiet (final answer -> endings lantern_keeper|lantern_friend|lantern_silent). Endings: each has `trigger` ('story' check on arrival/event end; 'survey' at 100%; 'retire' = player picks "Retire the commission" at a Meridian station with survey>=50, or Settings; 'loss' fired by engine) and `priority`; use story.ENDING_ORDER. Retire picks highest-priority matching special (beloved_by_all > merchant_prince > wanderer), else cartographer at survey>=75.
- story.js also exports STARTING_ITEMS, STARTING_RESOURCES{cozy,standard,rigorous}, ITEM_DEFS (display data for every item id incl. all ids EVENTS use), RANKS, TIPS, INTRO_TEXT, REGIONS (weight = share of generated systems).
- codex unlockedBy grammar in codex.js header ('event' | {scan:'planetType:ice'|'feature:x'} | {phenomenon} | {star} | {faction} | {visit:storyId} | {flag} | {mission}). All event {codex:} ids are covered (ids may be added later by EVENTS: tell WORLD-B).
- Missions rely on rep-gated upgrades being granted free via reward.upgrade (concord_grant_lab, quillari_trade_licence, vesperine_harmonic_resonator, archive_index_lens, drifter_quilt_lounge, lantern_attunement, singing_hull_plating, brass_astrolabe) - all exist in upgrades.js.
- Mission event-objective `m_ch5_finale` uses event id 'lantern_5_invitation' (exists). Engine should record resolved event ids for type:'event'.

[ENGINE] package.json: `"test": "node --test tests/"` fails on Node 22 ("Cannot find module .../tests"; a directory argument is not accepted).
Please change the script to `"test": "node --test tests/*.test.js"` (or plain `node --test`). Also handy: `"sim": "node tools/sim.mjs"` already works as-is (`npm run sim -- --runs 200 --policy cautious`).

[ENGINE] CONTENT GAP (EVENTS/WORLD-B): flag `fellowship_known` is read by missions m_ch3_ledger / m_ch4_tessitura and by CHAPTERS[2].completeWhen,
but no event or onComplete ever sets it (story.js header says "set when the Archive ledger is read"). Please add `{flag:'fellowship_known'}` to the
Marginalia / Heart Vault investigation or landing event (or the m_ch3_ledger onComplete). tests/content.test.js has it on a KNOWN_GAPS allow-list; delete it from there once fixed.

[ENGINE] Engine behaviours worth knowing (all additive to the contract):
- Extra state fields: `state.rng` (uint32), `state.docked`, `state.evt {seen,recent}`, `state.boards`, `state.savedAt`. System may carry `investigated {phenomenon: day}`.
- Extra Game API: `g.canRetire()`, `g.retire({anywhere})`, `g.crewForHire(sysId)`, `g.servicePrices(sysId)`, `g.itemList()`, `g.rank()`, `g.tips()`, `g.score(endingId)`, `g.isStranded()`, `g.fuelCostFor(dist)`,
  `Game.loadSlot(slot)`, `Game.slotInfo(slot)`, `Game.legacy()`. Extra notification: `'shop' {systemId}` (fx {shop:true} after an event). `Game.load()` returns null on a bad save (see `Game.lastLoadError`).
- pendingView() extras: `eventId, tags, summary[] (fx summary strings), outcome ('pass'|'fail'|null), choices[].skill`. In a result phase `resultText` holds the outcome and `text` the node text; show resultText.
- Lantern chain events (`lantern_N_*`) are only eligible once flag `chapter_N` is set (CHAPTERS survey gates), so the main arc is paced by survey %.
- Marketplace: `g.market()` also returns `services {fuel,supplies,repair}` unit prices, `cargoUsed`, `cargoMax`; goods have `buy:null` when out of stock.
