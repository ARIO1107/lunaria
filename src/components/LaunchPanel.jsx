import { useRef, useState } from 'react';
import { GAME_TUNING, nasaTelemetry } from '../data/nasaTelemetry.js';
import { launchAction, launchGuidance, missionClock, stepLaunch } from '../game/launchSimulation.js';
import { drawRocket } from '../game/renderers.js';
import { useAnimationFrame } from '../hooks/useAnimationFrame.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import TitusDialogue from './TitusDialogue.jsx';
import CheckIcon from './CheckIcon.jsx';

const H = nasaTelemetry.launch.verified;
function Meter({ label, value, display, danger = false, safeLimit }) {
  return <div className={`meter ${danger ? 'is-danger' : ''}`}><div className="flex justify-between gap-3"><span>{label}</span><strong>{display}</strong></div>
    <div className="meter-track" role="meter" aria-label={label} aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${Math.min(value * 100, 100)}%` }} />{safeLimit && <b style={{ left: `${safeLimit * 100}%` }} />}
    </div></div>;
}

export default function LaunchPanel({ flight, setFlight, onFinish, onClose }) {
  const [paused, setPaused] = useState(false);
  const canvas = useRef(null);
  const reduced = useReducedMotion();
  const done = flight.status === 'success' || flight.status === 'failed';
  const guidance = launchGuidance(flight);
  const action = (name, value) => setFlight(s => launchAction(s, name, value));
  useAnimationFrame(dt => {
    if (!paused) setFlight(s => stepLaunch(s, dt));
    if (!canvas.current) return;
    const el = canvas.current;
    const rect = el.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    el.width = Math.round(rect.width * dpr); el.height = Math.round(rect.height * dpr);
    const ctx = el.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawRocket(ctx, rect.width, rect.height, flight, reduced);
  }, !done);

  if (done) return <div className="result-panel">
    <div className={`result-symbol ${flight.status}`} aria-hidden="true">{flight.status === 'success' ? <CheckIcon /> : '↻'}</div>
    <h3>{flight.status === 'success' ? 'Primera etapa. Gran paso.' : 'Cada intento te enseña algo.'}</h3>
    <p>{guidance.text}</p>
    <section className="telemetry-card"><h3>Telemetría Real NASA</h3><p>Apolo 11 · 16 de julio de 1969. Tu vuelo es una simulación acelerada ×{GAME_TUNING.missionTimeScale}.</p>
      <table><thead><tr><th>Evento</th><th>Apolo 11</th><th>Tu simulación</th></tr></thead><tbody>
        <tr><td>Max Q</td><td>T+{missionClock(H.maxQTimeS)}</td><td>{flight.time >= H.maxQTimeS ? 'Atravesado' : 'No alcanzado'}</td></tr>
        <tr><td>Apagado central</td><td>T+{missionClock(H.centerEngineCutoffTimeS)}</td><td>{flight.cutoffTime === null ? 'Sin ejecutar' : `T+${missionClock(flight.cutoffTime)}`}</td></tr>
        <tr><td>Separación S-IC</td><td>T+{missionClock(H.separationTimeS)}</td><td>{flight.separationTime === null ? 'Sin ejecutar' : `T+${missionClock(flight.separationTime)}`}</td></tr>
      </tbody></table>
      <p>Máxima aceleración histórica: {H.peakAccelerationG} g. La carga y el calor del juego son indicadores normalizados, no mediciones históricas.</p>
      <a href={nasaTelemetry.launch.source.url} target="_blank" rel="noreferrer">Consultar cronología oficial NASA ↗</a>
    </section>
    <div className="flex flex-wrap gap-3"><button className="primary-button" onClick={() => { if (flight.status === 'success') onFinish(); onClose(); }}>Volver a la nave</button>
      <button className="secondary-button" onClick={() => { if (flight.status === 'success') onFinish(); action('reset'); setPaused(false); }}>Repetir entrenamiento</button></div>
  </div>;

  const inMaxQ = flight.time >= GAME_TUNING.maxQStartS && flight.time <= GAME_TUNING.maxQEndS;
  const canCut = flight.status === 'flying' && flight.time >= H.centerEngineCutoffTimeS && !flight.centerOff && !paused;
  const canSeparate = flight.status === 'flying' && flight.centerOff && flight.time >= H.separationTimeS && !paused;
  return <div className="launch-panel">
    <div className="launch-topline"><span>Nivel 1 · Secuencia de ascenso S-IC</span><strong className="mission-clock">T+{missionClock(flight.time)}</strong><span>Tiempo ×{GAME_TUNING.missionTimeScale}</span></div>
    <div className="launch-grid"><div className="rocket-view"><canvas ref={canvas} aria-label="Animación esquemática del Saturno V" /><div className="engine-readout">Motores F-1 <strong>{flight.status === 'ready' ? '0' : flight.centerOff ? '4' : '5'} / 5</strong></div></div>
      <div className="flight-controls">
        <div className="flight-state"><span>{paused ? 'Simulación en pausa' : flight.status === 'ready' ? 'Esperando encendido' : canSeparate ? 'Separación disponible' : inMaxQ ? 'Zona Max Q' : 'Ascenso en curso'}</span><span className="status-light" /></div>
        <Meter label="Carga aerodinámica" value={flight.pressure} display={`${Math.round(flight.pressure * 100)} %`} danger={flight.pressure > .7} safeLimit={.7} />
        <small>Zona segura: hasta 70 %. Indicador de juego.</small>
        <Meter label="Estrés del vehículo" value={flight.heat / 100} display={`${Math.round(flight.heat)} / 100`} danger={flight.heat > 70} />
        <div className="acceleration"><span>Aceleración simulada</span><strong>{flight.acceleration.toFixed(1)} <small>g</small></strong></div>
        <label className="throttle-label" htmlFor="throttle">Acelerador <strong>{Math.round(flight.throttle * 100)} %</strong></label>
        <input id="throttle" type="range" min="35" max="100" step="1" value={Math.round(flight.throttle * 100)} disabled={flight.status !== 'flying' || paused} onChange={e => action('throttle', Number(e.target.value) / 100)} />
        <div className="throttle-presets"><button disabled={flight.status !== 'flying' || paused} onClick={() => action('throttle', .6)}>60 % · Max Q</button><button disabled={flight.status !== 'flying' || paused} onClick={() => action('throttle', 1)}>100 % · Ascenso</button></div>
        <div className="launch-actions">
          {flight.status === 'ready' ? <button className="primary-button" onClick={() => action('ignite')}>Encender motores</button> : <button className="secondary-button" onClick={() => setPaused(!paused)}>{paused ? 'Reanudar vuelo' : 'Pausar vuelo'}</button>}
          <button className={canCut ? 'primary-button' : 'secondary-button'} disabled={!canCut} onClick={() => action('cutoff')}>{flight.centerOff ? 'Motor central apagado' : 'Apagar motor central'}</button>
          <button className={canSeparate ? 'primary-button' : 'secondary-button'} disabled={!canSeparate} onClick={() => action('separate')}>Separar etapa</button>
        </div>
        <small>Apagado desde 02:15 · Separación desde 02:42. Cerrar el panel pausa el vuelo.</small>
      </div>
    </div>
    <TitusDialogue mood={guidance.mood}>{guidance.text}</TitusDialogue>
    <p className="simulation-note">Adaptación educativa: el Saturno V real no tenía este acelerador manual. Completar S-IC no equivale aún a alcanzar órbita.</p>
  </div>;
}
