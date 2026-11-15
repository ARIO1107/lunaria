import * as THREE from 'three';
import { createCinematicAstronaut, createCinematicTitus } from './cast.js';

const PROFILE = [
  [1.12, -6.35], [1.22, -5.5], [1.38, -4.2], [1.52, -2.1], [1.58, 0.4],
  [1.46, 2.3], [1.12, 3.9], [0.7, 4.9], [0.28, 5.75], [0.08, 6.25],
];

function painted(draw, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function radiusAtY(y) {
  if (y <= PROFILE[0][1]) return PROFILE[0][0];
  for (let i = 1; i < PROFILE.length; i += 1) {
    if (y <= PROFILE[i][1]) {
      const span = PROFILE[i][1] - PROFILE[i - 1][1];
      const t = span === 0 ? 0 : (y - PROFILE[i - 1][1]) / span;
      return PROFILE[i - 1][0] + (PROFILE[i][0] - PROFILE[i - 1][0]) * t;
    }
  }
  return PROFILE[PROFILE.length - 1][0];
}

const BASE_OFFSET = -PROFILE[0][1];

function latheStage(points, segments, material) {
  const unique = [];
  points.forEach(point => {
    const last = unique[unique.length - 1];
    if (!last || last[1] !== point[1]) unique.push(point);
  });
  return new THREE.Mesh(new THREE.LatheGeometry(unique.map(([radius, y]) => new THREE.Vector2(radius, y)), segments), material);
}

export function createLauncherHull(segments = 16) {
  const rocket = new THREE.Group();
  rocket.name = 'Cinematic_Hull';
  const booster = new THREE.Group();
  booster.name = 'booster';
  const upper = new THREE.Group();
  upper.name = 'upper';
  const material = new THREE.MeshStandardMaterial({ color: '#b7c2bf', roughness: 0.38, metalness: 0.72 });
  const boosterHull = latheStage(PROFILE.filter(([, y]) => y <= 0.4), segments, material);
  const upperHull = latheStage(PROFILE.filter(([, y]) => y >= 0.4), segments, material);
  boosterHull.position.y = BASE_OFFSET;
  upperHull.position.y = BASE_OFFSET;
  boosterHull.castShadow = true;
  upperHull.castShadow = true;
  boosterHull.receiveShadow = true;
  upperHull.receiveShadow = true;
  booster.add(boosterHull);
  upper.add(upperHull);
  rocket.add(booster, upper);
  rocket.updateWorldMatrix(true, true);
  const tip = new THREE.Vector3(0, PROFILE[PROFILE.length - 1][1], 0).applyMatrix4(upperHull.matrixWorld);
  const base = new THREE.Vector3(0, PROFILE[0][1], 0).applyMatrix4(boosterHull.matrixWorld);
  if (!(tip.y > base.y + 8)) throw new Error('La proa del lanzador debe apuntar hacia arriba, en +Y.');
  return { rocket, booster, upper, material, tipY: tip.y, baseY: base.y };
}

function earthTexture() {
  return painted((ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#1a3e68');
    sky.addColorStop(0.5, '#2f6d86');
    sky.addColorStop(1, '#1a3e68');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#6e9a6a';
    for (let i = 0; i < 22; i += 1) {
      ctx.beginPath();
      ctx.ellipse((i * 97) % w, 30 + (i * 53) % (h - 60), 46 + (i % 5) * 14, 20 + (i % 4) * 8, i * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(215,228,234,.72)';
    for (let i = 0; i < 14; i += 1) ctx.fillRect((i * 71) % w, (i * 37) % h, 64, 10);
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillRect(0, 0, w, 18);
    ctx.fillRect(0, h - 18, w, 18);
  }, 1024, 512);
}

function hullTexture() {
  return painted((ctx, w, h) => {
    ctx.fillStyle = '#b7c2bf';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d77926';
    ctx.fillRect(0, h * 0.46, w, 14);
    ctx.strokeStyle = '#5c6c72';
    ctx.lineWidth = 3;
    for (let y = 0; y < h; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let x = 0; x < w; x += 96) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.fillStyle = '#8b9aa0';
    for (let i = 0; i < 24; i += 1) ctx.fillRect(18 + (i % 6) * 96, 18 + Math.floor(i / 6) * 70, 62, 28);
    ctx.fillStyle = '#3e4c52';
    for (let i = 0; i < 80; i += 1) ctx.fillRect((i * 37) % w, (i * 19) % h, 3, 3);
  }, 1024, 512);
}

function floorTexture() {
  return painted((ctx, w, h) => {
    ctx.fillStyle = '#4c5e66';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#6d8086';
    ctx.lineWidth = 4;
    for (let x = 0; x <= w; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#d77926';
    ctx.fillRect(0, h / 2 - 4, w, 8);
  }, 512, 512);
}

function screenTexture() {
  return painted((ctx, w, h) => {
    ctx.fillStyle = '#10242c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#5b6e74';
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = '#9be8f2';
    ctx.font = 'bold 46px Segoe UI, sans-serif';
    ctx.fillText('AIRE', 40, 90);
    ctx.fillText('ENERGÍA', 40, 160);
    ctx.fillText('RUMBO', 40, 230);
    ctx.font = '26px Segoe UI, sans-serif';
    ctx.fillStyle = '#e8b95d';
    ctx.fillText('Indicadores de juego', 40, 286);
  }, 512, 320);
}

function holoTexture() {
  return painted((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#b7f6ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, w - 32, h - 32);
    ctx.fillStyle = '#d8faff';
    ctx.font = 'bold 42px Segoe UI, sans-serif';
    ctx.fillText('AIRE', 40, 86);
    ctx.fillText('ENERGÍA', 40, 156);
    ctx.fillText('RUMBO', 40, 226);
    ctx.fillStyle = '#9be8f2';
    ctx.fillRect(300, 58, 160, 16);
    ctx.fillRect(300, 128, 120, 16);
    ctx.fillRect(300, 198, 150, 16);
    ctx.font = '24px Segoe UI, sans-serif';
    ctx.fillStyle = '#e8b95d';
    ctx.fillText('Indicadores de juego', 40, 280);
  }, 512, 320);
}

function plateTexture() {
  return painted((ctx, w, h) => {
    ctx.fillStyle = '#24343c';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e7e9e1';
    ctx.font = 'bold 64px Segoe UI, sans-serif';
    ctx.fillText('LUNARIA', 24, 78);
  }, 512, 128);
}

function mesh(geometry, material, parent, position, rotation) {
  const item = new THREE.Mesh(geometry, material);
  if (position) item.position.set(...position);
  if (rotation) item.rotation.set(...rotation);
  item.castShadow = true;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}

function concreteTexture() {
  return painted((ctx, w, h) => {
    ctx.fillStyle = '#6d7a55';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#8a9280';
    for (let i = 0; i < 40; i += 1) ctx.fillRect((i * 80) % w, (i * 47) % h, 36, 8);
    ctx.fillStyle = '#b7b3a8';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 210, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d77926';
    ctx.lineWidth = 8;
    ctx.strokeRect(w / 2 - 150, h / 2 - 150, 300, 300);
    ctx.strokeStyle = '#e7e9e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 168, 0, Math.PI * 2);
    ctx.stroke();
  }, 1024, 1024);
}

function buildLauncher(parent, quality) {
  const segments = quality === 'ajustado' ? 16 : 28;
  const built = createLauncherHull(segments);
  const { rocket, booster, upper } = built;
  built.material.map = hullTexture();
  built.material.emissive = new THREE.Color('#1c2628');
  built.material.emissiveIntensity = 0.18;
  parent.add(rocket);
  const panel = new THREE.MeshStandardMaterial({ color: '#5b6e74', roughness: 0.34, metalness: 0.72 });
  const dark = new THREE.MeshStandardMaterial({ color: '#202e37', roughness: 0.5, metalness: 0.4 });
  const orange = new THREE.MeshStandardMaterial({ color: '#d77926', roughness: 0.45, metalness: 0.2 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#9fd4e2', roughness: 0.06, metalness: 0.15, transparent: true, opacity: 0.42, side: THREE.DoubleSide });
  [-4.2, -1.4, 0.4, 2.2, 4.4].forEach(y => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radiusAtY(y) + 0.03, 0.045, 8, segments), y === 2.2 ? orange : panel);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y + BASE_OFFSET;
    (y < 0.4 ? booster : upper).add(ring);
  });
  [-0.2, 1.4, 2.6].forEach(y => {
    const radius = radiusAtY(y) + 0.05;
    [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].forEach(angle => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.05), dark);
      plate.position.set(Math.cos(angle) * radius, y + BASE_OFFSET, Math.sin(angle) * radius);
      plate.lookAt(Math.cos(angle) * radius * 2, y + BASE_OFFSET, Math.sin(angle) * radius * 2);
      upper.add(plate);
    });
  });
  [[1.2, 3.4], [-0.4, 4.6], [2.2, 5.1]].forEach(([angle, y]) => {
    const radius = radiusAtY(y) + 0.04;
    const pane = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), glass);
    pane.position.set(Math.sin(angle) * radius, y + BASE_OFFSET, Math.cos(angle) * radius);
    pane.lookAt(Math.sin(angle) * radius * 2, y + BASE_OFFSET, Math.cos(angle) * radius * 2);
    const frame = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 16), panel);
    frame.position.copy(pane.position);
    frame.quaternion.copy(pane.quaternion);
    upper.add(pane, frame);
  });
  const engines = [];
  const plumes = [];
  const glowMat = new THREE.MeshStandardMaterial({ color: '#ffb15a', emissive: '#ff7a1a', emissiveIntensity: 0.2, transparent: true, opacity: 0.9 });
  [[0, 0, 0.42], [0.62, 0, 0.28], [-0.62, 0, 0.28], [0.36, 0, -0.48], [-0.36, 0, -0.48]].forEach(([x, , z], index) => {
    const radius = index === 0 ? 0.34 : 0.26;
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.55, radius, 0.85, 16), panel);
    bell.position.set(x, -0.15, z);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.85, 16), glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x, -0.55, z);
    const plume = new THREE.Mesh(new THREE.ConeGeometry(radius * 1.15, 1.5, 12), glowMat);
    plume.rotation.x = Math.PI;
    plume.position.set(x, -1.15, z);
    plume.visible = false;
    booster.add(bell, glow, plume);
    engines.push(glow);
    plumes.push(plume);
  });
  const flameRing = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.34, 10, 28), glowMat);
  flameRing.rotation.x = Math.PI / 2;
  flameRing.position.y = 0.2;
  flameRing.visible = false;
  booster.add(flameRing);
  plumes.push(flameRing);
  const name = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), new THREE.MeshBasicMaterial({ map: plateTexture() }));
  const nameY = 2.4 + BASE_OFFSET;
  const nameR = radiusAtY(2.4) + 0.06;
  name.position.set(nameR, nameY, 0);
  name.rotation.y = Math.PI / 2;
  upper.add(name);
  const nav = { red: new THREE.PointLight('#ff5a4a', 3, 9), green: new THREE.PointLight('#7dffb2', 3, 9) };
  nav.red.position.set(-1.2, 8.2, 0);
  nav.green.position.set(1.2, 8.2, 0);
  const redBulb = mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff5a4a' }), upper, [-1.2, 8.2, 0]);
  const greenBulb = mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: '#7dffb2' }), upper, [1.2, 8.2, 0]);
  rocket.add(nav.red, nav.green);
  const count = quality === 'ajustado' ? 48 : 160;
  const positions = new Float32Array(count * 3);
  const seeds = [];
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 0.8;
    positions[i * 3 + 1] = -Math.random() * 3;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    seeds.push(Math.random());
  }
  const smoke = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)), new THREE.PointsMaterial({ color: '#f3f0ea', size: quality === 'ajustado' ? 1.4 : 2.4, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true }));
  smoke.userData.seeds = seeds;
  smoke.visible = false;
  booster.add(smoke);
  const engineLight = new THREE.PointLight('#ff8a2a', 0, 22, 2);
  engineLight.position.set(0, -0.4, 0);
  booster.add(engineLight);
  return { rocket, booster, engines, plumes, smoke, engineLight, nav, bulbs: [redBulb, greenBulb] };
}

