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

function radiusAt(z) {
  const y = -z;
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

function moonTexture() {
  return painted((ctx, w, h) => {
    ctx.fillStyle = '#c3b8a4';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i += 1) {
      ctx.fillStyle = i % 3 === 0 ? '#8f8678' : '#d9d0c2';
      ctx.beginPath();
      ctx.arc((i * 73) % w, (i * 47) % h, 4 + (i % 9) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#7d7568';
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i += 1) {
      ctx.beginPath();
      ctx.arc((i * 110) % w, (i * 80) % h, 14 + (i % 5) * 6, 0.2, 4.2);
      ctx.stroke();
    }
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

function buildShip(parent, quality) {
  const ship = new THREE.Group();
  ship.name = 'Cinematic_Hull';
  parent.add(ship);
  const segments = quality === 'ajustado' ? 16 : 32;
  const hullMat = new THREE.MeshStandardMaterial({ map: hullTexture(), roughness: 0.38, metalness: 0.72, emissive: '#1c2628', emissiveIntensity: 0.18 });
  const hull = new THREE.Mesh(new THREE.LatheGeometry(PROFILE.map(([radius, y]) => new THREE.Vector2(radius, y)), segments), hullMat);
  hull.rotation.x = -Math.PI / 2;
  hull.updateMatrix();
  hull.castShadow = true;
  hull.receiveShadow = true;
  ship.add(hull);
  const nose = new THREE.Vector3(0, 6, 0).applyQuaternion(hull.quaternion);
  if (nose.z >= 0) throw new Error('La proa de Lunaria debe apuntar hacia la Luna, en -Z.');

  const panel = new THREE.MeshStandardMaterial({ color: '#5b6e74', roughness: 0.34, metalness: 0.72 });
  const dark = new THREE.MeshStandardMaterial({ color: '#202e37', roughness: 0.5, metalness: 0.4 });
  const orange = new THREE.MeshStandardMaterial({ color: '#d77926', roughness: 0.45, metalness: 0.2 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#9fd4e2', roughness: 0.06, metalness: 0.15, transparent: true, opacity: 0.42, side: THREE.DoubleSide });
  [-4.2, -1.6, 0.8, 3.1, 4.8].forEach(z => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radiusAt(z) + 0.02, 0.045, 8, segments), panel);
    ring.position.z = z;
    ship.add(ring);
  });
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(radiusAt(2.2) + 0.03, 0.055, 8, segments), orange);
  stripe.position.z = 2.2;
  ship.add(stripe);
  [-1.15, 1.15, 0].forEach(angle => {
    [-3.2, -0.6, 1.8, 3.6].forEach(z => {
      const radius = radiusAt(z) + 0.04;
      const x = Math.sin(angle) * radius;
      const y = Math.cos(angle) * radius;
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.05), dark);
      plate.position.set(x, y, z);
      plate.lookAt(x * 2, y * 2, z);
      ship.add(plate);
    });
  });
  [[1.1, -1.2], [-1.1, -1.2], [1.15, 0.8], [-1.15, 0.8], [-0.55, -3.3], [0.55, -3.3]].forEach(([angle, z]) => {
    const radius = radiusAt(z) + 0.04;
    const x = Math.sin(angle) * radius;
    const y = Math.cos(angle) * radius;
    const pane = new THREE.Mesh(new THREE.CircleGeometry(z < -2 ? 0.22 : 0.3, 18), glass);
    pane.position.set(x, y, z);
    pane.lookAt(x * 2, y * 2, z);
    const frame = new THREE.Mesh(new THREE.TorusGeometry(z < -2 ? 0.24 : 0.32, 0.028, 8, 18), panel);
    frame.position.copy(pane.position);
    frame.quaternion.copy(pane.quaternion);
    ship.add(pane, frame);
  });
  const engines = [];
  [[0, 0, 0.34], [-0.48, -0.08, 0.24], [0.48, -0.08, 0.24]].forEach(([x, y, radius], index) => {
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.55, radius, 0.55, 16), panel);
    bell.rotation.x = Math.PI / 2;
    bell.position.set(x, y, 6.15);
    const glowMat = new THREE.MeshStandardMaterial({ color: '#ffb15a', emissive: '#ff9a3c', emissiveIntensity: 1.1 });
    const glow = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.72, 16), glowMat);
    glow.position.set(x, y, 6.42);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.45, 0.7, 12), glowMat);
    cone.rotation.x = Math.PI / 2;
    cone.position.set(x, y, 6.7);
    ship.add(bell, glow, cone);
    engines.push(glow);
    if (index === 0) engines.push(cone);
  });
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 8, 20), panel);
  collar.position.z = -5.7;
  ship.add(collar);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.15, 8), panel);
  antenna.position.set(0.15, radiusAt(0.2) + 0.55, 0.2);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 10), panel);
  dish.scale.y = 0.28;
  dish.position.set(0.15, radiusAt(0.2) + 1.15, 0.28);
  ship.add(antenna, dish);
  const name = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.28), new THREE.MeshBasicMaterial({ map: plateTexture() }));
  const nameZ = 1.4;
  const nameR = radiusAt(nameZ) + 0.05;
  name.position.set(nameR, 0.05, nameZ);
  name.lookAt(nameR * 2, 0.05, nameZ);
  ship.add(name);
  const nav = {
    red: new THREE.PointLight('#ff5a4a', 3, 9),
    green: new THREE.PointLight('#7dffb2', 3, 9),
  };
  nav.red.position.set(-1.35, 0.15, 4.4);
  nav.green.position.set(1.35, 0.15, 4.4);
  const redBulb = mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff5a4a' }), ship, [-1.35, 0.15, 4.4]);
  const greenBulb = mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: '#7dffb2' }), ship, [1.35, 0.15, 4.4]);
  ship.add(nav.red, nav.green);
  return { engines, nav, bulbs: [redBulb, greenBulb] };
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
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.2, 32, 24), new THREE.MeshStandardMaterial({ map: moonTexture(), roughness: 0.95, emissive: '#3a342c', emissiveIntensity: 0.22 }));
  moon.position.set(0.2, 1.7, -7.4);
  parent.add(moon);
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
  return { cabin, holo, astronaut, titus, strips, lamps, cabinMoon: moon };
}

