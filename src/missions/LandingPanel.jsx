import { useEffect, useRef, useState } from 'react';
import { createLanding, landingSites, stepLanding } from '../game/landingSimulation.js';
import { useAnimationFrame } from '../hooks/useAnimationFrame.js';
import { playSound } from '../audio/audioManager.js';

export default function LandingPanel({ state, dispatch, onComplete }) {
  const flight = state.landing;
  const [paused, setPaused] = useState(false);
  const steering = useRef(0);
  const thrustAt = useRef(0);
  const statusWas = useRef(flight.status);
  const held = useRef(new Set());
  const site = landingSites[state.site];
  const update = value => dispatch({ type: 'landing', value });
  useEffect(() => {
    const down = event => {
      if (event.target.closest('input,button,textarea,select')) return;
      if (!['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(event.code)) return;
      event.preventDefault();
      held.current.add(event.code);
      steering.current = Number(held.current.has('ArrowRight') || held.current.has('KeyD')) - Number(held.current.has('ArrowLeft') || held.current.has('KeyA'));
    };
    const up = event => { held.current.delete(event.code); steering.current = 0; };
    const clear = () => { held.current.clear(); steering.current = 0; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear);
    return () => { clear(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); };
  }, []);
  useEffect(() => {
    if (statusWas.current !== 'failed' && flight.status === 'failed') playSound('error');
    statusWas.current = flight.status;
  }, [flight.status]);
  useAnimationFrame(dt => {
    thrustAt.current += dt;
    if (thrustAt.current > 0.4) { thrustAt.current = 0; playSound('thrust'); }
    update(current => stepLanding({ ...current, steer: steering.current }, dt));
  }, !paused && flight.status === 'flying');
  const padX = 50 + site.center / 2;
  return <div className="beta-panel">
    <p>Gravedad de referencia: 1,62 m/s². Empuje, combustible, masa y límites seguros son parámetros del simulador. Toca dentro de la zona con velocidad vertical ≤3 m/s y horizontal ≤2 m/s.</p>
    <div className="landing-view" tabIndex={0} aria-label="Descenso lunar interactivo">
      <div className="landing-moon" />
      <div className="landing-pad" style={{ left: padX + '%', width: site.width / 2 + '%' }}>Zona {state.site}</div>
      <div className="landing-craft" style={{ left: (50 + flight.x / 2) + '%', bottom: (12 + Math.min(80, flight.altitude / 180 * 80)) + '%' }}><span>▣</span>{flight.throttle > .3 && flight.status === 'flying' && <i>▼</i>}</div>
    </div>
    <div className="beta-meters"><span>Altura <b>{flight.altitude.toFixed(1)} m</b></span><span>Descenso <b>{flight.vy.toFixed(1)} m/s</b></span><span>Horizontal <b>{flight.vx.toFixed(1)} m/s</b></span><span>Combustible <b>{flight.fuel.toFixed(0)} % simulado</b></span></div>
    <label>Empuje {Math.round(flight.throttle * 100)} %<input aria-label="Empuje de descenso" type="range" min="0" max="100" value={Math.round(flight.throttle * 100)} disabled={flight.status !== 'flying' || paused} onChange={e => update(f => ({ ...f, throttle: Number(e.target.value) / 100 }))} /></label>
    <p>Titus: deja descender hasta unos 25 m, sube el empuje para frenar y ajústalo cerca del 39 % para mantener una velocidad pequeña. Suelta las correcciones horizontales con anticipación.</p>
    <div className="beta-actions">
      {[-1,1].map(dir => <button key={dir} className="secondary-button" disabled={paused || flight.status !== 'flying'}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); steering.current = dir; }}
        onPointerUp={() => { steering.current = 0; }} onPointerCancel={() => { steering.current = 0; }} onLostPointerCapture={() => { steering.current = 0; }}>{dir < 0 ? '← Corregir' : 'Corregir →'}</button>)}
      {flight.status === 'ready' && <button className="primary-button" onClick={() => { playSound('launch'); update(f => ({ ...f, status: 'flying' })); }}>Iniciar descenso</button>}
      {flight.status === 'flying' && <button className="secondary-button" onClick={() => { steering.current = 0; setPaused(!paused); }}>{paused ? 'Reanudar descenso' : 'Pausar descenso'}</button>}
      {flight.status === 'success' && <button className="primary-button" onClick={() => { playSound('landing'); onComplete(); }}>Aterrizaje seguro · salir a la superficie</button>}
      {flight.status === 'failed' && <><p role="alert">Contacto fuera de límites seguros. Titus: corrige antes y reduce la velocidad con el motor.</p><button className="primary-button" onClick={() => { update(createLanding(state.site)); setPaused(false); }}>Reintentar descenso</button></>}
    </div>
  </div>;
}

