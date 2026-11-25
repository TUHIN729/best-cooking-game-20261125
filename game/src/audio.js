// audio.js — every sound in Ember Kitchen is synthesized with WebAudio.
// No audio files are loaded; the game stays silent until the player enables sound
// with a first click or keypress (browsers require a user gesture).

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  // Call from a user gesture; safe to call repeatedly.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type = 'sine', vol = 1, slideTo = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.5 * vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol = 1, lowpass = 1200, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.6 * vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  pickup() { this.tone(520, 0.09, 'triangle', 0.8, 760); }
  place() { this.tone(340, 0.08, 'triangle', 0.7, 260); }
  chop() {
    // A short woody thock, three quick hits.
    this.noise(0.06, 0.9, 900);
    this.noise(0.06, 0.7, 900, 0.09);
    this.noise(0.06, 0.7, 900, 0.18);
  }
  chopDone() { this.tone(660, 0.1, 'square', 0.4, 880); this.tone(880, 0.14, 'sine', 0.5, null, 0.08); }
  sizzle() { this.noise(0.5, 0.5, 5200); }
  cooked() { this.tone(740, 0.12, 'sine', 0.7); this.tone(988, 0.18, 'sine', 0.6, null, 0.1); }
  burnt() { this.tone(220, 0.35, 'sawtooth', 0.6, 110); }
  orderIn() { this.tone(587, 0.12, 'triangle', 0.7); this.tone(880, 0.16, 'triangle', 0.6, null, 0.11); }
  plateReady() { this.tone(1046, 0.14, 'sine', 0.8); this.tone(1318, 0.2, 'sine', 0.7, null, 0.1); }
  serve() {
    // A little pentatonic chime for a served dish.
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => this.tone(f, 0.22, 'sine', 0.7, null, i * 0.07));
  }
  fail() { this.tone(196, 0.3, 'sawtooth', 0.5, 130); }
  tick() { this.tone(1180, 0.05, 'square', 0.25); }
  rush() { this.tone(392, 0.1, 'square', 0.5); this.tone(523, 0.12, 'square', 0.5, null, 0.1); }
  win() {
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.7, null, i * 0.12));
  }
}
