import test from 'node:test';
import assert from 'node:assert/strict';
import { createMissionRegistry } from '../src/game/missionRegistry.js';

test('the exploration deck starts with no mission assigned to any console', () => {
  const registry = createMissionRegistry();
  assert.equal(registry.getForStation('propulsion'), null);
  assert.deepEqual(registry.list(), []);
});

test('future missions resolve by station without changing the scene', () => {
  const registry = createMissionRegistry();
  const module = { id: 'power-training', stationId: 'breakers', title: 'Energía', Component: () => null };
  registry.register(module);
  assert.equal(registry.getForStation('breakers'), module);
  assert.equal(registry.getForStation('propulsion'), null);
});

test('unknown stations and duplicate assignments fail explicitly', () => {
  const registry = createMissionRegistry();
  assert.throws(() => registry.register({ id: 'bad', stationId: 'missing', title: 'No existe', Component: () => null }));
  registry.register({ id: 'power', stationId: 'breakers', title: 'Energía', Component: () => null });
  assert.throws(() => registry.register({ id: 'another', stationId: 'breakers', title: 'Otro', Component: () => null }));
});
