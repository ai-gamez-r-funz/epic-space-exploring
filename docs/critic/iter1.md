# CRITIC report, iteration 1 (Halcyon Reach)

Method: build, 63 unit tests, sim x3 policies (+rigorous/cozy variants), own economy-exploit scripts via the Game API,
and a real Playwright session (production build via `vite preview`, chromium/SwiftShader): title -> new game -> intro -> bridge ->
chart -> jump x ~25 -> scan -> land -> hail -> dock -> trade -> shipyard -> crew -> missions -> Lantern 1 -> retire/end screen, 76 in-game days
through the UI (event choices via keys 1-9). Screenshots + driver log: scratchpad `shots/play1_*.png`, `shots/play1.log`,
`shots/tour*.png`, `shots/rob_*.png`, `shots/end_c.png`. Viewports checked: 1280x720 (main), 1920x1080, 844x390, 390x844.

## Scores (1-10, 10 = FTL/Elite-class wow)

| Area | Score | One-line reason |
|---|---|---|
| Visual polish | 8 | Genuinely lovely procedural art, event viewscreens, portraits, warp; marred by label collisions, overlapping schematic, inconsistent bar colours, a "?" icon |
| Cozy feel & tone | 8 | Writing voice is charming and consistent, zero violence, tea/forms/kettle humour; but a risk-free sandbox is cozy-by-absence, not cozy-by-design |
| UI/UX clarity | 7 | Excellent trade/ship/crew/log screens and hotkeys; orbit/scan trap, swallowed clicks, toasts covering modal tabs |
| Onboarding | 5 | Tutorial step 1 is silently consumed during the Intro, tip bubble overlaps the panel it explains, scanning trap is un-signposted |
| Core loop / gameplay depth | 5 | Jump-scan-hail-dock is smooth but there is no pressure, no loss, no build-defining decision, scans are narratively silent |
| Event & writing variety | 6 | 87 events, good lines, but 49 are single-node, ~22% of what I saw was single-button filler, hail pool dries up after 2 uses |
| Upgrades & build variety | 6 | 65 upgrades in 8 branched slots is a real tree; but with permanently full tanks/100 hull they never feel needed |
| Missions & story | 6 | 36 missions + 5-chapter arc is nicely pitched; one main-arc mission is uncompletable, 2 more never appear, arc endings reached by <=21% of bots |
| Economy / balance | 5 | No exploit loop found (good), but also no scarcity: 0% loss at every difficulty, morale/hull pinned at 100 |
| Audio | 7 | Generative music (10 moods) + 23 sfx, offline soak test clean, no clipping (peak 0.5). NOT audible-verified by me: score is structural |
| Technical robustness / perf | 7 | No leak, save/load solid, error boundary, offline. Unmeasurable fps (SwiftShader ~3.7 fps, JS 0.5 ms/frame), Pixi warnings, TLA build warning |
| Code structure | 6 | Clean core/content/ui split, 63 tests; but dead code, mocks in prod bundle, README is a false stub, dev hooks exposed |

## Verdict: WOWED: NO

Not a single area reaches 9 and there are 7 MAJOR defects. Counts: BLOCKER 0, MAJOR 7, MINOR 14, POLISH 6.
The game is already a very handsome, funny, stable toy. It is not yet a game with stakes: FTL's tension and Elite's
"I want that upgrade so I can reach that place" pull are both absent.

## Technical findings (evidence)

- `npm run build`: succeeds, 1.7 MB dist, main chunk 309 kB (106 kB gz), no external network URLs, `base './'`. One warning
  `[TOLERATED_TRANSFORM] Top-level await is not available in the configured target environment` at `src/core/content.js:84`
  (the `await Promise.all([tryImport(...)])` block) because `vite.config.js` targets `es2020`. Diagnosis: the TLA is shipped as is and works only on
  browsers with TLA support (Chrome 89+, Safari 15+, FF 89+); older ones fail to parse the whole `game-*.js` chunk. The dynamic-import/try-catch
  machinery exists only so content could be missing during parallel development; in production it can silently swallow a broken content file.
