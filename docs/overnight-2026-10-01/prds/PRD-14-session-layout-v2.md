# PRD-14 · Session layout v2 (collage, phone)

**Tenets:** 1, 6. **Switch:** `sessionLayoutV2` (onboarding surface). Drawn
and critiqued. Owner: SHIP (as "build the critique nits").

## Problem
The phone critic's ranked list after the PRD-2 fix: Record is a 132 px button
paired with an equal-weight "← drills"; ~30 px of slack under it, so an iOS
Safari toolbar will cover it; the fillers chip is tilted with a hard shadow
and floats in the gutter; ~190 px of empty waveform + transcript above
Record before the first word; uneven vertical rhythm.

## Proposal (phones ≤ 760 px only, under the flag)
- Record full width in a bar stuck to the bottom of the trainer, with
  `padding-bottom: env(safe-area-inset-bottom)`; add `viewport-fit=cover`
  to the collage viewport meta. "← drills" becomes a text link in the bar.
- Fillers chip: no rotation, no offset shadow, sits top-right of the stage.
- Waveform 72 px. Transcript box `min-height: 56px` until words arrive.
- One 16 px gap between blocks; the header-to-label gap 16 px.

## Measure
Record visible at 390×844 with 100 px of slack (toolbar allowance). Taps and
overhead unchanged. Before/after screenshots.

## Risks
`viewport-fit=cover` changes layout on notched iPhones for the whole page,
not just under the flag; check the nav and the hero in the mock.
