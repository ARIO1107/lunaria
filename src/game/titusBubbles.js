import { scienceFacts, skyFacts } from '../data/scienceFacts.js';

const shorts = {
  air: 'Capitán Alex, lo primero es ir a soporte vital y revisar los parámetros del aire.',
  power: 'Capitán Alex, ahora vamos a la estación de energía.',
  fuel: 'Capitán Alex, sigamos a propulsión para revisar el combustible. Seguimos en la plataforma.',
  clearance: 'Capitán Alex, volvamos a propulsión y pidamos autorización antes de encender.',
  launch: 'Capitán Alex, desde propulsión despega la nave. Cuenta regresiva, empuje y separación.',
  navigation: 'Capitán Alex, vamos a la mira COAS, en el puente, y mete la proa en el arco verde.',
  supplies: 'Capitán Alex, ahora la esclusa: abre la taquilla del traje y arma la bolsa de emergencia.',
  atmosphere: 'Capitán Alex, volvamos a soporte vital. Mira la reserva de oxígeno, no solo la presión.',
  'energy-tour': 'Capitán Alex, a la estación de energía: respaldo para el aire y la navegación.',
  signal: 'Capitán Alex, al panel de propulsión. Busca el canal ficticio 7.',
  diagnose: 'Capitán Alex, a la estación de energía. La lámpara roja marca el circuito averiado.',
  isolate: 'Capitán Alex, sigue en energía. Baja el disyuntor antes de tocar la pieza.',
  replace: 'Capitán Alex, al traje. En la bandeja está el fusible compatible.',
  'repair-test': 'Capitán Alex, regresa a energía y reconecta en orden: cubierta, continuidad y circuito.',
  allocation: 'Capitán Alex, en energía reparte el presupuesto. Aire, navegación y propulsión tienen mínimo.',
  stabilize: 'Capitán Alex, a la mira COAS. Deja el horizonte en 90°.',
  orbit: 'Capitán Alex, a propulsión. Frena hasta entrar en órbita lunar.',
  site: 'Capitán Alex, al control de descenso. Elige una zona en el mapa.',
  module: 'Capitán Alex, prepara el módulo: propulsión, comunicaciones y equipo.',
  landing: 'Capitán Alex, desde el descenso baja despacio y toca con poca velocidad.',
  'eva-check': 'Capitán Alex, al módulo. Sella el traje y despresuriza la esclusa.',
  observe: 'Capitán Alex, camina hasta el regolito. Describe la textura, no el color.',
  return: 'Capitán Alex, vuelve al módulo. Cierra la esclusa y después recupera la presión.',
  habitat: 'Capitán Alex, al hábitat prefabricado. Revisa estructura, sensores y carga.',
  solar: 'Capitán Alex, a los paneles. Conéctalos a las baterías antes de la sombra.',
  life: 'Capitán Alex, al soporte vital de la base. Enciende aire, oxígeno y temperatura.',
  water: 'Capitán Alex, al almacén. El agua de la tripulación va primero.',
  'surface-suit': 'Capitán Alex, al módulo. Revisa aire, sellos y la ruta de regreso.',
  sample: 'Capitán Alex, toma la bolsa etiquetada de regolito.',
  analysis: 'Capitán Alex, al laboratorio. El instrumento marca roca y polvo: es regolito.',
};

const curiosities = [
  ...skyFacts,
  ...scienceFacts.map(fact => ({ id: fact.id, title: fact.title, text: fact.text, sourceUrl: fact.sourceUrl, sourceTitle: fact.sourceTitle })),
];

export function bubbleGuide(task) {
  if (!task) return 'Capitán Alex, en operaciones cierra tres ciclos y haz tres actividades. Lee el costo antes de pulsar.';
  return shorts[task.id] || `Capitán Alex, vamos hacia ${task.title}.`;
}

const FACT_EVERY = 6;

export function bubbleLine(level, task, tick, moment = 'walk') {
  const showFact = moment === 'done' || (tick > 0 && tick % FACT_EVERY === FACT_EVERY - 1);
  if (!showFact) return { kind: 'guide', text: bubbleGuide(task) };
  const index = moment === 'done' ? Number(tick) : Math.floor(tick / FACT_EVERY) + Number(level || 1);
  const fact = curiosities[((index % curiosities.length) + curiosities.length) % curiosities.length];
  return { kind: 'fact', text: fact.text, title: fact.title, sourceUrl: fact.sourceUrl, sourceTitle: fact.sourceTitle };
}

export function bubbleSpeech(level, task, tick, moment = 'walk') {
  const line = bubbleLine(level, task, tick, moment);
  if (line.kind !== 'fact') return line.text;
  return `${line.text} Fuente: ${line.sourceTitle}.`;
}
