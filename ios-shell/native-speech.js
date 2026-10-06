/* Cadence iOS shell · native speech bridge
   WKWebView has no Web Speech API, so inside the Capacitor app this file presents the
   @capacitor-community/speech-recognition plugin to app.js as window.webkitSpeechRecognition.
   The engine (app.js) is untouched: it sees start/stop/onresult/onend/onerror, interim results
   that carry the whole utterance so far, and one final result per recognition segment.
   In the browser this file does nothing. */
(function () {
  const Cap = window.Capacitor;
  if (!Cap || typeof Cap.isNativePlatform !== 'function' || !Cap.isNativePlatform()) return;
  const Plug = Cap.Plugins && Cap.Plugins.SpeechRecognition;
  if (!Plug) { console.warn('[cadence] native shell without SpeechRecognition plugin'); return; }

  class NativeSpeechRecognition {
    constructor() {
      this.lang = 'en-US'; this.continuous = true; this.interimResults = true;
      this._cur = ''; this._active = false; this._handles = [];
      this.onresult = this.onend = this.onerror = null;
    }
    async start() {
      this._active = true; this._cur = '';
      let perm;
      try { perm = await Plug.requestPermissions(); } catch (e) { perm = null; }
      if (perm && perm.speechRecognition && perm.speechRecognition !== 'granted') {
        this._active = false;
        this.onerror && this.onerror({ error: 'not-allowed' });
        this.onend && this.onend();
        return;
      }
      this._handles.push(await Plug.addListener('partialResults', ({ matches }) => {
        if (!this._active) return;
        this._cur = (matches && matches[0]) || '';
        this._emit(false);
      }));
      // iOS ends a recognition segment on its own (about a minute, or after silence).
      // Commit what we have as final and start a new segment so a long drill keeps going.
      this._handles.push(await Plug.addListener('listeningState', ({ status }) => {
        if (status === 'stopped' && this._active) {
          this._commit();
          Plug.start({ language: this.lang, partialResults: true, popup: false }).catch(() => {});
        }
      }));
      try {
        await Plug.start({ language: this.lang, partialResults: true, popup: false });
      } catch (e) {
        this._active = false;
        const msg = String(e && e.message || e);
        this.onerror && this.onerror({ error: /denied|permission|authoriz/i.test(msg) ? 'not-allowed' : 'audio-capture', message: msg });
        this.onend && this.onend();
      }
    }
    _emit(isFinal) {
      const item = { transcript: ' ' + this._cur, confidence: 0.9 };
      const result = Object.assign([item], { isFinal, length: 1, item: () => item });
      const results = Object.assign([result], { length: 1, item: () => result });
      this.onresult && this.onresult({ resultIndex: 0, results });
    }
    _commit() { if (this._cur) { this._emit(true); this._cur = ''; } }
    stop() {
      if (!this._active) return;
      this._active = false;
      this._commit(); // synchronous, so app.js scores the full transcript right after stop()
      Plug.stop().catch(() => {});
      for (const h of this._handles) { try { h.remove(); } catch (e) {} }
      this._handles = [];
      this.onend && this.onend();
    }
    abort() { this.stop(); }
  }
  window.SpeechRecognition = NativeSpeechRecognition;
  window.webkitSpeechRecognition = NativeSpeechRecognition;

  // The waveform wants getUserMedia. Capturing the mic in WKWebView while the native recognizer
  // owns the audio session is unreliable, so by default hand app.js a silent stream (flat waveform).
  // Add "nativeRealMic" to the cadence_flags storage key to try the real capture on the phone.
  let flags = '';
  try { flags = localStorage.getItem('cadence_flags') || ''; } catch (e) {}
  if (!/(^|,)nativeRealMic(,|$)/.test(flags) && navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia = async () => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = ctx.createMediaStreamDestination();
      return dest.stream;
    };
  }
  window.cadenceNative = { shell: 'capacitor-ios', speech: 'native', realMic: /nativeRealMic/.test(flags) };
})();
