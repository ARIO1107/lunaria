import * as T from 'three';

const material = (color, metalness = .25) => new T.MeshStandardMaterial({ color, metalness, roughness: .5 });
const glow = color => new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .7, roughness: .35 });
const M = {
  hull: material('#aab4b0'), desk: material('#34444d'), dark: material('#141f27'),
  blue: material('#297c9f'), yellow: material('#d6a044'), red: material('#ac4337'),
  metal: material('#929fa5', .7), white: material('#e7e3d3'), space: glow('#1a2734'),
  screen: glow('#153a47'), cyan: glow('#69d7cf'), amber: glow('#eea942'),
  warning: glow('#df6250'), light: glow('#d2e8ff'),
};

function group(parent, name, x = 0, y = 0, z = 0) {
  const node = new T.Group();
  node.name = name;
  node.position.set(x, y, z);
  parent.add(node);
  return node;
}

function mesh(parent, name, geo, mat, x, y, z) {
  const node = new T.Mesh(geo, mat);
  node.name = name;
  node.position.set(x, y, z);
  parent.add(node);
  return node;
}

const box = (p, n, mat, x, y, z, w, h, d) => mesh(p, n, new T.BoxGeometry(w, h, d), mat, x, y, z);

function cylinder(p, n, mat, x, y, z, r, h, front = false) {
  const node = mesh(p, n, new T.CylinderGeometry(r, r, h, 24), mat, x, y, z);
  if (front) node.rotation.x = Math.PI / 2;
  return node;
}

function tube(p, name, mat, points, r = .018) {
  const vertices = points.map(point => new T.Vector3(...point));
  const path = new T.CurvePath();
  for (let index = 1; index < vertices.length; index++) path.add(new T.LineCurve3(vertices[index - 1], vertices[index]));
  return mesh(p, name, new T.TubeGeometry(path, Math.max(8, vertices.length * 4), r, 8, false), mat, 0, 0, 0);
}

function control(p, name, x, y, z, color = M.cyan) {
  const node = group(p, name, x, y, z);
  cylinder(node, 'bezel', M.metal, 0, 0, 0, .052, .025, true);
  cylinder(node, 'cap', color, 0, 0, .018, .039, .02, true);
  return node;
}

function dial(p, name, x, y, z, radius = .105) {
  const node = group(p, name, x, y, z);
  cylinder(node, 'rim', M.metal, 0, 0, 0, radius, .03, true);
  cylinder(node, 'face', M.dark, 0, 0, .017, radius * .91, .012, true);
  for (let i = 0; i < 9; i++) {
    const angle = .8 + i * .49;
    const tick = box(node, 'tick-' + i, i > 6 ? M.amber : M.white,
      Math.sin(angle) * radius * .74, -Math.cos(angle) * radius * .74, .026, .008, .017, .004);
    tick.rotation.z = angle;
  }
  const pivot = group(node, 'needle-pivot', 0, 0, .031);
  box(pivot, 'needle', M.amber, 0, radius * .31, 0, .012, radius * .64, .008);
  cylinder(node, 'hub', M.metal, 0, 0, .038, .014, .008, true);
  return node;
}

function display(p, name, x, y, z, w, h) {
  const node = group(p, name, x, y, z);
  box(node, 'frame', M.dark, 0, 0, 0, w + .045, h + .045, .05);
  box(node, 'glass', M.screen, 0, 0, .027, w, h, .012);
  for (let i = 1; i < 5; i++) box(node, 'grid-' + i, M.blue, -w * .5 + i * w / 5, 0, .034, .003, h * .9, .002);
  return node;
}

