/* ============================================================
   CADENCE/LAB — app.js
   Landing instrumentation + voice console (Web Speech API)
   ============================================================ */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ============================================================
   1. LANDING INSTRUMENTATION
   ============================================================ */

// --- fake oscilloscope in hero panel ---
(function heroScope() {
  const canvas = $('#scope');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  let t = 0;
  function frame() {
    t += 0.035;
    ctx.clearRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = 'rgba(232,237,230,0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // trace: speech-like bursts
    const burst = (Math.sin(t * 0.7) + 1) / 2; // 0..1 envelope
    ctx.strokeStyle = '#b7f445';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(183,244,69,0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 3) {
      const p = x / W;
      const env = Math.max(0.06, burst * Math.exp(-Math.pow((p - 0.5) * 2.4, 2)));
      const y = H / 2 +
        Math.sin(x * 0.09 + t * 6) * 26 * env +
        Math.sin(x * 0.023 + t * 2.4) * 34 * env +
        (Math.random() - 0.5) * 6 * env;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    requestAnimationFrame(frame);
  }
  frame();

  // drift the fake chips
  setInterval(() => {
    $('#fakeWpm').textContent = 168 + Math.floor(Math.random() * 28);
    $('#fakeFill').textContent = (1.4 + Math.random() * 1.4).toFixed(1);
    $('#fakeStall').textContent = Math.random() < 0.85 ? 0 : 1;
  }, 1800);
})();

// --- telemetry count-up on scroll ---
(function countUps() {
  const els = $$('[data-count]');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting || e.target.dataset.done) return;
      e.target.dataset.done = '1';
      const target = +e.target.dataset.count;
      const t0 = performance.now();
      (function step(t) {
        const p = Math.min(1, (t - t0) / 1200);
        e.target.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.5 });
  els.forEach(el => io.observe(el));
})();

/* ============================================================
   2. CONSOLE (trainer)
   ============================================================ */

