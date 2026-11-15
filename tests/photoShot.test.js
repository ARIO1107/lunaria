import test from 'node:test';
import assert from 'node:assert/strict';
import { PHOTO_ANSWER, frameStatus, gradePhoto, longestClear, photoMiss, projectBody, worldFromViewport } from '../src/game/photoShot.js';
import { levels } from '../src/data/levelDefinitions.js';

test('a good planet photo needs the Earth alone inside the frame', () => {
  assert.equal(PHOTO_ANSWER, 'encuadrada');
  assert.equal(gradePhoto(0, 2).ok, false);
  assert.match(photoMiss(gradePhoto(0, 2)), /no está entera/);
  assert.match(photoMiss({ reason: 'compañia', names: ['Luna'] }), /Luna también salió/);
  assert.match(photoMiss({ reason: 'compañia', names: ['Luna', 'Estrella'] }), /salieron/);
  assert.equal(frameStatus({ ok: true, reason: 'lista', names: ['Tierra'] }), 'Tierra en el marco.');

  const placed = worldFromViewport(0.5, 0.5, 2, 0.1);
  assert.equal(placed.x, 0);
  assert.equal(placed.y, 0);
  assert.equal(placed.radius, 0.2);
  const screen = projectBody({ x: 0.5, y: 0.5, radius: 0.1 }, 2);
  assert.equal(screen.rx, 0.05);
  assert.equal(screen.ry, 0.1);

  for (const aspect of [1.4, 2.4, 4]) {
    assert.ok(longestClear(aspect, 12) >= 2, 'aspect ' + aspect);
  }

  const photos = levels[1].tasks.find(task => task.id === 'photos');
  assert.equal(photos.answer, PHOTO_ANSWER);
  assert.equal(photos.stationId, 'coas');
  assert.equal(photos.kind, 'photo');
});
