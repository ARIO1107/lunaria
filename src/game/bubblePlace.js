/** Keep Titus's bubble off both sprites. The tail may point at him; the box may not cover either body. */

const PAD = 8;
const GAP = 16;

export function actorBody(spot, scale, anchor = { x: 48, y: 84 }, logical = { w: 96, h: 120 }) {
  const width = logical.w * scale;
  const height = logical.h * scale;
  const left = spot.x - anchor.x * scale;
  const top = spot.y - anchor.y * scale;
  return { x: spot.x, y: spot.y, left, top, right: left + width, bottom: top + height };
}

function clamp(value, min, max) {
  if (max < min) return min;
  return Math.max(min, Math.min(max, value));
}

function unionOf(a, b) {
  return {
    left: Math.min(a.left, b.left),
    top: Math.min(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.max(a.bottom, b.bottom),
  };
}

function overlaps(box, rect) {
  return box.x < rect.right && box.x + box.w > rect.left && box.y < rect.bottom && box.y + box.h > rect.top;
}

function inside(box, view) {
  return box.x >= PAD && box.y >= PAD && box.x + box.w <= view.width - PAD && box.y + box.h <= view.height - PAD;
}

export function speechBox(view, bubble, alex, titus) {
  const w = bubble.width;
  const h = bubble.height;
  if (!w || !h) return null;
  const bodies = unionOf(alex, titus);
  const forbid = {
    left: bodies.left - GAP,
    top: bodies.top - GAP,
    right: bodies.right + GAP,
    bottom: bodies.bottom + GAP,
  };
  const midY = (bodies.top + bodies.bottom) / 2;
  const preferredX = titus.x - w * 0.28;
  const candidates = [
    { tail: 'above', x: preferredX, y: forbid.top - h, slide: 'x' },
    { tail: 'below', x: preferredX, y: forbid.bottom, slide: 'x' },
    { tail: 'right', x: forbid.right, y: midY - h / 2, slide: 'y' },
    { tail: 'left', x: forbid.left - w, y: midY - h / 2, slide: 'y' },
  ];
  let chosen = null;
  for (const candidate of candidates) {
    const box = { x: candidate.x, y: candidate.y, w, h };
    if (candidate.slide === 'x') box.x = clamp(box.x, PAD, view.width - PAD - w);
    else box.y = clamp(box.y, PAD, view.height - PAD - h);
    if (inside(box, view) && !overlaps(box, bodies)) {
      chosen = { tail: candidate.tail, x: box.x, y: box.y };
      break;
    }
  }
  if (!chosen) {
    const rooms = [
      { tail: 'above', room: forbid.top - PAD, x: clamp(preferredX, PAD, view.width - PAD - w), y: forbid.top - h },
      { tail: 'below', room: view.height - PAD - forbid.bottom, x: clamp(preferredX, PAD, view.width - PAD - w), y: forbid.bottom },
      { tail: 'right', room: view.width - PAD - forbid.right, x: forbid.right, y: clamp(midY - h / 2, PAD, view.height - PAD - h) },
      { tail: 'left', room: forbid.left - PAD, x: forbid.left - w, y: clamp(midY - h / 2, PAD, view.height - PAD - h) },
    ].sort((a, b) => b.room - a.room);
    const fallback = rooms[0];
    const box = { x: fallback.x, y: fallback.y, w, h };
    if (overlaps(box, bodies)) {
      if (fallback.tail === 'above') box.y = bodies.top - GAP - h;
      else if (fallback.tail === 'below') box.y = bodies.bottom + GAP;
      else if (fallback.tail === 'right') box.x = bodies.right + GAP;
      else box.x = bodies.left - GAP - w;
    }
    chosen = { tail: fallback.tail, x: box.x, y: box.y };
  }
  const edge = 16;
  const chest = titus.top + (titus.bottom - titus.top) * 0.42;
  return {
    x: chosen.x,
    y: chosen.y,
    tail: chosen.tail,
    tailX: w <= edge * 2 ? w / 2 : clamp(titus.x - chosen.x, edge, w - edge),
    tailY: h <= edge * 2 ? h / 2 : clamp(chest - chosen.y, edge, h - edge),
  };
}

export function placeCrewBubble(bubble, canvas, view, scale, alexSpot, titusSpot, alexMeta, titusMeta) {
  const alex = actorBody(alexSpot, scale, alexMeta.anchor, { w: alexMeta.logicalW, h: alexMeta.logicalH });
  const titus = actorBody(titusSpot, scale, titusMeta.anchor, { w: titusMeta.logicalW, h: titusMeta.logicalH });
  canvas.dataset.crew = JSON.stringify({
    scale,
    alex: { x: alexSpot.x, y: alexSpot.y, anchor: alexMeta.anchor, w: alexMeta.logicalW, h: alexMeta.logicalH },
    titus: { x: titusSpot.x, y: titusSpot.y, anchor: titusMeta.anchor, w: titusMeta.logicalW, h: titusMeta.logicalH },
  });
  const place = speechBox(view, { width: bubble.offsetWidth, height: bubble.offsetHeight }, alex, titus);
  if (!place) {
    bubble.style.visibility = 'hidden';
    return;
  }
  bubble.style.visibility = 'visible';
  bubble.style.transform = `translate(${Math.round(place.x)}px, ${Math.round(place.y)}px)`;
  bubble.dataset.tail = place.tail;
  bubble.style.setProperty('--tail-x', `${Math.round(place.tailX)}px`);
  bubble.style.setProperty('--tail-y', `${Math.round(place.tailY)}px`);
}
