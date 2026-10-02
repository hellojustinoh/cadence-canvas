# PRD-10 · History keeps what Progress needs

**Tenet:** 4 (nothing leaves the browser; history survives upgrades).
**Switch:** `historyTotals` (changes the all-time numbers shown).

## Problem
`saveSession` keeps only the last 200 sessions (`slice(-200)`). At one drill a
day that is seven months. After that, "all-time avg" and "N sessions logged"
quietly become "last 200", and the streak calculation is fine only by luck.

## Proposal
Keep the raw list capped (storage stays small) but add a sidecar key
`cadence_history_totals_v1` = `{ count, scoreSum, firstAt }` updated on every
save, back-filled from the existing list the first time it's missing (so a
phone upgrading from today's build keeps its count). Progress reads totals
for "N sessions" and "all-time avg"; the chart and the recent list keep using
the raw cap.

## Measure
Seed 3 years of daily sessions (1,095), reload: summary shows 1,095 sessions,
not 200. Render time of the Progress view with that data. Upgrade check: seed
200 sessions under the old key only, load the new build, totals appear.
