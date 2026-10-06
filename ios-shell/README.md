# Cadence iOS shell (Capacitor) → TestFlight

The public collage app wrapped in a native shell. `www/` is built from
`cadence-collage/` plus `ios-shell/native-speech.js`, which hands the
`@capacitor-community/speech-recognition` plugin to `app.js` as
`webkitSpeechRecognition` (WKWebView has no Web Speech API). The engine is
untouched.

## From a clean checkout (Linux or Mac)

```sh
npm install                 # Capacitor CLI, core, ios, speech plugin
sh tools/build-www.sh       # www/ from cadence-collage + the bridge
npx cap sync ios            # copies www/ into ios/App/App/public, runs pod install on a Mac
```

## On the Mac, first time (about 15 minutes)

1. `brew install cocoapods` if `pod --version` fails. The speech plugin has no
   Swift package, so the project uses CocoaPods.
2. `npx cap sync ios` (now `pod install` succeeds), then `npx cap open ios`.
3. In Xcode: select the **App** target → **Signing & Capabilities** → tick
   *Automatically manage signing* and pick your team. Change the bundle id
   from `com.justinoh.cadence` if you want a different one; it must match an
   App ID on your developer account (Xcode creates it for you with automatic
   signing).
4. **General**: Version `1.0.0`, Build `1`. Bump Build on every upload.
5. Plug the phone in, pick it as the run destination, press **Run** once.
   The first launch asks for the microphone and for speech recognition. Say
   a sentence in a Sprint; words should appear live.
6. **Product → Archive** (destination *Any iOS Device*). When the Organizer
   opens: **Distribute App → App Store Connect → Upload**, defaults all the
   way.
7. In App Store Connect → the app → **TestFlight**: the build appears after
   processing (5–15 minutes). Add yourself under *Internal Testing*, then
   install from the TestFlight app on the phone.

Every later build: edit, `sh tools/build-www.sh && npx cap sync ios`, bump
Build, Archive, Upload.

## What is different inside the shell

- Speech comes from Apple's on-device recognizer via the plugin. Interim
  results carry the whole utterance so far; iOS ends a segment on its own
  after roughly a minute or on silence, and the bridge commits it and starts
  the next one, so a 60 s drill is one or two segments.
- The waveform gets a silent stream by default: capturing the mic in the
  web view while the native recognizer owns the audio session is unreliable.
  To try the real capture, set `cadence_flags` to include `nativeRealMic`
  (Safari Web Inspector → Storage, or add a temporary `?flags=nativeRealMic`
  load in the browser version; the key is shared by the shell).
- Two permission prompts on first run (microphone, speech recognition).
- `?build=` and `?flags=` have no URL bar to live in; flags are on by
  default since 2 Oct and `localStorage` edits still work via Web Inspector.

## Files

- `capacitor.config.json` — appId, appName, webDir.
- `ios/` — the Xcode project (committed; `public/` and Pods are generated).
- `ios-shell/native-speech.js` — the bridge. `tools/test-native-shim.mjs`
  drives it with a mocked plugin in headless Chrome.
- `ios-shell/icon/` — 1024 icon and 2732 splash sources.
