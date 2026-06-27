/* ============================================================
   CADENCE DESIGN CANVAS — app.js
   Pan/zoom world, live version frames, per-frame feedback
   threads synced with canvas/feedback.json (the agent inbox).
   ============================================================ */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const FRAMES = [
  { id: 'cadence',         name: 'V1 · Wispr Editorial', desc: 'warm serif, ribbons, cream',          src: '/cadence/index.html' },
  { id: 'cadence-lab',     name: 'V2 · Lab Console',     desc: 'dark instrument panel, volt green',   src: '/cadence-lab/index.html' },
  { id: 'cadence-toybox',  name: 'V3 · Toybox',          desc: 'candy color blocks, bouncy',          src: '/cadence-toybox/index.html' },
  { id: 'cadence-collage', name: 'V4 · Collage',         desc: 'navy serif, pastels, doodles',        src: '/cadence-collage/index.html' },
  { id: 'cadence-retro',   name: 'V5 · Retro ’95',  desc: 'system 7 desktop, CRT, cardigan',     src: '/cadence-retro/index.html' },
  { id: 'cadence-anime',   name: 'V6 · Retro Anime',     desc: 'Eva/Akira terminal, sync ratio',      src: '/cadence-anime/index.html' },
];

const FRAME_W = 660;
const FRAME_GAP = 70;
const ROW_H = 760;

/* ============================================================
   1. BUILD FRAMES
   ============================================================ */
const world = $('#world');
const tpl = $('#frameTpl');

FRAMES.forEach((f, i) => {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.dataset.frame = f.id;
  node.style.left = `${(i % 3) * (FRAME_W + FRAME_GAP) + 60}px`;
  node.style.top = `${Math.floor(i / 3) * ROW_H + 40}px`;
  $('.fh-name', node).textContent = f.name;
  $('.fh-desc', node).textContent = f.desc;
  const iframe = $('iframe', node);
  iframe.src = f.src;
  iframe.title = f.name;
  $('.fh-open', node).href = f.src;
  $('.fh-reload', node).addEventListener('click', () => { iframe.src = f.src; });
  $('.fc-form', node).addEventListener('submit', async e => {
    e.preventDefault();
    const input = $('input', e.target);
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    await api('/api/feedback', { frame: f.id, text });
    await refresh();
    toast('Saved. Claude will pick this up.');
  });
  world.appendChild(node);
});

/* ============================================================
   2. PAN + ZOOM
   ============================================================ */
const viewport = $('#viewport');
let view = { x: 0, y: 0, scale: 1 };

function applyView() {
  world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
  $('#zoomLevel').textContent = Math.round(view.scale * 100) + '%';
}

function setZoom(scale, cx, cy) {
  scale = Math.min(3, Math.max(0.18, scale));
  // keep the point under (cx, cy) fixed while zooming
  const k = scale / view.scale;
  view.x = cx - (cx - view.x) * k;
  view.y = cy - (cy - view.y) * k;
  view.scale = scale;
  applyView();
}

function fitAll() {
  const cols = Math.min(3, FRAMES.length);
  const rows = Math.ceil(FRAMES.length / 3);
  const worldW = cols * (FRAME_W + FRAME_GAP) - FRAME_GAP + 120;
  const worldH = rows * ROW_H + 80;
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const scale = Math.min(vw / worldW, vh / worldH, 1.2);
  view = {
    scale,
    x: (vw - worldW * scale) / 2,
    y: Math.max(14, (vh - worldH * scale) / 2),
  };
  applyView();
}

viewport.addEventListener('pointerdown', e => {
  // pan from the canvas background or a frame header (not buttons/inputs/iframe)
  const fromHead = e.target.closest('.frame-head') && !e.target.closest('button, a');
  const fromBg = e.target === viewport || e.target === world;
  if (!fromBg && !fromHead) return;

  const frameEl = fromHead ? e.target.closest('.frame') : null;
  const start = { x: e.clientX, y: e.clientY };
  const orig = frameEl
    ? { x: parseFloat(frameEl.style.left), y: parseFloat(frameEl.style.top) }
    : { x: view.x, y: view.y };
  viewport.classList.add('panning');
  viewport.setPointerCapture(e.pointerId);

  function move(ev) {
    const dx = ev.clientX - start.x;
    const dy = ev.clientY - start.y;
    if (frameEl) {
      frameEl.style.left = orig.x + dx / view.scale + 'px';
      frameEl.style.top = orig.y + dy / view.scale + 'px';
    } else {
      view.x = orig.x + dx;
      view.y = orig.y + dy;
      applyView();
    }
  }
  function up(ev) {
    viewport.classList.remove('panning');
    viewport.removeEventListener('pointermove', move);
    viewport.removeEventListener('pointerup', up);
  }
  viewport.addEventListener('pointermove', move);
  viewport.addEventListener('pointerup', up);
});

