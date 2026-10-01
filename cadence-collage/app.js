/* ============================================================
   CADENCE COLLAGE · app.js
   Same trainer engine, friendly-editorial UI (ring timer).
   ============================================================ */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const MODES = {
  sprint: {
    label: 'Sprint',
    seconds: 60,
    weights: { pace: 0.5, filler: 0.3, pause: 0.2 },
    prompts: [
      'Pitch your favorite app to a skeptical CFO.',
      'Explain what you actually do at work to a smart 12-year-old.',
      'Argue for or against: every meeting should be a voice memo.',
      'Describe your ideal workday, hour by hour.',
      'Convince a friend to switch from typing to dictation.',
      'Explain why your hometown is underrated.',
      'Walk through how you would onboard a new teammate in week one.',
      'Sell me the last thing you bought, like you work on commission.',
    ],
  },
  filler: {
    label: 'Filler Hunt',
    seconds: 45,
    weights: { pace: 0.2, filler: 0.6, pause: 0.2 },
    prompts: [
      'Describe your morning routine. Every filler word costs you.',
      'Review the last show or movie you watched. Cleanly.',
      'Explain how to make your go-to meal, step by step.',
      'Tell the story of your most chaotic travel day.',
      'Describe your dream home without a single "like".',
      'Explain a hobby of yours to someone who has never heard of it.',
    ],
  },
  distill: {
    label: 'Distill',
    seconds: 30,
    weights: { pace: 0.3, filler: 0.35, pause: 0.35 },
    prompts: [
      'Summarize your week in three sentences. Go.',
      'Give the TL;DR of the last article or thread you read.',
      'What does your company do? One breath.',
      'Explain AI to your grandparents in under 30 seconds.',
      'Leave a voicemail asking your landlord to fix the heat. Clear ask, no rambling.',
      'State one opinion you hold and the single best reason for it.',
    ],
  },
};

const FILLERS = [
  'um', 'uh', 'uhm', 'er', 'ah', 'hmm',
  'like', 'you know', 'i mean', 'sort of', 'kind of', 'kinda', 'sorta',
  'basically', 'literally', 'actually', 'honestly', 'obviously',
  'right\\?', 'so yeah', 'or whatever', 'stuff like that',
];
const FILLER_RE = new RegExp(`\\b(${FILLERS.join('|')})\\b`, 'gi');

const CIRC = 339.3; // 2π × 54

/* ---------- build switch ----------
   ?build=test turns every flag on and persists until ?build=release.
   ?flags=a,-b overrides single flags (persisted). window.cadenceBuild shows the
   result. Anything that changes scoring, onboarding, or notifications sits
   behind one of these until it is switched on for release. */