- `npm test`: 63/63 pass (KNOWN_GAPS allow-list still hides the fellowship_known bug).
- sim 100 runs: random 100% timeout (never engages, 95% tow), greedy 98% non-loss / avg 302 d / 25 missions, cautious 100% non-loss / 228 d.
  Rigorous difficulty: cautious 100% non-loss, greedy 100% non-loss, loss endings 0.0% everywhere. Endings: cautious wanderer 85, beloved_by_all 9,
  lantern_* 5, merchant_prince 1 (per 100); greedy wanderer 47, beloved 30, lantern_* 21.
- Economy: scripted best-pair arbitrage (full-info, 16 cargo): max profit/unit 47-53 scrip, a naive A<->B loop with refuel lost money
  (impact + fuel + days). Investigate x25, hail x25, landing x4/planet, rest 100 d: no income (investigate/landing capped by "Already studied"/landed flags).
  Hire/sell upgrade is 50%. No exploit found. (The flip side is C4.)
- Memory: 40 rounds of open/close Ship/Crew/Log/Codex/Dock/Trade + map<->bridge: JS heap flat at 26 MB, scene nodes constant 574, GPU textures plateau 250 (139 at start), overlays 0. No leak.
- FPS: environment is software GL (bare WebGL clear = 6 fps here), so frame rate is not measurable. Measured instead: JS per frame 0.36-0.57 ms (bridge/map/event), ~150 GL draw calls/frame,
  no filters used. Expect fine on real GPUs; unverified.
- Save/load: autosave on dock, page reload -> Continue restores day/credits/docked/rep exactly. Corrupt saves (`{`, null, missing ship/crew, v:99) all return null cleanly.
- Robustness: 40 random clicks + Esc spam, hidden-tab visibilitychange, resize 844x390 / 390x844 (rotate overlay) / 1920x1080 / 800x600: zero app errors. Esc/C/Enter while an event is pending cannot dismiss it. Good.
- Console: Pixi warning `[BindGroup] a 'textureSource' was destroyed while still bound to a shader` fired 18x in the 76-day session (not reproduced by single-feature probes). Otherwise clean.
- End screen: with 26 systems/62 worlds/12 missions the rows sum exactly to the total (5,510 = 2600+1550+60+480+100+130+190+400). The "208 vs 248" mismatch is not reproducible; the "Other flourishes" reconciliation row did not appear.
- Builder claims: `crew_low_morale_lounge` DOES fire (304 hits in 40 seeds when morale<45 and crewTalk is used; the sim simply never calls crewTalk/rest, same for the 5 `idle_*` events). `fellowship_known` is a real bug (C3).
  Mission Board/Done/Hire tabs work; Shipyard install (confirm modal) and sell (+110, "Keep it/Sell") work; Trade has CHEAP/DEAR % hints (no per-route profit hint). Bridge sidebar stale-cache: not reproduced.

## Defect list (prioritised)

### MAJOR

