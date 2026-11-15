let context;
let master;
let enabled = true;
let volume = .35;
let lastSound = -Infinity;
let noise;
const active = new Set();
const bed = [];
let bedStarting = false;

const voices = {
  click: { notes: [740], dur: 0.045, type: 'sine', peak: 0.34 },
  open: { notes: [392, 587], dur: 0.08, type: 'sine', peak: 0.36 },
  close: { notes: [494, 330], dur: 0.07, type: 'sine', peak: 0.32 },
  success: { notes: [523, 659, 784], dur: 0.11, type: 'sine', peak: 0.34, harm: true },
  error: { notes: [196, 155], dur: 0.13, type: 'triangle', peak: 0.32 },
  alarm: { notes: [587, 440, 587], dur: 0.09, type: 'triangle', peak: 0.28 },
  countdown: { notes: [880], dur: 0.055, type: 'sine', peak: 0.3 },
  launch: { notes: [78, 104], dur: 0.22, type: 'sine', peak: 0.4, noise: true },
  landing: { notes: [247, 330, 494], dur: 0.12, type: 'sine', peak: 0.3, harm: true },
  collect: { notes: [784, 988], dur: 0.08, type: 'sine', peak: 0.3 },
  levelComplete: { notes: [392, 523, 659, 784], dur: 0.14, type: 'sine', peak: 0.28, harm: true },
};

function noiseBuffer(ctx) {
  if (noise && noise.sampleRate === ctx.sampleRate) return noise;
  const length = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = last * 0.86 + white * 0.14;
    data[i] = last;
  }
  noise = buffer;
  return buffer;
}

function track(node, ...rest) {
  active.add(node);
  node.onended = () => {
    active.delete(node);
    try { node.disconnect(); } catch { /* already disconnected */ }
    rest.forEach(item => { try { item.disconnect(); } catch { /* already disconnected */ } });
  };
}

export function configureAudio(settings = {}) {
  enabled = settings.soundEnabled !== false;
  const candidate = Number(settings.volume);
  if (Number.isFinite(candidate)) volume = Math.max(0, Math.min(100, candidate)) / 100;
  if (master && context) master.gain.setTargetAtTime(enabled ? volume * .15 : 0, context.currentTime, .025);
  if (!enabled) stopMenuBed();
}

export function unlockAudio() {
  try {
    if (!context) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      context = new Audio();
      master = context.createGain();
      master.gain.value = enabled ? volume * .15 : 0;
      master.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
  } catch {
    // Browsers without audio support retain all game interactions.
  }
}

export function suspendAudio() {
  for (const node of active) {
    try { node.stop(); } catch { /* Already stopped. */ }
  }
  active.clear();
}

function armMenuBed() {
  if (!enabled || !context || context.state !== 'running' || bed.length) return;
  const now = context.currentTime;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 480;
  filter.connect(master);
  bed.push(filter);
  for (const [frequency, level] of [[82.4, 0.07], [123.5, 0.035]]) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(level, now + 0.9);
    osc.connect(gain);
    gain.connect(filter);
    osc.start();
    bed.push(osc);
  }
}

export function startMenuBed() {
  if (!enabled || !context || bed.length || bedStarting) return;
  if (context.state === 'running') {
    armMenuBed();
    return;
  }
  bedStarting = true;
  context.resume().then(() => {
    bedStarting = false;
    armMenuBed();
  }).catch(() => { bedStarting = false; });
}

export function stopMenuBed() {
  const now = context?.currentTime ?? 0;
  for (const node of bed) {
    try {
      if (typeof node.stop === 'function') node.stop(now + 0.15);
      node.disconnect();
    } catch { /* already stopped */ }
  }
  bed.length = 0;
  bedStarting = false;
}

function tone(frequency, type, start, dur, peak) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const filter = context.createBiquadFilter();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  filter.type = 'lowpass';
  filter.frequency.value = Math.max(900, frequency * 4);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(peak, start + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.001, start + dur);
  oscillator.connect(filter);
  filter.connect(envelope);
  envelope.connect(master);
  track(oscillator, envelope, filter);
  oscillator.start(start);
  oscillator.stop(start + dur + 0.02);
}

function thrust(start) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  source.buffer = noiseBuffer(context);
  filter.type = 'lowpass';
  filter.frequency.value = 280;
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(0.28, start + 0.04);
  envelope.gain.exponentialRampToValueAtTime(0.001, start + 0.42);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(master);
  track(source, filter, envelope);
  source.start(start);
  source.stop(start + 0.44);
}

export function playSound(name = 'click') {
  if (!enabled || !context || context.state !== 'running' || document.hidden) return;
  const now = context.currentTime;
  if (now - lastSound < .065) return;
  lastSound = now;
  suspendAudio();
  const voice = voices[name] || voices.click;
  if (voice.noise) thrust(now);
  voice.notes.forEach((frequency, index) => {
    const start = now + index * voice.dur * 0.72;
    tone(frequency, voice.type, start, voice.dur, voice.peak);
    if (voice.harm) tone(frequency * 2, 'sine', start, voice.dur * 0.8, voice.peak * 0.16);
  });
}
