# CRITIC report, iteration 7 (FINAL) - Halcyon Reach

Method: production build @ fb575fc, `?debug=1`; 112 tests; sim x50 x 6 policies; 126-day real-UI playthrough (844x390); CDP precise-heap 122-day soak with forced GC;
set-piece and limp dialog driven through the real UI at 1280x720; briefing analysis (225 rows); 1920x1080 and 844x390 screenshots read; audio offline test.

## Scores (I1 ... I6 -> I7)

| Area | I1 | I2 | I3 | I4 | I5 | I6 | I7 | Delta | Reason |
|---|---|---|---|---|---|---|---|---|---|
| Visual polish | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 0 | Set-piece viewscreen, rank/pips, briefing are handsome; still no single jaw-dropper, 844x390 HUD is tiny |
| Cozy feel & tone | 8 | 8 | 8 | 8 | 9 | 9 | 9 | 0 | Warm, witty, consistent across 126 days |
| UI/UX clarity | 7 | 8 | 8 | 8 | 8 | 8 | 9 | +1 | Briefing, spend pill, limp dialog, rank HUD all work; banner overlap fixed; copy repeats in the limp text and the set-piece gift choices show no stats |
| Onboarding | 5 | 6 | 7 | 8 | 8 | 8 | 8 | 0 | Good; unchanged |
| Core loop / depth | 5 | 6 | 7 | 8 | 8 | 8 | 8 | 0 | Hot lanes are a real bet, a set piece exists; the mid-game is still mostly the same loop |
| Event & writing variety | 6 | 7 | 8 | 8 | 8 | 9 | 9 | 0 | 310 events, 76 distinct in 180 results, 4% filler |
| Upgrades & build variety | 6 | 7 | 7 | 8 | 8 | 8 | 8 | 0 | Deep (108 upgrades, refits, training) and the set piece now grants one; my bot rarely afforded big ones |
| Missions & story | 6 | 7 | 8 | 8 | 8 | 8 | 9 | +1 | Set piece now fires 10/10 (day ~31) with a real choice and a persistent reward; 19 endings spread well |
| Economy / balance | 5 | 5 | 7 | 8 | 8 | 8 | 8 | 0 | Cautious loss 6%, reckless 38%; humans stay poor (100-500 scrip) through 126 days |
| Audio | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 0 | Offline structural checks pass; never heard |
| Technical robustness / perf | 7 | 8 | 8 | 8 | 8 | 7 | 8 | +1 | Leak fixed (retained 12.5 -> 18.6 MB over 122 days); 0 errors; fps not measurable here |
| Code structure | 6 | 7 | 8 | 8 | 8 | 8 | 8 | 0 | 112 tests, heap soak + limp e2e added |

## Verdict: WOWED: NO (honestly: very close on the things I can measure)

Counts: BLOCKER 0, MAJOR 0, MINOR 5, POLISH 3. Every iteration-6 major is fixed and verified. Three dimensions are at 9 and eight at 8. The all-9 bar is not met, and two
dimensions (Audio, and the part of Technical/perf that is real-GPU frame rate) cannot be honestly scored 9 without hardware I do not have. Beyond that, the game is at the
point of diminishing returns for content and UI polish: it is a charming, stable, content-rich cozy game; whether it is "FTL/Elite wow" is now a question of taste, real hardware and playtesting, not of defects I can find.

## Sim summary (x50)
| policy | non-loss | loss | lantern endings |
|---|---|---|---|
| random | 0% | 92% (8% timeouts) | 0% |
| reckless | 62% | 38% | 60% |
| greedy | 100% | 0% | 98% |
| cautious | 94% | 6% | 80% (keeper 22, hush 11, beloved 7, silent 7) |
| story | 100% | 0% | 100% |
| explorer | 100% | 0% | 100% |
Never fired: 8-20 per policy (crew_low_morale_lounge, archive_heart_ledger in some, station_busker_return, rival_vell_*, a few scan_*/dist_*/hail_r_*). `setpiece_night_of_lamps` now fires.

