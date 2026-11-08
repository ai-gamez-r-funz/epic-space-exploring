# CRITIC report, iteration 3 (Halcyon Reach)

Method (production build, `vite preview`, `?debug=1`): `npm run build` (clean), 87/87 tests, sim x50 on all 6 policies, a **128-day real-UI playthrough**
(Title > New Voyage > Launch > Skip with mouse; number keys for event choices; 40 jumps, 3 board missions at a time, trade routes via `bestSell`, distress beacon answered, 2 upgrades),
a forced Lantern 1-5 chain to the ending, retire/end screen via mouse at 1920x1080, screenshots at 1280x720 / 1920x1080 / 844x390 (read), memory loop, scripted rational-trader runs.
Evidence: scratchpad `shots/play3_*.png`, `play3.log` (full event/trade log), `i3_*`, `m7_1920_*`, `lan*`, `m4/m5/m8`.

## Scores (iter1 -> iter2 -> iter3)

| Area | I1 | I2 | I3 | Delta | Reason |
|---|---|---|---|---|---|
| Visual polish | 8 | 8 | 8 | 0 | Map with legend/SOS marker and the new station art are lovely; a few art/subject mismatches (whale-song on a grey crater planet), small text at 844x390 |
| Cozy feel & tone | 8 | 8 | 8 | 0 | Voice remains the strongest asset (Lantern chain, distress "Wobbling Pudding", Survey Office cheese). Little new tonal range |
| UI/UX clarity | 7 | 8 | 8 | 0 | First-orders card, objective strip with jump count, legend: good. **Pause > Settings is dead to the mouse** (hotkey works) |
| Onboarding | 5 | 6 | 7 | +1 | First Orders card + Welcome Jobs + tips are clear in the first 2 minutes; the tip bubble and card duplicate each other |
| Core loop / depth | 5 | 6 | 7 | +1 | Trade routes, distress beacons, rival and Lantern thread now give reasons to move; scans are still one-beat vignettes and competent play almost never loses |
| Event & writing variety | 6 | 7 | 8 | +1 | 279 events, filler fell from 23% to 6% (8 core_* of 134 results), 83 distinct ids in 128 days. But 157/279 are single-node and ~15 authored scan finds never fire |
| Upgrades & build variety | 6 | 7 | 7 | 0 | 94 upgrades incl. sidegrades, but only 2 shipyards in 42 systems; my bot sat on 1.7-4.6k scrip for 60 days with nothing to want |
| Missions & story | 6 | 7 | 8 | +1 | Welcome Jobs, 60 missions, 16 endings (mid-arc "Laureate of the Chart" fires at 61%), Lantern 1-5 chain resolves end-to-end |
| Economy / balance | 5 | 5 | 7 | +2 | Trade is now discoverable, readable and rewarding (hint in market). Overshoots: ~70-100 scrip/day vs 12-18 from missions; income is lumpy and uncapped |
| Audio | 7 | 7 | 7 | 0 | Not heard; structural only |
| Technical robustness / perf | 7 | 8 | 8 | 0 | 128 days: 0 console warnings, 0 app errors; heap flat 24.5 MB, nodes/textures plateau. fps still unmeasurable under SwiftShader |
| Code structure | 6 | 7 | 8 | +1 | Debug hooks gated behind `?debug=1`, Stubs gone, README real, 87 tests |

## Verdict: WOWED: NO

Counts: BLOCKER 0, MAJOR 3, MINOR 8, POLISH 4. This is now a genuinely charming, stable, content-rich game, and the biggest iteration-2 complaints
(dead trade, poverty, filler, tutorial) are fixed. It still lacks the *pull* of FTL/Elite: nothing escalates, the decisions are mostly one-click, competent play never loses,
and spending your money is awkward.

### Sim summary (x50)
| policy | non-loss | loss (recalled) | lantern endings | avg days | notes |
|---|---|---|---|---|---|
| random | 0% | 74% | 0% | 340 | |
| reckless | 86% | 12% | 84% | 210 | |
| greedy | 100% | 0% | 94% | 223 | |
| cautious | 98% | 2% | 76% | 209 | rival_friend 8/50 |
| story | 100% | 0% | 100% | 209 | lantern_silent 27, keeper 22 |
| explorer | 100% | 0% | 100% | 226 | |
No stuck runs, no exceptions. 22-35 events never fire per policy (idle_* x9, ~15 `scan_*` finds, `archive_heart_ledger`, `crew_low_morale_lounge`).

