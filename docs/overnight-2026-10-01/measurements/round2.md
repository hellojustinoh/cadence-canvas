# Round 2 measurements and dry-loop checks

Raw rows: `round2.jsonl`, `checks.jsonl`.

| Scenario | Release | Test build | Flag |
|----------|---------|------------|------|
| Page hidden 4 s into a drill (lock / app switch) | scored 100, saved | "That one got cut off", no score, not saved | interruptedGuard |
| Morning after a 5-day streak, no drill yet | "5 sessions logged" | "5 days in a row · keep it going today" | streakGrace |
| Sessions kept after a save with 1,096 in storage | 200 | 1,096 | longHistory |
| Taps / overhead seconds to first score (early Finish) | 4 / 1.44 | 3 / 1.55 | unchanged by round 2 |

## Dry-loop checks (release build unless noted)

**Performance with years of data.** 3 years of daily sessions (1,095, 121 KB)
renders Progress in 35 ms; 3 a day for 3 years (3,285, 362 KB) in 35 ms. The
old 200 cap, not speed, was the limit.

**Accessibility settings.** With the OS reduced-motion setting on, every
animation ran at full length and scroll stayed smooth; now all of them
collapse to 0.01 ms and scroll is instant. The trainer overlay had no dialog
role and focus stayed on the page behind it; now `role="dialog"`, focus lands
on the view heading. Muted labels measure 2.3:1 on white and 2.25:1 on the
butter card (AA needs 4.5:1); `contrastLabels` lifts them to about 5:1. White
on tomato (primary buttons) is 3.7:1 and is left as the brand choice. At 150%
text size nothing overflows horizontally, the top bar wraps to two rows, and
Record needs one scroll on the session screen.

**Other locales.** Dates in history already localise (de: "1. Okt., 16:22",
ja: "10月1日 23:22"). Stats labels ("wpm", "fill/100w") and all copy are
English, as is the filler list, so the app is English-only by design and
`lang="en"` is correct. Recognition was pinned to en-US for every device;
`recognitionLocale` passes an English device locale through (en-SG for the
owner's phone).

**Clock changes.** The drill timer uses `performance.now()`, so a wall-clock
change mid-drill cannot shorten or lengthen a drill. Streaks use local
calendar days: the morning after the UK DST change shows the same "sessions
logged" fallback as any other morning (the PRD-11 bug, not DST). Three 07:30
Singapore sessions viewed from New York read as three local days, streak
intact once `streakGrace` is on. A clock set back a week puts all sessions in
the future and the streak reads 0; harmless, self-heals.

**Upgrade from the phone's build.** Storage written by the current public
build (`cadence_history_v1` only) loads unchanged. New keys are additive
(`cadence_build`, `cadence_flags`). Switching back is `?build=release`.
