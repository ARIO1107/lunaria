import * as THREE from 'three';
import { ROOMS, CORRIDORS, STATIONS, FURNITURE } from '../src/game/world.js';
import { materials } from './palette.js';
import { rounded, cylinder, ellipsoid } from './models.js';

function pipe(parent, start, end, radius, material) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end), vector = b.clone().sub(a);
  const mesh = cylinder(parent, radius, vector.length(), a.clone().add(b).multiplyScalar(.5).toArray(), material);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.normalize());
  return mesh;
}
function label(parent, value, position, width, height, color = '#b9d4d0', back = '#263940') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = back; ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '500 46px Arial'; ctx.fillText(value, 256, 64);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture }));
  mesh.position.set(...position); parent.add(mesh); return mesh;
}

export function createShip() {
  const root = new THREE.Group(); root.name = 'Lunaria_Deck'; const m = materials();
  for (const r of ROOMS) {
    rounded(root, [r.w + 18, 18, r.h + 18], [r.x + r.w / 2, -12, r.y + r.h / 2], m.dark, 7);
    rounded(root, [r.w, 4, r.h], [r.x + r.w / 2, -2, r.y + r.h / 2], m.floor, 5);
    // Panel seams, raised thresholds and fasteners are actual geometry, not painted shadows.
    for (let x = r.x + 4; x < r.x + r.w - 12; x += 32) for (let z = r.y + 4; z < r.y + r.h - 12; z += 32) {
      const w = Math.min(29, r.x + r.w - 4 - x), h = Math.min(29, r.y + r.h - 4 - z);
      rounded(root, [w, .7, h], [x + w / 2, .1, z + h / 2], m.tile, .8);
      if ((Math.round(x) + Math.round(z)) % 3 === 0) rounded(root, [7, .3, 1], [x + 6, .6, z + 3], m.frame, .1);
    }
    // Rear wall is a real open window assembly; the background shows through it.
    rounded(root, [r.w + 8, 12, 9], [r.x + r.w / 2, 6, r.y - 3], m.hull, 2);
    rounded(root, [r.w + 8, 9, 12], [r.x + r.w / 2, 67, r.y - 3], m.hull, 2);
    for (let x = r.x; x <= r.x + r.w; x += r.w / 3) {
      rounded(root, [8, 64, 12], [x, 34, r.y - 3], m.frame, 2);
      rounded(root, [2, 38, 1], [x + 2, 35, r.y + 3.5], m.light, .4);
    }
    rounded(root, [r.w - 10, 49, 1], [r.x + r.w / 2, 37, r.y - 4], m.glass, .2);
    // Side walls stop at the corridor openings; front walls are intentionally cut away.
    for (const x of [r.x - 3, r.x + r.w + 3]) {
      for (const [start, end] of [[r.y, 263], [347, r.y + r.h]]) {
        if (end <= start) continue;
        rounded(root, [8, 26, end - start], [x, 13, (start + end) / 2], m.hull, 2);
        rounded(root, [2, 3, end - start - 6], [x, 28, (start + end) / 2], m.light, .6);
      }
    }
    rounded(root, [r.w + 8, 9, 8], [r.x + r.w / 2, 4.5, r.y + r.h + 3], m.frame, 2);
    rounded(root, [r.w - 12, 1.5, 2], [r.x + r.w / 2, 9.5, r.y + r.h + 3], m.light, .3);
    pipe(root, [r.x + 14, 73, r.y - 10], [r.x + r.w - 14, 73, r.y - 10], 2.4, m.gold);
    label(root, r.id === 'cockpit' ? 'COMMAND' : r.id === 'systems' ? 'LIFE SUPPORT' : 'AIRLOCK', [r.x + r.w / 2, 67, r.y + 3.2], 90, 8, '#273c42', '#b1bcba');
    // Floor wayfinding plates.
    const floorLabel = label(root, r.id === 'cockpit' ? 'CABINA' : r.id === 'systems' ? 'SISTEMAS' : 'ESCLUSA', [r.x + r.w / 2, 1, r.y + r.h - 34], 100, 19, '#d4e3df', '#50636b');
    floorLabel.rotation.x = -Math.PI / 2;
  }
  for (const r of CORRIDORS) {
    rounded(root, [r.w + 12, 9, r.h], [r.x + r.w / 2, -4, r.y + r.h / 2], m.dark, 2);
    rounded(root, [r.w + 12, 1, r.h - 6], [r.x + r.w / 2, .5, r.y + r.h / 2], m.floor, 1);
    for (let x = r.x; x < r.x + r.w; x += 9) {
      rounded(root, [4, 1, 9], [x, 1, r.y + 5], m.amber, .2);
      rounded(root, [4, 1, 9], [x, 1, r.y + r.h - 5], m.amber, .2);
    }
    for (const x of [r.x + 5, r.x + r.w - 5]) {
      for (const z of [r.y - 1, r.y + r.h + 1]) rounded(root, [7, 52, 7], [x, 26, z], m.frame, 1);
      // No overhead lintel: keeps the astronaut visible while crossing.
      for (const z of [r.y + 4, r.y + r.h - 4]) rounded(root, [2, 32, 2], [x, 25, z], m.green, .5);
    }
  }
  // Equipment along room edges, clear of the navigation corridor.
  for (let i = 0; i < 3; i++) {
    cylinder(root, 8, 37, [365 + i * 24, 20, 435], m.trim);
    cylinder(root, 8.5, 5, [365 + i * 24, 34, 435], m.green);
    cylinder(root, 3, 5, [365 + i * 24, 42, 435], m.gold);
  }
  for (let i = 0; i < 2; i++) {
    rounded(root, [29, 35, 22], [545 + i * 0, 18, 175 + i * 34], m.hull, 2);
    rounded(root, [23, 25, 1], [545, 20, 187 + i * 34], m.dark, 1);
    for (let j = 0; j < 4; j++) rounded(root, [17, 1.3, 1], [545, 13 + j * 5, 188 + i * 34], m.frame, .2);
  }
  // Exterior ribs and docking hardware distinguish the hull from a floor plan.
  for (const x of [75, 150, 225]) rounded(root, [15, 10, 16], [x, -5, 443], m.frame, 2);
  pipe(root, [938, -2, 155], [938, -2, 450], 5, m.gold);
  // Exposed service runs and clamps under the windows.
  for (const r of ROOMS) {
    pipe(root, [r.x + 10, 10, r.y + 9], [r.x + r.w - 10, 10, r.y + 9], 1.7, m.gold);
    for (let x = r.x + 18; x < r.x + r.w; x += 42) rounded(root, [3, 6, 3], [x, 10, r.y + 9], m.frame, .6);
    for (let x = r.x + 12; x < r.x + r.w - 10; x += 22) {
      const bolt = cylinder(root, .9, .8, [x, 72, r.y - 3], m.dark); bolt.name = 'Hull_fastener';
    }
  }
  // Airlock handrail and stowed equipment, clear of the walking path.
  pipe(root, [93, 30, 190], [93, 30, 245], 2, m.gold);
  pipe(root, [93, 8, 190], [93, 30, 190], 2, m.frame);
  pipe(root, [93, 8, 245], [93, 30, 245], 2, m.frame);
  return root;
}

