import { useEffect, useRef, useState } from 'react';
import { moveActor, nearestStation, roomAt, canOccupy } from '../game/world.js';
import { actorScreen, deckView, drawDeck } from '../game/deckRenderer.js';
import { placeCrewBubble } from '../game/bubblePlace.js';
import { tickCrew } from '../audio/audioManager.js';
import { loadArt } from '../game/assets.js';
import { useAnimationFrame } from '../hooks/useAnimationFrame.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

const MOVEMENT = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
export default function ShipCanvas({ positionRef, reducedMotion, paused, onNear, onRoom, onInteract, inputRef, zoom = 1, titusMood, emergency = false, grounded = false, guidePoint = null, speech = '' }) {
  const canvasRef = useRef(null);
  const keys = useRef(new Set());
  const state = useRef(null);
  if (state.current === null) {
    const player = positionRef.current;
    const offset = { x: player.x - 45, y: player.y - 30 };
    state.current = { player, titus: canOccupy(offset.x, offset.y, 12) ? offset : { ...player }, nearId: null, room: '' };
  }
  const systemReducedMotion = useReducedMotion();
  const reduced = reducedMotion || systemReducedMotion;
  const [art, setArt] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const interactRef = useRef(onInteract);
  interactRef.current = onInteract;
  const bubbleRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    setLoadError('');
    loadArt().then(bundle => { if (!cancelled) setArt(bundle); }).catch(error => { if (!cancelled) setLoadError(error.message); });
    return () => { cancelled = true; };
  }, [attempt]);
  useEffect(() => {
    if (paused || !art) { keys.current.clear(); inputRef.current = { x: 0, y: 0 }; return; }
    const down = e => {
      if (e.target.closest('button, input, a, dialog, summary')) return;
      if (MOVEMENT.has(e.code) || e.code === 'Space' || e.code === 'KeyE') e.preventDefault();
      if (MOVEMENT.has(e.code)) keys.current.add(e.code);
      if ((e.code === 'KeyE' || e.code === 'Space') && !e.repeat) {
        const station = nearestStation(state.current.player);
        if (station) interactRef.current(station);
      }
    };
    const up = e => keys.current.delete(e.code);
    const clear = () => { keys.current.clear(); inputRef.current = { x: 0, y: 0 }; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    window.addEventListener('blur', clear); document.addEventListener('visibilitychange', clear);
    return () => { clear(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear); };
  }, [paused, art, inputRef]);

  useAnimationFrame((dt, time) => {
    const canvas = canvasRef.current;
    if (!canvas || !art) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
      canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
    }
    const s = state.current;
    const has = (...codes) => codes.some(c => keys.current.has(c));
    const dx = paused ? 0 : Number(has('KeyD', 'ArrowRight')) - Number(has('KeyA', 'ArrowLeft')) + inputRef.current.x;
    const dy = paused ? 0 : Number(has('KeyS', 'ArrowDown')) - Number(has('KeyW', 'ArrowUp')) + inputRef.current.y;
    if (!paused) {
      s.player = moveActor(s.player, dx, dy, dt);
      if (dx || dy) s.player.angle = Math.atan2(dx, dy);
      positionRef.current = s.player;
      // A floating robot follows with frame-rate independent lerp. If a wall is in
      // the way, move towards the player's trail instead of crossing the hull.
      const target = canOccupy(s.player.x - 40, s.player.y - 25, 12) ? { x: s.player.x - 40, y: s.player.y - 25 } : s.player;
      const alpha = 1 - Math.exp(-4 * dt);
      const candidate = { x: s.titus.x + (target.x - s.titus.x) * alpha, y: s.titus.y + (target.y - s.titus.y) * alpha };
      if (canOccupy(candidate.x, candidate.y, 12)) s.titus = candidate;
      else s.titus = moveActor(s.titus, s.player.x - s.titus.x, s.player.y - s.titus.y, dt * .8);
      const distance = Math.hypot(s.player.x - s.titus.x, s.player.y - s.titus.y);
      if (guidePoint) s.titus.angle = Math.atan2(guidePoint.x - s.titus.x, guidePoint.y - s.titus.y);
      else if (distance > 35) s.titus.angle = Math.atan2(s.player.x - s.titus.x, s.player.y - s.titus.y);
      tickCrew(Boolean(dx || dy), distance > 26, dt, s);
    }
    const near = nearestStation(s.player);
    const room = roomAt(s.player);
    if (near?.id !== s.nearId) { s.nearId = near?.id; onNear(near); }
    if (room !== s.room) { s.room = room; onRoom(room); }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.dataset.sky = grounded ? 'pad' : 'space';
    drawDeck(ctx, rect.width, rect.height, { ...s, near, time, reduced, moving: !reduced && Boolean(dx || dy), titusMood, emergency, grounded }, art, zoom);
    const bubble = bubbleRef.current;
    if (bubble) {
      const deck = art.manifest.deck;
      const view = deckView(rect.width, rect.height, s.player, deck, zoom);
      placeCrewBubble(
        bubble, canvas, { width: rect.width, height: rect.height }, view.scale,
        actorScreen(rect.width, rect.height, s.player, s.player, deck, zoom),
        actorScreen(rect.width, rect.height, s.player, s.titus, deck, zoom),
        art.manifest.actors.astronaut, art.manifest.actors.titus,
      );
    }
  });
  return <div className="deck-viewport"><canvas ref={canvasRef} className="ship-canvas" tabIndex={0} aria-label="Cubierta de exploración. Mueve al astronauta con WASD o flechas. Pulsa E junto a una consola para conocer su función.">Tu navegador necesita soporte Canvas para mostrar la nave.</canvas>
    {speech && <p ref={bubbleRef} className="titus-bubble" role="status"><b>Titus</b><span>{speech}</span></p>}
    {!art && <div className="asset-loading" role="status">{loadError ? <><p>{loadError}</p><button className="secondary-button" onClick={() => setAttempt(n => n + 1)}>Reintentar carga</button></> : <p>Preparando la cubierta y la tripulación…</p>}</div>}</div>;
}
