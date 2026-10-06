// Unit test for the hesitation detector with synthetic frames at 60 fps.
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../cadence-collage/app.js', import.meta.url), 'utf8');
const cls = src.slice(src.indexOf('class HesitationDetector'), src.indexOf('if (typeof module'));
const { HesitationDetector } = new Function(cls + '; return { HesitationDetector };')();
const run = (name, frames, expect) => {
  const d = new HesitationDetector(); let t = 0, lastResult = 0, hits = 0;
  for (const f of frames) { for (let i = 0; i < f.n; i++) { t += 16.7; if (f.result) lastResult = t; if (d.step(f.rms, f.flux, t, lastResult)) hits++; } }
  console.log(`${hits === expect ? 'PASS' : 'FAIL'} ${name}: ${hits} (expected ${expect})`);
};
const silence = n => ({ n, rms: 0.005, flux: 0.5 });
const um = n => ({ n, rms: 0.12, flux: 0.03 });                      // steady vowel
const speech = n => ({ n, rms: 0.15, flux: 0.25, result: true });    // changing spectrum, words arriving
const speechNoWordsYet = n => ({ n, rms: 0.15, flux: 0.25 });        // talking, recognizer lagging
run('one 500 ms um', [silence(30), um(30), silence(30)], 1);
run('short 150 ms grunt', [silence(30), um(9), silence(30)], 0);
run('two ums with a gap', [silence(20), um(25), silence(15), um(25), silence(20)], 2);
run('one long 2 s uhhh counts once', [silence(20), um(120), silence(20)], 1);
run('speech with words arriving', [silence(20), speech(120), silence(20)], 0);
run('speech before the recognizer catches up (changing spectrum)', [silence(20), speechNoWordsYet(60), speech(60)], 0);
run('um in the middle of speech', [speech(60), um(30), speech(60)], 1);
run('held note while words arrive is speech', [silence(10), { n: 40, rms: 0.12, flux: 0.03, result: true }, silence(10)], 0);
