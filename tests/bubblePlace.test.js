import test from 'node:test';
import assert from 'node:assert/strict';
import { actorBody, speechBox } from '../src/game/bubblePlace.js';

function covers(place, bubble, body) {
  const box = { x: place.x, y: place.y, w: bubble.width, h: bubble.height };
  if (place.tail === 'above') box.h += 8;
  else if (place.tail === 'below') { box.y -= 8; box.h += 8; }
  else if (place.tail === 'right') { box.x -= 8; box.w += 8; }
  else { box.w += 8; }
  return box.x < body.right && box.x + box.w > body.left && box.y < body.bottom && box.y + box.h > body.top;
}

function assertClear(view, bubble, alexSpot, titusSpot, scale = 1) {
  const alex = actorBody(alexSpot, scale);
  const titus = actorBody(titusSpot, scale);
  const place = speechBox(view, bubble, alex, titus);
  assert.ok(place, 'placement');
  assert.equal(covers(place, bubble, alex), false, place.tail);
  assert.equal(covers(place, bubble, titus), false, place.tail);
  return place;
}

test('the speech box stays off Alex and Titus, including the tail', () => {
  const bubble = { width: 240, height: 88 };
  const cabin = assertClear(
    { width: 1100, height: 640 },
    bubble,
    { x: 540, y: 380 },
    { x: 490, y: 350 },
  );
  assert.equal(cabin.tail, 'above');

  const high = assertClear(
    { width: 1100, height: 640 },
    bubble,
    { x: 200, y: 90 },
    { x: 150, y: 70 },
  );
  assert.notEqual(high.tail, 'above');

  assertClear(
    { width: 390, height: 520 },
    { width: 180, height: 120 },
    { x: 200, y: 280 },
    { x: 160, y: 250 },
    0.7,
  );

  const cramped = assertClear(
    { width: 360, height: 220 },
    { width: 200, height: 90 },
    { x: 180, y: 120 },
    { x: 140, y: 100 },
  );
  assert.ok(cramped.tail === 'right' || cramped.tail === 'left' || cramped.tail === 'below' || cramped.tail === 'above');
  assert.equal(speechBox({ width: 400, height: 300 }, { width: 0, height: 40 }, actorBody({ x: 10, y: 10 }, 1), actorBody({ x: 20, y: 20 }, 1)), null);
});
