// Dry-loop checks on the public collage app: performance with years of data,
// accessibility settings, other locales, clock changes, upgrade from the
// previous build's storage. Prints JSON lines.
//   NODE_PATH=/opt/node-tools/node_modules node tools/checks.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const PORT = 4790;
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 700));
const URL_ = `http://127.0.0.1:${PORT}/cadence-collage/`;
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const out = o => console.log(JSON.stringify(o));

function seedScript(days, perDay = 1, endAt = Date.now()) {
  return `(() => { const h = []; const day = 864e5; for (let d = ${days} - 1; d >= 0; d--) for (let k = 0; k < ${perDay}; k++) {
    const score = 40 + Math.round(Math.random() * 55);
    h.push({ at: ${endAt} - d * day - k * 3600e3, mode: ['sprint','filler','distill'][(d+k)%3], words: 120, wpm: 140, fillers: 3, fillerRate: 2.5, pauses: 1, score }); }
    localStorage.setItem('cadence_history_v1', JSON.stringify(h)); return h.length; })()`;
}

// ---- 1. performance with years of data (old build caps at 200 on the next save; seed the raw list anyway)
for (const [label, days, perDay] of [['1y daily', 365, 1], ['3y daily', 1095, 1], ['3y x3/day', 1095, 3]]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const p = await ctx.newPage();
  await p.goto(URL_);
  const n = await p.evaluate(seedScript(days, perDay));
  const bytes = await p.evaluate(() => localStorage.getItem('cadence_history_v1').length);
  await p.reload();
  await p.click('.nav .btn-solid');
  const t = await p.evaluate(async () => {
    const t0 = performance.now();
    document.querySelector('.ttab[data-view="progress"]').click();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return +(performance.now() - t0).toFixed(1);
  });
  const summary = await p.textContent('#progressSummary');
  const streak = await p.evaluate(() => { document.querySelector('.ttab[data-view="drills"]').click(); return document.querySelector('#streakLine').textContent; });
  out({ check: 'perf', label, sessions: n, storageBytes: bytes, progressRenderMs: t, summary, streakLine: streak });
  await ctx.close();
}

// ---- 2. accessibility: reduced motion, larger text, contrast of the muted labels, labels on controls
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(URL_);
  // playState stays 'running' for zero-length animations, so report the effective duration instead
  const heroAnims = await p.evaluate(() => document.getAnimations().map(a => `${a.animationName}:${a.effect.getTiming().duration}ms×${a.effect.getTiming().iterations}`));
  await p.click('.nav .btn-solid');
  await p.waitForTimeout(100);
  const trainerAnims = await p.evaluate(() => document.getAnimations().map(a => `${a.animationName}:${a.effect.getTiming().duration}ms×${a.effect.getTiming().iterations}`));
  const smooth = await p.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  out({ check: 'a11y-reduced-motion', runningAnimationsOnHero: heroAnims, runningAnimationsInTrainer: trainerAnims, scrollBehavior: smooth });

  // labels / roles
  const a11y = await p.evaluate(() => {
    const unlabeled = [...document.querySelectorAll('button')].filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).map(b => b.id || b.className);
    const canvases = [...document.querySelectorAll('canvas')].map(c => ({ id: c.id, ariaLabel: c.getAttribute('aria-label'), role: c.getAttribute('role') }));
    const live = [...document.querySelectorAll('[aria-live]')].length;
    const dialog = document.querySelector('#trainer').getAttribute('role');
    return { unlabeledButtons: unlabeled, canvases, ariaLiveRegions: live, trainerRole: dialog, focusAfterOpen: document.activeElement && (document.activeElement.id || document.activeElement.tagName) };
  });
  out({ check: 'a11y-semantics', ...a11y });

  // contrast of muted text tokens (navy at 35% / 60% alpha on white, butter, pink)
  const contrast = await p.evaluate(() => {
    const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const blend = (fg, a, bg) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));
    const ratio = (fg, bg) => { const l1 = lum(fg), l2 = lum(bg); return +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2); };
    const navy = [27, 33, 80], white = [255, 255, 255], butter = [253, 243, 215], pink = [253, 230, 224];
    return {
      'navy-35 on white (hero note, hint)': ratio(blend(navy, 0.38, white), white),
      'navy-35 on butter (YOUR PROMPT, shuffle)': ratio(blend(navy, 0.38, butter), butter),
      'navy-60 on white (body copy)': ratio(blend(navy, 0.65, white), white),
      'navy-60 on pink (fillers chip label)': ratio(blend(navy, 0.65, pink), pink),
      'tomato on white (logo, s-mode)': ratio([240, 72, 34], white),
      'white on tomato (primary button)': ratio(white, [240, 72, 34]),
    };
  });
  out({ check: 'a11y-contrast', ...contrast });
  await ctx.close();

  // larger text: 150% root font size (Android Chrome "font size" scales px text as well, so also test body zoom)
  for (const [label, js] of [
    ['root 150% (rem-based sizes)', "document.documentElement.style.fontSize='150%'"],
    ['text-size 150% (px sizes too)', "document.body.style.zoom='1.5'"],
  ]) {
    const c2 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p2 = await c2.newPage();
    await p2.goto(URL_ + '?build=test');
    await p2.evaluate(js);
    await p2.click('.hero-ctas .btn-solid');
    await p2.waitForTimeout(300);
    const r = await p2.evaluate(() => {
      const vis = s => { const r = document.querySelector(s).getBoundingClientRect(); return r.bottom <= innerHeight && r.top >= 0; };
      const scrollW = document.documentElement.scrollWidth;
      return { recordVisibleWithoutScroll: vis('#recordBtn'), promptVisible: vis('#promptText'), horizontalOverflow: scrollW > innerWidth, navWraps: document.querySelector('.trainer-top').getBoundingClientRect().height };
    });
    await p2.screenshot({ path: `/tmp/claude-0/-home-user-cadence-canvas/d1130e2e-5d68-5bb0-b192-5975d9e587d3/scratchpad/shots-baseline/a11y-${label.split(' ')[0]}.png` });
    out({ check: 'a11y-large-text', label, ...r });
    await c2.close();
  }
}

