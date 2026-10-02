#!/usr/bin/env python3
"""PRD-13: port the engine flags from cadence-collage into the other five variants.
Every edit is anchored on an exact string and asserted, so a drifted file fails loudly
instead of being half-ported. Run from the repo root. Idempotent (skips a file that
already has the build switch)."""
import re, sys, pathlib

TARGETS = {
  'cadence': dict(
    mic='Cadence needs the mic to run a drill. Allow it, then tap Record again.',
    cut=('That one got cut off.', 'The phone locked or switched away mid-drill, so the mic stopped. Score not saved. Your words are below.'),
    grace='🔥 ${streak}-day streak · keep it going today'),
  'cadence-lab': dict(
    mic='ERR: microphone access denied. grant mic permission, then press record again.',
    cut=('SIGNAL LOST', '// session interrupted: page hidden mid-run. mic stopped. score not logged. tape below.'),
    grace='// streak: ${streak} days · today still open'),
  'cadence-toybox': dict(
    mic='Cadence needs your mic to play. Allow it, then hit Record again.',
    cut=('Oops, that one got cut off!', 'Your phone locked or you switched apps, so the mic stopped. No score this time. Your words are below.'),
    grace='🔥 ${streak} days in a row · keep it going today'),
  'cadence-anime': dict(
    mic='ERR: MICROPHONE ACCESS DENIED. GRANT UPLINK, THEN RE-ENGAGE RECORD.',
    cut=('SIGNAL LOST', '// SORTIE ABORTED: UPLINK HIDDEN MID-RUN. SYNC NOT LOGGED. TRANSCRIPT BELOW.'),
    grace="// STREAK: ${streak} DAYS · TODAY'S SORTIE PENDING"),
  'cadence-retro': dict(
    mic='ERROR: microphone access denied. Allow the mic, then press Record again.',
    cut=('TAPE CUT.', '> the window went away mid-episode, so the mic stopped. Score not saved. Transcript below.'),
    grace="${streak} days of episodes in a row. Today's is still untaped."),
}

BUILD_BLOCK = r"""
/* ---------- build switch (shared engine; see cadence-collage/app.js) ----------
   ?build=test turns every flag on and persists until ?build=release.
   ?flags=a,-b overrides single flags (persisted). window.cadenceBuild shows the result. */
const BUILD = (() => {
  try {
    const p = new URLSearchParams(location.search);
    const b = p.get('build');
    if (b) localStorage.setItem('cadence_build', b);
    if (b === 'release') localStorage.removeItem('cadence_flags');
    const f = p.get('flags');
    if (f !== null) localStorage.setItem('cadence_flags', f);
    return localStorage.getItem('cadence_build') || 'release';
  } catch { return 'release'; }
})();
const FLAG_DEFAULTS = {
  clockOnSpeech: false,   // stalls and wpm are measured from the first word (the clock still counts from Record)
  cleanCurve: false,      // full marks up to 2 fillers / 100 words
  micRetryInline: false,  // mic denied keeps the session screen
  interruptedGuard: false,// a drill cut off by a hide/lock is not scored or saved
  longHistory: false,     // keep 5000 sessions instead of 200
  streakGrace: false,     // streak counts from yesterday until today's drill
  recognitionLocale: false,// English device locale passed to recognition instead of en-US
};
const FLAGS = (() => {
  const f = { ...FLAG_DEFAULTS };
  if (BUILD === 'test') Object.keys(f).forEach(k => (f[k] = true));
  let ov = '';
  try { ov = localStorage.getItem('cadence_flags') || ''; } catch {}
  ov.split(',').filter(Boolean).forEach(s => {
    const off = s.startsWith('-');
    const k = off ? s.slice(1) : s;
    if (k in f) f[k] = !off;
  });
  return f;
})();
window.cadenceBuild = { build: BUILD, flags: FLAGS };
document.documentElement.dataset.build = BUILD;
document.documentElement.dataset.flags = Object.keys(FLAGS).filter(k => FLAGS[k]).join(' ');

"""

