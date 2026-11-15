import * as THREE from 'three';
import { createCinematicTitus } from '../cinematic/cast.js';

function add(parent, geometry, material, position, rotation) {
  const mesh = new THREE.Mesh(geometry, material);
  if (position) mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildConsole(parent, stationId, materials) {
  const desk = add(parent, new THREE.BoxGeometry(1.5, 0.08, 0.62), materials.hull, [0, 0.98, -0.72]);
  add(parent, new THREE.BoxGeometry(1.35, 0.42, 0.08), materials.dark, [0, 1.22, -1.02]);
  const screen = add(parent, new THREE.BoxGeometry(0.72, 0.34, 0.02), materials.screen, [0, 1.24, -0.97]);
  if (stationId === 'oxygen') {
    for (const x of [-0.28, 0.28]) {
      add(parent, new THREE.CylinderGeometry(0.09, 0.09, 0.34, 16), materials.tank, [x, 1.28, -0.78]);
      add(parent, new THREE.BoxGeometry(0.08, 0.16, 0.08), materials.clamp, [x, 1.22, -0.66]);
    }
  } else if (stationId === 'breakers' || stationId === 'solar') {
    for (let i = 0; i < 6; i += 1) add(parent, new THREE.BoxGeometry(0.08, 0.16, 0.04), i % 2 ? materials.clamp : materials.screen, [-0.34 + i * 0.12, 1.16, -0.68]);
  } else if (stationId === 'propulsion' || stationId === 'lander' || stationId === 'module') {
    for (const x of [-0.22, 0, 0.22]) add(parent, new THREE.CylinderGeometry(0.035, 0.035, 0.22, 10), materials.lever, [x, 1.14, -0.62]);
  } else if (stationId === 'coas') {
    add(parent, new THREE.CylinderGeometry(0.08, 0.1, 0.28, 16), materials.dark, [0, 1.2, -0.7], [Math.PI / 2, 0, 0]);
  } else if (stationId === 'eva' || stationId === 'suit') {
    add(parent, new THREE.TorusGeometry(0.16, 0.025, 8, 18), materials.lever, [0.34, 1.25, -0.95]);
  }
  return { desk, screen };
}

function buildVista(scene, vista) {
  if (vista === 'pad') {
    scene.background = new THREE.Color('#8ec6ef');
    scene.fog = new THREE.Fog('#c5dff3', 12, 36);
    add(scene, new THREE.PlaneGeometry(48, 24), new THREE.MeshStandardMaterial({ color: '#6d8f62' }), [0, 0.2, -14], [-Math.PI / 2, 0, 0]);
    add(scene, new THREE.BoxGeometry(0.35, 4.2, 0.35), new THREE.MeshStandardMaterial({ color: '#d7d2c6' }), [-3.2, 2.2, -9]);
    return;
  }
  if (vista === 'surface') {
    scene.background = new THREE.Color('#140e0c');
    add(scene, new THREE.CircleGeometry(18, 24), new THREE.MeshStandardMaterial({ color: '#8a8174' }), [0, 0.15, -8], [-Math.PI / 2, 0, 0]);
    return;
  }
  scene.background = new THREE.Color('#070b12');
  const earth = add(scene, new THREE.SphereGeometry(2.2, 24, 18), new THREE.MeshStandardMaterial({ color: '#2f6d86', roughness: 0.7 }), [1.6, 2.05, -9]);
  earth.name = 'fp-earth';
}

// Camera sits on +Z and looks toward −Z. Titus is built with his eyes on local −Z
// (cast.js). A yaw of π sends that face to world +Z, toward the camera.
export const CABIN_CAMERA = { position: [0, 1.55, 1.15], lookAt: [0, 1.18, -0.8] };
export const TITUS_YAW = Math.PI;

// The cinematic shell is a dark metal. In this cabin it falls to black, so the
// mission view uses a flat gray and keeps the glowing eyes.
export function paintCabinTitus(titus) {
  titus.root.traverse(object => {
    if (!object.isMesh || !object.material) return;
    object.castShadow = false;
    object.receiveShadow = false;
    for (const material of [].concat(object.material)) {
      if (!material.color) continue;
      const hex = material.color.getHexString();
      if (hex === '07141a') {
        material.color.set('#8b9498');
        material.emissive?.set('#5c6569');
        material.emissiveIntensity = 0.2;
        material.metalness = 0.2;
        material.roughness = 0.55;
      } else if (hex === '475456' || hex === '323d42') {
        material.color.set('#9aa3a8');
        material.emissive?.set('#6a7378');
        material.emissiveIntensity = 0.22;
        material.metalness = 0.22;
        material.roughness = 0.5;
      }
    }
  });
}

export function startFirstPerson(canvas, { stationId = 'oxygen', vista = 'pad', reduced = false, quality = 'alto' } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: quality !== 'ajustado', alpha: false, powerPreference: 'high-performance' });
  let frame = 0;
  let observer = null;
  let lost = false;
  const onLost = event => { event.preventDefault(); lost = true; };
  const onRestored = () => { lost = false; };
  try {
  renderer.setPixelRatio(quality === 'ajustado' ? 1 : Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = vista === 'space' ? 1.16 : 1.08;
  renderer.shadowMap.enabled = quality !== 'ajustado';
  canvas.dataset.vista = vista;
  canvas.dataset.station = stationId;
  const scene = new THREE.Scene();
  buildVista(scene, vista);
  scene.add(new THREE.HemisphereLight('#d7e7f2', '#2a3330', 1.4));
  const sun = new THREE.DirectionalLight('#fff1d6', vista === 'space' ? 1.4 : 2.2);
  sun.position.set(4, 6, 3);
  sun.castShadow = quality !== 'ajustado';
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(58, 1, 0.08, 40);
  camera.position.set(...CABIN_CAMERA.position);
  camera.lookAt(...CABIN_CAMERA.lookAt);
  scene.add(camera);

  const hull = new THREE.MeshStandardMaterial({ color: '#b7c2bf', roughness: 0.45, metalness: 0.42 });
  const dark = new THREE.MeshStandardMaterial({ color: '#243036', roughness: 0.55, metalness: 0.3 });
  const floor = new THREE.MeshStandardMaterial({ color: '#5d6e74', roughness: 0.7, metalness: 0.25 });
  const screen = new THREE.MeshStandardMaterial({ color: '#12342a', emissive: '#1f8f6a', emissiveIntensity: 0.7, roughness: 0.3 });
  const tank = new THREE.MeshStandardMaterial({ color: '#2aa7b8', roughness: 0.35, metalness: 0.25 });
  const clamp = new THREE.MeshStandardMaterial({ color: '#d24b3a', roughness: 0.4, metalness: 0.2 });
  const lever = new THREE.MeshStandardMaterial({ color: '#d7b15a', metalness: 0.55, roughness: 0.35 });
  const suit = new THREE.MeshStandardMaterial({ color: '#e5dfcc', roughness: 0.55 });
  const materials = { hull, dark, floor, screen, tank, clamp, lever, suit };

  add(scene, new THREE.BoxGeometry(4.4, 0.12, 4.2), floor, [0, 0, -0.4]);
  const wallZ = -2.15;
  add(scene, new THREE.BoxGeometry(4.4, 0.7, 0.12), hull, [0, 0.41, wallZ]);
  add(scene, new THREE.BoxGeometry(4.4, 0.45, 0.12), hull, [0, 2.18, wallZ]);
  add(scene, new THREE.BoxGeometry(0.55, 1.35, 0.12), hull, [-1.92, 1.28, wallZ]);
  add(scene, new THREE.BoxGeometry(0.55, 1.35, 0.12), hull, [1.92, 1.28, wallZ]);
  add(scene, new THREE.BoxGeometry(3.3, 1.25, 0.02), new THREE.MeshStandardMaterial({ color: '#9fd0ea', roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.22, side: THREE.DoubleSide }), [0, 1.32, -2.05]);
  add(scene, new THREE.BoxGeometry(0.12, 2.3, 4), hull, [-2.15, 1.3, -0.2]);
  add(scene, new THREE.BoxGeometry(0.12, 2.3, 4), hull, [2.15, 1.3, -0.2]);
  add(scene, new THREE.BoxGeometry(4.2, 0.1, 3.6), dark, [0, 2.4, -0.3]);
  for (let i = 0; i < 4; i += 1) add(scene, new THREE.BoxGeometry(0.9, 0.04, 0.04), lever, [-1.2 + (i % 2) * 2.4, 2.15, -0.4 - i * 0.25]);
  const { screen: panel } = buildConsole(scene, stationId, materials);

  const gloveL = add(camera, new THREE.BoxGeometry(0.16, 0.1, 0.22), suit, [-0.32, -0.28, -0.48]);
  add(camera, new THREE.BoxGeometry(0.16, 0.1, 0.22), suit, [0.34, -0.24, -0.5]);
  gloveL.rotation.z = 0.3;

  const titus = createCinematicTitus();
  paintCabinTitus(titus);
  titus.root.position.set(0.72, 1.02, -0.2);
  titus.root.rotation.y = TITUS_YAW;
  scene.add(titus.root);
  const fill = new THREE.PointLight('#f4f7f8', 1.5, 5);
  fill.position.set(0.35, 1.45, 0.55);
  scene.add(fill);

  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  const clock = new THREE.Clock();
  function resize() {
    const width = canvas.clientWidth || 640;
    const height = canvas.clientHeight || 320;
    if (canvas.width !== Math.round(width * renderer.getPixelRatio()) || canvas.height !== Math.round(height * renderer.getPixelRatio())) {
      renderer.setSize(width, height, false);
    }
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  }
  observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  function tick() {
    frame = requestAnimationFrame(tick);
    if (lost) return;
    try {
      const time = clock.getElapsedTime();
      if (!reduced) {
        titus.root.position.y = 1.02 + Math.sin(time * 1.6) * 0.035;
        titus.armR.rotation.x = -0.7 + Math.sin(time * 1.4) * 0.15;
        titus.mouth.scale.x = 0.7 + Math.abs(Math.sin(time * 6)) * 0.4;
        panel.material.emissiveIntensity = 0.55 + Math.sin(time * 3) * 0.2;
        const earth = scene.getObjectByName('fp-earth');
        if (earth) earth.rotation.y = time * 0.15;
      }
      renderer.render(scene, camera);
    } catch {
      lost = true;
      cancelAnimationFrame(frame);
    }
  }
  tick();
  return {
    dispose() {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      const materials = new Set();
      scene.traverse(object => {
        object.geometry?.dispose();
        [].concat(object.material || []).forEach(material => materials.add(material));
      });
      materials.forEach(material => material.dispose());
      renderer.dispose();
    },
  };
  } catch (error) {
    cancelAnimationFrame(frame);
    observer?.disconnect();
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
    renderer.dispose();
    throw error;
  }
}
