# PRD-13 · Same engine, any skin: port the flags to the five other variants

**Tenet:** 5. **Switch:** the same nine flags, same `?build=` / `?flags=`
syntax, in every variant. Off by default, as in the collage. Owner: SHIP.

## Problem
The README promises "the trainer engine and scoring logic are kept
functionally identical across all six". After last night, the collage scores
and stores differently from the other five under the test build. Tenet 5 is
broken until the engine changes travel.

## Proposal
Port, per variant, exactly the engine-level blocks from the collage:
build-switch block; `firstResultAt` / `interrupted` state; stall gating and
wpm from first word (clockOnSpeech); cleanliness curve (cleanCurve); flags
recorded on saved sessions; cap 5000 (longHistory); streak grace
(streakGrace); recognition locale + `onerror` fallback (recognitionLocale);
visibility listener + cut-off results (interruptedGuard); mic denial stays on
the session screen with the message in the transcript box (micRetryInline).
Copy for the cut-off and mic messages follows each skin's voice (lab:
`SIGNAL LOST`, anime: `EJECT`, retro: a dialog box, toybox: a sticker).
Do **not** port the collage-specific visual work (directStart's hero wiring
is per skin; contrastLabels is a collage token; the badge is small enough to
port). Also fix the editorial variant's 560 px waveform.

## Measure
Run the harness against each variant on `?build=test`: taps and overhead to
first score, the think-3 s score, the mic-denied path, the hidden-mid-drill
path. All six should give the same scores for the same stubbed drill.

## Risks
Five hand-ports of ~80 lines each. Mitigation: a scripted port with asserts
on every anchor string, then the harness on all six.
