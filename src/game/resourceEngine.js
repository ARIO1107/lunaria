export const operationsActions = {
  save: { title: 'Ahorrar energía', cost: {}, gain: { energy: 4 }, text: 'Reducimos cargas no esenciales. Una vez por ciclo.' },
  recharge: { title: 'Recargar baterías', cost: {}, gain: { energy: 20 }, text: 'Solo con iluminación. La batería tiene capacidad limitada.' },
  oxygen: { title: 'Mantener oxígeno', cost: { energy: 8, water: 4 }, gain: { oxygen: 18 }, text: 'El equipo usa agua y electricidad para recuperar capacidad de aire.' },
  water: { title: 'Recuperar agua', cost: { energy: 6, wasteWater: 10 }, gain: { water: 10 }, text: 'Procesa agua usada. No crea agua de la nada.' },
  repair: { title: 'Reparar protección', cost: { energy: 5, spares: 1 }, gain: { shielding: 15 }, activity: true, text: 'Una pieza de repuesto restaura la protección del refugio.' },
  research: { title: 'Investigar señal', cost: { energy: 8 }, gain: { science: 1 }, activity: true, text: 'Compara la señal ficticia con una baliza de navegación robótica. Cada ciclo añade una observación.' },
  shelter: { title: 'Preparar refugio', cost: { energy: 3 }, gain: {}, text: 'Suspende las salidas y verifica la protección para el ejercicio solar ficticio.' },
};
export const newBase = site => ({
  energy: site === 'B' ? 85 : site === 'C' ? 55 : 65, oxygen: 75, water: 65, wasteWater: 15,
  shielding: 50, science: 0, spares: 4, habitatOperational: false,
});
export function applyOperation(state, name) {
  const action = operationsActions[name];
  if (!action) return { state, error: 'Acción desconocida.' };
  if (state.usedActions.includes(name)) return { state, error: 'Ya realizaste esta acción durante el ciclo.' };
  const base = state.resources.base;
  if (name === 'recharge' && state.cycle % 2 === 0) return { state, error: 'Ahora hay sombra. Los paneles no generan electricidad.' };
  if (name === 'research' && (base.energy < 20 || base.oxygen < 20 || state.radiation && !state.sheltered))
    return { state, error: 'Primero estabiliza los recursos y prepara el refugio.' };
  for (const [key, cost] of Object.entries(action.cost)) {
    if (base[key] < cost) return { state, error: 'Faltan recursos para esta acción. Consulta los costos.' };
  }
  const next = { ...base };
  for (const [key, cost] of Object.entries(action.cost)) next[key] -= cost;
  for (const [key, gain] of Object.entries(action.gain)) next[key] = key === 'science' ? next[key] + gain : Math.min(100, next[key] + gain);
  return { state: { ...state, resources: { ...state.resources, base: next },
    sheltered: name === 'shelter' || state.sheltered,
    activities: state.activities + (action.activity ? 1 : 0),
    usedActions: [...state.usedActions, name], decisions: [...state.decisions, action.title].slice(-40),
  }, error: '' };
}
export function advanceCycle(state) {
  const b = state.resources.base;
  if (state.radiation && !state.sheltered) return { state, error: 'El ejercicio de riesgo solar está activo. Prepara el refugio antes de cerrar el ciclo.' };
  const next = { ...b, energy: Math.max(0, b.energy - 10), oxygen: Math.max(0, b.oxygen - 8),
    water: Math.max(0, b.water - 6), wasteWater: Math.min(100, b.wasteWater + 4) };
  const failed = next.energy === 0 || next.oxygen === 0 || next.water === 0;
  return { state: { ...state, resources: { ...state.resources, base: next }, cycle: state.cycle + 1,
    usedActions: [], radiation: state.cycle + 1 === 2, sheltered: false,
    phase: failed ? 'failed' : state.phase,
  }, error: failed ? 'Un recurso esencial llegó a cero. Reintenta las operaciones desde la estación recién activada.' : '' };
}

