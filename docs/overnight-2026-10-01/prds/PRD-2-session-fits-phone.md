# PRD-2 · Session screen fits a phone; results open at the top

**Tenets:** 1, 6. **Switch:** none (bug fix, visual). Drawn and critiqued.

## Problem
1. Under 760 px `.stage` becomes a column, but `#waveCanvas` keeps
   `flex: 0 1 560px`, so the 560 px basis is applied vertically: the waveform is
   ~5× taller than designed and Record / Finish are below the fold. A first-time
   user on a phone has to scroll to find Record, and again to find Finish.
2. `showView()` never resets the trainer's scroll position, so results open
   where the session screen was scrolled to: heading and score ring hidden.

## Proposal
- `@media (max-width: 760px) { #waveCanvas { flex-basis: auto; height: 90px } }`
  and let the timer ring and the fillers chip share a row above it.
- `trainer.scrollTop = 0` in `showView()`.
- Target: prompt, timer, waveform, transcript (3 lines) and Record all visible
  on a 390×844 viewport without scrolling.

## Measure
Overhead seconds (no scroll needed). Screenshot of the session screen with
Record visible at 390×844.
