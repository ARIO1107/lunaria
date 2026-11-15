import { createMenuLoop } from './menuMusic.js';

let context;
let master;
let enabled = true;
let volume = .35;
let lastSound = -Infinity;
let noise;
const active = new Set();
let menuLoop;
let menuTrack;
let menuRequest;

const voices = {
  click: { notes: [660, 880], dur: 0.04, type: 'square', peak: 0.26 },
  open: { notes: [392, 523, 784], dur: 0.07, type: 'square', peak: 0.28 },
  close: { notes: [494, 330], dur: 0.06, type: 'square', peak: 0.24 },
  success: { notes: [523, 659, 784], dur: 0.09, type: 'square', peak: 0.3, harm: true },
  error: { notes: [196, 146], dur: 0.11, type: 'square', peak: 0.28 },
  alarm: { notes: [587, 440, 587], dur: 0.08, type: 'square', peak: 0.26 },
  countdown: { notes: [880], dur: 0.05, type: 'square', peak: 0.3 },
  launch: { notes: [110, 82, 55], dur: 0.16, type: 'square', peak: 0.36, noise: true },
  thrust: { notes: [73], dur: 0.08, type: 'square', peak: 0.22, noise: true, layer: true },
  landing: { notes: [196, 262, 392], dur: 0.1, type: 'square', peak: 0.28, harm: true },
  collect: { notes: [784, 988, 1318], dur: 0.06, type: 'square', peak: 0.26 },
  levelComplete: { notes: [392, 523, 659, 784], dur: 0.12, type: 'square', peak: 0.26, harm: true },
  step: { notes: [180], dur: 0.04, type: 'square', peak: 0.16, tick: true, layer: true },
  motor: { notes: [146], dur: 0.045, type: 'square', peak: 0.12, layer: true },
  robot: { notes: [880, 1175], dur: 0.055, type: 'square', peak: 0.2, layer: true },
  beep: { notes: [988], dur: 0.045, type: 'square', peak: 0.22 },
  stage: { notes: [220, 330, 494], dur: 0.07, type: 'square', peak: 0.26 },
};
const grooveNotes = [262, 330, 392, 494, 392, 330, 294, 349];
let lastSoft = -Infinity;
let grooveTimer = 0;
let grooveIndex = 0;
const groove = [];

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
  if (!enabled) { stopMenuBed(); stopGameBed(); }
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

export function startMenuBed() {
  if (!enabled || !context || menuTrack || menuRequest) return;
  if (context.state !== 'running') {
    const request = Symbol();
    menuRequest = request;
    context.resume().then(() => {
      if (menuRequest !== request) return;
      menuRequest = undefined;
      if (context.state === 'running') startMenuBed();
    }).catch(() => {
      if (menuRequest === request) menuRequest = undefined;
    });
    return;
  }
  menuLoop ??= createMenuLoop(context);
  const source = context.createBufferSource();
  const gain = context.createGain();
  const now = context.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(.55, now + .3);
  source.buffer = menuLoop;
  source.loop = true;
  source.connect(gain).connect(master);
  source.onended = () => { source.disconnect(); gain.disconnect(); };
  menuTrack = { source, gain };
  source.start();
}

export function stopMenuBed() {
  menuRequest = undefined;
  if (!menuTrack) return;
  const { source, gain } = menuTrack;
  menuTrack = undefined;
  const now = context.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setTargetAtTime(0, now, .035);
  source.stop(now + .16);
}

function tone(frequency, type, start, dur, peak) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const filter = context.createBiquadFilter();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  filter.type = 'lowpass';
  filter.frequency.value = type === 'square' ? Math.max(2400, frequency * 8) : Math.max(900, frequency * 4);
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

function hush(nodes) {
  const now = context?.currentTime ?? 0;
  for (const node of nodes) {
    try {
      if (typeof node.stop === 'function') node.stop(now + 0.05);
      node.disconnect();
    } catch { /* already stopped */ }
  }
  nodes.length = 0;
}

function armGameBed() {
  if (!enabled || !context || context.state !== 'running' || grooveTimer) return;
  const pulse = () => {
    if (!enabled || !context || context.state !== 'running') return;
    const frequency = grooveNotes[grooveIndex % grooveNotes.length];
    grooveIndex += 1;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(now);
    oscillator.stop(now + 0.18);
    groove.push(oscillator);
    oscillator.onended = () => {
      const index = groove.indexOf(oscillator);
      if (index >= 0) groove.splice(index, 1);
      try { oscillator.disconnect(); envelope.disconnect(); } catch { /* already disconnected */ }
    };
  };
  pulse();
  grooveTimer = window.setInterval(pulse, 340);
}

export function startGameBed() {
  if (!enabled || !context || grooveTimer) return;
  if (context.state === 'running') { armGameBed(); return; }
  context.resume().then(() => armGameBed()).catch(() => {});
}

export function stopGameBed() {
  if (grooveTimer) window.clearInterval(grooveTimer);
  grooveTimer = 0;
  hush(groove);
}

export function tickCrew(moving, following, dt, clock) {
  if (!clock || !dt) return;
  if (moving) {
    clock.step = (clock.step || 0) + dt;
    if (clock.step > 0.34) { clock.step = 0; playSound('step'); }
  } else clock.step = 0.16;
  if (following) {
    clock.motor = (clock.motor || 0) + dt;
    if (clock.motor > 0.52) { clock.motor = 0; playSound('motor'); }
  } else clock.motor = 0;
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

function tickNoise(start, peak) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  source.buffer = noiseBuffer(context);
  filter.type = 'highpass';
  filter.frequency.value = 700;
  envelope.gain.setValueAtTime(peak, start);
  envelope.gain.exponentialRampToValueAtTime(0.001, start + 0.045);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(master);
  track(source, filter, envelope);
  source.start(start);
  source.stop(start + 0.05);
}

export function playSound(name = 'click') {
  if (!enabled || !context || context.state !== 'running' || document.hidden) return;
  const now = context.currentTime;
  const voice = voices[name] || voices.click;
  if (voice.layer) {
    if (now - lastSoft < 0.1) return;
    lastSoft = now;
  } else {
    if (now - lastSound < .065) return;
    lastSound = now;
    suspendAudio();
  }
  if (voice.noise) thrust(now);
  if (voice.tick) tickNoise(now, voice.peak);
  voice.notes.forEach((frequency, index) => {
    const start = now + index * voice.dur * 0.72;
    tone(frequency, voice.type, start, voice.dur, voice.peak);
    if (voice.harm) tone(frequency * 2, 'square', start, voice.dur * 0.8, voice.peak * 0.12);
  });
}
