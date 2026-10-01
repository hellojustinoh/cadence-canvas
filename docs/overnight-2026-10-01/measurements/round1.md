# Round 1 measurements

Fresh install = new browser context, empty localStorage. Phone viewport
390×844, speech stubbed at 150 wpm, fake mic. "Overhead" is wall-clock minus
the time spent speaking (or minus the drill length on run-out runs). Raw rows:
`round1.jsonl`, `round1-runout.jsonl`, `round1-cleancurve.jsonl`.

| Scenario | Release | Test build | Flag |
|----------|---------|------------|------|
| Taps to first score, timer runs out | 3 | 2 | directStart |
| Taps to first score, early Finish | 4 | 3 | directStart |
| Overhead seconds (early Finish) | 1.44 | 1.43 | — |
| Score, 3 s think before first word | 90 (119 wpm, 1 stall) | 100 (152 wpm, 0 stalls) | clockOnSpeech |
| Taps to first score after mic denied | 6 | 4 | micRetryInline |
| Distill run-out, 2.8 fillers/100w | 88 | 97 | cleanCurve |

Visual checks (phone, 390×844): Record and the back button are inside the
viewport on the session screen; the mic message sits in the transcript box
and Record stays where it was; results open at the top.

Not measurable here: iOS Safari bottom toolbar overlap (the critic's warning),
real recognition latency, real mic permission dialog timing.
