/* ============================================================
   CADENCE — app.js
   Landing interactions + voice trainer (Web Speech API)
   ============================================================ */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ============================================================
   1. LANDING INTERACTIONS
   ============================================================ */

// --- scroll reveals ---
const io = new IntersectionObserver(
  entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('in')),
  { threshold: 0.15 }
);
$$('.reveal').forEach(el => io.observe(el));

// --- hero ribbon text drift ---
(function animateRibbons() {
  const a = $('#ribbonTextA');
  const b = $('#ribbonTextB');
  let oa = 0, ob = -20;
  function tick() {
    oa = (oa + 0.012) % 50;
    ob = (ob + 0.02) % 50;
    if (a) a.setAttribute('startOffset', `${-oa}%`);
    if (b) b.setAttribute('startOffset', `${-ob}%`);
    requestAnimationFrame(tick);
  }
  tick();
})();

// --- typing vs speaking demo cards ---
(function vsDemo() {
  const sentence =
    "Let's reach out to legal about the NDA, CC Dave, and make sure the Q2 goals slide is updated before Friday's review.";
  const typeEl = $('#typeDemo');
  const speakEl = $('#speakDemo');
  if (!typeEl || !speakEl) return;

  // 45 wpm ≈ 225 chars/min ≈ 3.75 chars/sec → ~266ms per char
  // 220 wpm: reveal word-by-word fast → ~272ms per word
  let started = false;
  const vsIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !started) { started = true; run(); }
    });
  }, { threshold: 0.4 });
  vsIO.observe(typeEl);

  function run() {
    loopType();
    loopSpeak();
  }
  function loopType() {
    let i = 0;
    typeEl.innerHTML = '<span class="caret"></span>';
    const caret = $('.caret', typeEl);
    const iv = setInterval(() => {
      i++;
      if (i > sentence.length) { clearInterval(iv); setTimeout(loopType, 4000); return; }
      caret.insertAdjacentText('beforebegin', sentence[i - 1]);
    }, 200);
  }
  function loopSpeak() {
    const words = sentence.split(' ');
    let i = 0;
    speakEl.innerHTML = '<span class="caret"></span>';
    const caret = $('.caret', speakEl);
    const iv = setInterval(() => {
      i++;
      if (i > words.length) { clearInterval(iv); setTimeout(loopSpeak, 9000); return; }
      caret.insertAdjacentText('beforebegin', words[i - 1] + ' ');
    }, 272);
  }
})();

/* ============================================================
   2. TRAINER
   ============================================================ */

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
      'Review the last show or movie you watched — cleanly.',
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
      'Leave a voicemail asking your landlord to fix the heat — clear ask, no rambling.',
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

const state = {
  mode: null,
  prompt: '',
  running: false,
  startedAt: 0,
  elapsed: 0,
  finalTranscript: '',
  interim: '',
  lastResultAt: 0,
  longPauses: 0,
  timerId: null,
  recognition: null,
  audioCtx: null,
  analyser: null,
  stream: null,
  rafId: null,
};

const trainer = $('#trainer');
const views = {
  drills: $('#view-drills'),
  session: $('#view-session'),
  results: $('#view-results'),
  progress: $('#view-progress'),
};

/* ---------- open / close / view switching ---------- */
function openTrainer(mode) {
  trainer.hidden = false;
  document.body.style.overflow = 'hidden';
  renderStreak();
  if (mode && MODES[mode]) startSetup(mode);
  else showView('drills');
}
function closeTrainer() {
  stopSession(true);
  trainer.hidden = true;
  document.body.style.overflow = '';
}
function showView(name) {
  Object.entries(views).forEach(([k, el]) => (el.hidden = k !== name));
  $$('.ttab').forEach(t =>
    t.classList.toggle('active', t.dataset.view === (name === 'progress' ? 'progress' : 'drills'))
  );
  if (name === 'progress') renderProgress();
}

$$('[data-open-trainer]').forEach(btn =>
  btn.addEventListener('click', () => openTrainer(btn.dataset.openTrainer || null))
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

/* ---------- session setup ---------- */
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
  $('#liveFiller').hidden = mode !== 'filler';
  showView('session');
}

