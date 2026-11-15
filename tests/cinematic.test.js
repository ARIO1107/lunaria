import test from 'node:test';
import assert from 'node:assert/strict';
import { CINEMATIC_DURATION, cameraAt, cardAt, castAt, lineAt, lines } from '../src/cinematic/script.js';
import { applyCast, createCinematicAstronaut, createCinematicTitus } from '../src/cinematic/cast.js';

test('the opening cinematic lasts between 90 and 120 seconds and keeps moving', () => {
  assert.ok(CINEMATIC_DURATION >= 90 && CINEMATIC_DURATION <= 120);
  const start = cameraAt(0);
  const mid = cameraAt(50);
  const end = cameraAt(100);
  const distance = Math.hypot(start.position[0] - mid.position[0], start.position[1] - mid.position[1], start.position[2] - mid.position[2]);
  assert.ok(distance > 8);
  assert.notDeepEqual(mid.look, end.look);
  assert.equal(cardAt(8).title, 'Capítulo 1 — El despertar');
  assert.match(cardAt(95).detail, /soporte vital/);
});

test('dialogue stays in order and the crew moves during the story', () => {
  const starts = lines.map(line => line.start);
  assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
  assert.equal(lines.length >= 10, true);
  assert.equal(lineAt(24).speaker, 'Titus');
  assert.equal(lineAt(30).speaker, 'Alex');
  assert.ok(castAt(10).astronaut.sit > .9);
  assert.ok(castAt(70).astronaut.sit < .1);
  assert.ok(castAt(70).astronaut.z < castAt(10).astronaut.z);
  assert.equal(castAt(10).interior, false);
  assert.equal(castAt(30).interior, true);
  for (const time of [24, 36, 50, 70, 90, 100]) {
    const position = cameraAt(time).position;
    assert.ok(Math.abs(position[0]) < 1.95, `cámara fuera en x a los ${time}s (${position[0]})`);
    assert.ok(position[1] > 0.9 && position[1] < 2.15, `cámara fuera en y a los ${time}s`);
    assert.ok(position[2] > -1.8 && position[2] < 2.2, `cámara fuera en z a los ${time}s (${position[2]})`);
  }
});

test('each subtitle is on screen only during its line and the crew pose changes', () => {
  for (const line of lines) {
    assert.equal(lineAt(line.start + 0.05)?.id, line.id);
    assert.equal(lineAt(line.start + 0.05)?.text, line.text);
    assert.notEqual(lineAt(line.start + line.duration)?.id, line.id);
    const overlap = lines.filter(other => other !== line && line.start < other.start + other.duration && other.start < line.start + line.duration);
    assert.equal(overlap.length, 0, line.id);
  }
  assert.equal(lineAt(10), null);
  assert.equal(lineAt(40).text.includes('384 400'), true);
  const early = cameraAt(8).position.join(',');
  const late = cameraAt(50).position.join(',');
  assert.notEqual(early, late);

  const alex = createCinematicAstronaut();
  const titus = createCinematicTitus();
  applyCast(alex, titus, castAt(24), 24);
  const seated = alex.legL.rotation.x;
  const looking = alex.head.rotation.y;
  const home = alex.root.position.z;
  const beside = titus.root.position.x;
  applyCast(alex, titus, castAt(52), 52);
  const pointing = titus.armR.rotation.x;
  applyCast(alex, titus, castAt(74), 74);
  assert.ok(seated > 1);
  assert.ok(looking > 0.4);
  assert.equal(alex.head.rotation.y, 0);
  assert.ok(alex.legL.rotation.x < 0.2);
  assert.ok(alex.root.position.z < home - 0.5);
  assert.notEqual(titus.root.position.x.toFixed(2), beside.toFixed(2));
  assert.ok(pointing < -1);
});