export function createStation(s) {
  const root = new THREE.Group(); root.name = `Station_${s.id}`; const m = materials();
  const cx = s.x + s.w / 2, cz = s.y + s.h / 2;
  if (s.id === 'suit') {
    rounded(root, [s.w, 53, s.h], [cx, 26.5, cz], m.frame, 3);
    rounded(root, [s.w - 8, 46, 4], [cx, 27, cz + s.h / 2], m.dark, 2);
    for (const x of [-23, 0, 23]) {
      rounded(root, [18, 28, 4], [cx + x, 29, cz + s.h / 2 + 3], m.hull, 2);
      rounded(root, [2, 11, 2], [cx + x + 5, 28, cz + s.h / 2 + 6], m.gold, .5);
    }
    label(root, 'A7L / PLSS', [cx, 48, cz + s.h / 2 + 3], 55, 7);
  } else if (s.id === 'eva') {
    rounded(root, [s.w, 9, s.h], [cx, 4, cz], m.frame, 4);
    const hatch = cylinder(root, 15, 3, [cx, 10, cz], m.hull);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(9, 1.3, 8, 32), m.gold); wheel.rotation.x = Math.PI / 2; wheel.position.set(cx, 13, cz); root.add(wheel);
    rounded(root, [20, 2, 2], [cx, 13, cz], m.gold, .4);
    hatch.name = 'EVA_hatch';
  } else {
    rounded(root, [s.w - 5, 24, s.h - 5], [cx, 13, cz], m.hull, 3);
    rounded(root, [s.w + 2, 4, s.h + 2], [cx, 27, cz], m.frame, 2);
    const panel = new THREE.Group(); panel.position.set(cx, 29, cz - 5); panel.rotation.x = -.55; root.add(panel);
    const pw = s.w - 14, ph = Math.min(s.h - 12, 37);
    rounded(panel, [pw, ph, 4], [0, ph / 2, 0], m.graphite, 2);
    rounded(panel, [pw - 6, ph - 7, 1], [0, ph / 2, 2.5], m.screen, 1);
    // Scope traces and telemetry ticks are decorative, without fabricated live values.
    for (let i = 0; i < 4; i++) rounded(panel, [pw * (.3 + (i % 3) * .13), 1, .3], [-pw * .12, 7 + i * 5, 3.2], m.green, .1);
    for (let i = 0; i < Math.floor(s.w / 12); i++) {
      cylinder(root, 1.7, 1.5, [s.x + 8 + i * 11, 30, cz + s.h / 2 - 8], i % 3 === 0 ? m.amber : m.trim);
    }
    label(root, s.short.toUpperCase(), [cx, 18, cz + s.h / 2 - 1], s.w - 12, 7);
    for (const x of [-1, 1]) rounded(root, [3, 12, 2], [cx + x * (s.w / 2 - 7), 13, cz + s.h / 2], m.gold, .5);
  }
  return root;
}

export function createProps() {
  const props = STATIONS.map(s => ({ id: s.id, depth: s.y + s.h, root: createStation(s) }));
  for (const item of FURNITURE.filter(f => f.id.endsWith('seat'))) {
    const root = new THREE.Group(), m = materials();
    const x = item.x + item.w / 2, z = item.y + item.h / 2;
    cylinder(root, 9, 3, [x, 2, z], m.frame);
    cylinder(root, 3, 15, [x, 10, z], m.trim);
    rounded(root, [29, 6, 28], [x, 19, z], m.graphite, 4);
    rounded(root, [28, 32, 7], [x, 32, z + 12], m.frame, 3);
    rounded(root, [23, 27, 4], [x, 33, z + 7.5], m.graphite, 3);
    rounded(root, [20, 8, 8], [x, 50, z + 11], m.graphite, 3);
    for (const side of [-1, 1]) {
      rounded(root, [4, 3, 23], [x + side * 15, 29, z], m.trim, 1);
      rounded(root, [2, 12, 2], [x + side * 15, 23, z + 7], m.frame, .5);
    }
    rounded(root, [3, 25, 1], [x - 5, 33, z + 5], m.gold, .3);
    rounded(root, [3, 25, 1], [x + 5, 33, z + 5], m.gold, .3);
    props.push({ id: item.id, depth: item.y + item.h, root });
  }
  return props;
}
