// Eight bars of soft synth tones over a repeating chord progression.
const beat = 60 / 88;
const chords = [
  [45, 57, 60, 64], [41, 53, 57, 60], [48, 55, 60, 64], [43, 55, 59, 62],
  [45, 57, 60, 64], [41, 53, 57, 60], [48, 55, 60, 64], [43, 55, 59, 62],
];
const melody = [
  [64, 69, 72, 71], [69, 65, 64, 60], [64, 67, 72, 76], [74, 71, 67, null],
  [64, 69, 72, 76], [77, 72, 69, 65], [67, 64, 60, 64], [62, 67, 71, null],
];

export function createMenuLoop(context) {
  const rate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.round(chords.length * 4 * beat * rate), rate);
  const samples = buffer.getChannelData(0);

  function note(pitch, start, length, level, soft) {
    const offset = Math.round(start * rate);
    const count = Math.round(length * rate);
    const step = 2 * Math.PI * 440 * 2 ** ((pitch - 69) / 12) / rate;
    const attack = (soft ? .09 : .016) * rate;
    for (let i = 0; i < count; i++) {
      const progress = i / count;
      const release = (1 - progress) ** (soft ? 1.2 : 2.6);
      const envelope = Math.min(i / attack, 1) * release;
      const phase = i * step;
      const tone = Math.sin(phase) + (soft ? .08 : .19) * Math.sin(phase * 2);
      samples[(offset + i) % samples.length] += tone * envelope * level;
    }
  }

  chords.forEach(([bass, ...harmony], bar) => {
    const start = bar * 4 * beat;
    harmony.forEach(pitch => note(pitch, start, 4.15 * beat, .028, true));
    note(bass, start, 1.75 * beat, .14, true);
    note(bass, start + 2 * beat, 1.5 * beat, .08, true);
    melody[bar].forEach((pitch, index) => {
      if (pitch === null) return;
      const at = start + [0, 1, 1.75, 3][index] * beat;
      note(pitch, at, 1.25 * beat, .20, false);
      note(pitch, at + .45 * beat, .9 * beat, .035, false);
    });
  });
  return buffer;
}

