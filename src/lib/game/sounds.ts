// Web Audio API synthesized sound effects
// All sounds generated programmatically — no files needed

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let masterVolume = 0.5;

// Load preferences from localStorage
if (typeof window !== 'undefined') {
  const storedEnabled = localStorage.getItem('gc-sound-enabled');
  if (storedEnabled !== null) soundEnabled = storedEnabled === 'true';
  const storedVolume = localStorage.getItem('gc-sound-volume');
  if (storedVolume !== null) masterVolume = parseFloat(storedVolume);
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!soundEnabled) return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function gain(ctx: AudioContext, value: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = value * masterVolume;
  return g;
}

// --- Public API ---

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('gc-sound-enabled', String(enabled));
  }
}

export function getSoundEnabled(): boolean {
  return soundEnabled;
}

export function setVolume(level: number) {
  masterVolume = Math.max(0, Math.min(1, level));
  if (typeof window !== 'undefined') {
    localStorage.setItem('gc-sound-volume', String(masterVolume));
  }
}

export function getVolume(): number {
  return masterVolume;
}

// --- Sound Effects ---

/** Quick percussive click for mission card reveals */
export function cardFlip() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const bufferSize = ctx.sampleRate * 0.05; // 50ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  // Slight pitch variation each time
  filter.frequency.value = 1800 + Math.random() * 600;
  filter.Q.value = 1.0;

  const g = gain(ctx, 0.3);

  source.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);
  source.start(now);
  source.stop(now + 0.05);
}

/** Triumphant ascending chime — C5, E5, G5 */
export function missionSuccess() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const g = gain(ctx, 0.25);
    g.gain.setValueAtTime(0.25 * masterVolume, now + i * 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.6);
  });
}

/** Ominous descending tone — E4, C4 */
export function missionFailed() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const freqs = [329.63, 261.63]; // E4, C4

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const g = gain(ctx, 0.3);
    g.gain.setValueAtTime(0.3 * masterVolume, now + i * 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.8);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.8);
  });
}

/** Subtle tick for each vote revealed */
export function voteRevealTick() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 3200;

  const g = gain(ctx, 0.15);
  g.gain.setValueAtTime(0.15 * masterVolume, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.03);
}

/** Soft whoosh/sweep for phase changes */
export function phaseTransition() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const bufferSize = ctx.sampleRate * 0.3; // 300ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 2.0;
  filter.frequency.setValueAtTime(200, now);
  filter.frequency.exponentialRampToValueAtTime(4000, now + 0.3);

  const g = gain(ctx, 0.12);
  g.gain.setValueAtTime(0.12 * masterVolume, now);
  g.gain.linearRampToValueAtTime(0, now + 0.3);

  source.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);
  source.start(now);
  source.stop(now + 0.3);
}

/** Dramatic sting for the assassin guess moment */
export function assassinStrike() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Low rumble
  const bass = ctx.createOscillator();
  bass.type = 'sine';
  bass.frequency.value = 55;
  const bassGain = gain(ctx, 0.35);
  bassGain.gain.setValueAtTime(0.35 * masterVolume, now);
  bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  bass.connect(bassGain);
  bassGain.connect(ctx.destination);
  bass.start(now);
  bass.stop(now + 0.5);

  // Sharp high stab
  const stab = ctx.createOscillator();
  stab.type = 'sawtooth';
  stab.frequency.value = 880;
  const stabGain = gain(ctx, 0.2);
  stabGain.gain.setValueAtTime(0.2 * masterVolume, now + 0.05);
  stabGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  const stabFilter = ctx.createBiquadFilter();
  stabFilter.type = 'lowpass';
  stabFilter.frequency.value = 2000;
  stab.connect(stabFilter);
  stabFilter.connect(stabGain);
  stabGain.connect(ctx.destination);
  stab.start(now + 0.05);
  stab.stop(now + 0.2);
}

/** Ethereal angelic chord for Second Coming / good wins */
export function victoryCelebration() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Major chord: C4, E4, G4, C5 with slight detuning for shimmer
  const freqs = [261.63, 329.63, 392.0, 523.25];
  const detune = [-3, 2, -2, 3]; // cents of detuning

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = detune[i];

    const g = gain(ctx, 0.15);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.15 * masterVolume, now + 0.3);
    g.gain.setValueAtTime(0.15 * masterVolume, now + 1.5);
    g.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

    // Reverb-like effect using delay
    const delay = ctx.createDelay(0.5);
    delay.delayTime.value = 0.12 + i * 0.03;
    const delayGain = gain(ctx, 0.08);
    delayGain.gain.value = 0.08 * masterVolume;

    osc.connect(g);
    g.connect(ctx.destination);

    // Delay feedback path
    osc.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 3.0);
  });
}

/** Dark victory sound for when Babylon wins */
export function babylonTriumph() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Minor chord: C4, Eb4, G4
  const freqs = [261.63, 311.13, 392.0];

  freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    // Drop an octave for lower register feel
    const sub = ctx.createOscillator();
    sub.type = 'triangle';
    sub.frequency.value = freq / 2;

    const g = gain(ctx, 0.2);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.2 * masterVolume, now + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    const subG = gain(ctx, 0.1);
    subG.gain.setValueAtTime(0.001, now);
    subG.gain.linearRampToValueAtTime(0.1 * masterVolume, now + 0.2);
    subG.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    osc.connect(g);
    g.connect(ctx.destination);
    sub.connect(subG);
    subG.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 2.0);
    sub.start(now);
    sub.stop(now + 2.0);
  });
}

/** Quick gentle ping for new chat messages */
export function chatNotification() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 880; // A5

  const g = gain(ctx, 0.15);
  g.gain.setValueAtTime(0.15 * masterVolume, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.08);
}

/** Subtle feedback for button clicks */
export function buttonPress() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 600;

  const g = gain(ctx, 0.08);
  g.gain.setValueAtTime(0.08 * masterVolume, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.02);
}
