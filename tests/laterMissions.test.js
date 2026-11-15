import test from 'node:test';
import assert from 'node:assert/strict';
import { airlockAdvance, burnReady, burnSpeed, repairAdvance, REPAIR_ORDER, shadowState } from '../src/game/laterMissions.js';
import { campaignAtLevel, campaignReducer } from '../src/game/campaign.js';
import { levels } from '../src/data/levelDefinitions.js';

test('later station toys only accept the procedure the campaign already expects', () => {
  const skipped = repairAdvance([], REPAIR_ORDER[1]);
  assert.equal(skipped.ready, false);
  assert.deepEqual(skipped.done, []);
  let done = [];
  for (const step of REPAIR_ORDER) {
    const next = repairAdvance(done, step);
    done = next.done;
  }
  assert.deepEqual(done, REPAIR_ORDER);

  assert.equal(burnSpeed(100, false), 82);
  assert.equal(burnReady(82), false);
  let speed = 100;
  while (!burnReady(speed) && speed > 0) speed = burnSpeed(speed, false);
  assert.equal(burnReady(speed), true);
  assert.equal(burnReady(burnSpeed(20, false)), false);

  assert.equal(airlockAdvance(0, 'ambas').ready, false);
  assert.equal(airlockAdvance(0, 'presion').ready, false);
  const closed = airlockAdvance(0, 'cerrar');
  assert.equal(closed.ready, false);
  assert.equal(airlockAdvance(closed.stage, 'presion').ready, true);

  assert.equal(shadowState(false, true).holds, false);
  assert.equal(shadowState(true, false).holds, false);
  assert.equal(shadowState(true, true).holds, true);
});

test('level 3 through 5 still advance when the new toys submit the scripted answers', () => {
  let state = campaignReducer(campaignAtLevel(3), { type: 'begin' });
  const answers = {
    diagnose: 'Propulsión',
    isolate: 'Desconectar propulsión',
    replace: 'Fusible compatible',
    'repair-test': REPAIR_ORDER,
    allocation: { life: 20, navigation: 15, propulsion: 20, communication: 0, research: 5 },
    stabilize: 90,
    orbit: 'Encender para reducir la velocidad',
    site: 'B',
    module: ['Propulsión y combustible', 'Navegación y comunicaciones', 'Equipo de superficie'],
    'eva-check': ['Reserva del traje', 'Casco sellado', 'Esclusa despresurizada'],
    observe: 'Describir la textura y registrar el lugar',
    return: 'Cerrar esclusa y recuperar presión',
    habitat: ['Estructura intacta', 'Sensores y presión', 'Inventario de carga'],
    solar: 'Conectar paneles a baterías',
    life: ['Circulación de aire', 'Control de oxígeno y CO₂', 'Control térmico'],
    water: 'Consumo humano primero y recuperación controlada',
    'surface-suit': ['Aire del traje', 'Sellos comprobados', 'Ruta de regreso'],
    sample: true,
    analysis: 'Regolito',
  };
  for (const level of levels.slice(2, 5)) {
    if (state.phase === 'briefing') state = campaignReducer(state, { type: 'begin' });
    for (const task of level.tasks) {
      if (task.kind === 'landing') state = campaignReducer(state, { type: 'landing', value: { ...state.landing, status: 'success' } });
      const value = answers[task.id] ?? task.answer ?? true;
      state = campaignReducer(state, { type: 'answer', id: task.id, stationId: task.stationId, value });
      assert.ok(state.completedObjectives.includes(task.id) || state.phase === 'complete', task.id + ' ' + state.message);
    }
    if (state.phase === 'complete' && state.currentLevel < 6) state = campaignReducer(state, { type: 'advance' });
  }
  assert.equal(state.currentLevel, 6);
});
