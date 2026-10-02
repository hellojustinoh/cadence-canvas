# PRD-5 · Filler buzz

**Tenet:** 3 (awareness is the cure). **Switch:** `fillerHaptics`. No drawing
(haptics).

## Problem
On a phone you don't watch the screen while you talk, so the live fillers chip
does nothing for you. Awareness has to arrive through another channel.

## Proposal
`navigator.vibrate(35)` each time the live filler count goes up during a
session. One short tick, never a pattern. Silently no-op where unsupported
(iOS Safari has no vibrate API; Android Chrome does).

## Measure
No effect on taps or seconds. Verified by logging vibrate calls in the harness.

## Risks
Could feel like scolding (tenet 3). Keep it one tick, nothing on results.
