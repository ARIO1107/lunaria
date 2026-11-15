import { useEffect, useRef, useState } from 'react';
import { loadArt } from '../game/assets.js';
import { useAnimationFrame } from '../hooks/useAnimationFrame.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { SURFACE_OBJECTS, surfaceSpawn, canOccupySurface, moveSurfaceActor, nearestSurfaceObject } from '../game/surfaceWorld.js';
import { placeCrewBubble } from '../game/bubblePlace.js';

function sprite(ctx, art, name, actor, time, moving, mood, reduced) {
  const meta = art.manifest.actors[name];
  const direction = ((Math.round((actor.angle || 0) / (Math.PI / 4)) % 8) + 8) % 8;
  const frame = reduced ? 0 : name === 'astronaut' ? moving ? 1 + Math.floor(time * 10) % 8 : 0 : Math.floor(time * 8) % 8;
  const moodIndex = Math.max(0, meta.moods.indexOf(mood));
  ctx.drawImage(art.images[meta.file], frame * meta.frameW, (moodIndex * 8 + direction) * meta.frameH, meta.frameW, meta.frameH,
    actor.x - meta.anchor.x, actor.y - meta.anchor.y, meta.logicalW, meta.logicalH);
}

function drawObject(ctx, object, near) {
  const { x, y, w, h, id } = object;
  const sample = ['regolith', 'basalt', 'highland'].includes(id);
  ctx.fillStyle = '#03091266';
  ctx.beginPath(); ctx.ellipse(x + w / 2 + 6, y + h + 5, w * .65, h * .21, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = sample ? id === 'highland' ? '#c1b9aa' : id === 'basalt' ? '#474b53' : '#9d9287' : '#b2b6aa';
  ctx.strokeStyle = near?.id === id ? '#82ff68' : '#45545e';
  ctx.lineWidth = near?.id === id ? 3 : 2;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, sample ? 10 : 7); ctx.fill(); ctx.stroke();
  if (id === 'solar') {
    ctx.fillStyle = '#244266'; ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
    ctx.strokeStyle = '#7ca3c5';
    for (let column = 1; column < 5; column++) { ctx.beginPath(); ctx.moveTo(x + column * w / 5, y + 5); ctx.lineTo(x + column * w / 5, y + h - 5); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x + 5, y + h / 2); ctx.lineTo(x + w - 5, y + h / 2); ctx.stroke();
  } else if (!sample) {
    ctx.fillStyle = '#213c48'; ctx.fillRect(x + w * .15, y + 10, w * .7, h * .25);
    ctx.fillStyle = '#e9c783'; ctx.fillRect(x + w * .7, y + h * .65, 9, 9);
    ctx.strokeStyle = '#6c7c78'; ctx.strokeRect(x + w * .2, y + h * .48, w * .3, h * .5);
  }
  ctx.font = '12px Segoe UI, sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#e5eadd'; ctx.fillText(object.short, x + w / 2, y + h + 22);
}

function surfaceSpot(width, height, player, actor, zoom) {
  const scale = Math.min(width / 1000, height / 650) * zoom;
  const viewW = width / scale;
  const viewH = height / scale;
  const originX = viewW > 1000 ? (width - 1000 * scale) / 2 : -Math.max(0, Math.min(1000 - viewW, player.x - viewW / 2)) * scale;
  const originY = viewH > 650 ? (height - 650 * scale) / 2 : -Math.max(0, Math.min(650 - viewH, player.y - viewH / 2)) * scale;
  return { x: originX + actor.x * scale, y: originY + actor.y * scale };
}