const BUILD = (() => {
  try {
    const p = new URLSearchParams(location.search);
    const b = p.get('build');
    if (b) localStorage.setItem('cadence_build', b);
    if (b === 'release') localStorage.removeItem('cadence_flags'); // release means release: drop hand edits too
    const f = p.get('flags');
    if (f !== null) localStorage.setItem('cadence_flags', f);
    return localStorage.getItem('cadence_build') || 'release';
  } catch { return 'release'; }
})();
const FLAG_DEFAULTS = {
  directStart: false,     // PRD-1 hero CTA lands on Sprint
  clockOnSpeech: false,   // PRD-3 timer arms on the first word
  cleanCurve: false,      // PRD-4 cleanliness matches the copy
  micRetryInline: false,  // PRD-6 mic denied keeps the session screen
  interruptedGuard: false,// PRD-9 a drill cut off by a hide/lock is not scored or saved
  longHistory: false,     // PRD-10 keep 5000 sessions instead of 200
  streakGrace: false,     // PRD-11 streak counts from yesterday until today's drill
  contrastLabels: false,  // a11y: muted labels at 4.5:1 instead of 2.3:1
  recognitionLocale: false,// locale: en-GB / en-SG / en-IN recognition instead of en-US for everyone
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

const state = {
  mode: null, prompt: '', running: false, startedAt: 0, elapsed: 0,
  finalTranscript: '', interim: '', lastResultAt: 0, longPauses: 0, firstResultAt: 0, interrupted: false,
  timerId: null, recognition: null, audioCtx: null, analyser: null,
  stream: null, rafId: null,
};

const trainer = $('#trainer');
const views = {
  drills: $('#view-drills'),
  session: $('#view-session'),
  results: $('#view-results'),
  progress: $('#view-progress'),
};

/* ---------- open / close / views ---------- */
function openTrainer(mode) {
  trainer.hidden = false;
  document.body.style.overflow = 'hidden';
  renderStreak();
  if (mode && MODES[mode]) startSetup(mode);
  else showView('drills');
  // a11y: the overlay is a dialog, so move focus into it instead of leaving it on the page behind
  const heading = $('.tview:not([hidden]) .tv-h, .tview:not([hidden]) .s-mode');
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
}
// PRD-12: the phone has no console, so say which build is running
(function renderBuildBadge() {
  const el = $('#buildBadge');
  if (!el) return;
  const anyOn = Object.keys(FLAGS).some(k => FLAGS[k]);
  if (BUILD !== 'test' && !anyOn) { el.hidden = true; return; }
  const differs = Object.keys(FLAG_DEFAULTS).some(k => FLAGS[k] !== (BUILD === 'test'));
  el.textContent = BUILD === 'test' ? (differs ? 'test · edited' : 'test') : 'release · edited';
  el.title = Object.keys(FLAGS).map(k => `${k}: ${FLAGS[k] ? 'on' : 'off'}`).join('\n');
  el.hidden = false;
})();
function closeTrainer() {
  stopSession(true);
  trainer.hidden = true;
  document.body.style.overflow = '';
}
function showView(name) {
  Object.entries(views).forEach(([k, el]) => (el.hidden = k !== name));
  trainer.scrollTop = 0;
  $$('.ttab').forEach(t =>
    t.classList.toggle('active', t.dataset.view === (name === 'progress' ? 'progress' : 'drills'))
  );
  if (name === 'progress') renderProgress();
}

$$('[data-open-trainer]').forEach(btn =>
  btn.addEventListener('click', () => {
    // PRD-1: the hero CTA promises a 60-second drill, so land on Sprint.
    const direct = FLAGS.directStart ? btn.dataset.openTrainerDirect : null;
    openTrainer(direct || btn.dataset.openTrainer || null);
  })
);
$('#trainerClose').addEventListener('click', closeTrainer);
$('#trainerLogo').addEventListener('click', e => { e.preventDefault(); closeTrainer(); });
$$('.ttab').forEach(t => t.addEventListener('click', () => {
  stopSession(true);
  showView(t.dataset.view);
}));
$$('[data-start]').forEach(card =>
  card.addEventListener('click', () => startSetup(card.dataset.start))
);
$('#backToDrills').addEventListener('click', () => { stopSession(true); showView('drills'); });
$('#resultsToDrills').addEventListener('click', () => showView('drills'));
$('#againBtn').addEventListener('click', () => startSetup(state.mode));
$('#promptShuffle').addEventListener('click', () => {
  if (!state.running) setPrompt(state.mode);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !trainer.hidden) closeTrainer();
});
// PRD-9: a lock, call, or app switch stops the mic; the partial run must not be scored as a full one
document.addEventListener('visibilitychange', () => {
  if (FLAGS.interruptedGuard && state.running && document.visibilityState === 'hidden') state.interrupted = true;
});

/* ---------- setup ---------- */
function setPrompt(mode) {
  const list = MODES[mode].prompts;
  let next = list[Math.floor(Math.random() * list.length)];
  if (next === state.prompt && list.length > 1) return setPrompt(mode);
  state.prompt = next;
  $('#promptText').textContent = next;
}

function startSetup(mode) {
  state.mode = mode;
  const m = MODES[mode];
  $('#sessionMode').textContent = `${m.label} · ${m.seconds}s`;
  setPrompt(mode);
  resetSessionUI(m.seconds);
  showView('session');
}