function resetSessionUI(seconds) {
  $('#timerNum').textContent = seconds;
  $('#timerArc').style.strokeDashoffset = 0;
  $('#recordBtnLabel').textContent = 'Begin';
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
  if (!SR) {
    micWarn("This browser doesn't expose speech recognition. Try Chrome or Edge — the drills need it to score you.");
    showView('drills');
    return;
  }
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    micWarn('Cadence needs microphone access to run a drill. Allow the mic and try again.');
    showView('drills');
    return;
  }

  // reset measurement state
  Object.assign(state, {
    running: true,
    startedAt: performance.now(),
    elapsed: 0,
    finalTranscript: '',
    interim: '',
    lastResultAt: performance.now(),
    longPauses: 0,
  });

  // waveform
  state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  state.analyser = state.audioCtx.createAnalyser();
  state.analyser.fftSize = 256;
  state.audioCtx.createMediaStreamSource(state.stream).connect(state.analyser);
  drawWave();

  // recognition
  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';
  rec.onresult = onSpeechResult;
  rec.onend = () => { if (state.running) { try { rec.start(); } catch {} } };
  rec.start();
  state.recognition = rec;

  // timer
  const total = MODES[state.mode].seconds;
  $('#recordBtnLabel').textContent = 'Finish early';
  $('#recordBtn').classList.add('recording');
  state.timerId = setInterval(() => {
    state.elapsed = (performance.now() - state.startedAt) / 1000;
    const left = Math.max(0, total - state.elapsed);
    $('#timerNum').textContent = Math.ceil(left);
    $('#timerArc').style.strokeDashoffset = 339.3 * (1 - left / total);
    // silence tracking
    if (performance.now() - state.lastResultAt > 2000) {
      state.longPauses++;
      state.lastResultAt = performance.now(); // count each 2s block once
    }
    if (left <= 0) finishSession();
  }, 250);
}

