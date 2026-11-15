import { useEffect, useState } from 'react';
import { nextObjective } from '../data/levelDefinitions.js';
import { stationDescriptions } from '../data/stationDescriptions.js';
import LaunchPanel from '../components/LaunchPanel.jsx';
import LifeSupportConsole from './LifeSupportConsole.jsx';
import LandingPanel from './LandingPanel.jsx';
import { BackupBoard, CabinAir, CoasSight, SignalRadio, SupplyLocker } from './ShipTour.jsx';
import { AirlockReturn, BaseAir, BreakerPull, FaultLamps, HabitatScan, HorizonLock, LabScope, LanderPrep, OrbitBurn, PartsTray, RepairSequence, RouteCheck, ShadowLink, SuitLock, TaggedSample, TextureLook, WaterChoice, ZoneMap } from './DistinctMissions.jsx';
import { playSound } from '../audio/audioManager.js';

const distinct = {
  diagnose: FaultLamps, isolate: BreakerPull, replace: PartsTray, 'repair-test': RepairSequence, stabilize: HorizonLock, orbit: OrbitBurn,
  site: ZoneMap, module: LanderPrep, 'eva-check': SuitLock, observe: TextureLook, return: AirlockReturn,
  habitat: HabitatScan, solar: ShadowLink, life: BaseAir, water: WaterChoice, 'surface-suit': RouteCheck, sample: TaggedSample, analysis: LabScope,
};
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
  if (task.kind === 'eclss') return <div className="beta-panel"><h3>{task.title}</h3><p>{task.prompt}</p><LifeSupportConsole onAnswer={answer} /></div>;
  if (task.id === 'navigation') return <div className="beta-panel"><h3>{task.title}</h3><p>{task.prompt}</p><CoasSight onAnswer={answer} /></div>;
  if (task.id === 'supplies') return <div className="beta-panel"><h3>{task.title}</h3><p>{task.prompt}</p><SupplyLocker onAnswer={answer} /></div>;
  if (task.id === 'atmosphere') return <div className="beta-panel"><h3>{task.title}</h3><p>{task.prompt}</p><CabinAir onAnswer={answer} /></div>;
  if (task.id === 'energy-tour') return <div className="beta-panel"><h3>{task.title}</h3><p>{task.prompt}</p><BackupBoard onAnswer={answer} /></div>;
  if (task.id === 'signal') return <div className="beta-panel"><h3>{task.title}</h3><p>{task.prompt}</p><SignalRadio onAnswer={answer} /></div>;
  const Distinct = distinct[task.id];
  if (Distinct) return <div className="beta-panel"><h3>{task.title}</h3><p>{task.prompt}</p><Distinct onAnswer={answer} /></div>;
  if (task.kind === 'launch') return <div className="beta-panel"><p>Centro de control ficticio: autorización concedida. Este simulador cubre la primera etapa, todavía en la plataforma. Al separarla, una película resume el ascenso hasta la órbita terrestre.</p>
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
    <button className="primary-button" onClick={() => answer(task.kind === 'checks' ? checks : task.kind === 'allocation' ? allocation : task.kind === 'collect' ? true : value)}>{task.kind === 'collect' ? 'Recoger muestra etiquetada' : 'Confirmar decisión'}</button>
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

