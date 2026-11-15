export const CINEMATIC_DURATION = 75;
export const LAUNCH_DURATION = 60;

const openingCameras = [
  { t: 0, p: [16, 3.2, 18], l: [0, 6, 0] },
  { t: 7, p: [9, 7.5, 8], l: [1.2, 8, 0] },
  { t: 14, p: [-7, 5.5, 11], l: [0, 7.5, 0] },
  { t: 18, p: [2.2, 2.4, 5], l: [0, 5, 0] },
  { t: 22, p: [1.05, 1.62, 1.85], l: [0.05, 1.2, 0.35] },
  { t: 34, p: [0.35, 1.58, 1.75], l: [-0.2, 1.2, 0.4] },
  { t: 46, p: [0.7, 1.55, 1.15], l: [1.2, 1.25, -0.1] },
  { t: 58, p: [-0.85, 1.48, 0.35], l: [0.35, 1.28, -0.2] },
  { t: 68, p: [0.2, 1.58, 1.15], l: [0.05, 1.22, 0.2] },
  { t: 75, p: [0.05, 1.64, 1.2], l: [0.1, 1.25, -0.2] },
];

export const lines = [
  { id: 'titus-hello', speaker: 'Titus', start: 23, duration: 5.2, expression: 'talk', text: '¡Buenos días, comandante Alex! Hoy comienza nuestra aventura.' },
  { id: 'alex-ready', speaker: 'Alex', start: 29, duration: 4, expression: 'wake', text: '¿Ya está todo listo para despegar?' },
  { id: 'titus-not-yet', speaker: 'Titus', start: 33.5, duration: 6, expression: 'talk', text: 'Todavía no. Antes del lanzamiento debemos comprobar los sistemas principales de la nave.' },
  { id: 'titus-order', speaker: 'Titus', start: 42, duration: 6.5, expression: 'point', text: 'Primero revisaremos el soporte vital. Después comprobaremos la energía y los sistemas de propulsión.' },
  { id: 'alex-after', speaker: 'Alex', start: 49.5, duration: 3.2, expression: 'look', text: '¿Y cuando terminemos?' },
  { id: 'titus-clear', speaker: 'Titus', start: 53, duration: 6.5, expression: 'talk', text: 'Solicitaremos la autorización final. Si todos los sistemas están preparados, podremos comenzar el lanzamiento.' },
  { id: 'titus-go', speaker: 'Titus', start: 64, duration: 5, expression: 'point', text: '¡Vamos, comandante! Te mostraré nuestra primera estación.' },
];

const launchCameras = [
  { t: 0, p: [0.7, 1.55, 1.2], l: [-0.2, 1.2, 0.3] },
  { t: 8, p: [0.35, 1.5, 0.9], l: [0.9, 1.25, -0.1] },
  { t: 12, p: [8.5, 1.15, 9.5], l: [0, 0.55, 0] },
  { t: 17, p: [9.2, 1.45, 10.2], l: [0, 0.9, 0] },
  { t: 22, p: [16, 7, 18], l: [0, 7, 0] },
  { t: 28, p: [-12, 6, 14], l: [0, 8, 0] },
  { t: 32, p: [0.55, 1.5, 1.15], l: [0, 1.25, -0.4] },
  { t: 38, p: [8, 4, 14], l: [0, 7, 0] },
  { t: 48, p: [12, 5, 20], l: [0, 4, -4] },
  { t: 60, p: [9, 3.5, 16], l: [0, 3, -6] },
];

