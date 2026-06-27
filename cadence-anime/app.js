/* ============================================================
   CADENCE 音声訓練システム — app.js
   Title cards, mission clock, warning klaxon, and the same
   trainer engine as v1-v5, scored as a sync ratio.
   ============================================================ */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ============================================================
   1. TITLE CARD INTRO (Eva-style flash cards)
   ============================================================ */
(function intro() {
  const wrap = $('#titlecards');
  const cards = $$('.tcard', wrap);
  const main = $('#main');
  let done = false;

  const seq = [
    [0, () => cards[0].classList.add('show')],
    [900, () => cards[0].classList.remove('show')],
    [1050, () => cards[1].classList.add('show')],
    [2100, finish],
  ];
  const timers = seq.map(([t, fn]) => setTimeout(fn, t));

  function finish() {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    main.hidden = false;
    wrap.classList.add('out');
    setTimeout(() => wrap.remove(), 350);
  }
  wrap.addEventListener('click', finish);
  document.addEventListener('keydown', finish);
})();

/* ============================================================
   2. STATUS BAR: mission clock + fake sync drift
   ============================================================ */
(function clock() {
  const el = $('#sbClock');
  const t0 = Date.now();
  setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    el.textContent = `T+${hh}:${mm}:${ss}`;
  }, 1000);
})();

(function fakeSync() {
  const sync = $('#fakeSync');
  if (!sync) return;
  setInterval(() => {
    sync.textContent = (84 + Math.random() * 9).toFixed(1);
    $('#hudPaceV').textContent = 150 + Math.floor(Math.random() * 40);
    $('#hudPace').style.width = 55 + Math.random() * 35 + '%';
    const noise = (Math.random() * 2.8).toFixed(1);
    $('#hudNoiseV').textContent = noise;
    $('#hudNoise').style.width = noise * 10 + '%';
    $('#hudFlowV').textContent = Math.random() < 0.8 ? 0 : 1;
    $('#hudFlow').style.width = 80 + Math.random() * 18 + '%';
  }, 2000);
})();

/* ============================================================
   3. TRAINER ENGINE
   ============================================================ */
