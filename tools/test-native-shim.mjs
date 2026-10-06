// Drives www/ (the Capacitor web build) in headless Chrome with a mocked Capacitor
// SpeechRecognition plugin, to show the native bridge feeds app.js the same way the
// browser's recognizer does: live interim words, a final commit on stop, a scored drill.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const srv = spawn('python3', ['-m', 'http.server', '5011', '--bind', '127.0.0.1'], { cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 600));
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const WORDS = 'so the idea is pretty simple we let people talk to the app instead of typing and um it turns out most of us are like bad at it at first'.split(' ');
await ctx.addInitScript(([words]) => {
  // mock of @capacitor-community/speech-recognition on iOS: cumulative partials, a segment stop after 6 s
  window.__plugin = { starts: 0, stops: 0, perms: 0, lang: null };
  const listeners = { partialResults: [], listeningState: [] };
  let timer = null, i = 0, segmentTimer = null;
  const Plug = {
    requestPermissions: async () => { window.__plugin.perms++; return { speechRecognition: window.__denyPerm ? 'denied' : 'granted' }; },
    addListener: async (name, fn) => { listeners[name].push(fn); return { remove: () => { listeners[name] = listeners[name].filter(f => f !== fn); } }; },
    start: async ({ language }) => {
      window.__plugin.starts++; window.__plugin.lang = language; i = 0; clearInterval(timer); clearTimeout(segmentTimer);
      listeners.listeningState.forEach(f => f({ status: 'started' }));
      timer = setInterval(() => { i++; listeners.partialResults.forEach(f => f({ matches: [words.slice(0, i).join(' ')] })); }, 400);
      segmentTimer = setTimeout(() => { clearInterval(timer); listeners.listeningState.forEach(f => f({ status: 'stopped' })); }, 6000);
      return {};
    },
    stop: async () => { window.__plugin.stops++; clearInterval(timer); clearTimeout(segmentTimer); },
  };
  window.Capacitor = { isNativePlatform: () => true, Plugins: { SpeechRecognition: Plug } };
}, [WORDS]);
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto('http://127.0.0.1:5011/www/index.html');
console.log('bridge:', JSON.stringify(await page.evaluate(() => window.cadenceNative)));
await page.click('.hero-ctas .btn-solid'); await page.waitForTimeout(300);
await page.click('#recordBtn'); await page.waitForTimeout(3000);
const live = await page.textContent('#liveTranscript');
await page.waitForTimeout(5000); // crosses the mocked segment boundary at 6 s
await page.click('#recordBtn'); await page.waitForTimeout(1500);
const r = await page.evaluate(() => ({ grade: document.querySelector('#scoreGrade').textContent, score: document.querySelector('#scoreNum').textContent, words: document.querySelector('#statWords').textContent, fillers: document.querySelector('#statFillers').textContent, stalls: document.querySelector('#statPauses').textContent, transcript: document.querySelector('#resultTranscript').textContent.slice(0, 60), saved: JSON.parse(localStorage.getItem('cadence_history_v1') || '[]').length, plugin: window.__plugin }));
console.log('live after 3 s:', JSON.stringify(live.slice(0, 50)));
console.log('result:', JSON.stringify(r));
// permission denied path
await page.evaluate(() => { window.__denyPerm = true; });
await page.click('#againBtn'); await page.waitForTimeout(300); await page.click('#recordBtn'); await page.waitForTimeout(800);
console.log('denied:', JSON.stringify(await page.evaluate(() => ({ label: document.querySelector('#recordBtnLabel').textContent, timer: document.querySelector('#timerNum').textContent, msg: (document.querySelector('.lt-mic') || {}).textContent }))));
await b.close(); srv.kill();
