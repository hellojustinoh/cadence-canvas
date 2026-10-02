# Round 1 reviews (fresh reviewer per PRD, told to cut)

| PRD | Verdict | What survived |
|-----|---------|---------------|
| 1 Direct start | SHRINK | Hero CTA only, resolved at runtime behind `directStart`. Nav and finale keep the picker. Tap math corrected: 3 → 2 when the timer runs out (there is no Finish tap on the natural path). |
| 2 Session fits phone | SHRINK | `#waveCanvas { flex-basis: auto }` under 760 px and `trainer.scrollTop = 0` in `showView`. Chip/ring row rework dropped (the chip is absolutely positioned already). |
| 3 Clock on first word | SHRINK | No new label, ring or 15 s cap. Behind `clockOnSpeech`: stalls don't count until the first result, wpm is computed from the first result. Guard the no-speech case. Reviewer corrected the PRD: mic-permission wait was never counted (getUserMedia is awaited before `startedAt`). |
| 4 Cleanliness curve | SHRINK | Only `fillerScore`; `tipFor` untouched (5/100w already consistent). Record `cleanCurve` on saved sessions. Acceptance test is the composite per mode. |
| 5 Filler buzz | CUT | iOS has no vibrate; interim results make the count flap so a naive buzz repeats; a jolt per "um" scolds (tenet 3); motor noise can reach the mic. |
| 6 Mic denied stays put | SHRINK | getUserMedia denial only. Warning rendered in the session view above Record, hidden again at the start of `beginSession`. Saves 1 tap, not 2. |
| 7 Keep screen awake | CUT | Idle lock mid-drill is an edge case with no evidence; wake lock doesn't cover power button or app switch. Better idea surfaced: detect an interrupted session and say so instead of scoring a partial transcript. Carried to round 2. |
| 8 Sub-score bars | CUT | Adds a second reading layer against "one honest number"; raw stats already shown; weights differ per mode; needs engine return-shape and history schema change. |
