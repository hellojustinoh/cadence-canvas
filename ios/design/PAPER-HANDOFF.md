# Paper handoff: Cadence iOS

Frames are iPhone 15 Pro, 393 × 852, 20pt side gutter. Tokens in `tokens.json`.
Screenshots and the full moodboard: https://claude.ai/artifact/QWYiNGTt7QWEq3XPW8vCVb

## Project structure

Pages: `01 Foundations`, `02 Screens`, `03 Share card`, `04 References`.

**01 Foundations.** Eight color swatches from `tokens.json`. Type specimen:
display 44/34/28/24, body 17, secondary 15, micro 11 uppercase, numeral
96/64/24/20, mono 12. Components: primary button (full width, 56 tall,
ink fill, bg text, radius 0), text button, hairline row (label left, mono
middle, value right, 1px rule below), stat cell (24 numeral over micro
label, 1px rule left), transcript mark (signalSoft fill, signal text, 2pt
horizontal pad), record button (72 circle, signal fill, 16pt bone square
inside when recording), tab bar (2 items, 49 tall, hairline above).

**02 Screens.** Six frames, left to right:

1. **Onboarding 1** · bg dark. Micro "Onboarding · 1 of 3" top left.
   Display 34 centered vertically: "Voice is the new keyboard. Nobody taught
   you to type with your mouth." Primary button "Continue" bottom, 24 above
   the safe area.
2. **Onboarding 2** · bg light. Display 28 "What are we fixing first?" then
   three stacked cards, 12 radius, surface fill, hairline border, 16 pad:
   "Sound sharper in meetings", "Stop saying basically", "Think faster out
   loud". Selected card: ink border 1px. Primary "Continue".
3. **Today** · bg light. Micro "THU 25 SEP". Display 34 "Day 6. / Last score
   78." Hero card: surface, 12 radius, 16 pad; micro "TODAY · SPRINT · 60
   SEC", display 20 italic "Explain your job to a smart twelve-year-old.",
   primary button "Start 60-second drill" inside the card. Below: two
   hairline rows, "Filler Hunt" / mono "45 sec · cleanliness", "Distill" /
   mono "30 sec · one idea". Sparkline 36 tall, 1px ink, last point signal.
   Tab bar: Today (active), Progress.
4. **Session** · bg dark. Top row: "Cancel" text left, micro "SPRINT" right.
   Display 28 prompt, max 3 lines. Mono "↻ shuffle". Numeral 64 "42" centered,
   with a 1px hairline arc ring at 160 diameter around it (progress shown as
   arc length). Waveform: 1px signal strokes, 28 tall, full width. Live
   transcript: body 15, ink2 for settled clauses, ink for the most recent
   one; fillers marked. Record button centered 24 above the bottom row.
   Bottom row: mono signal "fillers 03" left, mono "00:18" right.
5. **Results** · bg light. Micro "SPRINT · TODAY 8:14 AM". Numeral 96 "78"
   with mono "/100" beside the baseline. Display 24 italic "Genuinely good."
   Stat row of three: 148 / WORDS / MIN, 2.1 / FILLERS / 100, 1 / STALLS >
   2S. Body 15 coach tip, ink2. Transcript card: surface, 12 radius, 16 pad,
   display face 17 with fillers marked. Primary "Go again". Text buttons
   "Share card" and "Pick another drill" centered beneath.
6. **Progress** · bg light. Display 34 "Your curve". Secondary "Average 74
   over 12 sessions, up 6 lately." Segmented control 1W / 1M / All: text
   with 1px underline on the active item. Chart 110 tall: hairlines at 0
   and 100, 1px ink line, 2pt dots, last dot signal. Hairline rows: "Today ·
   Sprint" / mono "148 wpm · 2.1 fill" / numeral 20 "78", "Wed · Filler
   Hunt" / "131 wpm · 4.0 fill" / "66", "Tue · Distill" / "162 wpm · 1.2
   fill" / "81". Tab bar: Today, Progress (active).

**03 Share card.** 1080 × 1350, bg dark. Display 120 "78" top left with mono
"/100". Stat row of three at 48. Display 40 italic: the best sentence from
the transcript. Wordmark "cadence" bottom left, display 32. No URL.

**04 References.** Place the 26 Mobbin screenshots in five rows matching the
moodboard sections, each with the app name as a micro label.

## Building it locally

Paper runs on your Mac, so the build happens in a local Claude Code session,
not a cloud one.

1. Install Paper Desktop from https://paper.design/downloads and open it once.
2. Check out this branch and open the repo in Claude Code on the desktop
   (or run `claude` in the repo). `.mcp.json` registers Paper's MCP server
   (`~/.paper/bin/paper mcp`); approve it when prompted and confirm with `/mcp`.
3. With Paper Desktop open and a file loaded, run `/paper-build`. It reads
   this file, `tokens.json` and `DESIGN-BRIEF.md`, uses
   `ios/design/reference-canvas/` for exact copy and geometry, builds pages 01
   and 02, and stops for review before 03 and 04.

Reference build of pages 01 and 02: https://claude.ai/artifact/BY1KTiAR8iatQQZirH1C8z
