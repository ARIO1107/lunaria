export const CINEMATIC_DURATION = 100;

export const cameraKeys = [
  { t: 0, p: [0.8, 5.8, 22], l: [-8, 3, 50] },
  { t: 6, p: [6.8, 2.2, 7.2], l: [0, 0.5, 0.2] },
  { t: 11, p: [-4.2, 1.5, 1.2], l: [0, 0.6, -0.4] },
  { t: 16.5, p: [1.6, 2.6, -1.4], l: [0, 0.4, -8] },
  { t: 24, p: [0.85, 1.58, 1.35], l: [-0.4, 1.15, 0.65] },
  { t: 34, p: [0.55, 1.48, 1.22], l: [-0.15, 1.18, 0.5] },
  { t: 48, p: [0.7, 1.55, 1.15], l: [0, 1.35, -2.2] },
  { t: 60, p: [-1.35, 1.42, -0.35], l: [0.1, 1.35, -1.6] },
  { t: 74, p: [0.15, 1.5, -0.75], l: [1.15, 1.26, 0.12] },
  { t: 86, p: [0.9, 1.45, 0.55], l: [1.25, 1.3, 0.05] },
  { t: 94, p: [-0.15, 1.62, 0.85], l: [0.2, 1.28, -1.2] },
  { t: 100, p: [0.05, 1.68, 1.05], l: [0.15, 1.25, -1.4] },
];

export const lines = [
  { id: 'titus-hello', speaker: 'Titus', start: 23, duration: 5.5, expression: 'talk', text: '¡Buenos días, comandante! Soy Titus, tu asistente de misión.' },
  { id: 'alex-where', speaker: 'Alex', start: 29, duration: 4.2, expression: 'wake', text: '¿Titus? ¿Ya estamos cerca de la Luna?' },
  { id: 'titus-stage', speaker: 'Titus', start: 33.5, duration: 5, expression: 'talk', text: '¡Así es! Nuestro viaje está entrando en una etapa muy importante.' },
  { id: 'titus-distance', speaker: 'Titus', start: 40, duration: 7, expression: 'info', text: '¿Sabías que la Luna se encuentra, en promedio, a unos 384 400 kilómetros de la Tierra?' },
  { id: 'alex-far', speaker: 'Alex', start: 47.5, duration: 4.2, expression: 'look', text: '¡Eso es muchísimo! ¿Y qué tenemos que hacer ahora?' },
  { id: 'titus-check', speaker: 'Titus', start: 52, duration: 5.5, expression: 'point', text: 'Antes de comenzar nuestra exploración, debemos revisar los sistemas de la nave.' },
  { id: 'titus-systems', speaker: 'Titus', start: 62, duration: 6, expression: 'point', text: 'Comprobaremos nuestra energía, el oxígeno y los equipos de navegación.' },
  { id: 'alex-ready', speaker: 'Alex', start: 68.5, duration: 3.2, expression: 'ready', text: 'Entendido. ¡Estoy listo!' },
  { id: 'titus-learn', speaker: 'Titus', start: 73, duration: 7, expression: 'talk', text: 'En el espacio, cada sistema cumple una función importante. Aprenderemos a trabajar con ellos paso a paso.' },
  { id: 'alex-task', speaker: 'Alex', start: 80.5, duration: 3.4, expression: 'ready', text: 'Entonces, ¿cuál es nuestra primera tarea?' },
  { id: 'titus-join', speaker: 'Titus', start: 84.2, duration: 5.5, expression: 'talk', text: 'Comenzaremos con una inspección de la nave. Te acompañaré durante toda la misión.' },
  { id: 'titus-remember', speaker: 'Titus', start: 91, duration: 5.2, expression: 'talk', text: 'Recuerda, comandante: observar, aprender y tomar buenas decisiones es la clave de toda misión.' },
  { id: 'alex-go', speaker: 'Alex', start: 96.4, duration: 2.6, expression: 'ready', text: '¡Vamos allá!' },
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

export function cameraAt(time) {
  const { from, to, u } = span(cameraKeys, time);
  return { position: lerp3(from.p, to.p, u), look: lerp3(from.l, to.l, u) };
}

export function lineAt(time) {
  return lines.find(line => time >= line.start && time < line.start + line.duration) ?? null;
}

export function cardAt(time) {
  if (time >= 6 && time < 15) return { kicker: 'LUNARIA', title: 'Capítulo 1 — El despertar' };
  if (time >= 92) return { kicker: 'MISIÓN 01', title: 'Inspección de sistemas', detail: 'Objetivo: revisa el soporte vital con Titus.' };
  return null;
}

export function castAt(time) {
  const sit = time < 38 ? 1 : time > 46 ? 0 : 1 - (time - 38) / 8;
  const approach = clamp((time - 46) / 12, 0, 1);
  const titusPoints = [
    { t: 18, p: [1.15, 1.15, 1.55] },
    { t: 28, p: [-0.75, 1.28, 0.85] },
    { t: 46, p: [-0.85, 1.32, -0.15] },
    { t: 68, p: [1.35, 1.3, 0.15] },
    { t: 90, p: [0.72, 1.24, -0.45] },
  ];
  const { from, to, u } = span(titusPoints, time);
  return {
    lights: clamp((time - 16) / 6, 0, 1),
    eyes: time >= 20 ? 1 : clamp((time - 18) / 2, 0, 1),
    hologram: clamp((time - 62) / 4, 0, 1),
    interior: time >= 19,
    astronaut: { x: 0, y: 0, z: 0.55 - approach * 1.35, sit, stride: approach > 0 && approach < 1 ? time * 1.6 : 0 },
    titus: { p: lerp3(from.p, to.p, u), expression: lineAt(time)?.speaker === 'Titus' ? lineAt(time).expression : 'idle' },
  };
}