function glove(camera, side) {
  const hand = group(camera, side < 0 ? 'Alex-left-glove' : 'Alex-right-glove', side * .34, -.26, -.74);
  hand.rotation.set(-.22, -side * .19, side * .12);
  cylinder(hand, 'sleeve', M.white, 0, -.035, .19, .079, .27, true);
  cylinder(hand, 'cuff', M.yellow, 0, -.035, .067, .082, .04, true);
  box(hand, 'palm', M.white, 0, -.028, -.01, .135, .081, .15);
  box(hand, 'knuckle-shell', M.dark, 0, .011, -.035, .112, .022, .091);
  for (let i = 0; i < 4; i++) {
    const finger = mesh(hand, 'finger-' + i, new T.CapsuleGeometry(.018, .061, 4, 8), M.white, -.046 + i * .031, -.036, -.103);
    finger.rotation.x = Math.PI / 2;
  }
  const thumb = mesh(hand, 'thumb', new T.CapsuleGeometry(.022, .044, 4, 8), M.white, -side * .072, -.045, -.036);
  thumb.rotation.set(1.35, 0, -side * .5);
}

function cabin(scene, mode) {
  const frame = group(scene, 'Lunaria-cabin');
  box(frame, 'floor', M.dark, 0, 0, -.25, 4.1, .12, 4);
  box(frame, 'aft-bulkhead', M.desk, 0, 1.28, -2.02, 4.1, 2.45, .16);
  for (const side of [-1, 1]) {
    box(frame, 'column', M.hull, side * 1.34, 1.32, -1.81, .19, 2.4, .31);
    box(frame, 'wall-recess', M.dark, side * 1.72, 1.3, -1.85, .42, 2.2, .19);
    box(frame, 'utility-light', M.light, side * 1.29, 1.67, -1.63, .036, .66, .025);
    box(frame, 'side-console', M.hull, side * .98, .79, -.92, .12, .92, .5);
  }
  box(frame, 'ceiling-bulkhead', M.hull, 0, 2.42, -1.65, 2.8, .18, .64);
  const window = group(frame, 'forward-viewport', 0, 1.99, -1.89);
  box(window, 'window-frame', M.dark, 0, 0, 0, 1.96, .56, .16);
  box(window, 'outside-color', mode === 'launch' ? M.space : M.blue, 0, 0, .085, 1.81, .42, .022);
  box(window, 'horizon', mode === 'launch' ? M.blue : M.hull, 0, -.15, .099, 1.8, .078, .012);
  for (const x of [-.59, 0, .59]) box(window, 'strut', M.dark, x, 0, .11, .034, .45, .032);
  box(frame, 'center-desk', M.desk, 0, .86, -.82, 2.03, .12, .81);
  box(frame, 'control-surface', M.hull, 0, .93, -.71, 1.91, .052, .69);
  box(frame, 'front-safety-trim', M.yellow, 0, .92, -.359, 1.77, .026, .018);
  box(frame, 'instrument-housing', M.desk, 0, 1.27, -1.12, 1.94, .62, .23);
  box(frame, 'instrument-face', M.dark, 0, 1.27, -.994, 1.84, .53, .028);
}

function air(p) {
  for (const [index, x] of [-.72, -.52].entries()) {
    cylinder(p, 'oxygen-tank-' + index, M.blue, x, 1.25, -.88, .075, .38);
    cylinder(p, 'tank-neck', M.metal, x, 1.457, -.88, .04, .05);
    tube(p, 'supply-line-' + index, M.cyan, [[x, 1.48, -.88], [x, 1.5, -.83], [-.36, 1.5, -.83], [-.36, 1.37, -.83]]);
  }
  const valve = group(p, 'oxygen-valve', -.32, 1.31, -.843);
  cylinder(valve, 'axis', M.metal, 0, 0, 0, .034, .08, true);
  mesh(valve, 'wheel', new T.TorusGeometry(.06, .014, 8, 24), M.red, 0, 0, .053);
  for (let index = 0; index < 3; index++) box(valve, 'spoke-' + index, M.red, 0, 0, .055, .11, .012, .012).rotation.z = index * Math.PI / 3;
  const fan = group(p, 'air-fan', -.015, 1.28, -.866);
  cylinder(fan, 'frame', M.metal, 0, 0, 0, .125, .08, true);
  cylinder(fan, 'recess', M.dark, 0, 0, .043, .101, .01, true);
  const motor = group(fan, 'rotor', 0, 0, .054);
  for (let i = 0; i < 5; i++) {
    const blade = group(motor, 'blade-' + i);
    blade.rotation.z = i * Math.PI * 2 / 5;
    box(blade, 'vane', M.blue, .047, 0, 0, .071, .026, .012).rotation.z = .42;
  }
  cylinder(motor, 'hub', M.metal, 0, 0, 0, .03, .026, true);
  const scrubber = group(p, 'co2-scrubber', .3, 1.26, -.866);
  box(scrubber, 'cartridge', M.hull, 0, 0, 0, .18, .26, .16);
  for (let i = 0; i < 5; i++) box(scrubber, 'vent-' + i, M.dark, 0, -.075 + i * .034, .083, .12, .012, .008);
  box(scrubber, 'handle', M.yellow, 0, .11, .11, .11, .024, .036);
  dial(p, 'air-quality', .65, 1.31, -.945);
  control(p, 'test-air-loop', .63, 1.06, -.934);
}