function buildPad(parent, quality) {
  const pad = new THREE.Group();
  pad.name = 'launch-pad';
  parent.add(pad);
  const groundMat = new THREE.MeshStandardMaterial({ map: concreteTexture(), roughness: 0.9, metalness: 0.05 });
  const ground = new THREE.Mesh(new THREE.RingGeometry(2.15, 42, quality === 'ajustado' ? 24 : 48), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  pad.add(ground);
  const trench = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.35, 1.6, 24), new THREE.MeshStandardMaterial({ color: '#1b2428', roughness: 0.85, metalness: 0.25 }));
  trench.position.y = -0.7;
  trench.receiveShadow = true;
  pad.add(trench);
  const metal = new THREE.MeshStandardMaterial({ color: '#8d9aa0', roughness: 0.42, metalness: 0.62 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2c3a42', roughness: 0.48, metalness: 0.4 });
  const orange = new THREE.MeshStandardMaterial({ color: '#d77926', roughness: 0.46, metalness: 0.2 });
  const tower = new THREE.Group();
  tower.position.set(4.6, 0, 0);
  pad.add(tower);
  [[-0.7, -0.7], [0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]].forEach(([x, z]) => {
    mesh(new THREE.BoxGeometry(0.16, 16.5, 0.16), metal, tower, [x, 8.25, z]);
  });
  for (let y = 2; y <= 15; y += 2) {
    mesh(new THREE.BoxGeometry(1.55, 0.08, 0.08), dark, tower, [0, y, -0.7]);
    mesh(new THREE.BoxGeometry(1.55, 0.08, 0.08), dark, tower, [0, y, 0.7]);
    mesh(new THREE.BoxGeometry(0.08, 0.08, 1.55), dark, tower, [-0.7, y, 0]);
    mesh(new THREE.BoxGeometry(0.08, 0.08, 1.55), dark, tower, [0.7, y, 0]);
    mesh(new THREE.BoxGeometry(1.3, 0.06, 1.3), dark, tower, [0, y + 0.2, 0]);
  }
  const gantry = new THREE.Group();
  gantry.position.set(-0.7, 8.4, 0);
  tower.add(gantry);
  mesh(new THREE.BoxGeometry(2.4, 0.16, 0.7), metal, gantry, [-1.2, 0, 0]);
  mesh(new THREE.BoxGeometry(0.35, 0.9, 0.55), dark, gantry, [-2.2, -0.2, 0]);
  const clamps = [-1, 1].map(side => {
    const arm = new THREE.Group();
    arm.position.set(side * 2.15, 1.15, 0);
    mesh(new THREE.BoxGeometry(1.35, 0.22, 0.34), metal, arm, [-side * 0.55, 0, 0]);
    mesh(new THREE.BoxGeometry(0.28, 0.55, 0.4), orange, arm, [-side * 1.15, 0.15, 0]);
    pad.add(arm);
    return arm;
  });
  [[-8, 1.1, 6], [9, 1.3, -7], [-6, 0.8, -9]].forEach(([x, h, z], index) => {
    mesh(new THREE.CylinderGeometry(0.7, 0.7, h, 16), index === 1 ? orange : metal, pad, [x, h / 2, z]);
    mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 16), dark, pad, [x, h + 0.06, z]);
  });
  mesh(new THREE.BoxGeometry(2.4, 0.7, 1.1), dark, pad, [-11, 0.55, 4]);
  mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.28, 12), metal, pad, [-12, 0.28, 4.4]);
  mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.28, 12), metal, pad, [-10, 0.28, 4.4]);
  mesh(new THREE.BoxGeometry(0.08, 7, 0.08), metal, pad, [12, 3.5, 8]);
  mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshStandardMaterial({ color: '#fff1c9', emissive: '#e8b95d', emissiveIntensity: 0.8 }), pad, [12, 7.1, 8]);
  const clouds = new THREE.Group();
  const puff = new THREE.MeshStandardMaterial({ color: '#f7fbff', roughness: 1, transparent: true, opacity: 0.92 });
  [[-16, 24, -8, 4], [10, 27, 14, 3.2], [22, 22, -18, 5], [-8, 30, 20, 3.6], [0, 34, -24, 6]].slice(0, quality === 'ajustado' ? 3 : 5).forEach(([x, y, z, scale]) => {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), puff);
    cloud.position.set(x, y, z);
    cloud.scale.set(scale, scale * 0.45, scale * 0.8);
    clouds.add(cloud);
  });
  pad.add(clouds);
  return { pad, clamps, gantry, clouds };
}

