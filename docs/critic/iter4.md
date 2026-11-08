# CRITIC report, iteration 4 (Halcyon Reach)

Method (production build of branch `claude/exciting-faraday-tqbobz`, `?debug=1`): build + 100 tests, sim x50 on all 6 policies, a **113+ day real-UI playthrough**
(New Voyage via mouse; keys 1-9 for choices; bot actually bought refits, training and an upgrade, took hot lanes, trade routes, distress), an earlier 36-day run at 1280x720, rigorous M1 mouse re-test at 1280 and 1920,
screens at 1280x720 / 1920x1080 / 844x390 (read), memory loop from iter3 unchanged. Evidence in scratchpad `shots/play4b_*.png`, `play4b.log`, `play4_a.log`, `m9_*`, `r4_*`, `r5_map.png`.

## Scores (I1 / I2 / I3 -> I4)

| Area | I1 | I2 | I3 | I4 | Delta | Reason |
|---|---|---|---|---|---|---|
| Visual polish | 8 | 8 | 8 | 8 | 0 | Reward chips and region props are nice; schematic labels still touch the hull art; bulletin text is tiny; no wow beat |
| Cozy feel & tone | 8 | 8 | 8 | 8 | 0 | Voice intact; hull falling to 6/100 at day 100 in a bot run still resolves gently (tender, no death) |
| UI/UX clarity | 7 | 8 | 8 | 8 | 0 | Threads strip (rival + Lantern pills), dock bulletin, Refits/Training tabs, Settings click fixed. Legend omits hot lanes; tips overlap labels |
| Onboarding | 5 | 6 | 7 | 8 | +1 | One card of tips (First Orders removed), Threads pills tell you who/what/where on the first screen |
| Core loop / depth | 5 | 6 | 7 | 8 | +1 | Hot lanes, distress, rival, trade lanes, repair bills; there is now a reason to be cautious and a reason to gamble |
| Event & writing variety | 6 | 7 | 8 | 8 | 0 | 295 events, single-node 26% (was 56%), 53 scans, 12 distress, 13 rival; but the headline hot lane is ONE generic template that repeated 9 times |
| Upgrades & build variety | 6 | 7 | 7 | 8 | +1 | 108 upgrades, refits, training programmes, yard rotations ("Explorer's Fortnight 5d"), commissions |
| Missions & story | 6 | 7 | 8 | 8 | 0 | 66 missions, 18 endings, Lantern chain intact; silent ending still the modal result for greedy |
| Economy / balance | 5 | 5 | 7 | 8 | +1 | Trade saturates, repairs and refuels are real sinks (my bot was broke much of the time), bots still pile 5-6k because they ignore sinks |
| Audio | 7 | 7 | 7 | 7 | 0 | Not heard |
| Technical robustness / perf | 7 | 8 | 8 | 8 | 0 | See notes; fps unmeasurable under SwiftShader |
| Code structure | 6 | 7 | 8 | 8 | 0 | 100 tests, e2e pause smoke added |

## Verdict: WOWED: NO

Counts: BLOCKER 0, MAJOR 2, MINOR 7, POLISH 3. It is now a solid, cohesive, charming game with real stakes and spending options, and the iteration-3 asks were mostly delivered.
It is not FTL/Elite-class: its signature new set piece (hot lanes) repeats verbatim, outcomes are dominated by a low Piloting stat and luck rather than build decisions, and there is no climactic mid-game
beat that changes how the game feels around day 40-60.

## Sim summary (x50)
| policy | non-loss | loss | lantern endings | avg days | credits end |
|---|---|---|---|---|---|
| random | 0% | 98% | 0% | 148 | 345 |
| reckless | 56% | 36% | 54% | 225 | 6.9k |
| greedy | 94% | 0% | 92% | 229 | 4.7k |
| cautious | 94% | 6% | 70% | 200 | 4.9k |
| story | 98% | 2% | 98% | 218 | 5.9k |
| explorer | 100% | 0% | 100% | 214 | 5.7k |
No stuck runs/exceptions. Never-fired events per policy: 10 (explorer) to 45 (random); persistent: `archive_heart_ledger`, `crew_low_morale_lounge`, `travel_concord_buoy_lesson`, `rival_vell_prank`, a few `scan_*`/`dist_*`.

## Status of iteration-3 items

| ID | Status | Evidence |
|---|---|---|
| M1 Pause > Settings mouse click | FIXED | Re-verified rigorously: 2.5 s wait for the fade, pre-hover, real click at 1280x720 and 1920x1080; overlay class changes Pause -> Settings; screenshot shows Settings with Retire disabled below 50% survey (`m9_1280_after.png`) |
| M2 stakes/depth | FIXED (mostly) | reckless loss 36%, cautious 6%; in my run hull fell to 6/100 (day 100) and 18-38 on three other occasions; 3-beat hot lanes with a payout; single-node events 78/295 (26%) |
| M3 money funnel | FIXED for humans, not for bots | Refits tab (7), Training (6), yard rotations/commissions, yards per region; my bot spent on refits/training/repairs and sat at 0-130 scrip most of the time; sim bots end with 5-6k because they do not use the sinks |
| M4 never-fired events | PARTIAL | 10-23 per competent policy (iter3 22-35); `archive_heart_ledger` still never fires in 300 runs |
| M5 distress variety | FIXED | 12 distress events |
| M6 rival discoverability | FIXED | Bridge pill "Tamsin Vell is at Dockside Bell . 2 jumps", chart panel line, dock bulletin "Captain Tamsin Vell is at Gate Anchorage, hauling ... (3 jumps)" (tiny) |
| M7 art vs planet type | FIXED (improved) | ocean landing is teal-toned (`play4b_042`); region props present |
| M8 duplicate cards | FIXED | First Orders removed; tip + pills remain |
| M9 survey stall | NOT RE-CHECKED | my bot reached 38% by day 113 |
| M10 persistent consequences | PARTIAL | reward chips ("Drifter Fleets +4", "+1 Kelp Lantern") show; 26% of events still one beat |
| M11 phone text | NOT FIXED | 844x390 body text still ~8 px |
| M12 result feedback | FIXED | chips + SUCCESS badge |
| M13 end total | NOT RE-CHECKED | running total implemented per notes |
| M14 'b' hotkey | NOT RE-CHECKED | |
| M15 save toast | n/a | |

