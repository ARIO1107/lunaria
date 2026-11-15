import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const suit = () => new THREE.MeshStandardMaterial({ color: '#efe8d6', roughness: .46, metalness: .08, emissive: '#4a463c', emissiveIntensity: .18 });
const orange = () => new THREE.MeshStandardMaterial({ color: '#d77926', roughness: .46, metalness: .16 });
const graphite = () => new THREE.MeshStandardMaterial({ color: '#323d42', roughness: .4, metalness: .38 });
const trim = () => new THREE.MeshStandardMaterial({ color: '#c5c6bb', roughness: .32, metalness: .62 });
const visorMat = () => new THREE.MeshPhysicalMaterial({ color: '#14344a', roughness: .06, metalness: .55, clearcoat: 1, clearcoatRoughness: .08, emissive: '#0e3a52', emissiveIntensity: .35 });
const robot = () => new THREE.MeshStandardMaterial({ color: '#475456', roughness: .32, metalness: .62 });
const screen = () => new THREE.MeshStandardMaterial({ color: '#07141a', roughness: .28, metalness: .45 });
const eyeMat = () => new THREE.MeshStandardMaterial({ color: '#d8faff', emissive: '#9be8f2', emissiveIntensity: 1.4 });

function mesh(geometry, material, parent, position, rotation) {
  const item = new THREE.Mesh(geometry, material);
  if (position) item.position.set(...position);
  if (rotation) item.rotation.set(...rotation);
  item.castShadow = true;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}

function limb(parent, material, band, upper, lower, endRadius) {
  const pivot = new THREE.Group();
  parent.add(pivot);
  mesh(new THREE.CapsuleGeometry(.075, upper, 4, 10), material, pivot, [0, -(upper * .5 + .05), 0]);
  mesh(new THREE.TorusGeometry(.09, .016, 8, 12), band, pivot, [0, -.08, 0], [Math.PI / 2, 0, 0]);
  const joint = new THREE.Group();
  joint.position.set(0, -(upper + .08), 0);
  pivot.add(joint);
  mesh(new THREE.CapsuleGeometry(.062, lower, 3, 8), material, joint, [0, -(lower * .5 + .04), 0]);
  mesh(new THREE.SphereGeometry(endRadius, 12, 10), band, joint, [0, -(lower + .06), .02]);
  pivot.joint = joint;
  return pivot;
}

export function createCinematicAstronaut() {
  const root = new THREE.Group();
  root.name = 'Cinematic_Alex';
  const hips = new THREE.Group();
  hips.position.y = .92;
  root.add(hips);
  const torso = new THREE.Group();
  hips.add(torso);
  const cloth = suit();
  const band = orange();
  const dark = graphite();
  const metal = trim();
  mesh(new THREE.CapsuleGeometry(.22, .34, 6, 14), cloth, torso, [0, .32, 0]);
  mesh(new THREE.CylinderGeometry(.11, .13, .08, 12), cloth, torso, [0, .52, 0]);
  mesh(new RoundedBoxGeometry(.4, .16, .26, 2, .04), dark, torso, [0, .16, -.02]);
  mesh(new RoundedBoxGeometry(.18, .14, .07, 2, .02), metal, torso, [0, .3, -.2]);
  mesh(new THREE.BoxGeometry(.045, .045, .02), new THREE.MeshStandardMaterial({ color: '#85c8ad', emissive: '#4c9f8a', emissiveIntensity: 1.1 }), torso, [-.05, .32, -.24]);
  mesh(new THREE.BoxGeometry(.045, .045, .02), new THREE.MeshStandardMaterial({ color: '#e8b95d', emissive: '#a86e27', emissiveIntensity: 1 }), torso, [.05, .32, -.24]);
  mesh(new RoundedBoxGeometry(.32, .4, .16, 2, .04), cloth, torso, [0, .34, .18]);
  mesh(new RoundedBoxGeometry(.2, .26, .05, 2, .02), metal, torso, [0, .36, .27]);
  const head = new THREE.Group();
  head.position.set(0, .66, 0);
  torso.add(head);
  mesh(new THREE.SphereGeometry(.19, 28, 20), cloth, head);
  const visor = mesh(new THREE.SphereGeometry(.12, 24, 16), visorMat(), head, [0, .015, -.15]);
  visor.scale.set(1.2, .55, .22);
  visor.name = 'visor';
  const goldRim = new THREE.MeshStandardMaterial({ color: '#e0b45a', roughness: .28, metalness: .76 });
  const rim = mesh(new THREE.TorusGeometry(.145, .014, 8, 24), goldRim, head, [0, .015, -.15]);
  rim.scale.set(1.05, .48, 1);
  mesh(new THREE.BoxGeometry(.07, .035, .04), metal, head, [-.11, .1, -.1]);
  mesh(new THREE.BoxGeometry(.07, .035, .04), metal, head, [.11, .1, -.1]);
  const armL = limb(torso, cloth, band, .22, .18, .07);
  armL.position.set(.3, .46, 0);
  const armR = limb(torso, cloth, band, .22, .18, .07);
  armR.position.set(-.3, .46, 0);
  const legL = limb(hips, cloth, band, .28, .34, .08);
  legL.position.set(.11, -.02, 0);
  const legR = limb(hips, cloth, band, .28, .34, .08);
  legR.position.set(-.11, -.02, 0);
  return { root, hips, torso, head, armL, armR, legL, legR };
}