function buildCabin(parent) {
  const roomMat = new THREE.MeshStandardMaterial({ color: '#3d5560', roughness: 0.62, metalness: 0.18, side: THREE.DoubleSide });
  const trim = new THREE.MeshStandardMaterial({ color: '#8d9ea4', roughness: 0.4, metalness: 0.45 });
  const dark = new THREE.MeshStandardMaterial({ color: '#1b282f', roughness: 0.8, metalness: 0.2 });
  mesh(new THREE.PlaneGeometry(4.8, 5.4), new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.82, metalness: 0.18 }), parent, [0, 0, 0], [-Math.PI / 2, 0, 0]);
  mesh(new THREE.PlaneGeometry(4.8, 5.4), roomMat, parent, [0, 2.5, 0], [Math.PI / 2, 0, 0]);
  mesh(new THREE.BoxGeometry(0.08, 2.5, 5.3), roomMat, parent, [-2.4, 1.25, 0]);
  mesh(new THREE.BoxGeometry(0.08, 2.5, 5.3), roomMat, parent, [2.4, 1.25, 0]);
  mesh(new THREE.BoxGeometry(4.8, 2.5, 0.08), roomMat, parent, [0, 1.25, 2.7]);
  mesh(new THREE.BoxGeometry(4.8, 0.9, 0.08), roomMat, parent, [0, 0.45, -2.65]);
  mesh(new THREE.BoxGeometry(4.8, 0.65, 0.08), roomMat, parent, [0, 2.175, -2.65]);
  mesh(new THREE.BoxGeometry(1.55, 0.95, 0.08), roomMat, parent, [-1.625, 1.375, -2.65]);
  mesh(new THREE.BoxGeometry(1.55, 0.95, 0.08), roomMat, parent, [1.625, 1.375, -2.65]);
  mesh(new THREE.BoxGeometry(1.78, 0.06, 0.08), trim, parent, [0, 0.92, -2.6]);
  mesh(new THREE.BoxGeometry(1.78, 0.06, 0.08), trim, parent, [0, 1.84, -2.6]);
  mesh(new THREE.BoxGeometry(0.06, 0.98, 0.08), trim, parent, [-0.86, 1.38, -2.6]);
  mesh(new THREE.BoxGeometry(0.06, 0.98, 0.08), trim, parent, [0.86, 1.38, -2.6]);
  [-1.6, 1.6].forEach(x => {
    mesh(new THREE.BoxGeometry(0.08, 2.2, 0.08), trim, parent, [x, 1.15, 0.2]);
    mesh(new THREE.BoxGeometry(0.05, 0.05, 4.2), trim, parent, [x, 2.15, 0.1]);
  });
  const strips = [-0.7, 0.7].map(x => {
    const bar = mesh(new THREE.BoxGeometry(0.12, 0.05, 2.4), new THREE.MeshStandardMaterial({ color: '#d7fff8', emissive: '#9be8f2', emissiveIntensity: 0.2 }), parent, [x, 2.42, 0.2]);
    return bar;
  });
  const vista = new THREE.Group();
  vista.name = 'pad-vista';
  vista.position.set(0, 0, -4.2);
  const skyMat = new THREE.MeshBasicMaterial({ color: '#8ec6ef', side: THREE.DoubleSide });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), skyMat);
  sky.position.set(0, 2.4, -4);
  vista.add(sky);
  const field = new THREE.Mesh(new THREE.PlaneGeometry(18, 8), new THREE.MeshBasicMaterial({ color: '#7d8b62', side: THREE.DoubleSide }));
  field.rotation.x = -Math.PI / 2;
  field.position.set(0, 0.15, -2);
  vista.add(field);
  const farTower = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.2, 0.35), new THREE.MeshBasicMaterial({ color: '#5c6e76' }));
  farTower.position.set(1.6, 1.7, -2.2);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.2), new THREE.MeshBasicMaterial({ color: '#8d9aa0' }));
  arm.position.set(0.7, 2.4, -2.2);
  const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), new THREE.MeshBasicMaterial({ color: '#f4f8fb' }));
  cloud.scale.set(1.8, 0.55, 1);
  cloud.position.set(-1.4, 3.1, -3);
  vista.add(farTower, arm, cloud);
  parent.add(vista);
  const seat = new THREE.MeshStandardMaterial({ color: '#1f2a30', roughness: 0.9 });
  mesh(new THREE.BoxGeometry(0.62, 0.12, 0.62), seat, parent, [0, 0.48, 0.55]);
  mesh(new THREE.BoxGeometry(0.62, 0.7, 0.1), seat, parent, [0, 0.86, 0.84]);
  mesh(new THREE.BoxGeometry(0.28, 0.16, 0.08), seat, parent, [0, 1.22, 0.8]);
  const consoleMat = new THREE.MeshStandardMaterial({ color: '#5b6e74', metalness: 0.62, roughness: 0.32 });
  mesh(new THREE.BoxGeometry(0.55, 0.72, 0.9), consoleMat, parent, [1.55, 0.62, -0.05]);
  mesh(new THREE.BoxGeometry(0.5, 0.08, 0.7), dark, parent, [1.28, 0.98, -0.05], [0, 0, -0.4]);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.4), new THREE.MeshBasicMaterial({ map: screenTexture() }));
  screen.position.set(1.22, 1.22, -0.05);
  screen.rotation.y = -Math.PI / 2;
  parent.add(screen);
  const lamps = [-0.22, 0, 0.22].map((z, index) => mesh(
    new THREE.BoxGeometry(0.06, 0.04, 0.08),
    new THREE.MeshStandardMaterial({ color: index === 1 ? '#e8b95d' : '#85c8ad', emissive: index === 1 ? '#e8b95d' : '#4c9f8a', emissiveIntensity: 0.8 }),
    parent,
    [1.02, 1.02, z],
  ));
  const holo = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.5), new THREE.MeshBasicMaterial({ map: holoTexture(), transparent: true, opacity: 0, depthWrite: false }));
  holo.position.set(1.15, 1.42, 0.28);
  holo.lookAt(0.15, 1.4, -0.55);
  parent.add(holo);
  const cabin = new THREE.PointLight('#f3fffb', 0, 12, 2);
  cabin.position.set(0, 2.05, 0.15);
  const windowLight = new THREE.PointLight('#d5e4ff', 40, 8, 2);
  windowLight.position.set(0, 1.55, -1.7);
  const faceLight = new THREE.PointLight('#fff4e2', 90, 6, 2);
  faceLight.position.set(0.15, 1.4, -0.15);
  parent.add(cabin, windowLight, faceLight);
  parent.traverse(object => { if (object.isMesh) object.castShadow = false; });
  const astronaut = createCinematicAstronaut();
  const titus = createCinematicTitus();
  parent.add(astronaut.root, titus.root);
  return { cabin, holo, astronaut, titus, strips, lamps, vista };
}