## Status of iteration-2 items

| ID | Status | Evidence |
|---|---|---|
| N1 trade dead | FIXED (overshoots) | spreads 12-14%; Trade shows best-sell hints; bot: bought tuning crystals @82, sold @168 x16 = ~+1,370 in 3 jumps; rational-trader script +68..+103 scrip/day on 3 of 4 seeds (one seed -453, variance) |
| N2 poverty spiral | FIXED | day 15 599 scrip, day 82 1,667, day 121 4,615; hull stayed 87-105 |
| N3 filler 23% | FIXED | 8 `core_*` of 134 results (6%); lane_*/scan_*/arr_* authored events dominate |
| N4 dropped clicks | PARTIAL | Retire button + confirm via real mouse at 1920x1080 works (ending `chart_laureate`); my iter-2 "1920 failures" were a harness scaling error. **Still broken: Pause > Settings** ignores real mouse clicks at 1280x720 and 1920x1080 (tested at 5 positions, 3 tries each; Help & hotkeys opens fine, hotkey `S` works) |
| N5 distress | FIXED | beacon appeared and was answered ~day 28; red "SOS 13D" marker on chart + legend entry. Only 3 distress events: `dist_dry_tank` repeated within the run |
| N6 rival / never-fired | PARTIAL | legend entry exists; I never met Tamsin Vell in 128 days of play, and no panel lists where she is; 22-35 events still never fire |
| N7 generic retire | FIXED | retire at 61% -> "Laureate of the Chart" with unique epilogue |
| N8 toast stack | FIXED | queue; single toast visible in screenshots |
| N9 onboarding | FIXED | First Orders card (mouse "Aye aye"), objective strip "Investigate the Lantern at Wickhaven . 2 jumps", fuel note in chart |
| N10 schematic | NOT RE-CHECKED | |
| N11 dead code | FIXED in prod | hooks need `?debug=1`; dev gallery/mocks only in DEV (dirs still in src) |
| N12 piloting | NOT RE-CHECKED | |
| N13 "Drydock Docks" | NOT SEEN | new station names |
| N14 legend | FIXED | |
| N15 pause empty space | FIXED | |

## New / remaining defects

### MAJOR
- **M1 MAJOR / UI** Pause > Settings cannot be opened with the mouse. Repro: Bridge, press Esc twice (first closes the First-Orders card), click Settings anywhere on the button (x 500/640/760, y 285-312 at 1280x720): nothing happens, Pause stays open (`m4.cjs`, `m6.cjs`, `m8.cjs`). Help & hotkeys works the same way, hotkey `S` works, the HUD settings icon works. Look at `Pause.js:19` vs `:20` (identical wiring) and `Button` hotkey/hit-slop interaction (`responsive.js`) for a pointer-capture or duplicate-hotkey `pointertap` swallow. Add `tests/e2e` assertion.
- **M2 MAJOR / ENGINE+EVENTS** Stakes and depth are thin for a competent player. cautious 2% loss, greedy/story/explorer 0%; hull never fell below 87 in my run; 157/279 events (56%) are single-node vignettes (iter2: 38%), so most choices are cosmetic one-clicks. Elite-style "one more jump" needs an escalating risk/reward: e.g. a "hot lane" with 2-3 stage hazards and a payout, stranded-on-the-way contracts with timers, repair costs that matter after a bad lane.
- **M3 MAJOR / ENGINE+WORLD** Economy snowballs and cannot be spent. Only 2 shipyards in 42 systems; with trade yielding 70-100 scrip/day my bot held 1.5-4.6k scrip from day 80 with no upgrade bought after day ~60. Income variance is huge (one 16-unit run = ~1,370 vs 100-300 for a mission). Fix: 1 shipyard per region (4-5), rotating stock/discounts, upgrade "commissions" that cost 600-1500 and take days, and a luxury sink (lounge refits, crew training) so scrip is always wanted.

