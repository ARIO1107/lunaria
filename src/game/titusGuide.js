import { STATIONS } from './world.js';
import { SURFACE_OBJECTS } from './surfaceWorld.js';

const places = Object.fromEntries([...STATIONS, ...SURFACE_OBJECTS].map(place => [place.id, place.name]));

const steps = {
  air: 'Activa la ventilación, abre el suministro de oxígeno, enciende la eliminación de CO₂ y pulsa Probar estabilidad. Cuando se mantenga, prepara el soporte vital.',
  power: 'Elige «Principal y respaldo independientes». No dejes el soporte vital sin electricidad.',
  fuel: 'Marca combustible disponible, válvulas comprobadas y motores preparados. El indicador de juego marca el depósito al 100 %.',
  clearance: 'Elige «Solicitar autorización». No enciendas los motores sin ese permiso.',
  launch: 'Haz la cuenta regresiva, controla el empuje, corta el motor central y separa la primera etapa. Si lo consigues, la nave despega y verás la película del ascenso.',
  navigation: 'Mueve la orientación hasta 45°, dentro de la zona de ±5°, y confirma.',
  supplies: 'Marca agua y alimentos, botiquín, y herramientas con equipo científico.',
  atmosphere: 'Elige «Reserva de oxígeno y composición del aire». La presión no dice cuánto oxígeno queda.',
  'energy-tour': 'Elige «Los sistemas esenciales». La luz decorativa no necesita respaldo.',
  signal: 'Pon el canal ficticio en 7, envía y espera unos segundos la respuesta.',
  diagnose: 'El fallo está en propulsión: circuito abierto y fusible quemado. Elige Propulsión.',
  isolate: 'Elige «Desconectar propulsión» antes de tocar la pieza.',
  replace: 'Elige «Fusible compatible». La cinta y el sensor óptico no reparan el circuito.',
  'repair-test': 'Marca cubierta cerrada, continuidad comprobada y circuito reconectado.',
  allocation: 'Reparte como máximo 60. Soporte vital al menos 20, navegación 15 y propulsión 20.',
  stabilize: 'Deja la referencia en 90°, con una tolerancia de ±5°, y confirma.',
  orbit: 'Elige «Encender para reducir la velocidad». Así entra la nave en órbita lunar.',
  site: 'Elige una zona: A es amplia y oscura, B tiene más luz y menos sitio, C es accidentada.',
  module: 'Marca propulsión y combustible, navegación y comunicaciones, y equipo de superficie.',
  landing: 'Usa el empuje para bajar despacio. Llega con poca velocidad y sobre la zona marcada.',
  'eva-check': 'Marca reserva del traje, casco sellado y esclusa despresurizada antes de salir.',
  observe: 'Elige «Describir la textura y registrar el lugar». El color no revela la composición.',
  return: 'Elige «Cerrar esclusa y recuperar presión». No abras las dos puertas a la vez.',
  habitat: 'Marca estructura intacta, sensores y presión, e inventario de carga.',
  solar: 'Elige «Conectar paneles a baterías» para tener electricidad durante la sombra.',
  life: 'Marca circulación de aire, control de oxígeno y CO₂, y control térmico. Gasta 10 de energía.',
  water: 'Elige el consumo humano primero y una recuperación controlada.',
  'surface-suit': 'Marca aire del traje, sellos comprobados y ruta de regreso.',
  sample: 'Pulsa recoger la muestra etiquetada de este sitio ficticio.',
  analysis: 'Elige Regolito. El instrumento no convierte el color en agua ni en metal puro.',
};

const byKind = {
  eclss: 'Prepara ventilación, oxígeno y retirada de CO₂, y prueba que el sistema se mantiene.',
  checks: 'Marca cada comprobación solo cuando esté hecha y confirma.',
  choice: 'Lee las opciones y confirma la que sigue el procedimiento.',
  alignment: 'Ajusta el control hasta la referencia, dentro de ±5°, y confirma.',
  allocation: 'No pases de 60 unidades y cubre los mínimos de aire, navegación y propulsión.',
  signal: 'Sintoniza el canal que pide Titus, envía y espera.',
  launch: 'Completa el simulador de ascenso hasta separar la etapa.',
  landing: 'Controla el empuje y toca el suelo con poca velocidad.',
  site: 'Elige una zona de aterrizaje.',
  collect: 'Recoge la muestra etiquetada.',
  analysis: 'Clasifica la muestra con el instrumento simulado.',
};

export const placeName = id => places[id] || id;

export function howTo(task) {
  if (!task) return 'Mira el objetivo pendiente y acércate a su consola.';
  return steps[task.id] || byKind[task.kind] || task.prompt;
}

export function titusBrief(task) {
  if (!task) return 'Titus: En operaciones, cierra tres ciclos y haz tres actividades. Lee el costo de cada botón antes de pulsarlo.';
  return `Titus: ${task.title}. Ve a ${placeName(task.stationId)}. ${howTo(task)}`;
}

export function titusAtStation(task) {
  if (!task) return 'Titus: Explora con calma.';
  if (task.id === 'air') return 'Titus: ¡Aquí estamos! Este sistema nos ayuda a mantener condiciones adecuadas para respirar. ' + howTo(task);
  if (task.id === 'launch') return 'Titus: Desde esta consola despega la nave. ' + howTo(task);
  return `Titus: Aquí es, en ${placeName(task.stationId)}. ${howTo(task)}`;
}
