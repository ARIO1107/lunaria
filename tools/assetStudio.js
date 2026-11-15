import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createAstronaut, createTitus } from '../art/models.js';
import { createShip, createProps } from '../art/ship.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
document.getElementById('stage').appendChild(renderer.domElement);
const pmrem = new THREE.PMREMGenerator(renderer);
const env = pmrem.fromScene(new RoomEnvironment(), .04).texture;

function setup(large = false) {
  const scene = new THREE.Scene(); scene.environment = env; scene.environmentIntensity = .55;
  scene.add(new THREE.HemisphereLight('#d9edf4', '#263643', 1.3));
  const sun = new THREE.DirectionalLight('#ffead0', 2.8);
  sun.position.set(large ? -100 : -80, large ? 700 : 160, large ? 200 : 100);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: large ? -750 : -100, right: large ? 750 : 100, top: large ? 750 : 100, bottom: large ? -750 : -100, near: 1, far: 2000 });
  sun.shadow.bias = -.0004; sun.shadow.normalBias = .7;
  if (large) { sun.target.position.set(500, 0, 300); scene.add(sun.target); }
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#95c4e8', 1.3); fill.position.set(100, 60, -100); scene.add(fill);
  return scene;
}
function makeCamera(width, height, large = false) {
  const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 1, 3000);
  if (large) { camera.position.set(500, 1000, 1000); camera.lookAt(500, 0, 300); }
  else { camera.position.set(0, 154, 105); camera.lookAt(0, 36, 0); }
  camera.updateMatrixWorld(); return camera;
}
function project(camera, x, z, width, height) {
  const p = new THREE.Vector3(x, 0, z).project(camera);
  return { x: (p.x + 1) * width / 2, y: (1 - p.y) * height / 2 };
}
const actors = { astronaut: createAstronaut(), titus: createTitus() };
const actorScene = setup(); const actorCamera = makeCamera(96, 120);
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), new THREE.ShadowMaterial({ opacity: .3 }));
shadow.rotation.x = -Math.PI / 2; shadow.receiveShadow = true; actorScene.add(shadow);
let displayed;
function selectActor(name) {
  if (displayed) actorScene.remove(displayed);
  displayed = actors[name].root; actorScene.add(displayed);
}

window.assetStudio = {
  atlas(name) {
    selectActor(name);
    const frameW = 160, frameH = 200, cols = name === 'astronaut' ? 9 : 8, moods = name === 'titus' ? ['normal', 'alert', 'danger'] : ['normal'];
    const canvas = document.createElement('canvas'); canvas.width = frameW * cols; canvas.height = frameH * 8 * moods.length;
    const ctx = canvas.getContext('2d'); renderer.setSize(frameW, frameH);
    for (let mood = 0; mood < moods.length; mood++) for (let direction = 0; direction < 8; direction++) for (let frame = 0; frame < cols; frame++) {
      const phase = name === 'astronaut' ? Math.max(0, frame - 1) / 8 : frame / 8;
      actors[name].pose(direction * Math.PI / 4, phase, name === 'astronaut' ? frame > 0 : moods[mood]);
      renderer.render(actorScene, actorCamera);
      ctx.drawImage(renderer.domElement, frame * frameW, (mood * 8 + direction) * frameH);
    }
    const anchor = project(actorCamera, 0, 0, 96, 120);
    return { image: canvas.toDataURL('image/png'), meta: { frameW, frameH, cols, directions: 8, moods, logicalW: 96, logicalH: 120, anchor } };
  },
  portrait(name) {
    selectActor(name); actors[name].pose(-.35, 0, name === 'astronaut' ? false : 'normal');
    const camera = makeCamera(105, 105); camera.position.set(85, 86, 180); camera.lookAt(0, 39, 0); camera.updateMatrixWorld();
    renderer.setSize(768, 768); renderer.render(actorScene, camera); return renderer.domElement.toDataURL('image/png');
  },
  ship() {
    const scene = setup(true), camera = makeCamera(1120, 720, true), deck = createShip(); scene.add(deck);
    renderer.setSize(2240, 1440); renderer.render(scene, camera);
    const image = renderer.domElement.toDataURL('image/png');
    const origin = project(camera, 0, 0, 1120, 720), px = project(camera, 1, 0, 1120, 720), py = project(camera, 0, 1, 1120, 720);
    scene.remove(deck);
    const floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(1200, 800), new THREE.ShadowMaterial({ opacity: .28 }));
    floorShadow.rotation.x = -Math.PI / 2; floorShadow.position.set(500, .3, 300); floorShadow.receiveShadow = true; scene.add(floorShadow);
    const props = createProps().map(prop => {
      scene.add(prop.root); renderer.render(scene, camera);
      const canvas = document.createElement('canvas'); canvas.width = 2240; canvas.height = 1440;
      const ctx = canvas.getContext('2d'); ctx.drawImage(renderer.domElement, 0, 0);
      const pixels = ctx.getImageData(0, 0, 2240, 1440).data;
      let minX = 2240, minY = 1440, maxX = 0, maxY = 0;
      for (let y = 0; y < 1440; y++) for (let x = 0; x < 2240; x++) if (pixels[(y * 2240 + x) * 4 + 3] > 0) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
      const crop = document.createElement('canvas'); crop.width = maxX - minX + 1; crop.height = maxY - minY + 1;
      crop.getContext('2d').drawImage(canvas, minX, minY, crop.width, crop.height, 0, 0, crop.width, crop.height);
      scene.remove(prop.root);
      return { id: prop.id, depth: prop.depth, image: crop.toDataURL('image/png'), x: minX / 2, y: minY / 2, w: crop.width / 2, h: crop.height / 2 };
    });
    return { image, props, meta: { width: 1120, height: 720, origin, axisX: { x: px.x - origin.x, y: px.y - origin.y }, axisY: { x: py.x - origin.x, y: py.y - origin.y } } };
  },
  async glb(name) {
    let root;
    if (name === 'ship') { root = createShip(); createProps().forEach(p => root.add(p.root)); }
    else { root = actors[name].root; actors[name].pose(0, 0, name === 'astronaut' ? false : 'normal'); }
    const data = await new GLTFExporter().parseAsync(root, { binary: true });
    const bytes = new Uint8Array(data); let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  },
};

let preview = 'astronaut', frame = 0, baking = false;
for (const name of ['astronaut', 'titus', 'ship']) document.getElementById(name).onclick = () => { preview = name; };
const deckScene = setup(true); deckScene.add(createShip()); createProps().forEach(p => deckScene.add(p.root));
const deckCamera = makeCamera(1120, 720, true);
selectActor(preview);
function loop() {
  if (!baking) {
    if (preview === 'ship') { renderer.setSize(1120, 720); renderer.render(deckScene, deckCamera); }
    else {
      selectActor(preview); renderer.setSize(600, 600);
      const camera = makeCamera(115, 115); camera.position.set(70, 110, 170); camera.lookAt(0, 37, 0);
      actors[preview].pose(Math.sin(frame * .006) * .5, frame / 100, preview === 'astronaut' ? false : 'normal'); renderer.render(actorScene, camera);
    }
    frame++;
  }
  requestAnimationFrame(loop);
}
window.assetStudio.pause = () => { baking = true; };
loop();