export function createCinematicWorld(quality) {
  const scene = new THREE.Scene();
  const colors = {
    dawn: new THREE.Color('#8ec6ef'),
    haze: new THREE.Color('#c5dff3'),
    high: new THREE.Color('#1a2744'),
    space: new THREE.Color('#05070d'),
  };
  scene.background = colors.dawn.clone();
  scene.fog = new THREE.Fog('#c5dff3', 28, 130);
  const groups = { exterior: new THREE.Group(), interior: new THREE.Group() };
  scene.add(groups.exterior, groups.interior);
  const count = quality === 'ajustado' ? 180 : 700;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 80 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)), new THREE.PointsMaterial({ color: '#e7eef2', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0 }));
  scene.add(stars);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(16, quality === 'ajustado' ? 24 : 40, 24), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.84, emissive: '#14324a', emissiveIntensity: 0.35 }));
  earth.position.set(0, -1.5, -34);
  earth.visible = false;
  groups.exterior.add(earth);
  const pad = buildPad(groups.exterior, quality);
  const ship = buildLauncher(groups.exterior, quality);
  const sun = new THREE.DirectionalLight('#ffe0b0', 2.6);
  sun.position.set(22, 14, 16);
  scene.add(sun.target);
  if (quality !== 'ajustado') {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -8;
    sun.shadow.bias = -0.001;
    sun.shadow.camera.updateProjectionMatrix();
  }
  const fill = new THREE.DirectionalLight('#9ec0d4', 0.55);
  fill.position.set(-14, 8, 10);
  const rim = new THREE.DirectionalLight('#f0d2a4', quality === 'ajustado' ? 0 : 0.45);
  rim.position.set(-6, 12, -14);
  const practical = new THREE.DirectionalLight('#fff6ea', 0);
  practical.position.set(0.4, 2.4, -6);
  const hemi = new THREE.HemisphereLight('#9ec9ef', '#6d7a4e', 0.85);
  const ambient = new THREE.AmbientLight('#d5e0e4', 0.15);
  scene.add(sun, fill, rim, practical, hemi, ambient);
  const cabin = buildCabin(groups.interior);
  groups.interior.visible = false;
  return { scene, groups, stars, earth, sun, fill, rim, practical, hemi, ambient, colors, ...pad, ...ship, ...cabin };
}
