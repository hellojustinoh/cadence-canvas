# Round 3 reviews (after the owner's decision form)

| PRD | Verdict | What survived |
|-----|---------|---------------|
| 13 Port the engine | SHRINK | Seven engine flags ported identically to all five other variants (clockOnSpeech, cleanCurve, micRetryInline, interruptedGuard, longHistory, streakGrace, recognitionLocale). Collage-only pieces not ported: directStart (hero wiring), contrastLabels (collage token), the badge, the score-arc handling. Scripted port with an assert on every anchor (`tools/port-engine.py`); retro's mic-denied path and cut-off results handled by the same anchors, with `setOnAir(false)` on a recognition error. Per-skin copy for the cut-off and mic messages. |
| 14 Session layout v2 | SHRINK | Kept: full-width Record in a bottom bar with "← drills" as a text link; waveform 72 px; transcript 56 px until words arrive. Cut: chip restyle (the tilt is the skin's personality), the "16 px rhythm" bullet (no measure), `viewport-fit=cover` (static meta, changes the whole page in landscape on notched phones). Critic's second pass: the bar wasn't truly pinned when content was short; fixed with a flex column (`min-height: calc(100dvh - 72px)`, `margin-top: auto`). Flag `sessionLayoutV2`. |
| 15 Progress rule labels | CUT | Mixed-history window is ~12 visible rows once the flags flip; a permanent tag becomes noise on every row; the real incomparability is in the chart and all-time average, which the label would not touch. |

Not a PRD: the decision form now carries a visual per decision (owner's request).
