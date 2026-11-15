import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../src/data/levelDefinitions.js';
import { skyFacts } from '../src/data/scienceFacts.js';
import { bubbleGuide, bubbleLine, bubbleSpeech } from '../src/game/titusBubbles.js';

test('top-down bubbles keep the route and show a sourced fact only now and then', () => {
  const air = levels[0].tasks[0];
  const guide = bubbleLine(1, air, 0);
  assert.equal(guide.kind, 'guide');
  assert.match(guide.text, /Capitán Alex/);
  assert.match(guide.text, /soporte vital/);
  assert.equal(bubbleSpeech(1, air, 0), guide.text);
  assert.equal(bubbleLine(1, air, 1).kind, 'guide');
  assert.equal(bubbleLine(1, air, 4).kind, 'guide');

  const fact = bubbleLine(1, air, 5);
  assert.equal(fact.kind, 'fact');
  assert.match(fact.text, /satélite|planeta|Luna|Sol|Tierra|Estación|Marte|Júpiter/);
  assert.match(fact.sourceUrl, /nasa\.gov/);
  assert.match(bubbleSpeech(1, air, 5), /Fuente:/);
  assert.equal(bubbleLine(1, air, 6).kind, 'guide');

  const done = bubbleLine(1, air, 1, 'done');
  assert.equal(done.kind, 'fact');
  assert.match(bubbleSpeech(1, air, 1, 'done'), /Fuente:/);
  assert.notEqual(bubbleLine(1, air, 1, 'done').title, bubbleLine(1, air, 2, 'done').title);

  let guides = 0;
  let facts = 0;
  for (let tick = 0; tick < 30; tick += 1) {
    if (bubbleLine(1, air, tick).kind === 'guide') guides += 1;
    else facts += 1;
  }
  assert.ok(guides > facts * 3, `${guides} guides, ${facts} facts`);

  for (const level of levels) {
    for (const task of level.tasks) {
      const line = bubbleLine(level.id, task, 0);
      assert.equal(line.kind, 'guide', task.id);
      assert.match(line.text, /Capitán Alex/, task.id);
    }
  }
  assert.match(bubbleGuide(null), /ciclos|actividades/);
  assert.equal(bubbleLine(6, null, 0).kind, 'guide');
  assert.equal(bubbleLine(6, null, 1).kind, 'guide');
  assert.equal(bubbleLine(6, null, 5).kind, 'fact');

  for (const sky of skyFacts) {
    assert.match(sky.sourceUrl, /^https:\/\/.*nasa\.gov/);
    assert.ok(sky.text.length > 20, sky.id);
  }
  const seen = new Set();
  for (let tick = 5; tick < 80; tick += 6) seen.add(bubbleLine(3, air, tick).title);
  assert.ok(seen.size > 8);
});