export const launchLines = [
  { id: 'launch-ready', speaker: 'Titus', start: 1.2, duration: 5.5, expression: 'talk', text: '¡Todos los sistemas están listos, comandante! Iniciamos la secuencia de lanzamiento.' },
  { id: 'launch-ignition', speaker: 'Titus', start: 13, duration: 3.5, expression: 'point', text: '¡Encendido confirmado!' },
  { id: 'launch-lift', speaker: 'Alex', start: 24, duration: 3.2, expression: 'ready', text: '¡Estamos despegando!' },
  { id: 'launch-watch', speaker: 'Titus', start: 28, duration: 4.5, expression: 'talk', text: '¡Ascenso iniciado! Mantengamos la atención en nuestros instrumentos.' },
  { id: 'launch-done', speaker: 'Titus', start: 49, duration: 4.2, expression: 'talk', text: '¡Excelente trabajo, comandante! Hemos completado nuestra primera misión.' },
  { id: 'launch-yes', speaker: 'Alex', start: 53.5, duration: 2.4, expression: 'ready', text: '¡Lo conseguimos, Titus!' },
  { id: 'launch-next', speaker: 'Titus', start: 56.2, duration: 3.4, expression: 'talk', text: 'Y esto es solo el comienzo. Nos esperan nuevos desafíos y descubrimientos.' },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smooth = (u) => u * u * (3 - 2 * u);
const mix = (a, b, u) => a + (b - a) * smooth(clamp(u, 0, 1));
const lerp3 = (a, b, u) => a.map((value, index) => mix(value, b[index], u));

function span(keys, time) {
  const t = clamp(time, keys[0].t, keys[keys.length - 1].t);
  let index = 0;
  while (index < keys.length - 2 && keys[index + 1].t < t) index += 1;
  const from = keys[index];
  const to = keys[index + 1];
  const u = to.t === from.t ? 1 : (t - from.t) / (to.t - from.t);
  return { from, to, u };
}

function shot(keys, time) {
  const { from, to, u } = span(keys, time);
  return { position: lerp3(from.p, to.p, u), look: lerp3(from.l, to.l, u) };
}

function spoken(script, time) {
  return script.find(line => time >= line.start && time < line.start + line.duration) ?? null;
}

export function durationOf(sequence = 'opening') {
  return sequence === 'launch' ? LAUNCH_DURATION : CINEMATIC_DURATION;
}

export function cameraAt(time, sequence = 'opening') {
  return shot(sequence === 'launch' ? launchCameras : openingCameras, time);
}

export function lineAt(time, sequence = 'opening') {
  return spoken(sequence === 'launch' ? launchLines : lines, time);
}

export function cardAt(time, sequence = 'opening') {
  if (sequence === 'launch') {
    if (time >= 3 && time < 13) return { kicker: 'CUENTA REGRESIVA', title: String(Math.max(1, 10 - Math.floor(time - 3))) };
    if (time >= 45 && time < 49) return { kicker: 'UN POCO DESPUÉS', title: 'Órbita terrestre' };
    if (time >= 54) return { kicker: 'MISIÓN 01 COMPLETADA', title: 'El lanzamiento' };
    return null;
  }
  if (time >= 6 && time < 16) return { kicker: 'LUNARIA', title: 'Capítulo 1 — El lanzamiento' };
  if (time >= 69) return { kicker: 'MISIÓN 01 — EL LANZAMIENTO', title: 'Comprobar los sistemas', detail: 'Objetivo: comprobar los sistemas de la nave antes del despegue.' };
  return null;
}

export function fadeAt(time, sequence = 'opening') {
  const outro = time > durationOf(sequence) - 0.9;
  if (sequence === 'launch') return outro || (time > 9.4 && time < 11.4) || (time > 30.6 && time < 32.4) || (time > 35.4 && time < 37.2) || (time > 44.2 && time < 47.4);
  return outro || (time > 17.4 && time < 20.8) || (time > 67.4 && time < 69.6);
}

function sequencePoints() {
  return [
    { t: 18, p: [1.15, 1.15, 1.55] },
    { t: 30, p: [-0.75, 1.28, 0.85] },
    { t: 46, p: [-0.55, 1.32, 0.15] },
    { t: 60, p: [1.15, 1.28, 0.05] },
    { t: 75, p: [0.55, 1.24, -0.15] },
  ];
}

export function castAt(time, sequence = 'opening') {
  if (sequence === 'launch') {
    const interior = time < 10 || (time >= 31 && time < 36);
    const line = spoken(launchLines, time);
    const spot = time < 20 ? [0.8, 1.28, 0.4] : [1.1, 1.3, 0.1];
    return {
      lights: interior ? 1 : 0.4,
      eyes: 1,
      hologram: time > 4 && time < 12 ? 1 : 0.2,
      interior,
      astronaut: { x: 0, y: 0, z: 0.4, sit: 0.15, stride: 0 },
      titus: { p: spot, expression: line?.speaker === 'Titus' ? line.expression : 'idle' },
    };
  }
  const sit = time < 40 ? 1 : time > 50 ? 0 : 1 - (time - 40) / 10;
  const approach = clamp((time - 50) / 10, 0, 1);
  const { from, to, u } = span(sequencePoints(), time);
  const line = spoken(lines, time);
  return {
    lights: clamp((time - 18) / 6, 0, 1),
    eyes: time >= 20 ? 1 : clamp((time - 18) / 2, 0, 1),
    hologram: clamp((time - 46) / 4, 0, 1),
    interior: time >= 20,
    astronaut: { x: 0, y: 0, z: 0.55 - approach * 1.05, sit, stride: approach > 0 && approach < 1 ? time * 1.6 : 0 },
    titus: { p: lerp3(from.p, to.p, u), expression: line?.speaker === 'Titus' ? line.expression : 'idle' },
  };
}

export function launchAltitude(time) {
  if (time >= 46) return 0;
  const lift = clamp((time - 16) / 24, 0, 1);
  return lift * lift * 90;
}

export function launchSky(time) {
  if (time < 22) return 0;
  if (time >= 46) return 1;
  return clamp((time - 22) / 20, 0, 1);
}

export function launchCameraLift(time) {
  if (time < 22 || time >= 46 || (time >= 31 && time < 36)) return 0;
  return launchAltitude(time);
}
