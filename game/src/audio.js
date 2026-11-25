// Synthesised WebAudio sounds — no audio files, no network.
// Sizzle (filtered noise), chop (thock), ding (serve), buzz (wrong), pop (pick).
export function createAudio() {
  let ctx = null;
  let muted = false;
  let sizzleNodes = null;

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime + (when || 0);
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain || 0.12, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, filterFreq, gain) {
    const ac = ensure();
    if (!ac || muted) return;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const g = ac.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(ac.destination);
    src.start();
  }

  return {
    unlock() { ensure(); },
    setMuted(m) { muted = m; this.stopSizzle(); },
    isMuted() { return muted; },
    pop() { tone(520, 0.08, 'triangle', 0.1); },
    chop() { noiseBurst(0.09, 900, 0.25); tone(180, 0.07, 'square', 0.06); },
    ding() { tone(880, 0.25, 'sine', 0.14); tone(1318, 0.35, 'sine', 0.1, 0.08); },
    levelup() { tone(523, 0.12, 'triangle', 0.12); tone(659, 0.12, 'triangle', 0.12, 0.09); tone(784, 0.28, 'triangle', 0.13, 0.18); },
    buzz() { tone(140, 0.22, 'sawtooth', 0.08); },
    plate() { tone(660, 0.1, 'triangle', 0.1); tone(990, 0.12, 'triangle', 0.08, 0.05); },
    /** Mariachi drum: low thump + bright strum for Fiesta Rush. */
    taiko() {
      tone(110, 0.3, 'sine', 0.25); tone(82, 0.4, 'sine', 0.2, 0.12);
      tone(660, 0.12, 'triangle', 0.1, 0.05); tone(880, 0.14, 'triangle', 0.1, 0.18);
      noiseBurst(0.12, 1200, 0.2);
    },
    /** Trumpet-ish fanfare for El Jefe. */
    fanfare() {
      tone(523, 0.15, 'square', 0.07); tone(659, 0.15, 'square', 0.07, 0.12);
      tone(784, 0.3, 'square', 0.08, 0.24); tone(1046, 0.4, 'square', 0.08, 0.36);
    },
    /** Golden arpeggio for a perfect serve. */
    perfect() {
      tone(1046, 0.12, 'sine', 0.12); tone(1318, 0.12, 'sine', 0.12, 0.08);
      tone(1568, 0.25, 'sine', 0.12, 0.16);
    },
    /** Slow, dreamy shimmer for Slow Time. */
    slow() {
      tone(880, 0.4, 'sine', 0.1); tone(660, 0.4, 'sine', 0.1, 0.12);
      tone(440, 0.5, 'sine', 0.1, 0.24);
    },
    /** Tense two-note sting when the combo hits x4 and climbs. */
    tension() {
      tone(1174, 0.08, 'square', 0.05); tone(1568, 0.1, 'square', 0.05, 0.07);
    },
    startSizzle() {
      const ac = ensure();
      if (!ac || muted || sizzleNodes) return;
      const len = ac.sampleRate;
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buf; src.loop = true;
      const filter = ac.createBiquadFilter();
      filter.type = 'highpass'; filter.frequency.value = 3000;
      const g = ac.createGain(); g.gain.value = 0.05;
      src.connect(filter).connect(g).connect(ac.destination);
      src.start();
      sizzleNodes = { src, g };
    },
    stopSizzle() {
      if (!sizzleNodes) return;
      try { sizzleNodes.src.stop(); } catch { /* already stopped */ }
      sizzleNodes = null;
    },
  };
}
