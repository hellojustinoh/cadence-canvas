# Cadence — one product, six aesthetics, one agentic canvas

**Cadence** is a browser-based voice-training gym: 60-second speaking drills that
score you on pace, filler words, and flow, built on the premise that as AI
interfaces go voice-first, the bottleneck stops being how fast you type and
becomes how clearly you can think out loud.

This repo is really a design experiment. The *same* app — same drills, same
scoring engine, same Web Speech transcription — is rendered in **six completely
different aesthetic treatments**, and the whole set hangs on an **agentic design
canvas** where you can pan around the live variants and leave per-version
feedback that an agent reads, ships, and replies to.

The interesting part isn't that each version looks different. It's that each
version *talks* different: the aesthetic reshapes the copy, the button labels,
the empty states, and even what the product calls its own features. That method
is written up as a reusable skill (see **The method** below).

---

## The six treatments

| Dir | Treatment | Look | Voice |
|-----|-----------|------|-------|
| [`cadence/`](cadence/) | **Editorial** | warm bone, Fraunces serif, animated text ribbons | "Stop drafting, start saying." |
| [`cadence-lab/`](cadence-lab/) | **Lab console** | near-black instrument panel, volt-green, mono telemetry | `INITIATE DRILL` · `SIGNAL LOST` |
| [`cadence-toybox/`](cadence-toybox/) | **Toybox** | candy color blocks, bouncy, emoji tiles | "Say it like you mean it." · a ghost eats your fillers |
| [`cadence-collage/`](cadence-collage/) | **Collage** | white + navy serif, pastel graph-paper cards, doodles | "Train your voice to think out loud." |
| [`cadence-retro/`](cadence-retro/) | **Retro '95** | System-7 desktop, CRT scanlines, DOS boot screen | "It's a beautiful day to say it out loud." · drills are "Episodes" |
| [`cadence-anime/`](cadence-anime/) | **Retro anime** | Evangelion/Akira terminal, hazard stripes, kanji | `話せ。` · scored on "sync ratio" · `EJECT` |

Each lives in its own self-contained directory (`index.html` + `styles.css` +
`app.js`). The trainer engine and scoring logic are kept functionally identical
across all six, so they're honest comparisons — a reskin, not a rewrite.

## The agentic canvas

[`canvas/`](canvas/) is an infinite pan/zoom board that renders all six versions
as live, interactive iframes, each with its own comment thread.

- Drag the background to pan, pinch/scroll to zoom, drag a frame header to
  rearrange, **Fit** to frame everything.
- Leave feedback on any version. Comments persist to `canvas/feedback.json` via
  a tiny API in `canvas/server.py`.
- That file is the agent's inbox: point an agent at it, and it applies each
  change to that version's code, marks the item `done`, and writes a reply that
  shows up under your comment (the canvas polls and updates live).
- **Copy open feedback** formats all open items as a ready-to-paste prompt.

One server serves the canvas and all six versions from a single origin, so
there's nothing to wire up per-version.

## Run it

Needs only Python 3 (and Chrome, for the Web Speech API the trainer uses):

```bash
python3 canvas/server.py 4190
# open http://localhost:4190
```

To run a single treatment on its own instead:

```bash
python3 -m http.server 8000 --directory cadence-lab
# open http://localhost:8000
```

Notes:
- Speech recognition runs **locally in the browser**; no audio is uploaded, and
  session history lives in `localStorage`.
- Works best in Chrome/Edge (Web Speech API). Clicking record triggers the
  browser's mic permission prompt.

## The method

Every aesthetic here was applied on two layers at once — the visual *and* the
brand voice — so the words and the pixels tell the same story. That practice is
captured as a reusable Claude Code skill, **`aesthetic-restyle`**: decode a
reference's design DNA, derive the voice the aesthetic implies, then rewrite
every copy surface (not just the hero — buttons, empty states, errors, feature
names) while keeping the product identical underneath.

## Stack

Vanilla HTML/CSS/JS, the Web Speech API, the Web Audio API (live waveforms), and
a ~120-line Python standard-library server for the canvas + feedback API. No
build step, no dependencies.

---

🤖 Built with [Claude Code](https://claude.com/claude-code).
