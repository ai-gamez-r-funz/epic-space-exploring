# CRITIC report, iteration 6 (Halcyon Reach)

Method (production build of `claude/exciting-faraday-tqbobz` @ 95eaa18, `?debug=1`): build + 110 tests; sim x50 on 6 policies; a **128-day real-UI playthrough at 844x390**
(mouse menus, number-key choices, 11 hot lanes run through the briefing modal with mouse clicks, refits/training, trade, distress, mid-game dispatch) ending with 0 console messages and 0 app errors;
a 225-row analysis of hot-lane briefing economics; set-piece reachability script; CDP precise-heap soak with forced GC; screenshots at 844x390/1280x720/1920x1080 (read); audio offline test from iteration 5 unchanged.
Evidence in scratchpad: `shots/play6.log`, `play6_*.png`, `v6_1080_*.png`, `brief6.mjs`, `lamps2.mjs`, `heap6.cjs/out`.

## Scores (I1 / I2 / I3 / I4 / I5 -> I6)

| Area | I1 | I2 | I3 | I4 | I5 | I6 | Delta | Reason |
|---|---|---|---|---|---|---|---|---|
| Visual polish | 8 | 8 | 8 | 8 | 8 | 8 | 0 | Rank title + upgrade pips on HUD, spend pill and briefing are tidy; still no standout "screenshot moment"; threads/spend pills crowd the viewscreen bottom on a docked 1080p bridge |
| Cozy feel & tone | 8 | 8 | 8 | 8 | 9 | 9 | 0 | Consistently warm and funny over 128 days |
| UI/UX clarity | 7 | 8 | 8 | 8 | 8 | 8 | 0 | Briefing modal with bonusPct, limp dialog, spend pill: clear; the "BEST" tag still always points at Creep; pill and Done button overlap in Trade |
| Onboarding | 5 | 6 | 7 | 8 | 8 | 8 | 0 | Tip on first screen no longer overlaps the label at 844x390 (`play6_061`) |
| Core loop / depth | 5 | 6 | 7 | 8 | 8 | 8 | 0 | Hot lanes now a real (small) bet; no escalating mid-game |
| Event & writing variety | 6 | 7 | 8 | 8 | 8 | 9 | +1 | 81 distinct events in 184 results, 9 distinct hot-lane chains in 11 runs (0 generic `core_hot_lane`), filler 5% |
| Upgrades & build variety | 6 | 7 | 7 | 8 | 8 | 8 | 0 | Unchanged depth; the set-piece free upgrade is unreachable (below) |
| Missions & story | 6 | 7 | 8 | 8 | 8 | 8 | 0 | 69 missions, 19 endings; headline set piece effectively unreachable |
| Economy / balance | 5 | 5 | 7 | 8 | 8 | 8 | 0 | Hot-lane trade-offs sensible; my bot was poor (3-400 scrip) through day 128; spend pill exists |
| Audio | 7 | 7 | 7 | 7 | 7 | 7 | 0 | Offline checks only |
| Technical robustness / perf | 7 | 8 | 8 | 8 | 8 | 7 | -1 | Retained heap after forced GC grows ~1 MB/day to ~110 MB (see P2); 0 errors |
| Code structure | 6 | 7 | 8 | 8 | 8 | 8 | 0 | 110 tests |

## Verdict: WOWED: NO

Counts: BLOCKER 0, MAJOR 2, MINOR 5, POLISH 2. Ten dimensions are at 8, two at 9, one at 7 (audio/never heard) and one at 7 (perf, memory growth).
Honest assessment: we are at the point of diminishing returns on content/UI polish. The game is charming, coherent, legible and stable for a 2-hour sitting. What stands between it and "FTL/Elite wow" is no longer volume
or UI but (a) one headline mid-game moment that is actually reachable, (b) a heap that grows per day, and (c) things I physically cannot verify here (audio by ear, real-GPU fps).

