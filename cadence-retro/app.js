/* ============================================================
   CADENCE '95 — app.js
   Boot screen, window manager, TV static, and the same
   trainer engine as v1-v4 in a cardigan.
   ============================================================ */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ============================================================
   1. BOOT SEQUENCE
   ============================================================ */
(function boot() {
  const boot = $('#boot');
  const fill = $('#bootFill');
  const checks = $('#bootChecks');
  const desktop = $('#desktop');
  let done = false;

  const lines = [
    'CHECKING MICROPHONE ............ <span class="ok">OK</span>',
    'LOADING VOCABULARY ............. <span class="ok">OK</span>',
    'WARMING UP CARDIGAN ............ <span class="ok">OK</span>',
    'TUNING CHANNEL 3 ............... <span class="ok">OK</span>',
  ];

  let progress = 0;
  const iv = setInterval(() => {
    progress += 4 + Math.random() * 9;
    if (progress >= 100) { progress = 100; finish(); }
    fill.style.width = progress + '%';
    const lineCount = Math.floor((progress / 100) * lines.length);
    checks.innerHTML = lines.slice(0, lineCount).map(l => `<p>${l}</p>`).join('');
  }, 200);

  function finish() {
    if (done) return;
    done = true;
    clearInterval(iv);
    checks.innerHTML = lines.map(l => `<p>${l}</p>`).join('');
    fill.style.width = '100%';
    setTimeout(() => {
      desktop.hidden = false;
      boot.classList.add('boot-out');
      setTimeout(() => boot.remove(), 600);
    }, 450);
  }

  boot.addEventListener('click', finish);
  document.addEventListener('keydown', finish, { once: false });
})();

/* ============================================================
   2. MENU BAR: clock (perpetually 1997) + CRT toggle
   ============================================================ */
(function clock() {
  const el = $('#mbClock');
  function tick() {
    const n = new Date();
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    let h = n.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const m = String(n.getMinutes()).padStart(2, '0');
    el.textContent = `${days[n.getDay()]} ${n.getDate()} ${months[n.getMonth()]} 1997 · ${h}:${m} ${ampm}`;
  }
  tick();
  setInterval(tick, 15000);
})();

$('#crtToggle').addEventListener('click', () => {
  const crt = $('#crt');
  crt.classList.toggle('off');
  $('#crtToggle').textContent = crt.classList.contains('off') ? 'CRT: OFF' : 'CRT: ON';
});

/* ============================================================
   3. WINDOW MANAGER: open, close, focus, drag
   ============================================================ */
let zTop = 20;
function focusWin(win) { win.style.zIndex = ++zTop; }
function openWin(id) {
  const win = document.getElementById(id);
  win.hidden = false;
  focusWin(win);
  if (id === 'win-scores') renderProgress();
}

$$('[data-open-win]').forEach(el =>
  el.addEventListener('click', () => openWin(el.dataset.openWin))
);
$$('[data-close]').forEach(btn =>
  btn.addEventListener('click', e => {
    e.stopPropagation();
    btn.closest('.window').hidden = true;
  })
);
$$('.window').forEach(win =>
  win.addEventListener('pointerdown', () => focusWin(win))
);

// drag via title bars (desktop only)
$$('.win-title').forEach(bar => {
  bar.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    if (window.matchMedia('(max-width: 760px)').matches) return;
    const win = bar.closest('.window');
    const rect = win.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    win.style.right = 'auto';
    function move(ev) {
      win.style.left = Math.max(0, Math.min(window.innerWidth - 80, ev.clientX - dx)) + 'px';
      win.style.top = Math.max(32, Math.min(window.innerHeight - 60, ev.clientY - dy)) + 'px';
    }
    function up() {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  });
});

/* ============================================================
   4. CHANNEL 3: TV static
   ============================================================ */
