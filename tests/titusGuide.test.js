import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../src/data/levelDefinitions.js';
import { howTo, titusAtStation, titusBrief } from '../src/game/titusGuide.js';

test('Titus tells every mission where to go and how to do it', () => {
  for (const level of levels) {
    for (const task of level.tasks) {
      const brief = titusBrief(task);
      assert.match(brief, /^Titus: /, task.id);
      assert.match(brief, /capitán Alex/, task.id);
      assert.ok(howTo(task).length > 20, task.id);
      assert.match(titusAtStation(task), /^Titus: /);
    }
  }
  const launch = levels[0].tasks.find(task => task.id === 'launch');
  assert.match(titusBrief(launch), /despega/i);
  assert.match(titusAtStation(launch), /despega la nave/);
  assert.match(titusAtStation(levels[0].tasks[0]), /condiciones adecuadas para respirar/);
  assert.match(titusBrief(levels[0].tasks[0]), /soporte vital para verificar los parámetros/);
  assert.match(titusBrief(levels[0].tasks[1]), /estación de energía/);
});
