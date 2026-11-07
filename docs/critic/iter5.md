# CRITIC report, iteration 5 (Halcyon Reach)

Method (production build of `claude/exciting-faraday-tqbobz` @ b78dd80, `?debug=1`): build + 105 tests, sim x50 on 6 policies, a **105-day real-UI playthrough** at 844x390 with mouse menus, number-key choices,
hot lanes, refits, training, trade, distress, the mid-game dispatch and a final recall ending (end-of-run console/app dump captured: 0 console messages, 0 app errors), a separate real-UI check of the hot-lane
briefing modal at 1280x720, a hot-lane sampling script (8 seeds), audio offline test, screenshots at 844x390/1280x720/1920x1080 (read). Evidence: scratchpad `shots/play5.log`, `play5_*.png`, `hl_1280_brief.png`, `play5_end.png`, `hot5.mjs`.

## Scores (I1 / I2 / I3 / I4 -> I5)

| Area | I1 | I2 | I3 | I4 | I5 | Delta | Reason |
|---|---|---|---|---|---|---|---|
| Visual polish | 8 | 8 | 8 | 8 | 8 | 0 | Briefing modal, region props, reward chips are polished; phone-size text and HUD still tiny; no new wow |
| Cozy feel & tone | 8 | 8 | 8 | 8 | 9 | +1 | Voice, humour and warmth are consistent across 303 events; stakes (hull 0 recall) are delivered gently |
| UI/UX clarity | 7 | 8 | 8 | 8 | 8 | 0 | Hot Lane Briefing is excellent; legend now lists hot lanes; "Captain Captain" on the end screen and tiny phone text remain |
| Onboarding | 5 | 6 | 7 | 8 | 8 | 0 | Unchanged and good (tips, threads, objective strip). Threads pills are hidden at 844x390 |
| Core loop / depth | 5 | 6 | 7 | 8 | 8 | 0 | Hot lanes now have a decision UI, but the "Creep" option is 100% / 0 hull each beat so the optimum is a free toll |
| Event & writing variety | 6 | 7 | 8 | 8 | 8 | 0 | 303 events, 78 single-node (26%), 34/43 hails repeatable, 12 authored hot-lane chains, but the generic `core_hot_lane` still fires in many hot lanes |
| Upgrades & build variety | 6 | 7 | 7 | 8 | 8 | 0 | 108 upgrades, 7 refits, 6 training, rotations; my bot bought 4 refits + 6 trainings |
| Missions & story | 6 | 7 | 8 | 8 | 8 | 0 | 69 missions, 19 endings, mid-game dispatch (patron choice, ~day 50), Lantern chain strong; midgame beat is a dialog with +250 scrip, not a turning point |
| Economy / balance | 5 | 5 | 7 | 8 | 8 | 0 | Spending exists and bites; sim bots still end with 6-8k |
| Audio | 7 | 7 | 7 | 7 | 7 | 0 | Offline test ALL CHECKS PASSED; not heard |
| Technical robustness / perf | 7 | 8 | 8 | 8 | 8 | 0 | 105 days: 0 console, 0 app errors; heap 33 MB -> 77 MB unexplained (no forced GC); fps unmeasurable here |
| Code structure | 6 | 7 | 8 | 8 | 8 | 0 | 105 tests, clean modules |

## Verdict: WOWED: NO

Counts: BLOCKER 0, MAJOR 2, MINOR 6, POLISH 3. This is a very good cozy game: charming, coherent, stable, with a legible risk UI and real spending. It is not yet FTL/Elite-class.
Eleven dimensions sit at 8 and one at 9; the two things that hold it back are that the signature risk mechanic is solved by one always-safe option (and is still often the old generic text), and that nothing in the
first 100 days makes you say "wow" (no climactic set piece, no dramatic ship transformation).

## Sim summary (x50)
| policy | non-loss | loss | lantern endings | notes |
|---|---|---|---|---|
| random | 0% | 98% | 0% | |
| reckless | 64% | 34% | 62% | keeper 19, silent 9, hush 3 |
| greedy | 94% | 4% | 94% | keeper 24, silent 12, hush 11 |
| cautious | 96% | 4% | 74% | hush 16, keeper 15, beloved 11, silent 6 |
| story | 100% | 0% | 100% | keeper 30, silent 10, hush 9 |
| explorer | 100% | 0% | 100% | |
Ending variety is now real (silent no longer dominates). Never-fired events: 11-17 on competent policies (`rival_vell_prank`, `crew_low_morale_lounge`, `station_archive_etiquette`, `station_festival_callback`, `travel_meteor_picnic`, `archive_heart_ledger` in cautious, ~5 `scan_*`, ~4 `dist_*`).

## Status of iteration-4 items