export function createCinematicWorld(quality) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05070d');
  scene.fog = new THREE.FogExp2('#05070d', 0.0035);
  const groups = { exterior: new THREE.Group(), interior: new THREE.Group() };
  scene.add(groups.exterior, groups.interior);
  const count = quality === 'ajustado' ? 280 : 900;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 150 + Math.random() * 70;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)), new THREE.PointsMaterial({ color: '#e7eef2', size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0 }));
  scene.add(stars);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(18, quality === 'ajustado' ? 24 : 40, 24), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.84, emissive: '#14324a', emissiveIntensity: 0.4 }));
  earth.position.set(-10, 4, 54);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(8, 32, 24), new THREE.MeshStandardMaterial({ map: moonTexture(), roughness: 0.94, emissive: '#3a342c', emissiveIntensity: 0.25 }));
  moon.position.set(2.5, 1.4, -34);
  groups.exterior.add(earth, moon);
  const ship = buildShip(groups.exterior, quality);
  const sun = new THREE.DirectionalLight('#fff1d6', 3.2);
  sun.position.set(16, 18, 10);
  if (quality !== 'ajustado') {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.bias = -0.0008;
    sun.shadow.camera.updateProjectionMatrix();
  }
  const fill = new THREE.DirectionalLight('#9ec0d4', 0.9);
  fill.position.set(-14, 6, 8);
  const rim = new THREE.DirectionalLight('#f0d2a4', quality === 'ajustado' ? 0 : 0.75);
  rim.position.set(4, 10, -16);
  const practical = new THREE.DirectionalLight('#fff6ea', 0);
  practical.position.set(0.4, 2.4, -6);
  const hemi = new THREE.HemisphereLight('#d5e4ee', '#2a241c', 0.55);
  const ambient = new THREE.AmbientLight('#d5e0e4', 0);
  scene.add(sun, fill, rim, practical, hemi, ambient);
  const cabin = buildCabin(groups.interior);
  groups.interior.visible = false;
  return { scene, groups, stars, earth, moon, sun, fill, rim, practical, hemi, ambient, ...ship, ...cabin };
}