function onSpeechResult(e) {
  state.lastResultAt = performance.now();
  let interim = '';
  for (let i = e.resultIndex; i < e.results.length; i++) {
    const t = e.results[i][0].transcript;
    if (e.results[i].isFinal) state.finalTranscript += t + ' ';
    else interim += t;
  }
  state.interim = interim;
  renderLiveTranscript();
  if (state.mode === 'filler') {
    const n = countFillers(state.finalTranscript + ' ' + state.interim);
    const el = $('#liveFillerCount');
    if (el.textContent !== String(n)) {
      el.textContent = n;
      const pill = $('#liveFiller');
      pill.classList.remove('bump');
      void pill.offsetWidth;
      pill.classList.add('bump');
    }
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

function drawWave() {
  const canvas = $('#waveCanvas');
  const ctx = canvas.getContext('2d');
  const data = new Uint8Array(state.analyser.frequencyBinCount);
  const bars = 48;
  function frame() {
    if (!state.analyser) return;
    state.analyser.getByteFrequencyData(data);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const step = Math.floor(data.length / bars);
    const bw = canvas.width / bars;
    for (let i = 0; i < bars; i++) {
      const v = data[i * step] / 255;
      const h = Math.max(4, v * canvas.height * 0.85);
      const x = i * bw + bw * 0.25;
      const y = (canvas.height - h) / 2;
      ctx.fillStyle = i % 2 ? '#1b1812' : '#e4572e';
      roundRect(ctx, x, y, bw * 0.5, h, 3);
    }
    state.rafId = requestAnimationFrame(frame);
  }
  frame();
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
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
function countFillers(text) {
  return (text.match(FILLER_RE) || []).length;
}
function markFillers(html) {
  return html.replace(FILLER_RE, m => `<mark>${m}</mark>`);
}
function escapeHtml(s) {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function scoreSession() {
  const text = state.finalTranscript.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = Math.max(state.elapsed, 5) / 60;
  const wpm = Math.round(words / minutes);
  const fillers = countFillers(text);
  const fillerRate = words ? (fillers / words) * 100 : 0;
  const pauses = state.longPauses;

  // pace: ideal 130–190 wpm, falls off linearly outside
  let pace;
  if (wpm >= 130 && wpm <= 190) pace = 100;
  else if (wpm < 130) pace = Math.max(0, (wpm - 50) / (130 - 50)) * 100;
  else pace = Math.max(0, 1 - (wpm - 190) / 90) * 100;

  const fillerScore = Math.max(0, 100 - fillerRate * 12);
  const pauseScore = Math.max(0, 100 - pauses * 18);

  const w = MODES[state.mode].weights;
  let score = Math.round(pace * w.pace + fillerScore * w.filler + pauseScore * w.pause);
  if (words < 10) score = Math.min(score, 25); // barely spoke

  return { words, wpm, fillers, fillerRate: +fillerRate.toFixed(1), pauses, score };
}

function gradeFor(score) {
  if (score >= 85) return ['Cogent.', 'That was tight. Raise the bar: try Distill, or aim for zero fillers.'];
  if (score >= 70) return ['Sharp-ish.', 'Solid rep. One thing to fix next run is highlighted below.'];
  if (score >= 50) return ['Warming up.', 'The raw material is there — now trim the hedges and keep moving.'];
  return ['Rambling era.', 'No judgment, that is what baselines are for. Same drill, once a day.'];
}

function tipFor(r) {
  if (r.words < 10) return 'Barely any words landed. Get closer to the mic, or speak up — silence scores zero.';
  if (r.fillerRate > 5) return `Filler check: ${r.fillers} in ${r.words} words. Replace them with a silent beat — pauses read as confidence, fillers read as noise.`;
  if (r.pauses >= 3) return `You stalled ${r.pauses} times for 2+ seconds. Decide the end of the sentence before you start it.`;
  if (r.wpm < 110) return `${r.wpm} wpm is podcast-slow. Push pace — speed forces your brain to pre-edit.`;
  if (r.wpm > 210) return `${r.wpm} wpm is sprint pace — impressive, but check the transcript still parses.`;
  return 'Pace, cleanliness, and flow are all in band. Make it harder: shuffle to a topic you know nothing about.';
}

/* ---------- results ---------- */
function showResults() {
  const r = scoreSession();
  showView('results');

  $('#statWpm').textContent = r.wpm;
  $('#statFillers').textContent = r.fillerRate;
  $('#statPauses').textContent = r.pauses;
  $('#statWords').textContent = r.words;

  const [grade, sub] = gradeFor(r.score);
  $('#scoreGrade').textContent = grade;
  $('#scoreTip').textContent = tipFor(r);

  const transcript = state.finalTranscript.trim();
  $('#resultTranscript').innerHTML = transcript
    ? markFillers(escapeHtml(transcript))
    : '<i>No speech detected. Check your mic and try again.</i>';

  // animate ring + number
  const arc = $('#scoreArc');
  arc.style.strokeDashoffset = 339.3;
  requestAnimationFrame(() => {
    arc.style.strokeDashoffset = 339.3 * (1 - r.score / 100);
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

/* ---------- history / progress ---------- */
const STORE_KEY = 'cadence_history_v1';
const history = () => JSON.parse(localStorage.getItem(STORE_KEY) || '[]');

function saveSession(r) {
  const h = history();
  h.push({ at: Date.now(), mode: state.mode, ...r });
  localStorage.setItem(STORE_KEY, JSON.stringify(h.slice(-200)));
  renderStreak();
}

function renderStreak() {
  const h = history();
  const el = $('#streakLine');
  if (!h.length) { el.textContent = 'First session — let’s get a baseline.'; return; }
  const days = new Set(h.map(s => new Date(s.at).toDateString()));
  let streak = 0;
  const d = new Date();
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  const last = h[h.length - 1];
  el.textContent = streak > 1
    ? `🔥 ${streak}-day streak · last score ${last.score}/100`
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
    sum.textContent = 'No sessions yet. The graph starts with your first rep.';
    return;
  }

  const avg = Math.round(h.reduce((a, s) => a + s.score, 0) / h.length);
  const recent = h.slice(-10);
  const recentAvg = Math.round(recent.reduce((a, s) => a + s.score, 0) / recent.length);
  const delta = recentAvg - avg;
  sum.textContent = `${h.length} session${h.length > 1 ? 's' : ''} · all-time avg ${avg} · last ${recent.length} avg ${recentAvg}` +
    (h.length > 10 ? ` (${delta >= 0 ? '+' : ''}${delta} vs all-time)` : '');

  // line chart of scores
  const pts = h.slice(-40);
  const W = canvas.width, H = canvas.height, pad = 24;
  ctx.strokeStyle = 'rgba(27,24,18,0.12)';
  ctx.lineWidth = 1;
  [25, 50, 75].forEach(v => {
    const y = H - pad - (v / 100) * (H - pad * 2);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  });
  ctx.strokeStyle = '#e4572e';
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
    ctx.fillStyle = '#f4efe4';
    ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#e4572e';
    ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill();
  });

  // session rows, latest first
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
