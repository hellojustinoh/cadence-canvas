# Round 3 measurements

Raw rows: `port-a.jsonl`, `port-b.jsonl`, `port-retro.jsonl`.

## Port: all six variants, test build, same stubbed drill

| Variant | Taps to score | Overhead s | 3 s think score | Mic denied taps | Hidden mid-drill |
|---------|---------------|-----------|-----------------|-----------------|------------------|
| collage | 3 | 1.05 | 100 | 4 | not scored, not saved |
| editorial | 3 | 1.18 | 100 | 4 | not scored, not saved |
| lab | 3 | 1.12 | 100 | 4 | not scored, not saved |
| toybox | 3 | 1.07 | 100 | 4 | not scored, not saved |
| anime | 3 | 3.29 | 100 | 4 | not scored, not saved |
| retro | 4 | 5.05 | 100 | 5 | not scored, not saved |

Scores, wpm, stalls and words match across all six on every run (154 wpm /
30 words on the plain run, 152 wpm / 0 stalls on the 3 s think). Release
baseline on the editorial variant with a 3 s think: 90 (119 wpm, 1 stall),
the same as the collage before the port.

Anime's extra ~2 s is its intro animation; retro's extra ~4 s is the DOS boot
screen plus one more tap (its drills live in a window, no direct opener).
Both are the skin, not the engine.

## Session layout v2 (collage, 390×844)

| | v1 | v2 |
|---|---|---|
| Record bottom edge | 779 px | 832 px (bar pinned to the viewport bottom) |
| Record width | 132 px | 284 px |
| Slack below Record | 65 px | 12 px padding; bar is the bottom |
| Taps / overhead | 3 / 1.38 | 3 / 1.05 |

At 360×640 the bar is still pinned (bar bottom = 640) and the content
scrolls under it.
