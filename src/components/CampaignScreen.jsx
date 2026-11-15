import { useCallback, useEffect, useRef, useState } from 'react';
import ShipCanvas from './ShipCanvas.jsx';
import SurfaceCanvas from './SurfaceCanvas.jsx';
import Modal from './Modal.jsx';
import CrewGallery from './CrewGallery.jsx';
import CinematicPlayer from '../cinematic/CinematicPlayer.jsx';
import TitusAssistant, { ScienceFact, ScienceLogbook } from './TitusAssistant.jsx';
import StationMission from '../missions/StationMission.jsx';
import { roomAt, STATIONS } from '../game/world.js';
import { SURFACE_OBJECTS } from '../game/surfaceWorld.js';
import { registerCampaignStations } from '../game/missionRegistry.js';
import { levelById, nextObjective } from '../data/levelDefinitions.js';
import { factsForLevel } from '../data/scienceFacts.js';
import { stationDescriptions } from '../data/stationDescriptions.js';
import { operationsActions } from '../game/resourceEngine.js';
import { assetUrl } from '../game/assets.js';
import { playSound, startGameBed, stopGameBed, suspendAudio } from '../audio/audioManager.js';
import { titusAtStation } from '../game/titusGuide.js';
import { bubbleSpeech } from '../game/titusBubbles.js';
import FirstPersonBay from '../view/FirstPersonBay.jsx';

registerCampaignStations(StationMission);

const placeName = Object.fromEntries([...STATIONS, ...SURFACE_OBJECTS].map(place => [place.id, place.name]));
const sampleNames = { regolith: 'Regolito', basalt: 'Basalto', highland: 'Tierras altas' };

function Story({ kicker, title, children, actions }) {
  return <main className="story-screen"><section className="story-card">
    <p className="story-kicker">{kicker}</p><h1>{title}</h1>{children}<div className="beta-actions">{actions}</div>
  </section></main>;
}

function Resources({ campaign }) {
  const { ship, lander, base } = campaign.resources;
  if (campaign.currentLevel >= 5) {
    return <div className="resource-strip" aria-label="Recursos de la estación, en unidades simuladas">
      <span>Energía {Math.round(base.energy)}</span><span>Oxígeno {Math.round(base.oxygen)}</span><span>Agua {Math.round(base.water)}</span>
      <span>Refugio {base.habitatOperational ? 'listo' : 'pendiente'}</span><span>Ciencia {base.science}</span><span>Ciclo {campaign.cycle}</span>
    </div>;
  }
  if (campaign.currentLevel === 4) {
    return <div className="resource-strip" aria-label="Recursos del descenso, en unidades simuladas">
      <span>Combustible del módulo {Math.round(lander.fuel)}</span><span>Zona {campaign.site}</span><span>Nave: combustible {Math.round(ship.fuel)}</span>
    </div>;
  }
  return <div className="resource-strip" aria-label="Recursos de la nave, en unidades simuladas">
    <span>Combustible {Math.round(ship.fuel)}</span><span>Energía {Math.round(ship.energy)}</span><span>Oxígeno {Math.round(ship.oxygen)}</span>
  </div>;
}

function Operations({ campaign, dispatch }) {
  const light = campaign.cycle % 2 !== 0;
  return <section className="station-card"><div className="section-heading"><h3>Turno de operaciones</h3><span>Ciclo {campaign.cycle}</span></div>
    <p>{light ? 'Hay iluminación en este turno. Los paneles pueden recargar.' : 'Turno de sombra. Los paneles no generan electricidad.'} Los números son unidades de juego, no mediciones de una misión.</p>
    <div className="op-grid">
      {Object.entries(operationsActions).map(([name, action]) => <button key={name} className="secondary-button" disabled={campaign.usedActions.includes(name)}
        onClick={() => dispatch({ type: 'operation', name })}>{action.title}</button>)}
      <button className="primary-button" onClick={() => dispatch({ type: 'operation', name: 'cycle' })}>Cerrar ciclo</button>
    </div>
    <p>Actividades {campaign.activities}/3 · ciclos cerrados {Math.max(0, campaign.cycle - 1)}/3. Cada botón explica su costo al usarlo y solo cuenta una vez por ciclo.</p>
  </section>;
}

