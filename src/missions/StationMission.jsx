import { useEffect, useState } from 'react';
import { nextObjective } from '../data/levelDefinitions.js';
import { stationDescriptions } from '../data/stationDescriptions.js';
import LaunchPanel from '../components/LaunchPanel.jsx';
import LandingPanel from './LandingPanel.jsx';
import { playSound } from '../audio/audioManager.js';

function Signal({ onAnswer }) {
  const [channel, setChannel] = useState(1);
  const [waiting, setWaiting] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => { setWaiting(false); setMessage('Respuesta recibida. Señal registrada en la bitácora ficticia.'); onAnswer(channel); }, 2600);
    return () => clearTimeout(timer);
  }, [waiting]);
  return <><label>Canal ficticio {channel}<input aria-label="Canal de señal" type="range" min="1" max="10" value={channel} disabled={waiting} onChange={e => setChannel(Number(e.target.value))} /></label>
    <div className="signal-bars" aria-label={channel === 7 ? 'Señal fuerte' : 'Ruido'}>{channel === 7 ? '▂ ▆ ▂ ▆ ▂ ▆' : '▁ ▂ ▁ ▁ ▂ ▁'}</div>
    <p>Modelo de ida y vuelta: 2 × 384.400 km / 299.792 km/s ≈ 2,6 s, sin demora humana. Es una aproximación con distancia media.</p>
    <button className="primary-button" disabled={waiting} onClick={() => setWaiting(true)}>{waiting ? 'Esperando respuesta…' : 'Enviar y registrar'}</button><p role="status">{message}</p></>;
}
function Challenge({ task, state, dispatch, onClose }) {
  const [checks, setChecks] = useState([]);
  const [value, setValue] = useState(task.kind === 'alignment' ? 0 : '');
  const [allocation, setAllocation] = useState({ life: 10, navigation: 10, propulsion: 10, communication: 10, research: 20 });
  const [countdown, setCountdown] = useState(null);
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { playSound('launch'); dispatch({ type: 'flight', value: f => ({ ...f, status: 'ready' }) }); setCountdown(null); return; }
    playSound('countdown');
    const timer = setTimeout(() => setCountdown(n => n - 1), 700);
    return () => clearTimeout(timer);
  }, [countdown]);
  function answer(payload) {
    playSound('click');
    dispatch({ type: 'answer', id: task.id, stationId: task.stationId, value: payload });
  }
  if (task.kind === 'launch') return <div className="beta-panel"><p>Centro de control ficticio: autorización concedida. Las etapas superiores y la partida lunar se resumen después de separar la primera etapa.</p>
    {state.flight.status === 'ready' && <button className="secondary-button" disabled={countdown !== null} onClick={() => setCountdown(3)}>{countdown !== null ? 'Cuenta regresiva ' + countdown : 'Cuenta regresiva de control'}</button>}
    <LaunchPanel flight={state.flight} setFlight={value => dispatch({ type: 'flight', value })} onFinish={() => answer(true)} onClose={onClose} />
  </div>;
  if (task.kind === 'landing') return <LandingPanel state={state} dispatch={dispatch} onComplete={() => answer(true)} />;
  return <div className="beta-panel"><h3>{task.title}</h3><p>{task.prompt}</p>
    {task.kind === 'checks' && <fieldset><legend>Comprobaciones obligatorias</legend>{task.options.map(option => <label className="beta-check" key={option}><input type="checkbox" checked={checks.includes(option)} onChange={e => setChecks(items => e.target.checked ? [...items, option] : items.filter(x => x !== option))} />{option}</label>)}</fieldset>}
    {['choice','analysis','site'].includes(task.kind) && <fieldset><legend>Tu decisión</legend>{(task.kind === 'site' ? ['A','B','C'] : task.options).map(option => <label className="beta-check" key={option}><input type="radio" name={task.id} value={option} checked={value === option} onChange={() => setValue(option)} />{option}</label>)}</fieldset>}
    {task.kind === 'alignment' && <><div className="orbit-diagram"><span>TIERRA</span><i style={{ transform: 'rotate(' + value + 'deg)' }}>↑</i><span>LUNA</span></div><label>Orientación {value}°<input type="range" aria-label="Orientación" min="0" max="180" value={value} onChange={e => setValue(Number(e.target.value))} /></label><p>Referencia objetivo: {task.answer}° · trayectoria esquemática.</p></>}
    {task.kind === 'allocation' && <>{Object.entries(allocation).map(([key, amount]) => <label key={key}>{({ life: 'Soporte vital', navigation: 'Navegación', propulsion: 'Propulsión', communication: 'Comunicaciones', research: 'Investigación' })[key]} <output>{amount}</output><input type="range" min="0" max="30" step="5" aria-label={key} value={amount} onChange={e => setAllocation(a => ({ ...a, [key]: Number(e.target.value) }))} /></label>)}<p>Total {Object.values(allocation).reduce((a,b) => a+b,0)} / 60 unidades de juego.</p></>}
    {stationDescriptions[task.stationId] && <a href={stationDescriptions[task.stationId].source} target="_blank" rel="noreferrer">Consultar referencia NASA</a>}
    {task.kind === 'signal' ? <Signal onAnswer={answer} /> : <button className="primary-button" onClick={() => answer(task.kind === 'checks' ? checks : task.kind === 'allocation' ? allocation : task.kind === 'collect' ? true : value)}>{task.kind === 'collect' ? 'Recoger muestra etiquetada' : 'Confirmar decisión'}</button>}
  </div>;
}
function FieldSample({ station, state, dispatch, onClose }) {
  const owned = state.collectedSamples.find(sample => sample.id === station.id);
  return <div className="beta-panel"><h3>{station.name}</h3>
    <p>Muestra de entrenamiento del mapa ficticio. Su descripción se apoya en tipos de roca y suelo estudiados por la NASA. El color no revela la composición.</p>
    {owned ? <p role="status">{owned.analyzed ? 'Análisis registrado en la bitácora.' : 'Está en el inventario. Llévala al laboratorio.'}</p>
      : <button className="primary-button" onClick={() => dispatch({ type: 'collect', id: station.id })}>Recoger muestra etiquetada</button>}
    <p>{state.message}</p>
    <button className="secondary-button" onClick={onClose}>Volver a la superficie</button>
  </div>;
}
function LabDesk({ state, dispatch, onClose }) {
  const pending = state.collectedSamples.filter(sample => !sample.analyzed);
  return <div className="beta-panel"><h3>Laboratorio</h3>
    <p>El instrumento simulado clasifica la muestra. No inventa una composición a partir del color. Cada análisis gasta 8 unidades de energía.</p>
    {pending.length === 0 && <p>No hay muestras pendientes.</p>}
    {pending.map(sample => <button className="primary-button" key={sample.id} onClick={() => dispatch({ type: 'analyze', id: sample.id })}>Analizar {sample.id}</button>)}
    <p role="status">{state.message}</p>
    <button className="secondary-button" onClick={onClose}>Cerrar laboratorio</button>
  </div>;
}
export default function StationMission({ station, state, dispatch, onClose }) {
  if (!state || !dispatch) return <div className="beta-panel"><p>Esta estación se usa dentro de la campaña.</p><button className="secondary-button" onClick={onClose}>Cerrar</button></div>;
  const task = nextObjective(state);
  if (state.currentLevel === 6 && ['regolith', 'basalt', 'highland'].includes(station.id)) {
    return <FieldSample station={station} state={state} dispatch={dispatch} onClose={onClose} />;
  }
  if (state.currentLevel === 6 && station.id === 'lab') return <LabDesk state={state} dispatch={dispatch} onClose={onClose} />;
  if (task?.stationId === station.id) return <Challenge key={task.id} task={task} state={state} dispatch={dispatch} onClose={onClose} />;
  const description = stationDescriptions[station.id];
  const where = task ? 'Objetivo activo: ' + task.title + '. Acércate a ' + task.stationId + '.' : state.currentLevel === 6
    ? 'Usa el panel de turnos. Sal a recoger muestras solo cuando el aviso solar esté controlado.'
    : 'Has completado los objetivos de este nivel.';
  return <div className="beta-panel"><h3>{station.name}</h3><p>{description?.text ?? 'Equipo de la expedición lunar ficticia.'}</p>
    <p>{where}</p>
    {description && <a href={description.source} target="_blank" rel="noreferrer">Consultar referencia NASA</a>}
    <button className="secondary-button" onClick={onClose}>Volver a explorar</button></div>;
}

