# PRD-15 · Progress says which rules scored each session

**Tenet:** 2 (one honest number). **Switch:** `progressRuleLabels` (copy).

## Problem
`clockOnSpeech` and `cleanCurve` change what a score means. Saved sessions
carry those flags, but Progress draws one line through old and new scores
as if comparable, and the history rows don't say.

## Proposal
In the history list, a small "new rules" tag on rows saved with either flag.
In the summary line, when the list mixes both: "recent avg 71 (new rules)".
Nothing on the chart.

## Measure
Seed a mixed history, open Progress: tag present on new-rule rows only. No
effect on taps or seconds.
