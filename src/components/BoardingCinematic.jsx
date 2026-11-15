import { useEffect, useRef, useState } from 'react';
import { assetUrl } from '../game/assets.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { playSound } from '../audio/audioManager.js';
import '../styles/boarding.css';

const captions = [
  ['Centro de lanzamiento', 'Alex Ríos y Titus llegan a la pasarela. La expedición lunar está a punto de comenzar.'],
  ['Rumbo a la escotilla', 'Titus: «Comandante, tu asiento está preparado. Revisaremos los sistemas antes de encender los motores».'],
  ['Tripulación a bordo', 'Alex entra en la nave. Titus lo sigue y la escotilla se cierra.'],
  ['Comienza la aventura', 'Control: «Tripulación a bordo. Inicien las comprobaciones de seguridad».'],
];

export default function BoardingCinematic({ onComplete, reducedMotion = false }) {
  const systemReduced = useReducedMotion();
  const reduced = reducedMotion || systemReduced;
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const finished = useRef(false);
  const skip = useRef(null);
  const phase = Math.min(3, Math.floor(elapsed / 3));
  const done = elapsed >= 12;

  useEffect(() => { skip.current?.focus(); }, []);
  useEffect(() => {
    if (paused || reduced || done) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const delta = Math.min((now - last) / 1000, .2);
      last = now;
      if (!document.hidden) setElapsed(value => Math.min(12, value + delta));
    }, 80);
    return () => clearInterval(timer);
  }, [paused, reduced, done]);

  useEffect(() => { if (phase === 2) playSound('close'); }, [phase]);

  function finish() {
    if (finished.current) return;
    finished.current = true;
    onComplete();
  }

  const progress = reduced ? (phase / 3) : Math.min(elapsed / 9, 1);
  const x = 11 + progress * 57;
  const frame = reduced || paused || progress >= 1 ? 0 : 1 + Math.floor(elapsed * 9) % 8;
  const visible = progress < .96;
  return <section className="boarding" aria-label="Embarque de Alex y Titus" onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); finish(); }
  }}>
    <header className="boarding-heading"><span>LUNARIA · ACADEMIA DE EXPLORADORES LUNARES</span><p>Nivel 1 · El lanzamiento</p></header>
    <div className="boarding-scene" role="img" aria-label="Alex y Titus cruzan una pasarela elevada hacia la escotilla de un cohete en la plataforma de lanzamiento">
      <div className="boarding-moon" />
      <div className="boarding-cloud cloud-one" /><div className="boarding-cloud cloud-two" />
      <div className="boarding-tower"><i /><i /><i /><i /><i /></div>
      <div className="boarding-rocket"><div className="boarding-nose" /><span>L U N A R I A</span>
        <div className="boarding-window" /><div className="boarding-hatch" data-closed={!visible} /><div className="boarding-engine" />
      </div>
      <div className="boarding-platform" />
      <div className="boarding-walkway" />
      <div className="boarding-crew" style={{ left: x + '%', opacity: visible ? 1 : 0 }}>
        {imageFailed ? <span className="boarding-fallback">ALEX · TITUS</span> : <>
          <div className="boarding-actor" style={{ backgroundImage: 'url("' + assetUrl('astronaut.png') + '")', backgroundPosition: (-frame * 96) + 'px -240px' }} />
          <div className="boarding-robot" style={{ backgroundImage: 'url("' + assetUrl('titus.png') + '")', backgroundPosition: (-Math.floor(elapsed * 8) % 8 * 72) + 'px -180px' }} />
          <img hidden src={assetUrl('astronaut.png')} alt="" onError={() => setImageFailed(true)} />
        </>}
      </div>
      <div className="boarding-ground" />
      <span className="boarding-location">PLATAFORMA DE LANZAMIENTO · EXPEDICIÓN FICTICIA</span>
    </div>
    <div className="boarding-caption" aria-live="polite">
      <h1>{captions[phase][0]}</h1><p>{captions[phase][1]}</p>
    </div>
    <footer className="boarding-actions">
      <button ref={skip} className="secondary-button" onClick={finish}>{done ? 'Entrar en la nave' : 'Omitir cinemática'}</button>
      {reduced && !done && <button className="primary-button" onClick={() => setElapsed(value => Math.min(12, value + 3))}>Siguiente escena</button>}
      {!reduced && !done && <button className="quiet-button" onClick={() => setPaused(value => !value)}>{paused ? 'Reanudar' : 'Pausar'}</button>}
      <span>{reduced ? 'Avance manual · Movimiento reducido' : 'Esc · Omitir'}</span>
    </footer>
  </section>;
}
