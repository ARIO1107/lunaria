import { GAME_TUNING } from '../data/nasaTelemetry.js';

export const WORLD = { width: 1000, height: 590 };
export const ROOMS = [
  { id: 'airlock', name: 'Esclusa de aire', x: 70, y: 170, w: 220, h: 260 },
  { id: 'systems', name: 'Sistemas y soporte vital', x: 330, y: 130, w: 270, h: 340 },
  { id: 'cockpit', name: 'Cabina de mando', x: 640, y: 90, w: 290, h: 420 },
];
export const CORRIDORS = [{ x: 280, y: 265, w: 60, h: 80 }, { x: 590, y: 265, w: 60, h: 80 }];
export const FURNITURE = [
  { id: 'air-tanks', x: 355, y: 425, w: 70, h: 20 },
  { id: 'electrical-racks', x: 530, y: 164, w: 30, h: 60 },
  { id: 'pilot-seat', x: 658, y: 222, w: 35, h: 40 },
  { id: 'navigator-seat', x: 658, y: 355, w: 35, h: 40 },
];
export const STATIONS = [
  { id: 'propulsion', name: 'Panel de propulsión', short: 'Propulsión', x: 700, y: 125, w: 120, h: 52 },
  { id: 'coas', name: 'Radar de acoplamiento COAS', short: 'COAS', x: 838, y: 220, w: 65, h: 100 },
  { id: 'lander', name: 'Control de descenso lunar', short: 'Descenso', x: 720, y: 425, w: 115, h: 52 },
  { id: 'breakers', name: 'Disyuntores y DSKY', short: 'DSKY', x: 365, y: 165, w: 95, h: 50 },
  { id: 'oxygen', name: 'Monitor de soporte vital', short: 'Soporte vital', x: 490, y: 370, w: 80, h: 55 },
  { id: 'suit', name: 'Traje A7L y mochila PLSS', short: 'A7L / PLSS', x: 120, y: 200, w: 85, h: 50 },
  { id: 'eva', name: 'Compuerta EVA', short: 'EVA', x: 120, y: 365, w: 85, h: 40 },
];
const inside = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
export function canOccupy(x, y, radius = 16) {
  // Sample the circumference to keep the whole actor inside the union of rooms/corridors.
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8;
    if (![...ROOMS, ...CORRIDORS].some(r => inside(x + Math.cos(a) * radius, y + Math.sin(a) * radius, r))) return false;
  }
  return ![...STATIONS, ...FURNITURE].some(r => x + radius > r.x && x - radius < r.x + r.w && y + radius > r.y && y - radius < r.y + r.h);
}
export function moveActor(actor, dx, dy, dt) {
  const magnitude = Math.hypot(dx, dy) || 1;
  const distance = GAME_TUNING.astronautSpeed * Math.min(dt, 0.1);
  let { x, y } = actor;
  // Substeps prevent tunnelling through thin obstacles after a slow frame.
  const steps = Math.max(1, Math.ceil(distance / 4));
  for (let i = 0; i < steps; i++) {
    const nx = x + dx / magnitude * distance / steps;
    if (canOccupy(nx, y)) x = nx;
    const ny = y + dy / magnitude * distance / steps;
    if (canOccupy(x, ny)) y = ny;
  }
  return { ...actor, x, y };
}
export const nearestStation = (actor) => STATIONS.find(s => Math.hypot(actor.x - (s.x + s.w / 2), actor.y - (s.y + s.h / 2)) < Math.max(s.w, s.h) / 2 + 52) ?? null;
export const roomAt = (actor) => ROOMS.find(r => inside(actor.x, actor.y, r))?.name ?? 'Pasillo de conexión';
