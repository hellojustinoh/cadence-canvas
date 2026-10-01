# Balance reviews (fresh reviewer, strong bias to "nothing")

## Review 1 (after round 2) — NOTHING WORTH BUILDING
Taps to first score are at 3 (2 on run-out); overhead is ~1.5 s and mostly
the recognizer. The remaining unknowns (iOS Safari recognition, real mic
dialog timing, toolbar overlap) can only be answered on the owner's phone.
No cut idea got a new reason.

Bugs it found in tonight's diff, all fixed:
- `showResults`: the queued `requestAnimationFrame` swept the score ring to
  the partial score after the cut-off branch had reset it. The branch now
  returns before the sweep is queued.
- `?build=release` left `cadence_flags` overrides in place, so release could
  run with scoring flags quietly on. Release now clears the overrides, and
  the badge shows "release · edited" whenever any flag is on outside the
  test build.
- Pre-existing: the picker's mic warning was never hidden after a later
  successful start. Hidden at the start of `beginSession`.

Its note on the tenets: they were inferred from the app's own copy and then
used to judge ideas from the same app, so the loop checks against itself.
The two questions only the owner can answer: is tap count the goal, and
does it work on their phone. Both are on the decision form.
