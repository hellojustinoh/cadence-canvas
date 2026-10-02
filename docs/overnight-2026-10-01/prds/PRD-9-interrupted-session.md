# PRD-9 · An interrupted drill says so

**Tenet:** 2 (one honest number). **Switch:** `interruptedGuard` (scoring).
Surfaced by the PRD-7 reviewer.

## Problem
If the phone locks, a call comes in, or the user switches apps mid-drill, the
mic stream and recognition stop. `rec.onend` tries to restart and fails
silently; the timer keeps running; the drill ends with a partial transcript,
a deflated wpm and phantom stalls. That number is saved to history as if it
were earned.

## Proposal
Mark the session interrupted when, while running, `document.visibilityState`
becomes `hidden`, or a mic track fires `ended`. On results, swap the grade
line for "That one got cut off. Score not saved." and skip `saveSession`.
Everything else on the results screen stays (the transcript is still useful).

## Measure
Harness run that hides the page for 2 s mid-drill: release saves a session,
test build does not. No change to taps or seconds.
