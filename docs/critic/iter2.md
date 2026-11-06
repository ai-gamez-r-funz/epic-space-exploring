# CRITIC report, iteration 2 (Halcyon Reach)

Method: build, 75 tests, sim (random/reckless/greedy/cautious/story x60), own exploit scripts, real Playwright session of **114 in-game days**
through the UI (new build, `vite preview`): New Voyage -> Intro -> Bridge -> chart/jump x26 -> scan/land/hail/dock/trade -> 13 missions accepted ->
2 upgrades bought (Folding Crates, Comet-Ice Scoop) -> Lantern 1 + chapter-3 board -> rival Tamsin Vell met -> generic hazards (hull fell to 42) -> retire/end screen.
A forced distress beacon (API) was resolved through the event UI. Screens: `shots/play2_*.png`, `i2_*`, `sp*_`, `fin_*` (1280x720, 1920x1080, 844x390). I read them.

## Scores (iter1 -> iter2)

| Area | Iter1 | Iter2 | Delta | Reason |
|---|---|---|---|---|
| Visual polish | 8 | 8 | 0 | Collisions, undock icon, colour mismatch fixed; schematic still overlaps its slot nodes; no new wow, Title/Bridge art unchanged |
| Cozy feel & tone | 8 | 8 | 0 | Voice still lovely; hazards now bite (-19/-21 hull in one lane) yet recall is warmly written. Cozy preserved |
| UI/UX clarity | 7 | 8 | +1 | Orbit trap fixed, objective strip, tip placement good. Click swallowing and 3-deep toast stack remain |
| Onboarding | 5 | 6 | +1 | Tip 1 now shows, objective strip tells you "Investigate the Lantern at Wickhaven". But no reason given for why fuel is 4-5/jump, and the first lantern appears only at day ~35 |
| Core loop / depth | 5 | 6 | +1 | Real stakes now. Still no "one more jump" hook beyond the objective strip; scans mostly yield a generic template |
| Event & writing variety | 6 | 7 | +1 | 181 events, single-node 68 (38%). But ~23% of what I resolved was generic engine filler (core_hazard 12x, core_scan_find 6x, core_hail_* 8x) |
| Upgrades & build variety | 6 | 7 | +1 | 83 upgrades with trade-offs (Reservoir Tanks: +10 fuel, -5% range). I bought only 2 in 114 days because I was broke |
| Missions & story | 6 | 7 | +1 | 55 missions, fellowship bug fixed, chapter board reaches The Fellowship Ledger. Arc still defaults to "silent" ending; early retire = generic Wanderer |
| Economy / balance | 5 | 5 | 0 | Scarcity exists, but trade is dead (see N1) and rewards were roughly halved: I sat at 0-10 scrip for ~40% of the run |
| Audio | 7 | 7 | 0 | Not re-heard; offline soak still passes structurally |
| Technical robustness / perf | 7 | 8 | +1 | Build clean (es2022), zero console warnings in 114 days (Pixi texture warning gone), heap flat 24.5 MB, nodes/gpuTex plateau. fps still unmeasurable (SwiftShader) |
| Code structure | 6 | 7 | +1 | Static imports, README real, KitDemo dev-only. Stubs.js still dead, `window.__halcyon` exposed, mocks bundled |

## Verdict: WOWED: NO

Counts: BLOCKER 0, MAJOR 3, MINOR 9, POLISH 3. Iteration 1's seven majors are fixed or largely fixed; the game now has stakes and stays cozy.
It is not yet FTL/Elite-class: there is no *economy to play* (trade yields ~1-13 scrip/unit profit in two of three seeds I scanned), the player is poor and
repairs are the only money sink, and a third of the content is still filler.

**What it would take to reach YES** (every score >= 9): a profitable, legible trade loop (Elite pull); income tuned so the player can afford a build upgrade every ~15 days
and still feel pressure; filler under 8% (per-ctx unique variants for hazard/scan-find/landing); a visible one-more-jump hook (next lantern teased with a distance/ETA, distress
beacons that matter); reliable clicks; the dead/never-fired content wired up; and a second full-playthrough with no major bug.

## Status of iteration-1 items

