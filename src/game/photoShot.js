export const PHOTO_ANSWER = 'encuadrada';

// Same rectangle as .photo-reticle in campaign.css: left 31%, width 38%, top 24%, height 52%.
export const PHOTO_FRAME = { left: 0.31, right: 0.69, top: 0.24, bottom: 0.76 };

const TRAVEL_START = -0.3;
const TRAVEL_SPAN = 1.6;

export const PHOTO_BODIES = [
  { id: 'earth', name: 'Tierra', target: true, map: 'earth.jpg', speed: 0.05, phase: 0.29, lane: 0.5, radius: 0.105, spin: 0.35 },
  { id: 'moon', name: 'Luna', map: 'moon.jpg', speed: 0.15, phase: 0.24, lane: 0.64, radius: 0.055, spin: 0.18 },
  { id: 'star', name: 'Estrella', map: null, speed: 0.42, phase: 0.12, lane: 0.16, radius: 0.03, spin: 0 },
  { id: 'mars', name: 'Marte', map: 'mars.jpg', speed: 0.14, phase: 0.48, lane: 0.11, radius: 0.058, spin: 0.42 },
  { id: 'jupiter', name: 'Júpiter', map: 'jupiter.jpg', speed: 0.046, phase: 0.15, lane: 0.93, radius: 0.12, spin: 0.6 },
];

export function bodyAt(body, time) {
  const u = ((time * body.speed + body.phase) % 1 + 1) % 1;
  const bob = Math.sin((time * body.speed + body.phase) * Math.PI * 2) * 0.012;
  return {
    id: body.id,
    name: body.name,
    target: Boolean(body.target),
    map: body.map,
    spin: body.spin,
    radius: body.radius,
    x: TRAVEL_START + u * TRAVEL_SPAN,
    y: body.lane + bob,
  };
}

export function bodiesAt(time) {
  return PHOTO_BODIES.map(body => bodyAt(body, time));
}

export function projectBody(body, aspect) {
  const safe = Math.max(aspect, 0.5);
  return { cx: body.x, cy: body.y, rx: body.radius / safe, ry: body.radius };
}

// Orthographic camera: left -aspect, right aspect, top 1, bottom -1. Radius is a fraction of the view height.
export function worldFromViewport(nx, ny, aspect, radiusFrac) {
  const safe = Math.max(aspect, 0.5);
  return {
    x: (nx * 2 - 1) * safe,
    y: 1 - ny * 2,
    radius: radiusFrac * 2,
  };
}

function overlaps(disk, frame) {
  return disk.cx + disk.rx > frame.left && disk.cx - disk.rx < frame.right
    && disk.cy + disk.ry > frame.top && disk.cy - disk.ry < frame.bottom;
}

function fullyInside(disk, frame) {
  return disk.cx - disk.rx >= frame.left && disk.cx + disk.rx <= frame.right
    && disk.cy - disk.ry >= frame.top && disk.cy + disk.ry <= frame.bottom;
}

export function gradePhoto(time, aspect) {
  const disks = bodiesAt(time).map(body => ({ body, disk: projectBody(body, aspect) }));
  const earth = disks.find(item => item.body.target);
  const company = disks.filter(item => !item.body.target && overlaps(item.disk, PHOTO_FRAME));
  const names = company.map(item => item.body.name);
  if (!earth || !fullyInside(earth.disk, PHOTO_FRAME)) return { ok: false, reason: 'fuera', names };
  if (company.length) return { ok: false, reason: 'compañia', names };
  return { ok: true, reason: 'lista', names: ['Tierra'] };
}

export function photoMiss(grade) {
  if (grade.reason === 'compañia' && grade.names.length === 1) {
    return grade.names[0] + ' también salió en el marco. Espera a que la Tierra pase sola y pulsa Tomar foto.';
  }
  if (grade.reason === 'compañia') {
    return grade.names.join(' y ') + ' también salieron en el marco. Espera a que la Tierra pase sola y pulsa Tomar foto.';
  }
  return 'La Tierra no está entera dentro del marco. Espera a que cruce por el centro y pulsa Tomar foto.';
}

export function frameStatus(grade) {
  if (grade.ok) return 'Tierra en el marco.';
  if (grade.reason === 'compañia') return 'En el marco: ' + grade.names.join(', ') + '.';
  return 'El marco todavía no tiene a la Tierra entera.';
}

export function longestClear(aspect, seconds = 24, step = 0.05) {
  let best = 0;
  let run = 0;
  for (let time = 0; time <= seconds; time += step) {
    if (gradePhoto(time, aspect).ok) {
      run += step;
      if (run > best) best = run;
    } else run = 0;
  }
  return best;
}
