export const surfaceSpawn = { x: 180, y: 330 };
export const SURFACE_OBJECTS = [
  { id: 'module', name: 'Módulo de descenso', short: 'Módulo', x: 700, y: 390, w: 95, h: 85 },
  { id: 'habitat', name: 'Hábitat prefabricado', short: 'Hábitat', x: 380, y: 160, w: 125, h: 80 },
  { id: 'solar', name: 'Paneles solares', short: 'Energía solar', x: 180, y: 200, w: 110, h: 70 },
  { id: 'life', name: 'Soporte vital de la base', short: 'Soporte vital', x: 560, y: 180, w: 75, h: 65 },
  { id: 'storage', name: 'Almacén de suministros', short: 'Almacén', x: 160, y: 420, w: 90, h: 65 },
  { id: 'regolith', name: 'Muestra de regolito', short: 'Regolito', x: 350, y: 470, w: 28, h: 24 },
  { id: 'basalt', name: 'Roca basáltica de entrenamiento', short: 'Basalto', x: 800, y: 200, w: 32, h: 28 },
  { id: 'highland', name: 'Roca de tierras altas de entrenamiento', short: 'Tierras altas', x: 590, y: 490, w: 34, h: 28 },
  { id: 'lab', name: 'Laboratorio de análisis', short: 'Laboratorio', x: 740, y: 80, w: 95, h: 65 },
];

export function canOccupySurface(x, y, radius = 16) {
  return Number.isFinite(x) && Number.isFinite(y) && x >= 45 + radius && x <= 955 - radius &&
    y >= 45 + radius && y <= 605 - radius &&
    !SURFACE_OBJECTS.some(object => x + radius > object.x && x - radius < object.x + object.w &&
      y + radius > object.y && y - radius < object.y + object.h);
}

export function nearestSurfaceObject(actor) {
  return SURFACE_OBJECTS.map(object => ({ object, distance: Math.hypot(actor.x - object.x - object.w / 2, actor.y - object.y - object.h / 2) }))
    .filter(({ object, distance }) => distance < Math.max(object.w, object.h) / 2 + 55)
    .sort((a, b) => a.distance - b.distance)[0]?.object ?? null;
}

export function moveSurfaceActor(actor, dx, dy, dt) {
  if (!dx && !dy) return actor;
  const magnitude = Math.hypot(dx, dy);
  const distance = 145 * Math.max(0, Math.min(dt, .1));
  const steps = Math.max(1, Math.ceil(distance / 4));
  let { x, y } = actor;
  for (let index = 0; index < steps; index++) {
    const nx = x + dx / magnitude * distance / steps;
    if (canOccupySurface(nx, y)) x = nx;
    const ny = y + dy / magnitude * distance / steps;
    if (canOccupySurface(x, ny)) y = ny;
  }
  return { ...actor, x, y, angle: Math.atan2(dx, dy) };
}
