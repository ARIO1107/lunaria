import test from 'node:test';
import assert from 'node:assert/strict';
import { moveActor, canOccupy } from '../src/game/world.js';

test('astronaut cannot leave the hull or walk through a console', () => {
  assert.equal(canOccupy(10, 10), false);
  assert.equal(canOccupy(730, 150), false);
  const actor = { x: 120, y: 300 };
  for (let i = 0; i < 100; i++) Object.assign(actor, moveActor(actor, -1, 0, 0.016));
  assert.ok(actor.x >= 86);
});

test('connecting corridor lets the astronaut traverse all three rooms', () => {
  let p = { x: 150, y: 300 };
  for (let i = 0; i < 240; i++) p = moveActor(p, 1, 0, 0.016);
  assert.ok(p.x > 700);
  assert.equal(canOccupy(p.x, p.y), true);
});

test('diagonal movement has the same speed as axial movement', () => {
  const p = { x: 440, y: 300 };
  const axial = moveActor(p, 1, 0, 0.1);
  const diagonal = moveActor(p, 1, 1, 0.1);
  assert.ok(Math.abs(Math.hypot(diagonal.x - p.x, diagonal.y - p.y) - (axial.x - p.x)) < 0.001);
});
