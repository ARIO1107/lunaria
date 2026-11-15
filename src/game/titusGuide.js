import { STATIONS } from './world.js';
import { SURFACE_OBJECTS } from './surfaceWorld.js';

const places = Object.fromEntries([...STATIONS, ...SURFACE_OBJECTS].map(place => [place.id, place.name]));

const steps = {
  air: 'Activa la ventilación, abre el suministro de oxígeno, enciende la eliminación de CO₂ y pulsa Probar estabilidad. Cuando se mantenga, prepara el soporte vital.',
  power: 'Elige «Principal y respaldo independientes». No dejes el soporte vital sin electricidad.',
  fuel: 'Marca combustible disponible, válvulas comprobadas y motores preparados. El indicador de juego marca el depósito al 100 %.',
  clearance: 'Elige «Solicitar autorización». No enciendas los motores sin ese permiso.',
  launch: 'Haz la cuenta regresiva, controla el empuje, corta el motor central y separa la primera etapa. Si lo consigues, la nave despega y verás la película del ascenso.',
  navigation: 'Gira la mira hasta meter la proa en el arco verde, cerca de 45°, y fija la orientación. La flecha de trayectoria no se mueve.',
  supplies: 'Mete en la bolsa el agua y los alimentos, el botiquín, y las herramientas con el equipo científico. Deja fuera el recuerdo y la muestra sin etiqueta.',
  atmosphere: 'Abre la reserva de oxígeno y registra la lectura. No te quedes solo con el indicador de presión.',
  'energy-tour': 'Conecta el respaldo al aire y a la navegación. Deja la luz decorativa sin respaldo, corta el bus principal y comprueba que lo esencial sigue encendido.',
  signal: 'Pon el canal ficticio en 7, envía y espera unos segundos. Anota el mensaje. El aviso de propulsión es independiente de la señal.',
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

const walks = {
  air: 'Perfecto, capitán Alex. La misión empezó. Lo primero que debemos hacer es dirigirnos a soporte vital para verificar los parámetros del aire.',
  power: 'Perfecto, capitán Alex. Ahora lo que sigue es ir a la estación de energía y comprobar que haya alimentación principal y de respaldo.',
  fuel: 'Perfecto, capitán Alex. Ahora lo que sigue es ir a propulsión. Revisemos el combustible y que los motores estén preparados. La nave sigue en la plataforma.',
  clearance: 'Perfecto, capitán Alex. Volvamos a propulsión. Falta pedir autorización a control antes de encender los motores.',
  launch: 'Perfecto, capitán Alex. Ya estamos en propulsión. Desde esta consola despega la nave: haz la cuenta regresiva, controla el empuje, corta el motor central y separa la primera etapa.',
  navigation: 'Perfecto, capitán Alex. La misión empezó. Lo primero es ir a la mira de alineación COAS, en el puente. Gira la nave hasta meter la proa en el arco verde, cerca de 45°. La flecha de trayectoria no se mueve: orientar no es cambiar de camino.',
  supplies: 'Perfecto, capitán Alex. Ahora lo que sigue es ir al traje A7L, en la esclusa. Abre la taquilla y mete en la bolsa el agua con alimentos, el botiquín y las herramientas. Deja el recuerdo y la muestra sin etiqueta.',
  atmosphere: 'Perfecto, capitán Alex. Volvamos al monitor de soporte vital. La presión puede verse bien aunque quede poco oxígeno. Abre la reserva y registra esa lectura.',
  'energy-tour': 'Perfecto, capitán Alex. Ahora lo que sigue es ir a la estación de energía. Da respaldo al aire y a la navegación, deja la luz decorativa fuera y corta el bus principal para comprobarlo.',
  signal: 'Perfecto, capitán Alex. Vamos al panel de propulsión. Busca el canal ficticio 7, envía y espera la respuesta. Si aparece un aviso de mantenimiento, es aparte: la señal no lo explica.',
  diagnose: 'Perfecto, capitán Alex. La misión empezó. Lo primero es ir a la estación de energía: el fallo está en propulsión, con el circuito abierto y el fusible quemado.',
  isolate: 'Perfecto, capitán Alex. Seguimos en la estación de energía. Desconecta propulsión antes de tocar la pieza.',
  replace: 'Perfecto, capitán Alex. Ahora lo que sigue es ir al traje, donde está el repuesto. Instala el fusible compatible.',
  'repair-test': 'Perfecto, capitán Alex. Regresa a la estación de energía. Cierra la cubierta, comprueba la continuidad y reconecta el circuito.',
  allocation: 'Perfecto, capitán Alex. En la misma estación de energía reparte como máximo 60. Aire al menos 20, navegación 15 y propulsión 20.',
  stabilize: 'Perfecto, capitán Alex. Ahora lo que sigue es ir a la mira de alineación COAS y dejar la orientación en 90°.',
  orbit: 'Perfecto, capitán Alex. Vamos al panel de propulsión. Enciende para reducir la velocidad y así entramos en órbita lunar.',
  site: 'Perfecto, capitán Alex. La misión empezó. Lo primero es ir al control de descenso lunar y elegir una zona de aterrizaje.',
  module: 'Perfecto, capitán Alex. Seguimos en el control de descenso. Marca propulsión, comunicaciones y el equipo de superficie.',
  landing: 'Perfecto, capitán Alex. Desde el control de descenso baja despacio. Llega con poca velocidad y sobre la zona marcada.',
  'eva-check': 'Perfecto, capitán Alex. Ahora lo que sigue es ir al módulo de descenso. Revisa el traje y despresuriza la esclusa antes de salir.',
  observe: 'Perfecto, capitán Alex. Camina hasta la muestra de regolito. Describe la textura y registra el lugar. El color no dice la composición.',
  return: 'Perfecto, capitán Alex. Regresa al módulo de descenso. Cierra la esclusa y recupera la presión. No abras las dos puertas a la vez.',
  habitat: 'Perfecto, capitán Alex. La misión empezó. Lo primero es ir al hábitat prefabricado y revisar la estructura, los sensores y la carga.',
  solar: 'Perfecto, capitán Alex. Ahora lo que sigue es ir a los paneles solares y conectarlos a las baterías para la sombra.',
  life: 'Perfecto, capitán Alex. Vamos al soporte vital de la base. Activa el aire, el oxígeno y la temperatura. Gasta 10 de energía.',
  water: 'Perfecto, capitán Alex. Ahora lo que sigue es ir al almacén de suministros. Prioriza el agua de la tripulación y una recuperación controlada.',
  'surface-suit': 'Perfecto, capitán Alex. Volvamos al módulo de descenso. Comprueba el aire del traje, los sellos y la ruta de regreso.',
  sample: 'Perfecto, capitán Alex. Camina hasta la muestra de regolito y recógela. Queda etiquetada en este sitio ficticio.',
  analysis: 'Perfecto, capitán Alex. Ahora lo que sigue es ir al laboratorio de análisis y clasificar la muestra como regolito.',
};

export function titusBrief(task) {
  if (!task) return 'Titus: Perfecto, capitán Alex. En operaciones, cierra tres ciclos y haz tres actividades. Lee el costo de cada botón antes de pulsarlo.';
  const line = walks[task.id] || `Perfecto, capitán Alex. Ahora lo que sigue es ir a ${placeName(task.stationId)}. ${howTo(task)}`;
  return `Titus: ${line}`;
}

export function titusAtStation(task) {
  if (!task) return 'Titus: Explora con calma, capitán Alex.';
  if (task.id === 'air') return 'Titus: Perfecto, capitán Alex. ¡Aquí estamos! Este sistema nos ayuda a mantener condiciones adecuadas para respirar. ' + howTo(task);
  if (task.id === 'launch') return 'Titus: Perfecto, capitán Alex. Desde esta consola despega la nave. ' + howTo(task);
  return `Titus: Perfecto, capitán Alex. Ya llegamos a ${placeName(task.stationId)}. ${howTo(task)}`;
}
