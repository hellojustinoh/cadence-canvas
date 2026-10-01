# PRD-3 · The clock starts when you do

**Tenet:** 2 (one honest number). **Switch:** `clockOnSpeech` (scoring).

## Problem
`startedAt` is set when Record is tapped. The user then reads the prompt,
waits for the mic prompt, and thinks. All of that counts as elapsed time, so
wpm is deflated and a 2-second think before the first word is counted as a
stall. The score punishes reading the prompt.

## Proposal
When the flag is on, the timer and `startedAt` arm on the first speech result.
Until then the ring shows the full duration and the label reads "Listening…
start whenever". `longPauses` also start counting from the first word.
Hard cap: if nothing is heard for 15 s after Record, the session starts anyway
(so a silent mic still ends with the "mic barely caught anything" tip).

## Measure
Score on the stubbed 12-second run should be unchanged (no think time in the
stub). Add a second harness run with a 3 s delay before speech: release score
drops (pace), test build does not.

## Risks
Changes the meaning of history: scores before and after aren't comparable.
Record `clockOnSpeech: true` on saved sessions so Progress can label them.
