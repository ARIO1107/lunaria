export const COAS_TARGET = 45;

export function coasReady(angle) {
  return Number.isFinite(angle) && Math.abs(angle - COAS_TARGET) <= 5;
}

export function coasHint(angle) {
  if (!Number.isFinite(angle)) return 'Gira la mira hasta acercarte al arco verde.';
  const gap = angle - COAS_TARGET;
  if (Math.abs(gap) <= 5) return 'Ahí está. La proa coincide con la referencia. Fija la orientación. La flecha de trayectoria no se ha movido: apuntar no cambia el camino.';
  if (gap < 0) return 'Todavía falta girar hacia la derecha. El arco verde está cerca de 45°.';
  return 'Te pasaste hacia la derecha. Vuelve un poco hacia el arco verde.';
}

export const SUPPLIES = [
  { id: 'water', label: 'Agua y alimentos', needed: true, note: 'Agua 60 · alimentos 40' },
  { id: 'med', label: 'Botiquín', needed: true, note: 'Botiquín 1' },
  { id: 'tools', label: 'Herramientas y equipo científico', needed: true, note: 'Herramientas 3 · equipo científico 2' },
  { id: 'souvenir', label: 'Recuerdo de la Tierra', needed: false, note: 'No es un suministro de emergencia' },
  { id: 'unknown', label: 'Muestra sin etiqueta', needed: false, note: 'No entra en la bolsa' },
];

export function supplyProblem(packed) {
  const needed = SUPPLIES.filter(item => item.needed).map(item => item.label);
  const extra = packed.filter(label => !needed.includes(label));
  const missing = needed.filter(label => !packed.includes(label));
  if (extra.length) return 'Eso no va en la bolsa de emergencia. Sácalo y quédate con agua, botiquín y herramientas.';
  if (missing.length) return 'Falta meter en la bolsa: ' + missing.join(', ') + '.';
  return '';
}

export function cabinAir(reserveOpen) {
  return {
    pressure: 101,
    oxygen: reserveOpen ? 74 : 18,
    ready: reserveOpen,
    line: reserveOpen
      ? 'La reserva de oxígeno sube en el indicador de juego. La presión sigue igual: no decía cuánto oxígeno quedaba.'
      : 'La presión se ve estable, pero la reserva de oxígeno está baja. Abre la reserva, no te quedes solo con la presión.',
  };
}

export function loadsAfterCut(backup) {
  const life = Boolean(backup.life);
  const navigation = Boolean(backup.navigation);
  const lights = Boolean(backup.lights);
  const holds = life && navigation;
  let line = 'El aire o la navegación se apagaron. Conecta su respaldo y corta el principal otra vez.';
  if (holds && lights) line = 'El aire y la navegación siguen. La luz también, aunque no necesitaba respaldo. Puedes registrar los sistemas esenciales.';
  else if (holds) line = 'El aire y la navegación siguen encendidos. La luz decorativa se apagó: no necesita respaldo. Registra los sistemas esenciales.';
  return { life, navigation, lights, holds, line };
}

export function signalBand(channel) {
  return channel === 7 ? 'fuerte' : Math.abs(channel - 7) === 1 ? 'débil' : 'ruido';
}