// ---- 3. locales: German device, Japanese device; what the user sees and what recognition is told
for (const [locale, tz] of [['de-DE', 'Europe/Berlin'], ['ja-JP', 'Asia/Tokyo'], ['en-GB', 'Europe/London']]) {
  const ctx = await browser.newContext({ locale, timezoneId: tz, viewport: { width: 390, height: 844 }, isMobile: true });
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.__langs = []; class SR { start() { window.__langs.push(this.lang); } stop() {} } window.webkitSpeechRecognition = SR; });
  await p.goto(URL_);
  await p.evaluate(seedScript(3));
  await p.reload();
  await p.click('.nav .btn-solid');
  await p.click('.ttab[data-view="progress"]');
  const date = await p.textContent('.history-row .h-date');
  const fillLabel = await p.textContent('.history-row span:nth-child(3)');
  const htmlLang = await p.getAttribute('html', 'lang');
  out({ check: 'locale', locale, tz, navigatorLanguage: await p.evaluate(() => navigator.language), historyDate: date, historyStats: fillLabel, htmlLang, recognitionLang: 'en-US (hard-coded in beginSession)' });
  await ctx.close();
}

// ---- 4. clock changes: DST end in London (2026-10-25), streak across it; clock set back; timezone travel
{
  const ctx = await browser.newContext({ timezoneId: 'Europe/London', viewport: { width: 390, height: 844 }, isMobile: true });
  const p = await ctx.newPage();
  await p.goto(URL_);
  // sessions at 23:30 local on Oct 22, 23, 24 (BST), now = Oct 25 09:00 GMT (after the clocks went back)
  await p.evaluate(() => {
    const mk = iso => new Date(iso).getTime();
    const h = [22, 23, 24].map(d => ({ at: mk(`2026-10-${d}T23:30:00+01:00`), mode: 'sprint', words: 100, wpm: 140, fillers: 2, fillerRate: 2, pauses: 0, score: 80 }));
    localStorage.setItem('cadence_history_v1', JSON.stringify(h));
  });
  await p.clock.install({ time: new Date('2026-10-25T09:00:00Z') });
  await p.reload();
  await p.click('.nav .btn-solid');
  const afterDst = await p.textContent('#streakLine');
  // same history, now = Oct 24 23:45 BST (today has a session): streak should be 3
  await p.clock.setSystemTime(new Date('2026-10-24T22:45:00Z'));
  await p.reload(); await p.click('.nav .btn-solid');
  const sameDay = await p.textContent('#streakLine');
  // clock set back a week by the user
  await p.clock.setSystemTime(new Date('2026-10-17T09:00:00Z'));
  await p.reload(); await p.click('.nav .btn-solid');
  const clockBack = await p.textContent('#streakLine');
  out({ check: 'clock', streakMorningAfterDstEnd: afterDst, streakSameEveningBeforeDst: sameDay, streakWithClockSetBackAWeek: clockBack });
  await ctx.close();

  // timezone travel: sessions logged in Singapore, phone now in New York
  const c2 = await browser.newContext({ timezoneId: 'America/New_York', viewport: { width: 390, height: 844 }, isMobile: true });
  const p2 = await c2.newPage();
  await p2.goto(URL_);
  await p2.evaluate(() => {
    const h = [0, 1, 2].map(d => ({ at: new Date(`2026-10-0${3 - d}T07:30:00+08:00`).getTime(), mode: 'sprint', words: 100, wpm: 140, fillers: 2, fillerRate: 2, pauses: 0, score: 80 }));
    localStorage.setItem('cadence_history_v1', JSON.stringify(h));
  });
  await p2.clock.install({ time: new Date('2026-10-03T12:00:00Z') }); // Oct 3 08:00 in New York, Oct 3 20:00 in Singapore
  await p2.reload(); await p2.click('.nav .btn-solid');
  out({ check: 'clock-timezone-travel', note: 'three 07:30 SGT sessions on Oct 1-3, viewed from New York on Oct 3 morning', streakLine: await p2.textContent('#streakLine') });
  await c2.close();
}