| ID | Status | Evidence |
|---|---|---|
| C1 tutorial step skipped | FIXED | `i2_bridge.png` shows "TIP 1 OF 5"; `halcyon.tutorial` is null on first bridge |
| C2 orbit/scan trap | FIXED | scanned A, selected B, Scan enabled, B scanned and orbit moved (`c2.cjs` run) |
| C3 fellowship_known | FIXED (sim never hits the event) | `m_ch3_ledger` onComplete sets flag, ledger on the board at day 67; but `archive_heart_ledger` never fires in 300 sim runs (needs landing on ruins at archive_heart) |
| C4 no stakes | FIXED | sim loss: reckless 26.7%, greedy 8.3%, cautious 6.7%, story 10%, random 65% (recalled). My run: hull 99->42, repeated 15-20 hull lane hits; hazards have 3 choices |
| C5 thin events | PARTIAL | 181 events, 21/30 hails repeatable, planet 22; still 68 single-node and ~23% of my events were `core_*` filler |
| C6 README | FIXED | real README with controls, structure |
| C7 arc rarely finished | MOSTLY FIXED | story policy 88% lantern endings; cautious 67%; but `lantern_silent` dominates (46/60), retire at 54-57% gives generic wanderer |
| C8 toasts cover modals | PARTIAL | toast queue exists but 3 stack over the viewscreen header (`play2_014`); Pause at 1920 still overlapped by a toast (`fin_settings.png`) |
| C9 swallowed clicks | NOT FIXED | Pause > Settings mouse click ignored twice at 1920 (hotkey S worked); retire-confirm click dropped; Hire tab as before |
| C10 "Capt. Captain" | FIXED | HUD reads "Capt. Rafael Lindqvist" |
| C11 Pixi texture warning | FIXED | zero console warnings/errors in 114 days |
| C12 TLA warning | FIXED | build is warning-free |
| C13 tip overlap | FIXED | tip now sits over the viewscreen/map, not the info panel |
| C14 label collisions | FIXED | `play2_064` labels wrap without overlap; HUD name fits. Tautology "Drydock Docks" remains |
| C15 schematic overlap | PARTIAL | slot nodes still touch the nacelles/lantern (`fin_844_ship.png`) |
| C16 undock "?" icon | FIXED | dock icon visible (`fin_settings.png` bottom bar) |
| C17 piloting 1 | NOT RE-VERIFIED | start crew unchanged (Piloting total 1) |
| C18 thin payoffs | PARTIAL | callbacks exist, but hazard/find results are +3 salvage / +15 scrip |
| C19 dead code | PARTIAL | KitDemo dev-only; `Stubs.js` (150 lines) still unreferenced; `window.__halcyon`, `?quick=1` live in production; mocks imported by `services.js` |
| C20 phone size/HiDPI | PARTIAL | 844x390 fits (`fin_844_*`), text still ~8px |
| C21 sim blind spots | FIXED | 5 policies, 181-event coverage; still 14-27 events never fire |
| C22 bar colours | FIXED | event dialog bars now match HUD |
| C23 event art mismatch | NOT RE-VERIFIED | new station art looks good |
| C24 forms joke | FIXED in my run | only 1 Concord forms event in 114 days |
| C25 toast over warp | NOT RE-VERIFIED | |
| C26 legacy duplication | NOT RE-VERIFIED | |
| C27 empty map panel | FIXED | map panel shows survey/fuel; whole galaxy lanes now render |

## New defects

### MAJOR
- **N1 MAJOR / ENGINE+WORLD** Trade is not a viable profession. Full-information best A->B margin per unit on seed 1: 47 (aurora_silk 252->299); seed 2: 1 (ration bars), seed 3: 13; typical same-station buy/sell spread is ~35% (brandy 146 buy / 94 sell, `i2_1080_trade.png`). With 16 hold that is <=100-700 scrip before fuel (4-5 per adjacent jump). Elite's trade pull is absent; festival/shortage news (e.g. +30%) exists but a naive loop still loses money (-73..-429 over 5-7 days in `exploit.mjs`). Fix: cut the spread to ~12-15%, raise cross-system margin to 25-60% on 2-3 goods per lane, make news windows reliably profitable, show "best sell elsewhere" hints in Trade.
- **N2 MAJOR / ENGINE** Poverty spiral. Board rewards roughly halved (The Gentle Census 220->99, Hollin 300->135, Passage 175->80, Survey Meridian 150->65) while repair/refuel/jump cost rose (adjacent jump 2->4-5 fuel). My run: credits <= 10 on days 79, 84, 87, 93, 105, 110 and hull 42-57 for ~25 days with no money to repair; 2 upgrades in 114 days. Upgrades therefore still do not pull. Fix: restore ~70% of mission rewards, add a small pay-per-chart/scan stipend from the Society, and cap repair cost per hull point.
- **N3 MAJOR / EVENTS** Filler is back at ~23%. In 112 resolved events: `core_hazard` 12 (same 4-5 texts, "Rough Lane ... How shall we take it, Captain?"), `core_scan_find` 6 (templated: "Discovery on The Candied Market II: scoops a little hydrogen" with the choice "Collect and log everything"), `core_hail_*` 8, `core_landing_find` 2, `core_rival` 1. Fix: 6-8 unique hazard variants per hazard type and per-planet-type scan-find texts; make choices match the text.

