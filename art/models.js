import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { materials } from './palette.js';

export function rounded(parent, size, position, material, radius = 2) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, 3, Math.min(radius, ...size.map(v => v / 2 - .01))), material);
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function ellipsoid(parent, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), material);
  mesh.scale.set(...size); mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function cylinder(parent, radius, height, position, material) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 24), material);
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

/** Facing +Z. All parts use the same scene units as the navigation map. */
export function createAstronaut() {
  const root = new THREE.Group(); root.name = 'Lunaria_Astronaut';
  const m = materials();
  const torso = new THREE.Group(); root.add(torso);
  rounded(torso, [24, 27, 17], [0, 35, 0], m.suit, 7);
  rounded(torso, [25, 4, 18], [0, 24, 0], m.graphite, 1.5);
  rounded(torso, [5, 5, 2], [0, 24, 10], m.trim, .6);
  rounded(torso, [24, 32, 12], [0, 37, -13], m.suit, 4);
  rounded(torso, [18, 21, 2], [0, 38, -20], m.trim, 2);
  for (let i = 0; i < 4; i++) rounded(torso, [12, 1, 1], [0, 32 + i * 4, -21.2], m.graphite, .3);
  const collar = cylinder(torso, 13, 4, [0, 49, 0], m.trim);
  collar.scale.z = .85;
  ellipsoid(torso, [17, 18, 16], [0, 64, 0], m.suit);
  ellipsoid(torso, [15, 14.6, 6], [0, 64, 12], m.graphite);
  ellipsoid(torso, [13.7, 13.2, 5.9], [0, 64.5, 13.2], m.visor);
  // The environment supplies visor reflections; no painted/floating highlights.
  for (const side of [-1, 1]) {
    const disk = cylinder(torso, 4.7, 2, [side * 16.5, 62, 0], m.trim); disk.rotation.z = Math.PI / 2;
  }
  rounded(torso, [16, 13, 4], [0, 36, 10], m.suit, 2);
  rounded(torso, [7, 7, 1.5], [-3, 36, 12.5], m.graphite, 1);
  ellipsoid(torso, [2, 2, .8], [5, 39, 13], m.trim);
  ellipsoid(torso, [2, 2, .8], [5, 33, 13], m.orange);
  const legs = [], arms = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(side * 7, 23, 0); root.add(leg); legs.push(leg);
    rounded(leg, [10, 18, 11], [0, -8, 0], m.suit, 3);
    rounded(leg, [10.5, 3.8, 11.5], [0, -10, 0], m.orange, 1);
    rounded(leg, [11.5, 8, 17], [0, -19, 3], m.graphite, 3);
    rounded(leg, [12, 1.8, 17], [0, -22.5, 3], m.trim, .7);
    const arm = new THREE.Group(); arm.position.set(side * 15, 44, 0); torso.add(arm); arms.push(arm);
    rounded(arm, [9, 20, 10], [side * 1, -8, 0], m.suit, 4);
    rounded(arm, [9.5, 3.5, 10.5], [side * 1, -7, 0], m.orange, 1);
    rounded(arm, [9, 8, 10], [side * 1, -21, 1], m.graphite, 3);
    ellipsoid(arm, [2.5, 4, 3], [-side * 3, -20, 4], m.graphite);
  }
  const pose = (angle = 0, phase = 0, walking = false) => {
    root.rotation.y = angle;
    const stride = walking ? Math.sin(phase * Math.PI * 2) : 0;
    legs[0].rotation.x = stride * .52; legs[1].rotation.x = -stride * .52;
    arms[0].rotation.x = -stride * .38; arms[1].rotation.x = stride * .38;
    torso.position.y = walking ? Math.abs(stride) * 1.5 : 0;
  };
  return { root, pose };
}

export function createTitus() {
  const root = new THREE.Group(); root.name = 'Titus_Assistant';
  const m = materials();
  const body = new THREE.Group(); root.add(body);
  rounded(body, [15, 19, 12], [0, 22, -1], m.robot, 5);
  rounded(body, [7, 6, 9], [-4, 12, 0], m.robot, 2);
  rounded(body, [7, 6, 9], [4, 12, 0], m.robot, 2);
  rounded(body, [35, 29, 24], [0, 45, 0], m.robot, 8);
  const rim = rounded(body, [31, 24, 14], [0, 45, 12], m.graphite, 6); rim.scale.z = 5 / 14;
  const face = rounded(body, [27, 20, 12], [0, 45, 14.5], m.screen, 5); face.scale.z = 3 / 12;
  const eyes = [];
  for (const side of [-1, 1]) {
    eyes.push(rounded(body, [6, 8, 1], [side * 4.5, 44, 16.3], m.eye, 1.7));
    rounded(body, [3, 11, 12], [side * 18, 45, 0], m.trim, 2);
    rounded(body, [3.7, 7, 8], [side * 19, 45, 0], m.robot, 2);
    ellipsoid(body, [3, 5, 4], [side * 9, 25, 0], m.robot);
    const thruster = cylinder(body, 2.5, 3, [side * 6, 10, 0], m.graphite);
    cylinder(body, 1.7, .8, [side * 6, 8.3, 0], m.light);
    thruster.name = 'Hover_thruster';
  }
  rounded(body, [13, 9, 1], [0, 44, -12.2], m.graphite, 1);
  for (let i = 0; i < 3; i++) rounded(body, [9, .8, 1], [0, 41 + i * 3, -13], m.trim, .2);
  rounded(body, [8, 2, 1], [0, 29, 5.2], m.green, .5);
  const pose = (angle = 0, phase = 0, mood = 'normal') => {
    root.rotation.y = angle;
    body.position.y = Math.sin(phase * Math.PI * 2) * 2;
    eyes.forEach(eye => {
      eye.material = mood === 'danger' ? m.red : mood === 'alert' ? m.amber : m.eye;
      eye.scale.set(mood === 'alert' ? .6 : 1, mood === 'danger' ? .4 : 1, 1);
      eye.rotation.z = mood === 'danger' ? .35 : 0;
    });
  };
  return { root, pose };
}