function resetSessionUI(seconds) {
  $('#timerNum').textContent = seconds;
  $('#timerArc').style.strokeDashoffset = 0;
  $('#recordBtnLabel').textContent = '● Record';
  $('#recordBtn').classList.remove('recording');
  $('#liveTranscript').innerHTML = '<span class="lt-placeholder">Your words will appear here…</span>';
  $('#liveFillerCount').textContent = '0';
  const c = $('#waveCanvas');
  c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

/* ---------- recording ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

$('#recordBtn').addEventListener('click', () => {
  state.running ? finishSession() : beginSession();
});

async function beginSession() {
  $('#liveTranscript').innerHTML = '<span class="lt-placeholder">Your words will appear here…</span>';
  $('#micWarning').hidden = true;
  if (!SR) {
    micWarn("This browser doesn't support speech recognition. Chrome or Edge will.");
    showView('drills');
    return;
  }
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    if (FLAGS.micRetryInline) {
      // PRD-6: stay on the session screen; the message takes the transcript box's place, so Record never moves.
      $('#liveTranscript').innerHTML =
        '<span class="lt-mic">Cadence needs the mic to coach you. Allow it, then tap Record again.</span>';
      return;
    }
    micWarn('Cadence needs microphone access to coach you. Allow the mic and try again.');
    showView('drills');
    return;
  }

  Object.assign(state, {
    running: true, startedAt: performance.now(), elapsed: 0,
    finalTranscript: '', interim: '', lastResultAt: performance.now(), longPauses: 0, firstResultAt: 0, interrupted: false,
  });

  state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  state.analyser = state.audioCtx.createAnalyser();
  state.analyser.fftSize = 256;
  state.audioCtx.createMediaStreamSource(state.stream).connect(state.analyser);
  drawWave();

  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  // locale: Chrome has English models per region; en-SG, en-GB, en-IN hear local accents better than en-US
  const lang = (navigator.language || '').toLowerCase();
  rec.lang = FLAGS.recognitionLocale && lang.startsWith('en') ? navigator.language : 'en-US';
  rec.onresult = onSpeechResult;
  rec.onend = () => { if (state.running) { try { rec.start(); } catch {} } };
  rec.start();
  state.recognition = rec;

  const total = MODES[state.mode].seconds;
  $('#recordBtnLabel').textContent = '■ Finish';
  $('#recordBtn').classList.add('recording');
  state.timerId = setInterval(() => {
    state.elapsed = (performance.now() - state.startedAt) / 1000;
    const left = Math.max(0, total - state.elapsed);
    $('#timerNum').textContent = Math.ceil(left);
    $('#timerArc').style.strokeDashoffset = CIRC * (1 - left / total);
    // PRD-3: with clockOnSpeech, reading the prompt before the first word is not a stall.
    const armed = !FLAGS.clockOnSpeech || state.firstResultAt > 0;
    if (armed && performance.now() - state.lastResultAt > 2000) {
      state.longPauses++;
      state.lastResultAt = performance.now();
    }
    if (left <= 0) finishSession();
  }, 250);
}

function onSpeechResult(e) {
  state.lastResultAt = performance.now();
  if (!state.firstResultAt) state.firstResultAt = state.lastResultAt;
  let interim = '';
  for (let i = e.resultIndex; i < e.results.length; i++) {
    const t = e.results[i][0].transcript;
    if (e.results[i].isFinal) state.finalTranscript += t + ' ';
    else interim += t;
  }
  state.interim = interim;
  renderLiveTranscript();

  const n = countFillers(state.finalTranscript + ' ' + state.interim);
  const el = $('#liveFillerCount');
  if (el.textContent !== String(n)) {
    el.textContent = n;
    const chip = $('#liveFillerChip');
    chip.classList.remove('bump');
    void chip.offsetWidth;
    chip.classList.add('bump');
  }
}

function renderLiveTranscript() {
  const box = $('#liveTranscript');
  const finalHtml = markFillers(escapeHtml(state.finalTranscript));
  const interimHtml = `<span class="interim">${escapeHtml(state.interim)}</span>`;
  box.innerHTML = (finalHtml + ' ' + interimHtml).trim() ||
    '<span class="lt-placeholder">Listening…</span>';
  box.scrollTop = box.scrollHeight;
}

// soft navy bars on sky panel
function drawWave() {
  const canvas = $('#waveCanvas');
  const ctx = canvas.getContext('2d');
  const data = new Uint8Array(state.analyser.frequencyBinCount);
  const bars = 46;
  function frame() {
    if (!state.analyser) return;
    state.analyser.getByteFrequencyData(data);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const step = Math.floor(data.length / bars);
    const bw = canvas.width / bars;
    for (let i = 0; i < bars; i++) {
      const v = data[i * step] / 255;
      const h = Math.max(5, v * canvas.height * 0.8);
      const x = i * bw + bw * 0.28;
      const y = (canvas.height - h) / 2;
      ctx.fillStyle = i % 5 === 2 ? '#f04822' : '#1b2150';
      ctx.beginPath();
      ctx.roundRect(x, y, bw * 0.44, h, 4);
      ctx.fill();
    }
    state.rafId = requestAnimationFrame(frame);
  }
  frame();
}

function stopSession(silent) {
  state.running = false;
  clearInterval(state.timerId);
  cancelAnimationFrame(state.rafId);
  if (state.recognition) { state.recognition.onend = null; try { state.recognition.stop(); } catch {} }
  if (state.stream) state.stream.getTracks().forEach(t => t.stop());
  if (state.audioCtx) state.audioCtx.close().catch(() => {});
  state.recognition = state.audioCtx = state.analyser = state.stream = null;
  if (!silent) showResults();
}

function finishSession() {
  if (!state.running) return;
  state.elapsed = (performance.now() - state.startedAt) / 1000;
  stopSession(false);
}

function micWarn(msg) {
  const w = $('#micWarning');
  w.textContent = msg;
  w.hidden = false;
}

/* ---------- scoring ---------- */
function countFillers(text) { return (text.match(FILLER_RE) || []).length; }
function markFillers(html) { return html.replace(FILLER_RE, m => `<mark>${m}</mark>`); }
function escapeHtml(s) {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function scoreSession() {
  const text = state.finalTranscript.trim();
  const words = text ? text.split(/\s+/).length : 0;
  // PRD-3: with clockOnSpeech, pace is measured from the first word heard, not from the Record tap.
  let spoken = state.elapsed;
  if (FLAGS.clockOnSpeech && state.firstResultAt > 0) {
    spoken = Math.min(spoken, (performance.now() - state.firstResultAt) / 1000);
  }
  const minutes = Math.max(spoken, 5) / 60;
  const wpm = Math.round(words / minutes);
  const fillers = countFillers(text);
  const fillerRate = words ? (fillers / words) * 100 : 0;
  const pauses = state.longPauses;

  let pace;
  if (wpm >= 130 && wpm <= 190) pace = 100;
  else if (wpm < 130) pace = Math.max(0, (wpm - 50) / (130 - 50)) * 100;
  else pace = Math.max(0, 1 - (wpm - 190) / 90) * 100;

  // PRD-4: the copy promises "under 2 per 100 words and you sound rehearsed", so full marks up to 2.
  const fillerScore = FLAGS.cleanCurve
    ? Math.max(0, 100 - Math.max(0, fillerRate - 2) * 10)
    : Math.max(0, 100 - fillerRate * 12);
  const pauseScore = Math.max(0, 100 - pauses * 18);

  const w = MODES[state.mode].weights;
  let score = Math.round(pace * w.pace + fillerScore * w.filler + pauseScore * w.pause);
  if (words < 10) score = Math.min(score, 25);

  const r = { words, wpm, fillers, fillerRate: +fillerRate.toFixed(1), pauses, score };
  // scoring flags travel with the session so history stays comparable
  if (FLAGS.clockOnSpeech) r.clockOnSpeech = true;
  if (FLAGS.cleanCurve) r.cleanCurve = true;
  return r;
}

function gradeFor(score) {
  if (score >= 85) return 'Beautifully said.';
  if (score >= 70) return 'Genuinely good.';
  if (score >= 50) return 'A solid start.';
  return 'First drafts are allowed.';
}

function tipFor(r) {
  if (r.words < 10) return 'The mic barely caught anything. Move closer, speak up, and give it another minute.';
  if (r.fillerRate > 5) return `${r.fillers} fillers in ${r.words} words. Try replacing each one with a small silent pause. Silence reads as thoughtful; fillers read as nervous.`;
  if (r.pauses >= 3) return `You stalled ${r.pauses} times for over 2 seconds. A trick that works: decide your last word before you say your first.`;
  if (r.wpm < 110) return `${r.wpm} wpm is a gentle stroll. Push the pace a little. Speed forces your brain to edit ahead.`;
  if (r.wpm > 210) return `${r.wpm} wpm is genuinely quick. Skim the transcript and make sure it still reads like sentences.`;
  return 'Pace, cleanliness, and flow all look healthy. Shuffle to a topic you know nothing about and defend your score.';
}

/* ---------- results ---------- */
function showResults() {
  const r = scoreSession();
  showView('results');
  const cut = FLAGS.interruptedGuard && state.interrupted;
  $('#view-results').classList.toggle('cut-off', cut);

  $('#statWpm').textContent = r.wpm;
  $('#statFillers').textContent = r.fillerRate;
  $('#statPauses').textContent = r.pauses;
  $('#statWords').textContent = r.words;
  $('#scoreGrade').textContent = cut ? 'That one got cut off.' : gradeFor(r.score);
  $('#scoreTip').textContent = cut
    ? 'The phone locked or switched away mid-drill, so the mic stopped. Score not saved. Your words are below.'
    : tipFor(r);

  const transcript = state.finalTranscript.trim();
  $('#resultTranscript').innerHTML = transcript
    ? markFillers(escapeHtml(transcript))
    : '<i>No speech detected. Check your mic and try again.</i>';

  const arc = $('#scoreArc');
  arc.style.transition = 'none';
  arc.style.strokeDashoffset = CIRC;
  if (cut) { $('#scoreNum').textContent = '–'; return; } // no sweep, no number, no save
  requestAnimationFrame(() => {
    arc.style.transition = '';
    arc.style.strokeDashoffset = CIRC * (1 - r.score / 100);
  });
  animateNumber($('#scoreNum'), r.score, 1100);

  saveSession(r);
}

function animateNumber(el, target, ms) {
  const t0 = performance.now();
  (function step(t) {
    const p = Math.min(1, (t - t0) / ms);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

/* ---------- history ---------- */
const STORE_KEY = 'cadence_history_v1';
const history = () => JSON.parse(localStorage.getItem(STORE_KEY) || '[]');

function saveSession(r) {
  const h = history();
  h.push({ at: Date.now(), mode: state.mode, ...r });
  // PRD-10: 200 sessions is seven months at one a day; 5000 is ~600 KB, well inside the 5 MB quota
  const cap = FLAGS.longHistory ? 5000 : 200;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(h.slice(-cap))); } catch {}
  renderStreak();
}

function renderStreak() {
  const h = history();
  const el = $('#streakLine');
  if (!h.length) { el.textContent = "First session, let's get a baseline."; return; }
  const days = new Set(h.map(s => new Date(s.at).toDateString()));
  let streak = 0;
  const d = new Date();
  // PRD-11: until today's drill is done, the streak is still alive from yesterday
  const todayOpen = FLAGS.streakGrace && !days.has(d.toDateString());
  if (todayOpen) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  const last = h[h.length - 1];
  el.textContent = streak > 1
    ? (todayOpen ? `${streak} days in a row · keep it going today` : `${streak} days in a row · last score ${last.score}/100`)
    : `${h.length} session${h.length > 1 ? 's' : ''} logged · last score ${last.score}/100`;
}

function renderProgress() {
  const h = history();
  const sum = $('#progressSummary');
  const list = $('#historyList');
  const canvas = $('#historyChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  list.innerHTML = '';

  if (!h.length) {
    sum.textContent = 'No sessions yet. The chart starts with your first one.';
    return;
  }

  const avg = Math.round(h.reduce((a, s) => a + s.score, 0) / h.length);
  const recent = h.slice(-10);
  const recentAvg = Math.round(recent.reduce((a, s) => a + s.score, 0) / recent.length);
  sum.textContent = `${h.length} session${h.length > 1 ? 's' : ''} · all-time avg ${avg} · recent avg ${recentAvg}`;

  // smooth line + dots, tomato on white
  const pts = h.slice(-40);
  const W = canvas.width, H = canvas.height, pad = 26;
  ctx.strokeStyle = 'rgba(27,33,80,0.1)';
  ctx.lineWidth = 1;
  [25, 50, 75].forEach(v => {
    const y = H - pad - (v / 100) * (H - pad * 2);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  });
  ctx.strokeStyle = '#f04822';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach((s, i) => {
    const x = pad + (i / Math.max(1, pts.length - 1)) * (W - pad * 2);
    const y = H - pad - (s.score / 100) * (H - pad * 2);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.stroke();
  pts.forEach((s, i) => {
    const x = pad + (i / Math.max(1, pts.length - 1)) * (W - pad * 2);
    const y = H - pad - (s.score / 100) * (H - pad * 2);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#1b2150';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  [...h].reverse().slice(0, 12).forEach(s => {
    const row = document.createElement('div');
    row.className = 'history-row';
    const when = new Date(s.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    row.innerHTML =
      `<span class="h-mode">${s.mode}</span>` +
      `<span class="h-date">${when}</span>` +
      `<span>${s.wpm} wpm · ${s.fillerRate} fill/100w</span>` +
      `<span class="h-score">${s.score}</span>`;
    list.appendChild(row);
  });
}