export function createCinematicTitus() {
  const root = new THREE.Group();
  root.name = 'Cinematic_Titus';
  const body = new THREE.Group();
  root.add(body);
  const shell = robot();
  const dark = graphite();
  const metal = trim();
  mesh(new RoundedBoxGeometry(.46, .34, .32, 3, .06), shell, body);
  mesh(new RoundedBoxGeometry(.34, .2, .04, 2, .02), screen(), body, [0, .02, -.17]);
  const eyes = [-.08, .08].map(x => mesh(new RoundedBoxGeometry(.08, .07, .02, 2, .015), eyeMat(), body, [x, .04, -.2]));
  const mouth = mesh(new THREE.BoxGeometry(.12, .018, .02), eyeMat(), body, [0, -.05, -.2]);
  mesh(new RoundedBoxGeometry(.18, .08, .14, 2, .02), shell, body, [0, -.22, 0]);
  mesh(new THREE.CylinderGeometry(.035, .04, .1, 10), dark, body, [0, .24, 0]);
  mesh(new THREE.SphereGeometry(.05, 10, 8), metal, body, [0, .3, 0]);
  [-.16, .16].forEach(x => mesh(new THREE.BoxGeometry(.08, .12, .06), metal, body, [x, .08, .16]));
  const armL = new THREE.Group();
  armL.position.set(.28, .02, -.02);
  body.add(armL);
  mesh(new THREE.CapsuleGeometry(.035, .2, 4, 8), shell, armL, [.02, -.12, -.02]);
  const armR = new THREE.Group();
  armR.position.set(-.28, .02, -.02);
  body.add(armR);
  mesh(new THREE.CapsuleGeometry(.035, .2, 4, 8), shell, armR, [-.02, -.12, -.02]);
  const thrusters = [-.12, .12].map(x => mesh(
    new THREE.CylinderGeometry(.04, .05, .06, 10),
    new THREE.MeshStandardMaterial({ color: '#9be8f2', emissive: '#93d5d8', emissiveIntensity: .6 }),
    body,
    [x, -.32, 0],
  ));
  mesh(new THREE.BoxGeometry(.06, .04, .02), new THREE.MeshStandardMaterial({ color: '#85c8ad', emissive: '#4c9f8a', emissiveIntensity: .9 }), body, [.2, .12, .12]);
  return { root, body, eyes, mouth, thrusters, armL, armR };
}

export function yawToward(from, to) {
  return Math.atan2(-(to[0] - from[0]), -(to[2] - from[2]));
}

export function applyCast(astronaut, titus, state, time, sequence = 'opening') {
  const alex = state.astronaut;
  astronaut.root.position.set(alex.x, alex.y, alex.z);
  astronaut.root.rotation.y = 0;
  const sit = alex.sit;
  const swing = Math.sin(alex.stride * Math.PI * 2);
  astronaut.hips.position.y = .92 - sit * .34;
  astronaut.torso.position.y = Math.sin(time * 1.7) * .012;
  astronaut.torso.rotation.x = sit * .18;
  astronaut.legL.rotation.x = sit * 1.15 + (1 - sit) * swing * .4;
  astronaut.legR.rotation.x = sit * 1.15 - (1 - sit) * swing * .4;
  astronaut.legL.joint.rotation.x = -sit * 1.45 - (1 - sit) * Math.max(0, -swing) * .5;
  astronaut.legR.joint.rotation.x = -sit * 1.45 - (1 - sit) * Math.max(0, swing) * .5;
  const reach = sequence === 'opening' && time > 68 && time < 76;
  astronaut.armL.rotation.z = .15;
  astronaut.armR.rotation.z = -.15;
  astronaut.armL.rotation.x = sit * .55;
  astronaut.armR.rotation.x = reach ? .9 : sit * .5;
  astronaut.armL.joint.rotation.x = sit * -1.05;
  astronaut.armR.joint.rotation.x = reach ? -0.35 : sit * -1.05;
  const lookTitus = sequence === 'opening' && time >= 24 && time < 40;
  const lookWindow = sequence === 'opening' && time >= 58 && time < 68;
  astronaut.head.rotation.y = lookTitus ? .55 : lookWindow ? -0.35 : 0;
  astronaut.head.rotation.x = sequence === 'launch' && time >= 22 && time < 36 ? -0.08 : sit * .06;

  const spot = state.titus.p;
  titus.root.position.set(spot[0], spot[1] + Math.sin(time * 1.6) * .045, spot[2]);
  const talking = state.titus.expression === 'talk' || state.titus.expression === 'info' || state.titus.expression === 'point';
  const faceTarget = [alex.x, 1.3, alex.z];
  titus.root.rotation.y = state.titus.expression === 'point' ? yawToward(spot, [1.45, 1.15, -0.05]) : yawToward(spot, faceTarget);
  titus.body.rotation.z = Math.sin(time * 1.3) * .04;
  titus.armL.rotation.x = talking ? -.55 : -.25;
  titus.armR.rotation.x = state.titus.expression === 'point' ? -1.15 : talking ? -.4 : -.2;
  const open = state.eyes * (talking ? .4 + Math.abs(Math.sin(time * 7)) * .6 : 1);
  titus.eyes.forEach(eye => {
    eye.scale.y = Math.max(.18, open);
    eye.material.emissiveIntensity = state.eyes * (state.titus.expression === 'info' ? 2.4 : 1.5);
  });
  titus.mouth.scale.x = talking ? .55 + Math.abs(Math.sin(time * 9)) * .7 : 1;
  titus.thrusters.forEach(thruster => { thruster.material.emissiveIntensity = .4 + Math.sin(time * 6) * .3; });
}
