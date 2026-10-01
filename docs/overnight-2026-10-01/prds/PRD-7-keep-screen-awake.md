# PRD-7 · Keep the screen awake during a drill

**Tenets:** 2, 6. **Switch:** `wakeLock`.

## Problem
A 60-second drill with no touches is longer than many phones' auto-lock. When
the screen locks, Safari and Chrome stop the mic and recognition; the session
ends with a partial transcript and a low score the user didn't earn.

## Proposal
`navigator.wakeLock.request('screen')` on `beginSession`, released in
`stopSession`. Re-request on `visibilitychange` back to visible while running.
No-op where unsupported.

## Measure
No effect on taps or seconds. Verified by logging wakeLock calls in the harness.
