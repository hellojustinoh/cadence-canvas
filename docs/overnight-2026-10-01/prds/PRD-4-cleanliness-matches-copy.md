# PRD-4 · Cleanliness curve matches the copy

**Tenet:** 2. **Switch:** `cleanCurve` (scoring).

## Problem
The landing page says "Fillers per 100 words. Under 2 and you sound
rehearsed." The engine does `fillerScore = 100 - fillerRate × 12`, so 2 per
100 words already costs 24 points of cleanliness. The copy and the number
disagree, and the number is the one the user sees.

## Proposal
Full marks up to 2 fillers / 100 words, then lose 10 per additional filler
per 100 words, floor 0: `max(0, 100 - max(0, rate - 2) × 10)`. 10 / 100w
still scores 20; 12 / 100w is 0. Update the results tip threshold to match.

## Measure
Stubbed run with 2 fillers in 30 words (6.7 / 100w): release cleanliness 20,
test 53. Transcript and raw stats unchanged.

## Risks
Scores drift up. Record `cleanCurve: true` on saved sessions.