function power(p) {
  for (const [i, x] of [-.7, -.43].entries()) {
    const source = group(p, i ? 'backup-bus' : 'main-bus', x, 1.3, -.89);
    box(source, 'battery-shell', i ? M.yellow : M.blue, 0, 0, 0, .2, .37, .14);
    for (const y of [-.1, .1]) control(source, y > 0 ? 'positive' : 'negative', 0, y, .08, i ? M.amber : M.cyan);
  }
  for (const [i, label] of ['life-support', 'navigation', 'lighting'].entries()) {
    const x = .02 + i * .31;
    const port = group(p, label + '-load', x, 1.29, -.901);
    box(port, 'socket-panel', M.metal, 0, 0, 0, .19, .27, .13);
    control(port, 'main-socket', 0, .072, .07, M.blue);
    control(port, 'backup-socket', 0, -.072, .07, M.yellow);
    control(p, label + '-circuit-lamp', x, 1.5, -.937, i === 2 ? M.amber : M.cyan);
  }
  for (const [i, x] of [-.54, -.15, .24].entries()) {
    const tone = i === 1 ? M.amber : M.cyan;
    tube(p, 'patch-cable-' + i, tone, [[x, .997, -.73], [x + .08, 1.02, -.57], [x + .24, 1.02, -.55], [x + .31, 1.01, -.74]]);
    for (const [dx, z] of [[0, -.73], [.31, -.74]]) cylinder(p, 'plug', M.metal, x + dx, 1.005, z, .029, .06);
  }
}

function fuel(p) {
  for (const [i, x] of [-.65, -.4].entries()) {
    const node = group(p, ['tank-a', 'tank-b'][i], x, 1.27, -.881);
    box(node, 'level-frame', M.metal, 0, 0, 0, .16, .43, .09);
    box(node, 'level-channel', M.dark, 0, 0, .05, .106, .364, .015);
    for (let b = 0; b < 8; b++) box(node, 'level-' + b, b < 6 - i ? M.cyan : M.screen, 0, -.148 + b * .042, .062, .073, .022, .009);
    tube(p, 'tank-feed-' + i, M.metal, [[x, 1.055, -.826], [x, 1.005, -.79], [.14, 1.005 + i * .029, -.79], [.14, 1.18, -.79]]);
  }
  dial(p, 'line-pressure', .19, 1.36, -.917, .126);
  dial(p, 'pressure-hold', .58, 1.36, -.917, .126);
  control(p, 'isolate-branch-a', -.65, 1.5, -.839, M.amber);
  control(p, 'isolate-branch-b', -.39, 1.5, -.839, M.amber);
  control(p, 'pressure-test', .56, 1.08, -.898);
}

