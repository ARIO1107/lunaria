export const REPAIR_ORDER = ['Cubierta cerrada', 'Continuidad comprobada', 'Circuito reconectado'];

export function repairAdvance(done, step) {
  if (step !== REPAIR_ORDER[done.length]) return { done, ready: false, line: 'Ese paso no toca ahora. Sigue el orden de la lista.' };
  const next = [...done, step];
  const ready = next.length === REPAIR_ORDER.length;
  return { done: next, ready, line: ready ? 'Circuito listo para registrar.' : 'Bien. Sigue con el siguiente paso.' };
}

export function burnSpeed(speed, faster) {
  const next = speed + (faster ? 16 : -18);
  return Math.max(0, Math.min(140, next));
}

export function burnReady(speed) {
  return speed <= 46 && speed >= 20;
}

export function airlockAdvance(stage, action) {
  if (action === 'ambas') return { stage, ready: false, line: 'No abras las dos puertas a la vez.' };
  if (action === 'cerrar' && stage === 0) return { stage: 1, ready: false, line: 'Esclusa cerrada. Ahora recupera la presión.' };
  if (action === 'presion' && stage === 1) return { stage: 2, ready: true, line: 'Presión recuperada. Puedes anotar el regreso.' };
  return { stage, ready: false, line: 'Primero cierra la esclusa y después recupera la presión.' };
}

export function shadowState(linked, eclipse) {
  const panels = !eclipse;
  const batteries = linked;
  const holds = linked && eclipse;
  const line = !linked
    ? 'Sin baterías, la sombra apaga el puesto. Conecta los paneles a las baterías.'
    : eclipse
      ? 'Hay sombra y las baterías sostienen el puesto. Registra la conexión.'
      : 'Hay luz. Simula la sombra para comprobar las baterías.';
  return { panels, batteries, holds, line };
}