- **C1 MAJOR / UI** Tutorial step 1 ("Open the Chart") is consumed during the Intro. `src/ui/overlays/parts2/tutorial.js:11` has `done: (g, sc) => sc !== 'Bridge'`; while the Intro/fade scene is active with a live game, `update()` treats it as done and advances. Repro: New Voyage -> Launch -> Skip -> Bridge: `localStorage['halcyon.tutorial']` is already `step:1`, no bubble on the Bridge (`shots/04_bridge.png`). A first-time player gets no hint at all on the first screen. Fix: `done` only when `sc === 'GalaxyMap'` (and only after the Bridge was seen); suspend the tutorial outside Bridge/GalaxyMap.
- **C2 MAJOR / UI** Orbit trap. `src/ui/scenes/Bridge.js:164-168` `_planetTarget()` prefers `state.orbit` over the clicked planet. After scanning planet A (auto-orbit), selecting planet B shows B's details but Scan/Land act on A, and the Scan button is disabled with the wrong reason "That planet is already scanned" (l.179) (`shots/play1_005_scan_Anchorage_III.png`). Players must discover "Leave orbit first". Fix: clicking another planet should auto-leave/re-target orbit; or prefer the selection when it is set; fix the reason text.
- **C3 MAJOR / EVENTS+WORLD** `fellowship_known` is read (`story.js:313`, `missions.js:152,162`) but set nowhere (`tests/content.test.js:223` allow-lists it). Effects: `m_ch3_ledger` ("The Fellowship Ledger", Main story, 700 scrip + fellowship_token) can be accepted but never completed; `m_ch4_tessitura` is never offered; `m_secret_fellowship_token` is unreachable; the `open_sky_fellowship` codex payoff is lost. Chapter 3 still completes through `lantern_3`, so the arc itself is not blocked. Fix: `{flag:'fellowship_known'}` in the Marginalia/Heart-Vault event or in `m_ch3_ledger` onComplete (and make the objective an `event`/`goto` type); delete the allow-list entry.
- **C4 MAJOR / ENGINE+WORLD** There is no tension and almost no way to fail. Sim: loss endings 0.0% at cozy/standard/rigorous for every competent policy; in the 76-day UI run (auto-refuel at stations) fuel stayed 34-39/40, supplies 22-39, hull 91-100, morale 100 from day ~30, credits never mattered. Consequences: upgrades (8% fuel, +1 science) have no pull, `crew_low_morale_lounge`/"relief" events never trigger naturally, "failure is interesting" is untestable. Fix: real pressure curve: costlier fuel/supplies away from the Gate, 2-3 genuine detours/emergencies per 10 days (hazard travel events with a real trade-off, a stranded-rescue loop, morale decay that needs the lounge), fuel max/jump cost tuned so a 5-jump trip without the Eco/Trimmer tier is uncomfortable; scale rewards so a first big upgrade (600+) is a goal in days 20-30.
- **C5 MAJOR / EVENTS** Event pool too thin and shallow. 87 events but 49 have a single node and 36 have two; 3-node events: 2. Contexts: planet 4, arrive 8, landing 10, hail 10 (8 are `once`), crew 5. In my run ~22% of events were single-button built-ins ("A Polite Silence" 7 times, "Boots on the Ground" 3x, "Careful Observations"); `scanPlanet` produces only a toast. Tags: persuade 5, flee 6, hazard 7 vs comedy 38 / wonder 46: the resolution-style variety the contract asks for is skewed. Fix: +40 events, esp. hail (repeatable per faction x 4 each), planet-scan finds, hazard/flee/persuade, and 3-4-node chains with consequences carried by flags.
- **C6 MAJOR / ORCHESTRATOR** `README.md` is a 5-line stub that says "Uses Three.js" (the game is PixiJS v8) and has no run/build/test instructions, controls, or content overview. Fix: real README (install, `npm run dev/build/test/sim`, structure, controls, credits, licence).
- **C7 MAJOR / ENGINE+EVENTS** The main arc is rarely finished. Greedy bots reach a `lantern_*` ending in 21% of runs, cautious in 5%; 85% of cautious runs fall through to the default `wanderer`. Chapter gates (survey 15/35/50/65% + `archive_key`) plus the dead C3 mission mean a normal player may never see the answer to "who lit the Lanterns". In my run the first Lantern appeared day 31, the second after day 60, with no clear pointer to the next one. Fix: a visible arc tracker (Log > Active "Main story" pinned with the next target), lower gate thresholds, and make `retire` early produce a story-flavoured ending instead of `wanderer`.

### MINOR