export default function CampaignScreen({ campaign, dispatch, settings, onSettings, onExit }) {
  const level = levelById(campaign.currentLevel);
  const task = nextObjective(campaign);
  const onSurface = campaign.currentLevel > 4 || (campaign.currentLevel === 4 && campaign.completedObjectives.includes('landing'));
  const emergency = campaign.currentLevel === 3 && campaign.phase === 'active';
  const solarAlert = campaign.currentLevel === 6 && campaign.radiation && !campaign.sheltered;
  const shipPos = useRef(campaign.position);
  const surfacePos = useRef(campaign.surfacePosition);
  const zoomRef = useRef(campaign.zoom);
  const inputRef = useRef({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(campaign.zoom);
  const [room, setRoom] = useState(() => onSurface ? 'Puesto avanzado · Región polar ficticia' : roomAt(campaign.position));
  const [near, setNear] = useState(null);
  const [modal, setModal] = useState(null);
  const [bubbleTick, setBubbleTick] = useState(0);
  const [moment, setMoment] = useState('walk');
  const seenGoals = useRef(campaign.completedObjectives.length);
  const soundedGoals = useRef(campaign.completedObjectives.length);
  const heardSpeech = useRef('');
  const heardError = useRef(null);
  const heardSamples = useRef(campaign.collectedSamples.length);
  const errorsReady = useRef(false);
  const alarmed = useRef(false);
  const reportRoom = useCallback(name => setRoom(name), []);
  const targetStation = STATIONS.find(station => station.id === task?.stationId);
  const guidePoint = targetStation
    ? { x: targetStation.x + targetStation.w / 2, y: targetStation.y + targetStation.h / 2 }
    : null;

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => {
    const count = campaign.completedObjectives.length;
    if (count <= seenGoals.current) return undefined;
    const previous = seenGoals.current;
    seenGoals.current = count;
    if (count > soundedGoals.current) {
      soundedGoals.current = count;
      playSound('success');
    }
    setMoment('done');
    const timer = window.setTimeout(() => setMoment('walk'), 9000);
    return () => {
      window.clearTimeout(timer);
      // A cancelled run must be able to arm the fact again. Loading a save does not enter this branch.
      seenGoals.current = previous;
    };
  }, [campaign.completedObjectives.length]);
  useEffect(() => {
    if (campaign.phase === 'complete') playSound('levelComplete');
  }, [campaign.phase, campaign.currentLevel]);
  useEffect(() => {
    const quiet = campaign.phase !== 'active' || settings.soundEnabled === false || modal?.type === 'pause';
    if (quiet) stopGameBed();
    else startGameBed();
    return () => stopGameBed();
  }, [campaign.phase, settings.soundEnabled, modal?.type]);
  useEffect(() => {
    const error = campaign.flags?.lastError || null;
    if (errorsReady.current && error && error !== heardError.current) playSound('error');
    heardError.current = error;
    errorsReady.current = true;
  }, [campaign.flags?.lastError]);
  useEffect(() => {
    const count = campaign.collectedSamples.length;
    if (count > heardSamples.current) playSound('collect');
    heardSamples.current = count;
  }, [campaign.collectedSamples.length]);
  useEffect(() => {
    if (emergency && !alarmed.current) { alarmed.current = true; playSound('alarm'); }
  }, [emergency]);
  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: 'position', position: shipPos.current, surfacePosition: surfacePos.current, zoom: zoomRef.current }), 1500);
    return () => window.clearInterval(timer);
  }, [dispatch]);
  useEffect(() => { setBubbleTick(0); }, [task?.id, campaign.currentLevel]);
  useEffect(() => {
    if (campaign.phase !== 'active') return undefined;
    const timer = window.setInterval(() => setBubbleTick(value => value + 1), settings.reducedMotion ? 8000 : 6500);
    return () => window.clearInterval(timer);
  }, [campaign.phase, settings.reducedMotion, task?.id, campaign.currentLevel]);
  const speech = campaign.phase === 'active' && !modal
    ? bubbleSpeech(campaign.currentLevel, task, moment === 'done' ? campaign.completedObjectives.length : bubbleTick, moment)
    : '';
  useEffect(() => {
    if (!speech || speech === heardSpeech.current) return;
    heardSpeech.current = speech;
    playSound('robot');
  }, [speech]);
  useEffect(() => {
    if (campaign.phase !== 'active' || !task || near?.id !== task.stationId) return;
    dispatch({ type: 'guide', id: 'at-' + task.id, message: titusAtStation(task) });
  }, [campaign.phase, task, near?.id, dispatch]);
  useEffect(() => {
    if (campaign.phase !== 'active' || modal) return;
    function onKey(event) {
      if (event.key === 'Escape' && !event.repeat && !event.defaultPrevented) setModal({ type: 'pause' });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [campaign.phase, modal]);

  function leave() {
    dispatch({ type: 'position', position: shipPos.current, surfacePosition: surfacePos.current, zoom: zoomRef.current });
    onExit();
  }
  function close() {
    setModal(null);
    requestAnimationFrame(() => document.querySelector('.ship-canvas')?.focus());
  }
  function openStation(station) {
    playSound('open');
    inputRef.current = { x: 0, y: 0 };
    setModal({ type: 'station', station });
  }
  function changeZoom(delta) {
    playSound('click');
    setZoom(value => {
      const next = Math.min(1.75, Math.max(.8, +(value + delta).toFixed(2)));
      zoomRef.current = next;
      return next;
    });
  }
  const direction = (event, x, y) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); inputRef.current = { x, y }; };
  const release = () => { inputRef.current = { x: 0, y: 0 }; };

  if ((campaign.phase === 'cinematic' || campaign.phase === 'launchCinematic') && campaign.currentLevel === 1) {
    const launchFilm = campaign.phase === 'launchCinematic';
    return <CinematicPlayer sequence={launchFilm ? 'launch' : 'opening'} onComplete={() => dispatch({ type: launchFilm ? 'launchCinematicDone' : 'cinematicDone' })} reducedMotion={settings.reducedMotion}
      volume={settings.volume} soundEnabled={settings.soundEnabled !== false} quality={settings.graphics || 'alto'} />;
  }
  if (campaign.phase === 'briefing') {
    return <Story kicker={'Nivel ' + level.id} title={level.title} actions={<>
      <button className="primary-button" onClick={() => { playSound('open'); dispatch({ type: 'begin' }); }}>Comenzar misión</button>
      <button className="secondary-button" onClick={leave}>Menú principal</button>
    </>}>
      <p>{level.subtitle}</p><p>{level.intro}</p>
      {campaign.flags.demo && <p className="demo-flag">Modo demostración: este salto no forma parte de la secuencia normal.</p>}
    </Story>;
  }
  if (campaign.phase === 'complete') {
    const fact = factsForLevel(level.id)[0];
    return <Story kicker="Misión completada" title={level.title} actions={<>
      {campaign.currentLevel < 6 && <button className="primary-button" onClick={() => dispatch({ type: 'advance' })}>Continuar al siguiente nivel</button>}
      {campaign.currentLevel === 6 && <button className="primary-button" onClick={() => dispatch({ type: 'continueOps' })}>Seguir explorando</button>}
      <button className="secondary-button" onClick={leave}>Menú principal</button>
    </>}>
      <p>{level.summary}</p>
      <ScienceFact fact={fact} />
      {campaign.currentLevel === 6 && <p>Decisiones de este tramo: {campaign.decisions.slice(-6).join(' · ') || 'operaciones de la estación'}.</p>}
    </Story>;
  }
  if (campaign.phase === 'failed') {
    return <Story kicker="Intento interrumpido" title="Titus guarda el punto de control" actions={<>
      <button className="primary-button" onClick={() => dispatch({ type: 'retry' })}>Reintentar</button>
      <button className="secondary-button" onClick={leave}>Menú principal</button>
    </>}>
      <p>{campaign.message || 'Un recurso esencial se agotó. Volvemos al inicio de este nivel, sin repetir los anteriores.'}</p>
    </Story>;
  }

  const description = near ? stationDescriptions[near.id] : null;
  return <div className={'app-shell exploration-shell' + (emergency ? ' emergency-deck' : '')}>
    <header className="app-header">
      <div className="brand"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M29 5A16 16 0 1 0 35 28 15 15 0 0 1 29 5Z" fill="currentColor" /></svg><div><h1>Lunaria</h1><span>Nivel {level.id} · {level.title}</span></div></div>
      <div className="deck-mode">{campaign.flags.demo && <span className="demo-flag">Demostración · </span>}{onSurface ? 'Superficie lunar' : campaign.currentLevel === 1 ? 'Cubierta de Lunaria · en tierra' : 'Cubierta de Lunaria'}</div>
      <nav aria-label="Controles de la misión">
        <button className="quiet-button" onClick={leave}>Menú principal</button>
        <button className="quiet-button" onClick={() => { playSound('close'); setModal({ type: 'pause' }); }}>Pausa</button>
        <button className="quiet-button" onClick={() => onSettings({ ...settings, soundEnabled: settings.soundEnabled === false })}>{settings.soundEnabled === false ? 'Activar sonido' : 'Silenciar'}</button>
        <button className="quiet-button" onClick={() => setModal({ type: 'titus' })}>Preguntar a Titus</button>
        <button className="quiet-button" onClick={() => setModal({ type: 'log' })}>Bitácora</button>
        <button className="quiet-button" onClick={() => setModal({ type: 'crew' })}>La tripulación</button>
      </nav>
    </header>
    <main>
      <div className="deck-heading"><div><h2>{task ? task.title : level.title}</h2><p>{task ? 'Ve a ' + (placeName[task.stationId] || task.stationId) + '.' : 'Objetivos de este tramo completados.'}</p></div>
        {campaign.currentLevel === 1 && <div className="system-pills" aria-label="Estado de los sistemas de lanzamiento">
          {[['air', 'Soporte vital'], ['power', 'Energía'], ['fuel', 'Propulsión'], ['clearance', 'Autorización']].map(([id, label]) => <span key={id} data-ready={campaign.completedObjectives.includes(id)}>{label}</span>)}
        </div>}
        <Resources campaign={campaign} /></div>
      {(emergency || solarAlert) && <p className="emergency-banner" role="alert">{emergency
        ? 'Emergencia eléctrica ficticia. Titus: la señal desconocida no explica esta avería. Repara, protege el aire y prepara el frenado orbital.'
        : 'Ejercicio de meteorología espacial. No es una dosis calculada. Suspende las salidas, pulsa Preparar refugio y después cierra el ciclo.'}</p>}
      <div className="game-layout exploration-layout">
        <section className="ship-section" aria-label={onSurface ? 'Superficie lunar' : 'Exploración de la nave'}>
          <div className="map-toolbar"><span><i className="status-light" /> {room}</span><div className="zoom-controls"><button aria-label="Alejar cámara" disabled={zoom <= .8} onClick={() => changeZoom(-.15)}>−</button><span>{Math.round(zoom * 100)} %</span><button aria-label="Acercar cámara" disabled={zoom >= 1.75} onClick={() => changeZoom(.15)}>+</button></div></div>
          {onSurface
            ? <SurfaceCanvas positionRef={surfacePos} reducedMotion={settings.reducedMotion} paused={Boolean(modal)} onNear={setNear} onRoom={reportRoom} onInteract={openStation} inputRef={inputRef} zoom={zoom} titusMood={solarAlert ? 'danger' : 'normal'} speech={speech} />
            : <ShipCanvas positionRef={shipPos} reducedMotion={settings.reducedMotion} paused={Boolean(modal)} onNear={setNear} onRoom={reportRoom} onInteract={openStation} inputRef={inputRef} zoom={zoom} titusMood={emergency ? 'danger' : undefined} emergency={emergency} grounded={campaign.currentLevel === 1} guidePoint={guidePoint} speech={speech} />}
          <div className="map-footer"><span><kbd>W A S D</kbd> / Flechas · Moverse</span><span><kbd>E</kbd> / Espacio · Inspeccionar</span></div>
          <div className="touch-controls" aria-label="Controles táctiles de movimiento">
            {[['↑', 0, -1, 'arriba'], ['←', -1, 0, 'izquierda'], ['↓', 0, 1, 'abajo'], ['→', 1, 0, 'derecha']].map(([label, x, y, name]) => <button key={name} aria-label={'Mover ' + name} onPointerDown={event => direction(event, x, y)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>{label}</button>)}
            <button disabled={!near} onClick={() => near && openStation(near)}>Inspeccionar</button>
          </div>
        </section>
        <aside className="mission-sidebar exploration-sidebar">
          <section className="crew-card"><div className="section-heading"><h3>Titus</h3><span>{solarAlert || emergency ? 'Atención' : 'A bordo'}</span></div>
            <button className="portrait-button" onClick={() => setModal({ type: 'titus' })} aria-label="Preguntar a Titus"><img src={assetUrl('astronaut-portrait.png')} alt="" /><img src={assetUrl('titus-portrait.png')} alt="" /></button>
            <p>{campaign.message || (task ? task.prompt : 'Explora con calma. Cada estación explica su función.')}</p>
          </section>
          <section className="station-card"><div className="section-heading"><h3>{description?.role || (near ? near.name : 'Objetivo')}</h3></div>
            <ul className="objective-list">
              {level.tasks.map(item => <li key={item.id} data-state={campaign.completedObjectives.includes(item.id) ? 'done' : item.id === task?.id ? 'current' : 'waiting'}>
                <input type="checkbox" readOnly checked={campaign.completedObjectives.includes(item.id)} aria-label={item.title} />
                <span>{item.title}</span>
              </li>)}
              {campaign.currentLevel === 6 && <>
                <li data-state={campaign.cycle >= 4 ? 'done' : 'current'}><input type="checkbox" readOnly checked={campaign.cycle >= 4} aria-label="Tres ciclos" /><span>Cerrar tres ciclos</span></li>
                <li data-state={campaign.activities >= 3 ? 'done' : 'current'}><input type="checkbox" readOnly checked={campaign.activities >= 3} aria-label="Tres actividades" /><span>Tres actividades científicas o de mantenimiento</span></li>
              </>}
            </ul>
            <button className="primary-button w-full" disabled={!near} onClick={() => near && openStation(near)}>{near ? 'Inspeccionar equipo' : 'Acércate a un equipo'} <kbd>E</kbd></button>
          </section>
          {campaign.currentLevel === 6 && <Operations campaign={campaign} dispatch={dispatch} />}
          {campaign.collectedSamples.length > 0 && <section className="station-card"><h3>Muestras</h3><ul className="objective-list">{campaign.collectedSamples.map(sample => <li key={sample.id}><span>{sampleNames[sample.id] || sample.id} · {sample.analyzed ? 'analizada' : 'pendiente'}</span></li>)}</ul></section>}
        </aside>
      </div>
    </main>
    {modal?.type === 'station' && <Modal title={modal.station.name} wide className="fp-dialog" onClose={close}>
      <FirstPersonBay stationId={modal.station.id} vista={onSurface ? 'surface' : campaign.currentLevel === 1 ? 'pad' : 'space'} reduced={settings.reducedMotion} quality={settings.graphics || 'alto'} caption={campaign.message} />
      <StationMission station={modal.station} state={campaign} dispatch={dispatch} onClose={close} />
    </Modal>}
    {modal?.type === 'titus' && <Modal title="Titus" onClose={close}><TitusAssistant level={campaign.currentLevel} objective={task} station={near} emergency={emergency || solarAlert} discoveredFacts={campaign.discoveredFacts} onDiscover={id => dispatch({ type: 'discover', id })} /></Modal>}
    {modal?.type === 'log' && <Modal title="Bitácora científica" onClose={close}><ScienceLogbook discoveredFacts={campaign.discoveredFacts} /></Modal>}
    {modal?.type === 'crew' && <Modal title="La tripulación de Lunaria" wide onClose={close}><CrewGallery /></Modal>}
    {modal?.type === 'pause' && <Modal title="Pausa" onClose={() => { suspendAudio(); close(); }}><div className="source-content">
      <p>El movimiento y los minijuegos están detenidos. Los recursos no cambian mientras lees.</p>
      <button className="secondary-button" onClick={() => onSettings({ ...settings, soundEnabled: settings.soundEnabled === false })}>{settings.soundEnabled === false ? 'Activar sonido' : 'Silenciar'}</button>
      <p>Volumen guardado: {settings.volume} %. Cámbialo en Configuración del menú principal.</p>
      <button className="primary-button" onClick={leave}>Guardar y salir al menú</button>
    </div></Modal>}
  </div>;
}