## Sim summary (x50)
| policy | non-loss | loss | lantern endings | endings seen |
|---|---|---|---|---|
| random | 0% | 98% | 0% | recalled |
| reckless | 70% | 30% | 68% | keeper 18, hush 8, silent 8, recalled 15 |
| greedy | 98% | 2% | 98% | keeper 30, silent 10, hush 9 |
| cautious | 86% | 14% | 62% | keeper 15, beloved 10, hush 9, silent 7, recalled 7, rival_friend, choir |
| story | 100% | 0% | 100% | keeper 25, silent 14, hush 11 |
| explorer | 100% | 0% | 100% | keeper 27, hush 12, silent 10, friend 1 |
Ending variety is healthy. Stakes now close to the target on cautious (14% loss; reckless 30%). Never-fired: 11-24 per policy including **`setpiece_night_of_lamps` in every competent policy**.

## Status of iteration-5 items

| ID | Status | Evidence |
|---|---|---|
| P1 generic hot lane | FIXED | 11 hot lanes in my run: 9 distinct authored chains (stalled_convoy 8 beats, lost_beacon 8, signal_wash 7, dust_squall 6, comet_ice/derelict_maze/dust_shoals/gravity_washboard/ragged_lane 4 each); **0 `core_hot_lane`** |
| P2 creep dominant | MOSTLY FIXED | Briefing now shows bonusPct: creep -25% bounty, 71-85% odds (fail costs hull 6-13 + fuel + a day); run +20% at 10-28%; brace 0%. Expected hull per beat: creep 0.9/2.2/3.8, brace 5.1/8.0/12.4, run 7.9/13.3/18.9 (danger 1/2/3). Creep is still the "BEST" pick at every danger (225/225 rows) but it is no longer free; a bold play is a legitimate gamble, not a trap |
| P3 "Captain Captain" | FIXED | HUD and end screen read "Capt. Rhea Okonkwo" / "Captain Rhea Okonkwo" |
| P4 limp departure | NOT EXERCISED | `departureCheck` + "LIMPING OUT OF PORT?" modal with Free patch-up/Repairs/Stay/Depart wired (GalaxyMap.js:274-287); my bot never fell below 63% hull so I did not see it fire in the UI; code read only |
| P5 heap growth | **CONFIRMED, NOT FIXED** | Precise CDP heap (844x390, API-driven jump+scan loop, forced GC): 12.9 MB (day 1) -> 33.6 (d20) -> 53.9 (d40) -> 75.1 (d62) -> 92.5 (d84) -> 111.5 (d104) -> 106 (d125); raw without GC 19 -> 153 MB. About 1 MB retained per in-game day, not the log (state.log 30 -> 170 entries). UI agent's flat 16 MB did not reproduce under a jump-heavy loop; my play6 UI run showed performance.memory 37 -> 81 -> 123 MB over 128 days |
| P6 phone readability / pills | PARTIAL | Rank + pills visible at 844x390; text still small but legible; tip no longer overlaps (`play6_061`) |
| P7 filler | FIXED | 9 `core_*` of 184 results (5%): `core_hail_quillari` 3, `core_scan_find` 3, `core_festival` 2, `core_midgame` 1; 81 distinct events |
| P8 tip overlap | FIXED | |
| Set piece | **BROKEN (new MAJOR)** | see below |
| Spend pill | FIXED | `v6_1080_trade.png`: "Spend scrip: Commission - Heirloom Cabinet (1500) @ this station" banner in Trade; overlaps the Done button |
| HUD ranks | FIXED | "Survey Cutter" + pips shown on the HUD (`v6_1080_docked.png`) |
| 'b' hotkey / hotkey leak | NOT RE-CHECKED | no regressions seen |
| Audio | OK (offline only) | |

## New / remaining defects

