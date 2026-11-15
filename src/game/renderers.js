import { CORRIDORS, ROOMS, STATIONS, WORLD } from './world.js';

const C = { ink: '#0e1315', wall: '#718080', floor: '#333d40', tile: '#424d4f', green: '#9be3b6', gold: '#e8bf69', white: '#e6e8dd' };
function box(ctx, x, y, w, h, fill, radius = 0, stroke) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}
function text(ctx, value, x, y, size = 12, color = '#bfc9c6', align = 'left') {
  ctx.fillStyle = color; ctx.font = `600 ${size}px "Segoe UI", sans-serif`; ctx.textAlign = align; ctx.fillText(value, x, y);
}
function circle(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }

/** Replace this function with a drawImage sprite adapter without changing movement. */
export function drawAstronaut(ctx, actor, time, moving = false, scale = 1) {
  ctx.save(); ctx.translate(actor.x, actor.y); ctx.scale(scale, scale);
  ctx.fillStyle = '#10171788'; ctx.beginPath(); ctx.ellipse(0, 20, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
  const stride = moving ? Math.sin(time * 12) * 4 : 0;
  box(ctx, -20, -9, 13, 29, '#b9c4bd', 4, C.ink);
  box(ctx, -11, 12 + stride, 10, 15, '#c9d0c8', 4, C.ink);
  box(ctx, 4, 12 - stride, 10, 15, '#c9d0c8', 4, C.ink);
  box(ctx, -14, -13, 32, 35, C.white, 11, C.ink);
  box(ctx, -12, 6, 29, 6, '#d99c4f');
  box(ctx, -13, -24, 35, 29, '#eef0e7', 12, C.ink);
  box(ctx, -7, -20, 28, 19, '#192c33', 8, C.ink);
  box(ctx, -4, -17, 20, 5, '#a2c9ce', 3);
  box(ctx, 14, 4, 9, 16, '#dce1d7', 4, C.ink);
  box(ctx, -6, 2, 12, 7, '#52666a', 2);
  circle(ctx, 2, 5, 1.5, C.gold);
  ctx.restore();
}

export function drawTitus(ctx, actor, time, mood = 'normal', reduced = false) {
  const color = mood === 'danger' ? '#f18d7d' : mood === 'alert' ? C.gold : C.green;
  ctx.save(); ctx.translate(actor.x, actor.y + (reduced ? 0 : Math.sin(time * 3) * 3));
  ctx.fillStyle = '#10171766'; ctx.beginPath(); ctx.ellipse(0, 24, 16, 5, 0, 0, 7); ctx.fill();
  box(ctx, -19, -6, 7, 17, '#b39a68', 3, C.ink); box(ctx, 12, -6, 7, 17, '#b39a68', 3, C.ink);
  box(ctx, -14, -15, 28, 30, '#c8cfca', 5, C.ink);
  box(ctx, -11, -11, 22, 19, '#14262a', 3);
  text(ctx, mood === 'danger' ? '× ×' : mood === 'alert' ? '! !' : '⌃ ⌃', 0, 3, 15, color, 'center');
  box(ctx, -6, 15, 12, 3, color, 1);
  ctx.restore();
}

function drawRoom(ctx, room) {
  const { x, y, w, h } = room;
  box(ctx, x - 12, y - 12, w + 24, h + 24, C.ink, 26);
  box(ctx, x - 7, y - 7, w + 14, h + 14, C.wall, 22);
  box(ctx, x, y, w, h, C.floor, 16);
  ctx.save(); ctx.beginPath(); ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 12); ctx.clip();
  ctx.strokeStyle = '#51606455'; ctx.lineWidth = 1;
  for (let tx = x + 8; tx < x + w; tx += 32) {
    for (let ty = y + 8; ty < y + h; ty += 32) ctx.strokeRect(tx, ty, 29, 29);
  }
  ctx.restore();
  // Structural panels, bolts and inset footlights make the hull legible without assets.
  for (let tx = x + 26; tx < x + w - 12; tx += 48) {
    circle(ctx, tx, y - 3, 2, C.ink); circle(ctx, tx, y + h + 3, 2, C.ink);
  }
  box(ctx, x + 16, y + h - 8, 42, 3, '#a0c5bf', 1);
  box(ctx, x + w - 58, y + h - 8, 42, 3, '#a0c5bf', 1);
}

