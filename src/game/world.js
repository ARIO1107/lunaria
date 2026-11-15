import { GAME_TUNING } from '../data/nasaTelemetry.js';

export const WORLD = { width: 1000, height: 590 };
// Cutaway deck. A straight spine joins the compartments so later levels
// still reach every console. Room order matters: roomAt uses the first match.
export const ROOMS = [
  { id: 'engines', name: 'Propulsión', x: 70, y: 70, w: 210, h: 198 },
  { id: 'power', name: 'Sistemas eléctricos', x: 340, y: 36, w: 270, h: 114 },
  { id: 'airlock', name: 'EVA / Esclusa', x: 70, y: 338, w: 200, h: 160 },
  { id: 'life', name: 'Soporte vital', x: 390, y: 338, w: 230, h: 170 },
  { id: 'bridge', name: 'Puente de mando', x: 640, y: 60, w: 300, h: 450 },
  { id: 'habitat', name: 'Hábitat', x: 300, y: 150, w: 340, h: 188 },
];
export const CORRIDORS = [{ x: 70, y: 268, w: 860, h: 70 }];
export const FURNITURE = [
  { id: 'air-tanks', x: 400, y: 455, w: 36, h: 28 },
  { id: 'electrical-racks', x: 560, y: 52, w: 28, h: 46 },
  { id: 'pilot-seat', x: 680, y: 150, w: 34, h: 40 },
  { id: 'navigator-seat', x: 680, y: 210, w: 34, h: 40 },
];
export const STATIONS = [
  { id: 'propulsion', name: 'Panel de propulsión', short: 'Propulsión', x: 90, y: 100, w: 120, h: 52 },
  { id: 'coas', name: 'Mira de alineación COAS', short: 'COAS', x: 880, y: 90, w: 50, h: 55 },
  { id: 'lander', name: 'Control de descenso lunar', short: 'Descenso', x: 720, y: 400, w: 110, h: 48 },
  { id: 'breakers', name: 'Disyuntores y DSKY', short: 'Energía', x: 390, y: 55, w: 110, h: 48 },
  { id: 'oxygen', name: 'Monitor de soporte vital', short: 'Soporte vital', x: 450, y: 400, w: 100, h: 52 },
  { id: 'suit', name: 'Traje A7L y mochila PLSS', short: 'Traje', x: 90, y: 370, w: 80, h: 46 },
  { id: 'eva', name: 'Compuerta EVA', short: 'Esclusa', x: 90, y: 440, w: 80, h: 40 },
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
export function nearestStation(actor) {
  let nearest = null;
  let distance = Infinity;
  for (const station of STATIONS) {
    const candidate = Math.hypot(actor.x - station.x - station.w / 2, actor.y - station.y - station.h / 2);
    if (candidate < Math.max(station.w, station.h) / 2 + 52 && candidate < distance) {
      nearest = station;
      distance = candidate;
    }
  }
  return nearest;
}
export const roomAt = (actor) => ROOMS.find(r => inside(actor.x, actor.y, r))?.name ?? 'Pasillo de conexión';
