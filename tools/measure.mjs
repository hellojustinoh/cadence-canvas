// Measures taps and seconds from a fresh install to the first scored drill
// in the public collage app, on a phone-sized viewport, with speech stubbed.
//
//   NODE_PATH=/opt/node-tools/node_modules node tools/measure.mjs [--build=test] [--speak=20] [--label=x]
//
// Prints one JSON line: { label, build, taps, seconds, overheadSeconds, score, path }
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)=?(.*)$/); return m ? [m[1], m[2] === '' ? true : m[2]] : [a, true];
}));
const BUILD = args.build || 'release';
const SPEAK = Number(args.speak || 20);
const PORT = Number(args.port || 4777);
const LABEL = args.label || 'run';
const EXTRA_FLAGS = args.flags || '';
const THINK = Number(args.think || 0);      // seconds of silence after Record before the first word
const RUNOUT = !!args.runout;               // let the timer run out instead of tapping Finish
const DENIED = !!args.denied;               // first getUserMedia call rejects (mic denied), then allowed
const MODE = args.mode || 'sprint';

// serve repo root
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 700));

const SCRIPT = ('so the idea is pretty simple we let people talk to the app instead of typing and it turns out ' +
  'most of us are bad at it at first because nobody ever taught us to edit in our heads um the keyboard ' +
  'had a backspace and voice does not so you have to decide your last word before you say your first one ' +
  'and that is a trainable skill like any other ').trim().split(' ');

const STUB = `
  window.__think = ${THINK * 1000};
  if (${DENIED}) { let first = true; const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = c => { if (first) { first = false; return Promise.reject(new DOMException('denied','NotAllowedError')); } return orig(c); }; }
  class FakeSR {
    constructor(){ this.continuous=true; this.interimResults=true; this.lang='en-US'; this._i=0; this._t=null; }
    start(){ const words=${JSON.stringify(SCRIPT)}; const wpm=150; const perWord=60000/wpm; let buf=[]; let n=0;
      const t0 = performance.now();
      this._t=setInterval(()=>{ if (performance.now() - t0 < window.__think) return; buf.push(words[this._i++ % words.length]); n++;
        const isFinal = n % 6 === 0;
        const res=[{0:{transcript:' '+buf.join(' ')},isFinal, length:1}];
        res.item=i=>res[i];
        const ev={resultIndex:0,results:res};
        if(this.onresult) this.onresult(ev);
        if(isFinal) buf=[];
      }, perWord);
      window.__srStarted = performance.now();
    }
    stop(){ clearInterval(this._t); if(this.onend) setTimeout(()=>this.onend&&this.onend(),0); }
    abort(){ this.stop(); }
  }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
`;

const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['microphone'] });
await ctx.addInitScript(STUB);
const page = await ctx.newPage();
let taps = 0; const path = [];
async function tap(sel, name) {
  await page.waitForSelector(sel, { state: 'visible', timeout: 10000 });
  if (args.shots) await page.screenshot({ path: `${args.shots}/${String(taps).padStart(2,'0')}-before-${(name||sel).replace(/[^a-z0-9]+/gi,'_')}.png` });
  await page.click(sel); taps++; path.push(name || sel);
}

const q = BUILD === 'release' ? '' : `?build=${BUILD}` + (EXTRA_FLAGS ? `&flags=${EXTRA_FLAGS}` : '');
const t0 = Date.now();
await page.goto(`http://127.0.0.1:${PORT}/cadence-collage/${q}`, { waitUntil: 'load' });

// Path: hero CTA -> picker -> record -> speak -> finish -> score
if (await page.$('#view-session:not([hidden]) #recordBtn:visible')) {
  // some builds may open straight into a session
} else {
  await tap('.hero-ctas .btn-solid', 'hero: Start a 60-second drill');
  if (await page.isVisible('#view-drills')) await tap(`#view-drills [data-start="${MODE}"]`, `picker: ${MODE}`);
}
let recordVisible = await page.isVisible('#recordBtn');
if (recordVisible) await tap('#recordBtn', 'Record');
if (DENIED) {
  await page.waitForTimeout(600);
  path.push(`[mic denied → on ${await page.isVisible('#view-session') ? 'session' : 'picker'} screen]`);
  if (await page.isVisible('#view-drills')) await tap(`#view-drills [data-start="${MODE}"]`, `picker again: ${MODE}`);
  await tap('#recordBtn', 'Record again');
}
const tRecord = Date.now();
await page.waitForFunction(() => window.__srStarted != null, null, { timeout: 10000 });
await page.waitForTimeout((THINK + SPEAK) * 1000);
if (RUNOUT) {
  await page.waitForFunction(() => { const v = document.querySelector('#view-results'); return v && !v.hidden; }, null, { timeout: 90000 });
} else {
  await tap('#recordBtn', 'Finish');
}
await page.waitForFunction(() => {
  const v = document.querySelector('#view-results'); return v && !v.hidden;
}, null, { timeout: 10000 });
const t1 = Date.now();
// let the score count-up animation settle before reading it
await page.waitForTimeout(1400);
const score = await page.textContent('#scoreNum');
const stats = await page.evaluate(() => ({ wpm: +document.querySelector('#statWpm').textContent, fillerRate: +document.querySelector('#statFillers').textContent, stalls: +document.querySelector('#statPauses').textContent, words: +document.querySelector('#statWords').textContent }));
const seconds = +((t1 - t0) / 1000).toFixed(2);
const drillSeconds = RUNOUT ? (tRecord ? +((t1 - tRecord) / 1000).toFixed(1) : 0) : THINK + SPEAK;
console.log(JSON.stringify({ label: LABEL, build: BUILD, mode: MODE, taps, seconds, overheadSeconds: +(seconds - drillSeconds).toFixed(2), score: Number(score), ...stats, path }));
if (args.shots) await page.screenshot({ path: `${args.shots}/99-results.png` });
if (args.shot) await page.screenshot({ path: String(args.shot), fullPage: false });
await browser.close(); srv.kill();