## Iteration-6 items
| Item | Status | Evidence |
|---|---|---|
| P1 set piece unreachable | FIXED | 10/10 seeds fire on first Pennywhistle arrival (was 1/10); in real UI at day 31 it fires, choice + gift of 3 upgrades, mission completes, `singing_hull_plating` installed; absent from every never-fired list |
| P2 heap growth | FIXED | CDP retained heap 12.5 / 15.8 / 17.8 / 17.3 / 18.0 / 19.2 / 18.6 MB at d1/22/42/62/82/102/122 (iter6 12.9 -> 111); raw sawtooth 37-80 MB; UI run 42 -> 50 MB over 126 days; 0 page errors |
| P3 Trade banner overlap | FIXED | `v7_1080_trade.png` |
| P4 BEST tag | CHANGED | tag now "brace" in 225/225 rows (was creep). In scrip terms brace is cheapest (E[hull] 5.1/8/12.4 at ~6 scrip/pt vs creep ~50 scrip incl. fuel/day/-25% bounty); the tag is still constant per danger rather than situational |
| P5 never-fired | PARTIAL | 8-20 remain |
| P6 thin income | UNCHANGED | bot at 100-500 scrip all run |
| P7 limp dialog/audio/fps | limp dialog VERIFIED; audio and fps UNVERIFIABLE | see below |

## Remaining defects
### MINOR
- **R1 UI copy** Limp dialog text repeats itself: "The hull is at 12/100 (12%). Hull at 12%: Repair before you go." Remove the duplicate.
- **R2 UI** Set-piece gift choices ("lamp-glass plate", "old pilots' astrolabe", "drifters' lantern quilt") do not say what they grant (hull armour / sensors / morale); add a one-line preview.
- **R3 EVENTS** 8-20 never-fired events per policy (`crew_low_morale_lounge`, `archive_heart_ledger`, `station_busker_return`, `rival_vell_prank/dock_sighting`, 3-4 `dist_*`, 3-4 `scan_*`).
- **R4 ECONOMY** Humans following missions/jumps stay at 100-500 scrip; a first big upgrade (600+) takes >40 days unless they trade. Consider a modest Society stipend or higher early mission pay.
- **R5 ENGINE** BEST tag is constant (always brace); a situational tag (healthy hull -> run; low hull -> creep) would make the briefing feel alive.
### POLISH
- **R6** At 844x390 HUD/tip/text still small. **R7** Set-piece art does not change between beats. **R8** The limp text says "Find a station" even at a station that is not docked.

## What delights
- Seeing the Night of a Thousand Lamps actually arrive: gold lantern viewscreen, Marshal Dott, choice of role, the five Lanterns and "a sixth, not yet lit".
- Hot lanes: 14 runs, 9 different authored chains, a briefing modal with odds, costs and bounty percentages, and a gentle limp warning.
- 126 days, 180 events, 76 distinct, 4% filler, zero errors, flat memory.
- Mid-arc and personality endings spread evenly across keeper/hush/silent/beloved.

## Cannot be verified without real hardware (be explicit)
- **Audio by ear**: music quality, mix, loudness, fatigue over an hour. Only the offline render/soak test (no errors, no clipping at peak ~0.5) was run.
- **Real-GPU frame rate and frame pacing**: this sandbox is software GL (~4 fps); I measured JS cost (<1 ms/frame) and draw calls only.
- **Touch input and phone ergonomics** (hit targets, rotate overlay behaviour on a real device), and **HiDPI sharpness**.
- **Long-session (4h+) memory** on low-RAM mobile; I measured 122 days (~2 h of play).
- **Subjective "one more jump" pull and difficulty** over multiple real players.

