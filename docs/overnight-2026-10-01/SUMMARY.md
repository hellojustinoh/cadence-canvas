# Overnight summary · 1–2 Oct 2026

**Loop:** 2 build rounds, 12 PRDs, 12 cut-reviews, 3 drawing critiques,
2 balance reviews in a row found nothing worth building. Stopped at ~01:30 SGT.

**Shipped to `claude/bold-maxwell-tpd6bo` (collage app only), all off in release:**

| Flag | What | Measured |
|------|------|----------|
| directStart | hero CTA lands on Sprint | taps to score 3 → 2 (run-out), 4 → 3 (early finish) |
| micRetryInline | mic denied keeps the session screen | taps after a denial 6 → 4 |
| clockOnSpeech | stalls and wpm from the first word | 3 s think: score 90 → 100 |
| cleanCurve | full marks up to 2 fillers/100w | identical Distill 88 → 97 |
| interruptedGuard | locked/switched-away drill not scored or saved | release saved it; test did not |
| longHistory | 5000 sessions, not 200 | 1,096 kept vs 200 |
| streakGrace | streak counts from yesterday until today's drill | "5 sessions logged" → "5 days in a row · keep it going today" |
| contrastLabels | muted labels 2.3:1 → 5:1 | – |
| recognitionLocale | en-SG/en-GB/en-IN passed to recognition | only your phone can judge |

**Unflagged fixes:** waveform was 560 px tall on phones (Record below the
fold); views open at the top; reduced motion honoured; overlay is a focused
dialog; chart labelled; stale mic warning hidden; "TEST" corner tag.

**Cut:** filler buzz, wake lock, sub-score bars, reminder notifications,
PWA manifest, auto-start, first-run screen, live wpm, live-shuffle tweaks.

**Dry-loop checks:** 3 years of data renders in 35 ms; a11y gaps fixed as
above; dates localise and the app is English-only by design; the drill timer
is monotonic and streaks survive DST and travel; the phone's current storage
loads unchanged.

**Not done:** the 7:30 install. No cable or phone reachable from the cloud
session; the phone checklist page has the steps (Android over the cable via
Chrome port forwarding; iPhone needs an HTTPS URL for the mic).

**Caveat:** the tenets were inferred from the README, not written by you.
First item on the decision form.

Switch: `?build=test` on, `?build=release` off. Harness: `tools/measure.mjs`,
`tools/checks.mjs` (`NODE_PATH=/opt/node-tools/node_modules node …`).
