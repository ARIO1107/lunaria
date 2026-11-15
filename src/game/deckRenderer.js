/** Canvas compositing of true 3D renders. Navigation remains in ground-plane units. */
export const projectFloor = (deck, actor) => ({
  x: deck.origin.x + actor.x * deck.axisX.x + actor.y * deck.axisY.x,
  y: deck.origin.y + actor.x * deck.axisX.y + actor.y * deck.axisY.y,
});

function drawSpace(ctx, w, h, time, reduced) {
  ctx.fillStyle = '#080e19'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 200; i++) {
    const x = (i * 127.71) % w, y = (i * 91.17) % h;
    ctx.globalAlpha = .2 + (i % 7) / 10;
    ctx.fillStyle = i % 11 === 0 ? '#b0dcf5' : '#e6eff1';
    ctx.beginPath(); ctx.arc(x, y, i % 13 === 0 ? 1.3 : .6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Illustrated Earth: a scenic backdrop, deliberately not presented as a NASA image.
  const x = w * .77, y = h * .20, r = Math.min(w * .16, 150);
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI * 2); ctx.fillStyle = '#8bc3dc'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
  const ocean = ctx.createRadialGradient(x - r * .4, y - r * .4, 0, x, y, r);
  ocean.addColorStop(0, '#578ba0'); ocean.addColorStop(.65, '#28526b'); ocean.addColorStop(1, '#122b47');
  ctx.fillStyle = ocean; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.translate(x, y); ctx.rotate(-.28);
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 3 === 0 ? '#81aaa5' : '#638a89';
    ctx.beginPath();
    const px = Math.sin(i * 1.8) * r * .65, py = Math.cos(i * 2.2) * r * .65;
    ctx.ellipse(px, py, r * (.12 + (i % 3) * .06), r * .12, i, 0, 7); ctx.fill();
  }
  ctx.strokeStyle = '#c8dedfc0'; ctx.lineWidth = r * .055;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(-r * .2, -r * .65 + i * r * .26, r * .8, r * .15, -.1, .2, 2.5); ctx.stroke(); }
  const night = ctx.createLinearGradient(-r, 0, r, r * .3); night.addColorStop(0, '#00000000'); night.addColorStop(.5, '#00000000'); night.addColorStop(1, '#030914e8');
  ctx.fillStyle = night; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore();
}

function drawActor(ctx, art, name, actor, time, moving, mood, reduced) {
  const meta = art.manifest.actors[name], pos = projectFloor(art.manifest.deck, actor);
  const direction = ((Math.round((actor.angle || 0) / (Math.PI / 4)) % 8) + 8) % 8;
  const frame = name === 'astronaut' ? moving ? 1 + Math.floor(time * 10) % 8 : 0 : reduced ? 0 : Math.floor(time * 8) % 8;
  const moodIndex = Math.max(0, meta.moods.indexOf(mood));
  ctx.drawImage(art.images[meta.file], frame * meta.frameW, (moodIndex * 8 + direction) * meta.frameH, meta.frameW, meta.frameH,
    pos.x - meta.anchor.x, pos.y - meta.anchor.y, meta.logicalW, meta.logicalH);
}

export function drawDeck(ctx, width, height, state, art, zoom = 1) {
  const { player, titus, time, near, reduced, moving } = state;
  drawSpace(ctx, width, height, time, reduced);
  const deck = art.manifest.deck;
  // Fit the full ship on large screens; small screens follow the astronaut.
  const scale = Math.min(width / 780, height / 620) * zoom;
  const viewW = width / scale, viewH = height / scale;
  const pos = projectFloor(deck, player);
  const cameraX = Math.max(0, Math.min(deck.width - viewW, pos.x - viewW / 2));
  const cameraY = Math.max(0, Math.min(deck.height - viewH, pos.y - viewH * .58));
  ctx.save();
  ctx.translate(viewW > deck.width ? (width - deck.width * scale) / 2 : -cameraX * scale, viewH > deck.height ? (height - deck.height * scale) / 2 : -cameraY * scale);
  ctx.scale(scale, scale);
  ctx.drawImage(art.images[deck.file], 0, 0, deck.width, deck.height);
  const sprites = art.manifest.props.map(prop => ({ depth: prop.depth, draw: () => {
    ctx.drawImage(art.images[prop.file], prop.x, prop.y, prop.w, prop.h);
  } }));
  sprites.push({ depth: player.y, draw: () => drawActor(ctx, art, 'astronaut', player, time, moving, 'normal', reduced) });
  sprites.push({ depth: titus.y, draw: () => drawActor(ctx, art, 'titus', titus, time, false, near ? 'alert' : 'normal', reduced) });
  sprites.sort((a, b) => a.depth - b.depth).forEach(sprite => sprite.draw());
  if (near) {
    const p = projectFloor(deck, { x: near.x + near.w / 2, y: near.y + near.h });
    ctx.strokeStyle = '#efd18c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 5, near.w / 2 + 9, 10, 0, 0, Math.PI * 2); ctx.stroke();
    const label = `E · ${near.short}`; ctx.font = '600 13px Segoe UI, sans-serif';
    const labelW = ctx.measureText(label).width + 24;
    ctx.fillStyle = '#e9c989'; ctx.beginPath(); ctx.roundRect(pos.x - labelW / 2, pos.y - 105, labelW, 28, 4); ctx.fill();
    ctx.fillStyle = '#17252c'; ctx.textAlign = 'center'; ctx.fillText(label, pos.x, pos.y - 86);
  }
  ctx.restore();
}
