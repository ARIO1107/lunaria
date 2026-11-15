const tones = {
  wake: [520, 780], console: [360, 540, 720], ready: [392, 523, 659],
  tick: [880], ignite: [110, 82, 55], triumph: [392, 494, 587, 784],
  robot: [880, 1175],
};
const moods = {
  pad: { drone: 62, fifth: 93, lfo: 0.07, bed: 0.7 },
  tension: { drone: 49, fifth: 73, lfo: 0.35, bed: 0.95 },
  ascent: { drone: 55, fifth: 82, lfo: 0.18, bed: 1 },
  triumph: { drone: 78, fifth: 117, lfo: 0.12, bed: 0.85 },
};

function noiseBuffer(context) {
  const length = context.sampleRate * 2;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = last * 0.96 + white * 0.04;
    data[i] = last * 3;
  }
  return buffer;
}

export function createScore({ volume = .7, enabled = true }) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx || !enabled) return { cue() {}, setInterior() {}, setBurn() {}, setMood() {}, dispose() {} };
  const context = new AudioCtx();
  context.__lunariaCinematic = true;
  const master = context.createGain();
  master.gain.value = Math.max(0, Math.min(1, volume)) * .12;
  master.connect(context.destination);
  const drone = context.createOscillator();
  const fifth = context.createOscillator();
  const bed = context.createGain();
  bed.gain.value = .8;
  drone.frequency.value = 55;
  fifth.frequency.value = 82.5;
  drone.type = 'sine';
  fifth.type = 'sine';
  const warmth = context.createBiquadFilter();
  warmth.type = 'lowpass';
  warmth.frequency.value = 740;
  drone.connect(warmth); fifth.connect(warmth); warmth.connect(bed); bed.connect(master);
  drone.start(); fifth.start();
  const lfo = context.createOscillator();
  const lfoGain = context.createGain();
  lfo.frequency.value = .08;
  lfoGain.gain.value = .25;
  lfo.connect(lfoGain); lfoGain.connect(bed.gain);
  lfo.start();
  const air = context.createOscillator();
  const airGain = context.createGain();
  air.type = 'sine';
  air.frequency.value = 248;
  airGain.gain.value = 0.035;
  air.connect(airGain); airGain.connect(master); air.start();
  let interior = false;
  const hum = context.createOscillator();
  const humGain = context.createGain();
  hum.frequency.value = 140;
  hum.type = 'sine';
  humGain.gain.value = 0;
  hum.connect(humGain); humGain.connect(master); hum.start();
  const burnSource = context.createBufferSource();
  const burnGain = context.createGain();
  const burnFilter = context.createBiquadFilter();
  burnSource.buffer = noiseBuffer(context);
  burnSource.loop = true;
  burnFilter.type = 'lowpass';
  burnFilter.frequency.value = 420;
  burnGain.gain.value = 0;
  burnSource.connect(burnFilter); burnFilter.connect(burnGain); burnGain.connect(master);
  burnSource.start();
  const rumble = context.createOscillator();
  const rumbleGain = context.createGain();
  rumble.frequency.value = 55;
  rumble.type = 'square';
  rumbleGain.gain.value = 0;
  rumble.connect(rumbleGain); rumbleGain.connect(master);
  rumble.start();
  let burn = 0;
  let mood = 'pad';
  if (context.state === 'suspended') context.resume().catch(() => {});
  return {
    setInterior(on) {
      if (on === interior) return;
      interior = on;
      humGain.gain.setTargetAtTime(on ? .04 : 0, context.currentTime, .2);
    },
    setMood(name) {
      const next = moods[name];
      if (!next || name === mood || context.state !== 'running') return;
      mood = name;
      const now = context.currentTime;
      drone.frequency.setTargetAtTime(next.drone, now, .4);
      fifth.frequency.setTargetAtTime(next.fifth, now, .4);
      air.frequency.setTargetAtTime(next.drone * 4, now, .5);
      lfo.frequency.setTargetAtTime(next.lfo, now, .3);
      bed.gain.setTargetAtTime(next.bed, now, .4);
    },
    setBurn(amount) {
      const level = Math.max(0, Math.min(1, amount || 0));
      if (Math.abs(level - burn) < .02 || context.state !== 'running') return;
      burn = level;
      const now = context.currentTime;
      burnGain.gain.setTargetAtTime(level * .9, now, .08);
      rumbleGain.gain.setTargetAtTime(level * .16, now, .08);
    },
    fadeOut() {
      master.gain.setTargetAtTime(0, context.currentTime, .12);
    },
    cue(name) {
      const notes = tones[name];
      if (!notes || context.state !== 'running') return;
      const now = context.currentTime;
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        const start = now + index * .07;
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2400;
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(name === 'ignite' ? .7 : .5, start + .015);
        envelope.gain.exponentialRampToValueAtTime(.001, start + (name === 'ignite' ? .55 : .28));
        oscillator.connect(filter); filter.connect(envelope); envelope.connect(master);
        oscillator.start(start); oscillator.stop(start + .6);
      });
    },
    dispose() {
      [drone, fifth, lfo, air, hum, burnSource, rumble].forEach(node => { try { node.stop(); } catch { /* already stopped */ } });
      context.close().catch(() => {});
    },
  };
}