viewport.addEventListener('wheel', e => {
  e.preventDefault();
  // Trackpad pinch arrives as a wheel event with ctrlKey set and SMALL deltas,
  // so it needs a much higher sensitivity than a mouse scroll-wheel's big deltas.
  const pinch = e.ctrlKey || e.metaKey;
  if (pinch || Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    const sensitivity = pinch ? 0.015 : 0.0016;
    const factor = Math.exp(-e.deltaY * sensitivity);
    setZoom(view.scale * factor, e.clientX, e.clientY - 48);
  } else {
    view.x -= e.deltaX;
    applyView();
  }
}, { passive: false });

$('#zoomIn').addEventListener('click', () =>
  setZoom(view.scale * 1.2, viewport.clientWidth / 2, viewport.clientHeight / 2));
$('#zoomOut').addEventListener('click', () =>
  setZoom(view.scale / 1.2, viewport.clientWidth / 2, viewport.clientHeight / 2));
$('#zoomFit').addEventListener('click', fitAll);
window.addEventListener('resize', fitAll);

/* ============================================================
   3. FEEDBACK SYNC
   ============================================================ */
async function api(path, body) {
  const res = await fetch(path, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : undefined);
  // On a static host there's no Python backend: the request 404s with an HTML
  // page rather than JSON. Treat that as "no API" so the canvas goes read-only.
  if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('no-api');
  }
  return res.json();
}

let lastSerialized = '';
let apiLive = null; // null = unknown, true = live (server.py), false = static/read-only

async function refresh() {
  let items;
  try { items = await api('/api/feedback'); }
  catch { if (apiLive !== false) enterReadOnly(); return; }
  apiLive = true;
  const ser = JSON.stringify(items);
  if (ser === lastSerialized) return;
  lastSerialized = ser;
  renderComments(items);
}

// Static deploy (no canvas/server.py): disable input, keep the board browsable.
function enterReadOnly() {
  apiLive = false;
  clearInterval(pollTimer);
  $$('.fc-form').forEach(form => {
    const input = $('input', form);
    const btn = $('button', form);
    input.disabled = true;
    btn.disabled = true;
    input.placeholder = 'Read-only preview — run canvas/server.py to leave feedback';
  });
  const copyBtn = $('#copyFeedback');
  if (copyBtn) copyBtn.disabled = true;
  const dot = $('.as-dot');
  if (dot) dot.style.background = 'var(--faint)';
  const strip = $('#agentStripText');
  if (strip) strip.innerHTML =
    'Read-only preview. The feedback loop runs when the canvas is served by ' +
    '<code>canvas/server.py</code> — clone the repo and run ' +
    '<code>python3 canvas/server.py 4190</code>.';
}

function renderComments(items) {
  FRAMES.forEach(f => {
    const frameEl = $(`.frame[data-frame="${f.id}"]`);
    const list = $('.fc-list', frameEl);
    const badge = $('.fh-badge', frameEl);
    const mine = items.filter(it => it.frame === f.id).sort((a, b) => a.at - b.at);
    const open = mine.filter(it => it.status !== 'done').length;
    badge.hidden = open === 0;
    badge.textContent = open;

    list.innerHTML = '';
    mine.forEach(it => {
      const el = document.createElement('div');
      el.className = 'fc-item' + (it.status === 'done' ? ' done' : '');
      const when = new Date(it.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      el.innerHTML =
        `<div class="fc-meta">` +
          `<span class="fc-status ${it.status === 'done' ? 'done' : 'open'}">${it.status === 'done' ? 'done' : 'open'}</span>` +
          `<span class="fc-time">${when}</span>` +
          `<button class="fc-del" title="Delete">✕</button>` +
        `</div>` +
        `<div class="fc-text"></div>` +
        (it.reply ? `<div class="fc-reply"><b>CLAUDE</b><br></div>` : '');
      $('.fc-text', el).textContent = it.text;
      if (it.reply) $('.fc-reply', el).append(it.reply);
      $('.fc-del', el).addEventListener('click', async () => {
        await api('/api/feedback/delete', { id: it.id });
        await refresh();
      });
      list.appendChild(el);
    });
    if (mine.length) list.scrollTop = list.scrollHeight;
  });
}

const pollTimer = setInterval(refresh, 4000);

/* ============================================================
   4. COPY OPEN FEEDBACK AS A PROMPT
   ============================================================ */
$('#copyFeedback').addEventListener('click', async () => {
  const items = await api('/api/feedback');
  const open = items.filter(it => it.status !== 'done');
  if (!open.length) { toast('No open feedback.'); return; }
  const byFrame = {};
  open.forEach(it => (byFrame[it.frame] = byFrame[it.frame] || []).push(it.text));
  let out = 'Process this canvas feedback (also saved in canvas/feedback.json):\n';
  FRAMES.forEach(f => {
    if (!byFrame[f.id]) return;
    out += `\n${f.name} (${f.id}/):\n`;
    byFrame[f.id].forEach(t => { out += `- ${t}\n`; });
  });
  await navigator.clipboard.writeText(out);
  toast(`Copied ${open.length} open item${open.length > 1 ? 's' : ''} for Claude.`);
});

/* ---------- toast ---------- */
const toastEl = document.createElement('div');
toastEl.id = 'toast';
document.body.appendChild(toastEl);
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

/* ---------- init ---------- */
fitAll();
refresh();
