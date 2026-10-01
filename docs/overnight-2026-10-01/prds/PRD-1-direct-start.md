# PRD-1 · Hero CTA starts Sprint directly

**Tenets:** 1 (the drill is the product), 6 (fast from fresh).
**Switch:** `directStart` (onboarding). Off in release.

## Problem
"Start a 60-second drill" opens the trainer on the picker, where the user has
to choose a drill. The label already promised a 60-second drill. That is one
wasted tap on the only path that matters.

## Proposal
`data-open-trainer="sprint"` on the hero CTA and the finale "Start talking"
button, so they land on the Sprint session screen. The nav "Start free drill"
keeps the picker (it's the generic entry). "Try Filler Hunt" already deep-links.

## Measure
Taps to first score: 4 → 3. Overhead seconds should drop by the picker's
render and the user's choosing time.

## Risks
A user who wanted Distill has to tap "← drills" (one tap, same as today's
picker). The picker still exists on the Drills tab.
