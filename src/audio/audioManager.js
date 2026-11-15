let context;
let master;
let enabled = true;
let volume = .35;
let lastSound = -Infinity;
const active = new Set();
const tones = {
  click: [540], open: [360, 540], close: [540, 360], success: [523, 659, 784],
  error: [180, 140], alarm: [480, 240, 480], countdown: [760],
  launch: [80, 100, 130, 180], landing: [220, 330, 440],
  collect: [660, 880], levelComplete: [392, 523, 659, 784],
};

export function configureAudio(settings = {}) {
  enabled = settings.soundEnabled !== false;
  const candidate = Number(settings.volume);
  if (Number.isFinite(candidate)) volume = Math.max(0, Math.min(100, candidate)) / 100;
  if (master && context) master.gain.setTargetAtTime(enabled ? volume * .15 : 0, context.currentTime, .025);
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
  for (const oscillator of active) {
    try { oscillator.stop(); } catch { /* Already stopped. */ }
  }
  active.clear();
}

export function playSound(name = 'click') {
  if (!enabled || !context || context.state !== 'running' || document.hidden) return;
  const now = context.currentTime;
  if (now - lastSound < .065) return;
  lastSound = now;
  suspendAudio();
  const notes = tones[name] || tones.click;
  const duration = name === 'launch' ? .24 : .095;
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const start = now + index * duration;
    oscillator.type = name === 'launch' ? 'triangle' : 'sine';
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(.65, start + .015);
    envelope.gain.exponentialRampToValueAtTime(.001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    active.add(oscillator);
    oscillator.onended = () => { active.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + duration + .01);
  });
}