const MODES = {
  sprint: {
    label: 'OP-01 SPRINT',
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
    label: 'OP-02 FILLER HUNT',
    seconds: 45,
    weights: { pace: 0.2, filler: 0.6, pause: 0.2 },
    prompts: [
      'Describe your morning routine. Every noise word trips the klaxon.',
      'Review the last show or movie you watched. Cleanly.',
      'Explain how to make your go-to meal, step by step.',
      'Tell the story of your most chaotic travel day.',
      'Describe your dream home without a single "like".',
      'Explain a hobby of yours to someone who has never heard of it.',
    ],
  },
  distill: {
    label: 'OP-03 DISTILL',
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

const state = {
  mode: null, prompt: '', running: false, startedAt: 0, elapsed: 0,
  finalTranscript: '', interim: '', lastResultAt: 0, longPauses: 0,
  timerId: null, recognition: null, audioCtx: null, analyser: null,
  stream: null, rafId: null, warnTimer: null,
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
}
function closeTrainer() {
  stopSession(true);
  hideWarn();
  trainer.hidden = true;
  document.body.style.overflow = '';
}
function showView(name) {
  Object.entries(views).forEach(([k, el]) => (el.hidden = k !== name));
  $$('.ctab').forEach(t =>
    t.classList.toggle('active', t.dataset.view === (name === 'progress' ? 'progress' : 'drills'))
  );
  if (name === 'progress') renderProgress();
}

$$('[data-open-trainer]').forEach(btn =>
  btn.addEventListener('click', () => openTrainer(btn.dataset.openTrainer || null))
);
$('#trainerClose').addEventListener('click', closeTrainer);
$$('.ctab').forEach(t => t.addEventListener('click', () => {
  stopSession(true);
  hideWarn();
  showView(t.dataset.view);
}));
$$('[data-start]').forEach(row =>
  row.addEventListener('click', () => startSetup(row.dataset.start))
);
$('#backToDrills').addEventListener('click', () => { stopSession(true); hideWarn(); showView('drills'); });
$('#resultsToDrills').addEventListener('click', () => showView('drills'));
$('#againBtn').addEventListener('click', () => startSetup(state.mode));
$('#promptShuffle').addEventListener('click', () => {
  if (!state.running) setPrompt(state.mode);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !trainer.hidden) closeTrainer();
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
  $('#sessionMode').textContent = `${m.label} · ${m.seconds} SEC`;
  setPrompt(mode);
  resetSessionUI(m.seconds);
  showView('session');
}

function resetSessionUI(seconds) {
  $('#timerNum').textContent = seconds;
  $('#timerBar').style.width = '100%';
  $('#recordBtnLabel').textContent = '● RECORD — 録音';
  $('#recordBtn').classList.remove('recording');
  $('#recDot').hidden = true;
  $('#liveTranscript').innerHTML = '<span class="lt-placeholder">&gt; AWAITING VOICE INPUT_</span>';
  $('#liveFillerCount').textContent = '0';
  hideWarn();
  const c = $('#waveCanvas');
  c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

/* ---------- warning klaxon ---------- */
function flashWarn() {
  const band = $('#warnBand');
  band.hidden = false;
  clearTimeout(state.warnTimer);
  state.warnTimer = setTimeout(hideWarn, 1400);
}
function hideWarn() {
  clearTimeout(state.warnTimer);
  $('#warnBand').hidden = true;
}

/* ---------- recording ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

$('#recordBtn').addEventListener('click', () => {
  state.running ? finishSession() : beginSession();
});

async function beginSession() {
  if (!SR) {
    micWarn('ERR: NO SPEECH ENGINE IN THIS BROWSER. DEPLOY CHROME OR EDGE.');
    showView('drills');
    return;
  }
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    micWarn('ERR: MICROPHONE ACCESS DENIED. GRANT UPLINK AND RETRY.');
    showView('drills');
    return;
  }

  Object.assign(state, {
    running: true, startedAt: performance.now(), elapsed: 0,
    finalTranscript: '', interim: '', lastResultAt: performance.now(), longPauses: 0,
  });

  state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  state.analyser = state.audioCtx.createAnalyser();
  state.analyser.fftSize = 1024;
  state.audioCtx.createMediaStreamSource(state.stream).connect(state.analyser);
  drawScope();

  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';
  rec.onresult = onSpeechResult;
  rec.onend = () => { if (state.running) { try { rec.start(); } catch {} } };
  rec.start();
  state.recognition = rec;

  const total = MODES[state.mode].seconds;
  $('#recordBtnLabel').textContent = '■ END SORTIE';
  $('#recordBtn').classList.add('recording');
  $('#recDot').hidden = false;
  state.timerId = setInterval(() => {
    state.elapsed = (performance.now() - state.startedAt) / 1000;
    const left = Math.max(0, total - state.elapsed);
    $('#timerNum').textContent = Math.ceil(left);
    $('#timerBar').style.width = `${(left / total) * 100}%`;
    if (performance.now() - state.lastResultAt > 2000) {
      state.longPauses++;
      state.lastResultAt = performance.now();
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

  const n = countFillers(state.finalTranscript + ' ' + state.interim);
  const el = $('#liveFillerCount');
  if (el.textContent !== String(n)) {
    el.textContent = n;
    flashWarn();
  }
}

function renderLiveTranscript() {
  const box = $('#liveTranscript');
  const finalHtml = markFillers(escapeHtml(state.finalTranscript));
  const interimHtml = `<span class="interim">${escapeHtml(state.interim)}</span>`;
  box.innerHTML = (finalHtml + ' ' + interimHtml).trim() ||
    '<span class="lt-placeholder">&gt; LISTENING_</span>';
  box.scrollTop = box.scrollHeight;
}

// cockpit scope: cyan trace + orange grid, Oedo 808 dashboard glow
function drawScope() {
  const canvas = $('#waveCanvas');
  const ctx = canvas.getContext('2d');
  const data = new Uint8Array(state.analyser.fftSize);
  function frame() {
    if (!state.analyser) return;
    state.analyser.getByteTimeDomainData(data);
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255, 110, 0, 0.22)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = '#19e3d2';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(25, 227, 210, 0.6)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * W;
      const y = (data[i] / 255) * H;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
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
  const minutes = Math.max(state.elapsed, 5) / 60;
  const wpm = Math.round(words / minutes);
  const fillers = countFillers(text);
  const fillerRate = words ? (fillers / words) * 100 : 0;
  const pauses = state.longPauses;

  let pace;
  if (wpm >= 130 && wpm <= 190) pace = 100;
  else if (wpm < 130) pace = Math.max(0, (wpm - 50) / (130 - 50)) * 100;
  else pace = Math.max(0, 1 - (wpm - 190) / 90) * 100;

  const fillerScore = Math.max(0, 100 - fillerRate * 12);
  const pauseScore = Math.max(0, 100 - pauses * 18);

  const w = MODES[state.mode].weights;
  let score = Math.round(pace * w.pace + fillerScore * w.filler + pauseScore * w.pause);
  if (words < 10) score = Math.min(score, 25);

  return { words, wpm, fillers, fillerRate: +fillerRate.toFixed(1), pauses, score };
}

function gradeFor(score) {
  if (score >= 85) return 'SYNC NOMINAL — 適合';
  if (score >= 70) return 'OPERATIONAL — 良好';
  if (score >= 50) return 'CALIBRATING — 調整中';
  return 'PATTERN ORANGE — 要訓練';
}

function tipFor(r) {
  if (r.words < 10) return 'Signal too weak. Close distance to the microphone and re-sortie.';
  if (r.fillerRate > 5) return `${r.fillers} noise words in ${r.words}. Swap each for a silent beat. Pauses read as thought; noise reads as doubt.`;
  if (r.pauses >= 3) return `${r.pauses} stalls over 2 seconds. Lock the end of the sentence before launch.`;
  if (r.wpm < 110) return `${r.wpm} WPM is below the authority band. Increase output; speed forces the pre-edit.`;
  if (r.wpm > 210) return `${r.wpm} WPM is redline. Verify the flight recorder still parses.`;
  return 'All subsystems in band. Re-roll to an unfamiliar directive and hold this sync.';
}

/* ---------- results ---------- */
function showResults() {
  const r = scoreSession();
  hideWarn();
  showView('results');

  $('#statWpm').textContent = r.wpm;
  $('#statFillers').textContent = r.fillerRate;
  $('#statPauses').textContent = r.pauses;
  $('#statWords').textContent = r.words;
  $('#scoreGradeTag').textContent = gradeFor(r.score);
  $('#scoreTip').textContent = tipFor(r);

  const transcript = state.finalTranscript.trim();
  $('#resultTranscript').innerHTML = transcript
    ? markFillers(escapeHtml(transcript))
    : '<i>&gt; NO SPEECH DETECTED. CHECK INPUT DEVICE.</i>';

  const bar = $('#scoreBar');
  bar.style.width = '0%';
  requestAnimationFrame(() => { bar.style.width = `${r.score}%`; });
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
  localStorage.setItem(STORE_KEY, JSON.stringify(h.slice(-200)));
  renderStreak();
}

function renderStreak() {
  const h = history();
  const el = $('#streakLine');
  if (!h.length) { el.textContent = '// NO SORTIES ON RECORD. FIRST RUN SETS BASELINE.'; return; }
  const days = new Set(h.map(s => new Date(s.at).toDateString()));
  let streak = 0;
  const d = new Date();
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  const last = h[h.length - 1];
  el.textContent = streak > 1
    ? `// STREAK: ${streak} DAYS · LAST SYNC ${last.score}%`
    : `// ${h.length} SORTIE${h.length > 1 ? 'S' : ''} LOGGED · LAST SYNC ${last.score}%`;
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
    sum.textContent = '// NO SORTIES ON RECORD.';
    return;
  }

  const avg = Math.round(h.reduce((a, s) => a + s.score, 0) / h.length);
  const recent = h.slice(-10);
  const recentAvg = Math.round(recent.reduce((a, s) => a + s.score, 0) / recent.length);
  sum.textContent = `// ${h.length} SORTIE${h.length > 1 ? 'S' : ''} · ALL-TIME AVG ${avg}% · RECENT ${recentAvg}%`;

  // cyan trace on orange grid
  const pts = h.slice(-40);
  const W = canvas.width, H = canvas.height, pad = 26;
  ctx.strokeStyle = 'rgba(255, 110, 0, 0.2)';
  ctx.lineWidth = 1;
  for (let x = pad; x <= W - pad; x += 36) { ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke(); }
  [25, 50, 75].forEach(v => {
    const y = H - pad - (v / 100) * (H - pad * 2);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  });
  ctx.strokeStyle = '#19e3d2';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(25,227,210,0.5)';
  ctx.shadowBlur = 7;
  ctx.beginPath();
  pts.forEach((s, i) => {
    const x = pad + (i / Math.max(1, pts.length - 1)) * (W - pad * 2);
    const y = H - pad - (s.score / 100) * (H - pad * 2);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;
  pts.forEach((s, i) => {
    const x = pad + (i / Math.max(1, pts.length - 1)) * (W - pad * 2);
    const y = H - pad - (s.score / 100) * (H - pad * 2);
    ctx.fillStyle = '#ff6e00';
    ctx.fillRect(x - 3, y - 3, 6, 6);
  });

  [...h].reverse().slice(0, 12).forEach(s => {
    const row = document.createElement('div');
    row.className = 'history-row';
    const when = new Date(s.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    row.innerHTML =
      `<span class="h-mode">${MODES[s.mode] ? MODES[s.mode].label.split(' ')[0] : s.mode}</span>` +
      `<span class="h-date">${when}</span>` +
      `<span class="h-detail">${s.wpm} WPM · ${s.fillerRate} N/100W</span>` +
      `<span class="h-score">${s.score}%</span>`;
    list.appendChild(row);
  });
}