## Remaining top changes (if more rounds were possible)
1. Real-hardware QA pass: listen to the soundtrack/sfx and trace fps on a GPU; tune any audio mix issues.
2. Make the hot-lane BEST tag situational and show previews for set-piece gifts (R2, R5).
3. Slightly raise early income / add a first-100-day stipend so a human can buy a first refit by ~day 25 (R4).
4. Wire the last ~10 never-fired events; remove the limp-copy duplication (R1, R3).
5. A second hand-built set piece around day 90 and a visible ship transformation on the HUD at each rank.

## Working notes (as gathered)
- Build clean, 112/112 tests.
- **Heap leak FIXED** (same CDP precise-heap harness as iter6, 844x390, jump+scan loop, 122 days): retained after forced GC 12.5 (d1) / 15.8 (d22) / 17.8 / 17.3 / 18.0 / 19.2 (d102) / 18.6 MB (d122); raw (no GC) oscillates 37-80 MB, i.e. sawtooth garbage, no upward trend. iter6 was 12.9 -> 111 MB. 0 page errors.
- **Set piece FIXED** (`lamps3.mjs`, 10 seeds, mission accepted from any board at day 20, arrive at Pennywhistle): fires on the first arrival 10/10 (iter6: 1/10). (An earlier 5/10 reading was a harness bug: dock-time event blocked acceptMission.)
- **Briefing BEST tag** (225 rows, danger 1-3): now "brace" in 225/225 rows (iter6: creep 225/225). Still a constant, but it is the lowest expected-cost-vs-bounty option and consistent with the numbers (brace E[hull] 5.1/8/12.4 vs creep 0.9/2.2/3.8 in iter6 data); see below for whether that is right.
- Sim x50: random loss 92% (8% timeouts); reckless 38% loss (60% lantern); greedy 0% loss (98% lantern); cautious 6% loss, 80% lantern (keeper 22, hush 11, beloved 7, silent 7); story 0%; explorer 0%. Endings well spread. Never-fired: 8 (explorer) to 20 (reckless); `setpiece_night_of_lamps` is no longer in any never-fired list (iter6: all). Remaining: crew_low_morale_lounge, archive_heart_ledger (reckless/greedy/story), station_busker_return, a few scan_*/dist_*/hail_r_* and rival_vell_*.
- **Set piece in the real UI (mouse-planned jump, `sp7.cjs`, 1280x720):** accepted from a board at day 30, jumped to Pennywhistle: a hail-homesick travel event first, then arrival -> "The Night of a Thousand Lamps" (3 beats: role choice with a 65% choir check, result, gift choice of 3 reward upgrades) with the gold lantern viewscreen and Festival Marshal Dott's portrait; mission completed, `night_of_lamps_done` set, `singing_hull_plating` installed (`sp7_11/13.png`). Reachable by ~day 31 when the mission is taken on the first board visit after day 12. The gift options show no stats (nameless choice among 3 upgrades) - a minor clarity gap.
- 126-day real-UI playthrough @ 844x390 (mouse menus/briefing clicks, number-key choices; build fb575fc): END dump `console: []`, `app errors: []`. 180 resolved events, 76 distinct; `core_*` fallbacks 8/180 = 4.4% (scan_find 4, festival 2, hail_quillari 1, midgame 1); 14 hot-lane briefings through the modal, 9 distinct authored chains (gravity_washboard 12 beats, lost_beacon 8, dust_squall/signal_wash/stalled_convoy 6, others 4), **0 generic `core_hot_lane`**; 8 refit/training/upgrade buys; JS heap (performance.memory) 42 -> 50 MB over 126 days (iter6: 37 -> 123).
- Limp dialog verified in the real UI (`limp7_a.png`): hull 12% -> "LIMPING OUT OF PORT?" with Stay and mend / Depart anyway (free patch correctly only offered when docked at a repair station). Copy glitch: "The hull is at 12/100 (12%). Hull at 12%: Repair before you go." repeats itself. Trade spend-banner no longer overlaps Done (`v7_1080_trade.png`). Audio offline test: ALL CHECKS PASSED.
