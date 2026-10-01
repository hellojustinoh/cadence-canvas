# PRD-11 · The streak survives the morning

**Tenet:** 3 (coaches, never scolds). **Switch:** `streakGrace` (copy).

## Problem
`renderStreak` counts days backwards starting from today. Open the app the
morning after a 5-day streak and, because today has no session yet, the
streak is 0 and the line falls back to "6 sessions logged". The streak is
only ever visible right after a drill.

## Proposal
If today has no session, start counting from yesterday. Copy: "5 days in a
row · keep it going today" when today is still open, unchanged otherwise.

## Measure
Seed sessions on the previous five days, none today: release shows "5
sessions logged", test shows "5 days in a row · keep it going today". No
change to taps or seconds.
