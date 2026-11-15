import * as THREE from 'three';
import { cameraAt, castAt, durationOf, launchAltitude, launchCameraLift, launchSky } from './script.js';
import { createCinematicWorld } from './sets.js';
import { applyCast } from './cast.js';
import { createScore } from './score.js';
import { loadGltf } from './models.js';

export function startCinematic(canvas, { sequence = 'opening', quality = 'alto', reducedMotion = false, volume = .7, soundEnabled = true, initialTime = 0, models = null, onFrame, onComplete }) {
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
  const duration = durationOf(sequence);
  let elapsed = Math.min(duration, Math.max(0, initialTime || 0));
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
    elapsed = Math.min(duration, elapsed + dt);
    const shot = cameraAt(elapsed, sequence);
    const cast = castAt(elapsed, sequence);
    const orbit = sequence === 'launch' && elapsed >= 46;
    const altitude = sequence === 'launch' ? launchAltitude(elapsed) : 0;
    const lift = sequence === 'launch' ? launchCameraLift(elapsed) : 0;
    const look = shot.look.slice();
    const position = shot.position.slice();
    if (!cast.interior && lift) {
      position[1] += lift;
      look[1] += lift;
    }
    if (reducedMotion) {
      position[0] = look[0] + (position[0] - look[0]) * .45;
      position[1] = look[1] + (position[1] - look[1]) * .45 + .2;
      position[2] = look[2] + (position[2] - look[2]) * .45 + .8;
    }
    const burning = sequence === 'launch' && elapsed >= 11.5 && elapsed < 46;
    if (burning && !cast.interior && !reducedMotion) {
      const amp = elapsed < 16 ? 0.035 : 0.07;
      position[0] += Math.sin(elapsed * 47) * amp;
      position[1] += Math.cos(elapsed * 38) * amp * 0.6;
    }
    camera.position.set(...position);
    camera.lookAt(...look);
    world.groups.exterior.visible = !cast.interior;
    world.groups.interior.visible = cast.interior;
    world.pad.visible = !orbit;
    world.earth.visible = orbit;
    world.stars.material.opacity = orbit ? 1 : 0;
    world.rocket.position.y = orbit ? 0 : altitude;
    world.rocket.rotation.y = orbit ? Math.sin(elapsed * 0.25) * 0.12 : 0;
    if (sequence === 'launch' && elapsed >= 40 && elapsed < 46) {
      const separation = (elapsed - 40) / 5;
      world.booster.position.set(separation * 2.2, -separation * 12, separation * 1.4);
    } else world.booster.position.set(0, 0, 0);
    const released = sequence === 'launch' ? Math.min(1, Math.max(0, (elapsed - 15.6) / 0.9)) : 0;
    world.clamps.forEach((arm, index) => { arm.rotation.z = (index === 0 ? -1 : 1) * released * 1.05; });
    world.gantry.rotation.y = released * 1.15;
    world.plumes.forEach((plume, index) => {
      plume.visible = burning;
      const flicker = 0.85 + Math.sin(elapsed * 34 + index) * 0.16;
      plume.scale.set(flicker, (elapsed < 16 ? 0.7 : 1.55) * flicker, flicker);
    });
    world.smoke.visible = burning && !cast.interior;
    if (burning) {
      const attr = world.smoke.geometry.getAttribute('position');
      world.smoke.userData.seeds.forEach((seed, index) => {
        const life = (elapsed * (0.8 + seed) + seed * 5) % 3.2;
        const spread = 1.2 + life * 1.15;
        attr.setXYZ(index, Math.sin(seed * 12 + elapsed * 2) * spread, 0.15 + life * 0.85, Math.cos(seed * 9) * spread);
      });
      attr.needsUpdate = true;
    }
    const sky = sequence === 'launch' ? launchSky(elapsed) : 0;
    const backdrop = orbit ? world.colors.space : sky <= 0 ? world.colors.dawn : world.colors.dawn.clone().lerp(world.colors.high, Math.min(1, sky)).lerp(world.colors.space, Math.max(0, (sky - 0.62) / 0.38));
    world.scene.background.copy(backdrop);
    world.scene.fog.color.copy(orbit ? world.colors.space : sky > 0.2 ? backdrop : world.colors.haze);
    world.scene.fog.near = orbit ? 20 : 28;
    world.scene.fog.far = orbit ? 180 : 130 - sky * 40;
    world.clouds.children.forEach(cloud => { cloud.material.opacity = orbit ? 0 : 0.92 * (1 - sky); });
    if (world.sun.castShadow) {
      world.sun.position.set(22, 14 + (orbit ? 0 : altitude), 16);
      world.sun.target.position.set(0, orbit ? 4 : altitude + 6, 0);
      world.sun.target.updateMatrixWorld();
    }
    const inside = cast.interior;
    world.sun.castShadow = quality !== 'ajustado' && !inside;
    world.sun.intensity = inside ? 0.35 : orbit ? 2.4 : 2.6;
    world.fill.intensity = inside ? 0.25 : 0.55;
    world.rim.intensity = inside ? 0.4 * cast.lights : (quality === 'ajustado' ? 0 : 0.45);
    world.hemi.intensity = inside ? 1.6 : orbit ? 0.35 : 0.85;
    world.ambient.intensity = inside ? 2.4 * Math.max(cast.lights, .35) : orbit ? 0.2 : 0.15;
    world.practical.intensity = inside ? 3.4 * cast.lights : 0;
    renderer.toneMappingExposure = inside ? 1.08 : (quality === 'ajustado' ? 1.05 : 1.12);
    world.cabin.intensity = cast.lights * 70;
    world.strips.forEach(bar => { bar.material.emissiveIntensity = .15 + cast.lights * 1.7; });
    world.holo.material.opacity = cast.hologram * .9;
    world.lamps.forEach((lamp, index) => { lamp.material.emissiveIntensity = .35 + ((Math.sin(elapsed * 3 + index) + 1) * .5) * (sequence === 'launch' && elapsed > 3 && elapsed < 16 ? 1.8 : 1); });
    if (orbit) world.earth.rotation.y = elapsed * .02;
    world.nav.red.intensity = Math.sin(elapsed * 3.2) > 0 ? 4 : .35;
    world.nav.green.intensity = Math.sin(elapsed * 3.2 + 1.4) > 0 ? 4 : .35;
    world.engines.forEach(engine => { engine.material.emissiveIntensity = burning ? 2.4 + Math.sin(elapsed * 28) * 0.5 : 0.2; });
    world.engineLight.intensity = burning ? 36 + Math.sin(elapsed * 31) * 8 : 0;
    applyCast(world.astronaut, world.titus, cast, elapsed, sequence);
    score.setInterior(cast.interior);
    if (sequence === 'launch') {
      score.setMood(elapsed < 13 ? 'tension' : elapsed < 46 ? 'ascent' : 'triumph');
      const second = Math.floor(elapsed);
      if (elapsed >= 3 && elapsed < 13 && !played.has('tick' + second)) { played.add('tick' + second); score.cue('tick'); }
      if (elapsed > 12.2 && !played.has('ignite')) { played.add('ignite'); score.cue('ignite'); }
      if (elapsed > 49 && !played.has('triumph')) { played.add('triumph'); score.cue('triumph'); }
      score.setBurn(burning && elapsed < 44 ? (elapsed < 16 ? 0.45 : 0.9) : 0);
    } else {
      score.setMood('pad');
      score.setBurn(0);
      if (!awake && elapsed > 20) { awake = true; score.cue('wake'); }
      if (elapsed > 42 && !played.has('console')) { played.add('console'); score.cue('console'); }
      if (elapsed > 69 && !played.has('ready')) { played.add('ready'); score.cue('ready'); }
    }
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
    canvas.dataset.sequence = sequence;
    canvas.dataset.time = elapsed.toFixed(1);
    canvas.dataset.inside = cast.interior ? '1' : '0';
    canvas.dataset.backdrop = orbit ? 'orbit' : sky > 0.15 ? 'ascent' : 'pad';
    canvas.dataset.altitude = altitude.toFixed(1);
    canvas.dataset.cam = camera.position.toArray().map(value => value.toFixed(2)).join(' ');
    onFrame?.({ time: elapsed, fps: Number(canvas.dataset.fps || 0), lost: contextLost });
    if (elapsed >= duration) finish(true);
    else raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return {
    finish: () => finish(true),
    dispose: () => finish(false),
    seek(time) { elapsed = Math.min(duration - .05, Math.max(0, time)); },
  };
}