// ---- 5. round 2: streak grace (test build), history cap after a real save (release vs test), upgrade from the phone's build
{
  for (const build of ['release', 'test']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, permissions: ['microphone'] });
    const p = await ctx.newPage();
    await p.addInitScript(() => { class SR { start() { setTimeout(() => this.onresult && this.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'one two three four five six seven eight nine ten eleven twelve' }], { isFinal: true })] }), 300); } stop() { this.onend && this.onend(); } } window.webkitSpeechRecognition = SR; });
    await p.goto(URL_ + `?build=${build}`);
    // yesterday-and-before streak, none today
    await p.evaluate(() => { const day = 864e5, now = Date.now(); const h = [5,4,3,2,1].map(d => ({ at: now - d*day, mode:'sprint', words:100, wpm:140, fillers:2, fillerRate:2, pauses:0, score:80 })); localStorage.setItem('cadence_history_v1', JSON.stringify(h)); });
    await p.reload(); await p.click('.nav .btn-solid');
    const streakBefore = await p.textContent('#streakLine');
    // 3 years of daily data, then one real drill, then count what survived the save
    await p.evaluate(seedScript(1095));
    await p.reload(); await p.click('.nav .btn-solid'); await p.click('[data-start="distill"]'); await p.click('#recordBtn');
    await p.waitForTimeout(1200); await p.click('#recordBtn');
    await p.waitForFunction(() => !document.querySelector('#view-results').hidden);
    const after = await p.evaluate(() => JSON.parse(localStorage.getItem('cadence_history_v1')).length);
    await p.click('.ttab[data-view="progress"]');
    const summary = await p.textContent('#progressSummary');
    out({ check: 'round2', build, streakLineMorningAfter5DayStreak: streakBefore, sessionsKeptAfterSaveWith1096: after, progressSummary: summary });
    await ctx.close();
  }
  // upgrade: storage written by the previous public build (main) is read by this build
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const p = await ctx.newPage();
  await p.goto(URL_);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('cadence_history_v1', JSON.stringify([{ at: Date.now() - 3600e3, mode: 'sprint', words: 90, wpm: 150, fillers: 1, fillerRate: 1.1, pauses: 0, score: 91 }])); });
  await p.goto(URL_ + '?build=test'); await p.click('.nav .btn-solid');
  const keys = await p.evaluate(() => Object.keys(localStorage).sort());
  out({ check: 'upgrade', fromBuild: 'main 18fc1e7 (cadence_history_v1 only)', streakLine: await p.textContent('#streakLine'), localStorageKeysAfter: keys, badge: await p.textContent('#buildBadge') });
  await ctx.close();
}

// ---- 6. timer uses a monotonic clock? (performance.now vs Date.now) — static grep result reported by the caller
await browser.close(); srv.kill();