export function drawWorld(ctx, width, height, state) {
  const { player, titus, time, near, completed, reduced } = state;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#101719'; ctx.fillRect(0, 0, width, height);
  const scale = Math.min(width / 620, height / WORLD.height);
  const viewW = width / scale;
  const cameraX = Math.max(0, Math.min(WORLD.width - viewW, player.x - viewW / 2));
  ctx.save(); ctx.translate((viewW > WORLD.width ? (width - WORLD.width * scale) / 2 : -cameraX * scale), (height - WORLD.height * scale) / 2); ctx.scale(scale, scale);
  // Seeded star field: stable between frames, no random work in the render loop.
  for (let i = 0; i < 95; i++) circle(ctx, (i * 137.31) % 1000, (i * 73.71) % 590, i % 5 === 0 ? 1.2 : 0.6, '#8caaa55a');
  ctx.strokeStyle = '#8da09b18'; ctx.lineWidth = 1;
  for (let x = 0; x < 1000; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 590); ctx.stroke(); }
  for (let y = 0; y < 590; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1000, y); ctx.stroke(); }
  text(ctx, 'LUNARIA / VEHÍCULO DE ENTRENAMIENTO', 72, 60, 12, '#9cadaa');
  text(ctx, 'Vista de cubierta · No es una réplica del CSM', 72, 550, 12, '#9cadaa');
  ROOMS.forEach(r => drawRoom(ctx, r));
  CORRIDORS.forEach(r => {
    box(ctx, r.x, r.y - 6, r.w, r.h + 12, '#6d7a78');
    box(ctx, r.x - 2, r.y, r.w + 4, r.h, C.floor);
    for (let x = r.x + 4; x < r.x + r.w; x += 10) {
      box(ctx, x, r.y + 3, 5, 8, C.gold); box(ctx, x, r.y + r.h - 11, 5, 8, C.gold);
    }
  });
  // Cockpit windows and seats.
  box(ctx, 855, 110, 55, 80, '#101f27', 16, '#859695');
  box(ctx, 866, 122, 32, 5, '#759995', 2);
  box(ctx, 864, 143, 30, 4, '#46646a', 2);
  [240, 355].forEach(y => { box(ctx, 695, y, 40, 42, '#202b2e', 10, '#70807e'); box(ctx, 699, y + 4, 32, 10, '#8a9690', 4); });
  // Chairs are cosmetic floor fixtures; consoles alone are solid obstacles.
  box(ctx, 365, 380, 70, 45, '#243334', 5, '#657a74');
  for (let i = 0; i < 4; i++) { box(ctx, 372 + i * 14, 387, 8, 30, '#57736b', 3); }
  STATIONS.forEach(s => {
    const active = s.active && !completed;
    if (active) { ctx.setLineDash([7, 5]); ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.strokeRect(s.x - 7, s.y - 7, s.w + 14, s.h + 14); ctx.setLineDash([]); }
    box(ctx, s.x, s.y, s.w, s.h, '#131d20', 5, active ? C.gold : '#71837f');
    box(ctx, s.x + 7, s.y + 7, s.w - 14, s.h - 24, active ? '#203e32' : '#253432', 3);
    ctx.strokeStyle = active ? C.green : '#77948b'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(s.x + 12, s.y + 20); ctx.lineTo(s.x + s.w / 3, s.y + 20); ctx.lineTo(s.x + s.w / 2, s.y + 12); ctx.lineTo(s.x + s.w * .65, s.y + 25); ctx.lineTo(s.x + s.w - 12, s.y + 18); ctx.stroke();
    text(ctx, s.short, s.x + s.w / 2, s.y + s.h - 7, 11, active ? C.gold : '#c0ccc4', 'center');
    circle(ctx, s.x + s.w - 5, s.y + 5, 2, active ? C.green : '#8b9c96');
  });
  text(ctx, 'Esclusa', 180, 330, 17, '#aebbb4', 'center');
  text(ctx, 'Sistemas', 465, 330, 17, '#aebbb4', 'center');
  text(ctx, 'Cabina de mando', 785, 393, 17, '#aebbb4', 'center');
  if (!completed) {
    const goal = STATIONS[0];
    text(ctx, '↓', goal.x + goal.w / 2, goal.y - 20 + (reduced ? 0 : Math.sin(time * 3) * 4), 25, C.gold, 'center');
  }
  const actors = [{ y: player.y, draw: () => drawAstronaut(ctx, player, time, state.moving) }, { y: titus.y, draw: () => drawTitus(ctx, titus, time, near?.active ? 'alert' : 'normal', reduced) }];
  actors.sort((a, b) => a.y - b.y).forEach(a => a.draw());
  text(ctx, 'TITUS', titus.x, titus.y - 25, 10, C.green, 'center');
  if (near) {
    const label = near.active ? 'E · Abrir propulsión' : `E · ${near.short}`;
    const labelW = ctx.measureText(label).width + 35;
    box(ctx, player.x - labelW / 2, player.y - 65, labelW, 26, C.gold, 4);
    text(ctx, label, player.x, player.y - 48, 12, C.ink, 'center');
  }
  ctx.restore();
}