function clearance(p) {
  const radio = display(p, 'control-radio', -.35, 1.3, -.919, .7, .31);
  for (let i = 0; i < 17; i++) {
    const height = .023 + Math.abs(Math.sin(i * 1.69) * Math.sin(i * .52)) * .21;
    box(radio, 'wave-' + i, M.cyan, -.305 + i * .038, 0, .038, .013, height, .008);
  }
  for (const [i, name] of ['air-status', 'power-status', 'fuel-status'].entries()) {
    const x = .22 + i * .23;
    control(p, name, x, 1.36, -.925, i === 2 ? M.amber : M.cyan);
    box(p, 'status-plate', M.metal, x, 1.246, -.946, .13, .03, .021);
  }
  const mic = group(p, 'push-to-talk-handset', .38, 1.017, -.53);
  mic.rotation.y = -.24;
  box(mic, 'handset', M.dark, 0, 0, 0, .42, .095, .16);
  for (let i = 0; i < 5; i++) box(mic, 'grille-' + i, M.metal, -.156 + i * .035, .05, .008, .013, .008, .086);
  box(mic, 'ptt-button', M.yellow, .13, .054, .018, .085, .024, .07);
  tube(p, 'handset-cord', M.dark, [[.575, 1.016, -.51], [.71, 1.01, -.54], [.74, 1.03, -.75], [.68, 1.1, -.93]]);
}

function launch(p) {
  const panel = display(p, 'max-q-display', -.28, 1.34, -.921, .8, .3);
  const trace = Array.from({ length: 18 }, (_, i) => [-.36 + i * .042, -.084 + Math.exp(-((i - 8) ** 2) / 15) * .178, .043]);
  tube(panel, 'load-trace', M.cyan, trace, .007);
  box(panel, 'load-limit', M.amber, 0, .06, .041, .73, .007, .004);
  dial(p, 'acceleration', .36, 1.35, -.925, .119);
  dial(p, 'flight-time', .67, 1.35, -.925, .099);
  const throttle = group(p, 'throttle', -.42, .99, -.64);
  box(throttle, 'track', M.dark, 0, .008, 0, .35, .039, .34);
  for (const x of [-.118, .118]) box(throttle, 'rail', M.metal, x, .035, 0, .024, .016, .28);
  const lever = group(throttle, 'lever-slide', 0, .04, .056);
  for (const x of [-.078, .078]) box(lever, 'lever-arm', M.metal, x, .065, 0, .032, .14, .04);
  cylinder(lever, 'grip', M.yellow, 0, .142, 0, .05, .23).rotation.z = Math.PI / 2;
  for (const [i, name] of ['ignition', 'center-cutoff', 'stage-separation'].entries()) {
    const button = control(p, name, .1 + i * .265, .988, -.59, i ? M.amber : M.warning);
    button.rotation.x = -Math.PI / 2;
    const guard = group(button, 'safety-guard-hinge', 0, .046, .013);
    box(guard, 'guard-left', M.red, -.065, -.045, .034, .013, .102, .063);
    box(guard, 'guard-right', M.red, .065, -.045, .034, .013, .102, .063);
    box(guard, 'guard-crossbar', M.red, 0, .003, .044, .14, .017, .054);
  }
}

export const level1Models = {
  '01-life-support': air, '02-power': power, '03-propulsion': fuel,
  '04-clearance': clearance, '05-launch': launch,
};

export function createLevel1Scene(id) {
  const build = level1Models[id];
  if (!build) throw new Error('Unknown level-one console: ' + id);
  const scene = new T.Scene();
  scene.name = 'Lunaria_' + id;
  scene.background = new T.Color('#10212d');
  cabin(scene, id === '05-launch' ? 'launch' : 'pad');
  build(group(scene, 'Mission-controls'));
  const camera = new T.PerspectiveCamera(53, 16 / 9, .05, 30);
  camera.name = 'Alex-POV';
  camera.position.set(0, 1.62, .69);
  camera.lookAt(0, 1.25, -1);
  scene.add(camera);
  glove(camera, -1);
  glove(camera, 1);
  scene.add(new T.HemisphereLight('#dcefff', '#323344', 2.1));
  const key = new T.DirectionalLight('#fff2d4', 2.3);
  key.name = 'Cabin-key';
  key.position.set(-2, 3, 2);
  key.lookAt(0, 0, 0);
  key.target.position.set(0, 0, -1);
  key.add(key.target);
  scene.add(key);
  return { scene, camera };
}

