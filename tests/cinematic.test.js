import test from 'node:test';
import assert from 'node:assert/strict';
import { CINEMATIC_DURATION, LAUNCH_DURATION, cameraAt, cardAt, castAt, launchAltitude, launchCameraLift, launchSky, lineAt, lines, launchLines } from '../src/cinematic/script.js';
import { applyCast, createCinematicAstronaut, createCinematicTitus } from '../src/cinematic/cast.js';
import { createLauncherHull } from '../src/cinematic/sets.js';

test('the opening cinematic lasts between 60 and 90 seconds and stays on the pad', () => {
  assert.ok(CINEMATIC_DURATION >= 60 && CINEMATIC_DURATION <= 90);
  const start = cameraAt(0);
  const mid = cameraAt(50);
  const end = cameraAt(75);
  const distance = Math.hypot(start.position[0] - mid.position[0], start.position[1] - mid.position[1], start.position[2] - mid.position[2]);
  assert.ok(distance > 8);
  assert.notDeepEqual(mid.look, end.look);
  assert.equal(cardAt(8).title, 'Capítulo 1 — El lanzamiento');
  assert.match(cardAt(70).detail, /despegue/);
  assert.equal(lineAt(40), null);
  assert.equal(castAt(8).interior, false);
});

test('dialogue stays in order and the crew moves during the story', () => {
  const starts = lines.map(line => line.start);
  assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
  assert.equal(lines.length, 7);
  assert.match(lineAt(24).text, /Buenos días, comandante Alex/);
  assert.equal(lineAt(30).speaker, 'Alex');
  assert.ok(castAt(10).astronaut.sit > .9);
  assert.ok(castAt(70).astronaut.sit < .1);
  assert.ok(castAt(70).astronaut.z < castAt(10).astronaut.z);
  assert.equal(castAt(10).interior, false);
  assert.equal(castAt(30).interior, true);
  for (const time of [24, 36, 50, 62, 74]) {
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
  assert.match(lineAt(44).text, /soporte vital/);
  assert.doesNotMatch(lines.map(line => line.text).join(' '), /384/);
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
  applyCast(alex, titus, castAt(44), 44);
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

test('the launch film is a separate recap that climbs before orbit', () => {
  assert.ok(LAUNCH_DURATION >= 45 && LAUNCH_DURATION <= 70);
  assert.match(launchLines[0].text, /secuencia de lanzamiento/);
  assert.match(lineAt(14, 'launch').text, /Encendido confirmado/);
  assert.equal(lineAt(25, 'launch').speaker, 'Alex');
  assert.equal(cardAt(4, 'launch').title, '9');
  assert.equal(cardAt(46, 'launch').title, 'Órbita terrestre');
  assert.equal(cardAt(55, 'launch').kicker, 'MISIÓN 01 COMPLETADA');
  assert.equal(launchAltitude(10), 0);
  assert.ok(launchAltitude(30) > launchAltitude(20));
  assert.equal(launchAltitude(50), 0);
  assert.equal(launchSky(10), 0);
  assert.equal(launchSky(50), 1);
  assert.equal(launchCameraLift(20), 0);
  assert.ok(launchCameraLift(30) > 0);
  assert.equal(castAt(4, 'launch').interior, true);
  assert.equal(castAt(20, 'launch').interior, false);
  for (const time of [2, 8, 32]) {
    const position = cameraAt(time, 'launch').position;
    assert.ok(Math.abs(position[0]) < 1.95, `cabina de despegue fuera en x a los ${time}s`);
    assert.ok(position[1] > 0.9 && position[1] < 2.15);
    assert.ok(position[2] > -1.8 && position[2] < 2.2);
  }
});

test('the launch vehicle points up, not toward a nearby moon', () => {
  const hull = createLauncherHull(8);
  assert.ok(hull.tipY > hull.baseY + 8);
  assert.ok(Math.abs(hull.baseY) < 0.05);
  assert.equal(hull.rocket.name, 'Cinematic_Hull');
});
