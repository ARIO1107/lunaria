import * as THREE from 'three';
import { PHOTO_BODIES, bodiesAt, gradePhoto, worldFromViewport } from '../game/photoShot.js';

// Planet maps from NASA 3D Resources. Free of copyright for educational use.
// https://github.com/nasa/NASA-3D-Resources
const mapsUrl = import.meta.env.BASE_URL + 'assets/planets/';

function starGlow() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const paint = canvas.getContext('2d');
  const glow = paint.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.18, 'rgba(255,236,196,0.95)');
  glow.addColorStop(1, 'rgba(255,236,196,0)');
  paint.fillStyle = glow;
  paint.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function startPhotoSky(canvas, { reduced = false, onReady, onGrade, onFail } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch {
    onFail?.();
    return { dispose() {} };
  }
  let disposed = false;
  let raf = 0;
  const bin = [];
  const keep = item => { bin.push(item); return item; };
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#070b14');
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
  camera.position.z = 5;

  const starCount = 80;
  const starPositions = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    starPositions[index * 3] = (Math.random() - 0.5) * 14;
    starPositions[index * 3 + 1] = (Math.random() - 0.5) * 2.4;
    starPositions[index * 3 + 2] = -1;
  }
  const starField = new THREE.BufferGeometry();
  starField.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  scene.add(new THREE.Points(starField, keep(new THREE.PointsMaterial({ color: '#d5e4ff', size: 1.6, sizeAttenuation: false }))));
  keep(starField);

  const meshes = new Map();
  const loader = new THREE.TextureLoader();
  let pending = PHOTO_BODIES.filter(body => body.map).length;
  const maps = new Map();

  function resize() {
    const width = canvas.clientWidth || 640;
    const height = canvas.clientHeight || 240;
    const aspect = width / Math.max(height, 1);
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    return aspect;
  }

  function begin() {
    if (disposed) return;
    const globe = keep(new THREE.SphereGeometry(1, 28, 20));
    for (const body of PHOTO_BODIES) {
      if (body.map) {
        const material = keep(new THREE.MeshBasicMaterial({ map: maps.get(body.id) }));
        const mesh = new THREE.Mesh(globe, material);
        scene.add(mesh);
        meshes.set(body.id, mesh);
      } else {
        const material = keep(new THREE.SpriteMaterial({ map: keep(starGlow()), transparent: true, depthWrite: false }));
        const sprite = new THREE.Sprite(material);
        scene.add(sprite);
        meshes.set(body.id, sprite);
      }
    }
    canvas.dataset.ready = 'si';
    onReady?.();
    let elapsed = 0;
    let last = performance.now();
    let previous = '';
    const tick = now => {
      if (disposed) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += reduced ? dt * 0.55 : dt;
      const aspect = resize();
      for (const body of bodiesAt(elapsed)) {
        const mesh = meshes.get(body.id);
        if (!mesh) continue;
        const place = worldFromViewport(body.x, body.y, aspect, body.radius);
        mesh.position.set(place.x, place.y, 0);
        if (body.map) {
          mesh.scale.setScalar(place.radius);
          mesh.rotation.y = elapsed * body.spin;
        } else {
          mesh.scale.set(place.radius * 2, place.radius * 2, 1);
        }
      }
      const grade = gradePhoto(elapsed, aspect);
      const key = grade.ok + grade.reason + grade.names.join();
      if (key !== previous) {
        previous = key;
        onGrade?.(grade);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function arrived() {
    pending -= 1;
    if (pending <= 0) begin();
  }

  for (const body of PHOTO_BODIES) {
    if (!body.map) continue;
    loader.load(mapsUrl + body.map, texture => {
      if (disposed) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      maps.set(body.id, keep(texture));
      arrived();
    }, undefined, () => onFail?.());
  }

  const onLost = event => { event.preventDefault(); disposed = true; onFail?.(); };
  canvas.addEventListener('webglcontextlost', onLost);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('webglcontextlost', onLost);
      for (const item of bin) item.dispose?.();
      renderer.dispose();
    },
  };
}
