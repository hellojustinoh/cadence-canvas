# PRD-16 · Hear the "uhhh" the recognizer deletes

**Tenet:** 3 (awareness is the cure), 2 (one honest number).
**Switches:** `hesitationDetect` (scoring), `shortStall` (scoring). Both off.
Found on the owner's phone in the TestFlight shell on 2026-10-06.

## Problem
Apple's on-device recognizer (and, less reliably, Chrome's) removes
disfluencies before the app sees them. "uhhh" never reaches the transcript,
so the filler count misses the most common filler there is. Lexical fillers
("like", "basically", "you know") survive and are highlighted correctly.

## Proposal
1. `hesitationDetect`: in the waveform loop, which already has the analyser,
   compute the RMS level and the spectral flux per frame. A steady voiced
   sound (level above a threshold, spectrum barely changing) held for 320 ms
   or more, during which the recognizer added no words, counts as one
   hesitation. One per run; 150 ms of quiet re-arms. Hesitations add to the
   filler count live and in the score, and the tip says how many were "um"
   sounds. Needs a real mic stream: in the iOS shell that means
   `nativeRealMic`, which is the capture-beside-recognizer risk.
2. `shortStall`: the fallback that needs no audio. A stall is 1.2 s without
   words instead of 2 s, so a long "uhhh" that the recognizer swallows at
   least costs a stall.

## Measure
Unit test with synthetic frames (`tools/test-hesitation.mjs`): a 500 ms
held vowel counts once, a 150 ms grunt does not, a 2 s "uhhh" counts once,
speech with words arriving never counts, an "um" between phrases counts.
Harness with the fake mic: false-positive count on a scripted drill.
Phone: say "so, uhhh, the thing is" five times; count should be 5 ± 1.

## Risks
Singing or a held "sooo" counts as a hesitation. Thresholds are tuned on
synthetic frames, not voices; the phone is the real test.
