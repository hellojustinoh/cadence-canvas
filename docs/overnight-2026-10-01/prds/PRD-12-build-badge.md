# PRD-12 · Test-build badge

**Tenet:** 6 (measure what ships). **Switch:** none; only renders when
`build=test`. Drawn and critiqued.

## Problem
Once the phone has `?build=test` persisted, nothing on screen says so. The
phone checklist asks "which build is this?" and the only answer is the
devtools console.

## Proposal
A small pill in the trainer top bar, left of the Drills/Progress tabs:
"test build". Tapping it toggles a one-line list of the flags that are on.
`?build=release` removes it.

## Measure
No change to taps or seconds. Screenshot at 390×844 showing the pill does not
crowd the tabs or the close button.
