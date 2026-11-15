const tones = { wake: [520, 780], console: [360, 540, 720], ready: [392, 523, 659] };

export function createScore({ volume = .7, enabled = true }) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx || !enabled) return { cue() {}, setInterior() {}, dispose() {} };
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
  fifth.type = 'triangle';
  drone.connect(bed); fifth.connect(bed); bed.connect(master);
  drone.start(); fifth.start();
  const lfo = context.createOscillator();
  const lfoGain = context.createGain();
  lfo.frequency.value = .08;
  lfoGain.gain.value = .25;
  lfo.connect(lfoGain); lfoGain.connect(bed.gain);
  lfo.start();
  let interior = false;
  const hum = context.createOscillator();
  const humGain = context.createGain();
  hum.frequency.value = 140;
  hum.type = 'sine';
  humGain.gain.value = 0;
  hum.connect(humGain); humGain.connect(master); hum.start();
  if (context.state === 'suspended') context.resume().catch(() => {});
  return {
    setInterior(on) {
      if (on === interior) return;
      interior = on;
      humGain.gain.setTargetAtTime(on ? .04 : 0, context.currentTime, .2);
    },
    cue(name) {
      const notes = tones[name];
      if (!notes || context.state !== 'running') return;
      const now = context.currentTime;
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        const start = now + index * .08;
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(.5, start + .02);
        envelope.gain.exponentialRampToValueAtTime(.001, start + .22);
        oscillator.connect(envelope); envelope.connect(master);
        oscillator.start(start); oscillator.stop(start + .24);
      });
    },
    dispose() {
      [drone, fifth, lfo, hum].forEach(node => { try { node.stop(); } catch { /* already stopped */ } });
      context.close().catch(() => {});
    },
  };
}