- **C8 MINOR / UI** Toast layer sits above modals and covers the tab row: "Codex: The Concord of Lyra" hides the Hire/Done tabs and the title (`shots/tour_crew.png`, `shots/tour_log.png`). Fix: move toasts below the overlay layer or shift them down while a modal is open.
- **C9 MINOR / UI** Clicks are silently swallowed: Launch ignored for ~1.2 s after the NewGame fade; first click on the Crew "Hire" tab did nothing (`Input.clickGuard`, `src/ui/kit/input.js:112`). Fix: shorten the guard, or queue the click.
- **C10 MINOR / UI** HUD prints "Capt. Captain Julian Ostrander" (`shots/04_bridge.png`): default name already contains "Captain". Strip the prefix in the HUD or in the name generator.
- **C11 MINOR / GFX** `PixiJS Warning: [BindGroup] a 'textureSource' was destroyed while still bound to a shader` x18 in a 76-day run. Some baked texture is destroyed during a scene/system change while still on a sprite. Find with `Texture.destroy` calls in `src/gfx/{planets,scenes,space}.js` and scene `destroy()`; detach before destroy.
- **C12 MINOR / ENGINE** Build warning `TOLERATED_TRANSFORM` `src/core/content.js:84`. Replace the dynamic `tryImport` + TLA with static imports (`export const C = ...` built synchronously), or raise `build.target` to `es2022`. Don't swallow module errors in production.
- **C13 MINOR / UI** The tip bubble covers the info it points at: map Navigation panel (Distance/Fuel/Travel lines hidden, `shots/06_map_sel.png`), the bottom log line and crew list on the Bridge. Place it outside the panels or collapse after first view.
- **C14 MINOR / UI+GFX** Label collisions: planet label "Hearth of Vell-Aroon IV 'Quiet Rock'" over station label "Drydock Docks" (`shots/play1_069_*.png`); "Wormhole" over Anchorage I at 1920x1080; the long system name in the HUD status strip wraps past the strip edge ("HEARTH OF VELL-AROON"). Also the tautology "Drydock Docks". Fix: collision-nudge labels, ellipsise HUD name, name generator.
- **C15 MINOR / UI** Ship schematic (`Ship & Upgrades`): Halcyon art overlaps the COMMS/HULL slot nodes and the lantern finial pokes out of the panel frame behind the "SCHEMATIC" title (`shots/tour_ship.png`). Scale to ~0.8 and push the slot ring outward.
- **C16 MINOR / UI+GFX** "Undock" command button shows a "?" icon (missing icon name) (`shots/09_dock.png`).
- **C17 MINOR / WORLD** Start crew has Piloting total 1 and nobody hireable at the start station (all pool crew rep-locked at 5-15), so early `flee`/piloting checks sit at 17% ("Fly the ring lanes [17%]"). Give a start-station pilot at low rep gate or +1 piloting start.
- **C18 MINOR / EVENTS** Payoffs are thin: Lighthouse Keeper success = "Nothing changes hands. The moment passes quietly."; First Lantern = a codex line only; many events pay +10..25 scrip. Wonder beats should unlock something (an item, a lane reveal, a hull trait).
- **C19 MINOR / UI** Dead/unwired code: `src/ui/overlays/Stubs.js` (150 lines, unreferenced), `Prefs.shake` has no consumer (Settings toggle does nothing), `KitDemo` scene and `dev/mocks/*` are bundled (`services.js` imports mocks), `?quick=1`, `?scene=KitDemo` and `window.__halcyon` are live in production.
- **C20 MINOR / UI** Phone landscape (844x390): everything fits but body text renders at ~8-9 px, below comfortable reading; canvas renders at 1x then CSS-scales (soft at 1080p and on HiDPI). Add a "larger text" default on small screens / render at devicePixelRatio.
- **C21 MINOR / ENGINE** `tools/sim.mjs` never uses rest, crewTalk, shipyard or crew hire, so "never fired" lists are misleading (idle_*, crew_low_morale) and balance claims ignore upgrades. The random policy never plays (100% timeouts, 95% tow), so "random <= 40%" is vacuous.

