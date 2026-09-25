# Cadence for iPhone: design brief and Mobbin references

Audience: 25 to 34, working professionals, tech forward, fashion forward, the
people whose taste other people copy. They already use Opal, Oura, Arc, Cash App,
SSENSE and Substack. They have zero patience for mascots, confetti, or a
gamified streak flame. They will forgive a lot if the type is good.

This brief takes the existing web app (drills, scoring engine, transcript with
fillers marked) and proposes one native visual direction for iOS, built from
what those apps do well. Every reference below links to Mobbin.

---

## 1. The read on the references

Pulled roughly 90 iOS screens across ten apps. Three patterns matter for us.

**Monochrome editorial, one signal color.** SSENSE and Grailed run almost
entirely in black, white and grey, with uppercase tracked micro labels and
hard-edged black buttons. Nothing is decorated. The product photography does
the work, and in our case the transcript and the number do the work.

- [SSENSE search, uppercase labels and stark hierarchy](https://mobbin.com/screens/72922118-ccb6-4350-9482-de4f785089e5)
- [SSENSE shopping bag, black rectangular CTA, no radius](https://mobbin.com/screens/ccd8f384-9d9c-45d9-a689-590306788a4a)
- [Grailed discover, editorial hero with a serif-weight headline over image](https://mobbin.com/screens/433b0dc0-93a5-42fa-9224-b132dab59d60)
- [Grailed featured collection card](https://mobbin.com/screens/1b756341-885b-4b30-8a73-0cc30c5d1f27)

**The oversized number as the hero.** Cash App puts one number on screen and
lets everything else be small. Nike Run Club's post-run screen is a single
italic "3.13" and three quiet stats beneath it. Opal's score sits inside a
gauge, dark background, three metric pills under it. This is exactly the shape
of our results screen.

- [Cash App balance, one giant figure, white card on black](https://mobbin.com/screens/6630683d-9dbb-4146-9373-63422011000f)
- [Cash App "Net: +$16.95" chart header](https://mobbin.com/screens/2d543e0f-4c65-44d5-8828-a35df58ba902)
- [Nike Run Club run summary, one number, three stats](https://mobbin.com/screens/3b656c09-f15a-4bab-8339-a40afd3cf5f9)
- [Nike Run Club share widget, black card, three stats](https://mobbin.com/screens/b78781ac-02d5-4464-b6dc-5bf63f4e1cbf)
- [Opal score gauge with three metric pills](https://mobbin.com/screens/bad32255-2039-4c36-adb1-23ba96c7a709)
- [Opal home, hero image, score, metric pills](https://mobbin.com/screens/1b3deee1-a193-4e36-93b0-7e89740f9c5c)

**Dark, calm session states.** Waking Up's timer is a thin ring, a big
number, and a blurred gradient. Pillowtalk's recording screen is a single
grey blob on black with a stop button. ElevenLabs strips the recorder down to
a waveform, two timestamps in mono, and a stop button. When you are speaking,
the app should get out of the way.

- [Waking Up timer, ring plus number, nothing else](https://mobbin.com/screens/c07eb338-1b01-402f-9819-95e86a9cc377)
- [Waking Up timer setup, big number and bar chart of minutes](https://mobbin.com/screens/8a2e9ecc-5bfb-43be-bae3-3a482c803379)
- [pillowtalk record, blob on black](https://mobbin.com/screens/7db58a01-1c40-4cf4-8400-b9351b16a4a7)
- [ElevenLabs voice recorder, waveform and mono timestamps](https://mobbin.com/screens/92e7268e-c320-45f8-b909-bb5d98be0f20)
- [Quo voice recorder, stop button with orange time pill](https://mobbin.com/screens/60735723-eb81-40e8-a1b0-bccec827fa9e)

Supporting references for individual screens:

- Data over time: [Oura activity chart, white line on black](https://mobbin.com/screens/85f64354-b654-443b-a8ff-239a1b7896d9), [Oura workout summary with labeled stat grid](https://mobbin.com/screens/83208126-a5f9-440f-9005-de2b03211350), [Bevel strength progression line](https://mobbin.com/screens/9d4d8735-053b-4e9c-a425-67bc0289f889)
- History list: [Bevel activity history](https://mobbin.com/screens/2c8bd560-dba7-420d-acee-4c2a5443d010)
- Transcript with marked words: [Otter transcript, highlighted phrases](https://mobbin.com/screens/e01cb2e6-b43c-4ccc-8765-9012fde4a1a7), [Otter search highlights](https://mobbin.com/screens/0a13bb45-3a25-4bc1-a283-67a2d9756370)
- Onboarding: [Opal typographic statement screens](https://mobbin.com/flows/91394aa7-8b77-461f-b95a-ad3f177e98f3), [Opal "we take privacy seriously" permission sheet](https://mobbin.com/screens/3df27095-1780-43f2-a52d-ab6172e3c704), [Perplexity "private by design" consent](https://mobbin.com/screens/4597c7ea-99cf-40b1-81fa-9b0546b885db), [Bevel goal picker cards](https://mobbin.com/flows/0b6f9210-c215-4b32-872d-3fb66ab3ed28)
- Editorial type pairing: [Substack post header, bold serif over sans](https://mobbin.com/screens/201fb7bf-d196-40cb-90dc-943ed82808d9)

### What to avoid, and why

- Gentler Streak's illustrated mascot and pastel cards. Warm, but reads as a
  wellness app for a different buyer.
- Ladder's confetti and "Share Proof" celebration. Our user shares a black
  card with a number on it, not a party.
- Copilot Money's emoji category rings. Emoji as UI is the one thing the
  collage web version does that should not carry over.
- Gradients as decoration (Arc Search). Fine for a browser, wrong for a tool
  that scores you.

---

## 2. Proposed direction: "Editorial Instrument"

The existing web app has six treatments. The one closest to this audience is
the `cadence/` editorial variant (bone background, serif display), but iOS
needs it to tighten up. Take the editorial voice, borrow SSENSE's discipline,
and let the session screen flip to black like a stage going dark.

### Palette

| Token | Light (default) | Dark (session, and system dark) |
|---|---|---|
| bg | `#F4F1EA` bone | `#0A0A0A` |
| surface | `#FFFFFF` | `#161616` |
| ink | `#111111` | `#F4F1EA` |
| ink-2 | `#6B6860` | `#9A978F` |
| rule | `#DAD6CC` | `#2A2A2A` |
| signal | `#E84A2A` vermilion | same |
| signal-soft | `#FBE3DC` | `#3A1A12` |

One accent, used only for three things: the record button, filler marks in the
transcript, and the live filler counter. Never for decoration. Score and
pace are ink, not color, because a good score should look like a headline,
not a traffic light.

### Type

- Display: a high-contrast serif with real italics. First choice
  **Instrument Serif** (free, sharp, fashion adjacent). Fallback: New York
  (system serif, zero cost).
- Text and UI: **SF Pro** with `-0.2` tracking on body, uppercase micro
  labels at 11pt with `+0.08em` tracking, exactly like SSENSE section headers.
- Numerals: SF Pro Display, tabular, weight 500, at 96pt for the score and
  64pt for the countdown. Nike and Cash App both prove a big regular-weight
  number outclasses a big bold one.
- Mono: SF Mono for timestamps and wpm inline, small, grey.

### Shape and motion

- Corner radius: 0 on primary black buttons (SSENSE), 12 on cards, full pill
  on the record button only.
- Rules, not shadows. One-pixel hairlines in `rule` separate everything.
- Motion: the countdown number ticks with a subtle vertical slide. The score
  counts up over 1.1s (already in the web engine). The transition from Today
  to Session is a background crossfade from bone to black, 300ms. Nothing
  bounces.

### Voice

Keep the collage variant's copy, which is already the right tone: "Train your
voice to think out loud", "Beautifully said.", "Genuinely good.", "A solid
start." Drop the emoji from the score strip. Drill names stay Sprint, Filler
Hunt, Distill.

---

## 3. Screen by screen

Five screens plus onboarding. Tab bar has two items, Today and Progress, in
the style of Grailed's plain icon-and-label bar. No floating pill nav.

### Onboarding (3 screens, once)

Reference: Opal's typographic statement screens, Perplexity's consent sheet.

1. Black screen, serif display, one line: *"Voice is the new keyboard. Nobody
   taught you to type with your mouth."* Continue.
2. Goal picker, three stacked cards (Bevel): "Sound sharper in meetings",
   "Stop saying basically", "Think faster out loud". Selection sets the
   default drill.
3. Mic permission with a plain privacy statement: "Transcription runs on
   this phone. Nothing is uploaded." Then the system prompt.

### Today

Reference: Opal home for structure, SSENSE for type, Cash App for the card.

- Top: date in uppercase micro label, then serif greeting line pulled from
  the streak logic ("Day 6. Last score 78.").
- Hero card (white on bone): the suggested drill for today, its prompt
  preview in serif italic, a full-width black "Start 60-second drill" button.
- Below: the other two drills as hairline-separated rows, name plus
  "45 sec · cleanliness" in mono, chevron.
- Bottom: a single-line sparkline of the last ten scores, no axis.

### Session

Reference: Waking Up timer, ElevenLabs recorder, pillowtalk.

- Background flips to black. Status bar goes light.
- Prompt at the top in serif, 28pt, max three lines. Shuffle is a small
  ghost button under it.
- Center: the countdown as a 64pt tabular number. The ring from the web
  version becomes a 1px hairline arc around it, not a fat progress bar.
- Waveform: 1px vermilion line, live, full width, below the number.
- Live filler chip: bottom left, mono, "fillers 03", turns vermilion on each
  increment with a 120ms flash.
- Live transcript scrolls up from the bottom third in grey, the most recent
  clause in ink.
- Record button: 72pt vermilion circle. Stops become a square inside it.
- Exit: "Cancel" as text, top left. No confirm dialog under 10 seconds in.

### Results

Reference: Nike Run Club run summary, Cash App balance, Otter highlights.

- Back to bone. Uppercase micro label "Sprint · Today 8:14 AM".
- The score: 96pt tabular numeral, ink, with "/100" in mono grey beside it.
  The grade line under it in serif italic ("Genuinely good.").
- Three stats in a hairline-divided row, exactly Nike's layout: words/min,
  fillers per 100, stalls over 2s. Numbers at 24pt, labels micro uppercase.
- Coach tip as one paragraph, body size, from the existing tip logic.
- Transcript card: white, serif body at 17pt, every filler wrapped in a
  vermilion-soft highlight with vermilion text. This is the screenshot people
  share, so it has to be beautiful on its own.
- Actions: black full-width "Go again", then "Share card" and "Pick another
  drill" as text buttons.

### Share card (generated image)

Reference: Nike Run Club widget.

Black card, 4:5. Score at the top in serif, three stats in a row, the single
best sentence from the transcript in serif italic, "cadence" wordmark bottom
left. No app store badge, no URL.

### Progress

Reference: Oura activity chart, Bevel history list.

- Header: serif "Your curve", then the summary line the engine already
  produces ("Average 74 over 12 sessions, up 6 lately").
- Chart: white line on bone in light, bone on black in dark, 1px, dots at
  each session, no gridlines, y axis only as 0 and 100 hairlines.
- Segmented control: 1W, 1M, All. SSENSE style, underline not pill.
- List: date and drill on the left, "148 wpm · 2.1 fill" in mono in the
  middle, score right aligned at 20pt. Hairline between rows. Tap opens the
  saved transcript.

---

## 4. What carries over from the web engine unchanged

- The scoring math in `cadence-collage/app.js` (pace window 130 to 190 wpm,
  filler penalty 12 per point of rate, pause penalty, word floor). Port it
  line for line into Swift so the iOS scores match the web.
- The filler list and the regex behavior. On iOS this runs against
  `SFSpeechRecognizer` results instead of Web Speech.
- The three drills, their durations, and their prompt banks.
- Grade and tip copy.

## 5. Open decisions

- **Instrument Serif vs New York.** Instrument is more distinctive and free
  to bundle. New York is zero risk and already on every iPhone. Recommend
  Instrument for display only, New York nowhere.
- **Light default vs dark default.** The references split. Recommend light
  (bone) as default with the session screen always black, and full dark mode
  following the system setting. Screenshots of a bone results screen will
  stand out in a feed of black app screenshots.
- **On-device transcription only.** `SFSpeechRecognizer` supports on-device
  recognition for English and the privacy line in onboarding depends on it.
  Worth committing to before building the session screen.

## 6. Next step

Build the five screens as a SwiftUI prototype with hard-coded data, get the
type and spacing right on a real device, then wire the speech engine.
