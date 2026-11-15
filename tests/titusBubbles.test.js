import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../src/data/levelDefinitions.js';
import { skyFacts } from '../src/data/scienceFacts.js';
import { bubbleGuide, bubbleLine, bubbleSpeech } from '../src/game/titusBubbles.js';

test('top-down bubbles alternate a route with a sourced sky fact on every level', () => {
  const air = levels[0].tasks[0];
  const guide = bubbleLine(1, air, 0);
  assert.equal(guide.kind, 'guide');
  assert.match(guide.text, /Capitán Alex/);
  assert.match(guide.text, /soporte vital/);
  assert.equal(bubbleSpeech(1, air, 0), guide.text);

  const fact = bubbleLine(1, air, 1);
  assert.equal(fact.kind, 'fact');
  assert.match(fact.text, /satélite|planeta|Luna|Sol|Tierra|Estación|Marte|Júpiter/);
  assert.match(fact.sourceUrl, /nasa\.gov/);
  assert.match(bubbleSpeech(1, air, 1), /Fuente:/);

  for (const level of levels) {
    for (const task of level.tasks) {
      const line = bubbleLine(level.id, task, 0);
      assert.equal(line.kind, 'guide', task.id);
      assert.match(line.text, /Capitán Alex/, task.id);
      const curiosity = bubbleLine(level.id, task, 1);
      assert.equal(curiosity.kind, 'fact', task.id);
      assert.match(curiosity.sourceUrl, /nasa\.gov/, task.id);
    }
  }
  assert.match(bubbleGuide(null), /ciclos|actividades/);
  assert.equal(bubbleLine(6, null, 0).kind, 'guide');
  assert.equal(bubbleLine(6, null, 1).kind, 'fact');

  for (const sky of skyFacts) {
    assert.match(sky.sourceUrl, /^https:\/\/.*nasa\.gov/);
    assert.ok(sky.text.length > 20, sky.id);
  }
  const seen = new Set();
  for (let tick = 1; tick < 50; tick += 2) seen.add(bubbleLine(3, air, tick).title);
  assert.ok(seen.size > 8);
});
