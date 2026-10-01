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

## Review 2 (after the fixes) — NOTHING WORTH BUILDING
Second reviewer agreed: 3 taps (2 on run-out), ~1.5 s overhead mostly in the
recognizer, no cut idea has a new reason. The loop stops here.

Checked and correct: flag parsing (release clears overrides before `?flags=`
applies), clockOnSpeech with no speech (words < 10 cap still gives 25),
interruptedGuard when hidden before Record (needs `state.running`, so no
false flag), the `#waveCanvas` phone rule's specificity.

Cleanups it asked for, all done: the flag comment now says the ring still
counts from Record; dead `.view-results-cut` selector removed; the
`safe-area-inset-bottom` padding removed (no `viewport-fit=cover`, so it was
a no-op); a `rec.onerror` handler added so an unsupported regional model
falls back to en-US instead of restarting forever with no words, and a
blocked service shows a message instead of a silent loop.

The one thing to check on the phone: on `?build=test`, do one Sprint and
confirm words appear live under en-SG recognition. If not,
`?flags=-recognitionLocale`.