### MAJOR
- **P1 MAJOR / ENGINE+EVENTS** The set piece "The Night of a Thousand Lamps" is effectively unreachable. Repro `lamps2.mjs`: accept `m_setpiece_night_of_lamps` from any board (offered from day 12) and arrive at Pennywhistle 10 times; `setpiece_night_of_lamps` fired in only 1 of 10 seeds. Zero firings in 300 competent sim runs. Likely the `ctx:'arrive'` event loses to the engine's higher-weight arrival pool or its `when` (`system.story === 'pennywhistle'` plus mission active) misses when the mission is accepted after the system was first visited. The free-upgrade gift, the codex entry, the mission's o2 objective and the "turning point" never happen. Fix: fire the set piece deterministically on first arrival at Pennywhistle with the mission active (via `startEvent` in `_arrive`), bypassing pick weights; add a sim assertion.
- **P2 MAJOR / ENGINE+GFX (technical)** Memory retention ~1 MB per in-game day (see P5 above), reaching ~110 MB after 100 days and 150 MB raw. A 4-hour session could approach 200+ MB on mobile. Likely culprits: per-system scene/art/texture bakes cached for every visited system (planet bakes, `sceneArt` render textures), or listener/closure retention per scene enter. Fix: release baked textures on scene exit (LRU of 6), add `leak.cjs`-style regression to tests/e2e measuring post-GC heap after 60 jumps.

### MINOR
- **P3 MINOR / UI** In the dock-time Trade overlay the spend banner runs under the "Done" button; on the docked Bridge at 1080p the tip card and threads pills crowd the viewscreen bottom. 
- **P4 MINOR / ENGINE** "BEST" always labels Creep (225/225 rows); consider labelling by net expected value vs bounty, or showing "Bold pays +20%" on the best-EV bold option when the hull is healthy.
- **P5 MINOR / EVENTS** 11-24 never-fired events per policy remain (`rival_vell_prank`, `rival_vell_dock_sighting`, `crew_low_morale_lounge`, `archive_heart_ledger`, `dist_*` x4, `scan_lava_*` x3, `scan_toxic_ruin`, `scan_desert_obelisk`, `lane_hot_wormhole_swell`).
- **P6 MINOR / ECONOMY** My UI bot was at 3-400 scrip for 128 days while holding 9 spend actions; sim bots end with 6-8k. Income feels thin for a non-trading human; the pill helps, but a first refit at ~day 20 is hard to afford.
- **P7 MINOR / QA** Limp dialog and free patch never observed running in a real session; audio never heard; GPU fps never measured.

### POLISH
- **P8** Mid-game dispatch is still a dialog with +250 scrip. **P9** `core_hail_quillari` fallback appears 3 times in one run.

## What delights
- A living hot-lane lane-board: 9 different authored runs in 11 attempts, each with its own text and consequences ("stalled convoy", "lost beacon", "signal wash").
- Briefing modal with bonus percentages and a "Worth the bounty with this hull." line; a rested-crew +4% odds modifier is listed.
- HUD rank "Survey Cutter" with upgrade pips; spend pill pointing at an actual purchase.
- 184 resolved events in 128 days with 81 distinct ids and 5% filler: no staleness.
- Zero console warnings/errors over 128 days.

## Remaining changes (diminishing returns; in priority order)
1. **Fix the set piece trigger (ENGINE).** Make `setpiece_night_of_lamps` fire deterministically at Pennywhistle when its mission is active; add a regression test.
2. **Fix the per-day heap growth (GFX+UI).** Release per-system bakes/textures on scene exit; add a post-GC heap regression to tests/e2e.
3. **Verify limp dialog end-to-end (UI QA)** with a hull<25% playthrough, and fix the Trade-banner/Done overlap.
4. **A real-hardware pass (QA)**: listen to the music/sfx, trace fps on a GPU, test touch on a phone. These are the only dimensions I cannot score above 7.
5. **Optional polish** if more iterations are wanted: a second set piece around day 90, wire the last ~10 never-fired events, label "BEST" by EV.
