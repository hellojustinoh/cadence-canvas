# PRD-6 · Mic denied keeps you on the session screen

**Tenet:** 6. **Switch:** `micRetryInline` (onboarding).

## Problem
If the user taps Record and denies (or dismisses) the mic prompt, the app
calls `showView('drills')`: they're thrown back to the picker, the prompt they
were about to answer is gone, and the warning is rendered at the bottom of the
picker. Recovery costs two taps and a re-read.

## Proposal
Stay on the session screen. Show the warning inline above Record, with the
copy "Cadence needs the mic to coach you. Allow it, then tap Record again."
Record stays enabled. Same for the "no SpeechRecognition" branch, except the
copy names Chrome/Edge/Safari and Record is disabled.

## Measure
Taps from a denied prompt to a score: 2 fewer. Harness run with the permission
denied.