## New defects

### MAJOR
- **N1 MAJOR / EVENTS+GFX** Hot lane is a single generic template (`core_hot_lane` built in `src/core/setpieces.js:254`). The same three prompts ("A hot lane, flagged in red on the Meridian charts...", "The lane narrows...", "The last stretch is the worst...") and ~6 result lines appeared 9 times in ~100 days (27 of 131 resolved events; 20 identical first-beat prints). The feature meant to deliver "one more jump" is already stale by the second use. Fix: author >=8 distinct hot-lane chains keyed to region/danger (dust shoals, pulsar flare, ion cascade, nebula fog, derelict field...) each with a different skill emphasis and a unique payout flavour; vary beat order.
- **N2 MAJOR / ENGINE** Hot-lane outcomes are a stat tax rather than a decision. With Piloting 2 the bold options show 17%, the "reinforce" option 50%, the careful options lose fuel and days; total hull loss per chain in my run was ~40-60 (96->55, 86->27). Skill checks rely on a stat the player cannot raise early (training "Helm Drills" exists but costs scrip the bot did not have). Fix: surface a pre-run briefing ("Piloting 2: expect ~45 hull"), offer 2 risk-tiers with explicit hull/payout numbers, and let refits/crew choose the odds.

### MINOR
- **N3 MINOR / UI** Chart legend does not list hot lanes (they appear as amber lanes in `r5_map.png`) and the bulletin line in the Trade header is squeezed to tiny text.
- **N4 MINOR / UI** Tip bubble still overlaps a planet label on first Bridge view (`i3_bridge2.png`).
- **N5 MINOR / ENGINE** Bots (and likely players who ignore the tabs) are never nudged to spend: add a bridge hint when scrip > ~1,000 and a yard is within 3 jumps.
- **N6 MINOR / EVENTS** Generic fallbacks still appear for hails (`core_hail_quillari`, `core_hail_concord`), festivals and scan finds: 6 of 104 non-hot-lane results (6%).
- **N7 MINOR / ECONOMY** Service prices (fuel 11, supplies 7 per unit; a full restock of 38 = 266 scrip) combined with hull loss make a bad hot lane wipe 800 scrip in one dock; recovery from hull 6 is plausible but expensive. Consider a first-repair-free "Meridian courtesy" once per voyage.
- **N8 MINOR / ENGINE** Greedy bots end `lantern_silent` 40/50 times; silence should require a deliberate choice.
- **N9 MINOR / UI** Phone text is still too small (M11).

### POLISH
- **N10** Ship schematic labels (HULL) collide with the lantern spar; "TRAINING" tab text clips at the panel edge (`r4_ship1080.png`). **N11** Hot-lane events show the same scene art ("asteroids") regardless of lane. **N12** `core_festival` and `core_tow` read as engine text in an otherwise authored world.

## What delights
- Seeing the game push back: hull 96->55 on a hot lane, then a doc visit that eats 800 scrip, then a Meridian tender when it gets dire, all still gently written.
- The Threads strip: "Tamsin Vell is at Dockside Bell . 2 jumps" and "Lantern 1: A Match in the Dark . ~3-12 days" with five progress dots give the first screen a sense of two live stories.
- Shipyard tabs (Upgrades / Refits / Training) with seasonal banners ("Explorer's Fortnight 5d").
- Result screens with reward chips and unique epilogues; 12 distress variants; Lantern chain unchanged and still the emotional peak.

## What would get to WOWED (ordered)
1. **Author the hot lanes (EVENTS).** 8+ distinct chains, region-flavoured, each with a decision that uses a different skill/refit, so the signature mechanic is never seen twice in 100 days.
2. **Make stakes legible and build-driven (ENGINE+UI).** Show an expected-cost briefing before a risky lane; let refits, training, and crew actually shift those odds visibly (e.g. +20% from "Helm Drills").
3. **A mid-game turning point (EVENTS+WORLD).** Around day 40-60 a unique ship milestone (a named refit unlocking a new region, rival alliance, Lantern revelation) that changes the board, rather than a steady plateau.
4. **Spending nudges and pacing (UI).** When scrip exceeds ~1,000 or a refit is available, show a bridge pill "Refit available at X (2 jumps)". Bots and humans both spend.
5. **Stop the silent default (ENGINE).** Make "silent" a conscious final choice and give Keeper/Friend routes earlier foreshadowing.
6. **Cut the last ~6% filler and wire the last never-fired events (EVENTS).** `archive_heart_ledger`, `crew_low_morale_lounge`, `rival_vell_prank`, hail fallbacks.
7. **Phone/readability pass (UI).** 12px minimum body text at 844x390; bulletin text large enough; legend lists hot lanes.
8. **Audio and fps verification on real hardware (QA).** Neither could be verified here; a listening and GPU-fps pass is required before any 9 in Audio/perf.

Caveat: the 113-day run was stopped before its end-of-run console dump, so console/app-error totals are unverified for iteration 4 (iteration 3's 128-day run had zero). No visible glitch overlay or error toast appeared in any screenshot.