export default function SurfaceCanvas({ positionRef, inputRef, paused, onNear, onInteract, onRoom, zoom = 1, reducedMotion = false, titusMood = 'normal', speech = '' }) {
  const canvasRef = useRef(null);
  const keys = useRef(new Set());
  const actors = useRef(null);
  const nearId = useRef(null);
  const [art, setArt] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const interactRef = useRef(onInteract);
  interactRef.current = onInteract;
  const bubbleRef = useRef(null);
  const systemReduced = useReducedMotion();
  const reduced = reducedMotion || systemReduced;
  if (!actors.current) {
    const saved = positionRef.current;
    const player = canOccupySurface(saved.x, saved.y) ? { ...saved } : { ...surfaceSpawn };
    actors.current = { player, titus: { ...player }, trail: [] };
  }
  useEffect(() => {
    let cancelled = false;
    setError('');
    loadArt().then(bundle => { if (!cancelled) setArt(bundle); }).catch(reason => { if (!cancelled) setError(reason.message); });
    return () => { cancelled = true; };
  }, [attempt]);
  useEffect(() => { onRoom?.('Puesto avanzado · Región polar ficticia'); }, [onRoom]);
  useEffect(() => {
    function clear() { keys.current.clear(); inputRef.current = { x: 0, y: 0 }; }
    clear();
    if (paused || !art) return;
    const movement = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    function down(event) {
      if (event.target.closest('button, input, textarea, select, a, dialog, [contenteditable]')) return;
      if (movement.includes(event.code)) { event.preventDefault(); keys.current.add(event.code); }
      if (['KeyE', 'Space'].includes(event.code) && !event.repeat) {
        event.preventDefault();
        const object = nearestSurfaceObject(actors.current.player);
        if (object) interactRef.current(object);
      }
    }
    function up(event) { keys.current.delete(event.code); }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    window.addEventListener('blur', clear); document.addEventListener('visibilitychange', clear);
    return () => { clear(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear); };
  }, [paused, art, inputRef]);
  useAnimationFrame((dt, time) => {
    const canvas = canvasRef.current;
    if (!canvas || !art) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * dpr), height = Math.round(rect.height * dpr);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const state = actors.current;
    const has = (a, b) => keys.current.has(a) || keys.current.has(b);
    const dx = paused ? 0 : Number(has('KeyD', 'ArrowRight')) - Number(has('KeyA', 'ArrowLeft')) + inputRef.current.x;
    const dy = paused ? 0 : Number(has('KeyS', 'ArrowDown')) - Number(has('KeyW', 'ArrowUp')) + inputRef.current.y;
    if (!paused) {
      const previous = state.player;
      state.player = moveSurfaceActor(previous, dx, dy, dt);
      positionRef.current = state.player;
      if (Math.hypot(state.player.x - previous.x, state.player.y - previous.y) > 0) state.trail.push({ ...state.player });
      if (state.trail.length > 600) state.trail.shift();
      const target = state.trail[0];
      if (target && Math.hypot(state.player.x - state.titus.x, state.player.y - state.titus.y) > 35) {
        const distance = Math.hypot(target.x - state.titus.x, target.y - state.titus.y);
        if (distance < 4) state.trail.shift();
        else state.titus = moveSurfaceActor(state.titus, target.x - state.titus.x, target.y - state.titus.y, Math.min(dt * 1.3, distance / 145));
      }
    }
    const near = nearestSurfaceObject(state.player);
    if (nearId.current !== near?.id) { nearId.current = near?.id ?? null; onNear(near); }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0b1420'; ctx.fillRect(0, 0, rect.width, rect.height);
    const scale = Math.min(rect.width / 1000, rect.height / 650) * zoom;
    const spotOrigin = surfaceSpot(rect.width, rect.height, state.player, { x: 0, y: 0 }, zoom);
    ctx.save();
    ctx.translate(spotOrigin.x, spotOrigin.y);
    ctx.scale(scale, scale);
    const ground = ctx.createLinearGradient(0, 0, 0, 650);
    ground.addColorStop(0, '#8d8478');
    ground.addColorStop(1, '#5a534c');
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, 1000, 650);
    for (let index = 0; index < 80; index++) {
      const x = (index * 131.71) % 1000, y = (index * 87.3) % 650;
      ctx.strokeStyle = '#3a322c55'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x, y, 8 + index % 30, 4 + index % 15, -.2, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = '#c1c9a855'; ctx.setLineDash([8, 8]); ctx.strokeRect(45, 45, 910, 560); ctx.setLineDash([]);
    const items = SURFACE_OBJECTS.map(object => ({ depth: object.y + object.h, draw: () => drawObject(ctx, object, near) }));
    items.push({ depth: state.player.y, draw: () => sprite(ctx, art, 'astronaut', state.player, time, Boolean(dx || dy), 'normal', reduced) });
    items.push({ depth: state.titus.y, draw: () => sprite(ctx, art, 'titus', state.titus, time, false, titusMood, reduced) });
    items.sort((a, b) => a.depth - b.depth).forEach(item => item.draw());
    if (near) {
      ctx.fillStyle = '#e9c989';
      ctx.beginPath();
      ctx.roundRect(state.player.x - 110, state.player.y - 108, 220, 26, 4);
      ctx.fill();
      ctx.fillStyle = '#17252c';
      ctx.textAlign = 'center';
      ctx.font = '600 13px Segoe UI, sans-serif';
      ctx.fillText('E · ' + near.short, state.player.x, state.player.y - 90);
    }
    ctx.restore();
    const bubble = bubbleRef.current;
    if (bubble) {
      placeCrewBubble(
        bubble, canvas, { width: rect.width, height: rect.height }, scale,
        surfaceSpot(rect.width, rect.height, state.player, state.player, zoom),
        surfaceSpot(rect.width, rect.height, state.player, state.titus, zoom),
        art.manifest.actors.astronaut, art.manifest.actors.titus,
      );
    }
  });
  return <div className="deck-viewport"><canvas ref={canvasRef} className="ship-canvas" tabIndex={0}
    aria-label="Superficie lunar. WASD o flechas para caminar. E para interactuar." />
    {speech && <p ref={bubbleRef} className="titus-bubble" role="status"><b>Titus</b><span>{speech}</span></p>}
    {!art && <div className="asset-loading" role="status">{error ? <><p>{error}</p><button onClick={() => setAttempt(value => value + 1)}>Reintentar carga</button></> : <p>Preparando la superficie lunar…</p>}</div>}
  </div>;
}