### MINOR
- **M4 MINOR / EVENTS** ~15 authored `scan_*` finds (lava, desert oasis, ocean nodules, jungle baths/cliffs, terran quarry/aurora, toxic x3, gas hum, ...) never fire in any of 300 sim runs; `archive_heart_ledger`, `arr_rim_postmaster`, `hail_r_*`, 9 `idle_*` also never fire. Check `when` conditions/planet-type tags and the engine's 50% authored preference.
- **M5 MINOR / EVENTS** Distress pool is 3 events; `dist_dry_tank` repeated in one 128-day run. Add 6+ variants keyed to region/faction.
- **M6 MINOR / UI+ENGINE** Rival Tamsin Vell is not discoverable: no log line or panel says where she is, and a player can go 128 days without meeting her (the legend lists her marker, but I never saw it on the map). Pin her to a Log/Codex entry and let the Bridge strip say "Tamsin Vell is at X".
- **M7 MINOR / GFX** `planet` event art ignores planet type: "Song from the Deep" (ocean world) shows a grey cratered moon (`play3_008`). Pass `planetType` into `sceneArt`.
- **M8 MINOR / UI** First-Orders card and the pulsing tutorial tip say the same thing; keep one. At 844x390 both overlap the system panel.
- **M9 MINOR / ENGINE** My explorer bot's survey froze at 35% from day 93 to day 128 while still jumping; verify there is always a reachable uncharted system (or a clear "no more lanes" hint) to avoid dead-ends for real players.
- **M10 MINOR / EVENTS** Authored scan finds are mostly +5 morale / +15 scrip with no persistent consequences; wonder events do not unlock anything (items, lane reveals, ship traits).
- **M11 MINOR / UI** Phone landscape text is still ~8 px; "Large UI" does not enlarge HUD (STATUS.md).

### POLISH
- **M12** Result screens still lead with a long flavour line then a fx summary; add icons/colours for the *kind* of reward. **M13** End-screen total counts up slowly (TOTAL read 5,169 mid-count vs rows summing to 5,200). **M14** `window.__halcyon` hotkey `b` for "Bridge" no longer works on the map (use the button). **M15** Pause menu `Save to slot` has no confirmation toast over modal.

## What delights
- The Lantern chain 1-5 end to end: the Lamplighter, "What the Light Remembers", "Voices in the Light", the empty socket that fits a hand. This is the emotional high point and it lands.
- Trade is finally an Elite-like pleasure: a hint in the market, a two-jump run, a fat sale. Prices, spreads and news windows are readable.
- Distress beacons with a map marker, timer, and a warm three-beat resolution; Welcome Jobs give a gentle start.
- 6% filler in 128 days: the world feels authored.
- Zero console warnings, flat memory, end screen with a unique cozy epilogue at 61% survey.

## What would get to WOWED (5-8 changes, in priority order)
1. **Escalating risk/reward lanes (ENGINE+EVENTS).** "Hot lanes" and multi-stage hazards with a payout, so a jump is a decision with a cost and a chance of a story, not a toll. Target 8-15% loss for cautious play and visible hull/fuel tension every ~6 days.
2. **Make every scan and landing a choice (EVENTS).** Convert at least 60 of the 157 single-node vignettes to 2-3 beats with a real branch and a persistent consequence (item, rep, lane reveal, crew trait).
3. **Fix the money funnel (ENGINE+WORLD).** 4-5 shipyards, commissions, discounts and a late-game scrip sink; cap or smooth trade variance (stock depth drops after you sell) so income is 2x, not 6x, missions.
4. **A visible long arc on the HUD (UI).** Rival and Lantern as living threads: "Tamsin Vell is at X (+340 if you beat her)", next Lantern ETA, chapter progress pips. Make the objective strip clickable to jump the map to the target.
5. **Fix Pause > Settings mouse input (UI)** and add a Playwright smoke test for every pause/settings/retire path.
6. **Wire up the 40 never-firing events (EVENTS+ENGINE)**, esp. `scan_*`, `archive_heart_ledger`, `idle_*`, plus 6 more distress variants.
7. **Pass planet type into event art and add region-specific viewscreen props (GFX)**, plus a second pass on result-screen feedback (icons, small sparkle/sfx on rewards) for moment-to-moment delight.
8. **A one-line "why jump now" hook at every dock (UI+ENGINE):** a daily bulletin that names the best route, an open distress, and the rival's cargo; this is the cheapest way to get "one more jump".
