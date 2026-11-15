import test from 'node:test';
import assert from 'node:assert/strict';
import { cabinAir, coasHint, coasReady, loadsAfterCut, signalBand, supplyProblem } from '../src/game/shipTour.js';
import { howTo, titusBrief } from '../src/game/titusGuide.js';
import { levels } from '../src/data/levelDefinitions.js';

test('the ship tour tells orientation, supplies, air, power and signal apart', () => {
  assert.equal(coasReady(45), true);
  assert.equal(coasReady(49), true);
  assert.equal(coasReady(20), false);
  assert.match(coasHint(20), /derecha/);
  assert.match(coasHint(70), /Volver|pasaste|derecha/i);
  assert.match(coasHint(45), /trayectoria/);

  assert.equal(supplyProblem(['Agua y alimentos']), 'Falta meter en la bolsa: Botiquín, Herramientas y equipo científico.');
  assert.match(supplyProblem(['Agua y alimentos', 'Botiquín', 'Herramientas y equipo científico', 'Recuerdo de la Tierra']), /no va en la bolsa/);
  assert.equal(supplyProblem(['Agua y alimentos', 'Botiquín', 'Herramientas y equipo científico']), '');

  assert.equal(cabinAir(false).oxygen < cabinAir(true).oxygen, true);
  assert.equal(cabinAir(false).pressure, cabinAir(true).pressure);
  assert.equal(cabinAir(true).ready, true);

  assert.equal(loadsAfterCut({ life: false, navigation: true, lights: true }).holds, false);
  const held = loadsAfterCut({ life: true, navigation: true, lights: false });
  assert.equal(held.holds, true);
  assert.equal(held.lights, false);
  assert.match(held.line, /luz decorativa/);

  assert.equal(signalBand(7), 'fuerte');
  assert.equal(signalBand(6), 'débil');
  assert.equal(signalBand(2), 'ruido');
});

test('Titus walks Alex through every level 2 station', () => {
  const tasks = levels[1].tasks;
  assert.deepEqual(tasks.map(task => task.id), ['navigation', 'supplies', 'atmosphere', 'energy-tour', 'signal', 'photos']);
  const places = [/COAS/, /traje A7L/, /soporte vital/, /estación de energía/, /canal ficticio 7/, /marco/];
  tasks.forEach((task, index) => {
    assert.match(titusBrief(task), /capitán Alex/);
    assert.match(titusBrief(task), places[index]);
    assert.ok(howTo(task).length > 30, task.id);
  });
  assert.match(titusBrief(tasks[0]), /La misión empezó/);
  assert.match(titusBrief(tasks[1]), /Ahora lo que sigue/);
});
