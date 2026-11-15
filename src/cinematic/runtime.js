import * as THREE from 'three';
import { CINEMATIC_DURATION, cameraAt, castAt } from './script.js';
import { createCinematicWorld } from './sets.js';
import { applyCast } from './cast.js';
import { createScore } from './score.js';
import { loadGltf } from './models.js';

export function startCinematic(canvas, { quality = 'alto', reducedMotion = false, volume = .7, soundEnabled = true, initialTime = 0, models = null, onFrame, onComplete }) {
  const world = createCinematicWorld(quality);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: quality !== 'ajustado', alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(quality === 'ajustado' ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = quality === 'ajustado' ? 1.05 : 1.15;
  renderer.shadowMap.enabled = quality !== 'ajustado';
  const camera = new THREE.PerspectiveCamera(42, 1, .08, 400);
  const score = createScore({ volume, enabled: soundEnabled });
  const clock = new THREE.Clock();
  let elapsed = Math.min(CINEMATIC_DURATION, Math.max(0, initialTime || 0));
  let frames = 0;
  let cinematicFrames = 0;
  let fpsStamp = performance.now();
  let raf = 0;
  let done = false;
  let contextLost = false;
  let awake = elapsed > 20;
  const played = new Set();
  const resize = () => {
    const width = Math.max(1, canvas.clientWidth || window.innerWidth);
    const height = Math.max(1, canvas.clientHeight || window.innerHeight);
    renderer.setPixelRatio(quality === 'ajustado' ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    canvas.dataset.ratio = String(renderer.getPixelRatio());
  };
  const mark = () => {
    canvas.dataset.quality = quality;
    canvas.dataset.shadows = renderer.shadowMap.enabled ? '1' : '0';
    canvas.dataset.ratio = String(renderer.getPixelRatio());
    canvas.dataset.lost = contextLost ? '1' : '0';
  };
  const lost = event => { event.preventDefault(); contextLost = true; mark(); onFrame?.({ lost: true, time: elapsed }); };
  const restored = () => { contextLost = false; clock.getDelta(); mark(); onFrame?.({ lost: false, time: elapsed }); };
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  window.addEventListener('resize', resize);
  resize();
  mark();
  const present = [];
  let meshes = 0;
  world.scene.traverse(object => {
    if (object.name) present.push(object.name);
    if (object.isMesh && object.geometry?.getAttribute('position')?.count > 2) meshes += 1;
  });
  canvas.dataset.cast = ['Cinematic_Hull', 'Cinematic_Alex', 'Cinematic_Titus', 'visor'].filter(name => present.includes(name)).join(' ');
  canvas.dataset.meshes = String(meshes);
  if (models?.hull) {
    loadGltf(models.hull).then(gltf => {
      if (done) {
        gltf.scene.traverse(object => {
          object.geometry?.dispose();
          [].concat(object.material || []).forEach(material => {
            ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap'].forEach(key => material[key]?.dispose());
            material.dispose();
          });
        });
        return;
      }
      gltf.scene.name = 'loaded-hull';
      world.groups.exterior.add(gltf.scene);
    }).catch(() => onFrame?.({ loadError: 'No se pudo cargar un modelo de la cinemática.', time: elapsed }));
  }

  function finish(notify) {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('webglcontextlost', lost);
    canvas.removeEventListener('webglcontextrestored', restored);
    const geometries = new Set();
    const materials = new Set();
    world.scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      [].concat(object.material || []).forEach(material => materials.add(material));
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => {
      ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap'].forEach(key => material[key]?.dispose());
      material.dispose();
    });
    renderer.dispose();
    score.dispose();
    if (notify) onComplete?.();
  }

  function frame() {
    if (done) return;
    const dt = Math.min(clock.getDelta(), .05);
    if (contextLost) { raf = requestAnimationFrame(frame); return; }
    elapsed = Math.min(CINEMATIC_DURATION, elapsed + dt);
    const shot = cameraAt(elapsed);
    const cast = castAt(elapsed);
    const position = shot.position.slice();
    if (reducedMotion) {
      position[0] = shot.look[0] + (position[0] - shot.look[0]) * .45;
      position[1] = shot.look[1] + (position[1] - shot.look[1]) * .45 + .2;
      position[2] = shot.look[2] + (position[2] - shot.look[2]) * .45 + .8;
    }
    camera.position.set(...position);
    camera.lookAt(...shot.look);
    world.groups.exterior.visible = !cast.interior;
    world.groups.interior.visible = cast.interior;
    const inside = cast.interior;
    world.sun.castShadow = quality !== 'ajustado' && !inside;
    world.sun.intensity = inside ? 0.35 : 3.2;
    world.fill.intensity = inside ? 0.25 : 0.9;
    world.rim.intensity = inside ? 0.4 * cast.lights : (quality === 'ajustado' ? 0 : 0.75);
    world.hemi.intensity = inside ? 1.6 : 0.45;
    world.ambient.intensity = inside ? 2.4 * Math.max(cast.lights, .35) : 0;
    world.practical.intensity = inside ? 3.4 * cast.lights : 0;
    renderer.toneMappingExposure = inside ? 1.08 : (quality === 'ajustado' ? 1.05 : 1.12);
    world.stars.material.opacity = Math.min(1, elapsed / 3.5);
    world.cabin.intensity = cast.lights * 70;
    world.strips.forEach(bar => { bar.material.emissiveIntensity = .15 + cast.lights * 1.7; });
    world.holo.material.opacity = cast.hologram * .9;
    world.lamps.forEach((lamp, index) => { lamp.material.emissiveIntensity = .35 + ((Math.sin(elapsed * 3 + index) + 1) * .5); });
    if (!cast.interior) {
      world.moon.position.z = -34 + Math.min(elapsed, 18) * .08;
      world.earth.rotation.y = elapsed * .015;
    }
    world.cabinMoon.rotation.y = elapsed * .02;
    world.nav.red.intensity = Math.sin(elapsed * 3.2) > 0 ? 4 : .35;
    world.nav.green.intensity = Math.sin(elapsed * 3.2 + 1.4) > 0 ? 4 : .35;
    world.engines.forEach(engine => { engine.material.emissiveIntensity = .7 + Math.sin(elapsed * 9) * .35; });
    applyCast(world.astronaut, world.titus, cast, elapsed);
    score.setInterior(cast.interior);
    if (!awake && elapsed > 20) { awake = true; score.cue('wake'); }
    if (elapsed > 62 && !played.has('console')) { played.add('console'); score.cue('console'); }
    if (elapsed > 96 && !played.has('ready')) { played.add('ready'); score.cue('ready'); }
    renderer.render(world.scene, camera);
    frames += 1;
    cinematicFrames += 1;
    window.__lunariaCinematicFrames = cinematicFrames;
    const alex = world.astronaut;
    const titus = world.titus;
    canvas.dataset.pose = [alex.root.position.z, alex.legL.rotation.x, alex.head.rotation.y, titus.root.position.x, titus.root.position.z, titus.armR.rotation.x, titus.mouth.scale.x].map(value => value.toFixed(2)).join(' ');
    const now = performance.now();
    if (now - fpsStamp > 500) {
      canvas.dataset.fps = String(Math.round(frames * 1000 / (now - fpsStamp)));
      frames = 0;
      fpsStamp = now;
    }
    canvas.dataset.cinematic = 'ready';
    canvas.dataset.time = elapsed.toFixed(1);
    canvas.dataset.inside = cast.interior ? '1' : '0';
    canvas.dataset.cam = camera.position.toArray().map(value => value.toFixed(2)).join(' ');
    onFrame?.({ time: elapsed, fps: Number(canvas.dataset.fps || 0), lost: contextLost });
    if (elapsed >= CINEMATIC_DURATION) finish(true);
    else raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return {
    finish: () => finish(true),
    dispose: () => finish(false),
    seek(time) { elapsed = Math.min(CINEMATIC_DURATION - .05, Math.max(0, time)); },
  };
}
