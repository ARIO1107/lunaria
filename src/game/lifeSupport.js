/** Level-1 life-support console. Numbers are game indicators, not a real cabin. */

export function createLifeSupport() {
  return { fan: false, valve: false, scrubber: false, stable: false };
}

export function lifeReadout(state) {
  const flow = state.fan ? (state.valve ? 100 : 20) : 0;
  const supply = state.valve ? 100 : 0;
  const co2 = state.scrubber && state.fan ? 12 : 42;
  return {
    flow,
    supply,
    co2,
    circulating: state.fan && state.valve && state.scrubber,
  };
}

export function lifeProblem(state) {
  if (!state.fan) {
    return {
      id: 'fan',
      line: 'No pasa nada, comandante. Revisemos qué componente está impidiendo que el sistema funcione. La ventilación está apagada, así que el aire no circula.',
    };
  }
  if (!state.valve) {
    return {
      id: 'valve',
      line: 'No pasa nada, comandante. El ventilador gira, pero el suministro de oxígeno sigue cerrado.',
    };
  }
  if (!state.scrubber) {
    return {
      id: 'scrubber',
      line: 'No pasa nada, comandante. El aire se mueve, pero la eliminación de CO₂ todavía no está activa.',
    };
  }
  return null;
}

export const LIFE_READY = 'estable';
