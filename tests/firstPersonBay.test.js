import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCinematicTitus } from '../src/cinematic/cast.js';
import { CABIN_CAMERA, TITUS_YAW, paintCabinTitus } from '../src/view/firstPersonBay.js';

test('the cabin camera looks down the deck and Titus faces it', () => {
  const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.08, 40);
  camera.position.set(...CABIN_CAMERA.position);
  camera.lookAt(...CABIN_CAMERA.lookAt);
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  assert.ok(forward.z < -0.9, 'the view must look toward the console, along -Z');
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
  assert.ok(right.x > 0.9, 'screen-right stays world +X so the gloves sit on the correct hands');

  const titus = createCinematicTitus();
  titus.root.rotation.y = TITUS_YAW;
  titus.root.updateWorldMatrix(true, true);
  const eye = new THREE.Vector3();
  const body = new THREE.Vector3();
  titus.eyes[0].getWorldPosition(eye);
  titus.body.getWorldPosition(body);
  const face = eye.sub(body);
  assert.ok(face.z > 0.05, 'eyes on local -Z must point toward the camera on +Z');
});

test('cabin Titus is gray instead of the dark cinematic shell', () => {
  const titus = createCinematicTitus();
  paintCabinTitus(titus);
  const colors = new Set();
  titus.root.traverse(object => {
    if (object.isMesh && object.material?.color) colors.add(object.material.color.getHexString());
  });
  assert.ok(colors.has('9aa3a8'));
  assert.equal(colors.has('475456'), false);
  assert.equal(colors.has('07141a'), false);
  assert.ok(colors.has('d8faff'));
});