export function drawRocket(ctx, width, height, flight, reduced) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#101b1e'; ctx.fillRect(0, 0, width, height);
  const t = flight.time;
  for (let i = 0; i < 38; i++) {
    const y = ((i * 43 + (reduced ? 0 : t * 3)) % height);
    circle(ctx, (i * 97) % width, y, 1, '#b1c2b677');
  }
  ctx.save(); ctx.translate(width / 2, height / 2 - 30);
  const flying = flight.status === 'flying';
  if (flying) {
    ctx.fillStyle = '#e7b76b'; ctx.beginPath(); ctx.moveTo(-17, 112); ctx.lineTo(0, 140 + flight.throttle * 40 + (reduced ? 0 : Math.sin(t * 5) * 8)); ctx.lineTo(17, 112); ctx.fill();
    ctx.fillStyle = '#f1e0af'; ctx.beginPath(); ctx.moveTo(-8, 112); ctx.lineTo(0, 142); ctx.lineTo(8, 112); ctx.fill();
  }
  box(ctx, -18, -58, 36, 170, '#dce0d5', 2, '#0c1215');
  box(ctx, -19, 35, 38, 10, '#354446'); box(ctx, -19, 83, 38, 12, '#354446');
  box(ctx, -13, -87, 26, 29, '#dadfd5', 1, '#0c1215');
  ctx.beginPath(); ctx.moveTo(-13, -87); ctx.lineTo(0, -117); ctx.lineTo(13, -87); ctx.fillStyle = '#e7e8df'; ctx.fill();
  box(ctx, -2, -143, 4, 30, '#c4cdc5');
  box(ctx, -8, -132, 16, 3, '#c4cdc5');
  for (let i = 0; i < 3; i++) box(ctx, -16 + i * 12, -52, 7, 27, '#253336');
  text(ctx, 'USA', 0, 18, 10, '#1d3035', 'center');
  ctx.fillStyle = '#b7c1b9'; ctx.beginPath(); ctx.moveTo(-18, 75); ctx.lineTo(-32, 111); ctx.lineTo(-18, 111); ctx.fill();
  ctx.beginPath(); ctx.moveTo(18, 75); ctx.lineTo(32, 111); ctx.lineTo(18, 111); ctx.fill();
  ctx.restore();
  text(ctx, 'SATURNO V / S-IC', 18, 28, 12, '#b9c8bf');
  text(ctx, 'Animación esquemática', 18, height - 20, 12, '#b9c8bf');
}
