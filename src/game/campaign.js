import { levelById, nextObjective } from '../data/levelDefinitions.js';
import { newBase, applyOperation, advanceCycle } from './resourceEngine.js';
import { createLaunch } from './launchSimulation.js';
import { createLanding } from './landingSimulation.js';

export const campaignKey = 'lunaria.campaign.v1';
export function createCampaign() {
  return {
    version: 1, currentLevel: 1, phase: 'cinematic', completedLevels: [], completedObjectives: [],
    resources: { ship: { fuel: 100, energy: 100, oxygen: 100 }, lander: { fuel: 100 }, base: newBase('A') },
    collectedSamples: [], discoveredFacts: [], flags: {}, site: 'A', position: { x: 480, y: 300 },
    surfacePosition: { x: 180, y: 330 }, zoom: 1.15, flight: createLaunch(), landing: createLanding(),
    cycle: 1, usedActions: [], activities: 0, decisions: [], radiation: false, sheltered: false,
    message: '', difficulty: 'junior',
  };
}
function cloneCheckpoint(state) {
  const copy = JSON.parse(JSON.stringify(state));
  delete copy.checkpoint;
  copy.phase = 'active';
  return copy;
}
export function campaignAtLevel(level, demo = false) {
  const id = Math.min(6, Math.max(1, level | 0));
  const state = createCampaign();
  state.currentLevel = id;
  state.phase = id === 1 ? 'cinematic' : 'briefing';
  state.completedLevels = Array.from({ length: id - 1 }, (_, index) => index + 1);
  state.flags = { demo: Boolean(demo), boarded: id > 1 };
  if (id === 6) {
    state.resources = { ...state.resources, base: { ...newBase('A'), energy: 80, oxygen: 80, water: 70, wasteWater: 20, habitatOperational: true } };
  }
  state.checkpoint = cloneCheckpoint(state);
  return state;
}
function finishOperations(state) {
  if (state.currentLevel === 6 && state.phase === 'active' && state.cycle >= 4 && state.activities >= 3) {
    return { ...state, phase: 'complete', completedLevels: [...new Set([...state.completedLevels, 6])],
      message: 'Tres ciclos de operaciones completados. La estación sigue en pie.' };
  }
  return state;
}
export function readCampaign() {
  try { return validateCampaign(JSON.parse(localStorage.getItem(campaignKey))); } catch { return null; }
}
export function validateCampaign(data) {
  if (!data || data.version !== 1 || !Number.isInteger(data.currentLevel) || data.currentLevel < 1 || data.currentLevel > 6) return null;
  const base = createCampaign();
  const phases = ['cinematic', 'briefing', 'active', 'complete', 'failed'];
  if (!phases.includes(data.phase) || !Array.isArray(data.completedLevels) || !Array.isArray(data.completedObjectives)) return null;
  if (data.currentLevel > 1 && !Array.from({ length: data.currentLevel - 1 }, (_, i) => i + 1).every(id => data.completedLevels.includes(id))) return null;
  for (const group of ['ship', 'lander', 'base']) {
    if (!data.resources?.[group]) return null;
    for (const [key, value] of Object.entries(base.resources[group])) {
      if (typeof value === 'number' && (!Number.isFinite(data.resources[group][key]) || data.resources[group][key] < 0 || data.resources[group][key] > (key === 'science' ? 100000 : 100))) return null;
    }
  }
  const tasks = levelById(data.currentLevel).tasks;
  const done = tasks.filter(task => data.completedObjectives.includes(task.id)).map(task => task.id);
  if (done.some((id, index) => id !== tasks[index].id)) return null;
  const safePosition = value => value && Number.isFinite(value.x) && Number.isFinite(value.y);
  return { ...base, ...data, completedObjectives: done,
    completedLevels: [...new Set(data.completedLevels.filter(id => Number.isInteger(id) && id >= 1 && id <= 6))],
    collectedSamples: Array.isArray(data.collectedSamples) ? data.collectedSamples.filter(s => ['regolith','basalt','highland'].includes(s.id) && typeof s.analyzed === 'boolean') : [],
    discoveredFacts: Array.isArray(data.discoveredFacts) ? data.discoveredFacts.filter(id => typeof id === 'string') : [],
    flags: data.flags && typeof data.flags === 'object' ? data.flags : {},
    decisions: Array.isArray(data.decisions) ? data.decisions.filter(s => typeof s === 'string').slice(-40) : [],
    usedActions: Array.isArray(data.usedActions) ? data.usedActions.filter(s => typeof s === 'string') : [],
    activities: Number.isFinite(data.activities) ? Math.max(0, data.activities) : 0,
    cycle: Number.isInteger(data.cycle) && data.cycle >= 1 ? data.cycle : 1,
    position: safePosition(data.position) ? data.position : base.position,
    surfacePosition: safePosition(data.surfacePosition) ? data.surfacePosition : base.surfacePosition,
    site: ['A','B','C'].includes(data.site) ? data.site : 'A',
    zoom: Number.isFinite(data.zoom) && data.zoom >= .8 && data.zoom <= 1.75 ? data.zoom : 1.15,
    flight: data.flight && ['ready','flying','success','failed'].includes(data.flight.status) && Object.values(data.flight).every(v => typeof v !== 'number' || Number.isFinite(v)) ? data.flight : createLaunch(),
    landing: data.landing && ['ready','flying','success','failed'].includes(data.landing.status) && ['altitude','vy','x','vx','fuel','throttle','steer'].every(k => Number.isFinite(data.landing[k])) ? data.landing : createLanding(),
  };
}
export function saveCampaign(state) {
  try { localStorage.setItem(campaignKey, JSON.stringify(state)); return true; } catch { return false; }
}
function correct(task, value) {
  if (task.kind === 'checks') return Array.isArray(value) && task.answer.every(item => value.includes(item));
  if (task.kind === 'alignment') return Number.isFinite(value) && Math.abs(value - task.answer) <= 5;
  if (task.kind === 'allocation') return value && Object.values(value).every(v => Number.isFinite(v) && v >= 0) &&
    Object.values(value).reduce((a, b) => a + b, 0) <= 60 && value.life >= 20 && value.navigation >= 15 && value.propulsion >= 20;
  if (task.kind === 'site') return ['A', 'B', 'C'].includes(value);
  if (task.kind === 'collect') return true;
  return value === task.answer;
}
export function campaignReducer(state, action) {
  if (action.type === 'restore') return action.state;
  if (!state) return state;
  if (action.type === 'cinematicDone' && state.phase === 'cinematic') {
    const next = { ...state, phase: 'active', flags: { ...state.flags, boarded: true },
      message: 'Titus: Buenos días, comandante. Empieza por el monitor de soporte vital y comprueba el aire.' };
    return { ...next, checkpoint: cloneCheckpoint(next) };
  }
  if (action.type === 'begin' && state.phase === 'briefing') {
    const next = { ...state, phase: 'active', message: '' };
    return { ...next, checkpoint: cloneCheckpoint(next) };
  }
  if (action.type === 'continueOps' && state.phase === 'complete' && state.currentLevel === 6) {
    return { ...state, phase: 'active', message: 'Puedes seguir investigando. Cada ciclo nuevo sigue consumiendo recursos.' };
  }
  if (action.type === 'discover') return state.discoveredFacts.includes(action.id) ? state : { ...state, discoveredFacts: [...state.discoveredFacts, action.id] };
  if (action.type === 'position') return { ...state, position: action.position, surfacePosition: action.surfacePosition, zoom: action.zoom };
  if (action.type === 'flight') return { ...state, flight: typeof action.value === 'function' ? action.value(state.flight) : action.value };
  if (action.type === 'landing') return { ...state, landing: typeof action.value === 'function' ? action.value(state.landing) : action.value };
  if (action.type === 'retry') {
    const next = state.checkpoint ?? createCampaign();
    return { ...next, phase: 'active', checkpoint: state.checkpoint, message: 'Punto de control recuperado. Los suministros vuelven al estado guardado al comenzar este nivel.' };
  }
  if (action.type === 'checkpoint') return { ...state, checkpoint: { ...state, checkpoint: undefined } };
  if (action.type === 'advance' && state.phase === 'complete' && state.currentLevel < 6) {
    const level = state.currentLevel + 1;
    const next = { ...state, currentLevel: level, phase: 'briefing', completedObjectives: [],
      completedLevels: [...new Set([...state.completedLevels, state.currentLevel])], message: '', checkpoint: undefined };
    return { ...next, checkpoint: cloneCheckpoint(next) };
  }
  if (state.phase !== 'active') return state;
  if (action.type === 'operation' && state.currentLevel === 6) {
    const result = action.name === 'cycle' ? advanceCycle(state) : applyOperation(state, action.name);
    return finishOperations({ ...result.state, message: result.error || 'Operación registrada.' });
  }
  if (action.type === 'collect' && state.currentLevel === 6) {
    if (state.radiation && !state.sheltered) return { ...state, message: 'Suspende la salida durante el ejercicio solar. Prepara el refugio y termina el ciclo.' };
    if (state.collectedSamples.some(sample => sample.id === action.id)) return { ...state, message: 'Esta muestra ya está en el inventario.' };
    if (!['regolith','basalt','highland'].includes(action.id) || state.resources.base.oxygen < 10) return { ...state, message: 'Necesitas al menos 10 unidades de oxígeno para salir.' };
    return { ...state, resources: { ...state.resources, base: { ...state.resources.base, oxygen: state.resources.base.oxygen - 5 } },
      collectedSamples: [...state.collectedSamples, { id: action.id, analyzed: false, location: 'Sector ' + action.id }], message: 'Muestra etiquetada. Regresa al laboratorio para analizarla.' };
  }
  if (action.type === 'analyze' && state.currentLevel === 6) {
    const sample = state.collectedSamples.find(s => s.id === action.id && !s.analyzed);
    if (!sample || state.resources.base.energy < 8 || state.radiation) return { ...state, message: 'Necesitas una muestra pendiente, 8 unidades de energía y condiciones seguras.' };
    return { ...state, activities: state.activities + 1,
      collectedSamples: state.collectedSamples.map(s => s.id === action.id ? { ...s, analyzed: true } : s),
      resources: { ...state.resources, base: { ...state.resources.base, energy: state.resources.base.energy - 8, science: state.resources.base.science + 1 } },
      message: 'Análisis registrado. Consulta la bitácora científica.' };
  }
  if (action.type !== 'answer') return state;
  const task = nextObjective(state);
  if (!task || action.id !== task.id || action.stationId !== task.stationId) return { ...state, message: 'Completa primero el objetivo activo en su estación.' };
  const valid = task.kind === 'launch' ? state.flight.status === 'success' :
    task.kind === 'landing' ? state.landing.status === 'success' : correct(task, action.value);
  if (!valid) return { ...state, message: 'Titus: revisa las pistas del panel. Esa decisión no cumple los requisitos. Puedes volver a intentarlo.', flags: { ...state.flags, lastError: task.id } };
  let next = { ...state, completedObjectives: [...state.completedObjectives, task.id], message: 'Objetivo completado: ' + task.title, flags: { ...state.flags, lastError: null } };
  if (task.id === 'site') next = { ...next, site: action.value, landing: createLanding(action.value), resources: { ...next.resources, base: newBase(action.value) } };
  if (task.id === 'allocation') next = { ...next, resources: { ...next.resources, ship: { ...next.resources.ship, energy: 60 - Object.values(action.value).reduce((a,b) => a+b,0) } }, flags: { ...next.flags, allocation: action.value } };
  if (task.id === 'orbit') next = { ...next, resources: { ...next.resources, ship: { ...next.resources.ship, fuel: Math.max(0, next.resources.ship.fuel - 15) } } };
  if (task.id === 'landing') next = { ...next, resources: { ...next.resources, lander: { fuel: next.landing.fuel } } };
  if (task.id === 'habitat') next = { ...next, resources: { ...next.resources, base: { ...next.resources.base, habitatOperational: true } } };
  if (task.id === 'life') next = { ...next, resources: { ...next.resources, base: { ...next.resources.base, energy: Math.max(0, next.resources.base.energy - 10) } } };
  if (task.id === 'water') next = { ...next, resources: { ...next.resources, base: { ...next.resources.base, energy: Math.max(0, next.resources.base.energy - 6), water: Math.min(100, next.resources.base.water + 10), wasteWater: Math.max(0, next.resources.base.wasteWater - 10) } } };
  if (task.id === 'sample') next = { ...next, collectedSamples: [{ id: 'regolith', analyzed: false, location: 'Zona de regolito' }] };
  if (task.id === 'analysis') next = { ...next, collectedSamples: next.collectedSamples.map(s => ({ ...s, analyzed: true })), resources: { ...next.resources, base: { ...next.resources.base, energy: next.resources.base.energy - 8, science: 1 } } };
  if (!nextObjective(next)) next = { ...next, phase: 'complete', completedLevels: [...new Set([...next.completedLevels, state.currentLevel])] };
  return next;
}