### POLISH

- **C22 POLISH / UI** Bar colours differ between HUD (fuel teal, supplies yellow, hull green, morale pink) and the event dialog (hull blue, fuel orange, supplies green, morale pink).
- **C23 POLISH / GFX** Event art mismatches text: "barren ridge" landing scene shows a ringed Earth-like planet in the sky; "station" art is a molecule-like cluster (`shots/08_event2.png`).
- **C24 POLISH / EVENTS** The Concord "forms in triplicate" joke recurs 4 times in the first 30 days (Form 1-A, Form 77-B, Form 27-B, Customs manifest in triplicate). Rotate gags per faction.
- **C25 POLISH / UI** Jump sequencing: arrival toasts ("The Concord planted a flag...", Codex) pop over the warp animation before arrival (`shots/07_jump_a.png`).
- **C26 POLISH / ENGINE+UI** Legacy bonus written by two code paths (`core/save.js:106 recordLegacy` and `EndScreen.js:16 writeLegacy`); currently guarded, but a duplicated rule.
- **C27 POLISH / UI** Map: the Navigation panel for an unexplored system says nothing useful (no hint of faction/region/danger), and the opening chart shows 3 dots in a big void; zoom to fit known systems.

## What delights

- The event dialog: viewscreen art + portrait + crew-lends-a-hand odds + typewriter text + SUCCESS/odds badge (`shots/08_event2.png`, `play1_008_*`). It is the best-looking part of the game.
- Voice: "The Concord planted a flag, a fern, and a filing cabinet", "a jar of pickles has become a jar of slightly different pickles", the Lighthouse Keeper, CD-9 ("I will now seek a hobby"), Gus-7. Genuinely TOS-wry and zero combat.
- Trade screen: stock, CHEAP -8% / DEAR +42% hints, buy/sell with +/-/1/5/Max, faction "likes this" notes, repair & refuel tab (`shots/10_trade.png`).
- Ship & Upgrades with branches ("Explorer branch"), lock reasons, live stat preview, mission-reward badges; Crew Coverage matrix with "Gaps are good reasons to hire".
- End screen with an itemised animated score that sums correctly, rank and legacy bonus.
- Hotkeys everywhere, visible key badges, rotate-device overlay, error boundary ("kettle on"), solid save/load, no external deps, reduced-motion pref honoured.
- Warp animation and the Lantern art.

## Top 10 changes that would most raise the score

1. Build a pressure curve (C4): scarcity of fuel/supplies away from hubs, hazards with trade-offs, morale decay, so upgrades and trade matter and failure is a story.
2. Fix the tutorial (C1) and the orbit/scan trap (C2) so the first two minutes work; add a pinned "next objective".
3. Double event depth: +40 events, repeatable hails per faction, scan discoveries, 3-4-node chains with flag-carried consequences (C5, C18).
4. Fix `fellowship_known` and make the Lantern arc legible and reachable (C3, C7); add story-flavoured early endings.
5. Make upgrades build-defining: tradeoff upgrades (e.g. +cargo but -speed, a "specialist hull" that unlocks event options), 2-3 that change gameplay, visible "you need X for event Y" teasers.
6. Make every action produce a micro-reward or a micro-story (scan finds, landing outcomes with items, wonder = unlock).
7. Add 2 or 3 "set-piece" repeatable systems, FTL style: a distress-beacon sector with timed choices, a rival free-trader running the same route, a seasonal festival market that changes prices (Elite's living galaxy).
8. Real README and production hygiene (C6, C12, C19): static content imports, remove dead code/dev hooks, es2022 target.
9. UI polish sweep: toast layering (C8), click guard (C9), label collisions (C14), schematic (C15), "?" icon (C16), tip placement (C13), bar colour consistency (C22).
10. Extend the sim: policies that rest/talk/buy/hire and a "story-seeker" policy, then tune with the results (C21), and add a Playwright smoke test to the repo.