### MINOR
- **N4 MINOR / UI** Mouse clicks dropped (C9) incl. Pause > Settings and retire confirm at 1920x1080; hotkeys fine. Remove/shorten `Input.clickGuard`.
- **N5 MINOR / ENGINE** Timed distress beacon never surfaced in 114 days of play (roll 5%/day, >=10 d gap, starts day 10): I saw only "Distress:" board missions. Forced via API it works (core_distress, 3 choices, "Empty Pantry") but pays reward=10*hops (50 scrip). Raise the roll, add a map legend entry, pay >=150.
- **N6 MINOR / EVENTS** Rival Tamsin Vell first met at day ~60. Sim: `rival_vell_rescue`, `cb_hab_banquet`, `dist_signal_fades`, `haz_homesick`, `archive_heart_ledger`, `crew_low_morale_lounge` never fire in any of 5 policies (14-27 events never fire per policy). Gate review.
- **N7 MINOR / ENGINE** Retire at 50-60% survey always yields "The Contented Wanderer" (generic); `lantern_silent` is 77% of story-bot endings. Add a mid-arc cozy ending and make "silent" require choosing silence.
- **N8 MINOR / UI** Three toasts stack over the viewscreen title; Codex toast overlays the Pause menu (`play2_014`, `fin_settings`). Cap at 1 visible + queue; hold during modals.
- **N9 MINOR / ONBOARDING** Nothing explains why fuel is 30/32 and jumps cost 4-5; first Lantern at ~day 35 with no teaser of distance. Add a one-line "range" note and show the objective's jump count in the strip.
- **N10 MINOR / GFX** Ship schematic overlaps COMMS/HULL/CARGO nodes (`fin_844_ship.png`).
- **N11 MINOR / UI** Dead file `src/ui/overlays/Stubs.js`, `window.__halcyon` and `?quick=1` in production; mocks imported by `services.js`.
- **N12 MINOR / WORLD** Start crew still Piloting 1; flee/pilot checks sit at low odds, no hireable pilot early.

### POLISH
- **N13** "Drydock Docks" tautology (station name generator). **N14** Distress marker is a faint red ring and not in the legend. **N15** Pause menu has a large empty lower third.

## What delights (new)
- The objective strip and a tip that finally points at Chart on the bridge.
- Hazards with real choices; recalled ending is gentle ("creaking and apologetic ... slightly alarmed by the paint").
- Trade-off upgrades (+fuel/-range) and the Explorer branch listing.
- Rival captain with gossip/bidding/joint-run options and callbacks; distress "Empty Pantry" resolves in three well-written beats.
- Zero console warnings over 114 days, flat memory, stable 844x390 and 1920x1080.

## Top 10 changes to raise the score
1. Rebuild trade margins and add a "where to sell" hint (N1).
2. Rebalance income vs costs so a build upgrade lands every ~15 days (N2).
3. Cut filler below 8% with unique hazard/scan/landing variants (N3).
4. Make timed distress and the rival visible early (by day 15-20) with real rewards (N5, N6).
5. Add a visible "next Lantern" teaser with jump count; first Lantern by day ~20 (N9).
6. Fix mouse input guard (N4/C9) and cap toasts (N8).
7. Add mid-arc/cozy endings and a deliberate Silence choice (N7).
8. Wire up never-firing events, add a sim policy that lands on archive_heart (N6).
9. Remove Stubs.js, dev hooks, mocks from production (N11).
10. Clean the schematic layout and station names (N10, N13).
