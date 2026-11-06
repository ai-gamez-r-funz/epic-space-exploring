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

[UI-2B] Delivered: CrewScreen, MissionLog, Codex, Help, Settings, Pause (src/ui/overlays/*.js + parts2/), tutorial hints (parts2/tutorial.js, localStorage 'halcyon.tutorial'), prefs (parts2/prefs.js, 'halcyon.prefs'), src/ui/responsive.js (letterbox, rotate overlay, fullscreen, touch hit-slop, modal boost, no-zoom/scroll). Notes for others:
- Prefs.js globally patches Typewriter pacing (text speed) and Anim.to (animations off => instant). `window.__halcyonPrefs.shake` / `.anim` can be read by Bridge/GalaxyMap to skip screen shake / flourishes (not wired in their files).
- `ui.showOnMap(systemIds, title)` (app.js) opens the Chart, selects/centres the first target and pulses rings; GalaxyMap needs no change (uses its select()/centerOn()/world).
- KIT request: Button/ScrollList hit areas could be padded to >=40 css px on touch; currently handled generically by responsive.js hit-slop (touch pointers snap to the nearest pointer-cursor object within 20 css px).
- KIT request: Modal could honour Display.scale itself; currently responsive.js scales Modal containers (pivot at stage centre) via layers.overlay 'childAdded'.

[WORLD-B] Fix round 1 (story/missions/codex):
- ENGINE/UI: main-arc tracker. story.CHAPTERS[n] now has `journal` (what to do now) and `journalDone` (one-liner when the chapter ends) plus `lantern` (story id of the target). Pin the current chapter's `journal` at the top of Log > Active, and show the resolved system NAME after each mission objective text (activeView already gives `target` id). CONTEXT_TIPS (story.js) = situational first-minutes tips keyed first_bridge, first_chart, first_jump, first_arrival, first_orbit, first_scan, first_station, first_trade, first_mission, first_main_story, first_crew, low_fuel, low_supplies, low_morale, first_lantern, retire_ready.
- Chapter gates lowered and no longer need archive_key/fellowship_known: ch2 lantern_1+8%, ch3 lantern_2+18%, ch4 lantern_3+28%, ch5 lantern_4+40%. Lantern missions require only the lantern_N flag (goto/scan steps are optional breadcrumbs). m_ch3_ledger completes by visiting+scanning Marginalia and sets fellowship_known itself (EVENTS may also set it; the test allow-list entry can now be removed).
- m_ch5_finale removed (it could never be offered: Last Taper has no station). m_ch5_last_taper now pays 1500 + lantern_attunement.
- New missions: rival chain (Captain Tamsin Vell, flag rival_friend), distress relief (`distress:true`, repeatable, 10-16 day deadlines: ENGINE may spawn these as distress calls), survey contracts, rare-good bounties, footnote + quiet-treaty diplomacy chains, Lamplight Festival chain. New endings: rival_friend, archive_scholar, drifter_adoption, lantern_pilgrim (all trigger 'retire'; flags rival_friend / archive_scholar / drifter_adopted / lantern_3). Every ENDING now has `blurb` (one-line "how this is earned") for the end screen.

[WORLD-A] FIX ROUND 1 (upgrades/crew/goods). Content landed in src/content/{upgrades,goods,crew,factions}.js. 83 upgrades, 24 goods, 31 pool crew.
I made ONE edit outside my dirs: tests/content.test.js SPECIAL_IMPLEMENTED now also lists the 14 new special ids (10 need engine hooks, 4 are unlock-only). Please keep that list in sync as you implement.
Negative bonus values are now used on purpose (jumpRange/scanRange/cargoMax/hullMax/fuelMax/moraleRegen < 0, efficiency > 1) for trade-off upgrades; ship.js derive() already sums them.
Exports for engine/events: `ENGINE_SPECIALS_TODO`, `UNLOCK_ONLY_SPECIALS`, `SPECIALS` (exact one-line specs), `TEASERS` {id: phrase} (upgrades.js); `CREW_ABILITIES` + `TRAITS[t].ability` (crew.js); `TRADE_LANES`, `RIVAL_GOODS` (goods.js).

ENGINE MUST IMPLEMENT (message-ready; hasSpecial(state,id) as usual):
- distress_transponder: events tagged "relief": every positive credits and positive rep fx x1.25 (ceil); relief-tagged event weight x1.5.
- market_ear: g.market(sys) also returns tips[]: up to 3 {goodId, systemId, systemName, sell} for goods in this market where the best sell price among other VISITED systems (state.markets cache) beats this market's buy price by >= 25%.
- rival_handshake: on install once (flag rival_handshake_given): counters.rival_friend += 2; while state.rival exists, selling state.rival.goodId earns +8%.
- long_range_hails: g.hail() with no eligible hail event (polite nothing) applies [{reveal:'nearest'},{toast}] once per system (counter hails_<sysId>).
- prize_cartography: first scan of each planet: credits += min(60, 8 + 12*features.length), toast "Prize cartography +N scrip".
- field_hospital: checkOdds skill medicine +0.10; each rest day +2 morale and +1 hull.
- brittle_array: travel hazard hull damage x1.5 (before difficulty).
- thrifty_galley: daily supplies consumption x0.75.
- false_floor: on dock at faction 'concord' system: 15% chance customs spot-check: credits -40 (min 0), rep concord -2, toast. No combat.
- ice_scoop: on arrival at a system with phenomenon 'comet': fuel +3.
UNLOCK ONLY (no engine code; EVENTS gate with {upgrade:id}): survey_hull, ambassadors_hull, salvage_boom, quiet_running (also hospital_hull via its special field_hospital id or upgrade id).
CREW ABILITIES to implement (TRAITS[trait].ability): thrifty_pantry (supplies use x0.90 per holder, floor x0.7), pen_and_ink (+10 scrip when charting), weather_eye (travel hazard chance x0.85 per holder, floor x0.6), gift_of_the_gab (first positive rep gain per dock +1).
NOTE (ENGINE): tests/economy.test.js "no profitable infinite loop" fails at 213 scrip/day: vellum_sheets Hollow Archive -> Cantabile on day 20 (market news glut x0.72 at one end x shortage/bias at the other). Biases are already clamped 0.72..1.3 so this comes from the new newsFor() layer, not goods.js; please cap news-compounded spreads or raise the test bound.
[EVENTS] you can now write locked options like {label:'Run a side-scan pass', if:[{upgrade:'survey_hull'}]}; quote UPGRADES TEASERS[id] in reasons.

[ENGINE] FIX ROUND 1 — new API for UI / EVENTS (all in src/core, see tests/setpieces.test.js)
- Build: `src/core/content.js` now uses plain static imports (no top-level await, no dynamic import, `missing` is always []).
- `g.nextObjective()` -> `{kind:'mission'|'lantern'|'survey'|'story'|'distress'|'explore', text, title?, systemId|null}` | null. Priority: active main-arc mission step > current chapter's Lantern ("Investigate the Lantern at X") > survey/archive hint for the next chapter > distress call > nearest detected system. `systemId` is only set when the system is known (use ui.showOnMap). Chapter journal text: show `CHAPTERS[n].journal` (content) next to it; resolved system names for mission objectives: activeMissions()[i].objectives[j].target is a system id -> `g.system(id).name`.
- Main-arc pacing: chapter survey gates are scaled x0.75 by the engine; when a chapter opens, its Lantern system is revealed (status 'detected') with a toast+log line.
- Pressure curve: fuel cost per jump = dist/70 (base tank 32), station fuel/supplies/repair prices rise +7% per hop beyond the first from the Gate, supplies upkeep (0.4+0.2*crew)/day, morale drifts -0.45/day (docked +0.6, rest +3, lounge upgrades offset), hull wear on jumps, lane hazards. A dangerous lane starts a real decision event ("Rough Lane": push through / slow burn / piloting check / engineering check). Morale < 30 gives -5 points on all check odds. Emergency tow now costs ~80 scrip and 3 Concord standing (standard).
- Scan discoveries: `g.scanPlanet()` returns `{bounty, event, find}`; ~70% of scans produce a find from features/life/type (cargo, credits, morale, codex) - applied with a toast + 'discovery' {kind:'find'}, or (30%) offered as a take-it/leave-it choice. Landing falls back to a choice event with rewards from the planet's features. Hails fall back to a repeatable faction hail (greeting lines, gossip that reveals the chart, charts gift) 45% of the time even when authored hails exist.
- Distress beacons: `state.distress = {id, systemId, kind, captain, species, faction, deadlineDay}`; `g.distressSignals()` -> `[{id, systemId, systemName, kind, title, deadlineDay, daysLeft}]`; `g.spawnDistress(days?)`; fx `{distress: days}` spawns one; arrival at the system starts an event of ctx `'distress'` (EVENTS may author them: `ctx:'distress'`, any `when`) or the built-in 3-node chain; cond `{distress:true|'here'}`. Appears about every 20 days, expires with a toast and -2 morale.
- Rival trader: `state.rival = {name, systemId, prevId, goodId, nextMoveDay}`; `g.rivalInfo()` -> `{name, systemId|null, systemName, goodId, goodName, ally, here, met, note}`. Tamsin hops between trade stations every 6-11 days, buying out one good where she lands and dumping the previous one (market `impact`), unless flag `rival_ally`. Docking where she is fires an event of ctx `'rival'` (author them!) or the built-in; counters `rival_met`, `rival_friend`; flags `rival_met`, `rival_ally`; cond `{rival:'here'|'ally'}`.
- Market news: `g.marketNews(sysId)` -> `[{kind:'festival'|'glut'|'shortage', title, text, goods:[ids], mult, startDay, endDay, daysLeft, active, upcoming}]` (20-day seasons, deterministic), `g.newsFeed()` for all seen systems. Prices honour the news (combined bias still clamped 0.72-1.3). Docking during a festival gives a shore-leave event once per season.
- WORLD-A specials (all 10) and crew abilities (thrifty_pantry, pen_and_ink, weather_eye, gift_of_the_gab) are implemented; `g.market().tips` (market_ear).
- Events created by the engine are "inline": the cursor stores the event object, `pendingView()` is unchanged.
- sim policies: `random` (valid actions only), `reckless` (sloppy: thin margins, rare repairs), `greedy`, `cautious`, `story` (follows nextObjective), `all`.

[EVENTS-B] Round 1 fix: +49 events in planets.js / phenomena.js / station_crew.js (now 93 from these files).
- WORLD-B: 26 new codex ids are referenced by events and NOT yet in codex.js (tests/content.test.js fails on the first until added):
  codex_frost_flowers codex_old_buoys codex_lava_glass codex_dune_script codex_glass_fields codex_deep_singers codex_canopy_lights
  codex_orchard_tractors codex_hollowell codex_crater_letters codex_ore_claims codex_crystal_bloom codex_acid_rain codex_floating_gardens
  codex_ring_ice codex_survey_stakes codex_aurora_fields codex_dust_postcards codex_sandships codex_seedling_court codex_tide_tables
  codex_cartographers_ship codex_pulsar_greeting codex_comet_tumbleweed codex_wormhole_manners codex_lantern_syntax
  (No new item ids were introduced; all items/goods/upgrades used already exist.)
- ENGINE: `fellowship_known` is now set by event `archive_heart_ledger` (landing at story system archive_heart); remove it from KNOWN_GAPS in tests/content.test.js.
- ENGINE: no condition exists for planet `life` level (none/microbial/flora/fauna/civilized). Please add `{life:'flora'}` (or array) to conds.js so scan events can vary by life level.
- ENGINE: events set/clear `distress_active` (ionstorm_stranded_packet) and set `rival_met` (station_rival_tamsin_intro); engine may also set them for its own distress/rival events.

[EVENTS-A] FIX ROUND 2: src/content/events/hazards.js (added to events/index.js): 15 authored lane hazards `lane_*`, 12 arrival vibes `arr_*`, 12 region hails `hail_r_*` (no met_<faction> gate).
- HOOK REQUEST (ENGINE): the engine has no authored hook for lane hazards. `_travelHazard` always starts SP.hazardEvent ('core_hazard'). Lane events are written as ctx 'travel', tags ['hazard'], ids prefixed `lane_`, `when:[{system:{danger:1+}}]` (some also `{system:{phenomenon:'ionstorm'|'pulsar'|'nebula'|'rift'|'comet'}}`). Please, in `_travelHazard`, first try `Events.pickEvent(this, 'travel', ...)` restricted to eligible events whose id starts with `lane_` (use Events.eligible + filter), falling back to SP.hazardEvent only if none is eligible. They carry cooldown 45-70 so the pool will not repeat within a session; the core_hazard fallback then covers the rest. They also currently fire as ordinary travel events (weighted by danger via the 'hazard' tag), so the hook is an upgrade, not a blocker.
- scan finds / landing finds / hails: `core_hail_*` still wins 45% of hails; the new hail_r_* set is picked only in the authored 55% branch.