| ID | Status | Evidence |
|---|---|---|
| N1 hot lane generic template | PARTIAL | 12 authored `lane_hot_*` chains exist and fired (dust_shoals, asteroid_slalom, comet_ice_run in my run), but `core_hot_lane` still fires for many lanes: 3 of 8 hot-lane chains in my real run (day ~11, ~50, ~94) used the identical old text; sampling 8 seeds x ~40 hot jumps gave `core_hot_lane` beats 164 vs authored ~96 (about 65% of chains). Authored chains are region-gated; Gate Shallows lanes (the earliest) all fall back to the generic one |
| N2 hot lane = stat tax | PARTIAL | Briefing modal (per-beat odds, clean/expected/worst, armour line, crew/training/upgrade note) fixes legibility; but "Creep through" is 100% / 0 hull on all three beats for -2 fuel and 1 day each, tagged BEST: the lane is a risk-free 105 scrip toll |
| N3 legend/bulletin | FIXED | "Hot lane (bounty run)" in the legend |
| N4 tip overlap | NOT FIXED | Tip card still sits over a planet label on the first Bridge view |
| N5 spend nudge | NOT VERIFIED | `spendHints` is wired (threads.js:46) but I never saw the pill in a screenshot; my bot sat on 400-1100 scrip repeatedly |
| N6 generic fallbacks | NOT FIXED | 8 `core_*` (scan_find 5, hail_concord 2, festival 1) of ~95 non-hot-lane results = 8% |
| N7 service prices | NOT RE-CHECKED | |
| N8 silent default | FIXED | endings spread across keeper/silent/hush/beloved |
| N9 phone text | NOT FIXED | 844x390 body text still ~7-8 px (`play5_003`), threads pills disappear |
| N10 schematic/tab clip | NOT RE-CHECKED | |
| N11-N12 | NOT RE-CHECKED | |
| Mid-game turning point | PARTIAL | `core_midgame` "The Dispatch from Meridian" fires ~day 50 with a 3-way patron choice (+250 scrip, rep) |
| archive_heart_ledger | PARTIAL | fires in some policies, still absent in cautious |
| Audio sanity | OK | offline soak: 661 voices started / 642 ended, no errors |

## New / remaining defects

### MAJOR
- **P1 MAJOR / EVENTS** Generic hot-lane template still carries a large share of hot lanes (see N1). Fix: remove the fallback to `core_hot_lane`: add 4 region-neutral authored chains (Gate Shallows / Shoals / generic deep) so every region has >=3, and let the pool pick any chain when none match the region.
- **P2 MAJOR / ENGINE+DESIGN** The briefing makes the dominant strategy obvious: "Creep through" has 100% odds and 0 hull on every beat at every danger level I saw, tagged BEST. Therefore no hull is ever at risk unless the player chooses to be. Fix: make creep carry a real cost (a 10-20% fail chance at danger >= 2, or -1 morale per beat, or +1 supply), and make bold options pay more (bonus +30-60% for full-run, curio only for bold) so the briefing is a genuine bet.

### MINOR
- **P3 MINOR / UI** End screen header reads "Captain Captain Ada Merriweather" (`play5_end.png`); the HUD fix was not applied here.
- **P4 MINOR / ENGINE** My bot departed with hull 10 and fuel/supplies at 1/3 and was recalled at hull 0 with 1,107 scrip unspent. A "limping" warning/confirm before departing at hull <25% with scrip in hand would prevent the one genuinely sad outcome.
- **P5 MINOR / PERF** JS heap rose 33 MB -> 77 MB between day ~60 and ~80 without a forced GC (earlier 4-round leak loop was flat). Re-run `leak.cjs --expose-gc` after 100 in-game days to rule out a log/event-history leak (state.log growth, toast/queue arrays).
- **P6 MINOR / UI** At 844x390 the readability scaling had no visible effect and the Threads pills (rival + Lantern) vanish, removing the only live-story hook on phones.
- **P7 MINOR / EVENTS** Still 8% engine fallback texts (`core_scan_find`, `core_hail_*`, `core_festival`) and 11-17 never-fired events.
- **P8 MINOR / UI** Tip card overlaps a planet label on first view.

### POLISH
- **P9** Bot logs show `dockBulletin()` returns an object (not an array) - fine, but the Trade-header bulletin line is tiny. **P10** `core_midgame` choice outcome is mostly +250 scrip/rep; give it one persistent visible change (ship paint, crew arrival, new region lane). **P11** Hot-lane events use one scene art ("asteroids") irrespective of chain.

## What delights
- The Hot Lane Briefing: per-beat odds, clean/expected/worst cost, armour line, and "Worth the bounty with this hull." in a purple modal is the best piece of risk UI in the game.
- Ending variety (19 endings) and the mid-game patron dispatch with a Quillari glass-fruit toast.
- A gentle recall instead of a game over: "Halcyon limps into the tow-line of a Meridian tender, creaking and apologetic".
- Authored lane events ("A Gravity Eddy in a Mood"), scan finds ("Gwen" the warm-patch flower), picnic beneath the aurora, weather balloon: the world keeps surprising for 100 days.
- Zero errors across a 105-day session.

## Top remaining changes to reach WOWED (ordered)
1. **Make hot lanes a real bet (ENGINE+EVENTS).** Give "creep" a cost or a chance of failure at danger >= 2; give bold plays a bonus; fill every region with authored chains and delete the generic fallback.
2. **One unforgettable set piece before day 60 (EVENTS+GFX).** A hand-built, spectacular encounter (e.g. a Lantern-lit convoy through a pulsar, with a bespoke full-screen viewscreen and music cue) that changes the ship or map; the day-50 dispatch is a dialog, not a moment.
3. **Persistent, visible progress on the ship (UI+GFX).** Refits/training/upgrades should visibly change the Halcyon (paint, lights, crew on the bridge) and the Threads strip, so growth is felt on every screen.
4. **Phone-grade readability (UI).** Real 12 px minimum at 844x390, keep Threads pills, enlarge the bulletin line; remove duplicated tip/objective overlays on small screens.
5. **Close the loop on never-fired and filler content (EVENTS).** Wire the 11-17 never-fired events; replace `core_scan_find/core_hail_*/core_festival` fallbacks with authored variants.
6. **Spending pull (UI+ENGINE).** Verify the spend pill appears; add "commission ready" and "refit available here" cues on the dock screen so money never sits at 1,000+.
7. **Soak and hardware pass (QA).** 200-day heap soak with forced GC, real-GPU fps trace, listening pass for audio.
8. **Departure guard (ENGINE+UI).** A "limp warning" at hull < 25% and a one-time free Meridian repair so the sad ending is only for the reckless.
