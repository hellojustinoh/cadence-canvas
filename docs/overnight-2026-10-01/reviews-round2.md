# Round 2 reviews (fresh reviewer per PRD, told to cut)

| PRD | Verdict | What survived |
|-----|---------|---------------|
| 9 Interrupted drill | SHRINK | `visibilitychange` → hidden only (lock, app switch, tab switch). Mic-track `ended` dropped: iOS fires `mute` for calls, so calls and silent recognizer drops are out of scope. Score number and ring blanked beside "Score not saved". Flag `interruptedGuard`. |
| 10 History totals | SHRINK | Sidecar totals key rejected (two keys to keep in sync, and it would not fix the streak, which is also capped). Raise the cap from 200 to 5000 (~600 KB) with a try/catch on write. Flag `longHistory`. No migration needed. |
| 11 Streak grace | SHRINK | Gate the counting logic, not just the copy. "N days in a row · keep it going today" only when today is open. Flag `streakGrace`. PRD wording "6 sessions" corrected to 5. |
| 12 Build badge | SHRINK | Static pill, no tap, no flag list. `*` suffix when any flag differs from the test default; flags listed in the pill's `title`. Tenet citation corrected: the justification is the test-build switch rule, not tenet 6. |

Dry-loop findings folded into this round (unflagged unless noted):
- Reduced motion: twinkle, slide-in, chip bump, ring sweeps and smooth scroll ignored the OS setting. Now honoured.
- The trainer overlay never took focus and had no dialog role. Now `role="dialog"`, focus moves to the view heading.
- Waveform canvas is decorative (`aria-hidden`); the history chart has a label; the fillers chip is `aria-live="polite"`.
- Muted labels (`--navy-35`) measure 2.3:1 on white and on the butter card. Behind `contrastLabels` the token goes to 0.66 alpha (≈5:1). Brand tomato on white is 3.7:1 and is left alone; see the decision form.
- Recognition is pinned to `en-US`. Behind `recognitionLocale`, an English device locale (en-SG, en-GB, en-IN…) is passed through. Non-English locales stay on en-US because the drills and the filler list are English.
