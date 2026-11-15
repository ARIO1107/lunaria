import test from 'node:test';
import assert from 'node:assert/strict';
import { createLaunch, launchAction, stepLaunch } from '../src/game/launchSimulation.js';

// These tests catch bypassed safety interlocks and unplayable balancing.
test('ignition is explicit and early separation cannot win', () => {
  const idle = createLaunch();
  assert.deepEqual(stepLaunch(idle, 5), idle);
  const flight = launchAction(idle, 'ignite');
  assert.equal(flight.status, 'flying');
  assert.equal(launchAction(flight, 'separate').status, 'flying');
  assert.equal(launchAction(flight, 'cutoff').centerOff, false);
});

test('a guided flight can clear Max Q, cut the center engine and separate', () => {
  let s = launchAction(createLaunch(), 'ignite');
  for (let i = 0; i < 600 && s.status === 'flying'; i++) {
    s = launchAction(s, 'throttle', s.time >= 60 && s.time <= 105 ? 0.6 : 1);
    if (s.time >= 135.2 && !s.centerOff) s = launchAction(s, 'cutoff');
    if (s.time >= 162.3) s = launchAction(s, 'separate');
    s = stepLaunch(s, 0.1);
  }
  assert.equal(s.status, 'success');
  assert.ok(s.heat < 100);
  assert.ok(s.cutoffTime >= 135.2);
  assert.ok(s.separationTime >= 162.3);
});

test('ignoring Max Q fails with an explanation and retry clears the flight', () => {
  let s = launchAction(createLaunch(), 'ignite');
  for (let i = 0; i < 600 && s.status === 'flying'; i++) s = stepLaunch(s, 0.1);
  assert.equal(s.status, 'failed');
  assert.ok(s.reason.length > 0);
  assert.deepEqual(launchAction(s, 'reset'), createLaunch());
});

test('leaving thrust low does not earn a successful launch', () => {
  let s = launchAction(createLaunch(), 'ignite');
  s = launchAction(s, 'throttle', 0.35);
  for (let i = 0; i < 650 && s.status === 'flying'; i++) {
    if (s.time >= 135.2) s = launchAction(s, 'cutoff');
    if (s.time >= 162.3) s = launchAction(s, 'separate');
    s = stepLaunch(s, 0.1);
  }
  assert.equal(s.status, 'failed');
});

test('completed flights cannot advance or change their telemetry', () => {
  const done = { ...createLaunch(), status: 'success', time: 163 };
  assert.deepEqual(stepLaunch(done, 1), done);
  assert.deepEqual(launchAction(done, 'throttle', 0.4), done);
});
