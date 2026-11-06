# CRITIC report, iteration 3 (in progress)

## Early findings (written incrementally)
- Build clean, 87/87 tests. Sim x50: random loss 74%, reckless 12%, greedy 0%, cautious 2%, story 0%, explorer 0% (non-loss 98-100%): stakes have largely evaporated again for competent play.
- Never-fired events per policy: 22-35 (idle_* x9 never fire without rest; ~15 authored `scan_*` finds never fire in any competent policy; `archive_heart_ledger` still never fires).
- Upgrade cadence signal: avg credits dip at day 40 then recover (spend), see playthrough section.