const MODES = {
  sprint: {
    id: 'SPRT-60',
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
    id: 'FLLR-45',
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
    id: 'DSTL-30',
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

const consoleEl = $('#console');
const views = {
  drills: $('#view-drills'),
  session: $('#view-session'),
  results: $('#view-results'),
  progress: $('#view-progress'),
};

/* ---------- open / close / view switching ---------- */
function openConsole(mode) {
  consoleEl.hidden = false;
  document.body.style.overflow = 'hidden';
  renderStreak();
  if (mode && MODES[mode]) startSetup(mode);
  else showView('drills');
}
function closeConsole() {
  stopSession(true);
  consoleEl.hidden = true;
  document.body.style.overflow = '';
}
function showView(name) {
  Object.entries(views).forEach(([k, el]) => (el.hidden = k !== name));
  $$('.con-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.view === (name === 'progress' ? 'progress' : 'drills'))
  );
  $('#conTitle').textContent = {
    drills: 'CADENCE CONSOLE — SELECT DRILL',
    session: `CADENCE CONSOLE — ${state.mode ? MODES[state.mode].id : ''} ARMED`,
    results: 'CADENCE CONSOLE — SESSION REPORT',
    progress: 'CADENCE CONSOLE — COGENCY LOG',
  }[name];
  if (name === 'progress') renderProgress();
}

$$('[data-open-console]').forEach(btn =>
  btn.addEventListener('click', () => openConsole(btn.dataset.openConsole || null))
);
$('#conClose').addEventListener('click', closeConsole);
$$('.con-tab').forEach(t => t.addEventListener('click', () => {
  stopSession(true);
  showView(t.dataset.view);
}));
$$('[data-start]').forEach(row =>
  row.addEventListener('click', () => startSetup(row.dataset.start))
);
$('#backToDrills').addEventListener('click', () => { stopSession(true); showView('drills'); });
$('#resultsToDrills').addEventListener('click', () => showView('drills'));
$('#againBtn').addEventListener('click', () => startSetup(state.mode));
$('#promptShuffle').addEventListener('click', () => {
  if (!state.running) setPrompt(state.mode);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !consoleEl.hidden) closeConsole();
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
  $('#sessionMode').textContent = `${m.id} · ${m.seconds} SEC`;
  setPrompt(mode);
  resetSessionUI(m.seconds);
  showView('session');
}

function resetSessionUI(seconds) {
  $('#timerNum').textContent = seconds;
  $('#timerBar').style.width = '100%';
  $('#recordBtnLabel').textContent = 'RECORD';
  $('#recordBtn').classList.remove('recording');
  $('#liveTranscript').innerHTML = '<span class="lt-placeholder">// transcript buffer empty. press record.</span>';
  $('#liveFillerCount').textContent = '0';
  $('#liveWords').textContent = '0';
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
    micWarn('ERR: no speech recognition in this browser. Run Chrome or Edge.');
    showView('drills');
    return;
  }
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    micWarn('ERR: microphone access denied. Grant mic permission and retry.');
    showView('drills');
    return;
  }

  Object.assign(state, {
    running: true,
    startedAt: performance.now(),
    elapsed: 0,
    finalTranscript: '',
    interim: '',
    lastResultAt: performance.now(),
    longPauses: 0,
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
  $('#recordBtnLabel').textContent = 'STOP';
  $('#recordBtn').classList.add('recording');
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

  const all = state.finalTranscript + ' ' + state.interim;
  const words = all.trim() ? all.trim().split(/\s+/).length : 0;
  $('#liveWords').textContent = words;

  const n = countFillers(all);
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
    '<span class="lt-placeholder">// listening…</span>';
  box.scrollTop = box.scrollHeight;
}

// live mic oscilloscope: time-domain trace
function drawScope() {
  const canvas = $('#waveCanvas');
  const ctx = canvas.getContext('2d');
  const data = new Uint8Array(state.analyser.fftSize);
  function frame() {
    if (!state.analyser) return;
    state.analyser.getByteTimeDomainData(data);
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(232,237,230,0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
    ctx.strokeStyle = '#b7f445';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(183,244,69,0.45)';
    ctx.shadowBlur = 6;
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

/* ---------- scoring (same engine as v1) ---------- */
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
  if (score >= 85) return 'COGENT';
  if (score >= 70) return 'OPERATIONAL';
  if (score >= 50) return 'CALIBRATING';
  return 'SIGNAL LOST';
}

function tipFor(r) {
  if (r.words < 10) return 'Barely any signal received. Get closer to the mic, or speak up. Silence scores zero.';
  if (r.fillerRate > 5) return `Filler check: ${r.fillers} in ${r.words} words. Swap each for a silent beat. Pauses read as thought; fillers read as doubt.`;
  if (r.pauses >= 3) return `${r.pauses} stalls over 2 seconds. Decide the end of the sentence before launching it.`;
  if (r.wpm < 110) return `${r.wpm} WPM is below the authority band. Push pace; speed forces the pre-edit.`;
  if (r.wpm > 210) return `${r.wpm} WPM is redline. Impressive, but verify the tape still parses.`;
  return 'All signals in band. Increase difficulty: shuffle to a topic you know nothing about.';
}

/* ---------- results ---------- */
function showResults() {
  const r = scoreSession();
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
    : '<i>// no speech detected. check input device.</i>';

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

/* ---------- history / log ---------- */
const STORE_KEY = 'cadence_history_v1'; // shared with v1 on the same origin would collide; lab runs on its own port
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
  if (!h.length) { el.textContent = '// no sessions on record. first run sets baseline.'; return; }
  const days = new Set(h.map(s => new Date(s.at).toDateString()));
  let streak = 0;
  const d = new Date();
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  const last = h[h.length - 1];
  el.textContent = streak > 1
    ? `// streak: ${streak} days · last score ${last.score}/100`
    : `// ${h.length} session${h.length > 1 ? 's' : ''} logged · last score ${last.score}/100`;
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
    sum.textContent = '// no sessions on record.';
    return;
  }

  const avg = Math.round(h.reduce((a, s) => a + s.score, 0) / h.length);
  const recent = h.slice(-10);
  const recentAvg = Math.round(recent.reduce((a, s) => a + s.score, 0) / recent.length);
  const delta = recentAvg - avg;
  sum.textContent = `// ${h.length} session${h.length > 1 ? 's' : ''} · all-time avg ${avg} · last ${recent.length} avg ${recentAvg}` +
    (h.length > 10 ? ` (${delta >= 0 ? '+' : ''}${delta})` : '');

  const pts = h.slice(-40);
  const W = canvas.width, H = canvas.height, pad = 26;
  ctx.strokeStyle = 'rgba(232,237,230,0.1)';
  ctx.lineWidth = 1;
  [25, 50, 75].forEach(v => {
    const y = H - pad - (v / 100) * (H - pad * 2);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  });
  // stepped line, scope style
  ctx.strokeStyle = '#b7f445';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(183,244,69,0.4)';
  ctx.shadowBlur = 6;
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
    ctx.fillStyle = '#0b0c0b';
    ctx.fillRect(x - 4, y - 4, 8, 8);
    ctx.strokeStyle = '#b7f445';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 4, y - 4, 8, 8);
  });

  [...h].reverse().slice(0, 12).forEach(s => {
    const row = document.createElement('div');
    row.className = 'history-row';
    const when = new Date(s.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    row.innerHTML =
      `<span class="h-mode">${MODES[s.mode] ? MODES[s.mode].id : s.mode}</span>` +
      `<span class="h-date">${when}</span>` +
      `<span class="h-detail">${s.wpm} WPM · ${s.fillerRate} FILL/100W</span>` +
      `<span class="h-score">${s.score}</span>`;
    list.appendChild(row);
  });
}