def port(name, cfg):
  js = pathlib.Path(name, 'app.js'); s = js.read_text()
  if 'const FLAG_DEFAULTS' in s:
    print(name, 'already ported'); return
  def rep(old, new, count=1, regex=False):
    nonlocal s
    if regex:
      s2, n = re.subn(old, new, s, count=count)
      assert n == count, f'{name}: regex anchor missed ({n} of {count}): {old[:60]}'
    else:
      assert s.count(old) >= count and (count != 1 or s.count(old) == 1), f'{name}: anchor count {s.count(old)} for: {old[:60]}'
      s2 = s.replace(old, new, count)
    s = s2
  # 1 build block before the state object
  rep('\nconst state = {', BUILD_BLOCK + 'const state = {')
  # 2 state fields
  rep(r'lastResultAt: 0,\s*longPauses: 0,', 'lastResultAt: 0, longPauses: 0, firstResultAt: 0, interrupted: false,', regex=True)
  rep(r'lastResultAt: performance\.now\(\),\s*longPauses: 0,', 'lastResultAt: performance.now(), longPauses: 0, firstResultAt: 0, interrupted: false,', regex=True)
  # 3 stall gate
  rep('    if (performance.now() - state.lastResultAt > 2000) {',
      '    const armed = !FLAGS.clockOnSpeech || state.firstResultAt > 0; // reading the prompt is not a stall\n'
      '    if (armed && performance.now() - state.lastResultAt > 2000) {')
  # 4 first result
  rep('function onSpeechResult(e) {\n  state.lastResultAt = performance.now();',
      'function onSpeechResult(e) {\n  state.lastResultAt = performance.now();\n  if (!state.firstResultAt) state.firstResultAt = state.lastResultAt;')
  # 5 wpm from first word
  rep('  const minutes = Math.max(state.elapsed, 5) / 60;',
      '  let spoken = state.elapsed;\n'
      '  if (FLAGS.clockOnSpeech && state.firstResultAt > 0) spoken = Math.min(spoken, (performance.now() - state.firstResultAt) / 1000);\n'
      '  const minutes = Math.max(spoken, 5) / 60;')
  # 6 cleanliness curve
  rep('  const fillerScore = Math.max(0, 100 - fillerRate * 12);',
      '  const fillerScore = FLAGS.cleanCurve\n'
      '    ? Math.max(0, 100 - Math.max(0, fillerRate - 2) * 10)\n'
      '    : Math.max(0, 100 - fillerRate * 12);')
  # 7 tags on the result
  rep('  return { words, wpm, fillers, fillerRate: +fillerRate.toFixed(1), pauses, score };',
      '  const r = { words, wpm, fillers, fillerRate: +fillerRate.toFixed(1), pauses, score };\n'
      '  if (FLAGS.clockOnSpeech) r.clockOnSpeech = true;\n'
      '  if (FLAGS.cleanCurve) r.cleanCurve = true;\n'
      '  return r;')
  # 8 history cap
  rep('  localStorage.setItem(STORE_KEY, JSON.stringify(h.slice(-200)));',
      '  const cap = FLAGS.longHistory ? 5000 : 200;\n'
      '  try { localStorage.setItem(STORE_KEY, JSON.stringify(h.slice(-cap))); } catch {}')
  # 9 streak grace
  rep('  const d = new Date();\n  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }',
      '  const d = new Date();\n'
      '  const todayOpen = FLAGS.streakGrace && !days.has(d.toDateString());\n'
      '  if (todayOpen) d.setDate(d.getDate() - 1);\n'
      '  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }')
  rep(r"(el\.textContent = streak > 1\n    \? )(`[^`]*`)", lambda m: m.group(1) + '(todayOpen ? `' + cfg['grace'] + '` : ' + m.group(2) + ')', regex=True)
  # 10 recognition locale + error fallback
  rep("  rec.lang = 'en-US';",
      "  const lang = (navigator.language || '').toLowerCase();\n"
      "  rec.lang = FLAGS.recognitionLocale && lang.startsWith('en') ? navigator.language : 'en-US';")
  onair = "      if (typeof setOnAir === 'function') setOnAir(false);\n" if name == 'cadence-retro' else ''
  rep('  rec.onend = () => {',
      "  rec.onerror = e => {\n"
      "    if (e.error === 'language-not-supported' && rec.lang !== 'en-US') { rec.lang = 'en-US'; return; }\n"
      "    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {\n"
      "      state.running = false;\n" + onair +
      "      micInline();\n"
      "    }\n"
      "  };\n"
      '  rec.onend = () => {')
  # 11 mic denied stays put
  rep(r"(  try \{\n    state\.stream = await navigator\.mediaDevices\.getUserMedia\(\{ audio: true \}\);\n  \} catch \{\n)",
      r"\1    if (FLAGS.micRetryInline) { micInline(); return; }\n", regex=True)
  rep('async function beginSession() {\n',
      'async function beginSession() {\n  micRestore();\n')
  # 12 interrupted guard in showResults
  rep('function showResults() {\n  const r = scoreSession();\n',
      'function showResults() {\n  const r = scoreSession();\n  const cut = FLAGS.interruptedGuard && state.interrupted;\n')
  rep(r"(\$\('#scoreGrade(?:Tag)?'\)\.textContent = )(gradeFor\(r\.score\)|grade);",
      lambda m: m.group(1) + "cut ? " + repr(cfg['cut'][0]) + " : (" + m.group(2) + ");", regex=True)
  rep("$('#scoreTip').textContent = tipFor(r);", "$('#scoreTip').textContent = cut ? " + repr(cfg['cut'][1]) + " : tipFor(r);")
  rep(r"  animateNumber\(\$\('#scoreNum'\), r\.score, (\d+)\);", r"  if (cut) $('#scoreNum').textContent = '–'; else animateNumber($('#scoreNum'), r.score, \1);", regex=True)
  # saveSession inside showResults only (the first call after the showResults anchor)
  i = s.index('function showResults() {'); j = s.index('  saveSession(r);', i)
  s = s[:j] + '  if (!cut) saveSession(r);' + s[j + len('  saveSession(r);'):]
  # per-skin score animations that would contradict "not scored"
  s = s.replace("arc.style.strokeDashoffset = 339.3 * (1 - r.score / 100);", "arc.style.strokeDashoffset = cut ? 339.3 : 339.3 * (1 - r.score / 100);")
  s = s.replace("bar.style.width = `${r.score}%`;", "bar.style.width = `${cut ? 0 : r.score}%`;")
  s = s.replace("if (r.score >= 85) confetti();", "if (!cut && r.score >= 85) confetti();")
  # 13 helpers + visibility listener
  s += f"""
/* ---------- shared engine helpers (ported from cadence-collage) ---------- */
function micInline() {{
  const lt = $('#liveTranscript');
  if (!lt.dataset.prev) lt.dataset.prev = lt.innerHTML;
  lt.innerHTML = '<span class="lt-mic">{cfg['mic']}</span>';
}}
function micRestore() {{
  const lt = $('#liveTranscript');
  if (lt.dataset.prev) {{ lt.innerHTML = lt.dataset.prev; delete lt.dataset.prev; }}
  const w = $('#micWarning'); if (w) w.hidden = true;
}}
document.addEventListener('visibilitychange', () => {{
  if (FLAGS.interruptedGuard && state.running && document.visibilityState === 'hidden') state.interrupted = true;
}});
"""
  js.write_text(s)
  css = pathlib.Path(name, 'styles.css')
  c = css.read_text()
  if '.lt-mic' not in c:
    c += "\n/* mic-denied message shown in the transcript box (flag micRetryInline) */\n#liveTranscript .lt-mic { font-weight: 600; font-style: normal; }\n"
    css.write_text(c)
  print(name, 'ported')

for n, cfg in TARGETS.items():
  port(n, cfg)
