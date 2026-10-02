# Brainstorm, round 1 (2026-10-01, ~22:30 SGT)

Baseline, fresh install, phone viewport (390×844), speech stubbed at 150 wpm:
4 taps and ~2.1 s of non-speaking overhead from load to the first score.
Path: hero CTA → picker → Record → Finish.

Screenshots of that path showed two defects before any idea was written:
- Session screen: the waveform canvas is ~560 px tall on phones. `.stage` turns
  into a column under 760 px but `#waveCanvas` keeps `flex: 0 1 560px`, so the
  basis applies to the vertical axis. Record and Finish sit below the fold.
- Results screen opens scrolled down; the trainer keeps the session screen's
  scroll offset, so "Here's how that went" and the score ring are hidden.

## Ideas sorted against the tenets

| # | Idea | Tenet | First sort |
|---|------|-------|-----------|
| A | Hero CTA starts Sprint directly, skip the picker | 1, 6 | keep → PRD-1 |
| B | Auto-start recording when the session screen opens | 6 | cut: starts the clock before the prompt is read, penalises pace (2) |
| C | Session screen fits a phone; results open at the top | 1, 6 | keep → PRD-2 (bug) |
| D | Filler buzz: vibrate on each new filler | 3 | keep → PRD-5 |
| E | Sub-score bars (pace / clean / flow) on results | 2 | keep → PRD-8, low confidence |
| F | Cleanliness curve matches the copy ("under 2 and you sound rehearsed") | 2 | keep → PRD-4 |
| G | First-run onboarding screen | 1 | cut: the hero is the onboarding; adds a tap |
| H | Mic denied keeps you on the session screen with a retry | 6 | keep → PRD-6 |
| I | History cap of 200 breaks all-time averages | 4 | moved to the dry-loop perf check |
| J | Daily reminder notifications | 3 | cut: needs a push server (breaks 4); local scheduled notifications don't exist in browsers |
| K | Live wpm readout during the session | 3 | cut: adds reading load mid-drill; fillers chip already covers awareness |
| L | Keep the screen awake during a drill | 2, 6 | keep → PRD-7 |
| M | PWA manifest so the phone build is installable | 4 | cut this round: iOS standalone mode has known SpeechRecognition breakage I can't verify from here |
| O | Clock starts when you speak, not at Record | 2 | keep → PRD-3 |
| P | Prompt shuffle before recording costs a tap each time | 6 | cut: optional, not on the critical path |