(function tvStatic() {
  const canvas = $('#tvCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const img = ctx.createImageData(W, H);
  let frame = 0;
  function draw() {
    frame++;
    if (frame % 2 === 0) {
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ============================================================
   5. TRAINER ENGINE
   ============================================================ */
const MODES = {
  sprint: {
    label: 'EP.01 SPRINT',
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
    label: 'EP.02 FILLER HUNT',
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
    label: 'EP.03 DISTILL',
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

const SEGMENTS = 24;

const state = {
  mode: null, prompt: '', running: false, startedAt: 0, elapsed: 0,
  finalTranscript: '', interim: '', lastResultAt: 0, longPauses: 0,
  timerId: null, recognition: null, audioCtx: null, analyser: null,
  stream: null, rafId: null,
};

// build segment bar
(function segs() {
  const bar = $('#segBar');
  for (let i = 0; i < SEGMENTS; i++) bar.appendChild(document.createElement('i'));
})();

/* ---------- session window plumbing ---------- */
function startSetup(mode) {
  state.mode = mode;
  const m = MODES[mode];
  $('#sessionMode').textContent = `${m.label} · ${m.seconds} SEC`;
  $('#sessionTitle').textContent = 'RECORDING BOOTH';
  setPrompt(mode);
  resetSessionUI(m.seconds);
  $('#sessionBody').hidden = false;
  $('#resultsBody').hidden = true;
  openWin('win-session');
}

function closeSession() {
  stopSession(true);
  setOnAir(false);
  $('#win-session').hidden = true;
}

$$('[data-start]').forEach(btn =>
  btn.addEventListener('click', () => startSetup(btn.dataset.start))
);
$$('[data-close-session]').forEach(btn =>
  btn.addEventListener('click', closeSession)
);
$('#againBtn').addEventListener('click', () => startSetup(state.mode));
$('#resultsToDrills').addEventListener('click', () => {
  closeSession();
  openWin('win-drills');
});
$('#promptShuffle').addEventListener('click', () => {
  if (!state.running) setPrompt(state.mode);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#win-session').hidden) closeSession();
});

function setPrompt(mode) {
  const list = MODES[mode].prompts;
  let next = list[Math.floor(Math.random() * list.length)];
  if (next === state.prompt && list.length > 1) return setPrompt(mode);
  state.prompt = next;
  $('#promptText').textContent = next;
}

function resetSessionUI(seconds) {
  $('#timerNum').textContent = seconds;
  $$('#segBar i').forEach(i => i.classList.remove('off'));
  $('#recordBtnLabel').textContent = '● RECORD';
  $('#recordBtn').classList.remove('recording');
  $('#liveTranscript').innerHTML = '<span class="lt-placeholder">&gt; transcript will type here_</span>';
  $('#liveFillerCount').textContent = '0';
  const c = $('#waveCanvas');
  c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

function setOnAir(on) {
  $('#tvOnair').hidden = !on;
  $('#tvCaption').textContent = on
    ? 'NOW SHOWING: YOU, LIVE · be kind to yourself'
    : 'NOW SHOWING: STATIC · until you start talking';
}

/* ---------- recording ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

$('#recordBtn').addEventListener('click', () => {
  state.running ? finishSession() : beginSession();
});

async function beginSession() {
  if (!SR) {
    micWarn('ERROR: this browser has no speech recognition. Try Chrome.');
    closeSession();
    openWin('win-drills');
    return;
  }
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    micWarn('ERROR: microphone access denied. Allow the mic and retry.');
    closeSession();
    openWin('win-drills');
    return;
  }

  Object.assign(state, {
    running: true, startedAt: performance.now(), elapsed: 0,
    finalTranscript: '', interim: '', lastResultAt: performance.now(), longPauses: 0,
  });

  state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  state.analyser = state.audioCtx.createAnalyser();
  state.analyser.fftSize = 512;
  state.audioCtx.createMediaStreamSource(state.stream).connect(state.analyser);
  drawWave();
  setOnAir(true);

  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';
  rec.onresult = onSpeechResult;
  rec.onend = () => { if (state.running) { try { rec.start(); } catch {} } };
  rec.start();
  state.recognition = rec;

  const total = MODES[state.mode].seconds;
  $('#recordBtnLabel').textContent = '■ THAT\'S A WRAP';
  $('#recordBtn').classList.add('recording');
  const segEls = $$('#segBar i');
  state.timerId = setInterval(() => {
    state.elapsed = (performance.now() - state.startedAt) / 1000;
    const left = Math.max(0, total - state.elapsed);
    $('#timerNum').textContent = Math.ceil(left);
    const litCount = Math.ceil((left / total) * SEGMENTS);
    segEls.forEach((el, i) => el.classList.toggle('off', i >= litCount));
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
  $('#liveFillerCount').textContent = n;
}

function renderLiveTranscript() {
  const box = $('#liveTranscript');
  const finalHtml = markFillers(escapeHtml(state.finalTranscript));
  const interimHtml = `<span class="interim">${escapeHtml(state.interim)}</span>`;
  box.innerHTML = (finalHtml + ' ' + interimHtml).trim() ||
    '<span class="lt-placeholder">&gt; listening_</span>';
  box.scrollTop = box.scrollHeight;
}

// green phosphor oscilloscope
function drawWave() {
  const canvas = $('#waveCanvas');
  const ctx = canvas.getContext('2d');
  const data = new Uint8Array(state.analyser.fftSize);
  function frame() {
    if (!state.analyser) return;
    state.analyser.getByteTimeDomainData(data);
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#101418';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(120, 220, 120, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
    ctx.strokeStyle = '#7be37b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * W;
      const y = (data[i] / 255) * H;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
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
  if (score >= 85) return 'Speedy delivery! 🚋';
  if (score >= 70) return 'A fine episode, neighbor.';
  if (score >= 50) return 'Practice makes neighborly.';
  return 'Every episode starts somewhere.';
}

function tipFor(r) {
  if (r.words < 10) return 'The microphone barely heard you. Scoot a little closer and tape another.';
  if (r.fillerRate > 5) return `${r.fillers} fillers in ${r.words} words. Next episode, trade each one for a small quiet pause. Quiet sounds wise.`;
  if (r.pauses >= 3) return `You froze ${r.pauses} times for over 2 seconds. Decide how the sentence ends before you begin it.`;
  if (r.wpm < 110) return `${r.wpm} words a minute is storytime pace. Pick it up a little; speed teaches the brain to edit ahead.`;
  if (r.wpm > 210) return `${r.wpm} words a minute! Read the tape back and make sure it still sounds like you.`;
  return 'Pace, cleanliness, and flow all in the friendly zone. Shuffle to a stranger topic and defend the score.';
}

/* ---------- results ---------- */
function showResults() {
  const r = scoreSession();
  setOnAir(false);

  $('#sessionTitle').textContent = 'REPORT.TXT';
  $('#sessionBody').hidden = true;
  $('#resultsBody').hidden = false;

  $('#statWpm').textContent = r.wpm;
  $('#statFillers').textContent = r.fillerRate;
  $('#statPauses').textContent = r.pauses;
  $('#statWords').textContent = r.words;
  $('#scoreGrade').textContent = gradeFor(r.score);
  $('#scoreTip').textContent = tipFor(r);

  const transcript = state.finalTranscript.trim();
  $('#resultTranscript').innerHTML = transcript
    ? markFillers(escapeHtml(transcript))
    : '<i>&gt; no speech detected. check the microphone, then tape another.</i>';

  animateNumber($('#scoreNum'), r.score, 900);
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
  if (!h.length) { el.textContent = 'No episodes taped yet. The first one is the bravest.'; return; }
  const days = new Set(h.map(s => new Date(s.at).toDateString()));
  let streak = 0;
  const d = new Date();
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  const last = h[h.length - 1];
  el.textContent = streak > 1
    ? `${streak} days of episodes in a row. Last score: ${last.score}/100.`
    : `${h.length} episode${h.length > 1 ? 's' : ''} taped. Last score: ${last.score}/100.`;
}
renderStreak();

function renderProgress() {
  const h = history();
  const sum = $('#progressSummary');
  const list = $('#historyList');
  const canvas = $('#historyChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  list.innerHTML = '';

  if (!h.length) {
    sum.textContent = 'No sessions on the log yet.';
    return;
  }

  const avg = Math.round(h.reduce((a, s) => a + s.score, 0) / h.length);
  const recent = h.slice(-10);
  const recentAvg = Math.round(recent.reduce((a, s) => a + s.score, 0) / recent.length);
  sum.textContent = `${h.length} session${h.length > 1 ? 's' : ''} · all-time avg ${avg} · recent avg ${recentAvg}`;

  // chunky pixel bar chart
  const pts = h.slice(-24);
  const W = canvas.width, H = canvas.height, pad = 14;
  const bw = (W - pad * 2) / pts.length;
  pts.forEach((s, i) => {
    const bh = Math.max(4, (s.score / 100) * (H - pad * 2));
    const x = pad + i * bw + 2;
    const y = H - pad - bh;
    ctx.fillStyle = s.score >= 85 ? '#5f7a4e' : s.score >= 50 ? '#d9a23c' : '#b0413e';
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(3, Math.round(bw - 4)), Math.round(bh));
    ctx.strokeStyle = '#181512';
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(x), Math.round(y), Math.max(3, Math.round(bw - 4)), Math.round(bh));
  });

  [...h].reverse().slice(0, 10).forEach(s => {
    const row = document.createElement('div');
    row.className = 'history-row';
    const when = new Date(s.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    row.innerHTML =
      `<span class="h-mode">${s.mode}</span>` +
      `<span class="h-date">${when}</span>` +
      `<span>${s.wpm}wpm · ${s.fillerRate}f</span>` +
      `<span class="h-score">${s.score}</span>`;
    list.appendChild(row);
  });
}
