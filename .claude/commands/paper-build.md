---
description: Build the Cadence iOS design as a Paper project from ios/design/PAPER-HANDOFF.md
---

Read these first, in order:
1. ios/design/PAPER-HANDOFF.md (project structure, frame-by-frame specs, component list)
2. ios/design/tokens.json (palette light and dark, type scale, spacing, radii, sizes, motion)
3. ios/design/DESIGN-BRIEF.md (rationale, voice, and the 26 Mobbin reference links)

A frame-by-frame reference build of pages 01 and 02 already exists as HTML in
ios/design/reference-canvas/ (one .dc.html per artboard, canvas.json for layout).
Use it for exact copy, numbers, spacing and SVG coordinates. Match it; do not redesign it.

Confirm Paper is connected (the `paper` MCP server from .mcp.json; Paper Desktop must be
open with a file loaded). If it is not connected, stop and say so.

Using the Paper MCP tools, create a new project called "Cadence iOS" and build it exactly
as PAPER-HANDOFF.md specifies:
- Page 01 Foundations: eight color swatches, type specimen, and the listed components.
- Page 02 Screens: six iPhone 15 Pro frames (393 x 852) in the order given, real copy and numbers.
- Page 03 Share card: 1080 x 1350.
- Page 04 References: the 26 Mobbin screenshots linked in DESIGN-BRIEF.md in five rows
  matching the brief's sections, each labeled with the app name.

Rules: Instrument Serif for display type, SF Pro for everything else, SF Mono for timestamps
and wpm. Primary buttons have zero corner radius. One accent color (#E84A2A) and only on the
record button, filler marks, and the live filler counter. Hairlines, no shadows. No emoji,
no illustrations, no gradients.

Build pages 01 and 02 first and stop for review before doing 03 and 04.

$ARGUMENTS
